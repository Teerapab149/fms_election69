/**
 * Playful Template — Warm fun/energetic identity
 *
 * Day 3b expansion: 13 element overrides + full theme over classic.
 * Identity: pink/orange gradients, rounded 2xl corners, warm shadows.
 *
 * Per P-LOG-005: do NOT add new templates, do NOT modify classic.js here.
 */

import { classicTemplate } from "./classic";

export const playfulTemplate = {
  ...classicTemplate,
  id: "playful",
  slug: "playful",
  name: "สนุกสนาน",
  description: "ดีไซน์สดใส โทนชมพู-ส้ม กลม-นุ่ม เหมาะกับงานที่อยากให้รู้สึกผ่อนคลาย",

  colorSwatch: {
    primary: "#ec4899",
    secondary: "#f59e0b",
    background: "#fef3c7"
  },

  pages: {
    home:       { visible: true, backgroundColor: "#fffbeb" },
    vote:       { visible: true, backgroundColor: "#fffbeb" },
    candidates: { visible: true, backgroundColor: "#fffbeb" },
    results:    { visible: true, backgroundColor: "#fffbeb" },
    closed:     { visible: true, backgroundColor: "#fffbeb" },
    success:    { visible: true, backgroundColor: "#fffbeb" }
  },

  theme: {
    colors: {
      primary:    "#ec4899",
      accent:     "#f59e0b",
      background: "#fffbeb",
      surface:    "#ffffff",
      text:       "#1f2937",
      textMuted:  "#6b7280",
      border:     "#fde68a"
    },
    typography: classicTemplate.theme?.typography,
    spacing:    classicTemplate.theme?.spacing,
    effects: {
      borderRadius: "1.5rem",
      shadow:       "0 8px 16px -4px rgba(236,72,153,0.15)"
    }
  },

  elements: {
    ...classicTemplate.elements,

    // === Hero ===
    "hero-title": {
      config: {
        ...classicTemplate.elements["hero-title"].config,
        color: "#1f2937"
      }
    },
    "hero-subtitle": {
      config: {
        ...classicTemplate.elements["hero-subtitle"].config,
        color: "#ec4899"
      }
    },
    "hero-year-badge": {
      config: {
        ...classicTemplate.elements["hero-year-badge"].config,
        color: "#f59e0b"
      }
    },

    // === voteCTA — pink/orange palette, larger radius ===
    "voteCTA-button": {
      config: {
        login: {
          ...classicTemplate.elements["voteCTA-button"].config.login,
          gradientFrom: "#f97316",
          gradientVia:  "#ec4899",
          gradientTo:   "#d946ef",
          backgroundColor: "#ec4899",
          shadowColor:  "#ec4899",
          borderRadius: "2xl"
        },
        notVoted: {
          ...classicTemplate.elements["voteCTA-button"].config.notVoted,
          gradientFrom: "#f59e0b",
          gradientVia:  "#f97316",
          gradientTo:   "#ea580c",
          backgroundColor: "#f97316",
          shadowColor:  "#f97316",
          borderRadius: "2xl"
        },
        voted: {
          ...classicTemplate.elements["voteCTA-button"].config.voted,
          gradientFrom: "#ec4899",
          gradientVia:  "#d946ef",
          gradientTo:   "#a855f7",
          backgroundColor: "#d946ef",
          shadowColor:  "#d946ef",
          borderRadius: "2xl"
        },
        ended: {
          ...classicTemplate.elements["voteCTA-button"].config.ended,
          borderRadius: "2xl"
        },
        closed: {
          ...classicTemplate.elements["voteCTA-button"].config.closed,
          borderRadius: "2xl"
        },
        paused: {
          ...classicTemplate.elements["voteCTA-button"].config.paused,
          borderRadius: "2xl"
        }
      }
    },

    // === Stats cards ===
    "stats-voted-card": {
      config: {
        ...classicTemplate.elements["stats-voted-card"].config,
        backgroundType: "gradient",
        backgroundColor: "#ec4899",
        gradientFrom: "#f97316",
        gradientVia:  "#ec4899",
        gradientTo:   "#d946ef",
        gradientDirection: "to-br",
        textColor:    "#ffffff",
        borderRadius: "3xl"
      }
    },
    "stats-progress-card": {
      config: {
        ...classicTemplate.elements["stats-progress-card"].config,
        backgroundColor: "#ffffff",
        borderColor:     "#fde68a",
        borderRadius:    "2xl",
        numberColor:     "#1f2937",
        labelColor:      "#f59e0b",
        accentColor:     "#ec4899"
      }
    },
    "stats-eligible-card": {
      config: {
        ...classicTemplate.elements["stats-eligible-card"].config,
        backgroundColor: "#ffffff",
        borderColor:     "#fde68a",
        borderRadius:    "2xl",
        numberColor:     "#1f2937",
        labelColor:      "#f59e0b",
        iconColor:       "#f59e0b"
      }
    },

    // === Meet section ===
    "meet-section": {
      config: {
        ...classicTemplate.elements["meet-section"].config,
        backgroundColor: "#ffffff",
        borderColor:     "#fde68a",
        borderRadius:    "3xl",
        glowFrom:        "#f97316",
        glowVia:         "#ec4899",
        glowTo:          "#d946ef",
        surfaceLight:    true
      }
    },
    "meet-title": {
      config: {
        ...classicTemplate.elements["meet-title"].config,
        color: "#ec4899"
      }
    },
    "meet-cta": {
      config: {
        ...classicTemplate.elements["meet-cta"].config,
        backgroundColor: "#ec4899",
        textColor:       "#ffffff"
      }
    },

    // === Banner ===
    "banner-section": {
      config: {
        ...classicTemplate.elements["banner-section"].config,
        borderColor:  "#fbcfe8",
        borderRadius: "3xl"
      }
    },

    // === Vote page ===
    "vote-header-title": {
      config: {
        ...classicTemplate.elements["vote-header-title"].config,
        color: "#1f2937"
      }
    },
    "vote-party-card": {
      config: {
        ...classicTemplate.elements["vote-party-card"].config,
        backgroundColor: "#ffffff",
        borderColor:     "#fde68a",
        borderRadius:    "2xl"
      }
    }
  }
};

export default playfulTemplate;
