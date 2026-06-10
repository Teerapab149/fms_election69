/**
 * Studio Dark v2 Template — premium "Awwwards" warm-dark, lime accent
 *
 * Source: docs/design-refs/Studio Dark v2.html + studio-v2.css (a full 6-page
 * redesign of THIS site, made in a Claude Design session — user reaction:
 * "i like this one look good"). Identity: warm soft-dark canvas (#14140F, not
 * pure black), a single electric-lime accent (#D5FF3F) used sparingly, hairline
 * rules instead of heavy borders, quiet Geist sans + Instrument Serif italic
 * accent + Geist Mono small-caps labels, and a PERSISTENT 240px left rail nav.
 *
 * Built the gumroad/modern-dark way (P-LOG-005): spread classicTemplate first to
 * preserve text + element shape, then override (1) Layer-1 tokens, (2) per-element
 * configs/vars. The LAYOUT half (the left-rail app shell + chapter-scene home)
 * lives separately in components/home/StudioDarkRail.js + StudioDarkHome.js and is
 * dispatched by slug in components/home/HomeRenderer.js (same seam as gumroad).
 *
 * Identity → mechanism map (what renders this pass):
 *   - Warm-dark palette ........... Layer-1 --color-* (consumed site-wide via token scope)
 *   - Lime accent ................. --color-primary / --color-accent
 *   - Hairline rules .............. --color-border = --line (#2E2E22, subtle)
 *   - Pill buttons ................ --radius-button = 9999px
 *   - voteCTA outlined→fill pill .. variant: "minimal-pill" (lime outline, fills on hover)
 *   - Quiet display type .......... --font-display = Geist (loaded in layout.js)
 *
 * SCOPE NOTE (carry-forward, same as gumroad's per-page rollout): only the HOME
 * layout ships studio-dark structure this pass. Other pages still render the
 * classic layout under these dark tokens (so they adapt in colour but keep the
 * classic structure) until their studio-dark layouts are built page-by-page.
 *
 * Per P-LOG-005: do NOT modify classic.js here. All overrides spread from
 * classicTemplate first.
 */

import { classicTemplate } from "./classic";

// Palette constants (mirror studio-v2.css :root).
const BG       = "#14140F"; // warm soft-dark page canvas
const SURFACE  = "#1B1B14"; // raised surface (bg-2)
const SURFACE2 = "#232319"; // deeper surface (bg-3)
const INK      = "#F2EDDF"; // primary text (warm off-white)
const INK_2    = "#B5B0A2"; // muted text
const INK_3    = "#7F7A6E"; // faint labels
const LINE     = "#2E2E22"; // hairline rule / border
const ACCENT   = "#D5FF3F"; // electric lime
const ACCENT_2 = "#C7E866"; // softer lime
const SHADOW_SOFT = "0 16px 48px rgba(0,0,0,.4)";

