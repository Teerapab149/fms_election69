import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { rateLimit } from "../../../lib/rateLimit";
import { encryptBallot } from "../../../lib/ballotCrypto";
import { appendBallotTx, hourBucketBangkok, hourFloor } from "../../../lib/ballotChain";
import { readElectionState } from "../../../lib/election/liveStatus";
import { voteRefusal } from "../../../lib/election/systemStatus.mjs";

// Interactive-transaction limits for the vote (M1, 2026-09-25).
//
// Prisma's defaults are maxWait 2s (to get a pooled connection) and timeout 5s
// (start → commit). Every vote serialises on the ChainHead row lock — on
// purpose, it is what keeps the ballot chain gap-free — so under a burst, every
// pooled connection is held by a transaction queued behind that lock and new
// votes wait for a connection. The load test (scripts/load/vote-load.mjs)
// measured ~100 committed votes/s; a 500-voter burst therefore needs ~5s to
// drain and the defaults turned the tail into P2028 → HTTP 500 (58 of 500).
//
// Raising both limits makes those requests queue instead of failing. It changes
// nothing about correctness: a transaction that does time out still rolls back
// whole (no isVoted without a ballot, no ballot without a score), and the voter
// can simply retry. Override per deployment without a rebuild if needed.
const VOTE_TX_OPTIONS = {
  maxWait: Number(process.env.VOTE_TX_MAX_WAIT_MS) || 15000,
  timeout: Number(process.env.VOTE_TX_TIMEOUT_MS) || 15000,
};

// Every refusal carries a stable `code` next to the Thai `error`. The vote page
// branches on the code (src/lib/election/voteOutcome.mjs), never on the Thai, so
// the wording can change without changing what the student is sent to do. The
// status codes are unchanged; the e2e suite asserts them.
function refuse(code, error, status, init = {}) {
  return NextResponse.json({ code, error }, { status, ...init });
}

// The Thai shown for each mode/schedule refusal (codes from voteRefusal).
const VOTE_REFUSAL_MESSAGES = {
  PAUSED: "ระบบหยุดรับลงคะแนนชั่วคราว",
  ENDED: "ปิดหีบแล้ว ไม่รับลงคะแนนเพิ่ม",
  NOT_STARTED: "ยังไม่ถึงเวลาเปิดหีบ",
  AUTO_CLOSED: "ปิดหีบแล้ว ไม่รับลงคะแนนเพิ่ม",
};

