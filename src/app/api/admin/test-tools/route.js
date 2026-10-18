import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { adminGuard } from "../../../../lib/auth/adminCheck";
import { bustSiteData } from "../../../../lib/cache/siteData";
import { bustResultsSnap } from "../../../../lib/election/resultsCache.mjs";
import { syncCandidateSpecialOptions } from "../../../../lib/candidates/specialOptions.mjs";
import {
  isTestToolsEnabled,
  isPermissionError,
  nextFreePartyNumbers,
  buildSampleParty,
  buildSampleVoters,
  TEST_VOTER_PREFIX,
} from "../../../../utils/testTools.mjs";

export const dynamic = "force-dynamic";

// Test tools: seed sample data, clear ballots, clear parties. They can wipe an
// election, so they answer only when the SERVER environment sets
// ADMIN_TEST_TOOLS=1 (never a NEXT_PUBLIC_ variable). Order of checks, always:
//   1. adminGuard (no cookie or no admin flag: 401/403, like every admin route)
//   2. the env switch (off: 404 { error: "Not found" }, as if the route did not exist)
//   3. the action
// CLEAR_BALLOTS mirrors the first half of scripts/sql/annual-reset.sql step for
// step. On production the web DB account cannot delete ballots by design
// (scripts/sql/ballot-grants.sql); that refusal is reported in Thai, not as a 500.

const VALID_YEARS = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];

class ToolError extends Error {
  constructor(message, status = 409) { super(message); this.status = status; }
}

async function readStatus() {
  const [ballots, parties, members, eligible, testVoters, cfg] = await Promise.all([
    db.ballot.count(),
    db.candidate.count({ where: { number: { gt: 0 } } }),
    db.member.count({ where: { candidate: { number: { gt: 0 } } } }),
    db.user.count({ where: { year: { in: VALID_YEARS } } }),
    db.user.count({ where: { studentId: { startsWith: TEST_VOTER_PREFIX } } }),
    db.systemConfig.findFirst({ select: { globalConfig: true } }),
  ]);
  return {
    enabled: true,
    ballots,
    parties,
    members,
    eligible,
    testVoters,
    certified: !!cfg?.globalConfig?.ballotsAnonymized,
    testVoterPrefix: TEST_VOTER_PREFIX,
  };
}

// no ballots in the box and not certified: the only time parties and test
// voters may be added or removed (ballots are ciphertext of candidate ids)
async function requireOpenBox(tx) {
  const ballots = await tx.ballot.count();
  if (ballots > 0) throw new ToolError(`มีบัตรในหีบ ${ballots} ใบ ต้องล้างบัตรก่อน`);
  const cfg = await tx.systemConfig.findFirst({ select: { globalConfig: true } });
  if (cfg?.globalConfig?.ballotsAnonymized) throw new ToolError("ผลถูกรับรองแล้ว ต้องล้างบัตรก่อน (การล้างบัตรจะปลดการรับรองให้)");
}

