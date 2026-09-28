/**
 * cssSafety — the one gate between admin-controlled theme/template values and
 * the <style> tags every public page renders (H1, 2026-09-25).
 *
 * Why this exists: theme tokens, element vars and per-element custom CSS are
 * admin input that lands inside `<style dangerouslySetInnerHTML>` in the root
 * layout (every page, /vote included). React does not escape that string, so a
 * token value of `red}</style><script>…</script>` ended the style element and
 * ran script for every visitor — including a same-origin fetch('/api/vote') that
 * casts a ballot for whoever is logged in. Admins are student committee members,
 * so "only an admin can do it" is exactly the threat model, not a mitigation.
 *
 * Two layers use this file:
 *   1. the admin APIs (page-layout PUT, template create/update/fork) reject bad
 *      input with a 400 — validate*() below
 *   2. templateTokens.js drops anything unsafe at render time — isSafe*() below —
 *      so a value that got into the DB some other way (old row, raw SQL, a future
 *      route that forgets to validate) still cannot break out of the <style>
 *
 * Allowlist, not blocklist: the character set is what the built-in templates
 * actually use (inventoried 2026-09-25: letters, digits, space and ( ) - , . # % ')
 * plus " + * / for font names, calc() and slash colour syntax. `<` `>` `{` `}`
 * `;` `:` `\` `@` `!` are never legitimate inside a token value, so they are not
 * in the set at all. Functions are allowlisted by name, which is what keeps out
 * url(), expression(), image-set() and friends.
 *
 * Pure ESM with no imports: loaded by server routes, client components and the
 * node:test smoke suite alike.
 */

