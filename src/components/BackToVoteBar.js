'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, Vote } from 'lucide-react';

export default function BackToVoteBar() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    // Delay เล็กน้อยเพื่อให้ Animation ทำงานตอนโหลดหน้า
    const timer = setTimeout(() => setIsMounting(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`
        fixed bottom-6 right-6 z-[999] flex flex-col items-end pointer-events-none
        transition-transform duration-700 ease-out
        ${isMounting ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}
      `}
    >
      
      <div 
        className={`
          pointer-events-auto
          relative flex items-center justify-end
          bg-white/95 backdrop-blur-xl
          shadow-[0_8px_30px_rgba(0,0,0,0.12)] 
          border border-slate-100 
          rounded-full 
          overflow-hidden
          /* ✅ ใช้ h-14 ล็อคความสูงไว้เลย เพื่อป้องกันการกระตุกแนวตั้ง */
          h-14
          /* ✅ Transition ที่ Wrapper หลัก เพื่อความสมูทของ Border/Shadow */
          transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        `}
      >

        {/* --- ส่วนเนื้อหา (The Sliding Content) --- */}
        <div 
          className={`
            overflow-hidden
            transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            /* ✅ ใช้ max-width ในการคุมการเปิดปิด แทน grid */
            ${isExpanded ? 'max-w-[300px] opacity-100' : 'max-w-0 opacity-0'}
          `}
        >
          {/* ✅ เคล็ดลับความสมูท: 
             กำหนด min-w-max เพื่อให้เนื้อหาข้างใน "มีความกว้างเท่าเดิมเสมอ" 
             แม้ว่ากล่องแม่จะหดลง ข้อความจะไม่ reflow หรือขึ้นบรรทัดใหม่ 
          */}
          <div className="min-w-max flex items-center">
            <button
              onClick={() => router.push('/vote')}
              className="group flex items-center gap-3 pl-2 pr-6 py-1.5 h-14 hover:bg-slate-50 transition-colors"
            >
              <div className="bg-[#8A2680] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0 ml-1">
                 <ArrowLeft size={20} />
              </div>
              <div className="flex flex-col text-left">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">Review Completed?</span>
                 <span className="text-sm font-black text-slate-800 leading-none group-hover:text-[#8A2680] transition-colors">กลับไปเลือกตั้ง</span>
              </div>
              {/* เส้นคั่นแนวตั้ง */}
              <div className="w-px h-6 bg-slate-200 ml-4 mr-1"></div>
            </button>
          </div>
        </div>

        {/* --- ปุ่ม Trigger (ปุ่มขวาสุด) --- */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            relative w-14 h-14 flex items-center justify-center shrink-0
            z-10 rounded-full cursor-pointer
            transition-colors duration-300
            ${isExpanded 
              ? 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100' 
              : 'bg-[#8A2680] text-white hover:bg-[#701e68] shadow-md'
            }
          `}
        >
          {/* Effect: Pulse (วงแหวนเต้น) */}
          {!isExpanded && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-20 animate-ping duration-1000"></span>
          )}

          {/* Icon Rotator Wrapper */}
          <div className={`
             relative w-full h-full flex items-center justify-center
             transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
             ${isExpanded ? 'rotate-0' : 'rotate-90'}
          `}>
             {/* ไอคอน X */}
             <X 
               size={22} 
               className={`absolute transition-all duration-300 ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} 
             />
             
             {/* ไอคอน Vote */}
             <Vote 
               size={24} 
               // หมุน -90 เพื่อแก้ทางกับการหมุนของ Parent ทำให้ไอคอนดูตั้งตรงตลอดเวลา
               className={`absolute transition-all duration-300 ${!isExpanded ? 'opacity-100 scale-100 -rotate-90' : 'opacity-0 scale-50 rotate-0'}`} 
             />
          </div>
        </button>

      </div>
    </div>
  );
}