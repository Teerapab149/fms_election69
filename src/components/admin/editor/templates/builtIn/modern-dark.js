/**
 * Modern Dark Template — Sleek tech/premium identity
 *
 * Day 3b expansion: 13 element overrides + full theme over classic.
 * Identity: dark backgrounds, cyan accents, glow shadows.
 *
 * Per P-LOG-005: do NOT add new templates, do NOT modify classic.js here.
 * All overrides spread from classicTemplate first to preserve text/layout.
 */

import { classicTemplate } from "./classic";

export const modernDarkTemplate = {
  ...classicTemplate,
  id: "modern-dark",
  slug: "modern-dark",
  name: "โมเดิร์นดาร์ก",
  description: "ดีไซน์มืดเข้ม โทนเทคโนโลยี เน้น cyan + glow effect",

  colorSwatch: {
    primary: "#06b6d4",
    secondary: "#8b5cf6",
    background: "#0f172a"
  },

  pages: {
    home:       { visible: true, backgroundColor: "#0f172a" },
    vote:       { visible: true, backgroundColor: "#0f172a" },
    candidates: { visible: true, backgroundColor: "#0f172a" },
    results:    { visible: true, backgroundColor: "#0f172a" },
    closed:     { visible: true, backgroundColor: "#0f172a" },
    success:    { visible: true, backgroundColor: "#0f172a" }
  },

  theme: {
    colors: {
      primary:    "#06b6d4",
      accent:     "#8b5cf6",
      background: "#0f172a",
      surface:    "#1e293b",
      text:       "#ffffff",
      textMuted:  "#94a3b8",
      border:     "#334155"
    },
    typography: classicTemplate.theme?.typography,
    spacing:    classicTemplate.theme?.spacing,
    effects: {
      borderRadius: "0.5rem",
      shadow:       "0 10px 40px rgba(6,182,212,0.25)"
    }
  },

  elements: {
    ...classicTemplate.elements,

    // === Hero ===
    "hero-title": {
      config: {
        ...classicTemplate.elements["hero-title"].config,
        color: "#ffffff"
      }
    },
    "hero-subtitle": {
      config: {
        ...classicTemplate.elements["hero-subtitle"].config,
        color: "#cbd5e1"
      }
    },
    "hero-subtitle2": {
      config: {
        ...classicTemplate.elements["hero-subtitle2"].config,
        color: "#94a3b8"
      }
    },
    "hero-year-badge": {
      config: {
        ...classicTemplate.elements["hero-year-badge"].config,
        color: "#94a3b8"
      }
    },

    // === voteCTA — cyan/purple palette per state ===
    "voteCTA-button": {
      config: {
        login: {
          ...classicTemplate.elements["voteCTA-button"].config.login,
          gradientFrom: "#1e3a8a",
          gradientVia:  "#3730a3",
          gradientTo:   "#06b6d4",
          backgroundColor: "#3730a3",
          shadowColor:  "#06b6d4"
        },
        notVoted: {
          ...classicTemplate.elements["voteCTA-button"].config.notVoted,
          gradientFrom: "#06b6d4",
          gradientVia:  "#0891b2",
          gradientTo:   "#0e7490",
          backgroundColor: "#06b6d4",
          shadowColor:  "#06b6d4"
        },
        voted: {
          ...classicTemplate.elements["voteCTA-button"].config.voted,
          gradientFrom: "#8b5cf6",
          gradientVia:  "#7c3aed",
          gradientTo:   "#6d28d9",
          backgroundColor: "#8b5cf6",
          shadowColor:  "#8b5cf6"
        },
        ended:  classicTemplate.elements["voteCTA-button"].config.ended,
        closed: classicTemplate.elements["voteCTA-button"].config.closed,
        paused: classicTemplate.elements["voteCTA-button"].config.paused
      }
    },

    // === Stats cards ===
    "stats-voted-card": {
      config: {
        ...classicTemplate.elements["stats-voted-card"].config,
        backgroundColor: "#1e293b",
        textColor:       "#ffffff"
      }
    },
    "stats-progress-card": {
      config: {
        ...classicTemplate.elements["stats-progress-card"].config,
        backgroundColor: "#1e293b",
        borderColor:     "#334155"
      }
    },
    "stats-eligible-card": {
      config: {
        ...classicTemplate.elements["stats-eligible-card"].config,
        backgroundColor: "#1e293b",
        borderColor:     "#334155"
      }
    },

    // === Meet section ===
    "meet-section": {
      config: {
        ...classicTemplate.elements["meet-section"].config,
        backgroundColor: "#1e293b",
        borderColor:     "#06b6d4"
      }
    },
    "meet-title": {
      config: {
        ...classicTemplate.elements["meet-title"].config,
        color: "#ffffff"
      }
    },
    "meet-cta": {
      config: {
        ...classicTemplate.elements["meet-cta"].config,
        backgroundColor: "#06b6d4",
        textColor:       "#0f172a"
      }
    },

    // === Banner ===
    "banner-section": {
      config: {
        ...classicTemplate.elements["banner-section"].config,
        backgroundColor: "#1e293b",
        borderColor:     "#334155"
      }
    },

    // === Vote page ===
    "vote-header-title": {
      config: {
        ...classicTemplate.elements["vote-header-title"].config,
        color: "#ffffff"
      }
    },
    "vote-header-subtitle": {
      config: {
        ...classicTemplate.elements["vote-header-subtitle"].config,
        color: "#94a3b8"
      }
    },
    "vote-party-card": {
      config: {
        ...classicTemplate.elements["vote-party-card"].config,
        backgroundColor: "#1e293b",
        borderColor:     "#334155"
      }
    }
  }
};

export default modernDarkTemplate;
