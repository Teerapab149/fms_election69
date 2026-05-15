# LIVE_STEP_H_CATALOG_WIRE.md — Step 3/5: Wire Consumers to elementCatalog

## READ FIRST (Mandatory)

Read in order:
1. `CLAUDE.md` — Engineering Discipline section
2. `DECISIONS.md` — P-LOG-001 through P-LOG-008 (latest pitfalls from Phase 2)
3. `MASTER_PLAN.md`
4. `PROGRESS.md` (if exists)
5. `PHASE2_ARCHITECTURE.md` — design rationale
6. `PHASE2_REMAINING_ROADMAP.md` — context for this step
7. **THIS FILE** — execution spec

## CONTEXT — STEP 3 OF 5

Step 1 ✅ (PREP — static imports) + Step 2 ✅ (CORE — catalog created) complete.

**This step has 4 sub-tasks (all atomic, single session):**

```
3.0 Pre-flight: Backup branch + baseline build
3.1 Mini-fix: Stateful elements presets → null (per Path A decision)
3.2 Register results-* orphans (4 elements found by Claude Code in Step 2)
3.3 Wire 7 consumer files to elementCatalog (atomic)
3.4 Fix templateEngine fallback gap
3.5 Verification (build + grep + manual smoke test)
```

**Risk level: 🔴 HIGH** — atomic refactor across 7 files. Half-finished state 
= broken system. DO NOT pause mid-step.

**Time estimate: 60-90 min**

**Token estimate: 35-45% of fresh session**

---

## CRITICAL PHILOSOPHY (Per P-LOG Lessons)

### Don't deviate from spec (P-LOG-005 lesson from Step 2)
In Step 2, you kept `presets` on stateful elements when spec said `presets: null`. 
Your reasoning ("it's ignored anyway") was a rationalization. The spec was right.

**Rule:** When spec says X explicitly, do X. If you think spec is wrong, STOP and 
ask the user — don't unilaterally deviate.

### Read source before writing (P-LOG-004)
Before changing any consumer, READ the file fully. Don't assume usage patterns.

### Grep with output, not "verified ✓" (P-LOG-003)
Every verification command MUST paste actual stdout. Empty output = paste empty.

### Verify before modifying (P-LOG-001)
Before adding/removing imports, grep ALL usages of those symbols. Don't assume.

---

## SCOPE

### Files to modify
1. `src/components/admin/editor/elementInstances.js` (mini-fix + add results-*)
2. `src/components/HomeContent.js`
3. `src/components/admin/PageDesignTab.js`
4. `src/components/admin/PropertyPanel.js` (also DELETE EXTRA_ELEMENTS_SCHEMA)
5. `src/components/admin/QuickStyleBar.js`
6. `src/components/admin/editor/StatefulGallery.js`
7. `src/components/admin/editor/stateResolver.js`
8. `src/components/admin/editor/templateEngine.js` (imports + FIX FALLBACK)

### Files to NOT modify
- elementRegistry.js (Step 5 deletes)
- statefulRegistry.js (Step 5 deletes)
- elementCatalog.js, elementTypes.js (created in Step 2, leave alone)
- Any production page (home, vote, candidates, etc.)
- Any *EditorPreview.js (except reading them for results-* IDs)

### Things to NOT do
- Do NOT delete elementRegistry.js or statefulRegistry.js (Step 5)
- Do NOT install packages
- Do NOT add new exports beyond what spec requires
- Do NOT refactor function bodies beyond import changes
- Do NOT touch Step 1 PREP work

---

## TASK 3.0 — Pre-flight Checks

Run these BEFORE any modification. If any fails, STOP and report.

### 0.1 Create safety branch
```bash
git status
# Confirm working state
git checkout -b phase2-step3-wire
# Or if already on a feature branch, just confirm clean working tree
git stash list
```

### 0.2 Baseline build
```bash
npm run build 2>&1 | tail -10
```
Expected: ✓ Compiled successfully, 29/29 pages.

**If baseline fails → STOP. Don't proceed until baseline passes.**

### 0.3 Verify Step 2 outputs exist
```bash
ls -la src/components/admin/editor/elementCatalog.js
ls -la src/components/admin/editor/elementInstances.js
ls -la src/components/admin/editor/elementTypes.js
```
All 3 must exist.

### 0.4 Read PROGRESS.md state
If PROGRESS.md exists, verify it shows Step 2 complete with caveats noted. 
This confirms we're picking up correct work.

