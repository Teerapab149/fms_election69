// Receipt "Paper Materiality" colour palettes — THE single source for the
// "Receipt" (Template Family #6) colours. Plain module (server-importable) so
// builtIn/receipt.js builds each variant's Layer-1 tokens from the SAME ramp the
// pages read (.rc-root --rc-* vars) — the blossom/verdure/gumroad parity rule.
// Applying a variant live therefore matches its preview byte-for-byte.
//
// Receipt is a LIGHT template: everything on screen is a thing that could be
// PRINTED, laid on a bright warm "polling-desk" paper (~97L, calm near-neutral —
// NOT dark). The DESK, the RECEIPT stock, and the INK never change with the theme
// (the "ink/card constant" lesson) — only the ACCENT + the holographic-foil
// starting hue rotate per theme, so text contrast stays stable in every variant.
// Slots (semantic):
//   desk        — page/desk ground (warm near-neutral paper, CONSTANT)
//   deskShade   — subtle desk shading / drop zones under objects (CONSTANT)
//   receipt     — thermal-receipt stock (true-ish white, a hair warm, CONSTANT)
//   receiptEdge — die-cut edge / receipt shadow tint (CONSTANT)
//   ink         — print ink (warm near-black, NOT pitch #000, CONSTANT)
//   ink2        — faded print / muted labels (CONSTANT, ≥4.5:1 on receipt+desk)
//   faint       — faintest mono eyebrows / register-tape print (CONSTANT)
//   line        — hairline / perforation dot line (CONSTANT)
//   stampLine   — heavier stamp/border tooth (CONSTANT)
//   holo1..5    — the shared color-shifting foil ramp (CONSTANT; only holoShift rotates)
//   holoAngle   — default foil gradient angle (CONSTANT)
//   accent      — the theme's brand hue (Layer-1 primary — title/CTA fill/seal ink)
//   accentDeep  — deeper accent (pressed/shadow + the text-safe value where accent fails)
//   holoShift   — per-theme hue offset so each theme's foil opens on its own hue
//   onAccent    — text ink ON an accent FILL block. purple/blue/jade → receipt (white-ish);
//                 YELLOW → ink (yellow is fill-only, white text fails on it).
//                 NOTE: accent-AS-TEXT is a component concern — jade/yellow must use
//                 accentDeep or ink for coloured text (tokens-draft §5); onAccent here
//                 is strictly "what sits on top of an accent-filled surface".
//
// Theme 1 (receipt · ม่วง) ties to the FMS brand #8A2680 (CLAUDE.md design system)
// and is the safest text accent → the default. The other 3 derive by the same rule
// (accent + accentDeep + holoShift + onAccent rotate; base/holo held constant).

// ── constants shared by every theme (the desk / receipt / ink never shift) ──
const DESK        = "#F7F4EE"; // polling-desk paper ground (~97L warm near-neutral)
const DESK_SHADE  = "#EFEBE2"; // subtle desk shading under objects
const RECEIPT     = "#FDFCF9"; // thermal-receipt stock (true-ish white, a hair warm)
const RECEIPT_EDGE = "#F1EEE8"; // die-cut edge / receipt shadow tint
const INK         = "#1C1815"; // print ink — warm near-black (NOT pitch #000)
const INK2        = "#6B635B"; // faded print / muted labels (≥4.5:1)
const FAINT       = "#A79E93"; // faintest mono eyebrows / register-tape print
const LINE        = "#E2DCD1"; // hairline / perforation dot line
const STAMP_LINE  = "#CFC7B9"; // heavier stamp/border tooth

// holo-foil ramp — shared across every theme; only holoShift (a hue offset) rotates.
const HOLO_1 = "#8AD7FF"; // cyan
const HOLO_2 = "#B69CFF"; // violet
const HOLO_3 = "#FF9ECF"; // pink
const HOLO_4 = "#9CF0D0"; // mint
const HOLO_5 = "#FFD98A"; // gold
const HOLO_ANGLE = "128deg";

function makeTheme({ accent, accentDeep, holoShift, onAccent = RECEIPT }) {
  return {
    desk: DESK, deskShade: DESK_SHADE, receipt: RECEIPT, receiptEdge: RECEIPT_EDGE,
    ink: INK, ink2: INK2, faint: FAINT, line: LINE, stampLine: STAMP_LINE,
    holo1: HOLO_1, holo2: HOLO_2, holo3: HOLO_3, holo4: HOLO_4, holo5: HOLO_5,
    holoAngle: HOLO_ANGLE, holoShift,
    accent, accentDeep, onAccent,
  };
}

export const RECEIPT_THEMES = {
  // ม่วง — Official Purple, tied to the FMS brand (#8A2680). Safest text accent → default.
  "receipt": makeTheme({
    accent: "#8A2680", accentDeep: "#6E1E66", holoShift: "0deg", // violet-lead
  }),
  // ฟ้า — Electric Blue. Text-safe (≈5:1 on receipt).
  "receipt-blue": makeTheme({
    accent: "#2B5CFF", accentDeep: "#1E45CC", holoShift: "-40deg", // cyan-lead
  }),
  // เหลือง — Signal Yellow. FILL-ONLY (≈1.7:1) — never coloured text; ink sits ON it.
  "receipt-yellow": makeTheme({
    accent: "#F5C400", accentDeep: "#C99E00", holoShift: "60deg", // gold-lead
    onAccent: INK, // white fails on yellow → ink on the yellow fill
  }),
  // เจด — Jade. Borderline as text (≈3:1) → coloured text uses accentDeep; fill uses onAccent.
  "receipt-jade": makeTheme({
    accent: "#0FA37F", accentDeep: "#0B7E62", holoShift: "20deg", // mint-lead
  }),
};

export function receiptTheme(slug) {
  return RECEIPT_THEMES[slug] || RECEIPT_THEMES.receipt;
}
