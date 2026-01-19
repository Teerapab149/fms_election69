import { useState } from 'react';
import { X, Hash, GraduationCap, BookOpen, Maximize2, Quote } from 'lucide-react';

export default function CandidateModal({ member, onClose, themeColor }) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!member) return null;

  // Helper สำหรับการ์ดข้อมูล
  const InfoCard = ({ icon: Icon, label, value }) => (
    <div className="relative overflow-hidden group p-3 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center"> {/* ปรับเป็น center เพื่อประหยัดที่แนวตั้ง */}
        <div className="p-2 rounded-xl mr-3 shrink-0 bg-slate-50 text-slate-500 group-hover:text-slate-700 group-hover:bg-slate-100 transition-colors">
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
          <p className="font-medium truncate text-slate-800 text-sm md:text-base font-mono tracking-tight leading-tight">
            {value || "-"}
          </p>
        </div>
      </div>
      {/* Decoration Line */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-current w-0 group-hover:w-full transition-all duration-500 ease-out opacity-50"
        style={{ color: themeColor }} 
      />
    </div>
  );

  return (
    <>
      {/* ==================== 1. Backdrop ==================== */}
      <div 
        className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md z-[100] animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* ==================== 2. Modal Scroll Wrapper ==================== */}
      <div className="fixed inset-0 z-[101] overflow-y-auto overflow-x-hidden">
        {/* ใช้ min-h-dvh เพื่อรองรับ mobile browser address bar ได้ดีขึ้น */}
        <div className="flex min-h-[100dvh] items-center justify-center p-4 text-center sm:p-0">
        
          {/* Main Card Container */}
          <div 
              className="
                relative w-full max-w-[340px] md:max-w-[900px] 
                flex flex-col md:flex-row 
                rounded-[28px] md:rounded-[32px] shadow-2xl 
                overflow-hidden
                transform transition-all
                animate-in zoom-in-95 slide-in-from-bottom-8 duration-500
                my-4 md:my-0
                mb-20 md:mb-0 /* เพิ่ม margin ล่างใน mobile กัน browser bar บัง */
              "
              style={{ background: `linear-gradient(145deg, ${themeColor} 0%, ${themeColor}ee 100%)` }}
              onClick={(e) => e.stopPropagation()}
          >
            {/* Background Decor */}
            <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
            
            {/* Close Button (Updated visibility & position) */}
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 md:top-6 md:right-6 p-2 bg-white/90 hover:bg-white rounded-full text-slate-600 hover:text-red-500 transition-all z-50 shadow-md border border-slate-200"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ==================== LEFT: Image Section ==================== */}
            {/* ปรับ min-h ให้ลดลงใน mobile เพื่อประหยัดที่ */}
            <div className="relative w-full md:w-[42%] min-h-[260px] md:min-h-[550px] flex items-center justify-center p-6 shrink-0">
               
               <div className="relative group perspective-1000 w-full flex justify-center">
                  {/* Back Frame */}
                  <div className="absolute inset-0 border-2 border-white/20 rounded-[24px] transform translate-x-3 translate-y-3 transition-transform duration-500 group-hover:translate-x-5 group-hover:translate-y-5 hidden md:block"></div>
                  
                  {/* Image Card (ปรับขนาด Mobile ให้เล็กลง: w-48 h-60) */}
                  <div 
                    onClick={() => setIsZoomed(true)}
                    className="
                      relative w-44 h-56 md:w-72 md:h-[420px] 
                      rounded-[20px] md:rounded-[28px] overflow-hidden shadow-xl
                      border border-white/30 bg-white/10 backdrop-blur-sm
                      transform transition-all duration-500 ease-out
                      group-hover:scale-[1.02] cursor-zoom-in
                    "
                  >
                     <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                     
                     {/* Overlay Gradient */}
                     <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                     {/* Position Text (เหลือแค่ชื่อตำแหน่ง) */}
                     <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white pointer-events-none text-center md:text-left">
                        <p className="font-bold text-sm md:text-2xl leading-tight drop-shadow-md">
                          {member.position}
                        </p>
                     </div>

                     {/* Zoom Icon Hint */}
                     <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/30 backdrop-blur-md p-2 md:p-3 rounded-full text-white border border-white/40 shadow-xl">
                          <Maximize2 className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* ==================== RIGHT: Info Section ==================== */}
            <div className="
              relative flex-1 
              bg-white 
              flex flex-col 
              rounded-t-[28px] md:rounded-t-none md:rounded-l-[48px] 
              shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.15)] md:shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.2)]
              -mt-6 md:mt-0 /* ดึงขึ้นมาทับรูปนิดนึงใน mobile */
              z-10
            ">
              
              <div className="flex-1 p-5 md:p-12 pb-8">
                <div className="max-w-md mx-auto md:max-w-none text-left">
                  
                  {/* Header (Compact for Mobile) */}
                  <div className="mb-4 md:mb-8 relative">
                     <Quote className="hidden md:block absolute -top-4 -left-4 w-12 h-12 text-slate-100 fill-slate-100 -z-10" />
                     
                     <div className="flex items-center space-x-2 mb-2">
                       <span className="flex h-1.5 w-1.5 md:h-2 md:w-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }}></span>
                       <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Profile Details</span>
                     </div>
                     
                     <h2 className="text-2xl md:text-[2.5rem] font-black text-slate-900 leading-tight mb-2 tracking-tight">
                       {member.name}
                     </h2>
                     
                     <div className="h-1 w-16 md:h-1.5 md:w-20 rounded-full opacity-80" style={{ backgroundColor: themeColor }} />
                  </div>

                  {/* Info Grid (Compact Spacing) */}
                  <div className="space-y-3">
                     <InfoCard 
                        icon={Hash} 
                        label="Student ID" 
                        value={member.studentId} 
                      />
                      <InfoCard 
                        icon={GraduationCap} 
                        label="Faculty" 
                        value={member.faculty} 
                      />
                      <InfoCard 
                        icon={BookOpen} 
                        label="Major" 
                        value={member.major} 
                      />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>FMS Election 2026</span>
                  <span className="hidden md:inline">Vote for Change</span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ==================== 3. Lightbox ==================== */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setIsZoomed(false)}
        >
          <button className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer z-50">
            <X className="w-8 h-8" />
          </button>
          
          <img 
            src={member.imageUrl} 
            alt={member.name} 
            className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
}