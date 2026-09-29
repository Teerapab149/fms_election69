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

  // Election announcement poster shown on the home page. Empty = the checked-in
  // poster (utils/electionPoster.mjs → DEFAULT_ELECTION_POSTER_PATH, last
  // year's), so the settings form warns while this is blank. Root-relative
  // path (no basePath — readers add it via getPath).
  electionBannerUrl: "",

  // Success-page evaluation form (stored in the SystemConfig.googleFormUrl
  // COLUMN, not this JSON blob — bridged through the global-config API so it
  // shows up as a general-settings field while readers keep reading the column)
  googleFormUrl: "",

  // ชั่วโมงกิจกรรมที่นักศึกษาได้จากการทำแบบประเมิน — แสดงบนหน้าขอบคุณทุก template
  // ว่างโดยเจตนา: เลขนี้คณะเป็นคนกำหนดและเปลี่ยนได้ทุกปี ระบบไม่ควรเดาแทน
  // ว่าง = หน้าขอบคุณพูดแค่ "รับชั่วโมงกิจกรรม" ไม่มีเลข (ดู utils/activityHours.js)
  activityHours: "",
};

/**
 * Field metadata for admin form. Groups + labels.
 *
 * Optional UI-only keys (read defensively by GlobalConfigTab — absence is safe,
 * never affects saved data): `icon` (lucide name for the section header),
 * `desc` (one-line section subtitle), `preview` (id → live composed-output
 * block), per-field `col` ("full" spans both grid columns; default "half"),
 * `where` (where the value shows up on the site — the question an admin
 * actually has), and `derived: true` for keys assembled from other fields
 * (utils/globalConfigDerive.mjs) — shown as the assembled value with an
 * "แก้เอง" switch instead of a plain input.
 *
 * Order = how often it changes: the dates are set every year and must not be
 * missed, so they come first.
 */
