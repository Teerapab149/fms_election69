"use client";

// StudioDarkShell — shared page chrome for ALL Studio Dark v2 inner pages
// (candidates / party / vote / success / results). Renders the persistent
// left rail (shared <StudioDarkRail>) + the sticky scene-bar + the base CSS
// every studio-dark page consumes (tokens, pill buttons, scene header).
//
// ONE source of truth on purpose: gumroad's inner pages each hand-copied
// their topbar + token block (8 near-identical headers — flagged as
// fragmentation in the handoff). Studio-dark pages instead compose:
//
//   <StudioDarkShell active="vote" num="03" label="Vote" labelTh="ลงคะแนน"
//                    right={<span>SECURED BY PSU PASSPORT</span>}>
//     ...page content (uses .sd-* base classes + its own scoped styles)
//   </StudioDarkShell>
//
// Identity (hairlines, lime accent, Inter / Instrument Serif / JetBrains Mono)
// hardcoded here per Rule 9 — these are studio-dark's tokens, not the default
// variant's. Faithful to docs/design-refs/studio-v2.css (.scene-bar/.btn/.scene-h).

import { getPath } from "../../utils/basePath";
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import StudioDarkRail from "../home/StudioDarkRail";

export default function StudioDarkShell({
  active = "home",        // rail nav key: home|candidates|party|vote|results
  num = "01",             // scene-bar crumb number
  label = "Home",        // scene-bar crumb (EN)
  labelTh = "",           // scene-bar crumb (TH)
  backHref = null,        // optional: replaces the num crumb with a ← link
  backLabel = "",
  right = null,           // scene-bar right side (ReactNode)
  editorMode = false,
  systemMode = "AUTO",
  children,
}) {
  // Back-to-top: appears once the page is scrolled past ~1 viewport. Lives in
  // the shell so every studio inner page gets it. Skipped in editorMode (the
  // small preview iframe scrolls too, and the FAB would overlap the canvas).
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    if (editorMode) return;
    const onScroll = () => setShowTop((window.scrollY || document.documentElement.scrollTop || 0) > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [editorMode]);

  return (
    <div className="fms-app sd-root">
      <StudioDarkRail active={active} editorMode={editorMode} systemMode={systemMode} />

      <main className="sd-main">
        <div className="sd-scenebar">
          <div className="sd-scenebar__crumbs">
            {backHref ? (
              <a href={editorMode ? undefined : getPath(backHref)} className="sd-scenebar__back">← {backLabel}</a>
            ) : (
              <span className="num">{num}</span>
            )}
            <span className="sep">/</span>
            <span className="here">{label}</span>
            {labelTh && (<><span className="sep">·</span><span className="sd-thai">{labelTh}</span></>)}
          </div>
          <div className="sd-scenebar__right">{right}</div>
        </div>

        {children}
      </main>

      {!editorMode && showTop && (
        <button
          type="button"
          className="sd-totop"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="กลับขึ้นบนสุด"
          title="กลับขึ้นบนสุด · Back to top"
        >
          <ArrowUp size={18} strokeWidth={2.2} />
        </button>
      )}

      <style jsx global>{`
        /* (dark html/body + color-scheme now live in StudioDarkRail, which every
           studio page — incl. home — mounts, so the white-canvas fix is uniform.) */
        .sd-root {
          --sd-bg:#14140F; --sd-bg-2:#1B1B14; --sd-bg-3:#232319;
          --sd-line:#2E2E22; --sd-line-strong:#3E3E2D;
          --sd-ink:#F2EDDF; --sd-ink-2:#B5B0A2; --sd-ink-3:#7F7A6E; --sd-ink-4:#555142;
          --sd-accent:#D5FF3F;
          --sd-sans:var(--font-studio-sans),'Inter',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --sd-serif:var(--font-instrument-serif),'Instrument Serif','Times New Roman',serif;
          --sd-mono:var(--font-studio-mono),'JetBrains Mono',ui-monospace,monospace;
          min-height:100vh; background:var(--sd-bg); color:var(--sd-ink);
          font-family:var(--sd-sans);
        }
        .sd-root * { box-sizing:border-box; }
        .sd-root a { text-decoration:none; color:inherit; }
        .sd-root em { font-family:var(--sd-serif); font-style:italic; color:var(--sd-accent); font-weight:400; }
        .sd-root ::selection { background:var(--sd-accent); color:var(--sd-bg); }

        .sd-main {
          margin-left:240px; min-height:100vh; display:flex; flex-direction:column; min-width:0;
          /* quiet depth: faint dot-grid + a lime breath at the top edge —
             keeps "text on black" from reading flat without shouting */
          background:
            radial-gradient(ellipse 60% 30% at 70% 0%, rgba(213,255,63,.04), transparent 65%),
            radial-gradient(circle, rgba(242,237,223,.045) 1px, transparent 1px) 0 0 / 30px 30px,
            var(--sd-bg);
        }

        /* back-to-top FAB (shell-level → every studio page) */
        .sd-totop {
          position:fixed; right:28px; bottom:28px; z-index:60;
          width:46px; height:46px; border-radius:999px; display:grid; place-items:center;
          background:var(--sd-accent); color:var(--sd-bg); border:1px solid var(--sd-accent);
          cursor:pointer; box-shadow:0 10px 30px rgba(0,0,0,.5);
          transition:transform .2s, background .2s, color .2s;
          animation:sdTotopIn .25s ease-out;
        }
        .sd-totop:hover { background:var(--sd-ink); color:var(--sd-bg); border-color:var(--sd-ink); transform:translateY(-2px); }
        @keyframes sdTotopIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width:1100px) { .sd-totop { right:18px; bottom:18px; width:42px; height:42px; } }

        /* scene bar */
        .sd-scenebar {
          display:grid; grid-template-columns:1fr auto; align-items:center;
          padding:20px 48px; border-bottom:1px solid var(--sd-line);
          background:rgba(20,20,15,.92); backdrop-filter:blur(12px);
          position:sticky; top:0; z-index:30;
        }
        .sd-scenebar__crumbs { display:flex; align-items:center; gap:14px; font-family:var(--sd-mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--sd-ink-2); min-width:0; }
        .sd-scenebar__crumbs .num { color:var(--sd-accent); }
        .sd-scenebar__crumbs .sep { color:var(--sd-line-strong); }
        .sd-scenebar__crumbs .here { color:var(--sd-ink); }
        .sd-scenebar__back { color:var(--sd-ink-2); transition:color .2s; white-space:nowrap; }
        .sd-scenebar__back:hover { color:var(--sd-ink); }
        .sd-scenebar__right { display:flex; align-items:center; gap:18px; font-family:var(--sd-mono); font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--sd-ink-2); }
        .sd-scenebar__right .live { color:var(--sd-accent); display:flex; align-items:center; gap:8px; }
        .sd-dot { width:6px; height:6px; border-radius:999px; background:var(--sd-accent); box-shadow:0 0 0 0 rgba(213,255,63,.6); animation:sdDotPulse 1.8s ease-out infinite; display:inline-block; }
        @keyframes sdDotPulse { 0%{box-shadow:0 0 0 0 rgba(213,255,63,.6)} 70%{box-shadow:0 0 0 8px rgba(213,255,63,0)} 100%{box-shadow:0 0 0 0 rgba(213,255,63,0)} }

        /* scene header (title row used by candidates / vote) */
        .sd-scene-h {
          padding:48px 48px 32px; border-bottom:1px solid var(--sd-line);
          display:grid; grid-template-columns:1fr 1fr; align-items:end; gap:48px;
        }
        .sd-scene-h__num { font-family:var(--sd-mono); font-size:13px; letter-spacing:.16em; text-transform:uppercase; color:var(--sd-ink-2); margin-bottom:18px; display:block; }
        .sd-scene-h__num .accent { color:var(--sd-accent); }
        .sd-scene-h__title { font-family:var(--sd-sans); font-weight:400; font-size:clamp(40px,5vw,76px); line-height:.95; letter-spacing:-.035em; margin:0; }
        .sd-scene-h__deck { font-size:15px; color:var(--sd-ink-2); line-height:1.6; font-weight:300; margin:0; max-width:540px; justify-self:end; }

        /* buttons (pill)
           NOTE — every colour rule below doubles its own class
           (.sd-btn.sd-btn / .sd-btn.sd-btn--accent, specificity 0,2,0) ON
           PURPOSE. The family resets anchors with ".sd-root a{color:inherit}"
           (0,1,1), which OUT-RANKED a plain ".sd-btn--accent{color:...}"
           (0,1,0). Buttons rendered as <button> were fine, but the two
           rendered as <a> (StudioDarkParty's "ลงคะแนนให้พรรคนี้" CTA and
           StudioDarkClosed's "กลับหน้าหลัก") inherited --sd-ink instead —
           cream on the lime accent, measured 1.01:1, i.e. an unreadable
           primary CTA. Doubling the class beats the anchor reset regardless of
           styled-jsx mount order. Keep it doubled. */
        .sd-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:12px;
          padding:14px 22px; border:1px solid var(--sd-line-strong); border-radius:999px;
          background:transparent;
          font-family:var(--sd-sans); font-size:14px; font-weight:500; cursor:pointer;
          touch-action:manipulation; -webkit-tap-highlight-color:transparent;
          transition:background .15s ease, color .15s ease, border-color .15s ease, opacity .2s, transform .1s ease;
        }
        .sd-btn.sd-btn { color:var(--sd-ink); }
        /* :hover is gated on a real pointer. On a touch screen the hover state
           latches after the tap and the button stays inverted until something
           else is touched — it looks stuck, and it also masks whether the press
           registered. The :active state is the touch feedback instead, and it
           has to be doubled-class like the rest of this block to clear the
           .sd-root anchor reset (see the note above). */
        @media (hover:hover) {
          .sd-btn.sd-btn:hover { background:var(--sd-ink); color:var(--sd-bg); border-color:var(--sd-ink); }
          .sd-btn.sd-btn--accent:hover { background:var(--sd-ink); border-color:var(--sd-ink); color:var(--sd-bg); }
        }
        .sd-btn.sd-btn:active { background:var(--sd-ink); color:var(--sd-bg); border-color:var(--sd-ink); transform:scale(.975); }
        .sd-btn.sd-btn--accent { background:var(--sd-accent); color:var(--sd-bg); border-color:var(--sd-accent); font-weight:600; }
        .sd-btn.sd-btn--accent:active { background:var(--sd-ink); border-color:var(--sd-ink); color:var(--sd-bg); transform:scale(.975); }
        .sd-btn--lg { padding:17px 28px; font-size:15px; }
        .sd-btn--block { width:100%; }
        .sd-btn[disabled], .sd-btn.is-disabled { opacity:.3; cursor:not-allowed; pointer-events:none; }
        .sd-textlink {
          display:inline-flex; align-items:center; gap:8px;
          font-family:var(--sd-sans); font-size:14px; font-weight:500;
          border-bottom:1px solid transparent; padding-bottom:2px; cursor:pointer;
          transition:color .2s, border-color .2s; background:none; border-top:0; border-left:0; border-right:0;
        }
        .sd-textlink.sd-textlink { color:var(--sd-ink-2); }
        .sd-textlink.sd-textlink:hover { color:var(--sd-ink); border-bottom-color:var(--sd-line-strong); }
        .sd-textlink .arr { color:var(--sd-accent); }

        .sd-smallcaps { font-family:var(--sd-mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-3); }

        /* Thai run reset inside tracked/uppercase mono kickers: JetBrains Mono has
           no Thai glyphs, so Thai in a --sd-mono/letter-spaced context falls back to
           a system font with mis-set marks + unnatural tracking, and mixed EN·TH
           labels wrap ugly on phones. --font-anuphan is already the family's loaded
           Thai body font (site-wide fallback target of --sd-sans); this span pins
           Thai back to it with gentle spacing, and nowrap so a phrase never breaks
           mid-word (breaks are forced onto the "·" separators). Thai has no case,
           so any inherited text-transform:uppercase is a no-op. .sd-nw is the
           English-run nowrap partner so multi-word EN phrases stay whole too.
           (sd-T1, mirrors verdure's .vd-thai / .vd-nw — edd12f4.) */
        .sd-thai { font-family:var(--font-anuphan),'Anuphan',system-ui,sans-serif; letter-spacing:.04em; white-space:nowrap; }
        .sd-nw { white-space:nowrap; }

        /* media placeholder (hatched, like the prototype's faint lime hatching) */
        .sd-media-ph {
          display:grid; place-items:center; background:var(--sd-bg); border:1px solid var(--sd-line); border-radius:18px;
          position:relative; overflow:hidden;
        }
        .sd-media-ph::before { content:""; position:absolute; inset:0; background-image:repeating-linear-gradient(135deg, transparent 0 28px, rgba(213,255,63,.03) 28px 29px); }
        .sd-media-ph span {
          position:relative; font-family:var(--sd-mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase;
          color:var(--sd-ink-3); padding:6px 14px; border:1px solid var(--sd-line); border-radius:999px; background:var(--sd-bg-2);
        }

        /* ── responsive ── */
        @media (max-width:1100px) {
          .sd-main { margin-left:0; }
          /* un-pin below 1100px: this is exactly where the rail collapses into
             .sd-topbar (StudioDarkRail.js:311), which is ALSO sticky top:0 and
             sits at z-index 40 against this bar's 30. Both pinned at top:0 meant
             the topbar (h=111) swallowed this bar (h=51) whole the moment the
             page moved — measured overlap 51/51px on all 8 shell pages at
             1024/768/412, with every one of its 5-6 children failing
             elementFromPoint (the hit came back as .sd-rail__logo-img /
             .sd-signin, i.e. topbar content). Static lets it scroll away in the
             open instead of hiding. Same fix as 8ac9929 did for the home page. */
          /* also drops the backdrop-filter: once static this bar no longer needs
             to blur anything moving behind it, and on a phone that per-frame GPU
             pass is pure cost. Solid fill, same colour the .92 alpha resolved to. */
          .sd-scenebar { padding:16px 24px; position:static; background:#14140F; backdrop-filter:none; }
          .sd-scene-h { grid-template-columns:1fr; gap:24px; padding:32px 24px 28px; }
          .sd-scene-h__deck { justify-self:start; }
        }
        @media (max-width:560px) {
          .sd-scenebar__right { display:none; }
        }
      `}</style>
    </div>
  );
}
