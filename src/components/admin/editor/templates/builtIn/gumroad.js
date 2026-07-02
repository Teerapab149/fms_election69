/**
 * Gumroad / "Active Pulse" Template — bold playful student energy
 *
 * Source: docs/design-refs/index.html + styles.css (a full 6-page redesign of
 * THIS site, made in a Claude Design session — user reaction: "this is insane").
 * Identity: chunky 2.5px near-black borders, HARD offset shadows (5px 5px 0, no
 * blur), cream/peach base + pop accents (pink / lime / yellow / sky), big blocky
 * Archivo Black display + Kanit body.
 *
 * Built the modern-dark way (P-LOG-005): spread classicTemplate first to preserve
 * text/layout, override (1) Layer-1 tokens, (2) per-element configs/vars.
 *
 * Identity → mechanism map (what actually renders this pass):
 *   - Palette (cream/pink/lime/ink) ........ Layer-1 --color-* (consumed site-wide)
 *   - Chunky near-black borders ............ --color-border = ink (var-driven elements)
 *   - Hard offset shadows .................. --shadow-card/-button + --banner-shadow
 *                                            + voteCTA chunky-stamp (hardcoded mark)
 *   - voteCTA hand-stamped button ......... variant: "chunky-stamp" (already shipped)
 *   - Pop-colour cards .................... per-element configs (stats / meet / countdown)
 *
 * RESOLVED (impeccable typeset pass): Archivo Black + Space Grotesk now load via
 * next/font (layout.js → --font-archivo / --font-space-grotesk). GumroadHome's --fd
 * (display) + --fm (mono) reference those vars; the --font-display token resolves
 * through them too. Headings now render in real Archivo Black; Thai still falls
 * through to Kanit by design (Archivo Black is latin-only).
 *
 * KNOWN GAPS (honest, carry-forward — same class modern-dark accepted):
 *   - Stats cards' hard-offset shadow can't be config-driven: StatsBlock's shadow
 *     (shadow-xl / shadow-sm) + border-width are fixed Tailwind classes. We DO
 *     drive their pop bg + ink borders + ink numbers; the hard shadow would need a
 *     var-driven StatsBlock (or a "sticker card" variant) — follow-up.
 *   - Per-page detail elements with hardcoded purple configs in classic
 *     (success-megaphone / chips, etc.) are left for the next per-page pass
 *     ("ค่อยๆ ทีละ page"). Tokenized/var-driven parts already adapt automatically.
 *
 * Per P-LOG-005: do NOT modify classic.js here. All overrides spread from
 * classicTemplate first.
 */

import { classicTemplate } from "./classic";

// Palette constants (mirror styles.css :root, election-appropriate subset).
const INK = "#1A1A1A"; // near-black border + text
const INK_2 = "#4A4A4A"; // muted text
const CREAM = "#FFF1E5"; // page bg
const PAPER = "#FFFFFF"; // card surface
const PINK = "#FF90E8"; // signature accent → primary
const LIME = "#B6FF6E"; // fresh accent → accent
const YELLOW = "#FFC900";
const SKY = "#A8E1FF";
const CORAL = "#FF6E6E";
const SHADOW_HARD = "5px 5px 0 #1A1A1A";

