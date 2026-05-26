/**
 * Day 9b: State fallback helper for derived voteCTA variants.
 *
 * Used by variants (minimal-pill, chunky-stamp) that explicitly style only
 * the 3 primary states (notVoted/voted/ended) and derive the 3 secondary
 * states via semantic mapping:
 *   login   → notVoted (both = active CTA)
 *   closed  → ended    (both = terminal state)
 *   paused  → voted    (both = disabled visual)
 *
 * The default variant uses the full 6-state config from each template and
 * does NOT consume this helper — its 6 state branches in default.jsx mirror
 * STATE_RESOLVERS.voteCTA.
 *
 * IMPORTANT distinction (decided in chat, ratified in spec):
 *   - stateMap drives STYLE selection only.
 *   - Text, icon, href, and click handlers come from the ORIGINAL current
 *     state, NOT the mapped primary state.
 *
 * That means a variant should:
 *     const visualState = mapToPrimaryState(currentState);  // -> 'voted'
 *     const stateConfig = resolvedConfig;                   // current state's text
 *   so e.g. `paused` borrows `voted`'s outline/shadow but still says
 *   "ระบบปิดปรับปรุง / Maintenance" and links to /closed.
 */

const PRIMARY_STATES = ['notVoted', 'voted', 'ended'];

const FALLBACK_MAP = {
  login: 'notVoted',
  closed: 'ended',
  paused: 'voted',
};

/**
 * Given the current state ID (one of the 6 voteCTA states), return the
 * primary-state ID whose styling block to use.
 * Returns the input when it's already a primary state.
 * Unknown / unexpected IDs fall back to 'notVoted' (the active default).
 *
 * @param {string} stateId
 * @returns {'notVoted'|'voted'|'ended'}
 */
export function mapToPrimaryState(stateId) {
  if (PRIMARY_STATES.includes(stateId)) return stateId;
  return FALLBACK_MAP[stateId] || 'notVoted';
}

/**
 * @param {string} stateId
 * @returns {boolean} true when stateId is one of the 3 primary states.
 */
export function isPrimaryState(stateId) {
  return PRIMARY_STATES.includes(stateId);
}

export { PRIMARY_STATES, FALLBACK_MAP };
