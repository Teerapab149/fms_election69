/**
 * Party colours — each party gets its own identity colour.
 *
 * Two layers, deliberately split:
 *   HUE  — the party's identity. Admin-chosen (Candidate.color) when set, otherwise
 *          generated from the party's position so no two parties ever collide.
 *   TONE — saturation + lightness. ALWAYS the system's, never the admin's.
 *
 * The colour is painted under text (winner card, party stickers) and drawn as thin
 * marks on cream (race bars, borders), so its tone has to stay inside the soft
 * "ละมุน" pastel band (readable with ink #26271c) whatever anyone types. Clamping the
 * tone here means the templates never have to defend against a navy or a neon —
 * and consumers that print text on the colour still pick their ink with
 * prefersDarkText() as a second line of defence.
 */

// Default party colour — GENERATED, not a hardcoded list. Each party gets one
// signature hue; the whole party is themed in it. We rotate the hue by the golden
// angle (137.508°) per party so adjacent parties land as far apart as possible
// (never two similar hues) and the sequence never runs out — it works for any
// number of parties, unlike a fixed array. Party 1 starts at blue to keep the
// established identity. Saturation/lightness are fixed to the soft "ละมุน" pastel
// range (tuned to ink #26271c text/borders), so every generated colour sits in
// the same gentle family. An admin pick (Candidate.color) always overrides this.
const GOLDEN_ANGLE = 137.508;
const BASE_HUE = 208;   // party 1 ≈ #7FC8FF blue
const PASTEL_S = 0.9;   // pastel-strong saturation
const PASTEL_L = 0.75;  // light, readable under ink text

export function defaultPartyColor(index) {
  const i = Math.max(0, index | 0);
  const hue = (BASE_HUE + i * GOLDEN_ANGLE) % 360;
  return hslToHex(hue, PASTEL_S, PASTEL_L);
}

// Kept for backward-compat / quick reference — the first 8 generated colours.
export const DEFAULT_PARTY_COLORS = Array.from({ length: 8 }, (_, i) => defaultPartyColor(i));

const HEX6 = /^#?([0-9a-fA-F]{6})$/;
const norm = (hex) => {
  if (typeof hex !== "string") return null;
  const m = hex.trim().match(HEX6);
  return m ? "#" + m[1].toLowerCase() : null;
};

/**
 * Adapt an arbitrary hex toward the soft system tone: blend `mix` of white in so
 * very saturated/dark picks soften into the pastel-strong range. Keeps the hue.
 *
 * No longer on the party-colour path (that is position-based now) — kept as the
 * general tone-matching helper for any future colour that arrives from outside.
 */
export function adaptToTone(hex, mix = 0.2) {
  const h = norm(hex);
  if (!h) return null;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  const blend = (c) => Math.round(c + (255 - c) * mix);
  const to2 = (c) => c.toString(16).padStart(2, "0");
  return "#" + to2(blend(r)) + to2(blend(g)) + to2(blend(b));
}

/**
 * Resolve a party's display colour: admin override (adapted) when valid, else the
 * default rival colour for its position. `index` is the 0-based position among the
 * real parties (sorted by number).
 */
export function getPartyColor(party, index = 0) {
  const custom = norm(party?.color);
  // The admin picks the HUE; the system owns the TONE. A raw hex is an unbounded
  // input on a value that gets painted under text (winner card, party stickers) and
  // drawn as thin marks on cream (race bars, borders) — a navy or a neon yellow
  // breaks one or the other no matter what colour the text is. Forcing the pick into
  // the same saturation/lightness band as the generated palette keeps the party's
  // identity ("we are the blue party") while guaranteeing the contrast and the tone
  // the templates were designed against. Blending 20% white, as this used to do, was
  // not enough: #0B2E6F stayed dark.
  if (custom) {
    const hsl = hexToHsl(custom);
    // an achromatic pick (black / white / grey) carries no hue — forcing saturation
    // onto it would hand back an arbitrary red, so fall through to the party's
    // positional colour instead
    if (hsl && hsl.s > 0.08) return hslToHex(hsl.h, PASTEL_S, PASTEL_L);
  }
  return defaultPartyColor(index);
}

function relLuminance(hex) {
  const h = norm(hex);
  if (!h) return 1;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Should text on this colour be the DARK ink rather than the light one?
 *
 * Party colours are admin-typed and unbounded, so any surface painted with one
 * has to ask before choosing its text colour. Decided by comparing the actual
 * WCAG contrast of both candidates, not by a fixed lightness threshold — a
 * mid-tone signature like #5789E5 sits on the wrong side of any such threshold
 * (dark ink gives 4.6:1 there, light ink only 2.7:1).
 */
export function prefersDarkText(hex, darkInk = "#26271c", lightInk = "#FFF6EC") {
  const bg = relLuminance(hex);
  const ratio = (l) => (Math.max(l, bg) + 0.05) / (Math.min(l, bg) + 0.05);
  return ratio(relLuminance(darkInk)) >= ratio(relLuminance(lightInk));
}

/* ---- HSL helpers (for deriving readable shades from a signature hex) ---- */
// function declaration (hoisted) — defaultPartyColor calls hslToHex→clamp01 at
// module-load time when building DEFAULT_PARTY_COLORS, before this line runs.
function clamp01(n) { return Math.min(1, Math.max(0, n)); }

function hexToHsl(hex) {
  const h = norm(hex);
  if (!h) return null;
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const lum = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4;
    }
    hue /= 6;
  }
  return { h: hue * 360, s: sat, l: lum };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  s = clamp01(s); l = clamp01(l);
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const to2 = (c) => Math.round(c * 255).toString(16).padStart(2, "0");
  return "#" + to2(r) + to2(g) + to2(b);
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * Build a full party theme from a single signature hex (same source as the
 * candidates page, so the hue matches everywhere). Derives readable companions:
 *
 *   - `soft`        the original pastel signature (light touches / echoes)
 *   - `main`        a deep jewel-tone of the same hue — safe under WHITE text
 *                   (badges, accents on dark, hover fills)
 *   - `textOnLight` an even darker shade for headings on a white surface
 *   - `textOnDark`  a light tint for text on dark surfaces
 *   - `gradient`    an inline `linear-gradient(...)` string (NOT tailwind classes)
 *
 * Shape mirrors PartyTheme.js so /party can swap in without touching consumers.
 */
export function buildPartyTheme(party, index = 0) {
  const base = getPartyColor(party, index);
  const hsl = hexToHsl(base) || { h: 210, s: 0.5, l: 0.6 };
  const s = clamp(hsl.s, 0.5, 0.82);

  const main = hslToHex(hsl.h, s, 0.43);
  const textOnLight = hslToHex(hsl.h, clamp(hsl.s, 0.5, 0.85), 0.3);
  const textOnDark = hslToHex(hsl.h, clamp(hsl.s, 0.4, 0.7), 0.82);
  const mainLight = hslToHex(hsl.h, s, 0.52);

  return {
    name: party?.name || "",
    main,
    soft: base,
    secondary: main,
    textOnLight,
    textOnDark,
    middle: [main],
    outer: [main],
    gradient: `linear-gradient(135deg, ${mainLight} 0%, ${textOnLight} 100%)`,
  };
}
