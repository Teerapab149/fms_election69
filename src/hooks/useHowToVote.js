"use client";
// The home page's "how to vote" steps, shared by every template:
//   - one anchor id, so a post can link straight to it (…/#how-to-vote)
//   - hidden once the polls have closed — nobody needs the steps then, and
//     they only push the result / status further down the page
//   - a jump to it on load when the URL carries the hash: most homes render
//     after mount, so the browser's own hash scroll finds nothing
import { useEffect, useMemo, useState } from "react";
import { useGlobalConfig } from "../contexts/GlobalConfigContext";
import { resolveElectionDates } from "../utils/electionConfig";
import { deriveElectionStatus } from "../lib/election/electionStatus.mjs";

export const HOW_TO_VOTE_ID = "how-to-vote";

// status = the fields app/page.js hands every home (systemMode, isSystemOpen,
// electionStatus). A caller that already knows the phase passes { phase }.
export function useHowToVote(status = {}) {
  const gc = useGlobalConfig();
  const { ELECTION_START, ELECTION_END } = useMemo(
    () => resolveElectionDates(gc),
    [gc?.campaignStartAt, gc?.electionStartAt, gc?.electionEndAt]
  );
  // a page left open past the closing time drops the steps without a reload
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60e3);
    return () => clearInterval(id);
  }, []);

  const phase = status.phase || deriveElectionStatus({
    systemMode: status.systemMode || "AUTO",
    isSystemOpen: !!status.isSystemOpen,
    electionStatus: status.electionStatus || null,
    start: ELECTION_START, end: ELECTION_END, now,
  }).phase;
  const show = phase !== "ended";

  useEffect(() => {
    if (!show || window.location.hash !== `#${HOW_TO_VOTE_ID}`) return;
    const t = setTimeout(() => document.getElementById(HOW_TO_VOTE_ID)?.scrollIntoView(), 60);
    return () => clearTimeout(t);
  }, [show]);

  return { show, id: HOW_TO_VOTE_ID, href: `#${HOW_TO_VOTE_ID}` };
}
