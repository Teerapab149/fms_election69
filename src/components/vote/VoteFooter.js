// src/components/Vote/VoteFooter.js
import { AlertCircle, Ban, UserX } from 'lucide-react';

export default function VoteFooter({ selectedParty, onConfirm, isSubmitting }) {
  
  // Helper to determine label text
  const getSelectedLabel = () => {
    if (!selectedParty) return null;
    if (selectedParty.number === 0) return <span className="text-orange-600 flex items-center gap-1 font-bold"><Ban size={18} /> งดออกเสียง</span>;
    if (selectedParty.number === -1) return <span className="text-red-600 flex items-center gap-1 font-bold"><UserX size={18} /> ไม่รับรอง</span>;
    return <span className="text-[#8A2680] truncate font-bold">{selectedParty.name}</span>;
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 p-3 md:p-4 shadow-[0_-5px_30px_rgba(0,0,0,0.1)] z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 md:gap-4">
        
        {/* Left Side: Selection Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 ml-1">ตัวเลือกของคุณ</p>
          <div className="font-bold text-slate-800 text-sm md:text-xl truncate flex items-center gap-2">
            {!selectedParty ? (
              <span className="text-slate-400 flex items-center gap-1 text-sm"><AlertCircle size={16} /> กรุณาเลือก 1 ช่อง</span>
            ) : (
              getSelectedLabel()
            )}
          </div>
        </div>

        {/* Right Side: Confirm Button */}
        <button
          onClick={onConfirm}
          disabled={!selectedParty || isSubmitting}
          className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 justify-center text-sm md:text-base min-w-[120px]
            ${!selectedParty
              ? 'bg-slate-300 cursor-not-allowed opacity-70'
              : 'bg-gradient-to-r from-[#8A2680] to-[#701e68] hover:scale-[1.02] active:scale-95 shadow-purple-200'}`}
        >
          {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการลงคะแนน'}
        </button>
      </div>
    </div>
  );
}