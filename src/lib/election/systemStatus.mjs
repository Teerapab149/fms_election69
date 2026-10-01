// The server's verdict on the polls, from the system mode and the schedule —
// the one place that ladder lives (T7, 2026-09-30). Pure; no imports — node:test
// loads it directly (scripts/smoke/systemStatus.test.mjs, which also keeps the
// old inline copies of every ladder below as oracles and proves each function
// gives the same answer for every mode, moment and schedule shape).
//
// systemMode: AUTO | MANUAL_OPEN | PAUSE | ENDED
// electionStatus: WAITING | ONGOING | CLOSED | ENDED
//
// Who calls what:
//   liveSystemStatus  app/page.js, /template-preview, and (through
//                     lib/election/liveStatus.js readElectionState)
//                     api/check-status + api/home-info
//   voteRefusal       api/vote (after its CERTIFIED check, which stays first)
//   resultsStatus     api/results buildResultsBody (its own ladder: see below)
//
// Places that decide something similar and are deliberately NOT built on this:
//   - adminGuards.isBoxClosed ("may the tally be shown?") is a different
//     question: ENDED, or AUTO past the end, and it ignores the start on
//     purpose. With an inverted schedule (end before start) the box must read
//     as closed, where liveSystemStatus would say WAITING. Keep it separate.
//   - api/admin/dashboard, api/admin/global-config and admin SettingsTab use
//     adminGuards, not this file.
//   - api/admin/readiness has its own diagnostics on purpose (it explains
//     what is wrong, it does not gate anything).
//   - app/closed/page.js reads the server status (check-status); it does not
//     compute one.
//   - hooks/useVoteSystem gates on the server's isSystemOpen from check-status.
//   - app/results/page.js gates on check-status's electionStatus; its only
//     clock checks are the campaign window (who may browse the party list).
//   - utils/stateResolver.js and the template components (Verdure/Receipt/
//     Blossom/... homes, chromes, closed pages) are the CLIENT TICK layer:
//     they start from this server verdict and move it forward between polls
//     with deriveElectionStatus (electionStatus.mjs). Two layers, by design:
//     server verdict here, client tick there.

export function liveSystemStatus({ systemMode = "AUTO", start, end, now = Date.now() }) {
  if (systemMode === "MANUAL_OPEN") return { isSystemOpen: true, electionStatus: "ONGOING" };
  if (systemMode === "PAUSE") return { isSystemOpen: false, electionStatus: "CLOSED" };
  if (systemMode === "ENDED") return { isSystemOpen: false, electionStatus: "ENDED" };
  // AUTO (and any unknown mode) — the schedule decides
  if (now < start) return { isSystemOpen: false, electionStatus: "WAITING" };
  if (now >= end) return { isSystemOpen: false, electionStatus: "ENDED" };
  return { isSystemOpen: true, electionStatus: "ONGOING" };
}

// Why api/vote refuses a ballot right now, as its stable code, or null when the
// box takes it. The CERTIFIED refusal is not here: the route checks it first,
// above every mode, because MANUAL_OPEN ignores the clock.
//
// Unlike liveSystemStatus, an unknown mode string is NOT treated as AUTO: the
// vote route never has (only the literal "AUTO" consults the schedule), and
// this keeps it that way. The route normalises `systemMode || "AUTO"` first,
// so a missing mode still means AUTO.
export function voteRefusal({ systemMode, start, end, now = Date.now() }) {
  if (systemMode === "PAUSE") return "PAUSED";
  if (systemMode === "ENDED") return "ENDED";
  if (systemMode !== "AUTO") return null; // MANUAL_OPEN (forced open) or unknown
  const { electionStatus } = liveSystemStatus({ systemMode, start, end, now });
  if (electionStatus === "WAITING") return "NOT_STARTED";
  if (electionStatus === "ENDED") return "AUTO_CLOSED";
  return null;
}

// The `status` field of /api/results. Its own ladder, ported verbatim from
// buildResultsBody: the schedule is read END first (so an inverted schedule
// reads ENDED here, not WAITING), there is a PRE_CAMPAIGN step before the
// campaign starts, an unknown mode keeps the time-based answer, and a revealed
// result (showResult) reads ONGOING unless the box is CLOSED or ENDED.
// status: PRE_CAMPAIGN | WAITING | ONGOING | CLOSED | ENDED
export function resultsStatus({ systemMode, start, end, campaignStart, showResult, now = Date.now() }) {
  let status = "WAITING";

  if (now >= end) {
    status = "ENDED";
  } else if (now >= start) {
    status = "ONGOING";
  } else if (now >= campaignStart) {
    status = "WAITING";
  } else {
    status = "PRE_CAMPAIGN";
  }

  const mode = systemMode || "AUTO";

  if (mode === "PAUSE") {
    status = "CLOSED";
  } else if (mode === "ENDED") {
    status = "ENDED";
  } else if (mode === "MANUAL_OPEN") {
    status = "ONGOING";
  }
  // AUTO (or unknown): keep the time-based status

  // Show Result Mode Override (unless strictly CLOSED)
  if (showResult && status !== "CLOSED") {
    if (status !== "ENDED") {
      status = "ONGOING";
    }
  }

  return { status };
}
