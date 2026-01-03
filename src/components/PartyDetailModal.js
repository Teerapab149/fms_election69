import { useState, useEffect } from "react";
import { X, ChevronLeft, User, Users } from "lucide-react";

export default function PartyDetailModal({ party, isOpen, onClose, showVoteButton = false, onConfirm }) {
  const [activeMember, setActiveMember] = useState(null);
  const [partyLogoError, setPartyLogoError] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setPartyLogoError(false);
        setActiveMember(null);
    }
  }, [isOpen, party]);

  if (!isOpen || !party) return null;

  // ✅ 1. รายชื่อตำแหน่งมาตรฐาน (เอาไว้สำรอง กรณีใน DB ไม่ได้ระบุตำแหน่งมา)
  const positionList = [
    "นายกสโมสรนักศึกษา",
    "อุปนายกกิจการภายใน",
    "อุปนายกกิจการภายนอก",
    "เลขานุการ",
    "เหรัญญิก",
    "ประธานฝ่ายประชาสัมพันธ์",
    "ประธานฝ่ายสวัสดิการ",
    "ประธานฝ่ายพัสดุ",
    "ประธานฝ่ายกีฬา",
    "ประธานฝ่ายวิชาการ",
    "ประธานฝ่ายศิลปวัฒนธรรม",
    "ประธานฝ่ายข้อมูลกิจการนักศึกษา",
    "ประธานฝ่ายเทคโนโลยีสารสนเทศ",
    "ประธานฝ่ายประเมินผล",
    "ประธานฝ่ายกิจกรรม",
    "ประธานฝ่ายกราฟิกดีไซน์",
    "ประธานฝ่ายพิธีการ",
    "ประธานฝ่ายครีเอทีฟและสันทนาการ",
    "ประธานฝ่ายสถานที่",
    "ประธานฝ่ายสาธารณสุข"
  ];

  // ✅ 2. ใช้ข้อมูลจาก Database จริงๆ เลย (มีเท่าไหร่โชว์เท่านั้น)
  const realMembers = party.members || [];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div 
        className="
            relative bg-white rounded-[24px] md:rounded-[32px] 
            w-full max-w-[340px] md:max-w-md 
            h-[500px] max-h-[80vh] md:h-[600px] 
            flex flex-col overflow-hidden 
            shadow-2xl shadow-black/50 
            z-10 animate-scale-in transition-all
        "
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* --- ปุ่มควบคุม --- */}
        <div className="absolute top-3 left-3 md:top-4 md:left-4 z-50">
             {activeMember && (
                <button onClick={() => setActiveMember(null)} className="p-1.5 md:p-2 bg-slate-100/90 backdrop-blur rounded-full flex items-center gap-1 pr-2 shadow-sm hover:bg-slate-200 border border-white/50">
                    <ChevronLeft className="w-4 h-4" /><span className="text-[10px] md:text-xs font-bold">กลับ</span>
                </button>
             )}
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 md:top-4 md:right-4 z-50 p-1.5 md:p-2 bg-slate-100/90 backdrop-blur rounded-full hover:bg-slate-200 transition shadow-sm border border-white/50">
            <X className="w-4 h-4"/>
        </button>


        {/* =========================================================
            Header
           ========================================================= */}
        <div className="shrink-0 bg-white z-20 px-4 pt-10 pb-2 md:pt-12 text-center shadow-sm relative border-b border-slate-50">
            <div className="w-16 h-16 md:w-24 md:h-24 mx-auto rounded-full border-4 border-purple-50 overflow-hidden mb-2 shadow-sm bg-white relative z-10 flex items-center justify-center">
                {!partyLogoError && party.logoUrl ? (
                    <img 
                        src={party.logoUrl} 
                        className="w-full h-full object-cover"
                        onError={() => setPartyLogoError(true)}
                    />
                ) : (
                    <Users className="w-8 h-8 md:w-12 md:h-12 text-slate-300" />
                )}
            </div>
            <h2 className="text-lg md:text-2xl font-black text-[#8A2680] leading-tight mb-1">{party.name}</h2>
            <div className="mb-2">
                <span className="bg-purple-100 text-purple-800 text-[10px] md:text-xs font-bold px-3 py-0.5 rounded-full inline-block border border-purple-200">
                    เบอร์ {party.number}
                </span>
            </div>
        </div>


        {/* =========================================================
            Content (Dynamic List)
           ========================================================= */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 relative z-0">
            {activeMember ? (
                // ---------------- View 1: Detail ----------------
                <div className="p-6 flex flex-col items-center animate-slide-in-right min-h-full pt-10">
                     <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full mb-6 overflow-hidden border-4 border-white shadow-md flex items-center justify-center shrink-0">
                        <MemberImage url={activeMember.imageUrl} />
                     </div>
                     <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center mb-2">{activeMember.name}</h2>
                     <p className="text-purple-700 font-bold bg-purple-50 px-5 py-1.5 rounded-full text-sm md:text-base border border-purple-100 shadow-sm text-center">
                        {activeMember.position}
                     </p>
                </div>
            ) : (
                // ---------------- View 2: Dynamic List ----------------
                <div className="p-4">
                    <h3 className="font-bold text-slate-700 mb-3 text-xs md:text-sm flex items-center gap-1.5 ml-1">
                        <User className="w-3 h-3 md:w-4 md:h-4 text-purple-500"/>
                        {/* ✅ โชว์จำนวนตามจริง */}
                        สมาชิกพรรค <span className="text-slate-400 font-normal">({realMembers.length})</span>
                    </h3>
                    
                    <ul className="space-y-2.5 pb-4">
                        {/* ✅ วนลูปตามข้อมูลที่มีจริง (Dynamic) */}
                        {realMembers.map((m, i) => {
                            // Logic: ถ้าใน DB มีตำแหน่งให้ใช้ DB, ถ้าไม่มีให้ดึงจาก List ตามลำดับ index
                            const displayPosition = m.position || positionList[i] || "สมาชิกพรรค";

                            return (
                                <li 
                                    key={i} 
                                    onClick={() => setActiveMember({...m, position: displayPosition})} 
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white cursor-pointer transition border border-transparent hover:border-slate-200 bg-white shadow-sm group"
                                >
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-100 group-hover:border-purple-100 flex items-center justify-center">
                                        <MemberImage url={m.imageUrl} small />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-xs md:text-sm font-bold text-slate-700 truncate group-hover:text-purple-700 transition-colors">{m.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{displayPosition}</p>
                                    </div>
                                    <ChevronLeft className="w-4 h-4 rotate-180 text-slate-300 group-hover:text-purple-400 group-hover:translate-x-1 transition-all"/>
                                </li>
                            );
                        })}

                        {/* กรณีไม่มีสมาชิกเลย */}
                        {realMembers.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                ไม่พบข้อมูลสมาชิก
                            </div>
                        )}
                    </ul>
                </div>
            )}
        </div>


        {/* Footer Button */}
        {showVoteButton && (
            <div className="p-4 border-t border-slate-100 shrink-0 bg-white z-30">
                <button onClick={onConfirm} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-base hover:bg-purple-700 transition shadow-lg shadow-purple-200">โหวตพรรคนี้</button>
            </div>
        )}

      </div>
    </div>
  );
}

function MemberImage({ url, small }) {
    const [error, setError] = useState(false);
    
    if (error || !url) {
        return <User className={`${small ? 'w-5 h-5' : 'w-10 h-10'} text-slate-300`} />;
    }
    
    return (
        <img 
            src={url} 
            className="w-full h-full object-cover"
            onError={() => setError(true)}
        />
    );
}