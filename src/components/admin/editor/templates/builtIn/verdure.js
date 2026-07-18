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
import { VERDURE_THEMES, hexToRgbTriple } from "../../../../../utils/verdurePalettes";

// PARITY RULE (same as gumroad): every colour below derives from utils/
// verdurePalettes.js — the SAME map VerdureBaseStyles (.vd-root vars) and the
// preview morph read. The builder means every colour-theme variant carries its
// FULL palette into Layer-1 tokens / element configs / page backgrounds on apply
// — not just a swatch.
function buildVerdureTemplate(slug, name, palette) {
  const MOSS = palette.moss;     // dark surface + ink
  const MOSS_2 = palette.moss2;
  const MOSS_3 = palette.moss3;
  const CREAM = palette.cream;   // paper (page bg)
  const CREAM_2 = palette.cream2;
  const CREAM_3 = palette.cream3;
  const TERRA = palette.terra;   // decorative accent
  const TERRA_2 = palette.terra2;
  const RULE = palette.rule;     // hairline on paper
  const CTA = palette.cta || TERRA;           // action-button colour
  const CTA_TEXT = palette.ctaText || CREAM;  // button label colour
  const SHADOW_SOFT = `0 30px 60px -20px rgba(${hexToRgbTriple(MOSS)},.35)`;

  return {
  ...classicTemplate,
  id: slug,
  slug,
  name,
  description: "เลย์เอาต์เอดิทอเรียลเซริฟ — เส้นขอบตั้งด้านข้าง เหรียญตรา/วงกลมเป็นหัวใจ และด็อกเมนูลอยด้านล่าง เลือกโทนสีได้ 4 แบบ (คลาสสิก/อะคาเดมิก/ครีเอทีฟ/มินิมอล)",
  layoutFamily: "verdure", // real template — own page layouts (edge rail + dock + discs)

  colorSwatch: {
    primary: TERRA,   // decorative accent = the theme's most identifying colour (chip)
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
        // Layer-2 colour vars REFERENCE the family ramp (not literal hex) so preview
        // swatch morphs re-tint them (injectVerdure pushes --cta/--cta-text/--moss);
        // the fallback = this variant's palette value, so the element renders
        // identically where the ramp is absent (e.g. admin element gallery).
        "--btn-bg": `var(--cta, ${CTA})`, "--btn-text": `var(--cta-text, ${CTA_TEXT})`, "--btn-border-color": `var(--cta, ${CTA})`,
        "--btn-radius": "9999px", "--btn-shadow": "none", "--btn-hover-bg": `var(--moss, ${MOSS})`,
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
}

// ── The 4 colour themes — each is a FULL build from its palette (tokens + element
// configs + page backgrounds all follow), so applying a variant live matches the
// preview exactly. layoutFamily stays "verdure" → one chooser card with swatches;
// colorSwatch derives from the palette (primary = cta so the chip shows the theme's
// signature button colour; the chooser groups by family).
export const verdureTemplate      = buildVerdureTemplate("verdure", "เวอร์เดอร์ · คลาสสิก พรีเมียม", VERDURE_THEMES["verdure"]);
export const verdureHoneyTemplate = buildVerdureTemplate("verdure-honey", "เวอร์เดอร์ · โมเดิร์น อะคาเดมิก", VERDURE_THEMES["verdure-honey"]);
export const verdureTealTemplate  = buildVerdureTemplate("verdure-teal", "เวอร์เดอร์ · คอนเทมโพรารี ครีเอทีฟ", VERDURE_THEMES["verdure-teal"]);
export const verdureBerryTemplate = buildVerdureTemplate("verdure-berry", "เวอร์เดอร์ · มินิมอล เทค", VERDURE_THEMES["verdure-berry"]);

export default verdureTemplate;
