# LIVE_STEP_H_CATALOG_CORE.md — Step 2/5: Create Unified Element Catalog

## READ FIRST
Read in order: `CLAUDE.md` (Engineering Discipline section), `DECISIONS.md` 
(P-LOG-001 to P-LOG-004), `MASTER_PLAN.md`, and **`PHASE2_ARCHITECTURE.md`** 
(critical — full design rationale + complete schemas live there). Follow 
Engineering Discipline strictly.

## CONTEXT — STEP 2 OF 5

Step 1 (PREP) ✅ converted dynamic requires to static imports. Now Step 2 
creates the unified element catalog with type-instance separation.

**Architecture summary** (full detail in PHASE2_ARCHITECTURE.md):
- `elementTypes.js` — 16 semantic categories
- `elementInstances.js` — 32 instances (including new vote-divider-text)
- `elementCatalog.js` — public API + helpers + validateCatalog

**Risk level: MEDIUM** — large file creation, but no consumer impact yet 
(catalog created but not yet imported by anyone). Step 3 wires consumers.

## SCOPE

**Create exactly 3 new files:**
1. `src/components/admin/editor/elementTypes.js`
2. `src/components/admin/editor/elementInstances.js`
3. `src/components/admin/editor/elementCatalog.js`

**Do NOT modify:**
- elementRegistry.js (still active for now)
- statefulRegistry.js (still active)
- Any consumer file
- templateEngine.js or stateResolver.js (just changed in Step 1)
- Any production page

**Do NOT delete anything yet** — Step 5 handles cleanup.

Do NOT install packages.

---

## CRITICAL WORKFLOW (Read Before Coding)

### Per P-LOG-004: Read source FIRST, write SECOND

Before writing any instance, you MUST have these files open and read:

1. **`src/components/admin/editor/elementRegistry.js`** — open, read fully
   - Contains 21 entries with: `type`, `label`, `section`, `presets`
   - Note shared preset objects (e.g., `statsSmallCardPresets`)
   
2. **`src/components/admin/editor/statefulRegistry.js`** — open, read fully
   - Contains 2 stateful elements: hero-countdown, voteCTA-button
   - Each has: `states[]`, `defaultConfig[stateId]`, `stateResolverKey`
   
3. **`src/components/admin/editor/PropertyPanel.js`** — read EXTRA_ELEMENTS_SCHEMA
   - Contains 10 entries: success-* (5) + candidates-* (5)
   - Note: no presets, only type/label/section/defaultConfig

4. **`src/components/admin/editor/MultiPartyView.js` line ~120** — confirm vote-divider-text usage
   - Used as: `<Wrap id="vote-divider-text">` with config.text and config.color
   - NOT registered anywhere — 32nd element

5. **`src/utils/pageRegistry.js`** — read section names per page
   - Verify section normalizations don't collide with existing names

### Per P-LOG-003: Migrate VERBATIM, prove with grep

For EVERY instance migrated:
- Copy `defaultConfig` and `presets` values from source files
- Do NOT paraphrase, summarize, or "improve" values
- Do NOT leave placeholder comments
- After writing, grep to prove no placeholders remain

---

## PART 1: Create elementTypes.js

### File: `src/components/admin/editor/elementTypes.js`

This file defines 16 semantic types — categorization metadata for 
Component Library + layout constraints + controlType mapping.

