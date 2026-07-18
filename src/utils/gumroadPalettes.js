// Gumroad colour palettes — THE single source for the "Active Pulse" template's
// colours. Plain module (no "use client") because it is consumed on BOTH sides:
//   client: GumroadBaseStyles (.gum-root vars) + injectTemplateTheme (preview morph)
//   server: builtIn/gumroad.js (Layer-1 tokens + element configs written on apply)
// Before this file existed the two sides disagreed (gumroad.js still carried the
// pre-"ละมุน" hard palette #FF90E8/#B6FF6E/#FFF1E5), so the LIVE site rendered a
// mix that never matched the preview. One map ends that class of bug.
//
// Slots: cream = page bg · ink = chunky borders + text · pink = accent tile #1 ·
// lime = accent tile #2 · yellow/sky/coral = secondary pops · paper = card surface ·
// gw1/gw2/gw3 = the page-background gradient wash stops (pink-ish → cream-ish →
// lime-ish in the base; each theme hand-picks its own tints).

export const GUMROAD_THEMES = {
  // Original "ละมุน" warm pop (the shipped identity — gw stops are byte-exact)
  "gumroad": {
    ink: "#26271c", ink2: "#5c5a4b", cream: "#FFF6EC", cream2: "#FFE9D6", paper: "#FFFDFA",
    pink: "#FF9CE9", lime: "#C2F47E", yellow: "#FFD24D", sky: "#B6E6FF", coral: "#FF8A8A",
    gw1: "#FFE6F2", gw2: "#FFF7EE", gw3: "#EEF7DB",
  },
  // ไซเบอร์พังก์ — light gray + pitch-black frames + neon cyan / electric violet
  "gumroad-cyber": {
    ink: "#000000", ink2: "#3A4658", cream: "#F0F4F8", cream2: "#E2EAF2", paper: "#FFFFFF",
    pink: "#00F0FF", lime: "#A370F7", yellow: "#7DF9FF", sky: "#00F0FF", coral: "#FF5470",
    gw1: "#DFF8FC", gw2: "#F2F6FA", gw3: "#ECE4FB",
  },
  // เรโทร อาร์เคด (Y2K) — pastel-yellow paper + charcoal frames + tangerine / teal
  "gumroad-retro": {
    ink: "#1A1A1A", ink2: "#6B5D3F", cream: "#FFFDF0", cream2: "#FFF3C4", paper: "#FFFFFF",
    pink: "#FF9233", lime: "#14D4B4", yellow: "#FFD24D", sky: "#14D4B4", coral: "#FF6B6B",
    gw1: "#FFEBD9", gw2: "#FFFBE6", gw3: "#DDF6EF",
  },
  // แอซิด อินดัสเทรียล — stark off-white + pitch black + acid-lime volt / hot coral
  "gumroad-acid": {
    ink: "#000000", ink2: "#4A4A4A", cream: "#F6F6F6", cream2: "#EAEAEA", paper: "#FFFFFF",
    pink: "#CCFF00", lime: "#FF4A4A", yellow: "#CCFF00", sky: "#FF4A4A", coral: "#FF4A4A",
    gw1: "#F2FCD1", gw2: "#F7F7F5", gw3: "#FFE2E2",
  },
  // ไซเบอร์ป๊อป พรีเมียม — vibrant pink + cyber-blue / mint bento on premium off-white
  "gumroad-premium": {
    ink: "#000000", ink2: "#55555F", cream: "#FAFAFA", cream2: "#F0EFF3", paper: "#FFFFFF",
    pink: "#FF4B91", lime: "#00F5A0", yellow: "#FFD84D", sky: "#00D2FF", coral: "#FF5470",
    gw1: "#FFE3EE", gw2: "#FAFAFC", gw3: "#DDFBF0",
  },
  // บับเบิ้ลกัม — pink-first pastel pop
  "gumroad-bubblegum": {
    ink: "#201318", ink2: "#6B4A5C", cream: "#FFF0F6", cream2: "#FFDEEC", paper: "#FFFDFE",
    pink: "#FF74C4", lime: "#82E8B5", yellow: "#FFD97A", sky: "#7FD4FF", coral: "#FF8FA3",
    gw1: "#FFDFF0", gw2: "#FFF7FB", gw3: "#DFF2FF",
  },
};

export function gumroadTheme(slug) {
  return GUMROAD_THEMES[slug] || GUMROAD_THEMES.gumroad;
}
