'use client';
import { getPath } from "../utils/basePath";
import React, { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { User, Anchor, ChevronDown } from 'lucide-react';
import { DEFAULT_THEME } from "../utils/PartyTheme";

// 🔒 FIXED ROLES
const FIXED_ROLES = {
  PRESIDENT: "นายกสโมสรนักศึกษา",
  EXECUTIVES: [
    "อุปนายกกิจการภายใน",
    "อุปนายกกิจการภายนอก",
    "เลขานุการ",
    "เหรัญญิก"
  ]
};

// 🌊 PRIORITY SORTING
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

// --- UTILS ---
const hexToRgb = (hex) => {
  if (!hex) return '56, 189, 248'; // Sky blue default
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

// --- SUB-COMPONENTS ---

// 1. Background Particles
const DeepSeaParticles = () => {
  // 20 static bubbles with simple infinite float animation
  const particles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 1, // 1px to 5px
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

// 2. MemberCard - Memoized for performance
const MemberCard = React.memo(({ member, onClick, isExecutive = false }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={onClick}
      className={`
                group relative flex flex-col items-center
                cursor-pointer transition-all duration-300 will-change-transform
                ${isExecutive
          ? 'p-6 rounded-[2rem] bg-white/10 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
          : 'p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30'
        }
                backdrop-blur-md overflow-hidden
            `}
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/0 via-white/0 to-cyan-400/0 group-hover:from-cyan-400/10 group-hover:to-purple-500/10 transition-all duration-500" />

      {/* Avatar */}
      <div className={`
                relative rounded-full p-[2px] bg-gradient-to-b from-white/50 to-white/10
                ${isExecutive ? 'w-24 h-24 mb-4' : 'w-20 h-20 mb-3'}
            `}>
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 relative">
          {(member.modalImageUrl || member.imageUrl) ? (
            <img
              src={getPath(member.modalImageUrl || member.imageUrl)}
              alt={member.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30"><User /></div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="text-center relative z-10 w-full px-2">
        <h3 className={`font-black text-white leading-tight ${isExecutive ? 'text-lg' : 'text-sm md:text-base'}`}>
          {member.name}
        </h3>
        <p className={`font-bold uppercase tracking-widest mt-1 text-cyan-200/80 truncate ${isExecutive ? 'text-xs' : 'text-[10px]'}`}>
          {member.position}
        </p>
      </div>

      {/* Visual: Executive "Pod" shine */}
      {isExecutive && (
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      )}
    </motion.div>
  )
});


export default function PartyChart({ members = [], theme: providedTheme, onMemberClick }) {
  // --- SORTING LOGIC ---
  const { president, executives, crew } = useMemo(() => {
    // 1. Filter Check
    const realMembers = members.filter(m => !m.isPlaceholder);

    // 2. Sort by Number (Priority) or ID
    realMembers.sort((a, b) => (a.number || 999) - (b.number || 999));

    // 3. Categorize by Number (1: Pres, 2-5: Execs, Rest: Crew)
    const pres = realMembers.find(m => m.number === 1) || realMembers[0] || null;
    const remainingAfterPres = realMembers.filter(m => m.id !== pres?.id);

    const execs = remainingAfterPres.filter(m => m.number >= 2 && m.number <= 5);
    const cr = remainingAfterPres.filter(m => !(m.number >= 2 && m.number <= 5));

    return { president: pres, executives: execs.slice(0, 4), crew: cr };
  }, [members]);

  // --- SCROLL ANIMATIONS ---
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Interpolate Background: Surface (Sky) -> Deep (Navy) -> Abyss (Black)
  const bgColor = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    ["#0ea5e9", "#1e1b4b", "#020617"] // Sky-500 -> Indigo-950 -> Slate-950
  );

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full min-h-[200vh] pb-32 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* === GLOBAL BACKGROUND === */}
      <div className="fixed inset-0 z-0">
        {/* Sun Shafts (Top Only) */}
        <div className="absolute top-0 left-0 right-0 h-[80vh] bg-gradient-to-b from-white/10 to-transparent pointer-events-none mix-blend-overlay" />
        <DeepSeaParticles />
      </div>

      {/* === CONTENT CONTAINER === */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-20 flex flex-col items-center">

        {/* --- HERO: THE COMMANDER --- */}
        <div className="relative w-full flex flex-col items-center mb-12">

          {/* President Card - Large Glass Monolith */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, type: "spring" }}
            onClick={() => president && onMemberClick(president)}
            className="relative cursor-pointer group z-20 mb-16"
          >
            {/* Backlight */}
            <div className="absolute inset-0 bg-yellow-400/30 blur-[60px] rounded-full scale-150 animate-pulse" />

            {/* Card Body */}
            <div className="relative w-64 md:w-80 aspect-[3/4] rounded-[3rem] bg-gradient-to-b from-white/30 to-white/5 backdrop-blur-xl border border-white/40 shadow-2xl flex flex-col p-3 overflow-hidden transition-transform duration-500 group-hover:scale-105">
              {/* Image Area */}
              <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-slate-900 relative">
                {(president?.modalImageUrl || president?.imageUrl) ? (
                  <img src={getPath(president.modalImageUrl || president.imageUrl)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20"><User size={64} /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>

              {/* Name Plate */}
              <div className="absolute bottom-6 left-6 right-6 text-center">
                <div className="inline-block px-3 py-1 mb-2 rounded-full bg-yellow-400 text-yellow-950 text-[10px] font-black uppercase tracking-widest shadow-lg">
                  The President
                </div>
                <h1 className="text-2xl font-black text-white leading-none drop-shadow-md">
                  {president?.name || "Vacant"}
                </h1>
              </div>
            </div>
          </motion.div>

          {/* Executives - The Vanguard */}
          {/* Desktop: 4 cols | Mobile: 2 cols */}
          <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 z-20">
            {executives.map((exec, i) => (
              <MemberCard
                key={exec.id || i}
                member={exec}
                onClick={() => onMemberClick(exec)}
                isExecutive={true}
              />
            ))}
          </div>

        </div>


        {/* --- BODY: THE CREW (PARALLAX GRID) --- */}
        <div className="relative w-full max-w-6xl">

          {/* THE ANCHOR LINE (Center Spine) */}
          <div className="absolute left-1/2 top-[-100px] bottom-0 w-[2px] -translate-x-1/2 z-0">
            {/* Glowing Line */}
            <div className="w-full h-full bg-gradient-to-b from-yellow-400/0 via-cyan-400/50 to-purple-900/0 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          </div>

          {/* Section Header */}
          <div className="text-center mb-8 relative z-10">
            <h2 className="text-white/40 font-bold tracking-[0.5em] text-sm mt-4 uppercase">THE PARTY MEMBERS</h2>
          </div>

          {/* THE MASONRY GRID */}
          {/* 2 Cols Mobile, 4 Cols Desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative z-10">
            {crew.map((member, i) => {
              // Stagger effect: Offset even columns on desktop to create masonry look if desired
              // Here we just keep clean grid but stagger entry animations via index
              return (
                <div key={member.id} className="relative">
                  {/* Connector Dot (Desktop visual) */}
                  <div className={`hidden md:block absolute top-8 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900 z-0
                                    ${i % 2 === 0 ? '-right-[18px]' : '-left-[18px]'} 
                                    opacity-0 // Hidden for cleaner look as requested, can enable if needed
                                `} />

                  <MemberCard
                    member={member}
                    onClick={() => onMemberClick(member)}
                  />
                </div>
              )
            })}
          </div>

          {/* Bottom Anchor */}
          <div className="flex justify-center mt-32 opacity-40">
            <Anchor className="text-purple-400 w-16 h-16 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
          </div>

        </div>

      </div>
    </motion.div>
  );
}