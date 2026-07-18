"use client";

// Gumroad colour themes — the neo-brutalist "Active Pulse" layout in different
// palettes. Each Gumroad* page declares the SAME base palette locally in its own
// styled-jsx (--ink/--cream/--pink/--lime/…); rather than editing all of them,
// <GumroadBaseStyles/> re-emits the ACTIVE theme's palette on `.fms-app.gum-root`
// — a HIGHER specificity than each page's `.g*-root` block (0,2,0 > 0,1,0), so the
// theme wins while the local block stays as a harmless fallback. The chooser's
// in-place morph then pushes the palette as INLINE vars (see injectTemplateTheme).
//
// Slots (from the design): cream = page background, ink = chunky borders + text,
// pink = accent tile #1, lime = accent tile #2, plus secondary pops (yellow/sky/
// coral). paper = white card surface.

import { useState, useEffect } from "react";
import { useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import { GUMROAD_THEMES, gumroadTheme } from "../../utils/gumroadPalettes";

// Palette map + lookup live in utils/gumroadPalettes.js (plain module) so the
// server-side template definition (builtIn/gumroad.js → Layer-1 tokens + element
// configs) reads the SAME source. Re-exported here for existing importers.
export { GUMROAD_THEMES, gumroadTheme };

export function GumroadBaseStyles() {
  // Live = active template (SSR-consistent). On /template-preview the previewed
  // gumroad-* slug wins — read from window in an effect (NOT useSearchParams, which
  // would de-opt the build / mismatch hydration); initial render matches SSR.
  const activeSlug = useActiveTemplateId();
  const [previewSlug, setPreviewSlug] = useState(null);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s && s.startsWith("gumroad")) setPreviewSlug(s);
  }, []);
  const t = gumroadTheme(previewSlug || activeSlug);
  return (
    <style jsx global>{`
      .fms-app.gum-root {
        --ink:${t.ink}; --ink2:${t.ink2}; --cream:${t.cream}; --cream2:${t.cream2}; --paper:${t.paper};
        --pink:${t.pink}; --lime:${t.lime}; --yellow:${t.yellow}; --sky:${t.sky}; --coral:${t.coral};
        --gw1:${t.gw1}; --gw2:${t.gw2}; --gw3:${t.gw3};
      }
      /* colour-theme morph — only while .gum-theming is on (added for ~0.5s on a
         theme switch), so every surface eases from the old palette to the new. */
      .gum-root.gum-theming, .gum-root.gum-theming *, .gum-root.gum-theming *::before, .gum-root.gum-theming *::after {
        transition: background-color .5s ease, background .5s ease, color .5s ease, border-color .5s ease, box-shadow .5s ease, fill .5s ease, stroke .5s ease !important;
      }
    `}</style>
  );
}
