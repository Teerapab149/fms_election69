// components/MeetCandidatesCard.js
"use client";

import Link from 'next/link';
import { useRef, useCallback } from "react";
import { ArrowRight, Sparkles, Users, Vote, Star } from "lucide-react";
import EditorElement from "./admin/editor/EditorElement";
import { RADIUS_MAP } from "../utils/styleMaps";

// Animated glow gradient (kept "to right", animated via .animate-gradient-xy).
function buildGlowStyle(cfg) {
  if (!cfg || !cfg.glowFrom) return undefined;
  const parts = [cfg.glowFrom, cfg.glowVia, cfg.glowTo].filter(Boolean);
  const s = { backgroundImage: `linear-gradient(to right, ${parts.join(", ")})` };
  // Day 7a: borderRadius now falls back to Layer 1 token when cfg unset.
  s.borderRadius = (cfg.borderRadius && RADIUS_MAP[cfg.borderRadius]) || 'var(--radius-card)';
  return s;
}

// Card body surface (background + radius).
// Day 5: explicit cfg values stay (Layer 3); unset bg falls back to
// var(--color-surface). Classic still sets bg=#ffffff → byte-faithful.
function buildBodyStyle(cfg) {
  if (!cfg) return undefined;
  const s = {};
  s.backgroundColor = cfg.backgroundColor || 'var(--color-surface)';
  // Day 7a: borderRadius now falls back to Layer 1 token when cfg unset.
  s.borderRadius = (cfg.borderRadius && RADIUS_MAP[cfg.borderRadius]) || 'var(--radius-card)';
  return s;
}

// CTA pill (background + text + radius). Day 5: token fallback for bg/text.
function buildCtaStyle(cfg) {
  if (!cfg) return undefined;
  const s = {};
  s.backgroundColor = cfg.backgroundColor || 'var(--color-text)';
  s.color = cfg.textColor || 'var(--color-surface)';
  // Day 7a: borderRadius falls back to --radius-button (pill) when cfg unset.
  s.borderRadius = (cfg.borderRadius && RADIUS_MAP[cfg.borderRadius]) || 'var(--radius-button)';
  return s;
}

