/**
 * Template engine for state-aware elements.
 *
 * Data layers:
 *   Layer 1: Template objects fetched from templates/index.js (Phase 3+)
 *   Layer 2: activeState (saved in DB per admin session)
 *     - elementOverrides: { [elementId]: { [stateId]: { ...partial config } } }
 *     - backgroundId: which background is active
 *   Layer 3: resolved config (computed at render time)
 *     = template defaults + overrides merged
 */

import { getDefaultStateConfig } from './elementCatalog';

// ============================================================
// TEMPLATE_INFOS — minimal display metadata for editor UI (gallery/switcher)
// Full template data lives in templates/builtIn/*.js and DB via templates/index.js
// ============================================================

const TEMPLATE_INFOS = [
  { id: "classic",      name: "คลาสสิก",       previewColor: "#8A2680" },
  { id: "modern-dark",  name: "โมเดิร์นดาร์ก",  previewColor: "#06b6d4" },
  { id: "playful",      name: "สนุกสนาน",      previewColor: "#EC4899" },
  { id: "minimal",      name: "มินิมอล",       previewColor: "#1E293B" },
  { id: "gumroad",      name: "แอ็กทีฟ พัลส์",  previewColor: "#FF90E8" },
  { id: "studio-dark",  name: "สตูดิโอ ดาร์ก",  previewColor: "#D5FF3F" },
  { id: "verdure",      name: "เวอร์เดอร์",     previewColor: "#2A9D8F" },
];

// ============================================================
// BACKGROUNDS
// ============================================================

export const BACKGROUNDS = {
  "gradient-purple-light": {
    id: "gradient-purple-light",
    name: "ม่วง-ขาว",
    type: "gradient",
    config: { from: "#faf5ff", via: "#f3e8ff", to: "#ffffff", direction: "to-br" }
  },
  "gradient-cyber-dark": {
    id: "gradient-cyber-dark",
    name: "ไซเบอร์ดาร์ก",
    type: "gradient",
    config: { from: "#0f172a", via: "#06b6d4", to: "#0f172a", direction: "to-b" }
  },
  "solid-white": {
    id: "solid-white",
    name: "ขาวล้วน",
    type: "solid",
    config: { color: "#ffffff" }
  },
  "solid-dark": {
    id: "solid-dark",
    name: "ดำล้วน",
    type: "solid",
    config: { color: "#0f172a" }
  },
  "mesh-rainbow": {
    id: "mesh-rainbow",
    name: "รุ้งพาสเทล",
    type: "mesh",
    config: { colors: ["#fef3c7", "#fce7f3", "#ddd6fe", "#bae6fd"] }
  },
  "pattern-dots-light": {
    id: "pattern-dots-light",
    name: "ลายจุด (สว่าง)",
    type: "pattern",
    config: { pattern: "dots", bgColor: "#ffffff", dotColor: "#8A2680" }
  },
  "gradient-sunset": {
    id: "gradient-sunset",
    name: "พระอาทิตย์ตก",
    type: "gradient",
    config: { from: "#fbbf24", via: "#f472b6", to: "#a855f7", direction: "to-br" }
  }
};

// ============================================================
// HELPERS
// ============================================================

export function listTemplates() {
  return TEMPLATE_INFOS;
}

export function getBackground(backgroundId) {
  return BACKGROUNDS[backgroundId] || null;
}

export function listBackgrounds() {
  return Object.values(BACKGROUNDS);
}

/**
 * Resolve final config for an element state.
 *
 * @param {object|null} template - Resolved Phase-3 template object
 *   shape: { elements: { [id]: { config: { [stateId]: {...} } } } }
 *   Pass null/undefined to fall back to elementInstances defaultConfig.
 * @param {string} elementId
 * @param {string} stateId
 * @param {object} overrides - Admin overrides for this element+state
 * @returns {object} Merged config ready to render
 */
export function resolveStatefulConfig(template, elementId, stateId, overrides = {}) {
  if (!template || typeof template !== "object") {
    return { ...getDefaultStateConfig(elementId, stateId), ...overrides };
  }

  const entry = template.elements?.[elementId];
  let templateConfig;
  if (entry?.config && typeof entry.config === "object" && entry.config[stateId]) {
    templateConfig = entry.config[stateId];
  }

  if (templateConfig && Object.keys(templateConfig).length > 0) {
    return { ...templateConfig, ...overrides };
  }

  return { ...getDefaultStateConfig(elementId, stateId), ...overrides };
}

/**
 * Check if an element+state has any overrides from the template defaults.
 */
export function hasOverrides(overrides, elementId, stateId) {
  const over = overrides?.[elementId]?.[stateId];
  return over && Object.keys(over).length > 0;
}
