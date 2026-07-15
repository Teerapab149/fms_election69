import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { rateLimit } from "../../../lib/rateLimit";
import { encryptBallot } from "../../../lib/ballotCrypto";
import { appendBallotTx, hourBucketBangkok } from "../../../lib/ballotChain";

export async function POST(request) {
  try {
    // 🔐 Security Fix: ดึง studentId จาก verified session แทน request body
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนลงคะแนน" }, { status: 401 });
    }

    const studentId = session.user.studentId; // ✅ จาก session ที่ verify แล้ว

    // Throttle vote spam per user (the atomic guard already enforces one-shot;
    // this just stops a client hammering the endpoint): 15 / min / studentId.
    // Dev-scale in-memory limiter — a real multi-instance deploy should move this
    // to shared middleware (Redis) keyed on user+IP.
    const rl = rateLimit(`vote:${studentId}`, { limit: 15, windowMs: 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: `ดำเนินการบ่อยเกินไป ลองใหม่ใน ${rl.retryAfter} วินาที` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    // 🔒 FAIL CLOSED (v2-SEC): without the election public key + chain secret we
    // cannot produce an encrypted, chained ballot — so we refuse to vote rather
    // than EVER fall back to storing a plaintext choice. No DB write happens here.
    const publicKeyPem = process.env.ELECTION_BALLOT_PUBLIC_KEY;
    const chainSecret = process.env.BALLOT_CHAIN_SECRET;
    if (!publicKeyPem || !chainSecret) {
      console.error("[vote] FAIL CLOSED: missing ELECTION_BALLOT_PUBLIC_KEY / BALLOT_CHAIN_SECRET");
      return NextResponse.json(
        { error: "ระบบลงคะแนนยังไม่พร้อม (กุญแจเข้ารหัสบัตรไม่ถูกตั้งค่า) กรุณาแจ้งผู้ดูแลระบบ" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { candidateId } = body;
    // หมายเหตุ: ไม่ใช้ studentId จาก body อีกต่อไป เพื่อป้องกันการโหวตแทนคนอื่น

    // 0. 🛑 SECURITY GATE:
    const systemConfig = await db.systemConfig.findFirst({ where: { id: 1 } });
    const mode = systemConfig?.systemMode || "AUTO";
    const { resolveElectionDates } = await import("../../../utils/electionConfig");
    const { ELECTION_END, ELECTION_START } = resolveElectionDates(systemConfig?.globalConfig);
    const now = Date.now();

    // 0.1 Check Manual Modes First
    if (mode === "PAUSE") {
      return NextResponse.json({ error: "ระบบปิดปรับปรุงชั่วคราว (System Maintenance)" }, { status: 403 });
    }

    if (mode === "ENDED") {
      return NextResponse.json({ error: "สิ้นสุดการลงคะแนนเเล้ว (Election Ended)" }, { status: 403 });
    }

    if (mode === "MANUAL_OPEN") {
      // Pass: Voting is forced open, ignore time check
    }

    // 0.2 Check Auto Mode (Scheduled Time)
    if (mode === "AUTO") {
      if (now < ELECTION_START) {
        return NextResponse.json({ error: "ยังไม่ถึงเวลาลงคะแนน (Not Started)" }, { status: 403 });
      }
      if (now >= ELECTION_END) {
        return NextResponse.json({ error: "หมดเวลาลงคะแนนเเล้ว (Auto Closed)" }, { status: 403 });
      }
    }

    // 1. ตรวจสอบข้อมูล
    const parsedId = parseInt(candidateId);
    if (candidateId === undefined || Number.isNaN(parsedId)) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // 1.1 🛡️ Validate the choice against THIS ballot's rules (P0-3).
    //   number > 0  → real party (always selectable)
    //   number == 0 → งดออกเสียง / abstain (always selectable)
    //   number == -1 → ไม่รับรอง / disapprove — ONLY valid when exactly one real
    //                   party is running (single-party ballot)
    const allCandidates = await db.candidate.findMany({ select: { id: true, number: true } });
    const target = allCandidates.find((c) => c.id === parsedId);
    if (!target) {
      return NextResponse.json({ error: "ไม่พบตัวเลือกที่เลือก" }, { status: 400 });
    }
    const realPartyCount = allCandidates.filter((c) => c.number > 0).length;
    const validChoice =
      target.number > 0 ||
      target.number === 0 ||
      (target.number === -1 && realPartyCount === 1);
    if (!validChoice) {
      return NextResponse.json({ error: "ตัวเลือกไม่ถูกต้องสำหรับบัตรเลือกตั้งนี้" }, { status: 400 });
    }

    // 2. เช็คผู้ใช้ + สิทธิ์ (early checks ให้ข้อความที่เป็นมิตร; การกันโหวตซ้ำจริงอยู่ที่ atomic guard ด้านล่าง)
    const user = await db.user.findFirst({
      where: { studentId: studentId }
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
    }

    // 🛑 Eligibility Check: Must be Year 1-4
    const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
    if (!validYears.includes(user.year)) {
      return NextResponse.json({ error: "เฉพาะนักศึกษาชั้นปีที่ 1-4 เท่านั้นที่มีสิทธิ์ลงคะแนน" }, { status: 403 });
    }

    if (user.isVoted) {
      return NextResponse.json({ error: "คุณใช้สิทธิ์เลือกตั้งไปแล้ว" }, { status: 403 });
    }

    // Encrypt the choice + compute the coarse bucket OUTSIDE the transaction so
    // the chain row-lock (below) is held for the shortest possible time. Payload
    // depends only on the choice + a fresh nonce — never on chain state.
    const votedAt = new Date();
    const payload = encryptBallot(parsedId, publicKeyPem);
    const hourBucket = hourBucketBangkok(votedAt.getTime());

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
    });

    if (outcome === "ALREADY_VOTED") {
      return NextResponse.json({ error: "คุณใช้สิทธิ์เลือกตั้งไปแล้ว" }, { status: 403 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Vote Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกคะแนน" }, { status: 500 });
  }
}
