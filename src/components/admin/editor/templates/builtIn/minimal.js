/**
 * Minimal Template — Monochrome editorial identity
 *
 * Day 3b expansion: 13 element overrides + full theme over classic.
 * Identity: pure white, monochrome (no gradients), sharp corners, no shadows.
 *
 * Per P-LOG-005: do NOT add new templates, do NOT modify classic.js here.
 */

import { classicTemplate } from "./classic";

export const minimalTemplate = {
  ...classicTemplate,
  id: "minimal",
  slug: "minimal",
  name: "มินิมอล",
  description: "ดีไซน์เรียบง่าย ขาว-ดำ-เทา เน้น typography ลดความฟุ้ง",

  colorSwatch: {
    primary: "#1f2937",
    secondary: "#6b7280",
    background: "#ffffff"
  },

  pages: {
    home:       { visible: true, backgroundColor: "#ffffff" },
    vote:       { visible: true, backgroundColor: "#ffffff" },
    candidates: { visible: true, backgroundColor: "#ffffff" },
    results:    { visible: true, backgroundColor: "#ffffff" },
    closed:     { visible: true, backgroundColor: "#ffffff" },
    success:    { visible: true, backgroundColor: "#ffffff" }
  },

  theme: {
    colors: {
      primary:    "#1f2937",
      accent:     "#6b7280",
      background: "#ffffff",
      surface:    "#f9fafb",
      text:       "#000000",
      textMuted:  "#9ca3af",
      border:     "#e5e7eb"
    },
    typography: classicTemplate.theme?.typography,
    spacing:    classicTemplate.theme?.spacing,
    effects: {
      borderRadius: "0.25rem",
      shadow:       "none"
    }
  },

  elements: {
    ...classicTemplate.elements,

    // === Hero ===
    "hero-title": {
      config: {
        ...classicTemplate.elements["hero-title"].config,
        color: "#000000"
      }
    },
    "hero-subtitle": {
      config: {
        ...classicTemplate.elements["hero-subtitle"].config,
        color: "#374151"
      }
    },
    "hero-subtitle2": {
      config: {
        ...classicTemplate.elements["hero-subtitle2"].config,
        color: "#6b7280"
      }
    },
    "hero-year-badge": {
      config: {
        ...classicTemplate.elements["hero-year-badge"].config,
        color: "#6b7280"
      }
    },

    // === voteCTA — monochrome solid, no gradients, no shadows ===
    "voteCTA-button": {
      config: {
        login: {
          ...classicTemplate.elements["voteCTA-button"].config.login,
          backgroundType:  "solid",
          backgroundColor: "#1f2937",
          shadow:          "none",
          borderRadius:    "md"
        },
        notVoted: {
          ...classicTemplate.elements["voteCTA-button"].config.notVoted,
          backgroundType:  "solid",
          backgroundColor: "#374151",
          shadow:          "none",
          borderRadius:    "md"
        },
        voted: {
          ...classicTemplate.elements["voteCTA-button"].config.voted,
          backgroundType:  "solid",
          backgroundColor: "#6b7280",
          shadow:          "none",
          borderRadius:    "md"
        },
        ended: {
          ...classicTemplate.elements["voteCTA-button"].config.ended,
          backgroundType:  "solid",
          backgroundColor: "#9ca3af",
          shadow:          "none",
          borderRadius:    "md"
        },
        closed: {
          ...classicTemplate.elements["voteCTA-button"].config.closed,
          backgroundType:  "solid",
          backgroundColor: "#9ca3af",
          shadow:          "none",
          borderRadius:    "md"
        },
        paused: {
          ...classicTemplate.elements["voteCTA-button"].config.paused,
          backgroundType:  "solid",
          backgroundColor: "#4b5563",
          shadow:          "none",
          borderRadius:    "md"
        }
      }
    },

    // === Stats cards ===
    "stats-voted-card": {
      config: {
        ...classicTemplate.elements["stats-voted-card"].config,
        backgroundType:  "solid",
        backgroundColor: "#1f2937",
        textColor:       "#ffffff",
        borderRadius:    "md"
      }
    },
    "stats-progress-card": {
      config: {
        ...classicTemplate.elements["stats-progress-card"].config,
        backgroundColor: "#f9fafb",
        borderColor:     "#e5e7eb",
        borderRadius:    "md",
        numberColor:     "#000000",
        labelColor:      "#9ca3af",
        accentColor:     "#6b7280"
      }
    },
    "stats-eligible-card": {
      config: {
        ...classicTemplate.elements["stats-eligible-card"].config,
        backgroundColor: "#f9fafb",
        borderColor:     "#e5e7eb",
        borderRadius:    "md",
        numberColor:     "#000000",
        labelColor:      "#9ca3af",
        iconColor:       "#9ca3af"
      }
    },

    // === Meet section ===
    "meet-section": {
      config: {
        ...classicTemplate.elements["meet-section"].config,
        backgroundColor: "#f9fafb",
        borderColor:     "#e5e7eb",
        borderRadius:    "lg",
        glowFrom:        "#9ca3af",
        glowVia:         "#6b7280",
        glowTo:          "#4b5563",
        surfaceLight:    false
      }
    },
    "meet-title": {
      config: {
        ...classicTemplate.elements["meet-title"].config,
        color: "#000000"
      }
    },
    "meet-cta": {
      config: {
        ...classicTemplate.elements["meet-cta"].config,
        backgroundColor: "#1f2937",
        textColor:       "#ffffff",
        borderRadius:    "md"
      }
    },

    // === Banner ===
    "banner-section": {
      config: {
        ...classicTemplate.elements["banner-section"].config,
        borderColor:  "#e5e7eb",
        borderRadius: "lg"
      }
    },

    // === Vote page ===
    "vote-header-title": {
      config: {
        ...classicTemplate.elements["vote-header-title"].config,
        color: "#000000"
      }
    },
    "vote-party-card": {
      config: {
        ...classicTemplate.elements["vote-party-card"].config,
        backgroundColor: "#ffffff",
        borderColor:     "#e5e7eb",
        borderRadius:    "md"
      }
    }
  }
};

export default minimalTemplate;
