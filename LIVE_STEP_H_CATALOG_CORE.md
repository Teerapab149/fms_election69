# LIVE_STEP_H_CATALOG_CORE.md — Step 2/5: Create Type-Instance Catalog

I wrote this spec myself.

## READ FIRST (mandatory)
1. `CLAUDE.md` — Engineering Discipline section
2. `DECISIONS.md` — Pitfall Log P-LOG-001..004
3. `MASTER_PLAN.md` — Phase 2 roadmap
4. `PHASE2_ARCHITECTURE.md` — full catalog design
5. `LIVE_STEP_H_CATALOG_PREP.md` — Step 1 (already applied; this builds on it)

## CONTEXT — STEP 2 OF 5

Step 1 (PREP) converted dynamic `require()` calls to static imports in
`templateEngine.js` and `stateResolver.js`. Import graph is now safe for a
new catalog module to join.

**This step creates 3 new files. ZERO consumers wired. ZERO old files
deleted.** After this step, both old registries continue to be authoritative;
the catalog exists but is unused. Step 3 (WIRE) will switch consumers atomically.

**Risk level: MEDIUM** — high entry count (32 instances), easy to miss one.
Validation is built in to catch shape errors at dev runtime.

---

## SCOPE (DO NOT EXCEED)

### CREATE — exactly 3 new files

1. `src/components/admin/editor/elementTypes.js`
2. `src/components/admin/editor/elementInstances.js`
3. `src/components/admin/editor/elementCatalog.js`

### DO NOT modify

- `elementRegistry.js` (still authoritative — Step 5 deletes)
- `statefulRegistry.js` (still authoritative — Step 5 deletes)
- `templateEngine.js` (Step 3 work)
- `stateResolver.js` (Step 3 work)
- `PropertyPanel.js` (Step 3 work — EXTRA_ELEMENTS_SCHEMA stays for now)
- Any consumer file (HomeContent.js, EditorPreview files, PageDesignTab.js, etc.)
- Any other file at all

### DO NOT

- Install packages
- Delete files
- Change behavior of existing rendering
- Wire the catalog into any consumer
- Touch `templateEngine.resolveStatefulConfig` fallback line (Step 3 work)
- Add results-* element entries (4 orphan Wraps in `ResultsEditorPreview.js`
  — out of scope; tracked for Step 3 or later)
- Add new templates (Step 4 work)

---

## VERIFIED INVENTORY (32 instances)

Counts pre-confirmed by direct file reads.

### Category A: from `elementRegistry.ELEMENT_PRESETS` (21 entries)
1.  `hero-title`              — text, hero, boundTo `electionName`
2.  `hero-subtitle`           — text, hero, boundTo `campaignTitle`
3.  `hero-subtitle2`          — text, hero, boundTo `organizationName`
4.  `hero-year-badge`         — text, hero, boundTo `academicYearTh`
5.  `hero-countdown`          — toggle in registry; **stateful (countdown-timer)** — overlap with statefulRegistry
6.  `hero-status-badge`       — toggle, hero
7.  `stats-header`            — text, stats
8.  `stats-voted-card`        — card, stats
9.  `stats-progress-card`     — card, stats
10. `stats-eligible-card`     — card, stats
11. `voteCTA-button`          — button in registry; **stateful (button-stateful)** — overlap with statefulRegistry
12. `meet-section`            — card, meetCandidates
13. `meet-title`              — text, meetCandidates
14. `meet-cta`                — button, meetCandidates
15. `banner-section`          — image, electionBanner
16. `vote-header-badge`       — text, voteHeader
17. `vote-header-title`       — text, voteHeader
18. `vote-header-subtitle`    — text, voteHeader
19. `vote-party-card`         — card, voteBody
20. `vote-abstain-button`     — button, voteBody
21. `vote-disapprove-button`  — button, voteBody (single-party only)

### Category B: from `PropertyPanel.EXTRA_ELEMENTS_SCHEMA` (10 entries)
22. `success-title`           — text, successMessage
23. `success-subtitle1`       — text, successMessage
24. `success-subtitle2`       — text, successMessage
25. `success-form-btn`        — button, googleForm
26. `success-footer`          — text, successMessage
27. `candidates-tagline`      — button (visually a badge), header
28. `candidates-title`        — text, header
29. `candidates-subtitle`     — text, header
30. `candidates-counter`      — button (visually a badge), header
31. `candidates-party-card`   — card, partyCardGrid

