# ELEMENT_EXTENSION_SPEC.md — Adding a New Element

**Purpose:** Spec for Claude Code when user says "เพิ่ม element <X> ให้ admin แก้ได้" 
(e.g. "add a hero button", "add a winner banner", "add demographics chart heading").

**Prerequisite:** H-CATALOG complete (unified elementCatalog.js exists).

---

## 📋 What You'll Do

When user requests new element:

1. Decide if element is **stateful** or **static**
2. Add entry to `elementCatalog.js`
3. Implement element in component code (with `forceState` if stateful)
4. Add element to all existing master templates (or rely on fallback)
5. Wire to PageDesignTab if user-clickable
6. Add demo data if appears in editor preview
7. Verify: admin can click + edit + save + render

---

## 🎯 Step-by-Step Instructions

### Step 1: Determine element type

**Static element:**
- Same visual regardless of runtime context
- Examples: hero-title (text only), banner-section (image)
- Configuration: 1 set of design tokens

**Stateful element:**
- Visual changes based on session/system/user state
- Examples: voteCTA-button (6 states), result-card (3 states)
- Configuration: design tokens per state
- Requires `stateResolverKey` + state detection logic

**Decision criteria:**
- Does element appearance depend on runtime data (session, electionPhase, isVoted)?
  - YES → stateful
  - NO → static
- Does it have multiple visual modes the admin should design separately?
  - YES → stateful
  - NO → static

### Step 2: Categorize the element

Pick one for each field:

```js
type: "button" | "text" | "card" | "image" | "badge" | "chart" | "timer" | "input" | "container"
category: "button" | "text" | "card" | "image" | "badge" | "chart" | "timer" | "navigation" | "form" | "decorative"
pages: ["home", "vote", "results", "candidates", "closed", "login"]  // can appear on these pages
section: "hero" | "voteCTA" | "stats" | "results" | "vote" | "footer" | etc.
```

`type` is the technical kind. `category` is the UX grouping for Component Library.
They can be the same value or different — `type: "card"` + `category: "card"`, but
`type: "button"` + `category: "navigation"` if it's a nav button.

`pages[]` is critical — defines where admin can use this element. Cross-page 
reusable elements have multiple entries (e.g. `["home", "results"]`).

### Step 3: Define states (if stateful)

For each state, decide:
- Trigger condition (logic-locked)
- Whether label is text-editable
- What design tokens vary

Example for "winner-banner" element:
```js
states: [
  { 
    id: "showing", 
    label: "แสดงผู้ชนะ", 
    description: "เมื่อมีผู้ชนะที่ประกาศแล้ว" 
  },
  { 
    id: "tie", 
    label: "เสมอกัน", 
    description: "เมื่อคะแนนเท่ากัน" 
  },
  { 
    id: "noWinner", 
    label: "ไม่มีผู้ชนะ", 
    description: "เมื่อไม่มีผู้ผ่านเกณฑ์" 
  }
]
```

### Step 4: Add to elementCatalog.js

```js
// In elementCatalog.js

"winner-banner": {
  // Identity
  id: "winner-banner",
  name: "ป้ายผู้ชนะ",
  
  // Categorization
  type: "card",
  category: "card",
  pages: ["results"],
  section: "results",
  
  // State system (stateful example)
  isStateful: true,
  stateResolverKey: "winnerBanner",
  states: [/* from Step 3 */],
  
  // Defaults (used as fallback when template doesn't have config for this element)
  defaultConfig: {
    showing: {
      backgroundType: "gradient",
      gradientFrom: "#FBBF24",
      gradientTo: "#F59E0B",
      textColor: "#ffffff",
      // ... full design tokens
    },
    tie: { /* ... */ },
    noWinner: { /* ... */ }
  },
  
  // No static presets (because stateful)
  presets: null
}
```

For static element:
```js
"results-page-tagline": {
  id: "results-page-tagline",
  name: "คำโปรย Results",
  type: "text",
  category: "text",
  pages: ["results"],
  section: "results",
  
  isStateful: false,
  stateResolverKey: null,
  states: null,
  
  defaultConfig: null,
  
  presets: [
    { id: "classic", name: "Classic", config: {/* ... */} },
    { id: "minimal", name: "Minimal", config: {/* ... */} }
  ]
}
```

### Step 5: Add state resolver (if stateful)

Edit `src/components/admin/editor/stateResolver.js`:

```js
STATE_RESOLVERS["winnerBanner"] = (context) => {
  const { hasWinner, isTie, electionPhase } = context;
  if (electionPhase !== "ended") return "noWinner";
  if (isTie) return "tie";
  if (hasWinner) return "showing";
  return "noWinner";
};
```

Update `buildRuntimeContext` if new context fields needed:

```js
return {
  // ...existing
  hasWinner: candidatesWithScore[0]?.score > candidatesWithScore[1]?.score,
  isTie: /* ... */,
};
```

### Step 6: Implement component code

Create or modify the component to:
1. Accept `resolvedConfig` prop
2. Accept `forceState` prop (if stateful)
3. Apply inline styles from resolvedConfig
4. Use real-time logic for production, override with forceState for editor

