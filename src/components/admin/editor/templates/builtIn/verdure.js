/**
 * Verdure Template — moss + cream + terracotta serif editorial ("Anniversary Edition")
 *
 * Faithful port of docs/design-refs/Verdure 50.html + verdure.css (a full redesign
 * of all 6 election pages for FMS SAMO 50, made in a Claude Design session). Identity:
 * warm cream paper (#F4ECDB) + deep forest moss (#1F3A2C) + a single terracotta accent
 * (#BC5E3E), DM Serif Display italic for the big serif numerals/headlines, Manrope +
 * IBM Plex Sans Thai for body, Space Mono for labels. The CORE MOTIF is discs/circles
 * (a SAMO "50" medallion home, round party numbers, orbital result stats, an arched-text
 * success ornament), with a fixed vertical edge-rail, an "S" cornermark, and a bottom
 * floating moss dock as the signature navigation.
 *
 * Built the studio-dark way (P-LOG-005): spread classicTemplate first to preserve text +
 * element shape, then override (1) Layer-1 tokens, (2) per-element configs. The LAYOUT
 * half is its own component set dispatched by slug: VerdureChrome (edge rail + cornermark
 * + dock + base CSS) + VerdureShell + per-page Verdure{Home,Candidates,Party,Vote,
 * SingleParty,Results,Success,Closed} + VerdureMemberModal + login/VerdureLogin. Home
 * dispatches in components/home/HomeRenderer.js; the rest in each app/<page>.
 *
 * Fonts are LOADED in layout.js via next/font (DM_Serif_Display / Manrope /
 * IBM_Plex_Sans_Thai / Space_Mono → --font-dm-serif / --font-manrope / --font-plex-thai /
 * --font-space-mono) — a declared font-family does nothing unless loaded (impeccable rule).
 *
 * Identity (moss/cream/terra, the discs, hairlines) is HARDCODED in the components per
 * Rule 9. The `elements` overrides below only recolor the catalog elements any classic-
 * layout fallback would use; every Verdure page is a self-contained layout component.
 *
 * Per P-LOG-005: do NOT modify classic.js here. All overrides spread from classicTemplate.
 */

import { classicTemplate } from "./classic";

// Base palette = the "Classic Premium" theme (deep forest + burgundy on ivory).
// The live recolour engine lives in VerdureChrome.VERDURE_THEMES (4 full palettes);
// these constants only seed the colorSwatch + the classic-layout fallback tokens.
const MOSS      = "#1B362B"; // deep forest, primary dark surface + ink
const MOSS_2    = "#294A3C";
const MOSS_3    = "#3A5E4D";
const CREAM     = "#FDFBF7"; // light ivory, primary light surface (page bg)
const CREAM_2   = "#FFFFFF";
const CREAM_3   = "#F0EBDF";
const TERRA     = "#722F55"; // primary accent / CTA (rich burgundy)
const TERRA_2   = "#5C2545";
const RULE      = "#E6DFD2"; // hairline on ivory
const SHADOW_SOFT = "0 30px 60px -20px rgba(27,54,43,.35)";

