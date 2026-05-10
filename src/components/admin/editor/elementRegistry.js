// Element registry — defines every editable element on each page plus 4 style presets.
// Presets: classic | dark | playful | minimal

export const PRESET_NAMES = {
  classic: { name: "คลาสสิก", color: "#8A2680" },
  dark:    { name: "ดาร์ก",    color: "#7C3AED" },
  playful: { name: "สนุกสนาน", color: "#EC4899" },
  minimal: { name: "มินิมอล",  color: "#1E293B" },
};

const statsSmallCardPresets = {
  classic: { backgroundColor: "#ffffff", borderRadius: "xl", borderColor: "#e2e8f0" },
  dark:    { backgroundColor: "#1e293b", borderRadius: "xl", borderColor: "#334155" },
  playful: { backgroundColor: "#fdf2f8", borderRadius: "2xl", borderColor: "#fbcfe8" },
  minimal: { backgroundColor: "#ffffff", borderRadius: "md", borderColor: "#e2e8f0" },
};

export const ELEMENT_PRESETS = {
  "hero-title": {
    type: "text",
    label: "ชื่อหลัก",
    section: "hero",
    boundTo: "electionName",
    presets: {
      classic: { text: "SAMO 49", fontSize: "5xl", color: "#1a1a2e", fontWeight: "900", align: "left" },
      dark:    { text: "SAMO 49", fontSize: "5xl", color: "#ffffff", fontWeight: "900", align: "left" },
      playful: { text: "SAMO 49", fontSize: "5xl", color: "#EC4899", fontWeight: "900", align: "center" },
      minimal: { text: "SAMO 49", fontSize: "4xl", color: "#1E293B", fontWeight: "700", align: "left" },
    },
  },

  "hero-subtitle": {
    type: "text",
    label: "คำอธิบายหลัก",
    section: "hero",
    boundTo: "campaignTitle",
    presets: {
      classic: { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "base", color: "#374151" },
      dark:    { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "base", color: "#94a3b8" },
      playful: { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "lg",   color: "#831843" },
      minimal: { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "sm",   color: "#64748b" },
    },
  },

  "hero-subtitle2": {
    type: "text",
    label: "คำอธิบายรอง",
    section: "hero",
    boundTo: "organizationName",
    presets: {
      classic: { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#6b7280" },
      dark:    { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#64748b" },
      playful: { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#9d174d" },
      minimal: { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "xs", color: "#94a3b8" },
    },
  },

  "hero-year-badge": {
    type: "text",
    label: "ปีการศึกษา",
    section: "hero",
    boundTo: "academicYearTh",
    presets: {
      classic: { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#6b7280" },
      dark:    { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#64748b" },
      playful: { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#be185d" },
      minimal: { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#94a3b8" },
    },
  },

  "hero-countdown": {
    type: "toggle",
    label: "Countdown Timer",
    section: "hero",
    boundTo: null,
    presets: {
      classic: { visible: true },
      dark:    { visible: true },
      playful: { visible: true },
      minimal: { visible: false },
    },
  },

  "hero-status-badge": {
    type: "toggle",
    label: "Status Badge",
    section: "hero",
    boundTo: null,
    presets: {
      classic: { visible: true },
      dark:    { visible: true },
      playful: { visible: true },
      minimal: { visible: false },
    },
  },

  "stats-header": {
    type: "text",
    label: "หัวข้อสถิติ",
    section: "stats",
    boundTo: null,
    presets: {
      classic: { text: "สถิติผู้เข้าร่วมลงคะแนนโหวต", fontSize: "xs", color: "#374151" },
      dark:    { text: "สถิติผู้เข้าร่วมลงคะแนนโหวต", fontSize: "xs", color: "#e2e8f0" },
      playful: { text: "มาโหวตกันเถอะ!",              fontSize: "sm", color: "#be185d" },
      minimal: { text: "สถิติ",                         fontSize: "xs", color: "#64748b" },
    },
  },

  "stats-voted-card": {
    type: "card",
    label: "กล่องจำนวนผู้โหวต",
    section: "stats",
    boundTo: null,
    presets: {
      classic: { backgroundColor: "#8A2680", textColor: "#ffffff", borderRadius: "2xl" },
      dark:    { backgroundColor: "#0f172a", textColor: "#06b6d4", borderRadius: "2xl", borderColor: "#06b6d4" },
      playful: { backgroundColor: "#EC4899", textColor: "#ffffff", borderRadius: "3xl" },
      minimal: { backgroundColor: "#1E293B", textColor: "#ffffff", borderRadius: "lg" },
    },
  },

  "stats-progress-card": {
    type: "card",
    label: "กล่องความคืบหน้า",
    section: "stats",
    boundTo: null,
    presets: statsSmallCardPresets,
  },

  "stats-eligible-card": {
    type: "card",
    label: "กล่องผู้มีสิทธิ์",
    section: "stats",
    boundTo: null,
    presets: statsSmallCardPresets,
  },

  "voteCTA-button": {
    type: "button",
    label: "ปุ่มโหวต",
    section: "voteCTA",
    boundTo: null,
    presets: {
      classic: { text: "เข้าสู่ระบบ / Sign In", backgroundColor: "#8A2680", textColor: "#ffffff", borderRadius: "xl" },
      dark:    { text: "VOTE NOW",              backgroundColor: "#06B6D4", textColor: "#ffffff", borderRadius: "full" },
      playful: { text: "โหวตเลย!",             backgroundColor: "#EC4899", textColor: "#ffffff", borderRadius: "full" },
      minimal: { text: "เข้าสู่ระบบ →",        backgroundColor: "transparent", textColor: "#1E293B", borderRadius: "none" },
    },
  },

  "meet-section": {
    type: "card",
    label: "การ์ดรู้จักผู้สมัคร",
    section: "meetCandidates",
    boundTo: null,
    presets: {
      classic: { backgroundColor: "#ffffff", borderRadius: "2xl", borderColor: "#fecdd3", visible: true },
      dark:    { backgroundColor: "#1e293b", borderRadius: "2xl", borderColor: "#334155", visible: true },
      playful: { backgroundColor: "#fdf2f8", borderRadius: "3xl", borderColor: "#fbcfe8", visible: true },
      minimal: { backgroundColor: "#ffffff", borderRadius: "lg",  borderColor: "#e2e8f0", visible: true },
    },
  },

  "meet-title": {
    type: "text",
    label: "หัวข้อรู้จักผู้สมัคร",
    section: "meetCandidates",
    boundTo: null,
    presets: {
      classic: { text: "รู้จักผู้สมัครของคุณหรือยัง?", fontSize: "sm",   color: "#1a1a2e", fontWeight: "700" },
      dark:    { text: "รู้จักผู้สมัครของคุณหรือยัง?", fontSize: "sm",   color: "#e2e8f0", fontWeight: "700" },
      playful: { text: "มาทำความรู้จักกัน!",           fontSize: "base", color: "#be185d", fontWeight: "700" },
      minimal: { text: "ผู้สมัคร",                      fontSize: "sm",   color: "#374151", fontWeight: "500" },
    },
  },

  "meet-cta": {
    type: "button",
    label: "ปุ่มดูรายชื่อ",
    section: "meetCandidates",
    boundTo: null,
    presets: {
      classic: { text: "ดูรายชื่อพรรค →", backgroundColor: "#1a1a2e", textColor: "#ffffff", borderRadius: "full" },
      dark:    { text: "ดูรายชื่อพรรค →", backgroundColor: "#06b6d4", textColor: "#ffffff", borderRadius: "full" },
      playful: { text: "ไปดูกัน! →",      backgroundColor: "#EC4899", textColor: "#ffffff", borderRadius: "full" },
      minimal: { text: "ดูรายชื่อ →",     backgroundColor: "transparent", textColor: "#1E293B", borderRadius: "none" },
    },
  },

  "banner-section": {
    type: "image",
    label: "แบนเนอร์เลือกตั้ง",
    section: "electionBanner",
    boundTo: null,
    presets: {
      classic: { visible: true,  borderRadius: "2xl" },
      dark:    { visible: true,  borderRadius: "2xl" },
      playful: { visible: true,  borderRadius: "3xl" },
      minimal: { visible: false, borderRadius: "lg"  },
    },
  },

  // === VOTE PAGE ELEMENTS ===
  "vote-header-badge": {
    type: "text",
    label: "ป้าย 'ลงคะแนนเสียง'",
    section: "voteHeader",
    boundTo: null,
    presets: {
      classic:  { text: "ลงคะแนนเสียง", fontSize: "xs", color: "#8A2680" },
      dark:     { text: "VOTE NOW", fontSize: "xs", color: "#06b6d4" },
      playful:  { text: "โหวตเลย!", fontSize: "sm", color: "#EC4899" },
      minimal:  { text: "ลงคะแนน", fontSize: "xs", color: "#64748b" }
    }
  },
  "vote-header-title": {
    type: "text",
    label: "หัวข้อหน้าโหวต",
    section: "voteHeader",
    boundTo: null,
    presets: {
      classic:  { text: "เลือกตั้งสโมสรนักศึกษา", fontSize: "3xl", color: "#1a1a2e", fontWeight: "black" },
      dark:     { text: "เลือกตั้งสโมสรนักศึกษา", fontSize: "3xl", color: "#ffffff", fontWeight: "black" },
      playful:  { text: "เลือกพรรคที่ใช่!", fontSize: "3xl", color: "#EC4899", fontWeight: "black" },
      minimal:  { text: "เลือกตั้ง", fontSize: "2xl", color: "#1E293B", fontWeight: "bold" }
    }
  },
  "vote-header-subtitle": {
    type: "text",
    label: "ข้อความทักทาย",
    section: "voteHeader",
    boundTo: null,
    presets: {
      classic:  { text: "โปรดเลือกพรรคที่ต้องการ", fontSize: "sm", color: "#64748b" },
      dark:     { text: "โปรดเลือกพรรคที่ต้องการ", fontSize: "sm", color: "#94a3b8" },
      playful:  { text: "เลือกพรรคในใจของคุณ!", fontSize: "base", color: "#be185d" },
      minimal:  { text: "โปรดเลือก", fontSize: "xs", color: "#94a3b8" }
    }
  },
  "vote-party-card": {
    type: "card",
    label: "การ์ดพรรค",
    section: "voteBody",
    boundTo: null,
    presets: {
      classic:  { backgroundColor: "#ffffff", borderRadius: "2xl", borderColor: "#e2e8f0" },
      dark:     { backgroundColor: "#1e293b", borderRadius: "2xl", borderColor: "#334155" },
      playful:  { backgroundColor: "#fdf2f8", borderRadius: "3xl", borderColor: "#fbcfe8" },
      minimal:  { backgroundColor: "#ffffff", borderRadius: "lg", borderColor: "#e2e8f0" }
    }
  },
  "vote-abstain-button": {
    type: "button",
    label: "ปุ่มงดออกเสียง",
    section: "voteBody",
    boundTo: null,
    presets: {
      classic:  { text: "งดออกเสียง", backgroundColor: "#ffffff", textColor: "#f97316", borderRadius: "xl", borderColor: "#fed7aa" },
      dark:     { text: "งดออกเสียง", backgroundColor: "#1e293b", textColor: "#f97316", borderRadius: "xl", borderColor: "#9a3412" },
      playful:  { text: "งดออกเสียง", backgroundColor: "#fff7ed", textColor: "#f97316", borderRadius: "full", borderColor: "#fed7aa" },
      minimal:  { text: "งดออกเสียง", backgroundColor: "transparent", textColor: "#64748b", borderRadius: "none" }
    }
  },
  "vote-disapprove-button": {
    type: "button",
    label: "ปุ่มไม่รับรอง (single-party)",
    section: "voteBody",
    boundTo: null,
    presets: {
      classic:  { text: "ไม่รับรอง", backgroundColor: "#ffffff", textColor: "#dc2626", borderRadius: "xl", borderColor: "#fecaca" },
      dark:     { text: "ไม่รับรอง", backgroundColor: "#1e293b", textColor: "#ef4444", borderRadius: "xl", borderColor: "#7f1d1d" },
      playful:  { text: "ไม่รับรอง", backgroundColor: "#fef2f2", textColor: "#dc2626", borderRadius: "full", borderColor: "#fecaca" },
      minimal:  { text: "ไม่รับรอง", backgroundColor: "transparent", textColor: "#64748b", borderRadius: "none" }
    }
  },
};

function clone(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

// Return all elements configured with a given preset.
// Shape: { [elementId]: { type, label, section, config } }
export function getPresetDefaults(presetId) {
  const out = {};
  for (const [id, def] of Object.entries(ELEMENT_PRESETS)) {
    const preset = def.presets?.[presetId] || def.presets?.classic || {};
    out[id] = {
      type: def.type,
      label: def.label,
      section: def.section,
      config: clone(preset),
    };
  }
  return out;
}

// Presets for a single element (for QuickStyleBar).
export function getElementPresets(elementId) {
  return ELEMENT_PRESETS[elementId]?.presets || {};
}

// Returns the globalConfig field key this element is bound to, or null if unbound.
export function getBinding(elementId) {
  const element = ELEMENT_PRESETS[elementId];
  return element?.boundTo || null;
}

export function isBoundElement(elementId) {
  return getBinding(elementId) !== null;
}
