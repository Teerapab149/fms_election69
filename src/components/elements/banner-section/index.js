// Day 7b: banner-section variant resolver (per ADR-001 + VISION D12).
//
// Maps a variant ID (string from template entry's `variant` field) to its
// React component. Templates declare their banner variant via:
//   "banner-section": { variant: "default", config: {...}, vars: {...} }
//
// Falls back to "default" when:
//   - variantId is missing/undefined (template didn't set the field)
//   - variantId is an unknown string (typo, removed variant)
//
// No silent errors — fallback is intentional and logged once if mismatch.

import DefaultBanner from './default.jsx';
import MinimalLineBanner from './minimal-line.jsx';

const VARIANTS = {
  default: DefaultBanner,
  'minimal-line': MinimalLineBanner,
};

/**
 * Resolve a variant ID to its component. Falls back to 'default'.
 * @param {string} [variantId]
 * @returns {React.ComponentType}
 */
export function getBannerVariant(variantId) {
  if (variantId && !VARIANTS[variantId] && typeof console !== 'undefined') {
    // One-line dev warning; harmless in prod (console.warn is a no-op there).
    console.warn(`[banner-section] unknown variant "${variantId}", falling back to "default"`);
  }
  return VARIANTS[variantId] || VARIANTS.default;
}

export const BANNER_VARIANT_IDS = Object.keys(VARIANTS);

export { DefaultBanner, MinimalLineBanner };
export default getBannerVariant;
