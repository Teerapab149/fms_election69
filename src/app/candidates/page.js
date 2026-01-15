'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, ChevronRight, Loader2, User, Sparkles, Megaphone } from 'lucide-react';
import Navbar from "../../components/Navbar";
import { PARTY_THEMES, DEFAULT_THEME } from '../../utils/PartyTheme';

export default function CandidatesPage() {
  const router = useRouter();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/party');
        if (res.ok) {
          const data = await res.json();
          const realParties = data.filter(p => p && parseInt(p.number) > 0);

          if (realParties.length === 1) {
            router.replace(`/party?id=${realParties[0].number}`);
            return;
          }

          setParties(realParties);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F8F9FD]">
      <Loader2 className="animate-spin w-10 h-10 text-[#8A2680]" />
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F8F9FD] text-slate-900 relative overflow-x-hidden">

      {/* --- ✨ Background Decor (Optimized for performance) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] md:w-[40%] h-[40%] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[50%] md:w-[35%] h-[35%] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px]"></div>
      </div>

      <div className="relative z-50">
        <Navbar />
      </div>

      {/* ✅ RESPONSIVE CONTAINER: 
          ปรับ Padding ตามขนาดหน้าจอ (มือถือ p-4, iPad p-8, Desktop p-12) 
      */}
      <main className="flex-grow relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16 py-8 md:py-16">

        {/* Header Section */}
        <div className="text-center mb-10 md:mb-20 space-y-4 md:space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-purple-100 shadow-sm transition-transform hover:scale-105">
            <Sparkles className="w-4 h-4 text-[#8A2680]" />
            <span className="text-[10px] md:text-xs font-black tracking-[0.15em] uppercase text-[#8A2680]">
              Candidates 2026
            </span>
          </div>

          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1]">
              ทำความรู้จัก <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2680] to-purple-500">ผู้สมัคร</span>
            </h1>

            {/* ✅ PARTY COUNTER: 
                ระบุจำนวนพรรคให้ชัดเจน เพื่อให้คนใช้มือถือทราบข้อมูลทันที
            */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <p className="text-slate-500 text-sm md:text-xl font-medium">
                ร่วมเป็นส่วนหนึ่งในการกำหนดอนาคต เลือกคนที่ใช่ พรรคที่ชอบ
              </p>
              <div className="flex items-center gap-2 bg-[#8A2680]/10 px-4 py-1.5 rounded-full border border-[#8A2680]/20">
                <Megaphone className="w-4 h-4 text-[#8A2680]" />
                <span className="text-[#8A2680] text-sm md:text-base font-bold">
                  ในปีนี้มีทั้งหมด {parties.length} พรรค
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ RESPONSIVE GRID: 
            - 1 คอลัมน์สำหรับมือถือ
            - 2 คอลัมน์สำหรับ iPad และ Notebook/Desktop
            - ปรับ Gap ให้กว้างขึ้นในจอใหญ่เพื่อให้ไม่ดูอึดอัด
        */}
        {parties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 pb-24">
            {parties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 md:py-32 bg-white/50 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">ยังไม่มีข้อมูลผู้สมัคร</h3>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-50 shrink-0 w-full py-4 bg-white/50 backdrop-blur-sm border-t border-slate-100 text-center mt-auto">
        <p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-widest uppercase">© FMS@PSU 2026. All Rights Reserved.</p>
      </footer>


      <style jsx global>{`
        @keyframes fade-in-up { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
}

function PartyCard({ party }) {
  const [coverImage, setCoverImage] = useState(null);
  const theme = PARTY_THEMES[party.number] || DEFAULT_THEME;

  useEffect(() => {
    const fetchPartyGallery = async () => {
      try {
        const res = await fetch(`/api/gallery?id=${party.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.images && data.images.length > 0) {
            setCoverImage(data.images[0].imageUrl || data.images[0]);
          }
        }
      } catch (error) { console.error(error); }
    };
    fetchPartyGallery();
  }, [party.id]);

  return (
    <Link href={`/party?id=${party.number}`} className="group block h-full">
      <div
        className="relative flex flex-col h-full bg-white rounded-[1.8rem] md:rounded-[2.5rem] overflow-hidden transition-all duration-500 border border-slate-100 shadow-sm hover:-translate-y-2 hover:shadow-2xl"
        style={{ '--hover-glow': `${theme.main}15` }}
      >
        {/* Banner Area - Edge-to-edge with Responsive Aspect Ratio */}
        <div className="relative aspect-[16/9] sm:aspect-video overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <Users className="w-12 h-12 text-slate-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-40 group-hover:opacity-60 transition-opacity"></div>

          {/* Number Badge - Adaptive size */}
          <div
            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl font-black text-white shadow-lg backdrop-blur-sm border border-white/20 transition-all group-hover:rotate-6"
            style={{ backgroundColor: theme.main }}
          >
            {party.number}
          </div>
        </div>

        {/* Content Area - Responsive Spacing & Typography */}
        <div className="p-5 md:p-8 lg:p-10 relative flex flex-col flex-1">
          <div className="flex items-start gap-4 md:gap-8">
            {/* Logo - Floating & Responsive */}
            <div className="relative -mt-16 md:-mt-24 shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-2xl md:rounded-[2rem] border-4 border-white bg-white shadow-xl overflow-hidden">
                <img src={party.logoUrl} alt={party.name} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex-1 pt-1 md:pt-2">
              <h3
                className="text-lg sm:text-xl md:text-3xl font-black leading-tight transition-colors duration-300 line-clamp-2"
                style={{ color: theme.textOnLight }}
              >
                {party.name}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 md:py-1 rounded-full border transition-colors"
                  style={{ borderColor: `${theme.main}33`, color: theme.main, backgroundColor: `${theme.main}08` }}
                >
                  NO.{party.number}
                </span>
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" style={{ color: theme.main }} />
              </div>
            </div>
          </div>

          {party.slogan && (
            <p className="mt-5 md:mt-8 text-slate-500 text-xs md:text-base font-medium italic leading-relaxed line-clamp-2 border-l-2 pl-4" style={{ borderColor: `${theme.main}22` }}>
              "{party.slogan}"
            </p>
          )}
        </div>

        {/* Party Accent Line */}
        <div className="h-1.5 md:h-2.5 w-full mt-auto" style={{ backgroundColor: theme.main }}></div>
      </div>

      <style jsx>{`
        .group:hover div {
          box-shadow: 0 25px 50px -12px var(--hover-glow);
        }
      `}</style>
    </Link>
  );
}