---

## TASK 3.1 — Mini-Fix: Stateful Presets → null

### Context
Step 2 left `presets: {classic:..., dark:..., playful:..., minimal:...}` on 
stateful elements. Spec said `null`. Decision: **Path A (Clean)** — set to null.

### Steps

#### 3.1.1 Find both stateful instances
```bash
grep -n "isStateful: true" src/components/admin/editor/elementInstances.js
```
Expected: 2 matches (hero-countdown, voteCTA-button).

#### 3.1.2 Read each instance fully

Use `view` on `elementInstances.js` and find:
- `"hero-countdown": { ... }` block
- `"voteCTA-button": { ... }` block

Identify the `presets: { ... }` field in each.

#### 3.1.3 Change presets to null

For each stateful instance:
- Find: `presets: { classic: {...}, dark: {...}, playful: {...}, minimal: {...} },`
- Replace with: `presets: null,`

Use `str_replace` with the FULL multi-line `presets: { ... }` block as `old_str` 
to ensure unique match. Do NOT use sed/regex.

#### 3.1.4 Verify
```bash
# Both stateful should now have presets: null
grep -B5 "isStateful: true" src/components/admin/editor/elementInstances.js | grep "presets:"
```
Expected: 2 matches, both `presets: null,`

```bash
# Build still passes
npm run build 2>&1 | tail -5
```
Expected: ✓ Compiled successfully.

---

## TASK 3.2 — Register results-* Orphan Elements

### Context
Claude Code Step 2 report mentioned:
> "results-* (4 orphan Wraps in ResultsEditorPreview.js) — not registered"

These 4 elements are Wrap'd in production but missing from catalog. Same 
pattern as `vote-divider-text` (registered in Step 2). Must add now.

### Steps

#### 3.2.1 Discover the 4 IDs
```bash
grep -oP '<Wrap[[:space:]]+id="[^"]+"' src/components/admin/editor/ResultsEditorPreview.js | sort -u
```
Expected: 4+ unique Wrap IDs. PASTE actual output in report.

Also check what config keys each Wrap uses:
```bash
grep -E 'cfg\("results-[^"]+"\)\.[a-zA-Z]+' src/components/admin/editor/ResultsEditorPreview.js | sort -u
```
This shows which config fields the production code reads (e.g., `text`, `color`, `fontSize`).

#### 3.2.2 Read production source for each

For each results-* ID, view the ResultsEditorPreview.js section using it.
Identify:
- Default text (e.g., `cfg("results-title").text || "ผลการเลือกตั้ง"`)
- Default color (the fallback after `||`)
- Element type semantic (heading vs button vs card)
- Section context (header, stats, cards)

#### 3.2.3 Add instances to elementInstances.js

For each results-* element, append after success-* block following the 
EXTRA_ELEMENTS_SCHEMA pattern (no presets, has defaultConfig):

```javascript
"results-title": {
  id: "results-title",
  typeId: "text-title",  // adjust based on semantic role
  name: "หัวข้อหน้าผล",  // descriptive name in Thai
  pages: ["results"],
  section: "header",  // verify against pageRegistry; use existing section name
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: TEXT_FIELDS,  // or BUTTON_FIELDS, CARD_FIELDS, etc.
  defaultConfig: { 
    /* VERBATIM from production fallback values */
    text: "ผลการเลือกตั้ง", 
    color: "#1a1a2e",
    fontSize: "5xl",
    fontWeight: "900",
    align: "center"
  },
  presets: null,  // no presets — Phase 3 templates will handle
  schemaVersion: "v1"
}
```

**Type mapping guidance** (use your judgment based on production source):
- Text/heading → `text-title`, `text-subtitle`, `text-label`, or `text-body`
- Button → `button-primary`, `button-secondary`, or `button-badge`  
- Card → `card-primary`, `card-secondary`, `card-party-info`
- Image → `image-banner`
- Toggle → `toggle-visibility`

**Section mapping:**
- Check `src/utils/pageRegistry.js` for `results` page sections
- Use existing section name; don't invent new ones unless necessary

#### 3.2.4 Verify
```bash
# Instance count should now be 36 (32 + 4 results-*)
grep -cE '^  "[a-zA-Z][a-zA-Z0-9-]+":' src/components/admin/editor/elementInstances.js
```
Expected: 36

```bash
# All 4 results-* registered
grep -nE '^  "results-' src/components/admin/editor/elementInstances.js
```
Expected: 4 matches, paste IDs in report.

