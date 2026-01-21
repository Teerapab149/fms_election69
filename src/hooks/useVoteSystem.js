"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function useVoteSystem() {
  const router = useRouter();

  // 1. 🟢 ใช้ Session จริงจาก NextAuth
  const { data: session, status, update } = useSession();

  // --- State ---
  const [candidates, setCandidates] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection State
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const isFetchingRef = useRef(false);

  // --- 2. 🟢 Fetch Data & Auth Guard (โหมดใช้งานจริง) ---
  useEffect(() => {
    // ป้องกันการทำงานขณะกำลังโหลด Session
    if (status === "loading") return;

    // ถ้าไม่ได้ Login ให้เด้งไปหน้า Login
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    const fetchData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const studentId = session?.user?.studentId || session?.user?.id;
        const timestamp = new Date().getTime();

        // ยิง API ไปที่ Backend จริงๆ
        const [candidatesRes, userStatusRes] = await Promise.all([
          fetch(`/api/results?t=${timestamp}`),
          fetch(`/api/check-status?studentId=${studentId}&t=${timestamp}`)
        ]);

        const candidatesData = await candidatesRes.json();

        // ตรวจสอบสถานะว่าเคยโหวตหรือยัง
        if (userStatusRes.ok) {
          const userData = await userStatusRes.json();
          if (userData.isVoted) {
            router.replace("/results"); // ถ้าโหวตแล้วให้ไปหน้าผล
            return;
          }
          setCurrentUser({ ...session.user, ...userData });
        } else {
          setCurrentUser(session.user);
        }

        // เซ็ตข้อมูลผู้สมัคร
        if (candidatesData.candidates) {
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
  }, [status, session?.user?.id, router]);

  // --- 3. Computed Data (Logic เดิม) ---
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

  // --- 4. Actions ---
  const handleSelectParty = (id) => {
    setSelectedPartyId(prev => prev === id ? null : id);
  };

  // 5. 🟢 Submit Vote (ยิง API จริง)
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
      if (!res.ok) throw new Error(data.error || "โหวตไม่สำเร็จ");

      // อัปเดต Session ว่าโหวตแล้ว และไปหน้าสำเร็จ
      await update({ isVoted: true });
      router.replace("/success?voted=true");
      return true;
    } catch (error) {
      alert("❌ เกิดข้อผิดพลาด: " + error.message);
      setIsSubmitting(false);
      return false;
    }
  };

  return {
    session,
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