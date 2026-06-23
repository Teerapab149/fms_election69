// Shared MOCK data for the read-only template gallery preview
// (/template-preview) and the interactive template playground
// (/template-playground). One source so the two can't drift apart.
//
// Shaped for the REAL layout components (richer than editorDummyData —
// members[]/policies[]/logoMeaning/groupImageUrls that the vote + party
// pages consume). Pure presentation data; never touches the database.

const LOGO = "/images/logo/fms_logo50_color.png";

export const mkMembers = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1, number: i + 1, name: `สมาชิกพรรค คนที่ ${i + 1}`,
    position: i === 0 ? "President" : i < 5 ? "Core Exec" : "Dept Head",
    imageUrl: `/images/members/party_1/${(i % 9) + 1}.jpg`,
  }));

export const POLICIES = [
  "ยกระดับโครงการรับน้องและกิจกรรมเปิดใหม่ ให้สะท้อนความหลากหลายของนักศึกษาในศตวรรษที่ 21",
  "ส่งเสริมกิจกรรมความหลากหลาย เปิดโอกาสให้นักศึกษามีส่วนร่วม และเสริมสร้างศักยภาพผ่านชมรม",
  "เปิดพื้นที่พบปะแลกเปลี่ยน เพื่อนำพาเยาวชนสู่อนาคตที่สดใสและเข้าใจซึ่งกันและกัน",
  "สร้างเวทีสำหรับคนรุ่นใหม่ เพื่อความหลากหลายทางความคิด ให้เกิดการพัฒนาในทุกกิจกรรม",
];

export const MISSIONS = [
  "รวมพลังความหลากหลายของนักศึกษาให้เป็นหนึ่งเดียว เพื่อขับเคลื่อนสโมสรนักศึกษา",
  "สร้างความเปลี่ยนแปลงที่ยั่งยืนให้แก่คณะวิทยาการจัดการ รุ่นที่ 50",
];

export const mkParty = (i, name, slogan, color) => ({
  id: i, number: i, name, slogan, color,
  logoUrl: LOGO, groupImageUrls: ["/images/candidates/groupimage/party1/GROUP_The_Unity_Concord_Of_FMS_2_1769963102478_0.jpg"], officialImageUrl: null, mobileHeroImage: null,
  logoMeaning:
    "The Unity Concord of FMS 2 สะท้อนความหลากหลายของนักศึกษาที่กลับมารวมเป็นหนึ่ง เพื่อร่วมขับเคลื่อนกิจกรรมและพัฒนาสโมสรนักศึกษาคณะวิทยาการจัดการ",
  missions: MISSIONS, policies: POLICIES, members: mkMembers(i === 1 ? 17 : 6),
});

export const PARTIES = [
  mkParty(1, "The Unity Concord Of FMS 2", "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน", "#2D6CDF"),
  mkParty(2, "พรรคก้าวไกลวิทยาการจัดการ", "นโยบายเด่น มุ่งมั่น โปร่งใส เพื่อชาว FMS", "#E0457B"),
];

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

// results candidates: revealed shows real scores; locked = all 0 (embargo)
export const resultsCandidates = (revealed) => [
  { ...PARTIES[0], score: revealed ? 312 : 0 },
  { ...PARTIES[1], score: revealed ? 245 : 0 },
  { id: 998, number: 0, name: "งดออกเสียง", score: revealed ? 68 : 0 },
];
