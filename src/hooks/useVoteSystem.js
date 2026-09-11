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

      // ⛔ ห้ามเติมตัวเลือกปลอมตรงนี้ (เดิมยัด id 998/999 เมื่อ DB ไม่มีแถวเบอร์ 0/-1)
      // id พวกนั้นไม่มีอยู่จริงใน Candidate ผู้ใช้จึงเลือก "ไม่รับรอง" ได้ กดยืนยัน
      // ดูอนิเมชันหย่อนบัตรจนจบ แล้วค่อยโดน /api/vote ตอบ 400 "ไม่พบตัวเลือกที่เลือก"
      // — บัตรที่เลือกไม่ได้จริงต้องไม่ถูกวาดตั้งแต่แรก ดู ballotIssue ด้านล่าง

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
  const { regularParties, specialOptions, isSingleParty, ballotIssue } = useMemo(() => {
    const regular = candidates.filter(c => parseInt(c.number) > 0);
    // null เมื่อไม่มีแถวจริงใน DB — ห้าม fallback เป็น id สมมติ (ดูหมายเหตุตอน fetch)
    const abstain = candidates.find(c => parseInt(c.number) === 0) || null;
    const disapprove = candidates.find(c => parseInt(c.number) === -1) || null;
    const single = regular.length === 1;

    // บัตรที่ตั้งค่าไม่ครบ = กันไว้ก่อน ไม่ปล่อยให้ลงคะแนนแล้วค่อยพังที่ปลายทาง
    // (พรรคเดียวต้องมี "ไม่รับรอง" ตามกติกา · ทุกแบบต้องมี "งดออกเสียง" — และ
    //  MultiPartyView อ่าน specialOptions.abstain.id ตรง ๆ ถ้าไม่มีจะ throw)
    const missing = [];
    if (!abstain) missing.push("งดออกเสียง");
    if (single && !disapprove) missing.push("ไม่รับรอง");

    return {
      regularParties: regular,
      specialOptions: { abstain, disapprove },
      isSingleParty: single,
      ballotIssue: regular.length > 0 && missing.length
        ? `บัตรเลือกตั้งยังตั้งค่าไม่ครบ — ไม่มีตัวเลือก ${missing.join(" และ ")} ในระบบ`
        : null
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
    ballotIssue,
    selectedPartyId,
    selectedParty,
    handleSelectParty,
    submitVote
  };
}