```bash
# Build pass
npm run build 2>&1 | tail -5
```
Expected: ✓ Compiled successfully.

---

## TASK 3.3 — Wire 7 Consumer Files (ATOMIC)

### CRITICAL — Order matters

Update consumers in this order. After EACH file, run `npm run build`. 
If build fails: fix that file before moving to next.

### 3.3.1 templateEngine.js (has Step 1 import — extend it)

#### Current state (from Step 1 PREP):
```javascript
import { getDefaultStateConfig } from './statefulRegistry';
```

#### Target state:
```javascript
import { getDefaultStateConfig } from './elementCatalog';
```

#### Steps:
1. View `templateEngine.js` first 30 lines
2. `str_replace` import statement
3. **NOW FIX THE FALLBACK BUG** — find `resolveStatefulConfig` function (around line 460-475)

#### Current resolveStatefulConfig:
```javascript
export function resolveStatefulConfig(templateId, elementId, stateId, overrides = {}) {
  const template = getTemplate(templateId);
  if (!template) {
    return { ...getDefaultStateConfig(elementId, stateId), ...overrides };
  }
  
  const templateConfig = template.elements?.[elementId]?.[stateId] || {};
  return { ...templateConfig, ...overrides };
}
```

**BUG:** When template EXISTS but lacks the element, returns `{}` silently. 
New stateful elements (registered in catalog but not yet in templates) get 
empty config = visual breakage.

#### Fixed version:
```javascript
export function resolveStatefulConfig(templateId, elementId, stateId, overrides = {}) {
  const template = getTemplate(templateId);
  if (!template) {
    return { ...getDefaultStateConfig(elementId, stateId), ...overrides };
  }
  
  // Template exists — check if it covers this element+state
  const templateConfig = template.elements?.[elementId]?.[stateId];
  if (templateConfig && Object.keys(templateConfig).length > 0) {
    return { ...templateConfig, ...overrides };
  }
  
  // Template doesn't cover this element — fall back to catalog default
  return { ...getDefaultStateConfig(elementId, stateId), ...overrides };
}
```

Use `str_replace` with the FULL function body.

#### Verify:
```bash
grep -A8 "export function resolveStatefulConfig" src/components/admin/editor/templateEngine.js
```
Confirm new logic is in place.

```bash
npm run build 2>&1 | tail -5
```
Expected: PASS.

---

### 3.3.2 stateResolver.js (has Step 1 import — switch source)

#### Current state (from Step 1 PREP):
```javascript
import { STATEFUL_ELEMENTS } from './statefulRegistry';
```

#### Question: Does stateResolver actually USE STATEFUL_ELEMENTS?

Grep first:
```bash
grep -n "STATEFUL_ELEMENTS" src/components/admin/editor/stateResolver.js
```

**Path A — If only used 1-2 times:**
Replace import with catalog helper:
```javascript
import { ELEMENT_INSTANCES } from './elementCatalog';

// Derive STATEFUL_ELEMENTS from catalog on module load
const STATEFUL_ELEMENTS = Object.fromEntries(
  Object.entries(ELEMENT_INSTANCES)
    .filter(([_, inst]) => inst.isStateful)
);
```

**Path B — If used in complex ways:**
Add a `getStatefulElements()` helper to elementCatalog and import that:
```javascript
import { getStatefulElements } from './elementCatalog';
const STATEFUL_ELEMENTS = getStatefulElements();
```

**Either way:** The end result is `STATEFUL_ELEMENTS` variable available with 
same shape as before (object keyed by ID with stateful instances).

#### If you need to add `getStatefulElements` to elementCatalog.js:
```javascript
// Add to elementCatalog.js after existing helpers
export function getStatefulElements() {
  const result = {};
  for (const [id, inst] of Object.entries(ELEMENT_INSTANCES)) {
    if (inst.isStateful) {
      result[id] = inst;
    }
  }
  return result;
}
```

#### Verify:
```bash
grep -n "STATEFUL_ELEMENTS\|statefulRegistry" src/components/admin/editor/stateResolver.js
```
Confirm no more `statefulRegistry` references, STATEFUL_ELEMENTS still defined.

```bash
npm run build 2>&1 | tail -5
```

---

### 3.3.3 PropertyPanel.js (CRITICAL — DELETE EXTRA_ELEMENTS_SCHEMA)

