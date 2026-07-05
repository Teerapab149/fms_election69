"use client";

// StudioDarkBaseStyles — emits the active Studio Dark theme's ramp as CSS vars.
// The layouts already declare hardcoded --sd-* blocks (StudioDarkShell/Home on
// `.sd-root`, StudioDarkRail on `.sd-rail, .sd-topbar`, StudioDarkLogin on
// `.sdl-root`); this component overrides them ALL from one palette without
// deleting those blocks (they stay as the lime fallback), via:
//   1. `:root` — so html/body (dark overscroll, declared outside .fms-app) and
//      anything portal'd to <body> inherit the themed ramp.
//   2. `.fms-app`-prefixed copies of every declaring selector — higher
//      specificity than the local blocks, so the themed values win on the
//      nodes that re-declare. Mirrors GumroadBaseStyles' specificity trick.
// Mirrors OriginalBaseStyles (reads useActiveTemplateId + ?slug= for the
// /template-preview morph surface — NOT useSearchParams, hydration rule).

import { useState, useEffect } from "react";
import { useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import { STUDIO_THEMES, studioDarkTheme } from "../../utils/studioDarkPalettes";

export { STUDIO_THEMES, studioDarkTheme };

export function StudioDarkBaseStyles() {
  const activeSlug = useActiveTemplateId();
  const [previewSlug, setPreviewSlug] = useState(null);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s && s.startsWith("studio-dark")) setPreviewSlug(s);
  }, []);
  const t = studioDarkTheme(previewSlug || activeSlug);
  return (
    <style jsx global>{`
      :root,
      .fms-app.sd-root, .fms-app .sd-rail, .fms-app .sd-topbar, .fms-app .sdl-root {
        --sd-bg:${t.bg}; --sd-bg-2:${t.bg2}; --sd-bg-3:${t.bg3}; --sd-bg-rail:${t.bgRail};
        --sd-line:${t.line}; --sd-line-strong:${t.lineStrong};
        --sd-ink:${t.ink}; --sd-ink-2:${t.ink2}; --sd-ink-3:${t.ink3}; --sd-ink-4:${t.ink4};
        --sd-accent:${t.accent}; --sd-accent-2:${t.accent2};
      }
      /* colour-theme morph — eased for ~0.5s on a theme switch (injector adds .sd-theming) */
      .sd-theming, .sd-theming *, .sd-theming *::before, .sd-theming *::after {
        transition: background-color .5s ease, background .5s ease, color .5s ease, border-color .5s ease, box-shadow .5s ease, fill .5s ease, stroke .5s ease !important;
      }
    `}</style>
  );
}