export const gumroadTemplate = {
  ...classicTemplate,
  id: "gumroad",
  slug: "gumroad",
  name: "แอ็กทีฟ พัลส์",
  description: "สไตล์ Gumroad — ขอบดำหนา เงาคม (ไม่เบลอ) สีสันสดใส ชมพู/ไลม์/เหลือง พื้นครีม",
  layoutFamily: "gumroad", // real template — own page layouts (poster-mosaic home ฯลฯ)

  colorSwatch: {
    primary: PINK,
    secondary: LIME,
    background: CREAM
  },

  pages: {
    // home.backgroundColor omitted — --color-bg (cream) drives.
    home:       { visible: true },
    vote:       { visible: true, backgroundColor: CREAM },
    candidates: { visible: true, backgroundColor: CREAM },
    results:    { visible: true, backgroundColor: CREAM },
    closed:     { visible: true, backgroundColor: CREAM },
    success:    { visible: true, backgroundColor: CREAM }
  },

  theme: {
    colors: {
      primary:    PINK,
      accent:     LIME,
      background: CREAM,
      surface:    PAPER,
      text:       INK,
      textMuted:  INK_2,
      border:     INK
    },
    typography: classicTemplate.theme?.typography,
    spacing:    classicTemplate.theme?.spacing,
    effects: {
      borderRadius: "1.375rem", // 22px — chunky rounded
      shadow:       SHADOW_HARD
    },
    // Layer 1 tokens — full set per D5 (no inheritance, snapshot-friendly).
    // Gumroad: cream base, ink (near-black) borders + text, pink primary / lime
    // accent, hard offset shadows (no blur), chunky radii.
    tokens: {
      "--color-primary":     PINK,
      "--color-accent":      LIME,
      "--color-bg":          CREAM,
      "--color-surface":     PAPER,
      "--color-text":        INK,
      "--color-text-muted":  INK_2,
      "--color-border":      INK,        // chunky near-black borders everywhere
      "--radius-sm":         "12px",
      "--radius-md":         "18px",
      "--radius-card":       "22px",
      "--radius-button":     "14px",
      "--shadow-card":       SHADOW_HARD,
      "--shadow-button":     SHADOW_HARD,
      // Display font now LOADED via next/font (layout.js → --font-archivo). The
      // next/font var resolves first; the literal name is the fallback for any
      // context where layout's body vars aren't in scope.
      "--font-display":      "var(--font-archivo), 'Archivo Black', 'Kanit', system-ui, sans-serif",
      "--font-body":         "'Kanit', system-ui, sans-serif"
    }
  },

  elements: {
    ...classicTemplate.elements,

    // === Hero text → ink ===
    "hero-title": {
      config: { ...classicTemplate.elements["hero-title"].config, color: INK }
    },
    "hero-subtitle": {
      config: { ...classicTemplate.elements["hero-subtitle"].config, color: INK }
    },
    "hero-subtitle2": {
      config: { ...classicTemplate.elements["hero-subtitle2"].config, color: INK_2 }
    },
    "hero-year-badge": {
      config: { ...classicTemplate.elements["hero-year-badge"].config, color: INK_2 }
    },

    // === Countdown — gumroad pop palette over classic's shape ===
    // Same field set as classic; recolour badges to pops, text/border to ink.
    "hero-countdown": {
      config: {
        before: {
          ...classicTemplate.elements["hero-countdown"].config.before,
          pillBackground: PAPER,
          badgeBackgroundColor: PINK, badgeTextColor: INK,
          textMain: INK, textSub: INK_2,
          borderColor: INK, shadowColor: INK
        },
        running: {
          ...classicTemplate.elements["hero-countdown"].config.running,
          pillBackground: PAPER,
          badgeBackgroundColor: CORAL, badgeTextColor: INK,
          textMain: INK, textSub: INK_2,
          borderColor: INK, shadowColor: INK
        },
        paused: {
          ...classicTemplate.elements["hero-countdown"].config.paused,
          pillBackground: PAPER,
          badgeBackgroundColor: YELLOW, badgeTextColor: INK,
          textMain: INK, textSub: INK_2,
          borderColor: INK, shadowColor: INK
        },
        manualEnded: {
          ...classicTemplate.elements["hero-countdown"].config.manualEnded,
          pillBackground: PAPER,
          badgeBackgroundColor: INK, badgeTextColor: CREAM,
          textMain: INK, textSub: INK_2,
          borderColor: INK
        },
        nextYear: {
          ...classicTemplate.elements["hero-countdown"].config.nextYear,
          pillBackground: PAPER,
          badgeBackgroundColor: INK, badgeTextColor: CREAM,
          textMain: INK, textSub: INK_2,
          borderColor: INK
        }
      }
    },

    // === voteCTA — the hand-stamped Gumroad button (variant already shipped) ===
    // chunky-stamp hardcodes border (#000 3px) + hard shadow (its identity); the
    // per-state FILL flows through from config.backgroundColor (filled-variant
    // compatibility, see chunky-stamp.jsx). So we paint each state a pop colour.
    // login maps→notVoted visual; both styled independently via their own config.
    // CTA_SIZE: chunky-stamp reads fontSize/paddingX/paddingY from per-state
    // config (Layer 3), which OVERRIDES the --btn-* vars below. Classic ships
    // lg/10/4 (≈18px font, 40px/16px pad) — too dainty for the gumroad hero.
    // Bump every state to a bolder stamp: xl font + 12/5 padding. Spread AFTER
    // the classic spread so it wins.
    "voteCTA-button": {
      variant: "chunky-stamp",
      config: {
        login: {
          ...classicTemplate.elements["voteCTA-button"].config.login,
          backgroundColor: INK, textColor: CREAM,
          fontSize: "xl", paddingX: "12", paddingY: "5"
        },
        notVoted: {
          ...classicTemplate.elements["voteCTA-button"].config.notVoted,
          backgroundColor: LIME, textColor: INK,
          fontSize: "xl", paddingX: "12", paddingY: "5"
        },
        // voted = chunky-stamp's surface "card" look (bg ignored when voted) — keep,
        // but match the bolder sizing so the post-vote CTA isn't smaller.
        voted: {
          ...classicTemplate.elements["voteCTA-button"].config.voted,
          fontSize: "xl", paddingX: "12", paddingY: "5"
        },
        ended: {
          ...classicTemplate.elements["voteCTA-button"].config.ended,
          backgroundColor: YELLOW, textColor: INK,
          fontSize: "xl", paddingX: "12", paddingY: "5"
        },
        closed: {
          ...classicTemplate.elements["voteCTA-button"].config.closed,
          backgroundColor: YELLOW, textColor: INK,
          fontSize: "xl", paddingX: "12", paddingY: "5"
        },
        paused: {
          ...classicTemplate.elements["voteCTA-button"].config.paused,
          backgroundColor: SKY, textColor: INK,
          fontSize: "xl", paddingX: "12", paddingY: "5"
        }
      },
      vars: {
        ...classicTemplate.elements["voteCTA-button"].vars,
        "--btn-bg":         "var(--color-primary)",
        "--btn-text":       INK,
        "--btn-radius":     "var(--radius-button)", // 14px
        "--btn-padding-x":  "28px",
        "--btn-padding-y":  "18px",
        "--btn-font-size":  "18px",
        "--btn-font-weight": "800"
      }
    },

    // === Stats — colour-blocked tiles (matches the design's pink/lime/sky bento) ===
    // Hero card: solid pink fill + ink text (drops classic's purple gradient).
    "stats-voted-card": {
      config: {
        backgroundType:  "solid",
        backgroundColor: PINK,
        textColor:       INK
      }
    },
    // Sub-cards: pop bg + ink border + ink data (border-width/shadow stay Tailwind
    // — see KNOWN GAPS; colour is the win here).
    "stats-progress-card": {
      config: {
        backgroundColor: LIME,
        borderColor:     INK,
        numberColor:     INK,
        labelColor:      INK,
        accentColor:     INK
      }
    },
    "stats-eligible-card": {
      config: {
        backgroundColor: SKY,
        borderColor:     INK,
        numberColor:     INK,
        labelColor:      INK,
        iconColor:       INK
      }
    },

    // === Meet section — pop glow + yellow CTA ===
    "meet-section": {
      config: {
        visible:      true,
        borderColor:  INK,
        glowFrom:     PINK,
        glowVia:      LIME,
        glowTo:       YELLOW,
        surfaceLight: true
      }
    },
    "meet-title": {
      config: { ...classicTemplate.elements["meet-title"].config, color: INK }
    },
    "meet-cta": {
      config: {
        ...classicTemplate.elements["meet-cta"].config,
        backgroundColor: YELLOW,
        textColor:       INK
      }
    },

    // === Banner — chunky frame via vars on the default variant ===
    // default.jsx reads --banner-* ; setting hard shadow + 2.5px ink border + 22px
    // radius gives the sticker frame without a new variant. config.borderColor (ink)
    // wins over the var for the colour (classic used #ffffff white-on-white).
    "banner-section": {
      variant: "default",
      config: { visible: true, borderColor: INK },
      vars: {
        "--banner-bg":           "var(--color-surface)",
        "--banner-border":       "var(--color-text)",
        "--banner-border-width": "2.5px",
        "--banner-radius":       "var(--radius-card)",
        "--banner-shadow":       SHADOW_HARD
      }
    },

    // === Vote page ===
    // vote-header badge/title/subtitle inherit classic's --vh-* vars
    // (→ var(--color-primary)/--color-text/--color-text-muted), which resolve to
    // gumroad's tokens automatically (P-LOG-071 synergy). No override needed.
    "vote-party-card": {
      config: {
        ...classicTemplate.elements["vote-party-card"].config,
        backgroundColor: PAPER,
        borderColor:     INK
      }
    }
  }
};

