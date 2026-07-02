// Original colour palettes — THE single source for the "Original" (SAMO classic)
// template's colours. Plain module (server-importable) so builtIn/original.js can
// build each variant's Layer-1 tokens from the SAME ramp the home layout reads —
// the gumroad/verdure parity rule.
//
// Original's identity is a purple→fuchsia BRAND RAMP used across the home (title
// gradient, headings, primary button, badge) + the classic inner pages (tokens).
// A formal theme shifts the whole ramp. Slots (semantic, not Tailwind numbers):
//   deep    — darkest brand stop (button base, deep gradient start)
//   brand   — core brand (title, primary, links, --color-primary)
//   bright  — bright accent (gradient end / the fuchsia pop)
//   glow    — brightest sparkle (the ping dot)
//   mid     — mid tint (secondary accents, purple-400/500)
//   soft    — lightest tint (badge / chip background, purple-50)
//   soft2   — slightly deeper tint (purple-100)
//   line    — soft border on tint (purple-200)
//   ink     — page text (near-black, kept warm-neutral per theme)
//   bg      — page background (near-white)
// The 4 themes are all FORMAL (this is the ceremonial/official-leaning template).

export const ORIGINAL_THEMES = {
  // ม่วง FMS — the SAMO brand identity (purple → fuchsia on white)
  "original": {
    deep: "#691E61", brand: "#8A2680", bright: "#C026D3", glow: "#D946EF", mid: "#A855F7",
    soft: "#FAF5FF", soft2: "#F3E8FF", line: "#E9D5FF", ink: "#0F172A", bg: "#F8F9FD",
  },
  // เนวี · ราชนาวี + ทอง — deep navy structure with a muted-gold accent (academic/formal)
  "original-navy": {
    deep: "#14264A", brand: "#1E3A8A", bright: "#C6A15B", glow: "#D4AF37", mid: "#3B5A9A",
    soft: "#F1F5FB", soft2: "#E7EEF7", line: "#CBD9EC", ink: "#0D172A", bg: "#F7F9FC",
  },
  // เขียวขรึม — solemn deep forest green (regalia-formal)
  "original-forest": {
    deep: "#123B29", brand: "#1B5E3F", bright: "#3E9E6B", glow: "#4CAF7D", mid: "#3C8560",
    soft: "#F0F7F3", soft2: "#E3F0E9", line: "#C7E0D2", ink: "#0E1F17", bg: "#F6FAF7",
  },
  // เลือดหมู — burgundy / maroon (ceremonial, weighty)
  "original-maroon": {
    deep: "#5C1A2E", brand: "#7B2233", bright: "#A63A4A", glow: "#C25666", mid: "#9E4453",
    soft: "#FBF3F4", soft2: "#F6E5E8", line: "#ECC9CF", ink: "#1F1013", bg: "#FBF8F8",
  },
};

export function originalTheme(slug) {
  return ORIGINAL_THEMES[slug] || ORIGINAL_THEMES.original;
}