export const GLOBAL_CONFIG_FIELDS = [
  {
    group: "วันเวลาเลือกตั้ง",
    icon: "CalendarClock",
    // ⚠️ วันเวลาชุดนี้ไม่ได้ใช้แค่โหมด AUTO — AUTO ใช้ตัดสินเปิด-ปิดหีบ แต่
    // CountdownTimer อ่านค่าเดียวกันนี้ในทุกโหมด ถ้าเว้นว่างหรือกรอกผิด
    // นักศึกษาจะเห็นนาฬิกานับถอยหลังผิดแม้ระบบจะอยู่โหมด MANUAL_OPEN
    desc: "ต้องตั้งใหม่ทุกปี · โหมด AUTO ใช้เปิด-ปิดหีบตามเวลานี้ · นาฬิกานับถอยหลังใช้ทุกโหมด",
    preview: "schedule",
    fields: [
      { key: "campaignStartAt", label: "เปิดตัวผู้สมัคร", type: "datetime", col: "half", where: "วันที่หน้าผู้สมัครเริ่มแสดงพรรค" },
      { key: "electionStartAt", label: "เปิดหีบ", type: "datetime", col: "half", where: "สถานะและนาฬิกาหน้าแรก · หน้ายังไม่เปิดหีบ · ปีของวันนี้คือปี ค.ศ. ของการเลือกตั้ง" },
      { key: "electionEndAt", label: "ปิดหีบ", type: "datetime", col: "half", where: "นาฬิกาหน้าแรก · \"ปิดหีบ…\" ในขั้นตอนหน้าแรก" },
    ],
  },
  {
    group: "ครั้งที่และปี",
    icon: "Vote",
    desc: "ใส่ปีการศึกษาช่องเดียว · ปี ค.ศ. และปีลิขสิทธิ์ใช้ปีของวันเปิดหีบให้เอง",
    preview: "election",
    fields: [
      { key: "electionNamePrefix", label: "ชื่อย่อ", type: "text", col: "half", where: "ป้าย SAMO 50 ทุกหน้า" },
      { key: "electionNumber", label: "ครั้งที่", type: "number", col: "half", where: "ป้าย SAMO 50 ทุกหน้า" },
      { key: "academicYearTh", label: "ปีการศึกษา (พ.ศ.)", type: "number", col: "half", where: "\"ปีการศึกษา 2570\" หน้าแรกและบนบัตร" },
      { key: "electionCalendarYear", label: "ปีการเลือกตั้ง (ค.ศ.)", type: "number", col: "half", derived: true, where: "ชื่อแท็บเบราว์เซอร์ \"FMS Election 2027\"" },
      { key: "copyrightYear", label: "ปีลิขสิทธิ์ (ค.ศ.)", type: "number", col: "half", derived: true, where: "ท้ายเว็บทุกหน้า © FMS@PSU 2027" },
    ],
  },
  {
    group: "ชื่อองค์กรและโครงการ",
    icon: "Building2",
    desc: "พิมพ์แต่ละชื่อครั้งเดียว · ชื่อโครงการและชื่อองค์กรเต็มประกอบให้เอง",
    preview: "org",
    fields: [
      { key: "committeeName", label: "ชื่อคณะกรรมการ", type: "text", col: "half", where: "ต่อท้าย \"โครงการเลือกตั้ง…\" เป็นชื่อโครงการ" },
      { key: "organizationShort", label: "ชื่อองค์กร", type: "text", col: "half", where: "ขึ้นต้นชื่อองค์กรเต็ม" },
      { key: "facultyName", label: "ชื่อคณะ", type: "text", col: "half", where: "ต่อท้ายชื่อองค์กรเต็ม · บรรทัดบนสุดของหน้าผู้สมัคร ผลคะแนน พรรค" },
      { key: "facultyShortEn", label: "อักษรย่อคณะ (EN)", type: "text", col: "half", where: "ท้ายเว็บ FMS@PSU" },
      { key: "university", label: "มหาวิทยาลัย", type: "text", col: "half", where: "ท้ายเว็บ FMS@PSU" },
      { key: "campaignTitle", label: "ชื่อโครงการ", type: "text", col: "full", derived: true, where: "หัวข้อใหญ่หน้าแรก · บรรทัดบนสุดของหน้าผู้สมัคร ผลคะแนน พรรค" },
      { key: "organizationName", label: "ชื่อองค์กรเต็ม", type: "text", col: "full", derived: true, where: "ใต้หัวข้อหน้าแรก · หัวบัตรเลือกตั้ง" },
    ],
  },
  {
    group: "แบบประเมินหลังลงคะแนน",
    icon: "Link",
    desc: "ลิงก์ Google Form และชั่วโมงกิจกรรมบนหน้าหลังลงคะแนน",
    preview: "form",
    fields: [
      // เว้นว่าง = ปีนี้ไม่มีแบบประเมิน: success/page.js ไม่ล็อกหน้าผลคะแนน และทุก
      // ตระกูลซ่อนขั้นแบบประเมินผ่าน prop hasForm
      { key: "googleFormUrl", label: "ลิงก์ Google Form", type: "text", col: "full", where: "ปุ่มแบบประเมินบนหน้าหลังลงคะแนน · เว้นว่าง = ปีนี้ไม่มีแบบประเมิน ไม่มีปุ่ม และไม่ล็อกหน้าผลคะแนน" },
      // allowEmpty: ช่องนี้ "ไม่ใส่" เป็นคำตอบที่ถูกต้อง ไม่ใช่ศูนย์ — ถ้าไม่มีธง
      // นี้ การลบตัวเลขทิ้งจะกลายเป็น 0 (Number("") === 0) แล้วช่องจะโชว์ "0"
      { key: "activityHours", label: "ชั่วโมงกิจกรรม", type: "number", col: "half", allowEmpty: true, min: 0.5, step: 0.5, where: "ข้อความบนหน้าหลังลงคะแนน · เว้นว่าง = ไม่ระบุเลขชั่วโมง · ใส่เมื่อคณะยืนยันแล้วเท่านั้น" },
    ],
  },
  {
    group: "โปสเตอร์ประชาสัมพันธ์",
    icon: "Image",
    desc: "โปสเตอร์ประกาศการเลือกตั้งบนหน้าแรก · เปลี่ยนทุกปีโดยไม่ต้องแก้โค้ด",
    fields: [
      {
        key: "electionBannerUrl",
        label: "โปสเตอร์",
        type: "image",
        col: "full",
        where: "หน้าแรก (ขั้นที่ 4 ของ Ballot) · ตรวจว่าวันที่บนโปสเตอร์ตรงกับวันเลือกตั้งจริง",
      },
    ],
  },
];

/**
 * Merge user config over defaults — ensures all keys exist.
 */
export function mergeWithDefaults(userConfig) {
  return { ...GLOBAL_CONFIG_DEFAULTS, ...(userConfig || {}) };
}
