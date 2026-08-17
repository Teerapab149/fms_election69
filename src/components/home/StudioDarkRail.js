"use client";

// StudioDarkRail — the persistent left-rail app shell for the Studio Dark v2
// template. THIS is the template's signature layout move (a 240px fixed rail
// replacing the top navbar). Built as its own component so every studio-dark
// page (home today, candidates/vote/results/party next) reuses it verbatim
// instead of re-implementing nav per page (the fragmentation gumroad hit).
//
// Faithful to docs/design-refs/Studio Dark v2.html + studio-v2.css (.rail*):
// brand → numbered section nav (status dots fill up to the active page) →
// live countdown card → sign-in / user pill footer. Below 1100px the rail
// hides and a compact sticky top bar (brand + scrollable mini-nav + auth)
// takes over (the prototype just hid the rail; we add the mobile fallback so
// phones aren't nav-less).
//
// Identity (hairlines, lime accent, Geist/Instrument Serif/Geist Mono) is
// hardcoded here per Rule 9 — these are studio-dark's tokens, not the default
// variant's. editorMode renders statically (no real nav / signIn) per P-LOG-002.

import { getPath } from "../../utils/basePath";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { resolveElectionDates } from "../../utils/electionConfig";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { StudioDarkBaseStyles } from "./StudioDarkTheme";

const NAV = [
  // NOTE: no "Profile / ข้อมูลพรรค" item — a party's detail page is reached
  // THROUGH Candidates (pick a party → its profile; single-party → auto-redirect),
  // so it's a sub-page, not a top-level section. StudioDarkParty highlights
  // Candidates (or Vote) in the rail instead of being its own entry.
  { key: "home",       num: "01", label: "Home",       th: "หน้าหลัก",   href: "/" },
  { key: "candidates", num: "02", label: "Candidates", th: "ผู้สมัคร",    href: "/candidates" },
  { key: "vote",       num: "03", label: "Vote",       th: "ลงคะแนน",     href: "/vote" },
  { key: "results",    num: "04", label: "Returns",    th: "ผลคะแนน",     href: "/results" },
];

