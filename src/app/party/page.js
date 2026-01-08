'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Users, Loader2, X, User, ChevronDown, Move, Search, ChevronRight, Crown, Maximize2, ChevronLeft } from 'lucide-react';
import Navbar from "../../components/Navbar";
import PartyChart from "../../components/PartyChart";
import { PARTY_THEMES, DEFAULT_THEME } from "../../utils/PartyTheme";

export default function PartyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyIdFromUrl = searchParams.get('id');
  const chartSectionRef = useRef(null);
  const listSectionRef = useRef(null);
  const chartContainerRef = useRef(null);
  const [activeParty, setActiveParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const nextSlide = () => { if (galleryImages.length > 0) setCurrentBgIndex((prev) => (prev + 1) % galleryImages.length); };
  const prevSlide = () => { if (galleryImages.length > 0) setCurrentBgIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); };
  const currentTheme = PARTY_THEMES[partyIdFromUrl] || DEFAULT_THEME;

  useEffect(() => {
    const fetchData = async () => {
      if (partyIdFromUrl) {
        try {
          const res = await fetch('/api/party');
          if (res.ok) {
            const data = await res.json();
            const foundParty = data.find(p => p.number == partyIdFromUrl || p.id == partyIdFromUrl);
            console.log(foundParty)
            if (foundParty) setActiveParty(foundParty);
          }
        } catch (error) { console.error("Error:", error); }
        finally { setLoading(false); }
      } else {
        router.push("/candidates")
      }
    };
    fetchData();
  }, [partyIdFromUrl]);

  useEffect(() => {
    if (!activeParty?.id) return;
    fetch(`/api/gallery?id=${activeParty.id}`)
      .then(res => res.json())
      .then(data => { if (data.images?.length > 0) setGalleryImages(data.images); });
  }, [activeParty]);

  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const interval = setInterval(() => setCurrentBgIndex((prev) => (prev + 1) % galleryImages.length), 5000);
    return () => clearInterval(interval);
  }, [galleryImages]);

  const scrollToList = () => listSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  const filteredMembers = activeParty?.members?.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.position?.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-10 h-10 text-purple-600" /></div>;

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-800 bg-[#Fdfdfd] overflow-x-hidden">
      <div className="fixed top-0 w-full z-[60] bg-white/80 backdrop-blur-md border-b border-slate-100"><Navbar /></div>

      {activeParty ? (
        <main className="flex-1 flex flex-col pt-12 md:pt-16">

          {/* Section 1: Banner */}
          <section className="relative w-full bg-white border-b border-slate-100">
            <div className="relative w-full cursor-pointer group bg-slate-100" onClick={() => setIsLightBoxOpen(true)}>
              <div className="relative w-full aspect-[6/4] md:aspect-[20/9] lg:aspect-[2.5/1] overflow-hidden">
                {galleryImages.length > 0 ? (
                  galleryImages.map((img, idx) => (
                    <div key={idx} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}>
                      <img src={img} className="w-full h-full object-cover object-[center_30%]" alt={`Cover ${idx}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60"></div>
                    </div>
                  ))
                ) : (
                  <div className={`w-full h-full bg-gradient-to-r ${currentTheme.gradient}`} />
                )}
              </div>
              {galleryImages.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10"><ChevronLeft size={24} className="md:w-8 md:h-8" /></button>
                  <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10"><ChevronRight size={24} className="md:w-8 md:h-8" /></button>
                </>
              )}
              {galleryImages.length > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setIsLightBoxOpen(true); }} className="absolute bottom-3 right-3 md:bottom-6 md:right-6 z-20 px-3 py-1.5 md:px-4 md:py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-md text-[10px] md:text-xs font-bold flex items-center gap-2 transition-all border border-white/10"><Maximize2 size={14} /> <span className="hidden sm:inline">ดูภาพขยาย</span></button>
              )}
            </div>
            <div className="w-full h-1 md:h-1.5" style={{ backgroundColor: currentTheme.main }}></div>
            <div className="max-w-[90rem] mx-auto px-4 md:px-12 w-full pb-8">
              <div className="relative flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-8">
                <div className="relative -mt-16 md:-mt-24 shrink-0 z-30">
                  <div className="w-32 h-32 md:w-52 md:h-52 rounded-full border-[6px] border-white bg-white shadow-xl overflow-hidden relative">
                    <img src={activeParty.logoUrl} className="w-full h-full object-contain p-1" alt="Party Logo" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-2 md:pb-6">
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-2">{activeParty.name}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-500 font-medium text-sm md:text-lg">
                    <span className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-white font-bold text-xs" style={{ backgroundColor: currentTheme.main }}>NO. {activeParty.number}</span>
                      {activeParty.slogan}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* LightBox */}
          {isLightBoxOpen && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
              <button onClick={() => setIsLightBoxOpen(false)} className="absolute top-10 right-6 z-[110] p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"><X size={28} /></button>
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img src={galleryImages[currentBgIndex]} className="max-w-full max-h-[85vh] object-contain shadow-2xl animate-in zoom-in-95 duration-300" />
                {galleryImages.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-4 md:left-10 p-4 text-white/50 hover:text-white transition-all"><ChevronLeft size={48} /></button>
                    <button onClick={nextSlide} className="absolute right-4 md:right-10 p-4 text-white/50 hover:text-white transition-all"><ChevronRight size={48} /></button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Chart (Full Screen with New PartyChart Component) */}
          <section ref={chartSectionRef} className="relative w-full h-screen bg-[#02040a] flex flex-col border-t border-slate-900 overflow-hidden">

            {/* Header ของ Section 2 */}
            {/* ✅ ใช้ flex-col ตลอดเวลา เพื่อให้เรียงจากบนลงล่างเสมอ */}
            <div className="absolute top-0 left-0 w-full z-20 pt-8 px-6 md:px-16 flex flex-col items-start gap-3 pointer-events-none">

              {/* 1. ส่วนหัวข้อ (Title) */}
              <div className="flex flex-col gap-1 select-none relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-[2px]" style={{ backgroundColor: currentTheme.main }}></div>
                  <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-white/40 uppercase">
                    Organizational Chart
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute -left-10 -top-10 w-32 h-32 blur-[50px] opacity-30 rounded-full"
                    style={{ backgroundColor: currentTheme.main }}></div>
                  <h2 className="relative text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl leading-none">
                    โครงสร้าง<span style={{ color: currentTheme.main }}>ทีม</span>
                  </h2>
                </div>
              </div>

              {/* 2. ปุ่ม Navigator (อยู่ด้านล่างหัวข้อ ชิดซ้ายเสมอ) */}
              <div className="pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <button
                  onClick={scrollToList}
                  className="group relative flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full border backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] active:scale-95 hover:pl-5"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: `${currentTheme.main}40`,
                    boxShadow: `0 8px 32px -8px ${currentTheme.main}20`
                  }}
                >
                  {/* ข้อความ */}
                  <div className="flex flex-col items-start justify-center">
                    <span className="text-[10px] md:text-xs font-bold text-white leading-none group-hover:text-[var(--theme-main)] transition-colors" style={{ '--theme-main': currentTheme.main }}>
                      ดูรายชื่อทั้งหมด
                    </span>
                  </div>

                  {/* ไอคอนวงกลม */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-180"
                    style={{ backgroundColor: currentTheme.main }}>
                    <ChevronDown size={14} className="text-white drop-shadow-md" />
                  </div>
                </button>
              </div>

            </div>

            {/* ตัว Chart */}
            <div ref={chartContainerRef} className="flex-1 relative w-full h-full">
              <PartyChart members={activeParty.members || []} theme={currentTheme} onMemberClick={setSelectedMember} />
            </div>
          </section>

          {/* Section 3: The Candidates List (Original) */}
          <section ref={listSectionRef} className="w-full bg-slate-50/50 py-16 md:py-24 px-4 md:px-20 border-t border-slate-100 relative overflow-hidden">
            <div className="max-w-6xl mx-auto relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 md:mb-20 gap-6">
                <div className="animate-in fade-in slide-in-from-left duration-700">
                  <h2 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tighter mb-2">The Candidates <span style={{ color: currentTheme.main }}>List</span></h2>
                  <div className="flex gap-1">
                    <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: currentTheme.main }}></div>
                    <div className="w-4 h-1.5 rounded-full opacity-30" style={{ backgroundColor: currentTheme.main }}></div>
                  </div>
                  <p className="text-slate-500 font-medium text-sm md:text-lg leading-relaxed">
                    รายชื่อผู้สมัครเลือกตั้ง <span className="text-transparent bg-clip-text bg-gradient-to-r py-1" style={{ backgroundImage: `linear-gradient(to right, ${currentTheme.main}, ${currentTheme.middle[0]})`, WebkitBackgroundClip: 'text', display: 'inline-block' }}>{activeParty.name}</span>
                  </p>
                </div>
                <div className="relative group w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="ค้นหาตามชื่อ หรือตำแหน่ง..." className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] md:rounded-[2rem] bg-white border-2 border-slate-100 focus:outline-none transition-all shadow-sm focus:shadow-xl text-sm md:text-base" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>

              {searchTerm === "" ? (
                <div className="space-y-12 md:space-y-20">
                  {/* 1. President */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 flex items-center gap-3"><div className="w-12 h-[2px]" style={{ backgroundColor: currentTheme.main }}></div> The President</h3>
                    <div onClick={() => setSelectedMember(activeParty.members[0])} className="group relative bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border-2 transition-all duration-500 cursor-pointer flex flex-row items-center gap-5 md:gap-10 overflow-hidden hover:scale-[1.01]" style={{ borderColor: `${currentTheme.main}30` }}>
                      <div className="w-28 h-28 md:w-56 md:h-56 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 shrink-0 ring-4 ring-slate-50">
                        <div className="absolute top-2 right-2 w-7 h-7 md:w-12 md:h-12 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-lg z-20 border-2 border-slate-50"><Crown className="w-4 h-4 md:w-7 md:h-7" style={{ color: currentTheme.main }} /></div>
                        <MemberImage url={activeParty.members[0].imageUrl} />
                      </div>
                      <div className="flex-1 min-w-0 relative z-10">
                        <div className="inline-block px-3 py-1 rounded-lg text-white font-black text-[9px] md:text-xs mb-2 md:mb-4 shadow-md uppercase tracking-widest" style={{ backgroundColor: currentTheme.main }}>CANDIDATE #1</div>
                        <h4 className="text-xl md:text-5xl font-black text-slate-900 mb-1 md:mb-2 leading-tight truncate">{activeParty.members[0].name}</h4>
                        <p className="text-sm md:text-2xl font-bold mb-2" style={{ color: currentTheme.main }}>{activeParty.members[0].position || "นายกสโมสรนักศึกษา"}</p>
                        <button className="flex items-center text-[10px] md:text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest">View Profile <ChevronRight size={14} className="ml-1" /></button>
                      </div>
                    </div>
                  </div>
                  {/* 2. Executives */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 flex items-center gap-3"><div className="w-12 h-[2px]" style={{ backgroundColor: currentTheme.main }}></div> Core Executives</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                      {activeParty.members.slice(1, 5).map((member, idx) => (
                        <div key={member.id} onClick={() => setSelectedMember(member)} className="group bg-white p-4 md:p-6 rounded-[1.8rem] md:rounded-[2.5rem] shadow-lg border-2 border-transparent hover:border-slate-100 transition-all duration-300 cursor-pointer flex flex-row items-center gap-4 md:gap-6" style={{ borderLeftColor: currentTheme.main, borderLeftWidth: '6px' }}>
                          <div className="w-20 h-20 md:w-32 md:h-32 rounded-[1.2rem] md:rounded-[2.1rem] overflow-hidden shadow-md shrink-0 relative ring-2 ring-slate-50">
                            <div className="absolute top-2 left-1.5 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white font-black text-[10px] md:text-xs z-10 shadow-lg border-2 border-white" style={{ backgroundColor: currentTheme.main }}>{idx + 2}</div>
                            <MemberImage url={member.imageUrl} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-lg md:text-2xl font-black text-slate-800 truncate mb-0.5">{member.name}</h4>
                            <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest opacity-70 truncate mb-2" style={{ color: currentTheme.main }}>{member.position || "คณะผู้บริหาร"}</p>
                            <div className="flex items-center text-[9px] md:text-xs font-black text-slate-300 group-hover:text-slate-500 transition-colors">PROFILE <ChevronRight size={12} className="ml-1" /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 3. Department Heads */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 flex items-center gap-3"><div className="w-12 h-[2px]" style={{ backgroundColor: currentTheme.main }}></div> Department Heads</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                      {activeParty.members.slice(5).map((member, idx) => (
                        <div key={member.id} onClick={() => setSelectedMember(member)} className="group bg-white/70 hover:bg-white p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 cursor-pointer flex flex-row items-center gap-4" style={{ borderLeft: `4px solid ${currentTheme.main}` }}>
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1rem] md:rounded-[1.5rem] overflow-hidden shadow-inner shrink-0 relative">
                            <div className="absolute top-1 left-1 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-white font-black text-[12px] z-10 shadow-md" style={{ backgroundColor: currentTheme.main }}>{idx + 6}</div>
                            <MemberImage url={member.imageUrl} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-800 truncate text-sm md:text-lg leading-tight">{member.name}</h4>
                            <p className="text-[12px] md:text-[14px] font-bold uppercase tracking-tighter opacity-50 truncate" style={{ color: currentTheme.main }}>{member.position || "ประธานฝ่าย"}</p>
                            <div className="mt-1 text-[8px] font-black text-slate-300 group-hover:text-slate-400 transition-colors uppercase">Profile +</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-50 flex items-center gap-4 cursor-pointer" onClick={() => setSelectedMember(member)}>
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0"><MemberImage url={member.imageUrl} /></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-800 truncate text-sm">{member.name}</h4>
                        <p className="text-[10px] font-bold opacity-50 uppercase" style={{ color: currentTheme.main }}>{member.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Modal Detail */}
          {selectedMember && (
            <>
              <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-sm z-[100] animate-in fade-in" onClick={() => setSelectedMember(null)}></div>
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] md:w-[60%] max-w-sm bg-white p-6 rounded-[32px] shadow-2xl z-[101] border border-slate-100">
                <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full text-slate-400"><X className="w-4 h-4" /></button>
                <div className="text-center">
                  <div className="w-24 h-24 md:w-36 md:h-36 mx-auto rounded-3xl overflow-hidden mb-4 relative border-[3px]" style={{ borderColor: currentTheme.main }}><MemberImage url={selectedMember.imageUrl} /></div>
                  <h3 className="text-xl md:text-3xl font-black text-slate-800 mb-1 leading-tight">{selectedMember.name}</h3>
                  <p style={{ color: currentTheme.main }} className="text-xs md:text-lg font-bold mb-6 uppercase tracking-wide">{selectedMember.position || "สมาชิกพรรค"}</p>
                  <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center"><span className="text-[10px] text-slate-400 font-bold uppercase">ID</span><span className="font-black text-slate-800 font-mono text-base">{selectedMember.studentId || "-"}</span></div>
                </div>
              </div>
            </>
          )}

        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 mb-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-300"><Users size={48} /></div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">ไม่พบข้อมูลสมาชิก</h2>
          <p className="text-slate-500 max-w-xs mx-auto">พรรค <span className="font-bold" style={{ color: currentTheme.main }}>{activeParty?.name}</span> ยังไม่ได้ทำการเพิ่มรายชื่อผู้สมัครในขณะนี้</p>
          <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">ลองใหม่อีกครั้ง</button>
        </main>
      )}
      <footer className="w-full py-6 bg-white/50 backdrop-blur-md border-t border-gray-200/50 text-center relative z-50"><p className="text-sm text-gray-500 font-medium">© FMS@PSU 2026. All Rights Reserved.</p></footer>
    </div>
  );
}

function MemberImage({ url }) {
  const [error, setError] = useState(false);
  if (error || !url) return <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><User className="w-10 h-10 md:w-16 md:h-16" /></div>;
  return <img src={url} className="w-full h-full object-cover" onError={() => setError(true)} alt="member" />;
}