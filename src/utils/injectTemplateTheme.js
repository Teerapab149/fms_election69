// Shared in-place colour-theme morph for the preview surfaces (chooser slides +
// the full-screen TemplatePreviewWrapper). Pushes a template's palette straight
// onto the preview iframe's themeable root (same-origin) + flags a morph class so
// every surface EASES from the old palette to the new — no reload, no jump back
// to the home slide.
//
// One source so the chooser and the full-screen preview tint identically.
// Currently verdure-aware (its vars live on `.vd-root`); this is the seam Task B
// generalises — add a family branch per template as its themes land.

import { verdureTheme, hexToRgbTriple } from "./verdurePalettes";
import { gumroadTheme } from "./gumroadPalettes";
import { originalTheme } from "./originalPalettes";

export function injectTemplateTheme(doc, themeSlug) {
  if (!doc || !themeSlug) return;
  if (themeSlug.startsWith("verdure")) injectVerdure(doc, themeSlug);
  else if (themeSlug.startsWith("gumroad")) injectGumroad(doc, themeSlug);
  else if (themeSlug.startsWith("original")) injectOriginal(doc, themeSlug);
}

function injectOriginal(doc, themeSlug) {
  const t = originalTheme(themeSlug);
  // 1) Home surface — OriginalHome reads the --o-* ramp on .orig-root.
  const roots = doc.querySelectorAll(".orig-root");
  const oVars = {
    "--o-deep": t.deep, "--o-brand": t.brand, "--o-bright": t.bright, "--o-glow": t.glow,
    "--o-mid": t.mid, "--o-soft": t.soft, "--o-soft2": t.soft2, "--o-line": t.line,
    "--o-ink": t.ink, "--o-bg": t.bg,
  };
  roots.forEach((r) => {
    r.classList.add("orig-theming");
    for (const k in oVars) r.style.setProperty(k, oVars[k]);
    setTimeout(() => r.classList.remove("orig-theming"), 600);
  });
  // 2) Inner pages — the classic layout has NO .orig-root; it reads Layer-1
  // --color-* tokens SSR'd on .fms-app from the APPLIED template, so a previewed
  // slug must override them inline here (inline beats the SSR <style>). Without
  // this branch every non-home slide silently ignored the swatch (the original-
  // family preview≠live bug). Mapping MUST equal buildOriginalTemplate in
  // builtIn/original.js — parity rule.
  const apps = doc.querySelectorAll(".fms-app");
  if (!apps.length) return;
  // .orig-theming's ease rule lives in OriginalBaseStyles (rendered on home
  // only) — carry an .fms-app-scoped copy into the iframe so inner pages morph
  // smoothly instead of snapping.
  if (!doc.getElementById("orig-morph-style")) {
    const st = doc.createElement("style");
    st.id = "orig-morph-style";
    st.textContent =
      ".fms-app.orig-theming, .fms-app.orig-theming *, .fms-app.orig-theming *::before, .fms-app.orig-theming *::after { transition: background-color .5s ease, background .5s ease, color .5s ease, border-color .5s ease, box-shadow .5s ease, fill .5s ease, stroke .5s ease !important; }";
    doc.head.appendChild(st);
  }
  const tokens = {
    "--color-primary": t.brand,
    "--color-accent": t.bright,
    "--color-bg": t.bg,
    "--color-surface": "#FFFFFF",
    "--color-text": t.ink,
    "--color-text-muted": "#64748B",
    "--color-border": t.line,
  };
  apps.forEach((r) => {
    r.classList.add("orig-theming");
    for (const k in tokens) r.style.setProperty(k, tokens[k]);
    setTimeout(() => r.classList.remove("orig-theming"), 600);
  });
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
