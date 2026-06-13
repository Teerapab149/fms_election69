"use client";

// StudioDarkHome — the HOME layout for the Studio Dark v2 template (slug
// "studio-dark"). The LAYOUT half of the template (token/theme half =
// templates/builtIn/studio-dark.js). Faithful recreation of the home scene in
// docs/design-refs/Studio Dark v2.html + studio-v2.css: persistent left rail
// (shared <StudioDarkRail>) + a sticky scene-bar + a 2-column chapter scene
// (left: CHAPTER eyebrow → oversized "SAMO 50." → deck → CTA pair; right: an
// italic rotor line over a 3-row stat ledger) + a slow bottom marquee.
//
// Wired to real data + globalConfig text + the voteCTA-button element (minimal-
// pill variant), and editorMode-aware: key text elements carry data-element +
// the stable Wrap so they're selectable/base-editable in the admin editor (like
// classic/gumroad). Studio-dark identity (hairlines, lime accent, Geist /
// Instrument Serif / Geist Mono) is hardcoded here per Rule 9.
//
// Drop-in: takes the exact props HomeContent/GumroadHome receive, dispatched in
// HomeRenderer by slug. Mobile: the rail collapses to a top bar (handled inside
// StudioDarkRail); .sd-main drops its rail offset.

import { getPath } from "../../utils/basePath";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import StudioDarkRail from "./StudioDarkRail";
import EditorElement from "../admin/editor/EditorElement";
import { SIZE_MAP, WEIGHT_MAP } from "../../utils/styleMaps";
import { resolveElementState, buildRuntimeContext } from "../admin/editor/stateResolver";
import { resolveStatefulConfig } from "../admin/editor/templateEngine";
import { getBinding, isBoundElement } from "../admin/editor/elementCatalog";
import { buildTemplateStyles, buildElementCss } from "../../lib/templateTokens";
import { getVoteCTAVariant } from "../elements/voteCTA-button";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { useVoteStatus } from "../../hooks/useVoteStatus";

