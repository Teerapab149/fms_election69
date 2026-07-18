"use client";

// ReceiptHome — HOME for the "Receipt · Paper Materiality" template family
// (Template #6). v2-R1.5 rebalance: the owner ruled the full-page receipt roll read
// lopsided ("หนักข้างทันที") and that receipt material belongs to the success page —
// so on HOME the receipt survives only as the CLOCK. The org-name notice returns to
// a PAPER STACK held by a metal paperclip (the R2.5 language, upgraded with grain +
// 4px corners + a peeking stub). Composition (v2-R5a rebalance): a paper-stack hero
// on the LEFT with the primary CTA ladder sat directly beneath it as a big die-cut
// desk tag + a "ดูผู้สมัคร" ticket-stub beside it (read→act in one glance); a right
// rail carrying the CLOCK (dispenser head + a printed queue slip: split-flap, ref
// line, jagged bottom, red closed-stamp state) → a short manila note (head + verify
// line, no CTA); the turnout slip + promo poster sit in a balanced band below. The
// queue slip is the ONLY receipt-stock object on the page. No family uses this
// skeleton — it kills the "looks like Blossom" read without the lopsided tape.
//
// LOGIC SEAMS are ported 1:1 from BlossomHome and UNTOUCHED by the recompose:
// receiptMeta is config-driven (Arabic digits, admin-editable, NEVER hardcoded
// years/names), useCountdown carries the systemMode ladder verbatim, the CTA +
// TopBar are STATE-AWARE, and the whole page is editor-safe — in editorMode it
// never touches auth (P-LOG-002), voteCTA forces "login", stats come from
// editorData. onSignIn overrides live next-auth in preview. The dispenser LED is
// derived from the SAME ladder (via cd) — no new state.
//
// Colours flow ONLY through var(--rc-*), emitted by ReceiptBaseStyles on .rc-root,
// so a theme swap re-tints the whole page in place (palette is v2-R2 — untouched
// here). Decoration is print-language only (stamps / perforation / die-cut / foil
// — no icons, no doodles, no torn edges — P-LOG-086). Base state is fully visible:
// the print-reveal only arms its hidden `from` once JS runs, so JS-off / reduced-
// motion / editorMode all render the complete tape instantly. Mono lines are
// Latin/digits only (A10.3); Thai always sits in a Chakra span.

import { getPath } from "../../utils/basePath";
import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { ReceiptBaseStyles, RC_SHIP_PATHS } from "./ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { useVoteStatus } from "../../hooks/useVoteStatus";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";
import { resolveElementState, buildRuntimeContext } from "../admin/editor/stateResolver";
import { buildTemplateStyles } from "../../lib/templateTokens";

