// Receipt "Paper Materiality" colour palettes — THE single source for the
// "Receipt" (Template Family #6) colours. Plain module (server-importable) so
// builtIn/receipt.js builds each variant's Layer-1 tokens from the SAME ramp the
// pages read (.rc-root --rc-* vars) — the blossom/verdure/gumroad parity rule.
// Applying a variant live therefore matches its preview byte-for-byte.
//
// Receipt is a LIGHT template: everything on screen is a thing that could be
// PRINTED, laid on a bright "polling-desk" paper (~97L, calm near-neutral — NOT
// dark). The INK never changes with the theme (the "ink/card constant" lesson).
// v2-R2: the PAPER STOCK now rotates per theme too — each theme is a different
// ROLL of paper (warm / cool-white / carbonless-blue / gray), a very-low-chroma
// tint that still reads as paper — alongside the accent + foil hue. ink2 keeps
// ≥4.5:1 on every theme's paper (verified), so text contrast stays stable.
// Slots (semantic):
//   desk        — page/desk ground (per-theme paper stock)
//   deskShade   — subtle desk shading / drop zones under objects (per-theme)
//   receipt     — thermal-receipt stock (true-ish white for the theme, per-theme)
//   receiptEdge — die-cut edge / receipt shadow tint (per-theme)
//   note        — note-card stock — the turnout/headline card (per-theme)
//   ink         — print ink (warm near-black, NOT pitch #000, CONSTANT)
//   ink2        — faded print / muted labels (CONSTANT, ≥4.5:1 on every paper)
//   faint       — faintest mono eyebrows / register-tape print (CONSTANT)
//   line        — hairline / perforation dot line (per-theme)
//   stampLine   — heavier stamp/border tooth (per-theme)
//   holo1..5    — the shared color-shifting foil ramp (CONSTANT; only holoShift rotates)
//   holoAngle   — default foil gradient angle (CONSTANT)
//   accent      — the theme's brand hue (Layer-1 primary — title/CTA fill/seal ink)
//   accentDeep  — deeper accent (pressed/shadow + the text-safe value for coloured text)
//   holoShift   — per-theme hue offset so each theme's foil opens on its own hue
//   onAccent    — text ink ON an accent FILL block. Every theme's accent is dark, so
//                 onAccent = that theme's receipt white-ish (≥6.5:1 on the accent —
//                 verified). accent-AS-TEXT is a component concern (uses accentDeep).
//
// Theme 1 (receipt · ม่วง FMS) ties to the FMS brand #8A2680 (CLAUDE.md design
// system) and is the safest text accent → the default. Its paper values are the
// R2.5 originals and are FROZEN (v2-R2: default = zero visual change). The other 3
// are "different rolls of paper" — a per-theme PAPER SET (desk / deskShade /
// receipt / receiptEdge / note / line / stampLine) that shifts the stock's tint
// warm→cool while keeping chroma tiny (still reads as paper, not a coloured
// surface) + its own accent/accentDeep/onAccent/holoShift. INK / INK2 / FAINT +
// the holo ramp + the vote-semantic colours (hardcoded in the page components)
// are held CONSTANT so text contrast + ballot semantics stay stable everywhere.
//
// Lineup (owner-LOCKED, "warm/cool paper stock — not saturated colour"):
//   receipt          — ม่วง FMS on warm polling-desk paper (default, frozen)
//   receipt-ink-blue — ink-blue accent on cool-white office paper
//   receipt-teal     — teal-navy accent on carbonless blue copy paper
//   receipt-carbon   — warm dark-gray achromatic accent on gray copy paper
// Accent hexes for the 3 new themes are computed from the owner's oklch targets
// (paste in the v2-R2 report); every ink2-on-paper pair measures ≥4.5:1 AA and
// every onAccent-on-accent pair ≥6.5:1 (verified, report table).

// ── constants shared by EVERY theme (ink + faint + holo ramp never shift) ──
const INK         = "#1C1815"; // print ink — warm near-black (NOT pitch #000)
const INK2        = "#6B635B"; // faded print / muted labels (≥4.5:1 on every paper)
const FAINT       = "#A79E93"; // faintest mono eyebrows / register-tape print