```javascript
/**
 * elementTypes.js — Semantic type definitions.
 * 
 * Types are LIGHTWEIGHT metadata. Property fields and config defaults 
 * live on individual instances (since same type can have very different 
 * field counts: static button = 4 fields, stateful button = 15 fields).
 * 
 * Each type defines:
 *   - category: for Component Library filtering
 *   - controlType: maps to PropertyPanel's switch (text|button|card|image|toggle|countdown)
 *   - layout: responsive constraints (forward-compat for Phase 2.5+)
 *   - componentLibrary: tags + icon for browse UI
 * 
 * Schema version: v1
 */

export const ELEMENT_TYPES = {
  // ==================== TEXT TYPES ====================
  "text-title": {
    id: "text-title",
    name: "ข้อความหัวเรื่อง",
    description: "Primary heading — H1-level prominence",
    category: "text",
    controlType: "text",  // PropertyPanel switch key
    layout: {
      minWidth: 200, maxWidth: null, fluid: true,
      responsive: {
        mobile:  { fontSize: "2xl" },
        tablet:  { fontSize: "4xl" },
        desktop: { fontSize: "5xl" }
      }
    },
    componentLibrary: {
      icon: "Heading1",
      tags: ["heading", "h1", "title", "หัวข้อ"],
      previewable: true
    },
    schemaVersion: "v1"
  },
  
  "text-subtitle": {
    id: "text-subtitle",
    name: "ข้อความรอง",
    description: "Secondary text below title",
    category: "text",
    controlType: "text",
    layout: {
      minWidth: 200, maxWidth: null, fluid: true,
      responsive: {
        mobile: { fontSize: "sm" }, tablet: { fontSize: "base" }, desktop: { fontSize: "lg" }
      }
    },
    componentLibrary: { icon: "Heading2", tags: ["subtitle", "ข้อความรอง"], previewable: true },
    schemaVersion: "v1"
  },
  
  "text-label": {
    id: "text-label",
    name: "ป้ายข้อความ",
    description: "Small label or badge text",
    category: "text",
    controlType: "text",
    layout: {
      minWidth: 60, maxWidth: 300, fluid: false,
      responsive: { mobile: { fontSize: "xs" }, desktop: { fontSize: "sm" } }
    },
    componentLibrary: { icon: "Tag", tags: ["label", "badge", "ป้าย"], previewable: true },
    schemaVersion: "v1"
  },
  
  "text-body": {
    id: "text-body",
    name: "ข้อความเนื้อหา",
    description: "Body paragraph or descriptive text",
    category: "text",
    controlType: "text",
    layout: {
      minWidth: 200, maxWidth: 800, fluid: true,
      responsive: { mobile: { fontSize: "sm" }, desktop: { fontSize: "base" } }
    },
    componentLibrary: { icon: "AlignLeft", tags: ["body", "paragraph", "เนื้อหา"], previewable: true },
    schemaVersion: "v1"
  },
  
  // ==================== BUTTON TYPES ====================
  "button-primary": {
    id: "button-primary",
    name: "ปุ่มหลัก",
    description: "Primary CTA button — high prominence",
    category: "button",
    controlType: "button",
    layout: {
      minWidth: 120, maxWidth: 400, fluid: false,
      responsive: {
        mobile: { paddingX: 4, paddingY: 2 }, desktop: { paddingX: 6, paddingY: 3 }
      }
    },
    componentLibrary: { icon: "Zap", tags: ["button", "cta", "primary", "ปุ่มหลัก"], previewable: true },
    schemaVersion: "v1"
  },
  
  "button-secondary": {
    id: "button-secondary",
    name: "ปุ่มรอง",
    description: "Alternative button — secondary action",
    category: "button",
    controlType: "button",
    layout: {
      minWidth: 100, maxWidth: 400, fluid: false,
      responsive: {
        mobile: { paddingX: 3, paddingY: 2 }, desktop: { paddingX: 5, paddingY: 2 }
      }
    },
    componentLibrary: { icon: "MousePointer", tags: ["button", "secondary", "ปุ่มรอง"], previewable: true },
    schemaVersion: "v1"
  },
  
  "button-badge": {
    id: "button-badge",
    name: "ปุ่มป้าย",
    description: "Small pill-shaped badge button",
    category: "button",
    controlType: "button",
    layout: {
      minWidth: 60, maxWidth: 200, fluid: false,
      responsive: {
        mobile: { paddingX: 2, paddingY: 1 }, desktop: { paddingX: 3, paddingY: 1 }
      }
    },
    componentLibrary: { icon: "Sparkles", tags: ["badge", "chip", "pill", "ป้าย"], previewable: true },
    schemaVersion: "v1"
  },
  
  // ==================== CARD TYPES ====================
  "card-primary": {
    id: "card-primary",
    name: "การ์ดหลัก",
    description: "Large feature card with strong visual presence",
    category: "card",
    controlType: "card",
    layout: {
      minWidth: 280, maxWidth: 600, fluid: true,
      responsive: { mobile: { padding: 4 }, desktop: { padding: 6 } }
    },
    componentLibrary: { icon: "Square", tags: ["card", "feature", "การ์ดหลัก"], previewable: true },
    schemaVersion: "v1"
  },
  
  "card-secondary": {
    id: "card-secondary",
    name: "การ์ดรอง",
    description: "Smaller stat or info card",
    category: "card",
    controlType: "card",
    layout: {
      minWidth: 200, maxWidth: 400, fluid: true,
      responsive: { mobile: { padding: 3 }, desktop: { padding: 4 } }
    },
    componentLibrary: { icon: "RectangleHorizontal", tags: ["card", "stat", "info"], previewable: true },
    schemaVersion: "v1"
  },
  
  "card-party-vote": {
    id: "card-party-vote",
    name: "การ์ดพรรค (เลือก)",
    description: "Selectable party card with radio affordance",
    category: "card",
    controlType: "card",
    layout: {
      minWidth: 280, maxWidth: 480, fluid: true,
      responsive: { mobile: { padding: 4 }, desktop: { padding: 5 } }
    },
    componentLibrary: { icon: "CheckSquare", tags: ["card", "party", "vote", "การ์ดเลือก"], previewable: true },
    schemaVersion: "v1"
  },
  
  "card-party-info": {
    id: "card-party-info",
    name: "การ์ดพรรค (ข้อมูล)",
    description: "Informational party card with details CTA",
    category: "card",
    controlType: "card",
    layout: {
      minWidth: 280, maxWidth: 480, fluid: true,
      responsive: { mobile: { padding: 4 }, desktop: { padding: 5 } }
    },
    componentLibrary: { icon: "Info", tags: ["card", "party", "info", "การ์ดข้อมูล"], previewable: true },
    schemaVersion: "v1"
  },
  
  "card-meet": {
    id: "card-meet",
    name: "การ์ด Meet Candidates",
    description: "Special section card for candidate meeting",
    category: "card",
    controlType: "card",
    layout: {
      minWidth: 320, maxWidth: 800, fluid: true,
      responsive: { mobile: { padding: 4 }, desktop: { padding: 8 } }
    },
    componentLibrary: { icon: "Users", tags: ["card", "meet", "candidates"], previewable: true },
    schemaVersion: "v1"
  },
  
  // ==================== IMAGE TYPES ====================
  "image-banner": {
    id: "image-banner",
    name: "ภาพแบนเนอร์",
    description: "Large promotional banner image",
    category: "image",
    controlType: "image",
    layout: {
      minWidth: 320, maxWidth: 1600, fluid: true,
      responsive: { mobile: { aspectRatio: "16/9" }, desktop: { aspectRatio: "21/9" } }
    },
    componentLibrary: { icon: "Image", tags: ["image", "banner", "ภาพ"], previewable: true },
    schemaVersion: "v1"
  },
  
  // ==================== TOGGLE TYPES ====================
  "toggle-visibility": {
    id: "toggle-visibility",
    name: "ปุ่มเปิด/ปิด",
    description: "Visibility toggle for show/hide elements",
    category: "toggle",
    controlType: "toggle",
    layout: { minWidth: 0, maxWidth: null, fluid: false, responsive: null },
    componentLibrary: { icon: "ToggleRight", tags: ["toggle", "visibility"], previewable: false },
    schemaVersion: "v1"
  },
  
  // ==================== STATEFUL TYPES ====================
  "countdown-timer": {
    id: "countdown-timer",
    name: "นับถอยหลัง",
    description: "Multi-state countdown timer with phase awareness",
    category: "stateful",
    controlType: "countdown",  // PropertyPanel handles via StatefulGallery
    layout: {
      minWidth: 280, maxWidth: 800, fluid: true,
      responsive: {
        mobile:  { fontSize: "lg",  paddingX: 4, paddingY: 3 },
        tablet:  { fontSize: "xl",  paddingX: 5, paddingY: 4 },
        desktop: { fontSize: "2xl", paddingX: 6, paddingY: 5 }
      }
    },
    componentLibrary: { icon: "Clock", tags: ["countdown", "timer", "stateful"], previewable: true },
    schemaVersion: "v1"
  },
  
  "button-stateful": {
    id: "button-stateful",
    name: "ปุ่ม Stateful",
    description: "Button changing appearance based on context (auth/vote/system state)",
    category: "stateful",
    controlType: "button",  // PropertyPanel handles via StatefulGallery
    layout: {
      minWidth: 160, maxWidth: 600, fluid: false,
      responsive: {
        mobile: { paddingX: 4, paddingY: 3 }, desktop: { paddingX: 8, paddingY: 4 }
      }
    },
    componentLibrary: { icon: "Power", tags: ["button", "stateful", "cta"], previewable: true },
    schemaVersion: "v1"
  }
};

// ==================== HELPERS ====================

export function getType(typeId) {
  return ELEMENT_TYPES[typeId] || null;
}

export function getTypesByCategory(category) {
  return Object.values(ELEMENT_TYPES).filter(t => t.category === category);
}

export function getAllTypeIds() {
  return Object.keys(ELEMENT_TYPES);
}
```

