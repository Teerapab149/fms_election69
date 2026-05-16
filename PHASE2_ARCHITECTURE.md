# PHASE2_ARCHITECTURE.md — Type-Instance System Design

## Status
Final design — informs Phase 2 implementation steps.
Reviewed against DIAGNOSE_PHASE2_START + DIAGNOSE_PHASE2_DEEP.

## Design Principles

1. **No premature unification** — keep instances separate when production 
   renders them differently (e.g., vote-header-title vs candidates-title 
   have hardcoded JSX gradients).

2. **Type-instance split for FUTURE flexibility** — but keep current 1:1 
   mapping (32 instances → 32 type variants OR fewer if zero divergence).

3. **Single config resolution chain** — type → instance → template → user.

4. **Single source for property fields** — instance-level (handles static 
   vs stateful field count differences).

5. **Forward-compat layout/responsive fields** — present but optional in v1.

6. **Backward compat through getElement() helper** — consumer code minimal change.

## File Structure

```
src/components/admin/editor/
├── elementCatalog.js              # NEW — main public API
│   ├── ELEMENT_TYPES (semantic categories — for Component Library filter)
│   ├── ELEMENT_INSTANCES (placement-specific definitions)
│   ├── helpers (getElement, getInstancesByPage, etc.)
│   └── validateCatalog (dev-time integrity check)
│
├── templateEngine.js              # MODIFIED
│   ├── TEMPLATES (extended to cover static elements too)
│   ├── BACKGROUNDS (unchanged)
│   ├── resolveConfig (NEW — unified resolution for static + stateful)
│   ├── resolveStatefulConfig (kept as compat alias)
│   └── fallback chain fixed
│
├── stateResolver.js               # MODIFIED
│   ├── stateResolvers map (unchanged)
│   ├── resolveElementState (uses ELEMENT_CATALOG)
│   ├── buildRuntimeContext (unchanged)
│   └── require() → static import
│
└── elementRegistry.js, statefulRegistry.js  # DELETED
```

## Schema Definition

### ELEMENT_TYPES (semantic categories)

```javascript
export const ELEMENT_TYPES = {
  "text-title": {
    id: "text-title",
    name: "ข้อความหัวเรื่อง",
    description: "Primary heading text — H1-level",
    category: "text",
    
    // Layout constraints (forward-compat)
    layout: {
      minWidth: 200,
      maxWidth: null,
      fluid: true,
      responsive: {
        mobile:  { fontSize: "2xl" },
        tablet:  { fontSize: "4xl" },
        desktop: { fontSize: "5xl" }
      }
    },
    
    // Component Library metadata
    componentLibrary: {
      icon: "Heading1",
      tags: ["heading", "h1", "title", "ข้อความใหญ่"],
      previewable: true
    },
    
    schemaVersion: "v1"
  },
  
  "text-subtitle": { /* similar shape */ },
  "text-label":    { /* badge/label text */ },
  "text-body":     { /* paragraph */ },
  
  "button-primary":   { /* main CTAs */ },
  "button-secondary": { /* alt buttons */ },
  "button-badge":     { /* small badge buttons */ },
  
  "card-primary":   { /* feature card */ },
  "card-secondary": { /* small stat card */ },
  "card-party":     { /* party display */ },
  "card-meet":      { /* meet candidates section */ },
  
  "image-banner":   { /* large promotional image */ },
  
  "toggle-visibility": { /* on/off toggle elements */ },
  
  "countdown-timer":   { /* stateful countdown */ },
};
```

**Why types are sparse (not 1 type per instance):**
- For Component Library (Phase 4): admin filters by category → "Show all 
  text-title" lists 3 instances they can pick from.
- For analytics: count usage of each type across templates.
- Currently 16 types cover 32 instances cleanly.

### ELEMENT_INSTANCES (placement + behavior)

