// Dummy data for editor preview mode. Matches real API response shapes.
// Update these when the underlying data model changes.

export const DUMMY_ELECTION = {
  title: "SAMO 49",
  subtitle: "โครงการเลือกตั้งคณะกรรมการบริหาร",
  subtitle2: "สโมสรนักศึกษาคณะวิทยาการจัดการ",
  year: 2569,
  endDate: "2027-01-01T00:00:00Z",
  status: "UPCOMING",
  totalVoted: 342,
  totalEligible: 1200,
  percentageVoted: 28.50
};

export const DUMMY_PARTIES = [
  {
    id: 1,
    number: 1,
    name: "The Unity Concord Of FMS 2",
    slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน",
    logoUrl: "/images/logo/fms_logo50_color.png",
    groupImageUrl: "/images/logo/fms_logo50_color.png",
    voteCount: 245,
    color: "#8A2680"
  },
  {
    id: 2,
    number: 2,
    name: "อะไรไม่รู้ครับ",
    slogan: "หกด",
    logoUrl: "/images/logo/fms_logo50_color.png",
    groupImageUrl: "/images/logo/fms_logo50_color.png",
    voteCount: 187,
    color: "#2563EB"
  }
];

export const DUMMY_ABSTAIN = {
  id: 998,
  number: 0,
  name: "งดออกเสียง",
  voteCount: 68
};

export const DUMMY_USER = {
  name: "Teerapab Boonsri",
  studentId: "6610510149"
};

export const DUMMY_PARTY_DETAIL = {
  id: 1,
  number: 1,
  name: "The Unity Concord Of FMS 2",
  slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน",
  logoUrl: null,
  groupImageUrl: null,
  vision: "The Unity Concord of FMS สะท้อนถึงความสำคัญของการรวมตัวกันเป็นหนึ่งเดียวกันในหมู่คณะ เพื่อสร้างความร่วมมือที่มีประสิทธิภาพในการดำเนินกิจกรรมหรือโครงการต่างๆ เพื่อประโยชน์ส่วนรวม",
  policies: [
    "บูรณาการเสริมสร้างองค์ความรู้และพัฒนาเพื่อยกระดับทักษะด้านวิชาชีพรวมถึงกิจกรรมต่างๆ",
    "มุ่งเน้นการสร้างสังคมที่มีความเป็นหนึ่งเดียวจากความหลากหลายและการเคารพสิทธิเพื่อการอยู่ร่วมกันอย่างสันติ",
    "เปิดโอกาสในการแสดงศักยภาพและความสามารถในทุกด้านเพื่อพัฒนาทรัพยากรบุคคลให้เกิดประโยชน์สูงสุด"
  ],
  team: [
    { name: "สมิตานันท์ ธรณสุนทร", role: "นายกสโมสรนักศึกษา", imageUrl: null },
    { name: "สุภัคกานต์ สุทธิพันธ์", role: "อุปนายกฝ่ายกิจการภายใน", imageUrl: null },
    { name: "นันทณัฐ หัสชัย", role: "อุปนายกฝ่ายกิจการภายนอก", imageUrl: null }
  ]
};

// Single party scenario — one party with approve/disapprove choice
export const DUMMY_PARTIES_SINGLE = [
  {
    id: 1,
    number: 1,
    name: "The Unity Concord Of FMS 2",
    slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน",
    logoUrl: "/images/logo/fms_logo50_color.png",
    groupImageUrl: "/images/logo/fms_logo50_color.png",
    voteCount: 245,
    color: "#8A2680"
  }
];

// Alias for clarity when using multi-party mode
export const DUMMY_PARTIES_MULTI = [
  {
    id: 1,
    number: 1,
    name: "The Unity Concord Of FMS 2",
    slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน",
    logoUrl: "/images/logo/fms_logo50_color.png",
    groupImageUrl: "/images/logo/fms_logo50_color.png",
    voteCount: 245,
    color: "#8A2680"
  },
  {
    id: 2,
    number: 2,
    name: "อะไรไม่รู้ครับ",
    slogan: "หกด",
    logoUrl: "/images/logo/fms_logo50_color.png",
    groupImageUrl: "/images/logo/fms_logo50_color.png",
    voteCount: 187,
    color: "#2563EB"
  }
];

// Special options (abstain, disapprove)
export const DUMMY_SPECIAL_OPTIONS = {
  abstain: { id: 998, number: 0, name: "งดออกเสียง", voteCount: 68 },
  disapprove: { id: 999, number: -1, name: "ไม่รับรอง", voteCount: 12 }
};

// =====================================================
// RESULTS PAGE DEMO DATA
// =====================================================
// Used in admin editor preview for Results page.
// ResultCard expects: { id, name, number, score, image?, logoUrl? }

// Multi-party scenario: 2 parties + abstain (NO disapprove in multi)
export const DUMMY_RESULTS_MULTI = [
  {
    id: 1,
    name: "The Unity Concord Of FMS 2",
    number: 1,
    score: 245,
    image: null,
    logoUrl: null
  },
  {
    id: 2,
    name: "อะไรไม่รู้ครับ",
    number: 2,
    score: 187,
    image: null,
    logoUrl: null
  },
  {
    id: 998,
    name: "งดออกเสียง",
    number: 0,
    score: 68,
    image: null,
    logoUrl: null
  }
];

// Single-party scenario: 1 party + abstain + disapprove (HAS disapprove)
export const DUMMY_RESULTS_SINGLE = [
  {
    id: 1,
    name: "The Unity Concord Of FMS 2",
    number: 1,
    score: 312,
    image: null,
    logoUrl: null
  },
  {
    id: 998,
    name: "งดออกเสียง",
    number: 0,
    score: 95,
    image: null,
    logoUrl: null
  },
  {
    id: 999,
    name: "ไม่รับรอง",
    number: -1,
    score: 43,
    image: null,
    logoUrl: null
  }
];

// Total votes for percentage calc
export const DUMMY_RESULTS_TOTALS = {
  multi: 500,
  single: 450
};

// Demographics demo data for ResultsEditorPreview
export const DUMMY_RESULTS_DEMOGRAPHICS = {
  totalEligible: 1200,
  byMajor: [
    { name: "บัญชี", value: 142 },
    { name: "การเงิน", value: 98 },
    { name: "การจัดการ", value: 87 },
    { name: "การตลาด", value: 73 },
    { name: "ระบบสารสนเทศ", value: 56 },
    { name: "การจัดการโลจิสติกส์", value: 44 }
  ],
  byYear: [
    { name: "ปี 1", value: 145 },
    { name: "ปี 2", value: 132 },
    { name: "ปี 3", value: 118 },
    { name: "ปี 4", value: 105 }
  ],
  byGender: [
    { name: "Male", value: 234 },
    { name: "Female", value: 266 }
  ]
};
