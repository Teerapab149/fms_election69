'use client';
import { getPath } from "../../utils/basePath";
import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, X, User, ChevronDown, Search, ChevronRight,
  Crown, Maximize2, ChevronLeft, Target, Shield,
  Flag, BookOpen, Star, Lightbulb, Quote, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import Navbar from "../../components/Navbar";
import PartyChart from "../../components/PartyChart";
import { PARTY_THEMES, DEFAULT_THEME } from "../../utils/PartyTheme";
import BackToVoteBar from "../../components/BackToVoteBar";
import CandidateModal from '../../components/CandidateModal';
import GumroadParty from "../../components/vote/GumroadParty";
import StudioDarkParty from "../../components/vote/StudioDarkParty";
import VerdureParty from "../../components/vote/VerdureParty";
import PageThemeOverrides from "../../components/PageThemeOverrides";
import ThemedLoadingScreen from "../../components/ThemedLoadingScreen";

// --- CONSTANTS ---
const POSITION_ORDER = [
  "นายกสโมสรนักศึกษา", "อุปนายกกิจการภายใน", "อุปนายกกิจการภายนอก", "เลขานุการ", "เหรัญญิก",
  "ประธานฝ่ายประชาสัมพันธ์", "ประธานฝ่ายสวัสดิการ", "ประธานฝ่ายพัสดุ", "ประธานฝ่ายกีฬา",
  "ประธานฝ่ายวิชาการ", "ประธานฝ่ายศิลปวัฒนธรรม", "ประธานฝ่ายข้อมูลกิจการนักศึกษา",
  "ประธานฝ่ายเทคโนโลยีสารสนเทศ", "ประธานฝ่ายประเมินผล", "ประธานฝ่ายกิจกรรม",
  "ประธานฝ่ายกราฟิกดีไซน์", "ประธานฝ่ายพิธีการ", "ประธานฝ่ายครีเอทีฟและสันทนาการ",
  "ประธานฝ่ายสถานที่", "ประธานฝ่ายสาธารณสุข"
];

// ✅ PREPARE DATA HELPER
// ฟังก์ชันนี้จะตรวจสอบข้อมูลจาก DB ว่ามีไหม ถ้าไม่มีให้ใส่ Default Text เพื่อไม่ให้หน้าเว็บโล่ง
const preparePartyData = (party) => {
  return {
    ...party,
    // 1. ความหมายโลโก้ (Text)
    logoMeaning: party.logoMeaning || "ยังไม่มีข้อมูลความหมายสัญลักษณ์",

    // 2. พันธกิจ (JSON Array) -> ตรวจสอบว่าเป็น Array จริงไหม
    missions: (Array.isArray(party.missions) && party.missions.length > 0)
      ? party.missions
      : ["ยังไม่มีข้อมูลพันธกิจ"],

    // 3. นโยบาย (JSON Array) -> ตรวจสอบว่าเป็น Array จริงไหม
    policies: (Array.isArray(party.policies) && party.policies.length > 0)
      ? party.policies
      : ["ยังไม่มีข้อมูลนโยบาย"]
  };
};

// --- SUB-COMPONENTS ---

// ✅ Smart Line Break Helper (60/40 Split)
const smartLineBreak = (text) => {
  if (!text) return "";
  const words = text.split(' ');
  // ถ้าชื่อสั้นมาก (ไม่เกิน 3 คำ) ไม่ต้องตัด
  if (words.length <= 3) return text;

  const totalChars = text.length;
  const targetIndex = totalChars * 0.65; // Aim for ~65% on first line

  let currentLength = 0;
  let splitIndex = -1;
  let minDiff = totalChars;

  for (let i = 0; i < words.length - 1; i++) {
    currentLength += words[i].length + 1; // +1 for space
    const diff = Math.abs(currentLength - targetIndex);

    // หาจุดที่ใกล้เคียง 65% ที่สุด
    if (diff <= minDiff) {
      minDiff = diff;
      splitIndex = i;
    }
  }

  if (splitIndex !== -1) {
    const line1 = words.slice(0, splitIndex + 1).join(' ');
    const line2 = words.slice(splitIndex + 1).join(' ');
    return `${line1}\n${line2}`;
  }

  return text;
};

