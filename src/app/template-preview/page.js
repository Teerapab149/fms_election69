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

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { getPath } from '../../utils/basePath';
import { hrefToDest } from '../../utils/previewNav';
import { buildTemplateStyles } from '../../lib/templateTokens';
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

import BlossomCandidates from '../../components/vote/BlossomCandidates';
import BlossomParty from '../../components/vote/BlossomParty';
import BlossomResults from '../../components/vote/BlossomResults';
import BlossomSuccess from '../../components/vote/BlossomSuccess';
import BlossomVote from '../../components/vote/BlossomVote';
import BlossomClosed from '../../components/vote/BlossomClosed';

import ReceiptSuccess from '../../components/vote/ReceiptSuccess';
import ReceiptVote, { useBallotDrop, ReceiptConfirmSlip } from '../../components/vote/ReceiptVote';
import ReceiptResults from '../../components/vote/ReceiptResults';
import ReceiptClosed from '../../components/vote/ReceiptClosed';
import ReceiptCandidates from '../../components/vote/ReceiptCandidates';
import ReceiptParty from '../../components/vote/ReceiptParty';

import CandidatesEditorPreview from '../../components/admin/CandidatesEditorPreview';
import VoteEditorPreview from '../../components/admin/VoteEditorPreview';
import ResultsEditorPreview from '../../components/admin/ResultsEditorPreview';
import ClosedEditorPreview from '../../components/admin/ClosedEditorPreview';
import SuccessPage from '../success/page';
import { ClassicPartyPreview } from '../party/page';
import SinglePartyView from '../../components/vote/SinglePartyView';

// Classic-family VOTE composition (mirrors src/app/vote/page.js multi-party branch)
import MultiPartyView from '../../components/vote/MultiPartyView';
import VoteFooter from '../../components/vote/VoteFooter';
import PartyDetailModal from '../../components/PartyDetailModal';
import VoteConfirmationModal from '../../components/VoteConfirmationModal';

import { DUMMY_ELECTION, DUMMY_USER } from '../../utils/editorDummyData';
import { makeParties, SPECIAL, DEMOGRAPHICS, resultsCandidates } from '../../utils/templatePreviewMocks';

const noop = () => {};

// receipt CLOSED preview copy — reason-aware, mirrors closed/page.js getMessage()
// semantics (waiting / ended / paused). Drive via ?variant=ended|closed|waiting.
function receiptClosedCopy(variant) {
  if (variant === 'ended') return { variant: 'ended', title: 'สิ้นสุดระยะเวลาลงคะแนน', desc: 'การเลือกตั้งได้สิ้นสุดลงแล้ว ขอบคุณทุกท่านที่เข้ามาใช้สิทธิ' };
  if (variant === 'closed' || variant === 'paused') return { variant: 'closed', title: 'ระบบปิดรับลงคะแนน', desc: 'ระบบเลือกตั้งถูกปิดชั่วคราว หรือหมดเวลาการลงคะแนนแล้ว กรุณาติดต่อเจ้าหน้าที่หากมีข้อสงสัย' };
  return { variant: 'waiting', title: 'ยังไม่เปิดรับลงคะแนน', desc: 'ขณะนี้ยังไม่ถึงเวลาเริ่มการเลือกตั้ง กรุณากลับมาอีกครั้งเมื่อถึงกำหนดเปิดโหวต' };
}

