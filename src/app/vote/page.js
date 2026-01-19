"use client";

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import PartyDetailModal from '../../components/PartyDetailModal';
import VoteConfirmationModal from '../../components/VoteConfirmationModal';
import { Loader2 } from 'lucide-react';

// Components
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
    const success = await submitVote();
    if (success) setIsConfirmModalOpen(false);
  };


  // --- Render ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="w-10 h-10 text-[#8A2680] animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] font-sans selection:bg-purple-100 pb-32 overflow-x-hidden relative">
      <Navbar />

      {/* Decor */}
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-50/40 via-white/10 to-transparent z-0 pointer-events-none"></div>

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10 max-w-4xl w-full">

        {/* Header (Only for Multi) */}
        {!isSingleParty && (
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl font-black text-[#8A2680] mb-2 tracking-tight">เลือกตั้งสโมสรนักศึกษา</h1>
            <p className="mt-2 text-sm md:text-base text-slate-500 font-medium">
              สวัสดีคุณ <span className="font-bold text-[#8A2680]">{session?.user?.name}</span> โปรดเลือกพรรคที่ต้องการ
            </p>
          </div>
        )}

        {isSingleParty ? (
          <SinglePartyView
            candidate={regularParties[0]}
            selectedPartyId={selectedPartyId}
            onSelect={handleSelectParty}
            specialOptions={specialOptions}
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

      {/* Sticky Footer (The only place that triggers Confirmation) */}
      <VoteFooter
        selectedParty={selectedParty}
        onConfirm={() => setIsConfirmModalOpen(true)}
        isSubmitting={isSubmitting}
      />

      {/* Modals */}
      <PartyDetailModal
        party={partyForModal}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        showVoteButton={false}
      />

      <VoteConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={onConfirmVote} // Calls the hook's submit logic
        party={selectedParty}
        isVoteNo={selectedParty?.number === 0}
        isDisapprove={selectedParty?.number === -1}
      />
    </div>
  );
}