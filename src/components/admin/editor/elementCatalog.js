/**
 * elementCatalog.js — Phase 2 catalog refactor (Step 2 / 5).
 *
 * Public API for the type-instance element system. Other modules should
 * import from this file (and only this file) in Step 3 onwards.
 *
 * Step 2 status: catalog built, zero consumers wired. See LIVE_STEP_H_CATALOG_CORE.md.
 */

import { ELEMENT_TYPES, getType, listTypes } from './elementTypes';
import { ELEMENT_INSTANCES } from './elementInstances';

// Re-exports so consumers can use a single import path
export { ELEMENT_TYPES, ELEMENT_INSTANCES, getType, listTypes };

// ============================================================
// Primary helper — merged element view (instance + type metadata)
// ============================================================

/**
 * Returns the merged element shape Step 3 consumers can use to replace
 * elementRegistry.ELEMENT_PRESETS[id] / statefulRegistry.STATEFUL_ELEMENTS[id]
 * lookups with a single call.
 *
 * The `type` field on the returned object is the legacy control category
 * (text/button/card/image/toggle/countdown) — derived from `typeId`.
 */
export function getElement(instanceId) {
  const instance = ELEMENT_INSTANCES[instanceId];
  if (!instance) return null;
  const type = ELEMENT_TYPES[instance.typeId] || null;
  return {
    id:               instance.id,
    typeId:           instance.typeId,
    type:             type?.category || null,
    name:             instance.name,
    pages:            instance.pages,
    section:          instance.section,
    boundTo:          instance.boundTo,
    isStateful:       instance.isStateful,
    stateResolverKey: instance.stateResolverKey,
    states:           instance.states,
    propertyFields:   instance.propertyFields,
    defaultConfig:    instance.defaultConfig,
    presets:          instance.presets,
    layout:           type?.layout || null,
    componentLibrary: type?.componentLibrary || null
  };
}

// ============================================================
// Query helpers
// ============================================================

export function getInstancesByPage(pageId) {
  return Object.values(ELEMENT_INSTANCES).filter(i => i.pages.includes(pageId));
}

export function getInstancesByType(typeId) {
  return Object.values(ELEMENT_INSTANCES).filter(i => i.typeId === typeId);
}

export function getInstancesBySection(pageId, sectionId) {
  return Object.values(ELEMENT_INSTANCES).filter(
    i => i.pages.includes(pageId) && i.section === sectionId
  );
}

export function getInstancesByCategory(category) {
  return Object.values(ELEMENT_INSTANCES).filter(i => {
    const t = ELEMENT_TYPES[i.typeId];
    return t?.category === category;
  });
}

// ============================================================
// Legacy-compat helpers (minimize Step 3 consumer churn)
// ============================================================

export function getBinding(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.boundTo || null;
}

export function isBoundElement(instanceId) {
  return getBinding(instanceId) !== null;
}

export function isStatefulElement(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.isStateful === true;
}

// Returns the raw stateful instance (or null). Replaces
// statefulRegistry.getStatefulElement for StatefulGallery consumption.
export function getStatefulElement(instanceId) {
  const inst = ELEMENT_INSTANCES[instanceId];
  return inst?.isStateful ? inst : null;
}

export function getStatesOf(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.states || [];
}

// Re-exported from elementRegistry for QuickStyleBar (and future template UIs).
// Kept inline so Step 5 can delete elementRegistry without touching consumers.
export const PRESET_NAMES = {
  classic: { name: "คลาสสิก", color: "#8A2680" },
  dark:    { name: "ดาร์ก",    color: "#7C3AED" },
  playful: { name: "สนุกสนาน", color: "#EC4899" },
  minimal: { name: "มินิมอล",  color: "#1E293B" }
};

export function getDefaultStateConfig(instanceId, stateId) {
  const inst = ELEMENT_INSTANCES[instanceId];
  if (!inst?.isStateful) return {};
  return inst.defaultConfig?.[stateId] || {};
}

export function getElementPresets(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.presets || {};
}

/**
 * Returns { [instanceId]: { type, label, section, config } }.
 * Mirrors elementRegistry.getPresetDefaults exactly so Step 3 swap is safe.
 *
 * NOTE: stateful instances ARE included (they carry legacy `presets` for
 * forward-compat). Their preset config drives toggle/visible/base-styling
 * while StatefulGallery owns per-state config independently.
 */
export function getPresetDefaults(presetId) {
  const out = {};
  for (const [id, inst] of Object.entries(ELEMENT_INSTANCES)) {
    if (!inst.presets) continue; // skip instances with no preset data
    const type = ELEMENT_TYPES[inst.typeId];
    const preset = inst.presets?.[presetId] || inst.presets?.classic || {};
    out[id] = {
      type:    type?.category || null,
      label:   inst.name,
      section: inst.section,
      config:  clone(preset)
    };
  }
  return out;
}

