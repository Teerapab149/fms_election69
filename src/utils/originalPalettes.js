// Original colour palettes — THE single source for the "Original" (SAMO classic)
// template's colours. Plain module (server-importable) so builtIn/original.js can
// build each variant's Layer-1 tokens from the SAME ramp the home layout reads —
// the gumroad/verdure parity rule.
//
// Original is a LIGHT template: a dark BRAND hue drives readable text / gradient
// title start / primary button, paired with a METALLIC (or bright) accent (the
// `glow` slot) that only appears where it reads on light — the ping dot, the tail
// of the title numeral gradient, badge highlights. Each theme (except the ม่วง
// FMS flagship) carries its OWN clearly-coloured background (`bg`) — a visible
// colour FIELD, not just a light tint — so switching themes visibly transforms
// the page; `line` deepens to match so borders don't wash out against it. Slots
// (semantic, not Tailwind numbers):
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
  // Midnight Navy & Antique Gold — Professional · Trustworthy · Luxurious.
  "original-navy": {
    deep: "#0A1D33", brand: "#1B3A5E", bright: "#2F5B88", glow: "#C9A227", mid: "#7A5F1B",
    soft: "#EFF4FA", soft2: "#DEE9F5", line: "#A9C3E1", ink: "#0B1524", bg: "#C9DCF2",
  },
  // Emerald & Champagne — deep forest green + soft champagne gold. Sophisticated · Elegant.
  "original-emerald": {
    deep: "#082A1D", brand: "#0F5638", bright: "#1E7C4E", glow: "#CBAC64", mid: "#7E6836",
    soft: "#EEF5F0", soft2: "#DEEBE2", line: "#A6CDB6", ink: "#0C2016", bg: "#C8E3D2",
  },
  // Crimson & Platinum — rich crimson on a neutral pearl/charcoal chrome. Modern · Bold.
  "original-crimson": {
    deep: "#5E1010", brand: "#9E1B1B", bright: "#BE3B2D", glow: "#98A2AE", mid: "#7E2626",
    soft: "#F4F1F2", soft2: "#E8E4E6", line: "#DBB2B2", ink: "#1B1B21", bg: "#EFCFCF",
  },
  // Aubergine & Copper — deep plum + burnished copper. Active · High-Contrast.
  "original-aubergine": {
    deep: "#331229", brand: "#66295A", bright: "#8A3A76", glow: "#C1653B", mid: "#9C5227",
    soft: "#F7F0F4", soft2: "#ECDDE7", line: "#D4AFC7", ink: "#211020", bg: "#E9CCDF",
  },
};

export function originalTheme(slug) {
  return ORIGINAL_THEMES[slug] || ORIGINAL_THEMES.original;
}