const PartyBanner = ({ party, theme, galleryImages, onOpenLightbox }) => {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const interval = setInterval(() => setCurrentBgIndex((prev) => (prev + 1) % galleryImages.length), 5000);
    return () => clearInterval(interval);
  }, [galleryImages]);

  return (
    <section className="relative w-full bg-white flex flex-col">

      {/* 1. HERO IMAGE AREA */}
      <div className="relative w-full min-h-[50vh] overflow-hidden group">

        {/* SPACER: Invisible relative image to force container height to match image aspect ratio on all devices */}
        {galleryImages.length > 0 && (
          <img
            src={getPath(galleryImages[0])}
            className="w-full h-auto opacity-0 relative z-0 block pointer-events-none"
            alt="Spacer"
          />
        )}

        {/* Background Images - Absolute Positioned */}
        {galleryImages.length > 0 ? (
          galleryImages.map((img, idx) => (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-opacity ${idx === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}>
              <img src={getPath(img)} className="w-full h-full object-cover object-top" alt={`Cover ${idx}`} />
              {/* Dark Gradient Overlay for Text Readability - Fades out on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 group-hover:opacity-0 xl:block hidden"></div>
            </div>
          ))
        ) : (
          <div className={`w-full h-full min-h-[50vh] bg-gradient-to-r ${theme.gradient}`}>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        )}


        {/* Floating Play/Expand Button */}
        {galleryImages.length > 0 && (
          <button
            onClick={() => onOpenLightbox()}
            className="absolute bottom-10 right-4 xl:top-10 xl:right-10 xl:bottom-auto z-30 px-5 py-2.5 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full backdrop-blur-md text-xs font-bold flex items-center gap-2 transition-all border border-white/20 hover:scale-105 shadow-lg"
          >
            <Maximize2 size={16} /> <span className="hidden sm:inline">VIEW GALLERY</span>
          </button>
        )}

        {/* MAIN CONTENT OVERLAY (DESKTOP ONLY) */}
        <div className="hidden xl:flex absolute inset-0 z-20 flex-col justify-end pb-12 xl:pb-24 px-6 xl:px-12 max-w-[90rem] mx-auto w-full transition-all duration-500 group-hover:opacity-0">

          <div className="flex flex-col xl:flex-row items-end gap-6 xl:gap-10">

            {/* LOGO - Floating & Glorious */}
            <div className="shrink-0 relative group/logo">
              <div className="w-28 h-28 xl:w-64 xl:h-64 rounded-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center border-4 border-white/10 relative z-10 overflow-hidden ring-4 ring-white/20 backdrop-blur-sm"
                onClick={() => onOpenLightbox(party.logoUrl)}>
                <img src={getPath(party.logoUrl)} className="w-full h-full object-contain object-center rounded-full bg-white cursor-pointer scale-110 hover:scale-125 transition-transform duration-500" alt="Party Logo" />
              </div>
              {/* Number Badge */}
              <div className="absolute -top-2 -right-2 xl:top-0 xl:right-0 bg-[var(--theme-color)] text-white w-10 h-10 xl:w-16 xl:h-16 flex items-center justify-center rounded-full font-black text-lg xl:text-3xl shadow-lg border-4 border-[#1a1a1a] z-20"
                style={{ '--theme-color': theme.main }}>
                {party.number}
              </div>
            </div>

            {/* TEXT CONTENT - White & Clean */}
            <div className="flex-1 mb-2 xl:mb-6">
              {/* Slogan pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-[10px] xl:text-sm font-bold tracking-widest uppercase mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--theme-color)]" style={{ '--theme-color': theme.main }}></span>
                Official Party Page
              </div>

              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-white leading-[0.9] tracking-tighter mb-4 xl:mb-6 drop-shadow-2xl"
                style={{ textWrap: 'balance' }}>
                {smartLineBreak(party.name)}
              </h1>

              <p className="text-white/80 font-medium text-base xl:text-lg leading-relaxed max-w-2xl drop-shadow-md border-l-4 pl-4 xl:pl-6"
                style={{ borderColor: theme.main }}>
                {party.slogan}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* MOBILE CONTENT BLOCK (New Stacked Layout) */}
      <div className="xl:hidden relative z-20 bg-white -mt-6 rounded-t-[2rem] px-6 py-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col gap-6">

          {/* Mobile Header: Logo + Number */}
          <div className="flex items-end justify-between -mt-16 mb-2">
            <div className="w-36 h-36 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-white relative z-10 overflow-hidden"
              onClick={() => onOpenLightbox(party.logoUrl)}>
              <img src={getPath(party.logoUrl)} className="w-full h-full object-contain object-center rounded-full bg-white scale-110" alt="Party Logo" />
            </div>
            <div className="bg-[var(--theme-color)] text-white w-16 h-16 flex items-center justify-center rounded-2xl font-black text-3xl shadow-lg mb-2"
              style={{ '--theme-color': theme.main }}>
              {party.number}
            </div>
          </div>

          {/* Mobile Text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-3">
              Official Party Page
            </div>
            <h1 className="text-4xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-4"
              style={{ textWrap: 'balance' }}>
              {smartLineBreak(party.name)}
            </h1>
            <div className="w-12 h-1 bg-slate-900 mb-4"></div>
            <p className="text-slate-600 font-medium text-[16px] leading-relaxed">
              {party.slogan}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Section 2: Vision & Data (Awwwards Style Bento)
const PartyVisionSection = ({ party, theme }) => {
  return (
    <section className="relative w-full py-16 md:py-24 px-6 md:px-12 bg-slate-50 border-b border-slate-200">

      <div className="max-w-[90rem] mx-auto relative z-10">

        {/* HEADER AREA */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-4">
            VISION <span className="text-slate-300">&</span> FUTURE
          </h2>
          <div className="w-full h-[1px] bg-slate-200 mt-8"></div>
        </div>

        {/* BENTO GRID LAYOUT */}
        {/* แก้ไข 1: เปลี่ยน md:grid-cols-12 เป็น lg:grid-cols-12 เพื่อให้ Tablet แนวตั้งเป็นคอลัมน์เดียว */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* 1. IDENTITY CARD */}
          {/* แก้ไข 2: เปลี่ยน md:col-span-8 เป็น lg:col-span-8 */}
          <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-xl transition-all duration-500 h-[500px]">

            {/* Header Section */}
            <div className="p-8 md:p-12 pb-4 shrink-0 relative z-20 bg-white/95 backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12 pointer-events-none">
                <Quote size={100} />
              </div>

              <div className="flex items-center gap-4">
                <span className="p-3 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100">
                  <Lightbulb size={24} />
                </span>
                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Logo Concept</h3>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="px-8 md:px-12 pb-12 overflow-y-auto custom-scrollbar relative z-10 h-full">
              <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed whitespace-pre-line pb-32">
                {party.logoMeaning}
              </p>
            </div>

            {/* Fade Overlay */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-20 rounded-b-[2rem]"></div>
          </div>

          {/* 2. MISSION CARD (แก้ไข: พื้นหลัง Dark Mode เข้มขึ้น, ตัดความสูงส่วนเกิน) */}
          {/* เอา style backgroundColor ออกจาก div หลัก */}
          <div className="lg:col-span-4 p-8 md:p-12 rounded-[2rem] shadow-lg flex flex-col relative overflow-hidden group hover:shadow-2xl transition-all duration-500 text-white">

            {/* ===================================================================== */}
            {/* NEW: เลเยอร์พื้นหลังแบบเข้ม (Darkened Background Layer) */}
            {/* เราสร้าง div ซ้อนไว้ข้างหลัง แล้วใส่สี theme.main พร้อมสั่ง filter brightness ให้มืดลง */}
            <div className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundColor: theme.main,
                // brightness(0.5): ทำให้มืดลง 50% (ปรับเลขนี้ได้ 0.1-1.0 ยิ่งน้อยยิ่งมืด)
                // saturate(1.2): เร่งสีให้สดขึ้นนิดหน่อยไม่ให้ดูทึบเกินไปเมื่อมืดลง
                filter: 'brightness(0.5) saturate(1.2)'
              }}
            />
            {/* ===================================================================== */}

            {/* Abstract Lines (ของเดิม แต่ขยับ z-index ให้มาอยู่เหนือพื้นหลังเข้ม) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
              <svg width="100%" height="100%">
                <pattern id="lines" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="20" y2="20" stroke="currentColor" strokeWidth="1" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#lines)" />
              </svg>
            </div>

            {/* Header Content (ต้องมี relative z-10 เพื่อลอยอยู่เหนือพื้นหลัง) */}
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <span className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Flag size={24} />
              </span>
              <h3 className="text-xl font-bold text-white/80 uppercase tracking-widest">พันธกิจ</h3>
            </div>

            {/* List Content (ต้องมี relative z-10 เพื่อลอยอยู่เหนือพื้นหลัง) */}
            <div className="space-y-6 relative z-10 pb-4"> {/* เพิ่ม padding bottom นิดหน่อย */}
              {party.missions.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start group/item">
                  <span className="text-white/50 font-mono text-xl pt-1 font-bold">0{idx + 1}</span>
                  {/* เพิ่ม font-medium และ ปรับ opacity text ให้อ่านง่ายที่สุด */}
                  <p className="text-lg md:text-xl font-medium leading-relaxed text-white/95 group-hover/item:translate-x-2 transition-transform duration-300 drop-shadow-sm">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. POLICIES START HEADER */}
          <div className="lg:col-span-12 mt-12 mb-6"> {/* เปลี่ยน md เป็น lg เพื่อความสม่ำเสมอ */}
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white text-slate-400">
                <Target size={20} />
              </span>
              OUR POLICIES
            </h3>
          </div>

          {/* 4. POLICIES GRID */}
          <div className="lg:col-span-12 grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {party.policies.map((policy, idx) => (
              <div key={idx} className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between group h-full relative overflow-hidden hover:border-transparent"
                style={{ '--hover-color': theme.main }}>

                {/* ... ส่วนเนื้อหา Policy คงเดิม ... */}
                <div className="absolute inset-0 bg-[var(--hover-color)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <span className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 text-slate-400 font-black text-lg md:text-2xl group-hover:bg-white group-hover:text-[var(--hover-color)] transition-all duration-500 shadow-inner group-hover:shadow-xl group-hover:scale-110">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-300 tracking-[0.1em] md:tracking-[0.2em] uppercase group-hover:text-white/90 transition-colors duration-500 drop-shadow-sm">
                      Policy
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm md:text-xl font-bold text-slate-800 leading-tight md:leading-relaxed group-hover:text-white transition-colors duration-500 drop-shadow-md">
                    {typeof policy === 'object' ? (
                      <>
                        <div className="mb-2">{policy.title}</div>
                        <div className="text-xs md:text-sm font-normal opacity-80">{policy.desc}</div>
                      </>
                    ) : (
                      policy
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

const PartyChartSection = ({ party, theme, onSelectMember, onScrollToList }) => {
  return (
    <section className="relative w-full flex flex-col overflow-visible">
      <div className="absolute top-0 right-0 w-full z-20 pt-8 px-6 flex justify-end items-start pointer-events-none">
        <button onClick={onScrollToList}
          className="pointer-events-auto bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 px-4 py-2 rounded-full backdrop-blur-md transition-all border border-slate-900/10 hover:scale-105 flex items-center gap-2 shadow-sm">
          <span className="text-xs font-bold tracking-wider">รายชื่อ</span>
          <ChevronDown size={16} />
        </button>
      </div>
      <div className="relative w-full">
        <PartyChart members={party.chartMembers} theme={theme} onMemberClick={onSelectMember} partyName={party.name} />
      </div>
    </section>
  );
};


const CandidateList = ({ members, theme, onSelectMember }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const { president, executives, heads, filteredSearch, isSearching } = useMemo(() => {
    const validMembers = members.filter(m => !m.isPlaceholder);
    if (searchTerm) {
      return {
        isSearching: true,
        filteredSearch: validMembers.filter(m =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.position?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      };
    }

    const getPositionPriority = (position) => {
      if (!position) return 999;
      const p = position.trim();
      if (p.startsWith("นายก")) return 1;
      if (p.startsWith("อุปนายก")) return 2;
      if (p.startsWith("ประธาน")) return 4;
      return 3;
    };

    // Sort all members by priority first
    const sortedMembers = [...validMembers].sort((a, b) => {
      const pA = getPositionPriority(a.position);
      const pB = getPositionPriority(b.position);
      return pA - pB || (a.number || 999) - (b.number || 999);
    });

    return {
      isSearching: false,
      president: sortedMembers.find(m => getPositionPriority(m.position) === 1),
      executives: sortedMembers.filter(m => {
        const p = getPositionPriority(m.position);
        return p === 2 || p === 3;
      }),
      heads: sortedMembers.filter(m => getPositionPriority(m.position) === 4),
      filteredSearch: []
    };
  }, [members, searchTerm]);

  return (
    <section className="w-full bg-slate-950 pt-16 pb-40 md:pt-24 md:pb-48 px-4 md:px-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              THE CANDIDATES <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">LIST</span>
            </h2>
            <p className="text-slate-400 text-lg">รายชื่อผู้สมัครและคณะทำงาน</p>
          </div>
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือตำแหน่ง..."
              className="w-full pl-14 pr-6 py-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)] focus:outline-none transition-all duration-300"
              style={{ '--theme-color': theme.main }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isSearching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSearch.length > 0 ? filteredSearch.map(m => (
              <MemberCard key={m.id} member={m} theme={theme} onClick={() => onSelectMember(m)} compact />
            )) : <div className="col-span-full text-center py-20 text-slate-400">ไม่พบข้อมูลที่ค้นหา</div>}
          </div>
        ) : (
          <div className="space-y-16">
            {president && (
              <div>
                <SectionLabel theme={theme} label="THE PRESIDENT" />
                <div onClick={() => onSelectMember(president)}
                  className="group relative md:p-1 overflow-hidden rounded-[2.5rem] cursor-pointer transition-transform duration-500 hover:scale-[1.01]"
                >
                  {/* Animated Border Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.4rem] p-6 md:p-10 flex flex-col md:flex-row items-center gap-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] group-hover:border-cyan-400/30 group-hover:shadow-[0_0_50px_rgba(34,211,238,0.1)] transition-all duration-500">

                    {/* President Image */}
                    <div className="w-48 h-48 md:w-72 md:h-72 rounded-[2rem] overflow-hidden shadow-2xl shrink-0 relative ring-1 ring-white/10 group-hover:ring-cyan-400/50 transition-all duration-500 bg-slate-900">
                      {/* Crown Icon */}
                      <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 z-20">
                        <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                      </div>
                      <MemberImage url={president.imageUrl || president.modalImageUrl} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left z-10 w-full">
                      <span className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 text-cyan-300 font-bold text-xs tracking-widest mb-4 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        CANDIDATE #1
                      </span>
                      <h3 className="text-3xl md:text-5xl font-black text-white mb-3 leading-none tracking-tight uppercase group-hover:text-cyan-100 transition-colors">
                        {president.name}
                      </h3>
                      <p className="text-xl md:text-2xl font-bold text-slate-300 mb-6">
                        {president.position}
                      </p>
                      <button className="inline-flex items-center text-sm font-bold text-slate-400 group-hover:text-white transition-colors gap-2 mx-auto md:mx-0">
                        VIEW PROFILE <div className="p-1 rounded-full bg-white/10 group-hover:bg-cyan-500 group-hover:text-black transition-all"><ChevronRight size={14} /></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {executives.length > 0 && (
              <div>
                <SectionLabel theme={theme} label="CORE EXECUTIVES" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {executives.map((m, i) => <MemberCard key={m.id} member={m} theme={theme} onClick={() => onSelectMember(m)} index={i + 2} isExec />)}
                </div>
              </div>
            )}

            {heads.length > 0 && (
              <div>
                <SectionLabel theme={theme} label="DEPARTMENT HEADS" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {heads.map((m, i) => <MemberCard key={m.id} member={m} theme={theme} onClick={() => onSelectMember(m)} index={i + 6} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const SectionLabel = ({ theme, label }) => (
  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-4">
    <div className="w-12 h-[2px] rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div> {label}
  </h3>
);

const MemberCard = React.memo(({ member, theme, onClick, index, compact }) => (
  <div onClick={onClick}
    className={`
         group cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-md bg-white/5 border border-white/10
         p-5 rounded-[2rem] flex items-center gap-6 hover:bg-white/10 hover:border-cyan-400/30
         ${compact ? 'border shadow-sm' : ''}
       `}
  >

    {/* Glow Highlight */}
    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-white/0 to-cyan-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

    <div className="relative overflow-hidden bg-slate-900 shrink-0 border border-white/10 w-32 h-32 rounded-2xl shadow-lg group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-shadow duration-500">
      {index && (
        <div className="absolute bottom-0 right-0 px-2.5 py-1.5 rounded-tl-xl bg-slate-950/90 backdrop-blur text-cyan-400 font-mono font-bold text-xs z-10 border-t border-l border-white/10 shadow-lg">
          #{index}
        </div>
      )}
      <MemberImage url={member.imageUrl || member.modalImageUrl} />
    </div>

    <div className="min-w-0 flex-1 z-10">
      <h4 className="font-black text-white text-xl truncate group-hover:text-cyan-200 transition-colors mb-2">{member.name}</h4>
      <p className="font-bold truncate opacity-80 text-slate-300 text-sm uppercase mb-3">
        {member.position}
      </p>

      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 group-hover:text-cyan-400 transition-colors">
        <span className="p-1 rounded-full bg-white/5 border border-white/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-colors">
          <ArrowUpRight size={12} />
        </span>
        VIEW PROFILE
      </div>
    </div>
  </div>
));

// --- MAIN CONTENT CONTROLLER ---

function PartyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyIdFromUrl = searchParams.get('id');
  const source = searchParams.get('source');

  const [activeParty, setActiveParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Active template — drives the per-page LAYOUT dispatch (gumroad has its own).
  const [activeTemplateId, setActiveTemplateId] = useState('classic');
  const [templateReady, setTemplateReady] = useState(false);
  const isGumroad = activeTemplateId === 'gumroad';
  const isStudio = activeTemplateId === 'studio-dark';
  const isVerdure = activeTemplateId === 'verdure';

  const listSectionRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(getPath('/api/party'), { cache: 'no-store' });
        if (res.ok) {
          const allParties = await res.json();
          const validParties = allParties.filter(p => parseInt(p.number) > 0);
          let targetParty = null;

          if (validParties.length === 1) {
            targetParty = validParties[0];
          } else if (partyIdFromUrl) {
            targetParty = validParties.find(p => p.number == partyIdFromUrl || p.id == partyIdFromUrl);
          }

          if (targetParty) {
            if (partyIdFromUrl !== String(targetParty.number)) {
              const newParams = new URLSearchParams(searchParams.toString());
              newParams.set('id', targetParty.number);
              router.replace(`?${newParams.toString()}`, { scroll: false });
            }

            // ✅ จัดการข้อมูลสมาชิก (Sort ตามเบอร์ 1-21)
            const enrichedParty = preparePartyData(targetParty);

            if (enrichedParty.members) {
              enrichedParty.members.sort((a, b) => (a.number || 999) - (b.number || 999));
            }
            enrichedParty.chartMembers = enrichedParty.members || [];

            setActiveParty(enrichedParty);
          } else {
            router.push("/candidates");
          }
        } else {
          router.push("/candidates");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [partyIdFromUrl, router, searchParams]);

  useEffect(() => {
    if (!activeParty?.id) return;
    fetch(getPath(`/api/gallery?id=${activeParty.id}`))
      .then(res => res.json())
      .then(data => { if (data.images?.length > 0) setGalleryImages(data.images); });
  }, [activeParty]);

  useEffect(() => {
    fetch(getPath('/api/admin/page-layout'))
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.activeTemplateId) setActiveTemplateId(d.activeTemplateId); })
      .catch(() => {})
      .finally(() => setTemplateReady(true));
  }, []);

  const currentTheme = activeParty ? (PARTY_THEMES[activeParty.id] || PARTY_THEMES[activeParty.number] || DEFAULT_THEME) : DEFAULT_THEME;

  if (loading || !templateReady) return <ThemedLoadingScreen text="กำลังโหลดข้อมูลพรรค..." />;
  if (!activeParty) return null;

  // GUMROAD layout (own topbar/footer) — replaces the classic cinematic page entirely.
  if (isGumroad) {
    return (
      <>
        <PageThemeOverrides page="party" />
        <GumroadParty party={activeParty} galleryImages={galleryImages} showBackToVote={source === 'vote'} />
      </>
    );
  }

  // STUDIO DARK layout (own rail/scene chrome) — replaces the classic cinematic page entirely.
  if (isStudio) {
    return (
      <>
        <PageThemeOverrides page="party" />
        <StudioDarkParty party={activeParty} galleryImages={galleryImages} showBackToVote={source === 'vote'} />
      </>
    );
  }

  // VERDURE layout (own glass-terrarium chrome) — replaces the classic cinematic page entirely.
  if (isVerdure) {
    return (
      <>
        <PageThemeOverrides page="party" />
        <VerdureParty party={activeParty} galleryImages={galleryImages} showBackToVote={source === 'vote'} />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-800 bg-[#Fdfdfd] overflow-x-hidden relative">
      <div className="fixed top-0 w-full z-[60] bg-white/80 backdrop-blur-md border-b border-slate-100"><Navbar /></div>

      <main className="flex-1 flex flex-col pt-16 xl:pt-16">

        {/* 1. Banner */}
        <PartyBanner
          party={activeParty}
          theme={currentTheme}
          galleryImages={galleryImages}
          onOpenLightbox={(img) => setLightboxImage(img || galleryImages[0])}
        />

        {/* 2. Vision & Policies (UP) */}
        <PartyVisionSection party={activeParty} theme={currentTheme} />

        {/* 3. Chart (DOWN) */}
        <PartyChartSection
          party={activeParty}
          theme={currentTheme}
          onSelectMember={setSelectedMember}
          onScrollToList={() => listSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
        />

        {/* 4. List */}
        <div ref={listSectionRef}>
          <CandidateList members={activeParty.members} theme={currentTheme} onSelectMember={setSelectedMember} />
        </div>

      </main>

      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300" onClick={() => setLightboxImage(null)}>
          <button onClick={() => setLightboxImage(null)} className="absolute top-10 right-6 z-[110] p-3 bg-white/10 rounded-full text-white hover:bg-white/20"><X size={28} /></button>
          <img src={getPath(lightboxImage)} className="max-w-full max-h-[85vh] object-contain shadow-2xl" alt="Lightbox" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <CandidateModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        themeColor={currentTheme.main}
      />

      {source === 'vote' && <BackToVoteBar />}

      <footer className="absolute bottom-0 w-full py-8 bg-transparent text-center z-50 mix-blend-difference text-white pointer-events-none">
        <p className="text-xs font-medium tracking-widest uppercase opacity-90">© FMS@PSU 2026. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default function PartyPage() {
  return (
    <Suspense fallback={<ThemedLoadingScreen text="กำลังโหลดข้อมูลพรรค..." />}>
      <PartyContent />
    </Suspense>
  );
}

function MemberImage({ url }) {
  const [error, setError] = useState(false);
  // ✅ ใช้ getPath wrap url
  if (error || !url) return <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><User className="w-1/2 h-1/2" /></div>;
  return <img src={getPath(url)} className="w-full h-full object-cover" onError={() => setError(true)} alt="member" loading="lazy" />;
}

// Read-only CLASSIC party detail for /template-preview (classic + original families).
// Mirrors PartyContent's classic branch with mock props — no fetch, no auth — so the
// chooser's party slide shows the real cinematic layout instead of a placeholder.
export function ClassicPartyPreview({ party, galleryImages = [] }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const listSectionRef = useRef(null);
  if (!party) return null;
  const theme = PARTY_THEMES[party.id] || PARTY_THEMES[party.number] || DEFAULT_THEME;

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-800 bg-[#Fdfdfd] overflow-x-hidden relative">
      <div className="fixed top-0 w-full z-[60] bg-white/80 backdrop-blur-md border-b border-slate-100"><Navbar /></div>
      <main className="flex-1 flex flex-col pt-16 xl:pt-16">
        <PartyBanner party={party} theme={theme} galleryImages={galleryImages} onOpenLightbox={(img) => setLightboxImage(img || galleryImages[0])} />
        <PartyVisionSection party={party} theme={theme} />
        <PartyChartSection party={party} theme={theme} onSelectMember={setSelectedMember} onScrollToList={() => listSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} />
        <div ref={listSectionRef}>
          <CandidateList members={party.members} theme={theme} onSelectMember={setSelectedMember} />
        </div>
      </main>
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center" onClick={() => setLightboxImage(null)}>
          <button onClick={() => setLightboxImage(null)} className="absolute top-10 right-6 z-[110] p-3 bg-white/10 rounded-full text-white hover:bg-white/20"><X size={28} /></button>
          <img src={getPath(lightboxImage)} className="max-w-full max-h-[85vh] object-contain shadow-2xl" alt="Lightbox" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      <CandidateModal member={selectedMember} onClose={() => setSelectedMember(null)} themeColor={theme.main} />
      <footer className="absolute bottom-0 w-full py-8 bg-transparent text-center z-50 mix-blend-difference text-white pointer-events-none">
        <p className="text-xs font-medium tracking-widest uppercase opacity-90">© FMS@PSU 2026. All Rights Reserved.</p>
      </footer>
    </div>
  );
}