---

## PART 2: Create elementInstances.js

### File: `src/components/admin/editor/elementInstances.js`

**MANDATORY APPROACH:**

1. **First, define shared field constants** (DRY for repeated patterns)
2. **Then list all 32 instances with VERBATIM data from source files**

### Step 2.1 — Field constants (write these first)

```javascript
/**
 * elementInstances.js — Element placements on pages.
 * 
 * Each instance refers to a typeId from elementTypes.js, specifies 
 * placement (pages, section), defines property fields, and holds 
 * defaultConfig + presets verbatim from legacy registries.
 * 
 * Resolution chain at runtime:
 *   defaultConfig → presets[templateId] → template.elements[id] → userOverride
 * 
 * Schema version: v1
 */

// Reusable property field constants (DRY for similar instances)
// Note: passed by reference. To override per instance, spread:
//   propertyFields: [...TEXT_FIELDS, { key: "extra", control: "color", label: "พิเศษ" }]

const TEXT_FIELDS = [
  { key: "text",       control: "text",   label: "ข้อความ" },
  { key: "fontSize",   control: "select", label: "ขนาด",   options: ["xs","sm","base","lg","xl","2xl","3xl","4xl","5xl","6xl"] },
  { key: "color",      control: "color",  label: "สี" },
  { key: "fontWeight", control: "select", label: "น้ำหนัก", options: ["normal","medium","semibold","bold","black"] },
  { key: "align",      control: "radio",  label: "จัดวาง",  options: ["left","center","right"] }
];

const BUTTON_FIELDS = [
  { key: "text",            control: "text",   label: "ข้อความ" },
  { key: "backgroundColor", control: "color",  label: "สีพื้นหลัง" },
  { key: "textColor",       control: "color",  label: "สีข้อความ" },
  { key: "borderRadius",    control: "select", label: "มน", options: ["none","sm","md","lg","xl","2xl","3xl","full"] }
];

const CARD_FIELDS = [
  { key: "backgroundColor", control: "color",  label: "สีพื้นหลัง" },
  { key: "borderColor",     control: "color",  label: "สีขอบ" },
  { key: "borderRadius",    control: "select", label: "มน", options: ["none","sm","md","lg","xl","2xl","3xl","full"] },
  { key: "visible",         control: "toggle", label: "แสดง" }
];

const IMAGE_FIELDS = [
  { key: "visible",      control: "toggle", label: "แสดง" },
  { key: "borderRadius", control: "select", label: "มน", options: ["none","sm","md","lg","xl","2xl","3xl","full"] }
];

const TOGGLE_FIELDS = [
  { key: "visible", control: "toggle", label: "แสดง" }
];

// Stateful field schemas — actual control keys from StatefulEditor in StatefulGallery.js
// CRITICAL: read StatefulEditor source to verify these keys match production component code.

const STATEFUL_BUTTON_FIELDS = [
  // Simple tier
  { key: "text",            control: "text",   label: "ข้อความ",       tier: "simple" },
  { key: "backgroundType",  control: "radio",  label: "ประเภทพื้นหลัง", options: ["solid","gradient"], tier: "simple" },
  { key: "backgroundColor", control: "color",  label: "สีพื้นหลัง",     tier: "simple" },
  { key: "textColor",       control: "color",  label: "สีข้อความ",      tier: "simple" },
  { key: "borderRadius",    control: "select", label: "มน",            options: ["none","sm","md","lg","xl","2xl","3xl","full"], tier: "simple" },
  { key: "fontSize",        control: "select", label: "ขนาด",          options: ["xs","sm","base","lg","xl","2xl"], tier: "simple" },
  // Advanced tier
  { key: "borderWidth",     control: "select", label: "เส้นขอบ",        options: ["0","1","2","4"], tier: "advanced" },
  { key: "borderColor",     control: "color",  label: "สีขอบ",          tier: "advanced" },
  { key: "shadow",          control: "select", label: "เงา",            options: ["none","sm","md","lg","xl"], tier: "advanced" },
  { key: "fontWeight",      control: "select", label: "น้ำหนัก",        options: ["normal","medium","semibold","bold"], tier: "advanced" },
  { key: "paddingX",        control: "select", label: "Padding X",      options: ["2","3","4","5","6","8"], tier: "advanced" },
  { key: "paddingY",        control: "select", label: "Padding Y",      options: ["1","2","3","4","5"], tier: "advanced" },
  // Expert tier
  { key: "letterSpacing",   control: "input",  label: "ระยะตัวอักษร",   tier: "expert" },
  { key: "lineHeight",      control: "input",  label: "Line height",    tier: "expert" },
  { key: "textTransform",   control: "select", label: "Text transform", options: ["none","uppercase","lowercase","capitalize"], tier: "expert" }
];

// Verify these keys against actual countdown defaultConfig in statefulRegistry.js
// If field keys don't match config keys → field controls won't work
const STATEFUL_COUNTDOWN_FIELDS = [
  // Simple tier — KEYS MUST MATCH statefulRegistry["hero-countdown"].defaultConfig[state] KEYS
  { key: "text",            control: "text",   label: "ข้อความ Label",  tier: "simple" },
  { key: "pillBackground",  control: "color",  label: "สี Pill",         tier: "simple" },
  { key: "textColor",       control: "color",  label: "สีข้อความ",       tier: "simple" },
  { key: "digitColor",      control: "color",  label: "สีตัวเลข",        tier: "simple" },
  { key: "borderRadius",    control: "select", label: "มน",             options: ["none","sm","md","lg","xl","2xl","3xl","full"], tier: "simple" },
  // Advanced tier
  { key: "shadow",          control: "select", label: "เงา",            options: ["none","sm","md","lg","xl"], tier: "advanced" },
  { key: "fontWeight",      control: "select", label: "น้ำหนัก",        options: ["normal","medium","semibold","bold"], tier: "advanced" }
];
```

