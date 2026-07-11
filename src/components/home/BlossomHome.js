"use client";

// BlossomHome — HOME for the "Blossom Civic" template family, "Candy Editorial"
// (v2-C) layout. An editorial magazine skeleton: hairline masthead + issue line,
// a spinning textPath ring around the SAMO numeral, a weight-alternating headline
// (thin → hollow candy outline → solid), the promo poster masked into a 5-petal
// clip that the copy flows around (shape-outside on desktop), stat "figures" ruled
// by hairlines (no cards), and a giant editorial countdown with solid/outline digit
// alternation. Two organic candy blobs morph behind it all.
//
// All year/number/name text derives from globalConfig (Arabic digits, admin-
// editable, never hardcoded). The CTA + countdown are STATE-AWARE (6-state ladder)
// and the whole page is editor-safe: in editorMode it never touches auth
// (P-LOG-002), the voteCTA forces "login", and stats come from editorData.
//
// Self-contained styled-jsx (family idiom — no Tailwind arbitrary values). Colours
// are consumed ONLY through var(--bl-*), emitted by BlossomBaseStyles on .bl-root,
// so a theme swap re-tints the whole page in place.

import { getPath } from "../../utils/basePath";
import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { BlossomBaseStyles } from "./BlossomTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { useVoteStatus } from "../../hooks/useVoteStatus";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";
import { resolveElementState, buildRuntimeContext } from "../admin/editor/stateResolver";
import { buildTemplateStyles } from "../../lib/templateTokens";

