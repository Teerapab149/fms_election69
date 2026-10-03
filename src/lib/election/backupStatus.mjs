/**
 * describeBackupStatus — ตัดสินผลตรวจ "สำรองข้อมูลอัตโนมัติ (backup)" ของหน้าตรวจความพร้อม
 *
 * อ่านเนื้อไฟล์ backups/status/LAST_OK และ LAST_FAIL (JSON บรรทัดเดียวที่ scripts/backup.sh
 * เขียน) แล้วตอบ { level, detail } แบบเดียวกับ check อื่นใน /api/admin/readiness
 *
 * ไม่มี import เลยโดยตั้งใจ — `node --test` โหลดได้ตรง ๆ (scripts/smoke/backupStatus.test.mjs)
 * ตัวจัดรูปวันเวลาส่งเข้ามาจาก route (formatThaiDate/formatThaiTime) ไม่ส่งมาก็มีตัวสำรอง
 *
 * กติกา:
 *   ไม่มีทั้งสองไฟล์                          → warn (อาจเป็น DB ของคณะที่ DBA สำรองให้)
 *   LAST_FAIL ใหม่กว่า LAST_OK (หรือไม่มี OK) → stage "offsite" = warn (ในเครื่องยังดี)
 *                                                อย่างอื่น = fail พร้อมเวลา backup ดีล่าสุด
 *   อายุ LAST_OK ≤ รอบ + 1 ชม.                → pass
 *   อายุ LAST_OK ≤ 2 × รอบ + 1 ชม.            → warn (เลยรอบ)
 *   เก่ากว่านั้น                               → fail
 *   รอบ = LAST_OK.interval_hours (ไม่มี = 24 ชม. เพราะรันมือ/cron รายวัน)
 */

const HOUR = 3600e3;
const DEFAULT_INTERVAL_HOURS = 24;

function fallbackWhen(d) {
  // เวลาไทย (UTC+7 ไม่มี DST) แบบเรียบ ๆ สำหรับตอนที่ไม่ได้ส่งตัวจัดรูปมา
  const t = new Date(d.getTime() + 7 * HOUR);
  const p = (n) => String(n).padStart(2, "0");
  return `${t.getUTCDate()}/${p(t.getUTCMonth() + 1)}/${t.getUTCFullYear() + 543} เวลา ${p(t.getUTCHours())}.${p(t.getUTCMinutes())} น.`;
}

/** text → { rec, bad } · rec = null เมื่อไม่มีไฟล์หรืออ่านไม่ออก */
function parseStatus(text) {
  if (text === null || text === undefined) return { rec: null, bad: false };
  try {
    const rec = JSON.parse(String(text));
    if (!rec || typeof rec !== "object") return { rec: null, bad: true };
    const at = new Date(rec.at);
    if (typeof rec.at !== "string" || Number.isNaN(at.getTime())) return { rec: null, bad: true };
    return { rec: { ...rec, atDate: at }, bad: false };
  } catch {
    return { rec: null, bad: true };
  }
}

/** เหลือแค่ชื่อไฟล์ ไม่โชว์ path และตัดความยาว */
function safeName(v) {
  if (typeof v !== "string" || !v) return "";
  const base = v.split(/[\\/]/).pop();
  return base.length > 80 ? `${base.slice(0, 80)}…` : base;
}

