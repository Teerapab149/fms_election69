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
import { isMockLoginProviderRegistered } from "../../../../lib/auth";
import { UPLOAD_ROOT, BUNDLED_ROOT } from "../../../../lib/media/storage";
import { describeBackupStatus } from "../../../../lib/election/backupStatus.mjs";
import { isTestToolsEnabled } from "../../../../utils/testTools.mjs";
import { access, readFile, constants as fsConstants } from "fs/promises";
import path from "path";

// Never statically rendered: this route reads headers/request.url per call. Without
// this Next tries to prerender it at build time, the read throws DynamicServerError,
// and the catch blocks log it — build noise that reads like a real auth failure.
export const dynamic = "force-dynamic";

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
      const item = { id, group, level: r.level, title, detail: r.detail };
      if (r.techDetail) item.techDetail = r.techDetail;
      checks.push(item);
    } catch (e) {
      checks.push({
        id,
        group,
        level: "fail",
        title,
        detail: "ตรวจข้อนี้ไม่สำเร็จ ลองกดตรวจซ้ำ ถ้ายังไม่ได้ให้แจ้งเจ้าหน้าที่ IT",
        techDetail: String(e?.message || "เกิดข้อผิดพลาด"),
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
        detail: `เวลาปิดหีบ (${whenText(ELECTION_END)}) มาก่อนหรือเท่ากับเวลาเปิดหีบ (${whenText(ELECTION_START)}) ระบบจึงเปิดรับคะแนนไม่ได้ตามที่ตั้งใจ แก้ได้ที่เมนูตั้งค่าทั่วไป`,
      };
    }
    return {
      level: "pass",
      detail: `เปิดหีบ ${whenText(ELECTION_START)} ถึง ปิดหีบ ${whenText(ELECTION_END)}`,
    };
  });

  // 2) schedule.campaign — เปิดตัวผู้สมัครควรมาก่อนเปิดหีบ
  await run("schedule.campaign", "schedule", "เวลาเปิดตัวผู้สมัคร", async () => {
    if (CAMPAIGN_START > ELECTION_START) {
      return {
        level: "warn",
        detail: `เวลาเปิดตัวผู้สมัคร (${whenText(CAMPAIGN_START)}) อยู่หลังเวลาเปิดหีบ (${whenText(ELECTION_START)}) นักศึกษาอาจยังไม่เห็นผู้สมัครตอนเริ่มลงคะแนน แก้ได้ที่เมนูตั้งค่าทั่วไป`,
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
      return { level: "pass", detail: "ตั้งเวลาทั้ง 3 ช่วงไว้ในระบบครบถ้วน" };
    }
    return {
      level: "warn",
      detail: `ยังไม่ได้ตั้งหรือค่าไม่ถูกต้อง ${missing.length} ช่อง (${missing
        .map((m) => m.label)
        .join(", ")}) ระบบจึงใช้เวลาเริ่มต้นที่มากับโปรแกรมแทน ซึ่งอาจไม่ตรงกับกำหนดการจริง ให้ตั้งที่เมนูตั้งค่าทั่วไป`,
      techDetail: `ค่าใน globalConfig ที่ว่างหรืออ่านไม่ได้: ${missing.map((m) => m.key).join(", ")}`,
    };
  });

  // 4) schedule.past — ELECTION_END อดีต + AUTO / ELECTION_START อนาคต
  await run("schedule.past", "schedule", "ความสอดคล้องของเวลากับปัจจุบัน", async () => {
    if (ELECTION_END.getTime() < now && systemMode === "AUTO") {
      return {
        level: "warn",
        detail: `เวลาปิดหีบ (${whenText(ELECTION_END)}) ผ่านไปแล้ว และโหมดเป็น AUTO ระบบจึงแสดงว่าปิดหีบแล้วทันทีที่นักศึกษาเปิดหน้าเว็บ ถ้ากำลังเตรียมการเลือกตั้งรอบใหม่ ให้ตั้งวันเปิดและปิดหีบใหม่ที่เมนูตั้งค่าทั่วไป`,
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
          detail: `โหมด OPEN (เปิดระบบ) ยังเปิดอยู่ทั้งที่เลยเวลาปิดหีบ (${whenText(ELECTION_END)}) แล้ว ตรวจว่ายังต้องการรับคะแนนอยู่หรือไม่ ถ้าจบแล้วให้กดปิดหีบ (ENDED) ที่ศูนย์ควบคุม`,
        };
      }
      return { level: "pass", detail: "โหมด OPEN (เปิดรับคะแนนด้วยตนเอง)" };
    }
    if (systemMode === "PAUSE") {
      return {
        level: "warn",
        detail: "ระบบอยู่ในโหมด PAUSE (พักระบบ) นักศึกษาจะลงคะแนนไม่ได้จนกว่าจะเปลี่ยนโหมดที่ศูนย์ควบคุม",
      };
    }
    if (systemMode === "ENDED") {
      return { level: "pass", detail: "โหมด ENDED (ปิดระบบ) ปิดการเลือกตั้งอย่างเป็นทางการแล้ว" };
    }
    return { level: "pass", detail: "โหมด AUTO (อัตโนมัติ) ระบบเปิดและปิดหีบตามเวลาที่ตั้งไว้" };
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
      return { level: "fail", detail: "ยังไม่มีพรรคผู้สมัครในระบบ เพิ่มพรรคที่เมนูจัดการผู้สมัครก่อนเปิดเลือกตั้ง" };
    }
    return { level: "pass", detail: `มีพรรคผู้สมัคร ${real.length} พรรค` };
  });

  // 7) candidates.single — พรรคจริง=1 ต้องมีตัวเลือกไม่รับรอง(-1) + งดออกเสียง(0)
  await run("candidates.single", "candidates", "ตัวเลือกกรณีพรรคเดียว", async () => {
    if (!candidates) throw new Error("อ่านข้อมูลพรรคไม่ได้");
    const real = candidates.filter((c) => c.number > 0);
    const hasDisapprove = candidates.some((c) => c.number === -1);
    const hasAbstain = candidates.some((c) => c.number === 0);
    if (real.length !== 1) {
      // งดออกเสียงต้องมีทุกกรณี ไม่ใช่เฉพาะบัตรพรรคเดียว — หน้าโหวตแบบหลายพรรค
      // อ่าน specialOptions.abstain.id ตรง ๆ ถ้าแถวนี้หายไปคือบัตรใช้งานไม่ได้จริง
      if (!hasAbstain) {
        return {
          level: "fail",
          detail: `มีพรรคผู้สมัคร ${real.length} พรรค แต่ในบัตรไม่มีตัวเลือก "งดออกเสียง" บัตรจึงยังใช้ลงคะแนนไม่ได้ กดปุ่มสร้างตัวเลือกที่ขาดด้านล่าง หรือแจ้งเจ้าหน้าที่ IT`,
          techDetail: "ไม่มีแถว Candidate เบอร์ 0 (งดออกเสียง) ในฐานข้อมูล",
        };
      }
      return {
        level: "pass",
        detail: `มีพรรคผู้สมัคร ${real.length} พรรค และมีตัวเลือกงดออกเสียงแล้ว (ไม่ใช่การเลือกตั้งพรรคเดียว จึงไม่ต้องมีตัวเลือกไม่รับรอง)`,
      };
    }
    if (!hasDisapprove) {
      return {
        level: "fail",
        detail: "มีพรรคผู้สมัครเพียงพรรคเดียว แต่ในบัตรไม่มีตัวเลือก \"ไม่รับรอง\" ซึ่งการเลือกตั้งพรรคเดียวต้องมี ต้องสร้างก่อนเปิดหีบ กดปุ่มสร้างตัวเลือกที่ขาดด้านล่าง",
        techDetail: "ไม่มีแถว Candidate เบอร์ -1 (ไม่รับรอง) ในฐานข้อมูล",
      };
    }
    if (!hasAbstain) {
      return {
        level: "warn",
        detail: "มีตัวเลือก \"ไม่รับรอง\" แล้ว แต่ในบัตรยังไม่มีตัวเลือก \"งดออกเสียง\" กดปุ่มสร้างตัวเลือกที่ขาดด้านล่าง",
        techDetail: "ไม่มีแถว Candidate เบอร์ 0 (งดออกเสียง) ในฐานข้อมูล",
      };
    }
    return { level: "pass", detail: "พรรคเดียว และมีตัวเลือก \"ไม่รับรอง\" กับ \"งดออกเสียง\" ครบ" };
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
    return { level: "warn", detail: `พรรคที่ข้อมูลยังไม่ครบ ${issues.join(", ")} แก้ได้ที่เมนูจัดการผู้สมัคร` };
  });

  // 9) voters — จำนวนผู้มีสิทธิ์ (ปี 1-4) > 0
  const validYears = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];
  await run("voters", "voters", "รายชื่อผู้มีสิทธิ์เลือกตั้ง", async () => {
    const count = await db.user.count({ where: { year: { in: validYears } } });
    if (count === 0) {
      return { level: "fail", detail: "ยังไม่มีรายชื่อผู้มีสิทธิ์เลือกตั้ง (นักศึกษาปี 1 ถึงปี 4) ในระบบ ให้เจ้าหน้าที่ IT นำเข้ารายชื่อก่อนเปิดหีบ" };
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
    const detail = `คะแนนรวม ${scoreSum} บัตรในหีบ ${ballotCount} ผู้ที่ลงคะแนนแล้ว ${votedCount}`;
    if (!allEqual) {
      return {
        level: "fail",
        detail: `จำนวนคะแนน จำนวนบัตร และจำนวนผู้ลงคะแนนไม่ตรงกัน (${detail}) ทั้งสามค่าควรเท่ากัน ควรให้เจ้าหน้าที่ IT ตรวจสอบก่อนประกาศผล`,
        techDetail: "sum(Candidate.score) ต้องเท่ากับ count(Ballot) และ count(User.isVoted) รวมตัวเลือกงดออกเสียงและไม่รับรอง ตรวจด้วย scripts/reconcile-scores.js",
      };
    }
    return { level: "pass", detail: `ตรงกันทั้งสามค่า (${detail})` };
  });

  // 11a) config.googleForm — ลิงก์แบบประเมินผล
  await run("config.googleForm", "config", "ลิงก์แบบประเมิน (Google Form)", async () => {
    if (!cfg?.googleFormUrl) {
      return { level: "warn", detail: "ยังไม่ได้ตั้งลิงก์แบบประเมิน หน้าขอบคุณหลังลงคะแนนจึงไม่มีปุ่มไปทำแบบประเมิน ตั้งได้ที่เมนูตั้งค่าทั่วไป" };
    }
    return { level: "pass", detail: "ตั้งลิงก์ Google Form ไว้แล้ว" };
  });

  // 11b) config.leak — showResult เปิดทั้งที่ยังไม่ ENDED
  await run("config.leak", "config", "การแสดงผลคะแนนก่อนปิดหีบ", async () => {
    if (cfg?.showResult && systemMode !== "ENDED") {
      return {
        level: "warn",
        detail: "เปิดแสดงผลคะแนนอยู่ทั้งที่ยังไม่ปิดหีบ ผลคะแนนอาจรั่วไปถึงคนที่ยังไม่ได้ลงคะแนน ให้ซ่อนผลที่ศูนย์ควบคุมจนกว่าจะปิดหีบ",
        techDetail: `showResult = true แต่ systemMode = ${systemMode} (ยังไม่ใช่ ENDED)`,
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
      detail: `ธีมที่ตั้งไว้ ("${id}") หาไม่พบในระบบ หน้าเว็บจึงใช้ธีมพื้นฐานแทน เลือกธีมใหม่ที่เมนูเลือกธีม`,
      techDetail: `activeTemplateId = ${id} ไม่ตรงกับ built-in slug และไม่มีใน Template table, ระบบถอยไปใช้ classic`,
    };
  });

  // 12) env.mock — เส้นทาง mock-login เปิดอยู่หรือไม่
  // SEC-MOCK2: ตรวจจาก "ตัวกั้นจริง" คือการ register provider (isMockLoginProviderRegistered)
  //
  // SEC-MOCK3 (2026-07-27): เดิมมีอีกเงื่อนไขคือ NEXT_PUBLIC_ENABLE_MOCK_LOGIN (ปุ่มบน
  // หน้า login) และมันทำให้ผลตรวจ "ค้างแดงถาวร" ได้จริง — Next inline ค่า NEXT_PUBLIC_*
  // ตอน build ทั้งฝั่ง server ด้วย ถ้า build ตอนที่ flag เป็น true ตัว minifier จะพิสูจน์ได้
  // ว่าสาขา pass เข้าไม่ถึงแล้วลบทิ้ง เหลือ `providerLive ? fail : fail` ในไบนารี — ตั้ง env
  // ตอน runtime ยังไงก็ไม่เขียว (พิสูจน์จาก .next/server/.../readiness/route.js ทั้งสองแบบ build)
  // ตอนนี้ปุ่มบนหน้า login อ่านจาก /api/auth/providers แล้ว (ดู app/login/page.js) ปุ่มกับ
  // ตัวกั้นจึงเป็นตัวเดียวกัน เงื่อนไขนี้จึงเหลือตัวเดียวและอ่านตอน runtime ล้วน
  await run("env.mock", "env", "การเข้าสู่ระบบจำลอง (ใช้ทดสอบ)", async () => {
    if (isMockLoginProviderRegistered()) {
      return {
        level: "fail",
        detail:
          "เครื่องนี้เปิดให้เข้าระบบแบบจำลองได้ (ไว้ทดสอบ ไม่ต้องใช้รหัสผ่านจริง) ถ้านี่คือเครื่องทดสอบหรือเครื่องพัฒนา ไม่ต้องทำอะไร แต่ถ้าจะใช้เป็นเครื่องจริงในวันเลือกตั้ง ต้องให้เจ้าหน้าที่ IT ติดตั้งแบบใช้งานจริงก่อน แล้วข้อนี้จะเขียวเอง",
        techDetail:
          "เซิร์ฟเวอร์นี้ยังเปิดเส้นทางเข้าสู่ระบบจำลองอยู่ (mock-login provider ถูกลงทะเบียนจริง), ใครที่รู้ URL callback ของ NextAuth เข้าสู่ระบบเป็นนักศึกษาคนใดก็ได้โดยไม่ต้องใช้รหัสผ่าน" +
          " ปกติของเครื่องนักพัฒนา (dev server)" +
          " เส้นทางนี้ปิดเองอัตโนมัติเมื่อรันเป็น production build (NODE_ENV=production) จึงไม่มีสวิตช์ให้กดปิดในหน้านี้ ถ้าเครื่องนี้คือเซิร์ฟเวอร์ที่จะใช้วันเลือกตั้งจริง ให้ deploy ด้วย production build ก่อนเปิดให้นักศึกษาใช้",
      };
    }
    return {
      level: "pass",
      detail: "ปิดการเข้าระบบแบบจำลองแล้ว เข้าระบบได้ทางเดียวคือบัญชี PSU จริง",
      techDetail: "mock-login provider ไม่ถูกลงทะเบียนบนเซิร์ฟเวอร์นี้ ปุ่มบนหน้า login จึงไม่แสดงตามไปด้วย",
    };
  });

  // 13) env.uploads — โฟลเดอร์เก็บรูปต้องมีอยู่จริงและเขียนได้
  //
  // รูปที่อัปโหลดไม่ขึ้นเป็นอาการที่มาจากหลายสาเหตุแล้วหน้าตาเหมือนกันหมด (สิทธิ์ไม่พอ /
  // โฟลเดอร์หาย / ตั้ง UPLOAD_ROOT ผิดที่) ตรวจให้เห็นตรงนี้ก่อนวันจริง ดีกว่าไปเจอ
  // ตอนกรรมการอัปรูปพรรคแล้วหน้าเว็บขาวโพลน
  await run("env.uploads", "env", "โฟลเดอร์เก็บรูปที่อัปโหลด", async () => {
    const custom = UPLOAD_ROOT !== BUNDLED_ROOT;
    try {
      await access(UPLOAD_ROOT, fsConstants.W_OK | fsConstants.X_OK);
    } catch (e) {
      return {
        level: "fail",
        detail: "เก็บรูปที่อัปโหลดไม่ได้ เพราะโฟลเดอร์เก็บรูปยังไม่พร้อมใช้ การอัปโหลดรูปพรรคและรูปสมาชิกจะล้มเหลวทั้งหมด ให้แจ้งเจ้าหน้าที่ IT แก้ก่อนใช้งาน",
        techDetail:
          `เขียนไฟล์ลง ${UPLOAD_ROOT} ไม่ได้ (${e.code || e.message}) ให้ผู้ดูแลสร้างโฟลเดอร์นี้และให้สิทธิ์เขียนแก่ผู้ใช้ที่รันแอป`,
      };
    }
    if (!custom) {
      return {
        level: "warn",
        detail: "รูปที่อัปโหลดถูกเก็บไว้ในโฟลเดอร์เดียวกับตัวโปรแกรม ใช้งานได้ปกติ แต่ถ้าเจ้าหน้าที่ IT ติดตั้งโปรแกรมใหม่ รูปที่อัปโหลดไว้อาจหายทั้งหมด ให้แจ้งเจ้าหน้าที่ IT ย้ายที่เก็บรูปออกไปนอกโฟลเดอร์โปรแกรมก่อนวันเลือกตั้ง",
        techDetail:
          `เก็บรูปไว้ใน ${UPLOAD_ROOT} ซึ่งอยู่ในโฟลเดอร์ซอร์สของแอป การ deploy ที่สร้างโฟลเดอร์ใหม่ (คัดลอก public, clone ใหม่, git clean) จะลบรูปทั้งหมด ตั้ง UPLOAD_ROOT ให้ชี้ไปไดเรกทอรีนอกซอร์ส แล้วย้ายไฟล์เดิมตามไป`,
      };
    }
    return { level: "pass", detail: "ที่เก็บรูปที่อัปโหลดพร้อมใช้งาน และอยู่นอกโฟลเดอร์ตัวโปรแกรม", techDetail: `เก็บรูปไว้ที่ ${UPLOAD_ROOT} (นอกโฟลเดอร์ซอร์ส) และเขียนได้` };
  });

  // 14) env.backup — scripts/backup.sh (เรียกจาก service backup ใน compose / cron / systemd timer /
  // pm2 — ดู deploy/backup/) เขียนผลแต่ละรอบไว้ที่ backups/status/LAST_OK และ LAST_FAIL (JSON
  // บรรทัดเดียว ไม่มีข้อมูลส่วนบุคคล) ใน compose เว็บ mount โฟลเดอร์นั้นแบบ read-only
  // การตัดสินอยู่ที่ lib/election/backupStatus.mjs ที่นี่แค่อ่านไฟล์
  await run("env.backup", "env", "สำรองข้อมูลอัตโนมัติ (backup)", async () => {
    // โฟลเดอร์สถานะ: BACKUP_STATUS_DIR (ตั้งชัดเจนเสมอได้) ไม่งั้น <cwd>/backups/status
    // ⚠️ `node .next/standalone/server.js` เรียก process.chdir(__dirname) ตอนบูต (server.js ที่ Next
    // สร้างให้) cwd จึงเป็น .next/standalone ไม่ใช่โฟลเดอร์โปรเจกต์ — backups/status ที่ cron/systemd/pm2
    // เขียนไว้ที่รากโปรเจกต์จะไม่เจอ แล้วหน้านี้เหลืองว่า "ไม่พบประวัติ" ทั้งที่ backup ปกติ
    // จึงลองรากโปรเจกต์ (../..) ต่อท้ายให้เฉพาะกรณี cwd เป็น .next/standalone จริง ๆ
    const cwd = process.cwd();
    const dirs = [process.env.BACKUP_STATUS_DIR, path.join(cwd, "backups", "status")];
    if (path.basename(cwd) === "standalone" && path.basename(path.dirname(cwd)) === ".next") {
      dirs.push(path.join(cwd, "..", "..", "backups", "status"));
    }
    // ไม่มีไฟล์ = null · อ่านไม่ได้ด้วยเหตุอื่น (สิทธิ์ไม่พอ ฯลฯ) = "" ให้ถือเป็นไฟล์เสีย
    const readIn = (dir, name) =>
      readFile(path.join(dir, name), "utf8").catch((e) => (e?.code === "ENOENT" ? null : ""));
    let lastOk = null;
    let lastFail = null;
    // ใช้โฟลเดอร์แรกที่มีไฟล์สถานะสักไฟล์ · ไม่มีเลยก็ได้ null ทั้งคู่ (= ยังไม่มีประวัติ)
    for (const dir of dirs.filter(Boolean)) {
      [lastOk, lastFail] = await Promise.all([readIn(dir, "LAST_OK"), readIn(dir, "LAST_FAIL")]);
      if (lastOk !== null || lastFail !== null) break;
    }
    return describeBackupStatus({ lastOk, lastFail, now, formatWhen: whenText });
  });

  // 15) env.testTools, the admin test tools (seed sample data, clear ballots and
  // parties) must never be on for the real election. Read on the server only.
  await run("env.testTools", "env", "เครื่องมือทดสอบของแอดมิน", async () => {
    if (isTestToolsEnabled()) {
      return {
        level: "fail",
        detail: "เครื่องมือทดสอบเปิดอยู่ ซึ่งล้างบัตรและล้างพรรคได้ ห้ามใช้เครื่องนี้ในวันเลือกตั้งจริง ให้เจ้าหน้าที่ IT ปิดก่อน",
        techDetail: "ตัวแปรแวดล้อมฝั่งเซิร์ฟเวอร์ ADMIN_TEST_TOOLS=1 ให้ลบออกจาก .env หรือ .env.local แล้วรีสตาร์ทเซิร์ฟเวอร์",
      };
    }
    return {
      level: "pass",
      detail: "เครื่องมือทดสอบปิดอยู่ ปลอดภัยสำหรับใช้งานจริง",
      techDetail: "ADMIN_TEST_TOOLS ไม่ได้ตั้งเป็น 1",
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

  return NextResponse.json({ checks, summary, testToolsEnabled: isTestToolsEnabled() });
}
