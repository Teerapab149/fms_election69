/**
 * Receipt "Paper Materiality" Template — Template Family #6 (owner-approved).
 *
 * The 6th template FAMILY: everything on screen is a thing that could be PRINTED,
 * laid on a bright warm polling-desk (die-cut receipt edges, perforation lines,
 * ink stamps, barcodes, holographic security foil) — NOT dark, NOT brutalist.
 * Built the blossom/verdure way (P-LOG-005): spread classicTemplate first to
 * preserve text + element shape, then override (1) Layer-1 tokens, (2) the few
 * element configs any classic-layout FALLBACK page would use. The family's own
 * pages (Success first — ReceiptSuccess) are dispatched by slug; inner pages fall
 * through to the classic layout, recoloured by these Layer-1 tokens.
 *
 * PARITY RULE (like every family): every colour derives from utils/receiptPalettes.js
 * — the SAME ramp ReceiptBaseStyles (.rc-root --rc-* vars) and the preview morph
 * (injectReceipt) read. So applying a colour variant live matches its preview.
 * Layer-1 map: primary=accent · accent=accentDeep · bg=desk · surface=receipt ·
 * text=ink · muted=ink2 · border=line.
 *
 * Fonts (Chakra Petch receipt voice / IBM Plex Sans Thai headings / Space Mono
 * labels) are LOADED in layout.js via next/font (Part A) — a declared font-family
 * does nothing unless loaded. Identity constants (10px paper card radius, soft
 * curl shadow — NOT gumroad's chunky offset shadow) are HARDCODED in the
 * components per Rule 9; the overrides below only recolour catalog elements.
 *
 * Per P-LOG-005: do NOT modify classic.js here — all overrides spread from it.
 */

import { classicTemplate } from "./classic";
import { RECEIPT_THEMES } from "../../../../../utils/receiptPalettes";

function buildReceiptTemplate(slug, name, description, p) {
  const DESK = p.desk, RECEIPT = p.receipt, INK = p.ink, INK2 = p.ink2, LINE = p.line;
  const NOTE = p.note; // manila note-stock — CONSTANT stock, carried into the Layer-1 emit
  const ACCENT = p.accent, DEEP = p.accentDeep, ON_ACCENT = p.onAccent;
  // paper voice — soft curl lift, crisp printed-card corners. NOT chunky-stamp.
  const SHADOW_CARD = `0 10px 30px -14px color-mix(in srgb, ${INK} 35%, transparent)`;
  const SHADOW_BTN = `0 2px 8px -3px color-mix(in srgb, ${INK} 25%, transparent)`;

  return {
    ...classicTemplate,
    id: slug,
    slug,
    name,
    description,
    layoutFamily: "receipt", // real family — own pages (variants reach them via fallback)
    isLocked: true,

    colorSwatch: { primary: ACCENT, secondary: DEEP, background: DESK },

    pages: {
      home:       { visible: true },
      vote:       { visible: true, backgroundColor: DESK },
      candidates: { visible: true, backgroundColor: DESK },
      results:    { visible: true, backgroundColor: DESK },
      closed:     { visible: true, backgroundColor: DESK },
      success:    { visible: true, backgroundColor: DESK },
    },

    theme: {
      colors: {
        primary: ACCENT, accent: DEEP, background: DESK, surface: RECEIPT,
        text: INK, textMuted: INK2, border: LINE,
      },
      typography: classicTemplate.theme?.typography,
      spacing: classicTemplate.theme?.spacing,
      effects: { borderRadius: "0.625rem", shadow: SHADOW_CARD }, // 10px paper cards
      tokens: {
        "--color-primary":     ACCENT,
        "--color-accent":      DEEP,
        "--color-bg":          DESK,
        "--color-surface":     RECEIPT,
        "--color-text":        INK,
        "--color-text-muted":  INK2,
        "--color-border":      LINE,
        "--rc-note":           NOTE,
        "--radius-sm":         "6px",
        "--radius-md":         "8px",
        "--radius-card":       "10px",
        "--radius-button":     "8px",
        "--shadow-card":       SHADOW_CARD,
        "--shadow-button":     SHADOW_BTN,
        "--font-display":      "var(--font-plex-thai), 'IBM Plex Sans Thai', system-ui, sans-serif",
        "--font-body":         "var(--font-chakra), 'Chakra Petch', var(--font-plex-thai), system-ui, sans-serif",
      },
    },

    // recolour the catalog elements any classic-layout fallback page would use
    // (the Receipt family renders its own pages; these keep inner pages on-brand).
    elements: {
      ...classicTemplate.elements,
      "hero-title":      { config: { ...classicTemplate.elements["hero-title"].config, color: INK } },
      "hero-subtitle":   { config: { ...classicTemplate.elements["hero-subtitle"].config, color: INK } },
      "hero-subtitle2":  { config: { ...classicTemplate.elements["hero-subtitle2"].config, color: INK2 } },
      "hero-year-badge": { config: { ...classicTemplate.elements["hero-year-badge"].config, color: DEEP } },

      "stats-voted-card":    { config: { backgroundType: "solid", backgroundColor: RECEIPT, textColor: INK } },
      "stats-progress-card": { config: { backgroundColor: RECEIPT, borderColor: LINE, numberColor: INK, labelColor: INK2, accentColor: ACCENT } },
      "stats-eligible-card": { config: { backgroundColor: RECEIPT, borderColor: LINE, numberColor: INK, labelColor: INK2, iconColor: ACCENT } },

      "voteCTA-button": {
        variant: "default",
        config: { ...classicTemplate.elements["voteCTA-button"].config },
        vars: {
          ...classicTemplate.elements["voteCTA-button"].vars,
          // Layer-2 colour vars REFERENCE the family ramp (injectReceipt pushes
          // --rc-accent/-deep/-on-accent), falling back to this variant's palette
          // so the element renders identically where the ramp is absent.
          "--btn-bg": `var(--rc-accent, ${ACCENT})`,
          "--btn-text": `var(--rc-on-accent, ${ON_ACCENT})`,
          "--btn-border-color": `var(--rc-accent, ${ACCENT})`,
          "--btn-radius": "8px",
          "--btn-shadow": `var(--shadow-button, ${SHADOW_BTN})`,
          "--btn-hover-bg": `var(--rc-accent-deep, ${DEEP})`,
          "--btn-padding-x": "28px", "--btn-padding-y": "15px", "--btn-font-size": "16px", "--btn-font-weight": "600",
        },
      },

      "meet-section": { config: { visible: true, borderColor: LINE, glowFrom: ACCENT, glowVia: RECEIPT, glowTo: RECEIPT, surfaceLight: true } },
      "meet-title":   { config: { ...classicTemplate.elements["meet-title"].config, color: INK } },
      "meet-cta":     { config: { ...classicTemplate.elements["meet-cta"].config, backgroundColor: ACCENT, textColor: ON_ACCENT } },

      "banner-section": {
        variant: "default", config: { visible: true, borderColor: LINE },
        vars: { "--banner-bg": "var(--color-surface)", "--banner-border": "var(--color-border)", "--banner-border-width": "1px", "--banner-radius": "var(--radius-card)", "--banner-shadow": SHADOW_CARD },
      },

      "vote-party-card": { config: { ...classicTemplate.elements["vote-party-card"].config, backgroundColor: RECEIPT, borderColor: LINE } },
    },
  };
}

