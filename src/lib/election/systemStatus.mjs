// The server's verdict on the polls, from the system mode and the schedule:
// { isSystemOpen, electionStatus }. This is what the live home page (app/page.js)
// hands every template, so it lives here once: the live page and
// /template-preview both call it, and a template reviewed in the preview is
// fed exactly the state the site would feed it. Pure; no imports — node:test
// loads it directly (scripts/smoke/systemStatus.test.mjs).
//
// systemMode: AUTO | MANUAL_OPEN | PAUSE | ENDED
// electionStatus: WAITING | ONGOING | CLOSED | ENDED

export function liveSystemStatus({ systemMode = "AUTO", start, end, now = Date.now() }) {
  if (systemMode === "MANUAL_OPEN") return { isSystemOpen: true, electionStatus: "ONGOING" };
  if (systemMode === "PAUSE") return { isSystemOpen: false, electionStatus: "CLOSED" };
  if (systemMode === "ENDED") return { isSystemOpen: false, electionStatus: "ENDED" };
  // AUTO — the schedule decides
  if (now < start) return { isSystemOpen: false, electionStatus: "WAITING" };
  if (now >= end) return { isSystemOpen: false, electionStatus: "ENDED" };
  return { isSystemOpen: true, electionStatus: "ONGOING" };
}
