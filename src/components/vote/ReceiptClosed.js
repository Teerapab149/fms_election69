"use client";

// ReceiptClosed — CLOSED / locked-state page for the "Receipt · Paper Materiality"
// template family (Template #6), in the print/desk language of ReceiptHome (v2-R1.5)
// and the ballot pages (v2-R3). Shown when voting is not open: waiting (before start),
// ended, or paused.
//
// v2-R3c (B7) — "เงียบแต่มีเรื่องเล่า" (quiet but with a story). The dispenser dock
// prints ONE short reason slip that ends in an immediate die-cut jag: the machine
// "stopped printing". Deliberately QUIET vs the celebratory printer-moment success —
// a single dispensed notice, not a party. The LED reads the reason (red = poll ended;
// amber = waiting / maintenance-pause), mirroring ReceiptHome's systemMode ladder. The
// single affordance is a ticket-stub home link (or the PSU-SSO logout when a session
// is present) — the ONLY link; mirroring BlossomClosed, the closed page NEVER links to
// results in its body (the shared topbar nav carries the results link for every page).
//
// Two quiet ephemera only: a rubber-banded stack of USED queue tickets on the desk,
// and a faint "ขอบคุณที่มาใช้สิทธิ์" ink stamp shown ONLY when the poll has ENDED. One
// blind-emboss desk seal — the desk stays deliberately spare (empty on purpose, not
// empty by neglect).
//
// Pure presentation — closed/page.js owns status fetching + the (PSU SSO) logout and
// passes the reason-aware title/desc/variant. Colours flow ONLY through var(--rc-*),
// emitted by ReceiptBaseStyles on .rc-root — a theme swap re-tints the whole page in
// place. The shared desk language (laid paper / vignette / emboss seals / holo foil /
// grain) comes from .rc-desk; topbar mirrors ReceiptHome's ticket-stub head-of-desk.

import { getPath } from "../../utils/basePath";
import { ReceiptTopBar } from "../home/ReceiptHome";
import { ReceiptBaseStyles } from "../home/ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

