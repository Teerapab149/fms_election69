"use client";

// BallotChrome — the furniture every page of the ballot-official family shares:
// header (faculty logo, nav, voter), status line, footer and the base styles.
//
// The faculty logo sits in the header of every page (owner rule: these templates
// deliberately look unlike the university's central site, so the logo is what
// tells a voter whose site this is). Sign-out is visible at EVERY width — the v1
// families hid the voter pill on some pages/widths and a voter on a shared
// computer could not find how to leave.

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"; // Motion for React
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import { LogIn, LogOut } from "lucide-react";
import { getPath } from "../../../../utils/basePath";
import { voterSignIn, voterSignOut } from "../../../../lib/auth/voterSession";
import { formatThaiTime } from "../../../../utils/electionConfig";
import { electionMeta } from "../../shared/election/electionMeta";
import { BALLOT_OFFICIAL as P } from "../../../admin/editor/templates/builtIn/ballot-official";

const LOGO_SRC = "/images/logo/FMS_Standard_Logo_PNG.png";

// election facts from globalConfig only — shared by every v2 template
export const ballotMeta = electionMeta;

const NAV = [
  { key: "home", label: "หน้าแรก", href: "/" },
  { key: "candidates", label: "ผู้สมัคร", href: "/candidates" },
  { key: "vote", label: "ลงคะแนน", href: "/vote" },
  { key: "results", label: "ผลคะแนน", href: "/results" },
];

// Nav with one indicator that rests under the current page and follows the
// pointer (shared layoutId, so it slides rather than blinks between links).
// `id` keeps the desktop bar and the phone row from sharing one indicator.
function BallotNav({ id, active, href, className }) {
  const [hover, setHover] = useState(null);
  const on = hover || active;
  return (
    <nav className={className} aria-label="เมนูหลัก" onMouseLeave={() => setHover(null)}>
      {NAV.map((n) => (
        <a key={n.key} href={href(n.href)} className="bo-nav__link"
          aria-current={n.key === active ? "page" : undefined}
          onMouseEnter={() => setHover(n.key)} onFocus={() => setHover(n.key)} onBlur={() => setHover(null)}>
          {n.label}
          {n.key === on && (
            <motion.span layoutId={`bo-nav-${id}`} className={`bo-nav__ind ${n.key === active ? "is-active" : ""}`}
              transition={{ type: "spring", stiffness: 520, damping: 42 }} aria-hidden />
          )}
        </a>
      ))}
    </nav>
  );
}

// `minimal` (the sign-in page): logo only — that page IS the sign-in, and a
// second sign-in button or a nav away would compete with its one job.
export function BallotHeader({ active = "home", editorMode = false, onSignIn = null, minimal = false }) {
  const { data: session, status } = useSession();
  const meta = ballotMeta(useGlobalConfig() || {});
  const signedIn = !editorMode && status === "authenticated" && !!session?.user;
  const name = (session?.user?.name || "").trim();
  const first = name.split(/\s+/)[0] || name;
  const href = (h) => (editorMode ? undefined : getPath(h));

  // At the top the header is part of the page (no surface of its own); once the
  // page moves it becomes a sheet over the content. Only opacity and transform
  // change, driven by one boolean — no per-frame work.
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <header className={`bo-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="bo-header__in">
        <a href={href("/")} className="bo-logo" aria-label={`หน้าแรก ${meta.org}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getPath(LOGO_SRC)} alt={`${meta.faculty} ${meta.university}`} />
        </a>

        {!minimal && <BallotNav id="bar" active={active} href={href} className="bo-nav" />}

        {!minimal && <div className="bo-voter">
          {signedIn ? (
            <>
              <span className="bo-voter__av" aria-hidden>{(first || "?").charAt(0)}</span>
              <span className="bo-voter__name">{first}</span>
              <button type="button" className="bo-voter__out" onClick={() => voterSignOut(session)}>
                <LogOut size={16} aria-hidden />
                <span className="bo-voter__outlbl">ออกจากระบบ</span>
              </button>
            </>
          ) : (
            <button type="button" className="bo-voter__in" disabled={status === "loading"}
              onClick={() => { if (editorMode) return; onSignIn ? onSignIn() : voterSignIn(); }}>
              <LogIn size={16} aria-hidden />
              เข้าสู่ระบบ
            </button>
          )}
        </div>}
      </div>

      {/* phones: the four destinations stay one tap away under the bar */}
      {!minimal && <BallotNav id="row" active={active} href={href} className="bo-subnav" />}
    </header>
  );
}

