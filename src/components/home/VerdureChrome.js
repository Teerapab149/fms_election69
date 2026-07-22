"use client";

// VerdureChrome — the shared furniture for the Verdure template (slug "verdure").
// Faithful to docs/design-refs/verdure.css. Verdure's signature navigation is NOT
// a top bar — it's three fixed marks on the paper plus a floating dock:
//
//   <VerdureEdge/>        a vertical rotated label down the page side (mono +
//                         DM-Serif-italic "big" number in terracotta).
//   <VerdureCornermark/>  top-left: a moss "S" disc monogram + serif wordmark.
//   <VerdureCornerStatus/> top-right: a live-chip pill + (off-home) a user disc.
//   <VerdureDock/>        bottom-center: a moss pill nav with numbered discs
//                         (1 Index · 2 Candidates · 3 Profile | 4 Ballot · 5 Returns).
//   <VerdureBaseStyles/>  all the .vd-* tokens / buttons / discs / shared bits.
//
// Default export <VerdureChrome> renders all of them. Pages set `moss` for the
// dark-green page background (candidates/success in the prototype). Identity is
// HARDCODED here per Rule 9. editorMode renders statically (no real nav/signIn).

import { getPath } from "../../utils/basePath";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { resolveElectionDates } from "../../utils/electionConfig";
import { useGlobalConfig, useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import { VERDURE_THEMES, verdureTheme, hexToRgbTriple } from "../../utils/verdurePalettes";

// ── Verdure colour themes ────────────────────────────────────────────────────
// Palette map + helpers live in utils/verdurePalettes.js (plain module) so the
// server-side template definition (builtIn/verdure.js → Layer-1 tokens + element
// configs) reads the SAME source — the gumroad parity rule. Re-exported here for
// existing importers.
export { VERDURE_THEMES, verdureTheme, hexToRgbTriple };

// ── derived election meta — everything year/number-specific comes from
// globalConfig (admin-editable), never hardcoded; Thai digits are normalised to
// Arabic (owner: ห้ามใช้เลขไทย). One source for every Verdure page's headings. ──
const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
export const toArabic = (s) => String(s ?? "").replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d)));
const ordinalSuffix = (n) => {
  const v = Math.abs(Number(n) || 0) % 100;
  if (v >= 11 && v <= 13) return "TH";
  return ["TH", "ST", "ND", "RD"][v % 10] || "TH";
};
export function verdureMeta(gc = {}) {
  const num = Number(gc.electionNumber) || parseInt(String(gc.electionName || "").match(/\d+/)?.[0], 10) || 49;
  const prefix = gc.electionNamePrefix || "SAMO";
  const cy = toArabic(gc.electionCalendarYear ?? 2026);          // calendar year (CE)
  const ay = toArabic(gc.academicYearTh ?? 2569);                // academic year (BE)
  const faculty = gc.facultyShortEn || "FMS";
  const org = gc.organizationName || "สโมสรนักศึกษาคณะวิทยาการจัดการ";
  const campaign = gc.campaignTitle || "โครงการเลือกตั้งคณะกรรมการบริหาร";
  const founded = (Number(gc.electionCalendarYear) || 2026) - num + 1;
  return {
    num, prefix, samoSpaced: String(prefix).split("").join(" "),
    cy, ay, faculty, org, campaign,
    founded: String(founded), ordSuffix: ordinalSuffix(num),
    wordmark: `${prefix} ${num}`,                                // "SAMO 49"
    cornermarkSub: `${faculty} Election · ${ay}`,                // BE year, per the design ("FMS Election · 2569")
    tagline: `— ${faculty} Student Council Election —`,          // not year-locked
  };
}

// 4 real destinations only (party detail is reached THROUGH Candidates, which
// already auto-redirects to /party when a single party runs — so it's a sub-page,
// not a dock item; this also keeps the dock from echoing studio-dark's 5-item
// numbered list). Clear Thai labels, no decorative numbers.
const NAV = [
  { key: "home",       th: "หน้าหลัก", en: "Home",       href: "/" },
  { key: "candidates", th: "ผู้สมัคร",  en: "Candidates", href: "/candidates" },
  { key: "vote",       th: "ลงคะแนน",   en: "Vote",       href: "/vote" },
  { key: "results",    th: "ผลคะแนน",   en: "Results",    href: "/results" },
];
const LOGO_SRC = "/images/logo/FMS_Standard_Logo_PNG.png";

