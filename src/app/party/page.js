'use client';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, X, User, ChevronDown, Search, ChevronRight,
  Crown, Maximize2, ChevronLeft, Target, Shield,
  Flag, BookOpen, Star, Lightbulb, Quote, CheckCircle2
} from 'lucide-react';
import Navbar from "../../components/Navbar";
import PartyChart from "../../components/PartyChart";
import { PARTY_THEMES, DEFAULT_THEME } from "../../utils/PartyTheme";
import BackToVoteBar from "../../components/BackToVoteBar";
import CandidateModal from '../../components/CandidateModal';

// --- CONSTANTS ---
const POSITION_ORDER = [
  "นายกสโมสรนักศึกษา", "อุปนายกกิจการภายใน", "อุปนายกกิจการภายนอก", "เลขานุการ", "เหรัญญิก",
  "ประธานฝ่ายประชาสัมพันธ์", "ประธานฝ่ายสวัสดิการ", "ประธานฝ่ายพัสดุ", "ประธานฝ่ายกีฬา",
  "ประธานฝ่ายวิชาการ", "ประธานฝ่ายศิลปวัฒนธรรม", "ประธานฝ่ายข้อมูลกิจการนักศึกษา",
  "ประธานฝ่ายเทคโนโลยีสารสนเทศ", "ประธานฝ่ายประเมินผล", "ประธานฝ่ายกิจกรรม",
  "ประธานฝ่ายกราฟิกดีไซน์", "ประธานฝ่ายพิธีการ", "ประธานฝ่ายครีเอทีฟและสันทนาการ",
  "ประธานฝ่ายสถานที่", "ประธานฝ่ายสาธารณสุข"
];

// ✅ PREPARE DATA HELPER
// ฟังก์ชันนี้จะตรวจสอบข้อมูลจาก DB ว่ามีไหม ถ้าไม่มีให้ใส่ Default Text เพื่อไม่ให้หน้าเว็บโล่ง
const preparePartyData = (party) => {
  return {
    ...party,
    // 1. ความหมายโลโก้ (Text)
    logoMeaning: party.logoMeaning || "ยังไม่มีข้อมูลความหมายสัญลักษณ์",

    // 2. พันธกิจ (JSON Array) -> ตรวจสอบว่าเป็น Array จริงไหม
    missions: (Array.isArray(party.missions) && party.missions.length > 0)
      ? party.missions
      : ["ยังไม่มีข้อมูลพันธกิจ"],

    // 3. นโยบาย (JSON Array) -> ตรวจสอบว่าเป็น Array จริงไหม
    policies: (Array.isArray(party.policies) && party.policies.length > 0)
      ? party.policies
      : ["ยังไม่มีข้อมูลนโยบาย"]
  };
};

// --- SUB-COMPONENTS ---

const PartyBanner = ({ party, theme, galleryImages, onOpenLightbox }) => {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const interval = setInterval(() => setCurrentBgIndex((prev) => (prev + 1) % galleryImages.length), 5000);
    return () => clearInterval(interval);
  }, [galleryImages]);

  return (
    <section className="relative w-full bg-white border-b border-slate-100">
      <div className="relative w-full cursor-pointer group bg-slate-100" onClick={onOpenLightbox}>
        <div className="relative w-full aspect-[6/4] md:aspect-[20/9] lg:aspect-[2.5/1] overflow-hidden">
          {galleryImages.length > 0 ? (
            galleryImages.map((img, idx) => (
              <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}>
                <img src={img} className="w-full h-full object-cover object-[center_30%]" alt={`Cover ${idx}`} loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>
            ))
          ) : (
            <div className={`w-full h-full bg-gradient-to-r ${theme.gradient}`} />
          )}
        </div>
        {galleryImages.length > 0 && (
          <button className="absolute bottom-4 right-4 z-20 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-md text-xs font-bold flex items-center gap-2 transition-all border border-white/10">
            <Maximize2 size={14} /> <span className="hidden sm:inline">ดูภาพขยาย</span>
          </button>
        )}
      </div>
      <div className="w-full h-1.5" style={{ backgroundColor: theme.main }}></div>
      <div className="max-w-[90rem] mx-auto px-4 md:px-12 w-full pb-8">
        <div className="relative flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-8">
          <div className="relative -mt-16 md:-mt-24 shrink-0 z-30">
            <div className="w-32 h-32 md:w-52 md:h-52 rounded-full border-[6px] border-white bg-white shadow-2xl overflow-hidden p-1">
              <img src={party.logoUrl} className="w-full h-full object-contain rounded-full" alt="Party Logo" loading="lazy" />
            </div>
          </div>
          <div className="flex-1 min-w-0 pt-2 md:pb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-md text-white font-black text-sm shadow-sm" style={{ backgroundColor: theme.main }}>
                NO. {party.number}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-2 tracking-tight">{party.name}</h1>
            <p className="text-slate-500 font-medium text-lg md:text-xl">{party.slogan}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ✅ Section 2: แสดงข้อมูลจริงจาก DB