```javascript
export const ELEMENT_INSTANCES = {
  "hero-title": {
    id: "hero-title",
    typeId: "text-title",
    name: "ชื่อหลักของเว็บ",        // instance-specific name
    
    // Placement
    pages: ["home"],
    section: "hero",
    
    // Bidirectional binding
    boundTo: "electionName",
    
    // Stateful (null for static)
    isStateful: false,
    stateResolverKey: null,
    states: null,
    
    // Property fields — flexible per instance
    // (HIGH RISK FINDING from diagnosis: same `type` string can have different fields)
    propertyFields: [
      { key: "text",       control: "text",   label: "ข้อความ" },
      { key: "color",      control: "color",  label: "สี" },
      { key: "fontSize",   control: "select", label: "ขนาด", options: ["sm","base","lg","xl","2xl","3xl","4xl","5xl","6xl"] },
      { key: "fontWeight", control: "select", label: "น้ำหนัก", options: ["normal","medium","semibold","bold","black"] },
      { key: "align",      control: "radio",  label: "จัดวาง", options: ["left","center","right"] }
    ],
    
    // Default config (lowest priority in resolution chain)
    defaultConfig: {
      text: "SAMO 49",
      fontSize: "5xl",
      color: "#1a1a2e",
      fontWeight: "900",
      align: "left"
    },
    
    // Per-template overrides (for static elements)
    presets: {
      classic: { color: "#1a1a2e" },
      dark:    { color: "#ffffff" },
      playful: { color: "#EC4899", align: "center" },
      minimal: { color: "#1E293B", fontSize: "4xl", fontWeight: "700" }
    },
    
    schemaVersion: "v1"
  },
  
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
      { id: "before",      label: "ก่อนเริ่ม",      description: "เวลาก่อนเปิดให้เลือกตั้ง" },
      { id: "running",     label: "กำลังนับ",       description: "นับถอยหลังแบบ realtime" },
      { id: "paused",      label: "หยุดชั่วคราว",   description: "PAUSE สำหรับปรับปรุง" },
      { id: "manualEnded", label: "ปิดด้วยมือ",     description: "ปิดโดย admin" },
      { id: "nextYear",    label: "ปีถัดไป",         description: "หลังจบเลือกตั้งปีนี้" }
    ],
    
    // Stateful: 15+ fields per state (from StatefulEditor diagnosis)
    propertyFields: [
      // Simple tier
      { key: "text",            control: "text",   label: "ข้อความ", tier: "simple" },
      { key: "backgroundType",  control: "radio",  label: "พื้นหลัง", options: ["solid","gradient"], tier: "simple" },
      { key: "backgroundColor", control: "color",  label: "สีพื้นหลัง", tier: "simple" },
      { key: "textColor",       control: "color",  label: "สีข้อความ", tier: "simple" },
      { key: "borderRadius",    control: "select", label: "มน", options: [...], tier: "simple" },
      { key: "fontSize",        control: "select", label: "ขนาด", options: [...], tier: "simple" },
      // Advanced tier
      { key: "borderWidth",     control: "select", label: "เส้นขอบ", tier: "advanced" },
      { key: "shadow",          control: "select", label: "เงา", tier: "advanced" },
      // Expert tier
      { key: "letterSpacing",   control: "input",  label: "ระยะห่างตัวอักษร", tier: "expert" },
      { key: "lineHeight",      control: "input",  label: "Line height", tier: "expert" }
    ],
    
    // Per-state defaults
    defaultConfig: {
      before:      { /* full config */ },
      running:     { /* full config */ },
      paused:      { /* full config */ },
      manualEnded: { /* full config */ },
      nextYear:    { /* full config */ }
    },
    
    // Stateful elements use templateEngine.TEMPLATES not presets
    presets: null,
    
    schemaVersion: "v1"
  },
  
  // ... 30 more instances
};
```

### Resolution Chain (HOW configs resolve at runtime)

```
For static element:
  type.layout.responsive[device]   ← layout-driven defaults (Phase 2.5+)
  → instance.defaultConfig         ← instance baseline
  → instance.presets[templateId]   ← template-specific overrides (legacy presets)
  → template.elements[id]          ← template's element override (NEW path)
  → userOverride (elementConfigs)  ← admin's edits in editor
  
  Final = mergeDeep(...)

For stateful element:
  instance.defaultConfig[stateId]   ← state-specific defaults
  → template.elements[id][stateId]  ← template state override
  → userOverride[stateId]           ← admin's edits per state
  
  Final = mergeDeep(...)
```

### Templates (extended)

```javascript
export const TEMPLATES = {
  classic: {
    id: "classic",
    name: "คลาสสิก",
    description: "...",
    previewColor: "#8A2680",
    defaultBackgroundId: "gradient-purple-light",
    elements: {
      // Static element overrides (NEW — was only stateful before)
      "hero-title": { color: "#1a1a2e" },
      "hero-subtitle": { color: "#374151" },
      // ... all 30 static elements
      
      // Stateful element overrides (existing)
      "voteCTA-button": {
        login:    { backgroundColor: "#8A2680", text: "เข้าสู่ระบบ" },
        notVoted: { backgroundColor: "#10B981", text: "ลงคะแนน" },
        // ... all 6 states
      },
      "hero-countdown": {
        before:      { /* full config */ },
        // ... all 5 states
      }
    }
  },
  
  neon: { /* same shape */ },
  // playful + minimal: TBD — currently only in instance.presets
};
```

**Migration of `instance.presets`:**
- Phase 2: Keep `instance.presets` as fallback. Templates extend gradually.
- Phase 4: Once all 4 templates fully cover all elements, remove `instance.presets`.

This avoids "rewrite everything at once" risk.

## Helper API

