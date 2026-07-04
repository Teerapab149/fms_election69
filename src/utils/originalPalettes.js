// Original colour palettes — THE single source for the "Original" (SAMO classic)
// template's colours. Plain module (server-importable) so builtIn/original.js can
// build each variant's Layer-1 tokens from the SAME ramp the home layout reads —
// the gumroad/verdure parity rule.
//
// Original is a LIGHT template: a dark BRAND hue drives readable text / gradient
// title start / primary button, paired with a METALLIC (or bright) accent (the
// `glow` slot) that only appears where it reads on light — the ping dot, the tail
// of the title numeral gradient, badge highlights. Each theme carries its OWN
// light background (`bg`) at a distinct temperature so no two themes read as the
// same page. Slots (semantic, not Tailwind numbers):
//   deep    — darkest brand stop (button base, deep gradient start)
//   brand   — core brand hue (title, primary, links, --color-primary)
//   bright  — brighter brand stop (gradient end of the primary button)
//   glow    — the accent (ping dot, title gradient tail, sparkle)
//   mid     — mid accent tint (secondary/hover text — kept readable on white)
//   soft    — lightest hue tint (badge / chip background)
//   soft2   — slightly deeper tint (hover chip)
//   line    — soft border on tint
//   ink     — page text (near-black, warmed per theme)
//   bg      — page background (distinct light temperature per theme)
// Theme 1 is the SAMO brand identity (ม่วง-ขาว); the other 4 are formal/premium.

export const ORIGINAL_THEMES = {
  // ม่วง FMS — THE SAMO brand identity (purple → fuchsia on white). Flagship default.
  "original": {
    deep: "#691E61", brand: "#8A2680", bright: "#C026D3", glow: "#D946EF", mid: "#A855F7",
    soft: "#FAF5FF", soft2: "#F3E8FF", line: "#E9D5FF", ink: "#0F172A", bg: "#F8F9FD",
  },
  // Midnight Navy & Matte Gold — Professional · Trustworthy · Luxurious.
  "original-navy": {
    deep: "#0B1F38", brand: "#1E3E62", bright: "#34618F", glow: "#D4AF37", mid: "#A8862E",
    soft: "#EEF3FA", soft2: "#DEE9F6", line: "#C3D6EC", ink: "#0C1B2A", bg: "#E8F0FA",
  },
  // Emerald & Champagne — deep forest green + soft champagne gold. Sophisticated · Elegant.
  "original-emerald": {
    deep: "#0A2E20", brand: "#14603F", bright: "#1F7A50", glow: "#C9A86A", mid: "#A2854E",
    soft: "#EFF5F1", soft2: "#DFEDE5", line: "#C6DED0", ink: "#0E1F17", bg: "#EAF2EA",
  },
  // Crimson & Platinum — rich crimson on a neutral pearl/charcoal chrome. Modern · Bold.
  "original-crimson": {
    deep: "#6E1414", brand: "#A31D1D", bright: "#C43A2E", glow: "#D64545", mid: "#8A2B2B",
    soft: "#F2F0F1", soft2: "#E6E3E5", line: "#D3D3D3", ink: "#1E1E24", bg: "#F5ECEC",
  },
  // Aubergine & Copper — deep plum + burnished copper. Active · High-Contrast.
  "original-aubergine": {
    deep: "#3A1633", brand: "#6B2A5E", bright: "#8C3A79", glow: "#D97706", mid: "#B4611D",
    soft: "#F6EFF4", soft2: "#ECDCE7", line: "#DBC2D3", ink: "#241021", bg: "#F3E9F1",
  },
};

export function originalTheme(slug) {
  return ORIGINAL_THEMES[slug] || ORIGINAL_THEMES.original;
}
