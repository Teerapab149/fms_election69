"use client";

import { useState } from "react";
import { Users } from "lucide-react";

export default function ResultCard({ candidate, onClick }) {
    const [imageError, setImageError] = useState(false);
    const isWinner = false
    const imageSrc = candidate.image || (candidate.logoUrl ? `${candidate.logoUrl}` : null);

    return (
        <div onClick={onClick} className="group relative cursor-pointer overflow-hidden bg-white transition-all duration-300 lg:flex-col lg:items-stretch lg:rounded-2xl lg:border lg:shadow-none lg:py-0 lg:mb-0 hover:shadow-md transition-shadow">
            <div className="relative shrink-0 bg-slate-50 overflow-hidden lg:w-full lg:h-48 lg:aspect-[4/3] lg:rounded-none lg:ml-0 lg:border-0" >
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
            </div>

            <div className="flex flex-col justify-center min-w-0 flex-1 p-3 pl-4 lg:p-5">
                {/* ชื่อและเบอร์ */}
                <div className="flex justify-between items-start mb-1 lg:mb-3 gap-2">
                    <div className="min-w-0 flex-1">
                        {/* ชื่อพรรค */}
                        <h3 className="font-bold text-slate-800 truncate leading-tight group-hover:text-[#8A2680] transition-colors text-base lg:text-lg" >
                            {candidate.name || "ไม่ระบุชื่อพรรค"}
                        </h3>

                        {/* เบอร์ + อันดับ (เฉพาะมือถือแบบ List) */}
                        <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                            <h4 className="text-xs">
                                เบอร์ {candidate.number}
                            </h4>
                        </div>
                        <div className="p-3" />
                        <p className="text-xs text-slate-400 mt-1">คลิกเพื่อแก้ไขข้อมูล</p>
                    </div>
                </div>

            </div>
        </div>
    );
}