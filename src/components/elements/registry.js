/**
 * Central registry of all element types in the system.
 *
 * Element types are the "kinds" the system knows about
 * (voteCTA-button, banner-section, etc.). Each type has:
 *   - Display metadata (name, description)
 *   - Category (for library sidebar grouping per VISION D12)
 *   - Variants list (for variant picker per ADR-001 v1.2)
 *   - Schema version (for future migration)
 *   - Stateful flag (whether config has state-keyed sub-objects)
 *
 * Per ADR-001 v1.2 "Element Library + Registry" section.
 * Per VISION.md v1.3 D12 (Library mental model).
 *
 * IMPORTANT: this file is metadata only — it does NOT import variant
 * components. Components live in `src/components/elements/<typeId>/`.
 * The two sources of truth are kept decoupled but synchronized:
 *   - registry.js  → "what types/variants exist" (this file)
 *   - <typeId>/index.js → "where the components live"
 *
 * Day 8 (Phase 1 Week 3): foundation only. Day 8 Step B adds all 47
 * current element types. Day 9+ extends as variants are added.
 */

export const ELEMENT_CATEGORIES = {
  action: {
    name: "Action",
    description: "Buttons, CTAs, interactive controls",
    icon: "MousePointerClick",
    order: 1,
  },
  "section-header": {
    name: "Section Header",
    description: "Banners, page headers, announcements",
    icon: "LayoutTemplate",
    order: 2,
  },
  "data-display": {
    name: "Data Display",
    description: "Counters, stats, timers, charts",
    icon: "BarChart3",
    order: 3,
  },
  content: {
    name: "Content",
    description: "Headlines, paragraphs, hero text",
    icon: "Type",
    order: 4,
  },
  media: {
    name: "Media",
    description: "Image cards, galleries",
    icon: "Image",
    order: 5,
  },
  navigation: {
    name: "Navigation",
    description: "Menus, breadcrumbs, navs",
    icon: "Menu",
    order: 6,
  },
  layout: {
    name: "Layout",
    description: "Dividers, spacers, separators",
    icon: "SeparatorHorizontal",
    order: 7,
  },
};

// Convenience defaults — all not-yet-variantized elements share these.
// Day 8 Step B: all 47 elements have only the "default" variant (the current
// JSX rendering). Day 9+ extends individual entries as variants are authored.
const ONLY_DEFAULT = ["default"];

