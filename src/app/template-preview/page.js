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

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, X, Minus } from 'lucide-react';
import { getPath } from '../../utils/basePath';

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

import VerdureCandidates from '../../components/vote/VerdureCandidates';
import VerdureParty from '../../components/vote/VerdureParty';
import VerdureVote from '../../components/vote/VerdureVote';
import VerdureSingleParty from '../../components/vote/VerdureSingleParty';
import VerdureResults from '../../components/vote/VerdureResults';
import VerdureSuccess from '../../components/vote/VerdureSuccess';
import VerdureClosed from '../../components/vote/VerdureClosed';

import CandidatesEditorPreview from '../../components/admin/CandidatesEditorPreview';
import VoteEditorPreview from '../../components/admin/VoteEditorPreview';
import ResultsEditorPreview from '../../components/admin/ResultsEditorPreview';
import ClosedEditorPreview from '../../components/admin/ClosedEditorPreview';
import SuccessPage from '../success/page';
import { ClassicPartyPreview } from '../party/page';

import { DUMMY_ELECTION, DUMMY_USER } from '../../utils/editorDummyData';
import { PARTIES, SPECIAL, DEMOGRAPHICS, resultsCandidates } from '../../utils/templatePreviewMocks';

const noop = () => {};

function PreviewBody() {
  const sp = useSearchParams();
  const slug = sp.get('slug') || 'classic';
  const page = sp.get('page') || 'home';
  const variant = sp.get('variant') || '';
  const chrome = sp.get('chrome') === '1';
  const family = BUILT_IN_TEMPLATES[slug]?.layoutFamily || 'classic';

  return (
    <>
      {renderPage()}
      {chrome && <PreviewToolbar slug={slug} page={page} variant={variant} />}
    </>
  );

  // eslint-disable-next-line no-inner-declarations
  function renderPage() {
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

  // ── studio-dark / gumroad / verdure — render the real layout component w/ mock props ──
  if (family === 'studio-dark' || family === 'gumroad' || family === 'verdure') {
    const single = variant === 'single';
    const revealed = variant === 'revealed';
    const voteParties = single ? [PARTIES[0]] : PARTIES;
    // pick the layout component for this family per page
    const byFamily = (studio, gumroad, verdure) =>
      family === 'studio-dark' ? studio : family === 'verdure' ? verdure : gumroad;

    if (page === 'candidates') {
      const C = byFamily(StudioDarkCandidates, GumroadCandidates, VerdureCandidates);
      return <C candidates={PARTIES} editorMode />;
    }
    if (page === 'party') {
      const P = byFamily(StudioDarkParty, GumroadParty, VerdureParty);
      return <P party={PARTIES[0]} galleryImages={[]} showBackToVote={false} />;
    }
    if (page === 'vote') {
      // dev-only: preview the Verdure single-party cinematic wax-seal intro in
      // isolation (no DB change, live election untouched). ?…&variant=single&intro=1
      if (family === 'verdure' && single && sp.get('intro') === '1') {
        return (
          <VerdureSingleParty party={PARTIES[0]} specialOptions={SPECIAL} selectedPartyId={null}
            onSelect={noop} onConfirm={noop} isSubmitting={false} user={DUMMY_USER} editorMode forceIntro />
        );
      }
      const V = byFamily(StudioDarkVote, GumroadVote, VerdureVote);
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
      const R = byFamily(StudioDarkResults, GumroadResults, VerdureResults);
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
      const S = byFamily(StudioDarkSuccess, GumroadSuccess, VerdureSuccess);
      return <S user={DUMMY_USER} isUnlocked={false} onOpenForm={noop} editorMode />;
    }
    if (page === 'closed') {
      const Cl = byFamily(StudioDarkClosed, GumroadClosed, VerdureClosed);
      return <Cl title="ยังไม่เปิดรับลงคะแนน" desc="ขณะนี้ยังไม่ถึงเวลาเริ่มการเลือกตั้ง" variant="waiting" session={null} onLogout={noop} />;
    }
  }

  // ── classic family (incl. original — its inner pages render the classic layout) ──
  if (page === 'candidates') return <CandidatesEditorPreview pageLayout={null} elementConfigs={{}} />;
  if (page === 'vote') return <VoteEditorPreview simMode={variant === 'single' ? 'single' : 'multi'} pageLayout={null} elementConfigs={{}} />;
  if (page === 'results') return <ResultsEditorPreview simMode={variant === 'single' ? 'single' : 'multi'} revealed={variant !== 'locked'} />;
  if (page === 'closed') return <ClosedEditorPreview simMode="waiting" />;
  if (page === 'party') return <ClassicPartyPreview party={PARTIES[0]} />;
  if (page === 'success') return <SuccessPage editorMode pageLayout={null} elementConfigs={{}} />;

  // unknown page
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F8F9FD', color: '#64748b', fontFamily: 'system-ui', padding: 24, textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94a3b8' }}>ตัวอย่างหน้านี้</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>ไม่รู้จักหน้า “{page}”</div>
      </div>
    </div>
  );
  }
}

