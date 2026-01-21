"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  CheckCircle2, XCircle, Ban, ArrowDown, Target, 
  ChevronLeft, ChevronRight, X, Sparkles, Star, Quote,
  User, LogOut, LogIn, Home, Menu
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';
import Image from 'next/image';
// แก้ไขพาธให้ถูกต้องตามโครงสร้าง: src/components/vote/ -> src/components/
import SmartImage from '../SmartImage';

// --- 1. UTILS & HOOKS ---
function useOnScreen(ref, rootMargin = "0px") {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
          observer.disconnect(); 
        }
      },
      { rootMargin }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return isIntersecting;
}

const Reveal = ({ children, delay = 0, className = "" }) => {
    const ref = useRef(null);
    const isOnScreen = useOnScreen(ref, "-50px");
    
    return (
        <div 
            ref={ref}
            className={`transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1) transform ${className} ${
                isOnScreen ? "opacity-100 translate-y-0 scale-100 blur-0" : "opacity-0 translate-y-12 scale-95 blur-md"
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// --- 2. CINEMATIC NAVBAR (Sub-component) ---
const CinematicNavbar = ({ onScrollTo }) => {
    const { data: session, status } = useSession();
    const [scrolled, setScrolled] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const isLoggedIn = status === "authenticated" && session;
    const user = session?.user;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${
            scrolled ? 'py-3 bg-black/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl' : 'py-8 bg-transparent'
        }`}>
            <div className="container mx-auto px-4 md:px-10 flex items-center justify-between pt-[env(safe-area-inset-top,0px)]">
                
                {/* โซนซ้าย: โลโก้คู่ตามแบบที่คุณต้องการ */}
                <Link href="/" className="flex items-center gap-2 md:gap-4 group">
                    <div className="hidden sm:block transition-transform group-hover:scale-110 duration-500 flex-shrink-0">
                        <Image src="/images/logo/fms_logo50_color.png" alt="Logo" width={100} height={100} className="w-auto h-9 md:h-12 lg:h-14 object-contain" />
                    </div>
                    <div className="hidden sm:block h-6 md:h-8 w-[1px] bg-white/20 mx-1"></div>
                    <Image src="/images/logo/FMS_Standard_Logo_PNG.png" alt="FMS" width={300} height={80} className="block w-auto h-7 md:h-9 object-contain brightness-0 invert opacity-80" />
                </Link>

                {/* โซนกลาง: Navigation */}
                <div className="hidden lg:flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full px-5 py-2 backdrop-blur-md shadow-inner text-white">
                    <Link href="/" className="p-2 text-gray-500 hover:text-white transition-all"><Home size={18} /></Link>
                    <div className="w-px h-4 bg-white/10 mx-2" />
                    {['Vision', 'Policy', 'Squad', 'Vote'].map((label) => (
                        <button key={label} onClick={() => onScrollTo(`${label.toLowerCase()}-section-immersive`)} className="text-gray-400 hover:text-purple-400 px-4 py-1 text-[10px] font-black tracking-[0.2em] uppercase transition-all">{label}</button>
                    ))}
                </div>

                {/* โซนขวา: User Menu */}
                <div className="flex items-center gap-4 text-white" ref={dropdownRef}>
                    {isLoggedIn ? (
                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 border ${isProfileOpen ? 'bg-purple-600 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.5)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                <User size={20} />
                            </button>
                            {isProfileOpen && (
                                <div className="absolute right-0 top-full mt-4 w-64 bg-[#0a0518]/95 backdrop-blur-3xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="p-6 border-b border-white/5 bg-gradient-to-br from-purple-900/20 to-transparent">
                                        <p className="text-sm font-black text-white truncate mb-1">{user.name}</p>
                                        <p className="text-[10px] text-purple-400 font-bold tracking-widest uppercase truncate">{user.studentId || 'STUDENT ID'}</p>
                                    </div>
                                    <div className="p-2"><button onClick={() => signOut({ redirect: false }).then(() => window.location.href = "/")} className="flex items-center gap-3 w-full px-5 py-4 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"><LogOut size={16} />ออกจากระบบ</button></div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 shadow-xl transition-all"><LogIn size={20} /></Link>
                    )}
                    <button className="lg:hidden p-2.5 text-white/60 bg-white/5 border border-white/10 rounded-xl"><Menu size={20} /></button>
                </div>
            </div>
        </nav>
    );
};

// --- 3. CINEMATIC INTRO (True Black Mask Version) ---
const IntroOverlay = ({ onComplete, onStartExit, candidateName, candidateImage }) => {
    const [phase, setPhase] = useState(-1);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const start = setTimeout(() => setPhase(0), 500);
        const t1 = setTimeout(() => setPhase(1), 3500); 
        const t2 = setTimeout(() => {
            setPhase(2);
            setIsExiting(true);
            onStartExit(); 
        }, 6500);
        const t3 = setTimeout(() => onComplete(), 8000);
        return () => [start, t1, t2, t3].forEach(clearTimeout);
    }, [onComplete, onStartExit]);

    return createPortal(
        <div className={`fixed inset-0 z-[99999] bg-[#030008] flex flex-col items-center justify-center transition-all duration-[2000ms] ease-in-out ${isExiting ? 'opacity-0 scale-105 blur-3xl pointer-events-none' : 'opacity-100'}`}>
            
            {/* 🔋 Battery & Home Area Filler (บังคับดำสนิททับพื้นที่ Safe Area) */}
            <div className="absolute top-0 left-0 w-full h-[env(safe-area-inset-top,48px)] bg-[#030008] z-[100]" />
            <div className="absolute bottom-0 left-0 w-full h-[env(safe-area-inset-bottom,24px)] bg-[#030008] z-[100]" />
            
            <div className="absolute inset-0 z-0 opacity-20 scale-125 animate-slow-pan">
                <SmartImage src={candidateImage} alt="bg" fill className="object-cover blur-[100px]" />
            </div>
            
            <div className="relative z-10 w-full max-w-6xl px-6 text-center">
                <div className={`transition-all duration-[1500ms] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full
                    ${phase === 0 ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-2xl pointer-events-none'}`}>
                    <div className="flex flex-col items-center">
                        <span className="text-purple-500 text-[10px] md:text-sm tracking-[1.2em] font-black mb-8 uppercase animate-pulse">Welcome to</span>
                        <h1 className="text-2xl md:text-5xl lg:text-7xl font-black text-white tracking-tight leading-tight px-4 text-center">
                            ยินดีต้อนรับสู่ระบบเลือกตั้ง<br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500">
                                สโมสรนักศึกษา 2569
                            </span>
                        </h1>
                    </div>
                </div>

                <div className={`transition-all duration-[1500ms] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full
                    ${phase === 1 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-110 blur-xl translate-y-10 pointer-events-none'}`}>
                     <div className="flex flex-col items-center px-6">
                        <p className="text-purple-400 text-[9px] md:text-xs tracking-[0.8em] uppercase mb-10 font-black italic opacity-50 text-center">Now Presenting</p>
                        <h2 className="text-4xl md:text-7xl lg:text-9xl font-black text-white tracking-tighter break-words max-w-full drop-shadow-[0_0_80px_rgba(168,85,247,0.5)] text-center">
                            {candidateName}
                        </h2>
                        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-16 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                     </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 h-1 bg-purple-500 transition-all duration-[7500ms] ease-linear shadow-[0_0_30px_rgba(168,85,247,0.8)]" 
                 style={{ width: phase < 2 ? '100%' : '0%' }}/>
        </div>, document.body
    );
};

// --- 4. MAIN COMPONENT ---
export default function SinglePartyView({ candidate, selectedPartyId, onSelect, specialOptions }) {
    const [mounted, setMounted] = useState(false);
    const [isIntroActive, setIsIntroActive] = useState(true);
    const [isContentVisible, setIsContentVisible] = useState(false);
    const [bannerImages, setBannerImages] = useState([]);
    
    // จัดการ Safe Area และการลบขอบขาวแบบลึกที่สุด
    useEffect(() => {
        setMounted(true);
        
        // บังคับสี HTML/Body ทันทีเพื่อกันขอบขาวตั้งแต่วินาทีแรก
        const html = document.documentElement;
        const body = document.body;
        html.style.backgroundColor = "#030008";
        body.style.backgroundColor = "#030008";
        
        // แก้ไข Viewport ให้ทับ Notch มือถือ (Viewport-fit cover)
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
        }

        // บังคับสี Theme ของ Browser และแถบสถานะ iOS ให้ดำสนิท
        const setMeta = (name, content) => {
            let meta = document.querySelector(`meta[name="${name}"]`) || document.createElement('meta');
            meta.name = name; meta.content = content;
            document.head.appendChild(meta);
        };
        setMeta("theme-color", "#030008");
        setMeta("apple-mobile-web-app-status-bar-style", "black-translucent");

        if (isIntroActive) {
            html.style.overflow = 'hidden';
            body.style.overflow = 'hidden';
        } else {
            html.style.overflow = '';
            body.style.overflow = '';
        }
    }, [isIntroActive]);

    useEffect(() => {
        const fetchImages = async () => {
            if (!candidate?.id) return;
            try {
                const res = await fetch(`/api/gallery?id=${candidate.id}`);
                const data = await res.json();
                setBannerImages(data.images?.length ? data.images : [candidate.groupImageUrl || "/images/placeholder-banner.jpg"]);
            } catch { setBannerImages([candidate.groupImageUrl || "/images/placeholder-banner.jpg"]); }
        };
        fetchImages();
    }, [candidate]);

    const scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    const isSelected = (id) => selectedPartyId === id;
    const groupImage = candidate.groupImageUrl || "/images/placeholder-banner.jpg";

    if (!mounted) return null;

    return createPortal(
        <>
            <style jsx global>{`
                :root { background-color: #030008; }
                html, body {
                    background-color: #030008 !important;
                    margin: 0; padding: 0;
                    overscroll-behavior-y: none; /* ป้องกันแถบขาวเวลารูดจอ */
                    color-scheme: dark;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes slow-pan {
                    0% { transform: scale(1.05) translate(0, 0); }
                    100% { transform: scale(1.15) translate(-2%, -1%); }
                }
                .animate-slow-pan { animation: slow-pan 30s ease-in-out infinite alternate; }
            `}</style>

            {isIntroActive && (
                <IntroOverlay 
                    candidateName={candidate.name}
                    candidateImage={groupImage} 
                    onStartExit={() => setIsContentVisible(true)} 
                    onComplete={() => setIsIntroActive(false)} 
                />
            )}

            <div className={`fixed inset-0 z-[50] bg-[#030008] text-white font-sans selection:bg-purple-500/40 overflow-x-hidden overflow-y-auto transition-all duration-[2500ms] ease-out ${isContentVisible ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-3xl pointer-events-none'}`}>
                
                <CinematicNavbar onScrollTo={scrollToSection} />

                {/* --- HERO SECTION --- */}
                <section className="relative h-[100dvh] flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 opacity-20 md:opacity-30 scale-110 animate-slow-pan">
                             <SmartImage src={groupImage} alt="BG" fill className="object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-[#030008] via-transparent to-[#030008]" />
                    </div>
                    <div className="relative z-10 text-center px-6 w-full max-w-7xl mx-auto flex flex-col items-center">
                        <Reveal delay={200}><div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-purple-500/20 bg-purple-950/20 backdrop-blur-md text-[10px] font-black tracking-[0.4em] uppercase text-purple-300 mb-8 md:mb-12"><Sparkles size={14} className="text-purple-400" /> Official Candidate</div></Reveal>
                        <Reveal delay={400}><div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-8 mb-4 select-none"><span className="text-xl md:text-5xl font-thin text-white/20 uppercase italic tracking-widest">No.</span><span className="text-[42vw] md:text-[18rem] lg:text-[22rem] font-black leading-none text-white drop-shadow-[0_0_80px_rgba(168,85,247,0.4)]">{candidate.number}</span></div></Reveal>
                        <Reveal delay={600}><div className="space-y-4 md:space-y-8 max-w-5xl"><h2 className="text-3xl md:text-7xl lg:text-9xl font-black text-white tracking-tighter leading-tight text-center">{candidate.name}</h2><p className="text-base md:text-2xl lg:text-3xl text-purple-200/40 font-light italic px-4 leading-relaxed tracking-wide text-center">"{candidate.slogan || 'Step forward for the new era'}"</p></div></Reveal>
                        <div className="mt-12 md:mt-20 animate-bounce cursor-pointer opacity-30 hover:opacity-100 transition-opacity" onClick={() => scrollToSection('vision-section-immersive')}><ArrowDown size={32} /></div>
                    </div>
                </section>

                {/* --- VISION SECTION --- */}
                <section id="vision-section-immersive" className="py-20 md:py-48 px-6 md:px-12 relative z-10 border-t border-white/5 bg-[#030008]">
                    <div className="max-w-7xl mx-auto px-4 md:px-0">
                        <Reveal>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
                                <div className="relative group aspect-square max-w-md mx-auto lg:max-w-none w-full">
                                    <div className="absolute -inset-4 bg-purple-600 rounded-[3rem] blur-[60px] opacity-10 group-hover:opacity-25 transition-all duration-1000"></div>
                                    <div className="relative h-full rounded-[4rem] overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all duration-700 group-hover:scale-[1.02] group-hover:border-purple-500/30 shadow-2xl">
                                        <SmartImage src={candidate.logoUrl || "/images/placeholder-logo.png"} alt="Logo" fill className="object-contain p-16 md:p-28 lg:p-36" />
                                    </div>
                                </div>
                                <div className="space-y-12 md:space-y-16 text-left">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4"><div className="w-12 h-[2px] bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]" /><span className="text-purple-500 font-black tracking-[0.5em] uppercase text-[10px] md:text-xs">Our Commitment</span></div>
                                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-tight">วิสัยทัศน์<br/><span className="text-white/20 italic font-thin">สู่ยุคใหม่</span></h2>
                                    </div>
                                    <div className="space-y-10 md:space-y-12">
                                        {Array.isArray(candidate.missions) ? candidate.missions.map((m, i) => (
                                            <div key={i} className="flex gap-8 group"><span className="text-4xl md:text-6xl font-black text-white/[0.03] group-hover:text-purple-600/30 transition-all duration-700 select-none">0{i+1}</span><p className="text-lg md:text-2xl text-gray-400 group-hover:text-white transition-all duration-700 leading-relaxed pt-3">{m}</p></div>
                                        )) : <p className="text-xl md:text-2xl text-gray-400 italic font-light leading-relaxed">"{candidate.mission}"</p>}
                                    </div>
                                    <div className="p-8 md:p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group shadow-2xl">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform"><Quote size={80} /></div>
                                        <Quote size={32} className="text-purple-500 mb-6" /><p className="text-gray-300 font-light italic text-lg md:text-2xl leading-relaxed relative z-10 text-left">"{candidate.logoMeaning || "สร้างสรรค์สังคมนักศึกษาที่ดียิ่งขึ้นไปพร้อมกับพวกเรา"}"</p>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* --- POLICY SECTION --- */}
                <section id="policy-section-immersive" className="py-20 md:py-48 bg-black/50 border-y border-white/5 relative overflow-hidden text-left">
                    <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                        <Reveal><h2 className="text-5xl md:text-[9rem] font-black text-white mb-16 tracking-tighter uppercase opacity-80 select-none">POLICIES</h2></Reveal>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                            {(candidate.policies || []).map((p, i) => (
                                <Reveal key={i} delay={i * 150}>
                                    <div className="p-10 md:p-12 rounded-[3.5rem] bg-white/[0.03] border border-white/10 hover:border-purple-500/50 hover:bg-white/[0.06] transition-all duration-700 h-full flex flex-col group relative overflow-hidden shadow-xl">
                                        <div className="absolute -top-4 -right-4 text-8xl font-black text-white/[0.02] group-hover:text-purple-600/[0.05] transition-all duration-700 select-none">0{i+1}</div>
                                        <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center font-black text-xl mb-10 group-hover:scale-110 transition-transform shadow-2xl shadow-purple-900/40">{i+1}</div>
                                        <h3 className="text-2xl md:text-3xl font-bold mb-6 group-hover:text-purple-300 transition-colors leading-tight relative z-10">{typeof p === 'string' ? p : p.title}</h3>
                                        <p className="text-gray-500 group-hover:text-gray-300 transition-all duration-700 font-light leading-relaxed text-lg relative z-10">{typeof p !== 'string' && p.desc}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- SQUAD SECTION --- */}
                <section id="squad-section-immersive" className="py-20 md:py-48 bg-[#030008] overflow-hidden text-left">
                    <div className="container mx-auto px-6">
                        <Reveal>
                            <div className="flex flex-col md:flex-row items-baseline md:items-end justify-between mb-20 gap-8 px-4">
                                <div><h2 className="text-7xl md:text-9xl lg:text-[11rem] font-black text-white/5 uppercase tracking-tighter leading-none mb-6 select-none">The Squad</h2><div className="flex items-center gap-3 pl-2"><div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_15px_rgba(168,85,247,1)]" /><p className="text-purple-500 font-black tracking-[0.6em] uppercase text-[10px] md:text-sm">ทีมนักบริหารคุณภาพ</p></div></div>
                                <div className="flex gap-4"><button onClick={() => document.getElementById('squad-scroll').scrollBy({left: -320, behavior: 'smooth'})} className="p-4 md:p-6 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all shadow-xl active:scale-90"><ChevronLeft size={28} /></button><button onClick={() => document.getElementById('squad-scroll').scrollBy({left: 320, behavior: 'smooth'})} className="p-4 md:p-6 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all shadow-xl active:scale-90"><ChevronRight size={28} /></button></div>
                            </div>
                        </Reveal>
                        <div id="squad-scroll" className="flex gap-8 md:gap-12 overflow-x-auto pb-16 snap-x snap-mandatory no-scrollbar px-4">
                            {(candidate.members || []).map((m, i) => (
                                <div key={i} className="snap-center shrink-0 w-[290px] md:w-[400px] lg:w-[480px]">
                                    <Reveal delay={i * 50}>
                                        <div className="aspect-[3/4.2] rounded-[3.5rem] md:rounded-[4.5rem] overflow-hidden relative group border border-white/5 bg-black shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                                            <SmartImage src={m.imageUrl || "/images/avatar-placeholder.png"} alt={m.name} fill className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 opacity-70 group-hover:opacity-100" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-95" />
                                            <div className="absolute bottom-0 left-0 p-10 md:p-14 w-full transform translate-y-6 group-hover:translate-y-0 transition-transform duration-700 text-left">
                                                <span className="px-5 py-2 bg-purple-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block shadow-2xl shadow-purple-900/60">{m.role || 'Member'}</span>
                                                <h3 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4">{m.name}</h3>
                                                <p className="text-white/20 text-sm md:text-base font-mono tracking-[0.3em] font-bold uppercase">{m.studentId || '6610XXXXXX'}</p>
                                            </div>
                                        </div>
                                    </Reveal>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- VOTE SECTION --- */}
                <section id="vote-section-immersive" className="py-24 md:py-56 px-6 bg-gradient-to-t from-purple-950/30 to-[#030008] border-t border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_80%)] pointer-events-none" />
                    <div className="max-w-6xl mx-auto text-center relative z-10">
                        <Reveal><div className="flex flex-col items-center gap-10 mb-24 md:mb-36"><div className="p-5 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(168,85,247,0.3)]"><Target className="text-purple-400" size={36} /></div><h2 className="text-6xl md:text-[10rem] font-black text-white tracking-tighter uppercase leading-none opacity-90 drop-shadow-2xl">ลงคะแนน</h2><p className="text-xl md:text-3xl text-gray-500 max-w-2xl font-extralight italic leading-relaxed px-4 text-center">"เสียงของคุณคือจุดเริ่มต้นของการเปลี่ยนแปลงเพื่ออนาคตที่ดีกว่า"</p></div></Reveal>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
                            <div className="md:col-span-8 group text-left">
                                <button onClick={() => onSelect(candidate.id)} className={`w-full p-12 md:p-20 rounded-[3.5rem] md:rounded-[4.5rem] border transition-all duration-700 flex flex-col items-center gap-10 ${isSelected(candidate.id) ? 'bg-purple-600 border-transparent shadow-[0_0_100px_rgba(147,51,234,0.5)] scale-105 ring-4 ring-purple-400/30' : 'bg-white/[0.03] border-white/10 hover:border-purple-500/50'}`}>
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-700 ${isSelected(candidate.id) ? 'bg-white text-purple-600 scale-110 rotate-12 shadow-2xl' : 'bg-white/5 text-gray-700 group-hover:scale-110'}`}><CheckCircle2 size={48} /></div>
                                    <div className="space-y-4 text-center"><span className="text-3xl md:text-6xl font-black uppercase tracking-tighter block">โหวตหมายเลข {candidate.number}</span><span className={`text-base md:text-xl font-bold tracking-[0.4em] uppercase block ${isSelected(candidate.id) ? 'text-white/60' : 'text-gray-600'}`}>{candidate.name}</span></div>
                                </button>
                            </div>
                            <div className="md:col-span-4 flex flex-col gap-6 md:gap-10">
                                <button onClick={() => onSelect(specialOptions?.disapprove?.id)} className={`flex-1 p-10 md:p-12 rounded-[3.5rem] border transition-all duration-700 flex flex-col items-center justify-center gap-4 group ${isSelected(specialOptions?.disapprove?.id) ? 'bg-red-600 border-transparent shadow-[0_0_80px_rgba(220,38,38,0.4)] ring-4 ring-red-400/30' : 'bg-white/[0.03] border-white/10 hover:border-red-500/50'}`}><XCircle size={44} className={isSelected(specialOptions?.disapprove?.id) ? 'text-white' : 'text-gray-700 group-hover:text-red-500 transition-colors'} /><span className="font-black text-2xl md:text-3xl uppercase tracking-tighter">ไม่รับรอง</span></button>
                                <button onClick={() => onSelect(specialOptions?.abstain?.id)} className={`flex-1 p-10 md:p-12 rounded-[3.5rem] border transition-all duration-700 flex flex-col items-center justify-center gap-4 group ${isSelected(specialOptions?.abstain?.id) ? 'bg-zinc-700 border-transparent shadow-2xl ring-4 ring-zinc-500/30' : 'bg-white/[0.03] border-white/10 hover:border-zinc-500/50'}`}><Ban size={44} className={isSelected(specialOptions?.abstain?.id) ? 'text-white' : 'text-gray-700 group-hover:text-zinc-400 transition-colors'} /><span className="font-black text-2xl md:text-3xl uppercase tracking-tighter">งดออกเสียง</span></button>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="py-24 flex flex-col items-center gap-12 opacity-20 hover:opacity-100 transition-opacity duration-1500 text-white">
                    <div className="h-24 w-px bg-gradient-to-b from-purple-600 via-purple-600 to-transparent" />
                    <div className="flex items-center gap-6 text-[10px] md:text-xs font-black tracking-[1.2em] uppercase px-10 text-center leading-loose"><Sparkles size={16} className="text-purple-500" />FMS Election System 2026<Sparkles size={16} className="text-purple-500" /></div>
                </footer>
            </div>
        </>
    , document.body);
}