export const verdureTemplate = {
  ...classicTemplate,
  id: "verdure",
  slug: "verdure",
  name: "เวอร์เดอร์ · คลาสสิก พรีเมียม",
  description: "เลย์เอาต์เอดิทอเรียลเซริฟ — เส้นขอบตั้งด้านข้าง เหรียญตรา/วงกลมเป็นหัวใจ และด็อกเมนูลอยด้านล่าง เลือกโทนสีได้ 4 แบบ (คลาสสิก/อะคาเดมิก/ครีเอทีฟ/มินิมอล)",
  layoutFamily: "verdure", // real template — own page layouts (edge rail + dock + discs)

  colorSwatch: {
    primary: TERRA,
    secondary: MOSS,
    background: CREAM
  },

  pages: {
    home:       { visible: true },
    vote:       { visible: true, backgroundColor: CREAM },
    candidates: { visible: true, backgroundColor: MOSS },
    results:    { visible: true, backgroundColor: CREAM },
    closed:     { visible: true, backgroundColor: CREAM },
    success:    { visible: true, backgroundColor: MOSS }
  },

  theme: {
    colors: {
      primary:    TERRA,
      accent:     TERRA_2,
      background: CREAM,
      surface:    CREAM_2,
      text:       MOSS,
      textMuted:  MOSS_3,
      border:     RULE
    },
    typography: classicTemplate.theme?.typography,
    spacing:    classicTemplate.theme?.spacing,
    effects: {
      borderRadius: "1.75rem", // 28px panels (discs handled in components)
      shadow:       SHADOW_SOFT
    },
    tokens: {
      "--color-primary":     TERRA,
      "--color-accent":      TERRA_2,
      "--color-bg":          CREAM,
      "--color-surface":     CREAM_2,
      "--color-text":        MOSS,
      "--color-text-muted":  MOSS_3,
      "--color-border":      RULE,
      "--radius-sm":         "14px",
      "--radius-md":         "22px",
      "--radius-card":       "28px",
      "--radius-button":     "9999px",
      "--shadow-card":       SHADOW_SOFT,
      "--shadow-button":     "none",
      "--font-display":      "var(--font-dm-serif), 'DM Serif Display', var(--font-plex-thai), 'IBM Plex Sans Thai', Georgia, serif",
      "--font-body":         "var(--font-plex-thai), 'IBM Plex Sans Thai', var(--font-manrope), system-ui, sans-serif"
    }
  },

  elements: {
    ...classicTemplate.elements,

    // hero text → moss ink on cream
    "hero-title":     { config: { ...classicTemplate.elements["hero-title"].config, color: MOSS } },
    "hero-subtitle":  { config: { ...classicTemplate.elements["hero-subtitle"].config, color: MOSS } },
    "hero-subtitle2": { config: { ...classicTemplate.elements["hero-subtitle2"].config, color: MOSS_3 } },
    "hero-year-badge":{ config: { ...classicTemplate.elements["hero-year-badge"].config, color: TERRA } },

    // countdown — cream surface, terra accent (classic-layout fallback only)
    "hero-countdown": (() => {
      const base = classicTemplate.elements["hero-countdown"].config;
      const v = (s) => ({ ...s, pillBackground: CREAM_2, badgeBackgroundColor: CREAM_3, badgeTextColor: MOSS, textMain: MOSS, textSub: MOSS_3, borderColor: RULE, shadowColor: "rgba(31,58,44,.10)" });
      return { config: { before: v(base.before), running: { ...v(base.running), badgeBackgroundColor: TERRA, badgeTextColor: CREAM }, paused: v(base.paused), manualEnded: v(base.manualEnded), nextYear: v(base.nextYear) } };
    })(),

    // voteCTA — terra pill for any classic fallback (the verdure home renders its
    // own circular CTA; the variant stays "default" here).
    "voteCTA-button": {
      variant: "default",
      config: { ...classicTemplate.elements["voteCTA-button"].config },
      vars: {
        ...classicTemplate.elements["voteCTA-button"].vars,
        "--btn-bg": TERRA, "--btn-text": CREAM, "--btn-border-color": TERRA,
        "--btn-radius": "9999px", "--btn-shadow": "none", "--btn-hover-bg": MOSS,
        "--btn-padding-x": "32px", "--btn-padding-y": "18px", "--btn-font-size": "15px", "--btn-font-weight": "600"
      }
    },

    "stats-voted-card":    { config: { backgroundType: "solid", backgroundColor: CREAM_2, textColor: MOSS } },
    "stats-progress-card": { config: { backgroundColor: CREAM_2, borderColor: RULE, numberColor: MOSS, labelColor: MOSS_3, accentColor: TERRA } },
    "stats-eligible-card": { config: { backgroundColor: CREAM_2, borderColor: RULE, numberColor: MOSS, labelColor: MOSS_3, iconColor: TERRA } },
    "meet-section":        { config: { visible: true, borderColor: RULE, glowFrom: TERRA, glowVia: MOSS, glowTo: CREAM_2, surfaceLight: true } },
    "meet-title":          { config: { ...classicTemplate.elements["meet-title"].config, color: MOSS } },
    "meet-cta":            { config: { ...classicTemplate.elements["meet-cta"].config, backgroundColor: TERRA, textColor: CREAM } },
    "banner-section": {
      variant: "default", config: { visible: true, borderColor: RULE },
      vars: { "--banner-bg": "var(--color-surface)", "--banner-border": "var(--color-border)", "--banner-border-width": "1px", "--banner-radius": "var(--radius-card)", "--banner-shadow": SHADOW_SOFT }
    },
    "vote-party-card":     { config: { ...classicTemplate.elements["vote-party-card"].config, backgroundColor: CREAM_2, borderColor: RULE } }
  }
};

// ── Colour themes (accent-swap) ──────────────────────────────────────────────
// Same verdure layout; only the accent changes (handled by --terra/--terra-2/
// --terra-soft in VerdureChrome, keyed by slug). colorSwatch.primary = the accent
// so the chooser shows the right swatch. layoutFamily stays "verdure" → the chooser
// groups all four into one card with 4 swatches (like classic's colour themes).
const mkVerdureTheme = (slug, name, primary, secondary) => ({
  ...verdureTemplate,
  id: slug,
  slug,
  name,
  colorSwatch: { primary, secondary: MOSS, background: CREAM },
});

export const verdureHoneyTemplate = mkVerdureTheme("verdure-honey", "เวอร์เดอร์ · โมเดิร์น อะคาเดมิก", "#C5A059");
export const verdureTealTemplate = mkVerdureTheme("verdure-teal", "เวอร์เดอร์ · คอนเทมโพรารี ครีเอทีฟ", "#AF5232");
export const verdureBerryTemplate = mkVerdureTheme("verdure-berry", "เวอร์เดอร์ · มินิมอล เทค", "#4F46E5");

export default verdureTemplate;
