"use client";

// GumroadHome — the "Active Pulse" HOME LAYOUT (template: gumroad).
//
// The LAYOUT half of the gumroad template (token/theme half = templates/builtIn/
// gumroad.js). Pixel-faithful recreation of docs/design-refs/index.html: sticky
// topbar (real FMS+PSU logos, nav, paper + ink buttons) + scrolling ticker +
// 2-col bento home (left: eyebrow stickers + huge SAMO title w/ pink box + dual
// CTA; right aside: ink bento countdown + pop stat tiles w/ ekg + meet card) +
// ink footer. Chunky identity (2.5px ink borders + 5px 5px 0 hard shadows) is
// hardcoded here per Rule 9. FULLY responsive (mobile/tablet/laptop/desktop) via
// scoped CSS classes + media queries (inline styles can't do breakpoints).
//
// Wired to real data + globalConfig text + the chunky-stamp voteCTA element, and
// editorMode-aware: key elements carry data-element + the stable Wrap so they are
// selectable + base-editable in the admin editor, like classic.

import { getPath } from "../../utils/basePath";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { ArrowRight, Calendar, CheckCircle2, Menu, X, LogOut } from "lucide-react";
import EditorElement from "../admin/editor/EditorElement";
import { SIZE_MAP, WEIGHT_MAP } from "../../utils/styleMaps";
import { resolveElementState, buildRuntimeContext } from "../admin/editor/stateResolver";
import { resolveStatefulConfig } from "../admin/editor/templateEngine";
import { getBinding, isBoundElement } from "../admin/editor/elementCatalog";
import { buildTemplateStyles, buildElementCss } from "../../lib/templateTokens";
import { getVoteCTAVariant } from "../elements/voteCTA-button";
import { ELECTION_CONFIG } from "../../utils/electionConfig";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

