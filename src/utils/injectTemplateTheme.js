// Shared in-place colour-theme morph for the preview surfaces (chooser slides +
// the full-screen TemplatePreviewWrapper). Pushes a template's palette straight
// onto the preview iframe's themeable root (same-origin) + flags a morph class so
// every surface EASES from the old palette to the new — no reload, no jump back
// to the home slide.
//
// One source so the chooser and the full-screen preview tint identically.
// Currently verdure-aware (its vars live on `.vd-root`); this is the seam Task B
// generalises — add a family branch per template as its themes land.

import { verdureTheme, hexToRgbTriple } from "../components/home/VerdureChrome";
import { gumroadTheme } from "./gumroadPalettes";

export function injectTemplateTheme(doc, themeSlug) {
  if (!doc || !themeSlug) return;
  if (themeSlug.startsWith("verdure")) injectVerdure(doc, themeSlug);
  else if (themeSlug.startsWith("gumroad")) injectGumroad(doc, themeSlug);
}

function injectGumroad(doc, themeSlug) {
  const roots = doc.querySelectorAll(".gum-root");
  if (!roots.length) return;
  const t = gumroadTheme(themeSlug);
  const vars = {
    "--ink": t.ink, "--ink2": t.ink2, "--cream": t.cream, "--cream2": t.cream2, "--paper": t.paper,
    "--pink": t.pink, "--lime": t.lime, "--yellow": t.yellow, "--sky": t.sky, "--coral": t.coral,
    "--gw1": t.gw1, "--gw2": t.gw2, "--gw3": t.gw3,
  };
  roots.forEach((r) => {
    r.classList.add("gum-theming");
    for (const k in vars) r.style.setProperty(k, vars[k]);
    setTimeout(() => r.classList.remove("gum-theming"), 600);
  });
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
    "--cta": v.cta || v.terra, "--cta-2": v.cta2 || v.terra2, "--cta-text": v.ctaText || v.cream,
    // RGB triples — keep the alpha washes/shadows/translucent text in sync (the
    // pages read rgba(var(--moss-rgb), a) etc. so they re-tint with the theme).
    "--moss-rgb": hexToRgbTriple(v.moss), "--moss-2-rgb": hexToRgbTriple(v.moss2),
    "--terra-rgb": hexToRgbTriple(v.terra),
    "--terra-soft-rgb": hexToRgbTriple(v.soft), "--gold-rgb": hexToRgbTriple(v.gold),
    "--cream-rgb": hexToRgbTriple(v.cream), "--cream-2-rgb": hexToRgbTriple(v.cream2),
  };
  roots.forEach((r) => {
    r.classList.add("vd-theming");
    for (const k in vars) r.style.setProperty(k, vars[k]);
    setTimeout(() => r.classList.remove("vd-theming"), 700);
  });
}
