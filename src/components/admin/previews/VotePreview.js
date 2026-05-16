"use client";

// VotePreview — ตัวอย่างหน้า Multi-Party แบบ simplified สำหรับ Live Preview ในแท็บ admin
// ใช้ dummy data — ไม่ติดต่อ DB / API
// รับ config prop เดียวกับ MultiPartyView (gridCols, cardVariant, showDivider, abstainStyle)

import { Ban } from 'lucide-react';

const DUMMY_PARTIES = [
  { id: 1, number: 1, name: "พรรค A", color: "#8A2680" },
  { id: 2, number: 2, name: "พรรค B", color: "#2563EB" },
  { id: 3, number: 3, name: "พรรค C", color: "#059669" },
];

export default function VotePreview({ config = {} }) {
  const {
    gridCols = "auto",
    cardVariant = "auto",
    showDivider = true,
    abstainStyle = "auto",
  } = config;

  const partyCount = DUMMY_PARTIES.length;
  const resolvedVariant = cardVariant === "auto" ? (partyCount <= 3 ? "grid" : "compact") : cardVariant;
  const resolvedAbstain = abstainStyle === "auto" ? (partyCount <= 3 ? "standard" : "compact") : abstainStyle;

  // Determine grid classes (auto → 2 columns as default)
  const gridClasses =
    gridCols === "2" ? "grid-cols-2" : gridCols === "3" ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="bg-[#F8F9FD] min-h-full p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex px-3 py-1 rounded-full bg-purple-50 border border-purple-100 mb-3">
          <span className="text-[10px] font-bold text-[#8A2680]">ลงคะแนนเสียง</span>
        </div>
        <h1 className="text-xl font-black text-slate-800">
          เลือกตั้ง<span className="text-[#8A2680]">สโมสรนักศึกษา</span>
        </h1>
      </div>

      {/* Party Grid */}
      <div className={`grid ${gridClasses} gap-3 max-w-md mx-auto mb-4`}>
        {DUMMY_PARTIES.map((party) => (
          <div
            key={party.id}
            className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm"
          >
            <div
              className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: party.color }}
            >
              {party.number}
            </div>
            <p className="text-xs font-bold text-slate-700">{party.name}</p>
            {resolvedVariant === "grid" && (
              <p className="text-[8px] text-slate-400 mt-1">สโลแกนพรรค</p>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      {showDivider && (
        <div className="flex items-center gap-3 max-w-xs mx-auto mb-3">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-[8px] text-slate-400 font-bold">หรือ</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>
      )}

      {/* Abstain */}
      {resolvedAbstain === "standard" && (
        <div className="max-w-xs mx-auto bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-2 shadow-sm">
          <Ban size={16} className="text-orange-500" />
          <span className="text-xs font-bold text-slate-600">งดออกเสียง</span>
        </div>
      )}
      {resolvedAbstain === "compact" && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm">
            <Ban size={12} className="text-orange-500" />
            <span className="text-[10px] font-bold text-slate-500">งดออกเสียง</span>
          </div>
        </div>
      )}
      {resolvedAbstain === "minimal" && (
        <div className="text-center">
          <span className="text-[10px] text-slate-400 underline">งดออกเสียง</span>
        </div>
      )}
    </div>
  );
}
