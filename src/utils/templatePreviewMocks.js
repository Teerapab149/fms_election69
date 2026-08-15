// Shared MOCK data for the read-only template gallery preview
// (/template-preview) and the interactive template playground
// (/template-playground). One source so the two can't drift apart.
//
// Shaped for the REAL layout components (richer than editorDummyData —
// members[]/policies[]/logoMeaning/groupImageUrls that the vote + party
// pages consume). Pure presentation data; never touches the database.

// real party-logo artwork (admin-uploaded style — opaque JPG, not the institutional
// FMS mark) so the preview shows what an actual party logo looks like in the disc
const PARTY_LOGOS = [
  "/images/candidates/logo/The_Unity_Concord_Of_FMS_2_1769963446319.jpg",
  "/images/candidates/logo/The_Unity_Concord_Of_FMS_2_1769902576579.jpg",
];

// Members carry BOTH image files, like real records do: imageUrl (team card) and
// modalImageUrl (the standalone portrait the member modal presents big — v2-R13).
// Every 5th member deliberately ships WITHOUT modalImageUrl so the modal's
// fallback (framed) mode stays exercisable in the harness.
export const mkMembers = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1, number: i + 1, name: `สมาชิกพรรค คนที่ ${i + 1}`,
    position: i === 0 ? "President" : i < 5 ? "Core Exec" : "Dept Head",
    imageUrl: `/images/members/party_1/${(i % 9) + 1}.jpg`,
    modalImageUrl: (i + 1) % 5 === 0 ? null : `/images/members/party_1/Modal/${(i % 6) + 1}.jpg`,
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
  logoUrl: PARTY_LOGOS[(i - 1) % PARTY_LOGOS.length], groupImageUrls: ["/images/candidates/groupimage/party1/GROUP_The_Unity_Concord_Of_FMS_2_1769963102478_0.jpg"], officialImageUrl: null, mobileHeroImage: null,
  // Long on purpose: real admins type a full essay here (the live record is ~1,500
  // characters). The preview must show what a real story does to the page — that is
  // what the StoryClamp collapse exists for.
  logoMeaning:
    "The Unity Concord of FMS 2 สะท้อนความหลากหลายของนักศึกษาที่กลับมารวมเป็นหนึ่ง เพื่อร่วมขับเคลื่อนกิจกรรมและพัฒนาสโมสรนักศึกษาคณะวิทยาการจัดการ\n" +
    "Unity คือ ความสามัคคี หมายถึงความสัมพันธ์ที่ทุกคนในหมู่คณะร่วมมือกันอย่างเข้าใจ ไม่ว่าจะมาจากสาขาใด ชั้นปีใด ทุกเสียงมีความหมายเท่ากันในการกำหนดทิศทางของสโมสรนักศึกษา\n" +
    "Concord คือ ความกลมเกลียว สื่อถึงการทำงานที่ประสานกันอย่างราบรื่น รับฟังความเห็นต่างและหาข้อสรุปร่วมกันได้ โดยยึดประโยชน์ของนักศึกษาทั้งคณะเป็นที่ตั้ง\n" +
    "สัญลักษณ์เรือใบสื่อถึงการเดินทางไปข้างหน้าด้วยกัน แม้ลมจะเปลี่ยนทิศ แต่หากทุกคนช่วยกันถือหางเสือ เราจะไปถึงจุดหมายเดียวกันได้เสมอ",
  missions: MISSIONS, policies: POLICIES, members: mkMembers(i === 1 ? 17 : 6),
  // Contact channels, stored the way the DB stores them: sanitizeSocials() has
  // already turned whatever the admin typed into canonical URLs, so the preview
  // must carry URLs too — a bare "@handle" here would render nothing and the
  // section would look broken in the gallery while working in production.
  // Party 1 fills three channels, party 2 only one: both the full row and the
  // single-chip case are on screen somewhere in the chooser. A party that fills
  // NONE gets no section at all — that path is the production default and is why
  // the admin form and the chooser caption both say so.
  socials: i === 1
    ? {
        instagram: "https://www.instagram.com/unityconcord.fms/",
        facebook: "https://www.facebook.com/unityconcord.fms",
        tiktok: "https://www.tiktok.com/@unityconcord.fms",
      }
    : { instagram: "https://www.instagram.com/samo.fms.psu/" },
});

// Party presets — index 0/1 are the canonical default pair (makeParties(2) must stay
// byte-identical to the old hardcoded PARTIES so the admin chooser slideshow never
// drifts). 2..5 extend the roster for N>2 harness testing (?parties=N). Distinct
// names/slogans/colours; preset[2] is a deliberately long name (~50 chars) to exercise
// the clamp across vote row / candidates card / results row / confirm bar.
const PARTY_PRESETS = [
  { name: "The Unity Concord Of FMS 2", slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน", color: "#2D6CDF" },
  { name: "พรรคก้าวไกลวิทยาการจัดการ", slogan: "นโยบายเด่น มุ่งมั่น โปร่งใส เพื่อชาว FMS", color: "#E0457B" },
  { name: "พรรคพลังนักศึกษาวิทยาการจัดการเพื่อการพัฒนาที่ยั่งยืน", slogan: "รวมพลังทุกสาขา สร้างการเปลี่ยนแปลงที่จับต้องได้จริง", color: "#F59E0B" },
  { name: "พรรคใจอาสา", slogan: "เสียงของนักศึกษา คือหัวใจของการทำงาน", color: "#10B981" },
  { name: "พรรคเดินหน้า FMS", slogan: "โปร่งใส ตรวจสอบได้ ทุกงบประมาณกิจกรรม", color: "#8B5CF6" },
  { name: "พรรคนวัตกรรมรุ่นใหม่", slogan: "เทคโนโลยีเพื่อชีวิตนักศึกษาที่ดีกว่าเดิม", color: "#EF4444" },
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
