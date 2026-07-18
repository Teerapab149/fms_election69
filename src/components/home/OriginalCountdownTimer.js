// components/CountdownTimer.js
'use client';
import { useState, useEffect } from 'react';
import { Zap, Clock, CalendarDays, Hourglass, Flag } from 'lucide-react';
import { ELECTION_CONFIG } from '../../utils/electionConfig';

export default function CountdownTimer({ compact = false, systemMode = "AUTO" }) {

  const { ELECTION_START, ELECTION_END } = ELECTION_CONFIG;
  // Fallback for next year logic if needed, or just standard behavior
  const ELECTION_NEXT_YEAR = new Date(ELECTION_START);
  ELECTION_NEXT_YEAR.setFullYear(ELECTION_NEXT_YEAR.getFullYear() + 1);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState('LOADING');

  useEffect(() => {
    const calculate = () => {
      const now = new Date();

      // NEW: Manual System Mode Overrides
      if (systemMode === "PAUSE") {
        setPhase('PAUSED');
        return 0;
      }

      if (systemMode === "ENDED") {
        setPhase('MANUAL_ENDED');
        return 0;
      }

      if (systemMode === "MANUAL_OPEN") {
        setPhase('RUNNING');
        return ELECTION_END - now;
      }

      // AUTO Mode (Time-based logic)
      if (now < ELECTION_START) {
        setPhase('BEFORE');
        return ELECTION_START - now;
      } else if (now >= ELECTION_START && now < ELECTION_END) {
        setPhase('RUNNING');
        return ELECTION_END - now;
      } else {
        setPhase('NEXT_YEAR');
        return ELECTION_NEXT_YEAR - now;
      }
    };

    const timer = setInterval(() => {
      const diff = calculate();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [ELECTION_START, ELECTION_END, ELECTION_NEXT_YEAR, systemMode]);

  const getConfig = () => {
    switch (phase) {
      case 'PAUSED':
        return {
          label: "SYSTEM PAUSED",
          icon: <Hourglass className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-orange-500 animate-spin" />,
          badgeBg: "bg-orange-100 !text-orange-700",
          textMain: "text-orange-600",
          textSub: "text-orange-400",
          border: "border-orange-200",
          shadow: "shadow-sm shadow-orange-100"
        };
      case 'MANUAL_ENDED':
        return {
          label: "ELECTION ENDED",
          icon: <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-slate-500" />,
          badgeBg: "bg-slate-200 !text-slate-700",
          textMain: "text-slate-600",
          textSub: "text-slate-400",
          border: "border-slate-300",
          shadow: "shadow-none"
        };
      case 'RUNNING':
        return {
          label: "CLOSES IN",
          icon: <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 animate-pulse" />,
          badgeBg: "bg-red-500",
          textMain: "text-red-600",
          textSub: "text-red-400",
          border: "border-red-100",
          shadow: "shadow-[0_2px_15px_rgba(239,68,68,0.2)]"
        };
      case 'NEXT_YEAR':
        return {
          label: `SEE YOU ${ELECTION_NEXT_YEAR.getFullYear()}`,
          icon: <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />,
          badgeBg: "bg-slate-800",
          textMain: "text-slate-700",
          textSub: "text-slate-400",
          border: "border-slate-200",
          shadow: "shadow-sm"
        };
      case 'BEFORE':
      default:
        return {
          label: "STARTS IN",
          icon: <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />,
          badgeBg: "bg-[var(--o-brand,#9D3292)]",
          textMain: "text-[var(--o-brand,#9D3292)]",
          textSub: "text-[var(--o-mid)]",
          border: "border-[var(--o-soft2)]",
          shadow: "shadow-[0_2px_10px_color-mix(in_srgb,var(--o-brand,#9D3292)_15%,transparent)]"
        };
    }
  };

  const config = getConfig();

  if (phase === 'LOADING') return (
    <div className="w-48 h-12 bg-slate-100 animate-pulse rounded-full lg:w-64 lg:h-16"></div>
  );

  return (
    // ✅ Wrapper: เพิ่ม padding (p-1.5, lg:p-2) และ gap (gap-3, lg:gap-5) ให้กว้างขึ้น
    <div className={`group relative inline-flex items-center gap-3 p-1.5 pr-6 lg:gap-5 lg:p-2 lg:pr-10 bg-white border rounded-full transition-all duration-300 cursor-default hover:-translate-y-0.5 select-none ${config.border} ${config.shadow} ${compact ? '' : ''}`}>

      {/* Badge Label: ขยายขนาด Font และ Padding */}
      <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 rounded-full ${config.badgeBg} text-white shadow-sm transition-all`}>
        {config.icon}
        <span className="text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-wider translate-y-[0.5px] whitespace-nowrap">
          {config.label}
        </span>
      </div>

      {/* ตัวเลขเวลานับถอยหลัง: ปรับ Gap ให้ห่างขึ้น */}
      <div className={`flex items-baseline gap-1.5 sm:gap-2 lg:gap-3 ${config.textMain}`}>
        <TimeUnit value={timeLeft.days} unit="d" colorSub={config.textSub} />
        <Separator color={config.textSub} />
        <TimeUnit value={timeLeft.hours} unit="h" colorSub={config.textSub} />
        <Separator color={config.textSub} />
        <TimeUnit value={timeLeft.minutes} unit="m" colorSub={config.textSub} />
        <Separator color={config.textSub} />
        <TimeUnit value={timeLeft.seconds} unit="s" colorSub={config.textSub} />
      </div>

    </div>
  );
}

// ✅ TimeUnit: ขยายขนาด Font (text-lg -> text-3xl)
const TimeUnit = ({ value, unit, colorSub }) => (
  <div className="flex items-baseline">
    <span className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-black tabular-nums tracking-tight leading-none transition-all">
      {String(value).padStart(2, '0')}
    </span>
    {/* ปรับขนาดหน่วย (d, h, m, s) ให้ใหญ่ขึ้นและชัดขึ้น */}
    <span className={`text-[12px] sm:text-xs lg:text-base font-bold uppercase ml-0.5 lg:ml-1 ${colorSub} transition-all`}>{unit}</span>
  </div>
);

// ✅ Separator: ตัวคั่น (:) ปรับขนาดตาม
const Separator = ({ color }) => (
  <span className={`font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl lg:pb-1 ${color} opacity-60`}>:</span>
);