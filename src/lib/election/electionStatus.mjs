// Pure status derivation for v2 templates — no imports, so node:test can load it
// directly (scripts/smoke/electionStatus.test.mjs). The React hook that ticks the
// countdown lives in src/hooks/useElectionStatus.js.

// phase: before | open | paused | ended
// action: signin | vote | voted | wait | paused | results
export function deriveElectionStatus({
  systemMode = "AUTO", isSystemOpen = false, electionStatus = null,
  signedIn = false, isVoted = false, start, end, now = Date.now(),
}) {
  const startMs = start instanceof Date ? start.getTime() : NaN;
  const endMs = end instanceof Date ? end.getTime() : NaN;

  let phase;
  if (systemMode === "PAUSE") phase = "paused";
  else if (systemMode === "ENDED") phase = "ended";
  else if (systemMode === "MANUAL_OPEN") phase = "open";
  else if (isSystemOpen) phase = "open";
  else if (electionStatus === "ENDED" || electionStatus === "CLOSED") phase = "ended";
  else if (!isNaN(endMs) && now >= endMs) phase = "ended";
  else phase = "before";

  let action;
  if (phase === "paused") action = "paused";
  else if (phase === "ended") action = "results";
  else if (phase === "before") action = "wait";
  else if (!signedIn) action = "signin";
  else if (isVoted) action = "voted";
  else action = "vote";

  // Countdown target follows the PHASE, never the calendar alone.
  let target = null;
  if (phase === "before" && !isNaN(startMs) && startMs > now) target = { kind: "opens", at: startMs };
  else if (phase === "open" && !isNaN(endMs) && endMs > now) target = { kind: "closes", at: endMs };

  return { phase, action, target };
}

