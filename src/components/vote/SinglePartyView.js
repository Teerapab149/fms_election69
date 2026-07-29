"use client";
import { getPath } from "../../utils/basePath";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
import EditorElement from '../admin/editor/EditorElement';
import { SIZE_MAP, RADIUS_MAP, WEIGHT_MAP } from '../../utils/styleMaps';
import SinglePartyBaseStyles from './SinglePartyBaseStyles';

export default function SinglePartyView({
  candidate,
  selectedPartyId,
  onSelect,
  specialOptions,
  user,
  editorMode = false,
  previewMode = false, // template-preview: render the REAL cinematic layout, intro skipped
  elementConfigs = null,
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  const gc = useGlobalConfig() || {};
  const copyrightYear = gc.copyrightYear ?? gc.electionCalendarYear ?? 2026;
  const [portalContainer, setPortalContainer] = useState(null);
  const [bannerImages, setBannerImages] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [introFinished, setIntroFinished] = useState(previewMode);
  const [contentReady, setContentReady] = useState(false); // Lazy render heavy content
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMobileDockOpen, setIsMobileDockOpen] = useState(true);

  // --- 1. DATA ---
  // no invented party name here — this renders on the live ballot, so an absent
  // name must read as missing data, not as a plausible-looking party
  const partyName = candidate?.name || "ไม่พบชื่อพรรค";
  const partyNumber = candidate?.number || 1;
  const placeholderPath = getPath("/images/logo/party-placeholder.svg");
  const partyLogo = candidate?.logoUrl ? getPath(candidate.logoUrl) : placeholderPath;
  const partyImage = placeholderPath;
  const policies = candidate?.policies || [];
  const missions = candidate?.missions || [];
  const members = useMemo(() => {
    const rawMembers = candidate?.members || [];
    return [...rawMembers].sort((a, b) => {
      const numA = a.number ? parseInt(a.number) : 999;
      const numB = b.number ? parseInt(b.number) : 999;
      return numA - numB;
    });
  }, [candidate?.members]);

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
    images = images.filter(url => url && typeof url === 'string').map(url => getPath(url));
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
    return images.filter(url => url && typeof url === 'string').map(url => getPath(url));
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
    return images.filter(url => url && typeof url === 'string').map(url => getPath(url));
  }, [candidate?.officialImageUrl]);

  // --- 2.3 IMAGE FALLBACK LOGIC ---
  // A. Hero Section Image — ภาพหมู่แนวนอน (groupImageUrls) มาก่อนเสมอ
  //
  // เดิมหน้านี้เอา officialImageUrl (โปสเตอร์แนวตั้ง) ขึ้นก่อน เพราะตอนสร้างคิดว่า
  // single-vote บนมือถือของ original ใช้ภาพชุดเดียวกับจอใหญ่ไม่ได้ ปัจจุบันใช้ชุด
  // เดียวกันแล้ว และทุกตระกูลอื่น (receipt/gumroad/verdure/studio-dark/blossom) ก็
  // เอาภาพหมู่แนวนอนขึ้นก่อนทั้งหมด — original เป็นตัวเดียวที่ต่างออกไปโดยไม่มีเหตุผล
  // เหลืออยู่ (2026-07-28) ลำดับนี้ทำให้ทั้ง 6 ตระกูลแสดงภาพเดียวกันจากข้อมูลชุดเดียวกัน
  const finalHeroImage = carouselImages[0] || officialImages[0] || mobileHeroImages[0] || partyLogo;

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

  // Lazy render heavy content after intro finishes (optimization)
  useEffect(() => {
    if (introFinished) {
      const timer = setTimeout(() => setContentReady(true), 50);
      return () => clearTimeout(timer);
    }
  }, [introFinished]);

  // Preload hero image during intro for instant display
  useEffect(() => {
    if (heroImage && !introFinished && typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = heroImage;
    }
  }, [heroImage, introFinished]);

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
        background: var(--spv-gold-bright, #D4AF37);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: var(--spv-gold, #B8860B);
      }

      /* === SPOTLIGHT INTERACTION === */
      #spotlight-content * {
        color: white !important;
        border-color: rgba(255,255,255,0.8) !important;
      }

      /* Specific Override for Discover Button: Turn GOLD in Spotlight */
      #spotlight-content .discover-btn {
        background: linear-gradient(to right, var(--spv-glow-2, #FCD34D), var(--spv-glow, #B45309)) !important;
        color: var(--spv-dark, #1A1A1A) !important;
        box-shadow: 0 0 30px rgba(251, 191, 36, 0.6) !important;
      }
      #spotlight-content .discover-btn svg {
        color: var(--spv-dark, #1A1A1A) !important;
      }

      /* Fix Party Number Badge Visibility (White BG needs Black Text) */
      #spotlight-content .party-number-badge {
        color: var(--spv-dark, #1A1A1A) !important;
        border-color: var(--spv-dark, #1A1A1A) !important;
      }

      body { overflow: hidden; } 
    `}</style>
  );

  // Editor-mode helpers
  // Stable Wrap identity (see HomeContent): inline definition remounts the
  // wrapped subtree on every hover re-render → animation flicker.
  const editorStateRef = useRef(null);
  editorStateRef.current = {
    editorMode, elementConfigs, selectedElement, hoveredElement,
    onSelectElement, onHoverElement, onHoverEnd,
  };
  const Wrap = useCallback(({ id, children }) => {
    const s = editorStateRef.current;
    if (!s.editorMode) return children;
    return (
      <EditorElement
        id={id}
        config={s.elementConfigs?.[id]}
        isSelected={s.selectedElement === id}
        isHovered={s.hoveredElement === id}
        onSelect={s.onSelectElement}
        onHover={s.onHoverElement}
        onHoverEnd={s.onHoverEnd}
      >{children}</EditorElement>
    );
  }, []);

  const cfg = (id, defaults = {}) => editorMode
    ? { ...defaults, ...(elementConfigs?.[id]?.config || {}) }
    : defaults;

  // 🛠️ Editor mode — simple inline preview (skips portal/intro for admin preview panel)
  if (editorMode) {
    return (
      <div className="bg-[#1A1A1A] text-white p-8 min-h-[600px]">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">Your Vote<br />Your Voice</h2>
            <p className="text-white/60 text-sm">Shape the Future of FMS</p>
          </div>

          {/* Party card (approve / รับรอง) */}
          <Wrap id="vote-party-card">
            <button
              type="button"
              onClick={() => onSelect?.(candidate?.id)}
              style={{
                backgroundColor: cfg('vote-party-card').backgroundColor || undefined,
                borderRadius: RADIUS_MAP[cfg('vote-party-card').borderRadius] || '1.5rem',
                borderColor: cfg('vote-party-card').borderColor || undefined,
                borderWidth: cfg('vote-party-card').borderColor ? '1px' : undefined,
                borderStyle: cfg('vote-party-card').borderColor ? 'solid' : undefined,
              }}
              className="w-full bg-emerald-500/10 backdrop-blur-md border border-emerald-400/30 p-8 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-emerald-400 text-white flex items-center justify-center">
                  <CheckCircle2 />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/60 mb-1">เลือกพรรค {candidate?.name || ''}</p>
                  <h3 className="text-3xl font-black text-white">รับรอง</h3>
                </div>
              </div>
              <span className="hidden md:block text-6xl font-black text-white/10">
                {String(candidate?.number ?? 1).padStart(2, '0')}
              </span>
            </button>
          </Wrap>

          <div className="grid grid-cols-2 gap-4">
            {/* Disapprove */}
            <Wrap id="vote-disapprove-button">
              <button
                type="button"
                onClick={() => onSelect?.(specialOptions?.disapprove?.id)}
                style={{
                  backgroundColor: cfg('vote-disapprove-button').backgroundColor || undefined,
                  color: cfg('vote-disapprove-button').textColor || undefined,
                  borderRadius: RADIUS_MAP[cfg('vote-disapprove-button').borderRadius] || '1rem',
                  borderColor: cfg('vote-disapprove-button').borderColor || undefined,
                  borderWidth: cfg('vote-disapprove-button').borderColor ? '1px' : undefined,
                  borderStyle: cfg('vote-disapprove-button').borderColor ? 'solid' : undefined,
                }}
                className="w-full p-6 rounded-2xl bg-rose-500/10 border border-rose-400/40 flex flex-col items-center gap-3"
              >
                <XCircle className="text-rose-300" size={32} />
                <span className="font-bold text-lg text-rose-50">
                  {cfg('vote-disapprove-button').text || 'ไม่รับรอง'}
                </span>
              </button>
            </Wrap>

            {/* Abstain */}
            <Wrap id="vote-abstain-button">
              <button
                type="button"
                onClick={() => onSelect?.(specialOptions?.abstain?.id)}
                style={{
                  backgroundColor: cfg('vote-abstain-button').backgroundColor || undefined,
                  color: cfg('vote-abstain-button').textColor || undefined,
                  borderRadius: RADIUS_MAP[cfg('vote-abstain-button').borderRadius] || '1rem',
                  borderColor: cfg('vote-abstain-button').borderColor || undefined,
                  borderWidth: cfg('vote-abstain-button').borderColor ? '1px' : undefined,
                  borderStyle: cfg('vote-abstain-button').borderColor ? 'solid' : undefined,
                }}
                className="w-full p-6 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col items-center gap-3"
              >
                <Ban className="text-amber-300" size={32} />
                <span className="font-bold text-lg text-amber-50">
                  {cfg('vote-abstain-button').text || 'งดออกเสียง'}
                </span>
              </button>
            </Wrap>
          </div>
        </div>
      </div>
    );
  }

  if (!portalContainer) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-white font-sans h-[100dvh]" style={{ color: 'var(--spv-dark, #1A1A1A)' }}>
      <SinglePartyBaseStyles />
      {globalStyles}

      <div className={`w-full h-full transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform ${introFinished ? "-translate-y-full" : "translate-y-0"}`}>

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



            {/* --- UNIFIED RESPONSIVE LAYOUT: "The Hero" Full Screen Cinematic --- */}
            {contentReady && (
              <LiquidHero className="flex min-h-[100dvh] items-center justify-center" members={members} isActive={introFinished}>

                {/* ===== CONTENT: Centered & Dark/Contrast ===== */}
                <div className="flex flex-col items-center justify-center text-center w-full"> {/* Removed max-w-5xl here as the wrapper handles it, or keep it? Wrapper is max-w-6xl. Keep max-w-5xl for tightness. */}

                  {/* v2-R12: staged hero reveal — badge → name → slogan → dual CTA,
                      each a beat later, once the intro clears (isActive). */}
                  <Reveal delay={80}>
                    {/* Party Number Badge - Pill Shaped */}
                    <div className="mb-6 lg:mb-8">
                      <span className="px-4 py-2 lg:px-6 lg:py-3 bg-white/80 backdrop-blur-md border border-black/5 text-[var(--spv-dark,#1A1A1A)] text-xs lg:text-sm font-bold uppercase tracking-[0.2em] rounded-full shadow-sm transition-colors duration-300 ease-in-out party-number-badge">
                        พรรคหมายเลข {partyNumber}
                      </span>
                    </div>
                  </Reveal>

                  <Reveal delay={200}>
                    {/* Party Name - Dynamic Split for Mobile / Full for Desktop */}
                    {(() => {
                      const words = partyName.split(' ');
                      const mid = Math.ceil(words.length / 2);
                      const top = words.slice(0, mid).join(' ');
                      const bottom = words.slice(mid).join(' ');

                      return (
                        <>
                          {/* Mobile: Split 2 Lines */}
                          <h1 className="md:hidden text-5xl font-black uppercase text-[var(--spv-dark,#1A1A1A)] leading-[0.9] tracking-tight mb-4 drop-shadow-sm flex flex-col gap-1 transition-colors duration-300 ease-in-out" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                            <span>{top}</span>
                            <span>{bottom}</span>
                          </h1>

                          {/* Desktop: Single Line */}
                          <h1 className="hidden md:block text-6xl xl:text-8xl font-black uppercase text-[var(--spv-dark,#1A1A1A)] leading-none tracking-tight mb-6 drop-shadow-sm transition-colors duration-300 ease-in-out" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                            {partyName}
                          </h1>
                        </>
                      );
                    })()}
                  </Reveal>

                  {/* SLG-1: slogan is optional — absent = slot disappears entirely (no
                      placeholder, no substitute text; owner rule). Name's own mb-4/mb-6
                      then hands the rhythm straight to the CTA pair, which also takes
                      over the slogan's reveal beat so the stagger stays tight. */}
                  {candidate?.slogan && (
                    <Reveal delay={320}>
                      {/* Slogan - White text for maximum readability */}
                      <p className="text-base md:text-xl lg:text-2xl text-white font-semibold leading-relaxed mb-8 lg:mb-12 max-w-xl lg:max-w-3xl mx-auto" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                        {candidate.slogan}
                      </p>
                    </Reveal>
                  )}

                  <Reveal delay={candidate?.slogan ? 440 : 320}>
                    {/* Action Buttons — the pair rises together, a beat after the slogan */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 lg:gap-6 w-full px-8">
                      {/* Discover: Magenta Gradient */}
                      <button onClick={() => scrollTo('symbol')} className="w-full md:w-auto group relative px-8 lg:px-10 py-3 lg:py-4 bg-gradient-to-r from-[var(--spv-brand)] to-[var(--spv-brand)] text-white rounded-full font-bold uppercase tracking-widest overflow-hidden shadow-lg hover:shadow-[color-mix(in_srgb,var(--spv-brand)_30%,transparent)] transition-all hover:scale-105 active:scale-95 discover-btn">
                        <span className="relative z-10 flex items-center justify-center gap-2 text-xs lg:text-base">
                          Discover Our Vision <ChevronDown className="w-4 h-4" />
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      </button>

                      {/* Vote: Glass styling (inverts automatically) */}
                      <button onClick={() => scrollTo('vote')} className="vote-ready-btn w-full md:w-auto px-8 lg:px-10 py-3 lg:py-4 bg-white/30 backdrop-blur-md border border-black/10 text-[var(--spv-dark,#1A1A1A)] rounded-full font-bold uppercase tracking-widest hover:bg-[var(--spv-dark,#1A1A1A)] hover:text-white transition-colors flex items-center justify-center gap-2 text-xs lg:text-base shadow-lg">
                        <Target className="w-4 h-4" /> Ready to Vote?
                      </button>
                    </div>
                  </Reveal>
                </div>
              </LiquidHero>
            )}
          </section>

          {/* ===== SCROLL INDICATOR ===== */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer text-[var(--spv-dark,#1A1A1A)]" onClick={() => scrollTo('symbol')}>
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
                      <span className="block text-sm font-bold tracking-[0.3em] text-[var(--spv-gold,#B8860B)] uppercase mb-2 lg:mb-3 transition-colors duration-300 ease-in-out">
                        The Identity
                      </span>
                      <h2 className="text-5xl md:text-7xl font-black text-[var(--spv-dark,#1A1A1A)] uppercase tracking-tighter leading-[0.9] transition-colors duration-300 ease-in-out">
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
                      <div className="absolute top-6 right-10 text-[color-mix(in_srgb,var(--spv-gold,#B8860B)_10%,transparent)] font-serif text-[10rem] leading-none pointer-events-none select-none">
                        &rdquo;
                      </div>

                      {/* SCROLLABLE TEXT BOX */}
                      <div className="max-h-[280px] lg:max-h-[360px] overflow-y-auto pr-6 custom-scrollbar hover:scroll-auto relative z-10">
                        <p className="text-lg lg:text-xl font-sans font-light leading-[1.8] text-gray-700 whitespace-pre-line">
                          {candidate?.logoMeaning || "พรรคยังไม่ได้ระบุความหมายของสัญลักษณ์"}
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
            < div className="w-full md:w-[40%] bg-[var(--spv-deep,#2E1065)] transition-colors duration-300 ease-in-out relative px-6 py-12 md:px-10 md:py-24 flex flex-col justify-center items-center text-center overflow-hidden" >
              {/* Background Effects (Unity Theme: Purple/Gold) */}
              < div className="absolute inset-0 bg-gradient-to-br from-[var(--spv-deep,#2E1065)] via-[var(--spv-deep-2,#4C1D95)] to-[var(--spv-deep,#2E1065)] opacity-100" ></div >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--spv-glow,#D97706)] rounded-full blur-[100px] opacity-20 animate-pulse"></div>

              <div className="relative z-10">
                <Reveal>
                  <div className="w-20 h-20 md:w-28 md:h-28 mb-6 md:mb-8 mx-auto bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(217,119,6,0.4)]">
                    <Target className="text-[var(--spv-glow-2,#FCD34D)] drop-shadow-md w-10 h-10 md:w-16 md:h-16" />
                  </div>
                  <h3 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2 md:mb-4">
                    พันธกิจ
                  </h3>
                  <p className="text-[var(--spv-glow-2,#FCD34D)] text-xs md:text-sm font-bold tracking-[0.3em] uppercase opacity-90 transition-colors duration-300 ease-in-out">
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
                    <div className="flex items-center gap-4 md:gap-6 group p-4 md:p-6 rounded-xl md:rounded-2xl bg-white border border-gray-200 hover:border-[var(--spv-brand)] shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex-shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-[color-mix(in_srgb,var(--spv-brand)_12%,white)] text-[var(--spv-brand)] flex items-center justify-center font-black text-lg md:text-xl border border-[color-mix(in_srgb,var(--spv-brand)_20%,white)] group-hover:bg-[var(--spv-brand)] group-hover:text-white transition-colors duration-300">
                        {i + 1}
                      </div>
                      <p className="text-base md:text-xl text-gray-700 font-medium leading-relaxed group-hover:text-[var(--spv-deep,#2E1065)] transition-colors">
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
                <span className="text-[var(--spv-gold,#B8860B)] font-bold tracking-[0.2em] uppercase text-sm transition-colors duration-300 ease-in-out">Our Policies</span>
                <h2 className="text-4xl md:text-6xl font-black text-[var(--spv-dark,#1A1A1A)] mt-3 uppercase tracking-tight transition-colors duration-300 ease-in-out">นโยบายพรรค</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                {(Array.isArray(policies) ? policies : ["นโยบายที่ 1", "นโยบายที่ 2", "นโยบายที่ 3"]).map((p, i) => (
                  <Reveal key={i} delay={Math.min(i * 50, 200)}>
                    {/* CONTAINER: Auto Height on Mobile (Fit Content), Auto on Desktop */}
                    <div className="group relative w-full h-full">

                      {/* 1. ANIMATED GLOW BACKDROP (Static Purple/Pink - No Animation) */}
                      {/* Mobile: Toned down (opacity-30, blur-sm) to prevent overcrowding. Desktop: Strong (opacity-70, blur-md) */}
                      <div className="absolute -inset-[1px] md:-inset-[3px] rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-r from-[var(--spv-brand)] to-[var(--spv-brand)] opacity-30 md:opacity-70 blur-[2px] md:blur-md transition-all duration-500 group-hover:opacity-100 group-hover:blur-lg"></div>

                      {/* 2. CARD SURFACE (White Background) */}
                      <div className="relative h-full bg-white rounded-[1.3rem] md:rounded-[2.3rem] overflow-hidden flex flex-col justify-start transition-all duration-300 bg-clip-padding">

                        {/* BACKGROUND NUMBER */}
                        <div className="absolute -top-2 -right-2 p-3 text-6xl md:text-[10rem] md:-top-4 md:-right-4 md:p-6 font-black text-[color-mix(in_srgb,var(--spv-deep,#2E1065)_15%,transparent)] group-hover:text-[var(--spv-deep,#2E1065)]/25 transition-colors z-0 select-none leading-none">
                          {i + 1}
                        </div>

                        {/* Content Container (Matches aspect ratio constraints) */}
                        <div className="relative z-10 p-5 md:p-10 flex flex-col h-full">
                          <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-[var(--spv-accent)] mb-2 md:mb-3">
                            นโยบายที่ {i + 1}
                          </p>

                          {/* Title: Full text on mobile (No Clamp) */}
                          <h3 className="text-sm md:text-2xl font-black text-gray-900 mb-2 md:mb-4 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--spv-brand)] group-hover:to-[var(--spv-accent)] transition-all">
                            {typeof p === 'string' ? p : p.title}
                          </h3>

                          {/* Desc: Full text on mobile (No Clamp) */}
                          {typeof p !== 'string' && p.desc && (
                            <p className="text-gray-500 font-medium leading-relaxed group-hover:text-gray-700 transition-colors text-[10px] md:text-sm">
                              {p.desc}
                            </p>
                          )}

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
                    <span className="text-[var(--spv-accent)] font-bold tracking-[0.2em] uppercase text-xs md:text-lg drop-shadow-sm mb-3 transition-colors duration-300 ease-in-out">
                      {partyName}
                    </span>
                    <h2 className="text-4xl md:text-7xl font-black text-[var(--spv-dark,#1A1A1A)] uppercase tracking-tight text-center px-4 leading-none transition-colors duration-300 ease-in-out">
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
                        <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--spv-deep,#2E0249)_5%,transparent)] pointer-events-none mix-blend-multiply" />
                      </div>
                    )}

                    {/* 2. DESKTOP/TABLET HORIZONTAL IMAGE */}
                    <div className={`${finalTeamMobileImage ? 'hidden md:block' : 'block'} w-full`}>
                      <img
                        src={carouselImages[0]}
                        alt="Team Horizontal"
                        className="w-full h-auto object-contain max-h-[90vh] mx-auto shadow-2xl"
                      />
                      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--spv-deep,#2E0249)_5%,transparent)] pointer-events-none mix-blend-multiply" />
                    </div>
                  </div>
                </section>
              ) : (
                /* ====== CASE B: MULTI IMAGES (3D Carousel) ====== */
                <section className="py-16 md:py-24 bg-[#E5E7EB] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></div>

                  <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-10 md:mb-12">
                      <span className="text-[var(--spv-gold,#B8860B)] font-bold tracking-[0.2em] uppercase text-xs md:text-sm transition-colors duration-300 ease-in-out">{partyName}</span>
                      <h2 className="text-4xl md:text-5xl font-black text-[var(--spv-dark,#1A1A1A)] mt-2 md:mt-3 uppercase tracking-tight transition-colors duration-300 ease-in-out">GALLERY</h2>
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
                <span className="text-[var(--spv-vote-glow,#6A0DAD)] font-bold tracking-[0.2em] uppercase text-sm transition-colors duration-300 ease-in-out">The Squad</span>
                <h2 className="text-4xl md:text-5xl font-black text-[var(--spv-dark,#1A1A1A)] mt-2 uppercase tracking-tight transition-colors duration-300 ease-in-out">Members</h2>
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
                        src={m.imageUrl ? getPath(m.imageUrl) : null}
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
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--spv-gold,#B8860B)] mb-1 opacity-80 group-hover:opacity-100 transition-opacity">{m.position || "Member"}</p>
                      <h4 className="text-lg font-black text-[var(--spv-dark,#1A1A1A)] leading-tight group-hover:text-[var(--spv-vote-glow,#6A0DAD)] transition-colors">{m.name}</h4>
                    </div>
                  </div>
                ))}
              </RevealGrid>
            </div>
          </section>

          {/* === 6. VOTE === */}
          <section id="vote" className="py-32 bg-[var(--spv-dark,#1A1A1A)] transition-colors duration-300 ease-in-out text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--spv-vote-glow,#6A0DAD)] transition-colors duration-300 ease-in-out blur-[150px] opacity-20 rounded-full pointer-events-none" />
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
                    <button onClick={() => onSelect(specialOptions?.disapprove?.id)} className={`p-6 rounded-2xl transition-all flex flex-col items-center gap-3 ${selectedPartyId === specialOptions?.disapprove?.id ? 'bg-rose-500/20 border-2 border-rose-400 ring-2 ring-rose-400/50 shadow-lg shadow-rose-500/20' : 'bg-[var(--spv-dark-2,#2A2A2A)] border border-white/20 hover:bg-[var(--spv-dark-3,#3A3A3A)]'}`}>
                      <XCircle className={selectedPartyId === specialOptions?.disapprove?.id ? 'text-rose-300' : 'text-white/70'} size={32} />
                      <span className={`font-bold text-lg ${selectedPartyId === specialOptions?.disapprove?.id ? 'text-white' : 'text-white/90'}`}>ไม่รับรอง</span>
                    </button>

                    {/* งดออกเสียง Button - Solid Background */}
                    <button onClick={() => onSelect(specialOptions?.abstain?.id)} className={`p-6 rounded-2xl transition-all flex flex-col items-center gap-3 ${selectedPartyId === specialOptions?.abstain?.id ? 'bg-amber-500/20 border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20' : 'bg-[var(--spv-dark-2,#2A2A2A)] border border-white/20 hover:bg-[var(--spv-dark-3,#3A3A3A)]'}`}>
                      <Ban className={selectedPartyId === specialOptions?.abstain?.id ? 'text-amber-300' : 'text-white/70'} size={32} />
                      <span className={`font-bold text-lg ${selectedPartyId === specialOptions?.abstain?.id ? 'text-white' : 'text-white/90'}`}>งดออกเสียง</span>
                    </button>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          <footer className="py-4 bg-black text-white text-center border-t border-white/10">
            <div className="flex justify-center items-center gap-4 mb-4 opacity-50"><p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-widest uppercase">© {gc.facultyShortEn || "FMS"}@{gc.university || "PSU"} {copyrightYear}. All Rights Reserved.</p></div>
          </footer>
        </div>
      </div>
      {selectedMember && <CandidateModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
    </div>,
    portalContainer
  );
}