// ── the 4 paper themes — each a FULL build from its palette (tokens + element
// configs + page backgrounds all follow), so applying a variant matches preview.
// layoutFamily stays "receipt" → one chooser card with swatches. v2-R2: the swatch
// = a DIFFERENT ROLL OF PAPER (warm-white / cool-white / carbonless-blue / gray),
// each with its own accent + foil hue. Default (ม่วง FMS) is byte-frozen from R2.5.
export const receiptTemplate        = buildReceiptTemplate(
  "receipt", "ใบเสร็จ · ม่วง FMS",
  "กระดาษใบเสร็จอุ่นบนโต๊ะนับคะแนน ขอบหยักฉีก ตราปั๊ม โฮโลแกรมกันปลอม หมึกม่วง FMS · เลือกได้ 4 ม้วนกระดาษ",
  RECEIPT_THEMES["receipt"]);
export const receiptInkBlueTemplate = buildReceiptTemplate(
  "receipt-ink-blue", "ใบเสร็จ · หมึกน้ำเงิน",
  "ม้วนกระดาษขาวเย็น หมึกน้ำเงินเข้ม คมสะอาด อ่านง่าย",
  RECEIPT_THEMES["receipt-ink-blue"]);
export const receiptTealTemplate    = buildReceiptTemplate(
  "receipt-teal", "ใบเสร็จ · ครามทะเล",
  "สำเนากระดาษก๊อปปี้ฟ้า หมึกครามทะเลเย็นตา ดูเป็นเอกสารจริง",
  RECEIPT_THEMES["receipt-teal"]);
export const receiptCarbonTemplate  = buildReceiptTemplate(
  "receipt-carbon", "ใบเสร็จ · สำเนาถ่านดำ",
  "สำเนากระดาษถ่านสีเทา หมึกเทาเข้มไร้สี เรียบนิ่ง เท่แบบเอกสาร",
  RECEIPT_THEMES["receipt-carbon"]);

export default receiptTemplate;
