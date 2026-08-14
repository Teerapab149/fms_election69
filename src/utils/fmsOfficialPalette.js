// FMS Official colour ramps — THE single source for the faculty-branded template
// family and its colour variants.
//
// Plain module (server-importable, no "use client", no next-auth) so
// templates/builtIn/fms-official.js can build each variant's Layer-1 tokens from
// the SAME ramp the client chrome reads — the gumroad/verdure/original parity
// rule. The palette must NOT live in FmsOfficialChrome.js: that file is a client
// component and templates/index.js is resolved on the server (layout.js
// getThemeTokenCss).
//
// ── ONE HONEST CAVEAT ON THE VARIANTS ──
// Every other family's colour themes are taste. This one's are not, quite: the
// whole argument of this template is "this is the faculty's own system", and the
// faculty is plum. A navy or emerald build is still a good institutional page,
// but it no longer *matches* fms.psu.ac.th, so it trades away the one thing this
// family has that the other nine do not. `fms-official` (plum) is therefore the
// default and the one to ship for a real election; the rest exist because the
// structure should outlive the palette — another faculty, another year, another
// brand refresh.
//
// The DEFAULT ramp is taken from the faculty's own site: a dark plum utility
// strip above a white header, a muted plum for rules/plates/primary, white cards
// on a light neutral band, and a neutral charcoal footer.
//
// NO FUCHSIA in the plum build. The flagship `original` ramp runs #8A2680 →
// #C026D3 → #D946EF, but the faculty site carries no magenta anywhere. That
// gradient is the single biggest way the current design reads as off-brand; this
// family corrects it.
//
// Slots are semantic, not Tailwind numbers (project convention):
//   plumDeep  — darkest brand stop (reserved dark surfaces)
//   plum      — the top utility strip AND the inner-page title plate. Must carry
//               white text at ≥4.5:1, so every variant keeps it genuinely dark.
//   brand     — primary button, section rules, links, number badges
//   brandDeep — hover / pressed stop for brand surfaces
//   brandSoft — secondary accent text that still reads on white (kickers, meta)
//   tint      — lightest brand wash (chips, callout panels, page plate on light)
//   tint2     — one step deeper (hover chip, meter track, disabled fill)
//   line      — hairline border on white
//   ink       — body text
//   muted     — secondary text
//   surface   — cards / page white
//   bg        — the alternating section band
//   foot      — footer field. Held NEUTRAL charcoal in every variant on purpose:
//               the faculty's own footer is neutral, and it is what stops a
//               colour-shifted build from reading as a themed product page.
//   footBar   — the darker copyright strip beneath the footer

const FOOT = "#3A3A3C";
const FOOT_BAR = "#2E2E30";

export const FMS_OFFICIAL_THEMES = {
  // ม่วงพลัม — THE faculty identity. Default, and the only one that actually
  // matches fms.psu.ac.th.
  "fms-official": {
    plumDeep: "#3E1A38", plum: "#5C2A52",
    brand: "#8A2680", brandDeep: "#6E1F67", brandSoft: "#9C4F92",
    tint: "#F8F2F7", tint2: "#EFE0EB", line: "#E3D3DF",
    ink: "#241E28", muted: "#6B6572", surface: "#FFFFFF", bg: "#F5F4F7",
    foot: FOOT, footBar: FOOT_BAR,
  },

  // กรมท่า — the most conventionally "official" register: navy reads as
  // administrative in almost every Thai institutional context.
  "fms-official-navy": {
    plumDeep: "#0E2038", plum: "#1C3A5E",
    brand: "#1B4F8A", brandDeep: "#143C6B", brandSoft: "#496C93",
    tint: "#F1F5FA", tint2: "#DFE9F3", line: "#CBDAEA",
    ink: "#16202C", muted: "#5F6B7A", surface: "#FFFFFF", bg: "#F3F5F8",
    foot: FOOT, footBar: FOOT_BAR,
  },

  // เขียวมรกต — calm and non-partisan; useful when a party's own colour would
  // clash with plum on the ballot.
  "fms-official-emerald": {
    plumDeep: "#0B2B20", plum: "#14503A",
    brand: "#126B47", brandDeep: "#0D5537", brandSoft: "#3A7A5C",
    tint: "#F0F7F3", tint2: "#DCEDE4", line: "#C4DFD1",
    ink: "#16241D", muted: "#5F6F67", surface: "#FFFFFF", bg: "#F3F7F5",
    foot: FOOT, footBar: FOOT_BAR,
  },

  // เบอร์กันดี — the warm formal register. Closest in temperature to plum, so
  // it is the safest swap if the faculty brand ever warms up.
  "fms-official-maroon": {
    plumDeep: "#3A1218", plum: "#5B2027",
    brand: "#8C2233", brandDeep: "#6E1A28", brandSoft: "#A5545F",
    tint: "#FAF1F2", tint2: "#F1DEE1", line: "#E5CBD0",
    ink: "#261B1D", muted: "#6E6265", surface: "#FFFFFF", bg: "#F7F4F5",
    foot: FOOT, footBar: FOOT_BAR,
  },

  // เทาน้ำเงิน — the quietest build. No hue to argue with, which is exactly
  // what a contested count sometimes wants.
  "fms-official-slate": {
    plumDeep: "#1B2430", plum: "#2E3D4F",
    brand: "#3B5169", brandDeep: "#2C3D50", brandSoft: "#5A6E85",
    tint: "#F2F5F8", tint2: "#E2E8EF", line: "#D0D9E2",
    ink: "#1C232B", muted: "#626C77", surface: "#FFFFFF", bg: "#F4F6F8",
    foot: FOOT, footBar: FOOT_BAR,
  },
};

// Unknown / absent slug resolves to the faculty plum — the safe default, since a
// wrong guess here paints the whole site.
export function fmsOfficialTheme(slug) {
  return FMS_OFFICIAL_THEMES[slug] || FMS_OFFICIAL_THEMES["fms-official"];
}

// Back-compat alias: the default ramp. Existing imports of FMS_OFFICIAL keep
// working and keep meaning "the faculty plum".
export const FMS_OFFICIAL = FMS_OFFICIAL_THEMES["fms-official"];

export default FMS_OFFICIAL;
