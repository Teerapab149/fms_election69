// The yearly setup checklist on ตั้งค่าทั่วไป: for each thing that must be set
// again every election, what it is now and whether it is ready. Statuses say
// something true and specific ("ปิดหีบก่อนเปิดหีบ", "ผ่านไปแล้ว") — a field that
// merely has a value is not "ready" if the value cannot be right.
//
// Pure (no React). `now` is passed in so it is testable.
//
// tone: "ok" ready · "none" ready, nothing to set (a valid blank) ·
//       "warn" should be fixed · "err" wrong as it stands

import { parseBangkok, formatThaiTime } from "./electionConfig.js";

const TH_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const BKK = 7 * 60 * 60 * 1000;

function bkk(d) {
  const x = new Date(d.getTime() + BKK);
  return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate(), wd: x.getUTCDay() };
}
const sameDay = (a, b) => { const p = bkk(a), q = bkk(b); return p.y === q.y && p.m === q.m && p.d === q.d; };

/** "วันเสาร์ที่ 6 กุมภาพันธ์ 2570 · 08.30 น." — how a Thai admin reads a date */
export function thaiLongDateTime(d) {
  if (!d) return "";
  const p = bkk(d);
  return `วัน${TH_DAYS[p.wd]}ที่ ${p.d} ${TH_MONTHS[p.m]} ${p.y + 543} · ${formatThaiTime(d)}`;
}
/** "6 ก.พ. 2570 08.30 น." */
export function thaiShortDateTime(d) {
  if (!d) return "";
  const p = bkk(d);
  return `${p.d} ${TH_MONTHS_SHORT[p.m]} ${p.y + 543} ${formatThaiTime(d)}`;
}
/** "8 ชั่วโมง 30 นาที" */
export function thaiDuration(ms) {
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h} ชั่วโมง` : "", m ? `${m} นาที` : ""].filter(Boolean).join(" ") || "0 นาที";
}

const blank = (v) => String(v ?? "").trim() === "";

export function editionItem(cfg) {
  const missing = blank(cfg?.electionNamePrefix) || blank(cfg?.electionNumber) || blank(cfg?.academicYearTh) || Number(cfg?.electionNumber) === 0;
  const name = [cfg?.electionNamePrefix, cfg?.electionNumber].filter((x) => !blank(x)).join(" ");
  return {
    key: "edition",
    title: "ครั้งที่และปีการศึกษา",
    value: missing ? "ยังไม่ครบ" : `${name} · ปีการศึกษา ${cfg.academicYearTh}`,
    tone: missing ? "warn" : "ok",
    status: missing ? "ยังไม่ครบ" : "พร้อม",
  };
}

export function scheduleItem(cfg, now = new Date()) {
  const c = parseBangkok(cfg?.campaignStartAt);
  const s = parseBangkok(cfg?.electionStartAt);
  const e = parseBangkok(cfg?.electionEndAt);
  const base = { key: "schedule", title: "วันเวลาเลือกตั้ง" };
  if (!s || !e) {
    return { ...base, value: "ยังไม่ได้ตั้งวันเปิด-ปิดหีบ", tone: "warn", status: "ยังไม่ตั้ง" };
  }
  const value = `เปิดหีบ ${thaiShortDateTime(s)} · ปิด ${sameDay(s, e) ? formatThaiTime(e) : thaiShortDateTime(e)}`;
  if (e <= s) return { ...base, value, tone: "err", status: "ปิดหีบก่อนเปิดหีบ" };
  if (c && c > s) return { ...base, value, tone: "err", status: "เปิดตัวผู้สมัครหลังเปิดหีบ" };
  if (e <= now) return { ...base, value, tone: "err", status: "ผ่านไปแล้ว" };
  if (!c) return { ...base, value, tone: "warn", status: "ยังไม่ตั้งวันเปิดตัวผู้สมัคร" };
  return { ...base, value, tone: "ok", status: "พร้อม" };
}

export function posterItem(cfg) {
  const set = !blank(cfg?.electionBannerUrl);
  return {
    key: "poster",
    title: "โปสเตอร์",
    // the fallback is a generic poster (no date, no edition number) — a valid
    // choice, not a gap
    value: set ? "อัปโหลดแล้ว" : "ใช้โปสเตอร์เริ่มต้นของระบบ",
    tone: set ? "ok" : "none",
    status: set ? "พร้อม" : "ใช้ภาพเริ่มต้น",
  };
}

export function formItem(cfg) {
  const url = String(cfg?.googleFormUrl ?? "").trim();
  const base = { key: "form", title: "ลิงก์แบบประเมิน" };
  // blank is allowed (no form this year → no form step, no lock) but is far
  // more often forgotten than chosen, and students lose their activity hours
  if (!url) return { ...base, value: "ยังไม่ได้ใส่ลิงก์ · นักศึกษาจะไม่มีแบบประเมินให้ทำ", tone: "warn", status: "ยังไม่ใส่" };
  if (!/^https:\/\/\S+$/.test(url)) return { ...base, value: url, tone: "err", status: "ลิงก์ไม่ถูกต้อง" };
  let shown = url;
  try { const u = new URL(url); shown = `${u.host}${u.pathname.length > 24 ? `${u.pathname.slice(0, 24)}…` : u.pathname}`; } catch { /* keep raw */ }
  return { ...base, value: shown, tone: "ok", status: "พร้อม" };
}

export function hoursItem(cfg) {
  const raw = cfg?.activityHours;
  const n = Number(raw);
  const set = !blank(raw) && Number.isFinite(n) && n > 0;
  return {
    key: "hours",
    title: "ชั่วโมงกิจกรรม",
    value: set ? `${Math.round(n * 100) / 100} ชั่วโมง` : "ไม่ระบุเลข (หน้าเว็บเขียนแค่ \"รับชั่วโมงกิจกรรม\")",
    tone: set ? "ok" : "none",
    status: set ? "พร้อม" : "ไม่ระบุ",
  };
}

/** the whole list, in the order an admin works through it */
export function setupChecklist(cfg, now = new Date()) {
  const items = [editionItem(cfg), scheduleItem(cfg, now), posterItem(cfg), formItem(cfg), hoursItem(cfg)];
  const ready = items.filter((i) => i.tone === "ok" || i.tone === "none").length;
  return { items, ready, total: items.length };
}
