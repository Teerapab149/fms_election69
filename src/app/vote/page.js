"use client";

import { useState } from 'react';
import { getPath } from '../../utils/basePath';
import { ELECTION_YEAR_TH } from '../../utils/electionConfig';
import PartyDetailModal from '../../components/PartyDetailModal';
import VoteConfirmationModal from '../../components/VoteConfirmationModal';
import { Loader2, Sparkles } from 'lucide-react';

// Components
import Navbar from '../../components/Navbar';
import SinglePartyView from '../../components/vote/SinglePartyView';
import MultiPartyView from '../../components/vote/MultiPartyView';
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
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FD]">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8A2680]/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="relative w-12 h-12 text-[#8A2680] animate-spin mb-4" />
        </div>
        <p className="text-slate-500 font-semibold animate-pulse mt-4">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  return (
    // DESIGN.md: Layer 0 background (#fff3fe)
    <div className="min-h-screen flex flex-col font-sans pb-32 overflow-x-hidden relative" style={{ backgroundColor: '#fff3fe' }}>

      {/* ─── Multi-party only: Background Decor + Navbar ───────────────────────
          SinglePartyView handles its own portal layout — do NOT touch it
          DESIGN.md: tonal depth with primary (#7244a8) tinted ambient blobs
      ─────────────────────────────────────────────────────────────────────── */}
      {!isSingleParty && (
        <>
          {/* Background Decor — primary-tinted blobs + subtle grid */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Top-right: primary/pink ambient glow */}
            <div className="absolute top-[-10%] right-[-5%] w-[60%] md:w-[40%] h-[40%] rounded-full blur-[80px] md:blur-[120px]"
              style={{ background: 'radial-gradient(circle, rgba(114,68,168,0.08) 0%, rgba(195,146,252,0.06) 60%, transparent 100%)' }}
            />
            {/* Bottom-left: secondary blue tint */}
            <div className="absolute bottom-[-5%] left-[-5%] w-[50%] md:w-[35%] h-[35%] rounded-full blur-[80px] md:blur-[120px]"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, rgba(114,68,168,0.04) 60%, transparent 100%)' }}
            />
            {/* Center: subtle primary wash */}
            <div className="absolute top-[30%] left-[40%] w-[30%] h-[25%] rounded-full blur-[100px]"
              style={{ background: 'radial-gradient(circle, rgba(195,146,252,0.05) 0%, transparent 70%)' }}
            />
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#3d254906_1px,transparent_1px),linear-gradient(to_bottom,#3d254906_1px,transparent_1px)] bg-[size:32px_32px] md:bg-[size:40px_40px]" />
          </div>

          {/* Navbar */}
          <div className="relative z-50">
            <Navbar />
          </div>
        </>
      )}

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 md:py-12 relative z-10 max-w-5xl w-full">

        {/* Header (Only for Multi) — DESIGN.md: editorial voice, Display-LG scale */}
        {!isSingleParty && (
          <div className="text-center mb-10 md:mb-14 animate-fade-in-up">

            {/* Chip badge — DESIGN.md: Glassmorphism + inset highlight */}
            <div
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full backdrop-blur-xl mb-5 md:mb-7"
              style={{
                backgroundColor: 'rgba(255,255,255,0.65)',
                boxShadow: '0 4px 20px rgba(61,37,73,0.05), inset 0 0.5px 0 rgba(255,255,255,0.6)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#7244a8' }} />
              <span className="text-[9px] md:text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: '#7244a8' }}>
                ลงคะแนนเสียง
              </span>
            </div>

            {/* Title — DESIGN.md: Display-LG, Signature Gradient */}
            <h1 className="flex flex-col items-center justify-center font-black tracking-tighter leading-[1.15] mb-4 md:mb-6">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-1 sm:mb-2 text-[#3d2549]">
                เลือกตั้ง<span className="text-transparent bg-clip-text ml-1" style={{ backgroundImage: 'linear-gradient(135deg, #7244a8, #c392fc)' }}>สโมสรนักศึกษา</span>
              </div>
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#3d2549]/70 tracking-tight">
                คณะวิทยาการจัดการ ประจำปี {ELECTION_YEAR_TH}
              </div>
            </h1>

            {/* User greeting — on-surface text */}
            <p className="text-sm md:text-base font-medium" style={{ color: '#3d254980' }}>
              สวัสดีคุณ{' '}
              <span className="font-bold px-2.5 py-0.5 rounded-lg" style={{ color: '#7244a8', backgroundColor: '#f9e0ff' }}>
                {session?.user?.name}
              </span>
              {' '}โปรดเลือกพรรคที่ต้องการ
            </p>
          </div>
        )}

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