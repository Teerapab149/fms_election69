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

/**
 * Build complete CSS <style> content for a template (Day 7a).
 *
 * Emits both Layer 1 and Layer 2 of the 3-layer architecture (ADR-001 D10):
 *   1. `{scope}` block — Layer 1 theme tokens (--color-*, --radius-*, ...)
 *   2. `{scope} [data-element="X"]` blocks — Layer 2 element-scope vars
 *      (--banner-bg, ...). Each element entry's optional `vars` object becomes
 *      one CSS rule, declaring ALL its Layer 2 vars at the element root so
 *      nested elements can't accidentally inherit a parent's vars (D10 chain).
 *
 * @param {Object} template - resolved template (e.g. classicTemplate)
 * @param {string} scope    - CSS selector for the root (default ".fms-app")
 * @returns {string} CSS text; empty when template is missing.
 */
export function buildTemplateStyles(template, scope = ".fms-app") {
  if (!template) return "";
  const blocks = [];

  // Layer 1: theme tokens at root scope
  const tokens = template?.theme?.tokens;
  if (tokens) {
    const css = buildTokenStyles(tokens, scope);
    if (css) blocks.push(css);
  }

  // Layer 2: element-scope vars (one rule per element that defines `vars`)
  const elements = template?.elements || {};
  for (const [elementId, entry] of Object.entries(elements)) {
    if (entry?.vars && typeof entry.vars === "object") {
      const css = buildTokenStyles(entry.vars, `${scope} [data-element="${elementId}"]`);
      if (css) blocks.push(css);
    }
  }

  return blocks.join("\n\n");
}