export default function MeetCandidatesCard({
  resolvedTemplate = null,
  editorMode = false,
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
  elementConfigs = null,
}) {
  // Dual-channel flat config read (editor elementConfigs / live resolvedTemplate).
  const getCardConfig = (id) =>
    elementConfigs?.[id]?.config ?? resolvedTemplate?.elements?.[id]?.config ?? null;
  const sectionCfg = getCardConfig("meet-section");
  const titleCfg = getCardConfig("meet-title");
  const ctaCfg = getCardConfig("meet-cta");
  const hasSection = !!sectionCfg && Object.keys(sectionCfg).length > 0;
  const hasTitle = !!titleCfg && !!titleCfg.color;
  const hasCta = !!ctaCfg && Object.keys(ctaCfg).length > 0;
  // Light surface layers (overlay + dots + blobs) render in legacy mode and
  // whenever the active template keeps surfaceLight !== false (P-LOG-015).
  const showSurfaceLight = !hasSection || sectionCfg.surfaceLight !== false;

  // Stable Wrap identity (see HomeContent for rationale): inline definition
  // remounts the subtree on every hover re-render → animation flicker.
  const editorStateRef = useRef(null);
  editorStateRef.current = {
    editorMode, elementConfigs, selectedElement, hoveredElement,
    onSelectElement, onHoverElement, onHoverEnd,
  };
  const Wrap = useCallback(({ id, children }) => {
    const s = editorStateRef.current;
    if (!s.editorMode) return children;
    return (
      <EditorElement
        id={id}
        config={s.elementConfigs?.[id]}
        isSelected={s.selectedElement === id}
        isHovered={s.hoveredElement === id}
        onSelect={s.onSelectElement}
        onHover={s.onHoverElement}
        onHoverEnd={s.onHoverEnd}
      >{children}</EditorElement>
    );
  }, []);

  return (
    <Link href="/candidates" className="group relative block w-full h-full">

      {/* ✨ 1. BACKGROUND GLOW (ลดความฟุ้งลงนิดนึงเพื่อให้ดูกระชับ) */}
      {/* Animated glow — colors data-driven, motion (animate-gradient-xy) preserved. */}
      <div
        className={`absolute -inset-[1px] rounded-[24px] opacity-60 blur-sm transition-all duration-500 group-hover:opacity-100 group-hover:blur-md animate-gradient-xy ${hasSection ? "" : "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400"}`}
        style={buildGlowStyle(sectionCfg)}
      ></div>

      {/* ✨ 2. MAIN CARD BODY */}
      {/* ปรับ p-4 (จากเดิม p-6) เพื่อลดความสูง */}
      <div
        className={`relative h-full w-full overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-[0.995] ${hasSection ? "" : "rounded-[22px] bg-white"}`}
        style={buildBodyStyle(sectionCfg)}
      >

         {/* Light surface layers — only in light templates / legacy mode */}
         {showSurfaceLight && (
           <>
             <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/50 to-pink-50/30"></div>
             <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#6d28d9 1px, transparent 1px)', backgroundSize: '14px 14px' }}></div>

             {/* Blobs (ปรับขนาดเล็กลง) */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200/50 rounded-full blur-2xl animate-pulse"></div>
             <div className="absolute -bottom-10 -left-5 w-32 h-32 bg-pink-200/50 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
           </>
         )}

         {/* Shine Effect */}
         <div className="absolute inset-0 z-20 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:animate-shine pointer-events-none" />


         {/* ================= CONTENT CONTAINER ================= */}
         {/* ✅ Key Change: บังคับ flex-row (แนวนอน) ตลอดเวลา เพื่อลดความสูง */}
         <div className="relative z-10 flex flex-row items-center justify-between p-4 sm:p-5 h-full gap-2 sm:gap-4">

            {/* --- LEFT: Typography (ย่อขนาดลง) --- */}
            <div className="flex flex-col items-start justify-center z-10 flex-1 min-w-0">

               {/* Badge */}
               <div className="inline-flex items-center gap-1.5 mb-1.5 px-2 py-1 rounded-full bg-white/80 border border-purple-100 shadow-sm backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                  </span>
                  <span className="text-[11px] font-extrabold tracking-widest uppercase text-purple-700">
                     FMS ELECTION 2026
                  </span>
               </div>

               {/* Heading (ปรับ text-xl / text-2xl ให้ไม่ใหญ่คับกล่อง) */}
               <Wrap id="meet-title">
                 <h3
                   className={`text-xl sm:text-3xl font-black leading-[1.1] tracking-tight drop-shadow-sm mb-2 ${hasTitle ? "" : "text-slate-900"}`}
                   style={hasTitle ? { color: titleCfg.color } : undefined}
                 >
                    รู้จักผู้สมัคร<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                       ของคุณหรือยัง?
                    </span>
                 </h3>
               </Wrap>

               {/* Button / CTA (Compact Version) */}
               <Wrap id="meet-cta">
                 <div
                   className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs sm:text-sm shadow-md shadow-purple-200 transition-all duration-300 group-hover:bg-purple-600 group-hover:shadow-purple-400/50 group-hover:translate-x-1 ${hasCta ? "" : "rounded-full bg-slate-900 text-white"}`}
                   style={buildCtaStyle(ctaCfg)}
                 >
                     <span className="whitespace-nowrap">ดูรายชื่อพรรค</span>
                     <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                 </div>
               </Wrap>
            </div>


            {/* --- RIGHT: Compact Floating Scene (ลดขนาดลงครึ่งนึง) --- */}
            <div className="relative w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] shrink-0 flex items-center justify-center pointer-events-none">

               {/* Card Stack Background */}
               <div className="absolute rotate-6 w-16 h-20 sm:w-20 sm:h-24 bg-white border border-purple-100 rounded-lg shadow-sm z-0 scale-90 translate-x-2 opacity-60"></div>

               {/* Main Icon Container (เล็กลง) */}
               <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-300/50 flex items-center justify-center rotate-[-6deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-500">
                  <Users className="text-white w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent rounded-xl opacity-50"></div>
               </div>

               {/* Floating Star */}
               <div className="absolute -top-1 right-2 bg-yellow-400 text-white p-1 rounded-md shadow-md rotate-12 animate-bounce z-20">
                  <Star size={10} fill="currentColor" />
               </div>

               {/* Vote Icon */}
               <div className="absolute -bottom-1 left-2 bg-white text-purple-600 p-1.5 rounded-lg border border-purple-100 shadow-md -rotate-12 z-20">
                  <Vote size={12} />
               </div>

            </div>

         </div>

      </div>

      <style jsx>{`
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 3s ease infinite;
        }
      `}</style>
    </Link>
  );
}
