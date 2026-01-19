"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ เพิ่ม useSearchParams เพื่อดัก Error จาก URL
import { signIn, useSession } from "next-auth/react";
import Navbar from "../../components/Navbar";
import { Loader2, AlertCircle, LogIn, ShieldCheck } from "lucide-react"; 

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ดึงค่าจาก URL
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ เช็ค Error ที่เด้งกลับมาจาก NextAuth (เช่น กด Cancel หรือ Login ไม่ผ่าน)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError("การยืนยันตัวตนล้มเหลว หรือถูกยกเลิก");
    }
  }, [searchParams]);

  // ✅ ถ้า Login อยู่แล้ว ให้เด้งไปหน้าอื่น
  useEffect(() => {
    if (status === "authenticated" && session) {
      if (session.user.isVoted) {
        router.replace("/results");
      } else {
        router.replace("/vote");
      }
    }
  }, [status, session, router]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // ✅ เรียกใช้ Provider "authentik" ตามที่เราตั้งใน auth.js
      await signIn("authentik", { 
        callbackUrl: "/" // Login เสร็จให้กลับมาหน้าแรก
      });
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
         <Loader2 className="w-10 h-10 text-[#8A2680] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      
      <div className="relative z-50 bg-white shadow-sm">
        <Navbar />
      </div>

      <div className="flex-grow relative flex items-center justify-center w-full overflow-hidden">

        <div className="absolute inset-0 z-0 opacity-[0.5] pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(to right, #e5e7eb 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }}>
        </div>

        <main className="relative z-20 w-full px-4 flex justify-center py-10">
            
            <div className="bg-white/95 backdrop-blur-md w-full max-w-[340px] md:max-w-[400px] 
                            p-6 md:p-10 
                            rounded-[1.5rem] md:rounded-[2rem] 
                            shadow-2xl shadow-slate-300/50 border border-white/60 animate-fade-in-up text-center">

              <div className="mb-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-[#003087]">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                
                <div className="inline-block px-3 py-1 bg-blue-50 text-[#003087] text-[10px] font-bold tracking-widest uppercase rounded-full mb-3">
                  PSU Authentication
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-[#003087] tracking-tight mb-2">PSU PASSPORT</h1>
                <p className="text-slate-500 text-sm font-medium">
                    ระบบยืนยันตัวตนสำหรับนักศึกษา<br/>มหาวิทยาลัยสงขลานครินทร์
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-4 bg-red-50 text-red-600 text-[13px] p-3 rounded-xl border border-red-100 flex items-center justify-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#003087] hover:bg-[#002466] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/10 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 text-sm md:text-base group"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    กำลังเชื่อมต่อระบบ...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    เข้าสู่ระบบด้วย PSU Passport
                  </>
                )}
              </button>

              <p className="mt-4 text-[11px] text-slate-400">
                ระบบจะนำท่านไปยังหน้ายืนยันตัวตนของมหาวิทยาลัย
              </p>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
                 <button 
                   onClick={() => router.push("/")}
                   className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-xs hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all active:scale-[0.98] flex justify-center items-center gap-2 group"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                   กลับหน้าหลัก
                 </button>

                 <div className="flex justify-center">
                    <button
                        onClick={() => router.push("/admin")}
                        className="text-[10px] tracking-[0.15em] font-bold text-slate-300 hover:text-[#8A2680] transition-colors uppercase py-1 select-none"
                    >
                        FMS ELECTION SYSTEM
                    </button>
                 </div>
              </div>

            </div>
        </main>

      </div>

      {/* Footer */}
      <footer className="relative z-50 shrink-0 w-full py-4 bg-white/50 backdrop-blur-sm border-t border-slate-100 text-center mt-auto">
        <p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-widest uppercase">© FMS@PSU 2026. All Rights Reserved.</p>
      </footer>
    </div>
  );
}