'use client';

import { useState } from 'react';
import { User, ChevronDown, Edit, Users } from "lucide-react";

export default function EditCandidateMember({ candidate, onClick }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!candidate) return null;
  const members = candidate.members || [];

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 transition-all w-full duration-300 overflow-hidden ${isExpanded ? 'ring-2 ring-blue-100 shadow-md' : 'hover:shadow-md'}`}>

      {/* === Header (Toggle Dropdown) === */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg w-12 h-12 flex items-center justify-center border border-blue-100 shrink-0">
            {candidate.logoUrl ? (
              <img
                src={candidate.logoUrl}
                alt={candidate.name}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <User className="w-6 h-6 text-blue-400" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
              {candidate.name}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" /> สมาชิก {members.length} คน
            </p>
          </div>
        </div>

        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
        />
      </div>

      {/* === Dropdown Content === */}
      <div
        className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="p-4 bg-gray-50/50 space-y-2">

          {/* Edit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4" />
            เพิ่มสมาชิก
          </button>

          <hr className="border-gray-100" />

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {/* List Members */}
            {members.length > 0 ? (
              members.map((member, index) => (
                <div
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(member.id);
                  }}
                  className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} className="w-full h-full object-cover" alt={member.name} />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-700 truncate">{member.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{member.position || 'สมาชิก'}</p>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-blue-500 p-1.5 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-400 py-2">ยังไม่มีข้อมูลสมาชิก</p>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}