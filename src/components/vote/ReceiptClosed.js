"use client";

// ReceiptClosed — CLOSED / locked-state page for the "Receipt · Paper Materiality"
// template family (Template #6), in the print/desk language of ReceiptHome (R2.5)
// and the ballot pages (R3). Shown when voting is not open: waiting (before start),
// ended, or paused.
//
// The whole message is ONE reason-aware SLIP taped to the polling desk — a printed
// notice pinned by two strips of holo tape, a reason eyebrow with a geometric ink
// diamond, the reason title + description, and a single action. Deliberately QUIET
// vs the celebratory printer-moment success: a taped notice, not a party. The single
// affordance (home link / logout) is the ONLY link — mirroring BlossomClosed, the
// closed page NEVER links to results (the shared topbar nav carries the results link
// for every page; the closed body adds none).
//
// Pure presentation — closed/page.js owns status fetching + the (PSU SSO) logout and
// passes the reason-aware title/desc/variant. Colours flow ONLY through var(--rc-*),
// emitted by ReceiptBaseStyles on .rc-root — a theme swap re-tints the whole page in
// place. The shared desk language (laid paper / vignette / emboss seals / holo foil)
// comes from .rc-desk; topbar + footer mirror ReceiptHome.

import { getPath } from "../../utils/basePath";
import { ReceiptTopBar } from "../home/ReceiptHome";
import { ReceiptBaseStyles } from "../home/ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

// reason eyebrow (bilingual). Copy stays reason-aware while the accent stays token-
// only (var(--rc-*)) — the family has one accent identity, so all variants share it.
const EYEBROW = {
  waiting: "ใกล้เปิดหน่วยเลือกตั้ง · UPCOMING",
  ended: "ปิดหีบเลือกตั้งแล้ว · CLOSED",
  closed: "พักปรับปรุงระบบ · MAINTENANCE",
};