```javascript
// PRIMARY — unified element retrieval
export function getElement(instanceId)
  → returns merged shape (type metadata + instance fields)
     {
       id, name, category, section, pages,
       type,           // controlType: text/button/card/...
       boundTo, isStateful, states,
       propertyFields, defaultConfig, presets,
       layout          // from type
     }

// QUERIES
export function getInstancesByPage(pageId)  → array of instances
export function getInstancesByType(typeId)  → array of instances  
export function getInstancesBySection(pageId, sectionId)  → array
export function getInstancesByCategory(category)  → array (for Component Library)

// LEGACY COMPAT (keep these to minimize consumer changes)
export function getBinding(instanceId)        // = element.boundTo
export function isBoundElement(instanceId)    // = !!boundTo
export function isStatefulElement(instanceId) // = !!isStateful
export function getStatesOf(instanceId)       // = states array
export function getDefaultStateConfig(instanceId, stateId)  // = defaultConfig[stateId]
export function getElementPresets(instanceId) // = presets
export function getPresetDefaults(presetId)   // for getPresetDefaults('classic')

// NEW RESOLUTION
export function resolveConfig(instanceId, context)
  → applies full resolution chain
     context = { templateId, stateId, userOverride, deviceMode }
  → returns final config object

// VALIDATION (dev-time)
export function validateCatalog()
  → checks all entries have required fields, no orphans, no duplicates
```

## Migration Path (Risk-Mitigated)

### Step 1: PREP (low risk)
- Convert `require()` to static imports in templateEngine.js + stateResolver.js
- Map import graph to ensure no cycles
- Build verifies, no behavior change

### Step 2: CORE (medium risk)
- Create elementTypes.js with 16 types
- Create elementInstances.js with 32 instances (including vote-divider-text)
- Create elementCatalog.js as public API + helpers
- Add validateCatalog() that runs in dev
- Build verifies (catalog used by zero consumers yet)

### Step 3: WIRE (medium risk — atomic)
- Update 7 consumers to import from elementCatalog
- Delete EXTRA_ELEMENTS_SCHEMA from PropertyPanel
- Add fallback fix in templateEngine
- Build + manual smoke test ALL admin tabs + production pages

### Step 4: TEMPLATE EXTEND (low risk)
- Extend classic + neon templates to cover static elements
- Keep instance.presets as fallback (no removal yet)
- Verify visual consistency

### Step 5: CLEANUP (low risk)
- Delete elementRegistry.js, statefulRegistry.js
- Final grep + build + test pass
- Document Phase 4 cleanup (remove instance.presets when templates complete)

## Risks & Mitigations (from diagnoses)

| Risk | Mitigation |
|------|------------|
| Circular imports (require → import) | Step 1 isolates this before any other change |
| Atomic consumer break (EXTRA_SCHEMA delete) | Step 3 atomic with all 7 consumers |
| vote-divider-text missing from catalog | Listed explicitly in Step 2 |
| GalleryPreview ID whitelist | Document in MASTER_PLAN; H-7b adds branch |
| candidates-title hardcoded gradient JSX | Don't merge with vote-header-title (separate instances) |
| Stateful + static config shape difference | Helper auto-detects via isStateful flag |
| Backward compat for elementOverrides DB key | Keep instance IDs verbatim (Option 1) |
| Templates don't cover static elements | Step 4 extends; keep presets fallback |

## Forward Compatibility (Phase 2.5+)

Schema fields ready but unused in v1:
- `type.layout.responsive` — Phase 2.5 connects to PropertyPanel device-aware preview
- `type.componentLibrary` — Phase 4 H-COMP-LIB filters by tags
- `instance.propertyFields[].tier` — Phase 4 D-102 tiered controls (Simple/Advanced/Expert)
- `template.elements[id]` for static — Phase 2.5 onwards, gradually replace presets

## What NOT to do (per diagnoses)

- ❌ DON'T merge vote-header-title + candidates-title (gradient JSX issue)
- ❌ DON'T rename element IDs (DB key + 24 Wrap sites coupled)
- ❌ DON'T delete instance.presets in Phase 2 (templates don't cover all yet)
- ❌ DON'T add vote-divider-text without registering in catalog
- ❌ DON'T forget to convert require() before catalog ships

## Success Criteria

After all 5 steps:
1. ✅ Build passes
2. ✅ All admin tabs work
3. ✅ All production pages render unchanged
4. ✅ Hero-title binding still syncs
5. ✅ Stateful gallery (countdown, voteCTA) still works  
6. ✅ Template apply still works (classic, dark, playful, minimal)
7. ✅ No console validation errors
8. ✅ Adding a new element = 1 instance entry + optional new type (if pattern is new)
9. ✅ Adding a new page = update pageRegistry + add instances with `pages: [newPage]`
10. ✅ Adding a new template = single template entry + element overrides
