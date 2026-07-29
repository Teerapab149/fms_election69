"use client";

import { useState } from "react";
import { Users, Pencil } from "lucide-react";

import { getPath } from "../utils/basePath";

export default function CandidateCard({ candidate, onClick }) {
    const [imageError, setImageError] = useState(false);
    const imageSrc = candidate.image || (candidate.logoUrl ? getPath(candidate.logoUrl) : null);
    const memberCount = candidate.members?.length || 0;

    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
            aria-label={`แก้ไขพรรค ${candidate.name || "ไม่ระบุชื่อ"}`}
            className="group relative flex flex-col cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-[#8A2680]/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2680] focus-visible:ring-offset-2"
        >
            <div className="relative h-44 shrink-0 overflow-hidden bg-slate-50">
                {imageSrc && !imageError ? (
                    <img
                        src={imageSrc}
                        alt={candidate.name}
                        className="object-contain w-full h-full bg-white p-2 transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    /* ไม่มีโลโก้ = สถานะปกติของพรรคที่เพิ่งสร้าง บอกให้รู้ว่ายังขาดอะไร */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-slate-50 text-slate-300">
                        <Users className="w-7 h-7" />
                        <span className="text-[11px] font-medium text-slate-400">ยังไม่มีโลโก้</span>
                    </div>
                )}

                {/* เบอร์พรรค — สิ่งที่ผู้ใช้กวาดตาหาก่อนชื่อเสมอ จึงลอยไว้บนรูป */}
                <span
                    className="absolute top-3 left-3 flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 text-xs font-black text-white shadow-sm"
                    style={{ backgroundColor: candidate.color || "#8A2680" }}
                >
                    {candidate.number}
                </span>

                {/* affordance แทนข้อความ "คลิกเพื่อแก้ไข" ที่เดิมค้างอยู่ทุกใบตลอดเวลา */}
                <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#8A2680] opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Pencil className="w-3 h-3" />
                    แก้ไข
                </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-4">
                <div className="min-w-0">
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-800 transition-colors group-hover:text-[#8A2680] lg:text-lg">
                        {candidate.name || "ไม่ระบุชื่อพรรค"}
                    </h3>
                    {candidate.slogan && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-400">{candidate.slogan}</p>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    {memberCount > 0 ? (
                        <span>สมาชิก {memberCount} คน</span>
                    ) : (
                        <span className="text-amber-600">ยังไม่มีสมาชิก</span>
                    )}
                </div>
            </div>
        </div>
    );
}
