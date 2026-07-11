/**
 * Blossom Civic Template — "Soft Pop Civic" (owner-approved direction ①)
 *
 * The 5th template FAMILY: big rounded geometry, a saturated candy primary on a
 * soft tint canvas, mono civic labels, a sticker 🌸, springy soft-3D buttons.
 * Built the studio-dark/verdure way (P-LOG-005): spread classicTemplate first to
 * preserve text + element shape, then override (1) Layer-1 tokens, (2) the few
 * element configs any classic-layout FALLBACK page would use. The HOME is its own
 * self-contained layout (components/home/BlossomHome + BlossomTheme), dispatched
 * by slug via HomeRenderer; inner pages fall through to the classic layout,
 * recoloured by these Layer-1 tokens (experimental phase — home first, inner
 * pages ticketed separately).
 *
 * PARITY RULE (like every family): every colour derives from utils/blossomPalettes.js
 * — the SAME ramp BlossomBaseStyles (.bl-root --bl-* vars) and the preview morph
 * (injectBlossom) read. So applying a colour variant live matches its preview.
 * Layer-1 map: primary=primary · accent=primaryDeep · bg=canvas · surface=card ·
 * text=ink · muted=ink2 · border=line.
 *
 * Fonts (Kanit display / Anuphan body / Space Mono labels) are already LOADED in
 * layout.js via next/font — a declared font-family does nothing unless loaded.
 * Identity constants (22px card radius, springy shadow, sticker) are HARDCODED in
 * the components per Rule 9; the overrides below only recolour catalog elements.
 *
 * Per P-LOG-005: do NOT modify classic.js here — all overrides spread from it.
 */

import { classicTemplate } from "./classic";
import { BLOSSOM_THEMES } from "../../../../../utils/blossomPalettes";

function buildBlossomTemplate(slug, name, description, p) {
  const CANVAS = p.canvas, CARD = p.card, INK = p.ink, INK2 = p.ink2, LINE = p.line;
  const PRIMARY = p.primary, DEEP = p.primaryDeep, SOFT = p.primarySoft;
  const SHADOW_CARD = `0 8px 24px -12px color-mix(in srgb, ${PRIMARY} 40%, transparent)`;
  const SHADOW_BTN = `0 5px 0 ${DEEP}`;

  return {
    ...classicTemplate,
    id: slug,
    slug,
    name,
    description,
    layoutFamily: "blossom", // real family — own HOME layout (variants reach it via fallback)
    isLocked: true,

    colorSwatch: { primary: PRIMARY, secondary: DEEP, background: CANVAS },

    pages: {
      home:       { visible: true },
      vote:       { visible: true, backgroundColor: CANVAS },
      candidates: { visible: true, backgroundColor: CANVAS },
      results:    { visible: true, backgroundColor: CANVAS },
      closed:     { visible: true, backgroundColor: CANVAS },
      success:    { visible: true, backgroundColor: CANVAS },
    },

    theme: {
      colors: {
        primary: PRIMARY, accent: DEEP, background: CANVAS, surface: CARD,
        text: INK, textMuted: INK2, border: LINE,
      },
      typography: classicTemplate.theme?.typography,
      spacing: classicTemplate.theme?.spacing,
      effects: { borderRadius: "1.375rem", shadow: SHADOW_CARD }, // 22px cards
      tokens: {
        "--color-primary":     PRIMARY,
        "--color-accent":      DEEP,
        "--color-bg":          CANVAS,
        "--color-surface":     CARD,
        "--color-text":        INK,
        "--color-text-muted":  INK2,
        "--color-border":      LINE,
        "--radius-sm":         "12px",
        "--radius-md":         "16px",
        "--radius-card":       "22px",
        "--radius-button":     "9999px",
        "--shadow-card":       SHADOW_CARD,
        "--shadow-button":     SHADOW_BTN,
        "--font-display":      "var(--font-kanit), 'Kanit', var(--font-anuphan), system-ui, sans-serif",
        "--font-body":         "var(--font-anuphan), 'Anuphan', var(--font-kanit), system-ui, sans-serif",
      },
    },

    // recolour the catalog elements any classic-layout fallback page would use
    // (the Blossom home renders its own layout; these keep inner pages on-brand).
    elements: {
      ...classicTemplate.elements,
      "hero-title":      { config: { ...classicTemplate.elements["hero-title"].config, color: INK } },
      "hero-subtitle":   { config: { ...classicTemplate.elements["hero-subtitle"].config, color: INK } },
      "hero-subtitle2":  { config: { ...classicTemplate.elements["hero-subtitle2"].config, color: INK2 } },
      "hero-year-badge": { config: { ...classicTemplate.elements["hero-year-badge"].config, color: DEEP } },

      "stats-voted-card":    { config: { backgroundType: "solid", backgroundColor: SOFT, textColor: INK } },
      "stats-progress-card": { config: { backgroundColor: CARD, borderColor: LINE, numberColor: INK, labelColor: INK2, accentColor: PRIMARY } },
      "stats-eligible-card": { config: { backgroundColor: CARD, borderColor: LINE, numberColor: INK, labelColor: INK2, iconColor: PRIMARY } },

      "voteCTA-button": {
        variant: "default",
        config: { ...classicTemplate.elements["voteCTA-button"].config },
        vars: {
          ...classicTemplate.elements["voteCTA-button"].vars,
          // Layer-2 colour vars REFERENCE the family ramp (injectBlossom pushes
          // --bl-primary/-deep/-card), falling back to this variant's palette so
          // the element renders identically where the ramp is absent.
          "--btn-bg": `var(--bl-primary, ${PRIMARY})`,
          "--btn-text": `var(--bl-card, ${CARD})`,
          "--btn-border-color": `var(--bl-primary, ${PRIMARY})`,
          "--btn-radius": "9999px",
          "--btn-shadow": `var(--shadow-button, ${SHADOW_BTN})`,
          "--btn-hover-bg": `var(--bl-primary-deep, ${DEEP})`,
          "--btn-padding-x": "32px", "--btn-padding-y": "16px", "--btn-font-size": "16px", "--btn-font-weight": "700",
        },
      },

      "meet-section": { config: { visible: true, borderColor: LINE, glowFrom: PRIMARY, glowVia: SOFT, glowTo: CARD, surfaceLight: true } },
      "meet-title":   { config: { ...classicTemplate.elements["meet-title"].config, color: INK } },
      "meet-cta":     { config: { ...classicTemplate.elements["meet-cta"].config, backgroundColor: PRIMARY, textColor: CARD } },

      "banner-section": {
        variant: "default", config: { visible: true, borderColor: LINE },
        vars: { "--banner-bg": "var(--color-surface)", "--banner-border": "var(--color-border)", "--banner-border-width": "1px", "--banner-radius": "var(--radius-card)", "--banner-shadow": SHADOW_CARD },
      },

      "vote-party-card": { config: { ...classicTemplate.elements["vote-party-card"].config, backgroundColor: CARD, borderColor: LINE } },
    },
  };
}

