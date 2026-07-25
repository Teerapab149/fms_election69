"use client";

import { useState } from "react";
import { Trophy, Users, Ban, UserX, Activity, Lock, Clock } from "lucide-react";
import { getPath } from "../utils/basePath";

export default function ResultCard({ candidate, rank, totalVotes, status, isRevealed }) {
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
        className="object-contain w-full h-full bg-white p-1"
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
      className={`
        group relative overflow-hidden bg-white transition-all duration-300

        /* Layout Mobile: แนวนอน */
        flex ${isWinner ? 'flex-col rounded-2xl border shadow-sm mb-2' : 'flex-row items-center border-b border-slate-100 last:border-0 rounded-none py-2'}

        /* Layout Desktop: แนวตั้ง (Card) */
        lg:flex-col lg:items-stretch lg:rounded-2xl lg:border lg:shadow-none lg:py-0 lg:mb-0

        ${isWinner
          ? 'border-yellow-400 ring-2 ring-yellow-400/20 shadow-yellow-100 z-10'
          : ''
        }
      `}
    >
      {/* 🔴 LIVE Badge (แสดงเฉพาะตอนเลือกตั้งอยู่) */}
      {/* red-600 on the red-100 pill measured 3.95:1 at 10px (AA 4.5); red-700 = 5.35:1 */}
      {isOngoing && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-bold border border-red-200 animate-pulse">
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
        {/* the rank badge is the one glyph on this card that must survive at a
            glance. White on bg-yellow-500 measured 1.92:1 and white on bg-slate-400
            2.56:1 (18px bold needs 4.5). Dark ink on the same gold keeps the medal
            read at 7.6:1; the hidden state moves to slate-500 for 4.76:1 on white. */}
        {!isWaiting && (
          <div className={`
              absolute top-0 left-0 flex items-center justify-center font-bold text-white shadow-sm
              ${isWinner ? 'w-8 h-8 lg:w-10 lg:h-10 text-sm lg:text-lg rounded-br-xl bg-yellow-500 !text-yellow-950' : 'hidden lg:flex w-10 h-10 text-lg rounded-br-xl bg-[var(--color-primary,#8A2680)]'}
              ${showHidden ? 'bg-slate-500' : ''}
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
            {/* wraps instead of truncating — a real party name runs 43 characters
                and `truncate` cut the winner's name mid-word on the results
                announcement. Three lines, not two: in the lg card layout the name
                column is only ~184-214px wide, where a 53-character name needs a
                third line (clamp-2 cut 28px off every card). */}
            {/* ink gutter: line-clamp forces overflow:hidden and clips at the padding
                box, and leading-tight (1.25) sits under Anuphan's font box — a Thai
                tone-over-vowel crossed that edge and ไม้โท came out as a flat bar.
                .24em, not .13em: below lg the card drops to leading-tight at 16/18px
                where the tallest legitimate stack (ปื๋ ฟื๊ ที่ ชี้ เพื่อ — admin-typed
                names are free text) needs 0.1875em, so .13em still cut 0.92px at 768
                and 412. Sized off the worst case across every breakpoint, + a 0.05em
                cushion so sub-pixel rounding cannot eat it.
                pt/-mt cancel, so nothing moves. Never padding-bottom: the clamped
                line reappears in it (receipt family, 2026-07-23) */}
            <h3 className={`pt-[.24em] -mt-[.24em] font-bold text-slate-800 leading-tight line-clamp-3 ${isWinner ? 'text-lg' : 'text-base'} lg:text-lg`}>
              {candidate.name || "ไม่ระบุชื่อพรรค"}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-slate-500">
              <p className="text-xs">{getSubText()}</p>
              {/* slate-400 on the slate-100 chip measured 2.32:1 — slate-600 on the
                  same chip is 5.9:1 and keeps the rank a quiet secondary mark */}
              {!isWinner && showScore && (
                <span className="lg:hidden text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
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
                {/* yellow-600 on white is 2.94:1 — under the 3.0 large-text floor at
                    24px, on the single number the whole page exists to show.
                    yellow-700 reads 4.92:1 and still sits in the winner's gold */}
                <span className={`font-black leading-none ${isWinner ? 'text-2xl text-yellow-700' : 'text-xl text-[var(--color-primary,#8A2680)]'} lg:text-2xl`}>
                  {candidate.score.toLocaleString()}
                </span>
                {/* the share-of-vote figure is data, not decoration: slate-400 read
                    2.56:1 on the white card at 12px (AA 4.5) → slate-500 = 4.76:1 */}
                <span className="text-[10px] lg:text-xs text-slate-500 font-medium">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 lg:h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out 
                        ${isWinner
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                      : (isVoteNo ? 'bg-orange-400' : isDisapprove ? 'bg-red-500' : 'bg-gradient-to-r from-[color-mix(in_srgb,var(--color-primary)_55%,white)] to-[var(--color-primary,#8A2680)]')
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
                {/* 2.56:1 at 12px on white — the "counting" status is the only thing
                    telling a voter why the score is missing, so it has to clear AA */}
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Activity size={14} className="animate-pulse text-[var(--color-primary,#8A2680)]" />
                  {isEnded ? "Counting Votes..." : "Voting in progress..."}
                </span>
                <Lock size={14} className="text-slate-300" />
              </div>
              <div className="w-full h-6 bg-slate-100 rounded-md overflow-hidden relative">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(138,38,128,0.1)_25%,rgba(138,38,128,0.1)_50%,transparent_50%,transparent_75%,rgba(138,38,128,0.1)_75%,rgba(138,38,128,0.1)_100%)] bg-[size:20px_20px] animate-[progress-stripes_1s_linear_infinite]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* sits on the striped slate-100 bar: slate-400 = 2.34:1, slate-600
                      = 5.4:1 and still reads quieter than the surrounding numerals */}
                  <span className="text-[10px] font-bold text-slate-600 tracking-widest">HIDDEN SCORE</span>
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
          {/* same reason as the other slate-400 captions on this card: 2.46:1 on the
              slate-50 waiting panel → slate-500 is 4.6:1 */}
          {isWaiting && (
            <div className="bg-slate-50 rounded-lg py-3 flex items-center justify-center gap-2 text-slate-500 border border-slate-100">
              <Clock size={14} />
              <span className="text-xs font-bold">รอเปิดลงคะแนน</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}