#### Current imports:
```javascript
import { isStatefulElement } from "./statefulRegistry";
import { getBinding } from "./elementRegistry";
```

#### Target:
```javascript
import { isStatefulElement, getBinding } from "./editor/elementCatalog";
```

Note: PropertyPanel.js is in `src/components/admin/`, so path is `./editor/elementCatalog`.
Verify by checking current import paths in the file.

#### CRITICAL — Find and DELETE EXTRA_ELEMENTS_SCHEMA

```bash
grep -n "EXTRA_ELEMENTS_SCHEMA" src/components/admin/PropertyPanel.js
```

This constant is a large object literal (~80-120 lines). It's the legacy 
fallback for elements not in elementRegistry. After Step 2, all elements 
should be in elementCatalog → EXTRA_ELEMENTS_SCHEMA is redundant.

**Steps:**
1. `view` PropertyPanel.js around the lines where EXTRA_ELEMENTS_SCHEMA is defined
2. Identify the full block (from `const EXTRA_ELEMENTS_SCHEMA = {` to closing `};`)
3. `str_replace` with empty string (delete entire block)
4. Find usages of EXTRA_ELEMENTS_SCHEMA in the file:
   ```bash
   grep -n "EXTRA_ELEMENTS_SCHEMA" src/components/admin/PropertyPanel.js
   ```
   Expected after delete: 0 matches.
5. If usages remain (e.g., `EXTRA_ELEMENTS_SCHEMA[selectedElement]`), replace them:
   ```javascript
   // OLD:
   const element = elementConfigs[selectedElement] || EXTRA_ELEMENTS_SCHEMA[selectedElement];
   
   // NEW:
   const element = elementConfigs[selectedElement] || getElement(selectedElement);
   ```
   
   Make sure to import `getElement` from elementCatalog if you use this approach.

#### Sub-verify after each change:
```bash
grep -n "EXTRA_ELEMENTS_SCHEMA" src/components/admin/PropertyPanel.js
# Expected: 0

npm run build 2>&1 | tail -5
# Expected: PASS
```

**IF BUILD FAILS:** PropertyPanel uses EXTRA_ELEMENTS_SCHEMA in render logic. 
Add `import { getElement } from './editor/elementCatalog';` and adapt the render 
logic to use `getElement(id)` instead.

---

### 3.3.4 QuickStyleBar.js

#### Current:
```javascript
import { ELEMENT_PRESETS, PRESET_NAMES } from "./elementRegistry";
```

#### Investigate first:
```bash
grep -n "ELEMENT_PRESETS\|PRESET_NAMES" src/components/admin/QuickStyleBar.js
```

#### Likely target:
```javascript
import { PRESET_NAMES, getPresetDefaults } from "./editor/elementCatalog";
```

(elementCatalog exports PRESET_NAMES but ELEMENT_PRESETS may not exist — 
use `getPresetDefaults(presetId)` to get the same data.)

#### Adapt usages:
If code uses `ELEMENT_PRESETS.classic.elements`, change to `getPresetDefaults('classic')`.

#### Verify:
```bash
grep -n "elementRegistry" src/components/admin/QuickStyleBar.js
# Expected: 0

npm run build 2>&1 | tail -5
```

---

### 3.3.5 StatefulGallery.js

#### Current:
```javascript
import { getStatefulElement } from './statefulRegistry';
import { listTemplates, resolveStatefulConfig } from './templateEngine';
```

#### Target:
```javascript
import { getStatefulElement } from './elementCatalog';
import { listTemplates, resolveStatefulConfig } from './templateEngine';
```

(Keep templateEngine import — only change the registry source.)

#### Verify:
```bash
grep -n "statefulRegistry" src/components/admin/editor/StatefulGallery.js
# Expected: 0

npm run build 2>&1 | tail -5
```

---

### 3.3.6 HomeContent.js

#### Current:
```javascript
import { resolveElementState, buildRuntimeContext } from './admin/editor/stateResolver';
import { resolveStatefulConfig } from './admin/editor/templateEngine';
import { getBinding, isBoundElement } from './admin/editor/elementRegistry';
```

#### Target:
```javascript
import { resolveElementState, buildRuntimeContext } from './admin/editor/stateResolver';
import { resolveStatefulConfig } from './admin/editor/templateEngine';
import { getBinding, isBoundElement } from './admin/editor/elementCatalog';
```

(Only change the 3rd import line.)

#### Verify:
```bash
grep -n "elementRegistry\|statefulRegistry" src/components/HomeContent.js
# Expected: 0

npm run build 2>&1 | tail -5
```

