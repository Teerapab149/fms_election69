'use client';
import { useState, useEffect } from 'react';
import { Timer, Zap, Lock } from 'lucide-react';

export default function CountdownTimer() {
  // --------------------------------------------------------
  // ⚙️ ตั้งค่าวันเวลา (Config)
  // --------------------------------------------------------
  const ELECTION_START = new Date('2026-02-06T08:00:00'); // เริ่ม 6 ก.พ. 08:00
  const ELECTION_END   = new Date('2026-02-06T17:30:00'); // จบ 6 ก.พ. 16:00

  // State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState('LOADING'); // LOADING, WAITING, RUNNING, ENDED

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      if (now < ELECTION_START) {
        setPhase('WAITING');
        return ELECTION_START - now;
      } else if (now >= ELECTION_START && now < ELECTION_END) {
        setPhase('RUNNING');
        return ELECTION_END - now;
      } else {
        setPhase('ENDED');
        return 0;
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
  }, []); // Run once on mount

  // --------------------------------------------------------
  // 🎨 ส่วนแสดงผล (Render)
  // --------------------------------------------------------
  
  if (phase === 'LOADING') return null; // กันภาพกระตุกตอนโหลด

  // 1. จบการเลือกตั้ง (ENDED)
  if (phase === 'ENDED') {
    return (
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-100/80 backdrop-blur-sm border border-gray-200 rounded-2xl text-gray-500 font-bold shadow-sm select-none">
        <Lock className="w-5 h-5" />
        <span>ปิดรับลงคะแนนแล้ว / Election Closed</span>
      </div>
    );
  }

  // 2. กำหนดธีมสี (WAITING vs RUNNING)
  const isRunning = phase === 'RUNNING';

  const theme = isRunning
    ? {
        label: "Time Left",
        icon: <Zap className="w-4 h-4 fill-white animate-pulse" />,
        badgeStyle: "bg-red-500 text-white shadow-red-200",
        boxStyle: "border-red-100 bg-red-50/50",
        numColor: "text-red-600",
        containerBorder: "border-red-100 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.2)]"
      }
    : {
        label: "Starts In",
        icon: <Timer className="w-4 h-4" />,
        badgeStyle: "bg-purple-100 text-purple-700 border border-purple-200",
        boxStyle: "border-purple-100 bg-white",
        numColor: "text-[#8A2680]",
        containerBorder: "border-purple-100/50 shadow-[0_4px_20px_-4px_rgba(138,38,128,0.1)]"
      };

  return (
    <div className={`flex flex-col items-center lg:items-start gap-3 select-none animate-fade-in`}>
      
      {/* Label Badge */}
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm w-fit transition-colors duration-500 ${theme.badgeStyle}`}>
        {theme.icon}
        {theme.label}
      </div>

      {/* Timer Container */}
      <div className={`flex items-center p-1.5 md:p-2 bg-white/60 backdrop-blur-md rounded-2xl border transition-all duration-500 ${theme.containerBorder}`}>
        
        {/* Days (โชว์เฉพาะถ้า > 0) */}
        {timeLeft.days > 0 && (
          <>
            <TimeBox value={timeLeft.days} label="DAYS" theme={theme} />
            <Separator color={theme.numColor} />
          </>
        )}

        {/* Hours */}
        <TimeBox value={timeLeft.hours} label="HOURS" theme={theme} />
        <Separator color={theme.numColor} />

        {/* Minutes */}
        <TimeBox value={timeLeft.minutes} label="MINS" theme={theme} />
        <Separator color={theme.numColor} />

        {/* Seconds */}
        <TimeBox value={timeLeft.seconds} label="SECS" theme={theme} isLast />

      </div>
    </div>
  );
}

// --- Sub-Components ---

const TimeBox = ({ value, label, theme, isLast }) => (
  <div className="flex flex-col items-center group min-w-[3.5rem] md:min-w-[4.5rem]">
    <div className={`
        flex items-center justify-center 
        w-12 h-12 md:w-16 md:h-16 
        rounded-xl md:rounded-2xl border 
        transition-colors duration-500
        ${theme.boxStyle}
    `}>
      <span className={`text-xl md:text-3xl font-black tabular-nums leading-none tracking-tight ${theme.numColor}`}>
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-[8px] md:text-[9px] font-bold text-gray-400 mt-1.5 uppercase tracking-wider">
      {label}
    </span>
  </div>
);

// ✅ แก้ไข: ใช้ relative + top เพื่อดึงตัว : ขึ้นไปดื้อๆ เลยครับ (ชัวร์กว่า pb)
const Separator = ({ color }) => (
  <span className={`
    text-xl md:text-3xl font-black opacity-30 mx-0.5 md:mx-1
    relative -top-2 md:-top-2  /* 👈 สั่งให้ลอยขึ้น 4px-8px */
    ${color}
  `}>
    :
  </span>
);