/**
 * Registry for STATE-AWARE elements.
 * These elements change appearance based on runtime conditions.
 *
 * Schema:
 *   {
 *     "element-id": {
 *       type: "button" | "card" | "badge" | "text" | "banner",
 *       label: "display name in Thai",
 *       section: "section name for grouping",
 *       isStateful: true,
 *       states: [{ id, label, description }],
 *       stateResolverKey: "key to lookup in stateResolvers",
 *       editableText: true | false,    // can admin edit text per state?
 *       defaultConfig: { ... fallback config if no template applied ... }
 *     }
 *   }
 */

// Global state types used across elements
export const GLOBAL_STATE_DIMENSIONS = {
  electionPhase: {
    label: "ช่วงเลือกตั้ง",
    values: ["upcoming", "active", "ended"]
  },
  systemMode: {
    label: "โหมดระบบ",
    values: ["auto", "pause", "closed"]
  },
  userAuth: {
    label: "การล็อกอิน",
    values: ["guest", "loggedIn"]
  },
  userVoteStatus: {
    label: "สถานะโหวต",
    values: ["notVoted", "voted"]
  },
  resultReveal: {
    label: "การเปิดเผยผล",
    values: ["hidden", "revealed"]
  }
};

// The registry itself — start with voteCTA-button
// Other elements will be added in later steps (H-5, H-6, etc.)
export const STATEFUL_ELEMENTS = {
  "voteCTA-button": {
    type: "button",
    label: "ปุ่มโหวต",
    section: "voteCTA",
    isStateful: true,
    editableText: true,
    stateResolverKey: "voteCTA",
    states: [
      { id: "login",    label: "ยังไม่ล็อกอิน",      description: "ผู้ใช้ยังไม่ล็อกอินเข้าระบบ" },
      { id: "notVoted", label: "ยังไม่โหวต",          description: "ล็อกอินแล้วแต่ยังไม่โหวต" },
      { id: "voted",    label: "โหวตแล้ว",            description: "โหวตเสร็จแล้ว" },
      { id: "ended",    label: "หมดเวลา",             description: "หมดช่วงเลือกตั้ง" },
      { id: "closed",   label: "ปิดรับโหวต",          description: "ระบบปิดรับโหวต manual" },
      { id: "paused",   label: "PAUSE (ปรับปรุง)",   description: "ระบบปิดปรับปรุงชั่วคราว" }
    ],
    defaultConfig: {
      // Fallback config — used if no template applied
      login:    { text: "เข้าสู่ระบบ / Sign in",        backgroundColor: "#8A2680", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      notVoted: { text: "ลงคะแนน / Vote Now",           backgroundColor: "#10B981", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      voted:    { text: "ดูผลคะแนน / Results",          backgroundColor: "#0369a1", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      ended:    { text: "อยู่นอกระยะเวลาเลือกตั้ง / Ended", backgroundColor: "#1e293b", textColor: "#94a3b8", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      closed:   { text: "ระบบปิดรับลงคะแนน / Closed",   backgroundColor: "#1e293b", textColor: "#94a3b8", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      paused:   { text: "ระบบปิดปรับปรุง / Maintenance", backgroundColor: "#ea580c", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" }
    }
  },

  "hero-countdown": {
    type: "countdown",
    label: "นาฬิกานับเวลา",
    section: "hero",
    isStateful: true,
    editableText: true,
    stateResolverKey: "countdown",
    states: [
      { id: "before",      label: "ก่อนเริ่ม",             description: "ก่อนถึงเวลาเริ่มเลือกตั้ง" },
      { id: "running",     label: "กำลังเลือกตั้ง",        description: "อยู่ในช่วงเลือกตั้ง — นับถอยหลังจนปิด" },
      { id: "paused",      label: "ระบบ PAUSE",            description: "admin สั่งปิดปรับปรุงชั่วคราว" },
      { id: "manualEnded", label: "ปิดด้วย admin (ENDED)", description: "admin บังคับปิดก่อนเวลา" },
      { id: "nextYear",    label: "เลยช่วงเลือกตั้ง",      description: "เลยกำหนดแล้ว รอปีถัดไป" }
    ],
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
    }
  }
};

// Helpers
export function getStatefulElement(elementId) {
  return STATEFUL_ELEMENTS[elementId] || null;
}

export function isStatefulElement(elementId) {
  return !!STATEFUL_ELEMENTS[elementId];
}

export function getStatesOf(elementId) {
  return STATEFUL_ELEMENTS[elementId]?.states || [];
}

export function getDefaultStateConfig(elementId, stateId) {
  return STATEFUL_ELEMENTS[elementId]?.defaultConfig?.[stateId] || {};
}
