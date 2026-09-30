// "บัตรเลือกตั้ง" (ballot-official) — the v2 official template.
//
// Replaces fms-official once the owner approves it (fms-official stays until then;
// see components/v2/families.js). Same election, same functions; the page is
// built around the one object every Thai voter recognises — the ballot — set in
// Noto Sans Thai (loopless) for everything but long reading, which gets its Looped
// sibling — looped throughout read as too bureaucratic (owner, 2026-09-29).
//
// Plain module: resolved on the server by templates/index.js, so no client imports.

// Colour themes. Every colour a Ballot page paints comes from one of these ramps
// (BallotChrome turns the active one into --bo-* vars), so a theme recolours
// the whole family — ballot, box, bands, shadows — from one object.
//
//   plum      the primary (the institution's colour)
//   plumDeep / plumDeeper / plumMid / plumSoft   its ramp (the ballot box)
//   glow      the box slot lighting up · night: the closing chapter / footer
//   board + tint1..4   the page and its bands, lightest → deepest
//   shade     "r,g,b" of the family's shadow tint
//   pen       ballpoint blue — ONLY the voter's own marks. No theme is blue, so
//             the voter's mark never blends into the institution's colour.
export const BALLOT_THEMES = {
  // the faculty plum — the identity build
  "ballot-official": {
    paper: "#FFFFFF", board: "#EEEAF2", plum: "#8A2680", plumDeep: "#5E1A58", plumDeeper: "#4E1549",
    plumMid: "#A34793", plumSoft: "#C36FB5", glow: "#F9CFF1", night: "#2A0E28",
    ink: "#1E1828", muted: "#5F5870", rule: "#D8D1E0", pen: "#2447C4",
    tint1: "#F3EEF6", tint2: "#E9E1EF", tint3: "#E2D9EA", tint4: "#D2C4DD", shade: "46,20,60",
  },
  // deep green — calm, neutral, clashes with no party colour
  "ballot-official-forest": {
    paper: "#FFFFFF", board: "#E8EFEB", plum: "#1F6B4F", plumDeep: "#134A36", plumDeeper: "#0F3D2C",
    plumMid: "#3E8F6A", plumSoft: "#6FB594", glow: "#CFF5E2", night: "#0C2A1F",
    ink: "#16241E", muted: "#56655D", rule: "#CFDBD4", pen: "#2447C4",
    tint1: "#F2F7F4", tint2: "#E3ECE7", tint3: "#DAE6DF", tint4: "#C3D5CB", shade: "16,48,36",
  },
  // brick red — warm and weighty, the closest in temperature to the plum
  "ballot-official-brick": {
    paper: "#FFFFFF", board: "#F3ECE8", plum: "#A63D2A", plumDeep: "#74281A", plumDeeper: "#5E2014",
    plumMid: "#BE5A44", plumSoft: "#D98A74", glow: "#FBD9CF", night: "#2E120C",
    ink: "#2A1A16", muted: "#6E5B55", rule: "#E3D3CB", pen: "#2447C4",
    tint1: "#F8F2EF", tint2: "#EFE4DE", tint3: "#E9DCD4", tint4: "#DCC6BA", shade: "70,30,20",
  },
  // graphite — the quietest; no colour to read into, for a close year
  "ballot-official-graphite": {
    paper: "#FFFFFF", board: "#ECEEF1", plum: "#2F3A4A", plumDeep: "#1D2531", plumDeeper: "#161C26",
    plumMid: "#4D5B70", plumSoft: "#8391A6", glow: "#DCE3EE", night: "#11151C",
    ink: "#1A1F27", muted: "#5D6571", rule: "#D5D9E0", pen: "#2447C4",
    tint1: "#F4F5F7", tint2: "#E6E9EE", tint3: "#DFE3E9", tint4: "#C9CFD8", shade: "25,32,44",
  },
};

