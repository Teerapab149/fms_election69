/**
 * Template engine for state-aware elements.
 *
 * Data layers:
 *   Layer 1: TEMPLATES (read-only, hardcoded)
 *   Layer 2: activeState (saved in DB per admin session)
 *     - sourceTemplate: which template is active
 *     - elementOverrides: { [elementId]: { [stateId]: { ...partial config } } }
 *     - backgroundId: which background is active
 *   Layer 3: resolved config (computed at render time)
 *     = template defaults + overrides merged
 */

// ============================================================
// TEMPLATES
// ============================================================

export const TEMPLATES = {
  classic: {
    id: "classic",
    name: "คลาสสิก",
    description: "สีม่วง-ขาว สไตล์ทางการ สำหรับการเลือกตั้งมาตรฐาน",
    previewColor: "#8A2680",
    defaultBackgroundId: "gradient-purple-light",
    elements: {
      "voteCTA-button": {
        login: {
          text: "เข้าสู่ระบบ / Sign in",
          backgroundType: "gradient",
          backgroundColor: "#8A2680",
          gradientFrom: "#691E61",
          gradientVia: "#8A2680",
          gradientTo: "#C026D3",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "lg",
          shadowColor: "#8A2680",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "LogIn",
          iconPosition: "right",
          hoverEffect: "lift"
        },
        notVoted: {
          text: "ลงคะแนน / Vote Now",
          backgroundType: "gradient",
          backgroundColor: "#10B981",
          gradientFrom: "#10B981",
          gradientVia: "#059669",
          gradientTo: "#047857",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "lg",
          shadowColor: "#10B981",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "lift"
        },
        voted: {
          text: "ดูผลคะแนน / Results",
          backgroundType: "gradient",
          backgroundColor: "#0369a1",
          gradientFrom: "#0369a1",
          gradientVia: "#0284c7",
          gradientTo: "#38bdf8",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "lg",
          shadowColor: "#0369a1",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "BarChart3",
          iconPosition: "right",
          hoverEffect: "lift"
        },
        ended: {
          text: "อยู่นอกระยะเวลาเลือกตั้ง / Ended",
          backgroundType: "gradient",
          backgroundColor: "#1e293b",
          gradientFrom: "#334155",
          gradientVia: "#1e293b",
          gradientTo: "#0f172a",
          gradientDirection: "to-r",
          textColor: "#94a3b8",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "md",
          shadowColor: "#000000",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "none"
        },
        closed: {
          text: "ระบบปิดรับลงคะแนน / Closed",
          backgroundType: "gradient",
          backgroundColor: "#1e293b",
          gradientFrom: "#334155",
          gradientVia: "#1e293b",
          gradientTo: "#0f172a",
          gradientDirection: "to-r",
          textColor: "#94a3b8",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "md",
          shadowColor: "#000000",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "none"
        },
        paused: {
          text: "ระบบปิดปรับปรุงชั่วคราว / Maintenance",
          backgroundType: "gradient",
          backgroundColor: "#ea580c",
          gradientFrom: "#f97316",
          gradientVia: "#ea580c",
          gradientTo: "#c2410c",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "lg",
          shadowColor: "#ea580c",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "none"
        }
      },
      "hero-countdown": {
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
  },

  neon: {
    id: "neon",
    name: "นีออน",
    description: "สีสดใส เรืองแสง สไตล์ Cyberpunk สำหรับ audience วัยรุ่น",
    previewColor: "#06b6d4",
    defaultBackgroundId: "gradient-cyber-dark",
    elements: {
      "voteCTA-button": {
        login: {
          text: "SIGN IN",
          backgroundType: "solid",
          backgroundColor: "#06B6D4",
          gradientFrom: "#06B6D4",
          gradientVia: null,
          gradientTo: "#06B6D4",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "full",
          borderColor: "#0891B2",
          borderWidth: "2",
          shadow: "2xl",
          shadowColor: "#06B6D4",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "LogIn",
          iconPosition: "right",
          hoverEffect: "glow"
        },
        notVoted: {
          text: "VOTE NOW",
          backgroundType: "solid",
          backgroundColor: "#84CC16",
          gradientFrom: "#84CC16",
          gradientVia: null,
          gradientTo: "#65A30D",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "full",
          borderColor: "#65A30D",
          borderWidth: "2",
          shadow: "2xl",
          shadowColor: "#84CC16",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "glow"
        },
        voted: {
          text: "SEE RESULTS",
          backgroundType: "solid",
          backgroundColor: "#A855F7",
          gradientFrom: "#A855F7",
          gradientVia: null,
          gradientTo: "#7E22CE",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "full",
          borderColor: "#7E22CE",
          borderWidth: "2",
          shadow: "2xl",
          shadowColor: "#A855F7",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "BarChart3",
          iconPosition: "right",
          hoverEffect: "glow"
        },
        ended: {
          text: "ENDED",
          backgroundType: "solid",
          backgroundColor: "#0f172a",
          gradientFrom: "#0f172a",
          gradientVia: null,
          gradientTo: "#0f172a",
          gradientDirection: "to-r",
          textColor: "#64748b",
          borderRadius: "full",
          borderColor: "#334155",
          borderWidth: "2",
          shadow: "md",
          shadowColor: "#000000",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "None",
          iconPosition: "none",
          hoverEffect: "none"
        },
        closed: {
          text: "CLOSED",
          backgroundType: "solid",
          backgroundColor: "#0f172a",
          gradientFrom: "#0f172a",
          gradientVia: null,
          gradientTo: "#0f172a",
          gradientDirection: "to-r",
          textColor: "#64748b",
          borderRadius: "full",
          borderColor: "#334155",
          borderWidth: "2",
          shadow: "md",
          shadowColor: "#000000",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "None",
          iconPosition: "none",
          hoverEffect: "none"
        },
        paused: {
          text: "MAINTENANCE",
          backgroundType: "solid",
          backgroundColor: "#f59e0b",
          gradientFrom: "#f59e0b",
          gradientVia: null,
          gradientTo: "#d97706",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "full",
          borderColor: "#d97706",
          borderWidth: "2",
          shadow: "2xl",
          shadowColor: "#f59e0b",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "glow"
        }
      },
      "hero-countdown": {
        before: {
          label: "INCOMING", pillBackground: "#0f172a",
          badgeBackgroundColor: "#06b6d4", badgeTextColor: "#ffffff",
          textMain: "#06b6d4", textSub: "#67e8f9",
          borderColor: "#0e7490", shadow: "xl", shadowColor: "#06b6d4",
          iconName: "Flag", iconAnimation: "none"
        },
        running: {
          label: "LIVE NOW", pillBackground: "#0f172a",
          badgeBackgroundColor: "#84cc16", badgeTextColor: "#ffffff",
          textMain: "#a3e635", textSub: "#bef264",
          borderColor: "#65a30d", shadow: "2xl", shadowColor: "#84cc16",
          iconName: "Zap", iconAnimation: "pulse"
        },
        paused: {
          label: "PAUSED", pillBackground: "#0f172a",
          badgeBackgroundColor: "#f59e0b", badgeTextColor: "#ffffff",
          textMain: "#fbbf24", textSub: "#fcd34d",
          borderColor: "#d97706", shadow: "xl", shadowColor: "#f59e0b",
          iconName: "Hourglass", iconAnimation: "spin"
        },
        manualEnded: {
          label: "ENDED", pillBackground: "#0f172a",
          badgeBackgroundColor: "#475569", badgeTextColor: "#cbd5e1",
          textMain: "#94a3b8", textSub: "#64748b",
          borderColor: "#334155", shadow: "md", shadowColor: "#000000",
          iconName: "CalendarDays", iconAnimation: "none"
        },
        nextYear: {
          label: "SEE YOU {YEAR}", pillBackground: "#0f172a",
          badgeBackgroundColor: "#a855f7", badgeTextColor: "#ffffff",
          textMain: "#c084fc", textSub: "#d8b4fe",
          borderColor: "#7e22ce", shadow: "xl", shadowColor: "#a855f7",
          iconName: "CalendarDays", iconAnimation: "none"
        }
      }
    }
  }
};

// ============================================================
// BACKGROUNDS
// ============================================================

export const BACKGROUNDS = {
  "gradient-purple-light": {
    id: "gradient-purple-light",
    name: "ม่วง-ขาว",
    type: "gradient",
    config: { from: "#faf5ff", via: "#f3e8ff", to: "#ffffff", direction: "to-br" }
  },
  "gradient-cyber-dark": {
    id: "gradient-cyber-dark",
    name: "ไซเบอร์ดาร์ก",
    type: "gradient",
    config: { from: "#0f172a", via: "#06b6d4", to: "#0f172a", direction: "to-b" }
  },
  "solid-white": {
    id: "solid-white",
    name: "ขาวล้วน",
    type: "solid",
    config: { color: "#ffffff" }
  },
  "solid-dark": {
    id: "solid-dark",
    name: "ดำล้วน",
    type: "solid",
    config: { color: "#0f172a" }
  },
  "mesh-rainbow": {
    id: "mesh-rainbow",
    name: "รุ้งพาสเทล",
    type: "mesh",
    config: { colors: ["#fef3c7", "#fce7f3", "#ddd6fe", "#bae6fd"] }
  },
  "pattern-dots-light": {
    id: "pattern-dots-light",
    name: "ลายจุด (สว่าง)",
    type: "pattern",
    config: { pattern: "dots", bgColor: "#ffffff", dotColor: "#8A2680" }
  },
  "gradient-sunset": {
    id: "gradient-sunset",
    name: "พระอาทิตย์ตก",
    type: "gradient",
    config: { from: "#fbbf24", via: "#f472b6", to: "#a855f7", direction: "to-br" }
  }
};

// ============================================================
// HELPERS
// ============================================================

export function getTemplate(templateId) {
  return TEMPLATES[templateId] || null;
}

export function listTemplates() {
  return Object.values(TEMPLATES);
}

export function getBackground(backgroundId) {
  return BACKGROUNDS[backgroundId] || null;
}

export function listBackgrounds() {
  return Object.values(BACKGROUNDS);
}

/**
 * Resolve final config for an element state by merging template defaults
 * with admin overrides.
 *
 * @param {string} templateId - Active template ID
 * @param {string} elementId - Element ID
 * @param {string} stateId - State ID
 * @param {object} overrides - Admin overrides for this element+state
 * @returns {object} Merged config ready to render
 */
export function resolveStatefulConfig(templateId, elementId, stateId, overrides = {}) {
  const template = getTemplate(templateId);
  if (!template) {
    // Fallback to statefulRegistry defaults
    const { getDefaultStateConfig } = require('./statefulRegistry');
    return { ...getDefaultStateConfig(elementId, stateId), ...overrides };
  }

  const templateConfig = template.elements?.[elementId]?.[stateId] || {};

  // Shallow merge — admin overrides take precedence
  return { ...templateConfig, ...overrides };
}

/**
 * Check if an element+state has any overrides from the template defaults.
 */
export function hasOverrides(overrides, elementId, stateId) {
  const over = overrides?.[elementId]?.[stateId];
  return over && Object.keys(over).length > 0;
}