// sign-in helper (same seam as the other families)
function receiptSignIn() {
  signIn("authentik", { callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs") + "/vote" });
}

// derived election meta — everything year/number-specific comes from globalConfig.
// Soft string fallbacks; NO year literals live in this file (years bind straight to
// globalConfig / resolveElectionDates). Mirrors blossomMeta exactly.
function receiptMeta(gc = {}) {
  return {
    prefix: gc.electionNamePrefix || "SAMO",
    number: gc.electionNumber ?? "",
    calYear: gc.electionCalendarYear ?? "",
    academicYear: gc.academicYearTh ?? "",
    copyrightYear: gc.copyrightYear ?? "",
    faculty: gc.facultyShortEn || "FMS",
    campaign: gc.campaignTitle || "โครงการเลือกตั้งคณะกรรมการบริหาร",
    org: gc.organizationName || "สโมสรนักศึกษาคณะวิทยาการจัดการ",
  };
}

// ── top bar: site-standard behaviour (sticky), receipt "head-of-desk" skin — a
//    paper-tag logo clipped on, ticket-STUB nav (cut corner + left perforation;
//    active = torn along the perforation), a lanyard-card user chip. backdrop-filter
//    is GONE (opaque desk + perforated hairline). DOM/behaviour are UNCHANGED from
//    the ported BlossomTopBar — only the CSS skin (in ReceiptHome's style block)
//    differs, so every other receipt page keeps its own chrome untouched. ──
export function ReceiptTopBar({ editorMode, onSignIn, active = "/" }) {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const chipRef = useRef(null);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    function onDoc(e) { if (chipRef.current && !chipRef.current.contains(e.target)) setUserOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const isAuthed = !editorMode && mounted && status === "authenticated" && !!session?.user;
  // in editorMode we NEVER wait on / read a real session → treat as logged-out static
  const isLoading = !editorMode && mounted && status === "loading";
  const user = session?.user;
  const name = (user?.name || "").trim();
  const firstName = name.split(" ")[0] || name;
  const idText = user?.studentId || user?.email || "";
  const avatarChar = (name || "T").charAt(0).toUpperCase();

  const doSignIn = () => { if (editorMode) return; onSignIn ? onSignIn() : receiptSignIn(); };
  const doSignOut = () => {
    if (editorMode) return;
    const bp = process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs";
    const ret = `${window.location.origin}${bp}`;
    let url = `https://psusso.psu.ac.th/application/o/fms-ovs/end-session/?post_logout_redirect_uri=${encodeURIComponent(ret)}`;
    if (session?.id_token) url += `&id_token_hint=${session.id_token}`;
    signOut({ redirect: false }).finally(() => { window.location.href = url; });
  };

  const NAV = [
    { th: "หน้าแรก", href: "/" },
    { th: "ผู้สมัคร", href: "/candidates" },
    { th: "ผลคะแนน", href: "/results" },
  ];

  return (
    <header className="rc-topbar">
      <div className="rc-topbar__in">
        <a href={editorMode ? undefined : getPath("/")} className="rc-logo" aria-label="หน้าแรก">
          <img src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")} alt="FMS PSU" className="rc-logo__img" />
        </a>

        <nav className="rc-nav">
          {NAV.map((n) => (
            <a key={n.href} href={editorMode ? undefined : getPath(n.href)} className={n.href === active ? "rc-nav__link on" : "rc-nav__link"}>{n.th}</a>
          ))}
        </nav>

        <div className="rc-userwrap" ref={chipRef}>
          {isLoading ? (
            <div className="rc-loginbtn rc-loginbtn--skel" aria-hidden><span className="rc-skelbar" /></div>
          ) : isAuthed ? (
            <div className={`rc-userchip ${userOpen ? "is-open" : ""}`}>
              <button type="button" className="rc-userchip__btn" onClick={() => setUserOpen((o) => !o)} aria-expanded={userOpen} aria-label="เมนูผู้ใช้">
                <span className="rc-userchip__av">{avatarChar}</span>
                <span className="rc-userchip__name">{firstName}</span>
                <span className="rc-userchip__caret" aria-hidden>▾</span>
              </button>
              {userOpen && (
                <div className="rc-usermenu">
                  <div className="rc-usermenu__head">
                    <div className="rc-usermenu__name">{name}</div>
                    {idText && <div className="rc-usermenu__id">{idText}</div>}
                  </div>
                  <button type="button" className="rc-usermenu__out" onClick={doSignOut} aria-label="ออกจากระบบ">ออกจากระบบ</button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" className="rc-loginbtn" onClick={doSignIn}>เข้าสู่ระบบ</button>
          )}

          <button type="button" className="rc-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="เมนู" aria-expanded={menuOpen}>
            <span /><span /><span />
          </button>
        </div>

        {/* mobile slide-down sheet — a stack of nav stubs */}
        <div className={`rc-sheet ${menuOpen ? "is-open" : ""}`}>
          {NAV.map((n) => (
            <a key={n.href} href={editorMode ? undefined : getPath(n.href)} className="rc-sheet__link" onClick={() => setMenuOpen(false)}>{n.th}</a>
          ))}
        </div>
      </div>
    </header>
  );
}

// ── queue-slip digit roll: each value is a row of fixed-width, overflow-hidden
//    character cells. The inner char span is KEYED by its glyph so a changed digit
//    remounts just that span → the rcRoll keyframe (translateY(100%)→0) plays for
//    the incoming glyph only. Transform-only (no layout shift); reduced-motion nukes
//    the animation → instant swap. Base state is the visible position. ──
function RcSlipDigits({ value }) {
  return (
    <span className="rc-cd-n">
      {String(value).split("").map((ch, i) => (
        <span className="rc-cd-cell" key={i}>
          <span className="rc-cd-char" key={ch}>{ch}</span>
        </span>
      ))}
    </span>
  );
}

// ── loop-safe phase-aware countdown (v2-R5g — clock semantics). The core countdown
//    math (target − now → d/h/m/s) is UNCHANGED from BlossomHome; what changed is
//    that each state now carries a `kind` discriminator so every downstream consumer
//    (LED / cap / sheet body / stamp) reads ONE field instead of string-matching the
//    display label (the F5 lockstep hazard). The kinds:
//      before  — AUTO, now < start                     → flip COUNTDOWN to open (amber LED)
//      open    — AUTO in-window, OR MANUAL_OPEN before  → flip COUNTDOWN to CLOSE
//                ELECTION_END                             (green LED). A forced-open poll
//                                                         still counts down to its scheduled
//                                                         close — never a wall clock (R5g-ก).
//      manual  — MANUAL_OPEN past ELECTION_END          → forced-open FALLBACK: no digits,
//                                                         no target, "เปิดโหวตอยู่" + today's
//                                                         date. NEVER a red stamp / "POLL
//                                                         CLOSED" (green LED). Protects the
//                                                         R5f regression: no red under manual.
//      pause   — PAUSE                                   → static "รอเปิดอีกครั้ง" (amber LED)
//      ended   — ENDED, or AUTO past close              → the election-day sheet + red stamp,
//                                                         then a "เจอกันปีหน้า" countdown to
//                                                         next year's start (red LED). d/h/m/s
//                                                         now carry that next-year delta.
//    MANUAL_OPEN used to show a live wall clock (HH:MM:SS) with no target. It now counts
//    down to ELECTION_END while the scheduled window is still open, and only falls back to
//    the digitless "เปิดโหวตอยู่" sheet once the clock passes the scheduled close. ──
function useCountdown(globalConfig, systemMode) {
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0, kind: "loading", label: "กำลังโหลด", live: false, done: false });
  useEffect(() => {
    const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);
    // next election is ~1 year after this cycle's start. Deliberately an ESTIMATE:
    // once next year's config dates are actually set, resolveElectionDates returns the
    // real values and this delta is replaced automatically — no code change needed.
    const nextStart = ELECTION_START
      ? (() => { const d = new Date(ELECTION_START); d.setFullYear(d.getFullYear() + 1); return d.getTime(); })()
      : null;
    // d/h/m/s from `now` to a target (clamped ≥ 0). Reused by open + ended countdowns.
    const partsTo = (target, now) => {
      const diff = target != null ? Math.max(0, target - now) : 0;
      return {
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      };
    };
    const tick = () => {
      const now = Date.now();
      // MANUAL_OPEN — forced open. While the scheduled window is still open, count DOWN
      // to the scheduled close (identical to AUTO-open); a forced-open poll must not read
      // as a wall clock (R5g-ก). Only once the clock passes the scheduled close does it
      // fall back to a digitless "เปิดโหวตอยู่" sheet — still open, still green LED, and
      // NEVER a countdown target / red stamp.
      if (systemMode === "MANUAL_OPEN") {
        if (now < ELECTION_END) {
          setCd({ ...partsTo(ELECTION_END, now), kind: "open", label: "ปิดโหวตใน", live: true, done: false });
          return;
        }
        setCd({ d: 0, h: 0, m: 0, s: 0, kind: "manual", label: "เปิดโหวตอยู่", live: true, done: false });
        return;
      }
      if (systemMode === "PAUSE") {
        setCd({ d: 0, h: 0, m: 0, s: 0, kind: "pause", label: "ระบบพักชั่วคราว", live: false, done: true });
        return;
      }
      if (systemMode === "ENDED") {
        setCd({ ...partsTo(nextStart, now), kind: "ended", label: "ปิดโหวตแล้ว", live: false, done: true });
        return;
      }
      // AUTO ladder — the clock decides.
      if (now >= ELECTION_END) {
        setCd({ ...partsTo(nextStart, now), kind: "ended", label: "ปิดโหวตแล้ว", live: false, done: true });
        return;
      }
      const before = now < ELECTION_START;
      const target = before ? ELECTION_START : ELECTION_END;
      const diff = Math.max(0, target - now);
      setCd({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
        kind: before ? "before" : "open",
        label: before ? "เปิดโหวตใน" : "ปิดโหวตใน",
        live: !before, done: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [globalConfig?.campaignStartAt, globalConfig?.electionStartAt, globalConfig?.electionEndAt, systemMode]);
  return cd;
}

export default function ReceiptHome({
  initialData, editorMode = false, editorData = null,
  resolvedTemplate = null, editorTokenStyles = null,
  // optional sign-in override (playground/preview) — absent = live next-auth behaviour
  onSignIn = null,
}) {
  const { data: session, status } = useSession();
  const globalConfig = useGlobalConfig() || {};
  const [mounted, setMounted] = useState(false);
  const { isVoted: isVotedReal } = useVoteStatus({ enabled: !editorMode && status === "authenticated" });
  const rootRef = useRef(null);
  useEffect(() => { setMounted(true); }, []);

  // ── print-reveal (T5 / A7.1) — the lower tape segments "print out" as they scroll
  //    into view: translateY(12px)→0 + opacity, ONCE, then the observer disconnects.
  //    Base is fully VISIBLE (the .js-reveal class only arms the hidden `from` when
  //    JS actually runs), so JS-off / no-IO render the whole tape instantly; reduced-
  //    motion skips arming entirely. Transform/opacity only — no scroll listener. ──
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return undefined;
    const root = rootRef.current;
    if (!root) return undefined;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(root.querySelectorAll(".rc-seg--reveal"));
    if (reduced || !("IntersectionObserver" in window) || els.length === 0) return undefined;
    root.classList.add("js-reveal"); // arm the hidden `from` only now that JS is live
    let remaining = els.length;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-printed");
        io.unobserve(e.target);
        remaining -= 1;
        if (remaining <= 0) io.disconnect();
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [mounted]);

  const sysMode = initialData?.systemMode || "AUTO";
  const cd = useCountdown(globalConfig, sysMode);

  // stats — editor uses dummy, live/preview uses real feed. REAL values render in
  // JSX → SSR-correct with no JS (never gated on the count-up). Mirrors BlossomHome.
  const rawStats = editorMode
    ? { totalVoted: editorData?.totalVoted ?? 342, totalEligible: editorData?.totalEligible ?? 1200 }
    : { totalVoted: initialData?.stats?.totalVoted ?? 0, totalEligible: initialData?.stats?.totalEligible ?? 0 };
  const pct = rawStats.totalEligible > 0 ? ((rawStats.totalVoted / rawStats.totalEligible) * 100).toFixed(1) : "0.0";
  const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);
  const realParties = (initialData?.candidates || []).filter((c) => c.number > 0);
  const partyCount = realParties.length || (editorMode ? 2 : 0);

  if (!mounted) return null;

  const meta = receiptMeta(globalConfig);
  const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);
  const pad2 = (n) => String(n).padStart(2, "0");
  // today's REAL date for the calendar page — client-only (component is gated on
  // `mounted`, so new Date() never causes a hydration mismatch). NOT a mock.
  const todayTh = formatThaiDate(new Date());

  // CTA state ladder — editor forces login (no auth); live/preview resolves it.
  // Labels + hrefs are BYTE-IDENTICAL to BlossomHome's CTA map.
  const runtimeCtx = buildRuntimeContext({
    session, systemConfig: initialData?.systemConfig, electionStatus: initialData?.electionStatus,
    userData: session?.user ? { ...(initialData?.userData || {}), isVoted: isVotedReal } : initialData?.userData,
  });
  const voteState = editorMode ? "login" : (resolveElementState("voteCTA-button", runtimeCtx) || "login");
  const CTA = {
    login:    { label: "เข้าสู่ระบบเพื่อลงคะแนน", action: "signin", disabled: false },
    notVoted: { label: "ไปลงคะแนนเสียง", href: "/vote", disabled: false },
    voted:    { label: "ดูผลคะแนน", href: "/results", disabled: false },
    closed:   { label: "ยังไม่เปิดรับลงคะแนน", href: "/closed", disabled: true },
    paused:   { label: "ระบบพักปรับปรุงชั่วคราว", href: "/closed", disabled: true },
    ended:    { label: "ดูผลคะแนนอย่างเป็นทางการ", href: "/results", disabled: false },
  }[voteState] || { label: "เข้าสู่ระบบเพื่อลงคะแนน", action: "signin", disabled: false };

  const onCta = (e) => {
    if (editorMode || CTA.disabled) { e.preventDefault(); return; }
    if (CTA.action === "signin") { e.preventDefault(); onSignIn ? onSignIn() : receiptSignIn(); }
  };
  const ctaHref = editorMode || CTA.action === "signin" ? undefined : getPath(CTA.href || "/");

  const tokenStylesCss = editorMode ? (editorTokenStyles || "") : buildTemplateStyles(resolvedTemplate, ".fms-app");
  const posterSrc = getPath("/images/prob/samo49_1.png");

  // ── one discriminator (cd.kind) drives every consumer below — no fragile label
  //    string-matching (F5 lockstep). Booleans read straight off it. ──
  const kind = cd.kind;                                  // before|open|manual|pause|ended|loading
  const isEnded = kind === "ended";
  const isManual = kind === "manual";
  const isPause = kind === "pause";
  // before/open/loading all show the flip COUNTDOWN (loading = a sub-frame flash of 0s)
  const isCountdown = kind === "before" || kind === "open" || kind === "loading";

  // dispenser LED — SEMANTIC, locked across every theme (A8.1). open (green) when the
  // poll is truly open: AUTO in-window OR MANUAL_OPEN. closed (faint-red) ONLY when
  // truly ended. pause + pre-open fall to the waiting amber. The red LED (and every
  // red-stamp / "POLL CLOSED" phrase) therefore appears for ENDED alone.
  const ledState = (kind === "open" || kind === "manual") ? "open" : isEnded ? "closed" : "wait";

  // queue-slip cap copy per kind (no trailing period). Thai head + a mono sub-label.
  // Each meaning renders exactly ONCE (R5c): the red stamp carries "ปิดโหวตแล้ว", so
  // the ended cap says the NON-duplicate "รอประกาศผลคะแนน" instead.
  const CAP = {
    before:  { th: "เปิดโหวตในอีก", en: "STARTS IN" },
    open:    { th: "ปิดโหวตในอีก", en: "CLOSES IN" },
    manual:  { th: "เปิดโหวตอยู่", en: "OPEN NOW" },
    pause:   { th: "พักระบบชั่วคราว", en: "SYSTEM PAUSED" },
    ended:   { th: "รอประกาศผลคะแนน", en: "POLL CLOSED" },
    loading: { th: "กำลังโหลด", en: "" },
  };
  const cap = CAP[kind] || CAP.loading;

  // election-day parts for the ENDED sheet (T2) — the voting day + close time, parsed
  // from the SAME resolved dates (config-driven; no literals). "วันที่ 6 กุมภาพันธ์
  // 2569" → day "6" / month-year "กุมภาพันธ์ 2569".
  const electionDay = ELECTION_START || ELECTION_END;
  const endDateMatch = electionDay ? formatThaiDate(electionDay).match(/วันที่\s+(\S+)\s+(\S+)\s+(\S+)/) : null;
  const endDayNum = endDateMatch ? endDateMatch[1] : "";
  const endMonthYear = endDateMatch ? `${endDateMatch[2]} ${endDateMatch[3]}` : "";

  return (
    <div ref={rootRef} className="fms-app rc-root rc-home-root rc-desk">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}
      <ReceiptBaseStyles />

      <ReceiptTopBar editorMode={editorMode} onSignIn={onSignIn} />

      {/* blind-emboss seals pressed into the desk paper (shared .rc-desk) */}
      <div className="rc-desk-seals" aria-hidden="true">
        <span className="rc-seal rc-seal--a"><i /><b /></span>
        <span className="rc-seal rc-seal--b"><i /><b /></span>
        <span className="rc-seal rc-seal--c"><i /><b /></span>
      </div>

      <div className="rc-home-wrap">
        <div className="rc-stage">
          {/* ===== HERO — the org-name NOTICE returns to a PAPER STACK held by a
              metal paperclip (the R2.5 language the owner loved), upgraded: receipt-
              stock card w/ 4px corners + .rc-grain, two tilted backing sheets, a
              ghost ink-stamp over the corner (opacity .12), and a ticket STUB peeking
              from underneath. NOT on the tape, NO "ท่อนที่" header. ===== */}
          <section className="rc-hero">
            <div className="rc-stack">
              <span className="rc-stack-sheet rc-stack-sheet--b" aria-hidden="true" />
              <span className="rc-stack-sheet rc-stack-sheet--a" aria-hidden="true" />

              {/* a ticket stub peeking out from under the card (A3 stub language) */}
              <div className="rc-stub-peek" aria-hidden="true">
                <span className="rc-mono">STUB</span>
                <span className="rc-stub-peek-ref rc-mono">{meta.prefix} {meta.number}</span>
              </div>

              <article className="rc-card rc-grain">
                {/* metal paperclip clasped over the top edge of the card */}
                <span className="rc-clip" aria-hidden="true"><i /></span>

                {/* ghost of a prior ink stamp over the card corner (opacity .12, B1) */}
                <div className="rc-ghost" aria-hidden="true">
                  <svg className="rc-ghost-svg" viewBox="0 0 120 120" focusable="false">
                    <defs>
                      <path id="rcGhostArc" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
                    </defs>
                    <circle className="rc-ghost-ring" cx="60" cy="60" r="54" />
                    <circle className="rc-ghost-ring rc-ghost-ring--in" cx="60" cy="60" r="42" />
                    <text className="rc-ghost-arc">
                      <textPath href="#rcGhostArc" xlinkHref="#rcGhostArc" startOffset="0%">
                        {`${meta.faculty} ELECTION · ${meta.prefix} ${meta.number}`}
                      </textPath>
                    </text>
                    {/* faculty เรือสำเภา at the seal centre (v2-R5f) — the SAME outline
                        as the desk seal, scaled into the 120-box ghost, inked via CSS */}
                    <g className="rc-ghost-ship" transform="translate(36 34) scale(.48)">
                      {RC_SHIP_PATHS.map((d, i) => <path key={i} d={d} />)}
                    </g>
                  </svg>
                </div>

                <div className="rc-notice-eyebrow rc-mono">✶ {meta.faculty} ELECTION{meta.calYear !== "" ? ` ${meta.calYear}` : ""} ✶</div>
                <h1 className="rc-notice-title">{meta.org}</h1>
                <p className="rc-notice-deck">{meta.campaign}</p>
                {ELECTION_START && (
                  <div className="rc-daterow">
                    <span className="rc-daterow-k">เปิดโหวต</span>
                    <span className="rc-daterow-v">{formatThaiDate(ELECTION_START)}</span>
                    <span className="rc-daterow-t">{formatThaiTime(ELECTION_START)}–{formatThaiTime(ELECTION_END)}</span>
                  </div>
                )}
              </article>
            </div>

            {/* ===== ACTION ROW — the primary CTA ladder sat as a big die-cut tag
                directly on the desk (grommet + foil rim on usable states, ~-0.6deg
                tilt) with the "ดูผู้สมัคร" ticket-stub beside it. Placed right under the
                hero card so the read→act path is one glance. The CTA logic / href /
                onCta / aria / disabled are the SAME 6-state ladder — only re-skinned +
                re-placed (the hanging string is retired). ===== */}
            <div className="rc-actions">
              <a
                href={ctaHref}
                onClick={onCta}
                role="button"
                aria-disabled={CTA.disabled ? "true" : undefined}
                className={`rc-cta ${CTA.disabled ? "is-disabled" : ""}`}
              >
                {!CTA.disabled && <span className="rc-foil" aria-hidden="true" />}
                {/* die-cut grommet — punched hole ringed with metal (present in every
                    state → no layout shift), aria-hidden */}
                <span className="rc-grommet" aria-hidden="true" />
                <span className="rc-cta-in">{CTA.label}<span className="rc-cta-arrow" aria-hidden="true">→</span></span>
              </a>

              <a href={editorMode ? undefined : getPath("/candidates")} className="rc-ticket-cta">
                <span className="rc-tkt-perf" aria-hidden="true" />
                <span className="rc-tkt-notch rc-tkt-notch--t" aria-hidden="true" />
                <span className="rc-tkt-notch rc-tkt-notch--b" aria-hidden="true" />
                <span className="rc-tkt-main">
                  <span className="rc-tkt-th">ดูผู้สมัคร</span>
                  <span className="rc-tkt-mono rc-mono">CANDIDATES →</span>
                </span>
              </a>
            </div>
          </section>

          {/* ===== RIGHT RAIL (sticky on desktop) — the CLOCK, then a short manila
              note (head + verify line). The CTA ladder + secondary stub moved under the
              hero card, so the rail ends at the note with nothing floating. ===== */}
          <div className="rc-rail">

            {/* ── CLOCK — the ONLY receipt object of the page (v2-R5e): a STANDING desk
                TEAR-OFF CALENDAR. A twin-loop wire binding is clasped over the top; a
                thick block of pages peeks below/right (still-to-tear); a perforation
                tear-guide runs under the binding; a standing shadow grounds it. The top
                page carries the same content (id · VOTE row · the big flip countdown ·
                today's date · red ENDED stamp). The machine LED lives on as a die-cut
                sticker at the binding corner — colour ↔ ledState (semantics UNCHANGED).
                print-reveal stays on the top page. ── */}
            <div className={`rc-clock rc-cal led-${ledState}`}>
              {/* twin-loop wire binding clasped over the top edge */}
              <div className="rc-cal-bind" aria-hidden="true">
                <span /><span /><span /><span /><span /><span /><span />
              </div>
              {/* the machine LED reborn as a die-cut sticker at the binding corner */}
              <span className="rc-cal-led" aria-hidden="true" />
              {/* the block of pages still to tear — stacked sheet edges behind the top page */}
              <span className="rc-cal-stack rc-cal-stack--3" aria-hidden="true" />
              <span className="rc-cal-stack rc-cal-stack--2" aria-hidden="true" />
              <span className="rc-cal-stack rc-cal-stack--1" aria-hidden="true" />

              <section className={`rc-cal-sheet rc-grain rc-seg--reveal rc-ticket ${isEnded ? "is-ended" : ""} ${isManual ? "is-manual" : ""} ${isPause ? "is-pause" : ""}`} aria-label="สถานะการลงคะแนน">
                <span className="rc-band" aria-hidden="true" />
                <span className="rc-cal-perf" aria-hidden="true" />
                <div className="rc-cal-id rc-mono">{meta.prefix} {meta.number} · HOME</div>
                <div className="rc-cal-head"><span className="rc-mono">VOTE ·</span> <span>ลงคะแนน</span></div>
                <div className="rc-slip-cap"><span>{cap.th}</span>{cap.en ? <small className="rc-mono">{cap.en}</small> : null}</div>

                {/* before/open — the flip COUNTDOWN to the target (DD:HH:MM:SS) */}
                {isCountdown && (
                  <div className="rc-slip-digits">
                    <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.d)} /><span className="rc-u">วัน</span></span>
                    <span className="rc-colon">:</span>
                    <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.h)} /><span className="rc-u">ชม.</span></span>
                    <span className="rc-colon">:</span>
                    <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.m)} /><span className="rc-u">นาที</span></span>
                    <span className="rc-colon">:</span>
                    <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.s)} /><span className="rc-u">วินาที</span></span>
                  </div>
                )}

                {/* MANUAL_OPEN past the scheduled close — forced-open fallback (R5g-ก):
                    NO digits and NO wall clock. The cap "เปิดโหวตอยู่ · OPEN NOW" + today's
                    date below carry the state; the green LED stays. No red stamp ever. */}

                {/* PAUSE — a calm waiting line (no digits, no stamp) */}
                {isPause && <div className="rc-pause-line">รอเปิดอีกครั้ง</div>}

                {/* ENDED — the election-DAY calendar sheet (T2): the big voting-day
                    number under its month/year, cross-stamped in red, with the close
                    time printed below. The red stamp appears HERE and nowhere else. */}
                {isEnded && (
                  <div className="rc-endsheet">
                    <div className="rc-endsheet-month">{endMonthYear}</div>
                    <div className="rc-endsheet-daywrap">
                      <div className="rc-endsheet-day">{endDayNum}</div>
                      <span className="rc-slip-stamp rc-endsheet-stamp"><span>ปิดโหวตแล้ว</span></span>
                    </div>
                    <div className="rc-endsheet-weekday">วันเลือกตั้ง</div>
                    <div className="rc-close-line">เวลาปิด {formatThaiTime(ELECTION_END)}</div>
                  </div>
                )}

                {/* ENDED — a live countdown to next year's election (T2). Sits under the
                    election-day leaf, separated by a perforation rule. The day tile can run
                    to 3 digits (~360 right after the vote) so this row is sized down to stay
                    on ONE line at 390px. New meaning ("เจอกันปีหน้า"), never duplicating the
                    "รอประกาศผลคะแนน" cap above (R5c one-meaning rule). */}
                {isEnded && (
                  <div className="rc-nextyear">
                    <div className="rc-nextyear-cap"><span>เจอกันปีหน้า</span><small className="rc-mono">SEE YOU NEXT YEAR</small></div>
                    <div className="rc-slip-digits rc-nextyear-digits" aria-label="นับถอยหลังสู่การเลือกตั้งครั้งถัดไป">
                      <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.d)} /><span className="rc-u">วัน</span></span>
                      <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.h)} /><span className="rc-u">ชม.</span></span>
                      <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.m)} /><span className="rc-u">นาที</span></span>
                      <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.s)} /><span className="rc-u">วินาที</span></span>
                    </div>
                  </div>
                )}

                {/* today's REAL date — every live state; the ended day-sheet prints the
                    election date itself instead */}
                {!isEnded && <div className="rc-cal-today" aria-label="วันที่วันนี้">{todayTh}</div>}

                <div className="rc-cal-ref rc-mono">{meta.prefix} {meta.number}{meta.calYear !== "" ? ` · ${meta.calYear}` : ""}</div>
              </section>
            </div>

            {/* manila note — the turnout register moved to its own slip and the CTA
                ladder moved under the hero card, so the note now carries only the
                "ลงคะแนน" head + a short verify-rights line. The rail ends here. */}
            <div className="rc-note">
              <span className="rc-note-pin rc-note-pin--l" aria-hidden="true" />
              <span className="rc-note-pin rc-note-pin--r" aria-hidden="true" />
              <div className="rc-note-h">ลงคะแนน</div>
              <p className="rc-note-b">ตรวจสอบสิทธิ์แล้วเข้าลงคะแนนได้ทันทีที่เปิดโหวต</p>
            </div>
          </div>{/* /rc-rail */}

          {/* ===== PERFORATION TRACK (v2-R5c) — a full-width punched separator that
              gives the desk a rhythm break between its top band (hero + rail) and its
              bottom band (turnout + poster). Desktop punches holes across the stage
              with a tiny mono desk-tag clipped on the line; mobile keeps a plain faint
              hairline (no tag). Pure-CSS ephemera, aria-hidden, base-visible. ===== */}
          <div className="rc-perf-track" aria-hidden="true">
            <span className="rc-perf-badge rc-mono">✶ {meta.prefix} {meta.number} · LIVE DESK ✶</span>
          </div>

          {/* ===== TURNOUT register — the real-time stats pulled off the manila note
              into their OWN full-width receipt slip (bottom-left on desktop): a mono
              head, the SAME live rows (used/rate/bar/parties — semantics untouched),
              a ref line + die-cut end + one-direction shadow. Balances the poster at
              bottom-right; unconditionally visible (no reveal-arming — matches its
              bottom-row sibling, the poster). ===== */}
          <section className="rc-turnout rc-grain" aria-label="รายงานยอดผู้ใช้สิทธิ์">
            {/* two geometric die-cut stickers stuck on the corners as desk ephemera
                (≤2, accent-faint, aria-hidden) */}
            <span className="rc-sticker rc-sticker--dot" aria-hidden="true" />
            <span className="rc-sticker rc-sticker--sq" aria-hidden="true" />

            {/* v2-R5c ephemera — a small piece of holographic tape on the slip's free
                (top-left) corner: the family's color-shift signature living OUTSIDE the
                CTA (shared .rc-foil ramp; reduced-motion freezes it static) */}
            <span className="rc-holo-tape rc-foil" aria-hidden="true" />
            {/* used ballot-stub scraps torn along the perforation, lying under the
                slip's lower-left edge (≤3, faint, aria-hidden; hidden on mobile) */}
            <span className="rc-stubs" aria-hidden="true">
              <span className="rc-stub-scrap rc-stub-scrap--c" />
              <span className="rc-stub-scrap rc-stub-scrap--b" />
              <span className="rc-stub-scrap rc-stub-scrap--a" />
            </span>
            <div className="rc-turnout-head"><span className="rc-mono">TURNOUT ·</span> <span>รายงานยอดผู้ใช้สิทธิ์</span></div>
            <div className="rc-register" aria-label="สถิติการใช้สิทธิ์">
              <div className="rc-register-row">
                <span className="rc-register-k"><span className="rc-live-dot" aria-hidden="true" />ใช้สิทธิ์แล้ว</span>
                <span className="rc-register-v"><span className="rc-reg-num rc-mono">{fmtInt(rawStats.totalVoted)}</span><small>คน</small></span>
              </div>
              <div className="rc-register-row">
                <span className="rc-register-k">อัตราการใช้สิทธิ์</span>
                <span className="rc-register-v"><span className="rc-reg-num rc-mono">{pct}</span><small>%</small></span>
              </div>
              <div className="rc-register-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, parseFloat(pct))}%` }} /></div>
              <div className="rc-register-row">
                <span className="rc-register-k">ผู้ลงสมัคร</span>
                <span className="rc-register-v"><span className="rc-reg-num rc-mono">{partyCount}</span><small>พรรค</small></span>
              </div>
            </div>
            <div className="rc-turnout-ref rc-mono">{meta.prefix} {meta.number} · TURNOUT</div>
            <div className="rc-turnout-end" aria-hidden="true" />
          </section>

          {/* ===== POSTER band — the admin promo poster taped down; bottom of the
              desk, docked RIGHT on desktop (balances the turnout slip at left). ===== */}
          <div className="rc-poster-sec">
            <figure className="rc-poster">
              {/* v2-R5f: two quiet translucent tabs on opposite corners (was 4 holo
                  strips) — reads as taped to the desk without shouting */}
              <span className="rc-poster-tape rc-poster-tape--l" aria-hidden="true" />
              <span className="rc-poster-tape rc-poster-tape--br" aria-hidden="true" />
              <img src={posterSrc} alt="โปสเตอร์ประชาสัมพันธ์การเลือกตั้ง" className="rc-poster-img" loading="lazy" />
              <figcaption className="rc-poster-cap">โปสเตอร์ประชาสัมพันธ์</figcaption>
            </figure>
          </div>
        </div>{/* /rc-stage */}

        {/* ===== footer — classic single centered line ===== */}
        <footer className="rc-home-footer">
          <p>© FMS@PSU{meta.copyrightYear !== "" ? ` ${meta.copyrightYear}` : ""}. All Rights Reserved.</p>
        </footer>
      </div>

      <style jsx global>{`
        /* ========== BASE (mobile-first — the polling desk) ==========
           laid-paper ::after + desk vignette ::before + blind-emboss seals + foil +
           grain come from the SHARED .rc-desk / .rc-grain classes in ReceiptBaseStyles
           (T1). This root opts in via .rc-desk on its root element. */
        .rc-home-root { --rc-stamp-red:#B91C1C;
          /* SEMANTIC dispenser-LED colours — locked across every theme (A8.1) */
          --rc-led-open:#16A34A; --rc-led-wait:#E0A200; --rc-led-closed:#C0403A;
          overflow-x:hidden; }

        :where(.rc-home-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-home-root a:focus-visible, .rc-home-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }
        /* mono utility — ONLY Latin / digits / symbols ever wear it (A10.3) */
        .rc-home-root .rc-mono { font-family:var(--rc-fm); }

        /* ================= TOPBAR — "head of the desk" (T2 / A3) ================= */
        /* backdrop-filter REMOVED (ruling #4): an OPAQUE desk fill + a perforated
           hairline instead of a blur. */
        .rc-home-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 96%, var(--rc-receipt)); }
        .rc-home-root .rc-topbar::after { content:""; position:absolute; left:0; right:0; bottom:0; height:1.5px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-home-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:10px 20px;
          display:flex; align-items:center; gap:14px; flex-wrap:wrap; }

        /* logo on a clipped paper tag with a tiny clip */
        .rc-home-root .rc-logo { position:relative; display:inline-flex; align-items:center; flex-shrink:0;
          padding:6px 12px 6px 14px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          box-shadow:1px 3px 8px -5px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-home-root .rc-logo::before { content:""; position:absolute; left:-3px; top:8px; width:10px; height:18px;
          border:2px solid var(--rc-faint); border-right:none; border-radius:6px 0 0 6px; background:transparent;
          transform:rotate(-4deg); }
        .rc-home-root .rc-logo__img { height:28px; width:auto; object-fit:contain; display:block; }

        /* nav = a row of ticket STUBS (cut corner + left perforation). Chakra, not
           mono (Thai labels). active = torn along the perforation + accent 8% fill. */
        .rc-home-root .rc-nav { display:none; gap:8px; margin-left:auto; align-items:center; }
        .rc-home-root .rc-nav__link { position:relative; display:inline-flex; align-items:center; min-height:40px;
          font-family:var(--rc-fr); font-weight:600; font-size:12.5px; letter-spacing:.01em; color:var(--rc-ink2);
          padding:0 13px 0 16px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px);
          transition:transform .15s ease, color .2s ease, background .2s ease, border-color .2s ease; }
        .rc-home-root .rc-nav__link::before { content:""; position:absolute; left:4px; top:7px; bottom:7px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-home-root .rc-nav__link:hover { transform:translateY(-1px); color:var(--rc-ink); border-color:var(--rc-accent); }
        .rc-home-root .rc-nav__link.on { color:var(--rc-accent-deep); border-color:var(--rc-accent);
          background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        /* active stub is "torn" — the perforation opens (accent dashes, shifted to the edge) */
        .rc-home-root .rc-nav__link.on::before { left:1px;
          background:repeating-linear-gradient(180deg, var(--rc-accent) 0 2px, transparent 2px 5px); }

        /* user chip + burger */
        .rc-home-root .rc-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .rc-home-root .rc-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--rc-fh);
          font-weight:600; font-size:13px; color:var(--rc-on-accent); background:var(--rc-accent); border:none; cursor:pointer;
          padding:9px 20px; border-radius:var(--rc-radius-button, 8px); transition:background .2s ease, transform .15s ease; }
        .rc-home-root .rc-loginbtn:hover { background:var(--rc-accent-deep); transform:translateY(-1px); }
        .rc-home-root .rc-loginbtn:active { transform:scale(.96); }
        .rc-home-root .rc-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--rc-line) 70%, var(--rc-receipt)); }
        .rc-home-root .rc-skelbar { display:block; width:58px; height:12px; border-radius:3px;
          background:color-mix(in srgb, var(--rc-ink2) 30%, var(--rc-receipt)); animation:rcPulse 1.3s ease-in-out infinite; }
        @keyframes rcPulse { 0%,100%{opacity:.45} 50%{opacity:1} }

        /* user chip = a LANYARD CARD (cut corner + a punched grommet hole on top) */
        .rc-home-root .rc-userchip { position:relative; }
        .rc-home-root .rc-userchip__btn { position:relative; display:inline-flex; align-items:center; gap:9px; min-height:44px;
          background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); padding:5px 14px 5px 5px; cursor:pointer;
          font-family:inherit; clip-path:polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
          transition:transform .15s ease, border-color .2s ease; }
        .rc-home-root .rc-userchip__btn::after { content:""; position:absolute; top:5px; right:12px; width:9px; height:9px;
          border-radius:50%; background:var(--rc-desk);
          box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--rc-faint) 62%, var(--rc-ink2)); }
        .rc-home-root .rc-userchip__btn:hover { border-color:var(--rc-accent); }
        .rc-home-root .rc-userchip__btn:active { transform:scale(.97); }
        .rc-home-root .rc-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:var(--rc-accent); color:var(--rc-on-accent); font-family:var(--rc-fh); font-weight:700; font-size:14px; line-height:1; }
        .rc-home-root .rc-userchip__name { font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-home-root .rc-userchip__caret { color:var(--rc-ink2); font-size:11px; }
        .rc-home-root .rc-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:10px; overflow:hidden; z-index:50;
          box-shadow:2px 20px 42px -20px color-mix(in srgb, var(--rc-ink) 22%, transparent); }
        .rc-home-root .rc-usermenu__head { padding:14px 16px; border-bottom:1px dotted var(--rc-line); }
        .rc-home-root .rc-usermenu__name { font-family:var(--rc-fh); font-weight:700; font-size:14px; color:var(--rc-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-home-root .rc-usermenu__id { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.04em; color:var(--rc-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-home-root .rc-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-accent-deep); }
        .rc-home-root .rc-usermenu__out:hover { background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }

        .rc-home-root .rc-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:8px; background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); cursor:pointer;
          transition:transform .15s ease, border-color .2s ease; }
        .rc-home-root .rc-burger:hover { border-color:var(--rc-accent); }
        .rc-home-root .rc-burger:active { transform:scale(.95); }
        .rc-home-root .rc-burger span { display:block; height:2.5px; border-radius:2px; background:var(--rc-ink); }

        /* mobile sheet — a stack of nav stubs */
        .rc-home-root .rc-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:8px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .rc-home-root .rc-sheet.is-open { max-height:320px; opacity:1; padding:12px 0 4px; }
        .rc-home-root .rc-sheet__link { position:relative; display:flex; align-items:center; min-height:48px; padding:0 16px 0 20px;
          font-family:var(--rc-fr); font-weight:600; font-size:14px; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px); transition:border-color .2s ease; }
        .rc-home-root .rc-sheet__link::before { content:""; position:absolute; left:5px; top:9px; bottom:9px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-home-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ================= PAGE CONTAINER ================= */
        .rc-home-root .rc-home-wrap { position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:26px 20px 80px; }
        .rc-home-root .rc-stage { position:relative; }

        /* ============ DESK TEAR-OFF CALENDAR (v2-R5e — replaces the taped strip) ============
           The v2-R5b register strip read too flat ("กระดาษแปะเฉยๆ เรียบไป"). The clock is
           now a STANDING desk calendar: a twin-loop wire binding clasped over the top,
           a THICK block of pages whose edges peek below/right (still-to-tear), a
           perforation tear-guide under the binding, and a standing shadow on the desk.
           The machine LED lives on as a die-cut sticker at the binding corner (colour ↔
           ledState — SEMANTIC, unchanged). The sheet's face is driven by cd.kind
           (v2-R5f state table) — see useCountdown. */
        .rc-home-root .rc-cal { position:relative; z-index:3; margin:16px 12px 0; padding-top:14px; }
        /* the standing shadow the whole block casts on the desk below */
        .rc-home-root .rc-cal::after { content:""; position:absolute; z-index:0; left:8%; right:6%; bottom:-14px; height:22px;
          border-radius:50%; pointer-events:none;
          background:radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--rc-ink) 24%, transparent), transparent 72%); }

        /* twin-loop WIRE BINDING clasped over the top edge — a row of small metal loops
           sitting above a thin spine bar (wire-o binding). */
        .rc-home-root .rc-cal-bind { position:absolute; z-index:7; top:0; left:16px; right:16px; height:20px;
          display:flex; justify-content:space-between; align-items:flex-start; pointer-events:none; }
        .rc-home-root .rc-cal-bind::before { content:""; position:absolute; left:-5px; right:-5px; top:11px; height:3px; border-radius:2px;
          background:linear-gradient(180deg, color-mix(in srgb, var(--rc-faint) 72%, var(--rc-receipt)),
            color-mix(in srgb, var(--rc-ink2) 52%, var(--rc-faint))); }
        .rc-home-root .rc-cal-bind span { position:relative; z-index:1; width:9px; height:18px; border-radius:5px 5px 3px 3px;
          border:2px solid color-mix(in srgb, var(--rc-ink2) 52%, var(--rc-faint)); border-bottom:none;
          background:linear-gradient(105deg, transparent 42%, color-mix(in srgb, var(--rc-receipt) 74%, transparent) 50%, transparent 58%); }

        /* LED die-cut STICKER at the binding's right corner (colour ↔ ledState — SEMANTIC,
           unchanged from v2-R5b). die-cut = a receipt-white rim around the colour. */
        .rc-home-root .rc-cal-led { position:absolute; z-index:8; top:-8px; right:22px;
          width:20px; height:20px; border-radius:50%; background:var(--rc-led-wait);
          border:2.5px solid var(--rc-receipt);
          box-shadow:0 3px 7px -3px color-mix(in srgb, var(--rc-ink) 46%, transparent),
                     inset 0 0 0 1px color-mix(in srgb, var(--rc-ink) 14%, transparent); }
        .rc-home-root .rc-cal.led-open .rc-cal-led { background:var(--rc-led-open); }
        .rc-home-root .rc-cal.led-wait .rc-cal-led { background:var(--rc-led-wait); }
        .rc-home-root .rc-cal.led-closed .rc-cal-led { background:var(--rc-led-closed); opacity:.92; }

        /* the BLOCK of pages still to tear — three stacked sheet edges behind the top
           page, offset down/right so their edges read as thickness. */
        .rc-home-root .rc-cal-stack { position:absolute; z-index:1; left:0; right:0; top:12px; bottom:0; border-radius:3px;
          background:var(--rc-receipt-edge); border:1px solid var(--rc-line);
          box-shadow:1px 8px 18px -14px color-mix(in srgb, var(--rc-ink) 38%, transparent); }
        .rc-home-root .rc-cal-stack--1 { transform:translate(3px, 4px); }
        .rc-home-root .rc-cal-stack--2 { transform:translate(6px, 8px); background:color-mix(in srgb, var(--rc-receipt-edge) 88%, var(--rc-ink)); }
        .rc-home-root .rc-cal-stack--3 { transform:translate(9px, 12px); background:color-mix(in srgb, var(--rc-receipt-edge) 80%, var(--rc-ink)); }
        /* faint print-banding overlay (~3% ink horizontal lines) — the thermal look.
           z-index:-1 → paints above the grain paper, BELOW the print (text). */
        .rc-home-root .rc-band { position:absolute; inset:0; z-index:-1; pointer-events:none;
          background:repeating-linear-gradient(180deg,
            color-mix(in srgb, var(--rc-ink) 3%, transparent) 0 1px, transparent 1px 8px); }

        /* ================= HERO — paper-stack notice (A5 return to the R2.5 language) ================= */
        /* the org-name card on receipt stock, clasped by a metal paperclip, with two
           tilted backing sheets and a ticket stub peeking underneath. NOT a tape. */
        .rc-home-root .rc-hero { position:relative; z-index:2; }
        .rc-home-root .rc-stack { position:relative; align-self:flex-start; max-width:520px; margin:8px 12px 0; }
        /* the hero card now reads as thermal stock (v2-R5b): faint horizontal print-
           banding layered under the print, plus a tighter bottom box-shadow that reads
           as the sheet curling/lifting off the desk. Stays a paper STACK, not a roll. */
        .rc-home-root .rc-card { position:relative; z-index:3; border-radius:4px; padding:38px 22px 22px;
          background-color:var(--rc-receipt);
          background-image:repeating-linear-gradient(180deg,
            color-mix(in srgb, var(--rc-ink) 3%, transparent) 0 1px, transparent 1px 8px);
          border:1px solid var(--rc-line);
          box-shadow:2px 20px 42px -24px color-mix(in srgb, var(--rc-ink) 40%, transparent),
                     0 11px 15px -11px color-mix(in srgb, var(--rc-ink) 36%, transparent); }
        /* two tilted backing sheets — the paper "stack" */
        .rc-home-root .rc-stack-sheet { position:absolute; inset:0; border-radius:4px; background:var(--rc-receipt);
          border:1px solid var(--rc-line);
          box-shadow:1px 10px 22px -16px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-home-root .rc-stack-sheet--a { z-index:2; transform:rotate(-1.5deg) translate(-6px, 5px); }
        .rc-home-root .rc-stack-sheet--b { z-index:1; transform:rotate(1.8deg) translate(7px, 9px);
          background:var(--rc-receipt-edge); }
        /* metal paperclip clasped over the top edge (gem clip = two nested loops) */
        .rc-home-root .rc-clip { position:absolute; z-index:4; top:-15px; left:32px; width:16px; height:54px;
          border:2px solid color-mix(in srgb, var(--rc-ink2) 55%, var(--rc-faint)); border-radius:8px;
          background:linear-gradient(105deg, transparent 44%, color-mix(in srgb, var(--rc-receipt) 70%, transparent) 50%, transparent 56%); }
        .rc-home-root .rc-clip i { position:absolute; left:4px; right:4px; top:7px; bottom:-3px;
          border:2px solid color-mix(in srgb, var(--rc-ink2) 45%, var(--rc-faint)); border-bottom:none; border-radius:5px 5px 0 0; }
        /* a ticket stub peeking from under the card's lower-left */
        .rc-home-root .rc-stub-peek { position:absolute; z-index:0; left:26px; bottom:-15px; display:inline-flex;
          align-items:baseline; gap:8px; padding:8px 14px 11px; transform:rotate(-2.4deg); transform-origin:top left;
          background:var(--rc-receipt); border:1px solid var(--rc-line); border-top:none; border-radius:0 0 4px 4px;
          box-shadow:2px 9px 18px -11px color-mix(in srgb, var(--rc-ink) 42%, transparent); }
        .rc-home-root .rc-stub-peek .rc-mono { font-size:9px; letter-spacing:.2em; color:var(--rc-ink2); }
        .rc-home-root .rc-stub-peek-ref { color:var(--rc-ink); font-variant-numeric:tabular-nums; }

        /* ================= CLOCK — desk tear-off CALENDAR (the ONLY receipt object) ================= */
        .rc-home-root .rc-clock { position:relative; z-index:3; margin:0 12px; }
        /* the top (current) PAGE of the calendar — grain paper on receipt stock. */
        .rc-home-root .rc-cal-sheet { position:relative; z-index:2; margin:14px 0 0; padding:24px clamp(16px,4.5vw,22px) 20px;
          background-color:var(--rc-receipt); border:1px solid var(--rc-line); border-radius:3px;
          box-shadow:2px 16px 34px -22px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        /* PERFORATION tear-guide just under the binding — punched holes across the sheet
           (fold along here + tear the day off; die-cut holes, NOT a torn edge — P-LOG-086). */
        .rc-home-root .rc-cal-perf { position:absolute; z-index:3; left:0; right:0; top:11px; height:3px; pointer-events:none;
          background:radial-gradient(circle at center, var(--rc-desk) 1.5px, transparent 1.9px) top left/9px 3px repeat-x; opacity:.8; }
        /* mono page id — carries the retired machine label "SAMO n · HOME" (Latin/digits) */
        .rc-home-root .rc-cal-id { font-size:9.5px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--rc-ink2); margin-bottom:10px; }
        /* page head — mono "VOTE ·" + Chakra Thai (A10.3) */
        .rc-home-root .rc-cal-head { display:flex; align-items:baseline; gap:7px; font-family:var(--rc-fr);
          font-size:11px; font-weight:600; letter-spacing:.04em; color:var(--rc-accent-deep); text-transform:uppercase; margin-bottom:12px; }
        .rc-home-root .rc-cal-head .rc-mono { font-size:10px; letter-spacing:.18em; color:var(--rc-ink2); font-weight:400; }
        /* the flip countdown is the sheet's HERO — centred + enlarged (flip-clock tiles) */
        .rc-home-root .rc-cal .rc-slip-digits { justify-content:center; gap:7px; margin-top:14px; }
        /* flip-calendar tiles carry unit labels — colons are clock grammar, and an
           orphaned colon at a wrap point reads broken. The calendar drops them, and
           the tiles size to keep all four groups on ONE row of the sheet. */
        .rc-home-root .rc-cal .rc-colon { display:none; }
        .rc-home-root .rc-cal .rc-slip-digits { gap:10px; flex-wrap:nowrap; }
        .rc-home-root .rc-cal .rc-cd-n { font-size:clamp(26px, 7.5vw, 37px); }
        .rc-home-root .rc-cal .rc-cd-n { font-size:clamp(34px, 12vw, 52px); }
        /* today's REAL date (client-computed), printed small + centred under the number.
           Chakra (Thai present) — NOT mono per A10.3. */
        .rc-home-root .rc-cal-today { margin-top:14px; text-align:center; font-family:var(--rc-fr); font-size:12px;
          letter-spacing:.02em; color:var(--rc-ink2); font-variant-numeric:tabular-nums; }
        /* mono ref line (Latin/digits) */
        .rc-home-root .rc-cal-ref { margin-top:16px; font-size:11px; letter-spacing:.16em; color:var(--rc-ink);
          font-variant-numeric:tabular-nums; }

        /* ---- notice card content ---- */
        .rc-home-root .rc-notice-eyebrow { font-family:var(--rc-fm); font-size:10px; letter-spacing:.22em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-home-root .rc-notice-title { margin:12px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.12;
          letter-spacing:-.01em; font-size:clamp(27px, 6vw, 42px); color:var(--rc-ink); }
        /* the campaign/PROJECT name — elevated in the hierarchy (larger + bolder +
           full ink) so it reads as the headline subject under the org identity. */
        .rc-home-root .rc-notice-deck { margin:14px 0 0; max-width:40ch; font-family:var(--rc-fr); font-size:18px;
          font-weight:600; line-height:1.5; letter-spacing:.005em; color:var(--rc-ink); }
        .rc-home-root .rc-daterow { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; margin-top:18px;
          font-family:var(--rc-fr); font-size:13px; letter-spacing:.01em; color:var(--rc-ink); font-variant-numeric:tabular-nums; }
        .rc-home-root .rc-daterow-k { font-family:var(--rc-fr); font-size:10px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--rc-accent-deep); font-weight:700; }
        .rc-home-root .rc-daterow-t { color:var(--rc-ink2); }

        /* ghost stamp over the head segment corner (opacity .12 per B1) */
        .rc-home-root .rc-ghost { position:absolute; z-index:0; right:-6px; top:-10px; width:112px; height:112px;
          opacity:.12; transform:rotate(-12deg); pointer-events:none; }
        .rc-home-root .rc-ghost-svg { display:block; width:100%; height:100%; overflow:visible; }
        .rc-home-root .rc-ghost-ring { fill:none; stroke:var(--rc-ink); stroke-width:2.4; }
        .rc-home-root .rc-ghost-ring--in { stroke-width:1.4; }
        .rc-home-root .rc-ghost-arc { fill:var(--rc-ink); font-family:var(--rc-fm); font-size:10px; letter-spacing:.14em;
          text-transform:uppercase; }
        /* v2-R5f — the faculty เรือสำเภา line-art at the ghost seal's centre */
        .rc-home-root .rc-ghost-ship { fill:none; stroke:var(--rc-ink); stroke-width:3;
          stroke-linecap:round; stroke-linejoin:round; }

        /* ---- T2 queue-ticket countdown ---- */
        .rc-home-root .rc-slip-cap { display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
        .rc-home-root .rc-slip-cap span { font-family:var(--rc-fr); font-size:15px; letter-spacing:.01em; color:var(--rc-accent-deep); font-weight:700; }
        .rc-home-root .rc-slip-cap small { font-size:9px; letter-spacing:.24em; text-transform:uppercase; color:var(--rc-faint); }

        .rc-home-root .rc-slip-digits { display:flex; align-items:flex-start; gap:6px; margin-top:16px; flex-wrap:wrap; }
        .rc-home-root .rc-seg-cd { display:flex; flex-direction:column; align-items:center; }
        .rc-home-root .rc-cd-n { font-family:var(--rc-fr); font-weight:700; font-size:clamp(30px, 10vw, 44px); line-height:1;
          letter-spacing:0; font-variant-numeric:tabular-nums; color:var(--rc-ink); display:inline-flex; align-items:center; gap:3px; }
        .rc-home-root .rc-cd-cell { box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
          width:.74em; height:1.14em; overflow:hidden; position:relative;
          background:linear-gradient(180deg, var(--rc-receipt), var(--rc-receipt-edge));
          border:1px solid var(--rc-stamp-line); border-radius:3px;
          box-shadow:1px 2px 5px -3px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        .rc-home-root .rc-cd-cell::after { content:""; position:absolute; left:0; right:0; top:50%; height:1px; z-index:2;
          background:color-mix(in srgb, var(--rc-ink) 20%, transparent); }
        /* transform-only roll; NO persistent will-change (addendum A7.1 — never leave
           will-change stuck; the .28s transform composites fine without it). */
        .rc-home-root .rc-cd-char { display:block; line-height:1; text-align:center;
          animation:rcRoll .28s cubic-bezier(.22,1,.36,1) both; }
        @keyframes rcRoll { from { transform:translateY(100%); } }
        .rc-home-root .rc-u { font-family:var(--rc-fr); font-size:9px; letter-spacing:.06em;
          color:var(--rc-ink2); margin-top:6px; }
        .rc-home-root .rc-colon { font-family:var(--rc-fr); font-weight:400; font-size:clamp(26px, 8vw, 38px);
          color:color-mix(in srgb, var(--rc-ink2) 60%, var(--rc-receipt)); align-self:flex-start; line-height:1; margin-top:.08em; }

        /* red cross-stamp — a diagonal ink stamp (B1). Rendered only on the ENDED
           day-sheet now (conditional JSX), so no display toggle needed. */
        .rc-home-root .rc-slip-stamp { position:relative; width:fit-content; padding:7px 18px;
          transform:rotate(-6deg); border:2.5px solid var(--rc-stamp-red); border-radius:6px; opacity:.9; }
        .rc-home-root .rc-slip-stamp span { position:relative; z-index:0; font-family:var(--rc-fh); font-weight:700; font-size:22px; letter-spacing:.02em;
          color:var(--rc-stamp-red); }
        /* organic ink texture (v2-R5b) — faint paper-coloured patches overlaid so the
           red reads as unevenly pressed ink, not a flat fill. Static (A7-safe). */
        .rc-home-root .rc-slip-stamp::after { content:""; position:absolute; inset:0; z-index:1; border-radius:inherit; pointer-events:none;
          background:
            radial-gradient(58% 42% at 18% 28%, color-mix(in srgb, var(--rc-receipt) 34%, transparent), transparent 62%),
            radial-gradient(42% 52% at 78% 66%, color-mix(in srgb, var(--rc-receipt) 26%, transparent), transparent 58%),
            radial-gradient(30% 34% at 54% 18%, color-mix(in srgb, var(--rc-receipt) 22%, transparent), transparent 52%); }
        .rc-home-root .rc-close-line { margin-top:12px; text-align:center; font-family:var(--rc-fr); font-size:13px; color:var(--rc-ink);
          font-variant-numeric:tabular-nums; }

        /* ---- PAUSE — a calm centred waiting line (no digits, no stamp) ---- */
        .rc-home-root .rc-pause-line { margin-top:22px; margin-bottom:8px; text-align:center; font-family:var(--rc-fr);
          font-size:14px; letter-spacing:.01em; color:var(--rc-ink2); }

        /* ================= T2 — ENDED "election-day" calendar sheet =================
           The done state is no longer an empty ticket: the top page becomes a torn-off
           calendar leaf for the VOTING DAY — the day number huge + tabular, the month/
           year above, "วันเลือกตั้ง" below, the red "ปิดโหวตแล้ว" stamp pressed diagonally
           over the number's corner, and the close time printed under it. Dense enough to
           read as well-composed as the live countdown, never a bare slip. */
        .rc-home-root .rc-endsheet { position:relative; margin-top:14px; text-align:center; }
        .rc-home-root .rc-endsheet-month { font-family:var(--rc-fr); font-size:14px; font-weight:600; letter-spacing:.04em;
          color:var(--rc-accent-deep); }
        .rc-home-root .rc-endsheet-daywrap { position:relative; display:inline-block; margin:2px auto 0; }
        .rc-home-root .rc-endsheet-day { font-family:var(--rc-fr); font-weight:700; font-size:clamp(78px, 26vw, 118px); line-height:1;
          letter-spacing:-.02em; color:var(--rc-ink); font-variant-numeric:tabular-nums; }
        /* the red stamp pressed diagonally over the number's corner — one line, never
           wrapped (an absolutely-positioned stamp would otherwise wrap inside the
           narrow day-number box) */
        .rc-home-root .rc-endsheet-stamp { position:absolute; z-index:2; top:14px; right:-14px; transform:rotate(-11deg);
          transform-origin:center; white-space:nowrap; }
        .rc-home-root .rc-endsheet-stamp span { font-size:19px; }
        .rc-home-root .rc-endsheet-weekday { margin-top:6px; font-family:var(--rc-fr); font-size:13px; letter-spacing:.06em;
          color:var(--rc-ink2); }

        /* ---- T2 "เจอกันปีหน้า" — a live countdown to next year's election, printed under
           the election-day leaf. A dashed perforation rule (never a torn edge) separates
           it; the tiles are sized DOWN from the hero countdown so the day group can carry
           3 digits without wrapping off the sheet at 390px. ---- */
        .rc-home-root .rc-nextyear { margin-top:20px; padding-top:16px; border-top:1px dashed var(--rc-line); }
        .rc-home-root .rc-nextyear-cap { display:flex; flex-direction:column; align-items:center; gap:3px; }
        .rc-home-root .rc-nextyear-cap span { font-family:var(--rc-fr); font-size:15px; letter-spacing:.01em;
          color:var(--rc-accent-deep); font-weight:700; }
        .rc-home-root .rc-nextyear-cap small { font-size:9px; letter-spacing:.24em; text-transform:uppercase; color:var(--rc-faint); }
        .rc-home-root .rc-cal .rc-nextyear-digits { margin-top:12px; gap:8px; flex-wrap:nowrap; }
        .rc-home-root .rc-cal .rc-nextyear-digits .rc-cd-n { font-size:clamp(20px, 6.2vw, 28px); }

        /* ---- T3 turnout register ---- */
        /* rows given more vertical air (v2-R5b) so the left slip's bottom lands ~level
           with the enlarged poster at right. */
        .rc-home-root .rc-register-row { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          padding:16px 0; border-bottom:1px dotted var(--rc-line); }
        .rc-home-root .rc-register-row:last-child { border-bottom:none; }
        .rc-home-root .rc-register-k { font-family:var(--rc-fr); font-size:12px; letter-spacing:.02em;
          color:var(--rc-ink2); display:inline-flex; align-items:center; }
        .rc-home-root .rc-register-v { font-family:var(--rc-fr); font-weight:700; font-size:25px; color:var(--rc-ink);
          font-variant-numeric:tabular-nums; letter-spacing:.01em; }
        /* the stat NUMBER itself → Space Mono tabular (Latin/digits only — A10.3); the
           Thai/symbol unit keeps Chakra via .rc-register-v small. */
        .rc-home-root .rc-reg-num { font-family:var(--rc-fm); font-variant-numeric:tabular-nums;
          font-size:24px; letter-spacing:0; line-height:1; }
        .rc-home-root .rc-register-v small { font-family:var(--rc-fr); font-size:11px; font-weight:400; color:var(--rc-ink2);
          margin-left:5px; letter-spacing:.02em; }
        .rc-home-root .rc-live-dot { width:6px; height:6px; border-radius:50%; background:var(--rc-accent); margin-right:6px;
          animation:rcBlip 1.6s infinite; }
        @keyframes rcBlip { 50%{opacity:.3} }
        .rc-home-root .rc-register-bar { position:relative; height:3px; border-radius:2px; margin:6px 0; overflow:hidden;
          background:color-mix(in srgb, var(--rc-line) 60%, var(--rc-receipt)); }
        /* the fill scales in X (transform-only per A7.1 — never animates the width
           layout property). The inline width sets the target extent; scaleX stays 1. */
        .rc-home-root .rc-register-bar > span { display:block; height:100%; border-radius:2px; background:var(--rc-accent);
          transform-origin:left center; }

        /* ---- turnout register slip — its OWN receipt-stock object (bottom-left on
           desktop). full-width paper card: mono head, the live register rows, a ref
           line + die-cut end + single-direction shadow. base-visible. ---- */
        .rc-home-root .rc-turnout { position:relative; z-index:2; margin:22px auto 0; max-width:360px;
          background-color:var(--rc-receipt); border:1px solid var(--rc-line); border-radius:4px 4px 3px 3px;
          padding:16px clamp(16px,4vw,20px) 0;
          box-shadow:2px 16px 34px -22px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        .rc-home-root .rc-turnout-head { display:flex; align-items:baseline; gap:7px; margin-bottom:6px;
          font-family:var(--rc-fr); font-size:12px; font-weight:700; letter-spacing:.02em;
          color:var(--rc-accent-deep); text-transform:uppercase; }
        .rc-home-root .rc-turnout-head .rc-mono { font-size:10px; letter-spacing:.18em; color:var(--rc-ink2); font-weight:400; }
        .rc-home-root .rc-turnout-head span:last-child { text-transform:none; font-size:13px; }
        .rc-home-root .rc-turnout-ref { margin-top:14px; font-size:10px; letter-spacing:.16em; color:var(--rc-ink2);
          font-variant-numeric:tabular-nums; }
        .rc-home-root .rc-turnout-end { height:11px; margin:12px calc(-1 * clamp(16px,4vw,20px)) 0; background:var(--rc-receipt);
          box-shadow:0 8px 18px -14px color-mix(in srgb, var(--rc-ink) 40%, transparent);
          -webkit-mask:radial-gradient(7px 11px at 9px 100%, transparent 96%, #000) bottom left/18px 11px repeat-x;
                  mask:radial-gradient(7px 11px at 9px 100%, transparent 96%, #000) bottom left/18px 11px repeat-x; }

        /* geometric die-cut STICKERS (v2-R5b) — desk ephemera stuck on the turnout
           slip's corners. Exactly TWO, accent-faint, aria-hidden — a circle + a cut-
           corner square. Anchored to corners so they never float / clutter. */
        .rc-home-root .rc-sticker { position:absolute; z-index:5; pointer-events:none; }
        /* v2-R5f: chroma pulled down so they sit quietly on the corners (were louder
           accent tints competing with the turnout numbers) */
        .rc-home-root .rc-sticker--dot { top:-13px; right:-9px; width:34px; height:34px; border-radius:50%; transform:rotate(-8deg);
          background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt));
          border:1.5px solid color-mix(in srgb, var(--rc-accent) 24%, transparent);
          box-shadow:0 3px 8px -3px color-mix(in srgb, var(--rc-ink) 28%, transparent); }
        .rc-home-root .rc-sticker--sq { left:-10px; bottom:28px; width:28px; height:28px; transform:rotate(6deg);
          background:color-mix(in srgb, var(--rc-accent) 6%, var(--rc-receipt));
          border:1.5px solid color-mix(in srgb, var(--rc-accent) 20%, transparent);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          box-shadow:0 3px 8px -3px color-mix(in srgb, var(--rc-ink) 26%, transparent); }

        /* ---- holographic tape (v2-R5c) — one small piece on the turnout slip's free
           corner: the color-shift signature living OUTSIDE the CTA. Uses the shared
           .rc-foil ramp (animated drift); reduced-motion freezes it to a static
           iridescent sheen; multiply + low opacity reads it as translucent film. ---- */
        /* v2-R5f: this is now the ONLY holographic piece left on the desk (poster tapes
           went matte) — kept as the family's single quiet colour-shift signature,
           nudged a touch fainter so it reads as a calm accent, not a focal point. */
        .rc-home-root .rc-holo-tape { position:absolute; z-index:5; top:-10px; left:-8px; width:42px; height:18px;
          border-radius:1px; transform:rotate(-24deg); opacity:.4; mix-blend-mode:multiply; pointer-events:none;
          box-shadow:1px 2px 4px -1px color-mix(in srgb, var(--rc-ink) 26%, transparent); }

        /* ---- used ballot-stub scraps (v2-R5c) — desk ephemera lying under the turnout
           slip's lower-left, torn along a perforation (die-cut top edge). ≤3 small
           faint scraps, aria-hidden; hidden on the calm mobile desk (≤420). ---- */
        .rc-home-root .rc-stubs { position:absolute; z-index:1; left:14px; bottom:-26px; width:132px; height:34px;
          pointer-events:none; }
        .rc-home-root .rc-stub-scrap { position:absolute; bottom:0; width:52px; height:30px; border-radius:2px;
          background:var(--rc-receipt); border:1px solid var(--rc-line); border-top:none;
          box-shadow:1px 5px 12px -8px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        /* the torn-off perforation edge along the top of each scrap (holes = desk through) */
        .rc-home-root .rc-stub-scrap::before { content:""; position:absolute; left:0; right:0; top:-1px; height:3px;
          background:radial-gradient(circle at center, var(--rc-desk) 1.4px, transparent 1.7px) top left/7px 3px repeat-x; }
        /* a faint printed bar across the scrap */
        .rc-home-root .rc-stub-scrap::after { content:""; position:absolute; left:6px; right:6px; top:11px; height:2px;
          border-radius:1px; background:color-mix(in srgb, var(--rc-ink2) 26%, transparent); }
        .rc-home-root .rc-stub-scrap--a { left:0; transform:rotate(-3deg); }
        .rc-home-root .rc-stub-scrap--b { left:26px; bottom:2px; transform:rotate(2.5deg); background:var(--rc-receipt-edge); }
        .rc-home-root .rc-stub-scrap--c { left:52px; transform:rotate(-1.5deg); opacity:.9; }

        /* ---- perforation track (v2-R5c) — full-width punched rhythm line between the
           desk's top band and bottom band. mobile-first = a plain faint hairline, no
           tag; ≥1024 the holes punch through + a mono desk-tag sits centred on it. ---- */
        .rc-home-root .rc-perf-track { position:relative; display:flex; align-items:center; justify-content:center;
          height:16px; margin:8px 12px; }
        .rc-home-root .rc-perf-track::before { content:""; position:absolute; left:0; right:0; top:50%; height:1px;
          transform:translateY(-50%); background:color-mix(in srgb, var(--rc-line) 80%, transparent); }
        .rc-home-root .rc-perf-badge { display:none; }

        /* ================= RAIL + DESK OBJECTS ================= */
        /* mobile-first: hero (card + CTA action row) first, then the rail (clock +
           note) stacks below it, then the turnout slip + poster band. desktop lifts the
           rail into a sticky right column that slightly overlaps the hero's right edge
           (see 1024px). */
        .rc-home-root .rc-rail { position:relative; z-index:6; margin:22px 0 0;
          display:flex; flex-direction:column; gap:22px; }

        /* manila note pinned by two fasteners */
        .rc-home-root .rc-note { position:relative; align-self:flex-start; max-width:340px; background:var(--rc-note); border-radius:3px;
          padding:20px 18px 16px; transform:rotate(-1.2deg);
          border:1px solid color-mix(in srgb, var(--rc-note) 80%, var(--rc-ink));
          box-shadow:2px 12px 24px -14px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        .rc-home-root .rc-note-pin { position:absolute; top:9px; width:11px; height:11px; border-radius:50%; z-index:1;
          background:radial-gradient(circle at 38% 32%, var(--rc-receipt), var(--rc-faint) 52%, var(--rc-ink2) 100%);
          box-shadow:0 1.5px 2px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-home-root .rc-note-pin--l { left:12px; } .rc-home-root .rc-note-pin--r { right:12px; }
        .rc-home-root .rc-note-h { font-family:var(--rc-fh); font-weight:700; font-size:16px; color:var(--rc-ink); }
        .rc-home-root .rc-note-b { margin:6px 0 0; font-family:var(--rc-fr); font-size:13px; line-height:1.6; color:var(--rc-ink2); }

        /* ---- action row — primary CTA (die-cut desk tag) + secondary stub, sat
           directly under the hero card. mobile-first: a full-width column with the CTA
           FIRST (actionable immediately); ≥640px becomes a single tag + stub row. ---- */
        .rc-home-root .rc-actions { position:relative; z-index:5; margin:26px 12px 0;
          display:flex; flex-direction:column; align-items:stretch; gap:12px; }
        /* ticket goes full-width & centred while stacked; ≥640 it shrinks to content */
        .rc-home-root .rc-actions .rc-ticket-cta { align-self:stretch; justify-content:center; }
        @media (min-width:640px) {
          .rc-home-root .rc-actions { flex-direction:row; align-items:stretch; flex-wrap:wrap; }
          .rc-home-root .rc-actions .rc-cta { flex:1 1 240px; }
          .rc-home-root .rc-actions .rc-ticket-cta { flex:0 0 auto; align-self:auto; }
        }

        /* die-cut TAG CTA — foil rim behind an accent fill, grommet at the left */
        .rc-home-root .rc-cta { position:relative; isolation:isolate; display:block; text-align:center; cursor:pointer;
          padding:18px 22px 18px 40px; border-radius:6px; background:transparent; transform:rotate(-0.6deg);
          transition:transform .18s ease, box-shadow .2s ease;
          box-shadow:2px 11px 24px -12px color-mix(in srgb, var(--rc-ink) 36%, transparent); }
        /* v2-R5b: soften the foil shift on the home CTA — slower drift = a more premium,
           less busy iridescence (overrides the shared 9s drift for THIS foil only). */
        .rc-home-root .rc-cta .rc-foil { position:absolute; inset:-2px; z-index:0; border-radius:8px;
          animation-duration:16s; opacity:.92; }
        .rc-home-root .rc-cta::before { content:""; position:absolute; inset:0; z-index:1; border-radius:inherit;
          background:var(--rc-accent); transition:background .2s ease; }
        .rc-home-root .rc-cta .rc-grommet { position:absolute; z-index:3; left:14px; top:50%; transform:translateY(-50%);
          width:15px; height:15px; border-radius:50%; background:var(--rc-desk);
          box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--rc-faint) 62%, var(--rc-ink2)),
                     inset 0 2px 3px color-mix(in srgb, var(--rc-ink) 45%, transparent); }
        .rc-home-root .rc-cta-in { position:relative; z-index:2; display:inline-flex; align-items:center; justify-content:center;
          gap:10px; font-family:var(--rc-fh); font-weight:700; font-size:17px; color:var(--rc-on-accent); }
        .rc-home-root .rc-cta-arrow { transition:transform .2s ease; }
        .rc-home-root .rc-cta:hover { transform:rotate(-0.6deg) translateY(-2px); }
        .rc-home-root .rc-cta:hover::before { background:var(--rc-accent-deep); }
        .rc-home-root .rc-cta:hover .rc-cta-arrow { transform:translateX(3px); }
        .rc-home-root .rc-cta:active { transform:rotate(-0.6deg) scale(.98); }
        .rc-home-root .rc-cta.is-disabled { cursor:not-allowed;
          box-shadow:1px 3px 9px -6px color-mix(in srgb, var(--rc-ink) 24%, transparent); }
        .rc-home-root .rc-cta.is-disabled::before { background:color-mix(in srgb, var(--rc-ink2) 26%, var(--rc-line)); }
        .rc-home-root .rc-cta.is-disabled .rc-cta-in { color:color-mix(in srgb, var(--rc-receipt) 90%, var(--rc-ink)); }
        .rc-home-root .rc-cta.is-disabled:hover { transform:rotate(-0.6deg); }
        .rc-home-root .rc-cta.is-disabled:hover .rc-cta-arrow { transform:none; }

        /* secondary CTA — a real die-cut TICKET (v2-R5b): a paper body + stub split by a
           vertical PERFORATION with a semicircle NOTCH punched top & bottom on the perf
           line; a Thai label over a mono "CANDIDATES →" line; hover = lift + slight tilt.
           (owner flagged the old flat stub as too plain.) */
        .rc-home-root .rc-ticket-cta { position:relative; align-self:flex-start; display:inline-flex; align-items:center;
          min-height:54px; padding:0 46px 0 18px; background:var(--rc-receipt); border:1.5px solid var(--rc-ink);
          border-radius:4px; box-shadow:2px 9px 20px -11px color-mix(in srgb, var(--rc-ink) 36%, transparent);
          transition:transform .18s ease, border-color .2s ease, color .2s ease, box-shadow .2s ease; }
        .rc-home-root .rc-tkt-main { display:flex; flex-direction:column; gap:3px; }
        .rc-home-root .rc-tkt-th { font-family:var(--rc-fh); font-weight:700; font-size:15px; line-height:1.1; color:var(--rc-ink); }
        .rc-home-root .rc-tkt-mono { font-size:9px; letter-spacing:.18em; color:var(--rc-ink2); }
        /* vertical perforation dividing body from the right stub */
        .rc-home-root .rc-tkt-perf { position:absolute; top:7px; bottom:7px; right:32px; width:2px; opacity:.55;
          background:repeating-linear-gradient(180deg, var(--rc-ink) 0 2px, transparent 2px 5px); }
        /* semicircle notches punched INTO the top & bottom edges, on the perf line (show
           the desk through the die-cut). */
        .rc-home-root .rc-tkt-notch { position:absolute; right:27px; width:12px; height:6px; background:var(--rc-desk);
          box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--rc-ink) 16%, transparent); }
        .rc-home-root .rc-tkt-notch--t { top:-1.5px; border-radius:0 0 12px 12px; }
        .rc-home-root .rc-tkt-notch--b { bottom:-1.5px; border-radius:12px 12px 0 0; }
        .rc-home-root .rc-ticket-cta:hover { transform:translateY(-2px) rotate(-1deg); color:var(--rc-accent-deep);
          border-color:var(--rc-accent-deep); box-shadow:3px 12px 24px -11px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-home-root .rc-ticket-cta:hover .rc-tkt-th { color:var(--rc-accent-deep); }
        .rc-home-root .rc-ticket-cta:active { transform:scale(.98); }

        /* ---- poster band (bottom, docked right on desktop) ---- */
        .rc-home-root .rc-poster-sec { margin-top:30px; display:flex; flex-direction:column; align-items:center; gap:16px; }
        /* v2-R5b: the poster is meant to READ — enlarged ~+40% (owner flagged it as too
           small), now taped at all FOUR corners. */
        .rc-home-root .rc-poster { margin:0; position:relative; width:min(88vw, 400px); background:var(--rc-receipt); padding:10px 10px 14px;
          border:1px solid var(--rc-line); border-radius:4px; transform:rotate(-2deg);
          box-shadow:3px 24px 46px -22px color-mix(in srgb, var(--rc-ink) 30%, transparent);
          transition:transform .25s ease; }
        .rc-home-root .rc-poster:hover { transform:rotate(0deg) translateY(-4px); }
        .rc-home-root .rc-poster-img { display:block; width:100%; height:auto; border-radius:3px; }
        /* v2-R5f: quiet translucent tabs (was multi-colour holo). Frosted paper tone
           via low-alpha ink + multiply, so they read as matte tape that belongs to the
           desk rather than iridescent film competing with the poster. */
        .rc-home-root .rc-poster-tape { position:absolute; width:60px; height:20px; border-radius:1px;
          opacity:.5; mix-blend-mode:multiply;
          background:linear-gradient(135deg, color-mix(in srgb, var(--rc-ink) 9%, transparent), color-mix(in srgb, var(--rc-ink) 5%, transparent));
          box-shadow:1px 2px 3px -1px color-mix(in srgb, var(--rc-ink) 22%, transparent); }
        .rc-home-root .rc-poster-tape--l { top:-10px; left:18px; transform:rotate(-8deg); }
        .rc-home-root .rc-poster-tape--br { bottom:-10px; right:18px; transform:rotate(-8deg); }
        .rc-home-root .rc-poster-cap { text-align:center; margin-top:14px; font-family:var(--rc-fr); font-size:11px;
          letter-spacing:.06em; color:var(--rc-ink2); }

        /* ================= FOOTER ================= */
        .rc-home-root .rc-home-footer { margin-top:48px; padding:22px 0; border-top:1px dotted var(--rc-line); text-align:center; }
        .rc-home-root .rc-home-footer p { margin:0; font-family:var(--rc-fm); font-size:10px; letter-spacing:.12em;
          text-transform:uppercase; color:var(--rc-ink2); }

        /* ================= PRINT-REVEAL (T5) ================= */
        /* base is visible; .js-reveal (added by JS only) arms the hidden from-state. */
        .rc-home-root.js-reveal .rc-seg--reveal { opacity:0; transform:translateY(12px); }
        .rc-home-root.js-reveal .rc-seg--reveal.is-printed { opacity:1; transform:none;
          transition:opacity .55s ease, transform .55s cubic-bezier(.22,1,.36,1); }

        /* ================= TABLET+ : inline nav replaces burger/sheet ================= */
        @media (min-width:768px) {
          .rc-home-root .rc-topbar__in { gap:18px; }
          .rc-home-root .rc-nav { display:flex; }
          .rc-home-root .rc-userwrap { margin-left:0; }
          .rc-home-root .rc-burger, .rc-home-root .rc-sheet { display:none; }
        }

        /* ================= DESKTOP : 2×2 desk — hero + turnout LEFT, rail + poster RIGHT =====
           a 2-column grid. row 1: the paper-stack hero + CTA action row (LEFT ~57%) +
           the sticky rail (clock + short note) pulled slightly OVER the hero's right
           edge. row 2: the TURNOUT slip docks bottom-LEFT (under the hero) and the poster
           docks bottom-RIGHT (under the rail) — a balanced bottom band with tighter
           row-gap. The card is capped so the rail overlap lands on empty desk, never on
           the title text. */
        @media (min-width:1024px) {
          .rc-home-root .rc-stage { display:grid; align-items:start;
            grid-template-columns:minmax(0, 57%) minmax(0, 1fr);
            column-gap:clamp(24px, 4vw, 52px); row-gap:30px;
            padding-left:max(0px, calc(6vw - 20px)); }
          .rc-home-root .rc-hero { grid-column:1; grid-row:1; }
          .rc-home-root .rc-stack { max-width:480px; margin-left:0; margin-right:0; }
          .rc-home-root .rc-actions { margin-left:0; margin-right:0; max-width:480px; }
          .rc-home-root .rc-rail { grid-column:2; grid-row:1; position:sticky; top:84px;
            margin:6px 0 0 -28px; gap:clamp(20px, 3vh, 34px); }
          .rc-home-root .rc-note { max-width:none; }
          /* the perforation track takes its OWN full-width row between the bands, with
             the holes punched through + a mono desk-tag clipped on the line. */
          .rc-home-root .rc-perf-track { grid-column:1 / -1; grid-row:2; height:20px; margin:0 4px; }
          .rc-home-root .rc-perf-track::before { height:8px;
            background:radial-gradient(circle at center, var(--rc-stamp-line) 1.3px, transparent 1.7px) center/13px 100% repeat-x; }
          .rc-home-root .rc-perf-badge { display:inline-block; position:relative; z-index:1; padding:3px 14px;
            background:var(--rc-desk); font-size:9px; letter-spacing:.24em; text-transform:uppercase; color:var(--rc-ink2); }
          .rc-home-root .rc-turnout { grid-column:1; grid-row:3; margin:0; max-width:380px; }
          .rc-home-root .rc-poster-sec { grid-column:2; grid-row:3; flex-direction:column;
            align-items:center; justify-content:flex-start; margin-top:0; }
          .rc-home-root .rc-poster { width:min(420px, 100%); }
          .rc-home-root .rc-notice-title { font-size:clamp(34px, 3vw, 46px); }
        }

        /* ================= MOBILE : keep the desk calm ================= */
        @media (max-width:420px) {
          .rc-home-root .rc-slip-digits { gap:3px; }
          .rc-home-root .rc-cd-n { font-size:clamp(24px, 7.4vw, 32px); gap:2px; }
          .rc-home-root .rc-colon { font-size:clamp(20px, 6vw, 28px); }
          .rc-home-root .rc-seal--c { display:none; }
          .rc-home-root .rc-actions { margin-left:12px; margin-right:12px; }
          /* keep the mobile desk calm — ephemera off, perf track stays a plain hairline */
          .rc-home-root .rc-stubs, .rc-home-root .rc-holo-tape { display:none; }
        }

        /* reduced motion — freeze every animation (foil stays statically iridescent),
           full page visible (print-reveal never armed under reduced motion). */
        @media (prefers-reduced-motion:reduce) {
          .rc-home-root *, .rc-home-root *::before, .rc-home-root *::after { animation:none !important; }
          .rc-home-root .rc-seg--reveal { opacity:1 !important; transform:none !important; }
        }
      `}</style>
    </div>
  );
}
