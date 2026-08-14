"use client";

// FmsOfficialChrome — shared shell for the "FMS Official" template family.
//
// This family exists for ONE reason the other nine do not serve: institutional
// trust. Its whole visual system is lifted from the faculty's own site
// (fms.psu.ac.th) so a student landing here recognises it as the faculty's
// system before reading a word — a plum utility strip pinned above a white
// header, the PSU/FMS lockup at top-left, section headings underlined by a thin
// brand rule, restrained plum on white.
//
// What is deliberately NOT taken from that site: its layout. fms.psu.ac.th is a
// news PORTAL (carousel, tab stacks, card grids, dense sections) and a portal
// shape is wrong for a ballot — this page has one job, which is to move a
// student to /vote. So: brand layer borrowed, information architecture ours.
//
// PARITY RULE (same as gumroad/verdure/original): every colour derives from the
// FMS_OFFICIAL ramp in utils/fmsOfficialPalette.js — a PLAIN module, because
// templates/builtIn/fms-official.js reads the same ramp and that file is
// resolved on the server (layout.js getThemeTokenCss). A "use client" palette
// would drag next-auth into the server graph.

import { useState, useEffect, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, Power } from "lucide-react";
import { getPath } from "../../utils/basePath";
import { useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import { FMS_OFFICIAL, FMS_OFFICIAL_THEMES, fmsOfficialTheme } from "../../utils/fmsOfficialPalette";

export { FMS_OFFICIAL, FMS_OFFICIAL_THEMES, fmsOfficialTheme };

const LOGO_SRC = "/images/logo/FMS_Standard_Logo_PNG.png";

const NAV = [
  { key: "home",       th: "หน้าแรก",  href: "/" },
  { key: "candidates", th: "ผู้สมัคร",  href: "/candidates" },
  { key: "vote",       th: "ลงคะแนน",  href: "/vote" },
  { key: "results",    th: "ผลคะแนน",  href: "/results" },
];

// ── meta ──
// Every year/number/name string on the page comes from globalConfig through
// here. Nothing year-locked may be hardcoded in the layout (same contract as
// verdureMeta) — that is what lets staff roll the site to a new year from the
// admin console without a developer.
// The key names here were wrong on the first pass: `facultyNameTh` and
// `universityNameTh` do not exist in globalConfig, so every string below silently
// fell back to its hardcoded default. Staff could rename the faculty in the admin
// console, watch every other template update, and see this one refuse — a bug that
// looks like the template ignoring the database, because that is what it was.
// The real keys, confirmed against the live row:
//   facultyName "คณะวิทยาการจัดการ" · university "PSU" · facultyShortEn "FMS"
//   organizationName · organizationShort · committeeName · copyrightYear
//   electionNumber · electionNamePrefix · academicYearTh · electionCalendarYear
export function fmsMeta(gc = {}) {
  const num =
    Number(gc.electionNumber) ||
    parseInt(String(gc.electionName || "").match(/\d+/)?.[0], 10) ||
    50;
  const prefix = gc.electionNamePrefix || "SAMO";
  const ay = String(gc.academicYearTh ?? 2569);
  const cy = String(gc.electionCalendarYear ?? 2026);
  return {
    num,
    prefix,
    wordmark: `${prefix} ${num}`,
    ay,
    cy,
    faculty: gc.facultyName || "คณะวิทยาการจัดการ",
    // globalConfig has no Thai university name — `university` holds the short code
    // ("PSU"), which the other families use for compact marks like "© FMS@PSU".
    // Owner's call: keep the Thai full name as a constant here rather than add a
    // schema field that only this template would ever read.
    university: "มหาวิทยาลัยสงขลานครินทร์",
    universityShort: gc.university || "PSU",
    facultyShort: gc.facultyShortEn || "FMS",
    org: gc.organizationName || "สโมสรนักศึกษาคณะวิทยาการจัดการ",
    campaign: gc.campaignTitle || "การเลือกตั้งคณะกรรมการบริหารสโมสรนักศึกษา",
    // copyrightYear is a SEPARATE admin field from electionCalendarYear on
    // purpose; the footer is the one place that must use it (every other family
    // already does).
    copyrightYear: String(gc.copyrightYear ?? gc.electionCalendarYear ?? 2026),
    // Empty on purpose when unset — no poster beats a stale one. There is NO
    // hardcoded fallback here (unlike classic/blossom, which keep theirs so this
    // change cannot alter what they render today): the shipped default carried
    // last year's polling date, and the whole point of the field is that the
    // faculty stops publishing a wrong date it cannot edit.
    bannerUrl: (gc.electionBannerUrl || "").trim(),
    systemName: "ระบบเลือกตั้งออนไลน์",
  };
}

export function fmsOfficialSignIn() {
  signIn("authentik", {
    callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs") + "/vote",
  });
}

// Signing out of THIS app is not enough: the PSU SSO session outlives it, so the
// next sign-in would silently re-authenticate the same person. Clear the local
// session first, then hand off to the IdP's end-session endpoint (same sequence
// every other family uses — a voter must be able to actually hand the laptop to
// the next person in the queue).
function fmsOfficialSignOut(session) {
  const bp = process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs";
  const ret = `${window.location.origin}${bp}`;
  let url = `https://psusso.psu.ac.th/application/o/fms-ovs/end-session/?post_logout_redirect_uri=${encodeURIComponent(ret)}`;
  if (session?.id_token) url += `&id_token_hint=${session.id_token}`;
  signOut({ redirect: false }).finally(() => { window.location.href = url; });
}

// ── auth area of the header ──
// Signed out → one plum "เข้าสู่ระบบ" button. Signed in → avatar initial + given
// name + a sign-out control. Not decoration: a shared campus PC is the normal
// case here, and a voter who cannot see WHOSE session they are in can cast their
// ballot into someone else's account. The name is the check.
function FmsOfficialAuth({ editorMode }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click and on Escape. Without this the menu could only be
  // dismissed by hitting the chip again — on a phone, where the menu covers what
  // the user is trying to tap, that reads as a stuck overlay.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isAuthed = !editorMode && status === "authenticated" && !!session?.user;
  const name = (session?.user?.name || "").trim();
  const studentId = session?.user?.studentId || "";
  const initial = (name || "ผ").charAt(0).toUpperCase();

  if (!isAuthed) {
    return (
      <button
        type="button"
        className="fo-auth__in"
        onClick={editorMode ? undefined : () => fmsOfficialSignIn()}
      >
        <LogIn size={15} aria-hidden /> เข้าสู่ระบบ
      </button>
    );
  }

  return (
    <div className={`fo-auth ${open ? "is-open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="fo-auth__chip"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`บัญชีของ ${name}`}
      >
        <span className="fo-auth__av" aria-hidden>{initial}</span>
        {/* given name only — Thai full names overflow the bar, and the first name
            is what a voter recognises as "me" at a glance */}
        <span className="fo-auth__name">{name.split(" ")[0] || name}</span>
      </button>

      {open && (
        <div className="fo-auth__menu" role="menu">
          <div className="fo-auth__who">
            <b>{name}</b>
            {studentId && <span>รหัส {studentId}</span>}
          </div>
          <button
            type="button"
            role="menuitem"
            className="fo-auth__out"
            onClick={editorMode ? undefined : () => fmsOfficialSignOut(session)}
          >
            <Power size={15} aria-hidden /> ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}

// Status shown in the top strip. Mirrors the labels the voteCTA state machine
// uses so the strip can never contradict the button below it.
const STATUS = {
  login:    { th: "เปิดรับลงคะแนน",       tone: "open"   },
  notVoted: { th: "เปิดรับลงคะแนน",       tone: "open"   },
  voted:    { th: "คุณลงคะแนนแล้ว",       tone: "done"   },
  closed:   { th: "ยังไม่เปิดรับลงคะแนน",  tone: "shut"   },
  paused:   { th: "หยุดให้บริการชั่วคราว", tone: "shut"   },
  ended:    { th: "ปิดการลงคะแนนแล้ว",    tone: "shut"   },
};

// ── the plum strip + white header ──
// voteState = null renders the strip WITHOUT the status pill. The inner pages
// (candidates, party, results…) have no ballot state to report, and a pill that
// silently defaulted to "เปิดรับลงคะแนน" there would be a false claim on a page
// that never checked.
export function FmsOfficialHeader({ active = "home", meta, voteState = "login", editorMode = false }) {
  const st = voteState ? (STATUS[voteState] || STATUS.login) : null;
  return (
    <header className="fo-head">
      <div className="fo-utility">
        <div className="fo-utility__in">
          {/* Two spans, one hidden per breakpoint. At 375 the full string wrapped
              and broke "มหาวิทยาลัยสงขลา / นครินทร์" mid-word — Thai has no spaces
              inside a compound like that, so the browser breaks wherever it must
              and the university's name comes apart. The short form drops the
              university, which the lockup directly below already carries. */}
          <span className="fo-utility__name fo-utility__name--full">
            {meta.systemName} · {meta.faculty} {meta.university}
          </span>
          <span className="fo-utility__name fo-utility__name--short">
            {meta.systemName} · {meta.faculty}
          </span>
          <span className="fo-utility__right">
            <span className="fo-utility__year">ปีการศึกษา {meta.ay}</span>
            {st && (
              <span className={`fo-status fo-status--${st.tone}`}>
                <i aria-hidden />
                {st.th}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="fo-bar">
        <div className="fo-bar__in">
          {/* Logo ONLY. The artwork already sets "คณะวิทยาการจัดการ /
              มหาวิทยาลัยสงขลานครินทร์" beside the PSU wordmark, so a text lockup
              next to it printed the faculty's name twice in one header — which is
              also why the faculty's own header carries the mark alone. */}
          <a href={editorMode ? undefined : getPath("/")} className="fo-lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getPath(LOGO_SRC)} alt="คณะวิทยาการจัดการ มหาวิทยาลัยสงขลานครินทร์" />
          </a>

          {/* nav and auth are SIBLINGS of the lockup, not nested in a wrapper.
              They used to sit inside a .fo-bar__right box, and the phone rule that
              drops the nav to its own row (`flex: 1 0 100%`) then resolved that
              100% against the wrapper instead of the bar — so the box locked to
              its content width (412px) and pushed every page 22–52px wide at
              360–390. Flat siblings make 100% mean the bar, which is the viewport. */}
          <nav className="fo-nav" aria-label="เมนูหลัก">
            {NAV.map((n) => (
              <a
                key={n.key}
                href={editorMode ? undefined : getPath(n.href)}
                className={`fo-nav__a ${active === n.key ? "is-active" : ""}`}
              >
                {n.th}
              </a>
            ))}
          </nav>

          {/* The divider between "where can I go" and "who am I" lives on this
              slot as a ::before rule. It used to be a border-left declared on a
              selector list that included the sign-in BUTTON, so a pale line was
              painted down the left edge of a solid plum button at every width
              ≥861 — not a separator at all. */}
          <div className="fo-authslot">
            <FmsOfficialAuth editorMode={editorMode} />
          </div>
        </div>
      </div>
    </header>
  );
}

// ── footer ──
// Mirrors the faculty footer's structure: charcoal field, the 50th-anniversary
// mark beside the PSU lockup, and a separate darker copyright bar underneath.
export function FmsOfficialFooter({ meta }) {
  return (
    <footer className="fo-foot">
      <div className="fo-foot__in">
        {/* The 50th-anniversary mark is deliberately NOT here. It is true for one
            year and then quietly wrong for the rest of the system's life, and the
            alternative — an upload slot in admin — would mean designing a second
            logo position into all ten templates for an asset used once. Owner's
            call: ship the standard mark alone. */}
        <div className="fo-foot__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="fo-foot__lmain" src={getPath("/images/logo/09_FMS_Short_EN_V_PNG.png")} alt="" aria-hidden />
          <div>
            <b>{meta.faculty}</b>
            <span>{meta.university}</span>
          </div>
        </div>
        <div className="fo-foot__meta">
          <span>{meta.systemName}</span>
          <span>{meta.org}</span>
        </div>
      </div>
      <div className="fo-foot__bar">
        © {meta.facultyShort}@{meta.universityShort} {meta.copyrightYear}. All Rights Reserved.
      </div>
    </footer>
  );
}

// ── base styles ──
// Layer-2 vars for this family. Colour vars reference the resolved ramp (the
// single-source rule) — never a raw hex at a call site, which is what makes the
// whole family recolour from one object.
// `paintBody` also paints the html/body canvas from the resolved ramp. Only the
// LIVE pages want it — the admin/editor preview must never repaint the console
// around it. It lives here rather than in each page so a variant swap cannot
// leave the canvas on the old theme's colour.
export function FmsOfficialBaseStyles({ paintBody = false }) {
  // Which variant is painting. Live = the active template (useActiveTemplateId,
  // SSR-consistent). On /template-preview the previewed fms-official-* slug wins
  // — read from window in an effect, NOT useSearchParams, which would de-opt the
  // build and mismatch hydration. First paint matches SSR, then it re-tints.
  const activeSlug = useActiveTemplateId();
  const [previewSlug, setPreviewSlug] = useState(null);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s && s.startsWith("fms-official")) setPreviewSlug(s);
  }, []);
  const t = fmsOfficialTheme(previewSlug || activeSlug);
  return (
    <style jsx global>{`
      ${paintBody ? `html,body{background:${t.surface};color-scheme:light}` : ""}
      .fo-root {
        --fo-plum-deep: ${t.plumDeep};
        --fo-plum: ${t.plum};
        --fo-foot: ${t.foot};
        --fo-foot-bar: ${t.footBar};
        --fo-brand: ${t.brand};
        --fo-brand-deep: ${t.brandDeep};
        --fo-brand-soft: ${t.brandSoft};
        --fo-tint: ${t.tint};
        --fo-tint-2: ${t.tint2};
        --fo-line: ${t.line};
        --fo-ink: ${t.ink};
        --fo-muted: ${t.muted};
        --fo-surface: ${t.surface};
        --fo-bg: ${t.bg};

        /* Prompt is the closest available match to the geometric loopless Thai
           the faculty site sets its navigation and headings in, and it is
           already loaded in layout.js — no new font dependency. One family,
           weight doing the work: that restraint is what reads as institutional. */
        --fo-font: var(--font-prompt), var(--font-anuphan), sans-serif;

        --fo-max: 1140px;
        font-family: var(--fo-font);
        color: var(--fo-ink);
        background: var(--fo-surface);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      /* :where() so the anchor reset lands at specificity 0,1,0 instead of 0,1,1.
         Written plainly as .fo-root a it OUTRANKED every single-class rule that
         colours a link — the primary button's own color:#fff lost to it and
         rendered dark ink on plum. Any single-class rule now wins, which is what
         a reset is supposed to allow.
         (No backticks in here: this block is a template literal, and one inside a
         CSS comment closes it — that is a build error, not a style bug.) */
      .fo-root :where(a) { text-decoration: none; color: inherit; }
      .fo-root img { max-width: 100%; }

      /* ── top plum strip ── */
      .fo-utility { background: var(--fo-plum); color: #fff; }
      .fo-utility__in {
        max-width: var(--fo-max); margin: 0 auto; padding: 7px 24px;
        display: flex; align-items: center; justify-content: space-between; gap: 16px;
        font-size: 12px; font-weight: 300; letter-spacing: .01em;
      }
      .fo-utility__name { opacity: .92; }
      .fo-utility__name--short { display: none; }
      .fo-utility__right { display: inline-flex; align-items: center; gap: 14px; white-space: nowrap; }
      .fo-utility__year { opacity: .78; }
      .fo-status {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 3px 11px; border-radius: 999px; font-size: 11px; font-weight: 500;
        background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22);
      }
      .fo-status i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: block; }
      .fo-status--open { color: #B9F0C8; }
      .fo-status--done { color: #CFE3FF; }
      .fo-status--shut { color: #F0D2CE; }

      /* ── white header ── */
      .fo-bar {
        background: var(--fo-surface);
        border-bottom: 1px solid var(--fo-line);
        position: sticky; top: 0; z-index: 40;
      }
      /* Three flat children: lockup · nav · authslot. The gap property handles the
         spine so no child needs a margin, which is what lets the phone rule below
         re-order them without unwinding anything. */
      .fo-bar__in {
        max-width: var(--fo-max); margin: 0 auto; padding: 14px 24px;
        display: flex; align-items: center; gap: 18px;
      }
      .fo-lockup { display: inline-flex; align-items: center; gap: 12px; margin-right: auto; }
      .fo-lockup img { height: 38px; width: auto; }

      .fo-nav { display: flex; align-items: center; gap: 4px; min-width: 0; }

      /* ── auth ──
         The divider is a ::before on the SLOT, never a border on the control
         inside it: a border-left on the plum sign-in button drew a pale stroke
         across the button's own edge instead of separating two groups. */
      .fo-authslot { position: relative; display: flex; align-items: center; padding-left: 18px; }
      .fo-authslot::before {
        content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
        width: 1px; height: 26px; background: var(--fo-line);
      }

      .fo-auth__in {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 9px 18px; border-radius: 8px;
        background: var(--fo-brand); color: #fff; border: 1px solid var(--fo-brand);
        font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer;
        transition: background .18s, border-color .18s;
      }
      .fo-auth__in:hover { background: var(--fo-brand-deep); border-color: var(--fo-brand-deep); }

      .fo-auth__chip {
        display: inline-flex; align-items: center; gap: 9px;
        padding: 6px 12px 6px 6px; border-radius: 999px;
        background: var(--fo-tint); border: 1px solid var(--fo-line);
        font-family: inherit; cursor: pointer; max-width: 200px;
        transition: border-color .18s, background .18s;
      }
      .fo-auth__chip:hover { border-color: var(--fo-brand); background: var(--fo-tint-2); }
      .fo-auth__av {
        flex: 0 0 auto; width: 30px; height: 30px; border-radius: 50%;
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--fo-brand); color: #fff; font-size: 14px; font-weight: 600;
      }
      .fo-auth__name {
        font-size: 14px; font-weight: 500; color: var(--fo-ink);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }

      .fo-auth__menu {
        position: absolute; top: calc(100% + 10px); right: 0; z-index: 60; min-width: 226px;
        background: var(--fo-surface); border: 1px solid var(--fo-line); border-radius: 12px;
        box-shadow: 0 18px 40px -22px rgba(36, 30, 40, .55); overflow: hidden;
      }
      .fo-auth__who { padding: 14px 16px; border-bottom: 1px solid var(--fo-line); text-align: left; }
      .fo-auth__who b { display: block; font-size: 14px; font-weight: 500; color: var(--fo-ink); }
      .fo-auth__who span { display: block; margin-top: 3px; font-size: 12.5px; font-weight: 300; color: var(--fo-muted); }
      .fo-auth__out {
        display: flex; align-items: center; gap: 9px; width: 100%;
        padding: 12px 16px; background: none; border: 0; cursor: pointer;
        font-family: inherit; font-size: 14px; font-weight: 400; color: var(--fo-ink);
        transition: background .16s, color .16s;
      }
      .fo-auth__out:hover { background: var(--fo-tint); color: var(--fo-brand); }
      .fo-nav__a {
        position: relative; padding: 8px 14px; border-radius: 6px;
        font-size: 15px; font-weight: 400; color: var(--fo-ink);
        transition: background .18s, color .18s;
      }
      .fo-nav__a:hover { background: var(--fo-tint); color: var(--fo-brand); }
      .fo-nav__a.is-active { color: var(--fo-brand); font-weight: 500; }
      .fo-nav__a.is-active::after {
        content: ""; position: absolute; left: 14px; right: 14px; bottom: 2px;
        height: 2px; border-radius: 2px; background: var(--fo-brand);
      }

      /* ── dot field ──
         Straight off fms.psu.ac.th, where whole sections sit on a fine dot grid.
         It is the answer to "the page is flat" that costs no colour weight: a
         section reads as a DIFFERENT surface from the one above it through
         texture rather than tone. That matters here because the two tones this
         palette has for backgrounds — #F5F4F7 and #FFFFFF — are 2% apart, so
         alternating them alone was invisible, which is exactly what the owner
         reported. Dots against plain white is a difference you can actually see.
         The dot colour is a var so it re-tints with the colour variants. */
      .fo-dots {
        background-image: radial-gradient(circle, var(--fo-line) 1px, transparent 1px);
        background-size: 13px 13px;
        background-position: -1px -1px;
      }

      /* ── centred short rule ──
         The faculty's CENTRED sections put a short dash under the heading rather
         than the full-width rule their left-aligned section heads use. Two
         different motifs for two different alignments — copying only the wide one
         everywhere was why the centred blocks here felt unfinished. */
      .fo-rule {
        display: block; width: 46px; height: 3px; border-radius: 2px;
        background: var(--fo-brand); margin: 16px auto 0;
      }

      /* ── section heading motif ──
         The faculty site's one real signature: a bold left-aligned Thai heading
         with a thin full-width brand rule directly under it ("กิจกรรม/โครงการ",
         "ประชาสัมพันธ์"). Costs nothing and it is what makes a page read as
         belonging to the faculty rather than to a generic product. */
      .fo-sechead { margin-bottom: 22px; }
      .fo-sechead h2 { font-size: 22px; font-weight: 600; color: var(--fo-ink); margin: 0 0 10px; }
      .fo-sechead p { margin: 0 0 10px; font-size: 14px; font-weight: 300; color: var(--fo-muted); }
      .fo-sechead::after { content: ""; display: block; height: 1px; background: var(--fo-brand); opacity: .55; }

      /* ── buttons + countdown cells ──
         Declared HERE, not in a page file: home, vote, closed and success all use
         these class names. They started out in FmsOfficialHome and the inner
         pages rendered them raw — the ballot's submit button was bare text on a
         page whose whole job is that one button. Shared furniture lives in the
         chrome; only a page's own composition stays in the page. */
      .fo-btn {
        display: inline-flex; align-items: center; gap: 9px;
        padding: 14px 28px; border-radius: 8px;
        font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit;
        border: 1px solid transparent;
        transition: background .18s, color .18s, border-color .18s, transform .18s, box-shadow .18s;
      }
      .fo-btn--primary {
        background: var(--fo-brand); color: #fff; border-color: var(--fo-brand);
        box-shadow: 0 10px 24px -14px rgba(110, 31, 103, .8);
      }
      .fo-btn--primary:hover:not(:disabled):not(.is-disabled) {
        background: var(--fo-brand-deep); border-color: var(--fo-brand-deep);
        transform: translateY(-1px); box-shadow: 0 14px 28px -14px rgba(110, 31, 103, .9);
      }
      /* :disabled AND .is-disabled — the ballot uses a real <button disabled>, the
         home CTA uses an <a> that cannot be disabled and carries the class instead */
      .fo-btn--primary:disabled,
      .fo-btn--primary.is-disabled {
        background: var(--fo-tint-2); color: var(--fo-muted);
        border-color: var(--fo-line); box-shadow: none; cursor: not-allowed; transform: none;
      }
      /* outline pill — the faculty site's ป.ตรี / ป.โท treatment */
      .fo-btn--ghost { background: var(--fo-surface); color: var(--fo-ink); border-color: var(--fo-line); }
      .fo-btn--ghost:hover { border-color: var(--fo-brand); color: var(--fo-brand); background: var(--fo-tint); }

      /* completed state — a button-shaped RECEIPT, not a button. Same footprint so
         the row does not reflow when the task is finished, grey so it reads as
         settled rather than pending, cursor default because there is nothing left
         to click. The tick carries the meaning. */
      .fo-btn--done {
        background: var(--fo-bg); color: var(--fo-muted); border-color: var(--fo-line);
        cursor: default; font-weight: 400;
      }
      .fo-btn--done svg { color: #2E7D52; }

      .fo-cd__cell {
        min-width: 84px; padding: 14px 10px 11px; border-radius: 10px;
        background: var(--fo-surface); border: 1px solid var(--fo-line);
        display: flex; flex-direction: column; align-items: center; gap: 3px;
      }
      .fo-cd__cell b {
        font-size: 32px; font-weight: 600; line-height: 1; color: var(--fo-brand);
        font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
      }
      .fo-cd__cell span { font-size: 12px; font-weight: 300; color: var(--fo-muted); }
      .fo-cd__label {
        display: inline-flex; align-items: center; gap: 7px;
        font-size: 13px; font-weight: 400; color: var(--fo-muted);
      }

      /* ── footer ── */
      .fo-foot { margin-top: auto; background: var(--fo-foot); color: #fff; }
      .fo-foot__in {
        max-width: var(--fo-max); margin: 0 auto; padding: 34px 24px;
        display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap;
      }
      .fo-foot__brand { display: inline-flex; align-items: center; gap: 16px; }
      /* The only FMS marks in the repo are dark-on-light colour PNGs, and on the
         charcoal footer field the artwork all but disappeared. brightness(0)
         invert(1) knocks each to a flat white mark — the treatment the faculty's
         own footer uses, and it needs no new asset. */
      .fo-foot__brand img { width: auto; opacity: .92; filter: brightness(0) invert(1); }
      .fo-foot__lmain { height: 46px; }
      .fo-foot__brand div { display: flex; flex-direction: column; line-height: 1.4; }
      .fo-foot__brand b { font-size: 15px; font-weight: 500; }
      .fo-foot__brand span { font-size: 12px; font-weight: 300; opacity: .72; }
      .fo-foot__meta { display: flex; flex-direction: column; gap: 4px; text-align: right; font-size: 12px; font-weight: 300; opacity: .72; }
      .fo-foot__bar {
        background: var(--fo-foot-bar); color: rgba(255,255,255,.62);
        text-align: center; padding: 14px 24px; font-size: 12px; font-weight: 300;
      }

      /* ── tablet and below ── */
      @media (max-width: 860px) {
        .fo-bar__in { padding: 12px 16px; gap: 12px; flex-wrap: wrap; }
        .fo-lockup img { height: 32px; }

        /* Lockup and auth share row one; the nav takes row two in full. Keeping
           all three on one row left the nav scrolling under a fixed chip, so the
           last destination was permanently half-hidden. The flex:1 0 100% basis is safe
           here ONLY because these are now direct children of .fo-bar__in — the
           same declaration inside the old wrapper is what caused the page-wide
           overflow at 360–390. */
        .fo-nav {
          order: 1; flex: 1 0 100%; min-width: 0; overflow-x: auto; gap: 0;
          margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--fo-line);
          -webkit-overflow-scrolling: touch; scrollbar-width: none;
        }
        .fo-nav::-webkit-scrollbar { display: none; }
        .fo-nav__a { padding: 8px 10px; font-size: 14px; white-space: nowrap; }
        .fo-nav__a.is-active::after { left: 10px; right: 10px; }

        /* nav and auth are on separate rows now — a vertical rule between them
           would be separating nothing */
        .fo-authslot { order: 0; padding-left: 0; }
        .fo-authslot::before { display: none; }
        .fo-auth__chip { max-width: 168px; }

        .fo-foot__in { flex-direction: column; align-items: flex-start; padding: 28px 16px; }
        .fo-foot__meta { text-align: left; }
      }

      /* ── phones ──
         The strip collapses to ONE line here. Stacked it stood 53px tall, and
         together with the header and the page plate the chrome ate 330px — 52%
         of a 360×640 screen — before a voter saw a single ballot option. The
         status pill is the half that has to survive: "are the polls open" is live
         information, the system's own name is not. */
      @media (max-width: 620px) {
        .fo-utility__in {
          flex-direction: row; align-items: center; justify-content: space-between;
          gap: 10px; padding: 5px 16px; font-size: 11px;
        }
        .fo-utility__name--full { display: none; }
        .fo-utility__name--short {
          display: block; min-width: 0; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .fo-utility__right { gap: 8px; }
        /* the year is the first thing to go: it is also printed on the page plate
           and in the hero of every page that matters */
        .fo-utility__year { display: none; }
        .fo-status { padding: 2px 9px; font-size: 10.5px; }

        .fo-bar__in { padding: 10px 14px; gap: 10px; }
        .fo-lockup img { height: 28px; }
        .fo-nav { margin-top: 8px; padding-top: 6px; }
        .fo-nav__a { padding: 7px 9px; font-size: 13.5px; }
        .fo-auth__in { padding: 8px 14px; font-size: 13.5px; }
        .fo-auth__chip { max-width: 132px; padding: 5px 10px 5px 5px; }
        .fo-auth__av { width: 26px; height: 26px; font-size: 13px; }
        .fo-auth__name { font-size: 13px; }
      }

      /* ── small phones (360 and under) ──
         The families that shipped before this one tune down to 340–380 (receipt
         has six steps below 520); this template had nothing under 640, which is
         why everything felt slightly too big on a real handset. */
      @media (max-width: 380px) {
        .fo-utility__in { padding: 5px 12px; font-size: 10.5px; }
        .fo-bar__in { padding: 9px 12px; }
        .fo-lockup img { height: 26px; }
        .fo-nav__a { padding: 7px 8px; font-size: 13px; }
        .fo-auth__in { padding: 8px 12px; font-size: 13px; }
        .fo-auth__chip { max-width: 112px; }
        .fo-auth__name { display: none; }   /* avatar alone; the menu still names them */
        .fo-auth__chip { padding: 5px; }
        .fo-foot__in { padding: 24px 12px; }
      }
    `}</style>
  );
}
