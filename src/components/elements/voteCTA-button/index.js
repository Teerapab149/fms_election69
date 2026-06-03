// Day 9a: voteCTA-button variant resolver (per ADR-001 + Day 7b banner pattern).
//
// Maps a variant ID (string from template entry's `variant` field) to its
// React component. Templates declare their voteCTA variant via:
//   "voteCTA-button": { variant: "default", config: {...}, vars: {...} }
//
// Fallback semantics (no throws — UI must never crash on a template typo):
//   - variantId missing/undefined → silent fallback to "default" (templates
//     pre-dating the variant field hit this path; intentional, no warning).
//   - variantId is a known-registered ID that has no component imported here
//     → registry/component drift; warn loudly so dev fixes the import.
//   - variantId is an unknown string (typo, removed variant) → warn and
//     fall back to "default".
//
// Day 9b will add: minimal-pill, chunky-stamp.

import DefaultVoteCTA from './default.jsx';
import MinimalPillVoteCTA from './minimal-pill.jsx';
import ChunkyStampVoteCTA from './chunky-stamp.jsx';
import { getElementType } from '../registry.js';

// Component map — the implementation source of truth for voteCTA-button.
// Keys MUST stay in sync with registry.js ELEMENT_TYPES["voteCTA-button"].variants.
const COMPONENTS = {
  default: DefaultVoteCTA,
  'minimal-pill': MinimalPillVoteCTA,
  'chunky-stamp': ChunkyStampVoteCTA,
};

/**
 * Resolve a variant ID to its component. Falls back to 'default'.
 * Cross-checks the registry; warns on drift or unknown IDs.
 *
 * @param {string} [variantId]
 * @returns {React.ComponentType}
 */
export function getVoteCTAVariant(variantId) {
  if (!variantId) return COMPONENTS.default;

  const registered = getElementType('voteCTA-button')?.variants?.includes(variantId);
  const implemented = !!COMPONENTS[variantId];

  if (registered && !implemented) {
    if (typeof console !== 'undefined') {
      console.warn(`[voteCTA-button] variant "${variantId}" registered but no component imported. Falling back to default.`);
    }
    return COMPONENTS.default;
  }

  if (!registered && variantId !== 'default') {
    if (typeof console !== 'undefined') {
      console.warn(`[voteCTA-button] unknown variant "${variantId}", falling back to "default".`);
    }
    return COMPONENTS.default;
  }

  return COMPONENTS[variantId] || COMPONENTS.default;
}

export const VOTECTA_VARIANT_IDS = Object.keys(COMPONENTS);

export { DefaultVoteCTA, MinimalPillVoteCTA, ChunkyStampVoteCTA };
export default getVoteCTAVariant;
