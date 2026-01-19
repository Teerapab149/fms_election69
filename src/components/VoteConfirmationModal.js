"use client";

import { X, Check, AlertCircle, Ban, UserX, UserCheck } from "lucide-react";

export default function VoteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  party, 
  isVoteNo,      // สำหรับ: งดออกเสียง (Abstain) - มีทั้ง Single/Multi
  isDisapprove   // สำหรับ: ไม่รับรอง (Disapprove) - มีเฉพาะ Single
}) {
  if (!isOpen) return null;

  // 🎨 ตั้งค่า Default Theme (สำหรับกรณีเลือกพรรค - Approve)
  let modalTheme = {
    color: 'text-[#8A2680]',           // สีข้อความหลัก
    bg: 'bg-purple-50',                // สีพื้นหลังการ์ด
    border: 'border-purple-200',       // สีขอบการ์ด
    titleColor: 'text-slate-800',      // สีชื่อพรรค
    subTitleColor: 'text-purple-600',  // สีข้อความ "ท่านเลือก"
    iconBg: 'bg-purple-100',           // สีพื้นหลังไอคอนด้านบน
    confirmBtn: 'bg-gradient-to-r from-[#8A2680] to-[#701e68] shadow-purple-200', // ปุ่มยืนยัน
    label: party?.name,                // ชื่อที่แสดง
    subLabel: `เบอร์ ${party?.number}`, // ข้อความรอง
    // ไอคอนในการ์ด
    icon: party?.logoUrl ? (
      <img src={party.logoUrl} alt={party.name} className="w-full h-full object-contain p-1" />
    ) : (
      <div className="font-bold text-slate-300">No Img</div>
    ),
    // ไอคอนด้านบนสุด
    topIcon: <UserCheck size={32} />
  };

  // 🟠 CASE: งดออกเสียง (Abstain) - (ใช้ได้ทั้ง Single และ Multi)
  if (isVoteNo) {
    modalTheme = {
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      titleColor: 'text-orange-700',
      subTitleColor: 'text-orange-500',
      iconBg: 'bg-orange-100',
      confirmBtn: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
      label: 'งดออกเสียง',
      subLabel: 'ไม่ประสงค์ลงคะแนนเสียง',
      icon: <Ban className="text-orange-500 w-8 h-8" strokeWidth={2.5} />,
      topIcon: <Ban size={32} />
    };
  } 
  // 🔴 CASE: ไม่รับรอง (Disapprove) - (จะทำงานเฉพาะตอน Single Party ที่มีปุ่มนี้)
  else if (isDisapprove) {
    modalTheme = {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      titleColor: 'text-red-700',
      subTitleColor: 'text-red-500',
      iconBg: 'bg-red-100',
      confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-200',
      label: 'ไม่รับรอง',
      subLabel: 'ไม่ประสงค์ให้ผู้สมัครได้รับเลือก',
      icon: <UserX className="text-red-600 w-8 h-8" strokeWidth={2.5} />,
      topIcon: <UserX size={32} />
    };
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 animate-fade-in">
      {/* Backdrop (พื้นหลังมืด) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 transform transition-all scale-100 animate-scale-in border border-slate-100">
        
        {/* ปุ่มกากบาท Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          {/* 1. ไอคอนด้านบนสุด (เปลี่ยนตามสถานะ) */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${modalTheme.iconBg} ${modalTheme.color}`}>
            {modalTheme.topIcon}
          </div>

          <h3 className="text-2xl font-black text-slate-800 mb-2">
            ยืนยันการลงคะแนน?
          </h3>
          <p className="text-slate-500 mb-6 text-sm md:text-base">
            โปรดตรวจสอบความถูกต้อง ท่านไม่สามารถแก้ไขได้หลังจากยืนยัน
          </p>

          {/* 2. การ์ดแสดงผลสรุป (Preview Card) */}
          <div className={`
            rounded-2xl p-4 mb-8 border-2 flex items-center gap-4 text-left transition-colors duration-300
            ${modalTheme.bg} ${modalTheme.border}
          `}>
            {/* Logo หรือ Icon ในการ์ด */}
            <div className="shrink-0 w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
               {modalTheme.icon}
            </div>
            
            {/* ข้อความ */}
            <div className="min-w-0 flex-1">
               <p className={`text-[10px] font-bold uppercase mb-0.5 ${modalTheme.subTitleColor}`}>
                 ท่านเลือก
               </p>
               <h4 className={`text-lg md:text-xl font-bold truncate leading-tight ${modalTheme.titleColor}`}>
                 {modalTheme.label}
               </h4>
               <p className="text-xs md:text-sm text-slate-500 truncate">
                 {modalTheme.subLabel}
               </p>
            </div>
          </div>

          {/* 3. ปุ่ม Action */}
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
                ${modalTheme.confirmBtn}
              `}
            >
              <Check size={20} strokeWidth={3} /> ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}