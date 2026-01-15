// components/CountdownTimer.js
'use client';
import { useState, useEffect } from 'react';
import { Zap, Clock, CalendarDays, Hourglass, Flag } from 'lucide-react';

export default function CountdownTimer({ compact = false }) {

  // กำหนดเวลา (Time Configuration)
  const ELECTION_2026_START = new Date('2026-02-06T08:30:00');
  const ELECTION_2026_END   = new Date('2026-02-06T17:30:00');
  const ELECTION_2027_START = new Date('2027-02-06T08:30:00');

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState('LOADING');

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      
      if (now < ELECTION_2026_START) {
        setPhase('BEFORE');
        return ELECTION_2026_START - now;
      } else if (now >= ELECTION_2026_START && now < ELECTION_2026_END) {
        setPhase('RUNNING');
        return ELECTION_2026_END - now;
      } else {
        setPhase('NEXT_YEAR');
        return ELECTION_2027_START - now;
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
  }, []);

  const getConfig = () => {
    switch (phase) {
      case 'RUNNING':
        return {
          label: "CLOSES IN",
          icon: <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 animate-pulse" />,
          badgeBg: "bg-red-500",
          textMain: "text-red-600",
          textSub: "text-red-400", // ปรับสีหน่วยให้เข้มขึ้น อ่านง่ายขึ้น
          border: "border-red-100",
          shadow: "shadow-[0_2px_15px_rgba(239,68,68,0.2)]"
        };
      case 'NEXT_YEAR':
        return {
          label: "SEE YOU 2027",
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
          badgeBg: "bg-[#9D3292]",
          textMain: "text-[#9D3292]",
          textSub: "text-purple-400", // ปรับสีหน่วยให้เข้มขึ้น
          border: "border-purple-100",
          shadow: "shadow-[0_2px_10px_rgba(157,50,146,0.15)]"
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