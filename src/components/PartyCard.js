'use client';

import { useState } from 'react';
import Link from 'next/link'; // ✅ กลับมาใช้ Link
import { Check, Users, UserX, Ban, PlayCircle } from 'lucide-react'; // ใช้ไอคอน Play หรือ FileText ตามชอบ

export default function PartyCard({ party, isSelected, onSelect, variant = 'grid' }) {
  const isHero = variant === 'hero';
  
  const isVoteNo = party.number === 0 || party.number === '0';         
  const isDisapprove = party.number === -1 || party.number === '-1';   
  const isSpecialOption = isVoteNo || isDisapprove;                    

  const [imageError, setImageError] = useState(false);

  // 🎨 COLOR THEME
  let themeColor = 'purple'; 
  if (isVoteNo) themeColor = 'orange';
  if (isDisapprove) themeColor = 'red';

  const colorMap = {
    purple: {
      border: 'border-[#8A2680]',
      bg: 'bg-purple-50',
      text: 'text-[#8A2680]',
      badge: 'bg-[#8A2680]',
      shadow: 'shadow-purple-200'
    },
    red: {
      border: 'border-red-500',
      bg: 'bg-red-50',
      text: 'text-red-600',
      badge: 'bg-red-500',
      shadow: 'shadow-red-200'
    },
    orange: {
      border: 'border-orange-500',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      badge: 'bg-orange-500',
      shadow: 'shadow-orange-200'
    }
  };

  const theme = colorMap[themeColor];
  const SpecialIcon = isDisapprove ? UserX : Ban; 

  return (
    <div
      onClick={() => onSelect(party.id)}
      className={`
        relative group cursor-pointer flex flex-col items-center text-center select-none transition-all duration-300 ease-out
        bg-white overflow-hidden
        
        /* Shape & Shadow */
        ${isHero 
          ? 'rounded-2xl md:rounded-[2rem] shadow-sm md:shadow-xl hover:shadow-lg scale-[1.01]' 
          : 'rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 h-full'
        }

        /* Border Logic */
        border-2
        ${isSelected 
           ? `border-4 ${theme.border} ${theme.bg}` 
           : 'border-slate-100 hover:border-slate-300'
        }
      `}
    >
      {/* 1. Badge มุมซ้ายบน */}
      <div className={`
        absolute top-2 left-2 z-20 px-2 py-0.5 md:top-3 md:left-3 md:px-3 md:py-1 
        rounded-md font-black text-white text-[10px] md:text-xs tracking-wide shadow-sm
        ${isSelected ? theme.badge : (isSpecialOption ? 'bg-slate-400' : 'bg-slate-800')}
      `}>
        {isVoteNo ? 'NO VOTE' : isDisapprove ? 'NO' : `NO. ${party.number}`}
      </div>

      {/* 3. Content Body */}
      <div className={`
        w-full flex flex-col items-center flex-grow relative z-10
        ${isHero ? 'p-3 pt-8 pb-6 md:p-8 md:pt-12 md:pb-8' : 'p-3 pt-8 pb-4'}
      `}>
        
        {/* รูปโลโก้ */}
        <div className={`
          relative flex items-center justify-center rounded-full bg-white mb-2 md:mb-3
          border-[3px] overflow-hidden shadow-inner
          ${isSelected ? `${theme.border} ${theme.shadow} shadow-lg` : 'border-slate-100'}
          
          ${isHero 
            ? 'w-20 h-20 md:w-44 md:h-44' 
            : 'w-16 h-16 md:w-24 md:h-24'
          }
        `}>
          {isSpecialOption ? (
              <SpecialIcon className={`w-1/2 h-1/2 ${isSelected ? theme.text : 'text-slate-300'}`} />
          ) : (party.logoUrl && !imageError) ? (
              <img
                src={party.logoUrl}
                alt={party.name}
                className="w-full h-full object-contain p-2 transition-transform duration-500 hover:scale-110"
                onError={() => setImageError(true)}
              />
          ) : (
              <Users className="w-1/2 h-1/2 text-slate-300" />
          )}

          {/* Checkmark Overlay */}
          {isSelected && (
            <div className={`absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]`}>
               <div className={`p-1.5 rounded-full ${theme.badge} text-white shadow-lg animate-in zoom-in duration-200`}>
                  <Check size={isHero ? 24 : 16} strokeWidth={4} />
               </div>
            </div>
          )}
        </div>

        {/* ชื่อพรรค */}
        <h3 className={`
          font-black leading-tight line-clamp-2 w-full px-1 mb-1 transition-colors
          ${isHero ? 'text-base md:text-3xl' : 'text-xs md:text-base'}
          ${isSelected ? theme.text : 'text-slate-700'}
        `}>
          {party.name}
        </h3>

        {/* ✅ 4. Link ไปหน้าแยก (อยู่ตำแหน่งใหม่ ด้านล่าง) */}
        {!isSpecialOption && (
          <div className="mt-2 md:mt-3 z-30">
            <Link
              href={`/party?id=${party.number}&source=vote`} // หรือ path ที่คุณตั้งไว้
              onClick={(e) => e.stopPropagation()} // ✋ กันไม่ให้กดแล้วเลือกพรรค
              className={`
                flex items-center gap-1.5
                px-3 py-1 md:px-4 md:py-1.5
                rounded-full
                text-[10px] md:text-xs font-bold
                transition-all duration-200
                border
                ${isSelected 
                  ? 'bg-white/50 border-purple-200 text-purple-700 hover:bg-purple-100' 
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-[#8A2680] hover:text-[#8A2680] hover:shadow-sm'
                }
              `}
            >
              <span>ดูรายละเอียด</span>
              <PlayCircle size={12} className="md:w-3.5 md:h-3.5" />
            </Link>
          </div>
        )}

      </div>

      {/* Glow Effect */}
      {isSelected && (
        <div className={`absolute inset-0 z-0 opacity-10 bg-gradient-to-b from-transparent to-${themeColor}-500 pointer-events-none`}></div>
      )}
    </div>
  );
}