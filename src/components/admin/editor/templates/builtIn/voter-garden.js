// "สวนของทุกเสียง" (voter-garden) — the v2 replacement for verdure.
//
// Verdure stays until the owner approves this one (components/v2/families.js).
// The object that carries the election, page to page, is a garden drawn like a
// botanical plate: bare soil before the polls open, sprouts while people vote,
// a garden in bloom once the box closes. The garden grows from the TOTAL
// turnout only — never one plot per party (rule 7, docs/v2-design-rules.md).
//
// Type: IBM Plex Sans Thai (loopless) for everything but long reading, which
// gets its Looped sibling. Plain module: resolved on the server by
// templates/index.js, so no client imports.

export const VOTER_GARDEN = {
  paper:  "#F0F3EB", // herbarium sheet — cool pale sage, not cream
  card:   "#FFFFFF", // specimen labels
  ink:    "#1E3326", // botanical ink: every line of the garden
  leaf:   "#4C7A56",
  moss:   "#2F5A3C",
  muted:  "#5B6A60",
  rule:   "#D3DBCB",
  bloom:  "#8A2680", // faculty plum — the flowers, and nothing else loud
};

const g = VOTER_GARDEN;

export const voterGardenTemplate = {
  slug: "voter-garden",
  name: "สวนของทุกเสียง",
  description:
    "ธีมสวนพฤกษศาสตร์ วาดด้วยลายเส้น ทุกคนที่มาใช้สิทธิ์ทำให้สวนเติบโต ดอกไม้สีม่วงคณะบานเมื่อปิดหีบ ตัวอักษรไม่มีหัวอ่านง่าย",
  layoutFamily: "voter-garden",
  isLocked: true,
  colorSwatch: { primary: g.moss, secondary: g.bloom, background: g.paper },
  // words the admin can edit come from elements (bound ones from globalConfig);
  // these are this family's defaults, overridden by Page Design
  elements: {
    "voteCTA-button": {
      config: {
        login:    { text: "เข้าสู่ระบบเพื่อลงคะแนน", note: "ใช้บัญชี PSU Passport ใช้เวลาไม่เกิน 1 นาที" },
        notVoted: { text: "ไปลงคะแนน",             note: "ใช้เวลาไม่เกิน 1 นาที" },
        voted:    { text: "ดูผลคะแนน",              note: "เสียงของคุณอยู่ในสวนนี้แล้ว" },
        closed:   { text: "ยังไม่เปิดหีบ",           note: "" },
        paused:   { text: "หยุดให้บริการชั่วคราว",    note: "กลับมาลงคะแนนได้เมื่อระบบเปิดอีกครั้ง" },
        ended:    { text: "ดูผลคะแนน",              note: "ปิดหีบแล้ว ขอบคุณทุกเสียงที่ช่วยให้สวนนี้เติบโต" },
      },
    },
    "stats-header": { config: { text: "มาใช้สิทธิ์แล้ว" } },
    "meet-title":   { config: { text: "รู้จักผู้สมัครก่อนลงคะแนน" } },
    "meet-cta":     { config: { text: "ดูนโยบาย ทีมงาน และประวัติของแต่ละพรรค" } },
  },
  // words that belong to this family's own objects (the garden, its plates)
  copy: {
    plateCaption: {
      before: "ดินเตรียมไว้แล้ว รอเมล็ดแรก",
      open: "สวนนี้โตขึ้นทุกครั้งที่มีคนมาใช้สิทธิ์",
      paused: "สวนพักชั่วคราว",
      ended: "ปิดหีบแล้ว สวนนี้โตจากทุกเสียงที่มา",
    },
    labelOf: "จาก",
    people: "คน",
    opensIn: "เปิดหีบในอีก",
    closesIn: "ปิดหีบในอีก",
    days: "วัน", hours: "ชั่วโมง", minutes: "นาที", seconds: "วินาที",
    opens: "เปิดหีบ",
    closes: "ปิดหีบ",
    ay: "ปีการศึกษา",
    plates: {
      seeds: {
        no: "แผ่นที่ 1",
        title: "เมล็ดพันธุ์ปีนี้",
        body: "พรรคที่ลงสมัคร เรียงตามหมายเลขบนบัตร อ่านนโยบายและรู้จักทีมก่อนเลือก",
        link: "ดูนโยบายและทีมงาน",
        team: "ทีม",
        empty: "รายชื่อผู้สมัครจะแสดงที่นี่เมื่อประกาศแล้ว",
      },
      plant: {
        no: "แผ่นที่ 2",
        title: "ปลูกโดยไม่มีชื่อติดไป",
        steps: [
          { t: "ยืนยันตัวตน", d: "เข้าสู่ระบบด้วย PSU Passport ระบบตรวจว่าคุณมีสิทธิ์ และบันทึกว่าคุณมาแล้ว" },
          { t: "เลือกหนึ่งช่อง", d: "เลือกพรรค ไม่รับรอง หรืองดออกเสียง ได้ช่องเดียว แล้วกดยืนยัน" },
          { t: "เมล็ดลงดิน", d: "บัตรถูกเข้ารหัสและเก็บแยกจากชื่อคุณ ไม่มีใครย้อนดูได้ว่าใครเลือกอะไร" },
        ],
      },
      harvest: {
        no: "แผ่นที่ 3",
        title: "ปิดหีบแล้วค่อยนับ",
        body: "ผลคะแนนเปิดเผยที่หน้าผลคะแนน เมื่อคณะกรรมการประกาศหลังปิดหีบ ระหว่างนี้สวนบอกได้แค่ว่ามีคนมาแล้วกี่คน ไม่บอกว่าใครนำ",
        link: "ไปหน้าผลคะแนน",
      },
    },
  },
  theme: {
    tokens: {
      "--color-primary":    g.moss,
      "--color-accent":     g.bloom,
      "--color-bg":         g.paper,
      "--color-surface":    g.card,
      "--color-text":       g.ink,
      "--color-text-muted": g.muted,
      "--color-border":     g.rule,
    },
  },
  pages: { home: {}, candidates: {}, party: {}, vote: {}, results: {}, success: {}, closed: {} },
};

export default voterGardenTemplate;
