'use client';

import { useState } from 'react';
import { User, ChevronDown, Plus, Users, Pencil } from "lucide-react";
import { getPath } from "../utils/basePath";

export default function EditCandidateMember({ candidate, onClick, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!candidate) return null;
  const members = (candidate.members || []).sort((a, b) => {
    const numA = a.number ? parseInt(a.number) : 999;
    const numB = b.number ? parseInt(b.number) : 999;
    return numA - numB;
  });

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all w-full duration-300 overflow-hidden ${isExpanded ? 'border-[#8A2680]/30 shadow-md' : 'border-gray-200 hover:shadow-md'}`}>

      {/* === หัวการ์ด: กดที่ไหนก็เปิด/ปิดได้ === */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2680] focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-purple-50 p-1.5 rounded-lg w-12 h-12 flex items-center justify-center border border-purple-100 shrink-0 overflow-hidden">
            {candidate.logoUrl ? (
              <img
                src={getPath(candidate.logoUrl)}
                alt={candidate.name}
                className="w-full h-full object-contain rounded-md"
              />
            ) : (
              <User className="w-6 h-6 text-[#8A2680]/40" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-700 truncate transition-colors group-hover:text-[#8A2680]">
              {candidate.name}
            </h3>
            <p className="text-xs flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3 shrink-0 text-slate-400" />
              {members.length > 0 ? (
                <span className="text-slate-400">สมาชิก {members.length} คน</span>
              ) : (
                <span className="text-amber-600 font-medium">ยังไม่มีสมาชิก</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* เพิ่มสมาชิกได้โดยไม่ต้องกางการ์ดก่อน — งานที่ทำบ่อยที่สุดในหัวข้อนี้ */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick(); } }}
            title="เพิ่มสมาชิก"
            className="flex items-center gap-1 rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#8A2680] transition-colors hover:bg-[#8A2680] hover:text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่ม
          </span>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#8A2680]' : ''}`}
          />
        </div>
      </button>

      {/* === รายชื่อสมาชิก === */}
      <div
        className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[520px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-4 bg-slate-50/60">
          {members.length > 0 ? (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
              {members.map((member) => (
                <div
                  key={member.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onClick(member.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(member.id); } }}
                  className="group/row flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:border-[#8A2680]/40 hover:shadow-md cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2680]"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {member.imageUrl ? (
                      <img src={getPath(member.imageUrl)} className="w-full h-full object-cover" alt={member.name} />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-700 truncate">{member.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{member.position || 'สมาชิก'}</p>
                  </div>
                  <Pencil className="w-4 h-4 shrink-0 text-gray-300 transition-colors group-hover/row:text-[#8A2680]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500">ยังไม่มีสมาชิกในพรรคนี้</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#8A2680] px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#601A59] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                เพิ่มสมาชิกคนแรก
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
