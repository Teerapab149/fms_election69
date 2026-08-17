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

// ── faculty ship mark (v2-R5f / T3) — the FMS symbol is a เรือสำเภา (trade junk).
// A single ink line-art stamp of that ship replaces the generic ✶/nested-ring mark
// wherever the family stamped a centre glyph (ghost stamp on the home hero card;
// the blind-emboss desk seal centre). SINGLE SOURCE of the outline: RC_SHIP_PATHS.
// The component (currentColor stroke) draws it inline inside an existing SVG scope
// (the ghost); the same paths are encoded once into RC_SHIP_MASK so the pure-CSS
// desk seal can paint a ship in --rc-ink via a mask (no extra markup on every page).
// Elegant, not cartoonish; NO diamond/lozenge (owner banned those family-wide).
export const RC_SHIP_PATHS = [
  // hull — a crescent with raised prow & stern (a trade-ship hull)
  "M14,63 C20,60 26,60 32,60 L68,60 C74,60 80,60 86,63 C74,75 64,78 50,78 C36,78 26,75 14,63 Z",
  // mast
  "M50,60 L50,17",
  // mainsail — a battened sail bulging to the lee
  "M50,22 C66,27 71,41 61,51 L50,51",
  // a batten line across the mainsail
  "M50,36 C58,36 63,38 66,41",
  // foresail — the smaller headsail
  "M50,29 C39,33 39,45 47,51 L50,51",
  // masthead pennant
  "M50,17 L60,20 L50,23",
  // two wave lines under the hull
  "M16,85 q7,-5 14,0 t14,0 t14,0 t14,0",
  "M22,91 q7,-5 14,0 t14,0 t14,0",
];

export function ReceiptShipMark({ className, strokeWidth = 2, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 100" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      {RC_SHIP_PATHS.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

// the SAME outline, encoded as a CSS mask so the desk seal's centre paints a faint
// ship in --rc-ink (alpha-only mask → the seal's own opacity keeps it "จาง").
const RC_SHIP_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='#000' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'>${RC_SHIP_PATHS.map((d) => `<path d='${d}'/>`).join("")}</svg>`;
export const RC_SHIP_MASK = `url("data:image/svg+xml,${encodeURIComponent(RC_SHIP_SVG)}") center/contain no-repeat`;

export function ReceiptBaseStyles() {
  const bp = process.env.NEXT_PUBLIC_BASE_PATH || "";
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
         logos). Ring + ring + centre dot in --rc-ink at ~5% + a 1px receipt highlight
         so each reads as pressed IN — a notary/rubber-stamp target (no rotated square:
         the owner banned diamond/lozenge shapes family-wide, v2-R5e). */
      .rc-desk .rc-desk-seals { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
      .rc-desk .rc-seal { position:absolute; display:block; border-radius:50%;
        border:2px solid var(--rc-ink); opacity:.05;
        filter:drop-shadow(1px 1px 0 color-mix(in srgb, var(--rc-receipt) 70%, transparent)); }
      .rc-desk .rc-seal i { position:absolute; inset:14%; border-radius:50%; border:1.5px solid var(--rc-ink); }
      /* v2-R5f: the seal centre is now the faculty เรือสำเภา (masked in --rc-ink),
         ringed by the two rings above — "วงแหวน + เรือจาง". The seal's .05 opacity
         keeps the ship a faint blind-emboss. */
      .rc-desk .rc-seal b { position:absolute; left:50%; top:50%; width:52%; height:52%;
        transform:translate(-50%,-50%); background:var(--rc-ink);
        -webkit-mask:${RC_SHIP_MASK}; mask:${RC_SHIP_MASK}; }
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

      /* ===== GRAIN (v2-R1 T1 / addendum A7.2, ruling C1) — a static, build-time
         alpha-only PNG tile (128x128, ~3KB, net darkening ~0.016 over paper). One
         file for every theme + device: the receipt paper tint shows through, the
         grain only adds thermal-print tooth. Zero runtime rasterize (no feTurbulence
         at paint). .rc-grain = receipt stock + grain — used on the tape sheet and
         any main paper surface in T3-T5. Colour still flows from the ramp. ===== */
      .rc-grain { background-color:var(--rc-receipt);
        background-image:url("${bp}/images/receipt/grain-128.png");
        background-repeat:repeat; background-size:128px 128px; }
    `}</style>
  );
}
