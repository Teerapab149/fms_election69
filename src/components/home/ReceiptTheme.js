"use client";

// ReceiptBaseStyles — emits the active Receipt theme's --rc-* colour ramp + holo
// ramp + font vars + base .rc-root setup on the `.rc-root` scope (every Receipt
// page's root gets that class). Receipt pages consume var(--rc-*) exclusively, so
// swapping the ramp re-themes the whole surface; the classic inner pages theme via
// Layer-1 tokens built from the SAME palette (builtIn/receipt.js). Mechanics mirror
// BlossomBaseStyles exactly:
//   • active slug from useActiveTemplateId (SSR-consistent — no hydration flash)
//   • the previewed ?slug= wins on /template-preview, read via an effect (NOT
//     useSearchParams, which would de-opt the build / mismatch hydration)
//   • a .rc-theming morph class eases every surface from the old ramp to the new.
//
// Fonts (Part A): Chakra Petch (--font-chakra) is the receipt voice, IBM Plex Sans
// Thai (--font-plex-thai) the structural headings, Space Mono (--font-space-mono)
// the Latin/digits/refs — all LOADED in layout.js. --rc-fh/-fr/-fm consume them.

import { useState, useEffect } from "react";
import { useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import { RECEIPT_THEMES, receiptTheme } from "../../utils/receiptPalettes";

export { RECEIPT_THEMES, receiptTheme };

export function ReceiptBaseStyles() {
  const activeSlug = useActiveTemplateId();
  const [previewSlug, setPreviewSlug] = useState(null);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s && s.startsWith("receipt")) setPreviewSlug(s);
  }, []);
  const t = receiptTheme(previewSlug || activeSlug);
  return (
    <style jsx global>{`
      .rc-root {
        --rc-desk:${t.desk}; --rc-desk-shade:${t.deskShade};
        --rc-receipt:${t.receipt}; --rc-receipt-edge:${t.receiptEdge};
        --rc-ink:${t.ink}; --rc-ink2:${t.ink2}; --rc-faint:${t.faint};
        --rc-line:${t.line}; --rc-stamp-line:${t.stampLine};
        --rc-holo-1:${t.holo1}; --rc-holo-2:${t.holo2}; --rc-holo-3:${t.holo3};
        --rc-holo-4:${t.holo4}; --rc-holo-5:${t.holo5};
        --rc-holo-angle:${t.holoAngle}; --rc-holo-shift:${t.holoShift};
        --rc-accent:${t.accent}; --rc-accent-deep:${t.accentDeep}; --rc-on-accent:${t.onAccent};
        --rc-fh:var(--font-plex-thai),'IBM Plex Sans Thai',system-ui,sans-serif;
        --rc-fr:var(--font-chakra),'Chakra Petch',var(--font-plex-thai),system-ui,sans-serif;
        --rc-fm:var(--font-space-mono),'Space Mono',ui-monospace,monospace;
        min-height:100vh; position:relative;
        background:var(--rc-desk); color:var(--rc-ink); font-family:var(--rc-fr);
      }
      .rc-root * { box-sizing:border-box; }
      /* colour-theme morph — eased for ~0.5s while .rc-theming is on (set by the
         preview injector on a swatch switch) so every surface eases from the old
         palette to the new instead of snapping. Off otherwise → hover/press keep
         their own fast transitions. */
      .rc-root.rc-theming, .rc-root.rc-theming *, .rc-root.rc-theming *::before, .rc-root.rc-theming *::after {
        transition: background-color .5s ease, background .5s ease, color .5s ease, border-color .5s ease, box-shadow .5s ease, fill .5s ease, stroke .5s ease !important;
      }
    `}</style>
  );
}
