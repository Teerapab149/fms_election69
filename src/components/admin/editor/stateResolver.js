/**
 * Runtime state resolvers.
 * Each resolver takes a context object and returns the current state ID
 * for a specific element type.
 *
 * Context shape:
 *   {
 *     session: NextAuth session | null,
 *     electionPhase: "upcoming" | "active" | "ended",
 *     systemMode: "AUTO" | "MANUAL" | "PAUSE" | "ENDED" | "CLOSED",
 *     isSystemOpen: boolean,
 *     isVoted: boolean,
 *     isRevealed: boolean
 *   }
 */

import { ELECTION_CONFIG } from '../../../utils/electionConfig';

export const STATE_RESOLVERS = {

  voteCTA: (context) => {
    const { session, systemMode, isSystemOpen, isVoted } = context || {};

    if (systemMode === "PAUSE") return "paused";
    if (systemMode === "ENDED") return "ended";
    if (isSystemOpen === false) return "closed";
    if (!session) return "login";
    if (isVoted) return "voted";
    return "notVoted";
  },

  countdown: (context) => {
    const { systemMode, electionPhase } = context || {};

    if (systemMode === "PAUSE") return "paused";
    if (systemMode === "ENDED") return "manualEnded";
    if (systemMode === "MANUAL_OPEN") return "running";

    // AUTO mode — phase comes from date comparison done in buildRuntimeContext
    if (electionPhase === "before") return "before";
    if (electionPhase === "running") return "running";
    if (electionPhase === "ended") return "nextYear";

    return "before"; // safe default
  },
};

/**
 * Resolve the current state ID for a given stateful element.
 * Returns the state ID string, or null if element/resolver not found.
 */
export function resolveElementState(elementId, context) {
  // Import lazily to avoid circular dependency risk
  const { STATEFUL_ELEMENTS } = require('./statefulRegistry');

  const element = STATEFUL_ELEMENTS[elementId];
  if (!element) return null;

  const resolver = STATE_RESOLVERS[element.stateResolverKey];
  if (!resolver) return element.states[0]?.id || null;

  const stateId = resolver(context);

  // Validate: must be one of the declared states
  const isValid = element.states.some(s => s.id === stateId);
  return isValid ? stateId : element.states[0]?.id;
}

/**
 * Build runtime context from raw data sources.
 * Call this once per page render and pass the result to resolveElementState.
 */
export function buildRuntimeContext({ session, systemConfig, electionStatus, userData }) {
  // Compute electionPhase from real time vs ELECTION_CONFIG dates
  const now = new Date();
  const start = ELECTION_CONFIG.ELECTION_START;
  const end = ELECTION_CONFIG.ELECTION_END;

  let computedPhase;
  if (now < start) computedPhase = "before";
  else if (now < end) computedPhase = "running";
  else computedPhase = "ended";

  return {
    session: session || null,
    electionPhase: electionStatus || computedPhase,
    systemMode: systemConfig?.systemMode || "AUTO",
    isSystemOpen: systemConfig?.isSystemOpen !== false,
    isVoted: userData?.isVoted || session?.user?.isVoted || false,
    isRevealed: systemConfig?.showResult === true
  };
}
