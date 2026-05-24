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

export const ELEMENT_TYPES = {
  // Step A foundation: only banner-section. Step B will add the other 46.
  "banner-section": {
    name: "Banner Section",
    description: "Election announcement banner above hero",
    category: "section-header",
    variants: ["default", "minimal-line"],
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
