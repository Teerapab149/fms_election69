"use client";

// GumroadHome — the "Active Pulse" HOME LAYOUT (template: gumroad).
//
// This is the LAYOUT half of the gumroad template (the token/theme half lives in
// templates/builtIn/gumroad.js). Recreated from docs/design-refs/index.html:
// sticky topbar + scrolling ticker + 2-column bento home (left: eyebrow stickers
// + huge "SAMO N" title + subtitle + dual CTA; right aside: bento countdown card
// + pop stat tiles + meet card) + ink footer. Chunky identity = 2.5px ink borders
// + hard offset shadows (no blur), hardcoded here per Rule 9 (variant identity).
//
// Wired to real data + globalConfig text + the chunky-stamp voteCTA element, and
// fully editorMode-aware: key elements carry data-element + the stable Wrap so
// they are selectable + base-editable in the admin editor, exactly like classic.

import { getPath } from "../../utils/basePath";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { ArrowRight, Calendar, CheckCircle2 } from "lucide-react";
import EditorElement from "../admin/editor/EditorElement";
import { SIZE_MAP, WEIGHT_MAP } from "../../utils/styleMaps";
import { resolveElementState, buildRuntimeContext } from "../admin/editor/stateResolver";
import { resolveStatefulConfig } from "../admin/editor/templateEngine";
import { getBinding, isBoundElement } from "../admin/editor/elementCatalog";
import { buildTemplateStyles, buildElementCss } from "../../lib/templateTokens";
import { getVoteCTAVariant } from "../elements/voteCTA-button";
import { ELECTION_CONFIG } from "../../utils/electionConfig";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

// ── Gumroad palette (mirror gumroad.js / styles.css :root) ──
const INK = "#1A1A1A";
const INK_2 = "#4A4A4A";
const CREAM = "#FFF1E5";
const CREAM_2 = "#FFE4CE";
const PAPER = "#FFFFFF";
const PINK = "#FF90E8";
const LIME = "#B6FF6E";
const SKY = "#A8E1FF";
const CORAL = "#FF6E6E";
const BORDER_W = "2.5px";
const SHADOW_HARD = "5px 5px 0 " + INK;
const SHADOW_HARD_SM = "3px 3px 0 " + INK;
const SHADOW_HARD_LG = "8px 8px 0 " + INK;
const FONT_DISPLAY = "'Archivo Black', 'Kanit', system-ui, sans-serif";

const card = (extra = {}) => ({
  background: PAPER,
  border: `${BORDER_W} solid ${INK}`,
  borderRadius: "22px",
  boxShadow: SHADOW_HARD,
  ...extra,
});

