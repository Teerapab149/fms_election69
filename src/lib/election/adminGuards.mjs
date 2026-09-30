// What the committee may do to a running election, decided in one place so the
// admin API (api/admin/dashboard) and the settings screen cannot disagree.
// No imports: node:test loads it directly (scripts/smoke/adminGuards.test.mjs).
//
// The rule behind all of it: the per-party tally is public only once the box
// is closed, and a box whose tally is public never reopens. A tally seen while
// people can still vote steers the ones who have not voted yet — one wrong
// click there is an election that has to be run again.

// The box is closed when no vote can be cast now or later without an admin
// reopening it: ENDED, or AUTO past the scheduled end. PAUSE is not closed (it
// is a break in the middle of voting), and neither is AUTO before the start.
export function isBoxClosed({ systemMode = "AUTO", end, now = Date.now() }) {
  if (systemMode === "ENDED") return true;
  const endMs = end instanceof Date ? end.getTime() : Number(end);
  return systemMode === "AUTO" && Number.isFinite(endMs) && now >= endMs;
}

// → null when allowed, otherwise the Thai reason shown to the admin
export function checkShowResult({ value, systemMode, end, now }) {
  if (value !== true && value !== false) return "ค่าการแสดงผลไม่ถูกต้อง";
  if (value && !isBoxClosed({ systemMode, end, now })) {
    return "ยังเปิดแสดงผลไม่ได้ — หีบยังไม่ปิด เปลี่ยนเป็น ENDED หรือรอให้เลยเวลาปิดหีบก่อน แล้วค่อยเปิดแสดงผล";
  }
  return null;
}

export function checkSetMode({ mode, showResult, certified, end, now }) {
  const valid = ["AUTO", "PAUSE", "ENDED", "MANUAL_OPEN"];
  if (!valid.includes(mode)) return "โหมดไม่ถูกต้อง";
  // certification is the end of this election (kept from before)
  if (certified && mode !== "ENDED") {
    return "ผลถูกรับรองแล้ว เปลี่ยนโหมดไม่ได้ — การเลือกตั้งครั้งนี้ปิดอย่างเป็นทางการ";
  }
  // a published tally with a box that can take votes again
  if (showResult && !isBoxClosed({ systemMode: mode, end, now })) {
    return "ผลคะแนนกำลังแสดงอยู่ — ปิดการแสดงผลก่อน แล้วจึงเปิดหีบหรือพักระบบได้";
  }
  return null;
}

// Editing the schedule is a mode change by another route: under AUTO the dates
// ARE the box, so moving the end into the future reopens it just as surely as
// pressing OPEN would. Same rule, checked by api/admin/global-config.
// Only the voting window counts — campaignStartAt is display-only (when the
// candidate list goes public) and never opens or closes the box.
// → null when allowed (including "the dates did not move"), otherwise the Thai reason
export function checkScheduleChange({
  systemMode = "AUTO", showResult, certified, prevStart, prevEnd, nextStart, nextEnd, now = Date.now(),
}) {
  const ms = (d) => (d instanceof Date ? d.getTime() : Number(d));
  // both admin clients send the whole config on every save, so an unchanged
  // schedule must pass untouched — a certified election can still fix a typo
  if (ms(prevStart) === ms(nextStart) && ms(prevEnd) === ms(nextEnd)) return null;
  // certification is the end of this election (as in checkSetMode)
  if (certified) return "ผลถูกรับรองแล้ว แก้วันเวลาเลือกตั้งไม่ได้";
  if (showResult && !isBoxClosed({ systemMode, end: nextEnd, now })) {
    return "ผลคะแนนกำลังแสดงอยู่ — ซ่อนผลก่อน แล้วจึงแก้วันเวลาให้หีบเปิดอีกครั้งได้";
  }
  // only once the dates move: a DB that is already inverted can still save its other fields
  if (!(ms(nextEnd) > ms(nextStart))) return "เวลาปิดหีบต้องอยู่หลังเวลาเปิดหีบ";
  return null;
}

// What each change of mode actually does, in words — for the confirm dialog.
// (from → to), with the schedule, so "AUTO" can say whether it opens now.
export const MODE_LABEL = {
  AUTO: "AUTO (อัตโนมัติ)", MANUAL_OPEN: "OPEN (เปิดระบบ)", PAUSE: "PAUSE (ระงับ)", ENDED: "ENDED (ปิดระบบ)",
};

export function describeModeChange({ from, to, start, end, now = Date.now() }) {
  const startMs = start instanceof Date ? start.getTime() : Number(start);
  const endMs = end instanceof Date ? end.getTime() : Number(end);
  const reopening = from === "ENDED" || from === "PAUSE";
  switch (to) {
    case "MANUAL_OPEN":
      return (reopening ? "หีบจะเปิดอีกครั้งทันที " : "หีบจะเปิดทันที ไม่สนวันเวลาที่ตั้งไว้ ")
        + "นักศึกษาที่ยังไม่ได้ลงคะแนนจะลงคะแนนได้ และหีบจะเปิดอยู่จนกว่าจะเปลี่ยนเป็น ENDED แม้เลยเวลาปิดหีบแล้ว";
    case "PAUSE":
      return "หยุดรับคะแนนชั่วคราว นักศึกษาจะเห็นหน้าพักระบบ และลงคะแนนไม่ได้จนกว่าจะเปลี่ยนโหมดกลับ";
    case "ENDED":
      return "ปิดหีบทันที ไม่รับคะแนนอีก ผลคะแนนยังไม่แสดงจนกว่าจะเปิดการแสดงผล";
    case "AUTO":
      if (Number.isFinite(endMs) && now >= endMs) return "เลยเวลาปิดหีบแล้ว หีบจะยังปิดอยู่ตามกำหนดการ";
      if (Number.isFinite(startMs) && now < startMs) return "หีบจะเปิดเองเมื่อถึงเวลาเปิดหีบตามที่ตั้งไว้ใน “ตั้งค่าทั่วไป”";
      return (reopening ? "อยู่ในช่วงเวลาเลือกตั้ง หีบจะเปิดอีกครั้งทันที " : "อยู่ในช่วงเวลาเลือกตั้ง หีบจะเปิดทันที ")
        + "และปิดเองเมื่อถึงเวลาปิดหีบ";
    default:
      return "";
  }
}
