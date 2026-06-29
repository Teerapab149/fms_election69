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
import { MotionConfig } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { getPath } from '../../utils/basePath';
import TemplatePreviewWrapper from '../../components/admin/TemplatePreviewWrapper';

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
import SinglePartyView from '../../components/vote/SinglePartyView';

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

  // Colour themes within this layout family (e.g. verdure terracotta/honey/teal/
  // berry). The full-screen bar shows them as swatches; clicking one re-tints IN
  // PLACE (no reload) — so the iframe src stays pinned to the family's BASE slug
  // (repSlug, stable) and the chosen palette is injected onto it. Single-theme
  // families (gumroad/studio-dark/original today) yield one entry → no swatches.
  const familyThemes = Object.values(BUILT_IN_TEMPLATES)
    .filter((t) => (t.layoutFamily || 'classic') === family)
    .map((t) => ({ slug: t.slug, name: t.name, color: t.colorSwatch?.primary || '#8A2680' }));
  const repSlug = familyThemes[0]?.slug || slug;
  const [themeSlug, setThemeSlug] = useState(slug);

  if (chrome) {
    // Carry the chosen colour theme across page navigation (deep-links keep it).
    const goto = (p, vr) => {
      window.location.href = getPath(`/template-preview?slug=${themeSlug}&page=${p}${vr ? `&variant=${vr}` : ''}&chrome=1`);
    };
    const exit = () => {
      // Opened in its own tab via window.open → closing returns to the chooser. If
      // the browser blocks self-close, fall back to the admin chooser — never home.
      window.close();
      setTimeout(() => { if (!window.closed) window.location.href = getPath('/admin'); }, 250);
    };
    // src stays on the stable family slug so a swatch click never reloads the iframe
    // (the theme morphs in place); the wrapper injects `themeSlug` onto it.
    const raw = getPath(`/template-preview?slug=${repSlug}&page=${page}${variant ? `&variant=${variant}` : ''}`);
    // NOTE: no PreviewMotionDamp here — this is the OUTER chrome doc; its loading
    // spinner must keep spinning. The damping lives in the iframe content below.
    return (
      <TemplatePreviewWrapper
        src={raw}
        url={`fms-ovs/${page}${variant ? `·${variant}` : ''}`}
        themeSlug={themeSlug}
        onExit={exit}
        actions={<PreviewPageControls page={page} variant={variant} goto={goto}
          themes={familyThemes} themeSlug={themeSlug} onTheme={setThemeSlug} />}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="always">
      <PreviewMotionDamp />
      {renderPage()}
    </MotionConfig>
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

    // The real pages (app/<page>.js) wrap each layout in a min-h-screen div with
    // the template's page background. Replicate it here so short pages (e.g. single
    // vote) don't leave a white gap below the content. bg = the template's declared
    // page background, falling back to its base background token.
    const tpl = BUILT_IN_TEMPLATES[slug] || {};
    const pageBg = tpl.pages?.[page]?.backgroundColor || tpl.theme?.colors?.background || tpl.theme?.background || '#ffffff';
    const frame = (el) => <div className="min-h-screen w-full" style={{ background: pageBg }}>{el}</div>;

    if (page === 'candidates') {
      const C = byFamily(StudioDarkCandidates, GumroadCandidates, VerdureCandidates);
      return frame(<C candidates={PARTIES} editorMode />);
    }
    if (page === 'party') {
      const P = byFamily(StudioDarkParty, GumroadParty, VerdureParty);
      return frame(<P party={PARTIES[0]} galleryImages={[]} showBackToVote={false} />);
    }
    if (page === 'vote') {
      // dev-only: preview the Verdure single-party cinematic wax-seal intro in
      // isolation (no DB change, live election untouched). ?…&variant=single&intro=1
      if (family === 'verdure' && single && sp.get('intro') === '1') {
        return frame(
          <VerdureSingleParty party={PARTIES[0]} specialOptions={SPECIAL} selectedPartyId={null}
            onSelect={noop} onConfirm={noop} isSubmitting={false} user={DUMMY_USER} editorMode forceIntro />
        );
      }
      const V = byFamily(StudioDarkVote, GumroadVote, VerdureVote);
      return frame(
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
      return frame(
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
      return frame(<S user={DUMMY_USER} isUnlocked={false} onOpenForm={noop} editorMode />);
    }
    if (page === 'closed') {
      const Cl = byFamily(StudioDarkClosed, GumroadClosed, VerdureClosed);
      return frame(<Cl title="ยังไม่เปิดรับลงคะแนน" desc="ขณะนี้ยังไม่ถึงเวลาเริ่มการเลือกตั้ง" variant="waiting" session={null} onLogout={noop} />);
    }
  }

  // ── classic family (incl. original — its inner pages render the classic layout) ──
  if (page === 'candidates') return <CandidatesEditorPreview pageLayout={null} elementConfigs={{}} />;
  if (page === 'vote') {
    // single → the REAL cinematic SinglePartyView (previewMode = full layout, intro
    // skipped) instead of the stripped editor placeholder; multi → editor preview.
    if (variant === 'single') {
      return <SinglePartyView previewMode candidate={PARTIES[0]} specialOptions={SPECIAL} selectedPartyId={null} onSelect={noop} user={DUMMY_USER} />;
    }
    return <VoteEditorPreview simMode="multi" pageLayout={null} elementConfigs={{}} />;
  }
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

// ── Page + variant switcher shown in the TemplatePreviewWrapper top bar (only when
//    ?chrome=1, the full-screen preview). Navigates the OUTER window, which
//    re-points the wrapper's iframe at the chosen page/state. ────────────────────
const PAGE_OPTS = [
  { v: 'home', l: 'หน้าแรก' }, { v: 'candidates', l: 'ผู้สมัคร' }, { v: 'party', l: 'ข้อมูลพรรค' },
  { v: 'vote', l: 'ลงคะแนน' }, { v: 'results', l: 'ผลคะแนน' }, { v: 'success', l: 'สำเร็จ' }, { v: 'closed', l: 'ปิดระบบ' },
];
const DEFAULT_VARIANT = { vote: 'multi', results: 'revealed' };

// Damps continuous motion on the preview surface so the renderer can idle: framer
// transform loops are stilled by <MotionConfig reducedMotion="always"> (LiquidMesh
// honours it, the verdure intro ring/etc. settle), and any infinite CSS @keyframes
// (vdDot pulse, vdGlow, vdCueBounce) are allowed a single pass then stop. This kills
// the spinner jank + lets preview_screenshot reach network-idle. Preview route only
// — production pages never mount this, so live animations are untouched.
function PreviewMotionDamp() {
  return (
    <style jsx global>{`
      *, *::before, *::after { animation-iteration-count: 1 !important; }
    `}</style>
  );
}

function PreviewPageControls({ page, variant, goto, themes = [], themeSlug, onTheme }) {
  const seg = (cur, opts, p) => (
    <div className="flex items-center rounded-lg bg-neutral-800 border border-neutral-700 p-0.5">
      {opts.map(([v, l]) => (
        <button key={v} type="button" onClick={() => goto(p, v)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${cur === v ? 'bg-white text-neutral-900' : 'text-neutral-400 hover:text-white'}`}>{l}</button>
      ))}
    </div>
  );
  return (
    <>
      {/* page selector — a clearly legible light control (was lost dark-on-dark) */}
      <label className="flex items-center gap-1.5 rounded-lg bg-white border border-neutral-300 pl-2.5 pr-1 py-1 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 select-none">หน้า</span>
        <select value={page} onChange={(e) => goto(e.target.value, DEFAULT_VARIANT[e.target.value])}
          className="bg-transparent text-xs font-semibold text-neutral-900 outline-none cursor-pointer pr-0.5">
          {PAGE_OPTS.map((o) => <option key={o.v} value={o.v} className="text-slate-900">{o.l}</option>)}
        </select>
      </label>
      {page === 'vote' && seg(variant || 'multi', [['multi', 'หลายพรรค'], ['single', 'พรรคเดียว']], 'vote')}
      {page === 'results' && seg(variant || 'revealed', [['locked', 'ปิดผล'], ['revealed', 'เปิดผล']], 'results')}
      {/* colour-theme switcher — re-tints the preview IN PLACE (same morph as the
          chooser). Only shown when this family has more than one theme. */}
      {themes.length > 1 && (
        <div className="flex items-center gap-1.5 rounded-lg bg-neutral-800 border border-neutral-700 pl-2 pr-1.5 py-1">
          <Palette className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          {themes.map((t) => {
            const on = t.slug === themeSlug;
            return (
              <button key={t.slug} type="button" title={t.name} aria-label={`เปลี่ยนสี ${t.name}`} onClick={() => onTheme?.(t.slug)}
                className={`w-5 h-5 rounded-full grid place-items-center transition-transform ${on ? 'scale-110' : 'hover:scale-105'}`}
                style={{ background: t.color, boxShadow: on ? '0 0 0 2px #18181b, 0 0 0 4px #fff' : '0 0 0 1px rgba(255,255,255,.35)' }}>
                {on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function TemplatePreviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fff' }} />}>
      <PreviewBody />
    </Suspense>
  );
}