export const ELEMENT_TYPES = {
  // === action ===
  "voteCTA-button": {
    name: "Vote CTA Button",
    description: "Primary call-to-action button on home page (state-aware)",
    category: "action",
    variants: ["default", "minimal-pill"],   // chunky-stamp added in Day 9b Step C
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: true,  // 6 states: login/notVoted/voted/ended/closed/paused
  },
  "meet-cta": {
    name: "Meet Candidates CTA",
    description: "Pill button inside the 'meet candidates' card linking to /candidates",
    category: "action",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "vote-abstain-button": {
    name: "Abstain Button",
    description: "Vote page button: cast 'no vote' (งดออกเสียง)",
    category: "action",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "vote-disapprove-button": {
    name: "Disapprove Button",
    description: "Vote page button: cast 'disapprove' (ไม่รับรอง) — single-party only",
    category: "action",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-form-btn": {
    name: "Success Form Button",
    description: "Success page button linking to the post-vote Google form",
    category: "action",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "closed-back-btn": {
    name: "Closed Back Button",
    description: "Closed page button: return to home (กลับสู่หน้าหลัก)",
    category: "action",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },

  // === section-header ===
  "banner-section": {
    name: "Banner Section",
    description: "Election announcement banner above hero on the home page",
    category: "section-header",
    variants: ["default", "minimal-line"],
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "meet-section": {
    name: "Meet Candidates Section",
    description: "Decorated card on home page inviting users to /candidates",
    category: "section-header",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-megaphone-card": {
    name: "Success Megaphone Card",
    description: "Announcement card on success page (activity-credit reminder)",
    category: "section-header",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },

  // === data-display ===
  "hero-countdown": {
    name: "Hero Countdown Timer",
    description: "Countdown pill above hero title — state-aware across election phases",
    category: "data-display",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: true,  // 5 states: before/running/paused/manualEnded/nextYear
  },
  "stats-header": {
    name: "Stats Header",
    description: "Header row for the live participation stats bento grid",
    category: "data-display",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "stats-voted-card": {
    name: "Stats Voted Card (Hero)",
    description: "Large gradient card showing total ballots cast so far",
    category: "data-display",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "stats-progress-card": {
    name: "Stats Progress Card",
    description: "Sub-card showing turnout percentage with progress bar",
    category: "data-display",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "stats-eligible-card": {
    name: "Stats Eligible Card",
    description: "Sub-card showing total eligible voters",
    category: "data-display",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "results-stats-bar": {
    name: "Results Stats Bar",
    description: "Live participation bar on the results page header",
    category: "data-display",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "results-demographics": {
    name: "Results Demographics",
    description: "Voter breakdown charts (year/major/etc.) on results page",
    category: "data-display",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "candidates-counter": {
    name: "Candidates Counter",
    description: "Numeric count of registered parties on /candidates",
    category: "data-display",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },

  // === content ===
  "hero-title": {
    name: "Hero Title",
    description: "Main 'SAMO XX' title on the home page hero",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "hero-subtitle": {
    name: "Hero Subtitle",
    description: "Primary subtitle line below hero title",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "hero-subtitle2": {
    name: "Hero Subtitle 2",
    description: "Secondary subtitle line below hero (organization name)",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "hero-year-badge": {
    name: "Hero Year Badge",
    description: "Academic-year badge below hero subtitles",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "meet-title": {
    name: "Meet Card Title",
    description: "Heading inside the 'meet candidates' home card",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "vote-header-badge": {
    name: "Vote Header Badge",
    description: "Tagline badge above vote page title",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "vote-header-title": {
    name: "Vote Page Title",
    description: "Main heading on the vote page",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "vote-header-subtitle": {
    name: "Vote Page Subtitle",
    description: "Subtitle below the vote-page heading",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "vote-divider-text": {
    name: "Vote Divider Text",
    description: "Inline 'or' divider label between party grid and abstain section",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "results-header": {
    name: "Results Page Header",
    description: "Main 'ผลการเลือกตั้ง' heading on the results page",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "results-candidates-heading": {
    name: "Results Candidates Heading",
    description: "Sub-heading above the candidates table on results page",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "candidates-tagline": {
    name: "Candidates Tagline",
    description: "Tagline label above the candidates page title",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "candidates-title": {
    name: "Candidates Page Title",
    description: "Main heading on the /candidates listing page",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "candidates-subtitle": {
    name: "Candidates Subtitle",
    description: "Subtitle below the candidates page title",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-title": {
    name: "Success Page Title",
    description: "Main heading on the success page (post-vote)",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-subtitle1": {
    name: "Success Subtitle 1",
    description: "Primary subtitle on the success page",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-subtitle2": {
    name: "Success Subtitle 2",
    description: "Secondary subtitle on the success page",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-megaphone-title": {
    name: "Success Megaphone Title",
    description: "Title inside the megaphone announcement card",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-megaphone-desc": {
    name: "Success Megaphone Description",
    description: "Description body inside the megaphone announcement card",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-chip-1": {
    name: "Success Chip 1",
    description: "Small info chip on success page (activity-hour credit)",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-chip-2": {
    name: "Success Chip 2",
    description: "Small info chip on success page (participation-type)",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-lock-indicator": {
    name: "Success Lock Indicator",
    description: "Footnote on success page indicating result-unlock condition",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-footer": {
    name: "Success Footer",
    description: "Footer text block on the success page",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "closed-title": {
    name: "Closed Page Title",
    description: "Main heading on the /closed page",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "closed-description": {
    name: "Closed Page Description",
    description: "Description paragraph on the /closed page",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "closed-detail": {
    name: "Closed Page Detail",
    description: "Detailed date/time line on the /closed page",
    category: "content",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },

  // === media ===
  "vote-party-card": {
    name: "Vote Party Card",
    description: "Selectable party tile on the vote page grid",
    category: "media",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "candidates-party-card": {
    name: "Candidates Party Card",
    description: "Party tile on the /candidates listing page (links to /party)",
    category: "media",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "success-check-icon": {
    name: "Success Check Icon",
    description: "Large checkmark icon at the top of the success page",
    category: "media",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
  "closed-lock-icon": {
    name: "Closed Lock Icon",
    description: "Large lock icon at the top of the closed page",
    category: "media",
    variants: ONLY_DEFAULT,
    defaultVariant: "default",
    schemaVersion: "v1",
    stateful: false,
  },
};

/**
 * Get metadata for an element type by ID. Undefined if not registered.
 */
export function getElementType(typeId) {
  return ELEMENT_TYPES[typeId];
}

/**
 * List element types, optionally filtered by category.
 * Returns [typeId, metadata] tuples. Empty array for unknown category.
 */
export function listElementTypes(category) {
  const entries = Object.entries(ELEMENT_TYPES);
  if (!category) return entries;
  return entries.filter(([_, t]) => t.category === category);
}

/**
 * Get category metadata by ID. Undefined if not in ELEMENT_CATEGORIES.
 */
export function getCategory(categoryId) {
  return ELEMENT_CATEGORIES[categoryId];
}

/**
 * List categories sorted by display order (used by library sidebar).
 * Returns [categoryId, metadata] tuples.
 */
export function listCategories() {
  return Object.entries(ELEMENT_CATEGORIES).sort(
    (a, b) => a[1].order - b[1].order
  );
}

/**
 * Check if a variant is registered for an element type.
 * Returns false for unknown type, unknown variant, or null/undefined input.
 */
export function hasVariant(typeId, variantId) {
  const type = getElementType(typeId);
  if (!type || !variantId) return false;
  return type.variants.includes(variantId);
}

/**
 * Get default variant ID for an element type. Undefined if not registered.
 */
export function getDefaultVariant(typeId) {
  return getElementType(typeId)?.defaultVariant;
}
