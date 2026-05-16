"use client";

import { Activity, Users, PieChart as PieIcon } from 'lucide-react';

export default function ResultsStatsBar({
  totalVotes = 0,
  totalEligible = 0,
  isNotStarted = false
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-8 lg:mb-12">
      <div className="col-span-2 lg:col-span-1 bg-white/90 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-[#8A2680]/20 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[#8A2680]"></div>
        <div>
          <p className="text-xs font-bold text-[#8A2680] uppercase tracking-wider mb-1">คะแนนเสียงรวม</p>
          <p className="text-3xl lg:text-5xl font-black text-[#8A2680]">
            {isNotStarted ? "-" : totalVotes.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#8A2680]/10 p-2 lg:p-4 rounded-xl text-[#8A2680]">
          <Activity className="w-6 h-6 lg:w-8 lg:h-8" />
        </div>
      </div>

      <div className="col-span-1 bg-white/80 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ผู้มีสิทธิ์</p>
          <p className="text-xl lg:text-3xl font-black text-slate-700">{totalEligible.toLocaleString()}</p>
        </div>
        <div className="bg-slate-100 p-2 lg:p-4 rounded-xl text-slate-400 hidden lg:block">
          <Users className="w-6 h-6 lg:w-8 lg:h-8" />
        </div>
      </div>

      <div className="col-span-1 bg-white/80 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-green-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] lg:text-xs font-bold text-green-600 uppercase tracking-wider mb-1">ร้อยละ</p>
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