### Step 2.2 — All 32 instances

```javascript
export const ELEMENT_INSTANCES = {
  // ============== EXAMPLE 1: Static text with binding + presets ==============
  // Pattern for: hero-title, hero-subtitle, hero-subtitle2, hero-year-badge, 
  //              stats-header, meet-title, vote-header-*, vote-divider-text,
  //              candidates-title, candidates-subtitle, success-* texts
  "hero-title": {
    id: "hero-title",
    typeId: "text-title",
    name: "ชื่อหลัก",
    pages: ["home"],
    section: "hero",
    boundTo: "electionName",
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: TEXT_FIELDS,
    
    // COPY VERBATIM from elementRegistry["hero-title"].presets.classic
    defaultConfig: { /* fill from source */ },
    
    // COPY VERBATIM from elementRegistry["hero-title"].presets
    presets: { /* fill from source — 4 keys: classic, dark, playful, minimal */ },
    
    schemaVersion: "v1"
  },
  
  // ============== EXAMPLE 2: Stateful element (NO presets) ==============
  // Pattern for: voteCTA-button (button-stateful), hero-countdown (countdown-timer)
  "hero-countdown": {
    id: "hero-countdown",
    typeId: "countdown-timer",
    name: "นับถอยหลัง",
    pages: ["home"],
    section: "hero",
    boundTo: null,
    isStateful: true,
    stateResolverKey: "countdown",
    states: [
      { id: "before",      label: "ก่อนเริ่ม",     description: "เวลาก่อนเปิดให้เลือกตั้ง" },
      { id: "running",     label: "กำลังนับ",       description: "นับถอยหลังแบบ realtime" },
      { id: "paused",      label: "หยุดชั่วคราว",   description: "PAUSE สำหรับปรับปรุง" },
      { id: "manualEnded", label: "ปิดด้วยมือ",     description: "ปิดโดย admin" },
      { id: "nextYear",    label: "ปีถัดไป",         description: "หลังจบเลือกตั้งปีนี้" }
    ],
    propertyFields: STATEFUL_COUNTDOWN_FIELDS,
    
    // COPY VERBATIM from statefulRegistry["hero-countdown"].defaultConfig
    // Shape: { before: {...}, running: {...}, paused: {...}, manualEnded: {...}, nextYear: {...} }
    // CRITICAL: keys must match `states[].id` exactly. Validate after copy.
    defaultConfig: { /* fill from source — must have all 5 state keys */ },
    
    presets: null,  // stateful uses templateEngine.TEMPLATES instead
    schemaVersion: "v1"
  },
  
  // ============== EXAMPLE 3: NEW unregistered element ==============
  // ONLY ONE: vote-divider-text (was unregistered in any source)
  "vote-divider-text": {
    id: "vote-divider-text",
    typeId: "text-body",
    name: "ข้อความคั่น",
    pages: ["vote"],
    section: "partyGrid",  // appears between party cards and abstain/disapprove
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: TEXT_FIELDS,
    
    // NEW — no source values exist. Use these defaults (production renders "หรือ"):
    defaultConfig: { text: "หรือ", color: "#64748b", fontSize: "sm", fontWeight: "normal", align: "center" },
    
    // Provide presets per template (4 names) — sensible defaults matching production:
    presets: {
      classic: { text: "หรือ", color: "#64748b" },
      dark:    { text: "หรือ", color: "#94a3b8" },
      playful: { text: "หรือ", color: "#be185d" },
      minimal: { text: "หรือ", color: "#94a3b8" }
    },
    
    schemaVersion: "v1"
  },
  
  // ============== EXAMPLE 4: Card with shared presets ==============
  // Pattern for: stats-progress-card, stats-eligible-card (share statsSmallCardPresets)
  "stats-progress-card": {
    id: "stats-progress-card",
    typeId: "card-secondary",
    name: "การ์ดความคืบหน้า",
    pages: ["home"],
    section: "stats",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: CARD_FIELDS,
    
    // COPY VERBATIM from elementRegistry["stats-progress-card"].presets.classic
    defaultConfig: { /* fill from source */ },
    
    // COPY VERBATIM from elementRegistry["stats-progress-card"].presets (= statsSmallCardPresets)
    presets: { /* fill from source */ },
    
    schemaVersion: "v1"
  },
  
  // ============== EXAMPLE 5: EXTRA_ELEMENTS_SCHEMA migration ==============
  // Pattern for: success-* (5), candidates-* (5)
  // From PropertyPanel.js EXTRA_ELEMENTS_SCHEMA — no presets, only defaults
  "success-title": {
    id: "success-title",
    typeId: "text-title",
    name: "หัวข้อสำเร็จ",
    pages: ["success"],
    section: "successMessage",
    boundTo: null,
    isStateful: false,
    stateResolverKey: null,
    states: null,
    propertyFields: TEXT_FIELDS,
    
    // COPY VERBATIM from PropertyPanel.js EXTRA_ELEMENTS_SCHEMA["success-title"].defaultConfig
    defaultConfig: { /* fill from source */ },
    
    presets: null,  // EXTRA elements have no presets
    schemaVersion: "v1"
  },
  
  // ==========================================================================
  // ABOVE: 5 examples (1 per category pattern)
  // BELOW: Add ALL remaining 27 instances following the same patterns.
  // 
  // Pattern reference for each remaining instance:
  // 
  // STATIC TEXT/BUTTON/CARD (use Example 1 pattern — presets from elementRegistry):
  //   "hero-subtitle"        — pages:["home"], section:"hero", boundTo:"campaignTitle"
  //   "hero-subtitle2"       — pages:["home"], section:"hero", boundTo:"organizationName"
  //   "hero-year-badge"      — pages:["home"], section:"hero", boundTo:"academicYearTh"
  //   "hero-status-badge"    — pages:["home"], section:"hero", typeId:"toggle-visibility", fields:TOGGLE_FIELDS
  //   "stats-header"         — pages:["home"], section:"stats", typeId:"text-label"
  //   "stats-voted-card"     — pages:["home"], section:"stats", typeId:"card-primary"
  //   "stats-eligible-card"  — pages:["home"], section:"stats", typeId:"card-secondary" (same presets as progress-card)
  //   "meet-section"         — pages:["home"], section:"meetCandidates", typeId:"card-meet"
  //   "meet-title"           — pages:["home"], section:"meetCandidates", typeId:"text-title"
  //   "meet-cta"             — pages:["home"], section:"meetCandidates", typeId:"button-primary", fields:BUTTON_FIELDS
  //   "banner-section"       — pages:["home"], section:"electionBanner", typeId:"image-banner", fields:IMAGE_FIELDS
  // 
  // VOTE PAGE STATIC (apply section normalization!):
  //   "vote-header-badge"    — pages:["vote"], section:"header" (normalized from "voteHeader"), typeId:"text-label"
  //   "vote-header-title"    — pages:["vote"], section:"header", typeId:"text-title"
  //   "vote-header-subtitle" — pages:["vote"], section:"header", typeId:"text-subtitle"
  //   "vote-party-card"      — pages:["vote"], section:"partyGrid" (normalized from "voteBody"), typeId:"card-party-vote"
  //   "vote-abstain-button"  — pages:["vote"], section:"abstainButton" (normalized from "voteBody"), typeId:"button-secondary", fields:BUTTON_FIELDS
  //   "vote-disapprove-button" — pages:["vote"], section:"abstainButton" (bundled, per diagnosis Section 8), typeId:"button-secondary", fields:BUTTON_FIELDS
  // 
  // STATEFUL (use Example 2 pattern — no presets, has states):
  //   "voteCTA-button"       — pages:["home"], section:"voteCTA", typeId:"button-stateful", 
  //                            states from statefulRegistry: login, notVoted, voted, ended, closed, paused
  // 
  // CANDIDATES PAGE (use Example 5 pattern — from EXTRA_ELEMENTS_SCHEMA):
  //   "candidates-tagline"    — pages:["candidates"], section:"header", typeId:"button-badge", fields:BUTTON_FIELDS
  //   "candidates-title"      — pages:["candidates"], section:"header", typeId:"text-title"
  //   "candidates-subtitle"   — pages:["candidates"], section:"header", typeId:"text-subtitle"
  //   "candidates-counter"    — pages:["candidates"], section:"header", typeId:"button-badge", fields:BUTTON_FIELDS
  //   "candidates-party-card" — pages:["candidates"], section:"partyCardGrid", typeId:"card-party-info"
  // 
  // SUCCESS PAGE (use Example 5 pattern — from EXTRA_ELEMENTS_SCHEMA):
  //   "success-subtitle1"  — pages:["success"], section:"successMessage", typeId:"text-subtitle"
  //   "success-subtitle2"  — pages:["success"], section:"successMessage", typeId:"text-subtitle"
  //   "success-form-btn"   — pages:["success"], section:"googleFormLink" (normalized from "googleForm"), typeId:"button-primary", fields:BUTTON_FIELDS
  //   "success-footer"     — pages:["success"], section:"successMessage", typeId:"text-body"
  // 
  // Total: 5 examples + 27 more = 32 instances
  // ==========================================================================
};
```