export default function StudioDarkHome({
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
  // Shared cached status (one request per navigation across all consumers).
  const { isVoted: isVotedReal } = useVoteStatus({
    enabled: !editorMode && status === "authenticated",
  });
  const [clock, setClock] = useState("");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      // local Thailand time — "TH" reads clearer than "ICT" for the audience
      setClock(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} TH`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

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
    if (c.fontSize && !opts.skipSize) st.fontSize = SIZE_MAP[c.fontSize];
    if (c.color && !opts.skipColor) st.color = c.color;
    if (c.fontWeight) st.fontWeight = WEIGHT_MAP[c.fontWeight];
    if (c.align && !opts.skipAlign) st.textAlign = c.align;
    return Object.keys(st).length ? st : undefined;
  };

  const rawStats = editorMode
    ? { totalVoted: editorData?.totalVoted ?? 342, totalEligible: editorData?.totalEligible ?? 1200 }
    : { totalVoted: initialData?.stats?.totalVoted ?? 0, totalEligible: initialData?.stats?.totalEligible ?? 0 };
  const pct = rawStats.totalEligible > 0 ? ((rawStats.totalVoted / rawStats.totalEligible) * 100).toFixed(2) : "0.00";

  const blockData = { session, isVotedReal, isCheckingVoted: false, initialData, stats: { ...rawStats, percentage: pct } };
  const editorBlockData = { session: null, isVotedReal: false, isCheckingVoted: false, initialData: { systemMode: "AUTO", electionStatus: "ACTIVE", isSystemOpen: true }, stats: { ...rawStats, percentage: pct } };
  const activeBlockData = editorMode ? editorBlockData : blockData;

  // effective template (overlay admin overrides) + token style (mirrors GumroadHome)
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

  // voteCTA (minimal-pill element) — resolve from FRESH client vote status
  const runtimeCtx = buildRuntimeContext({
    session,
    systemConfig: initialData?.systemConfig,
    electionStatus: initialData?.electionStatus,
    userData: session?.user ? { ...(initialData?.userData || {}), isVoted: isVotedReal } : initialData?.userData,
  });
  const voteCTAState = resolveElementState("voteCTA-button", runtimeCtx);
  const voteCTAOverrides = pageLayout?.elementOverrides?.["voteCTA-button"]?.[voteCTAState] || {};
  const voteCTAConfig = resolveStatefulConfig(effectiveTemplate, "voteCTA-button", voteCTAState, voteCTAOverrides);
  const VoteCTA = getVoteCTAVariant(effectiveTemplate?.elements?.["voteCTA-button"]?.variant || "minimal-pill");

  // text values
  const titleText = String(getText("hero-title", globalConfig.electionName) ?? "");
  const titleMatch = titleText.match(/^(.+?)\s*(\d+)$/);
  const titlePart = titleMatch ? titleMatch[1].trim() : titleText;
  const numberPart = titleMatch ? titleMatch[2] : "";
  const sysMode = initialData?.systemMode || "AUTO";

  const realParties = (initialData?.candidates || []).filter((c) => c.number > 0);
  const partyCount = realParties.length || (editorMode ? 2 : 0);

  const facultyEn = globalConfig.facultyShortEn || "FMS";
  const calendarYear = globalConfig.electionCalendarYear || "";
  const academicYear = globalConfig.academicYearTh || "";
  const orgName = globalConfig.organizationName || "";
  const deckText = String(getText("hero-subtitle", globalConfig.campaignTitle) ?? "");

  const statusLabel = (() => {
    switch (initialData?.electionStatus) {
      case "ONGOING": return { txt: "POLLS OPEN", live: true };
      case "ENDED":   return { txt: "POLLS CLOSED", live: false };
      case "CLOSED":  return { txt: "PAUSED", live: false };
      default:        return { txt: "OPENING SOON", live: false };
    }
  })();

  const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);

  return (
    <div className="fms-app sd-root">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}

      <StudioDarkRail active="home" editorMode={editorMode} systemMode={sysMode} />

      <main className="sd-main">
        {/* scene bar */}
        <div className="sd-scenebar">
          <div className="sd-scenebar__crumbs">
            <span className="num">01</span><span className="sep">/</span>
            <span className="here">Index</span><span className="sep">·</span>
            <span>หน้าหลัก</span>
          </div>
          <div className="sd-scenebar__right">
            <span className={statusLabel.live ? "live" : ""}>{statusLabel.live && <span className="sd-dot" />}{statusLabel.txt}</span>
            <span>{clock}</span>
          </div>
        </div>

        {/* home scene */}
        <div className="sd-home">
          <div className="sd-home__scene">
            {/* LEFT */}
            <div className="sd-home__left">
              <Wrap id="hero-title">
                <h1 className="sd-home__giant">
                  {titlePart}
                  {numberPart && <em>{numberPart}</em>}
                </h1>
              </Wrap>

              <div className="sd-home__lower">
                <Wrap id="hero-subtitle">
                  <p className="sd-home__deck" style={getTextStyle("hero-subtitle", { skipSize: true, skipColor: true, skipAlign: true })}>
                    {/* break at the logical name boundaries (project / organisation
                        / year) so the long Thai string never wraps mid-word */}
                    <span className="sd-home__deck-line">{deckText}</span>
                    {orgName && <span className="sd-home__deck-line">{orgName}</span>}
                    {academicYear && <span className="sd-home__deck-year">ประจำปีการศึกษา {academicYear}</span>}
                  </p>
                </Wrap>
                <div className="sd-home__cta">
                  <Wrap id="voteCTA-button">
                    <VoteCTA config={voteCTAConfig} data={activeBlockData} resolvedConfig={voteCTAConfig} />
                  </Wrap>
                  <a href={editorMode ? undefined : getPath("/candidates")} className="sd-ghost">
                    ดูรายชื่อพรรค <span className="sd-ghost__arrow" aria-hidden>↗</span>
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="sd-home__right">
              <div className="sd-home__rotor">
                A vote that decides <em>who leads</em> your faculty for the next year.
              </div>

              <div className="sd-home__numbers">
                <div className="sd-num-row">
                  <div>
                    <div className="sd-num-lbl">VOTED · ใช้สิทธิ์แล้ว</div>
                    <div className="sd-num-val"><em>{fmtInt(rawStats.totalVoted)}</em><small>/ {fmtInt(rawStats.totalEligible)}</small></div>
                  </div>
                  <div className="sd-num-bar"><div className="sd-num-bar-fill" style={{ width: `${Math.max(Number(pct), 0.5)}%` }} /></div>
                </div>
                <div className="sd-num-row">
                  <div>
                    <div className="sd-num-lbl">PARTIES · พรรคที่ลงสมัคร</div>
                    <div className="sd-num-val">{partyCount}</div>
                  </div>
                </div>
                <div className="sd-num-row">
                  <div>
                    <div className="sd-num-lbl">TURNOUT · ความคืบหน้า</div>
                    <div className="sd-num-val">{pct}<small>%</small></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* marquee — real, meaningful election info (not decorative filler) */}
          <div className="sd-marquee">
            <div className="sd-marquee__track">
              {[0, 1].map((k) => (
                <span className="sd-marquee__item" key={k}>
                  <span>ระบบเลือกตั้งออนไลน์</span><span className="sd-marquee__dot" />
                  {orgName && (<><span>{orgName}</span><span className="sd-marquee__dot" /></>)}
                  {partyCount > 0 && (<><span>{partyCount} พรรคผู้สมัคร</span><span className="sd-marquee__dot" /></>)}
                  <span>ใช้สิทธิ์แล้ว {pct}%</span><span className="sd-marquee__dot" />
                  <em>{titlePart} {numberPart}</em>{calendarYear && <span>&nbsp;· {calendarYear}</span>}<span className="sd-marquee__dot" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .sd-root {
          --sd-bg:#14140F; --sd-bg-2:#1B1B14; --sd-bg-3:#232319;
          --sd-line:#2E2E22; --sd-line-strong:#3E3E2D;
          --sd-ink:#F2EDDF; --sd-ink-2:#B5B0A2; --sd-ink-3:#7F7A6E; --sd-ink-4:#555142;
          --sd-accent:#D5FF3F;
          --sd-sans:var(--font-studio-sans),'Inter',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --sd-serif:var(--font-instrument-serif),'Instrument Serif','Times New Roman',serif;
          --sd-mono:var(--font-studio-mono),'JetBrains Mono',ui-monospace,monospace;
          min-height:100vh; background:var(--sd-bg); color:var(--sd-ink);
          font-family:var(--sd-sans);
        }
        .sd-root * { box-sizing:border-box; }
        .sd-root a { text-decoration:none; color:inherit; }

        /* main — offset for the fixed 240px rail */
        .sd-main { margin-left:240px; min-height:100vh; display:flex; flex-direction:column; min-width:0; }

        /* scene bar */
        .sd-scenebar {
          display:grid; grid-template-columns:1fr auto; align-items:center;
          padding:20px 48px; border-bottom:1px solid var(--sd-line);
          background:rgba(20,20,15,.6); backdrop-filter:blur(10px);
          position:sticky; top:0; z-index:30;
        }
        .sd-scenebar__crumbs { display:flex; align-items:center; gap:14px; font-family:var(--sd-mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-3); }
        .sd-scenebar__crumbs .num { color:var(--sd-accent); }
        .sd-scenebar__crumbs .sep { color:var(--sd-line-strong); }
        .sd-scenebar__crumbs .here { color:var(--sd-ink); }
        .sd-scenebar__right { display:flex; align-items:center; gap:18px; font-family:var(--sd-mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--sd-ink-3); }
        .sd-scenebar__right .live { color:var(--sd-accent); display:flex; align-items:center; gap:8px; }
        .sd-dot { width:6px; height:6px; border-radius:999px; background:var(--sd-accent); box-shadow:0 0 0 0 rgba(213,255,63,.6); animation:sdDotPulse 1.8s ease-out infinite; display:inline-block; }
        @keyframes sdDotPulse { 0%{box-shadow:0 0 0 0 rgba(213,255,63,.6)} 70%{box-shadow:0 0 0 8px rgba(213,255,63,0)} 100%{box-shadow:0 0 0 0 rgba(213,255,63,0)} }

        /* home scene */
        .sd-home { flex:1; display:grid; grid-template-rows:1fr auto; }
        .sd-home__scene { display:grid; grid-template-columns:1fr 1fr; flex:1; }
        .sd-home__left {
          padding:80px 56px; border-right:1px solid var(--sd-line);
          display:flex; flex-direction:column; justify-content:center; gap:clamp(28px,5vh,52px); min-height:600px;
        }
        .sd-home__giant {
          font-family:var(--sd-sans); font-weight:400;
          font-size:clamp(64px, 12vw, 200px); line-height:.84; letter-spacing:-.07em;
          margin:0; color:var(--sd-ink); word-break:normal; overflow-wrap:normal;
        }
        .sd-home__giant em { font-family:var(--sd-serif); font-style:italic; color:var(--sd-accent); font-weight:400; display:block; }
        .sd-home__lower { display:flex; flex-direction:column; gap:0; }
        .sd-home__deck { font-size:16px; color:var(--sd-ink-2); line-height:1.5; max-width:520px; font-weight:300; margin:0 0 28px; }
        .sd-home__deck-line { display:block; text-wrap:balance; }
        .sd-home__deck-line:first-child { color:var(--sd-ink); }
        .sd-home__deck-year { display:block; margin-top:12px; padding-top:12px; border-top:1px solid var(--sd-line); font-family:var(--sd-mono); font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--sd-ink-3); }
        .sd-home__cta { display:flex; gap:8px 28px; flex-wrap:wrap; align-items:center; }
        /* secondary action = quiet text link (NOT a pill) so it reads clearly below
           the primary voteCTA pill — distinct hierarchy, not the same design. */
        .sd-ghost {
          display:inline-flex; align-items:center; gap:8px; align-self:center;
          color:var(--sd-ink-2); font-family:var(--sd-sans); font-size:14px; font-weight:500;
          border-bottom:1px solid transparent; padding-bottom:2px; transition:color .2s, border-color .2s;
        }
        .sd-ghost:hover { color:var(--sd-ink); border-bottom-color:var(--sd-line-strong); }
        .sd-ghost__arrow { transition:transform .2s; color:var(--sd-accent); }
        .sd-ghost:hover .sd-ghost__arrow { transform:translate(2px,-2px); }

        .sd-home__right { padding:80px 56px; display:flex; flex-direction:column; gap:32px; }
        .sd-home__rotor {
          font-family:var(--sd-serif); font-style:italic; font-size:clamp(28px, 3.2vw, 52px);
          font-weight:400; color:var(--sd-ink); letter-spacing:-.02em; line-height:1.15;
          border-bottom:1px solid var(--sd-line); padding-bottom:32px;
        }
        .sd-home__rotor em { color:var(--sd-accent); }
        .sd-home__numbers { display:grid; border:1px solid var(--sd-line); border-radius:18px; overflow:hidden; }
        .sd-num-row { display:grid; grid-template-columns:1fr auto; gap:32px; align-items:end; padding:24px 28px; border-bottom:1px solid var(--sd-line); }
        .sd-num-row:last-child { border-bottom:0; }
        .sd-num-lbl { font-family:var(--sd-mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-3); }
        .sd-num-val { font-family:var(--sd-sans); font-weight:400; font-size:44px; line-height:1; letter-spacing:-.04em; margin-top:8px; font-variant-numeric:tabular-nums; }
        .sd-num-val em { font-family:var(--sd-serif); font-style:italic; color:var(--sd-accent); font-weight:400; }
        .sd-num-val small { font-size:14px; color:var(--sd-ink-3); margin-left:6px; }
        .sd-num-bar { grid-column:1 / -1; height:2px; background:var(--sd-line); position:relative; margin-top:8px; overflow:hidden; }
        .sd-num-bar-fill { position:absolute; left:0; top:0; bottom:0; background:var(--sd-accent); }

        /* marquee — refined status ticker carrying REAL election info */
        .sd-marquee { border-top:1px solid var(--sd-line); overflow:hidden; background:var(--sd-bg-2); }
        .sd-marquee__track {
          display:flex; align-items:center; gap:28px; padding:16px 0; white-space:nowrap;
          animation:sdMarquee 48s linear infinite;
          font-family:var(--sd-sans); font-size:clamp(15px,1.6vw,20px); font-weight:400; letter-spacing:.01em; color:var(--sd-ink-2);
        }
        .sd-marquee__item { display:inline-flex; align-items:center; gap:28px; }
        .sd-marquee em { font-family:var(--sd-serif); font-style:italic; color:var(--sd-accent); font-weight:400; font-size:1.15em; }
        .sd-marquee__dot { width:5px; height:5px; border-radius:999px; background:var(--sd-accent); display:inline-block; flex-shrink:0; opacity:.8; }
        @keyframes sdMarquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        /* ── RESPONSIVE ── */
        @media (max-width:1100px) {
          .sd-main { margin-left:0; }
          .sd-scenebar { padding:16px 24px; }
          .sd-home__scene { grid-template-columns:1fr; }
          .sd-home__left { border-right:0; border-bottom:1px solid var(--sd-line); min-height:0; padding:48px 24px; gap:32px; }
          .sd-home__right { padding:48px 24px; }
        }
        @media (max-width:560px) {
          .sd-home__cta { flex-direction:column; align-items:flex-start; gap:18px; }
          .sd-ghost { align-self:flex-start; }
          .sd-scenebar__right span:last-child { display:none; }
        }
      `}</style>
    </div>
  );
}
