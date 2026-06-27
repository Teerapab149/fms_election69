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

export default function TemplatePreviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fff' }} />}>
      <PreviewBody />
    </Suspense>
  );
}
