"use client";

// PagePreviewRenderer — visual mini-versions ของแต่ละหน้า สำหรับ live preview ใน admin
// รับ pageLayout (state สด) → re-render ทันทีเมื่อ config เปลี่ยน
// HomePreview ใช้ BlockRenderer จริง  ส่วนหน้าอื่นใช้ inline mockup คุณภาพสูง

import { Ban, Check, Users, Trophy, BarChart3, CheckCircle, Vote, Sparkles, Calendar, ExternalLink } from 'lucide-react';
import { useGlobalConfig } from '../../../contexts/GlobalConfigContext';
import HeroBlock from '../../blocks/HeroBlock';
import StatsBlock from '../../blocks/StatsBlock';
import MeetCandidatesBlock from '../../blocks/MeetCandidatesBlock';
import ElectionBannerBlock from '../../blocks/ElectionBannerBlock';
import VoteCTABlock from '../../blocks/VoteCTABlock';
import MultiPartyView from '../../vote/MultiPartyView';
import CandidatesPage from '../../../app/candidates/page';
import SuccessPage from '../../../app/success/page';
import { DUMMY_ELECTION } from '../../../utils/editorDummyData';

const HOME_BLOCK_MAP = {
  hero:           HeroBlock,
  stats:          StatsBlock,
  meetCandidates: MeetCandidatesBlock,
  electionBanner: ElectionBannerBlock,
  voteCTA:        VoteCTABlock,
};

const HOME_BLOCK_LABEL = {
  hero:           'Hero',
  stats:          'Stats',
  meetCandidates: 'Meet Candidates',
  electionBanner: 'Election Banner',
  voteCTA:        'Vote CTA',
};

// ─── Dummy data ────────────────────────────────────────────────

const DUMMY_PARTIES = [
  { id: 1, number: 1, name: 'The Unity Concord Of FMS 2', slogan: 'หลากเอกลักษณ์ รวมเป็นหนึ่ง', logoUrl: null },
  { id: 2, number: 2, name: 'อะไรไม่รู้ครับ',              slogan: 'ทดสอบ',                     logoUrl: null },
];

const DUMMY_RESULTS = [
  { name: 'The Unity Concord', number: 1, score: 245, color: '#8A2680' },
  { name: 'อะไรไม่รู้ครับ',      number: 2, score: 187, color: '#2563EB' },
  { name: 'งดออกเสียง',          number: 0, score: 68,  color: '#F59E0B' },
];

const DUMMY_HOME_DATA = {
  session: null,
  isVotedReal: false,
  isCheckingVoted: false,
  initialData: { stats: { totalEligible: 1200, totalVoted: 342 } },
  stats: { totalEligible: 1200, totalVoted: 342, percentage: '28.50' },
};

// ─── Main entry ────────────────────────────────────────────────

export default function PagePreviewRenderer({ pageId, pageLayout, deviceMode = 'desktop', hoveredSection = null, ...editorProps }) {
  const theme = pageLayout?.theme || {};
  const primaryColor = theme.primaryColor || '#8A2680';

  switch (pageId) {
    case 'home':       return <HomePreview pageLayout={pageLayout} primaryColor={primaryColor} hoveredSection={hoveredSection} />;
    case 'vote':
      return (
        <div className="bg-[#F8F9FD] min-h-[800px] p-8">
          <MultiPartyView
            editorMode={true} 
            regularParties={DUMMY_PARTIES}
            specialOptions={{ abstain: { id: 998, number: 0, name: 'งดออกเสียง' } }}
            selectedPartyId={null}
            onSelect={() => { }}
            onViewDetails={() => { }}
            config={pageLayout?.vote?.multiParty || {}}
            pageLayout={pageLayout}
            elementConfigs={editorProps.elementConfigs || pageLayout?.elementConfigs?.home || {}}
            selectedElement={editorProps.selectedElement}
            hoveredElement={editorProps.hoveredElement}
            onSelectElement={editorProps.onSelectElement}
            onHoverElement={editorProps.onHoverElement}
            onHoverEnd={editorProps.onHoverEnd}
          />
        </div>
      );
    case 'results':    return <ResultsPreview primaryColor={primaryColor} />;
    case 'candidates':
      return (
        <CandidatesPage
          editorMode={true}
          candidates={DUMMY_PARTIES}
          pageLayout={pageLayout}
        />
      );
    case 'party':      return <PartyPreview primaryColor={primaryColor} />;
    case 'success':
      return (
        <SuccessPage
          editorMode={true}
          pageLayout={pageLayout}
          elementConfigs={editorProps.elementConfigs || pageLayout?.elementConfigs?.home || {}}
          selectedElement={editorProps.selectedElement}
          hoveredElement={editorProps.hoveredElement}
          onSelectElement={editorProps.onSelectElement}
          onHoverElement={editorProps.onHoverElement}
          onHoverEnd={editorProps.onHoverEnd}
        />
      );
    default:           return <div className="p-8 text-center text-slate-400">Unknown page: {pageId}</div>;
  }
}

