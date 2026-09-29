"use client";

// GardenChrome — the furniture every page of the voter-garden family shares:
// header (faculty logo, nav, voter), footer and the base styles.
//
// The faculty logo is in the header of every page (owner rule). Sign-out is
// visible at every width. The current page is marked with a small leaf, the
// family's one ornament outside the plate.

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion"; // Motion for React
import { LogIn, LogOut } from "lucide-react";
import { getPath } from "../../../../utils/basePath";
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import { voterSignIn, voterSignOut } from "../../../../lib/auth/voterSession";
import { electionMeta } from "../../shared/election/electionMeta";
import { VOTER_GARDEN as C } from "../../../admin/editor/templates/builtIn/voter-garden";

const LOGO_SRC = "/images/logo/FMS_Standard_Logo_PNG.png";

export const gardenMeta = electionMeta;

const NAV = [
  { key: "home", label: "หน้าแรก", href: "/" },
  { key: "candidates", label: "ผู้สมัคร", href: "/candidates" },
  { key: "vote", label: "ลงคะแนน", href: "/vote" },
  { key: "results", label: "ผลคะแนน", href: "/results" },
];

// the leaf that sits under the current page (and follows the pointer)
const Leaf = () => (
  <svg viewBox="0 0 24 10" aria-hidden>
    <path d="M2 6 Q9 -1 22 4 Q12 10 2 6Z" />
    <path d="M3 6 L19 4.4" />
  </svg>
);

function GardenNav({ id, active, href, className }) {
  const [hover, setHover] = useState(null);
  const on = hover || active;
  return (
    <nav className={className} aria-label="เมนูหลัก" onMouseLeave={() => setHover(null)}>
      {NAV.map((n) => (
        <a key={n.key} href={href(n.href)} className="vg-nav__link" aria-current={n.key === active ? "page" : undefined}
          onMouseEnter={() => setHover(n.key)} onFocus={() => setHover(n.key)} onBlur={() => setHover(null)}>
          {n.label}
          {n.key === on && (
            <motion.span layoutId={`vg-nav-${id}`} className={`vg-nav__leaf ${n.key === active ? "is-active" : ""}`}
              transition={{ type: "spring", stiffness: 480, damping: 40 }}><Leaf /></motion.span>
          )}
        </a>
      ))}
    </nav>
  );
}

export function GardenHeader({ active = "home", editorMode = false, onSignIn = null, minimal = false }) {
  const { data: session, status } = useSession();
  const meta = gardenMeta(useGlobalConfig() || {});
  const signedIn = !editorMode && status === "authenticated" && !!session?.user;
  const name = (session?.user?.name || "").trim();
  const first = name.split(/\s+/)[0] || name;
  const href = (h) => (editorMode ? undefined : getPath(h));
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <header className={`vg-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="vg-header__in">
        <a href={href("/")} className="vg-logo" aria-label={`หน้าแรก ${meta.org}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getPath(LOGO_SRC)} alt={`${meta.faculty} ${meta.university}`} />
        </a>
        {!minimal && <GardenNav id="bar" active={active} href={href} className="vg-nav" />}
        {!minimal && (
          <div className="vg-voter">
            {signedIn ? (
              <>
                <span className="vg-voter__name">{first}</span>
                <button type="button" className="vg-voter__out" onClick={() => voterSignOut(session)}>
                  <LogOut size={16} aria-hidden /><span className="vg-voter__outlbl">ออกจากระบบ</span>
                </button>
              </>
            ) : (
              <button type="button" className="vg-voter__in" disabled={status === "loading"}
                onClick={() => { if (editorMode) return; onSignIn ? onSignIn() : voterSignIn(); }}>
                <LogIn size={16} aria-hidden /> เข้าสู่ระบบ
              </button>
            )}
          </div>
        )}
      </div>
      {!minimal && <GardenNav id="row" active={active} href={href} className="vg-subnav" />}
    </header>
  );
}

export function GardenFooter({ meta }) {
  return (
    <footer className="vg-footer">
      <div className="vg-footer__in">
        <span>{meta.faculty}</span>
        <span>© {meta.copyrightYear} {meta.facultyShort}@{meta.university}</span>
      </div>
    </footer>
  );
}

