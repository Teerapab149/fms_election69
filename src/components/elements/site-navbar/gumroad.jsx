"use client";

// site-navbar · variant "gumroad" — the shared top navigation bar for the gumroad
// ("Active Pulse") template. ONE source of truth used by every gumroad page
// (home + the 6 inner pages), replacing the 8 hand-copied per-page topbars.
//
// Element-shaped on purpose (VISION Pillar 1 / registry `navigation` category):
//   - renders `data-element="site-navbar"` on root → future editor scoping (D10)
//   - colours = Layer-2 `--nav-*` overrides → gumroad identity literals. We do NOT
//     chain to Layer-1 `--color-*`: on this site those tokens are decoupled from the
//     current "ละมุน" palette (--color-border #1A1A1A ≠ the warm ink var(--ink, #26271c) the
//     pages use; --color-primary #8A2680 is purple, not the pink active pill). Per
//     CLAUDE.md Rule 9 the gumroad navbar's cream/ink/pink IS its identity → hardcode
//     it (matches the page body) and expose `--nav-*` as the editor knobs (Tier 2)
//   - self-contained: brand + 3 election links + the shared GumroadMobileMenu
//     (burger + auth + drawer), 3 balanced zones so the centre nav stays centred
//     no matter how wide the logged-in name gets
//
// NOT yet registered in registry.js / wired to PropertyPanel — that is additive
// work for the editor element-coverage phase. Adding more variants later =
// `./classic.jsx`, `./editorial.jsx`, … selectable per page (the "~5 navbars").

import { getPath } from "../../../utils/basePath";
import Image from "next/image";
import GumroadMobileMenu from "../../GumroadMobileMenu";

const LINKS = [
  { key: "home", href: "/", label: "หน้าแรก" },
  { key: "candidates", href: "/candidates", label: "Meet Candidates" },
  { key: "results", href: "/results", label: "ผลการลงคะแนนเสียง" },
];

export default function SiteNavbarGumroad({ active = "", editorMode = false, onSignIn = null }) {
  return (
    <header className="snav" data-element="site-navbar" data-variant="gumroad">
      <a href={getPath("/")} className="snav__brand">
        <Image
          src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")}
          alt="FMS PSU"
          width={1200}
          height={384}
          className="snav__word"
          priority
        />
      </a>

      <nav className="snav__nav">
        {LINKS.map((l) => (
          <a
            key={l.key}
            href={getPath(l.href)}
            className={`snav__link ${active === l.key ? "is-active" : ""}`}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="snav__actions">
        <GumroadMobileMenu active={active} editorMode={editorMode} onSignIn={onSignIn} />
      </div>

      <style jsx global>{`
        /* Layer-2 --nav-* overrides win; otherwise gumroad identity literals (the
           "ละมุน" palette the page bodies use). Editor recolours via --nav-* knobs. */
        .snav{
          position:sticky; top:0; z-index:40; display:flex; align-items:center; gap:16px;
          padding:14px 32px;
          background:var(--nav-bg, var(--cream, #FFF6EC));
          border-bottom:2.5px solid var(--nav-border, var(--ink, #26271c));
          color:var(--nav-text, var(--ink, #26271c));
        }
        /* 3 balanced zones — left & right flex equally so the centre nav is truly
           centred regardless of the logged-in name width. */
        .snav__brand{ flex:1 1 0; min-width:0; display:flex; align-items:center; text-decoration:none; }
        .snav__word{ width:auto; height:32px; object-fit:contain; }
        .snav__actions{ flex:1 1 0; min-width:0; display:flex; align-items:center; justify-content:flex-end; gap:12px; }
        .snav__nav{ flex:0 0 auto; display:flex; gap:4px; }
        .snav__link{
          padding:8px 16px; border-radius:999px; font-weight:600; font-size:14px;
          border:2px solid transparent; text-decoration:none; color:inherit; white-space:nowrap;
          transition:all .15s ease-out;
        }
        .snav__link:hover{
          background:var(--nav-hover, var(--paper, #FFFDFA));
          border-color:var(--nav-border, var(--ink, #26271c));
        }
        .snav__link.is-active{
          background:var(--nav-accent, var(--pink, #FF9CE9));
          border-color:var(--nav-border, var(--ink, #26271c));
          box-shadow:3px 3px 0 var(--nav-border, var(--ink, #26271c));
        }

        /* mobile — hide desktop nav + desktop auth, reveal the shared burger
           (GumroadMobileMenu owns .gnav-burger / .gnav-auth-d) */
        @media (max-width:900px){
          .snav{ padding:12px 18px; }
          .snav__nav{ display:none; }
          .snav__word{ height:30px; }
          .snav .gnav-burger{ display:grid; }
          .snav .gnav-auth-d{ display:none; }
        }
      `}</style>
    </header>
  );
}