function PreviewBody() {
  const sp = useSearchParams();
  const slug = sp.get('slug') || 'classic';
  const page = sp.get('page') || 'home';
  const variant = sp.get('variant') || '';
  const chrome = sp.get('chrome') === '1';
  // interact=1 opts the NON-chrome render into full interactivity (clickable cards,
  // party selection, simulated page flow). ABSENT → byte-identical static behaviour
  // (the chooser slides never send it). The chrome wrapper injects it onto its inner
  // iframe so the full-screen preview is interactive wherever it's used.
  const interact = sp.get('interact') === '1';
  const family = BUILT_IN_TEMPLATES[slug]?.layoutFamily || 'classic';
  // The template being PREVIEWED (P2 #2 fix). layout.js SSRs the ACTIVE template's
  // Layer-1 tokens on `.fms-app` site-wide — including this route — so previewing a
  // NON-active template leaked the active palette into every token-consuming element
  // (e.g. studio-dark's voteCTA rendered original's purple). Emit the previewed
  // template's own tokens below; rendered inside `.fms-app` content it comes AFTER
  // the layout <style> in DOM order and wins at equal specificity (same cascade
  // trick the family homes use in non-editor mode). Unknown slug → emit nothing
  // (previous behavior).
  const previewedTemplate = BUILT_IN_TEMPLATES[slug];

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

  // ── interact-mode local state (unused in static mode; hooks stay unconditional so
  //    ordering is identical in both branches) ─────────────────────────────────────
  // receipt ballot-drop scene (ruling C3) — interact plays the SAME client-side scene
  // as the live seam, around a simulated submit. ?fail=1 is a PREVIEW-ONLY dev flag
  // (never read by the live vote page): the simulated submit resolves false so the
  // bounce-back error path can be exercised without a server.
  const { playDrop, sceneNode } = useBallotDrop();
  const dropFail = sp.get('fail') === '1';
  // ?parties=N — DB-free multi-party harness (v2-R9). int 2..6, default 2, garbage → 2.
  // makeParties(2) is byte-identical to the old default roster, so the chooser slideshow
  // (which never passes ?parties) is unchanged. Memoised on N so the array identity is
  // stable across re-renders (layout components may key off prop identity).
  const partiesN = (() => {
    const raw = parseInt(sp.get('parties'), 10);
    return Number.isFinite(raw) && raw >= 2 && raw <= 6 ? raw : 2;
  })();
  const parties = useMemo(() => makeParties(partiesN), [partiesN]);
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const [partyNumber, setPartyNumber] = useState(parties[0]?.number ?? 1);
  // Classic-family VOTE modal state (mirrors app/vote/page.js local UI state)
  const [detailParty, setDetailParty] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // navTo — simulated in-preview navigation (interact mode). Inside the chrome
  // iframe (window.parent !== window) we can't drive the outer window directly, so
  // we postMessage the chrome doc's listener. Standalone (direct deep link) we
  // self-navigate, preserving slug + variant + interact.
  const navTo = useCallback((p, variantOrPartyNumber) => {
    if (p === 'party' && variantOrPartyNumber != null) setPartyNumber(variantOrPartyNumber);
    if (typeof window !== 'undefined' && window.parent !== window) {
      const vr = p === 'party' ? undefined : variantOrPartyNumber;
      window.parent.postMessage({ type: 'tp-nav', page: p, variant: vr }, window.location.origin);
      return;
    }
    const isParty = p === 'party';
    const vr = isParty ? '' : (variantOrPartyNumber || '');
    const id = isParty && variantOrPartyNumber != null ? `&id=${variantOrPartyNumber}` : '';
    window.location.href = getPath(`/template-preview?slug=${slug}&page=${p}${vr ? `&variant=${vr}` : ''}${id}&interact=1`);
  }, [slug]);

  // one seam catches the dock + every in-page <a> nav across all families (same
  // logic as the playground, via the shared hrefToDest util).
  const onClickCapture = useCallback((e) => {
    const a = e.target?.closest?.('a');
    if (!a) return;
    const rawHref = a.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:')) return;
    const dest = hrefToDest(a.href);
    if (!dest) return; // external — allow normal navigation
    e.preventDefault();
    navTo(dest.page, dest.page === 'party' ? (dest.partyNumber ?? partyNumber) : undefined);
  }, [navTo, partyNumber]);

  // Carry the chosen colour theme across page navigation (deep-links keep it).
  // Defined for BOTH branches: the chrome bar calls it directly; the message
  // listener below routes iframe postMessage nav through it too. Kept as a
  // useCallback so the listener effect has a stable, current reference.
  const goto = useCallback((p, vr) => {
    window.location.href = getPath(`/template-preview?slug=${themeSlug}&page=${p}${vr ? `&variant=${vr}` : ''}&chrome=1`);
  }, [themeSlug]);

  // CHROME only: the interactive inner iframe reports simulated navigation via
  // postMessage (it can't drive the outer window directly). On {type:'tp-nav'}
  // from the SAME origin, re-point the wrapper by navigating the outer window —
  // goto keeps themeSlug, so the chosen colour theme survives the flow.
  //  • vote    → default 'multi' unless we're already on the single variant
  //  • results → keep the current variant, else 'revealed'
  //  • party   → no variant
  useEffect(() => {
    if (!chrome) return undefined;
    const onMsg = (e) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data;
      if (!d || d.type !== 'tp-nav') return;
      let vr;
      if (d.page === 'vote') vr = variant === 'single' ? 'single' : 'multi';
      else if (d.page === 'results') vr = variant || 'revealed';
      else vr = '';
      goto(d.page, vr);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [chrome, variant, goto]);

  if (chrome) {
    const exit = () => {
      const selector = getPath('/admin?tab=pageDesign');
      // Opened in its own tab via the chooser's "เปิดเต็มจอ" (window.open) → it has an
      // opener, so close the tab to return to the chooser. window.close() can still be
      // blocked once the preview has navigated (history > 1) → fall back to the admin
      // TEMPLATE SELECTOR (never overview/home).
      if (window.opener) {
        window.close();
        setTimeout(() => { if (!window.closed) window.location.href = selector; }, 250);
        return;
      }
      // Loaded directly (deep link / an automated browser, no opener) → window.close()
      // is a no-op that can hang the tab, so just navigate to the selector.
      window.location.href = selector;
    };
    // src stays on the stable family slug so a swatch click never reloads the iframe
    // (the theme morphs in place); the wrapper injects `themeSlug` onto it. &interact=1
    // makes the full-screen preview clickable everywhere the chrome is used.
    const raw = getPath(`/template-preview?slug=${repSlug}&page=${page}${variant ? `&variant=${variant}` : ''}&interact=1`);
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

  // interact mode → clickable render (party selection, simulated flow) wrapped in the
  // click-interception seam + auth-safety CSS. Static mode → byte-identical original.
  // reducedMotion: static slides stay damped ("always" — framer loops still, screenshots
  // idle); INTERACT simulates the live site, where no MotionConfig exists (framer default
  // = "never") — "always" here made repeat:Infinity transforms (sd-marquee) snap-loop at
  // hyper speed instead of gliding, since reduced framer motion skips the 30s tween.
  return (
    <MotionConfig reducedMotion={interact ? 'never' : 'always'}>
      {/* Layer-1/2 token scope of the PREVIEWED template — overrides the active
          template's SSR'd tokens (see previewedTemplate note above). Emitted once,
          above BOTH branches, so static (chooser slides) and interact renders agree. */}
      {previewedTemplate && (
        <style dangerouslySetInnerHTML={{ __html: buildTemplateStyles(previewedTemplate, '.fms-app') }} />
      )}
      <PreviewMotionDamp interact={interact} />
      {interact ? (
        <>
          <PreviewInteractAuthGuard />
          <div onClickCapture={onClickCapture}>{renderInteractive()}</div>
        </>
      ) : (
        renderPage()
      )}
    </MotionConfig>
  );

  // ── INTERACTIVE render (interact=1 only) ─────────────────────────────────────────
  // 3 distinct families render the REAL layout with editorMode={false} + real
  // handlers; HOME goes through HomeRenderer WITHOUT editorMode + onSignIn (the merged
  // seam). Classic/original inner pages keep their static EditorPreview renders for
  // now (out of scope — flow still demonstrable: original home login → vote page).
  // eslint-disable-next-line no-inner-declarations
  function renderInteractive() {
    if (page === 'home') {
      return (
        <HomeRenderer
          onSignIn={() => navTo('vote', variant === 'single' ? 'single' : 'multi')}
          resolvedTemplate={BUILT_IN_TEMPLATES[slug] || BUILT_IN_TEMPLATES.classic}
          initialData={{ systemMode: 'AUTO', electionStatus: 'ONGOING', stats: { totalVoted: 342, totalEligible: 1200 }, candidates: parties }}
        />
      );
    }

    if (family === 'studio-dark' || family === 'gumroad' || family === 'verdure') {
      const single = variant === 'single';
      const revealed = variant === 'revealed';
      const voteParties = single ? [parties[0]] : parties;
      const byFamily = (studio, gumroad, verdure) =>
        family === 'studio-dark' ? studio : family === 'verdure' ? verdure : gumroad;
      const tpl = BUILT_IN_TEMPLATES[slug] || {};
      const pageBg = tpl.pages?.[page]?.backgroundColor || tpl.theme?.colors?.background || tpl.theme?.background || '#ffffff';
      const frame = (el) => <div className="min-h-screen w-full" style={{ background: pageBg }}>{el}</div>;
      const partyForDetail = parties.find((p) => p.number === partyNumber) || parties[0];

      if (page === 'candidates') {
        const C = byFamily(StudioDarkCandidates, GumroadCandidates, VerdureCandidates);
        return frame(<C candidates={parties} editorMode={false} />);
      }
      if (page === 'party') {
        const P = byFamily(StudioDarkParty, GumroadParty, VerdureParty);
        return frame(<P party={partyForDetail} galleryImages={[]} showBackToVote />);
      }
      if (page === 'vote') {
        const V = byFamily(StudioDarkVote, GumroadVote, VerdureVote);
        return frame(
          <V
            regularParties={voteParties}
            specialOptions={SPECIAL}
            selectedPartyId={selectedPartyId}
            onSelect={setSelectedPartyId}
            onViewDetails={(p) => navTo('party', p?.number ?? 1)}
            isSingleParty={single}
            user={DUMMY_USER}
            onConfirm={() => navTo('success')}
            isSubmitting={false}
            editorMode={false}
          />
        );
      }
      if (page === 'results') {
        const R = byFamily(StudioDarkResults, GumroadResults, VerdureResults);
        return frame(
          <R
            candidates={resultsCandidates(revealed, parties)}
            totalVotes={revealed ? 625 : 0}
            demographics={DEMOGRAPHICS}
            finalStatus={revealed ? 'ENDED' : 'WAITING'}
            isRevealed={revealed}
            isNotStarted={!revealed}
            countdownText={revealed ? '' : 'เหลืออีก 02:14:33'}
            onSelectParty={(p) => navTo('party', p?.number ?? 1)}
            editorMode={false}
          />
        );
      }
      if (page === 'success') {
        const S = byFamily(StudioDarkSuccess, GumroadSuccess, VerdureSuccess);
        return frame(<S user={DUMMY_USER} isUnlocked={false} onOpenForm={noop} editorMode={false} />);
      }
      if (page === 'closed') {
        const Cl = byFamily(StudioDarkClosed, GumroadClosed, VerdureClosed);
        return frame(<Cl title="ยังไม่เปิดรับลงคะแนน" desc="ขณะนี้ยังไม่ถึงเวลาเริ่มการเลือกตั้ง" variant="waiting" session={null} onLogout={noop} editorMode={false} />);
      }
    }

    // ── blossom family — SINGLE-PARTY booth (T3.3). BlossomVote dispatches to the
    //    calm Candy Editorial booth; its OWN confirm dialog calls onConfirm (the
    //    submit) → navTo('success'). No shared VoteConfirmationModal for single.
    if (family === 'blossom' && page === 'vote' && variant === 'single') {
      return (
        <BlossomVote
          regularParties={parties}
          specialOptions={SPECIAL}
          selectedPartyId={selectedPartyId}
          onSelect={setSelectedPartyId}
          onViewDetails={(p) => navTo('party', p?.number ?? 1)}
          isSingleParty
          user={DUMMY_USER}
          onConfirm={() => navTo('success')}
          isSubmitting={false}
          editorMode={false}
        />
      );
    }

    // ── blossom family — MULTI ballot (T3.2). Local selection → the SHARED confirm
    //    popup → navTo('success'), mirroring the classic multi interact flow.
    if (family === 'blossom' && page === 'vote' && variant !== 'single') {
      const allSelectable = [...parties, SPECIAL.abstain, SPECIAL.disapprove];
      const selectedParty = allSelectable.find((p) => p.id === selectedPartyId) || null;
      return (
        <>
          <BlossomVote
            regularParties={parties}
            specialOptions={SPECIAL}
            selectedPartyId={selectedPartyId}
            onSelect={setSelectedPartyId}
            onViewDetails={(p) => navTo('party', p?.number ?? 1)}
            isSingleParty={false}
            user={DUMMY_USER}
            onConfirm={() => setConfirmOpen(true)}
            isSubmitting={false}
            editorMode={false}
          />
          <VoteConfirmationModal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => { setConfirmOpen(false); navTo('success'); }}
            party={selectedParty}
            isVoteNo={selectedParty?.number === 0}
            isDisapprove={selectedParty?.number === -1}
            isSubmitting={false}
          />
        </>
      );
    }

    // ── receipt family — SINGLE-PARTY ink-stamp booth (R3). ReceiptVote dispatches
    //    to ReceiptSingleParty; its OWN confirm dialog calls onConfirm (the submit)
    //    → navTo('success'). No shared VoteConfirmationModal for single. MUST precede
    //    the generic `if (page === 'vote')` classic catch-all below (which would
    //    otherwise render receipt's ballot with the classic MultiPartyView).
    if (family === 'receipt' && page === 'vote' && variant === 'single') {
      // booth confirm → the ballot-drop scene plays around a simulated submit (ruling
      // C3: the scene runs on BOTH the single and multi paths), then navTo('success').
      // ?fail=1 → the simulated submit returns false → the ballot bounces back.
      const submitSim = () => new Promise((resolve) => setTimeout(() => resolve(!dropFail), 600));
      return (
        <>
          <ReceiptVote
            regularParties={parties}
            specialOptions={SPECIAL}
            selectedPartyId={selectedPartyId}
            onSelect={setSelectedPartyId}
            onViewDetails={(p) => navTo('party', p?.number ?? 1)}
            isSingleParty
            user={DUMMY_USER}
            onConfirm={async () => { const ok = await playDrop(submitSim); if (ok) navTo('success'); }}
            isSubmitting={false}
            editorMode={false}
          />
          {sceneNode}
        </>
      );
    }

    // ── receipt family — MULTI ballot (R3). Local selection → the family's OWN
    //    ReceiptConfirmSlip (v2-R4a T4 — the shared VoteConfirmationModal stays for
    //    the other families) → navTo('success'). MUST precede the generic
    //    `if (page === 'vote')` classic catch-all below.
    if (family === 'receipt' && page === 'vote' && variant !== 'single') {
      const allSelectable = [...parties, SPECIAL.abstain, SPECIAL.disapprove];
      const selectedParty = allSelectable.find((p) => p.id === selectedPartyId) || null;
      // slip confirm → close it → the ballot-drop scene plays around a simulated
      // submit (ruling C3), then navTo('success'). ?fail=1 → the simulated submit
      // returns false → bounce-back.
      const submitSim = () => new Promise((resolve) => setTimeout(() => resolve(!dropFail), 600));
      return (
        <>
          <ReceiptVote
            regularParties={parties}
            specialOptions={SPECIAL}
            selectedPartyId={selectedPartyId}
            onSelect={setSelectedPartyId}
            onViewDetails={(p) => navTo('party', p?.number ?? 1)}
            isSingleParty={false}
            user={DUMMY_USER}
            onConfirm={() => setConfirmOpen(true)}
            isSubmitting={false}
            editorMode={false}
          />
          <ReceiptConfirmSlip
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={async () => { setConfirmOpen(false); const ok = await playDrop(submitSim); if (ok) navTo('success'); }}
            party={selectedParty}
            isVoteNo={selectedParty?.number === 0}
            isDisapprove={selectedParty?.number === -1}
            isSubmitting={false}
          />
          {sceneNode}
        </>
      );
    }

    // ── classic family (incl. original) — VOTE page composed from the REAL pure
    //    components exactly as app/vote/page.js does for multi-party, but with local
    //    state and zero DB/auth. single → the real cinematic SinglePartyView + footer.
    if (page === 'vote') {
      const single = variant === 'single';
      const tpl = BUILT_IN_TEMPLATES[slug] || {};
      const pageBg = tpl.pages?.[page]?.backgroundColor || tpl.theme?.colors?.background || tpl.theme?.background || 'var(--color-bg)';
      // Derive the selected party across regular + special options (as useVoteSystem
      // does) so VoteFooter/VoteConfirmationModal get the right object + number.
      const allSelectable = [...parties, SPECIAL.abstain, SPECIAL.disapprove];
      const selectedParty = allSelectable.find((p) => p.id === selectedPartyId) || null;

      if (single) {
        // single → the REAL cinematic SinglePartyView (previewMode = full layout, intro
        // skipped) + the same VoteFooter confirm affordance. Its 3-choice buttons drive
        // local selection; footer (variant="single") → its own popup → navTo('success').
        const singleParty = parties[0];
        const onSingleSelect = (id) => setSelectedPartyId(id);
        return (
          <div className="min-h-screen flex flex-col font-sans pb-32 overflow-x-hidden relative" style={{ background: pageBg }}>
            <main className="flex-grow container mx-auto px-4 py-8 relative z-10 max-w-4xl w-full">
              <SinglePartyView
                previewMode
                candidate={singleParty}
                selectedPartyId={selectedPartyId}
                onSelect={onSingleSelect}
                specialOptions={SPECIAL}
                user={DUMMY_USER}
              />
            </main>
            <VoteFooter
              selectedParty={selectedParty}
              isSubmitting={false}
              variant="single"
              partyPrimary={singleParty?.themePrimary || 'var(--spv-footer-primary, #4D2A67)'}
              partyGold={singleParty?.themeGold || 'var(--spv-footer-gold, #CDA176)'}
              onConfirm={() => navTo('success')}
            />
          </div>
        );
      }

      // multi → MultiPartyView + VoteFooter(multi) + PartyDetailModal + VoteConfirmationModal
      return (
        <div className="min-h-screen flex flex-col font-sans pb-32 overflow-x-hidden relative" style={{ background: pageBg }}>
          {/* Full-bleed themed background — grid texture + soft corner blobs, same as
              the real classic vote page (page.js lines 167-174), minus the auth Navbar. */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[60%] md:w-[40%] h-[40%] rounded-full blur-[80px] md:blur-[120px]"
              style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-accent) 12%, transparent))' }} />
            <div className="absolute bottom-[-5%] left-[-5%] w-[50%] md:w-[35%] h-[35%] rounded-full blur-[80px] md:blur-[120px]"
              style={{ background: 'linear-gradient(to top right, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-primary) 10%, transparent))' }} />
            <div className="absolute inset-0"
              style={{ backgroundImage: 'linear-gradient(to right, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          <main className="flex-grow container mx-auto px-4 py-8 relative z-10 max-w-4xl w-full">
            <MultiPartyView
              regularParties={parties}
              specialOptions={SPECIAL}
              selectedPartyId={selectedPartyId}
              onSelect={setSelectedPartyId}
              onViewDetails={(p) => { setDetailParty(p); setDetailOpen(true); }}
              config={{}}
            />
          </main>

          <VoteFooter
            selectedParty={selectedParty}
            isSubmitting={false}
            variant="multi"
            partyPrimary={parties?.[0]?.themePrimary || '#4D2A67'}
            partyGold={parties?.[0]?.themeGold || '#CDA176'}
            onConfirm={() => setConfirmOpen(true)}
          />

          {/* Modals — mirror app/vote/page.js (PartyDetailModal showVoteButton={false}) */}
          <PartyDetailModal
            party={detailParty}
            isOpen={detailOpen}
            onClose={() => setDetailOpen(false)}
            showVoteButton={false}
          />

          <VoteConfirmationModal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => { setConfirmOpen(false); navTo('success'); }}
            party={selectedParty}
            isVoteNo={selectedParty?.number === 0}
            isDisapprove={selectedParty?.number === -1}
            isSubmitting={false}
          />

          {/* Vote-page keyframes (MultiPartyView cards use animate-fade-in-up) */}
          <style jsx global>{`
            @keyframes fade-in-up {
              from { opacity: 0; transform: translateY(24px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          `}</style>
        </div>
      );
    }

    // Blossom family — its own Candy Editorial inner pages (home goes through
    // HomeRenderer above).
    if (family === 'blossom') {
      if (page === 'candidates') return <BlossomCandidates candidates={parties} editorMode={false} />;
      // PARTY detail (T3.6). the Candy Editorial feature; replaces the classic fallthrough.
      if (page === 'party') {
        const partyForDetail = parties.find((p) => p.number === partyNumber) || parties[0];
        return <BlossomParty party={partyForDetail} galleryImages={[]} showBackToVote editorMode={false} />;
      }
      if (page === 'results') {
        // revealed → ranking + demographics; otherwise the LOCKED embargo band (the
        // real election-day state: polls open, scores sealed, turnout public).
        const revealed = variant === 'revealed';
        return (
          <BlossomResults
            candidates={resultsCandidates(revealed, parties)}
            totalVotes={revealed ? 625 : 418}
            demographics={DEMOGRAPHICS}
            finalStatus={revealed ? 'ENDED' : 'ONGOING'}
            isRevealed={revealed}
            isNotStarted={false}
            countdownText={revealed ? '' : 'เหลืออีก 02:14:33'}
            onSelectParty={(p) => navTo('party', p?.number ?? 1)}
            editorMode={false}
          />
        );
      }
      if (page === 'success') return <BlossomSuccess user={DUMMY_USER} isUnlocked={false} onOpenForm={noop} editorMode={false} />;
      if (page === 'closed') return <BlossomClosed title="ยังไม่เปิดรับลงคะแนน" desc="ขณะนี้ยังไม่ถึงเวลาเริ่มการเลือกตั้ง" variant="waiting" session={null} onLogout={noop} editorMode={false} />;
    }

    // ── receipt family — the "printer moment" Success (R1). Other receipt pages
    //    are ticketed later; they fall through to classic below for now.
    if (family === 'receipt' && page === 'success') {
      return <ReceiptSuccess user={DUMMY_USER} isUnlocked={false} onOpenForm={noop} editorMode={false} />;
    }

    // ── receipt family — CANDIDATES (R4). paper flyers on the desk; links to party. ──
    if (family === 'receipt' && page === 'candidates') {
      return <ReceiptCandidates candidates={parties} editorMode={false} />;
    }

    // ── receipt family — PARTY detail (R4b). the paper dossier; replaces the classic
    //    fallthrough (kills the DeepSeaParticles hydration warning). ──
    if (family === 'receipt' && page === 'party') {
      const partyForDetail = parties.find((p) => p.number === partyNumber) || parties[0];
      return <ReceiptParty party={partyForDetail} galleryImages={[]} showBackToVote editorMode={false} />;
    }

    // ── receipt family — RESULTS (R4). revealed → register-tape standings + demo;
    //    otherwise the SEALED embargo slip (polls open, scores sealed, turnout public). ──
    if (family === 'receipt' && page === 'results') {
      const revealed = variant === 'revealed';
      return (
        <ReceiptResults
          candidates={resultsCandidates(revealed, parties)}
          totalVotes={revealed ? 625 : 418}
          demographics={DEMOGRAPHICS}
          finalStatus={revealed ? 'ENDED' : 'ONGOING'}
          isRevealed={revealed}
          isNotStarted={false}
          countdownText={revealed ? '' : 'เหลืออีก 02:14:33'}
          editorMode={false}
        />
      );
    }

    // ── receipt family — CLOSED (R4). reason via ?variant=ended|closed|waiting. ──
    if (family === 'receipt' && page === 'closed') {
      const c = receiptClosedCopy(variant);
      return <ReceiptClosed title={c.title} desc={c.desc} variant={c.variant} session={null} onLogout={noop} editorMode={false} />;
    }

    // other classic/original inner pages (candidates/results/closed/party): keep the
    // static EditorPreview renders (out of scope). The click seam contains their links.
    return renderPage();
  }

  // eslint-disable-next-line no-inner-declarations
  function renderPage() {
  // ── HOME — HomeRenderer dispatches by template slug for every family ──
  if (page === 'home') {
    return (
      <HomeRenderer
        editorMode
        editorData={DUMMY_ELECTION}
        resolvedTemplate={BUILT_IN_TEMPLATES[slug] || BUILT_IN_TEMPLATES.classic}
        initialData={{ systemMode: 'AUTO', electionStatus: 'ONGOING', stats: { totalVoted: 342, totalEligible: 1200 }, candidates: parties }}
      />
    );
  }

  // ── studio-dark / gumroad / verdure — render the real layout component w/ mock props ──
  if (family === 'studio-dark' || family === 'gumroad' || family === 'verdure') {
    const single = variant === 'single';
    const revealed = variant === 'revealed';
    const voteParties = single ? [parties[0]] : parties;
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
      return frame(<C candidates={parties} editorMode />);
    }
    if (page === 'party') {
      const P = byFamily(StudioDarkParty, GumroadParty, VerdureParty);
      return frame(<P party={parties[0]} galleryImages={[]} showBackToVote={false} />);
    }
    if (page === 'vote') {
      // dev-only: preview the Verdure single-party cinematic wax-seal intro in
      // isolation (no DB change, live election untouched). ?…&variant=single&intro=1
      if (family === 'verdure' && single && sp.get('intro') === '1') {
        return frame(
          <VerdureSingleParty party={parties[0]} specialOptions={SPECIAL} selectedPartyId={null}
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
          candidates={resultsCandidates(revealed, parties)}
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

  // ── blossom family — Candy Editorial inner pages (static preview slides) ──
  if (family === 'blossom') {
    if (page === 'candidates') return <BlossomCandidates candidates={parties} editorMode />;
    if (page === 'party') return <BlossomParty party={parties[0]} galleryImages={[]} showBackToVote={false} editorMode />;
    if (page === 'vote') {
      // ballot static slide — MULTI (T3.2) or SINGLE booth (T3.3); editorMode disables
      // selection/confirm so the slide is a calm static presentation.
      const single = variant === 'single';
      return (
        <BlossomVote
          regularParties={parties}
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
      const revealed = variant === 'revealed';
      return (
        <BlossomResults
          candidates={resultsCandidates(revealed, parties)}
          totalVotes={revealed ? 625 : 418}
          demographics={DEMOGRAPHICS}
          finalStatus={revealed ? 'ENDED' : 'ONGOING'}
          isRevealed={revealed}
          isNotStarted={false}
          countdownText={revealed ? '' : 'เหลืออีก 02:14:33'}
          onSelectParty={noop}
          editorMode
        />
      );
    }
    if (page === 'success') return <BlossomSuccess user={DUMMY_USER} isUnlocked={false} onOpenForm={noop} editorMode />;
    if (page === 'closed') return <BlossomClosed title="ยังไม่เปิดรับลงคะแนน" desc="ขณะนี้ยังไม่ถึงเวลาเริ่มการเลือกตั้ง" variant="waiting" session={null} onLogout={noop} editorMode />;
  }

  // ── receipt family — static "printer moment" Success slide (R1). editorMode →
  //    no print animation, sample choice, full receipt visible for review. ──
  if (family === 'receipt') {
    if (page === 'vote') {
      // ballot static slide — MULTI or SINGLE ink-stamp booth; editorMode disables
      // selection/confirm so the slide is a calm static presentation.
      const single = variant === 'single';
      return (
        <ReceiptVote
          regularParties={parties}
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
    if (page === 'candidates') return <ReceiptCandidates candidates={parties} editorMode />;
    if (page === 'party') return <ReceiptParty party={parties[0]} galleryImages={[]} showBackToVote={false} editorMode />;
    if (page === 'success') return <ReceiptSuccess user={DUMMY_USER} isUnlocked={false} onOpenForm={noop} editorMode />;
    if (page === 'results') {
      const revealed = variant === 'revealed';
      return (
        <ReceiptResults
          candidates={resultsCandidates(revealed, parties)}
          totalVotes={revealed ? 625 : 418}
          demographics={DEMOGRAPHICS}
          finalStatus={revealed ? 'ENDED' : 'ONGOING'}
          isRevealed={revealed}
          isNotStarted={false}
          countdownText={revealed ? '' : 'เหลืออีก 02:14:33'}
          editorMode
        />
      );
    }
    if (page === 'closed') {
      const c = receiptClosedCopy(variant);
      return <ReceiptClosed title={c.title} desc={c.desc} variant={c.variant} session={null} onLogout={noop} editorMode />;
    }
  }

  // ── classic family (incl. original — its inner pages render the classic layout) ──
  if (page === 'candidates') return <CandidatesEditorPreview pageLayout={null} elementConfigs={{}} />;
  if (page === 'vote') {
    // single → the REAL cinematic SinglePartyView (previewMode = full layout, intro
    // skipped) instead of the stripped editor placeholder; multi → editor preview.
    if (variant === 'single') {
      return <SinglePartyView previewMode candidate={parties[0]} specialOptions={SPECIAL} selectedPartyId={null} onSelect={noop} user={DUMMY_USER} />;
    }
    return <VoteEditorPreview simMode="multi" pageLayout={null} elementConfigs={{}} />;
  }
  if (page === 'results') return <ResultsEditorPreview simMode={variant === 'single' ? 'single' : 'multi'} revealed={variant !== 'locked'} />;
  if (page === 'closed') return <ClosedEditorPreview simMode="waiting" />;
  if (page === 'party') return <ClassicPartyPreview party={parties[0]} />;
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
// transform loops are stilled by <MotionConfig reducedMotion="always"> in STATIC mode
// (LiquidMesh honours it, the verdure intro ring/etc. settle; interact mode uses
// "never" — see the MotionConfig note above), and any infinite CSS @keyframes
// (vdDot pulse, vdGlow, vdCueBounce) are allowed a single pass then stop. This kills
// the spinner jank + lets preview_screenshot reach network-idle. Preview route only
// — production pages never mount this, so live animations are untouched.
function PreviewMotionDamp({ interact = false }) {
  return (
    <>
      <style jsx global>{`
        *, *::before, *::after { animation-iteration-count: 1 !important; }
      `}</style>
      {/* P2 #3: the damp froze the gumroad ticker (gtickMove infinite → 1 pass).
          INTERACT mode simulates the real flow, so the marquee must move — restore the
          FULL design animation (duration + count + timing, byte-matching home-ticker/
          gumroad.jsx), not just iteration-count: globals.css's reduce-motion rule also
          forces animation-duration to 0.01ms, and an infinite count on a 0.01ms loop
          spun the ticker at hyper speed on reduce-motion machines. The class selector
          (0,1,0) beats both universal rules (0,0,0) at equal !important.
          Static chooser slides (no interact) stay fully damped by design. The only
          CSS marquee today is .gtick__track — studio's sd-marquee is framer-driven
          (see the MotionConfig note above); vdDot/shine pulses stay damped.
          Plain <style> (not styled-jsx): the SWC styled-jsx transform fails on a
          conditionally-rendered <style jsx> ("failed to process", P-LOG-076). */}
      {interact && (
        <style dangerouslySetInnerHTML={{ __html:
          '.gtick__track { animation: gtickMove 35s linear infinite !important; }' }} />
      )}
    </>
  );
}

// interact mode ONLY: hide the DANGEROUS sign-out affordances (they would log the
// real admin out — no seam, no session here anyway). Sign-IN CTAs stay visible;
// they are simulated via onSignIn. Same selectors the playground uses (all 3
// families share aria-label="ออกจากระบบ").
function PreviewInteractAuthGuard() {
  return (
    <style jsx global>{`
      [aria-label="ออกจากระบบ"],
      .vd-user__out,
      .sd-rail__logout-btn { display: none !important; }
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
