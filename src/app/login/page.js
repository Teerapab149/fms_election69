"use client";

import { useState, useEffect } from "react"; // ✅ เพิ่ม useEffect
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function LoginPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ เพิ่มส่วนนี้: เช็คทันทีที่เข้ามาหน้านี้ ว่าเคย Login ค้างไว้ไหม?
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");

    if (userStr) {
      // ถ้ามีข้อมูล User อยู่แล้ว (ล็อกอินค้างไว้)
      const user = JSON.parse(userStr);

      // เช็คต่อเลยว่าโหวตยัง?
      if (user.isVoted) {
        router.push("/results"); // โหวตแล้ว -> ไปดูผล
      } else {
        router.push("/vote");    // ยังไม่โหวต -> ไปโหวต
      }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, password }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("ระบบหลังบ้านไม่ได้ส่ง JSON กลับมา (เช็คไฟล์ route.js)");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Login สำเร็จ -> บันทึกลงเครื่อง
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // เช็คว่า User นี้โหวตหรือยัง แล้วดีดไปให้ถูกหน้า
      if (data.user.isVoted) {
        router.push("/results");
      } else {
        router.push("/vote");
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <Navbar />
      {/* Background Grid - ปรับให้จางลงอีกนิดเพื่อให้ดูแพง */}
      <div className="fixed inset-0 z-0 opacity-[0.2] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(to right, #e5e7eb 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 w-full max-w-md border border-slate-100 animate-fade-in-up">

          <div className="text-center mb-10">
            <div className="inline-block px-3 py-1 bg-blue-50 text-[#003087] text-[10px] font-bold tracking-widest uppercase rounded-full mb-4">
              Official Authentication
            </div>
            <h1 className="text-3xl font-black text-[#003087] mb-2 tracking-tight">PSU PASSPORT</h1>
            <p className="text-slate-400 text-sm">ระบบยืนยันตัวตนมหาวิทยาลัยสงขลานครินทร์</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3.5 rounded-2xl text-center border border-red-100 flex items-center justify-center gap-2 animate-shake">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Username</label>
              <input
                type="text"
                placeholder="Ex. 6610510xxx"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-800 placeholder:text-slate-300 font-medium"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-800 placeholder:text-slate-300 font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003087] hover:bg-[#002466] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-900/10 transition-all hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center text-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  กำลังตรวจสอบ...
                </span>
              ) : "เข้าสู่ระบบ (Sign In)"}
            </button>
          </form>

          {/* ปุ่มกลับหน้าหลัก - ปรับให้เป็น Outline Button ที่ดูสะอาดตา */}
          <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 rounded-2xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              กลับหน้าหลัก
            </button>

            {/* Admin Entrance - วางไว้ใต้ปุ่มกลับหน้าหลักอีกที */}
            <div className="flex justify-center">
              <button
                onClick={() => router.push("/admin")}
                className="group flex items-center gap-2 opacity-30 hover:opacity-100 transition-all duration-500 py-2"
              >
                <div className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-blue-500 transition-colors"></div>
                <span className="text-[10px] tracking-[0.2em] text-slate-400 font-medium uppercase group-hover:text-slate-600">
                  FMS ELECTION SYSTEM
                </span>
                <div className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-blue-500 transition-colors"></div>
              </button>
            </div>
          </div>

        </div >

      </main >
    </div >
  );
}