import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { ELECTION_CONFIG } from "../../../utils/electionConfig";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY
  ? process.env.ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;

function checkAdminAuth(request) {
  try {
    const encryptedToken = request.headers.get('x-admin-token');
    if (!encryptedToken || !PRIVATE_KEY) return false;

    const buffer = Buffer.from(encryptedToken, "base64");
    const decryptedData = crypto.privateDecrypt(
      {
        key: PRIVATE_KEY,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    );

    const decryptedString = decryptedData.toString("utf8");
    const [secret, timestamp] = decryptedString.split('|');
    const EXPECTED_SECRET = process.env.ADMIN_AUTH_SECRET || "fallback_secret";

    if (secret !== EXPECTED_SECRET) return false;
    if (Date.now() - parseInt(timestamp) > 3600000) return false;

    return true;
  } catch (error) {
    return false;
  }
}

export async function GET(request) {
  try {
    const now = Date.now();

    // ✅ Check Admin Auth (To bypass isHideScore)
    const isAdmin = checkAdminAuth(request);

    const { CAMPAIGN_START, ELECTION_START, ELECTION_END } = ELECTION_CONFIG;

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

    // ⚡️ NEW SYSTEM MODES LOGIC:
    const systemConfig = await db.systemConfig.findFirst({ where: { id: 1 } });
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
    const allCandidatesRaw = await db.candidate.findMany({
      include: {
        _count: {
          select: {
            voters: {
              where: { year: { in: validYears } }
            }
          }
        },
        members: true
      }
    });

    const allCandidates = allCandidatesRaw.map(c => ({
      ...c,
      score: c._count.voters
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

    // Sorting Logic
    if (status === "ENDED" || isShowResult || isAdmin) { // ✅ Auto sort by score if Admin
      finalCandidates.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        // If scores equal, put parties (number > 0) before 0 and -1
        const isPartyA = a.number > 0;
        const isPartyB = b.number > 0;
        if (isPartyA && !isPartyB) return -1;
        if (!isPartyA && isPartyB) return 1;
        return a.number - b.number;
      });
    } else {
      finalCandidates.sort((a, b) => {
        // Always put parties first, then sorted by number
        const isPartyA = a.number > 0;
        const isPartyB = b.number > 0;
        if (isPartyA && !isPartyB) return -1;
        if (!isPartyA && isPartyB) return 1;
        return a.number - b.number;
      });
    }

    const totalEligible = await db.user.count({ where: { year: { in: validYears } } });
    let totalVotesReal = await db.user.count({ where: { isVoted: true, year: { in: validYears } } });

    const majorStats = await db.user.groupBy({ by: ['major'], where: { isVoted: true, year: { in: validYears } }, _count: { major: true } });
    const yearStats = await db.user.groupBy({ by: ['year'], where: { isVoted: true, year: { in: validYears } }, _count: { year: true } });
    const genderStats = await db.user.groupBy({ by: ['gender'], where: { isVoted: true, year: { in: validYears } }, _count: { gender: true } });

    // 🛡️ SECURITY: HIDE SCORES IF NOT REVEALED (User Request: Ended but not revealed = Hide)
    // ✅ Exception: Admin always sees scores
    const isHideScore = !isAdmin && !isShowResult;

    if (isHideScore) {
      // Mask Data: Candidates & granular stats
      finalCandidates = finalCandidates.map(c => ({
        ...c,
        score: 0,
        _count: { voters: 0 }
      }));

      // Hide granular stats
      majorStats.forEach(s => s._count.major = 0);
      yearStats.forEach(s => s._count.year = 0);
      genderStats.forEach(s => s._count.gender = 0);

      // Mask Totals ONLY if not started yet
      if (status === "WAITING" || status === "PRE_CAMPAIGN") {
        totalVotesReal = 0;
      }
    }

    const showBreakdown = !isHideScore;

    return NextResponse.json({
      status: status,
      totalVotes: totalVotesReal,
      candidates: finalCandidates,
      campaignDate: CAMPAIGN_START,
      stats: {
        totalEligible: totalEligible, // Always show real eligible count
        byMajor: showBreakdown ? majorStats.map(i => ({ name: i.major, value: i._count.major })) : [],
        byYear: showBreakdown ? yearStats.map(i => ({ name: i.year, value: i._count.year })) : [],
        byGender: showBreakdown ? genderStats.map(i => ({ name: i.gender, value: i._count.gender })) : [],
      },
      isRevealed: !!isShowResult
    });

  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ error: "Auth Failed / Decryption Error" }, { status: 403 });
  }
}