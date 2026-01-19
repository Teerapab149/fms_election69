"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { 
  CheckCircle2, XCircle, Ban, BookOpen, Users, Info, 
  Flag, X, ChevronLeft, ChevronRight, ZoomIn, Check 
} from "lucide-react";

// --- 1. LIGHTBOX (คงเดิมเพราะโอเคแล้ว) ---
const SimpleLightbox = ({ isOpen, onClose, images, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); setCurrentIndex(initialIndex); return () => setMounted(false); }, [initialIndex]);
    useEffect(() => { if (isOpen) document.body.style.overflow = 'hidden'; else document.body.style.overflow = 'unset'; return () => { document.body.style.overflow = 'unset'; }; }, [isOpen]);

    if (!mounted || !isOpen || !images?.length) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <button onClick={onClose} className="absolute top-6 right-6 z-[100] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full"><X size={28} /></button>
            {images.length > 1 && (
                <>
                    <button onClick={(e) => {e.stopPropagation(); setCurrentIndex((p) => (p - 1 + images.length) % images.length)}} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full"><ChevronLeft size={40} /></button>
                    <button onClick={(e) => {e.stopPropagation(); setCurrentIndex((p) => (p + 1) % images.length)}} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full"><ChevronRight size={40} /></button>
                </>
            )}
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                <img src={images[currentIndex] || "/images/avatar-placeholder.png"} alt="Lightbox" className="w-auto h-auto max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg pointer-events-auto" />
            </div>
            {images.length > 1 && <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 px-6 py-2 rounded-full text-white text-sm backdrop-blur-md">{currentIndex + 1} / {images.length}</div>}
        </div>, document.body
    );
};

