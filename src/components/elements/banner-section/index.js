// Day 7b: banner-section variant resolver (per ADR-001 + VISION D12).
// Day 8: validation cross-references the central registry (registry.js) so
// the "what variants exist" metadata stays decoupled from the component imports.
//
// Maps a variant ID (string from template entry's `variant` field) to its
// React component. Templates declare their banner variant via:
//   "banner-section": { variant: "default", config: {...}, vars: {...} }
//
// Fallback semantics (no throws — UI must never crash on a template typo):
//   - variantId missing/undefined → silent fallback to "default" (templates
//     pre-dating the variant field hit this path; intentional, no warning).
//   - variantId is a known-registered ID that has no component imported here
//     → registry/component drift; warn loudly so dev fixes the import.
//   - variantId is an unknown string (typo, removed variant) → warn and
//     fall back to "default".

import DefaultBanner from './default.jsx';
import MinimalLineBanner from './minimal-line.jsx';
import { getElementType } from '../registry.js';

// Component map — the implementation source of truth for banner-section.
// Keys MUST stay in sync with registry.js ELEMENT_TYPES["banner-section"].variants.
// The registry is consulted at runtime by getBannerVariant() to detect drift.
const COMPONENTS = {
  default: DefaultBanner,
  'minimal-line': MinimalLineBanner,
};

/**
 * Resolve a variant ID to its component. Falls back to 'default'.
 * Cross-checks the registry; warns on drift or unknown IDs.
 *
 * @param {string} [variantId]
 * @returns {React.ComponentType}
 */
export function getBannerVariant(variantId) {
  if (!variantId) return COMPONENTS.default;

  const registered = getElementType('banner-section')?.variants?.includes(variantId);
  const implemented = !!COMPONENTS[variantId];

  if (registered && !implemented) {
    // Registry says it exists but no component file imported here.
    // Hard drift — likely missing import after adding to registry.
    if (typeof console !== 'undefined') {
      console.warn(`[banner-section] variant "${variantId}" registered but no component imported. Falling back to default.`);
    }
    return COMPONENTS.default;
  }

  if (!registered && variantId !== 'default') {
    // Unknown variant ID — typo in template, or removed variant.
    if (typeof console !== 'undefined') {
      console.warn(`[banner-section] unknown variant "${variantId}", falling back to "default".`);
    }
    return COMPONENTS.default;
  }

  return COMPONENTS[variantId] || COMPONENTS.default;
}

export const BANNER_VARIANT_IDS = Object.keys(COMPONENTS);

export { DefaultBanner, MinimalLineBanner };
export default getBannerVariant;
