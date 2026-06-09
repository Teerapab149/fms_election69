'use client';
import { getPath } from "../../utils/basePath";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, ChevronRight, Loader2, Sparkles, Megaphone } from 'lucide-react';
import Navbar from "../../components/Navbar";
import { PARTY_THEMES, DEFAULT_THEME } from '../../utils/PartyTheme';

import EditorElement from '../../components/admin/editor/EditorElement';
import { SIZE_MAP, RADIUS_MAP, WEIGHT_MAP } from '../../utils/styleMaps';
import SiteFooter from '../../components/SiteFooter';
import PageThemeOverrides from '../../components/PageThemeOverrides';
import GumroadCandidates from '../../components/vote/GumroadCandidates';
import { useGlobalConfig } from '../../contexts/GlobalConfigContext';

export default function CandidatesPage({
  candidates: editorCandidates = null,
  editorMode = false,
  pageLayout = null,
  elementConfigs = null,
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  const router = useRouter();
  const globalConfig = useGlobalConfig();
  const [parties, setParties] = useState(editorMode ? (editorCandidates || []) : []);
  const [loading, setLoading] = useState(!editorMode);
  const [apiLayout, setApiLayout] = useState(null);

  // Active template — drives the per-page LAYOUT dispatch (gumroad has its own).
  const [activeTemplateId, setActiveTemplateId] = useState('classic');
  const [templateReady, setTemplateReady] = useState(false);
  const isGumroad = activeTemplateId === 'gumroad';

  const Wrap = ({ id, children }) => editorMode ? (
    <EditorElement
      id={id}
      config={elementConfigs?.[id]}
      isSelected={selectedElement === id}
      isHovered={hoveredElement === id}
      onSelect={onSelectElement}
      onHover={onHoverElement}
      onHoverEnd={onHoverEnd}
    >{children}</EditorElement>
  ) : children;

  const cfg = (id, defaults = {}) => editorMode
    ? { ...defaults, ...(elementConfigs?.[id]?.config || {}) }
    : defaults;

  useEffect(() => {
    if (editorMode) { setTemplateReady(true); return; }
    if (pageLayout) { setTemplateReady(true); return; }
    fetch(getPath("/api/admin/page-layout"))
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.candidates) setApiLayout(data.candidates);
        if (data?.activeTemplateId) setActiveTemplateId(data.activeTemplateId);
      })
      .catch(e => console.error(e))
      .finally(() => setTemplateReady(true));
  }, [editorMode, pageLayout]);

  useEffect(() => {
    if (editorMode) {
      if (editorCandidates) setParties(editorCandidates);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(getPath('/api/party'));
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
  }, [router, editorMode, editorCandidates]);

  const defaultLayout = [
    { type: 'header', visible: true, order: 1 },
    { type: 'partyCardGrid', visible: true, order: 2 }
  ];

  let activeLayout = pageLayout?.candidates || apiLayout || defaultLayout;
  activeLayout = [...activeLayout].sort((a, b) => a.order - b.order);

  const isVisible = (index) => {
    if (!activeLayout || !activeLayout[index]) return true;
    return activeLayout[index].visible !== false;
  };

  if (loading || (!editorMode && !templateReady)) return (
    <div className="h-screen flex items-center justify-center bg-[#F8F9FD]">
      <Loader2 className="animate-spin w-10 h-10 text-[var(--color-primary)]" />
    </div>
  );

  // GUMROAD layout (own topbar/footer) — replaces the classic page entirely.
  if (isGumroad) {
    return (
      <>
        {!editorMode && <PageThemeOverrides page="candidates" />}
        <GumroadCandidates candidates={parties} editorMode={editorMode} />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F8F9FD] text-slate-900 relative overflow-x-hidden">
      {!editorMode && <PageThemeOverrides page="candidates" />}

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] md:w-[40%] h-[40%] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[50%] md:w-[35%] h-[35%] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px]"></div>
      </div>

      <div className="relative z-50">
        <Navbar />
      </div>

      <main className="flex-grow relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16 py-8 md:py-16">

        {isVisible(0) && (
          <div className="text-center mb-10 md:mb-20 space-y-4 md:space-y-6 animate-fade-in-up">

            <Wrap id="candidates-tagline">
              <div data-element="candidates-tagline" className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md shadow-sm transition-transform hover:scale-105"
                style={{
                  backgroundColor: cfg('candidates-tagline').backgroundColor || 'var(--ctl-bg, rgba(255,255,255,0.8))',
                  border: `1px solid ${cfg('candidates-tagline').borderColor || 'var(--ctl-border, #f3e8ff)'}`
                }}>
                <Sparkles className="w-4 h-4" style={{ color: cfg('candidates-tagline').textColor || 'var(--ctl-accent, var(--color-primary))' }} />
                <span className="text-[10px] md:text-xs font-black tracking-[0.15em] uppercase"
                  style={{ color: cfg('candidates-tagline').textColor || 'var(--ctl-accent, var(--color-primary))' }}>
                  {cfg('candidates-tagline').text || ('Candidates ' + globalConfig.electionCalendarYear)}
                </span>
              </div>
            </Wrap>

            <div className="max-w-4xl mx-auto">
              <Wrap id="candidates-title">
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1]"
                  style={{
                    color: cfg('candidates-title').color || '#0f172a',
                    fontSize: SIZE_MAP[cfg('candidates-title').fontSize] || undefined,
                  }}>
                  {cfg('candidates-title').text ? (
                    cfg('candidates-title').text
                  ) : (
                    <>ทำความรู้จัก <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-purple-500">ผู้สมัคร</span></>
                  )}
                </h1>
              </Wrap>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Wrap id="candidates-subtitle">
                  <p className="text-sm md:text-xl font-medium"
                    style={{
                      color: cfg('candidates-subtitle').color || '#64748b',
                      fontSize: SIZE_MAP[cfg('candidates-subtitle').fontSize] || undefined,
                    }}>
                    {cfg('candidates-subtitle').text || 'ร่วมเป็นส่วนหนึ่งในการกำหนดอนาคต เลือกคนที่ใช่ พรรคที่ชอบ'}
                  </p>
                </Wrap>

                <Wrap id="candidates-counter">
                  <div data-element="candidates-counter" className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                    style={{
                      backgroundColor: cfg('candidates-counter').backgroundColor || 'var(--cc-bg, rgba(138, 38, 128, 0.1))',
                      border: `1px solid ${cfg('candidates-counter').borderColor || 'var(--cc-border, rgba(138, 38, 128, 0.2))'}`
                    }}>
                    <Megaphone className="w-4 h-4" style={{ color: cfg('candidates-counter').textColor || 'var(--cc-accent, var(--color-primary))' }} />
                    <span className="text-sm md:text-base font-bold" style={{ color: cfg('candidates-counter').textColor || 'var(--cc-accent, var(--color-primary))' }}>
                      {cfg('candidates-counter').text || `ในปีนี้มีทั้งหมด ${parties.length} พรรค`}
                    </span>
                  </div>
                </Wrap>
              </div>
            </div>
          </div>
        )}

        {isVisible(1) && (
          <>
            {parties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 pb-24">
                {parties.map((party, index) => {
                  const cardInner = <PartyCard party={party} cfg={cfg} />;
                  return (
                    <div
                      key={party.id || index}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
                    >
                      {index === 0 && editorMode ? (
                        <Wrap id="candidates-party-card">{cardInner}</Wrap>
                      ) : cardInner}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 md:py-32 bg-white/50 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700">ยังไม่มีข้อมูลผู้สมัคร</h3>
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter className="relative z-50 shrink-0 w-full mt-auto" />

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

function PartyCard({ party, cfg }) {
  const [coverImage, setCoverImage] = useState(null);
  const theme = PARTY_THEMES[party.number] || DEFAULT_THEME;

  useEffect(() => {
    const fetchPartyGallery = async () => {
      try {
        const res = await fetch(getPath(`/api/gallery?id=${party.id}`));
        if (res.ok) {
          const data = await res.json();
          if (data.images && data.images.length > 0) {
            setCoverImage(data.images[0].imageUrl || data.images[0]);
          }
        }
      } catch (error) { console.error(error); }
    };
    if (party.id) {
      fetchPartyGallery();
    }
  }, [party.id]);

  const borderRadius = cfg ? RADIUS_MAP[cfg('candidates-party-card').borderRadius] || '2.5rem' : '2.5rem';

  return (
    <Link href={`/party?id=${party.number}`} className="group block h-full">
      <div
        className="relative flex flex-col h-full bg-white overflow-hidden transition-all duration-500 border border-slate-100 shadow-sm hover:-translate-y-2 hover:shadow-2xl"
        style={{
          '--hover-glow': `${theme.main}15`,
          borderRadius: borderRadius
        }}
      >
        <div className="relative aspect-[16/9] sm:aspect-video overflow-hidden">
          {coverImage ? (
            <img
              src={getPath(coverImage)}
              alt="Cover"
              className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <Users className="w-12 h-12 text-slate-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-40 group-hover:opacity-60 transition-opacity"></div>

          <div
            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-xl md:text-3xl font-black text-white shadow-lg backdrop-blur-sm border border-white/20 transition-all group-hover:rotate-6"
            style={{
              backgroundColor: theme.main,
              borderRadius: cfg ? RADIUS_MAP[cfg('candidates-party-card').borderRadius] || '1rem' : '1rem'
            }}
          >
            {party.number}
          </div>
        </div>

        <div className="p-5 md:p-8 lg:p-10 relative flex flex-col flex-1">
          <div className="flex items-start gap-4 md:gap-8">
            <div className="relative -mt-16 md:-mt-24 shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 border-4 border-white bg-white shadow-xl overflow-hidden"
                style={{ borderRadius: cfg ? RADIUS_MAP[cfg('candidates-party-card').borderRadius] || '2rem' : '2rem' }}>
                <img src={getPath(party.logoUrl)} alt={party.name} className="w-full h-full object-cover" />
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