const PartyVisionSection = ({ party, theme }) => {
  return (
    <section className="relative w-full py-16 md:py-24 px-4 overflow-hidden bg-slate-50 border-b border-slate-200">

      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[var(--theme-color)] to-transparent opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" style={{ '--theme-color': theme.main }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ---------------- LEFT COLUMN: Identity & Mission (Col-Span 5) ---------------- */}
          <div className="lg:col-span-5 flex flex-col gap-8">

            {/* Box 1: ความหมายโลโก้ */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: theme.main }}></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
                  <Lightbulb size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">ความหมายสัญลักษณ์</h3>
              </div>
              {/* แสดงข้อมูลจริงจาก DB */}
              <p className="text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-line">
                {party.logoMeaning}
              </p>
              <Quote className="absolute bottom-4 right-6 text-slate-100 w-24 h-24 -z-10 transform rotate-12" />
            </div>

            {/* Box 2: พันธกิจ (Mission) */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg text-white shadow-md" style={{ backgroundColor: theme.main }}>
                  <Flag size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800">พันธกิจของพรรค</h3>
              </div>

              <div className="space-y-6">
                {/* Loop แสดงข้อมูลจริงจาก DB Array */}
                {party.missions.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm shadow-sm mt-0.5"
                      style={{ backgroundColor: theme.main }}>
                      {idx + 1}
                    </span>
                    <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ---------------- RIGHT COLUMN: Policies (Col-Span 7) ---------------- */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-lg border border-slate-100 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <Target size={200} style={{ color: theme.main }} />
              </div>

              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Star className="w-8 h-8 fill-current" style={{ color: theme.main }} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800">นโยบายของพรรค</h3>
                  <p className="text-slate-400 font-medium text-sm">Policy Statement</p>
                </div>
              </div>

              {/* Policy List: Loop ข้อมูลจริง */}
              <div className="space-y-6 relative z-10">
                {party.policies.map((policy, idx) => (
                  <div key={idx} className="group flex gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="shrink-0 mt-1">
                      <CheckCircle2 size={24} className="text-slate-300 group-hover:text-[var(--theme-color)] transition-colors" style={{ '--theme-color': theme.main }} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-[var(--theme-color)] transition-colors" style={{ '--theme-color': theme.main }}>
                        นโยบายข้อที่ {idx + 1}
                      </h4>
                      <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                        {policy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const PartyChartSection = ({ party, theme, onSelectMember, onScrollToList }) => {
  return (
    <section className="relative w-full h-[90vh] bg-[#02040a] flex flex-col border-t border-slate-900 overflow-hidden">
      <div className="absolute top-0 left-0 w-full z-20 pt-8 px-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1 select-none">
          <div className="flex items-center gap-2">
            <div className="w-6 h-[2px]" style={{ backgroundColor: theme.main }}></div>
            <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Organizational Chart</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter shadow-black drop-shadow-md">
            โครงสร้าง<span style={{ color: theme.main }}>ทีม</span>
          </h2>
        </div>
        <button onClick={onScrollToList}
          className="pointer-events-auto bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/10 hover:scale-110">
          <ChevronDown />
        </button>
      </div>
      <div className="flex-1 relative w-full h-full">
        <PartyChart members={party.chartMembers} theme={theme} onMemberClick={onSelectMember} partyName={party.name} />
      </div>
    </section>
  );
};

const CandidateList = ({ members, theme, onSelectMember }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const { president, executives, heads, filteredSearch, isSearching } = useMemo(() => {
    const validMembers = members.filter(m => !m.isPlaceholder);
    if (searchTerm) {
      return {
        isSearching: true,
        filteredSearch: validMembers.filter(m =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.position?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      };
    }
    return {
      isSearching: false,
      president: validMembers.find(m => m.position === POSITION_ORDER[0]),
      executives: validMembers.filter(m => POSITION_ORDER.slice(1, 5).includes(m.position)),
      heads: validMembers.filter(m => !POSITION_ORDER.slice(0, 5).includes(m.position)),
      filteredSearch: []
    };
  }, [members, searchTerm]);

  return (
    <section className="w-full bg-white py-16 md:py-24 px-4 md:px-20 border-t border-slate-100 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">
              The Candidates <span style={{ color: theme.main }}>List</span>
            </h2>
            <p className="text-slate-500">รายชื่อผู้สมัครและคณะทำงาน</p>
          </div>
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือตำแหน่ง..."
              className="w-full pl-12 pr-4 py-3 rounded-full bg-slate-50 border-2 border-slate-100 focus:border-[var(--theme-color)] focus:outline-none transition-all"
              style={{ '--theme-color': theme.main }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isSearching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSearch.length > 0 ? filteredSearch.map(m => (
              <MemberCard key={m.id} member={m} theme={theme} onClick={() => onSelectMember(m)} compact />
            )) : <div className="col-span-full text-center py-20 text-slate-400">ไม่พบข้อมูลที่ค้นหา</div>}
          </div>
        ) : (
          <div className="space-y-16">
            {president && (
              <div>
                <SectionLabel theme={theme} label="THE PRESIDENT" />
                <div onClick={() => onSelectMember(president)}
                  className="group relative bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl border-2 cursor-pointer hover:scale-[1.01] transition-all duration-500 flex flex-col md:flex-row items-center gap-8 overflow-hidden"
                  style={{ borderColor: `${theme.main}20` }}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--theme-color)] to-transparent opacity-5 rounded-bl-full pointer-events-none" style={{ '--theme-color': theme.main }} />
                  <div className="w-40 h-40 md:w-56 md:h-56 rounded-[2rem] overflow-hidden shadow-lg shrink-0 relative ring-4 ring-slate-50">
                    <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg z-20">
                      <Crown className="w-5 h-5" style={{ color: theme.main }} />
                    </div>
                    <MemberImage url={president.imageUrl} />
                  </div>
                  <div className="flex-1 text-center md:text-left z-10">
                    <span className="inline-block px-3 py-1 rounded-full text-white font-bold text-xs mb-3 shadow-md" style={{ backgroundColor: theme.main }}>CANDIDATE #1</span>
                    <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 leading-tight">{president.name}</h3>
                    <p className="text-lg md:text-2xl font-bold opacity-80 mb-4" style={{ color: theme.main }}>{president.position}</p>
                    <button className="inline-flex items-center text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                      VIEW PROFILE <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {executives.length > 0 && (
              <div>
                <SectionLabel theme={theme} label="CORE EXECUTIVES" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {executives.map((m, i) => <MemberCard key={m.id} member={m} theme={theme} onClick={() => onSelectMember(m)} index={i + 2} isExec />)}
                </div>
              </div>
            )}
            {heads.length > 0 && (
              <div>
                <SectionLabel theme={theme} label="DEPARTMENT HEADS" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heads.map((m, i) => <MemberCard key={m.id} member={m} theme={theme} onClick={() => onSelectMember(m)} index={i + 6} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const SectionLabel = ({ theme, label }) => (
  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-3">
    <div className="w-8 h-[3px] rounded-full" style={{ backgroundColor: theme.main }}></div> {label}
  </h3>
);

const MemberCard = ({ member, theme, onClick, index, isExec, compact }) => (
  <div onClick={onClick}
    className={`
         group bg-white cursor-pointer transition-all duration-300 border border-slate-100 hover:border-slate-200 hover:shadow-xl
         ${isExec ? 'p-4 rounded-[2rem] flex items-center gap-5 border-l-[6px]' : 'p-3 rounded-2xl flex items-center gap-4'}
         ${compact ? 'border shadow-sm' : ''}
       `}
    style={{ borderLeftColor: isExec ? theme.main : undefined }}>
    <div className={`relative overflow-hidden bg-slate-100 shrink-0 ${isExec ? 'w-24 h-24 rounded-2xl shadow-md' : 'w-16 h-16 rounded-xl'}`}>
      {index && (
        <div className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] z-10 shadow-sm" style={{ backgroundColor: theme.main }}>
          {index}
        </div>
      )}
      <MemberImage url={member.imageUrl} />
    </div>
    <div className="min-w-0 flex-1">
      <h4 className={`font-black text-slate-800 truncate ${isExec ? 'text-lg' : 'text-sm'}`}>{member.name}</h4>
      <p className={`font-bold truncate opacity-60 ${isExec ? 'text-xs uppercase mb-1' : 'text-[10px]'}`} style={{ color: theme.main }}>{member.position}</p>
      {isExec && <div className="text-[10px] font-bold text-slate-300 group-hover:text-slate-500 transition-colors">PROFILE +</div>}
    </div>
  </div>
);

// --- MAIN CONTENT CONTROLLER ---

function PartyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyIdFromUrl = searchParams.get('id');
  const source = searchParams.get('source');

  const [activeParty, setActiveParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);

  const listSectionRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/party');
        if (res.ok) {
          const allParties = await res.json();
          const validParties = allParties.filter(p => parseInt(p.number) > 0);
          let targetParty = null;

          if (validParties.length === 1) {
            targetParty = validParties[0];
          } else if (partyIdFromUrl) {
            targetParty = validParties.find(p => p.number == partyIdFromUrl || p.id == partyIdFromUrl);
          }

          if (targetParty) {
            if (partyIdFromUrl !== String(targetParty.number)) {
              const newParams = new URLSearchParams(searchParams.toString());
              newParams.set('id', targetParty.number);
              router.replace(`?${newParams.toString()}`, { scroll: false });
            }

            // ✅ ใช้ preparePartyData แทน enrichPartyData เพื่อจัดการข้อมูลจริง
            const enrichedParty = preparePartyData(targetParty);
            const filledMembers = POSITION_ORDER.map(pos => {
              const found = enrichedParty.members?.find(m => m.position === pos);
              return found ? { ...found, isPlaceholder: false } : {
                id: `empty-${pos}`, name: "ยังไม่มีผู้สมัคร", position: pos,
                imageUrl: null, studentId: "-", isPlaceholder: true
              };
            });
            const extraMembers = enrichedParty.members?.filter(m => !POSITION_ORDER.includes(m.position)) || [];
            enrichedParty.chartMembers = [...filledMembers, ...extraMembers];

            setActiveParty(enrichedParty);
          } else {
            router.push("/candidates");
          }
        } else {
          router.push("/candidates");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [partyIdFromUrl, router, searchParams]);

  useEffect(() => {
    if (!activeParty?.id) return;
    fetch(`/api/gallery?id=${activeParty.id}`)
      .then(res => res.json())
      .then(data => { if (data.images?.length > 0) setGalleryImages(data.images); });
  }, [activeParty]);

  const currentTheme = activeParty ? (PARTY_THEMES[activeParty.id] || PARTY_THEMES[activeParty.number] || DEFAULT_THEME) : DEFAULT_THEME;

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-10 h-10 text-purple-600" /></div>;
  if (!activeParty) return null;

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-800 bg-[#Fdfdfd] overflow-x-hidden">
      <div className="fixed top-0 w-full z-[60] bg-white/80 backdrop-blur-md border-b border-slate-100"><Navbar /></div>

      <main className="flex-1 flex flex-col pt-12 md:pt-16">

        {/* 1. Banner */}
        <PartyBanner
          party={activeParty}
          theme={currentTheme}
          galleryImages={galleryImages}
          onOpenLightbox={() => setIsLightBoxOpen(true)}
        />

        {/* 2. Vision & Policies (UP) */}
        <PartyVisionSection party={activeParty} theme={currentTheme} />

        {/* 3. Chart (DOWN) */}
        <PartyChartSection
          party={activeParty}
          theme={currentTheme}
          onSelectMember={setSelectedMember}
          onScrollToList={() => listSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
        />

        {/* 4. List */}
        <div ref={listSectionRef}>
          <CandidateList members={activeParty.members} theme={currentTheme} onSelectMember={setSelectedMember} />
        </div>

      </main>

      {isLightBoxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <button onClick={() => setIsLightBoxOpen(false)} className="absolute top-10 right-6 z-[110] p-3 bg-white/10 rounded-full text-white hover:bg-white/20"><X size={28} /></button>
          <img src={galleryImages[0]} className="max-w-full max-h-[85vh] object-contain shadow-2xl" alt="Lightbox" />
        </div>
      )}

      <CandidateModal
        member={selectedMember}            
        onClose={() => setSelectedMember(null)} 
        themeColor={currentTheme.main}
      />

      {source === 'vote' && <BackToVoteBar />}

      <footer className="w-full py-6 bg-white border-t border-slate-100 text-center relative z-50 mt-auto">
        <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">© FMS@PSU 2026. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default function PartyPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-10 h-10 text-purple-600" /></div>}>
      <PartyContent />
    </Suspense>
  );
}

function MemberImage({ url }) {
  const [error, setError] = useState(false);
  if (error || !url) return <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><User className="w-1/2 h-1/2" /></div>;
  return <img src={url} className="w-full h-full object-cover" onError={() => setError(true)} alt="member" loading="lazy" />;
}