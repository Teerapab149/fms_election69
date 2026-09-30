// How long the results page waits before asking /api/results again — no
// imports, so node:test can load it directly (scripts/smoke/resultsPolling.test.mjs).
//
// Driven by what the SERVER last said, never the student's clock. The page used
// to poll every 3 s only while the browser clock was before the scheduled end,
// then stop — so a tab left open after closing never saw the committee press
// ประกาศผล, and an early end (ENDED) or a late close (MANUAL_OPEN) left it
// frozen on the wrong picture.
//
//   revealed + certified   5 min  nothing left to change; slow keep-alive only
//   revealed               20 s   only the certification banner can still appear
//   ENDED (awaiting)       5 s    the moment people sit and wait for
//   ONGOING                10 s   turnout ticker; the tally is hidden anyway
//   CLOSED (paused)        15 s
//   anything else          30 s   WAITING, PRE_CAMPAIGN, unknown
//
// ±10% jitter so a room of tabs opened together does not hit the server in
// lockstep. `random` is injectable so the tests are deterministic.
export function resultsPollDelay({ status, isRevealed, certified } = {}, random = Math.random) {
  let base;
  if (isRevealed && certified) base = 300_000;
  else if (isRevealed) base = 20_000;
  else if (status === "ENDED") base = 5_000;
  else if (status === "ONGOING") base = 10_000;
  else if (status === "CLOSED") base = 15_000;
  else base = 30_000;
  return Math.round(base * (0.9 + 0.2 * random()));
}