export function GardenBaseStyles() {
  return (
    <style jsx global>{`
      .vg-root {
        --vg-paper: ${C.paper}; --vg-card: ${C.card}; --vg-ink: ${C.ink}; --vg-leaf: ${C.leaf};
        --vg-moss: ${C.moss}; --vg-muted: ${C.muted}; --vg-rule: ${C.rule}; --vg-bloom: ${C.bloom};
        --vg-font: var(--font-plex-thai), 'IBM Plex Sans Thai', system-ui, sans-serif;
        /* looped only for long reading — policies, biographies */
        --vg-font-read: var(--font-plex-thai-looped), 'IBM Plex Sans Thai Looped', var(--font-plex-thai), system-ui, sans-serif;
        --vg-max: 1160px;
        min-height: 100vh; display: flex; flex-direction: column;
        background: var(--vg-paper); color: var(--vg-ink);
        font-family: var(--vg-font); font-size: 17px; line-height: 1.6; -webkit-font-smoothing: antialiased;
      }
      .vg-root > main { flex: 1 0 auto; }
      .vg-root * { box-sizing: border-box; }
      .vg-root ::selection { background: var(--vg-moss); color: #fff; }
      .vg-root a { color: inherit; text-decoration: none; }
      .vg-root :focus-visible { outline: 2px solid var(--vg-bloom); outline-offset: 3px; border-radius: 4px; }
      .vg-root button { font: inherit; cursor: pointer; }

      .vg-header { position: sticky; top: 0; z-index: 40; isolation: isolate; }
      .vg-header::before { content: ""; position: absolute; inset: 0; z-index: -1; opacity: 0; background: rgba(240,243,235,.95); border-bottom: 1px solid var(--vg-rule); transition: opacity .3s ease; }
      .vg-header.is-scrolled::before { opacity: 1; }
      .vg-header__in { max-width: var(--vg-max); margin: 0 auto; height: 70px; padding: 0 20px; display: flex; align-items: center; gap: 32px; }
      .vg-logo img { height: 36px; width: auto; display: block; }
      .vg-nav { display: flex; gap: 6px; margin: 0 auto; }
      .vg-nav__link { position: relative; padding: 8px 14px 12px; font-size: 16px; font-weight: 500; color: var(--vg-muted); transition: color .15s; }
      .vg-nav__link:hover { color: var(--vg-ink); }
      .vg-nav__link[aria-current="page"] { color: var(--vg-moss); font-weight: 700; }
      .vg-nav__leaf { position: absolute; left: 50%; bottom: 0; width: 24px; height: 10px; margin-left: -12px; opacity: .45; }
      .vg-nav__leaf.is-active { opacity: 1; }
      .vg-nav__leaf svg { display: block; width: 100%; height: 100%; }
      .vg-nav__leaf path:first-child { fill: color-mix(in srgb, var(--vg-leaf) 35%, transparent); stroke: var(--vg-ink); stroke-width: 1.1; }
      .vg-nav__leaf path:last-child { fill: none; stroke: var(--vg-ink); stroke-width: .9; }
      .vg-subnav { display: none; }

      .vg-voter { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
      .vg-voter__name { font-weight: 600; font-size: 15px; max-width: 12ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .vg-voter__out, .vg-voter__in { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font-size: 15px; font-weight: 600; transition: background-color .15s, color .15s, border-color .15s; }
      .vg-voter__out { background: transparent; border: 1px solid var(--vg-rule); color: var(--vg-muted); }
      .vg-voter__out:hover { border-color: var(--vg-moss); color: var(--vg-moss); }
      .vg-voter__in { background: transparent; border: 1.5px solid var(--vg-moss); color: var(--vg-moss); }
      .vg-voter__in:hover { background: var(--vg-moss); color: #fff; }

      /* the family's button: a moss pill */
      .vg-cta {
        display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 54px; padding: 0 30px;
        border: 0; border-radius: 999px; background: var(--vg-moss); color: #fff !important; font-size: 18px; font-weight: 700;
        box-shadow: 0 12px 24px -16px rgba(30,51,38,.9); transition: background-color .2s, transform .25s cubic-bezier(.16,1,.3,1);
      }
      .vg-cta:not(.is-disabled):hover { background: var(--vg-ink); transform: translateY(-1px); }
      .vg-cta.is-disabled { background: var(--vg-rule); color: var(--vg-muted) !important; box-shadow: none; cursor: not-allowed; }

      .vg-footer { border-top: 1px solid var(--vg-rule); }
      .vg-footer__in { max-width: var(--vg-max); margin: 0 auto; padding: 22px 20px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 20px; font-size: 14px; color: var(--vg-muted); }

      @media (max-width: 860px) {
        .vg-nav { display: none; }
        .vg-header__in { justify-content: space-between; height: 58px; padding: 0 16px; }
        .vg-voter__name, .vg-voter__outlbl { display: none; }
        .vg-voter__out { width: 40px; padding: 0; justify-content: center; }
        .vg-subnav { display: flex; gap: 2px; overflow-x: auto; padding: 0 8px 4px; scrollbar-width: none; }
        .vg-subnav::-webkit-scrollbar { display: none; }
        .vg-subnav .vg-nav__link { padding: 6px 10px 11px; font-size: 15px; white-space: nowrap; }
        .vg-logo img { height: 30px; }
      }
      @media (max-width: 640px) {
        .vg-root { font-size: 15px; }
        .vg-voter__in { min-height: 36px; padding: 0 12px; font-size: 14px; }
        .vg-cta { min-height: 50px; font-size: 16.5px; width: 100%; }
      }
      @media (prefers-reduced-motion: reduce) {
        .vg-root *, .vg-root *::before, .vg-root *::after { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
