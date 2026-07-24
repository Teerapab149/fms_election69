// Blossom Civic colour palettes — THE single source for the "Blossom" (Soft Pop
// Civic) template family's colours. Plain module (server-importable) so
// builtIn/blossom.js builds each variant's Layer-1 tokens from the SAME ramp the
// home layout reads (.bl-root --bl-* vars) — the gumroad/verdure/original parity
// rule. Applying a variant live therefore matches its preview byte-for-byte.
//
// Blossom is a LIGHT, friendly template: a saturated candy PRIMARY drives the big
// title numeral / CTA / avatar, sitting on a near-neutral PAPER canvas that keeps
// only a whisper of the primary hue (~98L, low chroma — owner 2026-07-12: the old
// saturated ~97L tints read as eye strain page-wide; candy lives in ACCENTS, the
// page itself is calm paper). Cards stay pure white; ink is a constant deep-plum
// near-black so
// text contrast never drifts as the theme changes. Three SUPPORT colour pairs
// (a light chip bg + a dark readable ink, ≥4.5:1) rotate per theme so the stat
// chips stay multi-colour and playful in every variant. Slots (semantic):
//   canvas       — page background (near-neutral paper, whisper of primary)
//   card         — surface (#FFFFFF, CONSTANT every theme)
//   ink          — page text (deep plum near-black, CONSTANT every theme)
//   ink2         — muted text (labels/subtitles, CONSTANT — neutral plum-mute)
//   faint        — faintest label ink (mono eyebrows, CONSTANT)
//   line         — hairline on card / canvas (per-theme tint of primary)
//   primary      — the candy brand hue (title, CTA, avatar, primary chip identity)
//   primaryDeep  — deeper primary (FILL only: the soft-3D button shadow, the
//                  pressed state, the selected radio dot). NOT a text colour —
//                  see primaryInk.
//   primaryInk   — accent TEXT ink. primaryDeep is a candy fill, and reading it
//                  back as type on the paper canvas / on a primarySoft chip fails
//                  AA in every theme: measured on the real pages, the "ดูรายละเอียด"
//                  pill read 1.82:1 in butter, 2.21:1 in mint, 2.60:1 in sky and
//                  2.94:1 in pink (need 4.5), and the 84px hero accent word read
//                  1.98:1 / 2.48:1 in butter / mint (need 3). Same hue, deep enough
//                  to carry type — these ARE the SUP_* inks, which the palette
//                  already validates at ≥4.5:1 on their own light chip.
//   onPrimary    — text ink ON primary / primaryDeep surfaces (CTA label, confirm
//                  button, avatar initial). Constant INK in EVERY theme: these are
//                  all light candy fills, and white never reached AA on any of them.
//                  (The old rule said "white where primaryDeep is dark enough
//                  (pink/sky)" — but the biggest buttons, including the vote-confirm
//                  bar, are filled with `primary`, not `primaryDeep`. Measured on the
//                  real page, white on the confirm button read 2.54:1 in pink and
//                  2.18:1 in sky — below AA, and below the ≥3:1 this comment itself
//                  promised. Ink reads 6.0:1 and 7.0:1 on those same fills.)
//   primarySoft  — lightest primary tint (the "voted" stat chip background)
//   sup1/sup1Ink — support chip pair #1 (bg + readable ink ≥4.5:1)
//   sup2/sup2Ink — support chip pair #2
//   sup3/sup3Ink — support chip pair #3
// Theme 1 (blossom · ชมพู) is the approved mockup base; the other 3 derive by the
// same rule (canvas ≈ near-neutral ~98L paper with a whisper of primary · deep ≈
// primary darkened ~12-15% · ink/card/ink2/faint held constant · support pairs
// rotated so each theme keeps three OTHER accents beside its own primary).

