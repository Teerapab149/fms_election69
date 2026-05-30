"use client";

import { useState } from "react";
import { Trophy, Users, Ban, UserX, Activity, Lock, Clock } from "lucide-react";
import { getPath } from "../utils/basePath";

export default function ResultCard({ candidate, rank, totalVotes, status, isRevealed, onClick }) {
  const [imageError, setImageError] = useState(false);

  // ✅ 1. แยกสถานะ (รับค่า status ที่คำนวณมาจาก Config ในหน้า Page)
  const isEnded = status === "ENDED";
  const isOngoing = status === "ONGOING";
  // รวมสถานะ PRE_CAMPAIGN เข้ากับ WAITING เพื่อความปลอดภัย (กรณีเผลอเรนเดอร์การ์ดก่อนเวลา)
  const isWaiting = status === "WAITING" || status === "PRE_CAMPAIGN" || status === "CLOSED";

  // ⚡️ Revised Logic: Show Score ONLY if Revealed (even if Ended)
  // User Requirement: If ended but not revealed, show "Hidden" style (not 0)
  const showScore = (isEnded || isOngoing) && isRevealed;
  const showHidden = (isEnded || isOngoing) && !isRevealed;

  const percentage = totalVotes > 0 ? (candidate.score / totalVotes) * 100 : 0;
  const isWinner = showScore && rank === 1; // ใช้ showScore แทน isEnded เพื่อให้ Highlight คนชนะตอน Reveal

  let imageSrc = candidate.image || (candidate.logoUrl ? `${candidate.logoUrl}` : null);
  if (imageSrc && imageSrc.startsWith('/images/')) {
    imageSrc = getPath(imageSrc);
  }

  const isVoteNo = candidate.number == 0;
  const isDisapprove = candidate.number == -1;

  // --- Visual Content (จัดการรูปภาพ/ไอคอน) ---
  let visualContent;
  if (isVoteNo) {
    visualContent = (
      <div className={`w-full h-full flex items-center justify-center ${isWinner ? 'bg-orange-100 text-orange-500' : 'bg-orange-50 text-orange-500'}`}>
        <Ban className={`${isWinner ? "w-16 h-16" : "w-8 h-8"} lg:w-24 lg:h-24 transition-all`} strokeWidth={2} />
      </div>
    );
  } else if (isDisapprove) {
    visualContent = (
      <div className={`w-full h-full flex items-center justify-center ${isWinner ? 'bg-red-100 text-red-600' : 'bg-red-50 text-red-500'}`}>
        <UserX className={`${isWinner ? "w-16 h-16" : "w-8 h-8"} lg:w-24 lg:h-24 transition-all`} strokeWidth={2} />
      </div>
    );
  } else if (imageSrc && !imageError) {
    visualContent = (
      <img
        src={imageSrc}
        alt={candidate.name}
        className="object-contain w-full h-full bg-white p-1 group-hover:scale-105 transition-transform duration-500"
        onError={() => setImageError(true)}
      />
    );
  } else {
    visualContent = (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
        <Users className={`${isWinner ? "w-12 h-12" : "w-6 h-6"} lg:w-20 lg:h-20 transition-all`} />
      </div>
    );
  }

  const getSubText = () => {
    if (isVoteNo) return "Abstain";
    if (isDisapprove) return "Disapprove";
    return `เบอร์ ${candidate.number}`;
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative cursor-pointer overflow-hidden bg-white transition-all duration-300
        
        /* Layout Mobile: แนวนอน */
        flex ${isWinner ? 'flex-col rounded-2xl border shadow-sm mb-2' : 'flex-row items-center border-b border-slate-100 last:border-0 rounded-none py-2'}
        
        /* Layout Desktop: แนวตั้ง (Card) */
        lg:flex-col lg:items-stretch lg:rounded-2xl lg:border lg:shadow-none lg:py-0 lg:mb-0
        
        ${isWinner
          ? 'border-yellow-400 ring-2 ring-yellow-400/20 shadow-yellow-100 z-10'
          : 'hover:bg-slate-50 lg:hover:border-purple-200'
        }
      `}
    >
      {/* 🔴 LIVE Badge (แสดงเฉพาะตอนเลือกตั้งอยู่) */}
      {isOngoing && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-red-100 text-red-600 px-2 py-1 rounded-full text-[10px] font-bold border border-red-200 animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          LIVE
        </div>
      )}

      {/* === ส่วนที่ 1: รูปภาพ === */}
      <div className={`
          relative shrink-0 overflow-hidden
          ${isWinner ? 'w-full aspect-[16/9]' : 'w-14 h-14 rounded-full ml-3 border border-slate-200'}
          lg:w-full lg:h-48 lg:aspect-[4/3] lg:rounded-none lg:ml-0 lg:border-0
      `}>
        {visualContent}

        {/* Badge อันดับ (แสดงเฉพาะตอนจบเลือกตั้ง หรือขณะแข่งที่เปิดเผยคะแนน) */}
        {!isWaiting && (
          <div className={`
              absolute top-0 left-0 flex items-center justify-center font-bold text-white shadow-sm
              ${isWinner ? 'w-8 h-8 lg:w-10 lg:h-10 text-sm lg:text-lg rounded-br-xl bg-yellow-500' : 'hidden lg:flex w-10 h-10 text-lg rounded-br-xl bg-[var(--color-primary,#8A2680)]'}
              ${showHidden ? 'bg-slate-400' : ''} 
          `}>
            {showScore ? `#${rank}` : "?"}
          </div>
        )}
      </div>

      {/* === ส่วนที่ 2: ข้อมูล === */}
      <div className={`
          flex flex-col justify-center min-w-0 flex-1
          ${isWinner ? 'p-4' : 'p-3 pl-4'} lg:p-5
      `}>
        <div className="flex justify-between items-start mb-1 lg:mb-3 gap-2">
          <div className="min-w-0 flex-1">
            <h3 className={`font-bold text-slate-800 truncate leading-tight group-hover:text-[var(--color-primary,#8A2680)] transition-colors ${isWinner ? 'text-lg' : 'text-base'} lg:text-lg`}>
              {candidate.name || "ไม่ระบุชื่อพรรค"}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-slate-500">
              <p className="text-xs">{getSubText()}</p>
              {!isWinner && showScore && (
                <span className="lg:hidden text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-bold">
                  #{rank}
                </span>
              )}
            </div>
          </div>
          {isWinner && <Trophy className="w-5 h-5 text-yellow-500 animate-bounce shrink-0" />}
        </div>

        {/* ✅ ส่วนแสดงผลคะแนน (เปลี่ยนไปตาม Status) */}
        <div className="mt-auto w-full">

          {/* กรณี 1: จบแล้ว (ENDED) หรือ สั่งเปิด (Reveal) -> โชว์คะแนนจริง */}
          {showScore && (
            <>
              <div className="flex items-end justify-between mb-1">
                <span className={`font-black leading-none ${isWinner ? 'text-2xl text-yellow-600' : 'text-xl text-[var(--color-primary,#8A2680)]'} lg:text-2xl`}>
                  {candidate.score.toLocaleString()}
                </span>
                <span className="text-[10px] lg:text-xs text-slate-400 font-medium">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 lg:h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out 
                        ${isWinner
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                      : (isVoteNo ? 'bg-orange-400' : isDisapprove ? 'bg-red-500' : 'bg-gradient-to-r from-purple-400 to-[var(--color-primary,#8A2680)]')
                    }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </>
          )}

          {/* กรณี 2: กำลังแข่ง (ONGOING) หรือ จบแล้วแต่ไม่เปิด (ENDED & HIDDEN) -> โชว์ Animation ลับๆ */}
          {showHidden && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Activity size={14} className="animate-pulse text-[var(--color-primary,#8A2680)]" />
                  {isEnded ? "Counting Votes..." : "Voting in progress..."}
                </span>
                <Lock size={14} className="text-slate-300" />
              </div>
              <div className="w-full h-6 bg-slate-100 rounded-md overflow-hidden relative">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(138,38,128,0.1)_25%,rgba(138,38,128,0.1)_50%,transparent_50%,transparent_75%,rgba(138,38,128,0.1)_75%,rgba(138,38,128,0.1)_100%)] bg-[size:20px_20px] animate-[progress-stripes_1s_linear_infinite]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest">HIDDEN SCORE</span>
                </div>
              </div>
              <style jsx>{`
                    @keyframes progress-stripes {
                        0% { background-position: 0 0; }
                        100% { background-position: 20px 0; }
                    }
                 `}</style>
            </div>
          )}

          {/* กรณี 3: ยังไม่เริ่ม (WAITING / PRE_CAMPAIGN) -> สถานะรอ */}
          {isWaiting && (
            <div className="bg-slate-50 rounded-lg py-3 flex items-center justify-center gap-2 text-slate-400 border border-slate-100">
              <Clock size={14} />
              <span className="text-xs font-bold">รอเปิดลงคะแนน</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}