/** `--color-primary`, `--btn-hover-bg` … lowercase, digits, single hyphens. */
export const CSS_VAR_NAME_RE = /^--[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Element / page ids used in `[data-element="…"]` selectors and as pageLayout
 * keys. Mixed case is real (`voteCTA-button`), so it is allowed — but nothing
 * that could close the attribute selector or the rule.
 */
export const ELEMENT_ID_RE = /^[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*$/;

const MAX_VALUE_LENGTH = 300;
const MAX_ID_LENGTH = 64;
const MAX_CUSTOM_CSS_LENGTH = 2000;

/** Every character a token / element-var value may contain. No newline, no `<>{};:\@!`. */
const VALUE_CHARSET_RE = /^[A-Za-z0-9 #%().,'"+*/-]+$/;

/** CSS functions a value may call. Anything else (url, expression, image-set, env, attr…) is refused. */
const ALLOWED_FUNCTIONS = new Set([
  "var", "calc", "min", "max", "clamp",
  "rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color-mix",
  "linear-gradient", "radial-gradient", "conic-gradient",
  "repeating-linear-gradient", "repeating-radial-gradient", "repeating-conic-gradient",
  "translate", "translatex", "translatey", "translate3d",
  "scale", "scalex", "scaley", "rotate", "skew", "skewx", "skewy",
  "cubic-bezier", "steps",
  "blur", "drop-shadow", "brightness", "contrast", "saturate", "grayscale", "opacity",
]);

function isStr(v) {
  return typeof v === "string";
}

/** Parens balanced, quotes paired, no comment openers, only allowlisted functions. */
function structureOk(value) {
  if (value.includes("/*") || value.includes("*/")) return false;

  let depth = 0;
  for (const ch of value) {
    if (ch === "(") depth++;
    else if (ch === ")" && --depth < 0) return false;
  }
  if (depth !== 0) return false;

  if ((value.match(/'/g) || []).length % 2 !== 0) return false;
  if ((value.match(/"/g) || []).length % 2 !== 0) return false;

  const calls = value.matchAll(/([A-Za-z0-9-]*)\(/g);
  for (const [, name] of calls) {
    if (name === "") continue; // bare grouping paren inside calc()
    if (!ALLOWED_FUNCTIONS.has(name.toLowerCase())) return false;
  }
  return true;
}

/** Generic safe value — used for element vars, shadows, unknown token keys, and at render time. */
export function isSafeCssValue(value) {
  if (!isStr(value)) return false;
  const v = value.trim();
  if (v === "" || v.length > MAX_VALUE_LENGTH) return false;
  if (!VALUE_CHARSET_RE.test(v)) return false;
  return structureOk(v);
}

export function isSafeVarName(name) {
  return isStr(name) && name.length <= MAX_ID_LENGTH + 2 && CSS_VAR_NAME_RE.test(name);
}

export function isSafeElementId(id) {
  return isStr(id) && id.length <= MAX_ID_LENGTH && ELEMENT_ID_RE.test(id);
}

// ── typed token validators (API layer) ──────────────────────────────────────

const HEX_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const KEYWORD_RE = /^[A-Za-z]+$/;
const LENGTH_RE = /^(?:0|-?(?:\d+|\d*\.\d+)(?:px|rem|em|%|vh|vw|vmin|vmax|ch|ex))$/;
const COLOR_FN_RE = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|var)\(/i;
const LENGTH_FN_RE = /^(?:var|calc|min|max|clamp)\(/i;
const FONT_FN_RE = /^[A-Za-z0-9 ,'"()-]+$/;

export function isSafeColor(value) {
  if (!isSafeCssValue(value)) return false;
  const v = value.trim();
  return HEX_RE.test(v) || KEYWORD_RE.test(v) || COLOR_FN_RE.test(v);
}

export function isSafeLength(value) {
  if (!isSafeCssValue(value)) return false;
  const v = value.trim();
  return LENGTH_RE.test(v) || LENGTH_FN_RE.test(v);
}

export function isSafeFontFamily(value) {
  if (!isSafeCssValue(value)) return false;
  const v = value.trim();
  if (!FONT_FN_RE.test(v)) return false;
  // the only function a font stack uses is var(--font-*) from next/font
  for (const [, name] of v.matchAll(/([A-Za-z0-9-]*)\(/g)) {
    if (name.toLowerCase() !== "var") return false;
  }
  return true;
}

/** Pick the validator a Layer 1 token deserves from its name. */
export function tokenValidatorFor(key) {
  if (key.startsWith("--color-") || key === "--rc-note") return isSafeColor;
  if (key.startsWith("--radius-")) return isSafeLength;
  if (key.startsWith("--font-")) return isSafeFontFamily;
  return isSafeCssValue; // --shadow-* and anything unknown: generic safe value
}

// ── custom CSS (Layer 3 declarations) ───────────────────────────────────────

/**
 * Layer 3 holds raw DECLARATIONS (`transform: rotate(-2deg);`), so `:` and `;`
 * are legitimate here — but nothing that closes the rule, opens a new one, ends
 * the <style> element, escapes characters, or loads anything.
 */
export function isSafeCustomCss(css) {
  if (!isStr(css)) return false;
  if (css.length > MAX_CUSTOM_CSS_LENGTH) return false;
  if (/[<>{}\\@`]/.test(css)) return false;
  if (/(?:url|image-set|image|element|expression|env|attr)\s*\(/i.test(css)) return false;
  if (/javascript|behavior|-moz-binding/i.test(css)) return false;
  let depth = 0;
  for (const ch of css) {
    if (ch === "(") depth++;
    else if (ch === ")" && --depth < 0) return false;
  }
  if (depth !== 0) return false;
  if ((css.match(/'/g) || []).length % 2 !== 0) return false;
  if ((css.match(/"/g) || []).length % 2 !== 0) return false;
  return true;
}

// ── shape validators used by the admin APIs ─────────────────────────────────

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** `{ "--color-primary": "#8A2680", … }` → list of error strings (empty = ok). */
export function validateThemeTokens(tokens, allowedKeys = null) {
  const errors = [];
  if (tokens == null) return errors;
  if (!isPlainObject(tokens)) return ["theme tokens must be an object"];
  for (const [key, value] of Object.entries(tokens)) {
    if (!isSafeVarName(key)) {
      errors.push(`invalid token name "${String(key).slice(0, 40)}"`);
      continue;
    }
    if (allowedKeys && !allowedKeys.has(key)) {
      errors.push(`unknown theme token "${key}"`);
      continue;
    }
    if (!tokenValidatorFor(key)(value)) errors.push(`invalid value for theme token "${key}"`);
  }
  return errors;
}

/** `{ "--btn-bg": "#fff", … }` for one element. */
export function validateVarMap(varMap, where) {
  const errors = [];
  if (!isPlainObject(varMap)) return [`${where}: vars must be an object`];
  for (const [key, value] of Object.entries(varMap)) {
    if (!isSafeVarName(key)) errors.push(`${where}: invalid var name "${String(key).slice(0, 40)}"`);
    else if (!isSafeCssValue(value)) errors.push(`${where}: invalid value for "${key}"`);
  }
  return errors;
}

/** pageLayout.elementVars — `{ [pageId]: { [elementId]: { [--var]: value } } }`. */
export function validateElementVars(elementVars) {
  const errors = [];
  if (elementVars == null) return errors;
  if (!isPlainObject(elementVars)) return ["elementVars must be an object"];
  for (const [pageId, elementMap] of Object.entries(elementVars)) {
    if (!isSafeElementId(pageId)) { errors.push(`invalid page id "${String(pageId).slice(0, 40)}"`); continue; }
    if (!isPlainObject(elementMap)) { errors.push(`elementVars.${pageId} must be an object`); continue; }
    for (const [elementId, varMap] of Object.entries(elementMap)) {
      if (!isSafeElementId(elementId)) { errors.push(`invalid element id "${String(elementId).slice(0, 40)}"`); continue; }
      errors.push(...validateVarMap(varMap, `${pageId}.${elementId}`));
    }
  }
  return errors;
}

/** pageLayout.elementCss — `{ [pageId]: { [elementId]: "declarations" } }`. */
export function validateElementCss(elementCss) {
  const errors = [];
  if (elementCss == null) return errors;
  if (!isPlainObject(elementCss)) return ["elementCss must be an object"];
  for (const [pageId, elementMap] of Object.entries(elementCss)) {
    if (!isSafeElementId(pageId)) { errors.push(`invalid page id "${String(pageId).slice(0, 40)}"`); continue; }
    if (!isPlainObject(elementMap)) { errors.push(`elementCss.${pageId} must be an object`); continue; }
    for (const [elementId, css] of Object.entries(elementMap)) {
      if (!isSafeElementId(elementId)) { errors.push(`invalid element id "${String(elementId).slice(0, 40)}"`); continue; }
      if (!isSafeCustomCss(css)) errors.push(`${pageId}.${elementId}: custom CSS contains disallowed content`);
    }
  }
  return errors;
}

/**
 * Template theme/elements as stored in the Template table and rendered by
 * buildTemplateStyles(): theme.tokens (Layer 1) and elements[id].vars (Layer 2).
 * Other element fields (variant, props …) never reach CSS, but the id does.
 */
export function validateTemplateStyles({ theme, elements } = {}) {
  const errors = [];
  if (theme != null) {
    if (!isPlainObject(theme)) errors.push("theme must be an object");
    else errors.push(...validateThemeTokens(theme.tokens));
  }
  if (elements != null) {
    if (!isPlainObject(elements)) errors.push("elements must be an object");
    else {
      for (const [elementId, entry] of Object.entries(elements)) {
        if (!isSafeElementId(elementId)) { errors.push(`invalid element id "${String(elementId).slice(0, 40)}"`); continue; }
        if (entry?.vars != null) errors.push(...validateVarMap(entry.vars, `elements.${elementId}`));
      }
    }
  }
  return errors;
}
