"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ เพิ่ม useSearchParams เพื่อดัก Error จาก URL
import { signIn, useSession } from "next-auth/react";
import Navbar from "../../components/Navbar";
import { Loader2, AlertCircle, LogIn, ShieldCheck, FlaskConical } from "lucide-react";
import { getPath } from "../../utils/basePath";
import SiteFooter from "../../components/SiteFooter";
import ThemedLoadingScreen from "../../components/ThemedLoadingScreen";
import { useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import StudioDarkLogin from "../../components/login/StudioDarkLogin";
import VerdureLogin from "../../components/login/VerdureLogin";
import GumroadLogin from "../../components/login/GumroadLogin";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ดึงค่าจาก URL
  const { data: session, status } = useSession();
  const activeTemplateId = useActiveTemplateId();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mock login state — ใช้เฉพาะ dev (NEXT_PUBLIC_ENABLE_MOCK_LOGIN=true)
  const [mockStudentId, setMockStudentId] = useState("");
  const [mockLoading, setMockLoading] = useState(false);

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

  const handleMockLogin = async () => {
    if (!mockStudentId.trim()) return;
    setMockLoading(true);
    setError("");
    try {
      await signIn("mock-login", {
        studentId: mockStudentId.trim(),
        callbackUrl: getPath("/vote")
      });
    } catch (err) {
      console.error(err);
      setError("Mock login ล้มเหลว");
      setMockLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // ✅ เรียกใช้ Provider "authentik" ตามที่เราตั้งใน auth.js
      await signIn("authentik", {
        callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs") + "/vote" // ระบุ path ปลายทางให้ชัดเจน (Default to /fms-ovs)
      });
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <ThemedLoadingScreen text="กำลังตรวจสอบเซสชัน..." />;
  }

  // Theme the login to the active template (studio-dark / gumroad have their own
  // looks; classic is the default below). Logic stays here — the template
  // components are presentational and share these props.
  const templateLoginProps = {
    error,
    loading,
    onLogin: handleLogin,
    showMock: process.env.NEXT_PUBLIC_ENABLE_MOCK_LOGIN === "true",
    mockStudentId,
    setMockStudentId,
    mockLoading,
    onMockLogin: handleMockLogin,
    onBack: () => router.push("/"),
    onAdmin: () => router.push("/admin"),
  };
  if (activeTemplateId?.startsWith("studio-dark")) return <StudioDarkLogin {...templateLoginProps} />;
  if (activeTemplateId?.startsWith("gumroad")) return <GumroadLogin {...templateLoginProps} />;
  if (activeTemplateId?.startsWith("verdure")) return <VerdureLogin {...templateLoginProps} />;

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
                ระบบยืนยันตัวตนสำหรับนักศึกษา<br />มหาวิทยาลัยสงขลานครินทร์
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

            {/* ─── Mock Login — DEV ONLY ─────────────────────────────────────
                แสดงเฉพาะเมื่อ NEXT_PUBLIC_ENABLE_MOCK_LOGIN=true ใน .env.local
                ห้ามใช้ใน production — Provider "mock-login" ไม่ถูก register ใน production
            ─────────────────────────────────────────────────────────────── */}
            {process.env.NEXT_PUBLIC_ENABLE_MOCK_LOGIN === "true" && (
              <div className="mt-6 pt-5 border-t-2 border-dashed border-red-200">
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  <FlaskConical className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-red-500">
                    DEV ONLY — Mock Login
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={mockStudentId}
                    onChange={(e) => setMockStudentId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleMockLogin()}
                    placeholder="e.g. 6610510149"
                    disabled={mockLoading}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all disabled:opacity-60"
                  />
                  <button
                    onClick={handleMockLogin}
                    disabled={mockLoading || !mockStudentId.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm shadow-md shadow-orange-200"
                  >
                    {mockLoading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        กำลังเข้าสู่ระบบ...
                      </>
                    ) : (
                      <>
                        <FlaskConical className="w-4 h-4" />
                        Mock Login
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

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

      <SiteFooter className="relative z-50 shrink-0 w-full mt-auto" />
    </div>
  );
}