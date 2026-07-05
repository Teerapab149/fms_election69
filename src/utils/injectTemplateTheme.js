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
import { studioDarkTheme } from "./studioDarkPalettes";

export function injectTemplateTheme(doc, themeSlug) {
  if (!doc || !themeSlug) return;
  if (themeSlug.startsWith("verdure")) injectVerdure(doc, themeSlug);
  else if (themeSlug.startsWith("gumroad")) injectGumroad(doc, themeSlug);
  else if (themeSlug.startsWith("original")) injectOriginal(doc, themeSlug);
  else if (themeSlug.startsWith("studio-dark")) injectStudio(doc, themeSlug);
}

function injectStudio(doc, themeSlug) {
  const t = studioDarkTheme(themeSlug);
  const vars = {
    "--sd-bg": t.bg, "--sd-bg-2": t.bg2, "--sd-bg-3": t.bg3, "--sd-bg-rail": t.bgRail,
    "--sd-line": t.line, "--sd-line-strong": t.lineStrong,
    "--sd-ink": t.ink, "--sd-ink-2": t.ink2, "--sd-ink-3": t.ink3, "--sd-ink-4": t.ink4,
    "--sd-accent": t.accent, "--sd-accent-2": t.accent2,
  };
  // 1) The --sd-* ramp — inline on every declaring root (beats the hardcoded
  // blocks) + on <html> so the dark html/body overscroll canvas re-tints
  // (StudioDarkBaseStyles emits the same set on :root — parity rule).
  const roots = doc.querySelectorAll(".sd-root, .sd-rail, .sd-topbar, .sdl-root");
  for (const k in vars) doc.documentElement.style.setProperty(k, vars[k]);
  roots.forEach((r) => {
    r.classList.add("sd-theming");
    for (const k in vars) r.style.setProperty(k, vars[k]);
    setTimeout(() => r.classList.remove("sd-theming"), 600);
  });
  // 2) Layer-1 --color-* tokens on .fms-app — the studio HOME composes catalog
  // elements (voteCTA minimal-pill, stats) that read --color-primary etc., and
  // in a preview iframe those are SSR'd from the APPLIED template. Mapping MUST
  // equal buildStudioTemplate in builtIn/studio-dark.js — parity rule. (The
  // .sd-theming ease rule ships in StudioDarkBaseStyles, mounted by the rail /
  // login on every studio slide, so the morph is smooth here too.)
  const tokens = {
    "--color-primary": t.accent,
    "--color-accent": t.accent2,
    "--color-bg": t.bg,
    "--color-surface": t.bg2,
    "--color-text": t.ink,
    "--color-text-muted": t.ink2,
    "--color-border": t.line,
  };
  doc.querySelectorAll(".fms-app").forEach((r) => {
    r.classList.add("sd-theming");
    for (const k in tokens) r.style.setProperty(k, tokens[k]);
    setTimeout(() => r.classList.remove("sd-theming"), 600);
  });
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
  const t = gumroadTheme(themeSlug);
  // 1) The family ramp — .gum-root vars (absent on classic-rendered slides → no-op).
  const roots = doc.querySelectorAll(".gum-root");
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
  // 2) Layer-1 --color-* tokens on .fms-app — catalog elements (voteCTA, stats ฯลฯ)
  // read --color-primary etc., and in a preview iframe those are SSR'd from the
  // APPLIED template. Mapping MUST equal buildGumroadTemplate in builtIn/gumroad.js
  // (pink→primary, lime→accent, cream→bg, paper→surface, ink→text/border,
  // ink2→muted) — parity rule.
  const apps = doc.querySelectorAll(".fms-app");
  if (!apps.length) return;
  // The .gum-theming ease rule (GumroadTheme.js) is scoped to .gum-root.gum-theming —
  // carry an .fms-app-scoped copy into the iframe so non-gum-root nodes morph
  // smoothly instead of snapping (mirrors injectOriginal's orig-morph-style).
  if (!doc.getElementById("gum-morph-style")) {
    const st = doc.createElement("style");
    st.id = "gum-morph-style";
    st.textContent =
      ".fms-app.gum-theming, .fms-app.gum-theming *, .fms-app.gum-theming *::before, .fms-app.gum-theming *::after { transition: background-color .5s ease, background .5s ease, color .5s ease, border-color .5s ease, box-shadow .5s ease, fill .5s ease, stroke .5s ease !important; }";
    doc.head.appendChild(st);
  }
  const tokens = {
    "--color-primary": t.pink,
    "--color-accent": t.lime,
    "--color-bg": t.cream,
    "--color-surface": t.paper,
    "--color-text": t.ink,
    "--color-text-muted": t.ink2,
    "--color-border": t.ink,
  };
  apps.forEach((r) => {
    r.classList.add("gum-theming");
    for (const k in tokens) r.style.setProperty(k, tokens[k]);
    setTimeout(() => r.classList.remove("gum-theming"), 600);
  });
}

function injectVerdure(doc, themeSlug) {
  const v = verdureTheme(themeSlug);
  // 1) The family ramp — .vd-root vars (absent on classic-rendered slides → no-op).
  const roots = doc.querySelectorAll(".vd-root");
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
  // 2) Layer-1 --color-* tokens on .fms-app — same reason as injectGumroad/injectStudio.
  // Mapping MUST equal buildVerdureTemplate in builtIn/verdure.js (terra→primary,
  // terra2→accent, cream→bg, cream2→surface, moss→text, moss3→muted, rule→border)
  // — parity rule.
  const apps = doc.querySelectorAll(".fms-app");
  if (!apps.length) return;
  // The .vd-theming ease rule (VerdureChrome.js) is scoped to .vd-root.vd-theming —
  // carry an .fms-app-scoped copy into the iframe so non-vd-root nodes morph
  // smoothly instead of snapping (mirrors injectOriginal's orig-morph-style).
  if (!doc.getElementById("vd-morph-style")) {
    const st = doc.createElement("style");
    st.id = "vd-morph-style";
    st.textContent =
      ".fms-app.vd-theming, .fms-app.vd-theming *, .fms-app.vd-theming *::before, .fms-app.vd-theming *::after { transition: background-color .5s ease, background .5s ease, color .5s ease, border-color .5s ease, box-shadow .5s ease, fill .5s ease, stroke .5s ease !important; }";
    doc.head.appendChild(st);
  }
  const tokens = {
    "--color-primary": v.terra,
    "--color-accent": v.terra2,
    "--color-bg": v.cream,
    "--color-surface": v.cream2,
    "--color-text": v.moss,
    "--color-text-muted": v.moss3,
    "--color-border": v.rule,
  };
  apps.forEach((r) => {
    r.classList.add("vd-theming");
    for (const k in tokens) r.style.setProperty(k, tokens[k]);
    setTimeout(() => r.classList.remove("vd-theming"), 700);
  });
}
