"use client";

import { Calendar } from "lucide-react";
import CountdownTimer from "../CountdownTimer";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

// HeroBlock — SAMO 49 headline + countdown + year badge
// config props: showCountdown (bool), showStatusBadge (bool)
// data props:   initialData (for systemMode)
export default function HeroBlock({ config = {}, data = {} }) {
  const { showCountdown = true, showStatusBadge = true } = config;
  const { initialData } = data;
  const globalConfig = useGlobalConfig();
  const academicYearTh = globalConfig?.academicYearTh ?? 2569;

  return (
    <div className="w-full text-center lg:text-left space-y-4 pt-8 md:pt-10 pb-0 animate-fade-in-up">

      {showCountdown && (
        <div className="flex justify-center lg:justify-start">
          <CountdownTimer systemMode={initialData?.systemMode || "AUTO"} />
        </div>
      )}

      <div className="space-y-3">
        {/* SAMO 49 ตัวใหญ่ */}
        <div className="flex items-center justify-center lg:justify-start">
          <h1 className="flex items-baseline gap-2 md:gap-3 font-black tracking-tight leading-none whitespace-nowrap select-none">
            <span className="text-[20vw] sm:text-[100px] md:text-[110px] lg:text-[85px] xl:text-[120px] 2xl:text-[150px] text-slate-900 drop-shadow-sm">
              SAMO
            </span>
            <span className="text-[20vw] sm:text-[100px] md:text-[110px] lg:text-[85px] xl:text-[120px] 2xl:text-[150px] text-transparent bg-clip-text bg-gradient-to-b from-[#8A2680] to-[#D946EF] drop-shadow-md relative">
              49
              <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-2 h-2 md:w-4 md:h-4 bg-[#D946EF] rounded-full opacity-30 animate-ping" />
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className="space-y-1">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight tracking-tight">
            โครงการเลือกตั้ง
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2680] to-[#D946EF]">
              คณะกรรมการบริหาร
            </span>
          </h2>
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-500">
            สโมสรนักศึกษาคณะวิทยาการจัดการ
          </h3>
        </div>

        {/* Year badge */}
        {showStatusBadge && (
          <div className="flex justify-center lg:justify-start pt-1">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-purple-50 text-[#8A2680] border border-purple-200 text-xs md:text-sm font-bold shadow-sm">
              <Calendar className="w-3.5 h-3.5" />
              ประจำปีการศึกษา {academicYearTh}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
