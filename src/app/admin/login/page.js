'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // State สำหรับเก็บ Error Message
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); 

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: e.target[0].value,
          password: e.target[1].value
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin');
      } else {
        //setError
        setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }

    } catch (err) {
      setError('ระบบขัดข้อง กรุณาลองใหม่ภายหลัง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden p-4">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-300/40 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-300/40 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(255,255,255,0.9)_100%)]"></div>
      </div>

      <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(138,38,128,0.15)] w-full max-w-sm overflow-hidden border border-white/50">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8A2680] to-[#3B82F6] p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer"></div>
          <div className="flex justify-center mb-2">
             <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white drop-shadow-sm">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3zM12 6.75a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0112 6.75z" clipRule="evenodd" />
                </svg>
             </div>
          </div>
          <h1 className="text-xl font-black text-white tracking-widest uppercase drop-shadow-sm">Administrator</h1>
          <p className="text-white/80 text-xs mt-1 font-medium tracking-wider">เฉพาะเจ้าหน้าที่/กรรมการเลือกตั้ง</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleAdminLogin} className="space-y-5">
            
            {/* ✅ 3. ส่วนแสดงผล Error Message (จะโชว์ก็ต่อเมื่อมี error) */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider group-focus-within:text-[#8A2680] transition-colors">Username</label>
              <div className="relative">
                <input 
                  type="text" 
                  // เพิ่ม: ถ้ามี error ให้ขอบเป็นสีแดง
                  className={`w-full pl-4 pr-4 py-3 rounded-xl border bg-gray-50/50 focus:bg-white outline-none transition-all text-sm font-medium text-gray-700 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#8A2680] focus:ring-[#8A2680]/20 focus:ring-2'}`}
                  placeholder="Enter admin username"
                  onChange={() => setError('')} // ถ้าเริ่มพิมพ์ใหม่ ให้ error หายไป
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider group-focus-within:text-[#8A2680] transition-colors">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                   className={`w-full pl-4 pr-4 py-3 rounded-xl border bg-gray-50/50 focus:bg-white outline-none transition-all text-sm font-medium text-gray-700 font-sans ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#8A2680] focus:ring-[#8A2680]/20 focus:ring-2'}`}
                  placeholder="••••••••"
                  onChange={() => setError('')} // ถ้าเริ่มพิมพ์ใหม่ ให้ error หายไป
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full group relative overflow-hidden rounded-xl shadow-[0_4px_15px_-5px_rgba(138,38,128,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_-5px_rgba(138,38,128,0.6)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#8A2680] to-[#601A59]"></div>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out skew-x-12"></div>
              <span className="relative flex items-center justify-center gap-3 py-3.5 px-8 text-white font-bold tracking-wide text-sm uppercase">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    Login to System
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-gray-100">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#8A2680] transition-colors tracking-wide uppercase group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}