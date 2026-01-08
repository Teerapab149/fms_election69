'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, ChevronRight, Loader2, User } from 'lucide-react';
import Navbar from "../../components/Navbar";

export default function CandidatesPage() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/party');
        if (res.ok) {
          const data = await res.json();
          setParties(data);
        }
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-10 h-10 text-purple-600" /></div>;

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-[#Fdfdfd] flex flex-col">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <Navbar />
      </div>
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-10">
        {/* Header Section - ปรับขนาดตัวอักษรให้เล็กลงในมือถือ */}
        <div className="text-center mb-8 md:mb-12 animate-fade-in-up">
          <span className="bg-purple-50 text-[#8A2680] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            Candidates 2026
          </span>
          <h1 className="text-2xl md:text-5xl font-black text-slate-900 mt-3 mb-2 tracking-tight">
            ทำความรู้จัก <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2680] to-purple-500">ผู้สมัคร</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-lg">
            ร่วมเป็นส่วนหนึ่งในการกำหนดอนาคต เลือกคนที่ใช่ พรรคที่ชอบ
          </p>
        </div>

        {/* Grid System - ปรับเป็น 2 คอลัมน์เสมอใน Mobile และ Gap แคบลง */}
        {parties.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-8 pb-20">
            {parties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">ยังไม่มีข้อมูลผู้สมัคร</h3>
          </div>
        )}
      </main>
    </div>
  );
}

function PartyCard({ party }) {
  const [imageError, setImageError] = useState(false);
  const [coverImage, setCoverImage] = useState(null);

  useEffect(() => {
    const fetchPartyGallery = async () => {
      try {
        const res = await fetch(`/api/gallery?id=${party.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.images && data.images.length > 0) {
            const firstImage = data.images[0];
            setCoverImage(firstImage.imageUrl || firstImage);
          }
        }
      } catch (error) { console.error(error); }
    };
    fetchPartyGallery();
  }, [party.id]);

  const displayImage = coverImage

  return (
    <Link href={`/party?id=${party.number}`} className="group block h-full animate-scale-up">
      <div className="relative flex flex-col h-full bg-white rounded-xl md:rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-lg">
        
        {/* Banner Section - บังคับสัดส่วนแนวนอนด้วย aspect-video */}
        <div className="relative aspect-video bg-slate-100 overflow-hidden">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Cover"
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-[#8A2680]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>

        {/* Content Section */}
        <div className="px-3 pb-3 md:px-6 md:pb-6 relative flex-1 flex flex-col">
          
          <div className="relative -mt-8 md:-mt-12 mb-2 flex justify-between items-end">
            <div className="relative">
              {/* ย่อขนาดโลโก้ใน Mobile */}
              <div className="w-14 h-14 md:w-24 md:h-24 rounded-full border-[3px] md:border-[4px] border-white bg-white shadow-md overflow-hidden">
                {!imageError ? (
                  <img
                    src={party.logoUrl}
                    alt={party.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <User className="w-6 h-6 md:w-10 md:h-10 text-slate-300" />
                  </div>
                )}
              </div>

              {/* ปรับขนาดเบอร์พรรคใน Mobile */}
              <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-6 h-6 md:w-10 md:h-10 bg-[#8A2680] text-white rounded-full flex items-center justify-center font-black text-xs md:text-lg border-2 md:border-[3px] border-white shadow-sm z-10">
                {party.number}
              </div>
            </div>

            <div className="hidden md:block mb-1">
              <span className="text-xs font-bold text-slate-400 group-hover:text-[#8A2680] flex items-center gap-1">
                View <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div className="mt-1">
            {/* ปรับขนาดชื่อพรรค และใช้ line-clamp-2 เพื่อคุมความสูง */}
            <h3 className="text-sm md:text-xl font-bold text-slate-900 group-hover:text-[#8A2680] leading-tight line-clamp-2">
              {party.name}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}