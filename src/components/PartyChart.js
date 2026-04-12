'use client';
import { getPath } from "../utils/basePath";
import React, { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { User, Anchor, Zap, Star } from 'lucide-react';
import SmartImage from "./SmartImage";

// 🔒 FIXED ROLES (Keep Original Logic)
const FIXED_ROLES = {
  PRESIDENT: "นายกสโมสรนักศึกษา",
  EXECUTIVES: [
    "อุปนายกกิจการภายใน",
    "อุปนายกกิจการภายนอก",
    "เลขานุการ",
    "เหรัญญิก"
  ]
};

// 🌊 PRIORITY SORTING (Keep Original Logic)
const HULL_PRIORITY = [
  "ประธานฝ่ายประชาสัมพันธ์",
  "ประธานฝ่ายสวัสดิการ",
  "ประธานฝ่ายพัสดุ",
  "ประธานฝ่ายกีฬา",
  "ประธานฝ่ายวิชาการ",
  "ประธานฝ่ายศิลปวัฒนธรรม",
  "ประธานฝ่ายข้อมูลกิจการนักศึกษา",
  "ประธานฝ่ายเทคโนโลยีสารสนเทศ",
  "ประธานฝ่ายประเมินผล",
  "ประธานฝ่ายกิจกรรม",
  "ประธานฝ่ายกราฟิกดีไซน์",
  "ประธานฝ่ายพิธีการ",
  "ประธานฝ่ายครีเอทีฟและสันทนาการ",
  "ประธานฝ่ายสถานที่",
  "ประธานฝ่ายสาธารณสุข"
];

// --- SUB-COMPONENTS ---

// 1. Background Particles
const DeepSeaParticles = () => {
  const particles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white opacity-20 will-change-transform"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ['110vh', '-10vh'],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// 2. MemberCard (Glassmorphism Rectangular Style)
const MemberCard = React.memo(({ member, onClick, isExecutive = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 
        ${isExecutive ? 'aspect-[3/4]' : 'aspect-[4/5]'}
        desktop-hover-effect
      `}
    >
      {/* Avatar Image Layer */}
      <div className="absolute inset-0 z-0 bg-slate-900">
        {(member.modalImageUrl || member.imageUrl) ? (
          <SmartImage
            src={getPath(member.modalImageUrl || member.imageUrl)}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-[1.12] contrast-[1.08]"
            objectFit="cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/10">
            <User size={isExecutive ? 64 : 48} />
          </div>
        )}

        {/* Dynamic Gradient for Readability - Reduced opacity from 80 to 50 */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
      </div>

      {/* Content Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10 lg:translate-y-2 transform transition-transform duration-300 group-hover:translate-y-0">
        {isExecutive && (
          <div className="mb-1 flex items-center gap-1">
            <Star size={10} className="text-cyan-400 fill-cyan-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">Team Executive</span>
          </div>
        )}
        <h3 className={`font-black text-white leading-tight drop-shadow-lg ${isExecutive ? 'text-lg md:text-xl' : 'text-sm md:text-base'}`}>
          {member.name}
        </h3>
        <p className="mt-1 text-[10px] font-bold text-white/60 uppercase tracking-widest truncate">
          {member.position || "Member"}
        </p>
      </div>

      {/* Decorative Border Glow */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors duration-300 pointer-events-none" />
    </motion.div>
  );
});

export default function PartyChart({ members = [], theme: providedTheme, onMemberClick }) {
  // --- SORTING LOGIC (Keep Original Exactly) ---
  const { president, executives, crew } = useMemo(() => {
    const realMembers = members.filter(m => !m.isPlaceholder);
    realMembers.sort((a, b) => (a.number || 999) - (b.number || 999));

    const pres = realMembers.find(m => m.number === 1) || realMembers[0] || null;
    const remainingAfterPres = realMembers.filter(m => m.id !== pres?.id);

    const execs = remainingAfterPres.filter(m => m.number >= 2 && m.number <= 5);
    const cr = remainingAfterPres.filter(m => !(m.number >= 2 && m.number <= 5));

    return { president: pres, executives: execs.slice(0, 4), crew: cr };
  }, [members]);

  // --- SCROLL ANIMATIONS (Diving Theme) ---
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  // Interpolate Background: White (Surface) -> Sea Blue (Medium) -> Deep Navy (Abyss)
  const bgColor = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1],
    ["#FFFFFF", "#0ea5e9", "#1e1b4b", "#020617"] // White -> Sky-500 -> Indigo-950 -> Slate-950
  );

  // 🎨 DYNAMIC TEXT COLOR: Dark on Surface, White in Depth
  const textColor = useTransform(
    scrollYProgress,
    [0, 0.25],
    ["#020617", "#ffffff"] // Darker Start for Light BG
  );

  const badgeColor = useTransform(
    scrollYProgress,
    [0, 0.25],
    ["#0e7490", "rgba(34, 211, 238, 1)"] // Deep Cyan -> Bright Cyan
  );

  const badgeBg = useTransform(
    scrollYProgress,
    [0, 0.25],
    ["rgba(8, 145, 178, 0.1)", "rgba(255, 255, 255, 0.05)"]
  );

  const badgeBorder = useTransform(
    scrollYProgress,
    [0, 0.25],
    ["rgba(8, 145, 178, 0.3)", "rgba(34, 211, 238, 0.3)"]
  );

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full min-h-[150vh] pb-32 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* === GLOBAL BACKGROUND FX === */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-white to-transparent opacity-20" />
        <DeepSeaParticles />
      </div>

      {/* === CONTENT CONTAINER === */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 pt-32 flex flex-col items-center">

        {/* --- HEADER --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-20 relative z-30"
          style={{ color: textColor }}
        >
          <motion.span
            className="px-5 py-2 rounded-full border border-cyan-500/40 font-black text-[11px] uppercase tracking-[0.1em] mb-5 inline-block backdrop-blur-xl shadow-sm"
            style={{
              color: badgeColor,
              backgroundColor: badgeBg,
              borderColor: badgeBorder
            }}
          >
            Organization Framework
          </motion.span>
          <h2 className="text-4xl md:text-8xl font-black tracking-tighter uppercase mb-2 drop-shadow-sm">
            THE <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-r"
              style={{ backgroundImage: useTransform(scrollYProgress, [0, 0.25], ["linear-gradient(to right, #0369a1, #1d4ed8)", "linear-gradient(to right, #22d3ee, #3b82f6)"]) }}
            >CANDIDATES</motion.span>
          </h2>
          <motion.p
            className="font-bold text-sm md:text-base tracking-tight text-slate-500"
            style={{
              color: useTransform(scrollYProgress, [0, 0.25], ["#334155", "#cbd5e1"]),
              opacity: useTransform(scrollYProgress, [0, 0.3, 0.4], [1, 0.8, 0])
            }}
          >
            โครงสร้างและคณะทำงานสโมสรนักศึกษา
          </motion.p>
        </motion.div>

        {/* --- 1. THE PRESIDENT --- */}
        {president && (
          <div className="relative w-full flex justify-center mb-24 lg:mb-32">
            {/* Glowing Backlight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-400/20 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative z-10 cursor-pointer"
              onClick={() => onMemberClick(president)}
            >
              <div className="relative w-[300px] md:w-[380px] aspect-[4/5] group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-[3rem] opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />

                <div className="relative h-full w-full rounded-[2.5rem] bg-slate-900 border border-white/20 shadow-2xl overflow-hidden transition-all duration-500 group-hover:scale-[1.02]">
                  <SmartImage
                    src={getPath(president.modalImageUrl || president.imageUrl)}
                    className="w-full h-full object-cover brightness-115 contrast-110 transition-opacity duration-500"
                    alt={president.name}
                    objectFit="cover"
                  />

                  {/* President Metadata - Lightened background */}
                  <div className="absolute bottom-0 inset-x-0 p-8 pt-12 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-95">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full mb-3 shadow-lg">
                      <Zap size={12} fill="currentColor" /> President
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-1">{president.name}</h1>
                    <p className="text-cyan-200/60 font-medium tracking-wide">นายกสโมสรนักศึกษา</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* --- 2. EXECUTIVES --- */}
        {executives.length > 0 && (
          <div className="w-full mb-20 max-w-6xl">
            <div className="flex items-center gap-6 mb-12 opacity-40">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white"></div>
              <h3 className="text-white text-[10px] font-bold tracking-[0.5em] uppercase">Executive Board</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {executives.map((exec) => (
                <MemberCard
                  key={exec.id}
                  member={exec}
                  onClick={() => onMemberClick(exec)}
                  isExecutive={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* --- 3. CREW --- */}
        {crew.length > 0 && (
          <div className="w-full max-w-6xl">
            <div className="flex items-center justify-center mb-12 opacity-20">
              <Anchor className="text-white w-8 h-8" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {crew.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onClick={() => onMemberClick(member)}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.2; transform: translate(-50%, -50%) scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        /* 📱 MOBILE FIX: Enable hover only on devices that support it */
        @media (hover: hover) {
          .desktop-hover-effect:hover {
            transform: translateY(-10px) scale(1.02);
            border-color: rgba(255, 255, 255, 0.4) !important;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 211, 238, 0.2);
          }
        }

        /* Smooth fallback for touch: Simple scale on active if needed */
        .desktop-hover-effect:active {
          transform: scale(0.98);
          transition: transform 0.1s;
        }
      `}</style>
    </motion.div>
  );
}