---

### 3.3.7 PageDesignTab.js

#### Current:
```javascript
import { getPresetDefaults, getElementPresets } from './editor/elementRegistry';
```

#### Target:
```javascript
import { getPresetDefaults, getElementPresets } from './editor/elementCatalog';
```

(One-line change.)

#### Verify:
```bash
grep -n "elementRegistry\|statefulRegistry" src/components/admin/PageDesignTab.js
# Expected: 0

npm run build 2>&1 | tail -5
```

---

## TASK 3.4 — Final Verifications (P-LOG-003 Compliance)

### 4.1 No more references to old registries from consumers
```bash
grep -rn "from ['\"].*elementRegistry['\"]" src/components/ --include="*.js" --include="*.jsx"
# Expected: 0

grep -rn "from ['\"].*statefulRegistry['\"]" src/components/ --include="*.js" --include="*.jsx"
# Expected: 0
```
**PASTE ACTUAL OUTPUT in report (even if empty).**

### 4.2 elementCatalog is now imported by 7+ files
```bash
grep -rln "from ['\"].*elementCatalog['\"]" src/components/ --include="*.js" --include="*.jsx"
```
**Expected: 7+ files. PASTE the list.**

### 4.3 EXTRA_ELEMENTS_SCHEMA completely deleted
```bash
grep -rn "EXTRA_ELEMENTS_SCHEMA" src/components/ --include="*.js"
# Expected: 0
```

### 4.4 Build pass
```bash
npm run build 2>&1 | tail -15
```
**Expected: ✓ Compiled successfully + 29/29 pages.**

### 4.5 Catalog validation runs (NEW — implicit via consumer imports)

Run dev mode:
```bash
npm run dev
```

Then open browser DevTools console and look for:
```
[elementCatalog] ✓ Validation passed: 36 instances, 16 types
```

**If you see:**
- ✅ "Validation passed" → 
- ⚠️ Warnings (yellow) → document but OK to continue
- ❌ Red errors → STOP, fix, re-run

**Take screenshot of console** or copy console text into report.

### 4.6 Manual smoke tests (user assists)

Ask user to verify:

1. **Admin → ออกแบบหน้าเว็บ → "หน้าหลัก"** — loads, no errors
2. **Click hero-title** — PropertyPanel shows with text/color/size fields
3. **Click hero-countdown** — StatefulGallery opens with 5 states
4. **Click voteCTA-button** — StatefulGallery opens with 6 states
5. **Apply Modern Dark template** — countdown styling changes
6. **Switch to "หน้าผู้สมัคร" tab** — loads
7. **Click candidates-title** — PropertyPanel shows (was using EXTRA_SCHEMA before)
8. **Switch to "หน้าผลคะแนน" tab** — loads
9. **Click results-title** (newly registered) — PropertyPanel shows
10. **Navigate to /home in production** — page renders normally
11. **Navigate to /vote in production** — page renders normally

If ANY fail → report what failed + stack trace, do NOT proceed to Step 5.

---

## TASK 3.5 — Git Status Check

```bash
git status
```

Expected modified files:
- `src/components/HomeContent.js`
- `src/components/admin/PageDesignTab.js`
- `src/components/admin/PropertyPanel.js`
- `src/components/admin/QuickStyleBar.js`
- `src/components/admin/editor/StatefulGallery.js`
- `src/components/admin/editor/stateResolver.js` (was modified in Step 1, may have more changes now)
- `src/components/admin/editor/templateEngine.js` (was modified in Step 1)
- `src/components/admin/editor/elementInstances.js` (from 3.1 + 3.2)

Untracked (from Step 2):
- elementCatalog.js, elementTypes.js (already there)

```bash
git diff --stat
```
**PASTE output in report.**

---

## REPORT FORMAT (Required per P-LOG-003)

