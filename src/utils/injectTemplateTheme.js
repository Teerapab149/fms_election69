// Shared in-place colour-theme morph for the preview surfaces (chooser slides +
// the full-screen TemplatePreviewWrapper). Pushes a template's palette straight
// onto the preview iframe's themeable root (same-origin) + flags a morph class so
// every surface EASES from the old palette to the new — no reload, no jump back
// to the home slide.
//
// One source so the chooser and the full-screen preview tint identically.
// Currently verdure-aware (its vars live on `.vd-root`); this is the seam Task B
// generalises — add a family branch per template as its themes land.

import { verdureTheme } from "../components/home/VerdureChrome";

export function injectTemplateTheme(doc, themeSlug) {
  if (!doc || !themeSlug) return;
  if (themeSlug.startsWith("verdure")) injectVerdure(doc, themeSlug);
}

function injectVerdure(doc, themeSlug) {
  const roots = doc.querySelectorAll(".vd-root");
  if (!roots.length) return;
  const v = verdureTheme(themeSlug);
  const vars = {
    "--cream": v.cream, "--cream-2": v.cream2, "--cream-3": v.cream3,
    "--moss": v.moss, "--moss-2": v.moss2, "--moss-3": v.moss3,
    "--terra": v.terra, "--terra-2": v.terra2, "--terra-soft": v.soft,
    "--rule": v.rule, "--gold": v.gold,
  };
  roots.forEach((r) => {
    r.classList.add("vd-theming");
    for (const k in vars) r.style.setProperty(k, vars[k]);
    setTimeout(() => r.classList.remove("vd-theming"), 700);
  });
}
