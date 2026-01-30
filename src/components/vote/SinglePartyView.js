"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Sparkles,
  Target,
  XCircle,
  Ban,
  ZoomIn,
  ChevronDown,
  ChevronUp,
  Anchor,
  Sailboat,
  Wind,
  Compass,
  ArrowRight
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";

// นำเข้า SmartImage
import SmartImage from "../SmartImage";

// นำเข้า components ที่แยกออกมา (Refactored)
import { Reveal, RevealGrid, renderPartyTitle } from "./shared/animations";
import CandidateModal from "../CandidateModal";
import SimpleLightbox from "./SimpleLightbox";
import AutoIntro from "./AutoIntro";
import CinematicNavbar from "./CinematicNavbar";
import ThreeDCarousel from "./ThreeDCarousel";
import LiquidHero from "./LiquidHero.js";

export default function SinglePartyView({ candidate, selectedPartyId, onSelect, specialOptions, user }) {
  const [portalContainer, setPortalContainer] = useState(null);
  const [bannerImages, setBannerImages] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [introFinished, setIntroFinished] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMobileDockOpen, setIsMobileDockOpen] = useState(true);

  // --- 1. DATA ---
  const partyName = candidate?.name || "The Unity Concord";
  const partyNumber = candidate?.number || 1;
  const placeholderPath = "/images/logo/fms_logo50_color.png";
  const partyLogo = candidate?.logoUrl || placeholderPath;
  const partyImage = placeholderPath;
  const policies = candidate?.policies || [];
  const missions = candidate?.missions || [];
  const members = candidate?.members || [];

  // --- 2. IMAGE PREPARATION ---
  const carouselImages = useMemo(() => {
    const groupData = candidate?.groupImageUrls;
    if (!groupData) return [partyLogo];
    let images = [];
    try {
      if (Array.isArray(groupData)) images = groupData;
      else if (typeof groupData === 'string') {
        const trimmed = groupData.trim();
        if (trimmed.startsWith('[')) images = JSON.parse(trimmed);
        else images = [trimmed];
      }
    } catch (e) { console.error("Error parsing groupImageUrls:", e); images = typeof groupData === 'string' ? [groupData] : []; }
    images = images.filter(url => url && typeof url === 'string');
    if (images.length === 0) return [partyLogo];
    return images;
  }, [candidate?.groupImageUrls, partyLogo]);

  // --- 2.1 MOBILE HERO IMAGE PREPARATION ---
  const mobileHeroImages = useMemo(() => {
    const mobileData = candidate?.mobileHeroImage;
    if (!mobileData) return [];
    let images = [];
    try {
      if (Array.isArray(mobileData)) images = mobileData;
      else if (typeof mobileData === 'string') {
        const trimmed = mobileData.trim();
        if (trimmed.startsWith('[')) images = JSON.parse(trimmed);
        else images = [trimmed];
      }
    } catch (e) {
      console.error("Error parsing mobileHeroImage:", e);
      images = typeof mobileData === 'string' ? [mobileData] : [];
    }
    return images.filter(url => url && typeof url === 'string');
  }, [candidate?.mobileHeroImage]);

  // --- 2.2 OFFICIAL IMAGE PREPARATION (Desktop/Cover) ---
  const officialImages = useMemo(() => {
    const data = candidate?.officialImageUrl;
    if (!data) return [];
    let images = [];
    try {
      if (Array.isArray(data)) images = data;
      else if (typeof data === 'string') {
        const trimmed = data.trim();
        if (trimmed.startsWith('[')) images = JSON.parse(trimmed);
        else images = [trimmed];
      }
    } catch (e) {
      console.error("Error parsing officialImageUrl:", e);
      images = typeof data === 'string' ? [data] : [];
    }
    return images.filter(url => url && typeof url === 'string');
  }, [candidate?.officialImageUrl]);

  // --- 2.3 IMAGE FALLBACK LOGIC ---
  // A. Hero Section Image (Priority: Official -> Mobile -> Group -> Logo)
  const finalHeroImage = officialImages[0] || mobileHeroImages[0] || carouselImages[0] || partyLogo;

  // B. Team Section Mobile Image (Priority: Mobile -> Official -> Group)
  const finalTeamMobileImage = mobileHeroImages[0] || officialImages[0] || carouselImages[0];

  // Old variable alias explicitly for existing references (if any)
  const heroImage = finalHeroImage;

  useEffect(() => {
    const div = document.createElement('div');
    div.id = 'cinematic-root';
    document.body.appendChild(div);
    setPortalContainer(div);
    return () => { if (document.body.contains(div)) document.body.removeChild(div); };
  }, []);

  useEffect(() => {
    setBannerImages([...carouselImages, ...members.map(m => m.imageUrl)]);
  }, [carouselImages, members]);

  // Optimization: handleContentScroll removed to prevent parent re-renders
  // Scroll checking logic moved to CinematicNavbar

  // --- Custom Smooth Scroll ---
  const contentRef = React.useRef(null);
  const isAutoScrolling = React.useRef(false);

  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const scrollTo = (id) => {
    const container = contentRef.current;
    const targetEl = document.getElementById(id);
    if (!container || !targetEl || isAutoScrolling.current) return;

    isAutoScrolling.current = true;
    container.style.pointerEvents = 'none';

    const start = container.scrollTop;
    // Calculate distance relative to the container
    // Since the container is the scrollable element, we need the target's position relative to it.
    // However, getBoundingClientRect returns viewport coordinates.
    // Target Top relative to Viewport - Container Top relative to Viewport + Current Scroll Position
    // Actually, simply: targetEl.offsetTop is often enough if relatively positioned, but safely:
    // targetRect.top - containerRect.top + container.scrollTop
    const targetRect = targetEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const relativeTop = targetRect.top - containerRect.top;

    // Target scroll position
    const targetPosition = start + relativeTop;
    const distance = targetPosition - start;
    const duration = 1200; // Reduced slightly for performance (1.2s)
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      container.scrollTop = start + distance * ease;

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        isAutoScrolling.current = false;
        container.style.pointerEvents = 'auto';
      }
    };

    requestAnimationFrame(animation);
  };

  // --- CSS Animation ---
  const globalStyles = (
    <style jsx global>{`
      @keyframes gradient-flow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .animate-gradient-flow {
        background-size: 200% auto;
        animation: gradient-flow 3s linear infinite;
      }
      
      @keyframes float-up {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Animation ปกติ (สำหรับ Intro) */
      .animate-float-up-1 { animation: float-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
      .animate-float-up-2 { animation: float-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; animation-delay: 0.2s; }
      .animate-float-up-3 { animation: float-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; animation-delay: 0.4s; }

      /* Animation แบบถ่วงเวลา (สำหรับ Hero เพื่อรอ Reveal) */
      .hero-delay.animate-float-up-1 { animation-delay: 1.2s; }
      .hero-delay.animate-float-up-2 { animation-delay: 1.4s; }
      .hero-delay.animate-float-up-3 { animation-delay: 1.6s; }

      @keyframes rotate-beam {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .animate-rotate-beam {
        animation: rotate-beam 8s linear infinite;
      }

      @keyframes pulse-glow {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      .animate-pulse-glow {
        animation: pulse-glow 4s ease-in-out infinite;
      }

      /* Custom Scrollbar for Text Box */
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0,0,0,0.05);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #D4AF37;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #B8860B;
      }

      /* === SPOTLIGHT INTERACTION === */
      #spotlight-content * {
        color: white !important;
        border-color: rgba(255,255,255,0.8) !important;
      }

      /* Specific Override for Discover Button: Turn GOLD in Spotlight */
      #spotlight-content .discover-btn {
        background: linear-gradient(to right, #FCD34D, #B45309) !important;
        color: #1A1A1A !important; 
        box-shadow: 0 0 30px rgba(251, 191, 36, 0.6) !important; 
      }
      #spotlight-content .discover-btn svg {
        color: #1A1A1A !important;
      }

      /* Fix Party Number Badge Visibility (White BG needs Black Text) */
      #spotlight-content .party-number-badge {
        color: #1A1A1A !important;
        border-color: #1A1A1A !important;
      }

      body { overflow: hidden; } 
    `}</style>
  );

  if (!portalContainer) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-white text-[#1A1A1A] font-sans h-[100dvh]">
      {globalStyles}

      <div className={`w-full h-full transition-transform duration-[1500ms] ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform ${introFinished ? "-translate-y-full" : "translate-y-0"}`}>

        {/* Intro */}
        <section className="w-full h-[100dvh] flex-shrink-0 relative">
          <AutoIntro partyName={partyName} partyLogoUrl={partyLogo} finished={introFinished} onComplete={() => setIntroFinished(true)} />
        </section>

        {/* Content Wrapper */}
        <div ref={contentRef} className="w-full h-[100dvh] overflow-y-auto overflow-x-hidden bg-white relative">
          <CinematicNavbar onScrollTo={scrollTo} partyName={partyName} partyLogoUrl={partyLogo} user={user} scrollContainerRef={contentRef} introFinished={introFinished} theme="light" />
          <SimpleLightbox isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} images={bannerImages} initialIndex={lightboxIndex} />

          {/* === 1. HERO SECTION: Redesigned Layout === */}
          <section id="hero" className="relative overflow-hidden">

            {/* --- MOBILE LAYOUT: With Top Padding for Navbar --- */}
            <div className="lg:hidden relative w-full bg-gradient-to-b from-[#FAFAFA] via-[#F5F5F5] to-[#E5E5E5] flex flex-col">

              {/* 1. Image Area (with subtle texture behind) */}
              <div className="relative w-full shrink-0">
                {/* Subtle Texture Behind Image */}
                <div className="absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/soft-wallpaper.png')] pointer-events-none" />

                <SmartImage
                  src={heroImage}
                  alt="Party Official Image"
                  className="w-full h-auto block relative z-10"
                  objectFit="cover"
                  priority={true}
                />

                {/* Gradient for Text Contrast (Lighter) */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#E5E5E5] to-transparent pointer-events-none z-10" />

                {/* "Scroll to Explore" ON THE IMAGE */}
                <div className="absolute bottom-14 md:bottom-56 left-0 w-full flex flex-col items-center justify-end z-20 pointer-events-none">
                  <div className="flex flex-col items-center gap-1 animate-pulse">
                    <span className="text-[10px] md:text-sm text-white font-black tracking-[0.3em] md:tracking-[0.4em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">SCROLL</span>
                    <ChevronDown className="text-white w-5 h-5 md:w-8 md:h-8 animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />
                  </div>
                </div>
              </div>

              {/* 2. Content Action Dock */}
              {isMobileDockOpen ? (
                <div className="relative -mt-20 w-full bg-gradient-to-br from-white/80 via-white/60 to-white/30 backdrop-blur-xl rounded-t-[3rem] px-8 md:px-12 pt-8 pb-10 z-30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_-10px_50px_rgba(0,0,0,0.1)] border-t border-l border-white/60 text-center flex-grow-0 animate-in slide-in-from-bottom-20 fade-in duration-700">
                  {/* Minimize Button */}
                  <button
                    onClick={() => setIsMobileDockOpen(false)}
                    className="absolute top-4 right-4 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-black/5 rounded-full hover:bg-black/10 transition-colors"
                  >
                    <ChevronDown size={14} className="text-black/40 md:w-5 md:h-5" />
                  </button>

                  {/* Decorative Pill */}
                  <div
                    onClick={() => setIsMobileDockOpen(false)}
                    className="w-12 h-1 md:w-16 md:h-1.5 bg-black/10 rounded-full mx-auto mb-4 cursor-pointer hover:bg-black/20 transition-colors"
                  />

                  <Reveal delay={200}>
                    {/* Minimal Metadata - REDESIGNED */}
                    <div className="flex flex-col items-center justify-center gap-1 mb-3 md:mb-5 animate-in zoom-in duration-500">
                      {/* Party Name: BOLDER & CLEARER */}
                      <span className="text-xl md:text-2xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#6A0DAD] via-[#A91079] to-[#E6C200] drop-shadow-sm leading-none">
                        {partyName}
                      </span>
                    </div>

                    <p className="text-[#1A1A1A]/80 font-medium text-xs md:text-base leading-relaxed mb-5 md:mb-8 w-full max-w-sm md:max-w-lg mx-auto line-clamp-2 drop-shadow-sm">
                      "{candidate?.slogan || "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน"}"
                    </p>

                    <div className="flex flex-col gap-3 items-center">
                      <button onClick={() => scrollTo('symbol')} className="group w-full max-w-[280px] md:max-w-[360px] px-6 py-3.5 md:py-4 bg-gradient-to-r from-[#FCD34D] to-[#B45309] text-white font-bold uppercase tracking-widest rounded-full hover:shadow-[0_0_20px_rgba(252,211,77,0.4)] transition-all shadow-lg text-[10px] md:text-sm flex items-center justify-center gap-2 transform active:scale-95 text-shadow-sm">
                        <span>Discover Our Vision</span>
                        <ChevronDown className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-y-1 transition-transform" />
                      </button>

                      <button onClick={() => scrollTo('vote')} className="text-[10px] md:text-sm font-bold text-[#6A0DAD] hover:text-[#1A1A1A] transition-colors flex items-center gap-1 opacity-80 hover:opacity-100">
                        <Target size={12} className="md:w-4 md:h-4" />
                        <span>Ready to Vote? Tap here</span>
                      </button>
                    </div>
                  </Reveal>
                </div>
              ) : (
                <div className="relative -mt-12 w-full flex justify-center pb-8 z-30 animate-in slide-in-from-bottom-5 fade-in duration-300">
                  <button
                    onClick={() => setIsMobileDockOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-white/50 text-[#1A1A1A] font-bold text-xs md:text-sm uppercase tracking-wider hover:scale-105 transition-transform"
                  >
                    <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#6A0DAD] animate-pulse" />
                    View Info & Vote
                    <ChevronUp size={14} className="md:w-5 md:h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* --- RESPONSIVE LAYOUT: "The Hero" Full Screen Cinematic --- */}
            <LiquidHero className="hidden lg:flex min-h-[100dvh] items-center justify-center" members={members} isActive={introFinished}>

              {/* ===== CONTENT: Centered & Dark/Contrast ===== */}
              <div className="flex flex-col items-center justify-center text-center w-full"> {/* Removed max-w-5xl here as the wrapper handles it, or keep it? Wrapper is max-w-6xl. Keep max-w-5xl for tightness. */}

                <Reveal delay={0}>
                  {/* Party Number Badge - Pill Shaped */}
                  <div className="mb-6 lg:mb-8">
                    <span className="px-4 py-2 lg:px-6 lg:py-3 bg-white/80 backdrop-blur-md border border-black/5 text-[#1A1A1A] text-xs lg:text-sm font-bold uppercase tracking-[0.2em] rounded-full shadow-sm party-number-badge">
                      พรรคหมายเลข {partyNumber}
                    </span>
                  </div>

                  {/* Party Name - Bold Charcoal */}
                  <h1 className="text-4xl md:text-6xl xl:text-8xl font-black text-[#1A1A1A] leading-none tracking-tight mb-4 lg:mb-6 drop-shadow-sm">
                    {partyName}
                  </h1>

                  {/* Slogan - Dark Gray */}
                  <p className="text-base md:text-xl lg:text-2xl text-[#1A1A1A]/70 font-medium leading-relaxed mb-8 lg:mb-12 max-w-xl lg:max-w-3xl mx-auto">
                    "{candidate?.slogan || "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน"}"
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 lg:gap-6 w-full px-8">
                    {/* Discover: Magenta Gradient */}
                    <button onClick={() => scrollTo('symbol')} className="w-full md:w-auto group relative px-8 lg:px-10 py-3 lg:py-4 bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] text-white rounded-full font-bold uppercase tracking-widest overflow-hidden shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 discover-btn">
                      <span className="relative z-10 flex items-center justify-center gap-2 text-xs lg:text-base">
                        Discover Our Vision <ChevronDown className="w-4 h-4" />
                      </span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </button>

                    {/* Vote: Dark Outline */}
                    <button onClick={() => scrollTo('vote')} className="w-full md:w-auto px-8 lg:px-10 py-3 lg:py-4 bg-transparent border-2 border-[#1A1A1A] text-[#1A1A1A] rounded-full font-bold uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-xs lg:text-base">
                      <Target className="w-4 h-4" /> Ready to Vote?
                    </button>
                  </div>
                </Reveal>
              </div>
            </LiquidHero>
          </section>

          {/* ===== SCROLL INDICATOR ===== */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer text-[#1A1A1A]" onClick={() => scrollTo('symbol')}>
            <span className="text-[10px] uppercase font-bold tracking-[0.3em]">Scroll</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>

          {/* === 2. Logo Concept (Light Gallery Theme - Hybrid Responsive Layout) === */}
          <section id="symbol" className="w-full bg-[#FAFAF9] relative overflow-hidden py-16 lg:py-24">
            {/* Background Texture (Paper Grain) */}
            <div className="absolute inset-0 opacity-[0.4] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
              <Reveal>
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start relative min-h-[400px]">

                  {/* LEFT COL: Header & Desktop Logo */}
                  <div className="w-full lg:w-5/12 relative z-20 flex flex-col">

                    {/* Header Block */}
                    <div className="mb-4 md:mb-0 lg:mb-10 text-center md:text-left">
                      <span className="block text-sm font-bold tracking-[0.3em] text-[#B8860B] uppercase mb-2 lg:mb-3">
                        The Identity
                      </span>
                      <h2 className="text-5xl md:text-7xl font-black text-[#1A1A1A] uppercase tracking-tighter leading-[0.9]">
                        Logo <br /> Concept
                      </h2>
                    </div>

                    {/* LOGO (Responsive Behavior) */}
                    {/* 1. Mobile: Flow naturally below header */}
                    {/* 2. Tablet (md): Float Absolute Top Right */}
                    {/* 3. Desktop (lg): Return to Static Flow below header */}
                    <div className="
                      relative z-10
                      w-56 h-56 mx-auto mb-4                        /* Mobile: mb-4 (Reduced from 6) to pull text up */
                      md:absolute md:top-0 md:right-0 md:w-64 md:h-64 md:mb-0  /* Tablet: Absolute Top Right */
                      lg:static lg:w-[400px] lg:h-[400px] lg:mx-0 lg:mt-2       /* Desktop: lg:mt-2 (Reduced from 8) to move up */
                      drop-shadow-2xl hover:scale-105 transition-transform duration-500
                    ">
                      <SmartImage
                        src={partyLogo}
                        alt="Party Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* RIGHT COL: Scrollable Content Box */}
                  <div className="w-full lg:w-7/12 relative z-20 md:mt-8 lg:mt-0">
                    {/* md:mt-8 (Reduced from 24) to pull text box up on Tablet. lg:mt-0 aligns with logo top */}
                    <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100/80 relative">
                      {/* Decorative Quote */}
                      <div className="absolute top-6 right-10 text-[#B8860B]/10 font-serif text-[10rem] leading-none pointer-events-none select-none">
                        &rdquo;
                      </div>

                      {/* SCROLLABLE TEXT BOX */}
                      <div className="max-h-[280px] lg:max-h-[360px] overflow-y-auto pr-6 custom-scrollbar hover:scroll-auto relative z-10">
                        <p className="text-lg lg:text-xl font-sans font-light leading-[1.8] text-gray-700 whitespace-pre-line">
                          {candidate?.logoMeaning || "ความหมายสัญลักษณ์ The Unity Concord of FMS สะท้อนถึงความสำคัญของการรวมตัวกันเป็นหนึ่งเดียว เพื่อขับเคลื่อนคณะวิทยาการจัดการไปข้างหน้า..."}
                        </p>
                      </div>

                      {/* Scroll Hint */}
                      <div className="mt-6 flex items-center justify-center gap-2 opacity-20">
                        <div className="w-1.5 h-1.5 rounded-full bg-black animate-bounce"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-black animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-black animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>

                </div>
              </Reveal>
            </div>
          </section >

          {/* === 3. MISSION (FULL WIDTH SPLIT) === */}
          < section id="mission" className="w-full flex flex-col md:flex-row min-h-auto md:min-h-[60vh]" >

            {/* LEFT SIDE: Header (Deep Royal Purple) - 40% */}
            < div className="w-full md:w-[40%] bg-[#2E1065] relative px-6 py-12 md:px-10 md:py-24 flex flex-col justify-center items-center text-center overflow-hidden" >
              {/* Background Effects (Unity Theme: Purple/Gold) */}
              < div className="absolute inset-0 bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#2E1065] opacity-100" ></div >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D97706] rounded-full blur-[100px] opacity-20 animate-pulse"></div>

              <div className="relative z-10">
                <Reveal>
                  <div className="w-20 h-20 md:w-28 md:h-28 mb-6 md:mb-8 mx-auto bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(217,119,6,0.4)]">
                    <Target className="text-[#FCD34D] drop-shadow-md w-10 h-10 md:w-16 md:h-16" />
                  </div>
                  <h3 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2 md:mb-4">
                    พันธกิจ
                  </h3>
                  <p className="text-[#FCD34D] text-xs md:text-sm font-bold tracking-[0.3em] uppercase opacity-90">
                    OUR MISSION
                  </p>
                </Reveal>
              </div>
            </div >

            {/* RIGHT SIDE: Content (White Background) - 60% */}
            < div className="w-full md:w-[60%] bg-[#F9FAFB] px-6 py-12 md:px-24 md:py-24 flex flex-col justify-center" >
              <div className="grid gap-4 md:gap-6 max-w-3xl mx-auto w-full">
                {(Array.isArray(missions) ? missions : ["สนับสนุนกิจกรรม", "พัฒนาสิ่งอำนวยความสะดวก"]).map((m, i) => (
                  <Reveal key={i} delay={i * 100}>
                    <div className="flex items-center gap-4 md:gap-6 group p-4 md:p-6 rounded-xl md:rounded-2xl bg-white border border-gray-200 hover:border-[#6D28D9] shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex-shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center font-black text-lg md:text-xl border border-[#E9D5FF] group-hover:bg-[#6D28D9] group-hover:text-white transition-colors duration-300">
                        {i + 1}
                      </div>
                      <p className="text-base md:text-xl text-gray-700 font-medium leading-relaxed group-hover:text-[#2E1065] transition-colors">
                        {m}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div >
          </section >

          {/* === 4. POLICIES SECTION === */}
          < section id="policy" className="py-32 bg-white relative" >
            <div className="container mx-auto px-6 relative z-10">

              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-[#B8860B] font-bold tracking-[0.2em] uppercase text-sm">Our Policies</span>
                <h2 className="text-4xl md:text-6xl font-black text-[#1A1A1A] mt-3 uppercase tracking-tight">นโยบายพรรค</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                {(Array.isArray(policies) ? policies : ["นโยบายที่ 1", "นโยบายที่ 2", "นโยบายที่ 3"]).map((p, i) => (
                  <Reveal key={i} delay={Math.min(i * 50, 200)}>
                    {/* CONTAINER: Auto Height on Mobile (Fit Content), Auto on Desktop */}
                    <div className="group relative w-full h-full">

                      {/* 1. ANIMATED GLOW BACKDROP (Static Purple/Pink - No Animation) */}
                      {/* Mobile: Toned down (opacity-30, blur-sm) to prevent overcrowding. Desktop: Strong (opacity-70, blur-md) */}
                      <div className="absolute -inset-[1px] md:-inset-[3px] rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] opacity-30 md:opacity-70 blur-[2px] md:blur-md transition-all duration-500 group-hover:opacity-100 group-hover:blur-lg"></div>

                      {/* 2. CARD SURFACE (White Background) */}
                      <div className="relative h-full bg-white rounded-[1.3rem] md:rounded-[2.3rem] overflow-hidden flex flex-col justify-start transition-all duration-300 bg-clip-padding">

                        {/* BACKGROUND NUMBER */}
                        <div className="absolute -top-2 -right-2 p-3 text-6xl md:text-[10rem] md:-top-4 md:-right-4 md:p-6 font-black text-[#2E1065]/15 group-hover:text-[#2E1065]/25 transition-colors z-0 select-none leading-none">
                          {i + 1}
                        </div>

                        {/* Content Container (Matches aspect ratio constraints) */}
                        <div className="relative z-10 p-5 md:p-10 flex flex-col h-full">
                          <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-[#C026D3] mb-2 md:mb-3">
                            นโยบายที่ {i + 1}
                          </p>

                          {/* Title: Full text on mobile (No Clamp) */}
                          <h3 className="text-sm md:text-2xl font-black text-gray-900 mb-2 md:mb-4 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all">
                            {typeof p === 'string' ? p : p.title}
                          </h3>

                          {/* Desc: Full text on mobile (No Clamp) */}
                          {typeof p !== 'string' && p.desc && (
                            <p className="text-gray-500 font-medium leading-relaxed group-hover:text-gray-700 transition-colors text-[10px] md:text-sm">
                              {p.desc}
                            </p>
                          )}

                          {/* Bottom Arrow (Hidden on Mobile) */}
                          <div className="mt-auto hidden md:flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <style jsx>{`
                @keyframes gradient-xy {
                  0%, 100% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                }
                .animate-gradient-xy {
                  background-size: 200% 200%;
                  animation: gradient-xy 3s ease infinite;
                }
              `}</style>
            </div>
          </section >

          {/* === 4. GALLERY SECTION: OPTIMIZED & RESPONSIVE === */}
          < div id="gallery" className="w-full bg-black" >

            {
              carouselImages.length === 1 ? (
                /* ====== CASE A: SINGLE IMAGE (Responsive Fixed) ====== */
                <section className="relative w-full bg-white">

                  {/* --- HEADER SECTION (Above Image - White Background) --- */}
                  <div className="relative w-full pt-12 md:pt-24 pb-4 md:pb-8 bg-white flex flex-col items-center justify-center z-20">
                    <span className="text-[#C026D3] font-bold tracking-[0.2em] uppercase text-xs md:text-lg drop-shadow-sm mb-3">
                      {partyName}
                    </span>
                    <h2 className="text-4xl md:text-7xl font-black text-[#1A1A1A] uppercase tracking-tight text-center px-4 leading-none">
                      MEET THE TEAM
                    </h2>
                  </div>

                  {/* --- UNIVERSAL FULL IMAGE VIEW (All Screens: Show Full Picture) --- */}
                  {/* Fixed: Removed Parallax/Cropping. Uses standard <img> to ensure 100% visibility on all devices. */}
                  <div className="relative w-full">

                    {/* 1. MOBILE VERTICAL IMAGE (Resolved with Fallback) */}
                    {finalTeamMobileImage && (
                      <div className="block md:hidden w-full">
                        <img
                          src={finalTeamMobileImage}
                          alt="Team Vertical"
                          className="w-full h-auto shadow-2xl"
                        />
                        <div className="absolute inset-0 bg-[#2E0249]/5 pointer-events-none mix-blend-multiply" />
                      </div>
                    )}

                    {/* 2. DESKTOP/TABLET HORIZONTAL IMAGE */}
                    <div className={`${finalTeamMobileImage ? 'hidden md:block' : 'block'} w-full`}>
                      <img
                        src={carouselImages[0]}
                        alt="Team Horizontal"
                        className="w-full h-auto object-contain max-h-[90vh] mx-auto shadow-2xl"
                      />
                      <div className="absolute inset-0 bg-[#2E0249]/5 pointer-events-none mix-blend-multiply" />
                    </div>
                  </div>
                </section>
              ) : (
                /* ====== CASE B: MULTI IMAGES (3D Carousel) ====== */
                <section className="py-16 md:py-24 bg-[#E5E7EB] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></div>

                  <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-10 md:mb-12">
                      <span className="text-[#B8860B] font-bold tracking-[0.2em] uppercase text-xs md:text-sm">{partyName}</span>
                      <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mt-2 md:mt-3 uppercase tracking-tight">GALLERY</h2>
                    </div>

                    <div className="rounded-[24px] md:rounded-[32px] border border-black/10 bg-white shadow-[0_24px_70px_-50px_rgba(0,0,0,0.35)] p-2 md:p-6">
                      <ThreeDCarousel
                        images={
                          carouselImages.length < 3
                            ? [...carouselImages, ...carouselImages, ...carouselImages].slice(0, 3)
                            : carouselImages
                        }
                      />
                    </div>
                  </div>
                </section>
              )
            }
          </div >

          {/* === 5. TEAM === */}
          < section id="team" className="py-24 bg-white relative overflow-hidden border-t border-black/5" >
            <div className="container mx-auto px-6 relative z-10">
              <div className="mb-16">
                <span className="text-[#6A0DAD] font-bold tracking-[0.2em] uppercase text-sm">The Squad</span>
                <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mt-2 uppercase tracking-tight">Members</h2>
              </div>
              <RevealGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {members.map((m, i) => (
                  <div
                    key={i}
                    className="group cursor-pointer perspective-1000"
                    onClick={() => setSelectedMember(m)}
                  >
                    {/* Card Container with "Dimensional" Feel */}
                    <div className="relative aspect-[3/4] mb-5 rounded-2xl bg-gray-100 overflow-hidden transition-all duration-500 ease-out group-hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] group-hover:-translate-y-3 group-hover:scale-[1.02] border border-black/5 group-hover:border-black/10">

                      {/* Image Layer */}
                      <SmartImage
                        src={m.imageUrl}
                        alt={m.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                      />

                      {/* Gradient Overlay (Always there but subtle, stronger on hover) */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />

                      {/* Glossy Reflection Effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
                    </div>

                    {/* Text Info */}
                    <div className="relative pl-1 transition-all duration-300 group-hover:translate-x-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#B8860B] mb-1 opacity-80 group-hover:opacity-100 transition-opacity">{m.position || "Member"}</p>
                      <h4 className="text-lg font-black text-[#1A1A1A] leading-tight group-hover:text-[#6A0DAD] transition-colors">{m.name}</h4>
                    </div>
                  </div>
                ))}
              </RevealGrid>
            </div>
          </section>

          {/* === 6. VOTE === */}
          <section id="vote" className="py-32 bg-[#1A1A1A] text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6A0DAD] blur-[150px] opacity-20 rounded-full pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10 max-w-4xl text-center">
              <Reveal>
                <h2 className="text-5xl md:text-8xl font-black text-white mb-8 uppercase tracking-tighter">Your Vote <br /> Your Voice</h2>
                <p className="text-white/60 text-lg mb-12 max-w-xl mx-auto">Shape the Future of FMS</p>
                <div className="space-y-6">
                  {/* Main Vote Button - รับรอง */}
                  <button onClick={() => onSelect(candidate?.id)} className={`w-full relative group overflow-hidden rounded-3xl transition-all duration-300 ${selectedPartyId === candidate?.id ? 'ring-4 ring-emerald-400 scale-[1.02]' : 'hover:scale-[1.01]'}`}>
                    <div className={`absolute inset-0 rounded-3xl transition-opacity duration-500 ${selectedPartyId === candidate?.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }} />
                    <div className={`relative backdrop-blur-md border rounded-3xl p-8 md:p-12 flex items-center justify-between z-10 ${selectedPartyId === candidate?.id ? 'bg-emerald-500/20 border-emerald-400' : 'bg-white/10 border-white/10'}`}>
                      <div className="flex items-center gap-8 text-left">
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold transition-colors flex-shrink-0 ${selectedPartyId === candidate?.id ? 'bg-emerald-400 text-white' : 'bg-white text-black'}`}><CheckCircle2 /></div>
                        <div>
                          <p className="text-sm font-bold text-white/60 mb-2">เลือกพรรค {partyName}</p>
                          <h3 className="text-3xl md:text-5xl font-black text-white">รับรอง</h3>
                        </div>
                      </div>
                      <span className="hidden md:block text-8xl font-black text-white/10 group-hover:text-white/20">{String(partyNumber).padStart(2, '0')}</span>
                    </div>
                  </button>

                  {/* Secondary Options */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* ไม่รับรอง Button - Solid Background */}
                    <button onClick={() => onSelect(specialOptions?.disapprove?.id)} className={`p-6 rounded-2xl transition-all flex flex-col items-center gap-3 ${selectedPartyId === specialOptions?.disapprove?.id ? 'bg-red-600 border-2 border-red-400 ring-2 ring-red-400 shadow-lg shadow-red-500/30' : 'bg-[#2A2A2A] border border-white/20 hover:bg-[#3A3A3A]'}`}>
                      <XCircle className={selectedPartyId === specialOptions?.disapprove?.id ? 'text-white' : 'text-white/70'} size={32} />
                      <span className={`font-bold text-lg ${selectedPartyId === specialOptions?.disapprove?.id ? 'text-white' : 'text-white/90'}`}>ไม่รับรอง</span>
                    </button>

                    {/* งดออกเสียง Button - Solid Background */}
                    <button onClick={() => onSelect(specialOptions?.abstain?.id)} className={`p-6 rounded-2xl transition-all flex flex-col items-center gap-3 ${selectedPartyId === specialOptions?.abstain?.id ? 'bg-slate-600 border-2 border-slate-300 ring-2 ring-slate-300 shadow-lg shadow-slate-500/30' : 'bg-[#2A2A2A] border border-white/20 hover:bg-[#3A3A3A]'}`}>
                      <Ban className={selectedPartyId === specialOptions?.abstain?.id ? 'text-white' : 'text-white/70'} size={32} />
                      <span className={`font-bold text-lg ${selectedPartyId === specialOptions?.abstain?.id ? 'text-white' : 'text-white/90'}`}>งดออกเสียง</span>
                    </button>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          <footer className="py-4 bg-black text-white text-center border-t border-white/10">
            <div className="flex justify-center items-center gap-4 mb-4 opacity-50"><Image src="/images/logo/fms_logo50_color.png" width={40} height={40} alt="FMS" className="grayscale" /><div className="h-8 w-px bg-white/20" /><p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-widest uppercase">© FMS@PSU 2026. All Rights Reserved.</p></div>
          </footer>
        </div>
      </div>
      {selectedMember && <CandidateModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
    </div>,
    portalContainer
  );
}