// reason eyebrow (bilingual, split so the Thai half wears Chakra Petch and the Latin
// half stays mono — A10.3/ruling C4: Space Mono has no Thai glyphs). Copy stays reason-
// aware while the accent stays token-only (var(--rc-*)) — the family has one accent
// identity, so all variants share it.
const EYEBROW = {
  waiting: { th: "ใกล้เปิดหน่วยเลือกตั้ง", en: "UPCOMING" },
  ended: { th: "ปิดโหวตแล้ว", en: "CLOSED" },
  closed: { th: "พักปรับปรุงระบบ", en: "MAINTENANCE" },
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

  // dispenser LED ↔ the SAME systemMode semantics as ReceiptHome (no new state): only a
  // genuinely ENDED poll is red; waiting (pre-open) and maintenance-pause fall to the
  // amber "wait". LED colours are semantic — locked across every theme (A8.1).
  const isEnded = variant === "ended";
  const ledState = isEnded ? "closed" : "wait";

  return (
    <div className="fms-app rc-root rc-closed-root rc-desk">
      <ReceiptBaseStyles />

      <ReceiptTopBar editorMode={editorMode} active="" />

      {/* a single blind-emboss seal pressed into the desk paper (shared .rc-desk-seals)
          — one is enough; the desk stays deliberately spare (B7) */}
      <div className="rc-desk-seals" aria-hidden="true">
        <span className="rc-seal rc-seal--a"><i /><b /></span>
      </div>

      <div className="rc-closed-wrap">
        {/* ===== issue / eyebrow line ===== */}
        <div className="rc-issue">
          <span><span className="rc-th">สถานะระบบ</span> · SYSTEM STATUS</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== the dispenser dock + ONE short reason slip ===== */}
        <section className="rc-closed-stage">
          <div className="rc-closed-dock">

            {/* ── used-queue-ticket stack, rubber-banded, resting on the desk (ephemera
                #1 — CSS/SVG only, aria-hidden). Latin/digit refs only, no Thai. ── */}
            <div className="rc-closed-usedstack" aria-hidden="true">
              <span className="rc-closed-usedtk rc-closed-usedtk--3" />
              <span className="rc-closed-usedtk rc-closed-usedtk--2" />
              <span className="rc-closed-usedtk rc-closed-usedtk--1">
                <span className="rc-closed-usedtk__h rc-mono">QUEUE · USED</span>
                <span className="rc-closed-usedtk__ref rc-mono">{prefix} {number} · 0142</span>
              </span>
              <span className="rc-closed-usedband" />
            </div>

            {/* the dispenser head — SAMO n · CLOSED + a reason LED, then the dark slot
                the slip emerges from (A2 language, ported from ReceiptHome) */}
            <div className={`rc-closed-disp rc-disp led-${ledState}`}>
              <div className="rc-disp-body">
                <span className="rc-disp-label rc-mono">{prefix} {number} · CLOSED</span>
                <span className="rc-disp-led" aria-hidden="true" />
              </div>
              <div className="rc-disp-slot" aria-hidden="true" />
            </div>

            {/* the ONE reason slip — printed, then a die-cut jag: "the machine stopped
                printing". A hair of rotation + two holo-tape corners read as taped. */}
            <div className="rc-closed-slip rc-grain">
              <span className="rc-closed-tape rc-closed-tape--l" aria-hidden="true"><span className="rc-foil" /></span>
              <span className="rc-closed-tape rc-closed-tape--r" aria-hidden="true"><span className="rc-foil" /></span>

              {/* faint "ขอบคุณที่มาใช้สิทธิ์" ink stamp — ONLY when the poll has ended
                  (ephemera #2). Chakra (not mono) so the Thai renders true. */}
              {isEnded && <div className="rc-closed-thanks" aria-hidden="true">ขอบคุณที่มาใช้สิทธิ์</div>}

              <div className="rc-closed-cap">
                <span className="rc-closed-cap__dia" aria-hidden="true" />
                <span className="rc-th">{eyebrow.th}</span> · {eyebrow.en}
              </div>
              <h1 className="rc-closed-head">{title}</h1>

              <div className="rc-perf" aria-hidden="true" />

              <p className="rc-closed-desc">{desc}</p>
            </div>

            {/* CTA — a real ticket STUB torn from beneath the die-cut slip (no purple
                block). logout when a session is present, else the home link. */}
            <div className="rc-closed-cta">
              {session ? (
                <button type="button" className="rc-closed-stub" onClick={() => !editorMode && onLogout()} aria-label="ออกจากระบบ">
                  <span className="rc-closed-stub__in">ออกจากระบบ<span className="rc-closed-stub__arrow" aria-hidden="true"> →</span></span>
                </button>
              ) : (
                <a href={editorMode ? undefined : getPath("/")} className="rc-closed-stub">
                  <span className="rc-closed-stub__in">กลับหน้าแรก<span className="rc-closed-stub__arrow" aria-hidden="true"> →</span></span>
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
        /* laid-paper ::after + desk vignette ::before + emboss seal + holo foil + grain
           come from the SHARED .rc-desk / .rc-grain classes in ReceiptBaseStyles — this
           root opts in via the rc-desk class, matching the home reference language. */
        .rc-closed-root { --rc-stamp-red:#B91C1C;
          /* SEMANTIC dispenser-LED colours — locked across every theme (A8.1) */
          --rc-led-open:#16A34A; --rc-led-wait:#E0A200; --rc-led-closed:#C0403A;
          overflow-x:hidden; }

        :where(.rc-closed-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-closed-root a:focus-visible, .rc-closed-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }
        /* mono utility — ONLY Latin / digits / symbols ever wear it (A10.3) */
        .rc-closed-root .rc-mono { font-family:var(--rc-fm); }
        /* Thai-in-a-mono-line utility — the Thai half of a bilingual mono label wears
           Chakra Petch so it never falls back (Space Mono has no Thai glyphs, C4) */
        .rc-closed-root .rc-th { font-family:var(--rc-fr) !important; }

        /* ---- topbar "head of the desk" (A3 / ruling #4: NO backdrop-filter — opaque
           desk fill + a perforated hairline; stub-nav skin ported from ReceiptHome) ---- */
        .rc-closed-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 96%, var(--rc-receipt)); }
        .rc-closed-root .rc-topbar::after { content:""; position:absolute; left:0; right:0; bottom:0; height:1.5px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-closed-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:10px 20px;
          display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        /* logo on a clipped paper tag with a tiny clip */
        .rc-closed-root .rc-logo { position:relative; display:inline-flex; align-items:center; flex-shrink:0;
          padding:6px 12px 6px 14px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          box-shadow:1px 3px 8px -5px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-closed-root .rc-logo::before { content:""; position:absolute; left:-3px; top:8px; width:10px; height:18px;
          border:2px solid var(--rc-faint); border-right:none; border-radius:6px 0 0 6px; background:transparent; transform:rotate(-4deg); }
        .rc-closed-root .rc-logo__img { height:28px; width:auto; object-fit:contain; display:block; }
        /* nav = a row of ticket STUBS (cut corner + left perforation); active = torn.
           Chakra (--rc-fr), not mono — the labels are Thai (A10.3). */
        .rc-closed-root .rc-nav { display:none; gap:8px; margin-left:auto; align-items:center; }
        .rc-closed-root .rc-nav__link { position:relative; display:inline-flex; align-items:center; min-height:40px;
          font-family:var(--rc-fr); font-weight:600; font-size:12.5px; letter-spacing:.01em; color:var(--rc-ink2);
          padding:0 13px 0 16px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px);
          transition:transform .15s ease, color .2s ease, background .2s ease, border-color .2s ease; }
        .rc-closed-root .rc-nav__link::before { content:""; position:absolute; left:4px; top:7px; bottom:7px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-closed-root .rc-nav__link:hover { transform:translateY(-1px); color:var(--rc-ink); border-color:var(--rc-accent); }
        .rc-closed-root .rc-nav__link.on { color:var(--rc-accent-deep); border-color:var(--rc-accent);
          background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-closed-root .rc-nav__link.on::before { left:1px;
          background:repeating-linear-gradient(180deg, var(--rc-accent) 0 2px, transparent 2px 5px); }
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
        /* user chip = a LANYARD CARD (cut corner + a punched grommet hole on top) */
        .rc-closed-root .rc-userchip { position:relative; }
        .rc-closed-root .rc-userchip__btn { position:relative; display:inline-flex; align-items:center; gap:9px; min-height:44px;
          background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); padding:5px 14px 5px 5px; cursor:pointer;
          font-family:inherit; clip-path:polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
          transition:transform .15s ease, border-color .2s ease; }
        .rc-closed-root .rc-userchip__btn::after { content:""; position:absolute; top:5px; right:12px; width:9px; height:9px;
          border-radius:50%; background:var(--rc-desk);
          box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--rc-faint) 62%, var(--rc-ink2)); }
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
        /* mobile sheet — a stack of nav stubs (Chakra labels, not mono) */
        .rc-closed-root .rc-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:8px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .rc-closed-root .rc-sheet.is-open { max-height:320px; opacity:1; padding:12px 0 4px; }
        .rc-closed-root .rc-sheet__link { position:relative; display:flex; align-items:center; min-height:48px; padding:0 16px 0 20px;
          font-family:var(--rc-fr); font-weight:600; font-size:14px; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px); transition:border-color .2s ease; }
        .rc-closed-root .rc-sheet__link::before { content:""; position:absolute; left:5px; top:9px; bottom:9px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-closed-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ---- page container ---- */
        .rc-closed-root .rc-closed-wrap { position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:0 20px 40px;
          min-height:calc(100vh - 55px); display:flex; flex-direction:column; }

        .rc-closed-root .rc-issue { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 0;
          border-bottom:1px dotted var(--rc-line); font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--rc-faint); }

        /* ---- the dispenser dock + reason slip ---- */
        .rc-closed-root .rc-closed-stage { flex:1; display:flex; align-items:center; justify-content:center; padding:48px 0; }
        .rc-closed-root .rc-closed-dock { position:relative; width:min(100%, 480px); }

        /* ---- DISPENSER head (A2 — ported from ReceiptHome, scoped here) ---- */
        .rc-closed-root .rc-disp { position:relative; z-index:3; margin:0 12px; }
        .rc-closed-root .rc-disp-body { display:flex; align-items:center; justify-content:space-between; gap:12px;
          padding:11px 16px 13px; border-radius:12px 12px 3px 3px;
          background:linear-gradient(180deg, color-mix(in srgb, var(--rc-ink) 84%, var(--rc-faint)), var(--rc-ink)); }
        .rc-closed-root .rc-disp-label { font-size:9.5px; letter-spacing:.2em; text-transform:uppercase;
          color:color-mix(in srgb, var(--rc-faint) 80%, var(--rc-receipt)); }
        .rc-closed-root .rc-disp-led { width:9px; height:9px; border-radius:50%; flex-shrink:0;
          background:var(--rc-led-wait); box-shadow:0 0 9px var(--rc-led-wait); animation:rcLed 2.4s ease-in-out infinite; }
        .rc-closed-root .rc-disp.led-open .rc-disp-led { background:var(--rc-led-open); box-shadow:0 0 9px var(--rc-led-open); }
        .rc-closed-root .rc-disp.led-wait .rc-disp-led { background:var(--rc-led-wait); box-shadow:0 0 9px var(--rc-led-wait); }
        .rc-closed-root .rc-disp.led-closed .rc-disp-led { background:var(--rc-led-closed); box-shadow:0 0 7px var(--rc-led-closed); opacity:.9; }
        @keyframes rcLed { 0%,100%{ opacity:1; } 50%{ opacity:.4; } }
        .rc-closed-root .rc-disp-slot { height:12px; margin:0 8px; background:var(--rc-ink); border-radius:0 0 6px 6px; position:relative;
          box-shadow:inset 0 2px 5px color-mix(in srgb, var(--rc-ink) 82%, transparent); }
        .rc-closed-root .rc-disp-slot::after { content:""; position:absolute; left:12px; right:12px; top:4px; height:3px;
          border-radius:2px; background:color-mix(in srgb, var(--rc-ink) 55%, var(--rc-faint)); }

        /* ---- the ONE reason slip — emerges from the slot, die-cut jag at its bottom
           ("the machine stopped printing"). Receipt stock, 4px top corners, a hair of
           rotation, curl shadow down-right (light top-left, T6). ---- */
        .rc-closed-root .rc-closed-slip { position:relative; z-index:2; margin:-5px 8px 0; padding:26px 30px 30px;
          background-color:var(--rc-receipt); border:1px solid var(--rc-line); border-bottom:none; border-radius:4px 4px 0 0;
          transform:rotate(-.5deg);
          box-shadow:3px 22px 46px -22px color-mix(in srgb, var(--rc-ink) 34%, transparent);
          -webkit-mask:radial-gradient(7px 9px at 9px 100%, transparent 96%, #000) bottom left/18px 9px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 9px) no-repeat;
                  mask:radial-gradient(7px 9px at 9px 100%, transparent 96%, #000) bottom left/18px 9px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 9px) no-repeat; }
        /* two strips of holo tape pinning the slip's top corners */
        .rc-closed-root .rc-closed-tape { position:absolute; z-index:3; top:-13px; width:72px; height:26px; border-radius:1px; overflow:hidden;
          opacity:.6; mix-blend-mode:multiply;
          box-shadow:1px 2px 4px -1px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-closed-root .rc-closed-tape .rc-foil { position:absolute; inset:-40%; }
        .rc-closed-root .rc-closed-tape--l { left:22px; transform:rotate(-7deg); }
        .rc-closed-root .rc-closed-tape--r { right:22px; transform:rotate(6deg); }

        /* faint "thank you" ink stamp — ended only, behind the copy (aria-hidden) */
        .rc-closed-root .rc-closed-thanks { position:absolute; z-index:1; right:16px; top:60px; pointer-events:none;
          font-family:var(--rc-fh); font-weight:700; font-size:15px; letter-spacing:.02em; color:var(--rc-accent-deep);
          border:2px solid var(--rc-accent-deep); border-radius:6px; padding:5px 12px; transform:rotate(-8deg); opacity:.14; }

        .rc-closed-root .rc-closed-cap { position:relative; z-index:2; display:flex; align-items:center; gap:12px; font-family:var(--rc-fm);
          font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--rc-ink2); }
        .rc-closed-root .rc-closed-cap__dia { width:9px; height:9px; flex:none; background:var(--rc-accent); transform:rotate(45deg); }
        .rc-closed-root .rc-closed-cap::after { content:""; flex:1; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-line) 0 4px, transparent 4px 8px); }
        .rc-closed-root .rc-closed-head { position:relative; z-index:2; margin:16px 0 0; font-family:var(--rc-fh); font-weight:700;
          font-size:clamp(28px,7vw,44px); line-height:1.08; letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-closed-root .rc-closed-slip .rc-perf { position:relative; z-index:2; margin:22px -30px; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-closed-root .rc-closed-desc { position:relative; z-index:2; margin:0; font-family:var(--rc-fr); font-size:15px;
          line-height:1.75; color:var(--rc-ink2); }

        /* ---- CTA = a ticket STUB torn from beneath the slip (cut corner + left
           perforation, A3 language; no purple block) ---- */
        .rc-closed-root .rc-closed-cta { margin:22px 12px 0; }
        .rc-closed-root .rc-closed-stub { position:relative; display:inline-flex; align-items:center; justify-content:center;
          min-height:52px; padding:0 22px 0 28px; background:var(--rc-receipt); border:1.5px solid var(--rc-ink); color:var(--rc-ink);
          cursor:pointer; font-family:var(--rc-fh); font-weight:700; font-size:16px;
          clip-path:polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px);
          box-shadow:2px 9px 20px -12px color-mix(in srgb, var(--rc-ink) 40%, transparent);
          transition:transform .18s ease, border-color .2s ease, color .2s ease; }
        .rc-closed-root .rc-closed-stub::before { content:""; position:absolute; left:6px; top:10px; bottom:10px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-ink) 0 2px, transparent 2px 5px); }
        .rc-closed-root .rc-closed-stub:hover { transform:translateY(-2px); color:var(--rc-accent-deep); border-color:var(--rc-accent-deep); }
        .rc-closed-root .rc-closed-stub:hover::before {
          background:repeating-linear-gradient(180deg, var(--rc-accent-deep) 0 2px, transparent 2px 5px); }
        .rc-closed-root .rc-closed-stub:active { transform:scale(.98); }
        .rc-closed-root .rc-closed-stub__in { display:inline-flex; align-items:center; gap:6px; }
        .rc-closed-root .rc-closed-stub__arrow { transition:transform .2s ease; }
        .rc-closed-root .rc-closed-stub:hover .rc-closed-stub__arrow { transform:translateX(3px); }

        .rc-closed-root .rc-closed-foot { margin:26px 12px 0; text-align:center; font-family:var(--rc-fm); font-size:9px;
          letter-spacing:.24em; text-transform:uppercase; color:var(--rc-faint); }

        /* ---- ephemera #1: a rubber-banded stack of USED queue tickets on the desk.
           CSS/SVG only (aria-hidden). Sits to the left of the dock, tucked low. ---- */
        .rc-closed-root .rc-closed-usedstack { position:absolute; z-index:1; left:-96px; bottom:-8px; width:132px; height:78px;
          transform:rotate(-5deg); pointer-events:none; }
        .rc-closed-root .rc-closed-usedtk { position:absolute; left:0; width:126px; height:52px; border-radius:3px;
          background:var(--rc-receipt); border:1px solid var(--rc-line);
          box-shadow:1px 6px 14px -9px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-closed-root .rc-closed-usedtk--3 { top:8px; left:9px; transform:rotate(5deg); background:var(--rc-receipt-edge); }
        .rc-closed-root .rc-closed-usedtk--2 { top:4px; left:4px; transform:rotate(-2deg); }
        .rc-closed-root .rc-closed-usedtk--1 { top:0; display:flex; flex-direction:column; gap:5px; padding:9px 12px; }
        .rc-closed-root .rc-closed-usedtk__h { font-size:8px; letter-spacing:.18em; text-transform:uppercase; color:var(--rc-ink2); }
        .rc-closed-root .rc-closed-usedtk__ref { font-size:9px; letter-spacing:.1em; color:var(--rc-faint);
          font-variant-numeric:tabular-nums; }
        /* the rubber band — a thin elastic loop across the stack */
        .rc-closed-root .rc-closed-usedband { position:absolute; left:34px; top:-4px; width:20px; height:60px; border-radius:40%;
          border:2px solid color-mix(in srgb, var(--rc-accent) 55%, var(--rc-ink2)); transform:rotate(7deg); opacity:.72; }

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

        /* ================= MOBILE (<=560): full-width action, hide the used stack so
           the desk stays calm and nothing overflows the 390px viewport ================= */
        @media (max-width:560px) {
          .rc-closed-root .rc-closed-dock { width:100%; }
          .rc-closed-root .rc-closed-slip { padding:24px 22px 28px; }
          .rc-closed-root .rc-closed-stub { width:100%; }
          .rc-closed-root .rc-closed-usedstack { display:none; }
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
