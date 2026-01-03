"use client";

import { useState } from "react"; // ✅ 1. เพิ่ม import useState
import { Users, FileText, XCircle } from "lucide-react";

export default function PartyCard({ party, isSelected, onSelect, onViewDetails, isVoteNo }) {
  // ✅ 2. สร้าง State สำหรับเช็คว่ารูปเสียหรือไม่
  const [imageError, setImageError] = useState(false);

  if (!party) return null;

  return (
    <div 
      onClick={() => onSelect(party.id)}
      className={`
        relative flex flex-col items-center text-center transition-all duration-200 cursor-pointer group bg-white border-2
        rounded-2xl md:rounded-[2rem] 
        p-5 md:p-6
        h-full justify-between
        
        ${isSelected 
          ? (isVoteNo 
              ? 'border-red-500 ring-2 ring-red-100 bg-red-50 shadow-lg scale-[1.02] z-10'
              : 'border-[#8A2680] ring-2 ring-purple-100 shadow-xl scale-[1.02] z-10'
            )
          : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
        }
      `}
    >
      {/* Checkmark */}
      {isSelected && (
        <div className={`absolute top-2 right-2 md:top-3 md:right-3 text-white rounded-full p-0.5 animate-scale-in z-20 ${isVoteNo ? 'bg-red-500' : 'bg-[#8A2680]'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </div>
      )}

      {/* --- Logo / Icon (ตรงกลาง) --- */}
      <div className={`
        mb-3 md:mb-4 p-0.5 md:p-1 rounded-full flex items-center justify-center overflow-hidden border-2 md:border-4 transition-all
        w-20 h-20 md:w-24 md:h-24 mx-auto shrink-0 bg-white
        ${isSelected 
           ? (isVoteNo ? 'border-red-500' : 'border-[#8A2680]') 
           : 'border-slate-50 group-hover:border-slate-200'
        }
      `}>
        {isVoteNo ? (
             // กรณีงดออกเสียง (ใช้ XCircle)
             <div className={`w-full h-full rounded-full flex items-center justify-center ${isSelected ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <XCircle className="w-10 h-10 md:w-12 md:h-12" />
             </div>
        ) : (party.logoUrl && !imageError) ? (
          // ✅ กรณีมี URL รูปภาพ และโหลดผ่าน (ใช้ object-contain + p-1 ให้รูปสวย)
          <img 
            src={party.logoUrl} 
            alt={party.name} 
            className="w-full h-full object-contain rounded-full p-1 bg-white"
            onError={() => setImageError(true)}
          />
        ) : (
           // ✅ Fallback Icon: แสดงเมื่อไม่มี URL หรือรูปเสีย
           <div className="w-full h-full rounded-full flex items-center justify-center bg-slate-100 text-slate-300">
             <Users className="w-8 h-8 md:w-10 md:h-10" />
           </div>
        )}
      </div>

      {/* --- ชื่อพรรค --- */}
      <h3 className={`
        font-bold mb-1 md:mb-2 line-clamp-2 w-full transition-colors leading-tight
        text-sm md:text-lg 
        ${isSelected 
            ? (isVoteNo ? 'text-red-600' : 'text-[#8A2680]') 
            : 'text-slate-800'
        }
      `}>
        {party.name}
      </h3>
      
      {/* --- เบอร์พรรค --- */}
      <span className={`
        font-bold rounded-full mb-3 md:mb-4
        text-xs px-3 py-1
        ${isVoteNo 
            ? (isSelected ? 'bg-red-200 text-red-800' : 'bg-slate-100 text-slate-500')
            : (isSelected ? 'bg-[#8A2680] text-white' : 'bg-purple-50 text-purple-700')
        }
      `}>
        {isVoteNo ? 'No Vote' : `เบอร์ ${party.number}`}
      </span>
      
      {/* --- ปุ่มดูรายละเอียด --- */}
      {!isVoteNo && (
          <div className="mt-auto w-full">
            <button 
              onClick={(e) => { e.stopPropagation(); onViewDetails(party); }}
              className="flex items-center justify-center gap-1 text-slate-500 hover:text-[#8A2680] transition-colors font-medium rounded-lg hover:bg-purple-50 w-full py-2 bg-slate-50"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs md:text-sm">ดูรายชื่อ</span>
            </button>
          </div>
      )}
    </div>
  );
}