**MIGRATION INSTRUCTIONS — Critical Workflow:**

For each of the 27 remaining instances:

1. **Find ID in source file**:
   - 21 entries: open `elementRegistry.js`, find by ID
   - 2 stateful: open `statefulRegistry.js`, find by ID  
   - 10 entries: open `PropertyPanel.js`, find in EXTRA_ELEMENTS_SCHEMA
   - Special: `vote-divider-text` already provided in Example 3

2. **Copy values VERBATIM**:
   - From elementRegistry: copy `presets` object (all 4 keys: classic/dark/playful/minimal) → `instance.presets`
   - From elementRegistry: copy `presets.classic` values → `instance.defaultConfig` (use classic as baseline default)
   - From statefulRegistry: copy `defaultConfig` object (per-state shape) → `instance.defaultConfig`
   - From EXTRA_ELEMENTS_SCHEMA: copy `defaultConfig` → `instance.defaultConfig`, set `presets: null`

3. **Apply section normalizations** as marked in comments above.

4. **DO NOT use placeholder comments in final code** — every `defaultConfig` 
   and `presets` field must contain real values.

5. **Verify counts** after writing:
   ```
   grep -c "^  \"" elementInstances.js   # should be 32
   grep -c "isStateful: true" elementInstances.js   # should be 2
   ```

