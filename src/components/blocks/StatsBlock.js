"use client";

import { TrendingUp, CheckCircle2, PieChart, Users } from "lucide-react";
import EditorElement from "../admin/editor/EditorElement";
import { RADIUS_MAP } from "../../utils/styleMaps";

// Build inline wrapper style from a (flat, non-stateful) sub-card config.
// Returns undefined when no fields → legacy Tailwind card wins (P-LOG-015).
function buildCardStyle(cfg) {
  if (!cfg) return undefined;
  const s = {};
  if (cfg.backgroundColor) s.backgroundColor = cfg.backgroundColor;
  if (cfg.borderColor) s.borderColor = cfg.borderColor;
  if (cfg.borderRadius && RADIUS_MAP[cfg.borderRadius]) s.borderRadius = RADIUS_MAP[cfg.borderRadius];
  return Object.keys(s).length ? s : undefined;
}

// StatsBlock — Bento grid สถิติผู้เข้าร่วมลงคะแนน
// config props: showPercentage (bool), showTotalEligible (bool)
// data props:   stats ({ totalVoted, totalEligible, percentage })
// resolvedTemplate: live channel (SSR). elementConfigs: editor channel.
// editor props: editorMode, selectedElement, hoveredElement, onSelectElement, onHoverElement, onHoverEnd, elementConfigs
export default function StatsBlock({
  config = {},
  data = {},
  resolvedTemplate = null,
  editorMode = false,
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
  elementConfigs = null,
}) {
  const { showPercentage = true, showTotalEligible = true } = config;
  const { stats = { totalVoted: 0, totalEligible: 0, percentage: "0.00" } } = data;

  // Dual-channel flat config read for the non-stateful sub-cards.
  const getCardConfig = (id) =>
    elementConfigs?.[id]?.config ?? resolvedTemplate?.elements?.[id]?.config ?? null;
  const progressCfg = getCardConfig("stats-progress-card");
  const eligibleCfg = getCardConfig("stats-eligible-card");
  const hasProgress = !!progressCfg && Object.keys(progressCfg).length > 0;
  const hasEligible = !!eligibleCfg && Object.keys(eligibleCfg).length > 0;

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

  return (
    <div className="w-full max-w-2xl mx-auto lg:max-w-none lg:mx-0 pt-4 md:pt-6 pb-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>

      {/* Header */}
      <Wrap id="stats-header">
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-purple-100 shadow-sm text-[#8A2680]">
            <TrendingUp className="w-5 h-5" />
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white" />
            </span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm lg:text-base font-bold text-slate-800 leading-tight">
              สถิติผู้เข้าร่วมลงคะแนนโหวต
            </h3>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              อัปเดตข้อมูลแบบ Real-time
            </span>
          </div>
        </div>
      </Wrap>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-3">

        {/* Hero Card — ผู้ใช้สิทธิ์แล้ว (stats-voted-card wrapped at HomeContent level) */}
        <div className="col-span-2 relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#691E61] via-[#8A2680] to-[#C026D3] p-5 pb-7 text-white shadow-xl shadow-purple-900/20 group hover:-translate-y-1 transition-transform duration-500">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/10 blur-xl" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">ใช้สิทธิแล้ว (Voted)</span>
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl lg:text-7xl font-black tracking-tighter drop-shadow-sm tabular-nums leading-none">
                {stats.totalVoted.toLocaleString()}
              </span>
              <span className="text-lg lg:text-xl font-bold opacity-80">คน</span>
            </div>
          </div>
        </div>

        {/* Sub Card — ความคืบหน้า */}
        {showPercentage && (
          <Wrap id="stats-progress-card">
            <div
              className={`col-span-1 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group border ${hasProgress ? "" : "rounded-[24px] bg-white border-slate-100"}`}
              style={buildCardStyle(progressCfg)}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${hasProgress ? "" : "text-slate-400"}`}
                  style={hasProgress ? { color: progressCfg.labelColor } : undefined}
                >ความคืบหน้า</span>
                <PieChart
                  className={`w-4 h-4 group-hover:scale-110 transition-transform ${hasProgress ? "" : "text-emerald-500"}`}
                  style={hasProgress ? { color: progressCfg.accentColor } : undefined}
                />
              </div>
              <div>
                <div
                  className={`text-2xl font-black tabular-nums leading-none ${hasProgress ? "" : "text-slate-800"}`}
                  style={hasProgress ? { color: progressCfg.numberColor } : undefined}
                >
                  {stats.percentage}
                  <span className="text-sm text-slate-400 ml-0.5">%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${hasProgress ? "" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(parseFloat(stats.percentage) || 0, 100)}%`, ...(hasProgress ? { backgroundColor: progressCfg.accentColor } : {}) }}
                  />
                </div>
              </div>
            </div>
          </Wrap>
        )}

        {/* Sub Card — ผู้มีสิทธิ์รวม */}
        {showTotalEligible && (
          <Wrap id="stats-eligible-card">
            <div
              className={`border-2 p-4 shadow-sm flex flex-col justify-between group transition-all ${!showPercentage ? 'col-span-2' : 'col-span-1'} ${hasEligible ? "hover:shadow-md" : "rounded-[24px] bg-white border-slate-100 hover:border-purple-200 hover:shadow-md"}`}
              style={buildCardStyle(eligibleCfg)}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${hasEligible ? "" : "text-slate-400 group-hover:text-purple-400"}`}
                  style={hasEligible ? { color: eligibleCfg.labelColor } : undefined}
                >ผู้มีสิทธิรวม</span>
                <Users
                  className={`w-4 h-4 transition-colors ${hasEligible ? "" : "text-slate-300 group-hover:text-purple-400"}`}
                  style={hasEligible ? { color: eligibleCfg.iconColor } : undefined}
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-black transition-colors tabular-nums leading-none ${hasEligible ? "" : "text-slate-700 group-hover:text-purple-700"}`}
                  style={hasEligible ? { color: eligibleCfg.numberColor } : undefined}
                >
                  {stats.totalEligible.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-400">คน</span>
              </div>
            </div>
          </Wrap>
        )}

      </div>
    </div>
  );
}
