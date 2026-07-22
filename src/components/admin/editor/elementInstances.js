/**
 * elementInstances.js — Phase 2 catalog refactor (Step 2 / 5).
 *
 * 32 placement-specific element instance definitions.
 * Each instance references one of the 16 types in elementTypes.js via `typeId`.
 *
 * Migration sources (verbatim):
 *   - 21 from src/components/admin/editor/elementRegistry.ELEMENT_PRESETS
 *   - 10 from src/components/admin/editor/PropertyPanel.EXTRA_ELEMENTS_SCHEMA
 *   -  1 new: vote-divider-text (orphan Wrap in MultiPartyView.js:122)
 *
 * For the two stateful instances (hero-countdown, voteCTA-button) the entry
 * MERGES data from elementRegistry (presets) + statefulRegistry
 * (states, stateResolverKey, defaultConfig). Both shapes are preserved so
 * Phase 3 templates can adopt the static-style toggle/base styling later.
 *
 * Zero consumers wired in this step. See LIVE_STEP_H_CATALOG_CORE.md.
 */

// ============================================================
// Shared propertyFields arrays (per legacy control category)
// ============================================================

const FIELDS_TEXT = [
  { key: "text",       control: "text",   label: "ข้อความ" },
  { key: "fontSize",   control: "size",   label: "ขนาด" },
  { key: "color",      control: "color",  label: "สี" },
  { key: "fontWeight", control: "weight", label: "น้ำหนัก" },
  { key: "align",      control: "align",  label: "จัดแนว" }
];

const FIELDS_BUTTON = [
  { key: "text",            control: "text",   label: "ข้อความ" },
  { key: "backgroundColor", control: "color",  label: "สีพื้นหลัง" },
  { key: "textColor",       control: "color",  label: "สีตัวอักษร" },
  { key: "borderRadius",    control: "radius", label: "มุมโค้ง" }
];

const FIELDS_CARD = [
  { key: "backgroundColor", control: "color",  label: "สีพื้นหลัง" },
  { key: "borderColor",     control: "color",  label: "สีขอบ" },
  { key: "borderRadius",    control: "radius", label: "มุมโค้ง" },
  { key: "visible",         control: "toggle", label: "แสดง" }
];

const FIELDS_IMAGE = [
  { key: "visible",      control: "toggle", label: "แสดง" },
  { key: "borderRadius", control: "radius", label: "มุมโค้ง" }
];

const FIELDS_TOGGLE = [
  { key: "visible", control: "toggle", label: "แสดง" }
];

// StatefulGallery owns its own per-state field schema; the catalog just
// stores an empty array here so consumers can rely on the field being present.
const FIELDS_STATEFUL = [];

// ============================================================
// Shared preset blocks (reused across multiple instances verbatim
// from elementRegistry.js, kept identical for migration safety)
// ============================================================

const statsSmallCardPresets = {
  classic: { backgroundColor: "#ffffff", borderRadius: "xl",  borderColor: "#e2e8f0" },
  dark:    { backgroundColor: "#1e293b", borderRadius: "xl",  borderColor: "#334155" },
  playful: { backgroundColor: "#fdf2f8", borderRadius: "2xl", borderColor: "#fbcfe8" },
  minimal: { backgroundColor: "#ffffff", borderRadius: "md",  borderColor: "#e2e8f0" }
};

// ============================================================
// ELEMENT_INSTANCES (32 entries)
// ============================================================

