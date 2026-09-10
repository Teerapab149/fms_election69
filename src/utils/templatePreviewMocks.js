// Shared MOCK data for the read-only template gallery preview
// (/template-preview) and the interactive template playground
// (/template-playground). One source so the two can't drift apart.
//
// Shaped for the REAL layout components (richer than editorDummyData —
// members[]/policies[]/logoMeaning/groupImageUrls that the vote + party
// pages consume). Pure presentation data; never touches the database.

// Original fictional assets live outside all upload directories.
const ROOT = "/images/template-preview";
const PARTY_LOGOS = [ROOT + "/logo-1.svg", ROOT + "/logo-2.svg"];
const POSITIONS = ["นายกสโมสรนักศึกษา", "อุปนายกฝ่ายกิจการภายใน", "อุปนายกฝ่ายกิจการภายนอก", "เลขานุการ", "เหรัญญิก", "ฝ่ายวิชาการ", "ฝ่ายประชาสัมพันธ์", "ฝ่ายกิจกรรม", "ฝ่ายกีฬา", "ฝ่ายสวัสดิการ"];
export const mkMembers = (n = 20) =>
  Array.from({ length: Math.max(20, n) }, (_, i) => ({
    id: i + 1, number: i + 1, name: `สมาชิกตัวอย่าง ${String(i + 1).padStart(2, "0")}`,
    studentId: `DEMO-${String(i + 1).padStart(2, "0")}`,
    major: ["การบัญชี", "การตลาด", "ระบบสารสนเทศทางธุรกิจ", "การจัดการ"][i % 4],
    position: i < POSITIONS.length ? POSITIONS[i] : `คณะทำงาน${POSITIONS[5 + (i % 5)]}`,
    imageUrl: `${ROOT}/member-${String(i % 20 + 1).padStart(2, "0")}.svg`,
    modalImageUrl: `${ROOT}/member-${String(i % 20 + 1).padStart(2, "0")}.svg`,
  }));

// Shaped like the REAL record: each policy is a { title, desc } object (the live DB
// stores policies this way — see candidate 1). Families that only show a headline read
// the title via asText(); party/single surfaces that present the full policy render the
// desc too. Kept as objects so the preview exercises the same render path as production.
export const POLICIES = [
  { title: "ยกระดับและพัฒนาโครงการ", desc: "ยกระดับโครงการรับน้องและกิจกรรมเปิดใหม่ ให้สะท้อนความหลากหลายของนักศึกษาในศตวรรษที่ 21 และเปิดพื้นที่การเรียนรู้ที่ทันสมัย" },
  { title: "ส่งเสริมความหลากหลาย", desc: "ส่งเสริมกิจกรรมความหลากหลาย เปิดโอกาสให้นักศึกษามีส่วนร่วม และเสริมสร้างศักยภาพผ่านชมรมและเครือข่ายกิจกรรมของคณะ" },
  { title: "พื้นที่พบปะแลกเปลี่ยน", desc: "เปิดพื้นที่พบปะแลกเปลี่ยนความคิด เพื่อนำพาเยาวชนสู่อนาคตที่สดใส เข้าใจซึ่งกันและกัน และต่อยอดความร่วมมือระหว่างสาขา" },
  { title: "เวทีของคนรุ่นใหม่", desc: "สร้างเวทีสำหรับคนรุ่นใหม่ เพื่อความหลากหลายทางความคิด ให้เกิดการพัฒนาในทุกกิจกรรมอย่างต่อเนื่องและยั่งยืน" },
];

export const MISSIONS = [
  "รวมพลังความหลากหลายของนักศึกษาให้เป็นหนึ่งเดียว เพื่อขับเคลื่อนสโมสรนักศึกษา",
  "สร้างความเปลี่ยนแปลงที่ยั่งยืนให้แก่คณะวิทยาการจัดการ รุ่นที่ 50",
];

