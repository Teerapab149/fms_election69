'use client';
import { Lightbulb } from 'lucide-react';

export default function LongTextEditor({ 
  label, 
  value = "", 
  onChange, 
  placeholder = "พิมพ์รายละเอียด...",
  rows = 5 
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={18} className="text-amber-500" />
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">{label}</label>
      </div>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full p-4 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none leading-relaxed"
        />
        {/* Character Count */}
        <div className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
          {value?.length || 0} chars
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2 ml-1">
        * สามารถพิมพ์เว้นบรรทัดได้ (ระบบจะแสดงผลตามที่พิมพ์)
      </p>
    </div>
  );
}