export const ELEMENT_INSTANCES = {
  // ----------------------------------------------------------
  // home / hero
  // ----------------------------------------------------------
  "hero-title": {
    id: "hero-title",
    typeId: "text-title",
    name: "ชื่อหลัก",
    pages: ["home"],
    section: "hero",
    // ⚠️ CFG-DUAL — this binding makes PropertyPanel write globalConfig.electionName
    // directly (PropertyPanel.js → updateField(binding, ...)), and the general-settings
    // form (src/components/admin/GlobalConfigTab.js) derives the SAME key from
    // electionNamePrefix + electionNumber. Two writers, one value. The settings form
    // now re-derives ONLY when prefix/number changed, so a custom hero title set here
    // survives unrelated saves — but renaming the election still overwrites it, by
    // design (the "SAMO 50" badge and the hero title must not drift apart).
    // Keep the binding: home templates resolve hero-title through globalConfig, so
    // dropping it would silently strand the hero on the preset literal "SAMO 49".
    boundTo: "electionName",
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "SAMO 49", fontSize: "5xl", color: "#1a1a2e", fontWeight: "900", align: "left" },
    presets: {
      classic: { text: "SAMO 49", fontSize: "5xl", color: "#1a1a2e", fontWeight: "900", align: "left" },
      dark:    { text: "SAMO 49", fontSize: "5xl", color: "#ffffff", fontWeight: "900", align: "left" },
      playful: { text: "SAMO 49", fontSize: "5xl", color: "#EC4899", fontWeight: "900", align: "center" },
      minimal: { text: "SAMO 49", fontSize: "4xl", color: "#1E293B", fontWeight: "700", align: "left" }
    },
    schemaVersion: "v1"
  },

  "hero-subtitle": {
    id: "hero-subtitle",
    typeId: "text-subtitle",
    name: "คำอธิบายหลัก",
    pages: ["home"],
    section: "hero",
    boundTo: "campaignTitle",
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "base", color: "#374151" },
    presets: {
      classic: { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "base", color: "#374151" },
      dark:    { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "base", color: "#94a3b8" },
      playful: { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "lg",   color: "#831843" },
      minimal: { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "sm",   color: "#64748b" }
    },
    schemaVersion: "v1"
  },

  "hero-subtitle2": {
    id: "hero-subtitle2",
    typeId: "text-subtitle",
    name: "คำอธิบายรอง",
    pages: ["home"],
    section: "hero",
    boundTo: "organizationName",
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#6b7280" },
    presets: {
      classic: { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#6b7280" },
      dark:    { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#64748b" },
      playful: { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#9d174d" },
      minimal: { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "xs", color: "#94a3b8" }
    },
    schemaVersion: "v1"
  },

  "hero-year-badge": {
    id: "hero-year-badge",
    typeId: "text-label",
    name: "ปีการศึกษา",
    pages: ["home"],
    section: "hero",
    boundTo: "academicYearTh",
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: [...FIELDS_TEXT, { key: "visible", control: "toggle", label: "แสดง" }],
    defaultConfig: { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#6b7280", visible: true },
    presets: {
      classic: { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#6b7280", visible: true },
      dark:    { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#64748b", visible: true },
      playful: { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#be185d", visible: true },
      minimal: { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#94a3b8", visible: false }
    },
    schemaVersion: "v1"
  },

  // STATEFUL — merge elementRegistry.presets + statefulRegistry data
  "hero-countdown": {
    id: "hero-countdown",
    typeId: "countdown-timer",
    name: "นาฬิกานับเวลา",
    pages: ["home"],
    section: "hero",
    boundTo: null,
    isStateful: true,
    stateResolverKey: "countdown",
    states: [
      { id: "before",      label: "ก่อนเริ่ม",             description: "ก่อนถึงเวลาเริ่มเลือกตั้ง" },
      { id: "running",     label: "กำลังเลือกตั้ง",        description: "อยู่ในช่วงเลือกตั้ง — นับถอยหลังจนปิด" },
      { id: "paused",      label: "ระบบ PAUSE",            description: "admin สั่งปิดปรับปรุงชั่วคราว" },
      { id: "manualEnded", label: "ปิดด้วย admin (ENDED)", description: "admin บังคับปิดก่อนเวลา" },
      { id: "nextYear",    label: "เลยช่วงเลือกตั้ง",      description: "เลยกำหนดแล้ว รอปีถัดไป" }
    ],
    propertyFields: FIELDS_STATEFUL,
    defaultConfig: {
      before: {
        label: "STARTS IN", pillBackground: "#ffffff",
        badgeBackgroundColor: "#9D3292", badgeTextColor: "#ffffff",
        textMain: "#9D3292", textSub: "#a78bfa",
        borderColor: "#e9d5ff", shadow: "md", shadowColor: "#9D3292",
        iconName: "Flag", iconAnimation: "none"
      },
      running: {
        label: "CLOSES IN", pillBackground: "#ffffff",
        badgeBackgroundColor: "#ef4444", badgeTextColor: "#ffffff",
        textMain: "#dc2626", textSub: "#f87171",
        borderColor: "#fecaca", shadow: "md", shadowColor: "#ef4444",
        iconName: "Zap", iconAnimation: "pulse"
      },
      paused: {
        label: "SYSTEM PAUSED", pillBackground: "#ffffff",
        badgeBackgroundColor: "#fed7aa", badgeTextColor: "#c2410c",
        textMain: "#ea580c", textSub: "#fb923c",
        borderColor: "#fed7aa", shadow: "sm", shadowColor: "#ea580c",
        iconName: "Hourglass", iconAnimation: "spin"
      },
      manualEnded: {
        label: "ELECTION ENDED", pillBackground: "#ffffff",
        badgeBackgroundColor: "#e2e8f0", badgeTextColor: "#334155",
        textMain: "#475569", textSub: "#94a3b8",
        borderColor: "#cbd5e1", shadow: "none", shadowColor: "#000000",
        iconName: "CalendarDays", iconAnimation: "none"
      },
      nextYear: {
        label: "SEE YOU {YEAR}", pillBackground: "#ffffff",
        badgeBackgroundColor: "#1e293b", badgeTextColor: "#ffffff",
        textMain: "#334155", textSub: "#94a3b8",
        borderColor: "#e2e8f0", shadow: "sm", shadowColor: "#000000",
        iconName: "CalendarDays", iconAnimation: "none"
      }
    },
    presets: null,
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // home / stats
  // ----------------------------------------------------------
  "stats-header": {
    id: "stats-header",
    typeId: "text-label",
    name: "หัวข้อสถิติ",
    pages: ["home"],
    section: "stats",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "สถิติผู้เข้าร่วมลงคะแนนโหวต", fontSize: "xs", color: "#374151" },
    presets: {
      classic: { text: "สถิติผู้เข้าร่วมลงคะแนนโหวต", fontSize: "xs", color: "#374151" },
      dark:    { text: "สถิติผู้เข้าร่วมลงคะแนนโหวต", fontSize: "xs", color: "#e2e8f0" },
      playful: { text: "มาโหวตกันเถอะ!",              fontSize: "sm", color: "#be185d" },
      minimal: { text: "สถิติ",                         fontSize: "xs", color: "#64748b" }
    },
    schemaVersion: "v1"
  },

  "stats-voted-card": {
    id: "stats-voted-card",
    typeId: "card-primary",
    name: "กล่องจำนวนผู้โหวต",
    pages: ["home"],
    section: "stats",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_CARD,
    defaultConfig: { backgroundColor: "#8A2680", textColor: "#ffffff", borderRadius: "2xl" },
    presets: {
      classic: { backgroundColor: "#8A2680", textColor: "#ffffff", borderRadius: "2xl" },
      dark:    { backgroundColor: "#0f172a", textColor: "#06b6d4", borderRadius: "2xl", borderColor: "#06b6d4" },
      playful: { backgroundColor: "#EC4899", textColor: "#ffffff", borderRadius: "3xl" },
      minimal: { backgroundColor: "#1E293B", textColor: "#ffffff", borderRadius: "lg" }
    },
    schemaVersion: "v1"
  },

  "stats-progress-card": {
    id: "stats-progress-card",
    typeId: "card-secondary",
    name: "กล่องความคืบหน้า",
    pages: ["home"],
    section: "stats",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_CARD,
    defaultConfig: { backgroundColor: "#ffffff", borderRadius: "xl", borderColor: "#e2e8f0" },
    presets: statsSmallCardPresets,
    schemaVersion: "v1"
  },

  "stats-eligible-card": {
    id: "stats-eligible-card",
    typeId: "card-secondary",
    name: "กล่องผู้มีสิทธิ์",
    pages: ["home"],
    section: "stats",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_CARD,
    defaultConfig: { backgroundColor: "#ffffff", borderRadius: "xl", borderColor: "#e2e8f0" },
    presets: statsSmallCardPresets,
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // home / voteCTA  (STATEFUL — merge)
  // ----------------------------------------------------------
  "voteCTA-button": {
    id: "voteCTA-button",
    typeId: "button-stateful",
    name: "ปุ่มโหวต",
    pages: ["home"],
    section: "voteCTA",
    boundTo: null,
    isStateful: true,
    stateResolverKey: "voteCTA",
    states: [
      { id: "login",    label: "ยังไม่ล็อกอิน",      description: "ผู้ใช้ยังไม่ล็อกอินเข้าระบบ" },
      { id: "notVoted", label: "ยังไม่โหวต",          description: "ล็อกอินแล้วแต่ยังไม่โหวต" },
      { id: "voted",    label: "โหวตแล้ว",            description: "โหวตเสร็จแล้ว" },
      { id: "ended",    label: "หมดเวลา",             description: "หมดช่วงเลือกตั้ง" },
      { id: "closed",   label: "ปิดรับโหวต",          description: "ระบบปิดรับโหวต manual" },
      { id: "paused",   label: "PAUSE (ปรับปรุง)",   description: "ระบบปิดปรับปรุงชั่วคราว" }
    ],
    propertyFields: FIELDS_STATEFUL,
    defaultConfig: {
      login:    { text: "เข้าสู่ระบบ / Sign in",            backgroundColor: "#8A2680", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      notVoted: { text: "ลงคะแนน / Vote Now",               backgroundColor: "#10B981", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      voted:    { text: "ดูผลคะแนน / Results",              backgroundColor: "#0369a1", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      ended:    { text: "อยู่นอกระยะเวลาเลือกตั้ง / Ended", backgroundColor: "#1e293b", textColor: "#94a3b8", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      closed:   { text: "ระบบปิดรับลงคะแนน / Closed",       backgroundColor: "#1e293b", textColor: "#94a3b8", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      paused:   { text: "ระบบปิดปรับปรุง / Maintenance",    backgroundColor: "#ea580c", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" }
    },
    presets: null,
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // home / meetCandidates
  // ----------------------------------------------------------
  "meet-section": {
    id: "meet-section",
    typeId: "card-meet",
    name: "การ์ดรู้จักผู้สมัคร",
    pages: ["home"],
    section: "meetCandidates",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_CARD,
    defaultConfig: { backgroundColor: "#ffffff", borderRadius: "2xl", borderColor: "#fecdd3", visible: true },
    presets: {
      classic: { backgroundColor: "#ffffff", borderRadius: "2xl", borderColor: "#fecdd3", visible: true },
      dark:    { backgroundColor: "#1e293b", borderRadius: "2xl", borderColor: "#334155", visible: true },
      playful: { backgroundColor: "#fdf2f8", borderRadius: "3xl", borderColor: "#fbcfe8", visible: true },
      minimal: { backgroundColor: "#ffffff", borderRadius: "lg",  borderColor: "#e2e8f0", visible: true }
    },
    schemaVersion: "v1"
  },

  "meet-title": {
    id: "meet-title",
    typeId: "text-label",
    name: "หัวข้อรู้จักผู้สมัคร",
    pages: ["home"],
    section: "meetCandidates",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "รู้จักผู้สมัครของคุณหรือยัง?", fontSize: "sm", color: "#1a1a2e", fontWeight: "700" },
    presets: {
      classic: { text: "รู้จักผู้สมัครของคุณหรือยัง?", fontSize: "sm",   color: "#1a1a2e", fontWeight: "700" },
      dark:    { text: "รู้จักผู้สมัครของคุณหรือยัง?", fontSize: "sm",   color: "#e2e8f0", fontWeight: "700" },
      playful: { text: "มาทำความรู้จักกัน!",           fontSize: "base", color: "#be185d", fontWeight: "700" },
      minimal: { text: "ผู้สมัคร",                      fontSize: "sm",   color: "#374151", fontWeight: "500" }
    },
    schemaVersion: "v1"
  },

  "meet-cta": {
    id: "meet-cta",
    typeId: "button-primary",
    name: "ปุ่มดูรายชื่อ",
    pages: ["home"],
    section: "meetCandidates",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_BUTTON,
    defaultConfig: { text: "ดูรายชื่อพรรค →", backgroundColor: "#1a1a2e", textColor: "#ffffff", borderRadius: "full" },
    presets: {
      classic: { text: "ดูรายชื่อพรรค →", backgroundColor: "#1a1a2e",     textColor: "#ffffff", borderRadius: "full" },
      dark:    { text: "ดูรายชื่อพรรค →", backgroundColor: "#06b6d4",     textColor: "#ffffff", borderRadius: "full" },
      playful: { text: "ไปดูกัน! →",      backgroundColor: "#EC4899",     textColor: "#ffffff", borderRadius: "full" },
      minimal: { text: "ดูรายชื่อ →",     backgroundColor: "transparent", textColor: "#1E293B", borderRadius: "none" }
    },
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // home / electionBanner
  // ----------------------------------------------------------
  "banner-section": {
    id: "banner-section",
    typeId: "image-banner",
    name: "แบนเนอร์เลือกตั้ง",
    pages: ["home"],
    section: "electionBanner",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_IMAGE,
    defaultConfig: { visible: true, borderRadius: "2xl" },
    presets: {
      classic: { visible: true,  borderRadius: "2xl" },
      dark:    { visible: true,  borderRadius: "2xl" },
      playful: { visible: true,  borderRadius: "3xl" },
      minimal: { visible: false, borderRadius: "lg"  }
    },
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // vote / voteHeader
  // ----------------------------------------------------------
  "vote-header-badge": {
    id: "vote-header-badge",
    typeId: "text-label",
    name: "ป้าย 'ลงคะแนนเสียง'",
    pages: ["vote"],
    section: "header",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    // color removed — Tier-2 var --vh-badge-color owns it (deconfliction,
    // P-LOG-067). The var defaults to var(--color-primary) so it adapts per
    // template automatically; presets keep content/size only.
    defaultConfig: { text: "ลงคะแนนเสียง", fontSize: "xs" },
    presets: {
      classic: { text: "ลงคะแนนเสียง", fontSize: "xs" },
      dark:    { text: "VOTE NOW",      fontSize: "xs" },
      playful: { text: "โหวตเลย!",     fontSize: "sm" },
      minimal: { text: "ลงคะแนน",      fontSize: "xs" }
    },
    schemaVersion: "v1"
  },

  "vote-header-title": {
    id: "vote-header-title",
    typeId: "text-title",
    name: "หัวข้อหน้าโหวต",
    pages: ["vote"],
    section: "header",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    // color removed — Tier-2 var --vh-title-color owns it (deconfliction);
    // defaults to var(--color-text) so it follows each template's text token.
    defaultConfig: { text: "เลือกตั้งสโมสรนักศึกษา", fontSize: "3xl", fontWeight: "black" },
    presets: {
      classic: { text: "เลือกตั้งสโมสรนักศึกษา", fontSize: "3xl", fontWeight: "black" },
      dark:    { text: "เลือกตั้งสโมสรนักศึกษา", fontSize: "3xl", fontWeight: "black" },
      playful: { text: "เลือกพรรคที่ใช่!",        fontSize: "3xl", fontWeight: "black" },
      minimal: { text: "เลือกตั้ง",                fontSize: "2xl", fontWeight: "bold" }
    },
    schemaVersion: "v1"
  },

  "vote-header-subtitle": {
    id: "vote-header-subtitle",
    typeId: "text-subtitle",
    name: "ข้อความทักทาย",
    pages: ["vote"],
    section: "header",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    // color removed — Tier-2 var --vh-subtitle-color owns it (deconfliction);
    // defaults to var(--color-text-muted) so it follows the template token.
    defaultConfig: { text: "โปรดเลือกพรรคที่ต้องการ", fontSize: "sm" },
    presets: {
      classic: { text: "โปรดเลือกพรรคที่ต้องการ", fontSize: "sm"   },
      dark:    { text: "โปรดเลือกพรรคที่ต้องการ", fontSize: "sm"   },
      playful: { text: "เลือกพรรคในใจของคุณ!",     fontSize: "base" },
      minimal: { text: "โปรดเลือก",                  fontSize: "xs"   }
    },
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // vote / voteBody
  // ----------------------------------------------------------
  "vote-party-card": {
    id: "vote-party-card",
    typeId: "card-party",
    name: "การ์ดพรรค",
    pages: ["vote"],
    section: "partyGrid",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_CARD,
    defaultConfig: { backgroundColor: "#ffffff", borderRadius: "2xl", borderColor: "#e2e8f0" },
    presets: {
      classic: { backgroundColor: "#ffffff", borderRadius: "2xl", borderColor: "#e2e8f0" },
      dark:    { backgroundColor: "#1e293b", borderRadius: "2xl", borderColor: "#334155" },
      playful: { backgroundColor: "#fdf2f8", borderRadius: "3xl", borderColor: "#fbcfe8" },
      minimal: { backgroundColor: "#ffffff", borderRadius: "lg",  borderColor: "#e2e8f0" }
    },
    schemaVersion: "v1"
  },

  "vote-abstain-button": {
    id: "vote-abstain-button",
    typeId: "button-secondary",
    name: "ปุ่มงดออกเสียง",
    pages: ["vote"],
    section: "abstainButton",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_BUTTON,
    defaultConfig: { text: "งดออกเสียง", backgroundColor: "#ffffff", textColor: "#f97316", borderRadius: "xl", borderColor: "#fed7aa" },
    presets: {
      classic: { text: "งดออกเสียง", backgroundColor: "#ffffff",     textColor: "#f97316", borderRadius: "xl",   borderColor: "#fed7aa" },
      dark:    { text: "งดออกเสียง", backgroundColor: "#1e293b",     textColor: "#f97316", borderRadius: "xl",   borderColor: "#9a3412" },
      playful: { text: "งดออกเสียง", backgroundColor: "#fff7ed",     textColor: "#f97316", borderRadius: "full", borderColor: "#fed7aa" },
      minimal: { text: "งดออกเสียง", backgroundColor: "transparent", textColor: "#64748b", borderRadius: "none" }
    },
    schemaVersion: "v1"
  },

  "vote-disapprove-button": {
    id: "vote-disapprove-button",
    typeId: "button-secondary",
    name: "ปุ่มไม่รับรอง (single-party)",
    pages: ["vote"],
    section: "abstainButton",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_BUTTON,
    defaultConfig: { text: "ไม่รับรอง", backgroundColor: "#ffffff", textColor: "#dc2626", borderRadius: "xl", borderColor: "#fecaca" },
    presets: {
      classic: { text: "ไม่รับรอง", backgroundColor: "#ffffff",     textColor: "#dc2626", borderRadius: "xl",   borderColor: "#fecaca" },
      dark:    { text: "ไม่รับรอง", backgroundColor: "#1e293b",     textColor: "#ef4444", borderRadius: "xl",   borderColor: "#7f1d1d" },
      playful: { text: "ไม่รับรอง", backgroundColor: "#fef2f2",     textColor: "#dc2626", borderRadius: "full", borderColor: "#fecaca" },
      minimal: { text: "ไม่รับรอง", backgroundColor: "transparent", textColor: "#64748b", borderRadius: "none" }
    },
    schemaVersion: "v1"
  },

  // NEW (orphan Wrap in MultiPartyView.js:122)
  "vote-divider-text": {
    id: "vote-divider-text",
    typeId: "text-divider",
    name: "ข้อความคั่น",
    pages: ["vote"],
    section: "partyGrid",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "หรือ", color: "#64748b", fontSize: "xs" },
    presets: null,
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // success page (from EXTRA_ELEMENTS_SCHEMA)
  // ----------------------------------------------------------
  "success-title": {
    id: "success-title",
    typeId: "text-title",
    name: "หัวข้อสำเร็จ",
    pages: ["success"],
    section: "successMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: {},
    presets: null,
    schemaVersion: "v1"
  },

  "success-subtitle1": {
    id: "success-subtitle1",
    typeId: "text-subtitle",
    name: "ข้อความรอง 1",
    pages: ["success"],
    section: "successMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: {},
    presets: null,
    schemaVersion: "v1"
  },

  "success-subtitle2": {
    id: "success-subtitle2",
    typeId: "text-subtitle",
    name: "ข้อความรอง 2",
    pages: ["success"],
    section: "successMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: {},
    presets: null,
    schemaVersion: "v1"
  },

  "success-form-btn": {
    id: "success-form-btn",
    typeId: "button-primary",
    name: "ปุ่มตอบแบบสอบถาม",
    pages: ["success"],
    section: "googleFormLink",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_BUTTON,
    defaultConfig: {},
    presets: null,
    schemaVersion: "v1"
  },

  "success-footer": {
    id: "success-footer",
    typeId: "text-body",
    name: "ข้อความ Footer",
    pages: ["success"],
    section: "successMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: {},
    presets: null,
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // success page — extended regions (Phase 2.6)
  // ----------------------------------------------------------
  "success-check-icon": {
    id: "success-check-icon",
    typeId: "toggle-visibility",
    name: "ไอคอนเครื่องหมายถูก",
    pages: ["success"],
    section: "successMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TOGGLE,
    defaultConfig: { visible: true },
    presets: null,
    schemaVersion: "v1"
  },

  "success-megaphone-card": {
    id: "success-megaphone-card",
    typeId: "card-secondary",
    name: "การ์ดเตือนทำแบบประเมิน",
    pages: ["success"],
    section: "googleFormLink",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_CARD,
    defaultConfig: { backgroundColor: "#faf5ff", borderColor: "#e9d5ff", borderRadius: "2xl", visible: true },
    presets: null,
    schemaVersion: "v1"
  },

  "success-megaphone-title": {
    id: "success-megaphone-title",
    typeId: "text-label",
    name: "หัวข้อใน Megaphone Card",
    pages: ["success"],
    section: "googleFormLink",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "รับทรานสคริปต์กิจกรรม", fontSize: "base", color: "#8A2680", fontWeight: "bold", align: "left" },
    presets: null,
    schemaVersion: "v1"
  },

  "success-megaphone-desc": {
    id: "success-megaphone-desc",
    typeId: "text-body",
    name: "คำอธิบายใน Megaphone Card",
    pages: ["success"],
    section: "googleFormLink",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "กรุณาทำแบบประเมินให้ครบถ้วน", fontSize: "xs", color: "#64748b", fontWeight: "normal", align: "left" },
    presets: null,
    schemaVersion: "v1"
  },

  "success-chip-1": {
    id: "success-chip-1",
    typeId: "button-badge",
    name: "ป้ายชั่วโมงกิจกรรม",
    pages: ["success"],
    section: "googleFormLink",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_BUTTON,
    defaultConfig: { text: "ชั่วโมงกิจกรรม 2 ชม.", backgroundColor: "#f3e8ff", textColor: "#8A2680", borderRadius: "lg" },
    presets: null,
    schemaVersion: "v1"
  },

  "success-chip-2": {
    id: "success-chip-2",
    typeId: "button-badge",
    name: "ป้ายประเภทกิจกรรม",
    pages: ["success"],
    section: "googleFormLink",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_BUTTON,
    defaultConfig: { text: "ประเภทเลือกเข้าร่วม", backgroundColor: "#fff1f2", textColor: "#e11d48", borderRadius: "lg" },
    presets: null,
    schemaVersion: "v1"
  },

  "success-lock-indicator": {
    id: "success-lock-indicator",
    typeId: "text-body",
    name: "ข้อความปลดล็อกหน้าผล",
    pages: ["success"],
    section: "googleFormLink",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "และ ปลดล็อคหน้าสรุปผลคะแนนเสียง", fontSize: "xs", color: "#475569", fontWeight: "normal", align: "center" },
    presets: null,
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // candidates page (from EXTRA_ELEMENTS_SCHEMA)
  // ----------------------------------------------------------
  "candidates-tagline": {
    id: "candidates-tagline",
    typeId: "button-badge",
    name: "ป้าย Tagline",
    pages: ["candidates"],
    section: "header",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_BUTTON,
    defaultConfig: {},
    presets: null,
    schemaVersion: "v1"
  },

  "candidates-title": {
    id: "candidates-title",
    typeId: "text-title",
    name: "หัวข้อหลัก",
    pages: ["candidates"],
    section: "header",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: {},
    presets: null,
    schemaVersion: "v1"
  },

  "candidates-subtitle": {
    id: "candidates-subtitle",
    typeId: "text-subtitle",
    name: "คำบรรยาย",
    pages: ["candidates"],
    section: "header",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: {},
    presets: null,
    schemaVersion: "v1"
  },

  "candidates-counter": {
    id: "candidates-counter",
    typeId: "button-badge",
    name: "ป้ายนับจำนวน",
    pages: ["candidates"],
    section: "header",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_BUTTON,
    defaultConfig: {},
    presets: null,
    schemaVersion: "v1"
  },

  "candidates-party-card": {
    id: "candidates-party-card",
    typeId: "card-party",
    name: "การ์ดพรรค",
    pages: ["candidates"],
    section: "partyCardGrid",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_CARD,
    defaultConfig: {},
    presets: null,
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // results page (orphan Wraps in ResultsEditorPreview.js — Step 3 registration)
  // ----------------------------------------------------------
  "results-header": {
    id: "results-header",
    typeId: "text-title",
    name: "หัวข้อหน้าผลคะแนน",
    pages: ["results"],
    section: "header",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "ผลการเลือกตั้ง", fontSize: "5xl", color: "#1e293b", fontWeight: "900", align: "center" },
    presets: null,
    schemaVersion: "v1"
  },

  "results-stats-bar": {
    id: "results-stats-bar",
    typeId: "toggle-visibility",
    name: "แถบสถิติผลคะแนน",
    pages: ["results"],
    section: "chartSection",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TOGGLE,
    defaultConfig: { visible: true },
    presets: null,
    schemaVersion: "v1"
  },

  "results-candidates-heading": {
    id: "results-candidates-heading",
    typeId: "text-label",
    name: "หัวข้อสรุปผล",
    pages: ["results"],
    section: "candidateCards",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "🏆 สรุปผลการเลือกตั้ง (Official Results)", fontSize: "sm", color: "#475569", fontWeight: "700" },
    presets: null,
    schemaVersion: "v1"
  },

  "results-demographics": {
    id: "results-demographics",
    typeId: "toggle-visibility",
    name: "ส่วน Demographics",
    pages: ["results"],
    section: "demographics",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TOGGLE,
    defaultConfig: { visible: true },
    presets: null,
    schemaVersion: "v1"
  },

  // ----------------------------------------------------------
  // closed page (Phase 2.5 — H-EDITOR-COMPLETION; Phase 2.6 adds lock-icon)
  // Default text values mirror STATE_MESSAGES.waiting in ClosedEditorPreview.js;
  // dynamic per-simMode text continues to render from STATE_MESSAGES at runtime.
  // ----------------------------------------------------------
  "closed-lock-icon": {
    id: "closed-lock-icon",
    typeId: "toggle-visibility",
    name: "ไอคอนล็อก",
    pages: ["closed"],
    section: "closedMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TOGGLE,
    defaultConfig: { visible: true },
    presets: null,
    schemaVersion: "v1"
  },

  "closed-title": {
    id: "closed-title",
    typeId: "text-title",
    name: "หัวข้อหน้าปิดระบบ",
    pages: ["closed"],
    section: "closedMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "ยังไม่เปิดรับลงคะแนน", fontSize: "2xl", color: "#1e293b", fontWeight: "900", align: "center" },
    presets: null,
    schemaVersion: "v1"
  },

  "closed-description": {
    id: "closed-description",
    typeId: "text-subtitle",
    name: "คำอธิบาย",
    pages: ["closed"],
    section: "closedMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "การลงคะแนนเสียงจะเริ่มในเร็วๆ นี้", fontSize: "sm", color: "#475569", fontWeight: "normal", align: "center" },
    presets: null,
    schemaVersion: "v1"
  },

  "closed-detail": {
    id: "closed-detail",
    typeId: "text-body",
    name: "รายละเอียดเพิ่มเติม",
    pages: ["closed"],
    section: "closedMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_TEXT,
    defaultConfig: { text: "วันที่ 6 กุมภาพันธ์ 2569 เวลา 08.30 น. - 17.00 น.", fontSize: "xs", color: "#64748b", fontWeight: "normal", align: "center" },
    presets: null,
    schemaVersion: "v1"
  },

  "closed-back-btn": {
    id: "closed-back-btn",
    typeId: "button-secondary",
    name: "ปุ่มกลับหน้าหลัก",
    pages: ["closed"],
    section: "closedMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: FIELDS_BUTTON,
    defaultConfig: { text: "กลับสู่หน้าหลัก", backgroundColor: "#f1f5f9", textColor: "#334155", borderRadius: "md" },
    presets: null,
    schemaVersion: "v1"
  }
};