// sign-in helper (same seam as the other families)
function blossomSignIn() {
  signIn("authentik", { callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs") + "/vote" });
}

// derived election meta — everything year/number-specific comes from globalConfig.
// Names get soft string fallbacks; NO year literals live in this file (years bind
// straight to globalConfig / resolveElectionDates).
function blossomMeta(gc = {}) {
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

// ── top bar: site-standard behaviour (sticky + backdrop blur over canvas tint)
//    wearing the editorial skin (1.5px ink hairline bottom border, mono nav). Logo ·
//    nav (mono) · user chip (sign-in / skeleton / authed pill + dropdown, T3.1b) ·
//    burger. Mobile → real burger + slide-down sheet (menuOpen), tap targets ≥44px. ──
function BlossomTopBar({ editorMode, onSignIn }) {
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

  const doSignIn = () => { if (editorMode) return; onSignIn ? onSignIn() : blossomSignIn(); };
  const doSignOut = () => {
    if (editorMode) return;
    const bp = process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs";
    const ret = `${window.location.origin}${bp}`;
    let url = `https://psusso.psu.ac.th/application/o/fms-ovs/end-session/?post_logout_redirect_uri=${encodeURIComponent(ret)}`;
    if (session?.id_token) url += `&id_token_hint=${session.id_token}`;
    signOut({ redirect: false }).finally(() => { window.location.href = url; });
  };

  const NAV = [
    { th: "หน้าแรก", href: "/", on: true },
    { th: "ผู้สมัคร", href: "/candidates", on: false },
    { th: "ผลคะแนน", href: "/results", on: false },
  ];

  return (
    // full-bleed sticky bar: the ink hairline runs edge-to-edge (owner: "เส้นขาด"),
    // content aligns to the same 1200px container as the page via __in
    <header className="bl-topbar">
      <div className="bl-topbar__in">
      <a href={editorMode ? undefined : getPath("/")} className="bl-logo" aria-label="หน้าแรก">
        <img src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")} alt="FMS PSU" className="bl-logo__img" />
      </a>

      <nav className="bl-nav">
        {NAV.map((n) => (
          <a key={n.href} href={editorMode ? undefined : getPath(n.href)} className={n.on ? "bl-nav__link on" : "bl-nav__link"}>{n.th}</a>
        ))}
      </nav>

      <div className="bl-userwrap" ref={chipRef}>
        {isLoading ? (
          <div className="bl-loginbtn bl-loginbtn--skel" aria-hidden><span className="bl-skelbar" /></div>
        ) : isAuthed ? (
          <div className={`bl-userchip ${userOpen ? "is-open" : ""}`}>
            <button type="button" className="bl-userchip__btn" onClick={() => setUserOpen((o) => !o)} aria-expanded={userOpen} aria-label="เมนูผู้ใช้">
              <span className="bl-userchip__av">{avatarChar}</span>
              <span className="bl-userchip__name">{firstName}</span>
              <span className="bl-userchip__caret" aria-hidden>▾</span>
            </button>
            {userOpen && (
              <div className="bl-usermenu">
                <div className="bl-usermenu__head">
                  <div className="bl-usermenu__name">{name}</div>
                  {idText && <div className="bl-usermenu__id">{idText}</div>}
                </div>
                <button type="button" className="bl-usermenu__out" onClick={doSignOut} aria-label="ออกจากระบบ">ออกจากระบบ</button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="bl-loginbtn" onClick={doSignIn}>เข้าสู่ระบบ</button>
        )}

        <button type="button" className="bl-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="เมนู" aria-expanded={menuOpen}>
          <span /><span /><span />
        </button>
      </div>

      {/* mobile slide-down sheet (editorial mono links) */}
      <div className={`bl-sheet ${menuOpen ? "is-open" : ""}`}>
        {NAV.map((n) => (
          <a key={n.href} href={editorMode ? undefined : getPath(n.href)} className="bl-sheet__link" onClick={() => setMenuOpen(false)}>{n.th}</a>
        ))}
      </div>
      </div>
    </header>
  );
}

// ── loop-safe phase-aware countdown (mirrors the 7086f21 tick pattern: stable
//    interval, deps only on the resolved date strings + systemMode) ──
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

export default function BlossomHome({
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

  // stats — editor uses dummy, live/preview uses real feed. Computed BEFORE the
  // mounted early-return so the count-up effect (hooks must be unconditional) can
  // read the final targets. REAL values render in JSX → SSR-correct with no JS.
  const rawStats = editorMode
    ? { totalVoted: editorData?.totalVoted ?? 342, totalEligible: editorData?.totalEligible ?? 1200 }
    : { totalVoted: initialData?.stats?.totalVoted ?? 0, totalEligible: initialData?.stats?.totalEligible ?? 0 };
  const pct = rawStats.totalEligible > 0 ? ((rawStats.totalVoted / rawStats.totalEligible) * 100).toFixed(1) : "0.0";
  const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);
  const realParties = (initialData?.candidates || []).filter((c) => c.number > 0);
  const partyCount = realParties.length || (editorMode ? 2 : 0);

  // ── count-up (progressive enhancement) — real values already in JSX; on first
  //    intersection rAF-animates 0→value over ~900ms, then restores exact values.
  //    editorMode skips (static). Never gates visibility (P: no JS-hidden content). ──
  const [displayCounts, setDisplayCounts] = useState(null);
  const figuresRef = useRef(null);
  const countedRef = useRef(false);
  useEffect(() => {
    if (editorMode || !mounted) return;
    const el = figuresRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const targetVoted = rawStats.totalVoted;
    const targetPct = parseFloat(pct);
    const targetParties = partyCount;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !countedRef.current) {
          countedRef.current = true;
          io.disconnect();
          const dur = 900, t0 = performance.now();
          const step = (now) => {
            const p = Math.min(1, (now - t0) / dur);
            const ease = 1 - Math.pow(1 - p, 3);
            setDisplayCounts({
              voted: Math.round(targetVoted * ease),
              pct: (targetPct * ease).toFixed(1),
              parties: Math.round(targetParties * ease),
            });
            if (p < 1) requestAnimationFrame(step);
            else setDisplayCounts(null); // leave exact rendered values
          };
          requestAnimationFrame(step);
        }
      });
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, editorMode, rawStats.totalVoted, pct, partyCount]);

  if (!mounted) return null;

  const meta = blossomMeta(globalConfig);
  const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);

  // CTA state ladder — editor forces login (no auth); live/preview resolves it
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
    if (CTA.action === "signin") { e.preventDefault(); onSignIn ? onSignIn() : blossomSignIn(); }
  };

  const tokenStylesCss = editorMode ? (editorTokenStyles || "") : buildTemplateStyles(resolvedTemplate, ".fms-app");
  const bannerSrc = getPath("/images/prob/samo49_1.png");
  const pad2 = (n) => String(n).padStart(2, "0");

  // ── ring textPath string (skip empty config parts) ──
  const ringSegs = [`${meta.faculty} ELECTION${meta.calYear !== "" ? ` ${meta.calYear}` : ""}`];
  if (String(meta.number) !== "" || meta.prefix) ringSegs.push(`${meta.prefix} ${meta.number}`.trim());
  if (meta.academicYear !== "") ringSegs.push(`ปีการศึกษา ${meta.academicYear}`);
  const ringText = ringSegs.join(" · ") + " · ";

  // ── headline (config-safe split): the ORG is the star (owner call 2026-07-11 —
  //    students identify with the union, not the project title). Split org on
  //    "คณะ": hollow line + solid line with the faculty name accented. Org without
  //    "คณะ" = one solid line. The campaign title moves to the dash subline. ──
  const ORG_KEY = "คณะ";
  let headlineNode;
  const orgIdx = meta.org.indexOf(ORG_KEY);
  if (orgIdx > 0) {
    const orgHead = meta.org.slice(0, orgIdx);
    const orgRest = meta.org.slice(orgIdx + ORG_KEY.length);
    headlineNode = (
      <>
        <span className="bl-reveal"><span className="bl-reveal__in bl-hollow">{orgHead}</span></span>
        <span className="bl-reveal"><span className="bl-reveal__in bl-solid">{ORG_KEY}{orgRest && <span className="bl-accent">{orgRest}</span>}</span></span>
      </>
    );
  } else {
    headlineNode = <span className="bl-reveal"><span className="bl-reveal__in bl-solid">{meta.org}</span></span>;
  }

  // ── CTA anchor wiring (state ladder + editor guard) ──
  const ctaHref = editorMode || CTA.action === "signin" ? undefined : getPath(CTA.href || "/");

  // ── countdown caption + closed-block copy (driven by cd) ──
  const cdCap = cd.done
    ? "สถานะ / STATUS"
    : cd.label === "เปิดหีบใน"
      ? "เปิดหีบในอีก / STARTS IN"
      : cd.label === "ปิดหีบใน"
        ? "ปิดหีบในอีก / CLOSES IN"
        : "กำลังโหลด / LOADING";
  const cdClosedSmall = cd.label === "ระบบพักชั่วคราว"
    ? "SYSTEM PAUSED · กลับมาเปิดอีกครั้งเร็ว ๆ นี้"
    : "VOTING CLOSED · ดูผลได้ที่หน้าผลการเลือกตั้ง";

  return (
    <div className="fms-app bl-root">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}
      <BlossomBaseStyles />

      {/* organic candy blobs (morph slowly, absolute within .bl-root) */}
      <span className="bl-blob bl-blob-1" aria-hidden="true" />
      <span className="bl-blob bl-blob-2" aria-hidden="true" />

      <BlossomTopBar editorMode={editorMode} onSignIn={onSignIn} />

      <div className="bl-page">
        {/* ===== issue line ===== */}
        <div className="bl-issue-line">
          <span>{meta.faculty} ELECTION{meta.calYear !== "" ? <> <b>·</b> {meta.calYear}</> : null}</span>
          <span>{meta.prefix} {meta.number}{meta.academicYear !== "" ? <> <b>·</b> ปีการศึกษา {meta.academicYear}</> : null}</span>
        </div>

        {/* ===== hero ===== */}
        <section className="bl-hero">
          <div className="bl-ring" role="img" aria-label={`${meta.prefix} ${meta.number} — ${meta.faculty} Election ${meta.calYear}`}>
            <svg viewBox="0 0 200 200">
              <defs><path id="blRingPath" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
              <text><textPath href="#blRingPath">{ringText}</textPath></text>
            </svg>
            <div className="bl-ring__core"><div><b>{meta.number}</b><span>{meta.prefix}</span></div></div>
          </div>

          <h1 className="bl-headline">{headlineNode}</h1>
          <div className="bl-subline">{meta.campaign}</div>

          {ELECTION_START && (
            <div className="bl-daterow">
              <span className="bl-daterow__pill">เปิดหีบ {formatThaiDate(ELECTION_START)}</span>
              <span>{formatThaiTime(ELECTION_START)}–{formatThaiTime(ELECTION_END)}</span>
            </div>
          )}

          <div className="bl-cta-row">
            <a href={ctaHref} onClick={onCta} className={`bl-cta ${CTA.disabled ? "is-disabled" : ""}`} role="button">{CTA.label}</a>
            <a href={editorMode ? undefined : "#bl-meet"} className="bl-cta2">รู้จักผู้สมัคร ↓</a>
          </div>
        </section>

        {/* ===== feature: pinned poster + meet-candidates copy ===== */}
        <section id="bl-meet" className="bl-feature">
          {/* geometric candy accent — solid half-circle peeking from the left (desktop) */}
          <span className="bl-feature-orb" aria-hidden="true" />
          {/* pinned-poster treatment (owner 2026-07-11): white mat + thin ink frame +
              washi tape corners — tapes alone carry the pinned look (no icon badge);
              the poster is never cropped (admin uploads any ratio) */}
          <div className="bl-posterwrap">
            <figure className="bl-poster">
              <span className="bl-poster__tape bl-poster__tape--l" aria-hidden="true" />
              <span className="bl-poster__tape bl-poster__tape--r" aria-hidden="true" />
              <img src={bannerSrc} alt="โปสเตอร์ประชาสัมพันธ์การเลือกตั้ง" className="bl-poster__img" />
            </figure>
            <div className="bl-poster-cap">{meta.prefix} {meta.number} · โปสเตอร์ประชาสัมพันธ์</div>
          </div>
          <div className="bl-feature-copy">
            <h2>รู้จัก<em>ผู้สมัคร</em>ของคุณหรือยัง</h2>
            <p>ก่อนกาบัตร ชวนคุณเปิดอ่านนโยบายและทีมงานของแต่ละพรรคอย่างละเอียด — ทุกเสียงของชาววิทยาการจัดการคือทิศทางของสโมสรนักศึกษาปีต่อไป</p>
            <a className="bl-go" href={editorMode ? undefined : getPath("/candidates")}>
              ดูผู้สมัครทั้งหมด
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>
        </section>

        {/* ===== figures ===== */}
        <section className="bl-figures" aria-label="สถิติเรียลไทม์" ref={figuresRef}>
          <div className="bl-fig bl-fig-1">
            <span className="bl-idx">01</span>
            <span className="bl-fig-n">{fmtInt(displayCounts ? displayCounts.voted : rawStats.totalVoted)}<small>คน</small></span>
            <span className="bl-lab"><span className="bl-live-dot" aria-hidden />ใช้สิทธิ์แล้ว<br />REAL-TIME</span>
          </div>
          <div className="bl-fig bl-fig-2">
            <span className="bl-idx">02</span>
            <span className="bl-fig-n">{displayCounts ? displayCounts.pct : pct}<small>%</small></span>
            <span className="bl-lab">อัตราการใช้สิทธิ์<br />TURNOUT</span>
            {/* hairline turnout track — the % made visible */}
            <span className="bl-figbar" aria-hidden="true"><span style={{ width: `${Math.min(100, parseFloat(pct))}%` }} /></span>
          </div>
          <div className="bl-fig bl-fig-3">
            <span className="bl-idx">03</span>
            <span className="bl-fig-n">{displayCounts ? displayCounts.parties : partyCount}<small>พรรค</small></span>
            <span className="bl-lab">ผู้ลงสมัคร<br />PARTIES</span>
          </div>
        </section>

        {/* ===== countdown — the climax: full-bleed ink band ===== */}
        <section className={`bl-count ${cd.done ? "is-closed" : ""}`}>
          <div className="bl-count__in">
            <div className="bl-count-cap"><span className="bl-count-cap__dia" aria-hidden="true" />{cdCap}</div>
            <div className="bl-count-line">
              <span className="bl-seg"><span className="bl-cd-n">{pad2(cd.d)}</span><span className="bl-u">วัน / DAYS</span></span>
              <span className="bl-colon">:</span>
              <span className="bl-seg"><span className="bl-cd-n">{pad2(cd.h)}</span><span className="bl-u">ชม. / HRS</span></span>
              <span className="bl-colon">:</span>
              <span className="bl-seg"><span className="bl-cd-n">{pad2(cd.m)}</span><span className="bl-u">นาที / MIN</span></span>
              <span className="bl-colon">:</span>
              <span className="bl-seg"><span className="bl-cd-n">{pad2(cd.s)}</span><span className="bl-u">วินาที / SEC</span></span>
            </div>
            <div className="bl-count-closed">{cd.label}<small>{cdClosedSmall}</small></div>
          </div>
        </section>

        {/* ===== footer — plain classic line (owner 2026-07-11: แบบเดิมที่เคยใช้) ===== */}
        <footer className="bl-footer">
          <p>© FMS@PSU{meta.copyrightYear !== "" ? ` ${meta.copyrightYear}` : ""}. All Rights Reserved.</p>
        </footer>
      </div>

      <style jsx global>{`
        /* ========== BASE (mobile-first, editorial magazine skeleton) ========== */
        .bl-root { overflow-x:hidden; }
        /* dot-grid paper texture — sits above the blobs (paint order), under content */
        .bl-root::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:radial-gradient(color-mix(in srgb, var(--bl-ink) 9%, transparent) 1px, transparent 1.4px);
          background-size:26px 26px; }
        /* :where() keeps this default at zero specificity (mockup used bare "a{}")
           so per-link classes (.bl-cta, .bl-nav__link, ...) always win */
        :where(.bl-root) a { color:var(--bl-primary-deep); text-decoration:none; }
        :where(.bl-root) a:hover { color:var(--bl-ink); }

        /* organic candy blobs — absolute within .bl-root (root is relative) */
        .bl-blob { position:absolute; pointer-events:none; z-index:0; }
        .bl-blob-1 { top:-16vw; right:-22vw; width:64vw; height:64vw; min-width:380px; min-height:380px;
          background:var(--bl-primary-soft); border-radius:52% 48% 60% 40%/55% 60% 40% 45%;
          animation:blMorph 14s ease-in-out infinite alternate; }
        .bl-blob-2 { bottom:4%; left:-18vw; width:46vw; height:46vw; min-width:280px; min-height:280px;
          background:var(--bl-sup3); border-radius:60% 40% 45% 55%/45% 55% 60% 40%;
          animation:blMorph 18s ease-in-out infinite alternate-reverse; }
        @keyframes blMorph {
          0%   { border-radius:52% 48% 60% 40%/55% 60% 40% 45%; }
          50%  { border-radius:44% 56% 42% 58%/60% 42% 58% 40%; }
          100% { border-radius:58% 42% 55% 45%/42% 58% 45% 55%; }
        }

        .bl-page { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:0 22px 90px; }

        /* ---- topbar: site-standard (sticky + blur) in an editorial hairline skin.
           Full-bleed so the ink hairline runs edge-to-edge; __in re-aligns content
           to the page container ---- */
        .bl-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--bl-canvas) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-topbar__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .bl-logo { display:inline-flex; align-items:center; flex-shrink:0; border-radius:8px; }
        .bl-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .bl-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .bl-nav__link { font-family:var(--bl-fm); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--bl-ink2); position:relative; padding-bottom:2px; border-radius:4px; transition:color .2s ease; }
        .bl-nav__link.on, .bl-nav__link:hover { color:var(--bl-ink); }
        .bl-nav__link.on::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:3px;
          background:var(--bl-primary); border-radius:2px; }

        /* ---- user chip + burger ---- */
        .bl-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .bl-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--bl-fd); font-weight:600;
          font-size:13px; color:var(--bl-canvas); background:var(--bl-ink); border:none; cursor:pointer;
          padding:9px 20px; border-radius:999px; transition:background .2s ease, transform .15s ease; }
        .bl-loginbtn:hover { background:var(--bl-primary-deep); transform:translateY(-1px); }
        .bl-loginbtn:active { transform:scale(.96); }
        .bl-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--bl-line) 70%, var(--bl-card)); }
        .bl-skelbar { display:block; width:58px; height:12px; border-radius:6px;
          background:color-mix(in srgb, var(--bl-ink2) 30%, var(--bl-card)); animation:blPulse 1.3s ease-in-out infinite; }
        @keyframes blPulse { 0%,100%{opacity:.45} 50%{opacity:1} }

        .bl-userchip { position:relative; }
        .bl-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:999px; padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, background .2s ease; }
        .bl-userchip__btn:hover { background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-card)); }
        .bl-userchip__btn:active { transform:scale(.97); }
        .bl-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:linear-gradient(135deg, var(--bl-primary), var(--bl-primary-deep)); color:var(--bl-on-primary, var(--bl-card));
          font-family:var(--bl-fd); font-weight:700; font-size:14px; line-height:1; }
        .bl-userchip__name { font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-userchip__caret { color:var(--bl-ink2); font-size:11px; }
        .bl-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:16px; overflow:hidden; z-index:50;
          box-shadow:0 18px 40px -18px color-mix(in srgb, var(--bl-ink) 12%, transparent); }
        .bl-usermenu__head { padding:14px 16px; border-bottom:1px solid var(--bl-line); }
        .bl-usermenu__name { font-family:var(--bl-fd); font-weight:700; font-size:14px; color:var(--bl-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-usermenu__id { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.04em; color:var(--bl-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-primary-deep); }
        .bl-usermenu__out:hover { background:color-mix(in srgb, var(--bl-primary) 10%, var(--bl-card)); }

        /* burger (mobile only) — 44px tap target, mono editorial bars */
        .bl-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:12px; background:var(--bl-card); border:1.5px solid var(--bl-ink); cursor:pointer;
          transition:transform .15s ease, background .2s ease; }
        .bl-burger:hover { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }
        .bl-burger:active { transform:scale(.95); }
        .bl-burger span { display:block; height:2.5px; border-radius:2px; background:var(--bl-ink); }

        /* mobile slide-down sheet — full-width flex row (no flex-wrap reliance) */
        .bl-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .bl-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .bl-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:12px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--bl-ink);
          background:var(--bl-card); border:1px solid var(--bl-line); transition:border-color .2s ease, background .2s ease; }
        .bl-sheet__link:hover { border-color:var(--bl-primary); }
        .bl-sheet__link:active { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }

        /* focus-visible (keyboard) — 2px primary-deep outline on every interactive element */
        .bl-root a:focus-visible, .bl-root button:focus-visible {
          outline:2px solid var(--bl-primary-deep); outline-offset:2px; }

        /* ---- issue line ---- */
        .bl-issue-line { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:12px 0;
          border-bottom:1px solid var(--bl-line); font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--bl-ink2); }
        .bl-issue-line b { color:var(--bl-primary-deep); font-weight:700; }

        /* ---- hero ---- */
        .bl-hero { position:relative; padding-top:34px; }
        /* print crop mark — editorial registration corner */
        .bl-hero::before { content:""; position:absolute; top:12px; left:0; width:14px; height:14px;
          border-top:1.5px solid color-mix(in srgb, var(--bl-ink) 32%, transparent);
          border-left:1.5px solid color-mix(in srgb, var(--bl-ink) 32%, transparent); }

        /* spinning textPath ring — the family signature (enlarged; text sits OVER it) */
        .bl-ring { width:clamp(180px,26vw,300px); height:clamp(180px,26vw,300px);
          position:absolute; top:6px; right:-14px; z-index:1; pointer-events:none;
          animation:blRingIn .9s cubic-bezier(.22,1,.36,1) both; }
        .bl-ring svg { width:100%; height:100%; animation:blSpin 26s linear infinite; overflow:visible; }
        .bl-ring text { font-family:var(--bl-fm); font-size:10.2px; letter-spacing:.32em; fill:var(--bl-primary-deep); text-transform:uppercase; }
        .bl-ring__core { position:absolute; inset:0; display:grid; place-items:center; text-align:center;
          font-family:var(--bl-fd); font-weight:800; color:var(--bl-ink); }
        .bl-ring__core b { font-size:clamp(30px,7vw,46px); line-height:1; display:block; color:var(--bl-primary-deep); }
        .bl-ring__core span { font-family:var(--bl-fm); font-size:9px; letter-spacing:.22em; color:var(--bl-ink2); }
        @keyframes blSpin { to { transform:rotate(360deg); } }

        /* headline: the org as the star — hollow line + solid accented line */
        .bl-headline { font-family:var(--bl-fd); line-height:1.1; letter-spacing:-.01em; max-width:100%;
          font-size:clamp(34px,8.6vw,84px); position:relative; z-index:2; margin:0; }
        /* ── entrance choreography (CSS-ONLY — base style is the VISIBLE state; each
           keyframe only supplies the hidden from-frame, so reduced-motion animation:none
           lands everything visible. No JS gates visibility.) ── */
        .bl-reveal { display:block; overflow:hidden; }
        .bl-reveal__in { display:block; animation:blLineUp .65s cubic-bezier(.22,1,.36,1) both; }
        .bl-headline .bl-reveal:nth-child(1) .bl-reveal__in { animation-delay:.15s; }
        .bl-headline .bl-reveal:nth-child(2) .bl-reveal__in { animation-delay:.28s; }
        @keyframes blLineUp { from { transform:translateY(110%); } }
        @keyframes blRise { from { opacity:0; transform:translateY(12px); } }
        @keyframes blRingIn { from { opacity:0; transform:rotate(-24deg); } }
        @keyframes blPosterIn { from { transform:rotate(-6deg) translateY(14px); } }
        .bl-issue-line { animation:blRise .6s ease both .05s; }
        .bl-subline { animation:blRise .6s ease both .4s; }
        .bl-daterow { animation:blRise .6s ease both .5s; }
        .bl-cta-row { animation:blRise .6s ease both .6s; }
        .bl-feature { animation:blRise .6s ease both .75s; }
        .bl-hollow { font-weight:800; color:transparent;
          -webkit-text-stroke:2px var(--bl-primary-deep); text-stroke:2px var(--bl-primary-deep); }
        @supports not (-webkit-text-stroke: 1px #000) {
          .bl-hollow { color:var(--bl-primary-deep); -webkit-text-stroke:0; text-stroke:0; }
        }
        .bl-solid { font-weight:800; }
        .bl-accent { color:var(--bl-primary-deep); }
        .bl-subline { margin-top:18px; font-family:var(--bl-fd); font-weight:500; font-size:clamp(16px,4vw,24px);
          color:var(--bl-ink); display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        .bl-subline::before { content:""; width:52px; height:2px; background:var(--bl-ink); flex:none; }

        .bl-daterow { margin-top:22px; display:inline-flex; align-items:center; gap:10px; flex-wrap:wrap;
          font-family:var(--bl-fm); font-size:11.5px; letter-spacing:.1em; color:var(--bl-ink2); }
        .bl-daterow__pill { background:var(--bl-primary-soft); color:var(--bl-primary-deep); padding:6px 14px;
          border-radius:999px; font-weight:700; }

        /* ---- CTA editorial ---- */
        .bl-cta-row { display:flex; align-items:center; gap:26px; flex-wrap:wrap; margin-top:34px; }
        .bl-cta { display:inline-block; font-family:var(--bl-fd); font-weight:700; font-size:clamp(16px,4vw,19px);
          color:var(--bl-on-primary, var(--bl-card)); background:var(--bl-primary-deep); border:none; cursor:pointer; max-width:100%;
          padding:17px 34px; border-radius:999px; position:relative; overflow:hidden;
          box-shadow:0 12px 26px color-mix(in srgb, var(--bl-primary-deep) 32%, transparent);
          transition:transform .2s ease; }
        .bl-cta::after { content:""; position:absolute; top:0; bottom:0; left:-60%; width:40%;
          background:linear-gradient(100deg, transparent, color-mix(in srgb, var(--bl-card) 38%, transparent), transparent);
          transform:skewX(-18deg); transition:left .6s ease; }
        .bl-cta:hover { transform:translateY(-3px); color:var(--bl-on-primary, var(--bl-card)); }
        .bl-cta:hover::after { left:120%; }
        .bl-cta:active { transform:scale(.97); }
        .bl-cta.is-disabled { background:color-mix(in srgb, var(--bl-ink2) 32%, var(--bl-line)); color:var(--bl-card);
          box-shadow:none; cursor:not-allowed; }
        .bl-cta.is-disabled::after { display:none; }
        .bl-cta.is-disabled:hover { transform:none; }
        .bl-cta.is-disabled:active { transform:none; }
        /* secondary = a REAL outlined pill (owner: the page felt button-less) */
        .bl-cta2 { display:inline-flex; align-items:center; justify-content:center; min-height:44px;
          font-family:var(--bl-fd); font-weight:600; font-size:16px; color:var(--bl-ink);
          padding:13px 28px; border-radius:999px; border:2px solid var(--bl-ink); background:transparent;
          transition:color .2s ease, border-color .2s ease, background .2s ease, transform .2s ease; }
        .bl-cta2:hover { color:var(--bl-primary-deep); border-color:var(--bl-primary-deep);
          background:var(--bl-card); transform:translateY(-2px); }
        .bl-cta2:active { transform:scale(.97); }

        /* hero cta2 anchor-scrolls here (#bl-meet) — smooth only when the user
           allows motion (reduced-motion gets an instant jump for free); the rule
           mounts with BlossomHome only, so it never leaks to other templates */
        @media (prefers-reduced-motion:no-preference) {
          html { scroll-behavior:smooth; }
        }

        /* ---- feature: pinned poster (white mat + ink frame + washi tape + badge),
           copy flows around it on desktop ---- */
        /* scroll-margin keeps the sticky topbar off the section head when the hero
           cta2 anchor lands here — measured topbar: 89px mobile (the closed burger
           sheet row adds its 16px flex row-gap), 73px on min-width:768px where the
           sheet is display:none. Both get ~15px breathing room */
        .bl-feature { margin-top:70px; position:relative; scroll-margin-top:104px; }
        /* geometric candy accent — hidden on mobile, half-circle peeks from left on desktop */
        .bl-feature-orb { display:none; }
        .bl-feature::before { content:""; position:absolute; top:-24px; right:0; width:14px; height:14px;
          border-top:1.5px solid color-mix(in srgb, var(--bl-ink) 32%, transparent);
          border-right:1.5px solid color-mix(in srgb, var(--bl-ink) 32%, transparent); }
        .bl-posterwrap { width:min(80vw,380px); margin:0 auto; position:relative;
          animation:blPosterIn .8s cubic-bezier(.22,1,.36,1) both .85s; }
        .bl-poster { margin:0; position:relative; background:var(--bl-card); padding:10px 10px 14px;
          border:1.5px solid var(--bl-ink); border-radius:6px; transform:rotate(-2deg);
          box-shadow:0 22px 44px -20px color-mix(in srgb, var(--bl-ink) 30%, transparent);
          transition:transform .25s ease, box-shadow .25s ease; }
        .bl-poster:hover { transform:rotate(0deg) translateY(-4px);
          box-shadow:0 28px 52px -22px color-mix(in srgb, var(--bl-ink) 34%, transparent); }
        .bl-poster__img { display:block; width:100%; height:auto; border-radius:3px; }
        .bl-poster__tape { position:absolute; top:-11px; width:64px; height:22px; border-radius:2px;
          background:color-mix(in srgb, var(--bl-primary-soft) 82%, transparent);
          border:1px solid color-mix(in srgb, var(--bl-primary) 28%, transparent); }
        .bl-poster__tape--l { left:16px; transform:rotate(-8deg); }
        .bl-poster__tape--r { right:16px; transform:rotate(6deg); }
        .bl-poster-cap { text-align:center; margin-top:18px; font-family:var(--bl-fm); font-size:10.5px;
          letter-spacing:.16em; color:var(--bl-ink2); }
        .bl-feature-copy { margin-top:34px; max-width:560px; }
        .bl-feature-copy h2 { font-family:var(--bl-fd); font-weight:700; font-size:clamp(24px,6vw,38px); line-height:1.2; margin:0; }
        .bl-feature-copy h2 em { font-style:normal; color:var(--bl-primary-deep); }
        .bl-feature-copy p { margin-top:12px; font-size:15px; line-height:1.8; color:var(--bl-ink2); }
        /* go-link = soft pill button */
        .bl-go { display:inline-flex; align-items:center; gap:8px; margin-top:18px; min-height:44px;
          padding:11px 20px; border-radius:999px; background:var(--bl-primary-soft);
          font-family:var(--bl-fd); font-weight:600; font-size:15px; color:var(--bl-primary-deep);
          transition:background .2s ease, color .2s ease, transform .2s ease; }
        .bl-go:hover { background:color-mix(in srgb, var(--bl-primary) 20%, var(--bl-card));
          color:var(--bl-primary-deep); transform:translateY(-2px); }
        .bl-go:active { transform:scale(.97); }
        .bl-go svg { transition:transform .25s ease; }
        .bl-go:hover svg { transform:translateX(4px); }

        /* ---- figures: editorial numbers ruled by hairlines ---- */
        .bl-figures { margin-top:70px; border-top:1.5px solid var(--bl-ink); border-bottom:1px solid var(--bl-line); }
        .bl-fig { display:flex; align-items:baseline; gap:16px; padding:20px 4px; border-bottom:1px solid var(--bl-line); flex-wrap:wrap; }
        /* turnout hairline track (fig-2 only) */
        .bl-figbar { flex:0 0 100%; height:3px; border-radius:2px; margin-top:12px; overflow:hidden;
          background:color-mix(in srgb, var(--bl-line) 60%, var(--bl-card)); }
        .bl-figbar > span { display:block; height:100%; border-radius:2px;
          background:linear-gradient(90deg, var(--bl-primary), var(--bl-primary-deep)); transition:width .6s ease; }
        .bl-fig:last-child { border-bottom:none; }
        .bl-idx { font-family:var(--bl-fm); font-size:10px; letter-spacing:.2em; color:var(--bl-faint); width:34px; flex:none; }
        .bl-fig-n { font-family:var(--bl-fd); font-weight:800; font-size:clamp(38px,9vw,64px); line-height:1;
          font-variant-numeric:tabular-nums; letter-spacing:-.02em; }
        .bl-fig-n small { font-size:.4em; font-weight:600; color:var(--bl-ink2); margin-left:6px; letter-spacing:0; }
        .bl-lab { margin-left:auto; text-align:right; font-family:var(--bl-fm); font-size:10px; letter-spacing:.16em;
          color:var(--bl-ink2); line-height:1.9; }
        .bl-fig-1 .bl-fig-n { color:var(--bl-sup1-ink); }
        .bl-fig-2 .bl-fig-n { color:var(--bl-primary-deep); }
        .bl-fig-3 .bl-fig-n { color:var(--bl-sup2-ink); }
        /* candy: index numbers echo their row's figure colour */
        .bl-fig-1 .bl-idx { color:var(--bl-sup1-ink); }
        .bl-fig-2 .bl-idx { color:var(--bl-primary-deep); }
        .bl-fig-3 .bl-idx { color:var(--bl-sup2-ink); }
        .bl-live-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--bl-primary);
          margin-right:5px; animation:blBlip 1.6s infinite; }
        @keyframes blBlip { 50%{opacity:.3} }

        /* ---- countdown: THE CLIMAX — full-bleed ink band ---- */
        .bl-count { margin:96px calc(50% - 50vw) 0; padding:64px 22px; background:var(--bl-ink); }
        .bl-count__in { max-width:1200px; margin:0 auto; }
        .bl-count-cap { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.22em; text-transform:uppercase;
          color:color-mix(in srgb, var(--bl-canvas) 55%, transparent); display:flex; align-items:center; gap:12px; }
        /* solid geometric index — 10px square rotated 45° (diamond), no border */
        .bl-count-cap__dia { width:10px; height:10px; flex:none; background:var(--bl-primary); transform:rotate(45deg); }
        .bl-count-cap::after { content:""; flex:1; height:1px; background:color-mix(in srgb, var(--bl-canvas) 20%, transparent); }
        .bl-count-line { display:flex; align-items:baseline; gap:2vw; margin-top:14px; flex-wrap:wrap; }
        .bl-seg { display:flex; flex-direction:column; }
        /* solid digits = canvas (light on ink); two hollow segs stroked primary / canvas */
        .bl-cd-n { font-family:var(--bl-fd); font-weight:800; font-size:clamp(52px,13vw,120px); line-height:.95;
          letter-spacing:-.03em; font-variant-numeric:tabular-nums; color:var(--bl-canvas); }
        .bl-count-line .bl-seg:nth-child(3) .bl-cd-n { color:transparent;
          -webkit-text-stroke:2.5px var(--bl-primary); text-stroke:2.5px var(--bl-primary); }
        .bl-count-line .bl-seg:nth-child(7) .bl-cd-n { color:transparent;
          -webkit-text-stroke:2.5px var(--bl-canvas); text-stroke:2.5px var(--bl-canvas); }
        .bl-u { font-family:var(--bl-fm); font-size:10px; letter-spacing:.2em;
          color:color-mix(in srgb, var(--bl-canvas) 50%, transparent); margin-top:8px; }
        .bl-colon { font-family:var(--bl-fd); font-weight:300; font-size:clamp(36px,9vw,84px);
          color:color-mix(in srgb, var(--bl-ink2) 60%, var(--bl-canvas)); align-self:flex-start; }
        .bl-count-closed { display:none; font-family:var(--bl-fd); font-weight:800; font-size:clamp(44px,11vw,100px);
          letter-spacing:-.02em; line-height:1.05; margin-top:10px; color:var(--bl-canvas); }
        .bl-count-closed small { display:block; font-family:var(--bl-fm); font-weight:400; font-size:11px;
          letter-spacing:.24em; text-transform:uppercase; color:color-mix(in srgb, var(--bl-canvas) 55%, transparent); margin-top:12px; }
        .bl-count.is-closed .bl-count-line { display:none; }
        .bl-count.is-closed .bl-count-closed { display:block; }

        /* ---- footer: plain classic single line, centered (owner 2026-07-11 —
           the original-look small caps on the Blossom canvas, colours via tokens) ---- */
        .bl-footer { margin-top:0; padding:24px 0; border-top:1px solid var(--bl-line); text-align:center; }
        .bl-footer p { margin:0; font-size:10px; letter-spacing:.12em; text-transform:uppercase;
          font-weight:500; color:var(--bl-ink2); }

        /* ========== TABLET+ : inline nav replaces burger/sheet ========== */
        @media (min-width:768px) {
          .bl-topbar__in { gap:22px; }
          .bl-nav { display:flex; }
          .bl-userwrap { margin-left:0; }
          .bl-burger, .bl-sheet { display:none; }
          /* topbar is 73px here (no sheet row) — tighten the anchor clearance */
          .bl-feature { scroll-margin-top:88px; }
          /* footer follows the OriginalHome scale (10px mobile / 12px md) */
          .bl-footer p { font-size:12px; }
        }
        /* ========== DESKTOP: copy flows around the pinned poster ========== */
        @media (min-width:900px) {
          .bl-hero { padding-top:52px; }
          /* ring enlarged + pulled up-right so it OVERLAPS the hollow headline line;
             ring z-index:1 < headline z-index:2 → text renders over the ring */
          .bl-ring { right:2vw; top:-6px; }
          .bl-feature { display:block; }
          .bl-posterwrap { float:right; width:400px; margin:-6px 10px 26px 52px; }
          .bl-feature-copy { margin-top:10px; max-width:none; position:relative; z-index:1; }
          .bl-feature::after { content:""; display:table; clear:both; }
          /* solid half-circle candy (geometry) peeking from the left edge, behind content */
          .bl-feature-orb { display:block; position:absolute; left:0; top:38%; width:90px; height:90px;
            border-radius:50%; background:var(--bl-sup3); transform:translateX(-50%); z-index:0; }
          .bl-fig { padding:26px 8px; }
          .bl-count-line { gap:3vw; }
        }
        @media (max-width:560px) {
          .bl-ring { position:relative; top:auto; right:auto; margin:0 0 22px auto; }
          /* countdown: 4 segments + colons measure ~405px vs 346px available at 390 —
             the 4th segment orphan-wrapped behind a dangling colon. Dropping the colon
             separators (298px + gaps = ~321px) keeps all 4 digits full-size on one row */
          .bl-colon { display:none; }
        }

        /* reduced motion — scope to .bl-root, keep transitions (theme morph may stay) */
        @media (prefers-reduced-motion:reduce) {
          .bl-root *, .bl-root *::before, .bl-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
