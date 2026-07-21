import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { adminGuard } from "../../../../lib/auth/adminCheck";
import {
  resolveElectionDates,
  parseBangkok,
  formatThaiDate,
  formatThaiTime,
} from "../../../../utils/electionConfig";
import { isBuiltInSlug } from "../../../../components/admin/editor/templates";

/**
 * GET /api/admin/readiness — ADM-1 election readiness check (read-only).
 *
 * ปุ่มเดียวที่กรรมการกดก่อนวันเลือกตั้งจริงเพื่อดูทุกอย่างที่ยังไม่พร้อม. ตรวจ
 * schedule / candidates / voters / tally / config / env แล้วสรุปเป็น pass/warn/fail.
 *
 * READ-ONLY ล้วน — ไม่มี prisma write ใดๆ. ไม่เขียน audit-log ด้วย เพราะ dashboard
 * route log เฉพาะ mutation (POST) — GET readiness ไม่ mutate อะไร.
 *
 * ทุก check กัน exception รายข้อ: ข้อใด throw → กลายเป็น fail "ตรวจไม่ได้" ไม่ล้ม
 * ทั้ง endpoint.
 */
export async function GET(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;

  const checks = [];
  const now = Date.now();

  // helper: รัน check ห่อ try/catch — throw = fail "ตรวจไม่ได้"
  async function run(id, group, title, fn) {
    try {
      const r = await fn();
      checks.push({ id, group, level: r.level, title, detail: r.detail });
    } catch (e) {
      checks.push({
        id,
        group,
        level: "fail",
        title,
        detail: `ตรวจไม่ได้ — ${e?.message || "เกิดข้อผิดพลาด"}`,
      });
    }
  }

  // โหลด state กลางที่หลาย check ใช้ร่วมกัน (แยก try กันล้ม)
  let cfg = null;
  try {
    cfg = await db.systemConfig.findFirst();
  } catch (e) {
    cfg = null;
  }
  const gc = cfg?.globalConfig || {};
  const systemMode = cfg?.systemMode || "AUTO";
  const dates = resolveElectionDates(gc);
  const { CAMPAIGN_START, ELECTION_START, ELECTION_END } = dates;

  const whenText = (d) => `${formatThaiDate(d)} เวลา ${formatThaiTime(d)}`;

  // 1) schedule.order — END ต้องหลัง START
  await run("schedule.order", "schedule", "ลำดับเวลาเปิด-ปิดหีบ", async () => {
    if (ELECTION_END <= ELECTION_START) {
      return {
        level: "fail",
        detail: `เวลาปิดหีบ (${whenText(ELECTION_END)}) มาก่อนหรือเท่ากับเวลาเปิดหีบ (${whenText(ELECTION_START)}) — ระบบจะไม่เปิดตามที่ตั้งใจ ต้องแก้ที่แท็บตั้งค่าทั่วไป`,
      };
    }
    return {
      level: "pass",
      detail: `เปิดหีบ ${whenText(ELECTION_START)} → ปิดหีบ ${whenText(ELECTION_END)}`,
    };
  });

  // 2) schedule.campaign — เปิดตัวผู้สมัครควรมาก่อนเปิดหีบ
  await run("schedule.campaign", "schedule", "เวลาเปิดตัวผู้สมัคร", async () => {
    if (CAMPAIGN_START > ELECTION_START) {
      return {
        level: "warn",
        detail: `เวลาเปิดตัวผู้สมัคร (${whenText(CAMPAIGN_START)}) อยู่หลังเวลาเปิดหีบ (${whenText(ELECTION_START)}) — ผู้มีสิทธิ์อาจยังไม่เห็นผู้สมัครตอนเริ่มลงคะแนน`,
      };
    }
    return {
      level: "pass",
      detail: `เปิดตัวผู้สมัคร ${whenText(CAMPAIGN_START)} ก่อนเปิดหีบตามลำดับที่ถูกต้อง`,
    };
  });

  // 3) schedule.source — globalConfig ตั้งครบ 3 field หรือ fallback code default
  await run("schedule.source", "schedule", "แหล่งที่มาของเวลาเลือกตั้ง", async () => {
    const fields = [
      { key: "campaignStartAt", label: "เปิดตัวผู้สมัคร" },
      { key: "electionStartAt", label: "เปิดหีบ" },
      { key: "electionEndAt", label: "ปิดหีบ" },
    ];
    const missing = fields.filter((f) => parseBangkok(gc[f.key]) === null);
    if (missing.length === 0) {
      return { level: "pass", detail: "ตั้งเวลาทั้ง 3 ช่วงไว้ในระบบ (globalConfig) ครบถ้วน" };
    }
    return {
      level: "warn",
      detail: `ยังไม่ได้ตั้ง/ค่าไม่ถูกต้อง ${missing.length} ช่อง (${missing
        .map((m) => m.label)
        .join(", ")}) — ระบบจะใช้ค่าเริ่มต้นในโค้ดแทน แนะนำให้ตั้งที่แท็บตั้งค่าทั่วไป`,
    };
  });

  // 4) schedule.past — ELECTION_END อดีต + AUTO / ELECTION_START อนาคต
  await run("schedule.past", "schedule", "ความสอดคล้องของเวลากับปัจจุบัน", async () => {
    if (ELECTION_END.getTime() < now && systemMode === "AUTO") {
      return {
        level: "warn",
        detail: `เวลาปิดหีบ (${whenText(ELECTION_END)}) ผ่านไปแล้วและโหมดเป็น AUTO — ระบบจะแสดงสถานะปิดทันทีที่เปิดหน้าเว็บ`,
      };
    }
    if (ELECTION_START.getTime() > now) {
      return {
        level: "pass",
        detail: `ระบบจะเปิดให้ลงคะแนน ${whenText(ELECTION_START)}`,
      };
    }
    return {
      level: "pass",
      detail: `อยู่ในช่วงเวลาเลือกตั้ง (เปิดหีบ ${whenText(ELECTION_START)} ถึง ${whenText(ELECTION_END)})`,
    };
  });

  // 5) mode.coherence — โหมดปัจจุบันสมเหตุผลกับเวลา
  await run("mode.coherence", "schedule", "โหมดการทำงานของระบบ", async () => {
    if (systemMode === "MANUAL_OPEN") {
      if (ELECTION_END.getTime() < now) {
        return {
          level: "warn",
          detail: `โหมด MANUAL_OPEN (บังคับเปิด) ทั้งที่เลยเวลาปิดหีบ (${whenText(ELECTION_END)}) ไปแล้ว — ตรวจสอบว่ายังต้องการเปิดรับคะแนนอยู่หรือไม่`,
        };
      }
      return { level: "pass", detail: "โหมด MANUAL_OPEN (บังคับเปิดรับคะแนน)" };
    }
    if (systemMode === "PAUSE") {
      return {
        level: "warn",
        detail: "โหมด PAUSE (ระงับชั่วคราว) กำลังทำงานอยู่ — ผู้มีสิทธิ์จะลงคะแนนไม่ได้จนกว่าจะเปลี่ยนโหมด",
      };
    }
    if (systemMode === "ENDED") {
      return { level: "pass", detail: "โหมด ENDED — ปิดการเลือกตั้งอย่างเป็นทางการแล้ว" };
    }
    return { level: "pass", detail: "โหมด AUTO — ระบบตัดสินเปิด/ปิดตามเวลาที่ตั้งไว้" };
  });

  // 6) candidates.exist — มีพรรคจริง (number>0) อย่างน้อย 1
  const candidates = await (async () => {
    try {
      return await db.candidate.findMany({
        include: { _count: { select: { members: true } } },
        orderBy: { number: "asc" },
      });
    } catch (e) {
      return null;
    }
  })();

  await run("candidates.exist", "candidates", "จำนวนพรรคผู้สมัคร", async () => {
    if (!candidates) throw new Error("อ่านข้อมูลพรรคไม่ได้");
    const real = candidates.filter((c) => c.number > 0);
    if (real.length === 0) {
      return { level: "fail", detail: "ยังไม่มีพรรคผู้สมัคร (เบอร์มากกว่า 0) ในระบบ — เพิ่มพรรคก่อนเปิดเลือกตั้ง" };
    }
    return { level: "pass", detail: `มีพรรคผู้สมัคร ${real.length} พรรค` };
  });

  // 7) candidates.single — พรรคจริง=1 ต้องมีตัวเลือกไม่รับรอง(-1) + งดออกเสียง(0)
  await run("candidates.single", "candidates", "ตัวเลือกกรณีพรรคเดียว", async () => {
    if (!candidates) throw new Error("อ่านข้อมูลพรรคไม่ได้");
    const real = candidates.filter((c) => c.number > 0);
    if (real.length !== 1) {
      return {
        level: "pass",
        detail: `มีพรรคจริง ${real.length} พรรค (ไม่เข้าเงื่อนไขพรรคเดียว — ไม่ต้องมีตัวเลือกไม่รับรอง)`,
      };
    }
    const hasDisapprove = candidates.some((c) => c.number === -1);
    const hasAbstain = candidates.some((c) => c.number === 0);
    if (!hasDisapprove) {
      return {
        level: "fail",
        detail: "มีพรรคจริงเพียงพรรคเดียวแต่ไม่มีตัวเลือก ไม่รับรอง (เบอร์ -1) — ผิดกติกาการเลือกตั้งพรรคเดียว ต้องเพิ่มก่อนเปิดหีบ",
      };
    }
    if (!hasAbstain) {
      return {
        level: "warn",
        detail: "มีตัวเลือกไม่รับรองแล้ว แต่ยังไม่มีตัวเลือก งดออกเสียง (เบอร์ 0)",
      };
    }
    return { level: "pass", detail: "พรรคเดียว + มีตัวเลือกไม่รับรอง (-1) และงดออกเสียง (0) ครบ" };
  });

  // 8) candidates.content — พรรคจริงมี members>=1 + logoUrl (รวมเป็นข้อเดียว)
  await run("candidates.content", "candidates", "ความครบถ้วนของข้อมูลพรรค", async () => {
    if (!candidates) throw new Error("อ่านข้อมูลพรรคไม่ได้");
    const real = candidates.filter((c) => c.number > 0);
    if (real.length === 0) {
      return { level: "warn", detail: "ยังไม่มีพรรคจริงให้ตรวจเนื้อหา" };
    }
    const issues = [];
    for (const c of real) {
      const problems = [];
      if ((c._count?.members || 0) < 1) problems.push("ไม่มีสมาชิก");
      if (!c.logoUrl) problems.push("ไม่มีโลโก้");
      if (problems.length) issues.push(`เบอร์ ${c.number} ${c.name} (${problems.join(", ")})`);
    }
    if (issues.length === 0) {
      return { level: "pass", detail: `ทุกพรรค (${real.length}) มีสมาชิกและโลโก้ครบ` };
    }
    return { level: "warn", detail: `พรรคที่ข้อมูลยังไม่ครบ — ${issues.join(" · ")}` };
  });

  // 9) voters — จำนวนผู้มีสิทธิ์ (ปี 1-4) > 0
  const validYears = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];
  await run("voters", "voters", "รายชื่อผู้มีสิทธิ์เลือกตั้ง", async () => {
    const count = await db.user.count({ where: { year: { in: validYears } } });
    if (count === 0) {
      return { level: "fail", detail: "ยังไม่มีผู้มีสิทธิ์เลือกตั้ง (นักศึกษาปี 1-4) ในระบบ — นำเข้ารายชื่อก่อนเปิดหีบ" };
    }
    return { level: "pass", detail: `มีผู้มีสิทธิ์เลือกตั้ง ${count.toLocaleString("th-TH")} คน` };
  });

  // 10) tally.integrity — sum(score) == count(Ballot) == count(User isVoted=true)
  await run("tally.integrity", "tally", "ความสอดคล้องของคะแนน", async () => {
    const agg = await db.candidate.aggregate({ _sum: { score: true } });
    const scoreSum = agg._sum.score || 0;
    const ballotCount = await db.ballot.count();
    const votedCount = await db.user.count({
      where: { isVoted: true, year: { in: validYears } },
    });
    const allEqual = scoreSum === ballotCount && ballotCount === votedCount;
    const detail = `คะแนนรวม ${scoreSum} · บัตรในหีบ ${ballotCount} · ผู้ที่ลงคะแนนแล้ว ${votedCount}`;
    if (!allEqual) {
      return {
        level: "fail",
        detail: `ตัวเลขไม่ตรงกัน — ${detail} (ควรเท่ากันทั้งสาม รวมงดออกเสียง/ไม่รับรอง)`,
      };
    }
    return { level: "pass", detail: `ตรงกันทั้งสาม — ${detail}` };
  });

  // 11a) config.googleForm — ลิงก์แบบประเมินผล
  await run("config.googleForm", "config", "ลิงก์แบบประเมิน (Google Form)", async () => {
    if (!cfg?.googleFormUrl) {
      return { level: "warn", detail: "ยังไม่ได้ตั้งลิงก์ Google Form สำหรับหน้าขอบคุณหลังลงคะแนน" };
    }
    return { level: "pass", detail: "ตั้งลิงก์ Google Form ไว้แล้ว" };
  });

  // 11b) config.leak — showResult เปิดทั้งที่ยังไม่ ENDED
  await run("config.leak", "config", "การแสดงผลคะแนนก่อนปิดหีบ", async () => {
    if (cfg?.showResult && systemMode !== "ENDED") {
      return {
        level: "warn",
        detail: `เปิดแสดงผลคะแนนอยู่ทั้งที่โหมดยังเป็น ${systemMode} (ยังไม่ ENDED) — ผลอาจรั่วก่อนปิดหีบ`,
      };
    }
    return {
      level: "pass",
      detail: cfg?.showResult
        ? "แสดงผลคะแนน (สอดคล้องกับสถานะปิดการเลือกตั้งแล้ว)"
        : "ซ่อนผลคะแนนตามปกติ",
    };
  });

  // 11c) config.template — activeTemplateId มีจริงในระบบ
  await run("config.template", "config", "ธีมหน้าเว็บที่ใช้งาน", async () => {
    const id = cfg?.activeTemplateId || "classic";
    if (isBuiltInSlug(id)) {
      return { level: "pass", detail: `ใช้ธีมมาตรฐาน "${id}"` };
    }
    // อาจเป็น template ที่ผู้ใช้สร้างใน DB — ตรวจแบบ read-only
    const dbTpl = await db.template.findUnique({ where: { slug: id } }).catch(() => null);
    if (dbTpl) {
      return { level: "pass", detail: `ใช้ธีมที่สร้างเอง "${id}"` };
    }
    return {
      level: "warn",
      detail: `ธีมที่ตั้งไว้ "${id}" ไม่พบในระบบ — หน้าเว็บจะถอยไปใช้ธีม classic แทน`,
    };
  });

  // 12) env.mock — mock-login เปิดอยู่หรือไม่
  await run("env.mock", "env", "การเข้าสู่ระบบจำลอง (Mock Login)", async () => {
    const mockOn = process.env.NEXT_PUBLIC_ENABLE_MOCK_LOGIN === "true";
    if (!mockOn) {
      return { level: "pass", detail: "ปิดการเข้าสู่ระบบจำลองแล้ว (ใช้ PSU SSO จริง)" };
    }
    if (process.env.NODE_ENV === "production") {
      return {
        level: "fail",
        detail: "ปุ่มเข้าสู่ระบบจำลองยังแสดงบนหน้า login ทั้งที่รันในโหมด production — ระบบบล็อกเส้นทางนี้อยู่แล้วเพราะ mock-login provider ไม่ถูกลงทะเบียนใน production แต่ปุ่มที่กดแล้วไม่ทำงานทำให้นักศึกษาสับสนและส่งสัญญาณว่า deploy ตั้งค่าไม่ถูกต้อง ควรปิด NEXT_PUBLIC_ENABLE_MOCK_LOGIN ก่อนใช้งานจริง",
      };
    }
    return {
      level: "warn",
      detail: "เปิดการเข้าสู่ระบบจำลองอยู่ในโหมด dev (มี mock-login provider จริงในโหมดนี้) — ปกติสำหรับการพัฒนา แต่ต้องปิด (NEXT_PUBLIC_ENABLE_MOCK_LOGIN) ก่อน deploy production",
    };
  });

  const summary = checks.reduce(
    (acc, c) => {
      if (c.level === "pass") acc.pass += 1;
      else if (c.level === "warn") acc.warn += 1;
      else if (c.level === "fail") acc.fail += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 }
  );

  return NextResponse.json({ checks, summary });
}