Example skeleton:
```jsx
function WinnerBanner({ resolvedConfig = null, forceState = null, /* runtime props */ }) {
  // Detect state (or use forceState in editor mode)
  const detectedState = forceState || detectStateFromContext({/* ... */});
  
  // Get config (template defaults + admin overrides applied externally)
  const config = resolvedConfig || /* default fallback */;
  
  // Render with inline styles when config provided
  return (
    <div style={{
      background: buildBg(config),
      color: config.textColor,
      // ...
    }}>
      {config.label || "Default Label"}
    </div>
  );
}
```

### Step 7: Update master templates (or rely on fallback)

**Option A — Add explicit config to every template (recommended for important elements):**

In `templateEngine.js` TEMPLATES.classic.elements + TEMPLATES.neon.elements + every other:

```js
"winner-banner": {
  showing: { /* template-specific */ },
  tie: { /* template-specific */ },
  noWinner: { /* template-specific */ }
}
```

**Option B — Rely on fallback (acceptable for non-critical elements):**

Don't add to templates. `resolveStatefulConfig` will fall back to `defaultConfig` 
from elementCatalog (after H-FALLBACK-FIX). All templates "inherit" the default 
look until explicitly customized.

**Decision criteria:**
- Element appears prominently → Option A
- Element is rare/peripheral → Option B
- User-requested critical element → Option A

### Step 8: Add to gallery preview branch

In `src/components/admin/editor/StatefulGallery.js`:

Find `GalleryPreview` function. Add a new branch:

```jsx
if (elementId === 'winner-banner') {
  return (
    <div className="bg-slate-50 rounded-md p-4">
      <WinnerBanner
        resolvedConfig={resolvedConfig}
        forceState={stateId}
      />
    </div>
  );
}
```

Import `WinnerBanner` at top of StatefulGallery.

### Step 9: Wire into page rendering

If element appears on a page already, add to that page's component or block:

```jsx
// In ResultsEditorPreview.js or similar
<Wrap id="winner-banner">
  <WinnerBanner
    resolvedConfig={winnerBannerResolvedConfig}
    /* runtime props */
  />
</Wrap>
```

In real page (`results/page.js`):
```jsx
<WinnerBanner
  resolvedConfig={winnerBannerResolvedConfig}
  /* runtime props */
/>
```

Both sources resolve config via `resolveStatefulConfig(template, "winner-banner", state, overrides)`.

### Step 10: Add demo data (if needed)

If element appears in editor preview, ensure props can be synthesized from 
existing demo data or add new entries to `editorDummyData.js`.

### Step 11: Verify

1. `npm run build` — PASS
2. Open `/results` (or wherever element lives) → element renders correctly
3. Open admin → click element → StatefulGallery shows
4. Each state card renders real component with frozen demo state
5. Edit a config → preview updates
6. Save → reload → overrides persist
7. Switch templates → element responds (or falls back to default)

### Step 12: Update DECISIONS.md + PROGRESS.md

Document new element:
```
### D-XXX: Element "winner-banner" added (stateful, 3 states)
**Decision:** Added winner banner to results page with showing/tie/noWinner states
**Pages:** results only (single-page initially, can expand later)
**Reason:** [user request rationale]
```

---

## 🚨 Pitfalls to Avoid

1. **Skip catalog entry** — Element exists in component but not registered → admin can't see/edit it.

2. **Forget fallback path** — If element has no `defaultConfig`, gallery preview will be broken when switching to a template that doesn't cover it.

3. **State resolver doesn't account for new fields** — If state depends on data not in `runtimeContext`, resolver returns wrong state silently.

4. **Skip `pages[]`** — Element won't appear in page-specific element lists; Component Library won't categorize it correctly.

5. **Mismatched section name** — Use canonical section IDs (after H-PAGE-NORMALIZE). Don't invent new section names without coordinating pageRegistry.

6. **Hardcoded text** — Use globalConfig where possible (election name, year, etc.). Don't bake "SAMO 49" into element JSX.

7. **Missing `forceState` prop** — Without it, gallery shows component in current real-state only, not all design states.

---

## ✅ Output Format

After implementing, report:

```
Element "winner-banner" added.

Catalog entry:
  Type: card / Category: card / Pages: [results] / Section: results
  Stateful: true / States: 3 / Resolver: winnerBanner

Implementation:
  - Created src/components/WinnerBanner.js
  - Added entry to elementCatalog.js
  - Added STATE_RESOLVERS.winnerBanner in stateResolver.js
  - Added gallery branch in StatefulGallery.js
  - Wired into results/page.js + ResultsEditorPreview.js

Templates:
  - classic: explicit config (Option A)
  - neon: explicit config (Option A)
  - Future templates: fallback to defaultConfig

Build: PASS
Visual test: Element renders in all 3 states; admin can edit; saves persist.

Updated DECISIONS.md (D-XXX) and PROGRESS.md.
```

---

## 🌍 Future-Proofing Notes

- New template added later → can include this element OR rely on its `defaultConfig`
- New page added later → element can be added to its `pages[]` array if reusable
- Element can be removed safely → only need to clean templates that reference it (or let fallback handle absent template config)
- Component Library auto-categorizes based on `category` field — no manual update needed

---

**This spec is callable** — when user says "Claude, add a [name] element to [page] with [states/visual] design", you read this spec + execute steps 1-12 in order.