// ── Colour themes (whole-palette swap) ───────────────────────────────────────
// Same gumroad layout; the live recolour engine is GumroadTheme.GUMROAD_THEMES
// (cream/ink/pink/lime/…). Each variant keeps layoutFamily "gumroad" so the chooser
// groups all four into one card with swatches. colorSwatch.primary = the accent tile
// colour so the chooser shows the right chip.
const mkGumroadTheme = (slug, name, primary, secondary) => ({
  ...gumroadTemplate,
  id: slug,
  slug,
  name,
  colorSwatch: { primary, secondary, background: CREAM },
});

export const gumroadCyberTemplate = mkGumroadTheme("gumroad-cyber", "แอ็กทีฟ พัลส์ · ไซเบอร์พังก์", "#00F0FF", "#A370F7");
export const gumroadRetroTemplate = mkGumroadTheme("gumroad-retro", "แอ็กทีฟ พัลส์ · เรโทร อาร์เคด", "#FF9233", "#14D4B4");
export const gumroadAcidTemplate  = mkGumroadTheme("gumroad-acid",  "แอ็กทีฟ พัลส์ · แอซิด อินดัสเทรียล", "#CCFF00", "#FF4A4A");
export const gumroadPremiumTemplate = mkGumroadTheme("gumroad-premium", "แอ็กทีฟ พัลส์ · ไซเบอร์ป๊อป พรีเมียม", "#FF4B91", "#00D2FF");

export default gumroadTemplate;
