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
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import EditorElement from "../admin/editor/EditorElement";
import SiteNavbar from "../elements/site-navbar/gumroad";
import HomeTicker from "../elements/home-ticker/gumroad";
import SiteFooter from "../elements/site-footer/gumroad";
import HeroCountdown from "../elements/hero-countdown/gumroad";
import StatsVoted from "../elements/stats-voted-card/gumroad";
import StatsEligible from "../elements/stats-eligible-card/gumroad";
import MeetSection from "../elements/meet-section/gumroad";
import HeroTitle from "../elements/hero-title/gumroad";
import HeroSubtitle from "../elements/hero-subtitle/gumroad";
import HeroYearBadge from "../elements/hero-year-badge/gumroad";
import { SIZE_MAP, WEIGHT_MAP } from "../../utils/styleMaps";
import { resolveElementState, buildRuntimeContext } from "../admin/editor/stateResolver";
import { resolveStatefulConfig } from "../admin/editor/templateEngine";
import { getBinding, isBoundElement } from "../admin/editor/elementCatalog";
import { buildTemplateStyles, buildElementCss } from "../../lib/templateTokens";
import { getVoteCTAVariant } from "../elements/voteCTA-button";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { useVoteStatus } from "../../hooks/useVoteStatus";

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
  // Shared cached status (one request per navigation across all consumers).
  const { isVoted: isVotedReal } = useVoteStatus({
    enabled: !editorMode && status === "authenticated",
  });
  useEffect(() => { setMounted(true); }, []);

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

  return (
    <div className="fms-app gh-root">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}

      {/* ── TOPBAR (shared gumroad navbar element) ── */}
      <SiteNavbar active="home" editorMode={editorMode} />

      {/* ── TICKER (element) ── */}
      <HomeTicker faculty={facultyEn} calendarYear={calendarYear} samoPrefix={samoPrefix} samoNumber={samoNumber} org={orgName} partyCount={partyCount} uni={uni} />

      {/* ── HOME — "POSTER MOSAIC" ──
          A new interlocking tile mosaic (NOT the old text-left / cards-right
          split). Big hero TILE on the left + a varied mosaic of countdown / stats
          / meet tiles wrapping the right. Fills the fold, balanced. Gumroad colours
          + chunky identity kept. All Wrap ids + data-element preserved. */}
      <main className="gh-mosaic">

        {/* HERO TILE */}
        <section className="gh-hero gh-area-hero">
          <div className="gh-hero__top">
            <span className="gh-sticker gh-sticker--lime">⚡ {facultyEn} ELECTION {calendarYear}</span>
          </div>

          <Wrap id="hero-title">
            <HeroTitle titlePart={titlePart} numberPart={numberPart} style={getTextStyle("hero-title", { skipSize: true, skipAlign: true })} />
          </Wrap>

          <Wrap id="hero-subtitle">
            <HeroSubtitle
              leadText={String(getText("hero-subtitle", globalConfig.campaignTitle))}
              org={getText("hero-subtitle2", globalConfig.organizationName)}
              style={getTextStyle("hero-subtitle", { skipSize: true, skipColor: true, skipAlign: true })}
            />
          </Wrap>

          {isVisible("hero-year-badge") && (
            <Wrap id="hero-year-badge">
              <HeroYearBadge text={yearText} />
            </Wrap>
          )}

          <div className="gh-cta">
            <Wrap id="voteCTA-button">
              <VoteCTA config={voteCTAConfig} data={activeBlockData} resolvedConfig={voteCTAConfig} />
            </Wrap>
          </div>

          {/* MOBILE-ONLY meet shortcut so the "ดูผู้สมัคร" action is visible above the
              fold on phones (the editable meet-section is the tile below; this is a
              plain duplicate link, no editor id, to avoid a second selectable element). */}
          <a href={editorMode ? undefined : getPath("/candidates")} className="gh-meetbtn gh-meetbtn--m">
            <span className="gh-meetbtn__q">{getText("meet-title", "รู้จักผู้สมัครของคุณหรือยัง?")}</span>
            <span className="gh-meetbtn__go">ดูผู้สมัคร <ArrowRight size={20} strokeWidth={2.8} /></span>
          </a>
        </section>

        {/* COUNTDOWN TILE (element) */}
        <Wrap id="hero-countdown" className="gh-area-cd">
          <div className="gh-area-cd"><HeroCountdown systemMode={sysMode} /></div>
        </Wrap>

        {/* VOTED TILE (element) */}
        <Wrap id="stats-voted-card" className="gh-area-voted">
          <div className="gh-area-voted"><StatsVoted voted={rawStats.totalVoted} /></div>
        </Wrap>

        {/* ELIGIBLE TILE (element) */}
        <Wrap id="stats-eligible-card" className="gh-area-elig">
          <div className="gh-area-elig"><StatsEligible eligible={rawStats.totalEligible} pct={pct} /></div>
        </Wrap>

        {/* MEET TILE (element; desktop — hidden on mobile where the hero shortcut takes over) */}
        <Wrap id="meet-section" className="gh-area-meet">
          <div className="gh-area-meet">
            <MeetSection href={editorMode ? undefined : getPath("/candidates")} title={getText("meet-title", "รู้จักผู้สมัครของคุณหรือยัง?")} partyCount={partyCount} />
          </div>
        </Wrap>
      </main>

      {/* ── FOOTER (element) ── */}
      <SiteFooter faculty={facultyEn} uni={uni} year={copyrightYear} />

      <style jsx global>{`
        .gh-root {
          /* softer "ละมุน" palette: warm dark-olive ink (not pure black) +
             slightly calmer pops, so borders/shadows/dark tiles read gentle. */
          --ink:#26271c; --ink2:#5c5a4b; --cream:#FFF6EC; --cream2:#FFE9D6; --paper:#FFFDFA;
          --pink:#FF9CE9; --lime:#C2F47E; --yellow:#FFD24D; --sky:#B6E6FF; --coral:#FF8A8A;
          --bw:2.5px; --sh:5px 5px 0 var(--ink); --sh-sm:3px 3px 0 var(--ink); --sh-lg:8px 8px 0 var(--ink);
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; color:var(--ink);
          font-family:var(--fb);
          container-type:inline-size; container-name:gh;
          /* soft diagonal pastel wash (pink → cream → mint) — replaces the harsh
             radial colour blobs with a gentle gradient. */
          background:linear-gradient(135deg, #FFE6F2 0%, #FFF7EE 46%, #EEF7DB 100%) fixed;
        }
        .gh-root *{ box-sizing:border-box; }
        .gh-root a{ text-decoration:none; color:inherit; }

        /* topbar = shared <SiteNavbar> element (own scoped styles) */

        /* ticker = <HomeTicker> element (own scoped styles) */

        /* home grid */
        /* home — POSTER MOSAIC: interlocking chunky tiles fill the fold */
        .gh-mosaic{ flex:1; width:100%; max-width:1280px; margin:0 auto;
          padding:clamp(20px,3.4cqw,44px) clamp(16px,4cqw,48px) clamp(36px,5cqw,64px);
          display:grid; gap:clamp(13px,1.7cqw,20px);
          grid-template-columns:1.6fr 1fr 1fr;
          grid-template-areas:
            "hero cd    cd"
            "hero voted elig"
            "hero meet  meet"; }
        .gh-area-hero{ grid-area:hero; } .gh-area-cd{ grid-area:cd; }
        .gh-area-voted{ grid-area:voted; } .gh-area-elig{ grid-area:elig; } .gh-area-meet{ grid-area:meet; }

        /* HERO TILE — the focal poster block */
        .gh-hero{ display:flex; flex-direction:column; justify-content:center; gap:clamp(18px,2cqw,26px); min-width:0;
          background:var(--paper); border:var(--bw) solid var(--ink); border-radius:26px; box-shadow:var(--sh-lg);
          padding:clamp(26px,3.2cqw,46px); }
        .gh-hero__top{ display:flex; gap:11px; flex-wrap:wrap; align-items:center; }
        /* tilts removed — clean aligned composition reads as more balanced */
        .gh-rot-l, .gh-rot-r{ transform:none; }

        .gh-eyebrow{ display:flex; gap:10px; margin-bottom:24px; flex-wrap:wrap; }
        .gh-sticker{ display:inline-flex; align-items:center; gap:8px; padding:6px 14px; background:var(--paper);
          border:var(--bw) solid var(--ink); border-radius:999px; font-weight:700; font-size:13px; box-shadow:var(--sh-sm); }
        .gh-sticker--lime{ background:var(--lime); }
        .gh-sticker--paper{ background:var(--paper); }
        .gh-sticker--rotate{ transform:rotate(-3deg); }

        /* hero title + subtitle + year-badge = library elements (own scoped styles) */
        .gh-cta{ margin-top:8px; display:flex; gap:16px; flex-wrap:wrap; align-items:center; }

        /* meet — "dark + lime" CTA (variant 2): olive bar, small light question,
           big lime "ดูผู้สมัคร →". Seen first in the hero (both PC + mobile). */
        .gh-meetbtn{ display:flex; flex-direction:column; align-items:flex-start; gap:5px; width:100%;
          background:var(--ink); border:var(--bw) solid var(--ink); border-radius:18px; box-shadow:5px 5px 0 rgba(38,39,28,.28); padding:16px 20px;
          transition:transform .12s ease-out, box-shadow .12s ease-out; }
        .gh-meetbtn:hover{ transform:translate(-2px,-2px); box-shadow:var(--sh); }
        .gh-meetbtn__q{ font-size:clamp(12px,1.4cqw,13px); font-weight:600; color:#d8d4c6; }
        .gh-meetbtn__go{ display:inline-flex; align-items:center; gap:9px; font-size:clamp(19px,2.2cqw,23px); font-weight:900; line-height:1.15; color:var(--lime); }
        .gh-meetbtn:hover .gh-meetbtn__go svg{ transform:translateX(4px); }
        .gh-meetbtn__go svg{ transition:transform .15s ease-out; }
        .gh-meetbtn--m{ display:none; }  /* shown only on tablet/phone (see @container) */

        /* mosaic tiles (countdown / stats / meet) = library elements (own scoped styles) */

        /* footer = <SiteFooter> element (own scoped styles) */

        /* ── RESPONSIVE ── */
        /* tablet — hero full width on top, mosaic reflows below; hide desktop nav */
        @container gh (max-width:980px){
          .gh-mosaic{ grid-template-columns:1fr 1fr; gap:14px;
            grid-template-areas:
              "hero  hero"
              "cd    cd"
              "voted elig"; }
          .gh-area-meet{ display:none; }     /* tile hidden — hero shortcut covers it */
          .gh-meetbtn--m{ display:flex; }     /* show the hero meet shortcut */
          .gh-hero{ text-align:center; align-items:center; }
          .gh-hero__top{ justify-content:center; }
          .gh-subtitle{ margin-left:auto; margin-right:auto; }
          .gh-cta{ justify-content:center; }
          .gh-meetbtn{ justify-content:center; }
        }
        /* phone — single column stack */
        @container gh (max-width:560px){
          .gh-hide-sm{ display:none; }
          .gh-mosaic{ grid-template-columns:1fr; gap:13px; padding:20px 16px 44px;
            grid-template-areas:
              "hero"
              "cd"
              "voted"
              "elig"; }
          .gh-cta{ flex-direction:column; align-items:stretch; }
          .gh-cta > *{ width:100%; justify-content:center; }
          /* the login-state CTA carries large config padding/font (good on desktop,
             too tall on a phone where it also wraps) — trim it down here so it reads
             as a normal-height button. Overriding the element's inline style needs
             !important. */
          .gh-cta .chunky-stamp-btn{ padding:13px 22px !important; font-size:16px !important; }
          .gh-footer{ flex-direction:column; gap:10px; text-align:center; }
        }
      `}</style>
    </div>
  );
}