export async function POST(request) {
  try {
    // 🔐 Security Fix: ดึง studentId จาก verified session แทน request body
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) {
      return refuse("UNAUTHENTICATED", "กรุณาเข้าสู่ระบบก่อนลงคะแนน", 401);
    }

    const studentId = session.user.studentId; // ✅ จาก session ที่ verify แล้ว

    // Throttle vote spam per user (the atomic guard already enforces one-shot;
    // this just stops a client hammering the endpoint): 15 / min / studentId.
    // Dev-scale in-memory limiter — a real multi-instance deploy should move this
    // to shared middleware (Redis) keyed on user+IP.
    const rl = rateLimit(`vote:${studentId}`, { limit: 15, windowMs: 60 * 1000 });
    if (!rl.ok) {
      return refuse(
        "RATE_LIMITED",
        `ดำเนินการบ่อยเกินไป ลองใหม่ใน ${rl.retryAfter} วินาที`,
        429,
        { headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    // 🔒 FAIL CLOSED (v2-SEC): without the election public key + chain secret we
    // cannot produce an encrypted, chained ballot — so we refuse to vote rather
    // than EVER fall back to storing a plaintext choice. No DB write happens here.
    const publicKeyPem = process.env.ELECTION_BALLOT_PUBLIC_KEY;
    const chainSecret = process.env.BALLOT_CHAIN_SECRET;
    if (!publicKeyPem || !chainSecret) {
      console.error("[vote] FAIL CLOSED: missing ELECTION_BALLOT_PUBLIC_KEY / BALLOT_CHAIN_SECRET");
      return refuse(
        "NOT_READY",
        "ระบบลงคะแนนยังไม่พร้อม กุญแจเข้ารหัสบัตรยังไม่ถูกตั้งค่า กรุณาแจ้งผู้ดูแลระบบ",
        503
      );
    }

    // A body that is not JSON is the client's mistake, not ours: 400, not the
    // 500 the catch below would give it (which the page reads as "rolled back").
    let body;
    try {
      body = await request.json();
    } catch {
      return refuse("BAD_REQUEST", "ข้อมูลการลงคะแนนไม่ครบถ้วน", 400);
    }
    const candidateId = body?.candidateId;
    // หมายเหตุ: ไม่ใช้ studentId จาก body อีกต่อไป เพื่อป้องกันการโหวตแทนคนอื่น

    // 0. 🛑 SECURITY GATE:
    const systemConfig = await db.systemConfig.findFirst({ where: { id: 1 } });
    const now = Date.now();
    const { systemMode: mode, start, end } = readElectionState(systemConfig, now);

    // 0.0 Certified results are final. This sits above every mode check on
    // purpose: MANUAL_OPEN forces the box open regardless of the clock, so
    // without this a certified election could still take votes and push score
    // past the tally someone signed their name to.
    if (systemConfig?.globalConfig?.ballotsAnonymized) {
      return refuse("CERTIFIED", "ผลการเลือกตั้งได้รับการรับรองแล้ว ไม่รับลงคะแนนเพิ่ม", 403);
    }

    // 0.1 Mode + schedule (lib/election/systemStatus.mjs voteRefusal): PAUSE and
    // ENDED refuse, MANUAL_OPEN takes votes whatever the clock says, AUTO follows
    // the schedule. Same codes and messages as when this ladder lived here.
    const refusal = voteRefusal({ systemMode: mode, start, end, now });
    if (refusal) {
      return refuse(refusal, VOTE_REFUSAL_MESSAGES[refusal], 403);
    }

    // 1. ตรวจสอบข้อมูล
    const parsedId = parseInt(candidateId);
    if (candidateId === undefined || Number.isNaN(parsedId)) {
      return refuse("BAD_REQUEST", "ข้อมูลการลงคะแนนไม่ครบถ้วน", 400);
    }

    // 1.1 🛡️ Validate the choice against THIS ballot's rules (P0-3).
    //   number > 0  → real party (always selectable)
    //   number == 0 → งดออกเสียง / abstain (always selectable)
    //   number == -1 → ไม่รับรอง / disapprove — ONLY valid when exactly one real
    //                   party is running (single-party ballot)
    const allCandidates = await db.candidate.findMany({ select: { id: true, number: true } });
    const target = allCandidates.find((c) => c.id === parsedId);
    if (!target) {
      return refuse("BAD_CHOICE", "ไม่พบตัวเลือกที่เลือก", 400);
    }
    const realPartyCount = allCandidates.filter((c) => c.number > 0).length;
    const validChoice =
      target.number > 0 ||
      target.number === 0 ||
      (target.number === -1 && realPartyCount === 1);
    if (!validChoice) {
      return refuse("BAD_CHOICE", "ตัวเลือกไม่ถูกต้องสำหรับบัตรเลือกตั้งนี้", 400);
    }

    // 2. เช็คผู้ใช้ + สิทธิ์ (early checks ให้ข้อความที่เป็นมิตร; การกันโหวตซ้ำจริงอยู่ที่ atomic guard ด้านล่าง)
    const user = await db.user.findFirst({
      where: { studentId: studentId }
    });

    if (!user) {
      return refuse("USER_NOT_FOUND", "ไม่พบรายชื่อของบัญชีนี้ในระบบ กรุณาติดต่อผู้ดูแลระบบ", 404);
    }

    // 🛑 Eligibility Check: Must be Year 1-4
    const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
    if (!validYears.includes(user.year)) {
      return refuse("INELIGIBLE", "เฉพาะนักศึกษาชั้นปีที่ 1-4 เท่านั้นที่มีสิทธิ์ลงคะแนน", 403);
    }

    if (user.isVoted) {
      return refuse("ALREADY_VOTED", "คุณใช้สิทธิ์เลือกตั้งไปแล้ว", 403);
    }

    // Encrypt the choice + compute the coarse bucket OUTSIDE the transaction so
    // the chain row-lock (below) is held for the shortest possible time. Payload
    // depends only on the choice + a fresh nonce — never on chain state.
    const castAt = Date.now();
    const payload = encryptBallot(parsedId, publicKeyPem);
    const hourBucket = hourBucketBangkok(castAt);
    // votedAt is stored floored to the hour, never the exact instant: with the
    // exact time, ORDER BY votedAt reproduced Ballot.seq (cast order) and so
    // paired every voter with their ballot (H3, measured 4 of 4).
    const votedAt = hourFloor(castAt);

    // 3. 🔒 Atomic vote — combines THREE integrity guarantees in ONE transaction:
    //   (a) TOCTOU one-shot (P0-2): updateMany with isVoted:false is a
    //       compare-and-set — only ONE concurrent request flips the flag
    //       (count===1); the loser (count===0) is rejected, so the ballot box +
    //       score can never be touched twice by the same voter.
    //   (b) Ballot-chain serialization (v2-SEC): the `SELECT ... FOR UPDATE` on
    //       ChainHead(id=1) takes a Postgres ROW LOCK. Two simultaneous votes
    //       block on it and commit one-after-another, so every ballot gets the
    //       real previous rowHash as its prevHash → the chain is gap-free and
    //       verifiable even under a dead heat (proved by the concurrency test).
    //   (c) Tally (unchanged): the atomic Candidate.score increment.
    const outcome = await db.$transaction(async (tx) => {
      // (a) claim the one-shot right to vote + stamp the voter's own time
      const claim = await tx.user.updateMany({
        where: { id: user.id, isVoted: false },
        data: { isVoted: true, votedAt },
      });
      if (claim.count === 0) return "ALREADY_VOTED";

      // (b) append the encrypted ballot to the chain — the shared helper takes
      //     the ChainHead FOR UPDATE row lock that serializes concurrent votes.
      await appendBallotTx(tx, { payload, hourBucket, chainSecret });

      // (c) tally — the single source of truth the results API serves
      await tx.candidate.update({
        where: { id: parsedId },
        data: { score: { increment: 1 } },
      });
      return "OK";
    }, VOTE_TX_OPTIONS);

    if (outcome === "ALREADY_VOTED") {
      return refuse("ALREADY_VOTED", "คุณใช้สิทธิ์เลือกตั้งไปแล้ว", 403);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Vote Error:", error);
    // Only this handler's own catch may say "not recorded": a thrown transaction
    // rolls back whole (see VOTE_TX_OPTIONS). A proxy's 502/504 carries no code,
    // so the page re-checks instead of repeating this sentence.
    return refuse("SERVER", "บันทึกคะแนนไม่สำเร็จ คะแนนของคุณยังไม่ถูกบันทึก ลองกดยืนยันอีกครั้งได้", 500);
  }
}