```
=== STEP 3: H-CATALOG-WIRE — COMPLETION REPORT ===

3.0 Pre-flight: ✅
- Branch: phase2-step3-wire (or current)
- Baseline build: PASS, 29/29 pages
- Step 2 files verified present

3.1 Stateful presets cleanup: ✅
Modified elementInstances.js — set hero-countdown.presets = null, 
voteCTA-button.presets = null

Verification:
[paste grep output showing both presets: null]

3.2 results-* orphan registration: ✅
Discovered IDs (from grep): [list 4 IDs]
Added to elementInstances.js: [list 4 instance keys]
Type assignments: [e.g., "results-title → text-title"]
Total instance count: 32 → 36

Verification:
[paste grep showing 36 instances + 4 results-* entries]

3.3 Consumer wiring: ✅
[for each of 7 files, list: old import → new import]
File 1: templateEngine.js
  - import { getDefaultStateConfig } from './statefulRegistry' 
    → from './elementCatalog'
  - resolveStatefulConfig fallback bug FIXED
File 2: stateResolver.js
  - [...]
[... continue for all 7]

3.4 EXTRA_ELEMENTS_SCHEMA deletion: ✅
Deleted from PropertyPanel.js (was ~80 lines)
Updated usages to use getElement() from catalog: [number of usages]

3.5 Final verifications (per P-LOG-003):

=== No old registry imports ===
$ grep -rn "from ['\"].*elementRegistry['\"]" src/components/ --include="*.js"
[actual output]

$ grep -rn "from ['\"].*statefulRegistry['\"]" src/components/ --include="*.js"  
[actual output]

=== elementCatalog imports ===
$ grep -rln "from ['\"].*elementCatalog['\"]" src/components/
[actual list of files]

=== EXTRA_ELEMENTS_SCHEMA gone ===
$ grep -rn "EXTRA_ELEMENTS_SCHEMA" src/components/
[empty or actual output]

=== Build ===
$ npm run build 2>&1 | tail -10
[actual output]

=== Dev validation (browser console) ===
[paste console text or describe what you saw]

=== Git diff ===
$ git diff --stat
[actual output]

3.6 Manual smoke tests:
[USER TO VERIFY — list checkboxes with status]
- [ ] Admin home tab loads
- [ ] hero-title click → PropertyPanel
- [ ] hero-countdown click → StatefulGallery (5 states)
- [ ] voteCTA-button click → StatefulGallery (6 states)
- [ ] Apply Modern Dark → countdown changes
- [ ] Candidates tab loads
- [ ] candidates-title click → PropertyPanel
- [ ] Results tab loads
- [ ] results-* click → PropertyPanel (NEW)
- [ ] /home production renders
- [ ] /vote production renders

=== Status: STEP 3 COMPLETE | PARTIAL | FAILED ===

If FAILED: 
- What failed
- What was rolled back
- Recommended next action
```

No other commentary.

---

## FAILURE HANDLING

### If build fails mid-step
1. STOP modifications immediately
2. Run `git diff` to see what changed in current file
3. Either fix the issue OR revert just that file:
   ```bash
   git checkout src/components/[failing-file]
   ```
4. If multiple files broken: revert all and start fresh:
   ```bash
   git reset --hard HEAD
   ```
5. Report what happened, don't continue

### If validation errors appear in dev console
1. Note the specific error message
2. Check if it's a Step 3 issue or pre-existing
3. If Step 3: identify which task caused it, fix
4. If pre-existing: document, continue with caution

### If smoke test fails
1. Identify which interaction failed
2. Open DevTools, capture stack trace
3. Don't try to fix in this session — document and report
4. User decides: rollback or accept and continue

---

## NEXT STEP

After Step 3 verification passes:

**Step 4 (TEMPLATE-EXTEND) → SKIP per roadmap decision**
- Phase 3 will rewrite template system
- Extending current templates = wasted effort

**Step 5 (CLEANUP) → Final cleanup**
- Delete `src/components/admin/editor/elementRegistry.js`
- Delete `src/components/admin/editor/statefulRegistry.js`
- Final grep + build verification
- Phase 2 COMPLETE 🎉

Can be done in same session if Step 3 finished with energy remaining.

---

## CRITICAL DON'TS (RECAP)

❌ Don't deviate from spec — if you think spec is wrong, ASK USER
❌ Don't paraphrase grep output — paste actual stdout
❌ Don't half-finish — atomic refactor must complete
❌ Don't skip pre-flight checks
❌ Don't continue if build fails mid-step
❌ Don't ignore validation warnings — at least document them
❌ Don't add new dependencies
❌ Don't refactor function bodies beyond import changes (unless spec says)
❌ Don't proceed to Step 5 if Step 3 has any failure

---

## End of Step 3 Spec

Read this fully before starting. Re-read DECISIONS.md P-LOG entries. 
Run pre-flight checks. Then execute atomically.

If you complete Step 3 cleanly + have energy: Step 5 follows.
If anything fails: STOP, report, let user decide.
