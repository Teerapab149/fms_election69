"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { getEncryptedToken } from "../utils/auth";
import { preloadPartyImages } from "../utils/imagePreloader";
import { getPath } from "../utils/basePath";

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
      // A. Check User & System Status
      const resStatus = await fetch(getPath(`/api/check-status?studentId=${studentId}`));
      if (!resStatus.ok) throw new Error("Failed to check status");

      const statusData = await resStatus.json();
      setIsVoted(statusData.isVoted);

      // 🛑 Strict Redirect if System Closed
      if (statusData.isSystemOpen === false) {
        window.location.href = "/closed";
        return;
      }

      if (statusData.isVoted) {
        window.location.href = "/success";
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
      const encryptedToken = getEncryptedToken();
      if (!encryptedToken) {
        throw new Error("Security check failed");
      }

      const res = await fetch(getPath('/api/vote'), {
        method: 'POST',
        body: JSON.stringify({
          studentId: session?.user?.studentId,
          candidateId: selectedPartyId
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': encryptedToken
        }
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Vote Failed");

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