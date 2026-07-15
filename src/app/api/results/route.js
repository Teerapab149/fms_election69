import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { resolveElectionDates } from "../../../utils/electionConfig";
import { requireAdmin } from "../../../lib/auth/adminCheck";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const now = Date.now();

    // ✅ Admin sees live scores (bypasses isHideScore); everyone else gets masked
    // data until showResult. Verified via NextAuth session OR admin_token JWT cookie.
    const isAdmin = (await requireAdmin(request)).ok;

    const systemConfig = await db.systemConfig.findFirst({ where: { id: 1 } });
    const { CAMPAIGN_START, ELECTION_START, ELECTION_END } = resolveElectionDates(systemConfig?.globalConfig);

    let status = "WAITING";
    let isPreCampaign = false;

    if (now >= ELECTION_END) {
      status = "ENDED";
    } else if (now >= ELECTION_START) {
      status = "ONGOING";
    } else if (now >= CAMPAIGN_START) {
      status = "WAITING";
    } else {
      status = "PRE_CAMPAIGN";
      isPreCampaign = true;
    }

    // ⚡️ NEW SYSTEM MODES LOGIC: (systemConfig already fetched above for dates)
    const mode = systemConfig?.systemMode || "AUTO";
    const isShowResult = systemConfig?.showResult;

    if (mode === "PAUSE") {
      status = "CLOSED";
    } else if (mode === "ENDED") {
      status = "ENDED";
    } else if (mode === "MANUAL_OPEN") {
      status = "ONGOING";
    } else if (mode === "AUTO") {
      // Keep time-based status calculated at the top
    }

    // 🔵 Show Result Mode Override (Unless strictly CLOSED)
    if (isShowResult && status !== "CLOSED") {
      if (status !== "ENDED") {
        status = "ONGOING";
      }
    }

    if (status === "ONGOING" || status === "ENDED") {
      isPreCampaign = false;
    }

    const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
    // Per-party tally = Candidate.score, the single source of truth (P2,
    // 2026-06-12). The vote API maintains it atomically with each ballot append
    // (P0-2 + v2-SEC), and RESET_VOTES zeroes it. Under v2-SEC ballots are
    // anonymous + encrypted, so results NEVER reads a per-voter link — score is
    // the frozen record by construction. scripts/reconcile-scores.js audits
    // score against the (chained) ballot box; run it before revealing results
    // (runbook §5.1). Counting ballots live here (the old `_count.voters` with a
    // year filter) silently DROPPED legitimate votes whenever a voter's `year`
    // changed after casting (e.g. the yearly student import) — score counts what
    // was cast.
    const allCandidatesRaw = await db.candidate.findMany({
      include: { members: true }
    });
    const allCandidates = allCandidatesRaw.map(c => ({
      ...c,
      score: c.score || 0
    }));

    const realCandidates = allCandidates.filter(c => c.number > 0);
    const noVoteOption = allCandidates.find(c => c.number === 0);
    const disapproveOption = allCandidates.find(c => c.number === -1);

    let finalCandidates = [];

    if (realCandidates.length === 1) {
      finalCandidates = [...realCandidates];
      if (disapproveOption) finalCandidates.push(disapproveOption);
      if (noVoteOption) finalCandidates.push(noVoteOption);
    } else {
      finalCandidates = [...realCandidates];
      if (noVoteOption) finalCandidates.push(noVoteOption);
    }

    // Sorting Logic — sort by score ONLY when results are officially revealed
    // (or the election ended). Admin is NOT given a score-sorted list: the ORDER
    // itself would leak who's leading during voting (ballot-secrecy policy 2026-06-10).
    if (status === "ENDED" || isShowResult) {
      finalCandidates.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        const isPartyA = a.number > 0;
        const isPartyB = b.number > 0;
        if (isPartyA && !isPartyB) return -1;
        if (!isPartyA && isPartyB) return 1;
        return a.number - b.number;
      });
    } else {
      finalCandidates.sort((a, b) => {
        const isPartyA = a.number > 0;
        const isPartyB = b.number > 0;
        if (isPartyA && !isPartyB) return -1;
        if (!isPartyA && isPartyB) return 1;
        return a.number - b.number;
      });
    }

    const totalEligible = await db.user.count({ where: { year: { in: validYears } } });
    let totalVotesReal = await db.user.count({ where: { isVoted: true, year: { in: validYears } } });

    // Participation by group (VOTED) + the denominator (ELIGIBLE) so the admin
    // turnout view can show "ปี 3 บัญชี: 12/40 (30%)" and chase the low ones.
    const cAll = { _count: { _all: true } };
    const votedWhere = { isVoted: true, year: { in: validYears } };
    const eligWhere = { year: { in: validYears } };
    // orderBy pins the row order — Postgres groupBy without it is
    // nondeterministic, which shuffled the demographics arrays between requests.
    const [majorVoted, yearVoted, genderVoted, majorElig, yearElig, genderElig] = await Promise.all([
      db.user.groupBy({ by: ['major'],  where: votedWhere, ...cAll, orderBy: { major: 'asc' } }),
      db.user.groupBy({ by: ['year'],   where: votedWhere, ...cAll, orderBy: { year: 'asc' } }),
      db.user.groupBy({ by: ['gender'], where: votedWhere, ...cAll, orderBy: { gender: 'asc' } }),
      db.user.groupBy({ by: ['major'],  where: eligWhere,  ...cAll, orderBy: { major: 'asc' } }),
      db.user.groupBy({ by: ['year'],   where: eligWhere,  ...cAll, orderBy: { year: 'asc' } }),
      db.user.groupBy({ by: ['gender'], where: eligWhere,  ...cAll, orderBy: { gender: 'asc' } }),
    ]);

    // ── Visibility policy (ballot secrecy, 2026-06-10) ──────────────────────
    // PER-PARTY TALLY: hidden for EVERYONE (incl. admin) until showResult — so
    //   nobody sees who's leading mid-vote (bias / leak risk). No admin bypass.
    // TURNOUT BY GROUP: admin sees it live (chase low-turnout years/majors);
    //   the public sees it only once results are revealed. (Public behaviour
    //   unchanged — it was already gated on isShowResult.)
    const hideTally = !isShowResult;
    const showBreakdown = isAdmin || isShowResult;
    const started = !(status === "WAITING" || status === "PRE_CAMPAIGN");

    if (hideTally) {
      finalCandidates = finalCandidates.map(c => ({ ...c, score: 0 }));
    }
    if (!started) {
      totalVotesReal = 0; // before polls open, even the running total is hidden
    }

    // Build each breakdown from the ELIGIBLE groups so 0%-turnout groups still
    // appear (those are exactly the ones the committee needs to chase).
    const countBy = (rows, key) => Object.fromEntries(rows.map(r => [r[key] ?? '—', r._count._all]));
    const mkGroup = (votedRows, eligRows, key) => {
      const voted = countBy(votedRows, key);
      return eligRows
        .filter(r => r[key] != null && String(r[key]).trim() !== '')
        .map(r => ({ name: r[key], value: voted[r[key]] ?? 0, eligible: r._count._all }));
    };

    return NextResponse.json({
      status: status,
      totalVotes: totalVotesReal,
      candidates: finalCandidates,
      campaignDate: CAMPAIGN_START,
      stats: {
        totalEligible: totalEligible,
        byMajor:  (showBreakdown && started) ? mkGroup(majorVoted,  majorElig,  'major')  : [],
        byYear:   (showBreakdown && started) ? mkGroup(yearVoted,   yearElig,   'year')   : [],
        byGender: (showBreakdown && started) ? mkGroup(genderVoted, genderElig, 'gender') : [],
      },
      isRevealed: !!isShowResult
    });

  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ error: "Auth Failed / Decryption Error" }, { status: 403 });
  }
}