// ── vertical edge label ──
// `wordmark` (e.g. "SAMO 49") + `year` (calendar year) come from verdureMeta —
// the tail must never be hardcoded (mirrors cornermark/cornerstatus). Each is
// rendered only when present so the dots don't dangle on empty values.
export function VerdureEdge({ num = "01", label = "Index", th = "", right = false, wordmark = "", year = "" }) {
  return (
    <div className={`vd-edge ${right ? "vd-edge--right" : ""}`}>
      <span className="big">{num}</span> &nbsp;·&nbsp; {label}{th ? <> &nbsp;·&nbsp; <span className="vd-thai">{th}</span></> : null}{wordmark ? <> &nbsp;·&nbsp; {wordmark}</> : null}{year ? <> &nbsp;·&nbsp; {year}</> : null}
    </div>
  );
}

// ── top-left cornermark — real FMS logo on a cream chip + serif wordmark ──
export function VerdureCornermark({ title = "SAMO 50", sub = "FMS Election · 2570", editorMode = false }) {
  return (
    <a href={editorMode ? undefined : getPath("/")} className="vd-cornermark">
      <span className="vd-cornermark__logo">
        <Image src={getPath(LOGO_SRC)} alt="FMS PSU" width={1200} height={384} className="vd-cornermark__logo-img" priority />
      </span>
      <div className="vd-cornermark__txt">
        <strong>{title}</strong>
        {sub}
      </div>
    </a>
  );
}

// ── floating bottom dock — clean labeled pill (no studio-style numbers) ──
export function VerdureDock({ active = "home", editorMode = false }) {
  const dockActive = active === "success" ? "vote" : active === "party" ? "candidates" : active;
  return (
    <nav className="vd-dock">
      {NAV.map((n) => (
        <a key={n.key}
          href={editorMode ? undefined : getPath(n.href)}
          className={`vd-dock__link ${n.key === dockActive ? "is-active" : ""}`}>
          <span className="vd-dock__dot" aria-hidden />
          <span className="vd-dock__th">{n.th}</span>
          <span className="vd-dock__en">{n.en}</span>
        </a>
      ))}
    </nav>
  );
}

