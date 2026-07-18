"use client";

// BlossomBaseStyles — emits the active Blossom theme's --bl-* colour ramp + font
// vars + base .bl-root setup on the `.bl-root` scope (BlossomHome's root gets that
// class). BlossomHome's styled-jsx consumes var(--bl-*) exclusively, so swapping
// the ramp re-themes the whole home; the classic inner pages theme via Layer-1
// tokens built from the SAME palette (builtIn/blossom.js). Mechanics mirror
// OriginalBaseStyles/GumroadBaseStyles/Verdure exactly:
//   • active slug from useActiveTemplateId (SSR-consistent — no hydration flash)
//   • the previewed ?slug= wins on /template-preview, read via an effect (NOT
//     useSearchParams, which would de-opt the build / mismatch hydration)
//   • a .bl-theming morph class eases every surface from the old ramp to the new.

import { useState, useEffect } from "react";
import { useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import { BLOSSOM_THEMES, blossomTheme } from "../../utils/blossomPalettes";

export { BLOSSOM_THEMES, blossomTheme };

export function BlossomBaseStyles() {
  const activeSlug = useActiveTemplateId();
  const [previewSlug, setPreviewSlug] = useState(null);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s && s.startsWith("blossom")) setPreviewSlug(s);
  }, []);
  const t = blossomTheme(previewSlug || activeSlug);
  return (
    <style jsx global>{`
      .bl-root {
        --bl-canvas:${t.canvas}; --bl-card:${t.card}; --bl-ink:${t.ink}; --bl-ink2:${t.ink2};
        --bl-faint:${t.faint}; --bl-line:${t.line};
        --bl-primary:${t.primary}; --bl-primary-deep:${t.primaryDeep}; --bl-primary-soft:${t.primarySoft};
        --bl-on-primary:${t.onPrimary};
        --bl-sup1:${t.sup1}; --bl-sup1-ink:${t.sup1Ink};
        --bl-sup2:${t.sup2}; --bl-sup2-ink:${t.sup2Ink};
        --bl-sup3:${t.sup3}; --bl-sup3-ink:${t.sup3Ink};
        --bl-fd:var(--font-kanit),'Kanit',var(--font-anuphan),system-ui,sans-serif;
        --bl-fb:var(--font-anuphan),'Anuphan',var(--font-kanit),system-ui,sans-serif;
        --bl-fm:var(--font-space-mono),'Space Mono',ui-monospace,monospace;
        min-height:100vh; position:relative;
        background:var(--bl-canvas); color:var(--bl-ink); font-family:var(--bl-fb);
      }
      .bl-root * { box-sizing:border-box; }
      /* colour-theme morph — eased for ~0.5s while .bl-theming is on (set by the
         preview injector on a swatch switch) so every surface eases from the old
         palette to the new instead of snapping. Off otherwise → hover/press keep
         their own fast transitions. */
      .bl-root.bl-theming, .bl-root.bl-theming *, .bl-root.bl-theming *::before, .bl-root.bl-theming *::after {
        transition: background-color .5s ease, background .5s ease, color .5s ease, border-color .5s ease, box-shadow .5s ease, fill .5s ease, stroke .5s ease !important;
      }
    `}</style>
  );
}