export const mkParty = (i, name, slogan, color) => ({
  id: i, number: i, name, slogan, color,
  logoUrl: PARTY_LOGOS[(i - 1) % PARTY_LOGOS.length], groupImageUrls: [1, 2, 3].map(n => `${ROOT}/gallery-${n}.svg`), officialImageUrl: `${ROOT}/gallery-1.svg`, mobileHeroImage: [`${ROOT}/gallery-1.svg`],
  // Long on purpose: real admins type a full essay here (the live record is ~1,500
  // characters). The preview must show what a real story does to the page — that is
  // what the StoryClamp collapse exists for.
  logoMeaning:
    "ข้อมูลสมมติสำหรับแสดงตัวอย่าง template เท่านั้น ไม่ใช่พรรคที่ลงสมัครจริง\n" +
    "รูปทรงที่เชื่อมต่อกันสื่อถึงความร่วมมือของนักศึกษาที่มีความถนัดแตกต่างกัน แต่พร้อมเรียนรู้และพัฒนาไปด้วยกัน ทุกส่วนมีพื้นที่และความสำคัญของตนเอง\n" +
    "พื้นที่ว่างระหว่างรูปทรงแทนการเปิดรับแนวคิดใหม่และการรับฟังอย่างเคารพ สีที่แตกต่างสะท้อนความหลากหลาย ขณะที่ภาพรวมแสดงถึงจุดหมายร่วมกัน\n" +
    "องค์ประกอบเหล่านี้เป็นตัวอย่างสำหรับตรวจสอบการจัดวางข้อความและภาพ ไม่มีความเกี่ยวข้องกับพรรคหรือบุคคลจริง",
  missions: [...MISSIONS], policies: POLICIES.map(p => ({ ...p })), members: mkMembers(20),
  // Reserved domain: preview links never point to a real social account.
  socials: {
    instagram: `https://preview.invalid/instagram/party-${i}`,
    facebook: `https://preview.invalid/facebook/party-${i}`,
    tiktok: `https://preview.invalid/tiktok/party-${i}`,
    website: `https://preview.invalid/party-${i}`,
  },
});

// Fictional party presets shared across preview surfaces.
const PARTY_PRESETS = [
  { name: "พรรคตัวอย่าง ร่วมสร้าง", slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน", color: "#2D6CDF" },
  { name: "พรรคตัวอย่าง เปิดฟ้า", slogan: "นโยบายเด่น มุ่งมั่น โปร่งใส เพื่อชาว FMS", color: "#E0457B" },
  { name: "พรรคตัวอย่าง พลังนักศึกษาวิทยาการจัดการเพื่อการพัฒนาที่ยั่งยืน", slogan: "รวมพลังทุกสาขา สร้างการเปลี่ยนแปลงที่จับต้องได้จริง", color: "#F59E0B" },
  { name: "พรรคตัวอย่าง ใจอาสา", slogan: "เสียงของนักศึกษา คือหัวใจของการทำงาน", color: "#10B981" },
  { name: "พรรคตัวอย่าง เดินหน้า FMS", slogan: "โปร่งใส ตรวจสอบได้ ทุกงบประมาณกิจกรรม", color: "#8B5CF6" },
  { name: "พรรคตัวอย่าง นวัตกรรมรุ่นใหม่", slogan: "เทคโนโลยีเพื่อชีวิตนักศึกษาที่ดีกว่าเดิม", color: "#EF4444" },
];

// makeParties(n) — n parties (n clamped by the caller). preset[i % len] cycles if a
// caller ever exceeds the preset count; the harness caps n at 6 (= preset count).
export const makeParties = (n) =>
  Array.from({ length: n }, (_, i) => {
    const p = PARTY_PRESETS[i % PARTY_PRESETS.length];
    return mkParty(i + 1, p.name, p.slogan, p.color);
  });

export const PARTIES = makeParties(2);

export const SPECIAL = {
  abstain: { id: 998, number: 0, name: "งดออกเสียง" },
  disapprove: { id: 999, number: -1, name: "ไม่รับรอง" },
};

export const DEMOGRAPHICS = {
  totalEligible: 2004,
  byYear: [
    { name: "ปี 1", value: 145 }, { name: "ปี 2", value: 132 },
    { name: "ปี 3", value: 118 }, { name: "ปี 4", value: 105 },
  ],
  byGender: [{ name: "หญิง", value: 266 }, { name: "ชาย", value: 234 }],
  byMajor: [
    { name: "บัญชี", value: 142 }, { name: "การเงิน", value: 98 },
    { name: "การจัดการ", value: 87 }, { name: "การตลาด", value: 73 },
    { name: "ระบบสารสนเทศ", value: 56 },
  ],
};

// results candidates: revealed shows real scores; locked = all 0 (embargo).
// Scores are a distinct descending ramp with a clear winner (preset[0]); scales with
// the party count so ?parties=N produces a coherent standings board (abstain stays
// last, id 998). N=2 → 312/245 + abstain 68 = byte-identical to the old default.
const RESULT_SCORES = [312, 245, 189, 143, 96, 58];
export const resultsCandidates = (revealed, parties = PARTIES) => [
  ...parties.map((p, i) => ({
    ...p,
    score: revealed ? (RESULT_SCORES[i] ?? Math.max(20, 300 - i * 55)) : 0,
  })),
  { id: 998, number: 0, name: "งดออกเสียง", score: revealed ? 68 : 0 },
];
