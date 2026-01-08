"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import ResultCard from "../../components/ResultCard";
import PartyDetailModal from "../../components/PartyDetailModal";

import { Users, Trophy, PieChart as PieIcon, BarChart3, Medal, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function ResultsPage() {
  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [demographics, setDemographics] = useState({
    totalEligible: 0,
    byMajor: [],
    byYear: [],
    byGender: []
  });
  const [loading, setLoading] = useState(true);

  // State นาฬิกา & Hydration fix
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // State สำหรับเช็คขนาดหน้าจอ
  const [isMobile, setIsMobile] = useState(false);

  // ✅ 2. เพิ่ม State สำหรับ Modal (เก็บข้อมูลพรรคที่ถูกกดเลือก)
  const [selectedParty, setSelectedParty] = useState(null);

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

      if (data.candidates) {
        const sortedCandidates = data.candidates.sort((a, b) => b.score - a.score);
        setCandidates(sortedCandidates);
        setTotalVotes(data.candidates.reduce((acc, curr) => acc + curr.score, 0));
      }

      if (data.stats) {
        const yearOrder = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'อื่นๆ'];
        const sortedByYear = data.stats.byYear ? [...data.stats.byYear].sort((a, b) => {
          const indexA = yearOrder.indexOf(a.name);
          const indexB = yearOrder.indexOf(b.name);
          return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        }) : [];

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  const ELECTION_START = new Date(2024, 1, 6, 8, 0, 0);
  const ELECTION_END = new Date(2024, 1, 6, 16, 0, 0);
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

  const IS_ELECTION_ENDED = (electionStatus === "ENDED");
  const timeDiff = targetDate - now;
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
  const seconds = Math.floor((timeDiff / 1000) % 60);

  let countdownText = "";
  if (days > 0) countdownText = `${days} วัน ${hours} ชม. ${minutes} น.`;
  else if (hours > 0) countdownText = `${hours} ชม. ${minutes} น. ${seconds} วิ.`;
  else countdownText = `${minutes} น. ${seconds} วิ.`;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-100 overflow-x-hidden">
      <Navbar />

      <div className="fixed inset-0 z-0 opacity-[0.3] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(to right, #e5e7eb 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* ✅ 3. วาง Modal ไว้ตรงนี้ (มันจะแสดงเมื่อ selectedParty มีค่า) */}
      {selectedParty && (
        <PartyDetailModal
          party={selectedParty}
          onClose={() => setSelectedParty(null)}
        />
      )}

      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-32 md:py-10">

        {/* Header */}
        <div className="text-center mb-8 lg:mb-16 mt-4 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A2680]/5 text-[#8A2680] text-[10px] md:text-xs font-bold mb-3 md:mb-4 border border-[#8A2680]/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8A2680]"></span>
            </span>
            REAL-TIME UPDATE
          </div>
          <h1 className="text-2xl md:text-5xl font-black text-[#8A2680] mb-2 md:mb-3 tracking-tight">
            ผลการเลือกตั้ง SAMO 49
          </h1>
          <p className="text-slate-500 text-xs md:text-base max-w-2xl mx-auto px-4">
            ระบบเลือกตั้งสโมสรนักศึกษา คณะวิทยาการจัดการ
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-8 lg:mb-12">
          {/* คะแนนรวม */}
          <div className="col-span-2 lg:col-span-1 bg-white/90 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-[#8A2680]/20 shadow-sm flex items-center justify-between relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-[#8A2680]"></div>
            <div>
              <p className="text-xs font-bold text-[#8A2680] uppercase tracking-wider mb-1">คะแนนเสียงรวม</p>
              <p className="text-3xl lg:text-5xl font-black text-[#8A2680]">{totalVotes.toLocaleString()}</p>
            </div>
            <div className="bg-[#8A2680]/10 p-2 lg:p-4 rounded-xl text-[#8A2680]"><Activity className="w-6 h-6 lg:w-8 lg:h-8" /></div>
          </div>

          {/* ผู้มีสิทธิ์ */}
          <div className="col-span-1 bg-white/80 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ผู้มีสิทธิ์</p>
              <p className="text-xl lg:text-3xl font-black text-slate-700">{demographics.totalEligible.toLocaleString()}</p>
            </div>
            <div className="bg-slate-100 p-2 lg:p-4 rounded-xl text-slate-400 hidden lg:block"><Users className="w-6 h-6 lg:w-8 lg:h-8" /></div>
          </div>

          {/* ร้อยละ */}
          <div className="col-span-1 bg-white/80 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-green-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] lg:text-xs font-bold text-green-600 uppercase tracking-wider mb-1">ร้อยละ</p>
              <p className="text-xl lg:text-3xl font-black text-green-600">{demographics.totalEligible > 0 ? ((totalVotes / demographics.totalEligible) * 100).toFixed(2) : 0}%</p>
            </div>
            <div className="bg-green-50 p-2 lg:p-4 rounded-xl text-green-600 hidden lg:block"><PieIcon className="w-6 h-6 lg:w-8 lg:h-8" /></div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-8 lg:mb-12">
          <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4">
            <h2 className="text-lg lg:text-2xl font-bold text-slate-700 flex flex-wrap items-center gap-2 justify-center lg:justify-start">
              {electionStatus === "ENDED" ? (
                <><Trophy className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-500" /> สรุปผลการเลือกตั้ง (Official Results)</>
              ) : (
                <><div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> กำลังเปิดรับลงคะแนน (Voting in Progress)</>
              )}
            </h2>
            {electionStatus !== "ENDED" && (
              <div className="flex items-center gap-2 text-xs lg:text-base font-bold px-4 py-2 rounded-full border shadow-sm bg-slate-100 text-slate-600 border-slate-200">
                <span>{electionStatus === "WAITING" ? "⏳ เริ่มใน:" : "🔴 ปิดใน:"}</span>
                <span className="font-mono text-[#8A2680] text-sm lg:text-lg">{mounted ? countdownText : "..."}</span>
              </div>
            )}
          </div>

          {/* Candidates */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"><p className="text-slate-400">Loading...</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-3 lg:gap-6 bg-white sm:bg-transparent rounded-2xl overflow-hidden sm:overflow-visible border sm:border-0 border-slate-100 shadow-sm sm:shadow-none">
              {candidates.map((candidate, index) => {
                return (
                  <ResultCard
                    key={candidate.id}
                    candidate={candidate}
                    rank={index + 1}
                    totalVotes={totalVotes}
                    isElectionEnded={IS_ELECTION_ENDED} // ส่ง status ไปเพื่อโชว์ถ้วยรางวัล
                    onClick={() => setSelectedParty(candidate)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* === Section 3: กราฟสถิติ === */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8">

          <div className="order-1 lg:order-2 grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-8 h-full">

            {/* กราฟชั้นปี */}
            <div className="col-span-1 bg-white p-3 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 lg:mb-6">
                <div className="bg-yellow-100 p-1.5 lg:p-2 rounded-lg"><Medal className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" /></div>
                <h3 className="text-sm lg:text-xl font-bold text-slate-700">ชั้นปี</h3>
              </div>
              <div className="h-[160px] lg:h-[250px] w-full text-xs font-medium">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographics.byYear} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: isMobile ? 10 : 14 }}
                      interval={0}
                    />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={isMobile ? 24 : 50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* กราฟเพศ */}
            <div className="col-span-1 bg-white p-3 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 lg:mb-6">
                <div className="bg-blue-100 p-1.5 lg:p-2 rounded-lg"><PieIcon className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" /></div>
                <h3 className="text-sm lg:text-xl font-bold text-slate-700">เพศ</h3>
              </div>
              <div className="h-[160px] lg:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographics.byGender}
                      cx="50%" cy="50%"
                      innerRadius={isMobile ? 30 : 60}
                      outerRadius={isMobile ? 50 : 90}
                      paddingAngle={5}
                      dataKey="value" stroke="none"
                    >
                      {demographics.byGender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Legend
                      verticalAlign={isMobile ? "bottom" : "middle"}
                      align={isMobile ? "center" : "right"}
                      layout={isMobile ? "horizontal" : "vertical"}
                      iconType="circle"
                      wrapperStyle={{ fontSize: isMobile ? '10px' : '14px', paddingTop: isMobile ? '0px' : '0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* กราฟสาขา (ด้านล่างสุด) */}
          <div className="order-2 lg:order-1 bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4 lg:mb-8">
              <div className="bg-purple-100 p-2 rounded-lg"><BarChart3 className="w-5 h-5 text-[#8A2680]" /></div>
              <h3 className="text-base lg:text-xl font-bold text-slate-700">แยกตามสาขา</h3>
            </div>
            <div className="h-[400px] lg:h-[600px] w-full text-xs font-medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={demographics.byMajor}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={50}
                    tick={{ fontSize: isMobile ? 11 : 14, fill: '#64748b' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar
                    dataKey="value"
                    fill={COLORS_BAR}
                    radius={[0, 4, 4, 0]}
                    barSize={isMobile ? 24 : 40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </main>

      <footer className="mt-8 lg:mt-16 text-center py-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
        <p className="text-slate-400 text-sm">© FMS@PSU 2026. All Rights Reserved.</p>
      </footer>
    </div>
  );
}