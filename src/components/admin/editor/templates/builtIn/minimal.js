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
    // Day 6: home.backgroundColor removed — --color-bg drives.
    home:       { visible: true },
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
    },
    // Layer 1 tokens — full set per D5 (no inheritance, snapshot-friendly).
    // Mono theme: white bg, slate text, sharp radii, no shadows.
    tokens: {
      "--color-primary":     "#1f2937",
      "--color-accent":      "#6b7280",
      "--color-bg":          "#ffffff",
      "--color-surface":     "#f9fafb",
      "--color-text":        "#000000",
      "--color-text-muted":  "#9ca3af",
      "--color-border":      "#e5e7eb",
      "--radius-sm":         "2px",
      "--radius-md":         "4px",
      "--radius-card":       "8px",
      "--radius-button":     "6px",
      "--shadow-card":       "none",
      "--shadow-button":     "none",
      "--font-display":      "Inter, system-ui, sans-serif",
      "--font-body":         "Inter, system-ui, sans-serif"
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
      variant: "default",
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
      },
      vars: {
        "--btn-bg":              "var(--color-primary)",
        "--btn-bg-gradient":     "none",
        "--btn-text":            "var(--color-surface)",
        "--btn-border-color":    "transparent",
        "--btn-border-width":    "0px",
        "--btn-radius":          "var(--radius-button)",
        "--btn-shadow":          "var(--shadow-button)",
        "--btn-padding-x":       "32px",
        "--btn-padding-y":       "16px",
        "--btn-font-size":       "16px",
        "--btn-font-weight":     "600",
        "--btn-hover-bg":        "var(--btn-bg)",
        "--btn-hover-shadow":    "var(--btn-shadow)",
        "--btn-hover-transform": "none",
        "--btn-icon-color":      "var(--btn-text)",
        "--btn-letter-spacing":  "normal",
        "--btn-text-transform":  "none"
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
    // Day 6: bg+border removed — --color-surface + --color-border drive.
    // NOT spreading classic — classic's borderColor #f1f5f9 would override
    // minimal's slate token border #e5e7eb via spread inheritance.
    "stats-progress-card": {
      config: {
        borderRadius: "md",
        numberColor:  "#000000",
        labelColor:   "#9ca3af",
        accentColor:  "#6b7280"
      }
    },
    "stats-eligible-card": {
      config: {
        borderRadius: "md",
        numberColor:  "#000000",
        labelColor:   "#9ca3af",
        iconColor:    "#9ca3af"
      }
    },

    // === Meet section ===
    // Day 6: backgroundColor removed — --color-surface drives.
    // Day 7a: borderRadius "lg" (=8px) removed — matches minimal's --radius-card.
    // Day 7a: dropped classic spread (preventive — only inherited `visible`).
    "meet-section": {
      config: {
        visible:         true,
        borderColor:     "#e5e7eb",
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
    // Day 6: borderColor removed — --color-border drives.
    // NOT spreading classic — classic sets borderColor #ffffff which would
    // override minimal's token border #e5e7eb via spread inheritance.
    // Day 7a: borderRadius "lg" (=8px) removed — matches minimal's --radius-card.
    // Day 7a Part 4: Layer 2 pilot — vars declared at element root.
    // Day 7b: explicit variant field.
    "banner-section": {
      variant: "default",
      config: { visible: true },
      vars: {
        "--banner-bg":     "var(--color-surface)",
        "--banner-border": "var(--color-border)",
        "--banner-radius": "var(--radius-card)"
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