// --- 2. MAIN COMPONENT ---
export default function SinglePartyView({ 
    candidate, 
    selectedPartyId,  // รับค่า ID ที่ถูกเลือกมาจาก Parent
    onSelect,         // ฟังก์ชันสั่งเลือก (ส่ง ID กลับไป)
    specialOptions    // object เก็บข้อมูล { abstain, disapprove }
}) {
    const [activeTab, setActiveTab] = useState("INFO");
    const contentRef = useRef(null);

    // Image Logic
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
    const [bannerImages, setBannerImages] = useState([]);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // ดึงรูปภาพ
    useEffect(() => {
        const fetchImages = async () => {
            if (!candidate?.id) return;
            try {
                const res = await fetch(`/api/gallery?id=${candidate.id}`);
                const data = await res.json();
                setBannerImages(data.images?.length ? data.images : [candidate.groupImageUrl || "/images/placeholder-banner.jpg"]);
            } catch { setBannerImages(["/images/placeholder-banner.jpg"]); }
        };
        fetchImages();
    }, [candidate]);

    // Auto Slide
    useEffect(() => {
        if (bannerImages.length <= 1) return;
        const interval = setInterval(() => setCurrentBgIndex((p) => (p + 1) % bannerImages.length), 5000);
        return () => clearInterval(interval);
    }, [bannerImages]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const openLightbox = (images, index = 0) => {
        setLightboxImages(Array.isArray(images) ? images : [images]);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    // --- LOGIC ปุ่มกด (Active State) ---
    // เช็คว่าปุ่มไหนต้องแสดงสี Highlight
    const isVoteSelected = selectedPartyId === candidate?.id;
    const isDisapproveSelected = selectedPartyId === specialOptions?.disapprove?.id;
    const isAbstainSelected = selectedPartyId === specialOptions?.abstain?.id;

    const VoteButtons = ({ isDesktop = false }) => (
        <div className={`flex items-center gap-3 ${isDesktop ? 'flex-col w-full' : 'flex-row w-full'}`}>
            
            {/* 1. ปุ่มโหวตรับรอง (ตัวเอก) */}
            <button 
                onClick={() => onSelect(candidate.id)}
                className={`transition-all duration-200 border font-bold flex items-center justify-center gap-2 group relative overflow-hidden
                ${isDesktop ? "w-full py-5 rounded-2xl text-lg" : "flex-[1.5] py-3 rounded-full text-sm"}
                ${isVoteSelected 
                    ? "bg-[#8A2680] border-[#8A2680] text-white shadow-xl ring-4 ring-purple-100 scale-[1.02]" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-[#8A2680] hover:text-[#8A2680]"
                }`}
            >
                {isVoteSelected ? <CheckCircle2 size={isDesktop?28:20} className="text-white" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-[#8A2680]" />}
                <span>ลงคะแนนรับรอง</span>
            </button>

            {/* Container ปุ่มรอง */}
            <div className={`flex gap-3 ${isDesktop ? 'w-full grid grid-cols-2' : 'flex-1'}`}>
                
                {/* 2. ไม่รับรอง */}
                <button 
                    onClick={() => onSelect(specialOptions?.disapprove?.id)}
                    className={`transition-all duration-200 border font-bold flex items-center justify-center gap-2
                    ${isDesktop ? "py-4 rounded-xl" : "flex-1 py-3 rounded-full text-xs"}
                    ${isDisapproveSelected
                        ? "bg-rose-600 border-rose-600 text-white shadow-lg ring-4 ring-rose-100"
                        : "bg-white border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-600"
                    }`}
                >
                    {isDisapproveSelected ? <XCircle size={20} /> : <Ban size={18} />}
                    <span>ไม่รับรอง</span>
                </button>

                {/* 3. งดออกเสียง */}
                <button 
                    onClick={() => onSelect(specialOptions?.abstain?.id)}
                    className={`transition-all duration-200 border font-bold flex items-center justify-center gap-2
                    ${isDesktop ? "py-4 rounded-xl" : "flex-shrink-0 px-4 py-3 rounded-full text-xs"}
                    ${isAbstainSelected
                        ? "bg-slate-700 border-slate-700 text-white shadow-lg ring-4 ring-slate-100"
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600"
                    }`}
                >
                    <div className={`w-4 h-4 rounded-full border-2 ${isAbstainSelected ? 'border-white bg-white' : 'border-current'}`} />
                    <span className={!isDesktop ? "hidden sm:inline" : ""}>งดออกเสียง</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            <SimpleLightbox isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} images={lightboxImages} initialIndex={lightboxIndex} />

            <div className="w-full max-w-7xl mx-auto px-4 pb-48 lg:pb-20 pt-6 animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT COLUMN: Fixed Info */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100 relative group">
                            {/* Banner */}
                            <div className="relative h-64 cursor-zoom-in" onClick={() => openLightbox(bannerImages, currentBgIndex)}>
                                {bannerImages.map((img, idx) => (
                                    <Image key={idx} src={img} alt="Banner" fill className={`object-cover transition-opacity duration-1000 ${idx === currentBgIndex ? 'opacity-100' : 'opacity-0'}`} />
                                ))}
                                <div className="absolute top-4 right-4 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn size={18} /></div>
                            </div>

                            {/* Info */}
                            <div className="p-8 text-center relative">
                                <div className="w-36 h-36 mx-auto -mt-24 relative z-10 mb-5 rounded-3xl border-[6px] border-white bg-white shadow-lg overflow-hidden cursor-zoom-in group-hover:scale-105 transition-transform" onClick={(e) => { e.stopPropagation(); openLightbox(candidate.logoUrl); }}>
                                    <Image src={candidate.logoUrl || "/images/placeholder-logo.png"} alt="logo" fill className="object-contain p-2" />
                                </div>
                                <div className="inline-block px-4 py-1.5 bg-purple-50 text-[#8A2680] text-xs font-bold uppercase tracking-wider rounded-full mb-3">ผู้สมัครหมายเลข {candidate.number}</div>
                                <h1 className="text-3xl font-black text-slate-800 mb-2">{candidate.name}</h1>
                                <p className="text-slate-500 font-medium">"{candidate.slogan}"</p>
                            </div>
                        </div>

                        {/* DESKTOP BUTTONS: Sticky แบบ Manual (ไม่ใช้ position: sticky ที่ทำให้บั๊ก) */}
                        <div className="hidden lg:block">
                            <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 text-center">เลือกการลงคะแนนของคุณ</h3>
                                <VoteButtons isDesktop={true} />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Content */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                        {/* Tabs */}
                        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-1.5 flex gap-2 sticky top-20 z-20">
                            {[
                                { id: "INFO", label: "ข้อมูลทั่วไป", icon: Info },
                                { id: "POLICY", label: "นโยบาย", icon: BookOpen },
                                { id: "MEMBERS", label: "คณะทำงาน", icon: Users },
                            ].map((tab) => (
                                <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:bg-slate-50"}`}>
                                    <tab.icon size={18} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Details */}
                        <div ref={contentRef} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[500px]">
                            {activeTab === "INFO" && (
                                <div className="space-y-8 animate-in fade-in">
                                    <div><h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2"><Flag className="text-purple-500"/> พันธกิจ</h3><p className="text-slate-600 leading-relaxed text-lg">{candidate.mission || "-"}</p></div>
                                    <hr className="border-slate-100"/>
                                    <div><h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2"><Info className="text-blue-500"/> ความหมายสัญลักษณ์</h3><p className="text-slate-600 leading-relaxed text-lg">{candidate.symbolMeaning || "-"}</p></div>
                                </div>
                            )}
                            {activeTab === "POLICY" && (
                                <div className="space-y-4 animate-in fade-in">
                                    {candidate.policies?.map((p, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="w-10 h-10 shrink-0 bg-[#8A2680] text-white rounded-full flex items-center justify-center font-bold text-lg">{i+1}</div>
                                            <div><h4 className="font-bold text-lg text-slate-800">{p.title}</h4><p className="text-slate-500">{p.desc}</p></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {activeTab === "MEMBERS" && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in">
                                    {candidate.members?.map((m, i) => (
                                        <div key={i} className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-slate-100 cursor-zoom-in" onClick={() => openLightbox(m.imageUrl)}>
                                            <Image src={m.imageUrl || "/images/avatar-placeholder.png"} alt={m.name} fill className="object-cover transition-transform group-hover:scale-105"/>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"/>
                                            <div className="absolute bottom-3 left-3 text-white"><div className="text-[10px] opacity-80">{m.role}</div><div className="text-sm font-bold">{m.name}</div></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE FLOATING BUTTONS */}
            <div className="lg:hidden fixed bottom-20 left-0 w-full z-30 px-4 pointer-events-none">
                <div className="bg-white p-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-100 pointer-events-auto">
                    <VoteButtons isDesktop={false} />
                </div>
            </div>
        </>
    );
}