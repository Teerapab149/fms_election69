'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // ✅ 1. เพิ่ม import นี้

export default function AdminDashboard() {
  const router = useRouter(); // ✅ 2. เรียกใช้ router

  // ✅ 3. ฟังก์ชัน Logout
  const handleLogout = async () => {
    try {
      // ยิงไปบอก Backend ให้ลบ Cookie
      await fetch('/api/admin/logout', { method: 'POST' });
      // เด้งกลับไปหน้า Login
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* --- Navbar --- */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#8A2680] to-[#3B82F6] rounded-xl flex items-center justify-center text-white font-bold shadow-md">
            A
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">Admin Console</h1>
            <p className="text-xs text-gray-500">FMS Election 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-gray-700">Administrator</p>
            <p className="text-xs text-green-600 flex items-center justify-end gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </p>
          </div>
          
          {/* ✅ 4. เปลี่ยนจาก Link เป็น Button ธรรมดา และใส่ onClick */}
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg text-sm font-bold transition-colors border border-gray-200"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">+12%</span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Votes</h3>
            <p className="text-3xl font-black text-gray-800 mt-1">1,410</p>
            <p className="text-xs text-gray-400 mt-2">จากผู้มีสิทธิทั้งหมด 2,965 คน</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Candidates</h3>
            <p className="text-3xl font-black text-gray-800 mt-1">5 Teams</p>
            <p className="text-xs text-gray-400 mt-2">กำลังแข่งขัน</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
             <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">Active</span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Time Remaining</h3>
            <p className="text-3xl font-black text-gray-800 mt-1">04:12:30</p>
            <p className="text-xs text-gray-400 mt-2">จะปิดหีบเวลา 16:30 น.</p>
          </div>
        </div>

        {/* --- Quick Actions Grid --- */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#8A2680] rounded-full"></span>
            Management Tools
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <Link href="/admin/candidates" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-[#8A2680] hover:shadow-lg transition-all text-center">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="font-bold text-gray-700">จัดการผู้สมัคร</h3>
              <p className="text-xs text-gray-400 mt-1">เพิ่ม/ลบ/แก้ไขข้อมูล</p>
            </Link>

            <Link href="/admin/settings" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-[#8A2680] hover:shadow-lg transition-all text-center">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="font-bold text-gray-700">ตั้งค่าระบบ</h3>
              <p className="text-xs text-gray-400 mt-1">เวลาเปิด-ปิด/เงื่อนไข</p>
            </Link>

            <Link href="/admin/monitor" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-[#8A2680] hover:shadow-lg transition-all text-center">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="font-bold text-gray-700">ผลคะแนนสด</h3>
              <p className="text-xs text-gray-400 mt-1">Real-time Dashboard</p>
            </Link>

             <Link href="/admin/logs" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-[#8A2680] hover:shadow-lg transition-all text-center">
              <div className="w-14 h-14 bg-gray-50 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <h3 className="font-bold text-gray-700">Logs ระบบ</h3>
              <p className="text-xs text-gray-400 mt-1">ประวัติการใช้งาน</p>
            </Link>

          </div>
        </div>

      </main>
    </div>
  );
}