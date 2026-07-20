'use client';

// /template-playground — an INTERACTIVE, auth-free, DATABASE-FREE clickable
// prototype of a template's pages. The admin opens this from the template gallery
// ("ดูรายละเอียด" → "เปิดแบบโต้ตอบ") to actually PLAY with a template — select a
// party, open a candidate, confirm → land on success, move between pages — before
// deciding to apply + publish it.
//
//   ?slug=verdure&page=vote
//
// How it stays safe + contained:
//  • Renders the REAL page components with mock data (templatePreviewMocks) +
//    LOCAL-STATE handlers. onConfirm → mock success page; it NEVER imports the
//    vote API, so nothing can be written to the database.
//  • NAVIGATION is intercepted at the wrapper: every internal <a href={getPath(…)}>
//    (the dock + in-page links) is caught, the real route is parsed, and we switch
//    a LOCAL page instead of navigating to the auth-gated real route. One seam
//    catches the dock AND the scattered in-page links across all families.
//  • HOME renders view-only (editorMode) so its signIn() CTA can't redirect; the
//    6 inner pages run interactive but WITHOUT a session, so the chrome's user pill
//    (and its signOut button — which would log the admin out for real) never shows.
//  • A floating SANDBOX bar gives reliable nav + state toggles (single/multi,
//    results locked/revealed, template switch) independent of the template chrome.