---

## PART 3: Create elementCatalog.js

### File: `src/components/admin/editor/elementCatalog.js`

```javascript
/**
 * elementCatalog.js — Public API for type-instance system.
 * 
 * Combines elementTypes + elementInstances into unified accessor.
 * Provides backward-compat helpers matching prior elementRegistry / 
 * statefulRegistry APIs.
 * 
 * Schema version: v1
 */

import { ELEMENT_TYPES, getType, getTypesByCategory } from './elementTypes';
import { ELEMENT_INSTANCES } from './elementInstances';
import { PAGE_REGISTRY } from '../../../utils/pageRegistry';  // for cross-reference validation

export { ELEMENT_TYPES, ELEMENT_INSTANCES };
export { getType, getTypesByCategory };

// Preserve legacy exports
export const PRESET_NAMES = {
  classic: { name: "คลาสสิก", color: "#8A2680" },
  dark:    { name: "Modern Dark", color: "#1E293B" },
  playful: { name: "สนุกสนาน", color: "#EC4899" },
  minimal: { name: "มินิมอล", color: "#64748B" }
};

export const GLOBAL_STATE_DIMENSIONS = {
  electionPhase: ['before', 'running', 'paused', 'manualEnded', 'nextYear'],
  systemMode: ['OPEN', 'PAUSED', 'CLOSED', 'WAITING'],
  userAuth: ['unauth', 'auth'],
  userVoteStatus: ['notVoted', 'voted'],
  resultReveal: ['hidden', 'revealed']
};

// ==================== PRIMARY API ====================

/**
 * Get merged element shape (type metadata + instance fields).
 * Backward-compatible with prior getElement / getStatefulElement APIs.
 */
export function getElement(instanceId) {
  const inst = ELEMENT_INSTANCES[instanceId];
  if (!inst) return null;
  const type = ELEMENT_TYPES[inst.typeId];
  if (!type) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[elementCatalog] Type "${inst.typeId}" not found for instance "${instanceId}"`);
    }
    return null;
  }
  
  return {
    // Identity
    id: inst.id,
    name: inst.name || type.name,
    description: type.description,
    
    // Categorization (Component Library)
    category: type.category,
    typeId: inst.typeId,
    componentLibrary: type.componentLibrary,
    
    // Placement
    pages: inst.pages,
    section: inst.section,
    
    // Legacy compat: PropertyPanel switch key (from type, not derived in catalog)
    type: type.controlType,
    
    // Behavior
    boundTo: inst.boundTo,
    isStateful: inst.isStateful,
    stateResolverKey: inst.stateResolverKey,
    states: inst.states,
    
    // Schema
    propertyFields: inst.propertyFields,
    
    // Defaults & overrides
    defaultConfig: inst.defaultConfig,
    presets: inst.presets,
    
    // Layout (forward-compat)
    layout: type.layout,
    
    schemaVersion: inst.schemaVersion
  };
}

// ==================== QUERIES ====================

export function getInstancesByPage(pageId) {
  return Object.values(ELEMENT_INSTANCES).filter(i => i.pages?.includes(pageId));
}

export function getInstancesByType(typeId) {
  return Object.values(ELEMENT_INSTANCES).filter(i => i.typeId === typeId);
}

export function getInstancesBySection(pageId, sectionId) {
  return Object.values(ELEMENT_INSTANCES).filter(
    i => i.pages?.includes(pageId) && i.section === sectionId
  );
}

export function getInstancesByCategory(category) {
  const typesInCategory = Object.values(ELEMENT_TYPES)
    .filter(t => t.category === category)
    .map(t => t.id);
  return Object.values(ELEMENT_INSTANCES)
    .filter(i => typesInCategory.includes(i.typeId));
}

// ==================== LEGACY COMPAT ====================

export function getBinding(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.boundTo || null;
}

export function isBoundElement(instanceId) {
  return !!getBinding(instanceId);
}

export function isStatefulElement(instanceId) {
  return !!ELEMENT_INSTANCES[instanceId]?.isStateful;
}

export function getStatesOf(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.states || [];
}

