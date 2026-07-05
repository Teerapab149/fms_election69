// Studio Dark colour palettes — THE single source for the "Studio Dark" template's
// colours. Plain module (server-importable) so builtIn/studio-dark.js can build each
// variant's Layer-1 tokens from the SAME ramp StudioDarkBaseStyles emits on the
// client — the gumroad/verdure/original parity rule.
//
// Studio Dark is a DARK template: every theme keeps the same recipe — a warm-or-cool
// soft-dark canvas (never pure black), hairline rules, and ONE electric accent used
// sparingly — but shifts the accent hue and tunes the black's temperature to match.
// Slots (mirror the --sd-* vars the layouts declare):
//   bg         — page canvas (--sd-bg)
//   bg2        — raised surface (--sd-bg-2)
//   bg3        — deeper surface (--sd-bg-3)
//   bgRail     — the fixed left rail, darkest (--sd-bg-rail)
//   line       — hairline rule (--sd-line)
//   lineStrong — stronger rule / focus border (--sd-line-strong)
//   ink        — primary text (--sd-ink)
//   ink2       — muted text (--sd-ink-2)
//   ink3       — faint labels (--sd-ink-3)
//   ink4       — faintest / disabled (--sd-ink-4)
//   accent     — THE electric accent (--sd-accent, --color-primary)
//   accent2    — softer accent (Layer-1 --color-accent, glows)
// Theme 1 is the original lime identity (ค่าปัจจุบันเป๊ะ — ห้าม drift).

export const STUDIO_THEMES = {
  // ไลม์ — the original Studio Dark v2 identity: warm dark + electric lime.
  "studio-dark": {
    bg: "#14140F", bg2: "#1B1B14", bg3: "#232319", bgRail: "#111108",
    line: "#2E2E22", lineStrong: "#3E3E2D",
    ink: "#F2EDDF", ink2: "#B5B0A2", ink3: "#7F7A6E", ink4: "#555142",
    accent: "#D5FF3F", accent2: "#C7E866",
  },
  // ไซเบอร์ฟ้า — cool blue-blacks + sky-cyan accent. Technical · Crisp.
  "studio-dark-cyber": {
    bg: "#0F1216", bg2: "#151A20", bg3: "#1C222A", bgRail: "#0B0E12",
    line: "#242C35", lineStrong: "#323D49",
    ink: "#E9EFF5", ink2: "#A2AEBA", ink3: "#707D89", ink4: "#4A545E",
    accent: "#38BDF8", accent2: "#7DD3FC",
  },
  // แมเจนต้า — plum-tinted blacks + hot magenta accent. Expressive · Bold.
  "studio-dark-magenta": {
    bg: "#151015", bg2: "#1C151C", bg3: "#241B24", bgRail: "#100C10",
    line: "#2F2430", lineStrong: "#403242",
    ink: "#F4EDF1", ink2: "#B7A8B2", ink3: "#847484", ink4: "#574C57",
    accent: "#F472B6", accent2: "#F9A8D4",
  },
  // ทองอำพัน — warm amber-blacks + molten gold accent. Prestigious · Warm.
  "studio-dark-amber": {
    bg: "#161207", bg2: "#1D180C", bg3: "#262010", bgRail: "#110E06",
    line: "#312A17", lineStrong: "#433A23",
    ink: "#F4EDDC", ink2: "#B8AD97", ink3: "#857B66", ink4: "#585040",
    accent: "#F59E0B", accent2: "#FBBF24",
  },
};

export function studioDarkTheme(slug) {
  return STUDIO_THEMES[slug] || STUDIO_THEMES["studio-dark"];
}
