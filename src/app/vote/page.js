"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPath } from '../../utils/basePath';
import { setEphemeralChoice } from '../../utils/ephemeralChoice';
import { ELECTION_YEAR_TH } from '../../utils/electionConfig';
import PartyDetailModal from '../../components/PartyDetailModal';
import VoteConfirmationModal from '../../components/VoteConfirmationModal';
import { Loader2, Sparkles } from 'lucide-react';
// Components
import Navbar from '../../components/Navbar';
import PageThemeOverrides from '../../components/PageThemeOverrides';
import ThemedLoadingScreen from '../../components/ThemedLoadingScreen';
import SinglePartyView from '../../components/vote/SinglePartyView';
import MultiPartyView from '../../components/vote/MultiPartyView';
import GumroadVote from '../../components/vote/GumroadVote';
import StudioDarkVote from '../../components/vote/StudioDarkVote';
import VerdureVote from '../../components/vote/VerdureVote';
import BlossomVote from '../../components/vote/BlossomVote';
import ReceiptVote from '../../components/vote/ReceiptVote';
import VoteFooter from '../../components/vote/VoteFooter';

// Hook
import { useVoteSystem } from '../../hooks/useVoteSystem';

export default function VotePage() {
  const {
    session,
    isLoading,
    isSubmitting,
    regularParties,
    specialOptions,
    isSingleParty,

    // Selection State
    selectedPartyId,
    selectedParty,

    // Actions
    handleSelectParty,
    submitVote
  } = useVoteSystem();
  const router = useRouter();
  const handleSingleSelect = (id) => {
    handleSelectParty(id);
  };
  // Modal States (UI Only)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [partyForModal, setPartyForModal] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // ✅ Prevent double click during redirect
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 🧱 pageLayout config for MultiPartyView (fetched from admin Page Design tab)
  const [voteConfig, setVoteConfig] = useState({});
  // Active template — drives the per-page LAYOUT dispatch (gumroad has its own).
  const [activeTemplateId, setActiveTemplateId] = useState('classic');
  // Gate render until the template is known — otherwise the classic layout (with
  // its own cinematic AutoIntro) flashes for a frame before the real template
  // resolves, looking like a stray "old intro".
  const [templateReady, setTemplateReady] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(getPath('/api/admin/page-layout'));
        if (res.ok) {
          const data = await res.json();
          if (data?.vote?.multiParty) {
            setVoteConfig(data.vote.multiParty);
          }
          if (data?.activeTemplateId) {
            setActiveTemplateId(data.activeTemplateId);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch page layout, using defaults');
      } finally {
        setTemplateReady(true);
      }
    };
    fetchConfig();
  }, []);

  const isGumroad = activeTemplateId?.startsWith('gumroad');
  const isStudio = activeTemplateId?.startsWith('studio-dark');
  const isVerdure = activeTemplateId?.startsWith('verdure');
  const isBlossom = activeTemplateId?.startsWith('blossom');
  const isReceipt = activeTemplateId?.startsWith('receipt');
  // Blossom Candy Editorial ballot — MULTI (T3.2) + SINGLE booth (T3.3). BlossomVote
  // dispatches internally to BlossomSingleParty when isSingleParty.
  const useBlossomVote = isBlossom;
  // Receipt "Paper Materiality" ballot — MULTI sheet + SINGLE ink-stamp booth (R3).
  // ReceiptVote dispatches internally to ReceiptSingleParty when isSingleParty.
  const useReceiptVote = isReceipt;

  // --- Handlers ---
  const handleViewDetails = (party) => {
    setPartyForModal(party);
    setIsDetailModalOpen(true);
  };

  // Adapter for SinglePartyView to work with Footer
  // When buttons in SinglePartyView are clicked, we just update the Selection State
  const handleSingleAction = (type) => {
    if (type === 'VOTE') handleSelectParty(regularParties[0].id);
    else if (type === 'DISAPPROVE') handleSelectParty(specialOptions.disapprove?.id);
    else if (type === 'NO_VOTE') handleSelectParty(specialOptions.abstain?.id);
  };

  // Receipt-only: the ballot-secrecy §2 label shown ONCE on the printer-moment
  // success page. Number 0 = abstain, -1 = disapprove, else the party name. Never
  // persisted — only the in-memory ephemeral holder carries it (see below).
  const receiptChoiceLabel = () => {
    const p = selectedParty;
    if (!p) return null;
    if (p.number === 0) return "งดออกเสียง";
    if (p.number === -1) return "ไม่รับรอง";
    return p.name || null;
  };

  const onConfirmVote = async () => {
    if (isRedirecting) return; // 🔒 Guard

    // Capture the choice label BEFORE the POST (selection can't change mid-submit).
    const choiceLabel = isReceipt ? receiptChoiceLabel() : null;

    const success = await submitVote();
    if (success) {
      setIsRedirecting(true); // 🔒 Lock UI
      setIsConfirmModalOpen(false)
      // Receipt family: hand the just-cast choice to the in-memory ephemeral holder
      // (CONCEPT §2 / §9 Q4 — shown once, never persisted, no storage/URL/cookie) and
      // navigate SOFT so the module scope survives to the success page's mount, where
      // consumeEphemeralChoice() reads it once. A hard nav would (by design) drop the
      // value → the secrecy fallback. Every other family keeps its hard-nav redirect.
      if (isReceipt) {
        setEphemeralChoice(choiceLabel);
        router.push("/success");
      } else {
        window.location.href = getPath("/success");
      }
    };
  };


  // --- Render ---
  if (isLoading || !templateReady) {
    return <ThemedLoadingScreen text="กำลังตรวจสอบสิทธิ์..." />;
  }

  return (
    <div className={isStudio
      ? "min-h-screen flex flex-col font-sans overflow-x-hidden relative bg-[#14140F]"
      : isVerdure
      ? "min-h-screen flex flex-col font-sans overflow-x-hidden relative bg-[#E7F1E2]"
      : useBlossomVote || useReceiptVote
      ? "min-h-screen flex flex-col font-sans overflow-x-hidden relative"
      : "min-h-screen flex flex-col font-sans pb-32 overflow-x-hidden relative bg-[var(--color-bg)]"}>
      <PageThemeOverrides page="vote" />

      {useReceiptVote ? (
        <ReceiptVote
          regularParties={regularParties}
          specialOptions={specialOptions}
          selectedPartyId={selectedPartyId}
          onSelect={handleSelectParty}
          onViewDetails={handleViewDetails}
          isSingleParty={isSingleParty}
          user={session?.user}
          isSubmitting={isSubmitting || isRedirecting}
          onConfirm={isSingleParty ? onConfirmVote : () => setIsConfirmModalOpen(true)}
        />
      ) : useBlossomVote ? (
        <BlossomVote
          regularParties={regularParties}
          specialOptions={specialOptions}
          selectedPartyId={selectedPartyId}
          onSelect={handleSelectParty}
          onViewDetails={handleViewDetails}
          isSingleParty={isSingleParty}
          user={session?.user}
          isSubmitting={isSubmitting || isRedirecting}
          onConfirm={isSingleParty ? onConfirmVote : () => setIsConfirmModalOpen(true)}
        />
      ) : isVerdure ? (
        <VerdureVote
          regularParties={regularParties}
          specialOptions={specialOptions}
          selectedPartyId={selectedPartyId}
          onSelect={handleSelectParty}
          onViewDetails={handleViewDetails}
          isSingleParty={isSingleParty}
          user={session?.user}
          isSubmitting={isSubmitting || isRedirecting}
          onConfirm={isSingleParty ? onConfirmVote : () => setIsConfirmModalOpen(true)}
        />
      ) : isStudio ? (
        <StudioDarkVote
          regularParties={regularParties}
          specialOptions={specialOptions}
          selectedPartyId={selectedPartyId}
          onSelect={handleSelectParty}
          onViewDetails={handleViewDetails}
          isSingleParty={isSingleParty}
          user={session?.user}
          isSubmitting={isSubmitting || isRedirecting}
          onConfirm={isSingleParty ? onConfirmVote : () => setIsConfirmModalOpen(true)}
        />
      ) : isGumroad ? (
        <GumroadVote
          regularParties={regularParties}
          specialOptions={specialOptions}
          selectedPartyId={selectedPartyId}
          onSelect={handleSelectParty}
          onViewDetails={handleViewDetails}
          isSingleParty={isSingleParty}
          user={session?.user}
          isSubmitting={isSubmitting || isRedirecting}
          onConfirm={isSingleParty ? onConfirmVote : () => setIsConfirmModalOpen(true)}
        />
      ) : (
       <>
      {!isSingleParty && (
        <>
          {/* Full-bleed themed background — grid texture + soft corner blobs, same
              language as the other pages (candidates/results/closed). */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[60%] md:w-[40%] h-[40%] rounded-full blur-[80px] md:blur-[120px]"
              style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-accent) 12%, transparent))' }} />
            <div className="absolute bottom-[-5%] left-[-5%] w-[50%] md:w-[35%] h-[35%] rounded-full blur-[80px] md:blur-[120px]"
              style={{ background: 'linear-gradient(to top right, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-primary) 10%, transparent))' }} />
            <div className="absolute inset-0"
              style={{ backgroundImage: 'linear-gradient(to right, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>
          <div className="relative z-50">
            <Navbar />
          </div>
        </>
      )}

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10 max-w-4xl w-full">

        {isSingleParty ? (
          <SinglePartyView
            candidate={regularParties[0]}
            selectedPartyId={selectedPartyId}
            onSelect={handleSelectParty}
            specialOptions={specialOptions}
            user={session?.user}
          />
        ) : (
          <MultiPartyView
            regularParties={regularParties}
            specialOptions={specialOptions}
            selectedPartyId={selectedPartyId}
            onSelect={handleSelectParty} // Multi view ก็น่าจะใช้ onSelect เหมือนกัน (เช็คไฟล์ MultiPartyView ด้วยว่ารับ props ชื่ออะไร)
            onViewDetails={handleViewDetails}
            config={voteConfig}
          />
        )}
      </main>

      <VoteFooter
        selectedParty={selectedParty}
        isSubmitting={isSubmitting || isRedirecting} // ✅ Disable when redirecting too
        variant={isSingleParty ? "single" : "multi"}
        partyPrimary={regularParties?.[0]?.themePrimary || (isSingleParty ? "var(--spv-footer-primary, #4D2A67)" : "#4D2A67")}
        partyGold={regularParties?.[0]?.themeGold || (isSingleParty ? "var(--spv-footer-gold, #CDA176)" : "#CDA176")}
        onConfirm={
          isSingleParty
            ? onConfirmVote              // ✅ single: กดใน footer modal แล้วค่อย submitVote
            : () => setIsConfirmModalOpen(true) // ✅ multi: เปิด VoteConfirmationModal เดิม
        }
      />
       </>
      )}

      {/* Modals */}
      <PartyDetailModal
        party={partyForModal}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        showVoteButton={false}
      />

      {!isSingleParty && (
        <VoteConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={onConfirmVote}
          party={selectedParty}
          isVoteNo={selectedParty?.number === 0}
          isDisapprove={selectedParty?.number === -1}
          isSubmitting={isSubmitting || isRedirecting} // ✅ Pass explicit submitting state to modal (if supported)
        />
      )}

      {/* Animation keyframes — scoped to vote page */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes stagger-fade-in {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-stagger-card {
          opacity: 0;
          animation: stagger-fade-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}