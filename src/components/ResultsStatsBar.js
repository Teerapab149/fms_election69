"use client";

import { Activity, Users, PieChart as PieIcon } from 'lucide-react';

export default function ResultsStatsBar({
  totalVotes = 0,
  totalEligible = 0,
  isNotStarted = false
}) {
  // Layer 2 vars (Tier 2). Declared in classic.js elements["results-stats-bar"].vars
  // and overridable per-page via PageThemeOverrides / ElementVarsPanel. Fallback
  // chain keeps the other templates (which don't declare these) byte-faithful:
  // --rsb-accent → --color-primary → #8A2680.
  const ACCENT = "var(--rsb-accent, var(--color-primary, #8A2680))";
  const CARD_BG = "var(--rsb-card-bg, rgba(255,255,255,0.9))";
  return (
    <div data-element="results-stats-bar" className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-8 lg:mb-12">
      <div
        className="col-span-2 lg:col-span-1 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border shadow-sm flex items-center justify-between relative overflow-hidden"
        style={{ backgroundColor: CARD_BG, borderColor: `color-mix(in srgb, ${ACCENT} 20%, transparent)` }}
      >
        <div className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: ACCENT }}></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: ACCENT }}>คะแนนเสียงรวม</p>
          <p className="text-3xl lg:text-5xl font-black" style={{ color: ACCENT }}>
            {isNotStarted ? "-" : totalVotes.toLocaleString()}
          </p>
        </div>
        <div className="p-2 lg:p-4 rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 10%, transparent)`, color: ACCENT }}>
          <Activity className="w-6 h-6 lg:w-8 lg:h-8" />
        </div>
      </div>

      <div className="col-span-1 bg-white/80 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          {/* 2.56:1 on white at 12px — the label of a turnout figure, not decoration */}
          <p className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ผู้มีสิทธิ์</p>
          <p className="text-xl lg:text-3xl font-black text-slate-700">{totalEligible.toLocaleString()}</p>
        </div>
        <div className="bg-slate-100 p-2 lg:p-4 rounded-xl text-slate-400 hidden lg:block">
          <Users className="w-6 h-6 lg:w-8 lg:h-8" />
        </div>
      </div>

      <div className="col-span-1 bg-white/80 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-green-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          {/* green-600 on white is 3.29:1 at 12px (AA needs 4.5); green-700 = 4.66:1 */}
          <p className="text-[10px] lg:text-xs font-bold text-green-700 uppercase tracking-wider mb-1">ร้อยละ</p>
          <p className="text-xl lg:text-3xl font-black text-green-600">
            {!isNotStarted && totalEligible > 0
              ? ((totalVotes / totalEligible) * 100).toFixed(2) + "%"
              : "- %"
            }
          </p>
        </div>
        <div className="bg-green-50 p-2 lg:p-4 rounded-xl text-green-600 hidden lg:block">
          <PieIcon className="w-6 h-6 lg:w-8 lg:h-8" />
        </div>
      </div>
    </div>
  );
}
