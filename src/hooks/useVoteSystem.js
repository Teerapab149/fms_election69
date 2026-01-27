"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from "next-auth/react";
import { getEncryptedToken } from "../utils/auth";
import { preloadPartyImages } from "../utils/imagePreloader";

/**
 * Hook สำหรับจัดการระบบโหวต (Hybrid Mode)
 * - Dev Mode / No Session: ใช้ Mock Data
 * - Production / Authenticated: ใช้ Real API
 */
export function useVoteSystem() {
  // --- 1. Session Management ---
  const { data: realSession, status: realStatus } = useSession();

  // Explicit Toggle for Dev Mode (เปลี่ยนเป็น false เพื่อบังคับใช้ Real API เสมอ)
  // หรือจะเช็คจาก process.env.NODE_ENV ก็ได้
  const FORCE_MOCK = false;

  const isMockMode = FORCE_MOCK || realStatus !== "authenticated";

  const session = isMockMode ? {
    user: {
      name: "The Unity User (Dev Mode)",
      studentId: "6610xxxxx",
      email: "test@psu.ac.th",
      role: "student",
      id: "mock-id-123"
    }
  } : realSession;

  const status = isMockMode ? "authenticated" : realStatus;

  // --- 2. State Management ---
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const isFetchingRef = useRef(false);

  const [isVoted, setIsVoted] = useState(false);

  // --- 3. Data Fetching (Factory Pattern) ---
  useEffect(() => {
    const loadData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsLoading(true);

      try {

        const res = await fetch(`/api/check-status?studentId=${session?.user?.studentId}`);
        const data = await res.json();
        setIsVoted(data.isVoted)

        if (data.isVoted) {
          window.location.href = "/success"
          return;
        };

        if (!isMockMode) {
          // [REAL] Fetch from API
          const res = await fetch('/api/party');
          if (!res.ok) throw new Error("Failed to fetch candidates");
          const data = await res.json();

          // Append Special Options manually if not in DB
          if (!data.some(c => c.number === 0)) {
            data.push({ id: 998, number: 0, name: "งดออกเสียง (Abstain)" });
            data.push({ id: 999, number: -1, name: "ไม่รับรองผู้สมัคร (Disapprove)" });
          }
          setCandidates(data);

          // Preload ทุกรูปใน background ระหว่าง loading
          preloadPartyImages(data).catch(console.warn);
        } else {
          // [MOCK] Simulate Network
          await new Promise(r => setTimeout(r, 500));
          const membersList = Array.from({ length: 21 }, (_, i) => `Member ${i + 1}: Name Surname`);
          setCandidates([
            {
              id: 1,
              number: 1,
              name: "The Unity Concord Of FMS",
              members: membersList,
              policy: "Unity, Integrity, and Excellence for FMS.",
              logo: "https://via.placeholder.com/150?text=FMS+Unity"
            },
            { id: 998, number: 0, name: "งดออกเสียง (Abstain)" },
            { id: 999, number: -1, name: "ไม่รับรองผู้สมัคร (Disapprove)" }
          ]);
        }
      } catch (error) {
        console.error("Failed to load candidates:", error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    if (status !== "loading") {
      loadData();
    }
  }, [isMockMode, status]);

  // --- 4. Vote Submission ---
  const submitVote = async () => {
    if (selectedPartyId === null) return false;
    setIsSubmitting(true);

    try {
      if (!isMockMode) {
        // [REAL] Post to API
        const encryptedToken = getEncryptedToken();
        if (!encryptedToken) {
          console.error("Encryption failed");
          return;
        }
        const res = await fetch('/api/vote', {
          method: 'POST',
          body: JSON.stringify({
            studentId: session?.user?.studentId,
            candidateId: selectedPartyId
          }),
          headers: { 'Content-Type': 'application/json', 'x-admin-token': encryptedToken }
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Vote Failed");
        return true;
      } else {
        // [MOCK] Simulate API Call
        await new Promise(r => setTimeout(r, 1000));
        console.log("🗳️ [Mock Vote Submitted Successfully]", {
          candidateId: selectedPartyId,
          voter: session?.user?.name
        });
        return true;
      }
    } catch (error) {
      console.error("Vote Error:", error);
      alert(error.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 5. Computed Data ---
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