// holo-foil ramp — shared across every theme; only holoShift (a hue offset) rotates.
const HOLO_1 = "#8AD7FF"; // cyan
const HOLO_2 = "#B69CFF"; // violet
const HOLO_3 = "#FF9ECF"; // pink
const HOLO_4 = "#9CF0D0"; // mint
const HOLO_5 = "#FFD98A"; // gold
const HOLO_ANGLE = "128deg";

// ── per-theme PAPER SETS (the "different roll of paper" — tint shifts, chroma
//    stays paper-low). Default = the frozen R2.5 warm-neutral stock. ──
const PAPER = {
  // warm polling-desk paper (R2.5 originals — FROZEN, do not move)
  "receipt": {
    desk: "#F7F4EE", deskShade: "#EFEBE2", receipt: "#FDFCF9", receiptEdge: "#F1EEE8",
    note: "#F5EDDA", line: "#E2DCD1", stampLine: "#CFC7B9",
  },
  // cool-white office paper (a faint blue-gray cast, ~97L)
  "receipt-ink-blue": {
    desk: "#F2F4F8", deskShade: "#E4E8EF", receipt: "#FBFCFE", receiptEdge: "#EAEEF4",
    note: "#ECF0F6", line: "#D9DFE9", stampLine: "#C4CCDA",
  },
  // carbonless BLUE copy paper (the pale duplicate-slip blue)
  "receipt-teal": {
    desk: "#EFF3F5", deskShade: "#E1E9EC", receipt: "#F8FCFD", receiptEdge: "#E7F0F2",
    note: "#E7F1F2", line: "#D2DEE1", stampLine: "#BCCCD0",
  },
  // gray carbon-copy paper (warm neutral gray, no blue)
  "receipt-carbon": {
    desk: "#F1F0ED", deskShade: "#E5E4DF", receipt: "#FAFAF8", receiptEdge: "#EBEAE6",
    note: "#ECEAE4", line: "#DAD8D2", stampLine: "#C6C3BB",
  },
};

function makeTheme({ paper, accent, accentDeep, holoShift, onAccent = paper.receipt }) {
  return {
    desk: paper.desk, deskShade: paper.deskShade, receipt: paper.receipt, receiptEdge: paper.receiptEdge,
    note: paper.note, line: paper.line, stampLine: paper.stampLine,
    ink: INK, ink2: INK2, faint: FAINT,
    holo1: HOLO_1, holo2: HOLO_2, holo3: HOLO_3, holo4: HOLO_4, holo5: HOLO_5,
    holoAngle: HOLO_ANGLE, holoShift,
    accent, accentDeep, onAccent,
  };
}

export const RECEIPT_THEMES = {
  // ม่วง FMS — Official Purple (#8A2680), the safest text accent → default. Paper FROZEN.
  "receipt": makeTheme({
    paper: PAPER["receipt"],
    accent: "#8A2680", accentDeep: "#6E1E66", holoShift: "0deg", // violet-lead
  }),
  // หมึกน้ำเงิน — ink-blue on cool-white paper. oklch(0.45 0.12 262) → #2E5297.
  "receipt-ink-blue": makeTheme({
    paper: PAPER["receipt-ink-blue"],
    accent: "#2E5297", accentDeep: "#193B7E", holoShift: "-40deg", // cool blue/cyan-lead
  }),
  // ครามทะเล — teal-navy on carbonless blue copy paper. oklch(0.45 0.12 210) → #00657A.
  "receipt-teal": makeTheme({
    paper: PAPER["receipt-teal"],
    accent: "#00657A", accentDeep: "#004E62", holoShift: "96deg", // teal/green-lead
  }),
  // สำเนาถ่านดำ — warm dark-gray achromatic accent on gray copy paper.
  // oklch(0.40 0.02 75) → #4E463C. Achromatic → its "colour" is the paper + gray ink.
  "receipt-carbon": makeTheme({
    paper: PAPER["receipt-carbon"],
    accent: "#4E463C", accentDeep: "#393228", holoShift: "200deg", // cool-silver zone
  }),
};

export function receiptTheme(slug) {
  return RECEIPT_THEMES[slug] || RECEIPT_THEMES.receipt;
}
