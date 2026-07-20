"use client";

// StoryClamp — the shared SCROLL BOX used by the LOGO MEANING (ความหมายสัญลักษณ์)
// story on every party / single-vote page.
//
// Why: the story is free text an admin types; a long one pushed the sections
// below it (missions, policies, team) far down the page — owner: "ถ้ามันยาวแบบ
// ปกติเลย เวลาเข้าไปในเพจมันจะรกไปหน่อย ต้องเลื่อนเยอะกว่าจะถึง section ล่างๆ".
// So the story lives in a fixed-height box the reader scrolls INSIDE if they are
// interested — the page itself stays short. (Owner ruling: a scroll box, not a
// read-more toggle. Same idiom StudioDark/Verdure single-vote already use.)
//
// Behaviour:
//   • fixed cap (--sc-max) + overflow-y:auto — the page length no longer depends
//     on how much the admin typed
//   • a soft fade ("แถบเลือน") sits on the bottom edge while there is more to
//     read and clears when the reader reaches the end
//   • the fade + hint appear ONLY when the text actually overflows, so a short
//     story renders exactly as before
//   • base-visible: the full text is always in the DOM (SSR / no-JS shows it all)
//   • keyboard-reachable: the box is focusable (tabIndex 0) so arrow keys scroll
//     it — a plain overflow div is not reachable by keyboard otherwise
//
// Styling: the component ships structure + the fade; each family sets its own
// vars/colours (--sc-max, --sc-fade) and may restyle `.sc__hint`.

import React, { useCallback, useEffect, useRef, useState } from "react";

export default function StoryClamp({
  children,
  className = "",
  hint = <span className="sc__hint-th">เลื่อนอ่านต่อในกรอบ</span>,
}) {
  const bodyRef = useRef(null);
  const [overflows, setOverflows] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    const more = el.scrollHeight > el.clientHeight + 4;
    setOverflows(more);
    setAtEnd(more ? el.scrollTop + el.clientHeight >= el.scrollHeight - 6 : true);
  }, []);

  useEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    if (bodyRef.current) ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, [measure, children]);

  return (
    <div className={`sc${overflows ? " has-more" : ""}${atEnd ? " is-end" : ""} ${className}`.trim()}>
      <div
        className="sc__body"
        ref={bodyRef}
        onScroll={measure}
        tabIndex={overflows ? 0 : undefined}
        role={overflows ? "region" : undefined}
        aria-label={overflows ? "ความหมายสัญลักษณ์ — เลื่อนเพื่ออ่านต่อ" : undefined}
      >
        {children}
      </div>

      {overflows && (
        <span className="sc__hint" aria-hidden="true">{hint} <span className="sc__caret">↓</span></span>
      )}

      <style jsx global>{`
        .sc { position:relative; }
        /* the box: a fixed cap the reader scrolls inside — the PAGE stays short
           no matter how long the admin's story is */
        .sc .sc__body { max-height:var(--sc-max, 11em); overflow-y:auto; overscroll-behavior:contain;
          padding-right:14px; scrollbar-width:thin;
          scrollbar-color:color-mix(in srgb, currentColor 26%, transparent) transparent; }
        .sc .sc__body::-webkit-scrollbar { width:6px; }
        .sc .sc__body::-webkit-scrollbar-track { background:transparent; }
        .sc .sc__body::-webkit-scrollbar-thumb { border-radius:99px;
          background:color-mix(in srgb, currentColor 24%, transparent); }
        .sc .sc__body > :last-child { margin-bottom:0; }

        /* the fade strip on the bottom edge — clears once the end is reached */
        .sc::after { content:""; position:absolute; left:0; right:14px; bottom:0; height:3em;
          pointer-events:none; opacity:0; transition:opacity .25s ease;
          background:linear-gradient(180deg, transparent, var(--sc-fade, transparent) 86%); }
        .sc.has-more:not(.is-end)::after { opacity:1; }

        .sc__hint { display:inline-flex; align-items:center; gap:6px; margin-top:9px;
          font-size:11px; letter-spacing:.1em; opacity:.6; transition:opacity .25s ease; }
        /* Thai hint text — several consumer pages set their own (often Thai-less
           mono) font-family on the ambient .sc__hint element via a page-scoped
           rule like ".xx-sc .sc__hint{font-family:var(--xx-mono)}". Pin the Thai
           run to a real Thai-capable stack directly on ITSELF (not .sc__hint) so
           the explicit declaration always wins over whatever font-family the host
           page inherits down — no specificity fight, no per-consumer edit needed. */
        .sc__hint-th { font-family:var(--font-anuphan),'Anuphan','Kanit','IBM Plex Sans Thai',system-ui,sans-serif; letter-spacing:.04em; }
        .sc.is-end .sc__hint { opacity:0; }
        .sc__caret { display:inline-block; animation:scNudge 1.8s ease-in-out infinite; }
        @keyframes scNudge { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(3px); } }

        .sc .sc__body:focus-visible { outline:2px solid currentColor; outline-offset:4px; border-radius:2px; }

        @media (prefers-reduced-motion:reduce) {
          .sc::after, .sc__hint { transition:none; }
          .sc__caret { animation:none; }
        }
      `}</style>
    </div>
  );
}