export default function ReceiptClosed({
  title, desc, variant = "closed", session = null, onLogout = () => {}, editorMode = false,
}) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const faculty = gc.facultyShortEn || "FMS";
  const copyrightYear = gc.copyrightYear ?? "";
  const eyebrow = EYEBROW[variant] || EYEBROW.closed;

  return (
    <div className="fms-app rc-root rc-closed-root rc-desk">
      <ReceiptBaseStyles />

      <ReceiptTopBar editorMode={editorMode} active="" />

      {/* blind-emboss seals pressed into the desk paper (shared .rc-desk-seals) */}
      <div className="rc-desk-seals" aria-hidden="true">
        <span className="rc-seal rc-seal--a"><i /><b /></span>
        <span className="rc-seal rc-seal--b"><i /><b /></span>
      </div>

      <div className="rc-closed-wrap">
        {/* ===== issue / eyebrow line ===== */}
        <div className="rc-issue">
          <span>สถานะระบบ · SYSTEM STATUS</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== the taped notice slip — the whole message as one printed slip ===== */}
        <section className="rc-closed-stage">
          <div className="rc-closed-slip">
            {/* two strips of holo tape pinning the slip to the desk (decoration) */}
            <span className="rc-closed-tape rc-closed-tape--l" aria-hidden="true"><span className="rc-foil" /></span>
            <span className="rc-closed-tape rc-closed-tape--r" aria-hidden="true"><span className="rc-foil" /></span>

            <div className="rc-closed-cap"><span className="rc-closed-cap__dia" aria-hidden="true" />{eyebrow}</div>
            <h1 className="rc-closed-head">{title}</h1>

            <div className="rc-perf" aria-hidden="true" />

            <p className="rc-closed-desc">{desc}</p>

            <div className="rc-closed-cta">
              {session ? (
                <button type="button" className="rc-closed-btn" onClick={() => !editorMode && onLogout()} aria-label="ออกจากระบบ">
                  <span className="rc-grommet" aria-hidden="true" />
                  <span className="rc-closed-btn__in">ออกจากระบบ<span className="rc-closed-btn__arrow" aria-hidden="true">→</span></span>
                </button>
              ) : (
                <a href={editorMode ? undefined : getPath("/")} className="rc-closed-btn">
                  <span className="rc-grommet" aria-hidden="true" />
                  <span className="rc-closed-btn__in">กลับหน้าแรก<span className="rc-closed-btn__arrow" aria-hidden="true">→</span></span>
                </a>
              )}
            </div>

            <div className="rc-closed-foot" aria-hidden="true">◆ ◆ ◆ {faculty} ELECTION ◆ ◆ ◆</div>
          </div>
        </section>

        {/* ===== footer — classic single centered line ===== */}
        <footer className="rc-closed-footer">
          <p>© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
        </footer>
      </div>

      <style jsx global>{`
        /* ================= BASE (the polling desk) ================= */
        /* laid-paper ::after + desk vignette ::before + emboss seals + holo foil come
           from the SHARED .rc-desk classes in ReceiptBaseStyles (R3 T1) — this root
           opts in via the rc-desk class, matching the home reference language. */
        .rc-closed-root { --rc-stamp-red:#B91C1C; overflow-x:hidden; }

        :where(.rc-closed-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-closed-root a:focus-visible, .rc-closed-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }

        /* ---- topbar (ported 1:1 from ReceiptHome, scoped to .rc-closed-root) ---- */
        .rc-closed-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); }
        .rc-closed-root .rc-topbar::after { content:""; position:absolute; left:0; right:0; bottom:0; height:1.5px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-closed-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:12px 20px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .rc-closed-root .rc-logo { display:inline-flex; align-items:center; flex-shrink:0; }
        .rc-closed-root .rc-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .rc-closed-root .rc-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .rc-closed-root .rc-nav__link { font-family:var(--rc-fm); font-size:11px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--rc-ink2); position:relative; padding-bottom:2px; transition:color .2s ease; }
        .rc-closed-root .rc-nav__link.on, .rc-closed-root .rc-nav__link:hover { color:var(--rc-ink); }
        .rc-closed-root .rc-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:2px;
          background:var(--rc-accent); transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .rc-closed-root .rc-nav__link:hover::after, .rc-closed-root .rc-nav__link.on::after { transform:scaleX(1); }
        .rc-closed-root .rc-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .rc-closed-root .rc-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--rc-fh);
          font-weight:600; font-size:13px; color:var(--rc-on-accent); background:var(--rc-accent); border:none; cursor:pointer;
          padding:9px 20px; border-radius:var(--rc-radius-button, 8px); transition:background .2s ease, transform .15s ease; }
        .rc-closed-root .rc-loginbtn:hover { background:var(--rc-accent-deep); transform:translateY(-1px); }
        .rc-closed-root .rc-loginbtn:active { transform:scale(.96); }
        .rc-closed-root .rc-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--rc-line) 70%, var(--rc-receipt)); }
        .rc-closed-root .rc-skelbar { display:block; width:58px; height:12px; border-radius:3px;
          background:color-mix(in srgb, var(--rc-ink2) 30%, var(--rc-receipt)); animation:rcPulse 1.3s ease-in-out infinite; }
        @keyframes rcPulse { 0%,100%{opacity:.45} 50%{opacity:1} }
        .rc-closed-root .rc-userchip { position:relative; }
        .rc-closed-root .rc-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:var(--rc-radius-button, 8px); padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, border-color .2s ease; }
        .rc-closed-root .rc-userchip__btn:hover { border-color:var(--rc-accent); }
        .rc-closed-root .rc-userchip__btn:active { transform:scale(.97); }
        .rc-closed-root .rc-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:var(--rc-accent); color:var(--rc-on-accent); font-family:var(--rc-fh); font-weight:700; font-size:14px; line-height:1; }
        .rc-closed-root .rc-userchip__name { font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-closed-root .rc-userchip__caret { color:var(--rc-ink2); font-size:11px; }
        .rc-closed-root .rc-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:10px; overflow:hidden; z-index:50;
          box-shadow:2px 20px 42px -20px color-mix(in srgb, var(--rc-ink) 22%, transparent); }
        .rc-closed-root .rc-usermenu__head { padding:14px 16px; border-bottom:1px dotted var(--rc-line); }
        .rc-closed-root .rc-usermenu__name { font-family:var(--rc-fh); font-weight:700; font-size:14px; color:var(--rc-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-closed-root .rc-usermenu__id { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.04em; color:var(--rc-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-closed-root .rc-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-accent-deep); }
        .rc-closed-root .rc-usermenu__out:hover { background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-closed-root .rc-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:8px; background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); cursor:pointer;
          transition:transform .15s ease, border-color .2s ease; }
        .rc-closed-root .rc-burger:hover { border-color:var(--rc-accent); }
        .rc-closed-root .rc-burger:active { transform:scale(.95); }
        .rc-closed-root .rc-burger span { display:block; height:2.5px; border-radius:2px; background:var(--rc-ink); }
        .rc-closed-root .rc-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .rc-closed-root .rc-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .rc-closed-root .rc-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:8px;
          font-family:var(--rc-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-line); transition:border-color .2s ease; }
        .rc-closed-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ---- page container ---- */
        .rc-closed-root .rc-closed-wrap { position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:0 20px 40px;
          min-height:calc(100vh - 55px); display:flex; flex-direction:column; }

        .rc-closed-root .rc-issue { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 0;
          border-bottom:1px dotted var(--rc-line); font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--rc-faint); }

        /* ---- the taped notice slip ---- */
        .rc-closed-root .rc-closed-stage { flex:1; display:flex; align-items:center; justify-content:center; padding:52px 0; }
        /* the slip is a SHEET OF PAPER — crisp 4px corners + a curl shadow that falls
           down-right (light from top-left, T6). A hair of rotation reads as "taped". */
        .rc-closed-root .rc-closed-slip { position:relative; width:min(100%, 540px); background:var(--rc-receipt);
          border:1px solid var(--rc-line); border-radius:4px; padding:44px 30px 28px; transform:rotate(-.5deg);
          box-shadow:3px 22px 46px -22px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        /* two strips of holo tape pinning the slip's top corners */
        .rc-closed-root .rc-closed-tape { position:absolute; top:-13px; width:72px; height:26px; border-radius:1px; overflow:hidden;
          opacity:.6; mix-blend-mode:multiply;
          box-shadow:1px 2px 4px -1px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-closed-root .rc-closed-tape .rc-foil { position:absolute; inset:-40%; }
        .rc-closed-root .rc-closed-tape--l { left:22px; transform:rotate(-7deg); }
        .rc-closed-root .rc-closed-tape--r { right:22px; transform:rotate(6deg); }

        .rc-closed-root .rc-closed-cap { display:flex; align-items:center; gap:12px; font-family:var(--rc-fm);
          font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--rc-ink2); }
        .rc-closed-root .rc-closed-cap__dia { width:9px; height:9px; flex:none; background:var(--rc-accent); transform:rotate(45deg); }
        .rc-closed-root .rc-closed-cap::after { content:""; flex:1; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-line) 0 4px, transparent 4px 8px); }
        .rc-closed-root .rc-closed-head { margin:16px 0 0; font-family:var(--rc-fh); font-weight:700;
          font-size:clamp(28px,7vw,44px); line-height:1.08; letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-closed-root .rc-closed-slip .rc-perf { margin:22px -30px; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-closed-root .rc-closed-desc { margin:0; font-family:var(--rc-fr); font-size:15px; line-height:1.75; color:var(--rc-ink2); }

        .rc-closed-root .rc-closed-cta { margin-top:28px; }
        /* die-cut TAG action — foil-free ink fill + a punched grommet at the left end
           (matches the home CTA grammar). Lift shadow down-right. */
        .rc-closed-root .rc-closed-btn { position:relative; isolation:isolate; display:inline-flex; align-items:center;
          justify-content:center; min-height:52px; padding:15px 28px 15px 40px; border-radius:6px; background:var(--rc-accent);
          font-family:var(--rc-fh); font-weight:700; font-size:16px; color:var(--rc-on-accent); border:none; cursor:pointer;
          box-shadow:2px 9px 20px -11px color-mix(in srgb, var(--rc-ink) 40%, transparent);
          transition:background .2s ease, transform .18s ease; }
        .rc-closed-root .rc-closed-btn:hover { background:var(--rc-accent-deep); transform:translateY(-2px); }
        .rc-closed-root .rc-closed-btn:active { transform:scale(.98); }
        .rc-closed-root .rc-closed-btn .rc-grommet { position:absolute; z-index:3; left:15px; top:50%; transform:translateY(-50%);
          width:15px; height:15px; border-radius:50%; background:var(--rc-desk);
          box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--rc-faint) 62%, var(--rc-ink2)),
                     inset 0 2px 3px color-mix(in srgb, var(--rc-ink) 45%, transparent); }
        .rc-closed-root .rc-closed-btn__in { display:inline-flex; align-items:center; gap:10px; }
        .rc-closed-root .rc-closed-btn__arrow { transition:transform .2s ease; }
        .rc-closed-root .rc-closed-btn:hover .rc-closed-btn__arrow { transform:translateX(3px); }

        .rc-closed-root .rc-closed-foot { margin-top:26px; text-align:center; font-family:var(--rc-fm); font-size:9px;
          letter-spacing:.24em; text-transform:uppercase; color:var(--rc-faint); }

        /* ---- footer ---- */
        .rc-closed-root .rc-closed-footer { padding:22px 0; border-top:1px dotted var(--rc-line); text-align:center; }
        .rc-closed-root .rc-closed-footer p { margin:0; font-family:var(--rc-fm); font-size:10px; letter-spacing:.12em;
          text-transform:uppercase; color:var(--rc-ink2); }

        /* ================= TABLET+ : inline nav replaces burger/sheet ================= */
        @media (min-width:768px) {
          .rc-closed-root .rc-topbar__in { gap:22px; }
          .rc-closed-root .rc-nav { display:flex; }
          .rc-closed-root .rc-userwrap { margin-left:0; }
          .rc-closed-root .rc-burger, .rc-closed-root .rc-sheet { display:none; }
        }

        /* ================= MOBILE (<=420): full-width action ================= */
        @media (max-width:420px) {
          .rc-closed-root .rc-closed-slip { padding:40px 22px 26px; }
          .rc-closed-root .rc-closed-btn { width:100%; }
        }

        /* reduced motion — freeze every animation (foil stays statically iridescent),
           full page visible. Scoped to .rc-closed-root. */
        @media (prefers-reduced-motion:reduce) {
          .rc-closed-root *, .rc-closed-root *::before, .rc-closed-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
