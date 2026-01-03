"use client"; // ✅ 1. เพิ่มบรรทัดนี้เพื่อให้ใช้ localStorage ได้

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import CountdownTimer from '../components/CountdownTimer';
// import { PrismaClient } from "@prisma/client"; // ❌ ลบออก เพราะ Client Component ใช้ Prisma ไม่ได้
import { LogIn, Vote, BarChart3, User, PieChart, ArrowRight } from "lucide-react";

export default function Home() {
  // ✅ 2. สร้าง State สำหรับเก็บข้อมูลและ User
  const [stats, setStats] = useState({ totalEligible: 0, totalVoted: 0, percentage: "0.00" });
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

// ✅ 3. ใช้ useEffect ดึงข้อมูลเมื่อหน้าเว็บโหลด
  useEffect(() => {
    setMounted(true);

    // 3.1 เช็ค User ในเครื่อง (Local Storage)
    const storedUser = localStorage.getItem("currentUser");
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // ------------------------------------------------------------------
      // ✅ [เพิ่มส่วนนี้] ยิง API เช็คสถานะโหวตล่าสุด (Auto Sync)
      // เพื่อแก้ปัญหา Database เปลี่ยนค่าแล้ว แต่ Browser ยังจำค่าเดิม
      // ------------------------------------------------------------------
      fetch('/api/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: parsedUser.studentId })
      })
      .then(res => res.json())
      .then(data => {
        // ถ้าสถานะใน Server (data.isVoted) ไม่ตรงกับในเครื่อง (parsedUser.isVoted)
        // ให้ยึดตาม Server เป็นหลัก
        if (data.isVoted !== undefined && data.isVoted !== parsedUser.isVoted) {
          console.log("Auto Sync: Update status to", data.isVoted);
          
          const updatedUser = { ...parsedUser, isVoted: data.isVoted };
          setUser(updatedUser); // อัปเดตหน้าจอทันที
          localStorage.setItem("currentUser", JSON.stringify(updatedUser)); // อัปเดตความจำเครื่อง
        }
      })
      .catch(err => console.error("Auto Sync error:", err));
    }

    // 3.2 ดึงสถิติเลือกตั้งจาก API (ส่วนที่คุณแก้มาแล้ว)
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/results');
        const data = await res.json();

        // 1. คำนวณยอดคนโหวต (Total Voted)
        let calculatedTotalVoted = 0;
        if (data.candidates) {
            calculatedTotalVoted = data.candidates.reduce((acc, curr) => acc + curr.score, 0);
        }

        // 2. ดึงยอดผู้มีสิทธิ์ (Total Eligible)
        const eligible = data.stats?.totalEligible || 0;

        // 3. คำนวณเปอร์เซ็นต์ (Percentage)
        const calculatedPercent = eligible > 0 
            ? ((calculatedTotalVoted / eligible) * 100).toFixed(2) 
            : "0.00";

        // 4. เซ็ตค่าเข้า State
        setStats({
            totalEligible: eligible,
            totalVoted: calculatedTotalVoted,
            percentage: calculatedPercent
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats({ totalEligible: 0, totalVoted: 0, percentage: "0.00" });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans selection:bg-purple-300 relative overflow-hidden">

      {/* ================= BACKGROUND ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[150px] h-[150px] blur-[60px] bg-purple-300/10 md:w-[500px] md:h-[500px] md:blur-[100px] md:bg-purple-200/30 rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[150px] h-[150px] blur-[60px] bg-blue-200/10 md:w-[500px] md:h-[500px] md:blur-[100px] md:bg-blue-100/40 rounded-full mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(255,255,255,0.8)_100%)]"></div>
      </div>

      <div className="hidden lg:flex fixed top-0 right-1 h-full items-center justify-end z-0 pointer-events-none select-none overflow-hidden">
        <span className="text-[17em] font-black text-gray-900 opacity-5 leading-none tracking-tighter transform rotate-90 translate-x-[20%] whitespace-nowrap">2026</span>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 flex flex-col flex-grow">

        <Navbar />

        <main className="flex-grow flex flex-col justify-center py-10 px-4 md:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">

              {/* ===== ฝั่งซ้าย ===== */}
              <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">

                {/* Badge */}
                <div className="flex justify-center md:justify-start w-full mb-6">
                  <div className="relative group inline-flex justify-center items-center cursor-pointer animate-heartbeat hover:animate-none">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
                    <div className="relative flex items-center gap-3 px-6 py-2 rounded-full bg-white border border-gray-100 shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Your Vote Matters</span>
                    </div>
                  </div>
                </div>

                {/* Title Section */}
                <div className="mt-2 lg:-mt-20">
                  <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-slate-800 leading-tight">
                    SAMO
                    <span className="inline-block text-[#8A2680] ml-3 py-2 pr-2">
                      49
                    </span>
                  </h1>
                  <div className="mt-2 border-l-4 border-[#8A2680] pl-4 ml-2 md:ml-1">
                    <p className="text-xl md:text-2xl font-bold text-slate-500 tracking-[0.3em] uppercase">
                      FMS Election 2026
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6 space-y-2">
                  <h2 className="text-xl md:text-3xl font-bold text-gray-800">
                    โครงการเลือกตั้งคณะกรรมการบริหาร
                  </h2>
                  <h2 className="text-lg md:text-2xl font-medium text-gray-500">
                    สโมสรนักศึกษาคณะวิทยาการจัดการ
                  </h2>
                  <div className="inline-block bg-purple-50 px-3 py-1 rounded text-purple-700 font-bold text-sm mt-2 border border-purple-100">
                    ประจำปีการศึกษา 2569
                  </div>
                </div>

                {/* ✅ Buttons: ส่วนที่แก้ไข Logic ปุ่ม */}
                <div className="flex flex-col items-center lg:items-start gap-6 mt-8">
                  
                  {mounted && user ? (
                    // 🟢 กรณี Login แล้ว
                    <Link href={user.isVoted ? "/results" : "/vote"} className="w-full sm:w-auto">
                      <button className={`
                        w-full sm:w-auto group relative overflow-hidden rounded-xl text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                        ${user.isVoted 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-600/20 hover:shadow-blue-600/30' // สีฟ้า (ดูผล)
                          : 'bg-[#8A2680] shadow-purple-600/20 hover:shadow-purple-600/30' // สีม่วง (ไปโหวต)
                        }
                      `}>
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 skew-x-12"></div>
                        <span className="relative flex items-center justify-center gap-3 py-4 px-8 font-bold text-lg">
                          {user.isVoted ? (
                            <>ดูผลคะแนน (Results) <BarChart3 className="w-5 h-5" /></>
                          ) : (
                            <>Vote Now <Vote className="w-5 h-5 animate-pulse" /></>
                          )}
                        </span>
                      </button>
                    </Link>
                  ) : (
                    // ⚫ กรณี Guest (ยังไม่ Login)
                    <Link href="/login" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto group relative overflow-hidden rounded-xl bg-gray-900 text-white shadow-lg shadow-gray-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/30">
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 skew-x-12"></div>
                        <span className="relative flex items-center justify-center gap-3 py-4 px-8 font-bold text-lg">
                          เข้าสู่ระบบ / Sign In
                          <LogIn className="w-5 h-5" />
                        </span>
                      </button>
                    </Link>
                  )}

                  <div className="w-full sm:w-auto">
                    <CountdownTimer />
                  </div>
                </div>
              </div>

              {/* ===== ฝั่งขวา (รูป & สถิติ) ===== */}
              <div className="relative flex flex-col-reverse lg:flex-col items-center w-full max-w-lg mx-auto mt-4 lg:mt-0 gap-6">

                {/* Image Card */}
                <div className="relative w-full bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden p-8 group hover:border-purple-100 transition-colors duration-300">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-50 to-blue-50 rounded-bl-[100%] -z-10"></div>
                  <div className="aspect-[4/3] relative flex items-center justify-center">
                    <Image
                      src="/images/prob/decorate.png"
                      alt="Voting Illustration"
                      width={600}
                      height={450}
                      className="object-contain drop-shadow-lg transform group-hover:scale-105 transition duration-500"
                      priority
                    />
                  </div>
                </div>

                {/* Stats Card */}
                <div className="w-full relative">
                  <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200 py-5 px-6 grid grid-cols-3 divide-x divide-gray-100 text-center relative z-10">

                    {/* User */}
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                        <User className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">ผู้มีสิทธิ</span>
                      </div>
                      <span className="text-3xl font-black text-gray-800">
                        {stats.totalEligible.toLocaleString()}
                      </span>
                    </div>

                    {/* Voted */}
                    <div className="flex flex-col items-center justify-center gap-1 relative">
                      <div className="absolute inset-0 bg-purple-50/50 -z-10 rounded-lg scale-y-110 scale-x-90"></div>
                      <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider">ใช้สิทธิแล้ว</span>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      </div>
                      <span className="text-3xl font-black text-[#8A2680]">
                        {stats.totalVoted.toLocaleString()}
                      </span>
                    </div>

                    {/* Percent */}
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                        <PieChart className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">ร้อยละ</span>
                      </div>
                      <div className="flex items-baseline justify-center">
                        <span className="text-3xl font-black text-gray-800">
                          {stats.percentage}
                        </span>
                        <span className="text-sm font-bold text-gray-400 ml-1">%</span>
                      </div>
                    </div>

                  </div>
                  <div className="absolute -bottom-2 left-4 right-4 h-4 bg-gray-200/50 rounded-b-[1.5rem] -z-10 mx-4"></div>
                </div>

              </div>

            </div>
          </div>
        </main>

        <footer className="w-full py-4 bg-white border-t border-gray-100 text-center relative z-50">
          <p className="text-xs text-gray-400 font-medium">© FMS@PSU 2026. All Rights Reserved.</p>
        </footer>

      </div>
    </div>
  );
}