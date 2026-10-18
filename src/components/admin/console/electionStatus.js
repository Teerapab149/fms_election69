// Pure helpers: turn the server's dashboard stats into the words and colours
// the console shows. No React, no fetch, so the top bar and the control
// center can never describe the same moment in two different ways.
import { liveSystemStatus } from "../../../lib/election/systemStatus.mjs";

export const MODE_THAI = {
  AUTO: "อัตโนมัติ",
  MANUAL_OPEN: "เปิดระบบ",
  PAUSE: "ระงับ",
  ENDED: "ปิดระบบ",
};
export const MODE_SHORT = {
  AUTO: "AUTO",
  MANUAL_OPEN: "OPEN",
  PAUSE: "PAUSE",
  ENDED: "ENDED",
};

// One colour meaning everywhere: open = emerald, waiting = sky,
// paused = amber, closed = slate, danger = red.
export const TONES = {
  emerald: { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", soft: "bg-emerald-50 border-emerald-200", bar: "bg-emerald-500" },
  sky: { pill: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500", text: "text-sky-700", soft: "bg-sky-50 border-sky-200", bar: "bg-sky-500" },
  amber: { pill: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", text: "text-amber-700", soft: "bg-amber-50 border-amber-200", bar: "bg-amber-500" },
  slate: { pill: "bg-slate-100 text-slate-700 border-slate-300", dot: "bg-slate-500", text: "text-slate-700", soft: "bg-slate-50 border-slate-200", bar: "bg-slate-500" },
};

export function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function formatDuration(ms) {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  const pad = (n) => String(n).padStart(2, "0");
  const hms = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return days > 0 ? `${days} วัน ${hms}` : hms;
}

export function formatClock(date) {
  if (!date) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// stats = the `stats` object of GET /api/admin/dashboard (null until loaded).
export function describeElection(stats, nowMs) {
  if (!stats) {
    return { key: "loading", label: "กำลังตรวจสถานะ", tone: "slate", mode: null, detail: "", countdown: null, next: "" };
  }
  const mode = stats.systemMode || "AUTO";
  const start = stats.electionStart ? new Date(stats.electionStart) : null;
  const end = stats.electionEnd ? new Date(stats.electionEnd) : null;
  const { electionStatus } = liveSystemStatus({
    systemMode: mode,
    start: start ? start.getTime() : Infinity,
    end: end ? end.getTime() : Infinity,
    now: nowMs,
  });

  if (electionStatus === "WAITING") {
    return {
      key: "waiting", label: "รอเปิดหีบ", tone: "sky", mode,
      detail: "ระบบจะเปิดรับคะแนนเองเมื่อถึงเวลาเปิดหีบตามกำหนดการ",
      countdown: start ? { label: "เปิดหีบในอีก", ms: start.getTime() - nowMs } : null,
      next: "รอถึงเวลาเปิดหีบ และตรวจความพร้อมระบบให้ผ่านก่อน",
    };
  }
  if (electionStatus === "ONGOING") {
    const noEnd = !end || end.getTime() <= nowMs;
    if (noEnd) {
      return {
        key: "open", label: "เปิดรับคะแนน", headline: "เปิดค้างไว้ ไม่มีเวลาปิด", tone: "emerald", mode,
        detail: "โหมด OPEN ไม่ผูกกับเวลาปิดหีบที่ตั้งไว้ ระบบจะไม่ปิดหีบให้เอง",
        countdown: null,
        next: "เมื่อจบการเลือกตั้ง ให้กดปิดหีบ (ENDED) ด้วยตัวเอง",
      };
    }
    return {
      key: "running", label: "เปิดรับคะแนน", tone: "emerald", mode,
      detail: mode === "MANUAL_OPEN" ? "โหมด OPEN จะไม่ปิดเองเมื่อถึงเวลา ต้องกด ENDED เอง" : "ระบบจะปิดหีบเองเมื่อถึงเวลาปิดหีบ",
      countdown: { label: "ปิดหีบในอีก", ms: end.getTime() - nowMs },
      next: mode === "MANUAL_OPEN" ? "เมื่อจบการเลือกตั้ง ให้กดปิดหีบ (ENDED) ด้วยตัวเอง" : "ปิดหีบเมื่อถึงเวลา แล้วประกาศผล",
    };
  }
  if (electionStatus === "CLOSED") {
    return {
      key: "paused", label: "พักระบบ", headline: "หยุดรับคะแนนชั่วคราว", tone: "amber", mode,
      detail: "นักศึกษาลงคะแนนไม่ได้ในช่วงนี้ และเห็นหน้าพักระบบ",
      countdown: null,
      next: "เปลี่ยนโหมดกลับเมื่อพร้อมให้ลงคะแนนต่อ",
    };
  }
  // ENDED
  let next = "ประกาศผลคะแนน";
  if (stats.certified) next = "เสร็จสิ้นการเลือกตั้งครั้งนี้ ไม่มีขั้นตอนที่ต้องทำต่อ";
  else if (stats.showResult) next = "รับรองผลอย่างเป็นทางการ (ไม่บังคับ)";
  return {
    key: "ended", label: "ปิดหีบแล้ว", headline: "ไม่รับคะแนนอีก", tone: "slate", mode,
    detail: stats.certified ? "รับรองผลแล้ว" : stats.showResult ? "ประกาศผลแล้ว ทุกคนเห็นผลคะแนน" : "ผลคะแนนยังไม่แสดงต่อสาธารณะ",
    countdown: null,
    next,
  };
}
