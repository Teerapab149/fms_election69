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
//   <StudioDarkShell active="vote" num="04" label="Ballot" labelTh="ลงคะแนน"
//                    right={<span>SECURED BY PSU PASSPORT</span>}>
//     ...page content (uses .sd-* base classes + its own scoped styles)
//   </StudioDarkShell>
//
// Identity (hairlines, lime accent, Inter / Instrument Serif / JetBrains Mono)
// hardcoded here per Rule 9 — these are studio-dark's tokens, not the default
// variant's. Faithful to docs/design-refs/studio-v2.css (.scene-bar/.btn/.scene-h).

import { getPath } from "../../utils/basePath";
import StudioDarkRail from "../home/StudioDarkRail";

export default function StudioDarkShell({
  active = "home",        // rail nav key: home|candidates|party|vote|results
  num = "01",             // scene-bar crumb number
  label = "Index",        // scene-bar crumb (EN)
  labelTh = "",           // scene-bar crumb (TH)
  backHref = null,        // optional: replaces the num crumb with a ← link
  backLabel = "",
  right = null,           // scene-bar right side (ReactNode)
  editorMode = false,
  systemMode = "AUTO",
  children,
}) {
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
            {labelTh && (<><span className="sep">·</span><span>{labelTh}</span></>)}
          </div>
          <div className="sd-scenebar__right">{right}</div>
        </div>

        {children}
      </main>

      <style jsx global>{`
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

        .sd-main { margin-left:240px; min-height:100vh; display:flex; flex-direction:column; min-width:0; }

        /* scene bar */
        .sd-scenebar {
          display:grid; grid-template-columns:1fr auto; align-items:center;
          padding:20px 48px; border-bottom:1px solid var(--sd-line);
          background:rgba(20,20,15,.6); backdrop-filter:blur(10px);
          position:sticky; top:0; z-index:30;
        }
        .sd-scenebar__crumbs { display:flex; align-items:center; gap:14px; font-family:var(--sd-mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-3); min-width:0; }
        .sd-scenebar__crumbs .num { color:var(--sd-accent); }
        .sd-scenebar__crumbs .sep { color:var(--sd-line-strong); }
        .sd-scenebar__crumbs .here { color:var(--sd-ink); }
        .sd-scenebar__back { color:var(--sd-ink-2); transition:color .2s; white-space:nowrap; }
        .sd-scenebar__back:hover { color:var(--sd-ink); }
        .sd-scenebar__right { display:flex; align-items:center; gap:18px; font-family:var(--sd-mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--sd-ink-3); }
        .sd-scenebar__right .live { color:var(--sd-accent); display:flex; align-items:center; gap:8px; }
        .sd-dot { width:6px; height:6px; border-radius:999px; background:var(--sd-accent); box-shadow:0 0 0 0 rgba(213,255,63,.6); animation:sdDotPulse 1.8s ease-out infinite; display:inline-block; }
        @keyframes sdDotPulse { 0%{box-shadow:0 0 0 0 rgba(213,255,63,.6)} 70%{box-shadow:0 0 0 8px rgba(213,255,63,0)} 100%{box-shadow:0 0 0 0 rgba(213,255,63,0)} }

        /* scene header (title row used by candidates / vote) */
        .sd-scene-h {
          padding:48px 48px 32px; border-bottom:1px solid var(--sd-line);
          display:grid; grid-template-columns:1fr 1fr; align-items:end; gap:48px;
        }
        .sd-scene-h__num { font-family:var(--sd-mono); font-size:12px; letter-spacing:.22em; text-transform:uppercase; color:var(--sd-ink-3); margin-bottom:18px; display:block; }
        .sd-scene-h__num .accent { color:var(--sd-accent); }
        .sd-scene-h__title { font-family:var(--sd-sans); font-weight:400; font-size:clamp(40px,5vw,76px); line-height:.95; letter-spacing:-.035em; margin:0; }
        .sd-scene-h__deck { font-size:15px; color:var(--sd-ink-2); line-height:1.6; font-weight:300; margin:0; max-width:540px; justify-self:end; }

        /* buttons (pill) */
        .sd-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:12px;
          padding:14px 22px; border:1px solid var(--sd-line-strong); border-radius:999px;
          background:transparent; color:var(--sd-ink);
          font-family:var(--sd-sans); font-size:14px; font-weight:500; cursor:pointer;
          transition:background .2s, color .2s, border-color .2s, opacity .2s;
        }
        .sd-btn:hover { background:var(--sd-ink); color:var(--sd-bg); border-color:var(--sd-ink); }
        .sd-btn--accent { background:var(--sd-accent); color:var(--sd-bg); border-color:var(--sd-accent); font-weight:600; }
        .sd-btn--accent:hover { background:var(--sd-ink); border-color:var(--sd-ink); color:var(--sd-bg); }
        .sd-btn--lg { padding:17px 28px; font-size:15px; }
        .sd-btn--block { width:100%; }
        .sd-btn[disabled], .sd-btn.is-disabled { opacity:.3; cursor:not-allowed; pointer-events:none; }
        .sd-textlink {
          display:inline-flex; align-items:center; gap:8px; color:var(--sd-ink-2);
          font-family:var(--sd-sans); font-size:14px; font-weight:500;
          border-bottom:1px solid transparent; padding-bottom:2px; cursor:pointer;
          transition:color .2s, border-color .2s; background:none; border-top:0; border-left:0; border-right:0;
        }
        .sd-textlink:hover { color:var(--sd-ink); border-bottom-color:var(--sd-line-strong); }
        .sd-textlink .arr { color:var(--sd-accent); }

        .sd-smallcaps { font-family:var(--sd-mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-3); }

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
          .sd-scenebar { padding:16px 24px; }
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
