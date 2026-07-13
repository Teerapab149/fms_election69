"use client";

// ReceiptHome — HOME for the "Receipt · Paper Materiality" template family
// (Template #6). The page IS the polling desk (CONCEPT §4): a PRINTED notice card
// resting on warm paper, a queue-ticket dispenser that prints the countdown as a
// small receipt slip (the signature moment of this page), a turnout register-tape
// strip with the real-time stats, a foil-rim "enter the booth" CTA (6-state
// ladder), and the admin promo poster taped to the desk — sparse print ephemera +
// desk depth around it.
//
// LOGIC SEAMS are ported 1:1 from BlossomHome (the family homes share behaviour,
// only the skin differs): receiptMeta is config-driven (Arabic digits, admin-
// editable, NEVER hardcoded years/names), useCountdown carries the systemMode
// ladder verbatim, the CTA + TopBar are STATE-AWARE, and the whole page is editor-
// safe — in editorMode it never touches auth (P-LOG-002), voteCTA forces "login",
// and stats come from editorData. onSignIn overrides live next-auth in preview.
//
// Colours flow ONLY through var(--rc-*), emitted by ReceiptBaseStyles on .rc-root,
// so a theme swap re-tints the whole page in place. Decoration is print-language
// only (stamps / perforation / die-cut / foil — no icons, no doodles). Base state
// is fully visible: every animation only supplies its hidden `from`, so JS-off /
// reduced-motion / editorMode all render the complete desk instantly.

import { getPath } from "../../utils/basePath";
import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { ReceiptBaseStyles } from "./ReceiptTheme";
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

// ── top bar: site-standard behaviour (sticky + backdrop blur), receipt skin (full-
//    bleed ink hairline bottom, mono nav). Logo · nav (mono) · user chip (sign-in /
//    skeleton / authed pill + dropdown) · burger + slide-down sheet on mobile, tap
//    targets >=44px. Ported 1:1 from BlossomTopBar — Receipt owns its own chrome. ──
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

        {/* mobile slide-down sheet (mono links) */}
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

