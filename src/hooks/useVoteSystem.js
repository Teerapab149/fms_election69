// src/hooks/useVoteSystem.js
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function useVoteSystem() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // --- State ---
  const [candidates, setCandidates] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection State (This drives the footer)
  const [selectedPartyId, setSelectedPartyId] = useState(null);

  // ✅ เพิ่ม Ref เพื่อป้องกันการ Fetch ซ้ำซ้อน (ช่วยเรื่อง Performance)
  const isFetchingRef = useRef(false);

  // --- 1. Fetch Data & Auth Guard ---
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    const fetchData = async () => {
      // ป้องกันการเรียกซ้ำ
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const studentId = session?.user?.studentId || session?.user?.id;

        // ✅ FIX 1 (iPad): เพิ่ม Timestamp เพื่อแก้ปัญหา Caching
        const timestamp = new Date().getTime();

        // Fetch parallel พร้อม headers ห้าม Cache
        const [candidatesRes, userStatusRes] = await Promise.all([
          fetch(`/api/results?t=${timestamp}`, {
             cache: 'no-store',
             headers: { 'Cache-Control': 'no-cache, no-store' }
          }),
          fetch(`/api/check-status?studentId=${studentId}&t=${timestamp}`, {
             cache: 'no-store',
             headers: { 'Cache-Control': 'no-cache, no-store' }
          })
        ]);

        const candidatesData = await candidatesRes.json();

        // Check if user already voted
        if (userStatusRes.ok) {
          const userData = await userStatusRes.json();
          if (userData.isVoted) {
            router.replace("/results");
            return;
          }
          setCurrentUser({ ...session.user, ...userData });
        } else {
          setCurrentUser(session.user);
        }

        // Set Candidates
        if (candidatesData.candidates) {
          // ✅ FIX 3: Safe Sort (สร้าง Array ใหม่ก่อนเรียง เพื่อไม่ให้กระทบ State โดยตรง)
          const sorted = [...candidatesData.candidates].sort((a, b) => a.number - b.number);
          setCandidates(sorted);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchData();

  // ✅ FIX 2 (Mobile): เปลี่ยน dependency จาก session เป็น session?.user?.id เพื่อแก้ Infinite Loop
  }, [status, session?.user?.id, router]);

  // --- 2. Computed Data (Helpers) ---
  const { regularParties, specialOptions, isSingleParty } = useMemo(() => {
    const regular = candidates.filter(c => parseInt(c.number) > 0);
    const abstain = candidates.find(c => parseInt(c.number) === 0);
    const disapprove = candidates.find(c => parseInt(c.number) === -1);

    return {
      regularParties: regular,
      specialOptions: { abstain, disapprove },
      isSingleParty: regular.length === 1
    };
  }, [candidates]);

  const selectedParty = candidates.find(c => c.id === selectedPartyId);

  // --- 3. Actions ---

  // Select Party (Toggle logic)
  const handleSelectParty = (id) => {
    setSelectedPartyId(prev => prev === id ? null : id);
  };

  // Submit Vote (API Call)
  const submitVote = async () => {
    if (!currentUser || selectedPartyId === null) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUser.studentId || currentUser.id,
          candidateId: selectedPartyId
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh Session immediately
      await update({ isVoted: true });

      // Redirect
      router.replace("/success?voted=true");
      return true; // Success signal

    } catch (error) {
      alert("❌ เกิดข้อผิดพลาด: " + error.message);
      setIsSubmitting(false);
      return false; // Fail signal
    }
  };

  return {
    // Data
    session,
    isLoading,
    isSubmitting,
    candidates,
    regularParties,
    specialOptions,
    isSingleParty,
    
    // Selection
    selectedPartyId,
    selectedParty,
    
    // Actions
    handleSelectParty, // ใช้ชื่อเดิมตามโค้ดคุณ
    submitVote
  };
}