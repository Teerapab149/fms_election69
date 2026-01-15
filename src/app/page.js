"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import CountdownTimer from '../components/CountdownTimer';
import MeetCandidatesCard from '../components/MeetCandidatesCard';

import { TrendingUp, CheckCircle2, ArrowRight, Calendar, Users, PieChart, LogIn, Vote, BarChart3 } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({ totalEligible: 0, totalVoted: 0, percentage: "0.00" });
  const [candidates, setCandidates] = useState([]);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const slideshowImages = ["/images/prob/samo49_1.png"];
  const isMultiImage = slideshowImages.length > 1;
  const extendedImages = isMultiImage ? [...slideshowImages, slideshowImages[0]] : slideshowImages;

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchData = async () => {
      try {
        const res = await fetch('/api/home-info');
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.candidates) setCandidates(data.candidates);
        const eligible = data.stats?.totalEligible || 0;
        const voted = data.stats?.totalVoted || 0;
        const percent = eligible > 0 ? ((voted / eligible) * 100).toFixed(2) : "0.00";
        setStats({ totalEligible: eligible, totalVoted: voted, percentage: percent });
      } catch (error) { console.error("Error fetching home data:", error); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isMultiImage) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => prevIndex + 1);
      setIsTransitioning(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isMultiImage]);

  useEffect(() => {
    if (!isMultiImage) return;
    if (currentImageIndex === extendedImages.length - 1) {
      const resetTimeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentImageIndex(0);
      }, 1500);
      return () => clearTimeout(resetTimeout);
    }
  }, [currentImageIndex, extendedImages.length, isMultiImage]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F8F9FD] text-slate-900 font-sans selection:bg-[#8A2680] selection:text-white relative">

      {/* --- Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[35%] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        <div className="bg-noise"></div>
      </div>

      <div className="relative z-50 shrink-0">
        <Navbar />
      </div>

      {/* --- Main Content --- */}
      {/* เพิ่ม lg:px-24 ช่วยเรื่อง Alignment ไม่ให้ชิดขอบจอ Notebook เกินไป */}
      <main className="flex-grow flex items-center justify-center py-6 lg:py-6 xl:py-10 px-6 md:px-12 lg:px-24 relative z-10">
        <div className="container mx-auto max-w-[1400px] w-full">

          {/* ✅ 1. Alignment Fix: เพิ่ม gap-16/gap-24 เพื่อแยกซ้ายขวาให้สมดุล (Balance) */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-16 xl:gap-24">

            {/* ======================= LEFT SIDE ======================= */}
            <div className="w-full lg:w-5/12 xl:w-5/12 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:space-y-5 xl:space-y-8 relative z-20 animate-fade-in-up">

              {/* ✅ 3. Timer Fix: เพิ่ม mb-4 ให้ Timer ดูมีพื้นที่ ไม่เบียดหัวข้อ */}
              <div className="flex justify-center lg:justify-start w-full mb-1 lg:mb-0">
                <CountdownTimer />
              </div>

              {/* HEADLINE */}
              <div className="space-y-3 lg:space-y-2 xl:space-y-4">
                <div className="flex items-center justify-center lg:justify-start relative">
                  <h1 className="flex items-baseline gap-2 md:gap-3 font-black tracking-tight leading-none whitespace-nowrap select-none">
                    <span className="text-[20vw] sm:text-[100px] md:text-[110px] lg:text-[85px] xl:text-[120px] 2xl:text-[150px] text-slate-900 drop-shadow-sm">
                      SAMO
                    </span>
                    <span className="text-[20vw] sm:text-[100px] md:text-[110px] lg:text-[85px] xl:text-[120px] 2xl:text-[150px] text-transparent bg-clip-text bg-gradient-to-b from-[#8A2680] to-[#D946EF] drop-shadow-md relative">
                      49
                      <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-2 h-2 md:w-4 md:h-4 bg-[#D946EF] rounded-full opacity-30 animate-ping"></span>
                    </span>
                  </h1>
                </div>

                <div className="space-y-2 lg:space-y-1">
                  <div className="space-y-0.5">
                    <h2 className="text-lg sm:text-2xl lg:text-2xl xl:text-3xl font-extrabold text-slate-800 leading-tight tracking-tight">
                      โครงการเลือกตั้ง<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2680] to-[#D946EF]">คณะกรรมการบริหาร</span>
                    </h2>
                    <h3 className="text-base sm:text-lg lg:text-lg xl:text-2xl font-semibold text-slate-500">
                      สโมสรนักศึกษาคณะวิทยาการจัดการ
                    </h3>
                  </div>

                  <div className="flex justify-center lg:justify-start pt-2">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-purple-50 text-[#8A2680] border border-purple-200 text-xs md:text-sm font-bold shadow-sm hover:bg-purple-100 transition-colors cursor-default">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      ประจำปีการศึกษา 2569
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Button */}
              <div className="w-full flex justify-center lg:justify-start pt-1">
                {(() => {
                  let btnConfig = {
                    href: "/login",
                    text: "เข้าสู่ระบบ / Sign in",
                    gradientBase: "from-[#691E61] via-[#8A2680] to-[#C026D3]",
                    gradientHover: "from-[#1e3a8a] via-[#1d4ed8] to-[#3b82f6]",
                    glowColor: "from-[#8A2680] to-[#3b82f6]",
                    shadow: "shadow-[0_10px_20px_-5px_rgba(138,38,128,0.4)]",
                    icon: <LogIn className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />,
                    animation: ""
                  };

                  if (mounted && user) {
                    if (!user.isVoted) {
                      btnConfig = {
                        href: "/vote",
                        text: "ลงคะแนน / Vote Now",
                        gradientBase: "from-[#F59E0B] via-[#D97706] to-[#B45309]",
                        gradientHover: "from-[#9f1239] via-[#be123c] to-[#e11d48]",
                        glowColor: "from-[#F59E0B] to-[#e11d48]",
                        shadow: "shadow-[0_15px_30px_-8px_rgba(245,158,11,0.4)]",
                        icon: <Vote className="w-5 h-5 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />,
                        animation: "animate-pulse"
                      };
                    } else {
                      btnConfig = {
                        href: "/results",
                        text: "ดูผลคะแนน / Results",
                        gradientBase: "from-[#0369a1] via-[#0284c7] to-[#38bdf8]",
                        gradientHover: "from-[#0f766e] via-[#0d9488] to-[#14b8a6]",
                        glowColor: "from-[#0ea5e9] to-[#14b8a6]",
                        shadow: "shadow-[0_10px_20px_-5px_rgba(14,165,233,0.4)]",
                        icon: <BarChart3 className="w-5 h-5 transition-transform duration-500 group-hover:scale-110" />,
                        animation: ""
                      };
                    }
                  }

                  return (
                    <Link href={btnConfig.href} className="group relative w-[90%] sm:w-auto inline-block">
                      <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${btnConfig.glowColor} opacity-40 blur-lg group-hover:opacity-80 group-hover:blur-xl transition-all duration-700 ${btnConfig.animation}`}></div>
                      <button className={`relative w-full sm:w-auto overflow-hidden rounded-xl bg-gradient-to-r ${btnConfig.gradientBase} px-10 py-4 text-lg font-bold text-white ${btnConfig.shadow} ring-1 ring-white/20 transition-all duration-500 ease-out transform group-hover:scale-[1.02] group-hover:-translate-y-1 active:scale-95 isolate`}>
                        <div className={`absolute inset-0 -z-10 bg-gradient-to-r ${btnConfig.gradientHover} opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100`}></div>
                        <span className="relative z-20 flex items-center justify-center gap-3 drop-shadow-sm">
                          {btnConfig.text}
                          <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md shadow-inner border border-white/10">
                            {btnConfig.icon}
                          </span>
                        </span>
                        <div className="absolute inset-0 z-30 flex h-full w-full justify-center pointer-events-none">
                          <div className="relative h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:animate-shine skew-x-20" />
                        </div>
                      </button>
                    </Link>
                  );
                })()}
              </div>

              {/* Meet Candidates */}
              <div className="w-full max-w-[400px] lg:max-w-[350px] xl:max-w-[420px] pt-1">
                <MeetCandidatesCard candidates={candidates} />
              </div>
            </div>

            {/* ======================= RIGHT SIDE ======================= */}
            <div className="w-full lg:w-6/12 xl:w-6/12 flex flex-col items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

              {/* ปรับ gap ระหว่าง Card ให้กว้างขึ้นเล็กน้อยเพื่อความโปร่ง */}
              <div className="w-full max-w-[550px] lg:max-w-full xl:max-w-[600px] flex flex-col gap-5 lg:gap-6 xl:gap-8">

                {/* Stats Card */}
                <div className="relative z-20 w-full p-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-purple-100 shadow-sm text-[#8A2680]">
                      <TrendingUp className="w-5 h-5" />
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm lg:text-base font-bold text-slate-800 leading-tight">
                        สถิติผู้เข้าร่วมลงคะแนนโหวต
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                        อัปเดตข้อมูลแบบ Real-time
                      </span>
                    </div>
                  </div>

                  {/* Bento Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Hero Card */}
                    <div className="col-span-2 relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#691E61] via-[#8A2680] to-[#C026D3] p-5 pb-7 text-white shadow-xl shadow-purple-900/20 group hover:-translate-y-1 transition-transform duration-500">
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors"></div>
                      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/10 blur-xl"></div>
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">ใช้สิทธิแล้ว (Voted)</span>
                        </div>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-6xl lg:text-7xl font-black tracking-tighter drop-shadow-sm tabular-nums leading-none">
                            {stats.totalVoted.toLocaleString()}
                          </span>
                          <span className="text-lg lg:text-xl font-bold opacity-80">คน</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub Card: Progress */}
                    <div className="col-span-1 rounded-[24px] bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ความคืบหน้า</span>
                        <PieChart className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-800 tabular-nums leading-none">
                          {stats.percentage}<span className="text-sm text-slate-400 ml-0.5">%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(parseFloat(stats.percentage) || 0, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Sub Card: Eligible */}
                    <div className="col-span-1 rounded-[24px] bg-white border-2 border-slate-100 p-4 shadow-sm flex flex-col justify-between group hover:border-purple-200 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-purple-400">ผู้มีสิทธิรวม</span>
                        <Users className="w-4 h-4 text-slate-300 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-700 group-hover:text-purple-700 transition-colors tabular-nums leading-none">
                          {stats.totalEligible.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-slate-400">คน</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slideshow */}
                <div className="w-full relative group rounded-3xl overflow-hidden shadow-2xl border border-white bg-white aspect-[16/9] lg:aspect-[2/1] xl:aspect-[16/10] transform transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                  <div className="relative w-full h-full">
                    <div className="flex h-full will-change-transform" style={{ transform: `translateX(-${currentImageIndex * 100}%)`, transitionDuration: (isTransitioning && isMultiImage) ? '1500ms' : '0ms', transitionProperty: 'transform', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
                      {extendedImages.map((src, index) => (
                        <div key={index} className="min-w-full h-full relative">
                          <Image src={src} alt={`Campaign Poster ${index}`} fill className="object-cover object-top" priority={index === 0} />
                        </div>
                      ))}
                    </div>
                  </div>
                  {isMultiImage && (
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1.5">
                      {slideshowImages.map((_, index) => (
                        <div key={index} className={`h-1.5 rounded-full transition-all duration-500 ${(currentImageIndex % slideshowImages.length) === index ? "w-8 bg-[#8A2680]" : "w-2 bg-slate-300"}`}></div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-50 shrink-0 w-full py-4 bg-white/50 backdrop-blur-sm border-t border-slate-100 text-center mt-auto">
        <p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-widest uppercase">© FMS@PSU 2026. All Rights Reserved.</p>
      </footer>

      {/* Styles */}
      <style jsx global>{`
        @keyframes shine { 100% { transform: translateX(100%); } }
        .animate-shine { animation: shine 1.5s infinite; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>

    </div>
  );
}