/** the ramp for a slug (a ballot-official-* variant); plum when unknown */
export function ballotTheme(slug) {
  return BALLOT_THEMES[slug] || BALLOT_THEMES["ballot-official"];
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");

/** the --bo-* custom properties for a ramp — BallotChrome and the preview's
 *  live re-tint (utils/injectTemplateTheme) both read this, so they cannot drift */
export function ballotVars(t) {
  return {
    "--bo-paper": t.paper, "--bo-board": t.board, "--bo-plum": t.plum, "--bo-plum-deep": t.plumDeep,
    "--bo-plum-deeper": t.plumDeeper, "--bo-plum-mid": t.plumMid, "--bo-plum-soft": t.plumSoft,
    "--bo-glow": t.glow, "--bo-night": t.night, "--bo-ink": t.ink, "--bo-muted": t.muted,
    "--bo-rule": t.rule, "--bo-pen": t.pen,
    "--bo-tint-1": t.tint1, "--bo-tint-2": t.tint2, "--bo-tint-3": t.tint3, "--bo-tint-4": t.tint4,
    "--bo-shade-rgb": t.shade, "--bo-plum-rgb": rgb(t.plum), "--bo-plum-deep-rgb": rgb(t.plumDeep),
    "--bo-ink-rgb": rgb(t.ink), "--bo-pen-rgb": rgb(t.pen),
  };
}

// the plum ramp — kept under its old name for existing imports
export const BALLOT_OFFICIAL = BALLOT_THEMES["ballot-official"];

const p = BALLOT_OFFICIAL;

export const ballotOfficialTemplate = {
  slug: "ballot-official",
  name: "Ballot",
  description:
    "ธีมทางการรุ่นใหม่ หน้าเว็บสร้างรอบ “บัตรเลือกตั้ง” ที่ทุกคนคุ้นเคย ตัวอักษรไม่มีหัวอ่านง่าย สีม่วงคณะ เห็นชัดตั้งแต่จอแรกว่าต้องทำอะไร",
  layoutFamily: "ballot-official",
  isLocked: true,
  colorSwatch: { primary: p.plum, secondary: p.pen, background: p.board },
  // The layout is this family's own, but its WORDS are not written in the
  // components: every string the admin can edit comes from an element in
  // elementInstances.js — bound ones (hero-title → electionName, …) from
  // globalConfig, the rest from what the admin saved in Page Design, falling back
  // to the defaults below. Stateful voteCTA-button follows the same resolveStatefulConfig
  // path every family uses, so an admin override for a state wins over these.
  elements: {
    "voteCTA-button": {
      config: {
        login:    { text: "เข้าสู่ระบบเพื่อลงคะแนน", note: "ใช้บัญชี PSU Passport ใช้เวลาไม่เกิน 1 นาที" },
        notVoted: { text: "ไปที่บัตรเลือกตั้ง",       note: "ใช้เวลาไม่เกิน 1 นาที" },
        voted:    { text: "ดูผลคะแนน",               note: "คุณลงคะแนนแล้ว" },
        closed:   { text: "ยังไม่เปิดลงคะแนน",        note: "" },
        paused:   { text: "หยุดให้บริการชั่วคราว",     note: "กลับมาลงคะแนนได้เมื่อระบบเปิดอีกครั้ง" },
        ended:    { text: "ดูผลคะแนน",               note: "ปิดหีบแล้ว ขอบคุณทุกคนที่มาใช้สิทธิ์" },
      },
    },
    "stats-header": { config: { text: "มาใช้สิทธิ์แล้ว" } },
    "meet-title":   { config: { text: "รู้จักผู้สมัครก่อนลงคะแนน" } },
    "meet-cta":     { config: { text: "ดูนโยบาย ทีมงาน และประวัติของแต่ละพรรค" } },
  },
  // Words that belong to this family's own objects (the ballot, the box) and have
  // no element in the catalog yet. Kept here, in one place, rather than in JSX.
  copy: {
    ballotTitle: "บัตรเลือกตั้ง",
    // the home ballot is a SAMPLE — stamped and captioned so nobody tries to vote on it
    sampleStamp: "ตัวอย่าง",
    ballotRule: "บัตรตัวอย่าง ลงคะแนนจริงได้หลังเข้าสู่ระบบ",
    ballotEmpty: "รายชื่อผู้สมัครจะแสดงบนบัตรเมื่อประกาศแล้ว",
    approvePrefix: "รับรอง",
    voted: "คุณใช้สิทธิ์แล้ว",
    // the confirm step (VoteConfirm's ballot-official skin)
    confirm: {
      title: "ยืนยันการลงคะแนน",
      deck: "ตรวจเครื่องหมายบนบัตรอีกครั้ง เมื่อยืนยันแล้วบัตรจะถูกพับและส่งเข้าหีบออนไลน์ทันที และแก้ไขไม่ได้",
      back: "กลับไปแก้",
      go: "ยืนยันและส่งเข้าหีบ",
      close: "ปิด",
    },
    // a party's own material — the single-party ballot page and the party page
    party: {
      story: "ความหมายสัญลักษณ์",
      missions: "วิสัยทัศน์และพันธกิจ",
      policies: "นโยบาย",
      team: "ทีมผู้สมัคร",
      items: "ข้อ",
      people: "คน",
      toBallot: "ไปที่บัตรเลือกตั้ง",
      numberLabel: "เบอร์",
      gallery: "ภาพกิจกรรม",
      socials: "ช่องทางติดต่อพรรค",
      memberId: "รหัสนักศึกษา",
      memberPosition: "ตำแหน่ง",
      memberMajor: "สาขาวิชา",
      close: "ปิด",
      enlarge: "ดูภาพเต็ม",
    },
    // the success page: the voter keeps the ballot's stub
    success: {
      title: "ลงคะแนนเรียบร้อยแล้ว",
      deck: "ขอบคุณที่มาใช้สิทธิ์ บัตรของคุณถูกเข้ารหัสและเก็บอยู่ในหีบออนไลน์เรียบร้อย",
      nextTitle: "อีกหนึ่งขั้นตอน",
      doneTitle: "ครบทุกขั้นตอนแล้ว",
      doneNote: "ส่งแบบประเมินเรียบร้อยแล้ว ไปหน้าผลคะแนนได้เมื่อพร้อม",
      // when there is no evaluation form this year (ตั้งค่าทั่วไป left it blank)
      noFormNote: "ไม่มีแบบประเมินในปีนี้ ไปหน้าผลคะแนนได้เลย",
      openForm: "เปิดแบบประเมิน",
      formDone: "ทำแบบประเมินแล้ว",
      toResults: "ไปหน้าผลคะแนน",
      lockNote: "ทำแบบประเมินก่อนดูผลคะแนน",
      home: "กลับหน้าแรก",
      // plain words a student uses, not the polling station's ("ต้นขั้วบัตร…"
      // read as old and bureaucratic — owner)
      stubTitle: "หลักฐานการลงคะแนน",
      stubVoter: "ชื่อ",
      stubId: "รหัสนักศึกษา",
      stubTime: "เวลาที่ลงคะแนน",
      stubStamp: "ใช้สิทธิ์แล้ว",
      privacy: "ใช้ยืนยันว่าคุณลงคะแนนแล้วเท่านั้น ไม่มีข้อมูลว่าคุณเลือกตัวเลือกไหน",
    },
    // the candidates page
    candidates: {
      title: "ผู้สมัคร",
      lede: "พรรคที่ลงสมัครปีนี้ เรียงตามหมายเลขบนบัตร อ่านนโยบายและรู้จักทีมก่อนตัดสินใจ",
      count: "พรรค",
      empty: "ยังไม่มีพรรคลงสมัคร รายชื่อจะแสดงที่นี่เมื่อประกาศแล้ว",
    },
    // the party page
    partyPage: {
      backToBallot: "กลับไปที่บัตรเลือกตั้ง",
      allCandidates: "ดูผู้สมัครทั้งหมด",
      endTitle: "ถึงเวลาตัดสินใจ",
      endNote: "รู้จักพรรคนี้ครบแล้ว ไปทำเครื่องหมายบนบัตรของคุณได้เลย",
    },
    // the results page — the count happens where the story left off: at the box
    results: {
      title: "ผลคะแนน",
      ledeBefore: "ยังไม่เปิดหีบ ผลจะแสดงที่หน้านี้หลังปิดหีบและคณะกรรมการประกาศผล",
      ledeSealed: "ยังไม่ประกาศผล คะแนนของแต่ละพรรคจะแสดงเมื่อคณะกรรมการประกาศผล",
      ledeRevealed: "ผลอย่างเป็นทางการ นับจากบัตรทุกใบที่อยู่ในหีบออนไลน์",
      boxBefore: "ยังไม่เปิดหีบ",
      boxSealed: "รอประกาศผล",
      opensIn: "เปิดหีบในอีก",
      sealedTitle: "บัตรที่อยู่ในหีบแล้ว",
      sealedNote: "จำนวนนี้เปิดเผยได้ระหว่างลงคะแนน เพราะบอกแค่ว่ามีคนมาใช้สิทธิ์กี่คน ไม่บอกว่าใครเลือกอะไร",
      ballots: "ใบ",
      eligible: "ผู้มีสิทธิ์",
      people: "คน",
      turnout: "มาใช้สิทธิ์",
      sheetTitle: "คะแนนแต่ละพรรค",
      total: "บัตรทั้งหมด",
      order: "เรียงจากคะแนนมากไปน้อย สัดส่วนคิดจากบัตรทั้งหมด",
      winner: "ได้รับเลือก",
      approved: "ได้รับการรับรอง",
      verdictWinner: "ได้รับเลือกด้วยคะแนนสูงสุด",
      verdictApproved: "ได้รับการรับรองจากเสียงส่วนใหญ่",
      verdictDisapproved: "เสียงไม่รับรองมากที่สุด พรรคนี้ไม่ได้รับการรับรอง",
      verdictTie: "คะแนนสูงสุดเสมอกัน ยังประกาศผลไม่ได้ รอคณะกรรมการตัดสิน",
      verdictNone: "ยังไม่มีคะแนนในหีบ",
      abstain: "งดออกเสียง",
      disapprove: "ไม่รับรอง",
      demoTitle: "ใครมาใช้สิทธิ์บ้าง",
      demoNote: "สัดส่วนผู้มาใช้สิทธิ์แยกตามกลุ่ม ไม่เกี่ยวกับตัวเลือกบนบัตร",
      demoYear: "ชั้นปี",
      demoGender: "เพศ",
      demoMajor: "สาขา",
      demoUnknown: "ไม่ระบุ",
    },
    // the status page (not open yet / paused / closed) — title and message come
    // from app/closed/page.js; these are only this family's own furniture
    closed: {
      open: "เปิดหีบ",
      close: "ปิดหีบ",
      hours: "ลงคะแนนได้",
      toResults: "ดูผลคะแนน",
      home: "กลับหน้าแรก",
      candidates: "อ่านนโยบายผู้สมัครระหว่างรอ",
      signOut: "ออกจากระบบ",
      boxWaiting: "ยังไม่เปิดหีบ",
      boxPaused: "หยุดรับบัตรชั่วคราว",
      boxEnded: "ปิดหีบแล้ว",
    },
    // the sign-in page — the first of the three steps a voter takes
    login: {
      title: "เข้าสู่ระบบก่อนลงคะแนน",
      lede: "ใช้บัญชี PSU Passport ของมหาวิทยาลัย ระบบใช้เพื่อตรวจสิทธิ์เท่านั้น บัตรของคุณไม่มีชื่อติดไปด้วย",
      go: "เข้าสู่ระบบด้วย PSU Passport",
      going: "กำลังพาไปหน้าเข้าสู่ระบบ",
      // a space marks where a narrow column may break ("…ทำ / เครื่องหมาย" otherwise)
      steps: ["เข้าสู่ระบบ","รับบัตร ทำเครื่องหมาย", "ส่งเข้าหีบออนไลน์"],
      stepsLabel: "ขั้นตอนการลงคะแนน",
      mock: "โหมดทดสอบสำหรับผู้พัฒนา",
      mockId: "รหัสนักศึกษา",
      mockGo: "เข้าสู่ระบบ",
      back: "กลับหน้าแรก",
      admin: "สำหรับผู้ดูแลระบบ",
    },
    // the send, between confirming and the success page
    cast: {
      pending: "กำลังพับบัตรและส่งเข้าหีบ",
      confirmed: "ลงคะแนนเรียบร้อยแล้ว",
      note: "กรุณารอสักครู่ อย่าปิดหน้านี้",
    },
    // the ballot page
    vote: {
      titleSingle: "ลงคะแนนรับรองผู้สมัคร",
      titleMulti: "เลือกพรรคที่คุณสนับสนุน",
      decideTitle: "การตัดสินใจของคุณ",
      decideSingle: "รับรองพรรคนี้ ไม่รับรอง หรืองดออกเสียง ทำเครื่องหมายได้ช่องเดียว แล้วกดยืนยันเพื่อส่งบัตรเข้าหีบออนไลน์",
      decideMulti: "ทำเครื่องหมายได้ช่องเดียว แล้วกดยืนยันเพื่อส่งบัตรเข้าหีบออนไลน์",
      team: "ทีมผู้สมัคร",
      policies: "นโยบาย",
      details: "ดูนโยบายและทีมงานทั้งหมด",
      detailsOf: "ดูข้อมูล",
      rule: "ทำเครื่องหมายได้ช่องเดียว แตะอีกช่องเพื่อเปลี่ยน",
      none: "ยังไม่ได้เลือก",
      chosen: "เลือกแล้ว",
      confirm: "ยืนยันและส่งบัตร",
      skip: "แตะเพื่อข้าม",
      options: "ตัวเลือกบนบัตร",
    },
    // "the ballot's journey" — the home page's chapters, in the order a voter
    // lives them. Election facts (times, names) are filled in from settings.
    journey: {
      // the heading that says these chapters ARE the steps of voting
      leadKicker: "วิธีลงคะแนน",
      leadTitle: "ลงคะแนนใน 4 ขั้นตอน",
      leadBody: "ตั้งแต่รู้จักผู้สมัคร จนถึงวันประกาศผล ทำได้บนเว็บนี้ทั้งหมด",
      step: "ขั้นที่",
      stepOf: "จาก",
      ch1Link: "ดูนโยบายและทีมงาน",
      ch2Title: "เข้าสู่ระบบด้วย PSU Passport",
      ch2Body: "ระบบใช้บัญชีของมหาวิทยาลัยตรวจว่าคุณมีสิทธิ์ และบันทึกว่าคุณใช้สิทธิ์แล้ว ส่วนบัตรของคุณถูกเก็บแยกไว้ในหีบโดยไม่มีชื่อติดไปด้วย",
      ch2List: "รายชื่อผู้มีสิทธิ์",
      ch2ListYou: "คุณ ใช้สิทธิ์แล้ว",
      ch2Box: "หีบบัตรออนไลน์",
      ch2BoxNote: "บัตรไม่มีชื่อ",
      ch2Gap: "สองส่วนนี้ไม่เชื่อมถึงกัน",
      ch3Title: "ทำเครื่องหมาย แล้วส่งบัตรเข้าหีบออนไลน์",
      ch3Box: "หีบบัตรออนไลน์",
      ch3Body: "เลือกได้ช่องเดียว กดยืนยัน แล้วบัตรจะถูกเข้ารหัสและส่งเข้าหีบออนไลน์ทันที เมื่อยืนยันแล้วจะแก้ไขไม่ได้",
      ch4Title: "นับคะแนนและประกาศผล",
      ch4Body: "ผลคะแนนจะแสดงที่หน้าผลคะแนน เมื่อคณะกรรมการประกาศผลหลังปิดหีบ",
      ch4Close: "ปิดหีบ",
      ch4Link: "ไปหน้าผลคะแนน",
    },
  },
  theme: {
    tokens: {
      "--color-primary":    p.plum,
      "--color-accent":     p.plumDeep,
      "--color-bg":         p.board,
      "--color-surface":    p.paper,
      "--color-text":       p.ink,
      "--color-text-muted": p.muted,
      "--color-border":     p.rule,
    },
  },
  pages: { home: {}, candidates: {}, party: {}, vote: {}, results: {}, success: {}, closed: {} },
};

// ── colour variants ──
// Same layout, words and behaviour — only the ramp moves. Each is its own slug
// (ballot-official-<name>) so the chooser shows it as a swatch of this family.
function ballotVariant(slug, name, description) {
  const t = BALLOT_THEMES[slug];
  return {
    ...ballotOfficialTemplate,
    slug, name, description,
    colorSwatch: { primary: t.plum, secondary: t.pen, background: t.board },
    theme: {
      tokens: {
        "--color-primary": t.plum, "--color-accent": t.plumDeep, "--color-bg": t.board,
        "--color-surface": t.paper, "--color-text": t.ink, "--color-text-muted": t.muted, "--color-border": t.rule,
      },
    },
  };
}

export const ballotForestTemplate = ballotVariant("ballot-official-forest", "Ballot Forest",
  "โทนเขียวเข้ม — สงบ เป็นกลาง ไม่ชนกับสีประจำพรรคใด");
export const ballotBrickTemplate = ballotVariant("ballot-official-brick", "Ballot Brick",
  "โทนแดงอิฐ — อบอุ่น หนักแน่น ใกล้เคียงอุณหภูมิสีม่วงเดิม");
export const ballotGraphiteTemplate = ballotVariant("ballot-official-graphite", "Ballot Graphite",
  "โทนเทาชนวน — เงียบที่สุด ไม่มีสีให้ตีความ เหมาะกับปีที่ผลคะแนนสูสี");

export default ballotOfficialTemplate;