export const studioDarkTemplate = {
  ...classicTemplate,
  id: "studio-dark",
  slug: "studio-dark",
  name: "สตูดิโอ ดาร์ก",
  description: "สไตล์ดาร์กพรีเมียม — พื้นดำอุ่น เส้นบางคม แอ็กเซนต์ไลม์ ฟอนต์เรียบ + แถบเมนูซ้ายถาวร",
  layoutFamily: "studio-dark", // real template — own page layouts (left rail + chapter scenes)

  colorSwatch: {
    primary: ACCENT,
    secondary: INK,
    background: BG
  },

  pages: {
    home:       { visible: true },
    vote:       { visible: true, backgroundColor: BG },
    candidates: { visible: true, backgroundColor: BG },
    results:    { visible: true, backgroundColor: BG },
    closed:     { visible: true, backgroundColor: BG },
    success:    { visible: true, backgroundColor: BG }
  },

  theme: {
    colors: {
      primary:    ACCENT,
      accent:     ACCENT_2,
      background: BG,
      surface:    SURFACE,
      text:       INK,
      textMuted:  INK_2,
      border:     LINE
    },
    typography: classicTemplate.theme?.typography,
    spacing:    classicTemplate.theme?.spacing,
    effects: {
      borderRadius: "1.125rem", // 18px — soft, not chunky
      shadow:       SHADOW_SOFT
    },
    // Layer 1 tokens — full set (no inheritance, snapshot-friendly).
    tokens: {
      "--color-primary":     ACCENT,
      "--color-accent":      ACCENT_2,
      "--color-bg":          BG,
      "--color-surface":     SURFACE,
      "--color-text":        INK,
      "--color-text-muted":  INK_2,
      "--color-border":      LINE,        // hairline rules everywhere
      "--radius-sm":         "10px",
      "--radius-md":         "14px",
      "--radius-card":       "22px",
      "--radius-button":     "9999px",    // pill buttons
      "--shadow-card":       SHADOW_SOFT,
      "--shadow-button":     "none",
      // Display font LOADED via next/font (layout.js → --font-studio-sans = Inter,
      // a near-identical sub for the prototype's Geist). Thai falls through to
      // Anuphan. The literal names are the fallback for any out-of-scope context.
      "--font-display":      "var(--font-studio-sans), 'Inter', var(--font-anuphan), 'Anuphan', system-ui, sans-serif",
      "--font-body":         "var(--font-anuphan), 'Anuphan', var(--font-studio-sans), system-ui, sans-serif"
    }
  },

  elements: {
    ...classicTemplate.elements,

    // === Hero text → warm off-white over dark ===
    "hero-title": {
      config: { ...classicTemplate.elements["hero-title"].config, color: INK }
    },
    "hero-subtitle": {
      config: { ...classicTemplate.elements["hero-subtitle"].config, color: INK_2 }
    },
    "hero-subtitle2": {
      config: { ...classicTemplate.elements["hero-subtitle2"].config, color: INK_3 }
    },
    "hero-year-badge": {
      config: { ...classicTemplate.elements["hero-year-badge"].config, color: INK_3 }
    },

    // === Countdown — dark surface, ink cells, lime label (for non-home pages
    // still on classic layout; the studio-dark home rail owns its own countdown) ===
    "hero-countdown": (() => {
      const base = classicTemplate.elements["hero-countdown"].config;
      const dark = (s) => ({
        ...s,
        pillBackground: SURFACE,
        badgeBackgroundColor: SURFACE2, badgeTextColor: INK,
        textMain: INK, textSub: INK_2,
        borderColor: LINE, shadowColor: "transparent"
      });
      return {
        config: {
          before: dark(base.before),
          running: { ...dark(base.running), badgeBackgroundColor: ACCENT, badgeTextColor: BG },
          paused: dark(base.paused),
          manualEnded: dark(base.manualEnded),
          nextYear: dark(base.nextYear)
        }
      };
    })(),

    // === voteCTA — minimal-pill: lime outline on transparent, fills lime on hover.
    // The variant reads --color-primary (lime) for outline/text and --color-surface
    // for the hover text — both resolve to studio-dark tokens automatically. State
    // logic (login/notVoted/voted/ended/closed/paused) is handled inside the variant. ===
    "voteCTA-button": {
      variant: "minimal-pill",
      config: { ...classicTemplate.elements["voteCTA-button"].config },
      vars: {
        ...classicTemplate.elements["voteCTA-button"].vars,
        "--btn-radius":       "9999px",
        "--btn-hover-bg":     ACCENT,
        "--btn-padding-x":    "28px",
        "--btn-padding-y":    "16px",
        "--btn-font-size":    "15px",
        "--btn-font-weight":  "500",
        "--btn-letter-spacing": "0"
      }
    },

    // === Stats — dark tiles, lime data accents (non-home classic layout) ===
    "stats-voted-card": {
      config: {
        backgroundType:  "solid",
        backgroundColor: SURFACE,
        textColor:       INK
      }
    },
    "stats-progress-card": {
      config: {
        backgroundColor: SURFACE,
        borderColor:     LINE,
        numberColor:     INK,
        labelColor:      INK_2,
        accentColor:     ACCENT
      }
    },
    "stats-eligible-card": {
      config: {
        backgroundColor: SURFACE,
        borderColor:     LINE,
        numberColor:     INK,
        labelColor:      INK_2,
        iconColor:       ACCENT
      }
    },

    // === Meet section — dark surface + lime CTA ===
    "meet-section": {
      config: {
        visible:      true,
        borderColor:  LINE,
        glowFrom:     ACCENT,
        glowVia:      ACCENT_2,
        glowTo:       SURFACE,
        surfaceLight: false
      }
    },
    "meet-title": {
      config: { ...classicTemplate.elements["meet-title"].config, color: INK }
    },
    "meet-cta": {
      config: {
        ...classicTemplate.elements["meet-cta"].config,
        backgroundColor: ACCENT,
        textColor:       BG
      }
    },

    // === Banner — dark surface, hairline frame ===
    "banner-section": {
      variant: "default",
      config: { visible: true, borderColor: LINE },
      vars: {
        "--banner-bg":           "var(--color-surface)",
        "--banner-border":       "var(--color-border)",
        "--banner-border-width": "1px",
        "--banner-radius":       "var(--radius-card)",
        "--banner-shadow":       SHADOW_SOFT
      }
    },

    // === Vote page card → dark surface ===
    "vote-party-card": {
      config: {
        ...classicTemplate.elements["vote-party-card"].config,
        backgroundColor: SURFACE,
        borderColor:     LINE
      }
    }
  }
};

export default studioDarkTemplate;
