// pageRegistry.js — Metadata ของทุกหน้าที่ admin สามารถแก้ไขได้
// ใช้สำหรับ Page Selector ในแท็บ "ออกแบบหน้าเว็บ"
// icon เก็บเป็น string — PageDesignTab map ไปที่ component จริง

export const EDITABLE_PAGES = [
  {
    id: "home",
    name: "หน้าหลัก",
    nameEn: "Landing Page",
    icon: "Home",
    path: "/",
    gridLayout: "two-column",
    columns: {
      left: ["hero", "voteCTA", "meetCandidates"],
      right: ["stats", "electionBanner"],
    },
    description: "หน้าแรกของเว็บไซต์ แสดง countdown, สถิติ, ปุ่มโหวต",
  },
  {
    id: "vote",
    name: "หน้าลงคะแนน",
    nameEn: "Vote Page",
    icon: "Vote",
    path: "/vote",
    gridLayout: "single-column",
    columns: {
      main: ["header", "partyGrid", "abstainButton"],
    },
    description: "หน้าเลือกพรรค (Multi-party / Single-party)",
    hasSubModes: true,
  },
  {
    id: "results",
    name: "ผลคะแนน",
    nameEn: "Results Page",
    icon: "BarChart3",
    path: "/results",
    gridLayout: "single-column",
    columns: {
      main: ["header", "chartSection", "candidateCards", "demographics"],
    },
    description: "แสดงผลการลงคะแนนเสียงแบบ Real-time",
  },
  {
    id: "candidates",
    name: "รายชื่อผู้สมัคร",
    nameEn: "Candidates Page",
    icon: "Users",
    path: "/candidates",
    gridLayout: "single-column",
    columns: {
      main: ["header", "partyCardGrid"],
    },
    description: "แสดงรายชื่อพรรคทั้งหมดที่ลงสมัคร",
  },
  {
    id: "party",
    name: "หน้าพรรค",
    nameEn: "Party Detail",
    icon: "PartyPopper",
    path: "/party",
    gridLayout: "cinematic",
    columns: {
      main: ["hero", "vision", "policies", "gallery", "team", "voteSection"],
    },
    description: "หน้ารายละเอียดของแต่ละพรรค (Cinematic layout)",
  },
  {
    id: "success",
    name: "โหวตสำเร็จ",
    nameEn: "Success Page",
    icon: "CheckCircle",
    path: "/success",
    gridLayout: "centered",
    columns: {
      main: ["successMessage", "googleFormLink"],
    },
    description: "หน้าแสดงผลหลังโหวตเสร็จ",
  },
  {
    id: "closed",
    name: "หน้าระบบปิด",
    nameEn: "Closed",
    icon: "Lock",
    path: "/closed",
    gridLayout: "single-column",
    hasSubModes: true,
    columns: {
      main: ["closedMessage"],
    },
    description: "หน้าแสดงเมื่อระบบปิดรับลงคะแนน (waiting / ended / paused)",
  },
];

export const getPageById = (id) => EDITABLE_PAGES.find((p) => p.id === id);
export const DEFAULT_PAGE = "home";

// Friendly labels ของ section id (ใช้ใน placeholder section list)
export const SECTION_LABELS = {
  // home
  hero: "Hero (Countdown + Title)",
  voteCTA: "ปุ่มโหวต",
  meetCandidates: "Meet Candidates",
  stats: "สถิติผู้โหวต",
  electionBanner: "Election Banner",
  // vote
  header: "Header",
  partyGrid: "Party Grid",
  abstainButton: "ปุ่มงดออกเสียง",
  // results
  chartSection: "กราฟแสดงผล",
  candidateCards: "การ์ดผู้สมัคร",
  demographics: "Demographics",
  // candidates
  partyCardGrid: "Grid พรรค",
  // party
  vision: "วิสัยทัศน์",
  policies: "นโยบาย",
  gallery: "Gallery",
  team: "Team",
  voteSection: "Vote Section",
  // success
  successMessage: "ข้อความสำเร็จ",
  googleFormLink: "ลิงก์ Google Form",
  // closed
  closedMessage: "ข้อความระบบปิด",
};
