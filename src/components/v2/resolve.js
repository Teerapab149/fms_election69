"use client";

// The one question every route asks: does this template have its own v2 page
// here? Routes do not know which v2 templates exist or what they are called —
// they ask, render what comes back, and otherwise fall through to their v1
// dispatch unchanged.
//
// A v2 page owns the whole screen. A route that gets one back must switch off
// every v1 family branch (its base family included); otherwise a v2 template
// built on, say, receipt would render receipt's own layout, chrome or cast scene
// beside it. `familyFor` does that in one place.

import { V2_PAGES } from "./registry";
import { v2KeyOf, baseFamilyOf } from "./families";

/** The v2 component for `page` of this template, or null. */
export function resolveTemplatePage(templateId, page) {
  return V2_PAGES[v2KeyOf(templateId)]?.[page] || null;
}

/**
 * The family id the route's v1 dispatch should see: "" when a v2 page takes
 * over (every `startsWith` family flag comes out false), else the base family.
 */
export function familyFor(templateId, v2Page) {
  return v2Page ? "" : baseFamilyOf(templateId);
}
