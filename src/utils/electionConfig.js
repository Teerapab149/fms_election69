// ตั้งค่าเวลาทั้งหมดที่นี่ที่เดียว!
export const ELECTION_CONFIG = {
  // 🟢 เวลาเปิดตัวผู้สมัคร (Campaign Start)
  // วิธีเทส: ปรับปีเป็น 2025 เพื่อดูรายชื่อผู้สมัคร / ปรับปี 2027 เพื่อดูหน้า "ยังไม่เปิดเผย"
  CAMPAIGN_START: new Date('2026-01-29T08:30:00'),

  // 🟡 เวลาเริ่มเลือกตั้ง (Start Voting)
  // วิธีเทส: ปรับให้เป็น "อดีต" เพื่อให้สถานะเป็น ONGOING
  ELECTION_START: new Date('2026-02-06T08:30:00'),

  // 🔴 เวลาปิดหีบ (End Voting)
  // วิธีเทส: ปรับให้เป็น "อดีต" เพื่อให้สถานะเป็น ENDED (ดูผล)
  ELECTION_END: new Date('2026-02-06T17:00:00'),
};

export const ELECTION_YEAR = "2027";
export const ELECTION_YEAR_TH = "2570";
export const ELECTION_SLOGAN = "Your vote matter";

// ── dates-to-admin (2026-06-09) ──────────────────────────────────────────────
// Election dates can now be set by admins via globalConfig (no dev needed each
// year). This resolver returns the EFFECTIVE dates: admin-set values from
// globalConfig when present + valid, otherwise the hardcoded ELECTION_CONFIG
// defaults above (so an un-set / fresh DB behaves EXACTLY as before — no
// regression). Keys in globalConfig are ISO-ish strings from a datetime-local
// input (e.g. "2026-02-06T08:30"); blank/invalid → fall back.
//
// Importable from BOTH server (read config from DB) and client
// (read config from useGlobalConfig()) — this module has no server/client deps.
export function resolveElectionDates(globalConfig) {
  const pick = (value, fallback) => {
    if (!value) return fallback;
    const d = new Date(value);
    return isNaN(d.getTime()) ? fallback : d;
  };
  return {
    CAMPAIGN_START: pick(globalConfig?.campaignStartAt, ELECTION_CONFIG.CAMPAIGN_START),
    ELECTION_START: pick(globalConfig?.electionStartAt, ELECTION_CONFIG.ELECTION_START),
    ELECTION_END: pick(globalConfig?.electionEndAt, ELECTION_CONFIG.ELECTION_END),
  };
}

// ── Thai date/time formatters ────────────────────────────────────────────────
// So UI copy (e.g. the closed page's "election starts on …" line) derives from
// the resolved dates instead of a hardcoded string that drifts when admins move
// the schedule. Client+server safe (pure date math). With the default dates
// these render "วันที่ 6 กุมภาพันธ์ 2569" / "08.30 น." — byte-identical to the
// strings they replace.
const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export function formatThaiDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return `วันที่ ${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export function formatThaiTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}.${mm} น.`;
}