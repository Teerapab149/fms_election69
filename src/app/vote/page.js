"use client";

import { useState, useEffect } from 'react';
import { getPath } from '../../utils/basePath';
import { ELECTION_YEAR_TH } from '../../utils/electionConfig';
import PartyDetailModal from '../../components/PartyDetailModal';
import VoteConfirmationModal from '../../components/VoteConfirmationModal';
import { Loader2, Sparkles } from 'lucide-react';
// Components
import Navbar from '../../components/Navbar';
import PageThemeOverrides from '../../components/PageThemeOverrides';
import SinglePartyView from '../../components/vote/SinglePartyView';
import MultiPartyView from '../../components/vote/MultiPartyView';
import GumroadVote from '../../components/vote/GumroadVote';
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

  const isGumroad = activeTemplateId === 'gumroad';

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

  const onConfirmVote = async () => {
    if (isRedirecting) return; // 🔒 Guard

    const success = await submitVote();
    if (success) {
      setIsRedirecting(true); // 🔒 Lock UI
      setIsConfirmModalOpen(false)
      window.location.href = getPath("/success");
    };
  };


  // --- Render ---
  if (isLoading || !templateReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FD]">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8A2680]/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="relative w-12 h-12 text-[var(--color-primary)] animate-spin mb-4" />
        </div>
        <p className="text-slate-500 font-semibold animate-pulse mt-4">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans pb-32 overflow-x-hidden relative bg-[#F8F9FD]">
      <PageThemeOverrides page="vote" />

      {isGumroad ? (
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
          {/* Background decoration — fixed, behind everything */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[60%] md:w-[40%] h-[40%] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
            <div className="absolute bottom-[-5%] left-[-5%] w-[50%] md:w-[35%] h-[35%] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px]"></div>
          </div>

          {/* Navbar */}
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
        partyPrimary={regularParties?.[0]?.themePrimary || "#4D2A67"}
        partyGold={regularParties?.[0]?.themeGold || "#CDA176"}
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