export default function StudioDarkRail({ active = "home", editorMode = false, systemMode = "AUTO", onSignIn = null }) {
  const globalConfig = useGlobalConfig();
  const { data: session, status } = useSession();

  // Loop-safe countdown (memoized dates + 1s interval), mirroring the proven
  // hero-countdown pattern (QA fix 7086f21 — new Date() in deps caused a render loop).
  const { ELECTION_START, ELECTION_END } = useMemo(
    () => resolveElectionDates(globalConfig),
    [globalConfig?.campaignStartAt, globalConfig?.electionStartAt, globalConfig?.electionEndAt]
  );
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, label: "POLLS OPEN IN", live: false });
  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      let diff, label, live = false;
      if (systemMode === "PAUSE") { label = "PAUSED"; diff = 0; }
      else if (systemMode === "ENDED") { label = "POLLS CLOSED"; diff = 0; }
      else if (systemMode === "MANUAL_OPEN") { label = "POLLS CLOSE"; diff = ELECTION_END - now; live = true; }
      else if (now < ELECTION_START) { label = "POLLS OPEN IN"; diff = ELECTION_START - now; }
      else if (now < ELECTION_END) { label = "POLLS CLOSE"; diff = ELECTION_END - now; live = true; }
      else { label = "POLLS CLOSED"; diff = 0; }
      // Force-open (MANUAL_OPEN) with no future close date → a zeroed countdown
      // reads as "broken". Show a live "open" line instead of 00:00:00:00.
      const noTimer = systemMode === "MANUAL_OPEN" && diff <= 0;
      setT(diff > 0
        ? { d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24), m: Math.floor((diff / 60000) % 60), s: Math.floor((diff / 1000) % 60), label, live, noTimer: false }
        : { d: 0, h: 0, m: 0, s: 0, label: noTimer ? "POLLS OPEN" : label, live, noTimer });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [ELECTION_START, ELECTION_END, systemMode]);

  const pad = (n) => String(n).padStart(2, "0");

  const logoSrc = getPath("/images/logo/FMS_Standard_Logo_PNG.png");

  const activeIdx = NAV.findIndex((n) => n.key === active);

  const isAuthed = !editorMode && status === "authenticated" && !!session?.user;
  const userName = session?.user?.name || "";
  const userId = session?.user?.studentId || "";
  const avatarChar = (userName || "T").trim().charAt(0).toUpperCase();

  const linkHref = (href) => (editorMode ? undefined : getPath(href));
  const doSignIn = () => {
    if (editorMode) return;
    // Optional sign-in override (playground) instead of next-auth signIn().
    if (onSignIn) { onSignIn(); return; }
    signIn("authentik", { callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/vote" });
  };
  // Match the canonical logout flow (Navbar.js): clear the local NextAuth
  // session, then federated PSU SSO end-session so the IdP cookie is cleared too.
  const doSignOut = async () => {
    if (editorMode) return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const returnUrl = `${window.location.origin}${basePath}`;
    let psuLogoutUrl = `https://psusso.psu.ac.th/application/o/fms-ovs/end-session/?post_logout_redirect_uri=${encodeURIComponent(returnUrl)}`;
    if (session?.id_token) psuLogoutUrl += `&id_token_hint=${session.id_token}`;
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    window.location.href = psuLogoutUrl;
  };

  const NavLinks = ({ mini = false }) =>
    NAV.map((n, i) => {
      const on = i <= activeIdx;
      return (
        <a
          key={n.key}
          href={linkHref(n.href)}
          className={`${mini ? "sd-mininav__link" : "sd-rail__link"}${n.key === active ? " is-active" : ""}`}
        >
          <span className={mini ? "sd-mininav__num" : "sd-rail__link-num"}>{n.num}</span>
          <span className={mini ? "sd-mininav__label" : "sd-rail__link-label"}>
            {n.label}
            {/* Thai sub-label escapes JetBrains Mono via .sd-thai (sd-T1b) — on a
                NESTED span, because `.sd-rail__link-label small` (0,1,1) outranks
                the bare `.sd-thai` class (0,1,0) if put on <small> itself. The
                class is defined by both rail consumers: StudioDarkShell (inner
                pages) and StudioDarkHome (home) — cf7bb24. */}
            {!mini && <small><span className="sd-thai">{n.th}</span></small>}
          </span>
          {!mini && <span className={`sd-rail__link-status${on ? " on" : ""}`} />}
        </a>
      );
    });

  const AuthBlock = ({ compact = false }) =>
    isAuthed ? (
      // The card itself is NOT clickable — only the explicit logout button signs
      // out (owner feedback: clicking the name shouldn't drop the session).
      <div className={compact ? "sd-auth-pill" : "sd-rail__user"}>
        <span className="sd-rail__avatar">{avatarChar}</span>
        {!compact && (
          <span className="sd-rail__user-info">
            <span className="sd-rail__user-name">{userName}</span>
            {userId && <span className="sd-rail__user-id">{userId}</span>}
          </span>
        )}
        <button
          type="button"
          onClick={doSignOut}
          className="sd-rail__logout-btn"
          title="ออกจากระบบ · Sign out"
          aria-label="ออกจากระบบ"
        >
          <LogOut size={15} strokeWidth={2} />
        </button>
      </div>
    ) : (
      <button type="button" onClick={doSignIn} className={compact ? "sd-signin sd-signin--compact" : "sd-signin"}>
        เข้าสู่ระบบ <span aria-hidden>→</span>
      </button>
    );

  return (
    <>
      {/* Dark browser canvas for real studio pages (no white frame at the edges /
          on overscroll; color-scheme:dark darkens the scrollbar). Gated on
          !editorMode so it does NOT leak into the admin editor when the studio
          home is previewed inline there — that leak turned the admin's native
          form controls (the colour-picker hex inputs) dark. */}
      {!editorMode && <style>{"html,body{background:var(--sd-bg,#14140F);color-scheme:dark}"}</style>}
      <StudioDarkBaseStyles />

      {/* ── MOBILE TOP BAR (rail hidden <1100px) ── */}
      {/* Source order: the top bar comes FIRST so that below 1100px — where the
          rail collapses to the countdown-only strip (see the media query) — the
          strip lands under the bar instead of above it. Desktop is unaffected by
          the order: there .sd-rail is position:fixed (out of flow) and
          .sd-topbar is display:none, so neither one lays the other out.
          Verified: at 1440x860 docH stayed 860, leaf count 138, and every
          landmark rect identical before/after. */}
      <header className="sd-topbar">
        <div className="sd-topbar__row">
          <a href={linkHref("/")} className="sd-topbar__brand">
            <span className="sd-rail__logo sd-rail__logo--sm">
              <Image src={logoSrc} alt="FMS PSU" width={1200} height={384} className="sd-rail__logo-img" priority />
            </span>
          </a>
          <AuthBlock compact />
        </div>
        <nav className="sd-mininav">
          <NavLinks mini />
        </nav>
      </header>

      {/* ── DESKTOP LEFT RAIL ── */}
      <aside className="sd-rail">
        <a href={linkHref("/")} className="sd-rail__brand">
          <span className="sd-rail__logo">
            <Image src={logoSrc} alt="FMS PSU" width={1200} height={384} className="sd-rail__logo-img" priority />
          </span>
        </a>

        <div className="sd-rail__section">Sections</div>
        <nav className="sd-rail__nav">
          <NavLinks />
        </nav>

        <div className="sd-rail__spacer" />

        <div className="sd-rail__cd">
          <div className="sd-rail__cd-lbl">{t.live && <span className="sd-dot" />}{t.label}</div>
          {t.noTimer ? (
            <div className="sd-rail__cd-live">เปิดรับลงคะแนนอยู่</div>
          ) : (
            <div className="sd-rail__cd-grid">
              {[{ n: t.d, u: "DAYS" }, { n: t.h, u: "HRS" }, { n: t.m, u: "MIN" }, { n: t.s, u: "SEC" }].map((c, i) => (
                <div className="sd-rail__cd-cell" key={i}>
                  <div className="sd-rail__cd-num">{pad(c.n)}</div>
                  <div className="sd-rail__cd-unit">{c.u}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sd-rail__footer">
          <AuthBlock />
        </div>
      </aside>

      <style jsx global>{`
        .sd-rail, .sd-topbar {
          --sd-bg:#14140F; --sd-bg-2:#1B1B14; --sd-bg-3:#232319; --sd-bg-rail:#111108;
          --sd-line:#2E2E22; --sd-line-strong:#3E3E2D;
          --sd-ink:#F2EDDF; --sd-ink-2:#B5B0A2; --sd-ink-3:#7F7A6E; --sd-ink-4:#555142;
          --sd-accent:#D5FF3F;
          --sd-sans:var(--font-studio-sans),'Inter',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --sd-serif:var(--font-instrument-serif),'Instrument Serif','Times New Roman',serif;
          --sd-mono:var(--font-studio-mono),'JetBrains Mono',ui-monospace,monospace;
        }

        /* ===== DESKTOP RAIL ===== */
        .sd-rail {
          position:fixed; top:0; left:0; width:240px; height:100vh;
          background:var(--sd-bg-rail); border-right:1px solid var(--sd-line);
          display:flex; flex-direction:column; z-index:40; padding:24px 0;
          color:var(--sd-ink);
        }
        .sd-rail a { text-decoration:none; color:inherit; }
        .sd-rail__brand { padding:0 20px 22px; border-bottom:1px solid var(--sd-line); display:flex; }
        /* PSU wordmark sits in a warm off-white chip so the navy logo reads on the
           dark rail (matches the other navbars' real PSU image, adapted for dark). */
        .sd-rail__logo { display:inline-flex; align-items:center; justify-content:center; width:100%; background:var(--sd-ink); border-radius:12px; padding:11px 14px; }
        .sd-rail__logo-img { width:auto; height:34px; object-fit:contain; }
        .sd-rail__logo--sm { width:auto; padding:7px 11px; }
        .sd-rail__logo--sm .sd-rail__logo-img { height:24px; }

        .sd-rail__section { padding:22px 24px 12px; font-family:var(--sd-mono); font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:var(--sd-ink-3); }
        .sd-rail__nav { display:flex; flex-direction:column; padding:0 12px; gap:2px; }
        .sd-rail__link {
          display:grid; grid-template-columns:28px 1fr auto; align-items:center; gap:12px;
          padding:10px 14px; border-radius:10px; color:var(--sd-ink-2); position:relative;
          transition:background .2s, color .2s;
        }
        .sd-rail__link:hover { background:var(--sd-bg-2); color:var(--sd-ink); }
        .sd-rail__link.is-active { background:var(--sd-bg-2); color:var(--sd-ink); }
        .sd-rail__link.is-active::before { content:""; position:absolute; left:-12px; top:16px; bottom:16px; width:2px; background:var(--sd-accent); }
        .sd-rail__link-num { font-family:var(--sd-serif); font-style:italic; font-size:18px; color:var(--sd-ink-3); line-height:1; }
        .sd-rail__link.is-active .sd-rail__link-num { color:var(--sd-accent); }
        .sd-rail__link-label { font-family:var(--sd-sans); font-size:14px; font-weight:500; letter-spacing:-.005em; }
        /* ink-2, not ink-4: this line is the Thai name of the nav item (หน้าหลัก /
           ผู้สมัคร / ลงคะแนน / ผลคะแนน) — for a Thai reader it IS the label, and
           ink-4 is the family's "faintest / disabled" token, which measured 2.2:1
           on the rail at 10px. ink-2 gives ~8.6:1 and still sits below the English
           line in weight. */
        .sd-rail__link-label small { display:block; font-family:var(--sd-mono); font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--sd-ink-2); font-weight:400; margin-top:2px; }
        .sd-rail__link-status { width:6px; height:6px; border-radius:999px; background:var(--sd-ink-4); }
        .sd-rail__link-status.on { background:var(--sd-accent); box-shadow:0 0 0 2px rgba(213,255,63,.15); }

        .sd-rail__spacer { flex:1; }

        .sd-rail__cd { margin:0 16px 16px; padding:15px 16px; border:1px solid var(--sd-line); border-radius:14px; background:var(--sd-bg-2); }
        /* ink-2, not ink-3 — same call as the rail's Thai nav labels (d49b231).
           ink-3 on the RAISED panel (--sd-bg-2, not the page ground) measured
           4.05:1 at 10px, the worst reading in the family and the only ink-3 left
           inside this box: .sd-rail__cd-unit right below it is the same 10px mono
           and is already ink-2 (7.89:1). This line names WHICH clock is running
           ("POLLS OPEN IN" / "POLLS CLOSE IN") — losing it loses the numbers' meaning. */
        .sd-rail__cd-lbl { font-family:var(--sd-mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-2); display:flex; align-items:center; gap:8px; }
        .sd-rail__cd-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-top:13px; }
        .sd-rail__cd-cell { text-align:center; }
        .sd-rail__cd-num { font-family:var(--sd-sans); font-weight:500; font-size:23px; line-height:1; letter-spacing:-.02em; color:var(--sd-ink); font-variant-numeric:tabular-nums; }
        .sd-rail__cd-unit { font-family:var(--sd-mono); font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--sd-ink-2); margin-top:6px; }
        .sd-rail__cd-live { margin-top:13px; font-family:var(--sd-sans); font-size:15px; font-weight:500; color:var(--sd-accent); letter-spacing:-.01em; }
        .sd-dot { width:6px; height:6px; border-radius:999px; background:var(--sd-accent); box-shadow:0 0 0 0 rgba(213,255,63,.6); animation:sdDotPulse 1.8s ease-out infinite; }
        @keyframes sdDotPulse { 0%{box-shadow:0 0 0 0 rgba(213,255,63,.6)} 70%{box-shadow:0 0 0 8px rgba(213,255,63,0)} 100%{box-shadow:0 0 0 0 rgba(213,255,63,0)} }

        .sd-rail__footer { margin:0 16px; padding-top:12px; border-top:1px solid var(--sd-line); }
        .sd-rail__user { display:flex; align-items:center; gap:12px; padding:6px 2px; }
        .sd-rail__avatar { width:32px; height:32px; border-radius:999px; background:var(--sd-ink); color:var(--sd-bg); display:grid; place-items:center; font-family:var(--sd-sans); font-weight:600; font-size:13px; flex-shrink:0; }
        .sd-rail__user-info { min-width:0; line-height:1.2; flex:1; }
        .sd-rail__user-name { font-family:var(--sd-sans); font-size:13px; color:var(--sd-ink); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block; }
        .sd-rail__user-id { font-family:var(--sd-sans); font-size:11px; color:var(--sd-ink-3); letter-spacing:.01em; font-variant-numeric:tabular-nums; margin-top:2px; display:block; }
        /* explicit logout button — the ONLY logout affordance */
        .sd-rail__logout-btn {
          flex-shrink:0; width:30px; height:30px; display:grid; place-items:center;
          border-radius:8px; background:none; border:1px solid var(--sd-line);
          color:var(--sd-ink-3); cursor:pointer; transition:background .2s, border-color .2s, color .2s;
        }
        .sd-rail__logout-btn:hover, .sd-rail__logout-btn:focus-visible { background:var(--sd-accent); border-color:var(--sd-accent); color:var(--sd-bg); outline:none; }
        .sd-signin {
          width:100%; display:flex; justify-content:center; align-items:center; gap:10px;
          padding:12px 14px; background:var(--sd-accent); color:var(--sd-bg); border:0; border-radius:10px;
          font-family:var(--sd-sans); font-weight:600; font-size:13px; cursor:pointer;
          touch-action:manipulation; -webkit-tap-highlight-color:transparent;
          transition:background .15s ease, transform .12s ease;
        }
        /* hover only where a pointer can actually hover — on a touch screen the
           :hover state latches after a tap and the button stays inverted until
           something else is touched, which reads as a stuck/broken control */
        @media (hover:hover) { .sd-signin:hover { background:var(--sd-ink); } }
        .sd-signin:active { background:var(--sd-ink); transform:scale(.97); }

        /* ===== MOBILE TOP BAR (hidden on desktop) ===== */
        .sd-topbar { display:none; }
        @media (max-width:1100px) {
          /* The countdown exists ONCE in the whole family — here, in the rail
             (.sd-rail__cd) — so hiding the whole rail below 1100px left phones,
             tablets and 1024 laptops with NO clock anywhere, on any page, at any
             scroll position: body.innerText read DAYS=false HRS=false SEC=false
             at 1024/768/412 while 1440 read "POLLS OPEN IN 23 DAYS 09 HRS".
             Duplicating the markup into .sd-topbar would mean two DOM copies (a
             screen reader announcing the clock twice) and a second setInterval,
             so the rail instead COLLAPSES into a countdown-only strip: the same
             single node, siblings hidden, relaid as one 36px row under the top
             bar. Cost, measured on home at 412x880: docH 1315 -> 1351, so
             everything below shifts down 35-36px — the sign-in CTA (y 467 ->
             502) and the "ดูรายชื่อพรรค" link (y 562 -> 597) both stay well
             inside the first screen. Desktop is untouched at 1101/1280/1366/
             1440: same docH, same leaf count, and every rect identical (the
             inner pages diff to ZERO changed rows; home differs only in the
             marquee's x, which is a framer animation phase, not layout). */
          .sd-rail {
            display:block; position:static; width:auto; height:auto;
            padding:0; background:transparent; border-right:0;
          }
          .sd-rail__brand, .sd-rail__section, .sd-rail__nav,
          .sd-rail__spacer, .sd-rail__footer { display:none; }
          .sd-rail__cd {
            margin:0; padding:8px 20px; border:0; border-radius:0;
            border-bottom:1px solid var(--sd-line);
            display:flex; align-items:center; justify-content:space-between; gap:12px;
          }
          .sd-rail__cd-lbl { font-size:9px; letter-spacing:.14em; gap:6px; flex-shrink:0; }
          .sd-rail__cd-grid { display:flex; gap:12px; margin-top:0; }
          .sd-rail__cd-cell { display:flex; align-items:baseline; gap:4px; }
          .sd-rail__cd-num { font-size:16px; }
          .sd-rail__cd-unit { font-size:9px; letter-spacing:.06em; margin-top:0; }
          .sd-rail__cd-live { margin-top:0; font-size:13px; }
          .sd-topbar {
            display:block; position:sticky; top:0; z-index:40;
            /* solid, not blurred. This bar is sticky, so a backdrop-filter makes
               the GPU re-blur whatever passes behind it on every scroll frame —
               the single most expensive thing on this page on a phone. At .92
               opacity the blur was contributing almost nothing visually, so the
               fill is simply opaque here and the blur stays on desktop, where it
               is affordable and actually reads. */
            background:#111108;
            border-bottom:1px solid var(--sd-line); color:var(--sd-ink);
          }
          .sd-topbar a { text-decoration:none; color:inherit; }
          .sd-topbar__row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 20px; }
          .sd-topbar__brand { display:flex; align-items:center; gap:10px; }
          .sd-topbar__brand strong { font-family:var(--sd-mono); font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--sd-ink); }
          .sd-signin--compact { width:auto; padding:9px 16px; }
          .sd-auth-pill { display:flex; align-items:center; gap:10px; }
          /* THE mobile-nav delay. This strip overflowed by just 20px at 412
             (scrollWidth 413 vs clientWidth 393), which made it a horizontal
             scroll container — and inside one, a touch has to be disambiguated
             as tap-or-drag before the click is dispatched. That wait is the lag,
             and it is unique to this family: no other mobile nav is a scroller.
             Overflowing by 20px bought nothing and cost the delay on every item.
             Tighter gutters and gaps make all four fit, so the strip stops being
             a scroller; overflow-x stays auto purely as a fallback for very
             narrow phones, where it only engages if it genuinely overflows. */
          .sd-mininav { display:flex; gap:4px; overflow-x:auto; padding:0 12px 12px; -webkit-overflow-scrolling:touch; }
          .sd-mininav::-webkit-scrollbar { display:none; }
          /* The mini nav had no pressed state at all: no :active, no transition,
             and the browser's default tap highlight is a grey wash that the dark
             ground swallows. Tapping therefore looked like nothing happened until
             the next route painted — which reads as lag even when it is not.
             touch-action:manipulation drops the double-tap-zoom wait; the tap
             highlight is replaced by a state we control. */
          .sd-mininav__link {
            display:inline-flex; align-items:center; gap:7px; flex-shrink:0;
            padding:9px 11px; border:1px solid var(--sd-line); border-radius:999px;
            font-family:var(--sd-sans); font-size:13px; color:var(--sd-ink-2);
            touch-action:manipulation; -webkit-tap-highlight-color:transparent;
            transition:background .12s ease, border-color .12s ease, color .12s ease, transform .12s ease;
          }
          .sd-mininav__link:active {
            background:var(--sd-bg-3); border-color:var(--sd-line-strong);
            color:var(--sd-ink); transform:scale(.96);
          }
          .sd-mininav__link.is-active { border-color:var(--sd-accent); color:var(--sd-ink); }
          /* At 360 the strip still ran 383 against 360 and stayed a scroller — so
             the smallest phones kept the tap-vs-drag delay the tighter gutters
             fixed everywhere else. The numeral is decorative (the label carries
             the meaning), and dropping it below 380 reclaims ~20px per item, far
             more than the 23 needed. It stays on every other width. */
          @media (max-width:380px) {
            .sd-mininav__num { display:none; }
            .sd-mininav__link { gap:0; }
          }
          .sd-mininav__num { font-family:var(--sd-serif); font-style:italic; font-size:13px; color:var(--sd-ink-3); }
          .sd-mininav__link.is-active .sd-mininav__num { color:var(--sd-accent); }
        }
      `}</style>
    </>
  );
}