// ── Bento countdown (gumroad-styled; reuses ELECTION_CONFIG timing) ──
function GumroadCountdown({ systemMode = "AUTO" }) {
  const { ELECTION_START, ELECTION_END } = ELECTION_CONFIG;
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, label: "STARTS IN", sub: "เปิดรับลงคะแนนใน", live: false });
  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      // Phase + Thai sub-label mirror CountdownTimer.js conditions:
      //  before→opens, running→closes, paused/ended→already-closed.
      let diff, label, sub, live = false;
      if (systemMode === "PAUSE") { label = "PAUSED"; sub = "พักลงคะแนนชั่วคราว"; diff = 0; }
      else if (systemMode === "ENDED") { label = "ENDED"; sub = "ปิดรับลงคะแนนแล้ว"; diff = 0; }
      else if (systemMode === "MANUAL_OPEN") { label = "CLOSES IN"; sub = "ปิดรับลงคะแนนใน"; diff = ELECTION_END - now; live = true; }
      else if (now < ELECTION_START) { label = "STARTS IN"; sub = "เปิดรับลงคะแนนใน"; diff = ELECTION_START - now; }
      else if (now < ELECTION_END) { label = "CLOSES IN"; sub = "ปิดรับลงคะแนนใน"; diff = ELECTION_END - now; live = true; }
      else { label = "ENDED"; sub = "ปิดรับลงคะแนนแล้ว"; diff = 0; }
      setT(diff > 0
        ? { d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24), m: Math.floor((diff / 60000) % 60), s: Math.floor((diff / 1000) % 60), label, sub, live }
        : { d: 0, h: 0, m: 0, s: 0, label, sub, live });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [ELECTION_START, ELECTION_END, systemMode]);
  const cells = [{ n: t.d, u: "DAYS" }, { n: t.h, u: "HRS" }, { n: t.m, u: "MIN" }, { n: t.s, u: "SEC" }];
  return (
    <div className="gh-cd" data-element="hero-countdown">
      <div className="gh-cd__lbl">{t.live && <span className="gh-livedot" />}{t.label} · {t.sub}</div>
      <div className="gh-cd__grid">
        {cells.map((c, i) => (
          <div key={i} className="gh-cd__cell">
            <div className="gh-cd__num">{String(c.n).padStart(2, "0")}</div>
            <div className="gh-cd__unit">{c.u}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GumroadHome({
  initialData,
  editorMode = false,
  editorData = null,
  elementConfigs = null,
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
  pageLayout = null,
  resolvedTemplate = null,
  editorTokenStyles = null,
}) {
  const { data: session, status } = useSession();
  const globalConfig = useGlobalConfig();
  const [mounted, setMounted] = useState(false);
  const [isVotedReal, setIsVotedReal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // mobile hamburger drawer
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (editorMode) return;
    if (status === "authenticated" && session?.user?.studentId) {
      fetch(getPath(`/api/check-status?studentId=${session.user.studentId}`))
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setIsVotedReal(d.isVoted === true); })
        .catch(() => {});
    }
  }, [session?.user?.studentId, status, editorMode]);

  const editorStateRef = useRef(null);
  editorStateRef.current = { editorMode, elementConfigs, selectedElement, hoveredElement, onSelectElement, onHoverElement, onHoverEnd };
  const Wrap = useCallback(({ id, children, className }) => {
    const s = editorStateRef.current;
    if (!s.editorMode) return children;
    return (
      <EditorElement id={id} className={className} config={s.elementConfigs?.[id]}
        isSelected={s.selectedElement === id} isHovered={s.hoveredElement === id}
        onSelect={s.onSelectElement} onHover={s.onHoverElement} onHoverEnd={s.onHoverEnd}>{children}</EditorElement>
    );
  }, []);

  if (!mounted) return null;

  const effectiveConfigs = editorMode ? elementConfigs : (pageLayout?.elementConfigs?.home || {});
  const getText = (id, def) => {
    const b = getBinding(id);
    if (b) return globalConfig[b] ?? def;
    return effectiveConfigs?.[id]?.config?.text ?? def;
  };
  const getTextStyle = (id, opts = {}) => {
    const c = effectiveConfigs?.[id]?.config || {};
    const st = {};
    // skipSize / skipColor: the gumroad layout owns display sizing + ink colour
    // (part of the layout identity, Rule 9). A stale/inherited value in saved
    // config must NOT override it — that's what pinned the hero title to 3rem and
    // tinted the subtitle navy (#374151) instead of the design's ink black.
    if (c.fontSize && !opts.skipSize) st.fontSize = SIZE_MAP[c.fontSize];
    if (c.color && !opts.skipColor) st.color = c.color;
    if (c.fontWeight) st.fontWeight = WEIGHT_MAP[c.fontWeight];
    // skipAlign: let the layout/CSS own alignment (a stale `align:left` in saved
    // config was pinning the hero title left, overriding the mobile centre).
    if (c.align && !opts.skipAlign) st.textAlign = c.align;
    return Object.keys(st).length ? st : undefined;
  };
  const isVisible = (id) => effectiveConfigs?.[id]?.config?.visible !== false;

  const rawStats = editorMode
    ? { totalVoted: editorData?.totalVoted ?? 342, totalEligible: editorData?.totalEligible ?? 1200 }
    : { totalVoted: initialData?.stats?.totalVoted ?? 0, totalEligible: initialData?.stats?.totalEligible ?? 0 };
  const pct = rawStats.totalEligible > 0 ? ((rawStats.totalVoted / rawStats.totalEligible) * 100).toFixed(2) : "0.00";

  const blockData = { session, isVotedReal, isCheckingVoted: false, initialData, stats: { ...rawStats, percentage: pct } };
  const editorBlockData = { session: null, isVotedReal: false, isCheckingVoted: false, initialData: { systemMode: "AUTO", electionStatus: "ACTIVE", isSystemOpen: true }, stats: { ...rawStats, percentage: pct } };
  const activeBlockData = editorMode ? editorBlockData : blockData;

  // effective template (overlay admin overrides) + token style
  const elementVariantOverrides = pageLayout?.elementVariants?.home || {};
  const themeTokenOverrides = pageLayout?.themeTokens || {};
  const elementVarOverrides = pageLayout?.elementVars?.home || {};
  const effectiveTemplate = (() => {
    const hasV = Object.keys(elementVariantOverrides).length > 0;
    const hasT = Object.keys(themeTokenOverrides).length > 0;
    const hasVars = Object.keys(elementVarOverrides).length > 0;
    if (!hasV && !hasT && !hasVars) return resolvedTemplate;
    const baseEl = resolvedTemplate?.elements || {};
    const mergedEl = { ...baseEl };
    for (const id of Object.keys(elementVariantOverrides)) mergedEl[id] = { ...(baseEl[id] || {}), variant: elementVariantOverrides[id] };
    for (const id of Object.keys(elementVarOverrides)) { const b = mergedEl[id] || {}; mergedEl[id] = { ...b, vars: { ...(b.vars || {}), ...elementVarOverrides[id] } }; }
    const baseTheme = resolvedTemplate?.theme || {};
    const mergedTheme = hasT ? { ...baseTheme, tokens: { ...(baseTheme.tokens || {}), ...themeTokenOverrides } } : baseTheme;
    return { ...(resolvedTemplate || {}), theme: mergedTheme, elements: mergedEl };
  })();
  const tokenStylesCss = editorMode
    ? (editorTokenStyles || "")
    : [buildTemplateStyles(effectiveTemplate, ".fms-app"), buildElementCss(pageLayout?.elementCss?.home, ".fms-app")].filter(Boolean).join("\n\n");

  // voteCTA (chunky-stamp element)
  // Resolve the voteCTA state from the FRESH client-side vote status (isVotedReal),
  // not the SSR session flag — otherwise the config (text) stays "notVoted" while the
  // chunky-stamp visual flips to "voted", producing a "✓ VOTE NOW" disabled mismatch.
  const runtimeCtx = buildRuntimeContext({
    session,
    systemConfig: initialData?.systemConfig,
    electionStatus: initialData?.electionStatus,
    userData: session?.user ? { ...(initialData?.userData || {}), isVoted: isVotedReal } : initialData?.userData,
  });
  const voteCTAState = resolveElementState("voteCTA-button", runtimeCtx);
  const voteCTAOverrides = pageLayout?.elementOverrides?.["voteCTA-button"]?.[voteCTAState] || {};
  const voteCTAConfig = resolveStatefulConfig(effectiveTemplate, "voteCTA-button", voteCTAState, voteCTAOverrides);
  const VoteCTA = getVoteCTAVariant(effectiveTemplate?.elements?.["voteCTA-button"]?.variant || "chunky-stamp");

  // text values
  const titleText = String(getText("hero-title", globalConfig.electionName) ?? "");
  const titleMatch = titleText.match(/^(.+?)\s*(\d+)$/);
  const titlePart = titleMatch ? titleMatch[1].trim() : titleText;
  const numberPart = titleMatch ? titleMatch[2] : "";
  const yearText = isBoundElement("hero-year-badge")
    ? `ประจำปีการศึกษา ${globalConfig.academicYearTh}`
    : getText("hero-year-badge", `ประจำปีการศึกษา ${globalConfig.academicYearTh}`);
  const sysMode = initialData?.systemMode || "AUTO";

  // Real party count from DB (number > 0 = real party; 0 = งดออกเสียง, -1 = ไม่รับรอง).
  // Drives the ticker + meet-card copy so they never hardcode a stale "2".
  const realParties = (initialData?.candidates || []).filter((c) => c.number > 0);
  const partyCount = realParties.length || (editorMode ? 2 : 0);

  // Central config (globalConfig) — every year / name on the page reads from here,
  // never hardcoded. electionCalendarYear is the ค.ศ. year ("FMS ELECTION 2027"),
  // NOT academicYearTh (พ.ศ.).
  const facultyEn = globalConfig.facultyShortEn || "FMS";
  const calendarYear = globalConfig.electionCalendarYear || "";
  const uni = globalConfig.university || "PSU";
  const samoPrefix = globalConfig.electionNamePrefix || titlePart || "SAMO";
  const samoNumber = numberPart || String(globalConfig.electionNumber ?? "");
  const orgName = globalConfig.organizationName || "";
  const copyrightYear = globalConfig.copyrightYear || calendarYear;

  // Eyebrow status sticker — replaces the old decorative "LIVE BALLOT" (the
  // original design's clock, now redundant with the bento countdown). Reflects
  // real election state so the slot earns its place.
  const statusInfo = (() => {
    switch (initialData?.electionStatus) {
      case "ONGOING": return { label: "เปิดลงคะแนนแล้ว", live: true, cls: "gh-sticker--paper" };
      case "ENDED":   return { label: "ปิดลงคะแนนแล้ว", live: false, cls: "gh-sticker--paper" };
      case "CLOSED":  return { label: "พักลงคะแนนชั่วคราว", live: false, cls: "gh-sticker--paper" };
      default:        return { label: "ใกล้เปิดลงคะแนน", live: false, cls: "gh-sticker--paper" };
    }
  })();

  // Auth state for the topbar / hamburger
  const loggedIn = status === "authenticated" && !!session?.user;
  const navName = session?.user?.name || "";
  const navId = session?.user?.studentId || "";
  const BP = process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs";
  const doLogin = () => { if (!editorMode) signIn("authentik", { callbackUrl: BP + "/vote" }); };
  const doLogout = () => { if (!editorMode) signOut({ callbackUrl: BP + "/" }); };

  return (
    <div className="fms-app gh-root">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}

      {/* ── TOPBAR ── */}
      <header className="gh-topbar">
        <a href={getPath("/")} className="gh-brand">
          <Image src={getPath("/images/logo/fms_logo50_color.png")} alt="FMS 50th" width={480} height={480} className="gh-brand__badge" priority />
          <span className="gh-brand__div" />
          <Image src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")} alt="FMS PSU" width={1200} height={384} className="gh-brand__word" priority />
        </a>
        <nav className="gh-nav">
          <a href={getPath("/")} className="gh-navlink is-active">หน้าแรก</a>
          <a href={getPath("/candidates")} className="gh-navlink">Meet Candidates</a>
          <a href={getPath("/results")} className="gh-navlink">ผลการลงคะแนนเสียง</a>
        </nav>
        <div className="gh-topbar__right">
          <div className="gh-auth-desktop">
            {loggedIn ? (
              <div className="gh-user">
                <span className="gh-user__name">{navName || "ผู้ใช้"}</span>
                <button className="gh-btn" onClick={doLogout}><LogOut size={15} /> ออกจากระบบ</button>
              </div>
            ) : (
              <button className="gh-btn gh-btn--ink" onClick={doLogin}><ArrowRight size={16} /> เข้าสู่ระบบ</button>
            )}
          </div>
          <button className="gh-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="เมนู" aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
          </button>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {menuOpen && (
        <>
          <div className="gh-drawer__scrim" onClick={() => setMenuOpen(false)} />
          <aside className="gh-drawer" role="dialog" aria-label="เมนู">
            <div className={`gh-drawer__status ${loggedIn ? "is-in" : ""}`}>
              {loggedIn ? (
                <>
                  <span className="gh-drawer__hi"><span className="gh-livedot" /> เข้าสู่ระบบแล้ว</span>
                  <strong>{navName || "ผู้ใช้"}</strong>
                  {navId ? <small>{navId}</small> : null}
                </>
              ) : (
                <>
                  <span className="gh-drawer__hi">ยังไม่ได้เข้าสู่ระบบ</span>
                  <small>เข้าสู่ระบบด้วย PSU Passport เพื่อลงคะแนน</small>
                </>
              )}
            </div>
            <nav className="gh-drawer__nav">
              <a href={getPath("/")} className="gh-drawer__link">หน้าแรก</a>
              <a href={getPath("/candidates")} className="gh-drawer__link">Meet Candidates</a>
              <a href={getPath("/results")} className="gh-drawer__link">ผลการลงคะแนนเสียง</a>
            </nav>
            {loggedIn ? (
              <button className="gh-btn gh-btn--lg gh-btn--coral gh-drawer__auth" onClick={doLogout}><LogOut size={18} /> ออกจากระบบ</button>
            ) : (
              <button className="gh-btn gh-btn--lg gh-btn--ink gh-drawer__auth" onClick={doLogin}><ArrowRight size={18} /> เข้าสู่ระบบ</button>
            )}
          </aside>
        </>
      )}

      {/* ── TICKER ── */}
      <div className="gh-ticker">
        <div className="gh-ticker__track">
          {[0, 1].map((k) => (
            <span key={k} className="gh-ticker__item">
              ★ {facultyEn} ELECTION {calendarYear} <Dot /> {samoPrefix} {samoNumber} <Dot /> CAST YOUR VOTE <Dot /> {orgName} <Dot /> {partyCount} {partyCount === 1 ? "PARTY" : "PARTIES"} RUNNING <Dot /> POWERED BY {uni} PASSPORT <Dot />
            </span>
          ))}
        </div>
      </div>

      {/* ── HOME GRID ── */}
      <main className="gh-home">
        {/* LEFT */}
        <div className="gh-home__left">
          <div className="gh-eyebrow">
            <span className="gh-sticker gh-sticker--lime">⚡ {facultyEn} ELECTION {calendarYear}</span>
            <span className={`gh-sticker ${statusInfo.cls} gh-sticker--rotate`}>
              {statusInfo.live && <span className="gh-livedot" />} {statusInfo.label}
            </span>
          </div>

          <Wrap id="hero-title">
            <h1 className="gh-title" data-element="hero-title" style={getTextStyle("hero-title", { skipSize: true, skipAlign: true })}>
              {titlePart}
              {numberPart && <><br /><em>{numberPart}</em></>}
            </h1>
          </Wrap>

          <Wrap id="hero-subtitle">
            <p className="gh-subtitle" data-element="hero-subtitle" style={getTextStyle("hero-subtitle", { skipSize: true, skipColor: true, skipAlign: true })}>
              {/* line 1 — project name: the punchy lead (lime marker box) */}
              <span className="gh-subtitle__lead"><span className="gh-hl">{getText("hero-subtitle", globalConfig.campaignTitle)}</span></span>
              {/* line 2 — organization: quieter supporting line (smaller, lime chip, no box) */}
              <span className="gh-subtitle__org">{getText("hero-subtitle2", globalConfig.organizationName)}</span>
            </p>
          </Wrap>

          {isVisible("hero-year-badge") && (
            <Wrap id="hero-year-badge">
              <div className="gh-yearrow">
                <span className="gh-sticker gh-sticker--paper gh-sticker--year"><Calendar size={18} /> {yearText}</span>
              </div>
            </Wrap>
          )}

          <div className="gh-cta">
            <Wrap id="voteCTA-button">
              <VoteCTA config={voteCTAConfig} data={activeBlockData} resolvedConfig={voteCTAConfig} />
            </Wrap>
          </div>
        </div>

        {/* RIGHT — bento aside */}
        <aside className="gh-aside">
          <Wrap id="hero-countdown" className="gh-span2">
            <div className="gh-span2"><GumroadCountdown systemMode={sysMode} /></div>
          </Wrap>

          <Wrap id="stats-voted-card">
            <div className="gh-stat gh-stat--pink" data-element="stats-voted-card">
              <div className="gh-stat__lbl"><CheckCircle2 size={14} /> ใช้สิทธิ์แล้ว · VOTED</div>
              <div className="gh-stat__val">{rawStats.totalVoted.toLocaleString()}<span className="gh-stat__unit">คน</span></div>
              <div className="gh-stat__sub">นักศึกษาที่ลงคะแนนแล้ว</div>
              <svg className="gh-ekg" viewBox="0 0 200 60" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M0 30 L40 30 L48 30 L54 10 L62 50 L70 30 L100 30 L108 30 L116 18 L124 42 L132 30 L200 30" /></svg>
            </div>
          </Wrap>

          <Wrap id="stats-eligible-card">
            <div className="gh-stat gh-stat--lime" data-element="stats-eligible-card">
              <div className="gh-stat__lbl">ผู้มีสิทธิ์รวม · ELIGIBLE</div>
              <div className="gh-stat__val">{rawStats.totalEligible.toLocaleString()}<span className="gh-stat__unit">คน</span></div>
              <div className="gh-stat__sub">ความคืบหน้า · {pct}%</div>
            </div>
          </Wrap>

          <Wrap id="meet-section" className="gh-span2">
            <a href={editorMode ? undefined : getPath("/candidates")} className="gh-meet gh-span2" data-element="meet-section">
              <div>
                <h3 className="gh-meet__title">{getText("meet-title", "รู้จักผู้สมัครของคุณหรือยัง?")}</h3>
                <p className="gh-meet__sub">{partyCount} พรรคในปีนี้ · ดูวิสัยทัศน์ก่อนลงคะแนน</p>
              </div>
              <span className="gh-btn gh-btn--pink">ดูรายชื่อพรรค <ArrowRight size={16} /></span>
            </a>
          </Wrap>
        </aside>
      </main>

      {/* ── FOOTER ── */}
      <footer className="gh-footer">
        <div>© {facultyEn}@{uni} {copyrightYear} · ALL RIGHTS RESERVED</div>
        <div className="gh-footer__edition"><span className="gh-star">★</span> ACTIVE PULSE EDITION <span className="gh-star">★</span></div>
      </footer>

      <style jsx global>{`
        .gh-root {
          --ink:#1A1A1A; --ink2:#4A4A4A; --cream:#FFF1E5; --cream2:#FFE4CE; --paper:#FFF;
          --pink:#FF90E8; --lime:#B6FF6E; --yellow:#FFC900; --sky:#A8E1FF; --coral:#FF6E6E;
          --bw:2.5px; --sh:5px 5px 0 var(--ink); --sh-sm:3px 3px 0 var(--ink); --sh-lg:8px 8px 0 var(--ink);
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; color:var(--ink);
          font-family:var(--fb);
          container-type:inline-size; container-name:gh;
          background:var(--cream);
          background-image:
            radial-gradient(circle at 12% 18%, #FFD1F2 0, transparent 38%),
            radial-gradient(circle at 88% 8%, #DFFFC2 0, transparent 32%),
            radial-gradient(circle at 92% 92%, #DCF2FF 0, transparent 38%);
          background-attachment:fixed;
        }
        .gh-root *{ box-sizing:border-box; }
        .gh-root a{ text-decoration:none; color:inherit; }

        /* topbar */
        .gh-topbar{ position:sticky; top:0; z-index:50; display:flex; align-items:center; justify-content:space-between;
          gap:16px; padding:14px 32px; background:var(--cream); border-bottom:var(--bw) solid var(--ink); }
        .gh-brand{ display:flex; align-items:center; gap:14px; flex-shrink:0; }
        .gh-brand__badge{ width:auto; height:48px; object-fit:contain; }
        .gh-brand__div{ width:2px; height:36px; background:var(--ink); display:inline-block; }
        .gh-brand__word{ width:auto; height:34px; object-fit:contain; }
        .gh-nav{ display:flex; align-items:center; gap:4px; }
        .gh-navlink{ padding:8px 16px; border-radius:999px; font-weight:600; font-size:15px; border:2px solid transparent; transition:all .15s ease-out; white-space:nowrap; }
        .gh-navlink:hover{ background:var(--paper); border-color:var(--ink); }
        .gh-navlink.is-active{ background:var(--pink); border-color:var(--ink); box-shadow:var(--sh-sm); }
        .gh-topbar__right{ display:flex; align-items:center; gap:12px; flex-shrink:0; }

        /* buttons */
        .gh-btn{ display:inline-flex; align-items:center; gap:8px; padding:12px 20px; border:var(--bw) solid var(--ink);
          border-radius:14px; background:var(--paper); color:var(--ink); font-weight:700; font-size:15px;
          font-family:var(--fb); box-shadow:var(--sh-sm); cursor:pointer; white-space:nowrap;
          transition:transform .12s ease-out, box-shadow .12s ease-out; }
        .gh-btn:hover{ transform:translate(-2px,-2px); box-shadow:var(--sh); }
        .gh-btn:active{ transform:translate(2px,2px); box-shadow:0 0 0 var(--ink); }
        .gh-btn--ink{ background:var(--ink); color:var(--cream); }
        .gh-btn--pink{ background:var(--pink); }
        .gh-btn--lime{ background:var(--lime); }
        .gh-btn--lg{ padding:18px 28px; font-size:17px; border-radius:16px; box-shadow:var(--sh); }
        .gh-btn--lg:hover{ transform:translate(-3px,-3px); box-shadow:var(--sh-lg); }
        .gh-btn--coral{ background:var(--coral); }

        /* topbar auth + hamburger */
        .gh-auth-desktop{ display:flex; align-items:center; }
        .gh-user{ display:flex; align-items:center; gap:12px; }
        .gh-user__name{ font-weight:700; font-size:14px; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .gh-burger{ display:none; width:46px; height:46px; flex-shrink:0; border:var(--bw) solid var(--ink); border-radius:14px; background:var(--paper); place-items:center; cursor:pointer; box-shadow:var(--sh-sm); }
        .gh-burger:hover{ background:var(--lime); }

        /* mobile drawer */
        .gh-drawer__scrim{ position:fixed; inset:0; z-index:55; background:rgba(26,26,26,.42); backdrop-filter:blur(2px); }
        .gh-drawer{ position:fixed; top:0; right:0; bottom:0; z-index:60; width:min(84vw,330px); display:flex; flex-direction:column; gap:14px;
          padding:24px 20px; overflow-y:auto; background:var(--cream); border-left:var(--bw) solid var(--ink); box-shadow:-10px 0 0 rgba(26,26,26,.12);
          background-image:radial-gradient(circle at 90% 6%, #FFD1F2 0,transparent 40%),radial-gradient(circle at 10% 96%, #DCF2FF 0,transparent 42%); }
        .gh-drawer__status{ background:var(--paper); border:var(--bw) solid var(--ink); border-radius:16px; box-shadow:var(--sh-sm); padding:16px 18px; display:flex; flex-direction:column; gap:3px; }
        .gh-drawer__status.is-in{ background:var(--lime); }
        .gh-drawer__hi{ display:inline-flex; align-items:center; gap:8px; font-family:var(--fm); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink2); }
        .gh-drawer__status strong{ font-size:18px; line-height:1.2; }
        .gh-drawer__status small{ font-family:var(--fm); font-size:12px; color:var(--ink2); }
        .gh-drawer__nav{ display:flex; flex-direction:column; gap:9px; }
        .gh-drawer__link{ padding:13px 16px; border:2px solid var(--ink); border-radius:12px; background:var(--paper); font-weight:700; font-size:15px; box-shadow:var(--sh-sm); }
        .gh-drawer__link:hover{ background:var(--pink); }
        .gh-drawer__auth{ margin-top:auto; justify-content:center; }

        /* ticker */
        .gh-ticker{ border-bottom:var(--bw) solid var(--ink); background:var(--ink); color:var(--cream);
          overflow:hidden; white-space:nowrap; font-family:var(--fd); font-size:22px; letter-spacing:.02em; }
        .gh-ticker__track{ display:inline-flex; align-items:center; gap:32px; padding:12px 0; animation:ghTicker 35s linear infinite; }
        .gh-ticker__item{ display:inline-flex; align-items:center; gap:32px; }
        @keyframes ghTicker{ 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .gh-dot{ width:12px; height:12px; background:var(--pink); border-radius:999px; display:inline-block; }

        .gh-livedot{ width:10px; height:10px; border-radius:999px; background:var(--coral); display:inline-block; box-shadow:0 0 0 0 rgba(255,110,110,.8); animation:ghPulse 1.6s ease-out infinite; }
        @keyframes ghPulse{ 0%{box-shadow:0 0 0 0 rgba(255,110,110,.7)} 70%{box-shadow:0 0 0 12px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }

        /* home grid */
        .gh-home{ flex:1; width:100%; max-width:1500px; margin:0 auto; display:grid;
          grid-template-columns:1.15fr 1fr; gap:56px; padding:48px 56px 80px; align-items:center; }
        .gh-home__left{ position:relative; min-width:0; }

        .gh-eyebrow{ display:flex; gap:10px; margin-bottom:24px; flex-wrap:wrap; }
        .gh-sticker{ display:inline-flex; align-items:center; gap:8px; padding:6px 14px; background:var(--paper);
          border:var(--bw) solid var(--ink); border-radius:999px; font-weight:700; font-size:13px; box-shadow:var(--sh-sm); }
        .gh-sticker--lime{ background:var(--lime); }
        .gh-sticker--paper{ background:var(--paper); }
        .gh-sticker--rotate{ transform:rotate(-3deg); }
        /* year badge — deliberately larger than the eyebrow stickers */
        .gh-sticker--year{ font-size:17px; padding:10px 20px; border-radius:14px; box-shadow:var(--sh-sm); }

        .gh-title{ font-family:var(--fd); font-size:clamp(64px,14cqw,200px); line-height:.85; letter-spacing:-.04em;
          color:var(--ink); margin:0; text-transform:uppercase; }
        .gh-title em{ font-style:normal; background:var(--pink); display:inline-block; padding:0 12px; margin:10px 0 0;
          border:var(--bw) solid var(--ink); box-shadow:var(--sh); transform:rotate(-2deg); }
        .gh-subtitle{ margin:28px 0 0; font-size:clamp(19px,2.6cqw,26px); font-weight:600; line-height:1.5; color:var(--ink); max-width:580px; }
        .gh-hl{ background:var(--lime); padding:2px 8px; border-radius:4px; border:1.5px solid var(--ink); font-weight:700;
          box-decoration-break:clone; -webkit-box-decoration-break:clone; }
        /* line 1 — the punchy lead: big, heavy, in the bordered lime marker box */
        .gh-subtitle__lead{ display:block; }
        .gh-subtitle__lead .gh-hl{ font-size:clamp(20px,2.7cqw,27px); font-weight:800; letter-spacing:-.01em; }
        /* line 2 — organisation: distinctly quieter — smaller, lighter, no box,
           just a lime underline accent so the two lines read as different roles */
        .gh-subtitle__org{ display:inline-block; margin-top:14px; font-size:clamp(14px,1.8cqw,18px);
          font-weight:500; color:var(--ink); letter-spacing:.02em; border-bottom:3px solid var(--lime); padding-bottom:2px; }
        .gh-yearrow{ margin-top:20px; }
        .gh-cta{ margin-top:36px; display:flex; gap:16px; flex-wrap:wrap; align-items:center; }

        /* bento aside */
        .gh-aside{ display:grid; grid-template-columns:1fr 1fr; gap:20px; min-width:0; }
        .gh-span2{ grid-column:1 / -1; }
        .gh-cd{ background:var(--ink); color:var(--cream); border:var(--bw) solid var(--ink); border-radius:22px; box-shadow:var(--sh-lg); padding:22px 26px; }
        .gh-cd__lbl{ display:flex; align-items:center; gap:8px; font-family:var(--fm); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.15em; color:var(--pink); }
        .gh-cd__grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:14px; }
        .gh-cd__cell{ background:var(--cream); color:var(--ink); border-radius:12px; padding:10px 8px; text-align:center; }
        .gh-cd__num{ font-family:var(--fd); font-size:clamp(26px,4.4cqw,44px); line-height:1; font-variant-numeric:tabular-nums; }
        .gh-cd__unit{ font-family:var(--fm); font-size:11px; color:var(--ink2); margin-top:4px; text-transform:uppercase; letter-spacing:.1em; }

        .gh-stat{ position:relative; overflow:hidden; border:var(--bw) solid var(--ink); border-radius:22px; padding:22px; box-shadow:var(--sh); }
        .gh-stat--pink{ background:var(--pink); }
        .gh-stat--lime{ background:var(--lime); }
        .gh-stat__lbl{ display:flex; align-items:center; gap:6px; font-family:var(--fm); font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.12em; }
        .gh-stat__val{ font-family:var(--fd); font-size:clamp(34px,6cqw,56px); line-height:1; margin-top:8px; font-variant-numeric:tabular-nums; position:relative; z-index:1; }
        .gh-stat__unit{ font-size:20px; font-family:var(--fb); font-weight:600; margin-left:8px; }
        .gh-stat__sub{ font-size:13px; margin-top:8px; font-weight:500; position:relative; z-index:1; }
        .gh-ekg{ position:absolute; right:-12px; bottom:-10px; width:140px; opacity:.85; z-index:0; }

        .gh-meet{ display:flex; align-items:center; justify-content:space-between; gap:16px; background:var(--paper);
          border:var(--bw) solid var(--ink); border-radius:22px; box-shadow:var(--sh); padding:22px 26px;
          transition:transform .12s ease-out, box-shadow .12s ease-out; }
        .gh-meet:hover{ transform:translate(-2px,-2px); box-shadow:var(--sh-lg); }
        .gh-meet__title{ margin:0; font-size:22px; font-weight:700; }
        .gh-meet__sub{ margin:4px 0 0; font-size:14px; color:var(--ink2); }

        /* footer */
        .gh-footer{ margin-top:auto; border-top:var(--bw) solid var(--ink); padding:22px 32px; background:var(--ink); color:var(--cream);
          display:flex; align-items:center; justify-content:space-between; gap:16px; font-family:var(--fm); font-size:13px; flex-wrap:wrap; }
        .gh-footer__edition{ display:flex; gap:14px; align-items:center; }
        .gh-star{ color:var(--pink); font-size:18px; }

        /* ── RESPONSIVE ── */
        /* laptop / small desktop */
        @container gh (max-width:1200px){
          .gh-home{ gap:40px; padding:40px 40px 64px; }
        }
        /* tablet — single column, hide nav */
        @container gh (max-width:980px){
          .gh-home{ grid-template-columns:1fr; gap:36px; padding:32px 28px 60px; align-items:stretch; }
          .gh-nav{ display:none; }
          .gh-auth-desktop{ display:none; }
          .gh-burger{ display:grid; }
          .gh-topbar{ padding:12px 20px; }
          .gh-ticker{ font-size:18px; }
          /* stacked layout — centre the hero so it doesn't look lopsided */
          .gh-home__left{ text-align:center; }
          .gh-eyebrow{ justify-content:center; }
          .gh-subtitle{ margin-left:auto; margin-right:auto; }
          .gh-yearrow{ display:flex; justify-content:center; }
          .gh-cta{ justify-content:center; }
        }
        /* phone */
        @container gh (max-width:560px){
          .gh-hide-sm{ display:none; }
          .gh-aside{ grid-template-columns:1fr; }
          .gh-home{ padding:24px 16px 48px; }
          .gh-topbar{ padding:10px 14px; }
          .gh-brand__div, .gh-brand__word{ display:none; }
          .gh-brand__badge{ height:40px; }
          .gh-cta{ flex-direction:column; align-items:stretch; }
          .gh-cta > *{ width:100%; justify-content:center; }
          .gh-cd__num{ font-size:30px; }
          .gh-footer{ flex-direction:column; gap:10px; text-align:center; }
        }
      `}</style>
    </div>
  );
}

function Dot() { return <span className="gh-dot" />; }