// ─── Home ──────────────────────────────────────────────────────

function HoverOverlay({ label }) {
  return (
    <div className="absolute inset-0 border-2 border-dashed border-[#8A2680]/60 rounded-xl pointer-events-none z-40 bg-[#8A2680]/5">
      <span className="absolute -top-3 left-3 text-[10px] font-bold text-white bg-[#8A2680] px-2 py-0.5 rounded shadow-md">
        {label}
      </span>
    </div>
  );
}

function HomePreview({ pageLayout, primaryColor }) {
  const globalConfig = useGlobalConfig();
  const calendarYear = globalConfig.electionCalendarYear ?? 2026;
  const nextYear = Number(calendarYear) + 1;
  return (
    <div className="bg-[#F8F9FD] min-h-[800px]">
      {/* Mock Navbar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: primaryColor }} />
          <span className="text-[10px] font-bold text-slate-600">FMS PSU</span>
        </div>
        <div className="flex gap-3">
          <span className="text-[8px] text-slate-400">หน้าแรก</span>
          <span className="text-[8px] text-slate-400">ผลคะแนน</span>
          <span className="text-[8px] text-slate-400">Meet Candidates</span>
        </div>
      </div>

      {/* 2-column layout matching real HomeContent */}
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-[1fr,minmax(300px,35%)] gap-6">

          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* Hero */}
            <div className="py-8">
              <div className="inline-flex px-3 py-1 rounded-full bg-purple-50 border border-purple-200 mb-3">
                <span className="text-[9px] font-bold" style={{ color: primaryColor }}>SEE YOU {nextYear}</span>
                <span className="text-[9px] text-slate-500 ml-2">296D : 21H : 47M</span>
              </div>
              <h1 className="text-5xl font-black text-slate-900 leading-none">{globalConfig.electionNamePrefix}<span style={{ color: primaryColor }}>{globalConfig.electionNumber}</span></h1>
              <p className="text-sm mt-3">โครงการเลือกตั้ง<span className="font-bold" style={{ color: primaryColor }}>{globalConfig.committeeName}</span></p>
              <p className="text-xs text-slate-500">{globalConfig.organizationName}</p>
              <div className="inline-flex px-3 py-1 rounded-full border border-slate-200 mt-3">
                <span className="text-[9px] text-slate-500">ประจำปีการศึกษา {globalConfig.academicYearTh}</span>
              </div>
            </div>

            {/* Vote CTA */}
            <div>
              <button
                className="px-6 py-3 rounded-xl text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                เข้าสู่ระบบ / Sign In
              </button>
            </div>

            {/* Meet Candidates */}
            <div className="bg-white rounded-2xl border border-pink-100 p-4">
              <span className="text-[9px] font-bold" style={{ color: primaryColor }}>FMS ELECTION {calendarYear}</span>
              <p className="text-sm font-bold mt-1">รู้จักผู้สมัครของคุณหรือยัง?</p>
              <div className="mt-2 inline-flex px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-bold">
                ดูรายชื่อพรรค →
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* Stats */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                📊 สถิติผู้เข้าร่วมลงคะแนนโหวต
              </p>
              <div
                className="rounded-2xl p-4 text-white text-center"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
              >
                <p className="text-[9px]">ใช้สิทธิ์แล้ว (VOTED)</p>
                <p className="text-3xl font-black">342 <span className="text-sm">คน</span></p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-white rounded-xl border border-slate-100 p-3">
                  <p className="text-[8px] text-slate-400">ความคืบหน้า</p>
                  <p className="text-lg font-black text-slate-800">28.50 <span className="text-[9px]">%</span></p>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-3">
                  <p className="text-[8px] text-slate-400">ผู้มีสิทธิ์รวม</p>
                  <p className="text-lg font-black text-slate-800">1,200 <span className="text-[9px]">คน</span></p>
                </div>
              </div>
            </div>

            {/* Election Banner */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 h-[200px] flex items-center justify-center">
              <p className="text-white font-black text-xl">เลือกตั้ง</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vote ──────────────────────────────────────────────────────

function VotePreview({ config, primaryColor }) {
  const globalConfig = useGlobalConfig();
  const {
    gridCols = 'auto',
    cardVariant = 'auto',
    showDivider = true,
    abstainStyle = 'auto',
  } = config;

  return (
    <div className="bg-[#F8F9FD] min-h-[800px] p-8">
      <div className="text-center mb-8">
        <div
          className="inline-block text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
        >
          ● กำลังเปิดรับโหวต
        </div>
        <h1 className="text-3xl font-black text-slate-800">
          เลือกตั้ง<span style={{ color: primaryColor }}>{globalConfig.organizationShort}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-2">เลือกพรรคที่คุณต้องการสนับสนุน</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <MultiPartyView
          regularParties={DUMMY_PARTIES}
          specialOptions={{ abstain: { id: 998, number: 0, name: 'งดออกเสียง' } }}
          selectedPartyId={null}
          onSelect={() => {}}
          onViewDetails={() => {}}
          config={{ gridCols, cardVariant, showDivider, abstainStyle }}
        />
      </div>

      {/* Config indicator chip — แสดงให้เห็นว่า real-time */}
      <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
        <ConfigChip label={`grid: ${gridCols}`} />
        <ConfigChip label={`card: ${cardVariant}`} />
        <ConfigChip label={`divider: ${showDivider ? 'on' : 'off'}`} />
        <ConfigChip label={`abstain: ${abstainStyle}`} />
      </div>
    </div>
  );
}

function ConfigChip({ label }) {
  return (
    <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full">
      {label}
    </span>
  );
}

// ─── Results ───────────────────────────────────────────────────

function ResultsPreview({ primaryColor }) {
  const total = DUMMY_RESULTS.reduce((s, r) => s + r.score, 0);
  const maxScore = Math.max(...DUMMY_RESULTS.map((r) => r.score));

  return (
    <div className="bg-[#F8F9FD] min-h-[800px] p-8">
      <div className="text-center mb-8">
        <Trophy className="w-10 h-10 mx-auto mb-2" style={{ color: primaryColor }} />
        <h1 className="text-3xl font-black text-slate-800">ผลการลงคะแนนเสียง</h1>
        <p className="text-sm text-slate-500 mt-1">
          รวม <span className="font-bold" style={{ color: primaryColor }}>{total}</span> คะแนน
        </p>
      </div>

      <div className="space-y-4 max-w-xl mx-auto">
        {DUMMY_RESULTS.map((r, i) => {
          const pct = ((r.score / total) * 100).toFixed(1);
          const widthPct = (r.score / maxScore) * 100;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black shadow-md"
                    style={{ backgroundColor: r.color }}
                  >
                    {r.number}
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{r.name}</span>
                </div>
                <span className="font-black text-2xl" style={{ color: r.color }}>
                  {r.score}
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${widthPct}%`, backgroundColor: r.color }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">คะแนน</span>
                <span className="text-xs font-bold" style={{ color: r.color }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Party ─────────────────────────────────────────────────────

function PartyPreview({ primaryColor }) {
  return (
    <div className="bg-slate-900 min-h-[800px] text-white">
      {/* Hero */}
      <div className="relative h-[320px] overflow-hidden flex items-end p-10 bg-gradient-to-br from-slate-800 via-slate-900 to-black">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
             style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #2563EB, transparent)' }} />

        <div className="relative z-10">
          <div className="text-[10px] font-bold tracking-[0.3em] mb-3 uppercase" style={{ color: `${primaryColor}cc` }}>
            ● Official Party Page
          </div>
          <h1 className="text-5xl font-black tracking-tight">The Unity Concord</h1>
          <p className="text-slate-300 mt-3 text-base italic">หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-10 space-y-6 relative">
        {/* Mission */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: `${primaryColor}ee` }}>
              พันธกิจ
            </h2>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            ส่งเสริมกิจกรรมนักศึกษาอย่างสร้างสรรค์ พัฒนาศักยภาพรอบด้าน
            สร้างชุมชนที่อบอุ่น และเป็นเวทีให้นักศึกษาแสดงออกอย่างเต็มที่
          </p>
        </div>

        {/* Policy */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: `${primaryColor}ee` }}>
              นโยบาย
            </h2>
          </div>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
              พัฒนาคุณภาพชีวิตนักศึกษาให้ดียิ่งขึ้น
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
              เพิ่มสวัสดิการและพื้นที่กิจกรรม
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
              ส่งเสริมความคิดสร้างสรรค์และนวัตกรรม
            </li>
          </ul>
        </div>

        {/* Members grid */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: `${primaryColor}ee` }}>
              สมาชิกทีม
            </h2>
          </div>
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full border-2"
                  style={{
                    borderColor: `${primaryColor}66`,
                    background: `linear-gradient(135deg, ${primaryColor}33, transparent)`,
                  }}
                />
                <div className="w-10 h-1 bg-white/20 rounded-full mt-2" />
                <div className="w-8 h-0.5 bg-white/10 rounded-full mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}