"use client";

// ReceiptHome — HOME for the "Receipt · Paper Materiality" template family
// (Template #6). v2-R1.5 rebalance: the owner ruled the full-page receipt roll read
// lopsided ("หนักข้างทันที") and that receipt material belongs to the success page —
// so on HOME the receipt survives only as the CLOCK. The org-name notice returns to
// a PAPER STACK held by a metal paperclip (the R2.5 language, upgraded with grain +
// 4px corners + a peeking stub). Composition: a paper-stack hero on the LEFT; a
// right rail carrying the CLOCK (dispenser head + a printed queue slip: split-flap,
// ref line, jagged bottom, red closed-stamp state) → a manila note that hosts the
// turnout register + the hanging CTA tag → a ticket-stub secondary CTA; the promo
// poster + a foil seal sit in a band below. The queue slip is the ONLY receipt-stock
// object on the page. No family uses this skeleton — it kills the "looks like
// Blossom" read without the lopsided tape.
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

  // ── queue-slip copy per state (no trailing period). Live = "…ในอีก";
  //    done/paused = the plain status phrase, shown as a stamp instead of digits. ──
  const slipLabel = cd.done
    ? cd.label
    : cd.label === "เปิดหีบใน" ? "เปิดหีบในอีก"
      : cd.label === "ปิดหีบใน" ? "ปิดหีบในอีก"
        : "กำลังโหลด";
  const slipSub = cd.done
    ? (cd.label === "ระบบพักชั่วคราว" ? "SYSTEM PAUSED" : "POLL CLOSED")
    : cd.label === "เปิดหีบใน" ? "STARTS IN" : "CLOSES IN";

  // dispenser LED ↔ the SAME systemMode ladder (via cd — no new state). SEMANTIC,
  // locked across every theme (A8.1): live=mint-green / before-open+pause=yellow /
  // ended+closed=faint-red. open when the countdown is live; closed only when the
  // poll has truly ended ("ปิดหีบแล้ว"); pause + pre-open fall to the waiting amber.
  const ledState = cd.live ? "open" : (cd.done && cd.label === "ปิดหีบแล้ว") ? "closed" : "wait";
  // poll fully closed → the queue segment gets the red cross-stamp + a printed close
  // line (B1), instead of an empty ticket. Pause keeps just its stamp.
  const isEnded = cd.done && cd.label === "ปิดหีบแล้ว";

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
                    <text className="rc-ghost-mark" x="60" y="72">✶</text>
                  </svg>
                </div>

                <div className="rc-notice-eyebrow rc-mono">◆ {meta.faculty} ELECTION{meta.calYear !== "" ? ` ${meta.calYear}` : ""} ◆</div>
                <h1 className="rc-notice-title">{meta.org}</h1>
                <p className="rc-notice-deck">{meta.campaign}</p>
                {ELECTION_START && (
                  <div className="rc-daterow">
                    <span className="rc-daterow-k">เปิดหีบ</span>
                    <span className="rc-daterow-v">{formatThaiDate(ELECTION_START)}</span>
                    <span className="rc-daterow-t">{formatThaiTime(ELECTION_START)}–{formatThaiTime(ELECTION_END)}</span>
                  </div>
                )}
              </article>
            </div>
          </section>

          {/* ===== RIGHT RAIL (sticky on desktop) — the CLOCK, then the manila note
              carrying the turnout register + the hanging CTA tag, then the secondary
              ticket-stub CTA. ===== */}
          <div className="rc-rail">

            {/* ── CLOCK — the ONLY receipt object of the page: the dispenser head
                (SAMO n · HOME + LED ↔ systemMode) and a queue slip emerging from the
                slot (split-flap, ref line, jagged bottom; closed → red cross-stamp).
                print-reveal stays on THIS single slip. ── */}
            <div className={`rc-clock rc-disp led-${ledState}`}>
              <div className="rc-disp-body">
                <span className="rc-disp-label rc-mono">{meta.prefix} {meta.number} · HOME</span>
                <span className="rc-disp-led" aria-hidden="true" />
              </div>
              <div className="rc-disp-slot" aria-hidden="true" />

              <section className={`rc-slip rc-grain rc-seg--reveal rc-ticket ${cd.done ? "is-done" : ""} ${isEnded ? "is-ended" : ""}`} aria-label="บัตรคิวนับถอยหลัง">
                <div className="rc-slip-head"><span className="rc-mono">QUEUE ·</span> <span>คิวเข้าคูหา</span></div>
                <div className="rc-slip-cap"><span>{slipLabel}</span><small className="rc-mono">{slipSub}</small></div>

                {/* live digits (DD:HH:MM:SS) — base-visible tabular Chakra Petch */}
                <div className="rc-slip-digits">
                  <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.d)} /><span className="rc-u">วัน</span></span>
                  <span className="rc-colon">:</span>
                  <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.h)} /><span className="rc-u">ชม.</span></span>
                  <span className="rc-colon">:</span>
                  <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.m)} /><span className="rc-u">นาที</span></span>
                  <span className="rc-colon">:</span>
                  <span className="rc-seg-cd"><RcSlipDigits value={pad2(cd.s)} /><span className="rc-u">วินาที</span></span>
                </div>

                {/* done-state — the slip is cross-stamped in red instead of digits */}
                <div className="rc-slip-stamp"><span>{cd.label}</span></div>
                {isEnded && (
                  <div className="rc-close-line">ปิดรับบัตรคิว · เวลาปิด {formatThaiTime(ELECTION_END)}</div>
                )}
                <div className="rc-slip-ref rc-mono">{meta.prefix} {meta.number} · No. 0049</div>
                <div className="rc-slip-end" aria-hidden="true" />
              </section>
            </div>

            {/* manila note — carries the turnout register + hangs the CTA tag */}
            <div className="rc-note">
              <span className="rc-note-pin rc-note-pin--l" aria-hidden="true" />
              <span className="rc-note-pin rc-note-pin--r" aria-hidden="true" />
              <div className="rc-note-h">เข้าคูหา</div>
              <p className="rc-note-b">ตรวจสอบสิทธิ์แล้วเข้าลงคะแนนได้ทันทีที่หีบเปิด</p>

              {/* ── turnout register — real-time stats, back on the manila note ── */}
              <div className="rc-register" aria-label="สถิติการใช้สิทธิ์">
                <div className="rc-register-row">
                  <span className="rc-register-k"><span className="rc-live-dot" aria-hidden="true" />ใช้สิทธิ์แล้ว</span>
                  <span className="rc-register-v">{fmtInt(rawStats.totalVoted)}<small>คน</small></span>
                </div>
                <div className="rc-register-row">
                  <span className="rc-register-k">อัตราการใช้สิทธิ์</span>
                  <span className="rc-register-v">{pct}<small>%</small></span>
                </div>
                <div className="rc-register-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, parseFloat(pct))}%` }} /></div>
                <div className="rc-register-row">
                  <span className="rc-register-k">ผู้ลงสมัคร</span>
                  <span className="rc-register-v">{partyCount}<small>พรรค</small></span>
                </div>
              </div>

              {/* hanging PRIMARY CTA tag — the 6-state ladder, strung from the note pin */}
              <div className="rc-tagwrap">
                <svg className="rc-tag-string" viewBox="0 0 60 46" aria-hidden="true" focusable="false" preserveAspectRatio="none">
                  <path className="rc-tag-string__ln" d="M12 0 C 8 22, 40 22, 30 45" fill="none" />
                  <path className="rc-tag-string__ln rc-tag-string__ln2" d="M48 0 C 52 22, 22 22, 30 45" fill="none" />
                  <circle className="rc-tag-string__pin" cx="30" cy="1.5" r="3" />
                </svg>
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
              </div>
            </div>

            {/* secondary CTA = a real ticket STUB (A3 stub language) */}
            <a href={editorMode ? undefined : getPath("/candidates")} className="rc-stubcta">
              <span className="rc-stubcta-th">ดูผู้สมัคร</span><span className="rc-cta-arrow" aria-hidden="true"> →</span>
            </a>
          </div>{/* /rc-rail */}

          {/* ===== POSTER band — the admin promo poster taped down, with a small foil
              seal chip; bottom of the desk, centre-right. ===== */}
          <div className="rc-poster-sec">
            <figure className="rc-poster">
              <span className="rc-poster-tape rc-poster-tape--l" aria-hidden="true" />
              <span className="rc-poster-tape rc-poster-tape--r" aria-hidden="true" />
              <img src={posterSrc} alt="โปสเตอร์ประชาสัมพันธ์การเลือกตั้ง" className="rc-poster-img" loading="lazy" />
              <figcaption className="rc-poster-cap">โปสเตอร์ประชาสัมพันธ์</figcaption>
            </figure>
            <span className="rc-chip" aria-hidden="true"><span className="rc-foil rc-foil--conic" /></span>
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

        /* ================= DISPENSER (T3 / A2) ================= */
        /* the ink machine + slot dock at the top of the tape; the first segment
           peeks from the slot (tape margin-top negative). width/offset MATCH the tape
           via the shared selector below. */
        .rc-home-root .rc-disp { position:relative; z-index:3; }
        .rc-home-root .rc-disp-body { display:flex; align-items:center; justify-content:space-between; gap:12px;
          padding:11px 16px 13px; border-radius:12px 12px 3px 3px;
          background:linear-gradient(180deg, color-mix(in srgb, var(--rc-ink) 84%, var(--rc-faint)), var(--rc-ink)); }
        .rc-home-root .rc-disp-label { font-size:9.5px; letter-spacing:.2em; text-transform:uppercase;
          color:color-mix(in srgb, var(--rc-faint) 80%, var(--rc-receipt)); }
        .rc-home-root .rc-disp-led { width:9px; height:9px; border-radius:50%; flex-shrink:0;
          background:var(--rc-led-wait); box-shadow:0 0 9px var(--rc-led-wait); animation:rcLed 2.4s ease-in-out infinite; }
        .rc-home-root .rc-disp.led-open .rc-disp-led { background:var(--rc-led-open); box-shadow:0 0 9px var(--rc-led-open); }
        .rc-home-root .rc-disp.led-wait .rc-disp-led { background:var(--rc-led-wait); box-shadow:0 0 9px var(--rc-led-wait); }
        .rc-home-root .rc-disp.led-closed .rc-disp-led { background:var(--rc-led-closed); box-shadow:0 0 7px var(--rc-led-closed); opacity:.9; }
        @keyframes rcLed { 0%,100%{ opacity:1; } 50%{ opacity:.4; } }
        /* slot — a dark inset the tape emerges from */
        .rc-home-root .rc-disp-slot { height:12px; margin:0 8px; background:var(--rc-ink); border-radius:0 0 6px 6px; position:relative;
          box-shadow:inset 0 2px 5px color-mix(in srgb, var(--rc-ink) 82%, transparent); }
        .rc-home-root .rc-disp-slot::after { content:""; position:absolute; left:12px; right:12px; top:4px; height:3px;
          border-radius:2px; background:color-mix(in srgb, var(--rc-ink) 55%, var(--rc-faint)); }

        /* ================= HERO — paper-stack notice (A5 return to the R2.5 language) ================= */
        /* the org-name card on receipt stock, clasped by a metal paperclip, with two
           tilted backing sheets and a ticket stub peeking underneath. NOT a tape. */
        .rc-home-root .rc-hero { position:relative; z-index:2; }
        .rc-home-root .rc-stack { position:relative; align-self:flex-start; max-width:520px; margin:8px 12px 0; }
        .rc-home-root .rc-card { position:relative; z-index:3; border-radius:4px; padding:38px 22px 22px;
          background-color:var(--rc-receipt); border:1px solid var(--rc-line);
          box-shadow:2px 20px 42px -24px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        /* two tilted backing sheets — the paper "stack" */
        .rc-home-root .rc-stack-sheet { position:absolute; inset:0; border-radius:4px; background:var(--rc-receipt);
          border:1px solid var(--rc-line);
          box-shadow:1px 10px 22px -16px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-home-root .rc-stack-sheet--a { z-index:2; transform:rotate(-1.5deg) translate(-6px, 5px); }
        .rc-home-root .rc-stack-sheet--b { z-index:1; transform:rotate(1.8deg) translate(7px, 9px);
          background:var(--rc-receipt-edge); }
        /* metal paperclip clasped over the top edge (gem clip = two nested loops) */
        .rc-home-root .rc-clip { position:absolute; z-index:4; top:-15px; left:30px; width:22px; height:54px;
          border:2.5px solid color-mix(in srgb, var(--rc-ink2) 55%, var(--rc-faint)); border-radius:11px;
          background:linear-gradient(105deg, transparent 44%, color-mix(in srgb, var(--rc-receipt) 70%, transparent) 50%, transparent 56%); }
        .rc-home-root .rc-clip i { position:absolute; left:5px; right:5px; top:7px; bottom:-3px;
          border:2.5px solid color-mix(in srgb, var(--rc-ink2) 45%, var(--rc-faint)); border-bottom:none; border-radius:7px 7px 0 0; }
        /* a ticket stub peeking from under the card's lower-left */
        .rc-home-root .rc-stub-peek { position:absolute; z-index:0; left:26px; bottom:-15px; display:inline-flex;
          align-items:baseline; gap:8px; padding:8px 14px 11px; transform:rotate(-2.4deg); transform-origin:top left;
          background:var(--rc-receipt); border:1px solid var(--rc-line); border-top:none; border-radius:0 0 4px 4px;
          box-shadow:2px 9px 18px -11px color-mix(in srgb, var(--rc-ink) 42%, transparent); }
        .rc-home-root .rc-stub-peek .rc-mono { font-size:9px; letter-spacing:.2em; color:var(--rc-ink2); }
        .rc-home-root .rc-stub-peek-ref { color:var(--rc-ink); font-variant-numeric:tabular-nums; }

        /* ================= CLOCK — dispenser + queue slip (the ONLY receipt object) ================= */
        .rc-home-root .rc-clock { position:relative; z-index:3; margin:0 12px; }
        /* the queue slip emerges from the dispenser slot; grain paper + die-cut end */
        .rc-home-root .rc-slip { position:relative; z-index:2; margin:-5px 8px 0; padding:16px clamp(16px,4.5vw,22px) 0;
          border-radius:0 0 3px 3px;
          box-shadow:2px 16px 34px -22px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        .rc-home-root .rc-slip::before, .rc-home-root .rc-slip::after { content:""; position:absolute; top:0; bottom:0; width:6px;
          pointer-events:none; z-index:1; }
        .rc-home-root .rc-slip::before { left:0; background:linear-gradient(90deg, var(--rc-receipt-edge), transparent); }
        .rc-home-root .rc-slip::after { right:0; background:linear-gradient(270deg, var(--rc-receipt-edge), transparent); }
        /* slip head — mono "QUEUE ·" + Chakra Thai (A10.3) */
        .rc-home-root .rc-slip-head { display:flex; align-items:baseline; gap:7px; font-family:var(--rc-fr);
          font-size:11px; font-weight:600; letter-spacing:.04em; color:var(--rc-accent-deep); text-transform:uppercase; margin-bottom:12px; }
        .rc-home-root .rc-slip-head .rc-mono { font-size:10px; letter-spacing:.18em; color:var(--rc-ink2); font-weight:400; }
        /* ref line + jagged die-cut end of the slip (scallop = die-cut, NOT torn — P-LOG-086) */
        .rc-home-root .rc-slip-ref { margin-top:16px; font-size:11px; letter-spacing:.16em; color:var(--rc-ink);
          font-variant-numeric:tabular-nums; }
        .rc-home-root .rc-slip-end { height:11px; margin:14px calc(-1 * clamp(16px,4.5vw,22px)) 0; background:var(--rc-receipt);
          box-shadow:0 8px 18px -14px color-mix(in srgb, var(--rc-ink) 40%, transparent);
          -webkit-mask:radial-gradient(7px 11px at 9px 100%, transparent 96%, #000) bottom left/18px 11px repeat-x;
                  mask:radial-gradient(7px 11px at 9px 100%, transparent 96%, #000) bottom left/18px 11px repeat-x; }

        /* ---- notice card content ---- */
        .rc-home-root .rc-notice-eyebrow { font-family:var(--rc-fm); font-size:10px; letter-spacing:.22em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-home-root .rc-notice-title { margin:12px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.12;
          letter-spacing:-.01em; font-size:clamp(27px, 6vw, 42px); color:var(--rc-ink); }
        .rc-home-root .rc-notice-deck { margin:12px 0 0; max-width:44ch; font-family:var(--rc-fr); font-size:15px;
          line-height:1.7; color:var(--rc-ink2); }
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
        .rc-home-root .rc-ghost-mark { fill:var(--rc-ink); font-family:var(--rc-fr); font-size:22px; text-anchor:middle; }

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

        /* done-state — red cross-stamp laid diagonally across the ticket (B1) */
        .rc-home-root .rc-slip-stamp { display:none; margin:16px 0 6px; width:fit-content; padding:7px 18px;
          transform:rotate(-6deg); border:2.5px solid var(--rc-stamp-red); border-radius:6px; opacity:.9; }
        .rc-home-root .rc-slip-stamp span { font-family:var(--rc-fh); font-weight:700; font-size:22px; letter-spacing:.02em;
          color:var(--rc-stamp-red); }
        .rc-home-root .rc-close-line { display:none; margin-top:6px; font-family:var(--rc-fr); font-size:13px; color:var(--rc-ink);
          font-variant-numeric:tabular-nums; }
        .rc-home-root .rc-ticket.is-done .rc-slip-digits { display:none; }
        .rc-home-root .rc-ticket.is-done .rc-slip-stamp { display:block; }
        .rc-home-root .rc-ticket.is-ended .rc-close-line { display:block; }

        /* ---- T3 turnout register ---- */
        .rc-home-root .rc-register-row { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          padding:8px 0; border-bottom:1px dotted var(--rc-line); }
        .rc-home-root .rc-register-row:last-child { border-bottom:none; }
        .rc-home-root .rc-register-k { font-family:var(--rc-fr); font-size:12px; letter-spacing:.02em;
          color:var(--rc-ink2); display:inline-flex; align-items:center; }
        .rc-home-root .rc-register-v { font-family:var(--rc-fr); font-weight:700; font-size:25px; color:var(--rc-ink);
          font-variant-numeric:tabular-nums; letter-spacing:.01em; }
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

        /* the register now sits ON the manila note, divided from the note copy above */
        .rc-home-root .rc-note .rc-register { margin-top:14px; padding-top:12px;
          border-top:1px dashed color-mix(in srgb, var(--rc-note) 60%, var(--rc-ink)); }

        /* ================= RAIL + DESK OBJECTS ================= */
        /* mobile-first: hero first, then the rail (clock, note+register+CTA, stub)
           stacks below it, then the poster band. desktop lifts the rail into a sticky
           right column that slightly overlaps the hero's right edge (see 1024px). */
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

        /* hanging PRIMARY CTA tag */
        .rc-home-root .rc-tagwrap { position:relative; align-self:flex-start; padding-top:30px; margin-left:24px; }
        .rc-home-root .rc-tag-string { position:absolute; z-index:1; left:-14px; top:-2px; width:60px; height:46px;
          pointer-events:none; overflow:visible;
          filter:drop-shadow(1px 1.5px 1px color-mix(in srgb, var(--rc-ink) 22%, transparent)); }
        .rc-home-root .rc-tag-string__ln { stroke:var(--rc-stamp-line); stroke-width:1.8; stroke-linecap:round;
          transform-origin:30px 0; transition:transform .3s ease; }
        .rc-home-root .rc-tag-string__pin { fill:var(--rc-ink2); }
        .rc-home-root .rc-tagwrap:hover .rc-tag-string__ln { animation:rcSway 1.4s ease-in-out infinite; }
        @keyframes rcSway { 0%,100%{ transform:rotate(-1.5deg); } 50%{ transform:rotate(1.5deg); } }

        /* die-cut TAG CTA — foil rim behind an accent fill, grommet at the left */
        .rc-home-root .rc-cta { position:relative; isolation:isolate; display:block; text-align:center; cursor:pointer;
          padding:16px 18px 16px 34px; border-radius:6px; background:transparent; transition:transform .18s ease, box-shadow .2s ease;
          box-shadow:2px 9px 20px -11px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        .rc-home-root .rc-cta .rc-foil { position:absolute; inset:-2px; z-index:0; border-radius:8px; }
        .rc-home-root .rc-cta::before { content:""; position:absolute; inset:0; z-index:1; border-radius:inherit;
          background:var(--rc-accent); transition:background .2s ease; }
        .rc-home-root .rc-cta .rc-grommet { position:absolute; z-index:3; left:14px; top:50%; transform:translateY(-50%);
          width:15px; height:15px; border-radius:50%; background:var(--rc-desk);
          box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--rc-faint) 62%, var(--rc-ink2)),
                     inset 0 2px 3px color-mix(in srgb, var(--rc-ink) 45%, transparent); }
        .rc-home-root .rc-cta-in { position:relative; z-index:2; display:inline-flex; align-items:center; justify-content:center;
          gap:10px; font-family:var(--rc-fh); font-weight:700; font-size:16px; color:var(--rc-on-accent); }
        .rc-home-root .rc-cta-arrow { transition:transform .2s ease; }
        .rc-home-root .rc-cta:hover { transform:translateY(-2px); }
        .rc-home-root .rc-cta:hover::before { background:var(--rc-accent-deep); }
        .rc-home-root .rc-cta:hover .rc-cta-arrow { transform:translateX(3px); }
        .rc-home-root .rc-cta:active { transform:scale(.98); }
        .rc-home-root .rc-cta.is-disabled { cursor:not-allowed;
          box-shadow:1px 3px 9px -6px color-mix(in srgb, var(--rc-ink) 24%, transparent); }
        .rc-home-root .rc-cta.is-disabled::before { background:color-mix(in srgb, var(--rc-ink2) 26%, var(--rc-line)); }
        .rc-home-root .rc-cta.is-disabled .rc-cta-in { color:color-mix(in srgb, var(--rc-receipt) 90%, var(--rc-ink)); }
        .rc-home-root .rc-cta.is-disabled:hover { transform:none; }
        .rc-home-root .rc-cta.is-disabled:hover .rc-cta-arrow { transform:none; }

        /* secondary CTA — a real ticket STUB (cut corner + left perforation) */
        .rc-home-root .rc-stubcta { position:relative; align-self:flex-start; display:inline-flex; align-items:center; gap:6px;
          min-height:44px; padding:0 16px 0 20px; font-family:var(--rc-fh); font-weight:600; font-size:14px; color:var(--rc-ink);
          background:var(--rc-receipt); border:1.5px solid var(--rc-ink);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          transition:transform .18s ease, border-color .2s ease, color .2s ease; }
        .rc-home-root .rc-stubcta::before { content:""; position:absolute; left:5px; top:8px; bottom:8px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-ink) 0 2px, transparent 2px 5px); }
        .rc-home-root .rc-stubcta:hover { transform:translateY(-2px); color:var(--rc-accent-deep); border-color:var(--rc-accent-deep); }
        .rc-home-root .rc-stubcta:active { transform:scale(.98); }

        /* small foil seal chip on the desk */
        .rc-home-root .rc-chip { position:relative; align-self:flex-start; width:46px; height:46px; border-radius:50%; overflow:hidden;
          transform:rotate(12deg); display:grid; place-items:center;
          box-shadow:1px 10px 20px -10px color-mix(in srgb, var(--rc-ink) 42%, transparent); }
        .rc-home-root .rc-chip .rc-foil { position:absolute; inset:-30%; }

        /* ---- poster band (bottom, centre-right on desktop) ---- */
        .rc-home-root .rc-poster-sec { margin-top:30px; display:flex; flex-direction:column; align-items:center; gap:16px; }
        .rc-home-root .rc-poster { margin:0; position:relative; width:min(78vw, 320px); background:var(--rc-receipt); padding:10px 10px 14px;
          border:1px solid var(--rc-line); border-radius:4px; transform:rotate(-2deg);
          box-shadow:3px 24px 46px -22px color-mix(in srgb, var(--rc-ink) 30%, transparent);
          transition:transform .25s ease; }
        .rc-home-root .rc-poster:hover { transform:rotate(0deg) translateY(-4px); }
        .rc-home-root .rc-poster-img { display:block; width:100%; height:auto; border-radius:3px; }
        .rc-home-root .rc-poster-tape { position:absolute; top:-11px; width:64px; height:22px; border-radius:1px;
          opacity:.55; mix-blend-mode:multiply;
          background:linear-gradient(135deg, color-mix(in srgb, var(--rc-holo-1) 55%, transparent), color-mix(in srgb, var(--rc-holo-3) 55%, transparent));
          box-shadow:1px 2px 3px -1px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-home-root .rc-poster-tape--l { left:18px; transform:rotate(-8deg); }
        .rc-home-root .rc-poster-tape--r { right:18px; transform:rotate(6deg); }
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

        /* ================= DESKTOP : hero stack LEFT (~57%) + sticky rail RIGHT ================= */
        /* a 2-column grid — the paper-stack hero sits LEFT (with right whitespace); the
           rail (clock, note+register+CTA, stub) is a sticky RIGHT column pulled slightly
           OVER the hero's right edge. The card is capped so the overlap lands on empty
           desk, never on the title / stats text. The poster band spans full width below,
           centre-right. */
        @media (min-width:1024px) {
          .rc-home-root .rc-stage { display:grid; align-items:start;
            grid-template-columns:minmax(0, 57%) minmax(0, 1fr);
            column-gap:clamp(24px, 4vw, 52px); row-gap:44px;
            padding-left:max(0px, calc(6vw - 20px)); }
          .rc-home-root .rc-hero { grid-column:1; grid-row:1; }
          .rc-home-root .rc-stack { max-width:480px; margin-left:0; margin-right:0; }
          .rc-home-root .rc-rail { grid-column:2; grid-row:1; position:sticky; top:84px;
            margin:6px 0 0 -28px; gap:clamp(20px, 3vh, 34px); }
          .rc-home-root .rc-note { max-width:none; }
          .rc-home-root .rc-poster-sec { grid-column:1 / -1; grid-row:2; flex-direction:row;
            align-items:flex-end; justify-content:center; gap:24px; padding-left:16%; }
          .rc-home-root .rc-poster { width:min(320px, 42%); }
          .rc-home-root .rc-notice-title { font-size:clamp(34px, 3vw, 46px); }
        }

        /* ================= MOBILE : keep the desk calm ================= */
        @media (max-width:420px) {
          .rc-home-root .rc-slip-digits { gap:3px; }
          .rc-home-root .rc-cd-n { font-size:clamp(24px, 7.4vw, 32px); gap:2px; }
          .rc-home-root .rc-colon { font-size:clamp(20px, 6vw, 28px); }
          .rc-home-root .rc-seal--c { display:none; }
          .rc-home-root .rc-tagwrap { margin-left:12px; }
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
