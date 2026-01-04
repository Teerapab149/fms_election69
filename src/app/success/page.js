"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // ✅ เพิ่ม useRouter
import { Check, Home, BarChart3, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function SuccessPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // ✅ สร้าง State สำหรับนับถอยหลัง (ตั้งไว้ 5 วินาที)
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    setMounted(true);

    // ✅ Logic นับถอยหลัง
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/results'); // 👈 พอครบ 0 วินาที ให้เด้งไปหน้า Results
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup function (กัน Memory Leak ถ้าคนกดออกก่อน)
    return () => clearInterval(timer);
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 font-sans selection:bg-purple-300 relative overflow-hidden p-4">

      {/* Background (เหมือนเดิม) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] blur-[100px] bg-purple-300/20 rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] blur-[100px] bg-blue-200/20 rounded-full mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        
        <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden relative">
          
          <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-10"></div>
            
            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 animate-bounce-gentle">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600 stroke-[4]" />
              </div>
            </div>
            
            <h1 className="text-2xl font-black text-white tracking-tight">บันทึกคะแนนสำเร็จ!</h1>
            <p className="text-emerald-50 font-medium text-sm mt-1 opacity-90">Your vote has been securely recorded.</p>
          </div>

          <div className="p-8 space-y-6">
            
            {/* ... (ส่วนข้อมูลใบเสร็จ เหมือนเดิม) ... */}
            <div className="space-y-4">
               <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                 <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Status</span>
                 <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-md">
                   Completed
                 </span>
               </div>
               {/* ใส่ข้อมูลอื่นๆ ตามเดิมได้เลยครับ */}
            </div>

            {/* ✅ ส่วนแจ้งเตือนนับถอยหลัง */}
            <div className="bg-purple-50/50 rounded-xl p-4 text-center border border-purple-100">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 text-[#8A2680] animate-spin" />
                <p className="text-gray-600 text-sm">
                  กำลังพาไปหน้าสรุปผลใน <span className="font-bold text-[#8A2680] text-lg mx-1">{countdown}</span> วินาที
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link href="/" className="w-full">
                <button className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                  <Home size={18} />
                  หน้าแรก
                </button>
              </Link>
              <Link href="/results" className="w-full">
                <button className="w-full py-3 px-4 rounded-xl bg-[#8A2680] text-white font-bold text-sm shadow-lg hover:bg-[#701e68] transition-all flex items-center justify-center gap-2">
                  <BarChart3 size={18} />
                  ไปทันที
                </button>
              </Link>
            </div>

          </div>
          
          {/* ... (Decoration เหมือนเดิม) ... */}
          <div className="h-4 bg-gray-100 w-full absolute bottom-0 left-0" style={{
             maskImage: 'radial-gradient(circle, transparent 50%, black 50%)',
             maskSize: '20px 20px',
             WebkitMaskImage: 'radial-gradient(circle, transparent 50%, black 50%)',
             WebkitMaskSize: '20px 20px'
           }}></div>
        </div>
      </div>
    </div>
  );
}