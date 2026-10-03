import { resolveElectionDates } from "../../utils/electionConfig";
import { liveSystemStatus } from "./systemStatus.mjs";

// The election's state as the API routes read it from the SystemConfig row:
// the normalised mode, the effective dates (admin-set in globalConfig, else the
// electionConfig.js defaults) and the server verdict from liveSystemStatus.
// A missing mode means AUTO, the same `systemMode || "AUTO"` every route used.
//
// → { systemMode, start, end, campaignStart, isSystemOpen, electionStatus }
export function readElectionState(config, now = Date.now()) {
  const systemMode = config?.systemMode || "AUTO";
  const { CAMPAIGN_START, ELECTION_START, ELECTION_END } = resolveElectionDates(config?.globalConfig);
  const { isSystemOpen, electionStatus } = liveSystemStatus({
    systemMode, start: ELECTION_START, end: ELECTION_END, now,
  });
  return {
    systemMode,
    start: ELECTION_START,
    end: ELECTION_END,
    campaignStart: CAMPAIGN_START,
    isSystemOpen,
    electionStatus,
  };
}
