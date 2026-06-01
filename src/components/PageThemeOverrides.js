"use client";

import { useEffect, useState } from "react";
import { getPath } from "../utils/basePath";
import { buildTemplateStyles, buildElementCss } from "../lib/templateTokens";

/**
 * Slice 1b (multi-page) — emit a page's per-element override DELTA on the live site.
 *
 * `layout.js` already emits the active template's Layer 1 tokens + Layer 2
 * element-var DEFAULTS + admin `themeTokens` site-wide on `.fms-app`. The only
 * thing missing for non-home pages is each page's *override* delta:
 *   - `elementVars[page]`  → Layer 2 per-element var overrides
 *   - `elementCss[page]`   → Layer 3 per-element custom CSS
 *
 * Home delivers this via its SSR boundary (HomeContent's nested <style>). The
 * other five pages are client components, so this small client component does
 * the same job: it injects a `.fms-app`-scoped <style> with ONLY the delta.
 * Because it mounts inside the layout's `.fms-app` wrapper, its rules come AFTER
 * the layout <style> in DOM order and win at equal specificity — same cascade
 * trick HomeContent uses. Defaults still come from layout; we only override.
 *
 * Renders nothing in editorMode (the editor preview builds its own scope) or
 * when the page has no overrides.
 *
 * @param {string} page - page key in pageLayout (e.g. "vote", "results").
 * @param {Object} [pageLayout] - optional pre-fetched layout to skip the GET.
 */
export default function PageThemeOverrides({ page, pageLayout = null }) {
  const [layout, setLayout] = useState(pageLayout);

  useEffect(() => {
    if (pageLayout) {
      setLayout(pageLayout);
      return;
    }
    let cancelled = false;
    // Public GET — no auth needed (route GET is open).
    fetch(getPath("/api/admin/page-layout"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setLayout(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pageLayout]);

  if (!layout || !page) return null;

  // Layer 2 var overrides → a pseudo-template whose elements carry only `vars`,
  // so buildTemplateStyles emits just the `[data-element]{--v:val}` rules (no
  // Layer 1, since there is no theme.tokens here).
  const vars = layout?.elementVars?.[page];
  let varsCss = "";
  if (vars && typeof vars === "object") {
    const elements = {};
    for (const [id, v] of Object.entries(vars)) {
      if (v && typeof v === "object") elements[id] = { vars: v };
    }
    varsCss = buildTemplateStyles({ elements }, ".fms-app");
  }

  // Layer 3 custom CSS overrides for this page.
  const cssText = buildElementCss(layout?.elementCss?.[page], ".fms-app");

  const styleText = [varsCss, cssText].filter(Boolean).join("\n\n");
  if (!styleText) return null;

  return <style dangerouslySetInnerHTML={{ __html: styleText }} />;
}