// ── the 4 colour themes — each a FULL build from its palette (tokens + element
// configs + page backgrounds all follow), so applying a variant matches preview.
// layoutFamily stays "blossom" → one chooser card with swatches. All 4 marked
// "(ทดลอง)" — experimental phase (home done, inner pages classic fallback).
export const blossomTemplate       = buildBlossomTemplate(
  "blossom", "บลอสซัม · ชมพู (ทดลอง)",
  "ซอฟต์ป็อปสดใส — เรขาคณิตมนใหญ่ ป้ายมินิมอล ปุ่มกดยุบสปริง โทนชมพูลูกกวาด · เลือกโทนได้ 4 แบบ",
  BLOSSOM_THEMES["blossom"]);
export const blossomSkyTemplate    = buildBlossomTemplate(
  "blossom-sky", "บลอสซัม · ฟ้า (ทดลอง)",
  "ซอฟต์ป็อปสดใส โทนฟ้าละมุน — สดชื่น เป็นมิตร อ่านง่าย",
  BLOSSOM_THEMES["blossom-sky"]);
export const blossomMintTemplate   = buildBlossomTemplate(
  "blossom-mint", "บลอสซัม · มินต์ (ทดลอง)",
  "ซอฟต์ป็อปสดใส โทนมินต์เขียว — สะอาดตา สดชื่น มีชีวิตชีวา",
  BLOSSOM_THEMES["blossom-mint"]);
export const blossomButterTemplate = buildBlossomTemplate(
  "blossom-butter", "บลอสซัม · บัตเตอร์ (ทดลอง)",
  "ซอฟต์ป็อปสดใส โทนเหลืองบัตเตอร์ — อบอุ่น สดใส ชวนยิ้ม",
  BLOSSOM_THEMES["blossom-butter"]);

export default blossomTemplate;