// ── Bento countdown (gumroad-styled; reuses ELECTION_CONFIG timing) ──
function GumroadCountdown({ systemMode = "AUTO" }) {
  const { ELECTION_START, ELECTION_END } = ELECTION_CONFIG;
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, label: "STARTS IN" });

  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      let diff, label;
      if (systemMode === "PAUSE") { label = "PAUSED"; diff = 0; }
      else if (systemMode === "ENDED") { label = "ENDED"; diff = 0; }
      else if (systemMode === "MANUAL_OPEN") { label = "CLOSES IN"; diff = ELECTION_END - now; }
      else if (now < ELECTION_START) { label = "STARTS IN"; diff = ELECTION_START - now; }
      else if (now < ELECTION_END) { label = "CLOSES IN"; diff = ELECTION_END - now; }
      else { label = "ENDED"; diff = 0; }
      if (diff > 0) {
        setT({
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff / 3600000) % 24),
          m: Math.floor((diff / 60000) % 60),
          s: Math.floor((diff / 1000) % 60),
          label,
        });
      } else {
        setT({ d: 0, h: 0, m: 0, s: 0, label });
      }
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [ELECTION_START, ELECTION_END, systemMode]);

  const cells = [
    { n: t.d, u: "DAYS" }, { n: t.h, u: "HRS" }, { n: t.m, u: "MIN" }, { n: t.s, u: "SEC" },
  ];
  return (
    <div data-element="hero-countdown" style={{ background: INK, color: CREAM, border: `${BORDER_W} solid ${INK}`, borderRadius: "22px", boxShadow: SHADOW_HARD_LG, padding: "22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".15em", color: PINK }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: CORAL, display: "inline-block" }} />
        {t.label} · ปิดรับลงคะแนนใน
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginTop: "14px" }}>
        {cells.map((c, i) => (
          <div key={i} style={{ background: CREAM, color: INK, borderRadius: "12px", padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: "40px", lineHeight: 1, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
              {String(c.n).padStart(2, "0")}
            </div>
            <div style={{ fontSize: "10px", color: INK_2, marginTop: "4px", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>{c.u}</div>
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
  theme = null,
  resolvedTemplate = null,
  editorTokenStyles = null,
}) {
  const { data: session, status } = useSession();
  const globalConfig = useGlobalConfig();

  const [mounted, setMounted] = useState(false);
  const [isVotedReal, setIsVotedReal] = useState(false);
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

  // Stable Wrap (identity pinned — see HomeContent for the full rationale).
  const editorStateRef = useRef(null);
  editorStateRef.current = { editorMode, elementConfigs, selectedElement, hoveredElement, onSelectElement, onHoverElement, onHoverEnd };
  const Wrap = useCallback(({ id, children, className }) => {
    const s = editorStateRef.current;
    if (!s.editorMode) return children;
    return (
      <EditorElement
        id={id}
        className={className}
        config={s.elementConfigs?.[id]}
        isSelected={s.selectedElement === id}
        isHovered={s.hoveredElement === id}
        onSelect={s.onSelectElement}
        onHover={s.onHoverElement}
        onHoverEnd={s.onHoverEnd}
      >{children}</EditorElement>
    );
  }, []);

  if (!mounted) return null;

  // ── config / text resolution (mirror of HomeContent) ──
  const effectiveConfigs = editorMode
    ? elementConfigs
    : (pageLayout?.elementConfigs?.home || {});

  const getText = (id, def) => {
    const binding = getBinding(id);
    if (binding) return globalConfig[binding] ?? def;
    return effectiveConfigs?.[id]?.config?.text ?? def;
  };
  const getTextStyle = (id) => {
    const c = effectiveConfigs?.[id]?.config || {};
    const st = {};
    if (c.fontSize) st.fontSize = SIZE_MAP[c.fontSize];
    if (c.color) st.color = c.color;
    if (c.fontWeight) st.fontWeight = WEIGHT_MAP[c.fontWeight];
    if (c.align) st.textAlign = c.align;
    return Object.keys(st).length ? st : undefined;
  };
  const isVisible = (id) => effectiveConfigs?.[id]?.config?.visible !== false;

  // ── stats ──
  const rawStats = editorMode
    ? { totalVoted: editorData?.totalVoted ?? 342, totalEligible: editorData?.totalEligible ?? 1200 }
    : { totalVoted: initialData?.stats?.totalVoted ?? 0, totalEligible: initialData?.stats?.totalEligible ?? 0 };
  const pct = rawStats.totalEligible > 0
    ? ((rawStats.totalVoted / rawStats.totalEligible) * 100).toFixed(2)
    : "0.00";

  const blockData = { session, isVotedReal, isCheckingVoted: false, initialData, stats: { ...rawStats, percentage: pct } };
  const editorBlockData = { session: null, isVotedReal: false, isCheckingVoted: false, initialData: { systemMode: "AUTO", electionStatus: "ACTIVE", isSystemOpen: true }, stats: { ...rawStats, percentage: pct } };
  const activeBlockData = editorMode ? editorBlockData : blockData;

  // ── effective template (overlay admin overrides) + token style ──
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
    : [
        buildTemplateStyles(effectiveTemplate, ".fms-app"),
        buildElementCss(pageLayout?.elementCss?.home, ".fms-app"),
      ].filter(Boolean).join("\n\n");

  // ── voteCTA (chunky-stamp element) ──
  const runtimeCtx = buildRuntimeContext({
    session,
    systemConfig: initialData?.systemConfig,
    electionStatus: initialData?.electionStatus,
    userData: initialData?.userData,
  });
  const voteCTAState = resolveElementState("voteCTA-button", runtimeCtx);
  const voteCTAOverrides = pageLayout?.elementOverrides?.["voteCTA-button"]?.[voteCTAState] || {};
  const voteCTAConfig = resolveStatefulConfig(effectiveTemplate, "voteCTA-button", voteCTAState, voteCTAOverrides);
  const voteCTAVariant = effectiveTemplate?.elements?.["voteCTA-button"]?.variant || "chunky-stamp";
  const VoteCTA = getVoteCTAVariant(voteCTAVariant);

  // ── text values ──
  const titleText = String(getText("hero-title", globalConfig.electionName) ?? "");
  const titleMatch = titleText.match(/^(.+?)\s*(\d+)$/);
  const titlePart = titleMatch ? titleMatch[1].trim() : titleText;
  const numberPart = titleMatch ? titleMatch[2] : "";
  const yearText = isBoundElement("hero-year-badge")
    ? `ประจำปีการศึกษา ${globalConfig.academicYearTh}`
    : getText("hero-year-badge", `ประจำปีการศึกษา ${globalConfig.academicYearTh}`);

  const sysMode = initialData?.systemMode || "AUTO";

  return (
    <div className="fms-app" style={{ minHeight: "100vh", background: CREAM, color: INK, display: "flex", flexDirection: "column", fontFamily: "'Kanit', system-ui, sans-serif" }}>
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}

      {/* ── TOPBAR ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", background: CREAM, borderBottom: `${BORDER_W} solid ${INK}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: "20px", textTransform: "uppercase", letterSpacing: "-.02em" }}>
          FMS <span style={{ width: 2, height: 28, background: INK, display: "inline-block" }} /> PSU
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }} className="hidden md:flex">
          {[["หน้าแรก", "/"], ["Meet Candidates", "/candidates"], ["ผลการลงคะแนนเสียง", "/results"]].map(([label, href]) => (
            <a key={label} href={getPath(href)} style={{ padding: "8px 16px", borderRadius: 999, fontWeight: 600, fontSize: 14, color: INK, border: "2px solid transparent" }}>{label}</a>
          ))}
        </nav>
        <button
          onClick={() => !editorMode && signIn("authentik", { callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs") + "/vote" })}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", border: `${BORDER_W} solid ${INK}`, borderRadius: 14, background: PINK, color: INK, fontWeight: 700, fontSize: 14, boxShadow: SHADOW_HARD_SM, cursor: "pointer" }}
        >
          เข้าสู่ระบบ <ArrowRight size={16} />
        </button>
      </div>

      {/* ── TICKER ── */}
      <div style={{ borderBottom: `${BORDER_W} solid ${INK}`, background: INK, color: CREAM, overflow: "hidden", whiteSpace: "nowrap", fontFamily: FONT_DISPLAY, fontSize: "20px", letterSpacing: ".02em" }}>
        <div className="gumroad-ticker" style={{ display: "inline-flex", alignItems: "center", gap: 32, padding: "12px 0" }}>
          {[0, 1].map((k) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 32 }}>
              ★ FMS ELECTION 2026 <Dot /> SAMO {numberPart || "50"} <Dot /> CAST YOUR VOTE <Dot /> สโมสรนักศึกษาคณะวิทยาการจัดการ <Dot /> POWERED BY PSU PASSPORT <Dot />
            </span>
          ))}
        </div>
      </div>

      {/* ── HOME GRID ── */}
      <main style={{ flex: 1, width: "100%", maxWidth: 1500, margin: "0 auto", padding: "48px 56px 80px" }}>
        <div className="gumroad-home-grid" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 56, alignItems: "center" }}>

          {/* LEFT */}
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              <Sticker bg={LIME}>⚡ FMS ELECTION 2026</Sticker>
              <Sticker bg={PAPER} rotate><span style={{ width: 10, height: 10, borderRadius: 999, background: CORAL, display: "inline-block", marginRight: 6 }} /> LIVE BALLOT</Sticker>
            </div>

            <Wrap id="hero-title">
              <h1 data-element="hero-title" style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(72px,11vw,150px)", lineHeight: .85, letterSpacing: "-.04em", margin: 0, textTransform: "uppercase", color: INK, ...getTextStyle("hero-title") }}>
                {titlePart}
                {numberPart && (
                  <><br /><em style={{ fontStyle: "normal", background: PINK, display: "inline-block", padding: "0 10px", marginTop: 8, border: `${BORDER_W} solid ${INK}`, boxShadow: SHADOW_HARD, transform: "rotate(-2deg)" }}>{numberPart}</em></>
                )}
              </h1>
            </Wrap>

            <Wrap id="hero-subtitle">
              <p data-element="hero-subtitle" style={{ marginTop: 28, fontSize: 22, fontWeight: 500, lineHeight: 1.3, color: INK, maxWidth: 540, ...getTextStyle("hero-subtitle") }}>
                <span style={{ background: LIME, padding: "0 6px", borderRadius: 4, border: `1.5px solid ${INK}` }}>{getText("hero-subtitle", globalConfig.campaignTitle)}</span>{" "}
                {getText("hero-subtitle2", globalConfig.organizationName)}
              </p>
            </Wrap>

            {isVisible("hero-year-badge") && (
              <Wrap id="hero-year-badge">
                <div style={{ marginTop: 20 }}>
                  <Sticker bg={PAPER}><Calendar size={14} style={{ marginRight: 6 }} /> {yearText}</Sticker>
                </div>
              </Wrap>
            )}

            <div style={{ marginTop: 36, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <Wrap id="voteCTA-button">
                <VoteCTA config={voteCTAConfig} data={activeBlockData} resolvedConfig={voteCTAConfig} />
              </Wrap>
              <a href={getPath("/candidates")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 26px", border: `${BORDER_W} solid ${INK}`, borderRadius: 16, background: LIME, color: INK, fontWeight: 700, fontSize: 16, boxShadow: SHADOW_HARD }}>
                รู้จักผู้สมัคร <ArrowRight size={18} />
              </a>
            </div>
          </div>

          {/* RIGHT — bento aside */}
          <aside style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Wrap id="hero-countdown">
              <div style={{ gridColumn: "1 / -1" }}>
                <GumroadCountdown systemMode={sysMode} />
              </div>
            </Wrap>

            {/* Stat tile — VOTED (pink) */}
            <Wrap id="stats-voted-card">
              <div data-element="stats-voted-card" style={{ background: PINK, border: `${BORDER_W} solid ${INK}`, borderRadius: 22, padding: 22, boxShadow: SHADOW_HARD }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".15em", display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={14} /> ใช้สิทธิ์แล้ว · VOTED
                </div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 52, lineHeight: 1, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
                  {rawStats.totalVoted.toLocaleString()}<span style={{ fontSize: 20, fontFamily: "'Kanit',sans-serif", fontWeight: 600, marginLeft: 8 }}>คน</span>
                </div>
                <div style={{ fontSize: 13, marginTop: 8, fontWeight: 500 }}>นักศึกษาที่ลงคะแนนแล้ว</div>
              </div>
            </Wrap>

            {/* Stat tile — ELIGIBLE (lime) */}
            <Wrap id="stats-eligible-card">
              <div data-element="stats-eligible-card" style={{ background: LIME, border: `${BORDER_W} solid ${INK}`, borderRadius: 22, padding: 22, boxShadow: SHADOW_HARD }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".15em" }}>ผู้มีสิทธิ์รวม · ELIGIBLE</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 52, lineHeight: 1, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
                  {rawStats.totalEligible.toLocaleString()}<span style={{ fontSize: 20, fontFamily: "'Kanit',sans-serif", fontWeight: 600, marginLeft: 8 }}>คน</span>
                </div>
                <div style={{ fontSize: 13, marginTop: 8, fontWeight: 500 }}>ความคืบหน้า · {pct}%</div>
              </div>
            </Wrap>

            {/* Meet card */}
            <Wrap id="meet-section">
              <a href={editorMode ? undefined : getPath("/candidates")} data-element="meet-section" style={{ gridColumn: "1 / -1", background: PAPER, border: `${BORDER_W} solid ${INK}`, borderRadius: 22, boxShadow: SHADOW_HARD, padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, textDecoration: "none", color: INK }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{getText("meet-title", "รู้จักผู้สมัครของคุณหรือยัง?")}</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 14, color: INK_2 }}>ดูวิสัยทัศน์ก่อนลงคะแนน</p>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 18px", border: `${BORDER_W} solid ${INK}`, borderRadius: 14, background: PINK, fontWeight: 700, fontSize: 14, boxShadow: SHADOW_HARD_SM, whiteSpace: "nowrap" }}>
                  ดูรายชื่อพรรค <ArrowRight size={16} />
                </span>
              </a>
            </Wrap>
          </aside>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ marginTop: "auto", borderTop: `${BORDER_W} solid ${INK}`, padding: "22px 32px", background: INK, color: CREAM, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Space Grotesk', monospace", fontSize: 13 }}>
        <div>© FMS@PSU {globalConfig.academicYearTh || "2570"} · ALL RIGHTS RESERVED</div>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}><span style={{ color: PINK, fontSize: 18 }}>★</span> ACTIVE PULSE EDITION <span style={{ color: PINK, fontSize: 18 }}>★</span></div>
      </footer>

      <style jsx global>{`
        .gumroad-ticker { animation: gumroadTicker 35s linear infinite; }
        @keyframes gumroadTicker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @media (max-width: 980px) {
          .gumroad-home-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Dot() {
  return <span style={{ width: 12, height: 12, background: PINK, borderRadius: 999, display: "inline-block" }} />;
}

function Sticker({ children, bg = PAPER, rotate = false }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: bg, border: `${BORDER_W} solid ${INK}`, borderRadius: 999, fontWeight: 700, fontSize: 13, boxShadow: SHADOW_HARD_SM, transform: rotate ? "rotate(-3deg)" : undefined }}>
      {children}
    </span>
  );
}
