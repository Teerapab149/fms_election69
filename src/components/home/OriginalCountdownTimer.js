// components/CountdownTimer.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Zap, Clock, CalendarDays, Hourglass, Flag } from 'lucide-react';
import { resolveElectionDates } from '../../utils/electionConfig';
import { useGlobalConfig } from '../../contexts/GlobalConfigContext';

export default function CountdownTimer({ compact = false, systemMode = "AUTO" }) {

  // Dates come from the admin's globalConfig (same source as the shared
  // CountdownTimer), falling back to the code constants when unset. Reading
  // ELECTION_CONFIG directly meant moving the election in the admin left this
  // clock counting to the old date on the original template's home page.
  const globalConfig = useGlobalConfig();
  const { ELECTION_START, ELECTION_END } = useMemo(
    () => resolveElectionDates(globalConfig),
    [globalConfig?.campaignStartAt, globalConfig?.electionStartAt, globalConfig?.electionEndAt]
  );

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

      // forced open past the scheduled end: there is no closing time left to
      // count to — say it is open instead of a row of zeros under "CLOSES IN"
      if (systemMode === "MANUAL_OPEN") {
        setPhase(now >= ELECTION_END ? 'OVERTIME' : 'RUNNING');
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
        // after the polls. This used to count down to the same date a year
        // later ("SEE YOU 2027") — a date nobody has set.
        setPhase('ENDED');
        return 0;
      }
    };

    const tick = () => {
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
    };

    // run once BEFORE the interval: the tick only ever fired inside setInterval, so
    // `phase` stayed 'LOADING' for a full 1000ms and the home hero opened with a
    // grey 192x48 skeleton pill on every single load
    tick();
    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [ELECTION_START, ELECTION_END, systemMode]);

  const getConfig = () => {
    switch (phase) {
      case 'PAUSED':
        return {
          label: "SYSTEM PAUSED",
          note: "ระงับการลงคะแนนชั่วคราว",
          icon: <Hourglass className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-orange-500 animate-spin" />,
          badgeBg: "bg-orange-100 !text-orange-700",
          textMain: "text-orange-600",
          // orange-400 on white measured 2.26:1 at 12px (AA needs 4.5) — orange-700
          // is 5.18:1 (2026-09-25 QA sweep, mobile 360/375/412 contrast pass)
          textSub: "text-orange-700",
          border: "border-orange-200",
          shadow: "shadow-sm shadow-orange-100"
        };
      case 'MANUAL_ENDED':
      case 'ENDED':
        return {
          label: "ELECTION ENDED",
          note: "ปิดการลงคะแนนแล้ว",
          icon: <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-slate-500" />,
          badgeBg: "bg-slate-200 !text-slate-700",
          textMain: "text-slate-600",
          // slate-400 on white measured 2.56:1 at 12px (AA needs 4.5) — slate-500
          // is 4.76:1 (2026-09-25 QA sweep, mobile 360/375/412 contrast pass)
          textSub: "text-slate-500",
          border: "border-slate-300",
          shadow: "shadow-none"
        };
      case 'RUNNING':
        return {
          label: "CLOSES IN",
          icon: <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 animate-pulse" />,
          badgeBg: "bg-red-500",
          textMain: "text-red-600",
          // red-400 on white measured 2.77:1 at 12px (AA needs 4.5) — red-600
          // is 4.83:1 (2026-09-25 QA sweep, mobile 360/375/412 contrast pass)
          textSub: "text-red-600",
          border: "border-red-100",
          shadow: "shadow-[0_2px_15px_rgba(239,68,68,0.2)]"
        };
      case 'OVERTIME':
        return {
          label: "OPEN",
          note: "เปิดรับลงคะแนนอยู่",
          icon: <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 animate-pulse" />,
          badgeBg: "bg-red-500",
          textMain: "text-red-600",
          textSub: "text-red-600",
          border: "border-red-100",
          shadow: "shadow-[0_2px_15px_rgba(239,68,68,0.2)]"
        };
      case 'BEFORE':
      default:
        return {
          label: "STARTS IN",
          icon: <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />,
          badgeBg: "bg-[var(--o-brand,#9D3292)]",
          textMain: "text-[var(--o-brand,#9D3292)]",
          // --o-mid on the flagship purple theme is #A855F7 → 3.96:1 on white for
          // the 16px d/h/m/s markers (AA needs 4.5). An 80% brand/white mix reads
          // 5.03:1 and still sits visibly lighter than the numerals (7.87:1).
          textSub: "text-[color-mix(in_srgb,var(--o-brand,#9D3292)_80%,white)]",
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

      {/* nothing to count down to (paused / ended / open past the end): one plain
          line instead of 00:00:00:00 */}
      {config.note ? (
        <span className={`text-sm sm:text-base lg:text-lg font-semibold whitespace-nowrap ${config.textMain}`}>{config.note}</span>
      ) : (
      <div className={`flex items-baseline gap-1.5 sm:gap-2 lg:gap-3 ${config.textMain}`}>
        <TimeUnit value={timeLeft.days} unit="d" colorSub={config.textSub} />
        <Separator color={config.textSub} />
        <TimeUnit value={timeLeft.hours} unit="h" colorSub={config.textSub} />
        <Separator color={config.textSub} />
        <TimeUnit value={timeLeft.minutes} unit="m" colorSub={config.textSub} />
        <Separator color={config.textSub} />
        <TimeUnit value={timeLeft.seconds} unit="s" colorSub={config.textSub} />
      </div>
      )}

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
// opacity-60 measured 2.25-2.72:1 on the 4 non-BEFORE textSub colors (need 3.0,
// large text) — opacity-90 clears all of them (slate-500 3.91:1, red-600 4.32:1,
// orange-700 4.42:1, brand-mix 3.62:1) while staying visibly fainter than the
// solid-color digits next to it (2026-09-25 QA sweep round b)
const Separator = ({ color }) => (
  <span className={`font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl lg:pb-1 ${color} opacity-90`}>:</span>
);