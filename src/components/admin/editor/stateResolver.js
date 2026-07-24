/**
 * Runtime state resolvers.
 * Each resolver takes a context object and returns the current state ID
 * for a specific element type.
 *
 * Context shape:
 *   {
 *     session: NextAuth session | null,
 *     electionPhase: "before" | "running" | "ended",   // resolver vocabulary —
 *       translated from the server's WAITING/ONGOING/CLOSED/ENDED by
 *       PHASE_FROM_STATUS in buildRuntimeContext below
 *     systemMode: "AUTO" | "MANUAL" | "PAUSE" | "ENDED" | "CLOSED",
 *     isSystemOpen: boolean,
 *     isVoted: boolean,
 *     isRevealed: boolean
 *   }
 */

import { ELECTION_CONFIG } from '../../../utils/electionConfig';
import { ELEMENT_INSTANCES } from './elementCatalog';

// Derived at module load so the resolver's STATEFUL_ELEMENTS lookup keeps
// the same shape as the old statefulRegistry export (object keyed by id).
const STATEFUL_ELEMENTS = Object.fromEntries(
  Object.entries(ELEMENT_INSTANCES).filter(([, inst]) => inst.isStateful)
);

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
// The server speaks a different vocabulary than the resolvers do: page.js and
// api/home-info emit WAITING/ONGOING/CLOSED/ENDED, while STATE_RESOLVERS.countdown
// compares before/running/ended. Passing the raw status straight through matched
// nothing, so the countdown fell to its `return "before"` default for EVERY
// payload — including AUTO/ONGOING (during voting) and AUTO/ENDED (after close),
// i.e. the home page announced "ยังไม่เปิดรับลงคะแนน" on election day itself.
// Translating at this seam (rather than changing the API) keeps the server as the
// source of truth for the phase: it derives status from resolveElectionDates(
// config.globalConfig) — the dates in the DB — whereas computedPhase below reads
// the dates compiled into ELECTION_CONFIG. When those disagree, the API is right.
// CLOSED only ever accompanies systemMode PAUSE, which countdown/voteCTA both
// short-circuit before reading the phase, so its mapping is unobservable today.
const PHASE_FROM_STATUS = {
  WAITING: "before",
  ONGOING: "running",
  CLOSED: "ended",
  ENDED: "ended",
};

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
    electionPhase: PHASE_FROM_STATUS[electionStatus] || electionStatus || computedPhase,
    systemMode: systemConfig?.systemMode || "AUTO",
    isSystemOpen: systemConfig?.isSystemOpen !== false,
    isVoted: userData?.isVoted || session?.user?.isVoted || false,
    isRevealed: systemConfig?.showResult === true
  };
}