### Category C: orphan Wrap, not in any registry (1 entry)
32. `vote-divider-text`       — text divider ("หรือ"), voteBody, MultiPartyView.js:122

**Total: 32 instances.** Migrate verbatim — do not invent new fields.

### Out-of-scope orphans (for Step 3 or later, NOT THIS STEP)
- `results-header`, `results-stats-bar`, `results-candidates-heading`,
  `results-demographics` — Wrapped in `ResultsEditorPreview.js` but never
  registered. Selection currently does nothing in PropertyPanel.

---

## TYPE TAXONOMY (16 types)

Each instance must reference exactly one of these `typeId`s.

| typeId              | category    | name (Thai)              | Description                                  |
|---------------------|-------------|--------------------------|----------------------------------------------|
| `text-title`        | `text`      | ข้อความหัวเรื่อง         | H1-level headings (large, bold)              |
| `text-subtitle`     | `text`      | ข้อความย่อย               | Paragraph descriptions                       |
| `text-label`        | `text`      | ป้ายข้อความเล็ก          | Small labels / pill text                     |
| `text-body`         | `text`      | เนื้อหา                   | Body copy / footers                          |
| `text-divider`      | `text`      | ข้อความคั่น               | Divider text ("หรือ")                        |
| `button-primary`    | `button`    | ปุ่มหลัก                  | Primary CTAs                                 |
| `button-secondary`  | `button`    | ปุ่มรอง                   | Secondary / outline buttons                  |
| `button-badge`      | `button`    | ป้ายแบบปุ่ม               | Badge-style buttons (chip)                   |
| `button-stateful`   | `button`    | ปุ่มสถานะ                  | Stateful button (voteCTA)                    |
| `card-primary`      | `card`      | การ์ดหลัก                 | Hero stat / feature cards                    |
| `card-secondary`    | `card`      | การ์ดรอง                  | Small stat cards                             |
| `card-party`        | `card`      | การ์ดพรรค                 | Party display cards                          |
| `card-meet`         | `card`      | การ์ดรู้จักผู้สมัคร       | Meet-candidates section card                 |
| `image-banner`      | `image`     | ภาพแบนเนอร์               | Large promotional images                     |
| `toggle-visibility` | `toggle`    | สวิตช์เปิดปิด             | Visibility toggle (no other fields)          |
| `countdown-timer`   | `countdown` | นับถอยหลัง                 | Stateful countdown                           |

---

## INSTANCE → TYPE MAPPING

| instanceId              | typeId              | source registry              |
|-------------------------|---------------------|------------------------------|
| hero-title              | text-title          | elementRegistry              |
| hero-subtitle           | text-subtitle       | elementRegistry              |
| hero-subtitle2          | text-subtitle       | elementRegistry              |
| hero-year-badge         | text-label          | elementRegistry              |
| hero-countdown          | countdown-timer     | BOTH registries (merge)      |
| hero-status-badge       | toggle-visibility   | elementRegistry              |
| stats-header            | text-label          | elementRegistry              |
| stats-voted-card        | card-primary        | elementRegistry              |
| stats-progress-card     | card-secondary      | elementRegistry              |
| stats-eligible-card     | card-secondary      | elementRegistry              |
| voteCTA-button          | button-stateful     | BOTH registries (merge)      |
| meet-section            | card-meet           | elementRegistry          |
| meet-title              | text-label          | elementRegistry          |
| meet-cta                | button-primary      | elementRegistry          |
| banner-section          | image-banner        | elementRegistry          |
| vote-header-badge       | text-label          | elementRegistry          |
| vote-header-title       | text-title          | elementRegistry          |
| vote-header-subtitle    | text-subtitle       | elementRegistry          |
| vote-party-card         | card-party          | elementRegistry          |
| vote-abstain-button     | button-secondary    | elementRegistry          |
| vote-disapprove-button  | button-secondary    | elementRegistry          |
| success-title           | text-title          | EXTRA_SCHEMA             |
| success-subtitle1       | text-subtitle       | EXTRA_SCHEMA             |
| success-subtitle2       | text-subtitle       | EXTRA_SCHEMA             |
| success-form-btn        | button-primary      | EXTRA_SCHEMA             |
| success-footer          | text-body           | EXTRA_SCHEMA             |
| candidates-tagline      | button-badge        | EXTRA_SCHEMA             |
| candidates-title        | text-title          | EXTRA_SCHEMA             |
| candidates-subtitle     | text-subtitle       | EXTRA_SCHEMA             |
| candidates-counter      | button-badge        | EXTRA_SCHEMA             |
| candidates-party-card   | card-party          | EXTRA_SCHEMA             |
| vote-divider-text       | text-divider        | NEW (orphan)             |

