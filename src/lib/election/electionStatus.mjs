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

  // AUTO only: the server judged the phase when the page was rendered; a page
  // left open keeps ticking. Move the phase forward as the clock passes the
  // schedule — never backward, so a slow student clock cannot undo what the
  // server said. Without this a page opened at 08:25 still said "not open" at
  // 08:31 (countdown gone, button disabled) and one opened at 16:55 still said
  // "open, sign in" after the polls closed at 17:00.
  if (systemMode === "AUTO") {
    if (phase === "before" && !isNaN(startMs) && now >= startMs && (isNaN(endMs) || now < endMs)) phase = "open";
    if (phase === "open" && !isNaN(endMs) && now >= endMs) phase = "ended";
  }

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

// The voteCTA-button element's state, from the same derivation — so the v1
// templates' button TEXT (stateResolver.voteCTA → template config per state)
// and its CLICK / LOOK (each variant's own ladder in elements/voteCTA-button)
// can no longer disagree. They used to: AUTO before opening read "closed" for
// the text but "login" for the click (the button said ระบบปิดลงคะแนน and went
// to sign-in), and AUTO after closing read "closed" for the text ("not open
// yet") while the click went to the results.
//
// state: login | notVoted | voted | paused | ended
//
// Before the polls open the button stays a sign-in button, on purpose — the
// legacy ladders all did this ("EXCLUDE WAITING — let it fall through to
// Login/Vote", OriginalHome) and Original ran a real election that way. The v1
// homes are rendered once by the server and never re-judge the status in the
// browser, so a button frozen at "not open yet" would still say so after the
// polls opened, until the student reloaded. The vote page's own gate turns an
// early sign-in into "not open yet" with the right times.
//
// No dates: the server's verdict (isSystemOpen + electionStatus) is enough, and
// is what every caller of this has.
export function voteCtaState({ systemMode = "AUTO", isSystemOpen = false, electionStatus = null, signedIn = false, isVoted = false }) {
  const { phase } = deriveElectionStatus({ systemMode, isSystemOpen, electionStatus, start: undefined, end: undefined });
  if (phase === "paused") return "paused";
  if (phase === "ended") return "ended";
  if (!signedIn) return "login";
  return isVoted ? "voted" : "notVoted";
}

