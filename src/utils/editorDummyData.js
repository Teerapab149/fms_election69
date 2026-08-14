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
    name: "พรรคก้าวไกลวิทยาการจัดการ",
    slogan: "นโยบายเด่น มุ่งมั่น โปร่งใส เพื่อชาว FMS",
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
  studentId: "6610510149",
  // v2-R4a: identity-receipt fields (success shows the voter's own profile).
  // Additive — templates that only read name/studentId ignore these.
  major: "สาขาวิชาการตลาด",
  year: "ปี 3",
  votedAt: "2026-02-06T03:24:07.000Z"
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

// The party's CASE, in the shape /api/party actually returns it — logoMeaning
// as newline-separated paragraphs, policies as {title, desc}, missions as
// strings, members as rows with position/major/studentId.
//
// The older DUMMY_PARTY above keeps its own shape (vision / policies-as-strings
// / team-with-role) because the classic editor elements read it that way; this
// block is what the template families read. Without it a single-party ballot
// preview renders its frame around nothing, which is the exact failure P-LOG-004
// is about: an editor preview that does not show what the real page shows.
const DUMMY_CASE = {
  logoMeaning:
    "The Unity Concord of FMS สะท้อนถึงความสำคัญของการรวมตัวกันเป็นหนึ่งเดียวในหมู่คณะ เพื่อสร้างความร่วมมือที่มีประสิทธิภาพในการดำเนินกิจกรรมและโครงการเพื่อประโยชน์ส่วนรวม\n" +
    "Unity คือ ความสามัคคี ทุกคนในหมู่คณะมีเป้าหมายร่วมกัน ไม่ว่าจะมาจากสาขาใดหรือชั้นปีใด ทุกเสียงมีความหมายเท่ากันในการกำหนดทิศทางของสโมสรนักศึกษา\n" +
    "Concord คือ ความปรองดอง การทำงานที่ประสานกัน รับฟังความเห็นต่าง และหาข้อสรุปร่วมกันได้ โดยยึดประโยชน์ของนักศึกษาทั้งคณะเป็นที่ตั้ง",
  missions: [
    "รวมพลังความหลากหลายของนักศึกษาให้เป็นหนึ่งเดียว เพื่อขับเคลื่อนสโมสรนักศึกษา",
    "สร้างความเปลี่ยนแปลงที่ยั่งยืนให้แก่คณะวิทยาการจัดการ",
  ],
  policies: [
    { title: "ยกระดับและพัฒนาโครงการ", desc: "ยกระดับโครงการรับน้องและกิจกรรมเดิม พร้อมเปิดโครงการใหม่ให้สอดคล้องกับความสนใจของนักศึกษาในปัจจุบัน" },
    { title: "ส่งเสริมความหลากหลาย", desc: "เปิดโอกาสให้นักศึกษาทุกสาขาและทุกชั้นปีมีส่วนร่วมในกิจกรรมของคณะอย่างเท่าเทียม" },
    { title: "พื้นที่พบปะแลกเปลี่ยน", desc: "จัดพื้นที่ให้นักศึกษาได้แลกเปลี่ยนความคิดเห็นและต่อยอดความร่วมมือระหว่างสาขา" },
    { title: "เวทีของคนรุ่นใหม่", desc: "สร้างเวทีสำหรับคนรุ่นใหม่ที่อยากลงมือทำ ให้เกิดการพัฒนาอย่างต่อเนื่องและยั่งยืน" },
  ],
  // imageUrl null on purpose: the previews fall back to their placeholder mark
  // rather than showing photographs of people who are not standing this year.
  members: [
    { id: 901, studentId: "6710517152", name: "สมิตานันท์ ธรณสุนทร", position: "นายกสโมสรนักศึกษา", major: "บัญชี", imageUrl: null },
    { id: 902, studentId: "6710515096", name: "สุภัคกานต์ สุทธิพันธ์", position: "อุปนายกฝ่ายกิจการภายใน", major: "รัฐประศาสนศาสตร์", imageUrl: null },
    { id: 903, studentId: "6710515043", name: "นันทณัฐ หัสชัย", position: "อุปนายกฝ่ายกิจการภายนอก", major: "รัฐประศาสนศาสตร์", imageUrl: null },
    { id: 904, studentId: "6810510535", name: "พิรญาณ์ โกกิละวาที", position: "เลขานุการ", major: "การตลาด", imageUrl: null },
    { id: 905, studentId: "6710517051", name: "ธนกร แก้วมณี", position: "เหรัญญิก", major: "บัญชี", imageUrl: null },
    { id: 906, studentId: "6810510487", name: "อิดริส หมัดตะพงศ์", position: "ประธานฝ่ายประชาสัมพันธ์", major: "ระบบสารสนเทศทางธุรกิจ", imageUrl: null },
  ],
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
    color: "#8A2680",
    ...DUMMY_CASE,
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
    color: "#8A2680",
    ...DUMMY_CASE,
  },
  {
    id: 2,
    number: 2,
    name: "พรรคก้าวไกลวิทยาการจัดการ",
    slogan: "นโยบายเด่น มุ่งมั่น โปร่งใส เพื่อชาว FMS",
    logoUrl: "/images/logo/fms_logo50_color.png",
    groupImageUrl: "/images/logo/fms_logo50_color.png",
    voteCount: 187,
    color: "#2563EB",
    ...DUMMY_CASE,
    // a deliberately different size — several previews print "ทีมงาน N คน" on
    // each row, and two identical counts hide whether that number is wired
    members: DUMMY_CASE.members.slice(0, 4),
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
    name: "พรรคก้าวไกลวิทยาการจัดการ",
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
