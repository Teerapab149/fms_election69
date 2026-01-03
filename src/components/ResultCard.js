"use client";

import { useState } from "react";
import { Trophy, Users } from "lucide-react";

export default function ResultCard({ candidate, rank, totalVotes, isElectionEnded, onClick }) {
    const [imageError, setImageError] = useState(false);

    const percentage = totalVotes > 0 ? (candidate.score / totalVotes) * 100 : 0;
    const isWinner = rank === 1; // เช็คว่าเป็นที่ 1 หรือไม่

    // Path รูปภาพ
    const imageSrc = candidate.image || (candidate.number ? `/images/candidates/logo/${candidate.number}.jpg` : null);

    return (
        <div
            onClick={onClick}
            className={`
        group relative cursor-pointer overflow-hidden bg-white transition-all duration-300
        
        /* --- Layout หลัก (สำคัญ) --- */
        /* มือถือ: ถ้าเป็นที่ 1 ให้เป็นแนวตั้ง (Card), ถ้าไม่ใช่ให้เป็นแนวนอน (List) */
        flex ${isWinner ? 'flex-col rounded-2xl border shadow-sm mb-2' : 'flex-row items-center border-b border-slate-100 last:border-0 rounded-none py-2'}
        
        /* Desktop: บังคับเป็นแนวตั้ง (Card) ทุกอัน และคืนค่า Border/Rounded */
        lg:flex-col lg:items-stretch lg:rounded-2xl lg:border lg:shadow-none lg:py-0 lg:mb-0
        
        ${isWinner
                    ? 'border-yellow-400 ring-2 ring-yellow-400/20 shadow-yellow-100 z-10'
                    : 'hover:bg-slate-50 lg:hover:border-purple-200'
                }
      `}
        >
            {/* === ส่วนที่ 1: รูปภาพ === */}
            <div className={`
         relative shrink-0 bg-slate-50 overflow-hidden
         /* มือถือ: ที่ 1 รูปใหญ่เต็มจอ, คนอื่นเป็นวงกลมเล็กๆ */
         ${isWinner ? 'w-full aspect-[16/9]' : 'w-14 h-14 rounded-full ml-3 border border-slate-200'}
         
         /* Desktop: รูปใหญ่เต็มกรอบเสมอ */
         lg:w-full lg:h-48 lg:aspect-[4/3] lg:rounded-none lg:ml-0 lg:border-0
      `}>

                {imageSrc && !imageError ? (
                    <img
                        src={imageSrc}
                        alt={candidate.name}
                        className="object-contain w-full h-full bg-white p-1 group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-300">
                        <Users className={isWinner ? "w-12 h-12" : "w-6 h-6"} />
                    </div>
                )}

                {/* Badge อันดับ (แสดงเฉพาะที่ 1 หรือใน Desktop) */}
                <div className={`
            absolute top-0 left-0 flex items-center justify-center font-bold text-white shadow-sm
            ${isWinner ? 'w-8 h-8 lg:w-10 lg:h-10 text-sm lg:text-lg rounded-br-xl bg-yellow-500' : 'hidden lg:flex w-10 h-10 text-lg rounded-br-xl bg-[#8A2680]'}
        `}>
                    #{rank}
                </div>
            </div>

            {/* === ส่วนที่ 2: ข้อมูล === */}
            <div className={`
          flex flex-col justify-center min-w-0 flex-1
          /* มือถือ: จัด Padding ตามประเภท */
          ${isWinner ? 'p-4' : 'p-3 pl-4'}
          lg:p-5
      `}>

                {/* ชื่อและเบอร์ */}
                <div className="flex justify-between items-start mb-1 lg:mb-3 gap-2">
                    <div className="min-w-0 flex-1">
                        {/* ชื่อพรรค */}
                        <h3 className={`
                    font-bold text-slate-800 truncate leading-tight group-hover:text-[#8A2680] transition-colors
                    ${isWinner ? 'text-lg' : 'text-base'}
                    lg:text-lg
                `}>
                            {candidate.name || "ไม่ระบุชื่อพรรค"}
                        </h3>

                        {/* เบอร์ + อันดับ (เฉพาะมือถือแบบ List) */}
                        <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                            <p className="text-xs">
                                {candidate.name === "งดออกเสียง" ? "No Vote" : `เบอร์ ${candidate.number}`}
                            </p>
                            {/* ถ้าเป็นแบบ List (คนอื่น) ให้โชว์อันดับตรงนี้แทน Badge รูปภาพ */}
                            {!isWinner && (
                                <span className="lg:hidden text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-bold">
                                    #{rank}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ถ้วยรางวัล (เฉพาะคนชนะ) */}
                    {isWinner && isElectionEnded && <Trophy className="w-5 h-5 text-yellow-500 animate-bounce shrink-0" />}
                </div>

                {/* ส่วนคะแนน */}
                <div className="mt-auto w-full">
                    <div className="flex items-end justify-between mb-1">
                        <span className={`font-black leading-none ${isWinner ? 'text-2xl text-yellow-600' : 'text-xl text-[#8A2680]'} lg:text-2xl`}>
                            {candidate.score.toLocaleString()}
                        </span>
                        <span className="text-[10px] lg:text-xs text-slate-400 font-medium">
                            {percentage.toFixed(1)}%
                        </span>
                    </div>

                    {/* Progress Bar (โชว์ตลอด แต่ปรับขนาด) */}
                    <div className="w-full h-1.5 lg:h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isWinner ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-purple-400 to-[#8A2680]'}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}