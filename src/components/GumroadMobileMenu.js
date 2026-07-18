"use client";

// GumroadMobileMenu — shared mobile hamburger + slide-in drawer for the gumroad
// ("Active Pulse") inner pages (results / vote / single-party). The home page keeps
// its own inline drawer. Self-contained: own palette + scoped `gnav-` styles + own
// session, so it can be dropped into any gumroad page without extra wiring.
//
// The burger defaults to display:none; each host page reveals it from inside its
// OWN mobile @container breakpoint (`.gnav-burger{ display:grid }`) so it appears at
// exactly the width that page's desktop nav disappears.

import { getPath } from "../utils/basePath";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { ArrowRight, Menu, X, LogOut } from "lucide-react";

const LINKS = [
  { key: "home", href: "/", label: "หน้าแรก" },
  { key: "candidates", href: "/candidates", label: "Meet Candidates" },
  { key: "results", href: "/results", label: "ผลการลงคะแนนเสียง" },
];

export default function GumroadMobileMenu({ active = "", onSignIn = null }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const loggedIn = status === "authenticated" && !!session?.user;
  const navName = session?.user?.name || "";
  const navId = session?.user?.studentId || "";
  const BP = process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs";
  // Optional sign-in override (playground): call it instead of next-auth signIn().
  const doSignIn = () =>
    onSignIn ? onSignIn() : signIn("authentik", { callbackUrl: BP + "/vote" });

  return (
    <>
      {/* DESKTOP auth — login state in the topbar (mobile uses the drawer instead).
          Hidden at each page's mobile breakpoint via `.gnav-auth-d{display:none}`. */}
      <div className="gnav-auth-d">
        {loggedIn ? (
          <div className="gnav-userd">
            <span className="gnav-userd__chip">
              <span className="gnav-userd__ava" aria-hidden>{(navName || "ผู้ใช้").trim().charAt(0).toUpperCase()}</span>
              <span className="gnav-userd__name">{navName || "ผู้ใช้"}</span>
            </span>
            <button className="gnav-dbtn gnav-dbtn--icon" onClick={() => signOut({ callbackUrl: BP + "/" })} aria-label="ออกจากระบบ" title="ออกจากระบบ">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="gnav-dbtn gnav-dbtn--ink" onClick={doSignIn}>
            <ArrowRight size={16} /> เข้าสู่ระบบ
          </button>
        )}
      </div>

      <button
        className="gnav-burger"
        onClick={() => setOpen((o) => !o)}
        aria-label="เมนู"
        aria-expanded={open}
      >
        {open ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
      </button>

      {open && (
        <>
          <div className="gnav-scrim" onClick={() => setOpen(false)} />
          <aside className="gnav-drawer" role="dialog" aria-label="เมนู">
            <div className={`gnav-status ${loggedIn ? "is-in" : ""}`}>
              {loggedIn ? (
                <>
                  <span className="gnav-hi"><span className="gnav-livedot" /> เข้าสู่ระบบแล้ว</span>
                  <strong>{navName || "ผู้ใช้"}</strong>
                  {navId ? <small>{navId}</small> : null}
                </>
              ) : (
                <>
                  <span className="gnav-hi">ยังไม่ได้เข้าสู่ระบบ</span>
                  <small>เข้าสู่ระบบด้วย PSU Passport เพื่อลงคะแนน</small>
                </>
              )}
            </div>

            <nav className="gnav-dnav">
              {LINKS.map((l) => (
                <a key={l.key} href={getPath(l.href)} className={`gnav-dlink ${active === l.key ? "is-active" : ""}`}>
                  {l.label}
                </a>
              ))}
            </nav>

            {loggedIn ? (
              <button className="gnav-auth gnav-auth--coral" onClick={() => signOut({ callbackUrl: BP + "/" })}>
                <LogOut size={18} /> ออกจากระบบ
              </button>
            ) : (
              <button className="gnav-auth gnav-auth--ink" onClick={doSignIn}>
                <ArrowRight size={18} /> เข้าสู่ระบบ
              </button>
            )}
          </aside>
        </>
      )}

      <style jsx global>{`
        .gnav-burger{ display:none; width:46px; height:46px; flex-shrink:0; border:2.5px solid var(--ink, #26271c); border-radius:14px;
          background:var(--paper, #FFFDFA); place-items:center; cursor:pointer; box-shadow:3px 3px 0 var(--ink, #26271c); color:var(--ink, #26271c);
          transition:transform .12s ease, box-shadow .12s ease, background .12s ease; }
        .gnav-burger:hover{ background:var(--lime, #C2F47E); }
        .gnav-burger:active{ transform:translate(2px,2px); box-shadow:0 0 0 var(--ink, #26271c); }

        .gnav-scrim{ position:fixed; inset:0; z-index:1055; background:rgba(26,26,26,.42); backdrop-filter:blur(2px); }
        .gnav-drawer{ position:fixed; top:0; right:0; bottom:0; z-index:1060; width:min(84vw,330px); display:flex; flex-direction:column;
          gap:14px; padding:24px 20px; overflow-y:auto; background:var(--cream, #FFF6EC); border-left:2.5px solid var(--ink, #26271c);
          box-shadow:-10px 0 0 rgba(26,26,26,.12); color:var(--ink, #26271c);
          font-family:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          background-image:radial-gradient(circle at 90% 6%, #FFD1F2 0,transparent 40%),radial-gradient(circle at 10% 96%, #DCF2FF 0,transparent 42%); }

        .gnav-status{ background:var(--paper, #FFFDFA); border:2.5px solid var(--ink, #26271c); border-radius:16px; box-shadow:3px 3px 0 var(--ink, #26271c);
          padding:16px 18px; display:flex; flex-direction:column; gap:3px; }
        .gnav-status.is-in{ background:var(--lime, #C2F47E); }
        .gnav-status strong{ font-size:18px; line-height:1.2; }
        .gnav-status small{ font-size:12px; color:var(--ink2, #5c5a4b); }
        .gnav-hi{ display:inline-flex; align-items:center; gap:8px; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink2, #5c5a4b); }
        .gnav-livedot{ width:9px; height:9px; border-radius:999px; background:var(--coral, #FF8A8A); display:inline-block; }

        .gnav-dnav{ display:flex; flex-direction:column; gap:9px; }
        .gnav-dlink{ padding:13px 16px; border:2px solid var(--ink, #26271c); border-radius:12px; background:var(--paper, #FFFDFA); font-weight:700; font-size:15px;
          box-shadow:3px 3px 0 var(--ink, #26271c); text-decoration:none; color:var(--ink, #26271c); }
        .gnav-dlink:hover{ background:var(--pink, #FF9CE9); }
        .gnav-dlink.is-active{ background:var(--pink, #FF9CE9); }

        .gnav-auth{ margin-top:auto; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:16px 24px;
          border:2.5px solid var(--ink, #26271c); border-radius:16px; font-weight:800; font-size:16px; box-shadow:5px 5px 0 var(--ink, #26271c);
          cursor:pointer; color:var(--ink, #26271c); font-family:inherit; }
        .gnav-auth--ink{ background:var(--ink, #26271c); color:var(--cream, #FFF6EC); }
        .gnav-auth--coral{ background:var(--coral, #FF8A8A); }

        /* desktop auth (shown by default; each page hides it at its mobile breakpoint) */
        .gnav-auth-d{ display:flex; align-items:center; gap:10px; }
        .gnav-userd{ display:flex; align-items:center; gap:10px; }
        /* one cohesive stamped chip (avatar monogram + name) instead of bare floating
           text — reads as a deliberate element and balances the logout stamp. */
        .gnav-userd__chip{ display:inline-flex; align-items:center; gap:9px; max-width:210px;
          padding:5px 15px 5px 5px; border:2.5px solid var(--ink, #26271c); border-radius:999px;
          background:var(--paper, #FFFDFA); box-shadow:3px 3px 0 var(--ink, #26271c); }
        .gnav-userd__ava{ width:28px; height:28px; flex-shrink:0; border-radius:999px; display:grid; place-items:center;
          background:var(--pink, #FF9CE9); border:2px solid var(--ink, #26271c); font-weight:800; font-size:13px; line-height:1; color:var(--ink, #26271c); }
        .gnav-userd__name{ font-weight:700; font-size:14px; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--ink, #26271c); }
        .gnav-dbtn{ display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border:2.5px solid var(--ink, #26271c); border-radius:13px;
          background:var(--paper, #FFFDFA); color:var(--ink, #26271c); font-weight:700; font-size:14px; box-shadow:3px 3px 0 var(--ink, #26271c); cursor:pointer; white-space:nowrap;
          font-family:inherit; transition:transform .12s ease, box-shadow .12s ease; }
        .gnav-dbtn:hover{ transform:translate(-2px,-2px); box-shadow:5px 5px 0 var(--ink, #26271c); }
        /* compact icon-only logout — square stamp (matches the burger''s language),
           kills the long "ออกจากระบบ" text that made the desktop bar cluttered. */
        .gnav-dbtn--icon{ width:44px; height:44px; padding:0; justify-content:center; flex-shrink:0; }
        .gnav-dbtn--ink{ background:var(--ink, #26271c); color:var(--cream, #FFF6EC); }
      `}</style>
    </>
  );
}
