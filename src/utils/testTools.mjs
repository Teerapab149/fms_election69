// Pure helpers for the admin test tools (api/admin/test-tools). No imports, so
// node:test loads it directly (scripts/smoke/testTools.test.mjs).
//
// The tools can wipe ballots and parties, so they exist only on a machine whose
// SERVER environment says so. Read on the server only: never a NEXT_PUBLIC_
// variable, which would be baked into the browser bundle at build time and
// report the machine that built the app instead of the one that is running.

export function isTestToolsEnabled(env = process.env) {
  return env?.ADMIN_TEST_TOOLS === "1";
}

// Every test student gets a studentId starting with this. A real PSU student id
// starts with the entry year (67, 68...), so 99 can never collide with one, and
// CLEAR_TEST_VOTERS deletes by this prefix and nothing else.
export const TEST_VOTER_PREFIX = "99";

export const MAJORS = [
  "การเงินและการลงทุน",
  "การตลาด",
  "บัญชี",
  "ระบบสารสนเทศทางธุรกิจ",
  "รัฐประศาสนศาสตร์",
  "การจัดการโลจิสติกส์และโซ่อุปทาน",
];

const pad = (n, w) => String(n).padStart(w, "0");

// sort keys, same values as getPositionNumber in api/admin/candidates/route.js
const SAMPLE_POSITIONS = [
  { position: "นายกสโมสรนักศึกษา", number: 1 },
  { position: "อุปนายกฝ่ายกิจการภายใน", number: 201 },
  { position: "อุปนายกฝ่ายกิจการภายนอก", number: 202 },
  { position: "เลขานุการ", number: 301 },
  { position: "เหรัญญิก", number: 302 },
  { position: "ประธานฝ่ายประชาสัมพันธ์", number: 400 },
  { position: "ประธานฝ่ายวิชาการ", number: 400 },
  { position: "ประธานฝ่ายกิจกรรม", number: 400 },
];

const PARTY_COLORS = ["#8A2680", "#2563EB"];

// the smallest positive numbers not already taken, `count` of them
export function nextFreePartyNumbers(existingNumbers, count) {
  const taken = new Set((existingNumbers || []).map(Number));
  const out = [];
  for (let n = 1; out.length < count; n += 1) if (!taken.has(n)) out.push(n);
  return out;
}

// data for tx.candidate.create, members nested
export function buildSampleParty(number, index = 0) {
  return {
    name: `ตัวอย่าง พรรคที่ ${number}`,
    number,
    slogan: "ข้อมูลตัวอย่างสำหรับทดสอบระบบ",
    color: PARTY_COLORS[index % PARTY_COLORS.length],
    logoMeaning: "พรรคตัวอย่างที่ระบบสร้างขึ้นเพื่อทดสอบหน้าจอ ไม่ใช่ผู้สมัครจริง",
    missions: [
      "ทดสอบการแสดงผลพันธกิจของพรรค",
      "ทดสอบการแสดงผลข้อความหลายบรรทัด",
      "ทดสอบการเรียงลำดับสมาชิกตามตำแหน่ง",
    ],
    policies: [
      { title: "นโยบายตัวอย่างที่ 1", desc: "รายละเอียดนโยบายตัวอย่างสำหรับทดสอบการแสดงผล" },
      { title: "นโยบายตัวอย่างที่ 2", desc: "รายละเอียดนโยบายตัวอย่างสำหรับทดสอบการแสดงผล" },
      { title: "นโยบายตัวอย่างที่ 3", desc: "รายละเอียดนโยบายตัวอย่างสำหรับทดสอบการแสดงผล" },
      { title: "นโยบายตัวอย่างที่ 4", desc: "รายละเอียดนโยบายตัวอย่างสำหรับทดสอบการแสดงผล" },
    ],
    groupImageUrls: [],
    mobileHeroImage: [],
    score: 0,
    members: SAMPLE_POSITIONS.map((p, i) => ({
      studentId: `${TEST_VOTER_PREFIX}${pad(number, 2)}${pad(i + 1, 6)}`,
      name: `สมาชิกตัวอย่าง ${number}.${i + 1}`,
      position: p.position,
      number: p.number,
      major: MAJORS[i % MAJORS.length],
      imageUrl: "",
    })),
  };
}

// data for tx.user.createMany. Years 1-4 in turn, one in four with no gender so
// the "ไม่ระบุ" row of the turnout charts has something to show.
export function buildSampleVoters(count = 24) {
  const years = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];
  const genders = ["ชาย", "หญิง", "ชาย", null];
  return Array.from({ length: count }, (_, i) => ({
    studentId: `${TEST_VOTER_PREFIX}${pad(i + 1, 8)}`,
    name: `นักศึกษาทดสอบ ${pad(i + 1, 2)}`,
    role: "student",
    year: years[i % 4],
    major: MAJORS[i % MAJORS.length],
    gender: genders[i % 4],
  }));
}

// A database account that may not delete ballots (fms_app, by design) answers
// with a permission error; that is an expected refusal, not a crash.
export function isPermissionError(e) {
  const msg = String(e?.message || "");
  return e?.code === "42501" || e?.meta?.code === "42501" || /permission denied|must be owner|insufficient privilege/i.test(msg);
}
