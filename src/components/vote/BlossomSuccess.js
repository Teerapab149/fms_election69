"use client";

import VoteSuccessExperience from "./VoteSuccessExperience";
import { BlossomTopBar } from "../home/BlossomHome";
import { BlossomBaseStyles } from "../home/BlossomTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

export default function BlossomSuccess(props) {
  const gc = useGlobalConfig() || {};
  return (
    <div className="fms-app bl-root bl-succ-root">
      <BlossomBaseStyles />
      <BlossomTopBar editorMode={props.editorMode} active="" />
      <main><VoteSuccessExperience family="blossom" {...props} /></main>
      <footer className="border-t border-[var(--bl-line)] px-5 py-6 text-center text-xs text-[var(--bl-ink2)]">© {gc.facultyShortEn || "FMS"}@{gc.university || "PSU"} {gc.copyrightYear ?? ""}</footer>
      <style jsx global>{`
        .bl-succ-root { overflow-x:clip; }
        /* ---- topbar (editorial hairline skin) ---- */
        .bl-succ-root .bl-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--bl-canvas) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-succ-root .bl-topbar__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .bl-succ-root .bl-logo { display:inline-flex; align-items:center; flex-shrink:0; border-radius:8px; }
        .bl-succ-root .bl-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .bl-succ-root .bl-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .bl-succ-root .bl-nav__link { font-family:var(--bl-fm); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--bl-ink2); position:relative; padding-bottom:2px; border-radius:4px; transition:color .2s ease; }
        .bl-succ-root .bl-nav__link.on, .bl-succ-root .bl-nav__link:hover { color:var(--bl-ink); }
        .bl-succ-root .bl-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:3px;
          background:var(--bl-primary); border-radius:2px; transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .bl-succ-root .bl-nav__link:hover::after { transform:scaleX(1); }
        .bl-succ-root .bl-nav__link.on::after { transform:scaleX(1); }

        .bl-succ-root .bl-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .bl-succ-root .bl-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--bl-fd); font-weight:600;
          font-size:13px; color:var(--bl-canvas); background:var(--bl-ink); border:none; cursor:pointer;
          padding:9px 20px; border-radius:999px; transition:background .2s ease, transform .15s ease; }
        .bl-succ-root .bl-loginbtn:hover { background:var(--bl-primary-deep); transform:translateY(-1px); }
        .bl-succ-root .bl-loginbtn:active { transform:scale(.96); }
        .bl-succ-root .bl-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--bl-line) 70%, var(--bl-card)); }
        .bl-succ-root .bl-skelbar { display:block; width:58px; height:12px; border-radius:6px;
          background:color-mix(in srgb, var(--bl-ink2) 30%, var(--bl-card)); animation:blPulse 1.3s ease-in-out infinite; }
        @keyframes blPulse { 0%,100%{opacity:.45} 50%{opacity:1} }

        .bl-succ-root .bl-userchip { position:relative; }
        .bl-succ-root .bl-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:999px; padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, background .2s ease; }
        .bl-succ-root .bl-userchip__btn:hover { background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-card)); }
        .bl-succ-root .bl-userchip__btn:active { transform:scale(.97); }
        .bl-succ-root .bl-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:linear-gradient(135deg, var(--bl-primary), var(--bl-primary-deep)); color:var(--bl-on-primary, var(--bl-card));
          font-family:var(--bl-fd); font-weight:700; font-size:14px; line-height:1; }
        .bl-succ-root .bl-userchip__name { font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-succ-root .bl-userchip__caret { color:var(--bl-ink2); font-size:11px; }
        .bl-succ-root .bl-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:16px; overflow:hidden; z-index:50;
          box-shadow:0 18px 40px -18px color-mix(in srgb, var(--bl-ink) 12%, transparent); }
        .bl-succ-root .bl-usermenu__head { padding:14px 16px; border-bottom:1px solid var(--bl-line); }
        .bl-succ-root .bl-usermenu__name { font-family:var(--bl-fd); font-weight:700; font-size:14px; color:var(--bl-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-succ-root .bl-usermenu__id { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.04em; color:var(--bl-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-succ-root .bl-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-primary-ink); }
        .bl-succ-root .bl-usermenu__out:hover { background:color-mix(in srgb, var(--bl-primary) 10%, var(--bl-card)); }

        .bl-succ-root .bl-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:12px; background:var(--bl-card); border:1.5px solid var(--bl-ink); cursor:pointer;
          transition:transform .15s ease, background .2s ease; }
        .bl-succ-root .bl-burger:hover { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }
        .bl-succ-root .bl-burger:active { transform:scale(.95); }
        .bl-succ-root .bl-burger span { display:block; height:2.5px; border-radius:2px; background:var(--bl-ink); }

        .bl-succ-root .bl-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .bl-succ-root .bl-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .bl-succ-root .bl-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:12px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--bl-ink);
          background:var(--bl-card); border:1px solid var(--bl-line); transition:border-color .2s ease, background .2s ease; }
        .bl-succ-root .bl-sheet__link:hover { border-color:var(--bl-primary); }
        .bl-succ-root .bl-sheet__link:active { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }

        /* focus-visible (keyboard) — 2px primary-deep outline on every interactive element */
        .bl-succ-root a:focus-visible, .bl-succ-root button:focus-visible {
          outline:2px solid var(--bl-primary-deep); outline-offset:2px; }


        @media(min-width:768px) {
          .bl-succ-root .bl-topbar__in { gap:22px; }
          .bl-succ-root .bl-nav { display:flex; }
          .bl-succ-root .bl-userwrap { margin-left:0; }
          .bl-succ-root .bl-burger,.bl-succ-root .bl-sheet { display:none; }
        }
        @media(prefers-reduced-motion:reduce) {
          .bl-succ-root *, .bl-succ-root *::before, .bl-succ-root *::after { animation:none!important; transition:none!important; }
        }
      `}</style>
    </div>
  );
}
