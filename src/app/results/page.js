"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../../components/Navbar";
import ResultCard from "../../components/ResultCard";
import PartyDetailModal from "../../components/PartyDetailModal";
import { ELECTION_CONFIG } from "../../utils/electionConfig";

import { Users, Trophy, PieChart as PieIcon, BarChart3, Medal, Activity, Megaphone, Calendar, Loader2, Lock, ArrowRight, Home } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function ResultsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // ✅ 1. State สำหรับระบบความปลอดภัย (Logic ที่เพิ่มเข้ามา)
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "VOTE" หรือ "FORM"

  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [demographics, setDemographics] = useState({
    totalEligible: 0,
    byMajor: [],
    byYear: [],
    byGender: []
  });
  const [loading, setLoading] = useState(true);

  const [serverStatus, setServerStatus] = useState("WAITING");
  const [campaignDate, setCampaignDate] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false); // ✅ สถานะบังคับเปิดเผยข้อมูล

  // ==========================================
  // 🔒 1. SECURITY & ACCESS CHECK (แก้ไข Logic ตามโจทย์)
  // ==========================================
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const now = new Date();
        const isEnded = now >= ELECTION_CONFIG.ELECTION_END;

        // 1.1 เช็คสถานะระบบ (Global Config) ก่อนเสมอ (ไม่ต้อง Login ก็เช็คได้)
        const resStatus = await fetch(`/api/check-status?t=${Date.now()}`); // Add timestamp to prevent caching
        if (!resStatus.ok) throw new Error("Failed to fetch system status");

        const statusData = await resStatus.json();

        const isSystemClosed = statusData.systemMode === "PAUSE";
        const isManualEnd = statusData.systemMode === "ENDED";
        const isRevealed = statusData.showResult === true;

        // ⚡️ NEW SYSTEM MODES logic:
        if (isManualEnd || isEnded || isRevealed) {
          setIsAuthorized(true);
          setLoading(false);
          return;
        }

        // If system is strictly PAUSED
        if (isSystemClosed) {
          setModalType("MAINTENANCE");
          setShowAccessModal(true);
          setLoading(false);
          return;
        }

        // 1.2 ถ้าต้องล็อก (ระบบเปิด + ยังไม่เปิดเผย) -> บังคับ Login

        // ✅ EXCEPTION: ช่วงหาเสียง (Campaign Period) -> ให้คนทั่วไปดูหน้านี้ได้ (เพื่อดูรายชื่อผู้สมัคร)
        // แต่ API จะไม่ส่งคะแนนมาให้ (ดูได้แค่ชื่อ รูป นโยบาย)
        const isOngoing = statusData.electionStatus === "ONGOING";
        if (now >= ELECTION_CONFIG.CAMPAIGN_START && now < ELECTION_CONFIG.ELECTION_START && !isSystemClosed && !isOngoing) {
          setIsAuthorized(true);
          setLoading(false);
          return;
        }

        if (status === "loading") return;

        if (status === "unauthenticated") {
          router.replace("/login");
          return;
        }

        // 1.3 ถ้า Login แล้ว -> เช็คสถานะส่วนตัว (Vote/Form)
        if (status === "authenticated" && session) {

          // ✅ EXCEPTION: ถ้าเป็นช่วงหาเสียง หรือยังไม่เริ่มเลือกตั้ง -> ปล่อยผ่านเลย (ไม่ต้องเช็คโหวต)
          // 🔥 FIX: ถ้าโหมดเป็น "ONGOING" (Manual Open) ต้องไม่ปล่อยผ่าน ต้องเช็คเหมือนตอนเลือกตั้งปกติ
          if (now < ELECTION_CONFIG.ELECTION_START && !isOngoing) {
            setIsAuthorized(true);
            setShowAccessModal(false);
            setLoading(false);
            return;
          }

          // เช็คสถานะส่วนตัวอีกรอบ (พร้อม studentId)
          const resUser = await fetch(`/api/check-status?studentId=${session?.user?.studentId}&t=${Date.now()}`);
          if (!resUser.ok) throw new Error("Failed to fetch user status");
          const userData = await resUser.json();

          // ถ้ายังไม่โหวต -> ห้ามเข้า (ต้องไปโหวตก่อน)
          if (!userData.isVoted) {
            setModalType("VOTE");
            setShowAccessModal(true);
            setIsAuthorized(false);
            setLoading(false); // Ensure loading is off
            return
          };

          const resForm = await fetch(`/api/check-form?studentId=${session?.user?.studentId}&t=${Date.now()}`);
          if (!resForm.ok) throw new Error("Failed to fetch form status");
          const formData = await resForm.json();

          if (!formData.isFormCompleted) {
            setModalType("FORM");
            setShowAccessModal(true);
            setIsAuthorized(false);
            setLoading(false); // Ensure loading is off
            return
          };

          setIsAuthorized(true);
          setShowAccessModal(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Check Access Error:", error);
        // Fallback: Stop loading, maybe deny access slightly gracefully or just show empty
        setLoading(false);
        // Optional: Show alert or keeping unauthorized state
      }
    };

    checkAccess();
  }, [status, session, router]);

  // ==========================================
  // 📥 2. DATA FETCHING (คงเดิม)
  // ==========================================
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const COLORS_GENDER = ['#3b82f6', '#ec4899'];
  const COLORS_BAR = '#8A2680';

  const fetchResults = async () => {
    try {
      const res = await fetch("/api/results");
      const data = await res.json();

      if (data.status) setServerStatus(data.status);
      if (data.campaignDate) setCampaignDate(new Date(data.campaignDate));

      // ✅ Fix: Always update boolean state (even if false)
      setIsRevealed(!!data.isRevealed);

      if (typeof data.totalVotes !== 'undefined') {
        setTotalVotes(data.totalVotes);
      } else if (data.candidates) {
        // Fallback: Calculate total votes as Sum of all candidates
        const sumOfScores = data.candidates.reduce((acc, curr) => acc + curr.score, 0);
        setTotalVotes(sumOfScores);
      }

      // ... (code ส่วน fetch data ด้านบน) ...

      if (data.isRevealed) setIsRevealed(data.isRevealed);

      if (data.candidates) {
        let rawCandidates = data.candidates;
        const now = new Date();
        const isEnded = now >= ELECTION_CONFIG.ELECTION_END;

        // ----------------------------------------------------
        // 1️⃣ กรอง (Filter) "ไม่รับรอง" ออก ถ้ามีผู้สมัครแข่งขันกันหลายคน
        // ----------------------------------------------------
        const totalParties = rawCandidates.filter(c => parseInt(c.number) > 0).length;
        if (totalParties > 1) {
          // ถ้ามีพรรคมากกว่า 1 พรรค ให้ลบ "ไม่รับรอง (เบอร์ -1)" ทิ้งไปเลย
          // เหลือแค่ "งดออกเสียง (เบอร์ 0)"
          rawCandidates = rawCandidates.filter(c => parseInt(c.number) !== -1);
        }

        // ----------------------------------------------------
        // 2️⃣ จัดลำดับ (Sorting) ตามสถานะความต้องการ
        // ----------------------------------------------------
        const sorted = rawCandidates.sort((a, b) => {
          // A. ถ้าจบแล้ว หรือสั่งโชว์ผล -> ให้เรียงตาม "คะแนน" เป็นหลัก (มากไปน้อย)
          if (data.status === "ENDED" || data.isRevealed) {
            const scoreDiff = b.score - a.score;
            if (scoreDiff !== 0) return scoreDiff;
          }

          // B. ถ้าเป็นช่วงรอ/ยังไม่โชว์คะแนน หรือคะแนนเท่ากัน -> เรียงตามลำดับ "บัตรเลือกตั้ง"
          const numA = parseInt(a.number);
          const numB = parseInt(b.number);

          // - เอาพรรค (เบอร์ > 0) ขึ้นก่อนกลุ่มพิเศษ (0, -1)
          const isPartyA = numA > 0;
          const isPartyB = numB > 0;
          if (isPartyA && !isPartyB) return -1;
          if (!isPartyA && isPartyB) return 1;

          // - ถ้าในกลุ่มพรรคด้วยกัน: เรียงเบอร์ 1, 2, 3
          if (isPartyA) return numA - numB;

          // - ถ้าในกลุ่มพิเศษ: เอา 0 (งดออกเสียง) ขึ้นก่อน -1 (ไม่รับรอง)
          return numB - numA;
        });

        setCandidates(sorted);
      }

      if (data.stats) {
        const allowedYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
        const sortedByYear = data.stats.byYear
          ? data.stats.byYear
            .filter(item => allowedYears.includes(item.name.trim()))
            .sort((a, b) => allowedYears.indexOf(a.name.trim()) - allowedYears.indexOf(b.name.trim()))
          : [];

        const genderOrder = ['ชาย', 'หญิง'];
        const sortedByGender = data.stats.byGender ? [...data.stats.byGender].sort((a, b) => {
          return genderOrder.indexOf(a.name) - genderOrder.indexOf(b.name);
        }) : [];

        setDemographics({
          ...data.stats,
          byYear: sortedByYear,
          byGender: sortedByGender
        });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchResults();
    const now = new Date();
    const isEnded = now >= ELECTION_CONFIG.ELECTION_END;

    if (!isEnded) {
      const interval = setInterval(fetchResults, 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // ==========================================
  // 🕒 3. TIME CONFIGURATION (คงเดิม)
  // ==========================================
  const { ELECTION_START, ELECTION_END } = ELECTION_CONFIG;
  const now = currentTime;
  let electionStatus = "WAITING";
  let targetDate = ELECTION_START;

  if (now < ELECTION_START) {
    electionStatus = "WAITING";
    targetDate = ELECTION_START;
  } else if (now >= ELECTION_START && now < ELECTION_END) {
    electionStatus = "ONGOING";
    targetDate = ELECTION_END;
  } else {
    electionStatus = "ENDED";
  }

  const finalStatus = serverStatus !== "WAITING" ? serverStatus : electionStatus;

  // ✅ MANUAL OVERRIDE TIMER:
  // ถ้า Status จาก Server บอกว่า ONGOING (เปิด Manual)
  // ให้ปรับ TargetDate เป็นวันปิดรับคะแนนทันที (นับถอยหลังสู่การปิด)
  if (finalStatus === "ONGOING") {
    electionStatus = "ONGOING";
    targetDate = ELECTION_END;
  }

  const timeDiff = targetDate - now;
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
  const seconds = Math.floor((timeDiff / 1000) % 60);

  let countdownText = "";
  if (days > 0) countdownText = `${days} วัน ${hours} ชม. ${minutes} น.`;
  else if (hours > 0) countdownText = `${hours} ชม. ${minutes} น. ${seconds} วิ.`;
  else countdownText = `${minutes} น. ${seconds} วิ.`;

  const campaignDateString = campaignDate ? campaignDate.toLocaleDateString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : "เร็วๆ นี้";

  const isNotStarted = finalStatus === "WAITING" || finalStatus === "PRE_CAMPAIGN";

  // ✅ 4. Loading UI (คงความ Responsive เดิม)
  if (loading && finalStatus !== "ENDED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-[#8A2680] animate-spin mb-4" />
        <p className="text-slate-500 font-medium">กำลังตรวจสอบสิทธิ์เข้าถึง...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-100 overflow-x-hidden relative">
      <Navbar />

      <div className="fixed inset-0 z-0 opacity-[0.3] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(to right, #e5e7eb 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {selectedParty && (
        <PartyDetailModal
          party={selectedParty}
          onClose={() => setSelectedParty(null)}
        />
      )}

      {/* ✅ 5. Main Content (ครอบด้วย isAuthorized เพื่อกันการ Flash ของข้อมูล) */}
      <main className={`flex-1 relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-32 md:py-10 transition-all duration-700 ${!isAuthorized ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>

        {isAuthorized && (
          <>
            {/* Header (จากโค้ดเดิมของคุณ) */}
            <div className="text-center mb-8 lg:mb-16 mt-4 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A2680]/5 text-[#8A2680] text-[10px] md:text-xs font-bold mb-3 md:mb-4 border border-[#8A2680]/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8A2680]"></span>
                </span>
                {finalStatus === "ENDED" ? "FINAL RESULT" : "REAL-TIME UPDATE"}
              </div>
              <h1 className="text-2xl md:text-5xl font-black text-[#8A2680] mb-2 md:mb-3 tracking-tight">
                ผลการเลือกตั้ง SAMO 49
              </h1>
              <p className="text-slate-500 text-xs md:text-base max-w-2xl mx-auto px-4">
                ระบบเลือกตั้งสโมสรนักศึกษา คณะวิทยาการจัดการ ประจำปีการศึกษา 2569
              </p>
            </div>

            {/* Stats Bar (จากโค้ดเดิมของคุณ) */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-8 lg:mb-12">
              <div className="col-span-2 lg:col-span-1 bg-white/90 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-[#8A2680]/20 shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1.5 bg-[#8A2680]"></div>
                <div>
                  <p className="text-xs font-bold text-[#8A2680] uppercase tracking-wider mb-1">คะแนนเสียงรวม</p>
                  <p className="text-3xl lg:text-5xl font-black text-[#8A2680]">
                    {isNotStarted ? "-" : totalVotes.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#8A2680]/10 p-2 lg:p-4 rounded-xl text-[#8A2680]"><Activity className="w-6 h-6 lg:w-8 lg:h-8" /></div>
              </div>

              <div className="col-span-1 bg-white/80 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ผู้มีสิทธิ์</p>
                  <p className="text-xl lg:text-3xl font-black text-slate-700">{demographics.totalEligible.toLocaleString()}</p>
                </div>
                <div className="bg-slate-100 p-2 lg:p-4 rounded-xl text-slate-400 hidden lg:block"><Users className="w-6 h-6 lg:w-8 lg:h-8" /></div>
              </div>

              <div className="col-span-1 bg-white/80 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-green-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] lg:text-xs font-bold text-green-600 uppercase tracking-wider mb-1">ร้อยละ</p>
                  <p className="text-xl lg:text-3xl font-black text-green-600">
                    {!isNotStarted && demographics.totalEligible > 0
                      ? ((totalVotes / demographics.totalEligible) * 100).toFixed(2) + "%"
                      : "- %"
                    }
                  </p>
                </div>
                <div className="bg-green-50 p-2 lg:p-4 rounded-xl text-green-600 hidden lg:block"><PieIcon className="w-6 h-6 lg:w-8 lg:h-8" /></div>
              </div>
            </div>

            {/* Candidates Section (จากโค้ดเดิมของคุณ) */}
            <div className="mb-8 lg:mb-12">
              <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-lg lg:text-2xl font-bold text-slate-700 flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                  {finalStatus === "ENDED" ? (
                    isRevealed ? (
                      <><Trophy className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-500" /> สรุปผลการเลือกตั้ง (Official Results)</>
                    ) : (
                      <div className="flex items-center gap-2 text-[#8A2680] font-bold">
                        <div className="relative flex h-3 w-3 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8A2680]"></span>
                        </div>
                        <span className="text-[13px] sm:text-lg lg:text-xl whitespace-nowrap">
                          กำลังนับคะเเนนเสียงชาว FMS
                        </span>
                      </div>
                    )
                  ) : finalStatus === "ONGOING" ? (
                    <div className="flex items-center gap-2 text-[#8A2680] font-bold">
                      <div className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8A2680]"></span>
                      </div>
                      <span className="text-[13px] sm:text-lg lg:text-xl whitespace-nowrap">
                        {isRevealed ? "📊 สรุปผลคะแนนปัจจุบัน (Real-time Results)" : "ขณะนี้กำลังนับคะแนนเสียงชาว FMS"}
                      </span>
                    </div>
                  ) : (
                    <><span className="text-slate-400 text-2xl">⏳</span> ยังไม่เปิดรับลงคะแนน (Upcoming Election)</>
                  )}
                </h2>

                {!isNotStarted && finalStatus !== "ENDED" && (
                  <div className="flex items-center gap-2 text-xs lg:text-base font-bold px-4 py-2 rounded-full border shadow-sm bg-slate-100 text-slate-600 border-slate-200">
                    <span>{electionStatus === "WAITING" ? "⏳ เริ่มใน:" : "🔴 ปิดใน:"}</span>
                    <span className="font-mono text-[#8A2680] text-sm lg:text-lg">{mounted ? countdownText : "..."}</span>
                  </div>
                )}
              </div>

              {finalStatus === "PRE_CAMPAIGN" ? (
                <div className="flex flex-col items-center justify-center py-20 lg:py-32 bg-white/50 border border-dashed border-slate-300 rounded-[2rem] text-center px-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-purple-100 animate-bounce-gentle">
                    <Megaphone className="w-10 h-10 lg:w-12 lg:h-12 text-[#8A2680]" />
                  </div>
                  <h3 className="text-xl lg:text-3xl font-black text-slate-700 mb-2">ยังไม่เปิดเผยรายชื่อผู้สมัคร</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm lg:text-base"> ข้อมูลผู้สมัครจะเปิดเผยอย่างเป็นทางการในช่วงหาเสียงเลือกตั้ง <br className="hidden md:block" /> (ประมาณ 2 สัปดาห์ก่อนวันเลือกตั้งจริง) </p>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-xs lg:text-sm font-bold text-slate-600">
                    <Calendar size={16} className="text-[#8A2680]" />
                    <span>เปิดเผยข้อมูล: {campaignDateString}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-3 lg:gap-6 bg-white sm:bg-transparent rounded-2xl overflow-hidden sm:overflow-visible border sm:border-0 border-slate-100 shadow-sm sm:shadow-none">
                  {candidates.map((candidate, index) => (
                    <ResultCard
                      key={candidate.id}
                      candidate={candidate}
                      rank={index + 1}
                      totalVotes={totalVotes}
                      status={finalStatus}
                      isRevealed={isRevealed} // ✅ ส่งสถานะเปิดเผยไปที่การ์ด
                      onClick={() => setSelectedParty(candidate)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Charts Section (จากโค้ดเดิมของคุณ) */}
            {(finalStatus === "ENDED" || isRevealed) ? (
              isRevealed ? (
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8 animate-fade-in-up">
                  <div className="order-2 lg:order-1 bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4 lg:mb-8"><div className="bg-purple-100 p-2 rounded-lg"><BarChart3 className="w-5 h-5 text-[#8A2680]" /></div><h3 className="text-base lg:text-xl font-bold text-slate-700">แยกตามสาขา</h3></div>
                    <div className="h-[400px] lg:h-[600px] w-full text-xs font-medium">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographics.byMajor} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={50} tick={{ fontSize: isMobile ? 11 : 14, fill: '#64748b' }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                          <Bar dataKey="value" fill={COLORS_BAR} radius={[0, 4, 4, 0]} barSize={isMobile ? 24 : 40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="order-1 lg:order-2 grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-8 h-full">
                    <div className="col-span-1 bg-white p-3 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2 lg:mb-6"><div className="bg-yellow-100 p-1.5 lg:p-2 rounded-lg"><Medal className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" /></div><h3 className="text-sm lg:text-xl font-bold text-slate-700">ชั้นปี</h3></div>
                      <div className="h-[160px] lg:h-[250px] w-full text-xs font-medium">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={demographics.byYear} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: isMobile ? 10 : 14 }} interval={0} />
                            <YAxis hide /><Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={isMobile ? 24 : 50} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="col-span-1 bg-white p-3 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2 lg:mb-6"><div className="bg-blue-100 p-1.5 lg:p-2 rounded-lg"><PieIcon className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" /></div><h3 className="text-sm lg:text-xl font-bold text-slate-700">เพศ</h3></div>
                      <div className="h-[160px] lg:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={demographics.byGender} cx="50%" cy="50%" innerRadius={isMobile ? 30 : 60} outerRadius={isMobile ? 50 : 90} paddingAngle={5} dataKey="value" stroke="none">
                              {demographics.byGender.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />))}
                            </Pie>
                            <Tooltip /><Legend verticalAlign={isMobile ? "bottom" : "middle"} align={isMobile ? "center" : "right"} layout={isMobile ? "horizontal" : "vertical"} iconType="circle" wrapperStyle={{ fontSize: isMobile ? '10px' : '14px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 lg:py-32 bg-white/50 border border-dashed border-slate-300 rounded-[2rem] text-center px-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100 animate-pulse">
                    <Activity className="w-10 h-10 lg:w-12 lg:h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl lg:text-3xl font-black text-slate-700 mb-2">กำลังนับคะเเนนเสียงชาว FMS</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm lg:text-base">
                    กรุณารอประกาศผลอย่างเป็นทางการ <br className="hidden md:block" />
                    จากคณะกรรมการการเลือกตั้ง
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-16 bg-white/50 border border-dashed border-slate-300 rounded-3xl">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><BarChart3 className="text-slate-400" size={32} /></div>
                <h3 className="text-lg font-bold text-slate-600">สถิติยังไม่เปิดเผย</h3>
                <p className="text-slate-400 text-sm">ข้อมูลสถิติจะแสดงหลังจากปิดหีบเลือกตั้งแล้วเท่านั้น</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* ✅ 6. ACCESS DENIED MODAL (Logic ตัวดักหน้าช่วงเลือกตั้ง) */}
      {showAccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"></div>
          <div className="relative bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-300 text-center">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-purple-50/50">
              <Lock className="w-10 h-10 text-[#8A2680]" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">ข้อมูลถูกล็อกไว้</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              ในช่วงการลงคะแนนเสียง <br />
              คุณต้อง **{modalType === "VOTE" ? "ลงคะแนนเลือกตั้ง" : "ทำแบบประเมิน"}** ให้เสร็จก่อน <br />
              ถึงจะสามารถเข้าดูสถิติและผลคะแนนได้
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(modalType === "VOTE" ? "/vote" : "/success")}
                className="w-full py-4 bg-[#8A2680] hover:bg-[#701e68] text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 group"
              >
                {modalType === "VOTE" ? "ไปหน้าลงคะแนน" : "ไปทำแบบประเมิน"}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button
                onClick={() => router.replace("/")}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} /> กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAINTENANCE MODAL */}
      {showAccessModal && modalType === "MAINTENANCE" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"></div>
          <div className="relative bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl text-center border border-slate-100">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-orange-100/50">
              <Activity className="w-12 h-12 text-orange-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">ระบบปิดปรับปรุง</h2>
            <p className="text-slate-500 mb-10 leading-relaxed text-lg">
              ขออภัยในความไม่สะดวก <br />
              ขณะนี้ระบบปิดรับลงคะแนนชั่วคราว <br />
              เพื่อตรวจสอบข้อมูลหรือปรับปรุงระบบ
            </p>
            <button
              onClick={() => router.replace("/")}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Home size={22} /> กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}

      <footer className="mt-8 lg:mt-16 text-center py-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
        <p className="text-slate-400 text-sm">© FMS@PSU 2026. All Rights Reserved.</p>
      </footer>
    </div>
  );
}