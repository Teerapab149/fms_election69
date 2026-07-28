"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { preloadPartyImages } from "../utils/imagePreloader";
import { getPath } from "../utils/basePath";
import { fetchVoteStatus, invalidateVoteStatus } from "./useVoteStatus";

/**
 * Hook สำหรับจัดการระบบโหวต (Production Mode Only)
 * - บังคับ Login เท่านั้น
 * - ไม่มี Mock Data ใดๆ
 */
export function useVoteSystem() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // --- State Management ---
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const isFetchingRef = useRef(false);
  const [isVoted, setIsVoted] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    // 1. Wait for Session
    if (status === "loading") return;

    // 2. Enforce Login
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.studentId) {
      loadData(session.user.studentId);
    }

  }, [status, session]);

  const loadData = async (studentId) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      // A. Check User & System Status — force:true because this is the vote-page
      // GATE; a cached isVoted here could let a just-voted user see the ballot
      // again (the server's atomic guard still blocks the double vote, but the
      // redirect must be right).
      const statusData = await fetchVoteStatus({ force: true });
      setIsVoted(statusData.isVoted);

      // router.replace, not window.location.href. These are GATES — the voter
      // never chose to come here — so they must not leave a back-stack entry, and
      // a hard nav costs a full document load plus a fresh /api/auth/session round
      // trip before the destination can even decide what to render. Chained (vote
      // gate -> success gate) that is two blank loading screens for something the
      // app already knows. Every consumer of the vote status now forces its own
      // read, so nothing here depends on the reload to refresh state.
      if (statusData.isSystemOpen === false) {
        router.replace("/closed");
        return;
      }

      if (statusData.isVoted) {
        router.replace("/success");
        return;
      }

      // B. Fetch Candidates (Real Only)
      const resParty = await fetch(getPath('/api/party'));
      if (!resParty.ok) throw new Error("Failed to fetch candidates");

      const partyData = await resParty.json();

      // Append Special Options if missing
      if (!partyData.some(c => c.number === 0)) {
        partyData.push({ id: 998, number: 0, name: "งดออกเสียง (Abstain)" });
        partyData.push({ id: 999, number: -1, name: "ไม่รับรองผู้สมัคร (Disapprove)" });
      }

      setCandidates(partyData);
      preloadPartyImages(partyData).catch(console.warn);

    } catch (error) {
      console.error("Vote System Error:", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // --- Vote Submission ---
  const submitVote = async () => {
    if (selectedPartyId === null) return false;
    if (status !== "authenticated") {
      router.replace("/login");
      return false;
    }

    setIsSubmitting(true);

    try {
      // Voter identity = the NextAuth session cookie (server reads studentId from
      // the verified session — the body field & old x-admin-token were never used).
      const res = await fetch(getPath('/api/vote'), {
        method: 'POST',
        body: JSON.stringify({ candidateId: selectedPartyId }),
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Vote Failed");

      // The vote changed isVoted — drop the shared cache so the success page
      // (and anything else) re-reads fresh status.
      invalidateVoteStatus();
      return true;

    } catch (error) {
      console.error("Vote Error:", error);
      alert(error.message || "การลงคะแนนล้มเหลว กรุณาลองใหม่");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Computed Data ---
  const { regularParties, specialOptions, isSingleParty } = useMemo(() => {
    const regular = candidates.filter(c => parseInt(c.number) > 0);
    const abstain = candidates.find(c => parseInt(c.number) === 0) || { id: 998, number: 0, name: "Abstain" };
    const disapprove = candidates.find(c => parseInt(c.number) === -1) || { id: 999, number: -1, name: "Disapprove" };

    return {
      regularParties: regular,
      specialOptions: { abstain, disapprove },
      isSingleParty: regular.length === 1
    };
  }, [candidates]);

  const selectedParty = useMemo(() =>
    candidates.find(c => c.id === selectedPartyId),
    [candidates, selectedPartyId]);

  const handleSelectParty = (id) => {
    setSelectedPartyId(prev => prev === id ? null : id);
  };

  return {
    session,
    status,
    isLoading,
    isSubmitting,
    candidates,
    regularParties,
    specialOptions,
    isSingleParty,
    selectedPartyId,
    selectedParty,
    handleSelectParty,
    submitVote
  };
}