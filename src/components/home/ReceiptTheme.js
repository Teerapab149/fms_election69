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
        --rc-note:${t.note};
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

      /* ===== SHARED "desk" language — opt-in via .rc-desk on a page root. Home
         (R2.5) is the reference; vote / success / results / closed adopt the SAME
         classes so the laid-paper texture, desk vignette, blind-emboss seals and
         holographic foil are defined ONCE here instead of copied per page. Every
         value is byte-identical to the ReceiptHome originals (T1 gate). ===== */

      /* LAID-PAPER texture — fine horizontal laid lines (~1px every 4px, ~2.6% ink)
         crossed by sparse vertical chain lines (~1.5px every 104px, ~1.8% ink). Felt,
         not seen. Above the desk, under content. */
      .rc-desk::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
        background-image:
          repeating-linear-gradient(180deg, color-mix(in srgb, var(--rc-ink) 2.6%, transparent) 0 1px, transparent 1px 4px),
          repeating-linear-gradient(90deg, color-mix(in srgb, var(--rc-ink) 1.8%, transparent) 0 1.5px, transparent 1.5px 104px); }
      /* soft desk vignette — depth not darkness (no negative z — P-LOG-084). Light
         from top-left → the darkening sits low-right (T6). */
      .rc-desk::before { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
        background:radial-gradient(135% 130% at 34% 12%, transparent 44%, var(--rc-desk-shade) 100%); opacity:.7; }

      /* blind-emboss seals pressed into the desk (2-3 curated spots, NOT tiled, no
         logos). Ring + ring + diamond in --rc-ink at ~5% + a 1px receipt highlight
         so each reads as pressed IN. */
      .rc-desk .rc-desk-seals { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
      .rc-desk .rc-seal { position:absolute; display:block; border-radius:50%;
        border:2px solid var(--rc-ink); opacity:.05;
        filter:drop-shadow(1px 1px 0 color-mix(in srgb, var(--rc-receipt) 70%, transparent)); }
      .rc-desk .rc-seal i { position:absolute; inset:14%; border-radius:50%; border:1.5px solid var(--rc-ink); }
      .rc-desk .rc-seal b { position:absolute; left:50%; top:50%; width:18%; height:18%;
        border:1.5px solid var(--rc-ink); transform:translate(-50%,-50%) rotate(45deg); }
      .rc-desk .rc-seal--a { width:230px; height:230px; top:96px; right:-46px; transform:rotate(-8deg); }
      .rc-desk .rc-seal--b { width:264px; height:264px; bottom:150px; left:-58px; transform:rotate(6deg); }
      .rc-desk .rc-seal--c { width:184px; height:184px; top:52%; right:5%; transform:rotate(-3deg); opacity:.045; }

      /* holographic foil — the color-shifting signature. Linear drift (strips / CTA
         rims) + conic spin (round seals). background-position rides --rc-px/--rc-py
         (pointer-driven where a page sets them; default centred). */
      .rc-desk .rc-foil { background-image:linear-gradient(var(--rc-holo-angle),
          var(--rc-holo-1), var(--rc-holo-2), var(--rc-holo-3), var(--rc-holo-4), var(--rc-holo-5), var(--rc-holo-1));
        background-size:300% 300%; background-position:calc(var(--rc-px, .5) * 100%) calc(var(--rc-py, .5) * 100%);
        filter:hue-rotate(var(--rc-holo-shift)) saturate(1.15); animation:rcFoilDrift 9s linear infinite; }
      .rc-desk .rc-foil--conic { background-image:conic-gradient(from 0deg,
          var(--rc-holo-1), var(--rc-holo-2), var(--rc-holo-3), var(--rc-holo-4), var(--rc-holo-5), var(--rc-holo-1));
        background-size:auto; animation:rcFoilSpin 14s linear infinite; }
      @keyframes rcFoilDrift { 0%{ background-position:0% 50%; } 50%{ background-position:100% 50%; } 100%{ background-position:0% 50%; } }
      @keyframes rcFoilSpin { to { transform:rotate(360deg); } }
    `}</style>
  );
}