// ── Floating preview toolbar (only when ?chrome=1 — i.e. opened "เปิดเต็มจอ", not
//    inside the chooser carousel iframes). Shows you're in preview, switches page +
//    variant (single/multi vote · ปิด/เปิดผล), and minimise/close. ──────────────
const PAGE_OPTS = [
  { v: 'home', l: 'หน้าแรก' }, { v: 'candidates', l: 'ผู้สมัคร' }, { v: 'party', l: 'ข้อมูลพรรค' },
  { v: 'vote', l: 'ลงคะแนน' }, { v: 'results', l: 'ผลคะแนน' }, { v: 'success', l: 'สำเร็จ' }, { v: 'closed', l: 'ปิดระบบ' },
];
const DEFAULT_VARIANT = { vote: 'multi', results: 'revealed' };

function PreviewToolbar({ slug, page, variant }) {
  const [open, setOpen] = useState(true);
  const name = BUILT_IN_TEMPLATES[slug]?.name || slug;
  const goto = (p, vr) => {
    window.location.href = getPath(`/template-preview?slug=${slug}&page=${p}${vr ? `&variant=${vr}` : ''}&chrome=1`);
  };
  const close = () => { try { window.close(); } catch {} };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[99999] inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/95 text-white text-xs font-bold shadow-2xl backdrop-blur ring-1 ring-white/10">
        <Eye className="w-4 h-4 text-amber-300" /> Preview
      </button>
    );
  }
  const seg = (cur, opts, p) => (
    <div className="flex items-center rounded-lg bg-white/10 p-0.5">
      {opts.map(([v, l]) => (
        <button key={v} onClick={() => goto(p, v)}
          className={`px-2.5 py-1 rounded-md transition-colors ${cur === v ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white'}`}>{l}</button>
      ))}
    </div>
  );

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-2 px-2.5 py-2 rounded-2xl bg-slate-900/95 text-white shadow-2xl backdrop-blur ring-1 ring-white/10 text-xs font-semibold max-w-[95vw] flex-wrap justify-center">
      <span className="inline-flex items-center gap-1.5 pl-1 text-amber-300"><Eye className="w-4 h-4" /> PREVIEW</span>
      <span className="text-white/50 truncate max-w-[110px]">{name}</span>
      <span className="w-px h-5 bg-white/15" />
      <select value={page} onChange={(e) => goto(e.target.value, DEFAULT_VARIANT[e.target.value])}
        className="bg-white/10 rounded-lg px-2 py-1.5 text-white outline-none cursor-pointer">
        {PAGE_OPTS.map((o) => <option key={o.v} value={o.v} className="text-slate-900">{o.l}</option>)}
      </select>
      {page === 'vote' && seg(variant || 'multi', [['multi', 'หลายพรรค'], ['single', 'พรรคเดียว']], 'vote')}
      {page === 'results' && seg(variant || 'revealed', [['locked', 'ปิดผล'], ['revealed', 'เปิดผล']], 'results')}
      <span className="w-px h-5 bg-white/15" />
      <button onClick={() => setOpen(false)} title="ย่อแถบ" className="p-1.5 rounded-lg hover:bg-white/10"><Minus className="w-4 h-4" /></button>
      <button onClick={close} title="ปิดพรีวิว" className="p-1.5 rounded-lg hover:bg-white/10 text-rose-300"><X className="w-4 h-4" /></button>
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