import { Suspense, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import HomeRenderer from '../../components/home/HomeRenderer';
import { BUILT_IN_TEMPLATES } from '../../components/admin/editor/templates';

import VerdureCandidates from '../../components/vote/VerdureCandidates';
import VerdureParty from '../../components/vote/VerdureParty';
import VerdureVote from '../../components/vote/VerdureVote';
import VerdureResults from '../../components/vote/VerdureResults';
import VerdureSuccess from '../../components/vote/VerdureSuccess';
import VerdureClosed from '../../components/vote/VerdureClosed';

import StudioDarkCandidates from '../../components/vote/StudioDarkCandidates';
import StudioDarkParty from '../../components/vote/StudioDarkParty';
import StudioDarkVote from '../../components/vote/StudioDarkVote';
import StudioDarkResults from '../../components/vote/StudioDarkResults';
import StudioDarkSuccess from '../../components/vote/StudioDarkSuccess';
import StudioDarkClosed from '../../components/vote/StudioDarkClosed';

import GumroadCandidates from '../../components/vote/GumroadCandidates';
import GumroadParty from '../../components/vote/GumroadParty';
import GumroadVote from '../../components/vote/GumroadVote';
import GumroadResults from '../../components/vote/GumroadResults';
import GumroadSuccess from '../../components/vote/GumroadSuccess';
import GumroadClosed from '../../components/vote/GumroadClosed';

import BlossomCandidates from '../../components/vote/BlossomCandidates';
import BlossomParty from '../../components/vote/BlossomParty';
import BlossomVote from '../../components/vote/BlossomVote';
import BlossomResults from '../../components/vote/BlossomResults';
import BlossomSuccess from '../../components/vote/BlossomSuccess';
import BlossomClosed from '../../components/vote/BlossomClosed';

import ReceiptCandidates from '../../components/vote/ReceiptCandidates';
import ReceiptParty from '../../components/vote/ReceiptParty';
import ReceiptVote from '../../components/vote/ReceiptVote';
import ReceiptResults from '../../components/vote/ReceiptResults';
import ReceiptSuccess from '../../components/vote/ReceiptSuccess';
import ReceiptClosed from '../../components/vote/ReceiptClosed';

// shared confirm popup for the blossom MULTI ballot (owned by the parent, exactly
// as /template-preview interact + the real vote/page.js compose it).
import VoteConfirmationModal from '../../components/VoteConfirmationModal';
import PartyDetailModal from '../../components/PartyDetailModal';

import { DUMMY_USER } from '../../utils/editorDummyData';
import { makeParties, SPECIAL, DEMOGRAPHICS, resultsCandidates } from '../../utils/templatePreviewMocks';
import { hrefToDest } from '../../utils/previewNav';

const noop = () => {};

// family → page → real layout component (uniform prop contract across families,
// same as /template-preview). Home is dispatched separately via HomeRenderer.
const COMPONENTS = {
  verdure: { candidates: VerdureCandidates, party: VerdureParty, vote: VerdureVote, results: VerdureResults, success: VerdureSuccess, closed: VerdureClosed },
  'studio-dark': { candidates: StudioDarkCandidates, party: StudioDarkParty, vote: StudioDarkVote, results: StudioDarkResults, success: StudioDarkSuccess, closed: StudioDarkClosed },
  gumroad: { candidates: GumroadCandidates, party: GumroadParty, vote: GumroadVote, results: GumroadResults, success: GumroadSuccess, closed: GumroadClosed },
  // blossom now has its OWN party layout (BlossomParty — Candy Editorial feature,
  // v2-R4c). vote is special-cased (single booth confirms internally; multi opens the
  // shared VoteConfirmationModal at the parent).
  blossom: { candidates: BlossomCandidates, party: BlossomParty, vote: BlossomVote, results: BlossomResults, success: BlossomSuccess, closed: BlossomClosed },
  // receipt has its OWN party layout (ReceiptParty — paper dossier, v2-R4b); vote
  // dispatches single→ReceiptSingleParty (internal confirm) / multi→shared modal, and
  // results renders the election-day embargo band when locked (same as blossom).
  receipt: { candidates: ReceiptCandidates, party: ReceiptParty, vote: ReceiptVote, results: ReceiptResults, success: ReceiptSuccess, closed: ReceiptClosed },
};

const TEMPLATES = [
  { slug: 'verdure', label: 'Verdure' },
  { slug: 'studio-dark', label: 'Studio Dark' },
  { slug: 'gumroad', label: 'Gumroad' },
  { slug: 'blossom', label: 'Blossom' },
  { slug: 'receipt', label: 'Receipt' },
];
const PAGES = [
  { key: 'home', th: 'หน้าหลัก' },
  { key: 'candidates', th: 'ผู้สมัคร' },
  { key: 'party', th: 'รายละเอียดพรรค' },
  { key: 'vote', th: 'ลงคะแนน' },
  { key: 'results', th: 'ผลคะแนน' },
  { key: 'success', th: 'บันทึกสำเร็จ' },
  { key: 'closed', th: 'ปิดระบบ' },
];

// NOTE: hrefToDest lives in ../../utils/previewNav — one shared seam for the
// playground + /template-preview?interact=1 (repo convention: no drift).

function PlaygroundBody() {
  const sp = useSearchParams();
  const initialSlug = TEMPLATES.some((t) => t.slug === sp.get('slug')) ? sp.get('slug') : 'verdure';

  const [slug, setSlug] = useState(initialSlug);
  const [page, setPage] = useState(PAGES.some((p) => p.key === sp.get('page')) ? sp.get('page') : 'home');
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const [partyNumber, setPartyNumber] = useState(1);
  const [single, setSingle] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false); // blossom MULTI shared popup
  const [detailParty, setDetailParty] = useState(null); // vd-B1D: results party-detail modal
  const [barOpen, setBarOpen] = useState(true);

  // ?parties=N — DB-free multi-party harness (v2-R9), same contract as /template-preview.
  // int 2..6, default 2, garbage → 2. makeParties(2) === the old default roster.
  const partiesN = (() => {
    const raw = parseInt(sp.get('parties'), 10);
    return Number.isFinite(raw) && raw >= 2 && raw <= 6 ? raw : 2;
  })();
  const parties = useMemo(() => makeParties(partiesN), [partiesN]);

  const family = BUILT_IN_TEMPLATES[slug]?.layoutFamily || 'verdure';
  const map = COMPONENTS[family] || COMPONENTS.verdure;

  const go = useCallback((p, opts = {}) => {
    setPage(p);
    if (opts.partyNumber != null) setPartyNumber(opts.partyNumber);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, []);

  // ── one seam catches the dock + every in-page <a> nav across all families ──
  const onClickCapture = useCallback((e) => {
    const a = e.target?.closest?.('a');
    if (!a) return;
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:')) return;
    const dest = hrefToDest(a.href);
    if (!dest) return; // external — allow normal navigation
    e.preventDefault();
    go(dest.page, dest.partyNumber != null ? { partyNumber: dest.partyNumber } : {});
  }, [go]);

  const voteParties = single ? [parties[0]] : parties;
  const partyForDetail = parties.find((p) => p.number === partyNumber) || parties[0];
  const onViewDetails = (p) => go('party', { partyNumber: p?.number ?? 1 });
  const onConfirm = () => go('success');

  let content;
  if (page === 'home') {
    // INTERACTIVE home — the login CTA is seamed via onSignIn (a callback), so
    // clicking "เข้าสู่ระบบ" simulates the real flow by switching to the local
    // vote page instead of redirecting to PSU SSO. No editorMode, no DB, no auth.
    content = (
      <HomeRenderer
        onSignIn={() => go('vote')}
        resolvedTemplate={BUILT_IN_TEMPLATES[slug] || BUILT_IN_TEMPLATES.classic}
        initialData={{ systemMode: 'AUTO', electionStatus: 'ONGOING', stats: { totalVoted: 342, totalEligible: 2004 }, candidates: parties }}
      />
    );
  } else if (page === 'candidates') {
    const C = map.candidates;
    content = <C candidates={parties} editorMode={false} />;
  } else if (page === 'party') {
    // every family now has a real party layout via map.party (blossom → BlossomParty,
    // receipt → ReceiptParty, etc.), all sharing the uniform party prop contract.
    const P = map.party;
    content = <P party={partyForDetail} galleryImages={[]} showBackToVote />;
  } else if (page === 'vote') {
    const V = map.vote;
    if ((family === 'blossom' || family === 'receipt') && !single) {
      // MULTI ballot — local selection → the SHARED confirm popup → success
      // (mirrors /template-preview interact + the real vote/page.js multi flow).
      const allSelectable = [...parties, SPECIAL.abstain, SPECIAL.disapprove];
      const selectedParty = allSelectable.find((p) => p.id === selectedPartyId) || null;
      content = (
        <>
          <V regularParties={parties} specialOptions={SPECIAL} selectedPartyId={selectedPartyId}
            onSelect={setSelectedPartyId} onViewDetails={onViewDetails} isSingleParty={false}
            user={DUMMY_USER} onConfirm={() => setConfirmOpen(true)} isSubmitting={false} editorMode={false} />
          <VoteConfirmationModal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => { setConfirmOpen(false); onConfirm(); }}
            party={selectedParty}
            isVoteNo={selectedParty?.number === 0}
            isDisapprove={selectedParty?.number === -1}
            isSubmitting={false}
          />
        </>
      );
    } else {
      // blossom/receipt SINGLE booth confirms internally → onConfirm; other families uniform.
      content = (
        <V regularParties={voteParties} specialOptions={SPECIAL} selectedPartyId={selectedPartyId}
          onSelect={setSelectedPartyId} onViewDetails={onViewDetails} isSingleParty={single}
          user={DUMMY_USER} onConfirm={onConfirm} isSubmitting={false} editorMode={false} />
      );
    }
  } else if (page === 'results') {
    const R = map.results;
    // blossom/receipt LOCKED = the election-day embargo band (polls open, scores
    // sealed, turnout public) — not the "not started" empty state. Mirror /template-preview.
    const embargo = family === 'blossom' || family === 'receipt';
    // vd-B1D: production results (app/results/page.js) opens PartyDetailModal in place
    // on a party click — it does NOT navigate to the party page. Mirror that here.
    content = (
      <>
        <R candidates={resultsCandidates(revealed, parties)}
          totalVotes={revealed ? 625 : (embargo ? 418 : 0)} demographics={DEMOGRAPHICS}
          finalStatus={revealed ? 'ENDED' : (embargo ? 'ONGOING' : 'WAITING')} isRevealed={revealed}
          isNotStarted={embargo ? false : !revealed}
          countdownText={revealed ? '' : 'เหลืออีก 02:14:33'} onSelectParty={(p) => setDetailParty(p)} editorMode={false} />
        <PartyDetailModal party={detailParty} isOpen={!!detailParty} onClose={() => setDetailParty(null)} showVoteButton={false} />
      </>
    );
  } else if (page === 'success') {
    const S = map.success;
    content = <S user={DUMMY_USER} isUnlocked onOpenForm={noop} editorMode={false} />;
  } else if (page === 'closed') {
    const Cl = map.closed;
    content = <Cl title="ยังไม่เปิดรับลงคะแนน" desc="ขณะนี้ยังไม่ถึงเวลาเริ่มการเลือกตั้ง" variant="waiting" session={null} onLogout={noop} editorMode={false} />;
  }

  return (
    <>
      <div onClickCapture={onClickCapture}>{content}</div>

      {/* ── floating SANDBOX bar — harness UI, not part of the template ── */}
      <div className={`tpg ${barOpen ? 'is-open' : ''}`} role="region" aria-label="แถบควบคุมตัวอย่าง">
        <button type="button" className="tpg__toggle" onClick={() => setBarOpen((o) => !o)} aria-expanded={barOpen}>
          {barOpen ? '✕ ปิดแถบ' : '⚙ ตัวอย่างแบบโต้ตอบ'}
        </button>
        {barOpen && (
          <div className="tpg__panel">
            <div className="tpg__title">ตัวอย่างแบบโต้ตอบ <span>· กดเล่นได้จริง ไม่บันทึกผลลง DB</span></div>

            <div className="tpg__group">
              <span className="tpg__lbl">ธีม</span>
              <div className="tpg__row">
                {TEMPLATES.map((t) => (
                  <button key={t.slug} type="button"
                    className={`tpg__chip ${slug === t.slug ? 'is-on' : ''}`}
                    onClick={() => { setSlug(t.slug); setSelectedPartyId(null); }}>{t.label}</button>
                ))}
              </div>
            </div>

            <div className="tpg__group">
              <span className="tpg__lbl">หน้า</span>
              <div className="tpg__row tpg__row--wrap">
                {PAGES.map((p) => (
                  <button key={p.key} type="button"
                    className={`tpg__chip ${page === p.key ? 'is-on' : ''}`}
                    onClick={() => go(p.key)}>{p.th}</button>
                ))}
              </div>
            </div>

            <div className="tpg__group">
              <span className="tpg__lbl">สถานะ</span>
              <div className="tpg__row tpg__row--wrap">
                <button type="button" className={`tpg__chip ${single ? 'is-on' : ''}`}
                  onClick={() => { setSingle((s) => !s); setSelectedPartyId(null); }}>
                  {single ? 'พรรคเดียว' : 'หลายพรรค'}
                </button>
                <button type="button" className={`tpg__chip ${revealed ? 'is-on' : ''}`}
                  onClick={() => setRevealed((r) => !r)}>
                  ผลคะแนน: {revealed ? 'เปิด' : 'ล็อก'}
                </button>
                <button type="button" className="tpg__chip"
                  onClick={() => setSelectedPartyId(null)}>ล้างที่เลือก</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        /* The playground is SESSION-LESS by intent: next-auth's SessionProvider is a
           singleton (a nested session=null doesn't isolate). SIGN-IN is now SIMULATED
           via the onSignIn callback (home → local vote page), so sign-in controls stay
           VISIBLE. We only hide the DANGEROUS SIGN-OUT affordances — those would log the
           real admin out (no seam, and no session exists here anyway). Covers all 3
           families (signOut shares aria-label="ออกจากระบบ"). The gumroad .gnav-* auth
           controls are sign-in-only when logged out (which the playground always is),
           so they need no hiding — onSignIn simulates them. */
        [aria-label="ออกจากระบบ"],
        .vd-user__out,
        .sd-rail__logout-btn { display:none !important; }

        .tpg { position:fixed; right:16px; bottom:16px; z-index:100000; font-family:system-ui,-apple-system,'Segoe UI',sans-serif; }
        .tpg__toggle { display:inline-flex; align-items:center; gap:6px; padding:10px 16px; border-radius:999px; border:0; cursor:pointer;
          background:#14140F; color:#F2EDDF; font-size:13px; font-weight:600; box-shadow:0 14px 36px -10px rgba(0,0,0,.55); }
        .tpg__toggle:hover { background:#000; }
        .tpg.is-open .tpg__toggle { position:absolute; right:0; bottom:calc(100% + 10px); }
        .tpg__panel { width:min(320px,calc(100vw - 32px)); background:#1B1B14; color:#F2EDDF; border:1px solid #3E3E2D; border-radius:16px;
          padding:16px; box-shadow:0 30px 70px -20px rgba(0,0,0,.6); }
        .tpg__title { font-size:13px; font-weight:700; margin-bottom:14px; line-height:1.4; }
        .tpg__title span { font-weight:400; color:#B5B0A2; font-size:11px; }
        .tpg__group { margin-bottom:12px; }
        .tpg__group:last-child { margin-bottom:0; }
        .tpg__lbl { display:block; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#7F7A6E; margin-bottom:6px; }
        .tpg__row { display:flex; gap:6px; }
        .tpg__row--wrap { flex-wrap:wrap; }
        .tpg__chip { padding:7px 12px; border-radius:999px; border:1px solid #3E3E2D; background:transparent; color:#D6D1C4;
          font-size:12px; font-weight:500; cursor:pointer; transition:background .15s, color .15s, border-color .15s; }
        .tpg__chip:hover { border-color:#D5FF3F; color:#F2EDDF; }
        .tpg__chip.is-on { background:#D5FF3F; color:#14140F; border-color:#D5FF3F; font-weight:700; }
      `}</style>
    </>
  );
}

export default function TemplatePlaygroundPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fff' }} />}>
      <PlaygroundBody />
    </Suspense>
  );
}
