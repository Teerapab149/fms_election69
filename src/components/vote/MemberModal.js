"use client";

import { X } from "lucide-react";
import SmartImage from "../SmartImage";

/**
 * Modal สำหรับแสดงรายละเอียดสมาชิก
 */
const MemberModal = ({ member, onClose }) => {
    if (!member) return null;

    return (
        <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/5 hover:bg-black/10 text-black rounded-full transition-all">
                    <X size={24} />
                </button>
                <div className="relative w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-slate-100">
                    <SmartImage src={getPath(member.imageUrl)} alt={member.name} className="w-full h-full object-cover" />

                    {/* Gradient Overlay */}
                </div>
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-[#f8f8f8] border border-black/5 text-[#B8860B] text-xs font-bold uppercase tracking-widest mb-4 w-fit">
                        {member.position || "Member"}
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-[#1A1A1A] mb-2 leading-tight">{member.name}</h3>
                    <p className="text-black/40 text-lg mb-6">{member.studentId || "Candidate Member"}</p>
                    <div className="h-px w-20 bg-[#B8860B] mb-6" />
                    <p className="text-black/60 leading-relaxed">
                        &quot;มุ่งมั่นพัฒนาคณะ ร่วมสร้างสรรค์กิจกรรม เพื่อประโยชน์สูงสุดของนักศึกษาทุกคน&quot;
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MemberModal;
