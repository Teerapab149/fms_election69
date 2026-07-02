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

export const GUMROAD_THEMES = {
  // Original "ละมุน" warm pop (unchanged base — matches each page's local block)
  "gumroad": {
    ink: "#26271c", ink2: "#5c5a4b", cream: "#FFF6EC", cream2: "#FFE9D6", paper: "#FFFDFA",
    pink: "#FF9CE9", lime: "#C2F47E", yellow: "#FFD24D", sky: "#B6E6FF", coral: "#FF8A8A",
  },
  // ไซเบอร์พังก์ — light gray + pitch-black frames + neon cyan / electric violet
  "gumroad-cyber": {
    ink: "#000000", ink2: "#3A4658", cream: "#F0F4F8", cream2: "#E2EAF2", paper: "#FFFFFF",
    pink: "#00F0FF", lime: "#A370F7", yellow: "#7DF9FF", sky: "#00F0FF", coral: "#FF5470",
  },
  // เรโทร อาร์เคด (Y2K) — pastel-yellow paper + charcoal frames + tangerine / teal
  "gumroad-retro": {
    ink: "#1A1A1A", ink2: "#6B5D3F", cream: "#FFFDF0", cream2: "#FFF3C4", paper: "#FFFFFF",
    pink: "#FF9233", lime: "#14D4B4", yellow: "#FFD24D", sky: "#14D4B4", coral: "#FF6B6B",
  },
  // แอซิด อินดัสเทรียล — stark off-white + pitch black + acid-lime volt / hot coral
  "gumroad-acid": {
    ink: "#000000", ink2: "#4A4A4A", cream: "#F6F6F6", cream2: "#EAEAEA", paper: "#FFFFFF",
    pink: "#CCFF00", lime: "#FF4A4A", yellow: "#CCFF00", sky: "#FF4A4A", coral: "#FF4A4A",
  },
};

export function gumroadTheme(slug) {
  return GUMROAD_THEMES[slug] || GUMROAD_THEMES.gumroad;
}

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
      }
      /* colour-theme morph — only while .gum-theming is on (added for ~0.5s on a
         theme switch), so every surface eases from the old palette to the new. */
      .gum-root.gum-theming, .gum-root.gum-theming *, .gum-root.gum-theming *::before, .gum-root.gum-theming *::after {
        transition: background-color .5s ease, background .5s ease, color .5s ease, border-color .5s ease, box-shadow .5s ease, fill .5s ease, stroke .5s ease !important;
      }
    `}</style>
  );
}