---

## PART 1: `elementTypes.js`

Create `src/components/admin/editor/elementTypes.js`.

### Shape per type

```js
{
  id:          "text-title",
  name:        "ข้อความหัวเรื่อง",
  description: "Primary heading text — H1-level",
  category:    "text",     // legacy control category — PropertyPanel uses this
  layout: {
    minWidth:  null,       // forward-compat (Phase 2.5+)
    maxWidth:  null,
    fluid:     true,
    responsive: null       // forward-compat
  },
  componentLibrary: {
    icon:        "Heading1",      // Lucide icon name — forward-compat (Phase 4)
    tags:        ["heading","h1"],
    previewable: true
  },
  schemaVersion: "v1"
}
```

### Required exports

```js
export const ELEMENT_TYPES = { /* 16 entries */ };

export function getType(typeId) { return ELEMENT_TYPES[typeId] || null; }
export function listTypes()     { return Object.values(ELEMENT_TYPES); }
```

### Type entries to create (verbatim values)

For each of the 16 typeIds in the taxonomy table above, create an entry.
The `category` MUST be exactly one of: `"text"`, `"button"`, `"card"`,
`"image"`, `"toggle"`, `"countdown"`.

`componentLibrary.icon` suggestions (Lucide names; pick any sensible one,
these are forward-compat fields not used yet):
- text-* → `"Type"`, `"Heading1"`, `"AlignLeft"`, `"Text"`
- button-* → `"MousePointerClick"`, `"Square"`
- card-* → `"Square"`, `"LayoutGrid"`
- image-banner → `"Image"`
- toggle-visibility → `"ToggleRight"`
- countdown-timer → `"Timer"`

`tags` array: 2-4 plain Thai/English keywords each. Used in Phase 4 search.
None of this is rendered yet — just stored.

`layout.responsive` may be `null` for all 16 — Phase 2.5 fills it.

