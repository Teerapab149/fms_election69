// Verdure colour palettes — THE single source for the Verdure template's colours.
// Plain module (no "use client") because it is consumed on BOTH sides:
//   client: VerdureBaseStyles (.vd-root vars) + injectTemplateTheme (preview morph)
//   server: builtIn/verdure.js (Layer-1 tokens + element configs written on apply)
// Same parity rule as utils/gumroadPalettes.js — one map, no drift.
//
// A theme recolours the WHOLE page: paper (cream*), dark surfaces/medallion/dock/
// ink (moss*), the decorative accent (terra*), hairline/gold — plus a separate CTA
// channel (cta/cta2/ctaText) so a theme can use a distinct button colour and adapt
// its label colour (dark text on a light gold button).

export const VERDURE_THEMES = {
  // คลาสสิก พรีเมียม — deep forest + rich burgundy on light ivory (conservative, formal)
  "verdure": {
    cream: "#FDFBF7", cream2: "#FFFFFF", cream3: "#F0EBDF",
    moss: "#1B362B", moss2: "#294A3C", moss3: "#3A5E4D",
    terra: "#722F55", terra2: "#5C2545", soft: "#D8B6C8",
    rule: "#E6DFD2", gold: "#B8895A",
    cta: "#722F55", cta2: "#5C2545", ctaText: "#FDFBF7",
  },
  // โมเดิร์น อะคาเดมิก — deep navy + muted gold on soft warm gray (smart, premium).
  // terra (decorative accent, carries cream numerals) is a DEEPER gold than the
  // brighter CTA button so the cream-on-gold discs stay legible.
  "verdure-honey": {
    cream: "#F4F4F6", cream2: "#FCFCFD", cream3: "#E6E6EB",
    moss: "#1A2B4C", moss2: "#26395E", moss3: "#344B73",
    terra: "#A9863F", terra2: "#8A6D2E", soft: "#E6D3A8",
    rule: "#DBDBE2", gold: "#CDA85F",
    cta: "#C5A059", cta2: "#A9863F", ctaText: "#14223D",
  },
  // คอนเทมโพรารี ครีเอทีฟ — terracotta accent + sage button on pale sand (modern magazine)
  "verdure-teal": {
    cream: "#F2EBE1", cream2: "#FAF5EC", cream3: "#E5DAC8",
    moss: "#2D221E", moss2: "#3D2F28", moss3: "#4F3D33",
    terra: "#AF5232", terra2: "#934026", soft: "#E3BCA8",
    rule: "#DDD1BE", gold: "#C0894C",
    cta: "#4E6B5E", cta2: "#3E574B", ctaText: "#F2EBE1",
  },
  // มินิมอล เทค — ink black + electric indigo on off-white (clean, digital)
  "verdure-berry": {
    cream: "#F8F9FA", cream2: "#FFFFFF", cream3: "#ECEEF1",
    moss: "#141518", moss2: "#24262E", moss3: "#34373F",
    terra: "#4F46E5", terra2: "#3F37C7", soft: "#C8C4F5",
    rule: "#E4E7EB", gold: "#6366F1",
    cta: "#4F46E5", cta2: "#3F37C7", ctaText: "#F8F9FA",
  },
};

export function verdureTheme(slug) {
  return VERDURE_THEMES[slug] || VERDURE_THEMES.verdure;
}

// hex → "r, g, b" string — so every alpha wash / shadow / translucent text can
// read rgba(var(--moss-rgb), .9) and re-tint with the theme. One triple per
// themeable channel; the alpha stays inline at each call site.
export function hexToRgbTriple(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || "").trim());
  return m ? `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}` : "31,58,44";
}