function safeText(v, max = 200) {
  if (typeof v !== "string") return "";
  const s = v.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function ageText(ms) {
  const m = Math.max(0, Math.floor(ms / 60e3));
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} ชม. ที่แล้ว`;
  return `${Math.floor(h / 24)} วันที่แล้ว`;
}

/**
 * @param {{ lastOk: string|null, lastFail: string|null, now: number|Date,
 *           formatWhen?: (d: Date) => string }} input
 *   lastOk / lastFail = เนื้อไฟล์ดิบ (null = ไม่มีไฟล์) · อ่านไม่ได้ให้ส่ง "" มา
 * @returns {{ level: "pass"|"warn"|"fail", detail: string }}
 */
export function describeBackupStatus({ lastOk, lastFail, now, formatWhen }) {
  const when = typeof formatWhen === "function" ? formatWhen : fallbackWhen;
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const ok = parseStatus(lastOk);
  const bad = parseStatus(lastFail);
  const unreadable = [ok.bad && "LAST_OK", bad.bad && "LAST_FAIL"].filter(Boolean);
  const unreadableNote = unreadable.length
    ? ` (อ่านไฟล์สถานะไม่ได้: ${unreadable.join(", ")} ถือว่าไม่มีไฟล์)`
    : "";

  if (!ok.rec && !bad.rec) {
    return {
      level: "warn",
      detail:
        "ยังไม่พบประวัติ backup บนเซิร์ฟเวอร์นี้ — ตรวจว่า service backup รันอยู่ (docker compose ps backup) และดู log ด้วย docker compose logs backup" +
        " ถ้าใช้ฐานข้อมูลของคณะและเจ้าหน้าที่ฐานข้อมูล (DBA) สำรองให้อยู่แล้ว ข้อนี้ข้ามได้" +
        unreadableNote,
    };
  }

  // ── ประเมินอายุของ backup ที่ดีล่าสุด ────────────────────────────────────────
  let ageLevel = null;
  let okText = "ยังไม่เคยมี backup ที่สำเร็จ";
  let intervalH = DEFAULT_INTERVAL_HOURS;
  if (ok.rec) {
    const ih = Number(ok.rec.interval_hours);
    if (Number.isFinite(ih) && ih > 0) intervalH = ih;
    const age = Math.max(0, nowMs - ok.rec.atDate.getTime());
    const file = safeName(ok.rec.file);
    okText = `backup ล่าสุดที่สำเร็จ ${when(ok.rec.atDate)} (${ageText(age)})${file ? ` ไฟล์ ${file}` : ""}`;
    if (age <= intervalH * HOUR + HOUR) ageLevel = "pass";
    else if (age <= 2 * intervalH * HOUR + HOUR) ageLevel = "warn";
    else ageLevel = "fail";
  }
  const lateText =
    ageLevel === "warn"
      ? ` — เลยรอบที่ตั้งไว้ (ทุก ${intervalH} ชม.) แล้ว ตรวจ docker compose logs backup`
      : ageLevel === "fail"
        ? ` — เก่าเกิน 2 รอบ (ทุก ${intervalH} ชม.) แล้ว backup อัตโนมัติน่าจะหยุดทำงาน ตรวจ docker compose ps backup และ docker compose logs backup`
        : "";

  // ── รอบล่าสุดล้ม ─────────────────────────────────────────────────────────────
  // >= ไม่ใช่ >: backup.sh เขียน LAST_OK แล้วต่อด้วย LAST_FAIL stage "offsite" ของรอบเดียวกัน
  // ภายในวินาทีเดียวกันได้ (เวลาในไฟล์ละเอียดแค่วินาที) · `>` จะซ่อนความล้มเหลวนั้นทิ้ง
  const failIsLatest = bad.rec && (!ok.rec || bad.rec.atDate.getTime() >= ok.rec.atDate.getTime());
  if (failIsLatest) {
    const reason = safeText(bad.rec.reason) || "ไม่ทราบสาเหตุ";
    const failWhen = when(bad.rec.atDate);
    if (bad.rec.stage === "offsite") {
      return {
        level: ageLevel === "fail" ? "fail" : "warn",
        detail:
          `${okText}${lateText} แต่การคัดลอกออกนอกเครื่องรอบ ${failWhen} ไม่สำเร็จ (${reason})` +
          " — backup ในเครื่องยังใช้ได้ แต่ถ้าดิสก์เครื่องนี้เสียจะไม่มีสำเนาอื่น" +
          unreadableNote,
      };
    }
    return {
      level: "fail",
      detail: `backup รอบล่าสุด ${failWhen} ล้มเหลว: ${reason} — ${okText}${unreadableNote}`,
    };
  }

  // ── รอบล่าสุดสำเร็จ ──────────────────────────────────────────────────────────
  return { level: ageLevel, detail: `${okText}${lateText}${unreadableNote}` };
}