// ── the four fixed support-chip colour pairs (bg is light, ink is dark, ≥4.5:1
//    on that bg) — rotated into sup1/sup2/sup3 per theme so a theme never lists
//    its own primary hue as a "support" accent. ──
const SUP_PINK   = { bg: "#FFE1F0", ink: "#B02E7A" };
const SUP_MINT   = { bg: "#E7FBF1", ink: "#1E7A55" };
const SUP_SKY    = { bg: "#EAF4FF", ink: "#2668B8" };
const SUP_BUTTER = { bg: "#FFF4DC", ink: "#7E5417" };

// constants shared by every theme
const INK   = "#2B2230"; // deep plum near-black — page text
const INK2  = "#7A6B74"; // muted plum-grey — labels / subtitles
// faintest mauve — mono eyebrows / meta. Was #B08CA0, which measured 2.8:1 on the
// card and canvas: below AA for any size, and it carries real information (party
// index, "ทีมงาน N คน", the ID/position/major rows in the member modal), not just
// decoration. Same hue, deep enough to pass — ~5:1 on white.
const FAINT = "#8A6478";
const CARD  = "#FFFFFF"; // surface — always white

function makeTheme({ canvas, line, primary, primaryDeep, primaryInk, primarySoft, onPrimary = INK, sups }) {
  return {
    canvas, card: CARD, ink: INK, ink2: INK2, faint: FAINT, line,
    primary, primaryDeep, primaryInk, primarySoft, onPrimary,
    sup1: sups[0].bg, sup1Ink: sups[0].ink,
    sup2: sups[1].bg, sup2Ink: sups[1].ink,
    sup3: sups[2].bg, sup3Ink: sups[2].ink,
  };
}

export const BLOSSOM_THEMES = {
  // ชมพู — the approved Soft Pop mockup base. Candy pink on calm blush paper.
  "blossom": makeTheme({
    canvas: "#FCF9FA", line: "#EDE2E8",
    primary: "#FF6FBF", primaryDeep: "#E24FA3", primarySoft: "#FFE1F0",
    primaryInk: SUP_PINK.ink,   // #B02E7A — 5.98:1 on card, 4.92:1 on #FFE1F0
    sups: [SUP_MINT, SUP_SKY, SUP_BUTTER],
  }),
  // ฟ้า — friendly sky blue.
  "blossom-sky": makeTheme({
    canvas: "#F9FBFD", line: "#E1E8F0",
    primary: "#6FB4FF", primaryDeep: "#4A94E8", primarySoft: "#DCEBFF",
    primaryInk: SUP_SKY.ink,    // #2668B8 — 5.63:1 on card, 4.65:1 on #DCEBFF
    sups: [SUP_PINK, SUP_MINT, SUP_BUTTER],
  }),
  // มินต์ — fresh mint green.
  "blossom-mint": makeTheme({
    canvas: "#F8FBF9", line: "#DFEAE3",
    primary: "#5BD6A0", primaryDeep: "#3BB584", primarySoft: "#D3F5E6",
    primaryInk: SUP_MINT.ink,   // #1E7A55 — 5.34:1 on card, 4.57:1 on #D3F5E6
    onPrimary: INK, // white on #3BB584 ≈ 2.6:1 — ink reads 6:1
    sups: [SUP_PINK, SUP_SKY, SUP_BUTTER],
  }),
  // บัตเตอร์ — warm butter yellow.
  "blossom-butter": makeTheme({
    canvas: "#FCFAF5", line: "#EDE6D6",
    primary: "#FFC85C", primaryDeep: "#E8A93B", primarySoft: "#FFEFCC",
    primaryInk: SUP_BUTTER.ink, // #7E5417 — 6.73:1 on card, 5.92:1 on #FFEFCC
    onPrimary: INK, // white on #E8A93B ≈ 2.1:1 — ink reads 7.5:1
    sups: [SUP_PINK, SUP_SKY, SUP_MINT],
  }),
};

export function blossomTheme(slug) {
  return BLOSSOM_THEMES[slug] || BLOSSOM_THEMES.blossom;
}
