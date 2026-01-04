'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Trophy, PieChart as PieIcon, BarChart3, Medal, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS_BAR = '#8A2680';

// 1. หน้าภาพรวม (Dashboard Overview)
const OverviewTab = () => (
  <div className="space-y-6 animate-fade-in">
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
      </div>

    </div>
    {/* Card 4 */}
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-50 text-green-600 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
          <h3 className="text-base lg:text-xl font-bold text-slate-700">ผลคะแนนสด</h3>
        </div>
      </div>
    </div>
  </div>
);

// 2. หน้าจัดการผู้สมัคร (Placeholder)
const CandidatesTab = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-100 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
      <h3 className="text-base lg:text-xl font-bold text-slate-700">จัดการผู้สมัคร</h3>
    </div>
    <h3>test</h3>
  </div>
);

// 3. หน้าตั้งค่า (Placeholder)
const SettingsTab = () => {
  const [isVoteOpen, setIsVoteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();
        if (data.stats) setIsVoteOpen(data.stats.isVoteOpen);
      } catch (error) {
        console.error("Failed to fetch config", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSystemAction = async (actionType) => {
    if (actionType === 'RESET_VOTES') {
      const confirmReset = confirm("⚠️ คำเตือน: คะแนนทั้งหมดจะหายไปและไม่สามารถกู้คืนได้!\nคุณแน่ใจหรือไม่ที่จะรีเซ็ตระบบ?");
      if (!confirmReset) return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType }), // ส่ง action: 'TOGGLE_VOTE'
      });

      if (res.ok) {
        if (actionType === 'TOGGLE_VOTE') {
          setIsVoteOpen(!isVoteOpen); // สลับสวิตช์หน้าจอ
        }
      } else {
      }
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
        <h3 className="text-base lg:text-xl font-bold text-slate-700">ตั้งค่าระบบ</h3>
      </div>
      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
        <div>
          <h4 className="text-lg font-bold text-gray-800">สถานะระบบเลือกตั้ง</h4>
          <p className="text-sm text-gray-500 mt-1">
            เมื่อปิดระบบ จะไม่สามารถลงคะแนนได้
          </p>
        </div>



        {/* ปุ่ม Switch Toggle */}
                <div className="flex items-center gap-4">
          <span className={`text-sm font-bold ${isVoteOpen ? 'text-green-600' : 'text-red-500'}`}>
            {loading ? '' : (isVoteOpen ? '🟢 เปิดรับคะแนน' : '🔴 ปิดรับคะแนน')}
          </span>

          {loading ? '' : (
            <button
              onClick={() => handleSystemAction('TOGGLE_VOTE')}
              disabled={loading || processing}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isVoteOpen ? 'bg-green-500' : 'bg-gray-300'
                } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`${isVoteOpen ? 'translate-x-9' : 'translate-x-1'
                  } inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  )
};

// 4. หน้า Monitor (Placeholder)
const MonitorTab = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-100 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-green-50 text-green-600 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
      <h3 className="text-base lg:text-xl font-bold text-slate-700">ผลคะแนนสด</h3>
    </div>
    <h3>test</h3>
  </div>
);


export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // รายการเมนูสำหรับ Sidebar
  const menuItems = [
    { id: 'overview', label: 'ภาพรวม', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: 'candidates', label: 'จัดการผู้สมัคร', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'monitor', label: 'ผลคะแนนสด', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">

      {/* ✅ 3. Sidebar (เมนูด้านซ้าย) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#8A2680] to-[#3B82F6] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
            A
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-tight">Admin Console</h1>
            <p className="text-[10px] text-gray-500">FMS Election 2026</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === item.id
                ? 'bg-purple-50 text-[#8A2680] shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ✅ 4. Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Top Bar (สำหรับ Mobile หรือแสดงสถานะ) */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 md:static">
          <div className="md:hidden font-bold text-gray-800">Admin Console</div> {/* Mobile Title */}
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-700">Administrator</p>
              <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </p>
            </div>
            {/* ปุ่ม Logout แบบเดิม (โชว์เฉพาะ Mobile เพราะ Desktop อยู่ใน Sidebar แล้ว) */}
            <button onClick={handleLogout} className="md:hidden p-2 text-gray-500 hover:text-red-600 bg-gray-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 bg-gray-50">
          {/* ✅ 5. แสดงผลตาม activeTab ที่เลือก */}
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'candidates' && <CandidatesTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'monitor' && <MonitorTab />}
        </main>
      </div>

    </div>
  );
}