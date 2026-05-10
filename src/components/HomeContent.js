// src/components/HomeContent.js
"use client";
import { getPath } from "../utils/basePath";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import BlockRenderer from "../components/blocks/BlockRenderer";
import MeetCandidatesBlock from "../components/blocks/MeetCandidatesBlock";
import VoteCTABlock from "../components/blocks/VoteCTABlock";
import StatsBlock from "../components/blocks/StatsBlock";
import ElectionBannerBlock from "../components/blocks/ElectionBannerBlock";
import { useEditorPreview } from "../hooks/useEditorPreview";
import EditorElement from './admin/editor/EditorElement';
import { SIZE_MAP, RADIUS_MAP, WEIGHT_MAP } from '../utils/styleMaps';
import { resolveElementState, buildRuntimeContext } from './admin/editor/stateResolver';
import { resolveStatefulConfig } from './admin/editor/templateEngine';
import { getBinding, isBoundElement } from './admin/editor/elementRegistry';
import CountdownTimer from "../components/CountdownTimer";
import { Calendar } from "lucide-react";
import SiteFooter from './SiteFooter';
import { useGlobalConfig } from '../contexts/GlobalConfigContext';

const FALLBACK_BLOCKS = [
  { type: "hero", visible: true, order: 1, config: { showCountdown: true, showStatusBadge: true } },
  { type: "voteCTA", visible: true, order: 2, config: {} },
  { type: "meetCandidates", visible: true, order: 3, config: {} },
  { type: "stats", visible: true, order: 4, config: { showPercentage: true, showTotalEligible: true } },
  { type: "electionBanner", visible: true, order: 5, config: {} },
];