export function getDefaultStateConfig(instanceId, stateId) {
  const inst = ELEMENT_INSTANCES[instanceId];
  if (!inst?.isStateful) return {};
  return inst.defaultConfig?.[stateId] || {};
}

export function getDefaultConfig(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.defaultConfig || {};
}

export function getElementPresets(instanceId) {
  return ELEMENT_INSTANCES[instanceId]?.presets || {};
}

export function getPresetDefaults(presetId) {
  const result = {};
  for (const [id, inst] of Object.entries(ELEMENT_INSTANCES)) {
    if (inst.presets && inst.presets[presetId]) {
      const type = ELEMENT_TYPES[inst.typeId];
      result[id] = {
        type: type?.controlType || 'unknown',
        label: inst.name || type?.name || id,
        section: inst.section,
        config: inst.presets[presetId]
      };
    }
  }
  return result;
}

export function getStatefulElement(instanceId) {
  const inst = ELEMENT_INSTANCES[instanceId];
  if (!inst?.isStateful) return null;
  return getElement(instanceId);
}

// ==================== VALIDATION ====================

/**
 * Validates catalog structure. Runs in dev mode on import.
 * Catches schema breaks before runtime issues.
 */
export function validateCatalog() {
  const errors = [];
  const warnings = [];
  
  // ----- Instance integrity -----
  for (const [id, inst] of Object.entries(ELEMENT_INSTANCES)) {
    if (inst.id !== id) {
      errors.push(`Instance "${id}": id field mismatch (got "${inst.id}")`);
    }
    if (!inst.typeId) {
      errors.push(`Instance "${id}": missing typeId`);
      continue;
    }
    if (!ELEMENT_TYPES[inst.typeId]) {
      errors.push(`Instance "${id}": typeId "${inst.typeId}" not in ELEMENT_TYPES`);
    }
    if (!inst.pages || !Array.isArray(inst.pages) || inst.pages.length === 0) {
      errors.push(`Instance "${id}": pages[] required and non-empty`);
    }
    if (!inst.section) {
      errors.push(`Instance "${id}": section required`);
    }
    if (!inst.propertyFields || !Array.isArray(inst.propertyFields)) {
      errors.push(`Instance "${id}": propertyFields[] required`);
    }
    
    // ----- Stateful-specific checks -----
    if (inst.isStateful) {
      if (!inst.states || !Array.isArray(inst.states) || inst.states.length === 0) {
        errors.push(`Stateful "${id}": states[] required`);
      }
      if (!inst.stateResolverKey) {
        errors.push(`Stateful "${id}": stateResolverKey required`);
      }
      if (inst.presets !== null) {
        errors.push(`Stateful "${id}": presets must be null (use templateEngine instead)`);
      }
      
      // Verify defaultConfig has all state keys
      if (inst.states && inst.defaultConfig) {
        const stateIds = inst.states.map(s => s.id);
        const configKeys = Object.keys(inst.defaultConfig);
        const missing = stateIds.filter(id => !configKeys.includes(id));
        if (missing.length) {
          errors.push(`Stateful "${id}": defaultConfig missing state keys: ${missing.join(', ')}`);
        }
      }
    } else {
      // ----- Static element checks -----
      if (inst.presets && typeof inst.presets === 'object') {
        const presetKeys = Object.keys(inst.presets);
        const expected = ['classic', 'dark', 'playful', 'minimal'];
        const missingPresets = expected.filter(k => !presetKeys.includes(k));
        if (missingPresets.length && presetKeys.length > 0) {
          // Only warn if presets exist but incomplete (EXTRA elements have null presets, which is OK)
          warnings.push(`Static "${id}": presets present but missing template keys: ${missingPresets.join(', ')}`);
        }
      }
    }
    
    // ----- Cross-reference with pageRegistry -----
    if (typeof PAGE_REGISTRY !== 'undefined') {
      for (const pageId of (inst.pages || [])) {
        const page = PAGE_REGISTRY[pageId] || PAGE_REGISTRY.find?.(p => p.id === pageId);
        if (!page) {
          warnings.push(`Instance "${id}": page "${pageId}" not in pageRegistry`);
        }
      }
    }
  }
  
  // ----- Count check -----
  const totalInstances = Object.keys(ELEMENT_INSTANCES).length;
  if (totalInstances !== 32) {
    errors.push(`Expected 32 instances, found ${totalInstances}`);
  }
  
  // ----- Type orphan check -----
  const usedTypeIds = new Set(Object.values(ELEMENT_INSTANCES).map(i => i.typeId));
  const definedTypeIds = new Set(Object.keys(ELEMENT_TYPES));
  for (const typeId of definedTypeIds) {
    if (!usedTypeIds.has(typeId)) {
      warnings.push(`Type "${typeId}" defined but no instances use it (orphan)`);
    }
  }
  
  // ----- Report -----
  if (process.env.NODE_ENV !== 'production') {
    if (errors.length) {
      console.error('[elementCatalog] Validation errors:');
      errors.forEach(e => console.error(`  ✗ ${e}`));
    }
    if (warnings.length) {
      console.warn('[elementCatalog] Validation warnings:');
      warnings.forEach(w => console.warn(`  ⚠ ${w}`));
    }
    if (!errors.length && !warnings.length) {
      console.log('[elementCatalog] ✓ Validation passed: 32 instances, 16 types');
    }
  }
  
  return errors.length === 0;
}

