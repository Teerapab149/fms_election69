"use client";
import PartyCard from "../PartyCard";
import { Ban, Check } from "lucide-react";

export default function MultiPartyView({ 
  regularParties, 
  specialOptions, 
  selectedPartyId, 
  onSelect, 
  onViewDetails 
}) {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      {/* Grid แสดงพรรค */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-8">
        {regularParties.map((party) => (
          <div key={party.id} className="flex justify-center w-[calc(50%-0.5rem)] sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-1.5rem)]">
            <div className="w-full max-w-[380px]">
              <PartyCard 
                party={party} 
                isSelected={selectedPartyId === party.id} 
                onSelect={onSelect} 
                onViewDetails={onViewDetails} 
                variant="grid" 
              />
            </div>
          </div>
        ))}
      </div>

      {/* ปุ่มงดออกเสียง */}
      {specialOptions.abstain && (
        <div className="max-w-md mx-auto px-4 mb-4">
          <div className="relative flex items-center justify-center gap-4 py-4 opacity-60">
            <div className="h-px bg-slate-300 flex-1"></div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider px-3">หรือ</span>
            <div className="h-px bg-slate-300 flex-1"></div>
          </div>
          
          <button
            onClick={() => onSelect(specialOptions.abstain.id)}
            className={`relative w-full rounded-2xl p-4 flex flex-row items-center justify-center gap-3 transition-all border-2
              ${selectedPartyId === specialOptions.abstain.id
                ? 'bg-orange-500 border-orange-500 text-white shadow-lg scale-[1.02]'
                : 'bg-white border-slate-100 text-slate-700 hover:border-orange-300'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedPartyId === specialOptions.abstain.id ? 'bg-white/20' : 'bg-orange-50 text-orange-600'}`}>
              <Ban size={22} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <div className="font-bold text-base md:text-lg leading-tight">งดออกเสียง</div>
              <div className="text-[10px] opacity-70">ไม่ประสงค์ลงคะแนนเสียง</div>
            </div>
            {selectedPartyId === specialOptions.abstain.id && (
                <div className="absolute top-2 right-2 bg-white text-orange-600 p-0.5 rounded-full"><Check size={12} strokeWidth={4} /></div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}