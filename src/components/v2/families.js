// v2 template families — pure metadata, safe to import from server or client.
//
// Each redesigned template is built as a NEW family next to the one it replaces;
// the old family stays untouched until the owner approves the new one and asks
// for the old one to be removed.
//
// A v2 family is delivered page by page. `base` names the v1 family whose page
// components stand in for any page the v2 family has not built yet, so a v2
// template is always complete and selectable, just partly in its old clothes.
//
// Slugs are chosen so that NO v1 family name is a prefix of them: the v1 pages
// dispatch with `slug.startsWith("fms-official")` etc., and "fms-official-v2"
// would have been silently routed to the old components.

export const V2_FAMILIES = {
  "ballot-official": { base: "fms-official", built: ["home", "vote", "party", "success", "candidates", "results", "closed", "login"] },
};

// v2 family key for a slug (exact, or a colour variant "<key>-<variant>")
export function v2KeyOf(slug) {
  if (!slug) return null;
  if (V2_FAMILIES[slug]) return slug;
  for (const key of Object.keys(V2_FAMILIES)) {
    if (slug.startsWith(`${key}-`)) return key;
  }
  return null;
}

// The family v1 dispatch code should treat this slug as. For a v1 slug this is
// the slug itself, so wrapping existing `startsWith` checks with it changes
// nothing for the old templates.
export function baseFamilyOf(slug) {
  const key = v2KeyOf(slug);
  return key ? V2_FAMILIES[key].base : slug;
}

// true when the v2 family has its own component for this page
export function v2Builds(slug, page) {
  const key = v2KeyOf(slug);
  return !!key && V2_FAMILIES[key].built.includes(page);
}
