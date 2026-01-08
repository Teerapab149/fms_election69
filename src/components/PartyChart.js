'use client';
import { useState, useMemo } from 'react';
import { Anchor, Wind, User, ChevronRight, Lock, Unlock, Hand, X, List, ChevronDown, ChevronLeft } from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { DEFAULT_THEME } from "../utils/PartyTheme";

const hexToRgb = (hex) => {
  if (!hex) return '51, 65, 85';
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export default function PartyChart({ members = [], theme: providedTheme, onMemberClick }) {
  const president = members[0];
  const executives = members.slice(1, 5);
  const crewRaw = members.slice(5);
  const crewGrid = [...crewRaw, ...Array(Math.max(0, 15 - crewRaw.length)).fill(null)].slice(0, 15);
  const allMembersList = members.filter(m => m);

  const currentTheme = providedTheme || DEFAULT_THEME;
  const mainColor = currentTheme.main;
  const mainRgb = hexToRgb(mainColor);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const particles = useMemo(() => [...Array(40)].map((_, i) => ({
    id: i, left: Math.random() * 100, top: Math.random() * 100,
    size: Math.random() * 2 + 1, opacity: Math.random() * 0.6,
    duration: Math.random() * 4 + 3
  })), []);

  return (
    <div
      className="relative w-full h-full bg-[#02040a] overflow-hidden font-sans select-none flex flex-col lg:flex-row"
      style={{
        '--theme-main': mainColor,
        '--theme-rgb': mainRgb,
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
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: var(--theme-main); }
      `}</style>

      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#020617]" />
        <div className="absolute top-[-10%] right-[20%] -translate-x-1/2 w-[800px] h-[500px] blur-[100px] rounded-full opacity-20 transition-colors duration-1000" style={{ backgroundColor: mainColor }} />
        {particles.map(p => (
          <div key={p.id} className="absolute bg-white rounded-full animate-pulse" style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.size}px`, height: `${p.size}px`, opacity: p.opacity, animationDuration: `${p.duration}s` }} />
        ))}
        <div className="absolute bottom-0 w-full h-[200px] overflow-hidden">
          <div className="absolute bottom-0 w-[200%] h-full opacity-10" style={{ background: 'url("https://svgshare.com/i/sFq.svg") repeat-x', backgroundSize: '50% 100%', animation: 'wave-drift 60s linear infinite' }} />
        </div>
      </div>

      {/* ================= RIGHT COLUMN: SHIP CHART AREA (70%) ================= */}
      <div className="relative w-full h-full lg:flex-1 overflow-hidden z-10 order-2 lg:order-2">
        {/* ปุ่มควบคุม Lock/Unlock (ย้ายมาตรงกลางล่าง) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-2">
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

        <TransformWrapper disabled={!isInteractive} initialScale={0.5} minScale={0.3} maxScale={2} centerOnInit={true} smooth={true}>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className={`absolute bottom-20 left-4 z-50 flex flex-col gap-2 transition-all duration-300 ${isInteractive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                <button onClick={() => zoomIn()} className="p-2 bg-black/50 text-white rounded-lg border border-white/10">+</button>
                <button onClick={() => zoomOut()} className="p-2 bg-black/50 text-white rounded-lg border border-white/10">-</button>
                <button onClick={() => resetTransform()} className="p-2 bg-amber-600/80 text-white rounded-lg hover:bg-amber-600">↺</button>
              </div>

              <TransformComponent wrapperClass="!w-full !h-full" contentClass="w-full h-full flex items-center justify-center">
                <div className="relative w-[1200px] h-[1050px] flex flex-col items-center justify-center origin-center scale-75 md:scale-90 lg:scale-100">
                  {/* Mast */}
                  <div className="absolute bottom-[350px] left-1/2 -translate-x-1/2 w-4 h-[750px] z-0 shadow-2xl rounded-full"
                    style={{ background: `linear-gradient(to top, #1a1a1a, ${mainColor}40, #1a1a1a)` }} />

                  {/* 1. PRESIDENT */}
                  <div className="relative z-30 mb-2 flex flex-col items-center">
                    {president && (
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
                    )}
                  </div>

                  {/* 2. EXECUTIVES & CREW (Hull) */}
                  <div className="relative z-20 w-[900px] flex justify-center items-start gap-8 mb-4">
                    <svg className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[850px] h-[100px] -z-10 overflow-visible" viewBox="0 0 850 100">
                      <path d="M0,20 Q425,80 850,20" fill="none" stroke="#2d3748" strokeWidth="8" strokeLinecap="round" />
                      <g stroke={mainColor} strokeWidth="1" opacity="0.4">
                        <line x1="120" y1="35" x2="425" y2="-100" /> <line x1="300" y1="55" x2="425" y2="-100" />
                        <line x1="550" y1="55" x2="425" y2="-100" /> <line x1="730" y1="35" x2="425" y2="-100" />
                      </g>
                    </svg>
                    {executives.map((member, idx) => (
                      <div key={member.id} className="relative group cursor-pointer" style={{ marginTop: (idx === 1 || idx === 2) ? '45px' : '10px' }} onClick={() => onMemberClick(member)}>
                        <div className="w-36 bg-[#1e293b] border border-white/10 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 relative">
                          <div className="h-32 w-full relative">
                            <MemberImage url={member.imageUrl} />
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 text-white text-[9px] font-bold rounded" style={{ backgroundColor: mainColor }}>{idx + 2}</div>
                          </div>
                          <div className="p-2 bg-[#0f172a] text-center border-t border-white/5">
                            <h4 className="text-[12px] font-bold text-white truncate group-hover:text-[var(--theme-main)]">{member.name}</h4>
                            <p className="text-[12px] text-slate-400 uppercase">{member.position}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 3. THE HULL (ท้องเรือ) */}
                  <div className="relative z-20 -mt-4">

                    {/* ✅ Container ท้องเรือ (ยังคงอยู่เหมือนเดิม) */}
                    <div className="w-[1100px] min-h-[420px] hull-texture rounded-b-[200px] rounded-t-[50px] relative px-10 py-8 flex flex-col items-center">

                      {/* ชื่อพรรคจางๆ เป็น Background */}
                      <div className="absolute top-2 text-white/5 text-[80px] font-black uppercase tracking-[0.2em] pointer-events-none select-none text-center w-full leading-none">
                        {currentTheme?.name || 'VANGUARD'}
                      </div>

                      {/* ✅ Grid การ์ดสมาชิกแบบ Full Frame */}
                      <div className="grid grid-cols-5 gap-3 z-10 w-full max-w-[950px]">
                        {crewGrid.map((member, idx) => (
                          member ? (
                            <div
                              key={member.id}
                              className="group relative cursor-pointer h-[120px] rounded-xl overflow-hidden border border-white/10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:z-50 hover:shadow-[0_0_15px_rgba(var(--theme-rgb),0.4)]"
                              onClick={() => onMemberClick(member)}
                              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                            >

                              {/* 1. รูปภาพ (ขยายเต็มพื้นที่) */}
                              <div className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-110">
                                <MemberImage url={member.imageUrl} />
                              </div>

                              {/* 2. Gradient Overlay (ไล่สีดำด้านล่าง ให้อ่านตัวหนังสือออก) */}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-black/20 to-transparent opacity-90" />

                              {/* 3. แสงสีพรรคจางๆ (Theme Tint Overlay) */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300 mix-blend-overlay"
                                style={{ backgroundColor: mainColor }} />

                              {/* 4. ข้อมูล (วางซ้อนด้านล่าง) */}
                              <div className="absolute bottom-0 w-full p-1.5 flex flex-col items-center justify-end">
                                {/* ตำแหน่งสมาชิก */}
                                <p className="text-[10px] font-bold text-white truncate w-full text-center drop-shadow-md group-hover:text-[var(--theme-main)] transition-colors">
                                  {member.position}
                                </p>
                                {/* ขีดเส้นใต้สีพรรค */}
                                <div className="h-[2px] w-0 group-hover:w-1/2 mt-0.5 transition-all duration-300 rounded-full"
                                  style={{ backgroundColor: mainColor }} />
                              </div>

                              {/* กรอบเรืองแสงเมื่อ Hover */}
                              <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--theme-main)] rounded-xl pointer-events-none transition-colors duration-300" />

                            </div>
                          ) : (
                            // ช่องว่าง (Empty Slot)
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

function MemberList({ members, currentTheme, onMemberClick }) {
  const mainColor = currentTheme.main;
  const textColor = currentTheme.textOnDark; // ✅ ใช้สี Text สำหรับพื้นหลังมืด

  return (
    <>
      {members.map((member, index) => {
        let positionTitle = member.position || "สมาชิกพรรค";

        // กำหนดชื่อตำแหน่งตามลำดับความสำคัญ
        if (index === 0) positionTitle = "นายกสโมสรนักศึกษา";
        else if (index >= 1 && index <= 4) positionTitle = "คณะกรรมการบริหาร";

        return (
          <div
            key={member.id || index}
            onClick={() => onMemberClick(member)}
            className="group flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-[#162032]/40 cursor-pointer transition-all duration-300 hover:bg-[#1e293b] hover:border-white/20 active:scale-[0.98] relative overflow-hidden"
          >
            {/* ✅ เลขลำดับ: จัดเป็นวงกลมด้านในแถวให้ดูปกติและสะอาดตา */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black transition-all duration-300 group-hover:scale-110"
              style={{
                backgroundColor: `${mainColor}15`,
                borderColor: index === 0 ? mainColor : 'rgba(255,255,255,0.1)',
                color: index === 0 ? mainColor : '#94a3b8'
              }}
            >
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              {/* ✅ โชว์แค่ชื่อตำแหน่ง และใช้สี textOnDark */}
              <h4
                className="text-sm font-bold truncate transition-colors"
                style={{ color: textColor }}
              >
                {positionTitle}
              </h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.1em] mt-0.5 font-medium">
                คลิกดูรายละเอียด
              </p>
            </div>

            <ChevronRight
              size={16}
              className="text-slate-600 transition-all transform group-hover:translate-x-1"
              style={{ color: index === 0 ? mainColor : undefined }}
            />

            {/* แถบสีด้านล่างแสดงเอกลักษณ์พรรคตอน Hover */}
            <div
              className="absolute bottom-0 left-0 w-full h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
              style={{ backgroundColor: mainColor }}
            />
          </div>
        );
      })}
    </>
  );
}

function MemberImage({ url, large = false }) {
  const [error, setError] = useState(false);
  if (error || !url) return (
    <div className={`w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 ${large ? 'bg-[#162032] text-slate-600' : ''}`}>
      <Wind size={large ? 32 : 16} className="opacity-40" />
    </div>
  );
  return <img src={url} alt="" className="w-full h-full object-cover" onError={() => setError(true)} />;
}