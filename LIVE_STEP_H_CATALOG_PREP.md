# LIVE_STEP_H_CATALOG_PREP.md — Step 1/5: Convert require() to Static Imports

## READ FIRST
Read `CLAUDE.md` (with Engineering Discipline section), `DECISIONS.md` 
(P-LOG-001 to P-LOG-004), `MASTER_PLAN.md`, and `PHASE2_ARCHITECTURE.md` 
(if at root). Follow Engineering Discipline rules strictly.

## CONTEXT — STEP 1 OF 5

This is the PREP step for Phase 2 catalog refactor. Per diagnosis, two 
files use dynamic `require()` inside function bodies which creates 
circular-import risk when elementCatalog is introduced. This step 
converts them to static imports BEFORE touching the registry structure.

**Why this step is isolated:**
- Behavior change: zero (same modules, same exports, same call paths)
- Build verification proves the static import resolution works
- After this step, Step 2 can safely create elementCatalog without 
  circular import surprises

**Risk level: LOW** — pure refactor, no logic change.

## SCOPE (DO NOT EXCEED)

Modify exactly 2 files:

1. `src/components/admin/editor/templateEngine.js`
2. `src/components/admin/editor/stateResolver.js`

Do NOT modify:
- elementRegistry.js (still authoritative for now)
- statefulRegistry.js (still authoritative)
- Any consumer files
- Any other file

Do NOT install packages.
Do NOT create new files.
Do NOT delete any files.

---

## PART 1: templateEngine.js

### File: `src/components/admin/editor/templateEngine.js`

### 1.1 Find the dynamic require

Around line 464-465 (inside `resolveStatefulConfig` function), find:

```js
export function resolveStatefulConfig(templateId, elementId, stateId, overrides = {}) {
  const template = getTemplate(templateId);
  if (!template) {
    const { getDefaultStateConfig } = require('./statefulRegistry');
    return { ...getDefaultStateConfig(elementId, stateId), ...overrides };
  }
  
  const templateConfig = template.elements?.[elementId]?.[stateId] || {};
  return { ...templateConfig, ...overrides };
}
```

### 1.2 Add static import at top of file

Find the existing imports section at the top of `templateEngine.js`. Add:

```js
import { getDefaultStateConfig } from './statefulRegistry';
```