export async function GET(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;
  if (!isTestToolsEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    return NextResponse.json(await readStatus());
  } catch (e) {
    console.error("test-tools status failed:", e);
    return NextResponse.json({ error: "อ่านสถานะไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;
  if (!isTestToolsEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body = {};
  try { body = await request.json(); } catch { /* handled as an unknown action */ }

  try {
    let message;
    switch (body.action) {
      case "CLEAR_BALLOTS": {
        // same steps, same order as scripts/sql/annual-reset.sql (the part before COMMIT)
        await db.$transaction(async (tx) => {
          await tx.$executeRaw`DELETE FROM "Ballot"`;
          await tx.$executeRawUnsafe(`ALTER SEQUENCE "Ballot_seq_seq" RESTART WITH 1`);
          await tx.$executeRaw`UPDATE "ChainHead" SET head = 'GENESIS', seq = 0 WHERE id = 1`;
          await tx.$executeRaw`UPDATE "User" SET "isVoted" = false, "votedAt" = NULL WHERE year IN ('ปี 1', 'ปี 2', 'ปี 3', 'ปี 4')`;
          await tx.$executeRaw`UPDATE "Candidate" SET score = 0`;
          await tx.$executeRaw`UPDATE "SystemConfig"
            SET "globalConfig" = jsonb_set(
                  COALESCE("globalConfig", '{}')::jsonb - 'certifiedAt' - 'certifiedBy' - 'certifiedByUsername',
                  '{ballotsAnonymized}', 'false'::jsonb, true),
                "showResult" = false,
                "systemMode" = 'AUTO'
            WHERE id = 1`;
        });
        message = "ล้างบัตรเรียบร้อย คะแนนทุกพรรคเป็นศูนย์ ทุกคนโหวตใหม่ได้ ปลดการรับรองผล ซ่อนผล และตั้งโหมดเป็น AUTO แล้ว";
        break;
      }

      case "SEED_SAMPLE": {
        const count = Number(body.parties);
        if (count !== 1 && count !== 2) throw new ToolError("จำนวนพรรคตัวอย่างต้องเป็น 1 หรือ 2", 400);
        const result = await db.$transaction(async (tx) => {
          await requireOpenBox(tx);
          const existing = await tx.candidate.findMany({ select: { number: true } });
          const numbers = nextFreePartyNumbers(existing.map((c) => c.number).filter((n) => n > 0), count);
          for (let i = 0; i < numbers.length; i += 1) {
            const { members, ...party } = buildSampleParty(numbers[i], i);
            await tx.candidate.create({ data: { ...party, members: { create: members } } });
          }
          await syncCandidateSpecialOptions(tx);
          const voters = await tx.user.createMany({ data: buildSampleVoters(24), skipDuplicates: true });
          return { numbers, voters: voters.count };
        });
        message = `เพิ่มพรรคตัวอย่างเบอร์ ${result.numbers.join(", ")} พร้อมสมาชิก และนักศึกษาทดสอบ ${result.voters} คนแล้ว`;
        break;
      }

      case "CLEAR_PARTIES": {
        await db.$transaction(async (tx) => {
          await requireOpenBox(tx);
          await tx.member.deleteMany({ where: { candidate: { number: { gt: 0 } } } });
          await tx.candidate.deleteMany({ where: { number: { gt: 0 } } });
          await syncCandidateSpecialOptions(tx);
        });
        message = "ล้างพรรคและสมาชิกทุกพรรคแล้ว (ไฟล์รูปที่อัปโหลดยังอยู่บนดิสก์ ไม่ได้ถูกลบ)";
        break;
      }

      case "CLEAR_TEST_VOTERS": {
        const removed = await db.$transaction(async (tx) => {
          await requireOpenBox(tx);
          // only the test prefix: never a real student, an admin or a staff account
          const r = await tx.user.deleteMany({
            where: { studentId: { startsWith: TEST_VOTER_PREFIX }, isAdmin: false, role: "student" },
          });
          return r.count;
        });
        message = `ลบนักศึกษาทดสอบ ${removed} คนแล้ว`;
        break;
      }

      default:
        return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
    }

    bustSiteData();
    bustResultsSnap();
    return NextResponse.json({ ok: true, message, status: await readStatus() });
  } catch (e) {
    if (e instanceof ToolError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (isPermissionError(e)) {
      return NextResponse.json(
        { error: "บัญชีฐานข้อมูลของเครื่องนี้ไม่อนุญาตให้ล้างบัตร (ตั้งไว้แบบนี้โดยตั้งใจเพื่อป้องกันผลเลือกตั้ง) เครื่องมือนี้ใช้ได้เฉพาะเครื่องทดสอบที่ใช้บัญชีฐานข้อมูลเต็มสิทธิ์" },
        { status: 403 }
      );
    }
    console.error("test-tools action failed:", e);
    return NextResponse.json({ error: "ดำเนินการไม่สำเร็จ ดูรายละเอียดใน log ของเซิร์ฟเวอร์" }, { status: 500 });
  }
}
