"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { preloadPartyImages } from "../utils/imagePreloader";
import { getPath } from "../utils/basePath";
import { fetchVoteStatus, invalidateVoteStatus } from "./useVoteStatus";
import { classifyVoteResponse, classifyRecheck, voteErrorFor } from "../lib/election/voteOutcome.mjs";

// How long a vote may take before we stop waiting for it. The server can
// legitimately spend maxWait 15s getting a connection plus a 15s transaction
// (VOTE_TX_OPTIONS in api/vote/route.js) plus the queries before it, so anything
// shorter would give up on votes that are about to commit. Aborting only stops
// us listening; the handler runs on, which is why a timeout is "unclear" and is
// re-checked, never reported as "not recorded".
const VOTE_TIMEOUT_MS = 40_000;
// fetchVoteStatus takes no signal, so the re-check gets its own ceiling.
const RECHECK_TIMEOUT_MS = 10_000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

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
  // What the vote page shows when a vote did not go through cleanly:
  // { kind, title, message, actionLabel, actionHint, dismissLabel, dismissHint }
  // (voteErrorFor in lib/election/voteOutcome.mjs). Never carries the choice.
  const [voteError, setVoteError] = useState(null);

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
    setVoteError(null);

    try {
      let outcome;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), VOTE_TIMEOUT_MS);
      try {
        // Voter identity = the NextAuth session cookie (server reads studentId from
        // the verified session — the body field & old x-admin-token were never used).
        const res = await fetch(getPath('/api/vote'), {
          method: 'POST',
          body: JSON.stringify({ candidateId: selectedPartyId }),
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        // Text first, JSON maybe: a proxy's 502/504 is an HTML page, and the
        // parser's English ("Unexpected token '<'") is what students used to see.
        const bodyText = await res.text();
        outcome = classifyVoteResponse({ ok: res.ok, status: res.status, bodyText });
      } catch {
        // offline, connection dropped, or our own timeout: the request may still
        // have committed on the server
        outcome = { kind: "unclear" };
      } finally {
        clearTimeout(timer);
      }

      if (outcome.kind === "unclear" || outcome.kind === "failed") {
        // Ask the server what actually happened before saying anything. SERVER
        // ("failed") is re-checked too: a COMMIT whose acknowledgement is lost
        // makes Prisma throw after the row is written, and the handler's catch
        // still answers SERVER. Only SERVER + "not voted" may say "not recorded".
        // If it says "voted", this submission may not be the one that was
        // counted (two tabs pressing at once): the atomic guard counted exactly
        // one of them, and there is no user→ballot link by design, so "you have
        // voted" is still the true sentence.
        const serverFailed = outcome.kind === "failed";
        let statusData = null;
        let failed = false;
        try {
          statusData = await withTimeout(fetchVoteStatus({ force: true }), RECHECK_TIMEOUT_MS);
        } catch {
          failed = true;
        }
        outcome = classifyRecheck({ statusData, failed, serverFailed });
      }

      if (outcome.kind === "ok") {
        // The vote changed isVoted — drop the shared cache so the success page
        // (and anything else) re-reads fresh status.
        invalidateVoteStatus();
        return true;
      }
      // voted elsewhere (another tab or phone): the cached isVoted:false is stale
      if (outcome.kind === "voted") invalidateVoteStatus();

      // the kind and code only, never the choice
      console.warn("[vote] not confirmed:", outcome.code || outcome.kind);
      setVoteError(voteErrorFor(outcome));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissVoteError = () => setVoteError(null);

  // The main button of the vote error. "retry" re-sends from the page (it owns
  // the cast animation) and "notice" just closes; every other kind leaves the
  // ballot, because the ballot behind it can no longer be cast (already voted,
  // box closed, signed out, not eligible) or its state is unknown.
  const runVoteErrorAction = () => {
    switch (voteError?.kind) {
      case "voted": router.replace("/success"); break;
      // signOut, not router.replace: the server has rejected this session, but
      // the client still believes it is signed in, and /login sends such a
      // client straight back to /vote. Local session only (no SSO end-session),
      // so signing back in is one click. Raw path + getPath, like
      // GumroadMobileMenu's signOut callbackUrl.
      case "login": signOut({ callbackUrl: getPath("/login") }); break;
      // same destination as the vote gate above when isSystemOpen is false
      case "closed": router.replace("/closed"); break;
      case "blocked": router.replace("/"); break;
      // a full reload re-runs the vote gate, which sends a voted student to /success
      case "unknown": window.location.reload(); break;
      default: setVoteError(null);
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
    submitVote,
    voteError,
    dismissVoteError,
    runVoteErrorAction
  };
}