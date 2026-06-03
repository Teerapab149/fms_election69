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
    // Day 6: home.backgroundColor removed — --color-bg drives.
    home:       { visible: true },
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
    },
    // Layer 1 tokens — full set per D5 (no inheritance, snapshot-friendly).
    // Dark theme: slate base, cyan primary, violet accent, slightly tighter radii.
    tokens: {
      "--color-primary":     "#06b6d4",
      "--color-accent":      "#8b5cf6",
      "--color-bg":          "#0f172a",
      "--color-surface":     "#1e293b",
      "--color-text":        "#f1f5f9",
      "--color-text-muted":  "#94a3b8",
      "--color-border":      "#334155",
      "--radius-sm":         "6px",
      "--radius-md":         "12px",
      "--radius-card":       "20px",
      "--radius-button":     "12px",
      "--shadow-card":       "0 10px 40px rgba(6,182,212,0.18)",
      "--shadow-button":     "0 6px 20px rgba(6,182,212,0.35)",
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
      variant: "default",
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
        backgroundType: "gradient",
        backgroundColor: "#06b6d4",
        gradientFrom: "#0891b2",
        gradientVia:  "#06b6d4",
        gradientTo:   "#2563eb",
        gradientDirection: "to-br",
        textColor:    "#ffffff"
      }
    },
    // Day 6: bg+border removed — --color-surface + --color-border drive.
    // NOT spreading classic — classic sets borderColor #f1f5f9 (lighter custom),
    // which would override modern-dark's token fallback to slate #334155.
    "stats-progress-card": {
      config: {
        borderRadius: "3xl",
        numberColor:  "#f1f5f9",
        labelColor:   "#94a3b8",
        accentColor:  "#06b6d4"
      }
    },
    "stats-eligible-card": {
      config: {
        borderRadius: "3xl",
        numberColor:  "#f1f5f9",
        labelColor:   "#94a3b8",
        iconColor:    "#475569"
      }
    },

    // === Meet section ===
    // Day 6: backgroundColor removed — --color-surface drives.
    // Day 7a: dropped classic spread (preventive — only inherited `visible`).
    "meet-section": {
      config: {
        visible:         true,
        borderColor:     "#06b6d4",
        glowFrom:        "#06b6d4",
        glowVia:         "#3b82f6",
        glowTo:          "#8b5cf6",
        surfaceLight:    false
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
    // Day 6: bg+border removed — --color-surface + --color-border drive.
    // NOT spreading classic.banner — classic intentionally sets borderColor #ffffff
    // (white-on-white), which would override dark theme's token fallback.
    // Day 7a Part 4: Layer 2 pilot — each template declares its own --banner-*.
    // Day 7b: explicit variant field.
    // Structural distinction (not just colour): modern-dark uses the editorial
    // minimal-line banner (thin rule, no card chrome) for a sleeker tech identity.
    "banner-section": {
      variant: "minimal-line",
      config: { visible: true, borderRadius: "3xl" },
      vars: {
        "--banner-bg":           "var(--color-surface)",
        "--banner-border":       "var(--color-border)",
        "--banner-border-width": "1px",
        "--banner-radius":       "var(--radius-card)",
        "--banner-shadow":       "0 25px 50px -12px rgba(0,0,0,0.25)"
      }
    },

    // === Vote page ===
    // vote-header-title / vote-header-subtitle entries removed — they only
    // overrode config.color, which is now dead (MultiPartyView reads
    // --vh-title-color / --vh-subtitle-color directly, P-LOG-071). They inherit
    // classic's vars (var(--color-text) / var(--color-text-muted)), which resolve
    // to modern-dark's light text tokens automatically.
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
