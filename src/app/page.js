"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import CountdownTimer from '../components/CountdownTimer';
import { LogIn, Vote, BarChart3, PieChart, Sparkles, TrendingUp, CheckCircle2, Users, ArrowRight, User } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({ totalEligible: 0, totalVoted: 0, percentage: "0.00" });
  const [candidates, setCandidates] = useState([]);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const slideshowImages = [
    "/images/prob/samo49_1.png"
  ];

  const isMultiImage = slideshowImages.length > 1;

  const extendedImages = isMultiImage
    ? [...slideshowImages, slideshowImages[0]]
    : slideshowImages;

  // ✅ 1. useEffect หลัก: เช็ค User และ ดึงข้อมูล Stats/Candidates
  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/api/home-info'); // เรียก API
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        // เก็บข้อมูลผู้สมัครลง State (เพื่อเอาไปโชว์ในวงกลม)
        if (data.candidates) {
          setCandidates(data.candidates);
        }

        // อัปเดต Stats
        const eligible = data.stats?.totalEligible || 0;
        const voted = data.stats?.totalVoted || 0;
        const percent = eligible > 0
          ? ((voted / eligible) * 100).toFixed(2)
          : "0.00";

        setStats({
          totalEligible: eligible,
          totalVoted: voted,
          percentage: percent
        });

      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };

    fetchData(); // ⚠️ อย่าลืมเรียกฟังก์ชันนี้
  }, []); // ⚠️ ปิดวงเล็บ useEffect ตรงนี้

  // 2. Loop Effect (ทำงานเฉพาะเมื่อมีหลายรูป)
  useEffect(() => {
    if (!isMultiImage) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => prevIndex + 1);
      setIsTransitioning(true);
    }, 10000); // 10 วินาที
    return () => clearInterval(interval);
  }, [isMultiImage]);

  // 3. Magic Reset Effect (ทำงานเฉพาะเมื่อมีหลายรูป)
  useEffect(() => {
    if (!isMultiImage) return;

    if (currentImageIndex === extendedImages.length - 1) {
      const resetTimeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentImageIndex(0);
      }, 1500); // ต้องตรงกับ duration ใน style
      return () => clearTimeout(resetTimeout);
    }
  }, [currentImageIndex, extendedImages.length, isMultiImage]);

  // ✅ Component ย่อยสำหรับจัดการรูปภาพ (ใส่ไว้ในไฟล์ page.js ได้เลย)
  const CandidateAvatar = ({ logoUrl, index }) => {
    const [imageError, setImageError] = useState(false);

    // ถ้าไม่มี URL หรือ โหลดรูปแล้ว Error ให้โชว์ไอคอน User
    if (!logoUrl || imageError) {
      return (
        <User
          size={20}
          className={`opacity-70 ${index === 0 ? 'text-blue-600' : index === 1 ? 'text-purple-600' : 'text-pink-600'
            }`}
        />
      );
    }

    // ถ้ามี URL ให้ลองโหลดรูป
    return (
      <Image
        src={logoUrl}
        alt={`Candidate ${index + 1}`}
        fill
        className="object-cover" // ✅ บังคับให้รูปไม่เบี้ยวและเต็มวงกลม
        onError={() => setImageError(true)} // ✅ ดัก Error ตรงนี้
        sizes="44px"
      />
    );
  };


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 text-gray-900 font-sans selection:bg-purple-300 relative overflow-hidden">

      {/* ================= BACKGROUND DECORATION ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Watermark 2026 */}
      <div className="hidden lg:flex fixed top-0 right-1 h-full items-center justify-end z-0 pointer-events-none select-none overflow-hidden">
        <span className="text-[17em] font-black text-gray-900 opacity-[0.03] leading-none tracking-tighter transform rotate-90 translate-x-[20%] whitespace-nowrap">2026</span>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 flex flex-col flex-grow">
        <Navbar />

        <main className="flex-grow flex flex-col justify-center py-8 md:py-10 px-4 md:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-20">

              {/* ===== LEFT SIDE (Text / Content) ===== */}
              <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8 md:space-y-10 relative z-20">
                <div className="flex justify-center lg:justify-start w-full">
                  <div className="relative group inline-flex justify-center items-center cursor-pointer animate-heartbeat hover:animate-none">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                    <div className="relative flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-purple-200/50 shadow-lg">
                      <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-purple-500"></span>
                      </span>
                      <span className="text-[12px] md:text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 uppercase tracking-widest">
                        Your Vote Matters
                      </span>
                      <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-row items-center justify-center lg:justify-start gap-1 md:gap-2">
                    <h1 className="text-7xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none">
                      <span className="text-transparent bg-clip-text pr-2 bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 pb-2">SAMO</span>
                    </h1>
                    <div className="bg-gradient-to-br from-purple-700 to-pink-700 rounded-xl md:rounded-2xl p-1 md:p-2 rotate-3 hover:rotate-0 transition-transform duration-300 shadow-lg">
                      <span className="text-5xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white">49</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-4">
                    <div className="h-8 w-1.5 bg-gradient-to-b from-purple-800 via-purple-600 to-purple-800 rounded-full"></div>
                    <p className="text-lg md:text-xl font-bold text-gray-500 tracking-[0.3em] uppercase">FMS Election 2026</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800 leading-tight">โครงการเลือกตั้งคณะกรรมการบริหาร</h2>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-500">สโมสรนักศึกษาคณะวิทยาการจัดการ</h3>
                  <div className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg">ประจำปีการศึกษา 2569</div>
                </div>

                <div className="flex flex-col items-center lg:items-start gap-4 md:gap-6 pt-4">
                  <Link href={mounted && user?.isVoted ? "/results" : "/vote"} className="w-full sm:w-auto">
                    <button className={`w-full sm:w-auto group relative overflow-hidden rounded-2xl text-white transition-all duration-300 hover:scale-105 ${mounted && user?.isVoted ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg' : 'bg-gradient-to-r from-[#8A2680] to-purple-600 shadow-lg'}`}>
                      <span className="relative flex items-center justify-center gap-3 py-4 px-10 font-bold text-xl">
                        {mounted && user?.isVoted ? <>ดูผลคะแนน <BarChart3 /></> : mounted && user ? <>Vote Now <Vote className="animate-pulse" /></> : <>เข้าสู่ระบบ <LogIn /></>}
                      </span>
                    </button>
                  </Link>
                  <div className="w-full sm:w-auto"><CountdownTimer /></div>
                </div>
              </div>

              {/* ===== RIGHT SIDE (Stats & Image Slideshow) ===== */}
              <div className="relative flex flex-col items-center w-full lg:w-1/2 mt-10 lg:mt-0 gap-8">

                {/* ✅ Compact & Balanced Design - เหมาะทุกหน้าจอ */}
                <Link href="/candidates" className="group block mb-6 w-full max-w-[85%] sm:max-w-md lg:max-w-full mx-auto">
                  <div className="relative transition-all duration-400 transform group-hover:-translate-y-2 group-hover:scale-[1.02]">

                    {/* ✨ Subtle Gradient Border */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/60 via-purple-400/60 to-pink-400/60 rounded-[1.5rem] opacity-50 group-hover:opacity-80 blur transition-all duration-500"></div>

                    {/* Soft glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-[1.5rem] blur-xl opacity-40 group-hover:opacity-70 transition-all duration-500"></div>

                    {/* การ์ดหลัก - ขนาดพอดี */}
                    <div className="relative w-full bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 rounded-[1.4rem] p-4 md:p-5 flex items-center justify-between gap-3 overflow-hidden border border-white/80 shadow-lg group-hover:shadow-xl transition-all duration-400 backdrop-blur-sm">

                      {/* Background Pattern - เบาลง */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 -z-10"></div>

                      {/* Decorative shape - ขนาดเล็กลง */}
                      <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-bl from-blue-100/30 via-purple-100/20 to-pink-100/30 rounded-bl-[4rem] -z-10 transition-all duration-600 group-hover:scale-125 group-hover:rotate-6"></div>

                      <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-2xl -z-10 transition-all duration-600 group-hover:scale-150"></div>

                      {/* Minimal sparkle - เหลือ 1 จุด */}
                      <div className="absolute top-3 right-6 w-2 h-2 bg-purple-300/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-ping"></div>

                      {/* 👈 ฝั่งซ้าย: ข้อความชัดเจน */}
                      <div className="flex-1 flex flex-col gap-1 md:gap-1.5 z-10">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400/70 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-blue-500 to-purple-500"></span>
                          </span>
                          <p className="text-[9px] md:text-[10px] font-extrabold tracking-wider uppercase text-blue-600">
                            Meet The Candidates
                          </p>
                        </div>

                        <h3 className="text-sm md:text-base font-black text-slate-900 leading-tight group-hover:text-purple-700 transition-colors duration-300">
                          ยังไม่รู้จักผู้สมัคร?
                        </h3>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] md:text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">
                            ทำความรู้จักเลย
                          </span>
                          <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[9px] md:text-[10px] font-black px-2 md:px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md shadow-purple-400/40 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-105 transition-all duration-300">
                            คลิก <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>

                      {/* 👉 ฝั่งขวา: Avatar Stack - ขนาดพอดี */}
                      <div className="flex items-center -space-x-2.5 md:-space-x-3 pl-2 z-10">
                        {candidates
                          .filter(c => c.number !== 0)
                          .slice(0, 4)
                          .map((candidate, index) => (
                            <div key={candidate.id || index} className={`
              relative w-10 h-10 md:w-12 md:h-12 rounded-full border-[3px] border-white shadow-md flex items-center justify-center overflow-hidden
              transform transition-all duration-400 
              ${index === 0 ? 'z-30 group-hover:-translate-x-2 group-hover:scale-110 bg-gradient-to-br from-blue-100 to-cyan-200 shadow-blue-300/40 group-hover:shadow-lg group-hover:shadow-blue-300/50' : ''}
              ${index === 1 ? 'z-20 group-hover:-translate-y-2 group-hover:scale-110 bg-gradient-to-br from-purple-100 to-purple-200 shadow-purple-300/40 group-hover:shadow-lg group-hover:shadow-purple-300/50' : ''}
              ${index === 2 ? 'z-10 group-hover:translate-x-2 group-hover:scale-110 bg-gradient-to-br from-pink-100 to-pink-200 shadow-pink-300/40 group-hover:shadow-lg group-hover:shadow-pink-300/50' : ''}
              ${index === 3 ? 'z-20 group-hover:-translate-y-2 group-hover:scale-110 bg-gradient-to-br from-indigo-100 to-blue-200 shadow-indigo-300/40 group-hover:shadow-lg group-hover:shadow-indigo-300/50' : ''}
            `}>
                              <CandidateAvatar logoUrl={candidate?.logoUrl} index={index} />

                              {/* Subtle glow */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          ))
                        }

                        {/* Arrow Button - ขนาดพอดี */}
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white flex items-center justify-center text-white shadow-md shadow-purple-400/40 -ml-2 z-40 transform transition-all duration-400 group-hover:translate-x-2 group-hover:scale-110 group-hover:rotate-45 group-hover:shadow-lg group-hover:shadow-purple-400/50">
                          <ArrowRight size={14} className="group-hover:scale-105 transition-transform" />
                        </div>
                      </div>

                    </div>
                  </div>
                </Link>
                
                {/* 1. Stats Cards */}
                <div className="relative z-20 w-full max-w-[550px] bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 lg:p-8 hover:border-purple-200 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">สถิติการลงคะแนน</h3>
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-3 bg-white/50 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                      <Users className="w-5 h-5 text-gray-400 mb-2" />
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ผู้มีสิทธิ</div>
                      <div className="text-2xl font-black text-gray-800">{stats.totalEligible.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-purple-50/50 rounded-2xl border border-purple-100 relative overflow-hidden hover:shadow-md transition-shadow">
                      <CheckCircle2 className="w-5 h-5 text-purple-600 mb-2 relative z-10" />
                      <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider relative z-10">ใช้สิทธิแล้ว</div>
                      <div className="text-2xl font-black text-purple-900 relative z-10">{stats.totalVoted.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-green-50/50 rounded-2xl border border-green-100 hover:shadow-md transition-shadow">
                      <PieChart className="w-5 h-5 text-green-600 mb-2" />
                      <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider">ร้อยละ</div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-black text-green-800">{stats.percentage}</span>
                        <span className="text-xs font-bold text-green-600 ml-1">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Image Slideshow Container */}
                <div className="relative z-10 w-full max-w-[550px] group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-200/40 border-[6px] border-white bg-white">
                    <div
                      className="flex h-full will-change-transform"
                      style={{
                        transform: `translateX(-${currentImageIndex * 100}%)`,
                        transitionDuration: (isTransitioning && isMultiImage) ? '1500ms' : '0ms',
                        transitionProperty: 'transform',
                        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {extendedImages.map((src, index) => (
                        <div key={index} className="min-w-full h-full relative">
                          <Image
                            src={src}
                            alt={`Campaign Poster ${index}`}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {isMultiImage && (
                    <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
                      {slideshowImages.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1.5 rounded-full transition-all duration-500 ${(currentImageIndex % slideshowImages.length) === index
                            ? "w-8 bg-purple-400"
                            : "w-2 bg-purple-200"
                            }`}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </main>

        <footer className="w-full py-6 bg-white/50 backdrop-blur-md border-t border-gray-200/50 text-center relative z-50">
          <p className="text-sm text-gray-500 font-medium">© FMS@PSU 2026. All Rights Reserved.</p>
        </footer>

      </div>
    </div>
  );
}