function clone(obj) {
  try { return structuredClone(obj); }
  catch { return JSON.parse(JSON.stringify(obj)); }
}

// ============================================================
// Resolution helper (forward-compat — used by Step 3+)
// ============================================================

/**
 * Resolve final config for an element.
 *
 * Routing is `isStateful`-driven:
 *   - Stateful: defaultConfig[stateId] → resolvedTemplate.elements[id].config[stateId] →
 *               userOverride[stateId].
 *   - Static:   defaultConfig → resolvedTemplate.elements[id].config (Phase 3)
 *               OR presets[templateId] (legacy) → userOverride.
 *
 * Phase 3 Day 2A: accepts `resolvedTemplate` in context (Phase 3 object shape).
 * Legacy `templateId` string still supported via instance.presets[templateId].
 * Currently has no callers outside this file — added for forward-compat.
 */
export function resolveConfig(instanceId, context = {}) {
  const inst = ELEMENT_INSTANCES[instanceId];
  if (!inst) return {};
  const {
    templateId = "classic",
    resolvedTemplate = null,
    stateId = null,
    userOverride = {}
  } = context;

  if (inst.isStateful) {
    if (!stateId) return {};
    const base = inst.defaultConfig?.[stateId] || {};
    const entry = resolvedTemplate?.elements?.[instanceId];
    const templateOver =
      (entry?.config && typeof entry.config === "object" && entry.config[stateId]) ||
      entry?.[stateId] ||
      {};
    const over = userOverride?.[stateId] || {};
    return { ...base, ...templateOver, ...over };
  }

  const baseDefault = inst.defaultConfig || {};

  // Phase 3: prefer resolvedTemplate.elements[id].config when provided.
  let templateOver;
  const entry = resolvedTemplate?.elements?.[instanceId];
  if (entry?.config && typeof entry.config === "object") {
    templateOver = entry.config;
  } else {
    templateOver = inst.presets?.[templateId] || inst.presets?.classic || {};
  }

  return { ...baseDefault, ...templateOver, ...userOverride };
}

// ============================================================
// Validation (dev-time integrity check)
// ============================================================

export function validateCatalog() {
  const errors = [];
  const seenIds = new Set();

  for (const [key, inst] of Object.entries(ELEMENT_INSTANCES)) {
    if (key !== inst.id) errors.push(`Key/id mismatch: ${key} vs ${inst.id}`);
    if (seenIds.has(inst.id)) errors.push(`Duplicate id: ${inst.id}`);
    seenIds.add(inst.id);

    if (!inst.name)    errors.push(`${inst.id}: missing name`);
    if (!inst.pages?.length) errors.push(`${inst.id}: missing pages[]`);
    if (!inst.section) errors.push(`${inst.id}: missing section`);
    if (!inst.typeId)  errors.push(`${inst.id}: missing typeId`);
    if (inst.typeId && !ELEMENT_TYPES[inst.typeId]) {
      errors.push(`${inst.id}: typeId "${inst.typeId}" not in ELEMENT_TYPES`);
    }
    if (!Array.isArray(inst.propertyFields)) {
      errors.push(`${inst.id}: propertyFields must be an array`);
    }
    if (inst.isStateful) {
      if (!inst.stateResolverKey) errors.push(`${inst.id}: stateful needs stateResolverKey`);
      if (!Array.isArray(inst.states) || inst.states.length === 0) {
        errors.push(`${inst.id}: stateful needs states[]`);
      }
      if (!inst.defaultConfig || typeof inst.defaultConfig !== "object") {
        errors.push(`${inst.id}: stateful needs defaultConfig`);
      } else {
        for (const s of (inst.states || [])) {
          if (!inst.defaultConfig[s.id]) {
            errors.push(`${inst.id}: defaultConfig missing state "${s.id}"`);
          }
        }
      }
    } else {
      if (inst.states !== null) errors.push(`${inst.id}: non-stateful should have states:null`);
      if (inst.stateResolverKey !== null) errors.push(`${inst.id}: non-stateful should have stateResolverKey:null`);
    }
  }

  return errors;
}

// Dev-mode self-check: log once at module load
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  const errs = validateCatalog();
  if (errs.length > 0) {
    // eslint-disable-next-line no-console
    console.warn("[elementCatalog] validation errors:", errs);
  } else {
    const instanceCount = Object.keys(ELEMENT_INSTANCES).length;
    const typeCount = Object.keys(ELEMENT_TYPES).length;
    // eslint-disable-next-line no-console
    console.log(`[elementCatalog] ✓ Validation passed: ${instanceCount} instances, ${typeCount} types`);
  }
}
