/**
 * Layer 1 token emission — unified pipeline (ADR-001 D11).
 *
 * Converts a token map into the inner CSS text of a <style> tag.
 * Used by both the live home page (SSR) and the admin editor preview so the
 * two channels render identically.
 *
 * @param {Object} tokens - { "--color-primary": "#...", ... }
 * @param {string} scope  - CSS selector (default ":root"). Home page uses
 *                          ".fms-app" so the editor preview can scope its own
 *                          tokens independently without polluting :root.
 * @returns {string} CSS text to put inside a <style> block. Empty string when
 *                   tokens is missing or has no -- prefixed keys.
 */
export function buildTokenStyles(tokens, scope = ":root") {
  if (!tokens || typeof tokens !== "object") return "";
  const decls = Object.entries(tokens)
    .filter(([k]) => typeof k === "string" && k.startsWith("--"))
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  if (!decls) return "";
  return `${scope} {\n${decls}\n}`;
}
