'use client';
import { useState, useMemo } from 'react';
import { Anchor, Wind, User, Hand, Lock, Sun, Moon, Cloud } from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { DEFAULT_THEME } from "../utils/PartyTheme";

// 🔒 ZONE 1 & 2: Fixed Roles
const FIXED_ROLES = {
  PRESIDENT: "นายกสโมสรนักศึกษา",
  EXECUTIVES: [
    "อุปนายกกิจการภายใน",
    "อุปนายกกิจการภายนอก",
    "เลขานุการ",
    "เหรัญญิก"
  ]
};

// 🌊 ZONE 3: Hull Priority Sorting
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

// ✅ Optimized: ใช้ Bitwise เพื่อความเร็ว และลดการสร้าง String ใหม่
const hexToRgb = (hex) => {
  if (!hex) return '81, 101, 133'; // Default slate-600 ish
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export default function PartyChart({ members = [], theme: providedTheme, onMemberClick, partyName }) {

  // ✅ Optimized: Cache Priority Map เพื่อ Lookup แบบ O(1) แทน .indexOf O(N)
  const priorityMap = useMemo(() => 
    HULL_PRIORITY.reduce((acc, role, i) => ({ ...acc, [role]: i }), {}), 
  []);

  // ✅ Logic การจัดตำแหน่งคน
  const organizedData = useMemo(() => {
    const realMembers = members.filter(m => !m.isPlaceholder);
    const president = realMembers.find(m => m.position === FIXED_ROLES.PRESIDENT) || null;
    const executives = FIXED_ROLES.EXECUTIVES.map(role => 
      realMembers.find(m => m.position === role) || null
    );

    const usedIds = new Set([president?.id, ...executives.map(e => e?.id)].filter(Boolean));
    let crew = realMembers.filter(m => !usedIds.has(m.id));

    // Optimized Sort
    crew.sort((a, b) => {
      const pA = priorityMap[a.position] ?? 999;
      const pB = priorityMap[b.position] ?? 999;
      return pA - pB;
    });

    const crewGrid = [...crew, ...Array(Math.max(0, 15 - crew.length)).fill(null)].slice(0, Math.max(15, crew.length));
    return { president, executives, crewGrid };
  }, [members, priorityMap]);

  const { president, executives, crewGrid } = organizedData;
  const currentTheme = providedTheme || DEFAULT_THEME;
  const mainColor = currentTheme.main;
  
  // ✅ Optimized: Memoize RGB Calculation
  const mainRgb = useMemo(() => hexToRgb(mainColor), [mainColor]);
  
  const [isInteractive, setIsInteractive] = useState(false);
  const [isNightMode, setIsNightMode] = useState(true);

  // Particles: ดาว (Night)
  const stars = useMemo(() => [...Array(40)].map((_, i) => ({
    id: i, left: Math.random() * 100, top: Math.random() * 100,
    size: Math.random() * 2 + 1, opacity: Math.random() * 0.6,
    duration: Math.random() * 4 + 3
  })), []);

  // Particles: เมฆ (Day)
  const clouds = useMemo(() => [...Array(6)].map((_, i) => ({
    id: i, 
    left: Math.random() * 100, 
    top: Math.random() * 35, 
    scale: Math.random() * 0.8 + 0.8, 
    opacity: Math.random() * 0.3 + 0.5,
    duration: Math.random() * 30 + 40
  })), []);

  return (
    <div
      className="relative w-full h-full bg-[#02040a] overflow-hidden font-sans select-none flex flex-col lg:flex-row transition-colors duration-1000"
      style={{
        '--theme-main': mainColor,
        '--theme-rgb': mainRgb,
        backgroundColor: isNightMode ? '#02040a' : '#38bdf8'
      }}
    >
      <style jsx global>{`
        @keyframes shimmer { 0% { transform: translateX(-100%) skewX(-15deg); } 100% { transform: translateX(200%) skewX(-15deg); } }
        .group:hover .shimmer-effect { animation: shimmer 1s ease-in-out forwards; }
        @keyframes wave-drift { 0% { background-position-x: 0px; } 100% { background-position-x: 1000px; } }
        @keyframes sail-pulse { 
           0%, 100% { box-shadow: 0 0 15px rgba(var(--theme-rgb), 0.2); } 
           50% { box-shadow: 0 0 40px rgba(var(--theme-rgb), 0.5); } 
        }
        .hull-texture { 
           background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); 
           border-top: 4px solid var(--theme-main); 
           box-shadow: 0 20px 50px rgba(0,0,0,0.8); 
        }
        .crew-card { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        /* ✅ Optimization: Hardware Acceleration Hints */
        .will-change-transform { will-change: transform; }
        .will-change-opacity { will-change: opacity; }
      `}</style>

      {/* ================= BACKGROUND SYSTEM ================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-1000 ease-in-out">
        
        {/* ==================== 🌙 NIGHT THEME LAYER ==================== */}
        <div className={`absolute inset-0 transition-opacity duration-1000 will-change-opacity ${isNightMode ? 'opacity-100' : 'opacity-0'}`}>
            {/* 1. Night Sky */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_var(--tw-gradient-stops))] from-[#1e3a8a]/30 via-[#0f172a] to-[#020617]" />
            
            {/* 2. Aurora */}
            <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[100%] rounded-[100%] blur-[150px] opacity-40 mix-blend-screen animate-pulse will-change-transform"
              style={{ background: `radial-gradient(circle, ${mainColor} 0%, transparent 70%)`, animationDuration: '15s' }} 
            />

            {/* 3. Stars */}
            {stars.map((p) => (
              <div key={p.id} className="absolute bg-white rounded-full animate-pulse shadow-[0_0_3px_#ffffff80]" 
                style={{ left: `${p.left}%`, top: `${p.top * 0.6}%`, width: `${p.size}px`, height: `${p.size}px`, opacity: p.opacity, animationDuration: `${p.duration}s` }} 
              />
            ))}

            {/* 4. Deep Sea Water */}
            <div className="absolute bottom-0 w-full h-[25%] z-10 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#0a1229] to-[#0f172a]/80" />
               {/* Reflection */}
               <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[30%] h-[150%] blur-[40px] opacity-40 mix-blend-overlay will-change-transform"
                 style={{ background: `linear-gradient(to bottom, ${mainColor}, transparent)`, transform: 'perspective(500px) rotateX(60deg) scaleY(2)' }}
               />
            </div>
        </div>

        {/* ==================== ☀️ DAY THEME LAYER ==================== */}
        <div className={`absolute inset-0 transition-opacity duration-1000 will-change-opacity ${!isNightMode ? 'opacity-100' : 'opacity-0'}`}>
            {/* 1. Day Sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-blue-600" />

            {/* 2. Sun */}
            <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[80px] opacity-60 mix-blend-screen"
               style={{ background: 'radial-gradient(circle, #fef08a 0%, #facc15 40%, transparent 70%)' }} 
            />
            
            {/* 3. Moving Clouds */}
            {clouds.map((c) => (
               <div key={`cloud-${c.id}`} className="absolute text-white/60 blur-[2px] will-change-transform" 
                 style={{ 
                   left: `${c.left}%`, top: `${c.top}%`, 
                   transform: `scale(${c.scale})`, 
                   opacity: c.opacity,
                   animation: `wave-drift ${c.duration}s linear infinite` 
                 }}>
                 <Cloud size={120} fill="white" className="drop-shadow-lg" />
               </div>
            ))}

            {/* 4. Birds (SVG) */}
            <div className="absolute top-[15%] left-[20%] opacity-60 animate-pulse" style={{ animationDuration: '4s' }}>
                <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="white" strokeWidth="2"><path d="M0 10 Q 10 0, 20 10 T 40 10" /></svg>
            </div>
            <div className="absolute top-[18%] left-[23%] opacity-50 animate-pulse" style={{ animationDuration: '4.5s' }}>
                <svg width="30" height="15" viewBox="0 0 40 20" fill="none" stroke="white" strokeWidth="2"><path d="M0 10 Q 10 0, 20 10 T 40 10" /></svg>
            </div>

            {/* 5. Day Water */}
            <div className="absolute bottom-0 w-full h-[25%] z-10 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-700 to-blue-500/80" />
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-full blur-[50px] opacity-40 bg-yellow-200 mix-blend-overlay" />
               <div className="absolute inset-0 opacity-40 mix-blend-overlay will-change-transform"
                 style={{
                   backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                   animation: 'wave-drift 100s linear infinite',
                 }}
               />
            </div>
        </div>

        {/* ==================== COMMON LAYERS ==================== */}
        
        {/* Islands Silhouette */}
        <div className={`absolute bottom-[18%] left-0 w-full h-[20%] z-0 transition-colors duration-1000 ${isNightMode ? 'opacity-40 text-[#0f172a]' : 'opacity-60 text-blue-900'}`}>
            <svg className="w-full h-full fill-current" preserveAspectRatio="none" viewBox="0 0 1440 320"><path d="M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,213.3C672,203,768,213,864,229.3C960,245,1056,267,1152,266.7C1248,267,1344,245,1392,234.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
        </div>

        {/* Waves Animation */}
        <div className="absolute bottom-0 w-full h-[20%] z-20 pointer-events-none">
           <div className={`absolute bottom-0 w-[200%] h-full mix-blend-soft-light transition-opacity duration-1000 will-change-transform ${isNightMode ? 'opacity-20' : 'opacity-40'}`} 
             style={{ background: 'url("https://svgshare.com/i/sFq.svg") repeat-x', backgroundSize: '50% 100%', animation: 'wave-drift 40s linear infinite' }} 
           />
           <div className={`absolute bottom-[-5%] left-[-20%] w-[200%] h-[110%] mix-blend-soft-light transition-opacity duration-1000 will-change-transform ${isNightMode ? 'opacity-10' : 'opacity-30'}`} 
             style={{ background: 'url("https://svgshare.com/i/sFq.svg") repeat-x', backgroundSize: '50% 100%', animation: 'wave-drift 25s linear infinite reverse' }} 
           />
        </div>
        
        {/* Fog Overlay */}
        <div className={`absolute bottom-0 left-0 w-full h-[150px] bg-gradient-to-t transition-colors duration-1000 z-20 pointer-events-none ${isNightMode ? 'from-[#02040a] to-transparent' : 'from-[#1e3a8a] to-transparent'}`} />
      </div>

      {/* ================= CONTENT AREA ================= */}
      <div className="relative w-full h-full lg:flex-1 overflow-hidden z-10 order-2 lg:order-2">
        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-2">
          
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-md shadow-2xl transition-all active:scale-95 hover:-translate-y-1 
              ${isNightMode 
                ? 'bg-indigo-900/40 border-indigo-500/30 text-indigo-100 hover:bg-indigo-900/60' 
                : 'bg-sky-500/20 border-sky-400/50 text-sky-900 hover:bg-sky-500/30'
              }`}
          >
            {isNightMode ? <Moon size={18} className="text-yellow-200" /> : <Sun size={18} className="text-orange-500" />}
            <span className="text-xs font-bold tracking-wide uppercase">
              {isNightMode ? 'Night' : 'Day'}
            </span>
          </button>

          <button
            onClick={() => setIsInteractive(!isInteractive)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-md shadow-2xl transition-all active:scale-95 hover:-translate-y-1 ${isInteractive
              ? 'bg-red-500/20 border-red-500/50 text-red-100 hover:bg-red-500/40'
              : 'bg-black/40 border-white/20 text-white hover:bg-black/60'
              }`}
          >
            {isInteractive ? <Lock size={18} /> : <Hand size={18} />}
            <span className="text-xs font-bold tracking-wide uppercase">
              {isInteractive ? 'Lock View' : 'Pan & Zoom'}
            </span>
          </button>
        </div>

        <TransformWrapper
          disabled={!isInteractive}
          initialScale={1}
          minScale={0.2}
          maxScale={3}
          centerOnInit={true}
          smooth={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className={`absolute bottom-20 left-4 z-50 flex flex-col gap-2 transition-all duration-300 ${isInteractive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                <button onClick={() => zoomIn()} className="p-2 bg-black/50 text-white rounded-lg border border-white/10">+</button>
                <button onClick={() => zoomOut()} className="p-2 bg-black/50 text-white rounded-lg border border-white/10">-</button>
                <button onClick={() => resetTransform()} className="p-2 bg-amber-600/80 text-white rounded-lg hover:bg-amber-600">↺</button>
              </div>

              <TransformComponent wrapperClass="!w-full !h-full" contentClass="w-full h-full flex items-center justify-center">
                <div className={`
                    relative w-[1200px] h-[1050px] 
                    flex flex-col items-center justify-center origin-center
                    scale-[0.35] xs:scale-[0.45] sm:scale-[0.6]
                    md:scale-[0.8] lg:scale-[0.9] xl:scale-[0.75]
                    mt-0 md:mt-10
                    transition-transform duration-500 ease-out
                `}>

                  {/* เสากระโดง (Mast) */}
                  <div className="absolute bottom-[350px] left-1/2 -translate-x-1/2 w-4 h-[750px] z-0 shadow-2xl rounded-full"
                    style={{ background: `linear-gradient(to top, #1a1a1a, ${mainColor}40, #1a1a1a)` }} />

                  {/* 1. PRESIDENT */}
                  <div className="relative z-30 mb-2 flex flex-col items-center">
                    {president ? (
                      <div className="relative group cursor-pointer" onClick={() => onMemberClick(president)}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[60px] transition-all" style={{ backgroundColor: `${mainColor}20` }} />
                        <div className="w-[220px] relative">
                          <div className="absolute inset-0 backdrop-blur-sm border rounded-t-[100px] rounded-b-2xl transform scale-105 -z-10"
                            style={{ background: `linear-gradient(to bottom, ${mainColor}20, ${mainColor}40)`, borderColor: `${mainColor}40`, animation: 'sail-pulse 4s infinite' }} />
                          <div className="bg-[#0f172a] border-2 rounded-t-[90px] rounded-b-2xl overflow-hidden shadow-2xl relative h-[280px] group-hover:-translate-y-2 transition-transform duration-300" style={{ borderColor: `${mainColor}80` }}>
                            <div className="h-full w-full relative">
                              <MemberImage url={president.imageUrl} large />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90" />
                              <div className="absolute bottom-0 w-full p-4 text-center z-30">
                                <div className="inline-block mb-1 px-3 py-0.5 text-white text-[12px] font-black uppercase tracking-widest rounded shadow" style={{ backgroundColor: mainColor }}>{president.position}</div>
                                <h2 className="text-lg font-black text-white drop-shadow-md">{president.name}</h2>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-[220px] h-[280px] flex flex-col items-center justify-center opacity-30">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4"><Anchor size={32} /></div>
                        <span className="text-white/50 font-bold tracking-widest uppercase text-sm">ตำแหน่งว่าง</span>
                        <span className="text-white/30 text-[10px] mt-1">{FIXED_ROLES.PRESIDENT}</span>
                      </div>
                    )}
                  </div>

                  {/* 2. EXECUTIVES */}
                  <div className="relative z-20 w-[900px] flex justify-center items-start gap-8 mb-4">
                    <svg className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[850px] h-[100px] -z-10 overflow-visible" viewBox="0 0 850 100">
                      <path d="M0,20 Q425,80 850,20" fill="none" stroke="#2d3748" strokeWidth="8" strokeLinecap="round" />
                      <g stroke={mainColor} strokeWidth="1" opacity="0.4">
                        <line x1="120" y1="35" x2="425" y2="-100" /> <line x1="300" y1="55" x2="425" y2="-100" />
                        <line x1="550" y1="55" x2="425" y2="-100" /> <line x1="730" y1="35" x2="425" y2="-100" />
                      </g>
                    </svg>
                    {executives.map((member, idx) => (
                      <div key={idx} className="relative group" style={{ marginTop: (idx === 1 || idx === 2) ? '45px' : '10px' }}>
                        {member ? (
                          <div
                            className="w-36 bg-[#1e293b] border border-white/10 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 relative cursor-pointer"
                            onClick={() => onMemberClick(member)}
                          >
                            <div className="h-32 w-full relative">
                              <MemberImage url={member.imageUrl} />
                            </div>
                            <div className="p-2 bg-[#0f172a] text-center border-t border-white/5">
                              <h4 className="text-[12px] font-bold text-white truncate group-hover:text-[var(--theme-main)]">{member.name}</h4>
                              <p className="text-[10px] text-slate-400 uppercase truncate">{member.position}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-36 h-48 rounded-lg border border-white/5 bg-white/5 flex flex-col items-center justify-center opacity-30 border-dashed">
                            <User size={24} className="mb-2" />
                            <span className="text-[10px] uppercase font-bold text-white/50 text-center px-2">
                              {FIXED_ROLES.EXECUTIVES[idx]}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 3. THE HULL (ท้องเรือ) */}
                  <div className="relative z-20 -mt-4">
                    <div className="w-[1100px] min-h-[420px] hull-texture rounded-b-[200px] rounded-t-[50px] relative px-10 py-8 flex flex-col items-center">
                      <div className="absolute top-2 text-white/5 text-[80px] font-black uppercase tracking-[0.2em] pointer-events-none select-none text-center w-full leading-none">
                        {partyName || 'FMS ELECTION'}
                      </div>

                      <div className="grid grid-cols-5 gap-3 z-10 w-full max-w-[950px]">
                        {crewGrid.map((member, idx) => (
                          member ? (
                            <div
                              key={member.id}
                              className="group relative cursor-pointer h-[120px] rounded-xl overflow-hidden border border-white/10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:z-50 hover:shadow-[0_0_15px_rgba(var(--theme-rgb),0.4)]"
                              onClick={() => onMemberClick(member)}
                              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                            >
                              <div className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-110">
                                <MemberImage url={member.imageUrl} />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-black/20 to-transparent opacity-90" />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300 mix-blend-overlay" style={{ backgroundColor: mainColor }} />

                              <div className="absolute bottom-0 w-full p-1.5 flex flex-col items-center justify-end">
                                <p className="text-[10px] font-bold text-white truncate w-full text-center drop-shadow-md group-hover:text-[var(--theme-main)] transition-colors">
                                  {member.position}
                                </p>
                                <p className="text-[9px] text-slate-300 truncate w-full text-center opacity-80">
                                  {member.name}
                                </p>
                                <div className="h-[2px] w-0 group-hover:w-1/2 mt-0.5 transition-all duration-300 rounded-full" style={{ backgroundColor: mainColor }} />
                              </div>
                              <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--theme-main)] rounded-xl pointer-events-none transition-colors duration-300" />
                            </div>
                          ) : (
                            <div key={`empty-${idx}`} className="h-[120px] rounded-xl border border-white/5 bg-white/5 flex items-center justify-center opacity-20">
                              <Anchor size={16} />
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
}

// ✅ Optimized: ใช้ memoize ภายใน component ใหญ่ หรือแยกไฟล์ก็ได้ แต่ในที่นี้เน้นใส่ decoding="async"
function MemberImage({ url, large = false }) {
  const [error, setError] = useState(false);
  
  if (error || !url) return (
    <div className={`w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 ${large ? 'bg-[#162032] text-slate-600' : ''}`}>
      <Wind size={large ? 32 : 16} className="opacity-40" />
    </div>
  );

  return (
    <img 
      src={url} 
      alt="" 
      decoding="async" 
      loading="lazy"
      className="w-full h-full object-cover" 
      onError={() => setError(true)} 
    />
  );
}