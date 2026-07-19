"use client";

// StoryClamp — the shared "อ่านต่อ" collapse used by the LOGO MEANING (ความหมาย
// สัญลักษณ์) story on every party / single-vote page.
//
// Why: the story is free text an admin types; a long one pushed the sections
// below it (missions, policies, team) far down the page — owner: "ถ้ามันยาวแบบ
// ปกติเลย เวลาเข้าไปในเพจมันจะรกไปหน่อย ต้องเลื่อนเยอะกว่าจะถึง section ล่างๆ".
// So the story collapses to a few lines behind a soft fade ("แถบเลือน") and the
// reader opens it only if interested.
//
// Behaviour:
//   • measures the real content height — the toggle appears ONLY when the text
//     actually overflows, so short stories render exactly as before (no button,
//     no fade, no DOM noise)
//   • re-measures on resize + when the text changes
//   • collapsed height + fade colour come from CSS vars the family sets:
//       --sc-max   collapsed max-height (default 8.5em)
//       --sc-fade  the surface colour the fade lands on (default transparent →
//                  a family that forgets it still degrades to a plain clip)
//   • base-visible: the full text is in the DOM always (SSR/no-JS shows it all,
//     never hidden behind opacity) — collapsing is a progressive enhancement
//   • the toggle is a real <button> (keyboard + aria-expanded)
//
// Styling: the component ships only structure + the fade; each family styles
// `.sc__btn` in its own stylesheet (colours must stay in the family's palette).

import React, { useCallback, useEffect, useRef, useState } from "react";

export default function StoryClamp({
  children,
  className = "",
  moreLabel = "อ่านเพิ่มเติม",
  lessLabel = "ย่อข้อความ",
}) {
  const bodyRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  const measure = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    // compare against the collapsed cap regardless of current state
    const cap = parseFloat(getComputedStyle(el).getPropertyValue("max-height"));
    if (!Number.isFinite(cap)) return;
    // Only offer the toggle when a MEANINGFUL amount is hidden — roughly two
    // lines. Otherwise a reader taps "อ่านเพิ่มเติม" to gain a few pixels, which
    // is worse than just showing the text.
    const line = parseFloat(getComputedStyle(el).lineHeight) || 24;
    setOverflows(el.scrollHeight > cap + line * 1.6);
  }, []);

  useEffect(() => {
    if (expanded) return; // only measure while collapsed (max-height is the cap)
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    if (bodyRef.current) ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, [measure, expanded, children]);

  return (
    <div className={`sc${expanded ? " is-open" : ""}${overflows ? " has-more" : ""} ${className}`.trim()}>
      <div className="sc__body" ref={bodyRef}>{children}</div>

      {overflows && (
        <button
          type="button"
          className="sc__btn"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? lessLabel : moreLabel}
          <span className="sc__caret" aria-hidden="true">{expanded ? "↑" : "↓"}</span>
        </button>
      )}

      <style jsx global>{`
        .sc { position:relative; }
        /* collapsed: clip to the family's cap and let the fade sit on top.
           The cap is a max-height (not display:none) so the text stays in the DOM
           and is fully readable with JS off. */
        .sc .sc__body { position:relative; overflow:hidden; max-height:var(--sc-max, 8.5em);
          transition:max-height .32s cubic-bezier(.22,1,.36,1); }
        .sc.is-open .sc__body { max-height:var(--sc-open, 240em); }
        /* the fade strip — only while collapsed AND only when there is more to read */
        .sc.has-more:not(.is-open) .sc__body::after { content:""; position:absolute; left:0; right:0; bottom:0;
          height:3.2em; pointer-events:none;
          background:linear-gradient(180deg, transparent, var(--sc-fade, transparent) 82%); }
        .sc .sc__body > :last-child { margin-bottom:0; }

        .sc__btn { margin-top:10px; display:inline-flex; align-items:center; gap:7px; min-height:44px;
          padding:8px 2px; background:none; border:none; cursor:pointer; font-family:inherit;
          font-size:13.5px; font-weight:600; color:inherit; }
        .sc__caret { display:inline-block; font-size:12px; transition:transform .25s ease; }

        @media (prefers-reduced-motion:reduce) {
          .sc .sc__body { transition:none; }
          .sc__caret { transition:none; }
        }
      `}</style>
    </div>
  );
}