// ── loop-safe phase-aware countdown — ported verbatim from BlossomHome (the
//    systemMode ladder is identical across the families). ──
function useCountdown(globalConfig, systemMode) {
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0, label: "กำลังโหลด", live: false, done: false });
  useEffect(() => {
    const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);
    const tick = () => {
      const now = Date.now();
      let target, label, live = false, done = false;
      if (systemMode === "PAUSE") { label = "ระบบพักชั่วคราว"; done = true; }
      else if (systemMode === "ENDED") { label = "ปิดหีบแล้ว"; done = true; }
      else if (systemMode === "MANUAL_OPEN") { target = ELECTION_END; label = "ปิดหีบใน"; live = true; }
      else if (now < ELECTION_START) { target = ELECTION_START; label = "เปิดหีบใน"; }
      else if (now < ELECTION_END) { target = ELECTION_END; label = "ปิดหีบใน"; live = true; }
      else { label = "ปิดหีบแล้ว"; done = true; }
      if (done || !target) { setCd({ d: 0, h: 0, m: 0, s: 0, label, live, done }); return; }
      const diff = Math.max(0, target - now);
      setCd({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
        label, live, done: diff <= 0,
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
  useEffect(() => { setMounted(true); }, []);

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

  // ── queue-slip copy per state (mono, no trailing period). Live = "…ในอีก";
  //    done/paused = the plain status phrase, shown as a stamp instead of digits. ──
  const slipLabel = cd.done
    ? cd.label
    : cd.label === "เปิดหีบใน" ? "เปิดหีบในอีก"
      : cd.label === "ปิดหีบใน" ? "ปิดหีบในอีก"
        : "กำลังโหลด";
  const slipSub = cd.done
    ? (cd.label === "ระบบพักชั่วคราว" ? "SYSTEM PAUSED" : "POLL CLOSED")
    : cd.label === "เปิดหีบใน" ? "STARTS IN" : "CLOSES IN";

  return (
    <div className="fms-app rc-root rc-home-root">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}
      <ReceiptBaseStyles />

      <ReceiptTopBar editorMode={editorMode} onSignIn={onSignIn} />

      <div className="rc-home-wrap">
        {/* ===== issue / eyebrow line ===== */}
        <div className="rc-issue">
          <span>{meta.faculty} ELECTION{meta.calYear !== "" ? <> · {meta.calYear}</> : null}</span>
          <span>{meta.prefix} {meta.number}{meta.academicYear !== "" ? <> · ปีการศึกษา {meta.academicYear}</> : null}</span>
        </div>

        <div className="rc-home-top">
          {/* ===== 1 · NOTICE CARD (hero) — a printed event card on the desk ===== */}
          <section className="rc-notice">
            {/* ghost of a previous ink stamp on the desk (very faint) */}
            <div className="rc-ghost" aria-hidden="true"><span>{meta.prefix} {meta.number}</span></div>

            <div className="rc-notice-card">
              <div className="rc-notice-eyebrow">◆ {meta.faculty} ELECTION{meta.calYear !== "" ? ` ${meta.calYear}` : ""} ◆</div>
              <h1 className="rc-notice-title">{meta.org}</h1>
              <p className="rc-notice-deck">{meta.campaign}</p>

              {/* perforation rule */}
              <div className="rc-perf" aria-hidden="true" />

              {ELECTION_START && (
                <div className="rc-daterow">
                  <span className="rc-daterow-k">เปิดหีบ</span>
                  <span className="rc-daterow-v">{formatThaiDate(ELECTION_START)}</span>
                  <span className="rc-daterow-t">{formatThaiTime(ELECTION_START)}–{formatThaiTime(ELECTION_END)}</span>
                </div>
              )}
            </div>

            {/* ballot STUB peeking from under the notice card (decorative, non-secret) */}
            <div className="rc-stub" aria-hidden="true">
              <div className="rc-stub-h">ต้นขั้ว · STUB</div>
              <div className="rc-stub-ref">{meta.prefix} {meta.number} · 0049</div>
            </div>
          </section>

          {/* ===== right rail: the ticket dispenser + register + CTA ===== */}
          <div className="rc-rail">
            {/* 2 · QUEUE-TICKET COUNTDOWN — the signature moment of this page */}
            <section className={`rc-ticket ${cd.done ? "is-done" : ""}`} aria-label="เวลานับถอยหลัง">
              <div className="rc-ticket-head">
                <span className="rc-ticket-brand">{meta.prefix} {meta.number} · QUEUE TICKET</span>
                <span className="rc-ticket-led" aria-hidden="true" />
              </div>
              <div className="rc-ticket-slot" aria-hidden="true" />

              <div className="rc-slip">
                <div className="rc-slip-cap"><span>{slipLabel}</span><small>{slipSub}</small></div>

                {/* live digits (DD:HH:MM:SS) — base-visible tabular Chakra Petch */}
                <div className="rc-slip-digits">
                  <span className="rc-seg"><RcSlipDigits value={pad2(cd.d)} /><span className="rc-u">วัน</span></span>
                  <span className="rc-colon">:</span>
                  <span className="rc-seg"><RcSlipDigits value={pad2(cd.h)} /><span className="rc-u">ชม.</span></span>
                  <span className="rc-colon">:</span>
                  <span className="rc-seg"><RcSlipDigits value={pad2(cd.m)} /><span className="rc-u">นาที</span></span>
                  <span className="rc-colon">:</span>
                  <span className="rc-seg"><RcSlipDigits value={pad2(cd.s)} /><span className="rc-u">วินาที</span></span>
                </div>

                {/* done-state — the slip is stamped instead of showing digits */}
                <div className="rc-slip-stamp"><span>{cd.label}</span></div>

                <div className="rc-slip-foot" aria-hidden="true">◆ ◆ ◆ คิวเข้าคูหา ◆ ◆ ◆</div>
              </div>
            </section>

            {/* 3 · TURNOUT REGISTER TAPE — real-time stats in receipt voice */}
            <section className="rc-register" aria-label="สถิติการใช้สิทธิ์">
              <div className="rc-register-tape">
                <div className="rc-register-row">
                  <span className="rc-register-k"><span className="rc-live-dot" aria-hidden="true" />ใช้สิทธิ์แล้ว</span>
                  <span className="rc-register-v">{fmtInt(rawStats.totalVoted)}<small>คน</small></span>
                </div>
                <div className="rc-register-row">
                  <span className="rc-register-k">อัตราการใช้สิทธิ์</span>
                  <span className="rc-register-v">{pct}<small>%</small></span>
                </div>
                {/* thin ink progress bar for the turnout % */}
                <div className="rc-register-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, parseFloat(pct))}%` }} /></div>
                <div className="rc-register-row">
                  <span className="rc-register-k">ผู้ลงสมัคร</span>
                  <span className="rc-register-v">{partyCount}<small>พรรค</small></span>
                </div>
              </div>
            </section>

            {/* 4 · CTA block — foil-rim primary (6-state ladder) + ink-outline secondary */}
            <section className="rc-cta-block">
              <a
                href={ctaHref}
                onClick={onCta}
                role="button"
                aria-disabled={CTA.disabled ? "true" : undefined}
                className={`rc-cta ${CTA.disabled ? "is-disabled" : ""}`}
              >
                {!CTA.disabled && <span className="rc-foil" aria-hidden="true" />}
                <span className="rc-cta-in">{CTA.label}<span className="rc-cta-arrow" aria-hidden="true">→</span></span>
              </a>
              <a href={editorMode ? undefined : getPath("/candidates")} className="rc-cta2">ดูผู้สมัคร<span aria-hidden="true"> →</span></a>
            </section>
          </div>
        </div>

        {/* ===== 5 · POSTER — the admin promo print, taped to the desk ===== */}
        <section className="rc-poster-sec">
          <div className="rc-posterwrap">
            <figure className="rc-poster">
              <span className="rc-poster-tape rc-poster-tape--l" aria-hidden="true" />
              <span className="rc-poster-tape rc-poster-tape--r" aria-hidden="true" />
              <img src={posterSrc} alt="โปสเตอร์ประชาสัมพันธ์การเลือกตั้ง" className="rc-poster-img" />
            </figure>
            <div className="rc-poster-cap">{meta.prefix} {meta.number} · โปสเตอร์ประชาสัมพันธ์</div>
          </div>
          {/* a small foil seal chip resting on the desk beside the poster */}
          <span className="rc-chip" aria-hidden="true"><span className="rc-foil rc-foil--conic" /></span>
        </section>

        {/* ===== footer — classic single centered line ===== */}
        <footer className="rc-home-footer">
          <p>© FMS@PSU{meta.copyrightYear !== "" ? ` ${meta.copyrightYear}` : ""}. All Rights Reserved.</p>
        </footer>
      </div>

      <style jsx global>{`
        /* ========== BASE (mobile-first — the polling desk) ========== */
        .rc-home-root { --rc-stamp-red:#B91C1C; overflow-x:hidden; }
        /* dot-grid paper texture (8%) — above the desk, under content */
        .rc-home-root::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:radial-gradient(color-mix(in srgb, var(--rc-ink) 8%, transparent) 1px, transparent 1.5px);
          background-size:26px 26px; }
        /* soft desk vignette — depth not darkness (no negative z — P-LOG-084) */
        .rc-home-root::before { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
          background:radial-gradient(125% 120% at 50% 20%, transparent 46%, var(--rc-desk-shade) 100%); opacity:.7; }

        :where(.rc-home-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-home-root a:focus-visible, .rc-home-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }

        /* ---- topbar: sticky, full-bleed ink hairline, mono nav ---- */
        .rc-home-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--rc-stamp-line); }
        .rc-home-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:12px 20px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .rc-home-root .rc-logo { display:inline-flex; align-items:center; flex-shrink:0; }
        .rc-home-root .rc-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .rc-home-root .rc-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .rc-home-root .rc-nav__link { font-family:var(--rc-fm); font-size:11px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--rc-ink2); position:relative; padding-bottom:2px; transition:color .2s ease; }
        .rc-home-root .rc-nav__link.on, .rc-home-root .rc-nav__link:hover { color:var(--rc-ink); }
        .rc-home-root .rc-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:2px;
          background:var(--rc-accent); transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .rc-home-root .rc-nav__link:hover::after, .rc-home-root .rc-nav__link.on::after { transform:scaleX(1); }

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

        .rc-home-root .rc-userchip { position:relative; }
        .rc-home-root .rc-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:var(--rc-radius-button, 8px); padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, border-color .2s ease; }
        .rc-home-root .rc-userchip__btn:hover { border-color:var(--rc-accent); }
        .rc-home-root .rc-userchip__btn:active { transform:scale(.97); }
        .rc-home-root .rc-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:var(--rc-accent); color:var(--rc-on-accent); font-family:var(--rc-fh); font-weight:700; font-size:14px; line-height:1; }
        .rc-home-root .rc-userchip__name { font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-home-root .rc-userchip__caret { color:var(--rc-ink2); font-size:11px; }
        .rc-home-root .rc-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:10px; overflow:hidden; z-index:50;
          box-shadow:0 18px 40px -18px color-mix(in srgb, var(--rc-ink) 22%, transparent); }
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

        .rc-home-root .rc-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .rc-home-root .rc-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .rc-home-root .rc-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:8px;
          font-family:var(--rc-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-line); transition:border-color .2s ease; }
        .rc-home-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ---- page container ---- */
        .rc-home-root .rc-home-wrap { position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:0 20px 80px; }

        .rc-home-root .rc-issue { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 0;
          border-bottom:1px dotted var(--rc-line); font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--rc-faint); }

        .rc-home-root .rc-home-top { display:flex; flex-direction:column; gap:26px; margin-top:26px; }

        /* ---- 1 · NOTICE CARD ---- */
        .rc-home-root .rc-notice { position:relative; }
        .rc-home-root .rc-notice-card { position:relative; z-index:2; background:var(--rc-receipt);
          border:1px solid var(--rc-line); border-radius:var(--rc-radius-card, 10px); padding:26px 24px 30px;
          box-shadow:var(--rc-shadow-card, 0 10px 30px -14px color-mix(in srgb, var(--rc-ink) 35%, transparent)); }
        .rc-home-root .rc-notice-eyebrow { font-family:var(--rc-fm); font-size:10px; letter-spacing:.22em; text-transform:uppercase;
          color:var(--rc-ink2); text-align:center; }
        .rc-home-root .rc-notice-title { margin:14px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.12;
          letter-spacing:-.01em; font-size:clamp(28px, 6.4vw, 46px); color:var(--rc-ink); text-align:center; }
        .rc-home-root .rc-notice-deck { margin:12px auto 0; max-width:42ch; font-family:var(--rc-fr); font-size:15px;
          line-height:1.7; color:var(--rc-ink2); text-align:center; }
        .rc-home-root .rc-perf { margin:22px -24px; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-home-root .rc-daterow { display:flex; align-items:baseline; justify-content:center; gap:10px; flex-wrap:wrap;
          font-family:var(--rc-fm); font-size:12px; letter-spacing:.06em; color:var(--rc-ink);
          font-variant-numeric:tabular-nums; }
        .rc-home-root .rc-daterow-k { font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--rc-accent-deep); font-weight:700; }
        .rc-home-root .rc-daterow-t { color:var(--rc-ink2); }

        /* ghost stamp on the desk behind the card */
        .rc-home-root .rc-ghost { position:absolute; z-index:0; right:-18px; top:-22px; width:104px; height:104px;
          border-radius:50%; border:2px solid var(--rc-ink); opacity:.08; transform:rotate(-12deg); display:grid; place-items:center; }
        .rc-home-root .rc-ghost span { font-family:var(--rc-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--rc-ink); text-align:center; }

        /* ballot stub peeking from under the card */
        .rc-home-root .rc-stub { position:relative; z-index:1; width:180px; margin:-8px 0 0 18px; padding:12px 14px 12px 16px;
          transform:rotate(-2.5deg); transform-origin:top left; background:var(--rc-receipt);
          border-radius:0 0 6px 6px; border-left:3px solid var(--rc-accent);
          box-shadow:var(--rc-shadow-card, 0 8px 18px -9px color-mix(in srgb, var(--rc-ink) 42%, transparent)); }
        .rc-home-root .rc-stub::before { content:""; position:absolute; top:6px; bottom:6px; right:38px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 3px, transparent 3px 6px); }
        .rc-home-root .rc-stub-h { font-family:var(--rc-fm); font-size:8px; letter-spacing:.16em; text-transform:uppercase; color:var(--rc-ink2); }
        .rc-home-root .rc-stub-ref { margin-top:4px; font-family:var(--rc-fm); font-size:10px; letter-spacing:.1em; color:var(--rc-ink);
          font-variant-numeric:tabular-nums; }

        /* ---- right rail ---- */
        .rc-home-root .rc-rail { display:flex; flex-direction:column; gap:22px; }

        /* ---- 2 · QUEUE-TICKET COUNTDOWN (the signature) ---- */
        .rc-home-root .rc-ticket { position:relative; }
        .rc-home-root .rc-ticket-head { display:flex; align-items:center; justify-content:space-between;
          padding:12px 16px; border-radius:12px 12px 4px 4px;
          background:linear-gradient(180deg, color-mix(in srgb, var(--rc-ink) 86%, var(--rc-faint)), var(--rc-ink)); }
        .rc-home-root .rc-ticket-brand { font-family:var(--rc-fm); font-size:9px; letter-spacing:.2em;
          color:color-mix(in srgb, var(--rc-faint) 78%, var(--rc-receipt)); }
        .rc-home-root .rc-ticket-led { width:8px; height:8px; border-radius:50%; background:var(--rc-holo-4);
          box-shadow:0 0 8px var(--rc-holo-4); animation:rcLed 2.4s ease-in-out infinite; }
        @keyframes rcLed { 0%,100%{ opacity:1; } 50%{ opacity:.45; } }
        .rc-home-root .rc-ticket-slot { height:12px; margin:0 6px; background:var(--rc-ink);
          box-shadow:inset 0 2px 5px color-mix(in srgb, var(--rc-ink) 80%, transparent); border-radius:0 0 6px 6px; position:relative; }
        .rc-home-root .rc-ticket-slot::after { content:""; position:absolute; left:10px; right:10px; top:4px; height:3px;
          border-radius:2px; background:color-mix(in srgb, var(--rc-ink) 55%, var(--rc-faint)); }

        /* the queue slip = a small receipt (banding + jagged bottom edge) */
        .rc-home-root .rc-slip { position:relative; z-index:2; margin:-2px 12px 0; padding:18px 18px 24px; background:var(--rc-receipt);
          box-shadow:0 14px 30px -16px color-mix(in srgb, var(--rc-ink) 40%, transparent);
          background-image:repeating-linear-gradient(180deg, transparent 0 24px, color-mix(in srgb, var(--rc-ink) 3%, transparent) 24px 25px);
          -webkit-mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat;
                  mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat; }
        .rc-home-root .rc-slip-cap { display:flex; align-items:baseline; justify-content:space-between; gap:10px;
          font-family:var(--rc-fm); }
        .rc-home-root .rc-slip-cap span { font-size:13px; letter-spacing:.06em; color:var(--rc-accent-deep); font-weight:700; }
        .rc-home-root .rc-slip-cap small { font-size:9px; letter-spacing:.24em; text-transform:uppercase; color:var(--rc-faint); }

        .rc-home-root .rc-slip-digits { display:flex; align-items:flex-start; justify-content:center; gap:6px; margin-top:14px; }
        .rc-home-root .rc-seg { display:flex; flex-direction:column; align-items:center; }
        .rc-home-root .rc-cd-n { font-family:var(--rc-fr); font-weight:700; font-size:clamp(34px, 12vw, 48px); line-height:.95;
          letter-spacing:.01em; font-variant-numeric:tabular-nums; color:var(--rc-ink); display:inline-flex; align-items:flex-start; }
        .rc-home-root .rc-cd-cell { display:inline-block; width:1ch; height:.95em; overflow:hidden; position:relative; }
        .rc-home-root .rc-cd-char { display:block; text-align:center; will-change:transform;
          animation:rcRoll .28s cubic-bezier(.22,1,.36,1) both; }
        @keyframes rcRoll { from { transform:translateY(100%); } }
        .rc-home-root .rc-u { font-family:var(--rc-fm); font-size:8.5px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--rc-ink2); margin-top:6px; }
        .rc-home-root .rc-colon { font-family:var(--rc-fr); font-weight:400; font-size:clamp(26px, 9vw, 38px);
          color:color-mix(in srgb, var(--rc-ink2) 60%, var(--rc-receipt)); align-self:flex-start; line-height:1; }

        .rc-home-root .rc-slip-foot { margin-top:16px; text-align:center; font-family:var(--rc-fm); font-size:9px;
          letter-spacing:.24em; color:var(--rc-faint); }

        /* done-state stamp — replaces the digits when the poll is closed/paused */
        .rc-home-root .rc-slip-stamp { display:none; margin:14px auto 4px; width:fit-content; padding:6px 16px;
          transform:rotate(-5deg); border:2.5px solid var(--rc-stamp-red); border-radius:6px; opacity:.85; }
        .rc-home-root .rc-slip-stamp span { font-family:var(--rc-fh); font-weight:700; font-size:20px; letter-spacing:.02em;
          color:var(--rc-stamp-red); }
        .rc-home-root .rc-ticket.is-done .rc-slip-digits,
        .rc-home-root .rc-ticket.is-done .rc-slip-foot { display:none; }
        .rc-home-root .rc-ticket.is-done .rc-slip-stamp { display:block; }

        /* ---- 3 · TURNOUT REGISTER TAPE ---- */
        .rc-home-root .rc-register-tape { position:relative; background:var(--rc-receipt); border-radius:6px;
          padding:16px 18px; box-shadow:0 8px 20px -12px color-mix(in srgb, var(--rc-ink) 34%, transparent);
          border-top:1px dashed var(--rc-line); border-bottom:1px dashed var(--rc-line); }
        .rc-home-root .rc-register-row { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          padding:7px 0; border-bottom:1px dotted var(--rc-line); }
        .rc-home-root .rc-register-row:last-child { border-bottom:none; }
        .rc-home-root .rc-register-k { font-family:var(--rc-fm); font-size:10px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--rc-ink2); display:inline-flex; align-items:center; }
        .rc-home-root .rc-register-v { font-family:var(--rc-fr); font-weight:700; font-size:24px; color:var(--rc-ink);
          font-variant-numeric:tabular-nums; letter-spacing:.01em; }
        .rc-home-root .rc-register-v small { font-family:var(--rc-fm); font-size:10px; font-weight:400; color:var(--rc-ink2);
          margin-left:5px; letter-spacing:.04em; }
        .rc-home-root .rc-live-dot { width:6px; height:6px; border-radius:50%; background:var(--rc-accent); margin-right:6px;
          animation:rcBlip 1.6s infinite; }
        @keyframes rcBlip { 50%{opacity:.3} }
        .rc-home-root .rc-register-bar { height:3px; border-radius:2px; margin:4px 0 6px; overflow:hidden;
          background:color-mix(in srgb, var(--rc-line) 60%, var(--rc-receipt)); }
        .rc-home-root .rc-register-bar > span { display:block; height:100%; border-radius:2px; background:var(--rc-accent);
          transition:width .6s ease; }

        /* ---- 4 · CTA block ---- */
        .rc-home-root .rc-cta-block { display:flex; flex-direction:column; gap:10px; }
        /* foil sits as a shimmering RIM behind an accent fill (::before), text on top —
           reads as an accent CTA with a holographic edge. Layered by z-index (a negative-z
           child would paint OVER the element's own bg — P-LOG-084). */
        .rc-home-root .rc-cta { position:relative; isolation:isolate; display:block; text-align:center; cursor:pointer;
          padding:16px; border-radius:var(--rc-radius-button, 8px); background:transparent; transition:transform .18s ease; }
        .rc-home-root .rc-cta .rc-foil { position:absolute; inset:-2px; z-index:0; border-radius:calc(var(--rc-radius-button, 8px) + 2px); }
        .rc-home-root .rc-cta::before { content:""; position:absolute; inset:0; z-index:1; border-radius:inherit;
          background:var(--rc-accent); transition:background .2s ease; }
        .rc-home-root .rc-cta-in { position:relative; z-index:2; display:inline-flex; align-items:center; justify-content:center;
          gap:10px; font-family:var(--rc-fh); font-weight:700; font-size:16px; color:var(--rc-on-accent); }
        .rc-home-root .rc-cta-arrow { transition:transform .2s ease; }
        .rc-home-root .rc-cta:hover { transform:translateY(-2px); }
        .rc-home-root .rc-cta:hover::before { background:var(--rc-accent-deep); }
        .rc-home-root .rc-cta:hover .rc-cta-arrow { transform:translateX(3px); }
        .rc-home-root .rc-cta:active { transform:scale(.98); }
        .rc-home-root .rc-cta.is-disabled { cursor:not-allowed; }
        .rc-home-root .rc-cta.is-disabled::before { background:color-mix(in srgb, var(--rc-ink2) 26%, var(--rc-line)); }
        .rc-home-root .rc-cta.is-disabled .rc-cta-in { color:color-mix(in srgb, var(--rc-receipt) 90%, var(--rc-ink)); }
        .rc-home-root .rc-cta.is-disabled:hover { transform:none; }
        .rc-home-root .rc-cta.is-disabled:hover .rc-cta-arrow { transform:none; }

        .rc-home-root .rc-cta2 { display:inline-flex; align-items:center; justify-content:center; min-height:44px;
          padding:13px; border-radius:var(--rc-radius-button, 8px); font-family:var(--rc-fh); font-weight:600; font-size:14px;
          background:none; border:1.5px solid var(--rc-ink); color:var(--rc-ink);
          transition:transform .18s ease, border-color .2s ease, color .2s ease; }
        .rc-home-root .rc-cta2:hover { color:var(--rc-accent-deep); border-color:var(--rc-accent-deep); transform:translateY(-2px); }
        .rc-home-root .rc-cta2:active { transform:scale(.98); }

        /* ---- 5 · POSTER ---- */
        .rc-home-root .rc-poster-sec { position:relative; margin-top:56px; }
        .rc-home-root .rc-posterwrap { width:min(82vw, 360px); margin:0 auto; position:relative; }
        .rc-home-root .rc-poster { margin:0; position:relative; background:var(--rc-receipt); padding:10px 10px 14px;
          border:1px solid var(--rc-line); border-radius:6px; transform:rotate(-2deg);
          box-shadow:var(--rc-shadow-card, 0 22px 44px -20px color-mix(in srgb, var(--rc-ink) 30%, transparent));
          transition:transform .25s ease; }
        .rc-home-root .rc-poster:hover { transform:rotate(0deg) translateY(-4px); }
        .rc-home-root .rc-poster-img { display:block; width:100%; height:auto; border-radius:3px; }
        .rc-home-root .rc-poster-tape { position:absolute; top:-11px; width:64px; height:22px; border-radius:1px;
          opacity:.55; mix-blend-mode:multiply;
          background:linear-gradient(135deg, color-mix(in srgb, var(--rc-holo-1) 55%, transparent), color-mix(in srgb, var(--rc-holo-3) 55%, transparent));
          box-shadow:0 1px 3px -1px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-home-root .rc-poster-tape--l { left:18px; transform:rotate(-8deg); }
        .rc-home-root .rc-poster-tape--r { right:18px; transform:rotate(6deg); }
        .rc-home-root .rc-poster-cap { text-align:center; margin-top:16px; font-family:var(--rc-fm); font-size:10px;
          letter-spacing:.16em; text-transform:uppercase; color:var(--rc-ink2); }

        /* a small foil seal chip on the desk beside the poster */
        .rc-home-root .rc-chip { display:none; position:absolute; right:calc(50% - 210px); bottom:24px; width:48px; height:48px;
          border-radius:50%; overflow:hidden; transform:rotate(12deg); place-items:center;
          box-shadow:var(--rc-shadow-card, 0 8px 18px -9px color-mix(in srgb, var(--rc-ink) 42%, transparent)); }
        .rc-home-root .rc-chip .rc-foil { position:absolute; inset:-30%; }

        /* ---- footer ---- */
        .rc-home-root .rc-home-footer { margin-top:48px; padding:22px 0; border-top:1px dotted var(--rc-line); text-align:center; }
        .rc-home-root .rc-home-footer p { margin:0; font-family:var(--rc-fm); font-size:10px; letter-spacing:.12em;
          text-transform:uppercase; color:var(--rc-ink2); }

        /* ---- holographic foil (ported from ReceiptSuccess / tokens.css) ---- */
        .rc-home-root .rc-foil { background-image:linear-gradient(var(--rc-holo-angle),
            var(--rc-holo-1), var(--rc-holo-2), var(--rc-holo-3), var(--rc-holo-4), var(--rc-holo-5), var(--rc-holo-1));
          background-size:300% 300%; background-position:calc(var(--rc-px, .5) * 100%) calc(var(--rc-py, .5) * 100%);
          filter:hue-rotate(var(--rc-holo-shift)) saturate(1.15); animation:rcFoilDrift 9s linear infinite; }
        .rc-home-root .rc-foil--conic { background-image:conic-gradient(from 0deg,
            var(--rc-holo-1), var(--rc-holo-2), var(--rc-holo-3), var(--rc-holo-4), var(--rc-holo-5), var(--rc-holo-1));
          background-size:auto; animation:rcFoilSpin 14s linear infinite; }
        @keyframes rcFoilDrift { 0%{ background-position:0% 50%; } 50%{ background-position:100% 50%; } 100%{ background-position:0% 50%; } }
        @keyframes rcFoilSpin { to { transform:rotate(360deg); } }

        /* ========== TABLET+ : inline nav replaces burger/sheet ========== */
        @media (min-width:768px) {
          .rc-home-root .rc-topbar__in { gap:22px; }
          .rc-home-root .rc-nav { display:flex; }
          .rc-home-root .rc-userwrap { margin-left:0; }
          .rc-home-root .rc-burger, .rc-home-root .rc-sheet { display:none; }
        }

        /* ========== DESKTOP : notice (left) + dispenser rail (right) ========== */
        @media (min-width:900px) {
          .rc-home-root .rc-home-top { display:grid; grid-template-columns:1.15fr .85fr; gap:44px; align-items:start; }
          .rc-home-root .rc-notice-card { padding:34px 32px 38px; }
          .rc-home-root .rc-notice-eyebrow { text-align:left; }
          .rc-home-root .rc-notice-title { text-align:left; }
          .rc-home-root .rc-notice-deck { margin-left:0; margin-right:0; text-align:left; }
          .rc-home-root .rc-daterow { justify-content:flex-start; }
          .rc-home-root .rc-rail { position:sticky; top:88px; }
          .rc-home-root .rc-chip { display:grid; }
        }

        /* ---- MOBILE : keep the desk calm (colons + stub stay; no loose chip) ---- */
        @media (max-width:420px) {
          .rc-home-root .rc-slip-digits { gap:3px; }
        }

        /* reduced motion — freeze every animation (foil stays statically iridescent),
           full page visible. Scoped to .rc-home-root. */
        @media (prefers-reduced-motion:reduce) {
          .rc-home-root *, .rc-home-root *::before, .rc-home-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
