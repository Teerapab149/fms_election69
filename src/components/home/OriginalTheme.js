"use client";

// OriginalBaseStyles — emits the active Original theme's brand ramp as CSS vars on
// `.orig-root` (the OriginalHome root gets this class). The home's Tailwind/hex
// brand colours are tokenised to var(--o-*, #fallback) so swapping the ramp
// re-themes the whole home; the classic inner pages theme via Layer-1 tokens built
// from the SAME palette (builtIn/original.js). Mirrors GumroadBaseStyles/Verdure.

import { useState, useEffect } from "react";
import { useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import { ORIGINAL_THEMES, originalTheme } from "../../utils/originalPalettes";

export { ORIGINAL_THEMES, originalTheme };

export function OriginalBaseStyles() {
  const activeSlug = useActiveTemplateId();
  const [previewSlug, setPreviewSlug] = useState(null);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s && s.startsWith("original")) setPreviewSlug(s);
  }, []);
  const t = originalTheme(previewSlug || activeSlug);
  return (
    <style jsx global>{`
      .orig-root {
        --o-deep:${t.deep}; --o-brand:${t.brand}; --o-bright:${t.bright}; --o-glow:${t.glow};
        --o-mid:${t.mid}; --o-soft:${t.soft}; --o-soft2:${t.soft2}; --o-line:${t.line};
        --o-ink:${t.ink}; --o-bg:${t.bg}; --o-wash:${t.wash ?? 0};
      }
      /* colour-theme morph — eased for ~0.5s on a theme switch */
      .orig-root.orig-theming, .orig-root.orig-theming *, .orig-root.orig-theming *::before, .orig-root.orig-theming *::after {
        transition: background-color .5s ease, background .5s ease, color .5s ease, border-color .5s ease, box-shadow .5s ease, fill .5s ease, stroke .5s ease !important;
      }
    `}</style>
  );
}
