// components/CountdownTimer.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Zap, Clock, CalendarDays, Hourglass, Flag } from 'lucide-react';
import { resolveElectionDates, ELECTION_YEAR } from '../utils/electionConfig';
import { useGlobalConfig } from '../contexts/GlobalConfigContext';

const ICON_MAP = { Flag, Zap, Hourglass, CalendarDays, Clock };

function resolveIcon(iconName, fallback) {
  return ICON_MAP[iconName] || fallback;
}

function mapForceStateToPhase(forceState) {
  const map = {
    before: 'BEFORE',
    running: 'RUNNING',
    paused: 'PAUSED',
    manualEnded: 'MANUAL_ENDED',
    nextYear: 'NEXT_YEAR'
  };
  return map[forceState] || 'BEFORE';
}

function buildShadowStyle(cfg) {
  if (!cfg || !cfg.shadow || cfg.shadow === 'none') return 'none';
  const shadowMap = { sm: '0 1px 2px 0', md: '0 4px 6px -1px', lg: '0 10px 15px -3px', xl: '0 20px 25px -5px', '2xl': '0 25px 50px -12px' };
  const base = shadowMap[cfg.shadow] || shadowMap.md;
  const color = cfg.shadowColor ? `${cfg.shadowColor}33` : 'rgba(0,0,0,0.15)';
  return `${base} ${color}`;
}

export default function CountdownTimer({
  compact = false,
  systemMode = "AUTO",
  resolvedConfig = null,
  forceState = null
}) {
  const globalConfig = useGlobalConfig();
  // memoize → stable Date objects across renders (effect deps below would otherwise
  // re-run every render and thrash the interval / risk an update loop).
  const { ELECTION_START, ELECTION_END } = useMemo(
    () => resolveElectionDates(globalConfig),
    [globalConfig?.campaignStartAt, globalConfig?.electionStartAt, globalConfig?.electionEndAt]
  );

  const ELECTION_NEXT_YEAR = useMemo(() => {
    const d = new Date(ELECTION_START);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }, [ELECTION_START]);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState('LOADING');

  useEffect(() => {
    // forceState mode (used in admin gallery preview) — show frozen demo values
    if (forceState) {
      setPhase(mapForceStateToPhase(forceState));
      setTimeLeft({ days: 12, hours: 4, minutes: 35, seconds: 20 });
      return; // skip setInterval
    }

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
  }, [ELECTION_START, ELECTION_END, ELECTION_NEXT_YEAR, systemMode, forceState]);

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
          label: `SEE YOU ${ELECTION_YEAR}`,
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
          textSub: "text-purple-400",
          border: "border-purple-100",
          shadow: "shadow-[0_2px_10px_rgba(157,50,146,0.15)]"
        };
    }
  };

  const config = getConfig();

  // Build display label — replace {YEAR} placeholder with ELECTION_YEAR
  const displayLabel = resolvedConfig
    ? (resolvedConfig.label || config.label).replace('{YEAR}', ELECTION_YEAR)
    : config.label;

  // Resolve icon when resolvedConfig overrides it
  let renderedIcon = config.icon;
  if (resolvedConfig && resolvedConfig.iconName) {
    const IconComp = resolveIcon(resolvedConfig.iconName, CalendarDays);
    const animClass = resolvedConfig.iconAnimation === 'pulse' ? 'animate-pulse'
      : resolvedConfig.iconAnimation === 'spin' ? 'animate-spin' : '';
    renderedIcon = <IconComp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${animClass}`} />;
  }

  if (phase === 'LOADING') return (
    <div className="w-48 h-12 bg-slate-100 animate-pulse rounded-full lg:w-64 lg:h-16"></div>
  );

  return (
    // ✅ Wrapper: เพิ่ม padding (p-1.5, lg:p-2) และ gap (gap-3, lg:gap-5) ให้กว้างขึ้น
    <div
      className={`group relative inline-flex items-center gap-3 p-1.5 pr-6 lg:gap-5 lg:p-2 lg:pr-10 border rounded-full transition-all duration-300 cursor-default hover:-translate-y-0.5 select-none ${resolvedConfig ? '' : `bg-white ${config.border} ${config.shadow}`} ${compact ? '' : ''}`}
      style={resolvedConfig ? {
        backgroundColor: resolvedConfig.pillBackground || '#ffffff',
        borderColor: resolvedConfig.borderColor || undefined,
        boxShadow: buildShadowStyle(resolvedConfig),
      } : undefined}
    >
      {/* Badge Label: ขยายขนาด Font และ Padding */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 rounded-full shadow-sm transition-all ${resolvedConfig ? '' : `${config.badgeBg} text-white`}`}
        style={resolvedConfig ? {
          backgroundColor: resolvedConfig.badgeBackgroundColor,
          color: resolvedConfig.badgeTextColor,
        } : undefined}
      >
        {renderedIcon}
        <span className="text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-wider translate-y-[0.5px] whitespace-nowrap">
          {displayLabel}
        </span>
      </div>

      {/* ตัวเลขเวลานับถอยหลัง: ปรับ Gap ให้ห่างขึ้น */}
      <div
        className={`flex items-baseline gap-1.5 sm:gap-2 lg:gap-3 ${resolvedConfig ? '' : config.textMain}`}
        style={resolvedConfig ? { color: resolvedConfig.textMain } : undefined}
      >
        <TimeUnit value={timeLeft.days} unit="d" colorSub={config.textSub} colorSubOverride={resolvedConfig?.textSub} />
        <Separator color={config.textSub} colorOverride={resolvedConfig?.textSub} />
        <TimeUnit value={timeLeft.hours} unit="h" colorSub={config.textSub} colorSubOverride={resolvedConfig?.textSub} />
        <Separator color={config.textSub} colorOverride={resolvedConfig?.textSub} />
        <TimeUnit value={timeLeft.minutes} unit="m" colorSub={config.textSub} colorSubOverride={resolvedConfig?.textSub} />
        <Separator color={config.textSub} colorOverride={resolvedConfig?.textSub} />
        <TimeUnit value={timeLeft.seconds} unit="s" colorSub={config.textSub} colorSubOverride={resolvedConfig?.textSub} />
      </div>
    </div>
  );
}

// ✅ TimeUnit: ขยายขนาด Font (text-lg -> text-3xl)
const TimeUnit = ({ value, unit, colorSub, colorSubOverride }) => (
  <div className="flex items-baseline">
    <span className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-black tabular-nums tracking-tight leading-none transition-all">
      {String(value).padStart(2, '0')}
    </span>
    {/* ปรับขนาดหน่วย (d, h, m, s) ให้ใหญ่ขึ้นและชัดขึ้น */}
    <span
      className={`text-[12px] sm:text-xs lg:text-base font-bold uppercase ml-0.5 lg:ml-1 ${colorSubOverride ? '' : colorSub} transition-all`}
      style={colorSubOverride ? { color: colorSubOverride } : undefined}
    >{unit}</span>
  </div>
);

// ✅ Separator: ตัวคั่น (:) ปรับขนาดตาม
const Separator = ({ color, colorOverride }) => (
  <span
    className={`font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl lg:pb-1 ${colorOverride ? '' : color} opacity-60`}
    style={colorOverride ? { color: colorOverride } : undefined}
  >:</span>
);
