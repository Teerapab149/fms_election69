"use client";

import { X, Check, AlertCircle, XCircle } from "lucide-react";

export default function VoteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  party, 
  isVoteNo 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 animate-fade-in">
      {/* Backdrop (พื้นหลังสีดำจางๆ) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 transform transition-all scale-100 animate-scale-in border border-slate-100">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          {/* Icon ด้านบน */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isVoteNo ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-[#8A2680]'}`}>
            <AlertCircle size={32} />
          </div>

          <h3 className="text-2xl font-black text-slate-800 mb-2">
            ยืนยันการลงคะแนน?
          </h3>
          <p className="text-slate-500 mb-6">
            โปรดตรวจสอบความถูกต้อง ท่านไม่สามารถแก้ไขได้หลังจากยืนยัน
          </p>

          {/* Card แสดงพรรคที่เลือก (Preview) */}
          <div className={`
            rounded-2xl p-4 mb-8 border-2 flex items-center gap-4 text-left
            ${isVoteNo 
              ? 'bg-red-50 border-red-200' 
              : 'bg-purple-50 border-purple-200'
            }
          `}>
            {/* Logo พรรค หรือ Icon งดออกเสียง */}
            <div className="shrink-0 w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
               {isVoteNo ? (
                   <XCircle className="text-red-500 w-8 h-8" />
               ) : (
                   party?.logoUrl ? (
                     <img src={party.logoUrl} alt={party.name} className="w-full h-full object-contain p-1" />
                   ) : (
                     <div className="font-bold text-slate-300">No Img</div>
                   )
               )}
            </div>
            
            <div className="min-w-0">
               <p className={`text-xs font-bold uppercase mb-1 ${isVoteNo ? 'text-red-400' : 'text-purple-400'}`}>
                 ท่านเลือก
               </p>
               <h4 className={`text-lg font-bold truncate leading-tight ${isVoteNo ? 'text-red-700' : 'text-slate-800'}`}>
                 {isVoteNo ? 'ไม่ประสงค์ลงคะแนน' : party?.name}
               </h4>
               <p className="text-sm text-slate-500">
                 {isVoteNo ? 'Vote No' : `เบอร์ ${party?.number}`}
               </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              className={`
                flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95
                ${isVoteNo 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                  : 'bg-gradient-to-r from-[#8A2680] to-[#701e68] shadow-purple-200'
                }
              `}
            >
              <Check size={20} /> ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}