**Do NOT define `propertyFields` at the type level.** Property fields live
on instances (per `PHASE2_ARCHITECTURE.md` "Single source for property fields
— instance-level"). Type-level fields would conflict with instance-level
overrides later.

---

## PART 2: `elementInstances.js`

Create `src/components/admin/editor/elementInstances.js`.

### Top of file: shared field arrays (private constants)

Field shapes mirror what PropertyPanel currently renders per type. Define
six private constants at the top of the file:

```js
const FIELDS_TEXT = [
  { key: "text",       control: "text",     label: "ข้อความ" },
  { key: "fontSize",   control: "size",     label: "ขนาด" },
  { key: "color",      control: "color",    label: "สี" },
  { key: "fontWeight", control: "weight",   label: "น้ำหนัก" },
  { key: "align",      control: "align",    label: "จัดแนว" }
];

const FIELDS_BUTTON = [
  { key: "text",            control: "text",   label: "ข้อความ" },
  { key: "backgroundColor", control: "color",  label: "สีพื้นหลัง" },
  { key: "textColor",       control: "color",  label: "สีตัวอักษร" },
  { key: "borderRadius",    control: "radius", label: "มุมโค้ง" }
];

const FIELDS_CARD = [
  { key: "backgroundColor", control: "color",  label: "สีพื้นหลัง" },
  { key: "borderColor",     control: "color",  label: "สีขอบ" },
  { key: "borderRadius",    control: "radius", label: "มุมโค้ง" },
  { key: "visible",         control: "toggle", label: "แสดง" }
];

const FIELDS_IMAGE = [
  { key: "visible",         control: "toggle", label: "แสดง" },
  { key: "borderRadius",    control: "radius", label: "มุมโค้ง" }
];

const FIELDS_TOGGLE = [
  { key: "visible",         control: "toggle", label: "แสดง" }
];

// Stateful instances populate per-state defaults via defaultConfig.
// FIELDS_STATEFUL is informational — the actual editor (StatefulGallery)
// owns its own field schema for now (Phase 4 wiring).
const FIELDS_STATEFUL = [];
```

These map 1:1 to the current `PropertyPanel.TextControls / ButtonControls /
CardControls / ImageControls / ToggleControls`. Do not invent new field keys.

### Shape per instance

```js
{
  id:               "hero-title",
  typeId:           "text-title",
  name:             "ชื่อหลัก",
  pages:            ["home"],
  section:          "hero",
  boundTo:          "electionName",     // or null
  isStateful:       false,              // true only for hero-countdown + voteCTA-button
  stateResolverKey: null,               // "countdown" or "voteCTA" for stateful
  states:           null,               // array of {id,label,description} for stateful
  propertyFields:   FIELDS_TEXT,        // pick one of FIELDS_*
  defaultConfig:    { /* see below */ },
  presets:          { /* see below */ },// null for stateful
  schemaVersion:    "v1"
}
```

### Data migration rules

**For each of the 21 entries in `elementRegistry.ELEMENT_PRESETS`:**
- `id` = registry key verbatim
- `typeId` = per mapping table above
- `name` = `def.label` from old registry (Thai)
- `pages` = derive from registry key prefix (see "Page derivation" below)
- `section` = `def.section` verbatim
- `boundTo` = `def.boundTo` verbatim (null if absent)
- `isStateful` = `true` only for `hero-countdown` and `voteCTA-button`
- `propertyFields` = per type.category (FIELDS_TEXT / FIELDS_BUTTON / etc.)
- For **non-stateful** instances:
  - `stateResolverKey` = null
  - `states` = null
  - `defaultConfig` = copy `def.presets.classic` (classic is the canonical baseline)
  - `presets` = copy `def.presets` verbatim (object with 4 keys: classic/dark/playful/minimal)
- For **stateful** instances (`hero-countdown`, `voteCTA-button`) — MERGE both registries:
  - `stateResolverKey` = `STATEFUL_ELEMENTS[id].stateResolverKey`
  - `states` = `STATEFUL_ELEMENTS[id].states` verbatim
  - `defaultConfig` = `STATEFUL_ELEMENTS[id].defaultConfig` verbatim (per-state shape `{ [stateId]: {...} }`)
  - `presets` = `ELEMENT_PRESETS[id].presets` verbatim (legacy 4-key static shape `{ classic, dark, playful, minimal }`).
    - These fields (e.g. `{ visible: true }` for hero-countdown, or `{ text, backgroundColor, ... }` for voteCTA-button)
      are kept for forward-compat with the toggle/static-style admin controls (e.g. show/hide toggle, base styling).
    - The stateful editor (StatefulGallery) uses `defaultConfig[stateId]` and ignores `presets`.
    - `resolveConfig()` routes by `isStateful` (see Part 3) — presets only apply on the static path.
  - `propertyFields` = `FIELDS_STATEFUL` (empty array — StatefulGallery owns its schema)

**For each of the 10 entries in `EXTRA_ELEMENTS_SCHEMA`:**
- `id` = key verbatim
- `typeId` = per mapping table
- `name` = `def.label`
- `pages` = derive (see below)
- `section` = `def.section` verbatim
- `boundTo` = `null` (none of these have bindings)
- `isStateful` = false
- `propertyFields` = per type.category
- `defaultConfig` = `{}` (none defined; will fall through to user override)
- `presets` = `null` (none defined)

**For `vote-divider-text` (new, orphan):**
- `id` = `"vote-divider-text"`
- `typeId` = `"text-divider"`
- `name` = `"ข้อความคั่น"`
- `pages` = `["vote"]`
- `section` = `"voteBody"`
- `boundTo` = null
- `isStateful` = false
- `propertyFields` = FIELDS_TEXT (subset OK — only `text`/`color`/`fontSize`
  actually used in MultiPartyView; full FIELDS_TEXT array is fine, unused
  keys are inert)
- `defaultConfig` = `{ text: "หรือ", color: "#64748b", fontSize: "xs" }`
  (mirrors hardcoded values in MultiPartyView.js:124-127)
- `presets` = `null`

### Page derivation (from id prefix)

| Prefix             | pages                |
|--------------------|----------------------|
| `hero-`            | `["home"]`           |
| `stats-`           | `["home"]`           |
| `voteCTA-`         | `["home"]`           |
| `meet-`            | `["home"]`           |
| `banner-`          | `["home"]`           |
| `vote-`            | `["vote"]`           |
| `success-`         | `["success"]`        |
| `candidates-`      | `["candidates"]`     |

No instance lives on multiple pages in Phase 2.

### Required exports

```js
export const ELEMENT_INSTANCES = { /* 32 entries */ };
```

No helpers here — they live in `elementCatalog.js`.

---

## PART 3: `elementCatalog.js`

Create `src/components/admin/editor/elementCatalog.js`.

This is the public API. Other modules will import from here in Step 3.

### Imports

```js
import { ELEMENT_TYPES, getType, listTypes } from './elementTypes';
import { ELEMENT_INSTANCES } from './elementInstances';
```

### Re-exports (let consumers use one import path)

```js
export { ELEMENT_TYPES, ELEMENT_INSTANCES, getType, listTypes };
```

### Primary helper

```js
/**
 * Merged element view = instance fields + type metadata.
 * Returns the same shape Step 3 consumers can use to replace
 * elementRegistry.ELEMENT_PRESETS[id] and statefulRegistry.STATEFUL_ELEMENTS[id].
 */
export function getElement(instanceId) {
  const instance = ELEMENT_INSTANCES[instanceId];
  if (!instance) return null;
  const type = ELEMENT_TYPES[instance.typeId] || null;
  return {
    id:               instance.id,
    typeId:           instance.typeId,
    type:             type?.category || null,     // legacy controlType — text/button/card/...
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
```

### Query helpers

```js
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
```

### Legacy-compatible helpers (so Step 3 consumer churn is minimal)

```js
export function getBinding(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.boundTo || null;
}

export function isBoundElement(instanceId) {
  return getBinding(instanceId) !== null;
}

export function isStatefulElement(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.isStateful === true;
}

export function getStatesOf(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.states || [];
}

export function getDefaultStateConfig(instanceId, stateId) {
  const inst = ELEMENT_INSTANCES[instanceId];
  if (!inst?.isStateful) return {};
  return inst.defaultConfig?.[stateId] || {};
}

export function getElementPresets(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.presets || {};
}

// Returns { [instanceId]: { type, label, section, config } }.
// Mirrors elementRegistry.getPresetDefaults exactly so Step 3 swap is safe.
// NOTE: stateful instances ARE included (they carry legacy `presets` for
// forward-compat). Their preset config drives toggle/visible/base-styling
// while StatefulGallery owns per-state config independently.
export function getPresetDefaults(presetId) {
  const out = {};
  for (const [id, inst] of Object.entries(ELEMENT_INSTANCES)) {
    if (!inst.presets) continue; // skip instances with no preset data (e.g., EXTRA_SCHEMA entries)
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
```

### Resolution helper (forward-compat — used by Step 3+)

```js
/**
 * Resolve final config for an element.
 *
 * Routing is `isStateful`-driven:
 *   - Stateful: defaultConfig[stateId] → userOverride[stateId].
 *     `presets` is IGNORED on the stateful path (it carries legacy
 *     static-shape data — visibility/base styling — that StatefulGallery
 *     does not consume). Template-level per-state overrides still live in
 *     templateEngine.TEMPLATES until Step 4 extends them.
 *   - Static: defaultConfig → presets[templateId] → userOverride.
 */
export function resolveConfig(instanceId, context = {}) {
  const inst = ELEMENT_INSTANCES[instanceId];
  if (!inst) return {};
  const { templateId = "classic", stateId = null, userOverride = {} } = context;

  if (inst.isStateful) {
    if (!stateId) return {};
    const base = inst.defaultConfig?.[stateId] || {};
    const over = userOverride?.[stateId] || {};
    return { ...base, ...over };
  }

  const baseDefault = inst.defaultConfig || {};
  const presetOver  = inst.presets?.[templateId] || inst.presets?.classic || {};
  return { ...baseDefault, ...presetOver, ...userOverride };
}
```

### Validation (runs in dev only)

```js
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
      // defaultConfig must be per-state (object keyed by state id)
      if (!inst.defaultConfig || typeof inst.defaultConfig !== "object") {
        errors.push(`${inst.id}: stateful needs defaultConfig`);
      } else {
        for (const s of (inst.states || [])) {
          if (!inst.defaultConfig[s.id]) {
            errors.push(`${inst.id}: defaultConfig missing state "${s.id}"`);
          }
        }
      }
      // presets is optional on stateful (legacy static shape — may be null or 4-key object)
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
  }
}
```

The module-load self-check is REQUIRED — it surfaces shape errors in
`npm run dev` console without needing a consumer to call validateCatalog.

---

## VERIFICATION (mandatory per P-LOG-003)

### 1. Build

```
npm run build
```

**Must exit 0.** Same page count as before. No new warnings.

### 2. Grep verifications — paste actual outputs in report

```
# 3 new files exist
ls src/components/admin/editor/elementTypes.js
ls src/components/admin/editor/elementInstances.js
ls src/components/admin/editor/elementCatalog.js

# Zero consumer wiring (no other file imports from new catalog yet)
grep -rn "from ['\"].*elementCatalog['\"]" src/ --include="*.js" --include="*.jsx"
grep -rn "from ['\"].*elementTypes['\"]"    src/ --include="*.js" --include="*.jsx"
grep -rn "from ['\"].*elementInstances['\"]" src/ --include="*.js" --include="*.jsx"
# Expected: ONLY mutual imports inside the 3 new files
#   elementCatalog.js → elementTypes, elementInstances
#   No HomeContent/PropertyPanel/etc. references

# 32 ELEMENT_INSTANCES entries
grep -cE "^\s*\"[a-z][a-z0-9-]+\":\s*\{" src/components/admin/editor/elementInstances.js
# Expected: 32

# 16 ELEMENT_TYPES entries
grep -cE "^\s*\"[a-z][a-z0-9-]+\":\s*\{" src/components/admin/editor/elementTypes.js
# Expected: 16

# vote-divider-text is registered
grep -n "vote-divider-text" src/components/admin/editor/elementInstances.js
# Expected: at least 1 match (instance entry)

# Old registries untouched (line counts must match pre-step)
git diff --stat src/components/admin/editor/elementRegistry.js
git diff --stat src/components/admin/editor/statefulRegistry.js
git diff --stat src/components/admin/editor/templateEngine.js
git diff --stat src/components/admin/editor/stateResolver.js
git diff --stat src/components/admin/editor/PropertyPanel.js
# Expected: empty (no diff) for ALL five
```

### 3. Dev runtime check

```
npm run dev
```

Open admin → ออกแบบหน้าเว็บ. In browser DevTools console:
- ✅ No `[elementCatalog] validation errors:` warning
- ✅ No new red errors
- ✅ Editor still functions identically (no consumer change yet)

### 4. Console probe (manual)

In DevTools console, paste:

```js
import("/_next/static/...elementCatalog...").then(m => {
  console.log("instances:", Object.keys(m.ELEMENT_INSTANCES).length);
  console.log("types:",     Object.keys(m.ELEMENT_TYPES).length);
  console.log("errors:",    m.validateCatalog());
});
```

(Skip if Next.js bundle path is hard to find — the module-load self-check
already covers this.)

Expected: 32 instances, 16 types, [] errors.

---

## REPORT FORMAT (mandatory)

```
Created src/components/admin/editor/elementTypes.js — 16 type entries
Created src/components/admin/editor/elementInstances.js — 32 instance entries
Created src/components/admin/editor/elementCatalog.js — public API + helpers + validateCatalog + module-load self-check

Instance breakdown:
- From elementRegistry: 21
- From EXTRA_ELEMENTS_SCHEMA: 10
- New (vote-divider-text): 1
- Total: 32

Type breakdown:
- text-*: 5 (text-title, text-subtitle, text-label, text-body, text-divider)
- button-*: 4 (primary, secondary, badge, stateful)
- card-*: 4 (primary, secondary, party, meet)
- image-banner: 1
- toggle-visibility: 1
- countdown-timer: 1
- Total: 16

Build: PASS — npm run build exit 0

Grep verifications (PROOF):
[paste ALL grep outputs from VERIFICATION section]

Dev runtime check:
- npm run dev: no validation warnings ✅
- Admin editor: no regression ✅
- Console clean ✅

Files NOT modified (confirmed via git diff --stat):
- elementRegistry.js ✅
- statefulRegistry.js ✅
- templateEngine.js ✅
- stateResolver.js ✅
- PropertyPanel.js ✅
- All consumer files ✅

Out-of-scope items left for Step 3 or later:
- results-* (4 orphan Wraps) — not registered in this catalog
- success-* (5 entries in EXTRA_SCHEMA) — migrated as instances but no Wraps reference them in production
- templateEngine fallback bug — unchanged
```

No other commentary.

---

## NEXT STEP

After this CORE step passes verification, **Step 3 (H-CATALOG-WIRE)** in a
fresh session will:
- Switch 7 consumers (PropertyPanel, PageDesignTab, EditorPreview files,
  HomeContent.js, etc.) to import from `elementCatalog`
- Delete `EXTRA_ELEMENTS_SCHEMA` from PropertyPanel.js (now redundant)
- Fix the `resolveStatefulConfig` fallback gap
- Decide whether to register the 4 results-* orphans or leave for Phase 3
