'use client';

// /template-preview — a READ-ONLY, auth-free render of any template's page
// layout with mock data. Powers the "ดูรายละเอียด" gallery in PageDesignTab:
// the gallery iframes this route per page/variant so admins see the REAL
// layout components (always in sync with code — never a stale screenshot)
// before applying a template.
//
//   ?slug=studio-dark&page=results&variant=revealed
//
// slug    = template slug (classic family slugs all render the classic layout)
// page    = home | candidates | party | vote | results | success | closed
// variant = results: locked|revealed · vote: multi|single  (optional)
//
// NOTE: not the editor and not the live site — pure presentation with dummy
// data. Auth-gated pages (vote/results/success) render here WITHOUT a session
// because the layout components are pure + we pass mock props.

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import HomeRenderer from '../../components/home/HomeRenderer';
import { BUILT_IN_TEMPLATES } from '../../components/admin/editor/templates';

import GumroadCandidates from '../../components/vote/GumroadCandidates';
import GumroadParty from '../../components/vote/GumroadParty';
import GumroadVote from '../../components/vote/GumroadVote';
import GumroadResults from '../../components/vote/GumroadResults';
import GumroadSuccess from '../../components/vote/GumroadSuccess';
import GumroadClosed from '../../components/vote/GumroadClosed';

import StudioDarkCandidates from '../../components/vote/StudioDarkCandidates';
import StudioDarkParty from '../../components/vote/StudioDarkParty';
import StudioDarkVote from '../../components/vote/StudioDarkVote';
import StudioDarkResults from '../../components/vote/StudioDarkResults';
import StudioDarkSuccess from '../../components/vote/StudioDarkSuccess';
import StudioDarkClosed from '../../components/vote/StudioDarkClosed';

import CandidatesEditorPreview from '../../components/admin/CandidatesEditorPreview';
import VoteEditorPreview from '../../components/admin/VoteEditorPreview';
import ResultsEditorPreview from '../../components/admin/ResultsEditorPreview';
import ClosedEditorPreview from '../../components/admin/ClosedEditorPreview';

import { DUMMY_ELECTION, DUMMY_USER } from '../../utils/editorDummyData';

// ── mock data shaped for the real layout components ──────────────────────────
const LOGO = '/images/logo/fms_logo50_color.png';
const mkMembers = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1, number: i + 1, name: `สมาชิกพรรค คนที่ ${i + 1}`,
    position: i === 0 ? 'President' : i < 5 ? 'Core Exec' : 'Dept Head', imageUrl: null,
  }));
const POLICIES = [
  'ยกระดับโครงการรับน้องและกิจกรรมเปิดใหม่ ให้สะท้อนความหลากหลายของนักศึกษาในศตวรรษที่ 21',
  'ส่งเสริมกิจกรรมความหลากหลาย เปิดโอกาสให้นักศึกษามีส่วนร่วม และเสริมสร้างศักยภาพผ่านชมรม',
  'เปิดพื้นที่พบปะแลกเปลี่ยน เพื่อนำพาเยาวชนสู่อนาคตที่สดใสและเข้าใจซึ่งกันและกัน',
  'สร้างเวทีสำหรับคนรุ่นใหม่ เพื่อความหลากหลายทางความคิด ให้เกิดการพัฒนาในทุกกิจกรรม',
];
const MISSIONS = [
  'รวมพลังความหลากหลายของนักศึกษาให้เป็นหนึ่งเดียว เพื่อขับเคลื่อนสโมสรนักศึกษา',
  'สร้างความเปลี่ยนแปลงที่ยั่งยืนให้แก่คณะวิทยาการจัดการ รุ่นที่ 50',
];
const mkParty = (i, name, slogan, color) => ({
  id: i, number: i, name, slogan, color,
  logoUrl: LOGO, groupImageUrls: null, officialImageUrl: null, mobileHeroImage: null,
  logoMeaning:
    'The Unity Concord of FMS 2 สะท้อนความหลากหลายของนักศึกษาที่กลับมารวมเป็นหนึ่ง เพื่อร่วมขับเคลื่อนกิจกรรมและพัฒนาสโมสรนักศึกษาคณะวิทยาการจัดการ',
  missions: MISSIONS, policies: POLICIES, members: mkMembers(i === 1 ? 17 : 6),
});
const PARTIES = [
  mkParty(1, 'The Unity Concord Of FMS 2', 'หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน', '#2D6CDF'),
  mkParty(2, 'พรรคก้าวไกลวิทยาการจัดการ', 'นโยบายเด่น มุ่งมั่น โปร่งใส เพื่อชาว FMS', '#E0457B'),
];
const SPECIAL = {
  abstain: { id: 998, number: 0, name: 'งดออกเสียง' },
  disapprove: { id: 999, number: -1, name: 'ไม่รับรอง' },
};
const DEMOGRAPHICS = {
  totalEligible: 2004,
  byYear: [
    { name: 'ปี 1', value: 145 }, { name: 'ปี 2', value: 132 },
    { name: 'ปี 3', value: 118 }, { name: 'ปี 4', value: 105 },
  ],
  byGender: [{ name: 'หญิง', value: 266 }, { name: 'ชาย', value: 234 }],
  byMajor: [
    { name: 'บัญชี', value: 142 }, { name: 'การเงิน', value: 98 },
    { name: 'การจัดการ', value: 87 }, { name: 'การตลาด', value: 73 },
    { name: 'ระบบสารสนเทศ', value: 56 },
  ],
};
const resultsCandidates = (revealed) => [
  { ...PARTIES[0], score: revealed ? 312 : 0 },
  { ...PARTIES[1], score: revealed ? 245 : 0 },
  { id: 998, number: 0, name: 'งดออกเสียง', score: revealed ? 68 : 0 },
];