// ── top-right status (live chip + user disc) ──
export function VerdureCornerStatus({ active = "home", editorMode = false, systemMode = "AUTO", statusChip = null, backHref = null, backLabel = "" }) {
  const globalConfig = useGlobalConfig();
  const { data: session, status } = useSession();

  const { ELECTION_START, ELECTION_END } = useMemo(
    () => resolveElectionDates(globalConfig),
    [globalConfig?.campaignStartAt, globalConfig?.electionStartAt, globalConfig?.electionEndAt]
  );
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, label: "POLLS OPEN IN", live: false, noTimer: false });
  const [userOpen, setUserOpen] = useState(false); // mobile: tap the avatar to reveal name/id
  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      let diff, label, live = false;
      if (systemMode === "PAUSE") { label = "PAUSED"; diff = 0; }
      else if (systemMode === "ENDED") { label = "POLLS CLOSED"; diff = 0; }
      else if (systemMode === "MANUAL_OPEN") { label = "Polls close"; diff = ELECTION_END - now; live = true; }
      else if (now < ELECTION_START) { label = "Polls open in"; diff = ELECTION_START - now; }
      else if (now < ELECTION_END) { label = "Polls close"; diff = ELECTION_END - now; live = true; }
      else { label = "POLLS CLOSED"; diff = 0; }
      const noTimer = systemMode === "MANUAL_OPEN" && diff <= 0;
      setCd(diff > 0
        ? { d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24), m: Math.floor((diff / 60000) % 60), label, live, noTimer: false }
        : { d: 0, h: 0, m: 0, label: noTimer ? "OPEN NOW" : label, live, noTimer });
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [ELECTION_START, ELECTION_END, systemMode]);

  const pad = (n) => String(n).padStart(2, "0");
  const isAuthed = !editorMode && status === "authenticated" && !!session?.user;
  // back-pill label split (vd-B2B): head = first word ("BACK"), tail = the rest
  // ("TO CANDIDATES" / "TO BALLOT"). Desktop shows all of it; ≤1100px hides the
  // tail ("← BACK"); ≤560px hides the text entirely (round icon-only chip, the
  // full label lives on in aria-label). Label-agnostic — works for any string.
  const [backHead = "", ...backRestArr] = String(backLabel || "").trim().split(/\s+/);
  const backTail = backRestArr.join(" ");
  const userName = (session?.user?.name || "").trim();
  const userId = session?.user?.studentId || "";
  const avatarChar = (userName || "T").charAt(0).toUpperCase();

  const defaultChip = (
    <div className="vd-chip-live">
      <span className="dot" /> {cd.noTimer ? "OPEN NOW" : cd.label} · <strong>{cd.noTimer ? "เปิดรับอยู่" : `${pad(cd.d)}D ${pad(cd.h)}H ${pad(cd.m)}M`}</strong>
    </div>
  );

  return (
    <div className="vd-cornerstatus">
      {backHref ? (
        <a href={editorMode ? undefined : getPath(backHref)} className="vd-chip-live vd-chip-live--back" aria-label={backLabel}>
          {/* single wrapper span = ONE flex item, so the chip's gap never applies
              inside the label and desktop spacing stays the plain text spaces */}
          <span className="vd-back-inner">←<span className="vd-back-txt"> {backHead}{backTail ? <span className="vd-back-tail"> {backTail}</span> : null}</span></span>
        </a>
      ) : (statusChip || defaultChip)}
      {isAuthed && active !== "home" && (
        <div className={`vd-user ${userOpen ? "is-open" : ""}`}>
          <button type="button" className="vd-user__av" onClick={() => setUserOpen((o) => !o)} aria-label="ดูข้อมูลผู้ใช้" aria-expanded={userOpen}>{avatarChar}</button>
          <div className="vd-user__meta">
            <div className="vd-user__name">{userName.split(" ")[0] || userName}</div>
            {userId && <div className="vd-user__id">No. {userId}</div>}
          </div>
          <button type="button" className="vd-user__out" title="ออกจากระบบ · Sign out" aria-label="ออกจากระบบ"
            onClick={() => { if (editorMode) return; const bp = process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs"; const ret = `${window.location.origin}${bp}`; let url = `https://psusso.psu.ac.th/application/o/fms-ovs/end-session/?post_logout_redirect_uri=${encodeURIComponent(ret)}`; if (session?.id_token) url += `&id_token_hint=${session.id_token}`; signOut({ redirect: false }).finally(() => { window.location.href = url; }); }}>
            ⏻
          </button>
        </div>
      )}
    </div>
  );
}

// signIn helper shared by the home circle CTA
export function verdureSignIn() {
  signIn("authentik", { callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs") + "/vote" });
}

export function VerdureBaseStyles() {
  // Resolve the active accent. Live = the active template (useActiveTemplateId,
  // SSR-consistent). On /template-preview the previewed verdure-* slug wins — read
  // from window in an effect (NOT useSearchParams, which would de-opt the build /
  // mismatch hydration); initial render matches SSR, then the preview re-tints.
  const activeSlug = useActiveTemplateId();
  const [previewSlug, setPreviewSlug] = useState(null);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s && s.startsWith("verdure")) setPreviewSlug(s);
  }, []);
  const t = verdureTheme(previewSlug || activeSlug);
  return (
    <style jsx global>{`
      .vd-root {
        --moss:${t.moss}; --moss-2:${t.moss2}; --moss-3:${t.moss3};
        --cream:${t.cream}; --cream-2:${t.cream2}; --cream-3:${t.cream3};
        --terra:${t.terra}; --terra-2:${t.terra2}; --terra-soft:${t.soft}; --gold:${t.gold};
        --cta:${t.cta || t.terra}; --cta-2:${t.cta2 || t.terra2}; --cta-text:${t.ctaText || t.cream};
        --moss-rgb:${hexToRgbTriple(t.moss)}; --moss-2-rgb:${hexToRgbTriple(t.moss2)};
        --terra-rgb:${hexToRgbTriple(t.terra)};
        --terra-soft-rgb:${hexToRgbTriple(t.soft)}; --gold-rgb:${hexToRgbTriple(t.gold)};
        --cream-rgb:${hexToRgbTriple(t.cream)}; --cream-2-rgb:${hexToRgbTriple(t.cream2)};
        --rule:${t.rule}; --rule-moss:rgba(var(--cream-rgb),.16);
        --fd:var(--font-dm-serif),'DM Serif Display',var(--font-plex-thai),Georgia,serif;
        --fs:var(--font-manrope),'Manrope',var(--font-plex-thai),system-ui,sans-serif;
        --ft:var(--font-plex-thai),'IBM Plex Sans Thai',var(--font-manrope),system-ui,sans-serif;
        --fm:var(--font-space-mono),'Space Mono',ui-monospace,monospace;
        min-height:100vh; position:relative; background:var(--cream); color:var(--moss); font-family:var(--ft);
      }
      .vd-root * { box-sizing:border-box; }
      /* Colour-theme morph — only while .vd-theming is on (added for ~0.6s on a
         theme switch, e.g. from the chooser), so every surface eases from the old
         palette to the new one instead of snapping. Off otherwise → hover/intro
         keep their own fast transitions. */
      .vd-root.vd-theming, .vd-root.vd-theming *, .vd-root.vd-theming *::before, .vd-root.vd-theming *::after {
        transition: background-color .6s ease, background .6s ease, color .6s ease, border-color .6s ease, box-shadow .6s ease, fill .6s ease, stroke .6s ease !important;
      }
      /* links inherit ink, EXCEPT button-styled anchors (.vd-btn) — those must keep
         their own label colour (var --cta-text); the bare vd-root-a rule (0,1,1)
         would otherwise outrank vd-btn--terra (0,1,0) and force anchor CTAs to ink. */
      .vd-root a:not(.vd-btn) { color:inherit; text-decoration:none; }
      .vd-root a.vd-btn { text-decoration:none; }
      .vd-root ::selection { background:var(--terra); color:var(--cream); }
      .vd-tabular { font-variant-numeric:tabular-nums lining-nums; }
      .vd-smallcaps { font-family:var(--fm); font-size:11px; letter-spacing:.18em; text-transform:uppercase; }
      /* Thai run reset inside tracked/uppercase mono kickers: Space Mono has no
         Thai glyphs, so Thai in a --fm/letter-spaced context falls back to a
         system font with mis-set marks + unnatural tracking. This span pins Thai
         back to the Plex-Thai stack with gentle spacing, and nowrap so a phrase
         never breaks mid-word (breaks are forced onto the "·" separators). Thai
         has no case, so any inherited text-transform:uppercase is a no-op. */
      .vd-thai { font-family:var(--ft); letter-spacing:.04em; white-space:nowrap; }
      /* English-run nowrap partner to .vd-thai (promoted from VerdureResults.js's
         local copy, vd-B2A, now that the idiom is rolled out to multiple pages —
         see vd-B2C): keeps multi-word EN phrases whole so a kicker only breaks at "·" */
      .vd-nw { white-space:nowrap; }

      /* moss page variant */
      .vd-root.vd-moss { background:var(--moss); color:var(--cream); }
      .vd-root.vd-moss::before { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
        background-image:radial-gradient(circle at 12% 15%, rgba(var(--terra-rgb),.06) 0, transparent 35%), radial-gradient(circle at 88% 85%, rgba(var(--gold-rgb),.05) 0, transparent 35%); }

      /* edge label */
      .vd-edge { position:fixed; left:24px; top:50%; transform:translateY(-50%) rotate(-90deg); transform-origin:0 0; z-index:30; font-family:var(--fm); font-size:11px; letter-spacing:.35em; text-transform:uppercase; color:var(--moss); opacity:.55; white-space:nowrap; pointer-events:none; }
      .vd-edge .big { font-family:var(--fd); font-style:italic; font-size:16px; letter-spacing:0; color:var(--terra); margin-right:12px; text-transform:none; }
      .vd-edge--right { left:auto; right:24px; transform:translateY(-50%) rotate(90deg); transform-origin:100% 0; }
      .vd-moss .vd-edge { color:var(--cream); }
      .vd-moss .vd-edge .big { color:var(--gold); }

      /* cornermark — sits on a translucent pill so its text stays readable over
         whatever content scrolls beneath the fixed chrome */
      .vd-cornermark { position:fixed; top:22px; left:22px; z-index:35; display:flex; align-items:center; gap:12px; padding:6px 16px 6px 6px; border-radius:16px; background:rgba(var(--cream-2-rgb),.82); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); box-shadow:0 12px 32px -20px rgba(var(--moss-rgb),.4); }
      .vd-moss .vd-cornermark { background:rgba(var(--moss-2-rgb),.82); box-shadow:0 12px 32px -20px rgba(0,0,0,.5); }
      .vd-cornermark__logo { display:inline-flex; align-items:center; justify-content:center; height:36px; padding:6px 11px; border-radius:10px; background:var(--cream); box-shadow:inset 0 0 0 1px rgba(var(--moss-rgb),.08); flex-shrink:0; }
      .vd-cornermark__logo-img { width:auto; height:28px; object-fit:contain; }
      .vd-cornermark__txt { font-family:var(--fm); font-size:10px; letter-spacing:.25em; text-transform:uppercase; color:var(--moss); line-height:1.3; }
      .vd-cornermark__txt strong { display:block; font-family:var(--fd); font-size:14px; letter-spacing:0; font-weight:400; text-transform:none; color:var(--moss); }
      .vd-moss .vd-cornermark__txt, .vd-moss .vd-cornermark__txt strong { color:var(--cream); }

      /* cornerstatus — matches the cornermark pill (same top, style) so the two
         flank the page symmetrically */
      .vd-cornerstatus { position:fixed; top:22px; right:22px; z-index:35; display:flex; align-items:center; gap:12px; }
      .vd-chip-live { display:inline-flex; align-items:center; gap:10px; padding:10px 18px; border-radius:999px; background:var(--cream-2); border:1px solid var(--rule); font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--moss); }
      .vd-chip-live--back { cursor:pointer; }
      .vd-moss .vd-chip-live { background:var(--moss-2); border-color:var(--rule-moss); color:var(--cream); }
      .vd-chip-live .dot { width:7px; height:7px; border-radius:50%; background:var(--terra); box-shadow:0 0 0 0 rgba(var(--terra-rgb),.55); animation:vdDot 1.8s ease-out infinite; }
      .vd-chip-live strong { color:var(--terra); font-weight:700; }
      /* on the dark surfaces the accent has to be the LIGHT plum: --terra on --moss-2
         measures 1.05:1, i.e. the value inside the chip ("29 CANDIDATES", "CONFIRMED")
         was invisible. --terra-soft is the same hue one step up and gives ~7:1, and it
         is per-theme so every verdure theme gets the readable pairing. */
      .vd-moss .vd-chip-live strong { color:var(--terra-soft); }
      .vd-moss .vd-chip-live .dot { background:var(--terra-soft); }
      @keyframes vdDot { 0%{box-shadow:0 0 0 0 rgba(var(--terra-rgb),.55)} 70%{box-shadow:0 0 0 10px rgba(var(--terra-rgb),0)} }
      .vd-user { position:relative; display:flex; align-items:center; gap:10px; padding:6px 12px 6px 6px; border-radius:16px; background:rgba(var(--cream-2-rgb),.82); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); box-shadow:0 12px 32px -20px rgba(var(--moss-rgb),.4); border:0; }
      .vd-moss .vd-user { background:rgba(var(--moss-2-rgb),.82); box-shadow:0 12px 32px -20px rgba(0,0,0,.5); }
      .vd-user__av { width:36px; height:36px; border-radius:50%; background:var(--terra); color:var(--cream); display:grid; place-items:center; font-family:var(--fd); font-style:italic; font-size:17px; border:0; padding:0; cursor:pointer; line-height:1; transition:background .2s; flex-shrink:0; }
      .vd-user__av:hover { background:var(--terra-2); }
      .vd-user__name { font-family:var(--fs); font-size:13px; font-weight:600; line-height:1.1; color:var(--moss); }
      .vd-moss .vd-user__name { color:var(--cream); }
      .vd-user__id { font-family:var(--fm); font-size:10px; letter-spacing:.08em; color:var(--moss); opacity:.55; }
      .vd-moss .vd-user__id { color:var(--cream); }
      .vd-user__out { margin-left:0; width:32px; height:32px; border-radius:50%; border:1px solid var(--rule); background:transparent; color:var(--moss); cursor:pointer; font-size:15px; line-height:1; display:grid; place-items:center; flex-shrink:0; }
      .vd-user__out:hover { background:var(--terra); border-color:var(--terra); color:var(--cream); }
      .vd-moss .vd-user__out { color:var(--cream); border-color:var(--rule-moss); }

      /* dock — clean labeled pill; active = cream fill + a terra index dot. No
         numbered discs (that read as a studio-dark echo); plain Thai labels so
         it's instantly understandable. */
      .vd-dock { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:50; display:flex; align-items:stretch; gap:2px; padding:6px; background:var(--moss); border-radius:999px; box-shadow:0 22px 60px -12px rgba(var(--moss-rgb),.55), 0 0 0 1px rgba(var(--cream-rgb),.08); }
      .vd-dock__link { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0; padding:8px 22px; border-radius:999px; transition:background .25s, color .25s; }
      .vd-dock__dot { width:5px; height:5px; border-radius:50%; background:transparent; margin-bottom:3px; transition:background .25s, transform .25s; }
      .vd-dock__th { font-family:var(--ft); font-size:14px; font-weight:600; color:rgba(var(--cream-rgb),.85); letter-spacing:.005em; line-height:1.1; transition:color .25s; white-space:nowrap; }
      .vd-dock__en { font-family:var(--fm); font-size:8px; letter-spacing:.16em; text-transform:uppercase; color:rgba(var(--cream-rgb),.6); margin-top:2px; transition:color .25s; }
      .vd-dock__link:hover { background:var(--moss-2); }
      .vd-dock__link:hover .vd-dock__th { color:var(--cream); }
      .vd-dock__link:hover .vd-dock__dot { background:rgba(var(--terra-rgb),.6); }
      .vd-dock__link.is-active { background:var(--cream); }
      .vd-dock__link.is-active .vd-dock__th { color:var(--moss); }
      .vd-dock__link.is-active .vd-dock__en { color:var(--terra); }
      .vd-dock__link.is-active .vd-dock__dot { background:var(--terra); transform:scale(1.3); }

      /* buttons */
      .vd-btn { display:inline-flex; align-items:center; gap:12px; padding:16px 26px; background:var(--moss); color:var(--cream); border:1px solid var(--moss); border-radius:999px; font-family:var(--fs); font-size:14px; font-weight:600; cursor:pointer; transition:all .25s; }
      .vd-btn:hover { background:var(--terra); border-color:var(--terra); }
      .vd-btn--terra { background:var(--cta); border-color:var(--cta); color:var(--cta-text); }
      .vd-btn--terra:hover { background:var(--moss); border-color:var(--moss); color:var(--cream); }
      /* on a moss surface the dark CTA fill sits at 1.4:1 against the page and stops
         reading as the primary action — the light accent carries it instead, dark
         label on top. Per-theme (--terra-soft / --moss), so every theme stays itself. */
      .vd-moss .vd-btn--terra { background:var(--terra-soft); border-color:var(--terra-soft); color:var(--moss); }
      .vd-moss .vd-btn--terra:hover { background:var(--cream); border-color:var(--cream); color:var(--moss); }
      .vd-btn--ghost { background:transparent; border-color:var(--rule); color:var(--moss); }
      .vd-btn--ghost:hover { background:var(--moss); border-color:var(--moss); color:var(--cream); }
      .vd-moss .vd-btn--ghost { border-color:var(--rule-moss); color:var(--cream); }
      .vd-moss .vd-btn--ghost:hover { background:var(--cream); color:var(--moss); border-color:var(--cream); }
      .vd-btn--lg { padding:20px 32px; font-size:15px; }
      .vd-btn--block { width:100%; justify-content:center; }
      .vd-btn .arr { width:22px; height:22px; border-radius:50%; border:1px solid currentColor; display:grid; place-items:center; font-size:11px; transition:transform .25s; }
      .vd-btn:hover .arr { transform:translate(2px,-2px) rotate(-45deg); }
      .vd-btn.is-disabled, .vd-btn[disabled] { opacity:.35; pointer-events:none; cursor:not-allowed; }

      /* responsive */
      @media (max-width:1100px) {
        .vd-edge { display:none; }
        .vd-cornermark { top:16px; left:16px; }
        .vd-cornermark__logo { height:40px; padding:7px 11px; }
        .vd-cornermark__logo-img { height:24px; }
        .vd-cornerstatus { top:16px; right:16px; gap:8px; }
        .vd-cornerstatus .vd-chip-live:not(.vd-chip-live--back) { display:none; }
        /* back pill (vd-B2B): tablets drop the label tail → "← BACK" */
        .vd-chip-live--back .vd-back-tail { display:none; }
        .vd-dock { padding:5px; bottom:16px; max-width:calc(100vw - 16px); }
        .vd-dock__link { padding:7px 16px; }
      }
      /* phones — 4 short Thai labels fit without scroll; just drop the EN sub */
      @media (max-width:560px) {
        .vd-dock { gap:0; padding:5px; max-width:calc(100vw - 12px); }
        .vd-dock__en { display:none; }
        .vd-dock__link { padding:8px 12px; }
        .vd-dock__th { font-size:13px; }
        .vd-dock__dot { display:none; }
        /* phones: cornermark collapses to just its logo chip, and the user pill to
           avatar + sign-out — two even chips flanking the top (tap avatar for name/id) */
        .vd-cornermark { padding:0; background:transparent; box-shadow:none; -webkit-backdrop-filter:none; backdrop-filter:none; }
        .vd-cornermark__txt { display:none; }
        .vd-user { padding:5px; gap:6px; }
        .vd-user__meta { display:none; }
        /* back pill (vd-B2B): phones collapse to a round icon-only chip — the ←
           glyph centred in a 44px circle (≥44px hit target), same chip material;
           the full label stays readable via the anchor's aria-label */
        .vd-chip-live--back { width:44px; height:44px; padding:0; justify-content:center; letter-spacing:0; font-size:16px; }
        .vd-chip-live--back .vd-back-txt { display:none; }
        .vd-user.is-open .vd-user__meta { display:block; position:absolute; top:calc(100% + 8px); right:0; background:var(--cream-2); border:1px solid var(--rule); border-radius:14px; padding:10px 14px; box-shadow:0 18px 38px -18px rgba(var(--moss-rgb),.4); white-space:nowrap; text-align:right; z-index:40; }
        .vd-moss .vd-user.is-open .vd-user__meta { background:var(--moss-2); border-color:var(--rule-moss); }
      }
      /* very small phones (≤360px) — tighten further so the pill never overflows */
      @media (max-width:380px) {
        .vd-dock__link { padding:8px 9px; }
        .vd-dock__th { font-size:12px; }
      }
    `}</style>
  );
}

export default function VerdureChrome({
  active = "home", moss = false, editorMode = false, systemMode = "AUTO",
  edge = { num: "01", label: "Index", th: "" }, cornermarkTitle = null,
  cornermarkSub = null, statusChip = null, backHref = null, backLabel = "",
}) {
  const gc = useGlobalConfig();
  const meta = verdureMeta(gc);
  return (
    <>
      <VerdureEdge num={edge.num} label={edge.label} th={edge.th} right={!!edge.right} />
      <VerdureCornermark title={cornermarkTitle || meta.wordmark} sub={cornermarkSub || meta.cornermarkSub} editorMode={editorMode} />
      <VerdureCornerStatus active={active} editorMode={editorMode} systemMode={systemMode}
        statusChip={statusChip} backHref={backHref} backLabel={backLabel} />
      <VerdureDock active={active} editorMode={editorMode} />
      <VerdureBaseStyles />
    </>
  );
}
