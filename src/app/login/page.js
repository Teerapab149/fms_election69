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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-purple-100">
      <Navbar />
      <div className="fixed inset-0 z-0 opacity-[0.3] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(to right, #e5e7eb 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100 animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#003087] mb-2 tracking-tight">PSU PASSPORT</h1>
            <p className="text-slate-400 text-sm">ระบบยืนยันตัวตนมหาวิทยาลัยสงขลานครินทร์</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl text-center border border-red-100 flex items-center justify-center gap-2 animate-pulse">
                 ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
              <input 
                type="text" 
                placeholder="Ex. 6610510xxx" 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800 placeholder:text-slate-300 font-medium"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800 placeholder:text-slate-300 font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-slate-400 mt-2 text-right opacity-70">*Dev Mode: ใส่รหัสอะไรก็ได้</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#003087] hover:bg-[#002466] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ (Sign In)"}
            </button>
          </form>

          {/* ซ่อนปุ่มกลับหน้าหลัก ถ้าล็อกอินค้างอยู่ (กันสับสน) */}
          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <a href="/" className="text-sm text-slate-400 hover:text-[#003087] transition-colors font-medium">← กลับหน้าหลัก</a>
          </div>
        </div>
      </main>
    </div>
  );
}