const noop = () => {};

function PreviewBody() {
  const sp = useSearchParams();
  const slug = sp.get('slug') || 'classic';
  const page = sp.get('page') || 'home';
  const variant = sp.get('variant') || '';
  const family = BUILT_IN_TEMPLATES[slug]?.layoutFamily || 'classic';

  // ── HOME — HomeRenderer dispatches by template slug for every family ──
  if (page === 'home') {
    return (
      <HomeRenderer
        editorMode
        editorData={DUMMY_ELECTION}
        resolvedTemplate={BUILT_IN_TEMPLATES[slug] || BUILT_IN_TEMPLATES.classic}
        initialData={{ systemMode: 'AUTO', electionStatus: 'ONGOING', stats: { totalVoted: 342, totalEligible: 1200 }, candidates: PARTIES }}
      />
    );
  }

  // ── studio-dark / gumroad — render the real layout component w/ mock props ──
  if (family === 'studio-dark' || family === 'gumroad') {
    const isStudio = family === 'studio-dark';
    const single = variant === 'single';
    const revealed = variant === 'revealed';
    const voteParties = single ? [PARTIES[0]] : PARTIES;

    if (page === 'candidates') {
      const C = isStudio ? StudioDarkCandidates : GumroadCandidates;
      return <C candidates={PARTIES} editorMode />;
    }
    if (page === 'party') {
      const P = isStudio ? StudioDarkParty : GumroadParty;
      return <P party={PARTIES[0]} galleryImages={[]} showBackToVote={false} />;
    }
    if (page === 'vote') {
      const V = isStudio ? StudioDarkVote : GumroadVote;
      return (
        <V
          regularParties={voteParties}
          specialOptions={SPECIAL}
          selectedPartyId={null}
          onSelect={noop}
          onViewDetails={noop}
          isSingleParty={single}
          user={DUMMY_USER}
          onConfirm={noop}
          isSubmitting={false}
          editorMode
        />
      );
    }
    if (page === 'results') {
      const R = isStudio ? StudioDarkResults : GumroadResults;
      return (
        <R
          candidates={resultsCandidates(revealed)}
          totalVotes={revealed ? 625 : 0}
          demographics={DEMOGRAPHICS}
          finalStatus={revealed ? 'ENDED' : 'WAITING'}
          isRevealed={revealed}
          isNotStarted={!revealed}
          countdownText={revealed ? '' : 'เหลืออีก 02:14:33'}
          onSelectParty={noop}
        />
      );
    }
    if (page === 'success') {
      const S = isStudio ? StudioDarkSuccess : GumroadSuccess;
      return <S user={DUMMY_USER} isUnlocked={false} onOpenForm={noop} editorMode />;
    }
    if (page === 'closed') {
      const Cl = isStudio ? StudioDarkClosed : GumroadClosed;
      return <Cl title="ยังไม่เปิดรับลงคะแนน" desc="ขณะนี้ยังไม่ถึงเวลาเริ่มการเลือกตั้ง" variant="waiting" session={null} onLogout={noop} />;
    }
  }

  // ── classic family — reuse the existing editor-preview components ──
  if (page === 'candidates') return <CandidatesEditorPreview pageLayout={null} elementConfigs={{}} />;
  if (page === 'vote') return <VoteEditorPreview simMode={variant === 'single' ? 'single' : 'multi'} pageLayout={null} elementConfigs={{}} />;
  if (page === 'results') return <ResultsEditorPreview simMode="multi" />;
  if (page === 'closed') return <ClosedEditorPreview simMode="waiting" />;

  // classic party / success have no dedicated preview component yet
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F8F9FD', color: '#64748b', fontFamily: 'system-ui', padding: 24, textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94a3b8' }}>ตัวอย่างหน้านี้</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>พรีวิวหน้า “{page}” สำหรับธีมคลาสสิกยังไม่พร้อม</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>เลือก Gumroad หรือ Studio Dark เพื่อดูหน้านี้แบบเต็ม</div>
      </div>
    </div>
  );
}

export default function TemplatePreviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fff' }} />}>
      <PreviewBody />
    </Suspense>
  );
}