// The countdown, in the ballot's own boxes. Shown only while there is something
// to count to (polls opening, polls closing) — never after the polls close.
// A changing figure rolls up out of its box; figures that did not change stay
// put (each keyed by its own value), so only the seconds move every second.
export function BallotCountdown({ status }) {
  const { remaining, target } = status;
  if (!remaining || !target) return null;
  const pad = (n) => String(n).padStart(2, "0");
  const cells = [
    ...(remaining.d > 0 ? [{ v: remaining.d, u: "วัน" }] : []),
    { v: pad(remaining.h), u: "ชั่วโมง" },
    { v: pad(remaining.m), u: "นาที" },
    { v: pad(remaining.s), u: "วินาที" },
  ];
  const label = target.kind === "opens" ? "เปิดหีบในอีก" : "ปิดหีบในอีก";
  const spoken = cells.map((c) => `${Number(c.v)} ${c.u}`).join(" ");
  return (
    <div className={`bo-cd bo-cd--${target.kind}`} role="timer" aria-label={`${label} ${spoken}`}>
      <span className="bo-cd__label" aria-hidden>{label}</span>
      <span className="bo-cd__cells" aria-hidden>
        {cells.map((c) => (
          <span key={c.u} className="bo-cd__cell">
            <span className="bo-cd__fig">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.b key={c.v}
                  initial={{ y: "70%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-70%", opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
                  {c.v}
                </motion.b>
              </AnimatePresence>
            </span>
            <small>{c.u}</small>
          </span>
        ))}
      </span>
    </div>
  );
}

// One line that says where the election is. Every page of the family renders
// status through this, from useElectionStatus, so it cannot contradict itself.
export function BallotStatus({ status, showClock = true }) {
  const { phase, remaining, target, end } = status;
  const pad = (n) => String(n).padStart(2, "0");
  const clock = remaining
    ? `${remaining.d > 0 ? `${remaining.d} วัน ` : ""}${pad(remaining.h)}:${pad(remaining.m)}:${pad(remaining.s)}`
    : null;

  let text;
  if (phase === "open") text = target ? `เปิดลงคะแนนอยู่ ปิดหีบเวลา ${formatThaiTime(end)}` : "เปิดลงคะแนนอยู่";
  // the date itself is shown by the page (home posts it under the heading)
  else if (phase === "before") text = "ยังไม่เปิดหีบ";
  else if (phase === "paused") text = "ระบบหยุดให้บริการชั่วคราว";
  else text = "ปิดหีบแล้ว";

  return (
    <p className={`bo-status bo-status--${phase}`} role="status">
      <span className="bo-status__dot" aria-hidden />
      <span className="bo-status__txt">{text}</span>
      {showClock && clock && (
        <span className="bo-status__clock">
          {target.kind === "opens" ? "อีก" : "เหลือ"} <b>{clock}</b>
        </span>
      )}
    </p>
  );
}

export function BallotFooter({ meta, tone = "day" }) {
  return (
    <footer className={`bo-footer bo-footer--${tone}`}>
      <div className="bo-footer__in">
        <span>{meta.faculty}</span>
        <span>© {meta.copyrightYear} {meta.facultyShort}@{meta.university}</span>
      </div>
    </footer>
  );
}

export function BallotBaseStyles() {
  return (
    <style jsx global>{`
      .bo-root {
        --bo-paper: ${P.paper}; --bo-board: ${P.board}; --bo-plum: ${P.plum};
        --bo-plum-deep: ${P.plumDeep}; --bo-ink: ${P.ink}; --bo-muted: ${P.muted};
        --bo-rule: ${P.rule}; --bo-pen: ${P.pen};
        --bo-font: var(--font-noto-thai), 'Noto Sans Thai', system-ui, sans-serif;
        /* looped Thai for long reading only (policies, biographies) — owner's call */
        --bo-font-read: var(--font-noto-thai-looped), 'Noto Sans Thai Looped', var(--font-noto-thai), system-ui, sans-serif;
        --bo-max: 1120px;
        min-height: 100vh; background: var(--bo-board); color: var(--bo-ink);
        font-family: var(--bo-font); font-size: 17px; line-height: 1.6;
        -webkit-font-smoothing: antialiased;
      }
      .bo-root * { box-sizing: border-box; }
      /* short pages (success, closed) still end with the footer at the bottom */
      .bo-root { display: flex; flex-direction: column; }
      .bo-root > main { flex: 1 0 auto; }
      .bo-root ::selection { background: var(--bo-plum); color: #fff; }
      .bo-root a { color: inherit; text-decoration: none; }
      .bo-root :focus-visible { outline: 2px solid var(--bo-pen); outline-offset: 3px; border-radius: 6px; }
      .bo-root button { font: inherit; cursor: pointer; }

      /* header */
      /* At rest the header sits on the page (no surface); scrolled, a paper sheet
         with a hairline fades in behind it and the logo steps down a size. The
         sheet is a pseudo-element so only its opacity animates. */
      .bo-header { position: sticky; top: 0; z-index: 40; isolation: isolate; }
      .bo-header::before {
        content: ""; position: absolute; inset: 0; z-index: -1; opacity: 0;
        background: rgba(255,255,255,.94); border-bottom: 1px solid var(--bo-rule);
        box-shadow: 0 8px 24px -18px rgba(46,20,60,.35);
        transition: opacity .3s ease;
      }
      .bo-header.is-scrolled::before { opacity: 1; }
      .bo-header__in { max-width: var(--bo-max); margin: 0 auto; height: 68px; padding: 0 20px; display: flex; align-items: center; gap: 28px; }
      .bo-logo { display: inline-flex; align-items: center; flex-shrink: 0; }
      .bo-logo img { height: 36px; width: auto; display: block; transform-origin: left center; transition: transform .3s cubic-bezier(.16,1,.3,1); }
      .bo-header.is-scrolled .bo-logo img { transform: scale(.88); }
      .bo-nav { display: flex; gap: 2px; margin-right: auto; }
      .bo-nav__link {
        position: relative; padding: 8px 12px; font-size: 16px; font-weight: 500; color: var(--bo-muted);
        transition: color .15s;
      }
      .bo-nav__link:hover { color: var(--bo-ink); }
      .bo-nav__link[aria-current="page"] { color: var(--bo-plum); font-weight: 700; }
      /* one indicator: plum under the current page, a quieter rule while it
         follows the pointer elsewhere */
      .bo-nav__ind { position: absolute; left: 12px; right: 12px; bottom: 2px; height: 2px; border-radius: 2px; background: var(--bo-muted); opacity: .45; }
      .bo-nav__ind.is-active { background: var(--bo-plum); opacity: 1; }
      .bo-subnav { display: none; }

      .bo-voter { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
      .bo-voter__av { width: 34px; height: 34px; border-radius: 50%; background: var(--bo-plum); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 16px; }
      .bo-voter__name { font-weight: 600; font-size: 15px; max-width: 12ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .bo-voter__out, .bo-voter__in {
        display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px;
        border-radius: 10px; font-size: 15px; font-weight: 600; transition: background-color .15s, color .15s, border-color .15s;
      }
      .bo-voter__out { background: transparent; border: 1px solid var(--bo-rule); color: var(--bo-muted); }
      .bo-voter__out:hover { border-color: var(--bo-plum); color: var(--bo-plum); }
      .bo-voter__in { background: var(--bo-paper); border: 1.5px solid var(--bo-plum); color: var(--bo-plum); }
      .bo-voter__in:hover { background: var(--bo-plum); color: #fff; }
      .bo-voter__in:disabled { opacity: .5; }

      /* status line */
      /* dot | text, with the clock (if any) under the text: the dot never ends up alone on a line */
      .bo-status { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 2px 10px; margin: 0; font-size: 16px; font-weight: 500; color: var(--bo-ink); }
      .bo-status__txt { text-wrap: pretty; }
      .bo-status__clock { grid-column: 2; }
      .bo-status__dot { width: 10px; height: 10px; border-radius: 50%; background: var(--bo-muted); flex-shrink: 0; }
      /* live dot: the ring is its own layer and only scales/fades (compositor-only) */
      .bo-status--open .bo-status__dot { position: relative; background: var(--bo-plum); }
      .bo-status--open .bo-status__dot::after {
        content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--bo-plum);
        animation: boPulse 2.4s cubic-bezier(.16,1,.3,1) infinite;
      }
      .bo-status--before .bo-status__dot { background: transparent; border: 2px solid var(--bo-plum); }
      .bo-status__clock { color: var(--bo-muted); }
      .bo-status__clock b { color: var(--bo-plum); font-weight: 700; font-variant-numeric: tabular-nums; }
      @keyframes boPulse { from { transform: scale(1); opacity: .5; } 70%, to { transform: scale(2.6); opacity: 0; } }

      /* shared ballot parts — every page that shows a ballot uses these */
      .bo-perf { position: relative; height: 0; border-top: 2px dashed var(--bo-rule); margin: 0 18px; }
      .bo-perf::before, .bo-perf::after {
        content: ""; position: absolute; top: -11px; width: 20px; height: 20px; border-radius: 50%; background: var(--bo-board);
      }
      .bo-perf::before { left: -29px; } .bo-perf::after { right: -29px; }
      .bo-cta {
        border: 0; cursor: pointer; width: 100%;
        display: flex; align-items: center; justify-content: center; min-height: 56px; padding: 0 22px;
        border-radius: 10px; background: var(--bo-plum); color: #fff !important;
        font-size: 19px; font-weight: 700; text-align: center;
        box-shadow: 0 10px 22px -12px rgba(138,38,128,.8);
        transition: background-color .2s, transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s;
      }
      /* hover: the button rises a pixel and its shadow opens; pressing settles it */
      .bo-cta:not(.is-disabled):not(:disabled):hover { background: var(--bo-plum-deep); transform: translateY(-1px); box-shadow: 0 16px 28px -14px rgba(94,26,88,.85); }
      .bo-cta:not(.is-disabled):not(:disabled):active { transform: translateY(0); box-shadow: 0 8px 18px -12px rgba(94,26,88,.8); }
      .bo-cta.is-disabled { background: var(--bo-board); color: var(--bo-muted) !important; box-shadow: none; cursor: not-allowed; }
      .bo-cta:disabled { background: var(--bo-board); color: var(--bo-muted) !important; box-shadow: none; cursor: not-allowed; transform: none; }

      /* the closing band: where a reading page points at the ballot */
      .bo-end { background: linear-gradient(var(--bo-board), #E2D9EA); border-top: 1px solid var(--bo-rule); padding: 80px 20px 96px; }
      .bo-end__in { max-width: 640px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; }
      .bo-end__title { margin: 0; font-size: clamp(26px, 3vw, 38px); font-weight: 800; line-height: 1.2; }
      .bo-end__note { margin: 10px 0 0; font-size: 16px; line-height: 1.7; color: var(--bo-muted); }
      .bo-end__acts { margin-top: 26px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 14px 24px; }
      .bo-end__cta { width: auto; padding: 0 30px; }
      .bo-end__alt { font-weight: 600; color: var(--bo-plum); border-bottom: 1.5px solid currentColor; padding-bottom: 1px; }

      /* countdown — each figure in a ballot box */
      .bo-cd { display: flex; align-items: center; justify-content: space-between; gap: 12px 16px; flex-wrap: wrap; }
      .bo-cd__label { font-size: 16px; font-weight: 600; color: var(--bo-ink); }
      .bo-cd__cells { display: flex; gap: 8px; }
      .bo-cd__cell {
        min-width: 58px; padding: 6px 6px 5px; border: 2px solid var(--bo-ink); border-radius: 3px;
        display: flex; flex-direction: column; align-items: center; line-height: 1;
      }
      /* the figure's window: a rolling digit is clipped to its own box */
      .bo-cd__fig { display: block; height: 30px; overflow: hidden; position: relative; }
      .bo-cd__cell b { display: block; font-size: 26px; line-height: 30px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -.01em; text-align: center; }
      .bo-cd__cell small { margin-top: 5px; font-size: 12px; font-weight: 500; color: var(--bo-muted); }
      .bo-cd--opens .bo-cd__cell { border-color: var(--bo-plum); }
      .bo-cd--opens .bo-cd__cell b { color: var(--bo-plum); }

      /* footer */
      .bo-footer { border-top: 1px solid var(--bo-rule); background: var(--bo-paper); }
      /* night: the home page ends in the count chapter's deep plum */
      .bo-footer--night { background: #2A0E28; border-top-color: rgba(255,255,255,.08); }
      .bo-footer--night .bo-footer__in { color: rgba(255,255,255,.6); }
      .bo-footer__in { max-width: var(--bo-max); margin: 0 auto; padding: 22px 20px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 20px; font-size: 14px; color: var(--bo-muted); }

      @media (max-width: 860px) {
        .bo-nav { display: none; }
        .bo-header__in { justify-content: space-between; height: 58px; padding: 0 16px; }
        .bo-voter__name, .bo-voter__outlbl { display: none; }
        .bo-voter__out { width: 40px; padding: 0; justify-content: center; }
        .bo-subnav { display: flex; gap: 2px; overflow-x: auto; padding: 0 10px 6px; scrollbar-width: none; }
        .bo-subnav::-webkit-scrollbar { display: none; }
        .bo-subnav .bo-nav__link { padding: 6px 10px; font-size: 15px; white-space: nowrap; }
        .bo-logo img { height: 30px; }
      }
      @media (max-width: 640px) {
        .bo-root { font-size: 15px; }
        .bo-status { font-size: 14px; }
        .bo-subnav .bo-nav__link { font-size: 14px; }
        .bo-voter__in { min-height: 36px; padding: 0 12px; font-size: 14px; }
        .bo-cd__label { font-size: 14px; }
        .bo-cd__cells { gap: 6px; }
        .bo-cd__cell { min-width: 50px; padding: 5px 5px 4px; }
        .bo-cd__fig { height: 24px; }
        .bo-cd__cell b { font-size: 20px; line-height: 24px; }
        .bo-cd__cell small { margin-top: 3px; font-size: 10.5px; }
        .bo-cta { min-height: 50px; font-size: 16.5px; }
        .bo-end { padding: 56px 16px 72px; }
        .bo-end__title { font-size: 25px; }
        .bo-end__note { font-size: 14.5px; }
        .bo-end__acts { flex-direction: column; width: 100%; }
        .bo-end__cta { width: 100%; }
      }
      @media (prefers-reduced-motion: reduce) {
        .bo-root *, .bo-root *::before, .bo-root *::after { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
