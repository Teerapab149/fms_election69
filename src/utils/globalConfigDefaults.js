/**
 * Default values for global config — used when DB is empty or as fallback.
 * Field metadata describes UI grouping + labels for admin tab.
 */

export const GLOBAL_CONFIG_DEFAULTS = {
  // Election identity
  electionName: "SAMO 49",
  electionNamePrefix: "SAMO",
  electionNumber: 49,

  // Project / committee titles
  campaignTitle: "โครงการเลือกตั้งคณะกรรมการบริหาร",
  committeeName: "คณะกรรมการบริหาร",
  organizationName: "สโมสรนักศึกษาคณะวิทยาการจัดการ",
  organizationShort: "สโมสรนักศึกษา",

  // Faculty / institution
  facultyName: "คณะวิทยาการจัดการ",
  facultyShortEn: "FMS",
  university: "PSU",

  // Academic year (Thai BE)
  academicYearTh: 2569,

  // Calendar years
  electionCalendarYear: 2026,
  copyrightYear: 2026,
};

/**
 * Field metadata for admin form. Groups + labels.
 *
 * Optional UI-only keys (read defensively by GlobalConfigTab — absence is safe,
 * never affects saved data): `icon` (lucide name for the section header),
 * `desc` (one-line section subtitle), `preview` (id → live composed-output chip
 * row rendered by the tab), and per-field `col` ("full" spans both grid columns;
 * default "half" pairs short fields side by side).
 */
export const GLOBAL_CONFIG_FIELDS = [
  {
    group: "ข้อมูลการเลือกตั้ง",
    icon: "Vote",
    desc: "ชื่อและปีของการเลือกตั้งครั้งนี้",
    preview: "election",
    fields: [
      { key: "electionNamePrefix", label: "ชื่อย่อ", type: "text", col: "half", hint: "ตัวอักษรนำหน้า เช่น SAMO" },
      { key: "electionNumber", label: "เลขครั้งที่", type: "number", col: "half", hint: "ครั้งที่จัด เช่น 50 — รวมกับชื่อย่อเป็นป้าย “SAMO 50” อัตโนมัติ" },
      { key: "academicYearTh", label: "ปีการศึกษา (พ.ศ.)", type: "number", col: "half", hint: "แบบ พ.ศ. เช่น 2570" },
      { key: "electionCalendarYear", label: "ปีการเลือกตั้ง (ค.ศ.)", type: "number", col: "half", hint: "แบบ ค.ศ. เช่น 2027" },
    ],
  },
  {
    group: "ชื่อโครงการและองค์กร",
    icon: "Building2",
    desc: "ชื่อโครงการ องค์กร คณะ และมหาวิทยาลัย — เรียงตามลำดับที่ประกอบขึ้นเป็นบล็อกบนหน้าเว็บ",
    preview: "org",
    fields: [
      { key: "campaignTitle", label: "ชื่อโครงการ", type: "text", multiline: true, col: "full", hint: "เช่น โครงการเลือกตั้งคณะกรรมการบริหาร · กด Enter เพื่อขึ้นบรรทัดใหม่เอง" },
      { key: "committeeName", label: "ชื่อคณะกรรมการ", type: "text", col: "full", hint: "เช่น คณะกรรมการบริหาร — ใช้ในวลี “โครงการเลือกตั้ง…”" },
      { key: "organizationName", label: "ชื่อองค์กร (เต็ม)", type: "text", col: "full", hint: "เช่น สโมสรนักศึกษาคณะวิทยาการจัดการ" },
      { key: "organizationShort", label: "ชื่อองค์กร (ย่อ)", type: "text", col: "half", hint: "เช่น สโมสรนักศึกษา" },
      { key: "facultyName", label: "ชื่อคณะ", type: "text", col: "half", hint: "เช่น คณะวิทยาการจัดการ" },
      { key: "facultyShortEn", label: "ชื่อคณะ (อักษรย่อ EN)", type: "text", col: "half", hint: "เช่น FMS" },
      { key: "university", label: "มหาวิทยาลัย", type: "text", col: "half", hint: "เช่น PSU" },
    ],
  },
  {
    group: "ช่วงเวลาเลือกตั้ง",
    icon: "CalendarClock",
    desc: "วันเวลาเปิด-ปิด · ใช้เฉพาะโหมด AUTO (เว้นว่าง = ใช้ค่าในโค้ด)",
    preview: "schedule",
    fields: [
      { key: "campaignStartAt", label: "เปิดตัวผู้สมัคร", type: "datetime", col: "half", hint: "วันเวลาเริ่มเผยแพร่ผู้สมัคร" },
      { key: "electionStartAt", label: "เปิดหีบ / เริ่มลงคะแนน", type: "datetime", col: "half", hint: "วันเวลาเริ่มโหวต" },
      { key: "electionEndAt", label: "ปิดหีบ / สิ้นสุดลงคะแนน", type: "datetime", col: "half", hint: "วันเวลาปิดโหวต" },
    ],
  },
  {
    group: "ลิขสิทธิ์",
    icon: "Copyright",
    desc: "ปีสำหรับข้อความลิขสิทธิ์ท้ายเว็บ",
    preview: "copyright",
    fields: [
      { key: "copyrightYear", label: "ปีลิขสิทธิ์ (ค.ศ.)", type: "number", col: "half", hint: "เช่น 2027 (สำหรับ © FMS@PSU 2027)" },
    ],
  },
];

/**
 * Merge user config over defaults — ensures all keys exist.
 */
export function mergeWithDefaults(userConfig) {
  return { ...GLOBAL_CONFIG_DEFAULTS, ...(userConfig || {}) };
}
