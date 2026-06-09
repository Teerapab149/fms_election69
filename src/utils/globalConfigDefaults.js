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
 */
export const GLOBAL_CONFIG_FIELDS = [
  {
    group: "ข้อมูลการเลือกตั้ง",
    fields: [
      { key: "electionName", label: "ชื่อการเลือกตั้ง (เต็ม)", type: "text", hint: "เช่น SAMO 49" },
      { key: "electionNamePrefix", label: "ชื่อย่อ", type: "text", hint: "เช่น SAMO (ส่วนหน้า)" },
      { key: "electionNumber", label: "เลขครั้งที่", type: "number", hint: "เช่น 49" },
      { key: "academicYearTh", label: "ปีการศึกษา (พ.ศ.)", type: "number", hint: "เช่น 2569" },
      { key: "electionCalendarYear", label: "ปีการเลือกตั้ง (ค.ศ.)", type: "number", hint: "เช่น 2026" },
    ],
  },
  {
    group: "ข้อมูลโครงการ",
    fields: [
      { key: "campaignTitle", label: "ชื่อโครงการ", type: "text", multiline: true, hint: "เช่น โครงการเลือกตั้งคณะกรรมการบริหาร · กด Enter เพื่อขึ้นบรรทัดใหม่เอง" },
      { key: "committeeName", label: "ชื่อคณะกรรมการ", type: "text", hint: "เช่น คณะกรรมการบริหาร" },
    ],
  },
  {
    group: "ข้อมูลองค์กร",
    fields: [
      { key: "organizationName", label: "ชื่อองค์กร (เต็ม)", type: "text", hint: "เช่น สโมสรนักศึกษาคณะวิทยาการจัดการ" },
      { key: "organizationShort", label: "ชื่อย่อ", type: "text", hint: "เช่น สโมสรนักศึกษา" },
      { key: "facultyName", label: "ชื่อคณะ", type: "text", hint: "เช่น คณะวิทยาการจัดการ" },
      { key: "facultyShortEn", label: "ชื่อคณะ (อักษรย่อ EN)", type: "text", hint: "เช่น FMS" },
      { key: "university", label: "มหาวิทยาลัย", type: "text", hint: "เช่น PSU" },
    ],
  },
  {
    group: "ช่วงเวลาเลือกตั้ง (Election Schedule)",
    fields: [
      { key: "campaignStartAt", label: "เปิดตัวผู้สมัคร (Campaign)", type: "datetime", hint: "ว่าง = ใช้ค่าเริ่มต้นในโค้ด · ใช้เฉพาะโหมด AUTO" },
      { key: "electionStartAt", label: "เปิดหีบ / เริ่มลงคะแนน", type: "datetime", hint: "ว่าง = ใช้ค่าเริ่มต้นในโค้ด · ใช้เฉพาะโหมด AUTO" },
      { key: "electionEndAt", label: "ปิดหีบ / สิ้นสุดลงคะแนน", type: "datetime", hint: "ว่าง = ใช้ค่าเริ่มต้นในโค้ด · ใช้เฉพาะโหมด AUTO" },
    ],
  },
  {
    group: "ลิขสิทธิ์",
    fields: [
      { key: "copyrightYear", label: "ปีลิขสิทธิ์ (ค.ศ.)", type: "number", hint: "เช่น 2026 (สำหรับ © FMS@PSU 2026)" },
    ],
  },
];

/**
 * Merge user config over defaults — ensures all keys exist.
 */
export function mergeWithDefaults(userConfig) {
  return { ...GLOBAL_CONFIG_DEFAULTS, ...(userConfig || {}) };
}
