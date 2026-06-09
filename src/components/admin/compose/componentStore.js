"use client";

// componentStore — persistence ADAPTER for saved Layer-2 components ("คลังคอมโพเนนต์").
//
// v1 backs the library with localStorage so the full save → reuse → reload loop
// works today with zero DB risk. This is the SINGLE SEAM to swap to the chosen DB
// storage (a `components Json` field on the Template model, resolved via
// SystemConfig.activeTemplateId) — replace the 3 functions below with fetch() calls
// to a /api route and nothing else changes.
//
// NOTE: only frame/atom descriptors serialize (JSON). Composites that use the `node`
// escape hatch (raw React icons) aren't persistable until we add a serialization
// strategy for those — out of scope for v1.

const KEY = "fms-saved-components";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(list) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

// → [{ id, name, node }]
export function loadComponents() {
  return read();
}

export function saveComponent(name, node) {
  const list = read();
  const entry = { id: `c_${Date.now().toString(36)}`, name: name || "คอมโพเนนต์", node: JSON.parse(JSON.stringify(node)) };
  const next = [...list, entry];
  write(next);
  return next;
}

export function removeComponent(id) {
  const next = read().filter((c) => c.id !== id);
  write(next);
  return next;
}
