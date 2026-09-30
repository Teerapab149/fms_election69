"use client";

// useElectionStatus — the ONE answer to "where is the election right now, and
// what can this voter do about it". Every v2 template reads status, the primary
// action and the countdown from here, so no two parts of a screen can disagree.
//
// Why it exists (2026-09-29 template audit):
// - Studio Dark showed "POLLS CLOSED" in its top strip and "POLLS OPEN" a few
//   pixels below it: two components each computing status their own way.
// - FMS Official's countdown looked only at the dates while its button looked at
//   the system mode, so MANUAL_OPEN after the scheduled end said "closed" and
//   "go vote" on the same screen.
// - In AUTO mode after the end time the server reports isSystemOpen=false with
//   mode still AUTO, and the voteCTA resolver maps that to "closed" — whose copy
//   is "not open yet, come back later". Here that case is "ended".
// - The legacy countdown resolver has a "nextYear" state (Original's 345-day
//   "SEE YOU 2027"). v2 templates never count towards next year: once the polls
//   close, the countdown is simply gone.
//
// Inputs are the same data the pages already have; nothing new is fetched.

import { useEffect, useMemo, useState } from "react";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../utils/electionConfig";
import { deriveElectionStatus } from "../lib/election/electionStatus.mjs";

export { deriveElectionStatus };


function split(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/**
 * @param {object} p
 * @param {object} p.globalConfig   admin config (dates)
 * @param {string} p.systemMode     AUTO | MANUAL_OPEN | PAUSE | ENDED
 * @param {boolean} p.isSystemOpen  server's verdict at render time
 * @param {string} p.electionStatus WAITING | ONGOING | CLOSED | ENDED
 * @param {boolean} p.signedIn
 * @param {boolean} p.isVoted
 * @param {boolean} p.tick          set false for static renders (editor/thumbnails)
 * @param {{start: number, end: number}} [p.previewDates]  /template-preview only:
 *   epoch-ms dates that stand in for the configured ones, so every phase can be
 *   reviewed without editing the real election schedule
 */
export function useElectionStatus({
  globalConfig, systemMode = "AUTO", isSystemOpen = false, electionStatus = null,
  signedIn = false, isVoted = false, tick = true, previewDates = null,
}) {
  const { ELECTION_START, ELECTION_END } = useMemo(
    () => (previewDates
      ? { ELECTION_START: new Date(previewDates.start), ELECTION_END: new Date(previewDates.end) }
      : resolveElectionDates(globalConfig)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [globalConfig?.electionStartAt, globalConfig?.electionEndAt, globalConfig?.campaignStartAt, previewDates?.start, previewDates?.end]
  );
  const [now, setNow] = useState(() => Date.now());

  const base = deriveElectionStatus({
    systemMode, isSystemOpen, electionStatus, signedIn, isVoted,
    start: ELECTION_START, end: ELECTION_END, now,
  });

  // one-second tick only while something is actually counting down
  useEffect(() => {
    if (!tick || !base.target) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [tick, base.target?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining = base.target ? split(base.target.at - now) : null;

  return {
    ...base,
    remaining,
    start: ELECTION_START,
    end: ELECTION_END,
    // ready-made Thai strings so templates do not each re-invent the date line
    // "วันที่ 9 กุมภาพันธ์ 2570 เวลา 07.00–22.00 น." — one "น." for the range
    dateLine: `${formatThaiDate(ELECTION_START)} เวลา ${formatThaiTime(ELECTION_START).replace(/ น\.$/, "")}–${formatThaiTime(ELECTION_END)}`,
  };
}

export default useElectionStatus;