// Run validation on import in dev mode
if (process.env.NODE_ENV !== 'production') {
  validateCatalog();
}
```

---

## DO NOT
- Do NOT modify any consumer file (Step 3 will do that)
- Do NOT delete elementRegistry.js or statefulRegistry.js (Step 5)
- Do NOT modify templateEngine.js (Step 3 will fix fallback)
- Do NOT install packages
- Do NOT leave placeholder comments in final code — fill ALL configs
- Do NOT skip vote-divider-text (it MUST be in the catalog)
- Do NOT skip cross-reference validation in elementCatalog

---

## VERIFICATION (Required per P-LOG-003)

### 1. Build passes
```bash
npm run build
```
Must PASS. Catalog created but used by no one yet — should not break anything.

### 2. File existence + counts
```bash
ls -la src/components/admin/editor/elementTypes.js
ls -la src/components/admin/editor/elementInstances.js
ls -la src/components/admin/editor/elementCatalog.js

# Type count: 16
grep -c "^  \"[a-z]" src/components/admin/editor/elementTypes.js
# Expected: 16

# Instance count: 32
grep -c "^  \"[a-z]" src/components/admin/editor/elementInstances.js
# Expected: 32

# vote-divider-text registered (NEW)
grep -n "vote-divider-text" src/components/admin/editor/elementInstances.js
# Expected: at least 2 matches (id key + id field)

# Stateful count: 2
grep -c "isStateful: true" src/components/admin/editor/elementInstances.js
# Expected: 2

# All instances have typeId
grep -c "typeId:" src/components/admin/editor/elementInstances.js
# Expected: 32
```

### 3. Zero placeholders left
```bash
# Comments referring to source migration must be GONE
grep -n "from elementRegistry\|from statefulRegistry\|fill from source" src/components/admin/editor/elementInstances.js
# Expected: ZERO matches

grep -n "/\* fill\|/\* from\|/\* COPY" src/components/admin/editor/elementInstances.js
# Expected: ZERO matches

# defaultConfig and presets must contain real data, not empty
grep -n "defaultConfig: {}" src/components/admin/editor/elementInstances.js
# Expected: ZERO matches

grep -n "presets: {}\|presets: { }" src/components/admin/editor/elementInstances.js
# Expected: ZERO matches (use null for EXTRA elements, not empty object)
```

### 4. Section normalizations applied
```bash
# Old section names should NOT appear (except in comments referencing migration)
grep -nE 'section: "voteHeader"|section: "voteBody"|section: "googleForm"' src/components/admin/editor/elementInstances.js
# Expected: ZERO matches

# New normalized sections must appear
grep -nE 'section: "header"|section: "partyGrid"|section: "abstainButton"|section: "googleFormLink"' src/components/admin/editor/elementInstances.js
# Expected: multiple matches
```

### 5. Cross-reference with sources
```bash
# Each instance from elementRegistry should be present
for id in hero-title hero-subtitle hero-countdown vote-header-title voteCTA-button stats-voted-card; do
  echo -n "Checking $id: "
  grep -c "\"$id\":" src/components/admin/editor/elementInstances.js
done
# Expected: each prints "1"
```

### 6. Validation runs cleanly in dev mode
After build, run dev server:
```bash
npm run dev
```

Browser console should show:
- ✅ `[elementCatalog] ✓ Validation passed: 32 instances, 16 types`
- ❌ NO red "Validation errors:" messages

If errors appear → FIX before reporting Step 2 complete.

---

## REPORT FORMAT (Required per P-LOG-003)

```
Created src/components/admin/editor/elementTypes.js — 16 semantic types 
(text-title, text-subtitle, text-label, text-body, button-primary, button-secondary, 
button-badge, card-primary, card-secondary, card-party-vote, card-party-info, 
card-meet, image-banner, toggle-visibility, countdown-timer, button-stateful) 
with controlType + layout + componentLibrary metadata; helpers getType, 
getTypesByCategory, getAllTypeIds

Created src/components/admin/editor/elementInstances.js — 32 instances migrated 
verbatim:
  - 21 from elementRegistry (with section normalizations applied)
  - 2 stateful (hero-countdown, voteCTA-button) from statefulRegistry  
  - 8 from EXTRA_ELEMENTS_SCHEMA in PropertyPanel (success-* + candidates-*)
  - 1 NEW: vote-divider-text (was unregistered, found in MultiPartyView.js)
  
  Section normalizations applied:
  - voteHeader → header (3 instances)
  - voteBody → partyGrid + abstainButton (vote-disapprove-button bundled with abstain)
  - googleForm → googleFormLink (1 instance)
  
  All defaultConfig + presets verbatim from source files.
  Zero placeholders remain.

Created src/components/admin/editor/elementCatalog.js — public API:
  - Re-exports ELEMENT_TYPES + ELEMENT_INSTANCES + type helpers
  - PRESET_NAMES + GLOBAL_STATE_DIMENSIONS preserved
  - Primary API: getElement(id) returns merged shape via type.controlType (no inline derivation)
  - Queries: getInstancesByPage/Type/Section/Category
  - Legacy compat: 9 helper functions match prior API
  - validateCatalog() runs on import in dev mode with:
    * Required field checks
    * Stateful state-key completeness check
    * Cross-reference with pageRegistry
    * Type orphan detection
    * Static preset completeness warning

Grep verifications (PROOF):
[paste actual output for ALL verification commands in section above]

Build: PASS

Validation console output:
[paste actual console output, e.g., "[elementCatalog] ✓ Validation passed: 32 instances, 16 types"]
```

No other commentary.

---

## NEXT STEP

After Step 2 verification passes, **Step 3 (H-CATALOG-WIRE)** will:
- Update 7 consumer files to import from elementCatalog
- Delete EXTRA_ELEMENTS_SCHEMA from PropertyPanel
- Fix resolveStatefulConfig fallback gap
- Atomic commit — all 7 files in one go

Use a fresh session for Step 3 per session-awareness recommendation 
(high-stakes atomic refactor needs max freshness).