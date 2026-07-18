// ตั้งค่าเวลาทั้งหมดที่นี่ที่เดียว!
// ⚠️ TIMEZONE (ADM-2): เวลาการเลือกตั้ง = Asia/Bangkok (+07:00) เสมอ. ต้องเขียน
// offset "+07:00" ให้ชัด — ห้ามใช้ string เปล่า (เช่น '...T08:30:00') เพราะ JS
// จะ parse เป็น "local time" ของเครื่อง → บน Docker/host ที่ TZ=UTC จะเลื่อน +7 ชม.
// (เปิด 08:30 ไทย กลายเป็น 15:30) ซึ่งเป็นต้นตอ "ระบบไม่เปิดตามเวลา" ปีก่อน.
export const ELECTION_CONFIG = {
  // 🟢 เวลาเปิดตัวผู้สมัคร (Campaign Start)
  // วิธีเทส: ปรับปีเป็น 2025 เพื่อดูรายชื่อผู้สมัคร / ปรับปี 2027 เพื่อดูหน้า "ยังไม่เปิดเผย"
  CAMPAIGN_START: new Date('2026-01-29T08:30:00+07:00'),

  // 🟡 เวลาเริ่มเลือกตั้ง (Start Voting)
  // วิธีเทส: ปรับให้เป็น "อดีต" เพื่อให้สถานะเป็น ONGOING
  ELECTION_START: new Date('2026-02-06T08:30:00+07:00'),

  // 🔴 เวลาปิดหีบ (End Voting)
  // วิธีเทส: ปรับให้เป็น "อดีต" เพื่อให้สถานะเป็น ENDED (ดูผล)
  ELECTION_END: new Date('2026-02-06T17:00:00+07:00'),
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
// parseBangkok — parse a datetime-local string ("YYYY-MM-DDTHH:mm", optionally
// with ":ss") as Asia/Bangkok (+07:00) time, regardless of the host TZ. This is
// the single point that pins admin-entered election times to Bangkok so a
// Docker host running in UTC resolves the SAME absolute instant as a Thai host.
// Any pre-existing offset/zone in the input is IGNORED — election times are
// Bangkok by definition (ADM-2). Invalid / blank → null so pick() falls back.
export function parseBangkok(value) {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const [, Y, Mo, D, H, Mi, S] = m;
  const d = new Date(`${Y}-${Mo}-${D}T${H}:${Mi}:${S ?? "00"}+07:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function resolveElectionDates(globalConfig) {
  const pick = (value, fallback) => parseBangkok(value) ?? fallback;
  const resolved = {
    CAMPAIGN_START: pick(globalConfig?.campaignStartAt, ELECTION_CONFIG.CAMPAIGN_START),
    ELECTION_START: pick(globalConfig?.electionStartAt, ELECTION_CONFIG.ELECTION_START),
    ELECTION_END: pick(globalConfig?.electionEndAt, ELECTION_CONFIG.ELECTION_END),
  };
  // T2 (ADM-2) — guard the config-corruption case seen in dev DB (end before
  // start). Warn server-side only (no client console spam) and DO NOT throw:
  // the system must stay up. Full validation UI is ADM-1's job.
  if (typeof window === "undefined" && resolved.ELECTION_END <= resolved.ELECTION_START) {
    console.warn(
      `[electionConfig] Inverted election schedule: ELECTION_END (${resolved.ELECTION_END.toISOString()}) <= ELECTION_START (${resolved.ELECTION_START.toISOString()}). Check globalConfig electionStartAt/electionEndAt.`
    );
  }
  return resolved;
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

// bangkokParts — read the calendar/clock fields of a date AS SEEN in Asia/Bangkok,
// independent of the host TZ. On a Thai host this equals getDate()/getHours()/…
// (byte-identical to the old formatters); on a UTC host it still yields Bangkok
// wall-clock instead of the host's shifted local time (ADM-2 display fix).
function bangkokParts(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const p = {};
  for (const part of dtf.formatToParts(d)) p[part.type] = part.value;
  return {
    day: Number(p.day),            // no leading zero — matches old getDate()
    month: Number(p.month) - 1,    // 0-indexed — matches old getMonth()
    year: Number(p.year),
    hh: p.hour,                    // 2-digit "08".."23" — matches padStart(2)
    mm: p.minute,                  // 2-digit
  };
}

export function formatThaiDate(date) {
  const p = bangkokParts(date);
  if (!p) return "";
  return `วันที่ ${p.day} ${TH_MONTHS[p.month]} ${p.year + 543}`;
}

export function formatThaiTime(date) {
  const p = bangkokParts(date);
  if (!p) return "";
  return `${p.hh}.${p.mm} น.`;
}