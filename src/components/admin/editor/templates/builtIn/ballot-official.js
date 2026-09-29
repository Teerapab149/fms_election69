// "บัตรเลือกตั้ง" (ballot-official) — the v2 official template.
//
// Replaces fms-official once the owner approves it (fms-official stays until then;
// see components/v2/families.js). Same election, same functions; the page is
// built around the one object every Thai voter recognises — the ballot — set in
// Noto Sans Thai (loopless) for everything but long reading, which gets its Looped
// sibling — looped throughout read as too bureaucratic (owner, 2026-09-29).
//
// Plain module: resolved on the server by templates/index.js, so no client imports.

export const BALLOT_OFFICIAL = {
  paper:    "#FFFFFF",
  board:    "#EEEAF2", // the faculty notice board — cool lilac grey, not cream
  plum:     "#8A2680", // faculty identity
  plumDeep: "#5E1A58",
  ink:      "#1E1828",
  muted:    "#5F5870",
  rule:     "#D8D1E0",
  pen:      "#2447C4", // ballpoint blue — used ONLY for marks the voter makes
};

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
        voted:    { text: "ดูผลคะแนน",               note: "ระบบรับบัตรของคุณแล้ว" },
        closed:   { text: "ยังไม่เปิดหีบ",            note: "" },
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
      title: "หีบได้รับบัตรของคุณแล้ว",
      deck: "ขอบคุณที่มาใช้สิทธิ์ บัตรของคุณถูกเข้ารหัสและเก็บอยู่ในหีบออนไลน์เรียบร้อย",
      nextTitle: "อีกหนึ่งขั้นตอน",
      doneTitle: "ครบทุกขั้นตอนแล้ว",
      doneNote: "ส่งแบบประเมินเรียบร้อยแล้ว ไปหน้าผลคะแนนได้เมื่อพร้อม",
      openForm: "เปิดแบบประเมิน",
      formDone: "ทำแบบประเมินแล้ว",
      toResults: "ไปหน้าผลคะแนน",
      lockNote: "ทำแบบประเมินก่อนดูผลคะแนน",
      home: "กลับหน้าแรก",
      stubTitle: "ต้นขั้วบัตรเลือกตั้ง",
      stubVoter: "ผู้ใช้สิทธิ์",
      stubId: "รหัสนักศึกษา",
      stubTime: "เวลาที่ส่งบัตร",
      stubStamp: "ใช้สิทธิ์แล้ว",
      privacy: "ต้นขั้วนี้ยืนยันการใช้สิทธิ์เท่านั้น ไม่มีพรรคหรือตัวเลือกที่คุณลงคะแนน",
    },
    // the candidates page
    candidates: {
      title: "ผู้สมัครรับเลือกตั้ง",
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
      title: "ผลการนับคะแนน",
      ledeBefore: "ยังไม่เปิดหีบ ผลจะแสดงที่หน้านี้หลังปิดหีบและคณะกรรมการประกาศผล",
      ledeSealed: "หีบยังปิดผนึกอยู่ คะแนนรายพรรคจะเปิดเผยเมื่อคณะกรรมการประกาศอย่างเป็นทางการ",
      ledeRevealed: "ผลอย่างเป็นทางการ นับจากบัตรทุกใบที่อยู่ในหีบออนไลน์",
      boxBefore: "ยังไม่เปิดหีบ",
      boxSealed: "หีบปิดผนึก",
      opensIn: "เปิดหีบในอีก",
      sealedTitle: "บัตรที่อยู่ในหีบแล้ว",
      sealedNote: "จำนวนนี้เปิดเผยได้ระหว่างลงคะแนน เพราะบอกแค่ว่ามีคนมาใช้สิทธิ์กี่คน ไม่บอกว่าใครเลือกอะไร",
      ballots: "ใบ",
      eligible: "ผู้มีสิทธิ์",
      people: "คน",
      turnout: "มาใช้สิทธิ์",
      sheetTitle: "รายงานผลการนับคะแนน",
      total: "บัตรทั้งหมด",
      order: "เรียงจากคะแนนมากไปน้อย สัดส่วนคิดจากบัตรทั้งหมด",
      winner: "ได้รับเลือก",
      approved: "ได้รับการรับรอง",
      verdictWinner: "ได้รับเลือกด้วยคะแนนสูงสุด",
      verdictApproved: "ได้รับการรับรองจากเสียงส่วนใหญ่",
      verdictDisapproved: "เสียงไม่รับรองมากที่สุด พรรคนี้ไม่ได้รับการรับรอง",
      verdictTie: "คะแนนสูงสุดเสมอกัน ยังประกาศผลไม่ได้ รอคณะกรรมการชี้ขาด",
      verdictNone: "ยังไม่มีคะแนนในหีบ",
      abstain: "งดออกเสียง",
      disapprove: "ไม่รับรอง",
      demoTitle: "ใครมาใช้สิทธิ์บ้าง",
      demoNote: "สัดส่วนผู้มาใช้สิทธิ์แยกตามกลุ่ม ไม่เกี่ยวกับตัวเลือกบนบัตร",
      demoYear: "ชั้นปี",
      demoGender: "เพศ",
      demoMajor: "สาขา",
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
      title: "ยืนยันตัวตนก่อนรับบัตร",
      lede: "ใช้บัญชี PSU Passport ของมหาวิทยาลัย ระบบใช้เพื่อตรวจสิทธิ์เท่านั้น บัตรของคุณไม่มีชื่อติดไปด้วย",
      go: "เข้าสู่ระบบด้วย PSU Passport",
      going: "กำลังพาไปหน้าเข้าสู่ระบบ",
      steps: ["ยืนยันตัวตน", "รับบัตรและทำเครื่องหมาย", "ส่งเข้าหีบออนไลน์"],
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
      confirmed: "หีบได้รับบัตรของคุณแล้ว",
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
      ch1Link: "ดูนโยบายและทีมงาน",
      ch2Title: "ยืนยันตัวตนด้วย PSU Passport",
      ch2Body: "ระบบใช้บัญชีของมหาวิทยาลัยตรวจว่าคุณมีสิทธิ์ และบันทึกว่าคุณใช้สิทธิ์แล้ว ส่วนบัตรของคุณถูกเก็บแยกไว้ในหีบโดยไม่มีชื่อติดไปด้วย",
      ch2List: "รายชื่อผู้มีสิทธิ์",
      ch2ListYou: "คุณ ใช้สิทธิ์แล้ว",
      ch2Box: "หีบบัตรออนไลน์",
      ch2BoxNote: "บัตรไม่มีชื่อ",
      ch2Gap: "สองส่วนนี้ไม่เชื่อมถึงกัน",
      ch3Title: "กา แล้วส่งเข้าหีบออนไลน์",
      ch3Box: "หีบบัตรออนไลน์",
      ch3Body: "เลือกได้ช่องเดียว กดยืนยัน แล้วบัตรจะถูกเข้ารหัสและส่งเข้าหีบออนไลน์ทันที เมื่อยืนยันแล้วจะแก้ไขไม่ได้",
      ch4Title: "นับคะแนนและประกาศผล",
      ch4Body: "ผลคะแนนจะแสดงที่หน้าผลคะแนน เมื่อคณะกรรมการเปิดเผยผลหลังปิดหีบ",
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

export default ballotOfficialTemplate;