export default function HomeContent({
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
}) {
  const { data: session, status } = useSession();
  const { isEditorMode, highlightedSection } = useEditorPreview();
  const globalConfig = useGlobalConfig();

  const [stats, setStats] = useState({
    totalEligible: initialData?.stats?.totalEligible || 0,
    totalVoted: initialData?.stats?.totalVoted || 0,
    percentage:
      initialData?.stats?.totalEligible > 0
        ? ((initialData.stats.totalVoted / initialData.stats.totalEligible) * 100).toFixed(2)
        : "0.00",
  });

  const [mounted, setMounted] = useState(false);
  const [isVotedReal, setIsVotedReal] = useState(false);
  const [isCheckingVoted, setIsCheckingVoted] = useState(true);

  // 🧱 State สำหรับโหมดหน้าเว็บปกติ (ถ้าไม่มี Props pageLayout ส่งมา)
  const [apiBlocks, setApiBlocks] = useState(FALLBACK_BLOCKS);
  const [apiElementConfigs, setApiElementConfigs] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editorMode) { setIsCheckingVoted(false); return; }
    const checkVoteStatus = async () => {
      if (session?.user?.studentId) {
        try {
          const res = await fetch(getPath(`/api/check-status?studentId=${session.user.studentId}`));
          if (res.ok) {
            const data = await res.json();
            setIsVotedReal(data.isVoted === true);
          }
        } catch (error) {
          console.error("Error checking vote status:", error);
        }
      }
      setIsCheckingVoted(false);
    };

    if (status === "authenticated") {
      checkVoteStatus();
    } else if (status === "unauthenticated") {
      setIsCheckingVoted(false);
    }
  }, [session?.user?.studentId, status, editorMode]);

  // 🧱 Fetch pageLayout จาก API เฉพาะกรณีที่เข้ามาดูเว็บจริงๆ เท่านั้น
  useEffect(() => {
    if (editorMode || pageLayout) return;
    fetch(getPath("/api/admin/page-layout"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.home) setApiBlocks(data.home);
        if (data?.elementConfigs?.home) setApiElementConfigs(data.elementConfigs.home);
      })
      .catch((err) => {
        console.error("[HomeContent] page-layout fetch failed:", err);
      });
  }, [editorMode, pageLayout]);

  if (!mounted) return null;

  // ✅ การแก้บั๊ก: อ่านค่าโดยตรงจาก Props เสมอ เพื่อให้การตั้งค่า ซ่อน/โชว์ และลำดับ Sync กันทันที
  const activeBlocks = pageLayout?.home || apiBlocks;

  const Wrap = ({ id, children }) => editorMode ? (
    <EditorElement
      id={id}
      config={elementConfigs?.[id]}
      isSelected={selectedElement === id}
      isHovered={hoveredElement === id}
      onSelect={onSelectElement}
      onHover={onHoverElement}
      onHoverEnd={onHoverEnd}
    >{children}</EditorElement>
  ) : children;

  const cfg = (id, defaults = {}) => editorMode
    ? { ...defaults, ...(elementConfigs?.[id]?.config || {}) }
    : defaults;

  const effectiveConfigs = editorMode
    ? elementConfigs
    : (pageLayout?.elementConfigs?.home || apiElementConfigs || {});

  // Get text content — bound elements always read from globalConfig (synced with
  // ตั้งค่าทั่วไป); unbound elements use admin override → default fallback.
  const getText = (id, defaultText) => {
    const binding = getBinding(id);
    if (binding) {
      return globalConfig[binding] ?? defaultText;
    }
    return effectiveConfigs?.[id]?.config?.text ?? defaultText;
  };

  // Get inline style object for text elements
  // Returns undefined when no overrides so existing Tailwind classes win
  const getTextStyle = (id) => {
    const c = effectiveConfigs?.[id]?.config || {};
    const style = {};
    if (c.fontSize) style.fontSize = SIZE_MAP[c.fontSize];
    if (c.color) style.color = c.color;
    if (c.fontWeight) style.fontWeight = WEIGHT_MAP[c.fontWeight];
    if (c.align) style.textAlign = c.align;
    return Object.keys(style).length > 0 ? style : undefined;
  };

  // Check if a toggle element is visible
  const isVisible = (id) => {
    return effectiveConfigs?.[id]?.config?.visible !== false;
  };

  const blockData = { session, isVotedReal, isCheckingVoted, initialData, stats };

  // Editor-mode synthesized data — real blocks need this shape; built from
  // editorData (DUMMY_ELECTION) so preview renders sensible default values.
  const editorBlockData = editorMode ? {
    session: null,
    isVotedReal: false,
    isCheckingVoted: false,
    initialData: {
      systemMode: "AUTO",
      electionStatus: "ACTIVE",
      isSystemOpen: true,
    },
    stats: {
      totalVoted: editorData?.totalVoted ?? 0,
      totalEligible: editorData?.totalEligible ?? 0,
      percentage: (editorData?.percentageVoted ?? 0).toFixed(2),
    },
  } : null;

  const activeBlockData = editorMode ? editorBlockData : blockData;

  // Build runtime context for state-aware elements (H-2)
  const runtimeCtx = buildRuntimeContext({
    session,
    systemConfig: initialData?.systemConfig,
    electionStatus: initialData?.electionStatus,
    userData: initialData?.userData
  });

  // Resolve voteCTA-button state + config (template defaults + admin overrides)
  const voteCTAState = resolveElementState('voteCTA-button', runtimeCtx);
  const voteCTASourceTemplate = pageLayout?.sourceTemplate || 'classic';
  const voteCTAOverrides = pageLayout?.elementOverrides?.['voteCTA-button']?.[voteCTAState] || {};
  const voteCTAResolvedConfig = resolveStatefulConfig(
    voteCTASourceTemplate,
    'voteCTA-button',
    voteCTAState,
    voteCTAOverrides
  );

  // Resolve countdown state + config
  const countdownState = resolveElementState('hero-countdown', runtimeCtx);
  const countdownSourceTemplate = pageLayout?.sourceTemplate || 'classic';
  const countdownOverrides = pageLayout?.elementOverrides?.['hero-countdown']?.[countdownState] || {};
  const countdownResolvedConfig = resolveStatefulConfig(
    countdownSourceTemplate,
    'hero-countdown',
    countdownState,
    countdownOverrides
  );

  const ed = editorData || {};

  // Hero — unified path for both editor and normal mode, matches HeroBlock styling 1:1
  const renderHero = () => {
    // hero-title is bound → resolves to globalConfig.electionName ("SAMO 49"); auto-split
    // for the gradient digit. If admin enters a non-trailing-number string, the whole text
    // renders solid.
    const titleText = String(getText('hero-title', ed.title || globalConfig.electionName) ?? '');
    const titleMatch = titleText.match(/^(.+?)\s*(\d+)$/);
    const titlePart = titleMatch ? titleMatch[1].trim() : titleText;
    const numberPart = titleMatch ? titleMatch[2] : '';

    // hero-year-badge is bound to academicYearTh (atomic). Compose with prefix here so the
    // admin only edits the year value itself.
    const yearBadgeBound = isBoundElement('hero-year-badge');
    const yearBadgeText = yearBadgeBound
      ? `ประจำปีการศึกษา ${globalConfig.academicYearTh}`
      : getText('hero-year-badge', `ประจำปีการศึกษา ${globalConfig.academicYearTh}`);

    return (
      <div className="w-full text-center lg:text-left space-y-4 pt-8 md:pt-10 pb-0 animate-fade-in-up">

        {isVisible('hero-countdown') && (
          <Wrap id="hero-countdown">
            <div className="flex justify-center lg:justify-start">
              <CountdownTimer
                systemMode={initialData?.systemMode || "AUTO"}
                resolvedConfig={countdownResolvedConfig}
              />
            </div>
          </Wrap>
        )}

        <div className="space-y-3">
          {/* Title SAMO 49 */}
          <Wrap id="hero-title">
            <div className="flex items-center justify-center lg:justify-start">
              <h1 className="flex items-baseline gap-2 md:gap-3 font-black tracking-tight leading-none whitespace-nowrap select-none">
                <span className="text-[20vw] sm:text-[100px] md:text-[110px] lg:text-[85px] xl:text-[120px] 2xl:text-[150px] text-slate-900 drop-shadow-sm">
                  {titlePart}
                </span>
                {numberPart && (
                  <span className="text-[20vw] sm:text-[100px] md:text-[110px] lg:text-[85px] xl:text-[120px] 2xl:text-[150px] text-transparent bg-clip-text bg-gradient-to-b from-[#8A2680] to-[#D946EF] drop-shadow-md relative">
                    {numberPart}
                    <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-2 h-2 md:w-4 md:h-4 bg-[#D946EF] rounded-full opacity-30 animate-ping" />
                  </span>
                )}
              </h1>
            </div>
          </Wrap>

          {/* Subtitle */}
          <Wrap id="hero-subtitle">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight tracking-tight">
              {getText('hero-subtitle', globalConfig.campaignTitle).replace(globalConfig.committeeName, '')}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2680] to-[#D946EF]">
                {globalConfig.committeeName}
              </span>
            </h2>
          </Wrap>

          {/* Subtitle 2 */}
          <Wrap id="hero-subtitle2">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-500">
              {getText('hero-subtitle2', globalConfig.organizationName)}
            </h3>
          </Wrap>

          {/* Year badge */}
          {isVisible('hero-status-badge') && (
            <Wrap id="hero-year-badge">
              <div className="flex justify-center lg:justify-start pt-1">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-purple-50 text-[#8A2680] border border-purple-200 text-xs md:text-sm font-bold shadow-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  {yearBadgeText}
                </span>
              </div>
            </Wrap>
          )}
        </div>
      </div>
    );
  };

  const BLOCK_COMPONENTS = {
    meetCandidates: MeetCandidatesBlock,
    voteCTA: VoteCTABlock,
    stats: StatsBlock,
    electionBanner: ElectionBannerBlock,
  };

  // Editor-mode wrap IDs — block type → primary editable element ID
  const WRAP_ID_MAP = {
    voteCTA: 'voteCTA-button',
    stats: 'stats-voted-card',
    meetCandidates: 'meet-section',
    electionBanner: 'banner-section',
  };

  // ✅ ฟังก์ชัน Render (ใช้ activeBlocks) — รวมโหมดปกติและ Editor
  const renderColumn = (types) =>
    activeBlocks
      .filter((b) => types.includes(b.type) && b.visible !== false) // ฟิลเตอร์ซ่อน/โชว์
      .sort((a, b) => a.order - b.order)
      .map((block) => {
        // Editor-mode element-level visibility toggles (driven by elementConfigs)
        if (editorMode) {
          if (block.type === 'electionBanner' && cfg('banner-section').visible === false) return null;
          if (block.type === 'meetCandidates' && cfg('meet-section').visible === false) return null;
        }

        let content;
        if (block.type === 'hero') {
          content = renderHero();
        } else {
          const Component = BLOCK_COMPONENTS[block.type];
          if (!Component) return null;
          const extraProps = block.type === 'voteCTA' ? { resolvedConfig: voteCTAResolvedConfig } : {};
          const blockJSX = (
            <Component config={block.config || {}} data={activeBlockData} {...extraProps} />
          );
          if (editorMode && WRAP_ID_MAP[block.type]) {
            content = <Wrap id={WRAP_ID_MAP[block.type]}>{blockJSX}</Wrap>;
          } else {
            content = blockJSX;
          }
        }
        const isHighlighted = isEditorMode && highlightedSection === block.type;
        return (
          <div key={block.type} data-editor-section={block.type} className="relative">
            {content}
            {isHighlighted && (
              <div className="absolute inset-0 border-2 border-[#8A2680] rounded-lg pointer-events-none z-50 bg-[#8A2680]/5 animate-pulse">
                <div className="absolute top-2 left-2 bg-[#8A2680] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md">
                  {block.type}
                </div>
              </div>
            )}
          </div>
        );
      });

  // 🛠️ Editor mode rendering — uses real block components via renderColumn
  if (editorMode) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#F8F9FD] text-slate-900 font-sans selection:bg-[#8A2680] selection:text-white relative">
        <div className="relative z-50 shrink-0">
          <Navbar />
        </div>
        <main className="flex-grow py-6 lg:py-6 xl:py-10 px-6 md:px-12 lg:px-24 relative z-10">
          <div className="container mx-auto max-w-[1400px] w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,minmax(480px,45%)] gap-6 lg:gap-8 items-start">
              {/* LEFT COLUMN */}
              <div className="space-y-4 lg:space-y-6">
                {renderColumn(["hero", "meetCandidates", "voteCTA"])}
              </div>
              {/* RIGHT COLUMN */}
              <div className="space-y-4 lg:space-y-6">
                {renderColumn(["stats", "electionBanner"])}
              </div>
            </div>
          </div>
        </main>
        <SiteFooter className="relative z-50 shrink-0 w-full mt-auto" />
      </div>
    );
  }

  // --- Normal Rendering (Non-editor) ---
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F8F9FD] text-slate-900 font-sans selection:bg-[#8A2680] selection:text-white relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[35%] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="bg-noise" />
      </div>
      <div className="relative z-50 shrink-0">
        <Navbar />
      </div>
      <main className="flex-grow flex items-center justify-center py-6 lg:py-6 xl:py-10 px-6 md:px-12 lg:px-24 relative z-10">
        <div className="container mx-auto max-w-[1400px] w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,minmax(480px,45%)] gap-6 lg:gap-8 items-start">
            <div className="space-y-4 lg:space-y-6">
              {renderColumn(["hero", "meetCandidates", "voteCTA"])}
            </div>
            <div className="space-y-4 lg:space-y-6">
              {renderColumn(["stats", "electionBanner"])}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter className="relative z-50 shrink-0 w-full mt-auto" />
      <style jsx global>{`
        @keyframes shine { 100% { transform: translateX(100%); } }
        .animate-shine { animation: shine 1.5s infinite; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
}