Place this WITH the other imports (don't separate it). If there are no 
other imports at the top, add it as the first import.

### 1.3 Remove the dynamic require from inside the function

Replace the function body's require line:

```js
const { getDefaultStateConfig } = require('./statefulRegistry');
```

DELETE this line entirely. The function should now use the top-level 
import directly:

```js
export function resolveStatefulConfig(templateId, elementId, stateId, overrides = {}) {
  const template = getTemplate(templateId);
  if (!template) {
    return { ...getDefaultStateConfig(elementId, stateId), ...overrides };
  }
  
  const templateConfig = template.elements?.[elementId]?.[stateId] || {};
  return { ...templateConfig, ...overrides };
}
```

**CRITICAL — DO NOT touch the fallback gap yet.** 

The `templateConfig = template.elements?.[elementId]?.[stateId] || {};` 
line is the bug fix from Step 2 onwards. Leave it alone in this step. 
The behavior must be IDENTICAL to before this PREP step. The only change 
is import location.

### 1.4 If there are other dynamic requires in the file

Search the file for any other `require(` calls:

```bash
grep -n "require(" src/components/admin/editor/templateEngine.js
```

If any others exist (e.g., for `./elementRegistry` or relative paths), 
convert them the same way:
- Add static import at top
- Remove dynamic require inline

Document each conversion in the report.

If no other requires, skip this sub-step.

---

## PART 2: stateResolver.js

### File: `src/components/admin/editor/stateResolver.js`

### 2.1 Find the dynamic require

Around line 54 (inside a function body — likely `resolveElementState` or 
`buildRuntimeContext`), find:

```js
const { STATEFUL_ELEMENTS } = require('./statefulRegistry');
```

Note the surrounding code so you can preserve the function logic.

### 2.2 Add static import at top of file

Add to the imports section at the top:

```js
import { STATEFUL_ELEMENTS } from './statefulRegistry';
```

### 2.3 Remove the dynamic require from inside the function

Delete the line `const { STATEFUL_ELEMENTS } = require('./statefulRegistry');`.

The function body uses `STATEFUL_ELEMENTS` directly via the top-level import.

### 2.4 If there are other dynamic requires

Same search:

```bash
grep -n "require(" src/components/admin/editor/stateResolver.js
```

Convert all to static imports if any exist.

---

## PART 3: Verify import graph

After both files updated, the import graph should be:

```
templateEngine.js
  imports from: statefulRegistry.js (NEW: static)
  
stateResolver.js  
  imports from: statefulRegistry.js (NEW: static)
  
statefulRegistry.js
  imports from: (none — leaf module)
  
elementRegistry.js
  imports from: (none — leaf module)
```

**Critical check — no circular imports:**

```bash
# templateEngine.js should NOT import from stateResolver.js
grep -n "from './stateResolver'" src/components/admin/editor/templateEngine.js
# Expected: ZERO matches

# stateResolver.js should NOT import from templateEngine.js
grep -n "from './templateEngine'" src/components/admin/editor/stateResolver.js
# Expected: ZERO matches

# statefulRegistry.js should NOT import from anywhere (leaf)
grep -n "^import\|^const.*require" src/components/admin/editor/statefulRegistry.js
# Expected: ZERO or only standalone imports (no editor cross-refs)
```

If any of these fail (circular import detected), STOP and report — DO NOT 
proceed with conversion.

---

## DO NOT
- Do NOT modify any function logic
- Do NOT change the fallback `|| {}` line in resolveStatefulConfig (Step 2 work)
- Do NOT modify any consumer file (HomeContent, PropertyPanel, etc.)
- Do NOT create new files
- Do NOT touch elementRegistry.js or statefulRegistry.js content
- Do NOT install packages
- Do NOT add new exports to either file

---

## VERIFICATION (Required per P-LOG-003)

### 1. Build (most important)

```bash
npm run build
```

**Must PASS exit 0** with same output as before this step.

### 2. Grep verifications — paste actual output

```bash
# No more dynamic requires for ./statefulRegistry
grep -rn "require('./statefulRegistry')" src/components/admin/editor/
# Expected: ZERO matches

grep -rn "require(\"./statefulRegistry\")" src/components/admin/editor/
# Expected: ZERO matches

# Static imports added
grep -n "^import.*statefulRegistry" src/components/admin/editor/templateEngine.js
grep -n "^import.*statefulRegistry" src/components/admin/editor/stateResolver.js
# Expected: 1 match each

# No circular import (templateEngine ↔ stateResolver)
grep -n "from ['\"].*stateResolver['\"]" src/components/admin/editor/templateEngine.js
grep -n "from ['\"].*templateEngine['\"]" src/components/admin/editor/stateResolver.js
# Expected: ZERO matches each

# All tests still pass
npm run build 2>&1 | tail -20
# Expected: ✓ Compiled successfully (or similar success indicator)
```

### 3. Smoke test — admin tabs

After build passes:

1. Run `npm run dev`
2. Open admin → ออกแบบหน้าเว็บ
3. ✅ Click "หน้าหลัก" — preview loads, no console errors
4. ✅ Click hero-countdown element → StatefulGallery opens (uses templateEngine)
5. ✅ Click voteCTA-button element → StatefulGallery opens (uses stateResolver)
6. ✅ Switch templates (apply Modern Dark) → countdown styling changes
7. ✅ Switch back to Classic → countdown reverts

If any of these fail, the static import broke something. Report and 
revert (git checkout) before proceeding.

### 4. Console check

- ✅ No new red errors in browser console
- ✅ No "Cannot find module" errors
- ✅ No webpack warnings about circular dependencies
- ✅ No "Maximum call stack size exceeded" (would indicate circular)

---

## REPORT FORMAT (Required per P-LOG-003)

```
Modified src/components/admin/editor/templateEngine.js — added static `import { getDefaultStateConfig } from './statefulRegistry';` at top; removed inline `const { getDefaultStateConfig } = require('./statefulRegistry');` from resolveStatefulConfig function body; behavior unchanged

Modified src/components/admin/editor/stateResolver.js — added static `import { STATEFUL_ELEMENTS } from './statefulRegistry';` at top; removed inline `const { STATEFUL_ELEMENTS } = require('./statefulRegistry');` from function body; behavior unchanged

Additional require() conversions (if any):
[list any others found, or "none — only the 2 documented above"]

Grep verifications (PROOF):
[paste ALL grep command outputs as shown in VERIFICATION section]

Build: PASS — npm run build exit 0, [N]/[N] pages compiled successfully

Smoke tests:
- Admin home tab loads ✅
- StatefulGallery opens for hero-countdown ✅
- StatefulGallery opens for voteCTA-button ✅
- Template apply (Classic ↔ Modern Dark) works ✅
- No console errors ✅

Import graph confirmed acyclic: templateEngine and stateResolver both 
import from statefulRegistry (leaf module). No reverse imports detected.
```

No other commentary.

---

## NEXT STEP

After this PREP step passes verification, **Step 2 (H-CATALOG-CORE)** 
will create the unified elementCatalog with 32 instances + 16 types. 
The static imports established in this step ensure no circular import 
issues when elementCatalog joins the import graph.
