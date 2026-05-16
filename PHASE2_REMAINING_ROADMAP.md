# PHASE2_REMAINING_ROADMAP.md — What to do after Step 2

## Current Status (2026-05-11 EOD)

```
Phase 2 Progress: 40% (2 of 5 steps complete)

✅ Step 1: H-CATALOG-PREP        DONE (static imports)
✅ Step 2: H-CATALOG-CORE        DONE (catalog created, validation untested)
⏳ Step 2.1: STATEFUL-CLEAN      MINI-FIX (stateful presets → null)
⏳ Step 3: H-CATALOG-WIRE        NEXT (atomic 7-file + register orphans)
⏳ Step 4: H-TEMPLATE-EXTEND     OPTIONAL (may skip)
⏳ Step 5: H-CATALOG-CLEANUP     LAST (delete old registries)

After Phase 2: Phase 3 (Canva-style templates) can begin
```

## Known Issues from Step 2 Execution

### Issue 1: Stateful elements have presets (against spec)
- hero-countdown + voteCTA-button kept `presets` field with 4 keys
- Spec said `presets: null` for stateful
- **Decision: Path A (Clean)** — set to null in Step 2.1
- Reason: presets are ignored in stateful path anyway; cleaner schema

### Issue 2: Untested validation runtime
- elementCatalog.js created but not imported by anyone
- validateCatalog() never ran (no consumer)
- **Verification deferred to Step 3** (validation runs when consumers wire)

### Issue 3: 4 orphan Wraps in ResultsEditorPreview.js
- Claude Code discovered during Step 2
- Same pattern as vote-divider-text (unregistered but Wrap'd)
- **Plan: Register during Step 3** (don't make Step 2.5 separate step)

---

## ⏭️ Step 2.1: STATEFUL-CLEAN (Mini-Fix, 10 min)

### Why this exists
- Bridge between Step 2 (deviation found) and Step 3 (atomic)
- Small enough to do at start of Step 3 session
- Documents decision in code

### What to do
1. Open `src/components/admin/editor/elementInstances.js`
2. Find `"hero-countdown"` instance → change `presets: {...}` → `presets: null`
3. Find `"voteCTA-button"` instance → change `presets: {...}` → `presets: null`
4. Save file
5. Verify with grep:
   ```bash
   grep -A1 "voteCTA-button" src/components/admin/editor/elementInstances.js | grep "presets:"
   grep -A1 "hero-countdown" src/components/admin/editor/elementInstances.js | grep "presets:"
   ```
   Both should show `presets: null`

### Why not delete data entirely
- Templates in templateEngine.TEMPLATES use this data
- Setting `null` signals "use templateEngine instead" 
- Cleaner semantic separation

### Time estimate
~10 min (read, edit, verify, build pass check)

### Risk
LOW — only 2 lines change, no logic impact

---

## ⏭️ Step 3: H-CATALOG-WIRE (Critical Atomic, 60-90 min)

### Risk level
🔴 **HIGH** — atomic 7-file update + delete EXTRA_SCHEMA
- All 7 files must change together
- If one fails → system half-broken
- **Fresh session required** per session-awareness recommendation

### What to do

#### 3.1 Update consumers (7 files)

For each consumer, change imports from old registries → elementCatalog:

```
1. src/components/HomeContent.js
   FROM: import { ... } from './admin/editor/stateResolver';
         import { resolveStatefulConfig } from './admin/editor/templateEngine';
         import { getBinding, isBoundElement } from './admin/editor/elementRegistry';
   TO:   keep stateResolver + templateEngine imports
         import { getBinding, isBoundElement } from './admin/editor/elementCatalog';

2. src/components/admin/PageDesignTab.js
   FROM: import { getPresetDefaults, getElementPresets } from './editor/elementRegistry';
   TO:   import { getPresetDefaults, getElementPresets } from './editor/elementCatalog';

3. src/components/admin/PropertyPanel.js
   FROM: import { isStatefulElement } from "./statefulRegistry";
         import { getBinding } from "./elementRegistry";
   TO:   import { isStatefulElement, getBinding } from "./elementCatalog";
   ALSO: DELETE EXTRA_ELEMENTS_SCHEMA constant (entire block)
   ALSO: Update render logic to use getElement() from catalog instead of EXTRA_SCHEMA fallback

4. src/components/admin/QuickStyleBar.js
   FROM: import { ELEMENT_PRESETS, PRESET_NAMES } from "./elementRegistry";
   TO:   import { PRESET_NAMES } from "./elementCatalog";
   NOTE: ELEMENT_PRESETS may not exist anymore — verify usage and adapt

5. src/components/admin/editor/StatefulGallery.js
   FROM: import { getStatefulElement } from './statefulRegistry';
         import { listTemplates, resolveStatefulConfig } from './templateEngine';
   TO:   import { getStatefulElement } from './elementCatalog';
         (keep templateEngine import)

6. src/components/admin/editor/stateResolver.js
   FROM: import { STATEFUL_ELEMENTS } from './statefulRegistry';
   TO:   keep working — use catalog's getStatefulElement helper OR
         import { ELEMENT_INSTANCES } from './elementCatalog' and filter

7. src/components/admin/editor/templateEngine.js
   FROM: import { getDefaultStateConfig } from './statefulRegistry';
   TO:   import { getDefaultStateConfig } from './elementCatalog';
   ALSO: FIX FALLBACK GAP (see 3.2 below)
```

#### 3.2 Fix fallback gap in templateEngine.js

Around line ~469 (`resolveStatefulConfig`):

```javascript
// BUG: when template lacks element, returns {} silently
const templateConfig = template.elements?.[elementId]?.[stateId] || {};

// FIX: fall back to catalog default config when template missing
const templateConfig = template.elements?.[elementId]?.[stateId] 
                    || getDefaultStateConfig(elementId, stateId) 
                    || {};
```

#### 3.3 Register results-* orphans

Claude Code found 4 unregistered Wraps in ResultsEditorPreview.js.

**Steps:**
1. Open `src/components/admin/editor/ResultsEditorPreview.js`
2. Grep for `<Wrap id="..."`:
   ```bash
   grep -oP '<Wrap id="[^"]+"' src/components/admin/editor/ResultsEditorPreview.js
   ```
3. Get 4 IDs (likely `results-title`, `results-stats-bar`, `results-card`, `results-card-winner` or similar)
4. Add to `elementInstances.js` following the EXTRA_ELEMENTS_SCHEMA pattern:
   ```javascript
   "results-title": {
     id: "results-title",
     typeId: "text-title",
     name: "หัวข้อหน้าผลคะแนน",
     pages: ["results"],
     section: "header",
     boundTo: null,
     isStateful: false,
     stateResolverKey: null,
     states: null,
     propertyFields: TEXT_FIELDS,
     defaultConfig: { /* from production source */ },
     presets: null,
     schemaVersion: "v1"
   }
   ```
5. Update count: 32 → 36 instances

#### 3.4 Verification (per P-LOG-003)

```bash
# 1. No more references to old registries from consumers
grep -rn "from './admin/editor/elementRegistry'\|from './admin/editor/statefulRegistry'" src/components/ --include="*.js"
# Expected: 0 (except elementCatalog.js itself if it imports them — should NOT)

# 2. EXTRA_ELEMENTS_SCHEMA deleted
grep -n "EXTRA_ELEMENTS_SCHEMA" src/components/admin/PropertyPanel.js
# Expected: 0

# 3. Catalog imports
grep -rn "from './admin/editor/elementCatalog'\|from './editor/elementCatalog'" src/components/
# Expected: 7+ matches

# 4. Build pass
npm run build
# Expected: ✓ Compiled successfully + 29/29 pages

# 5. Dev runtime validation
npm run dev
# Expected console: [elementCatalog] ✓ Validation passed: 36 instances, 16 types
# Expected: ZERO red errors

# 6. Manual smoke tests:
# - Admin → ออกแบบหน้าเว็บ → 6 pages load
# - Click hero-title → PropertyPanel shows
# - Click hero-countdown → StatefulGallery opens with 5 states
# - Click voteCTA-button → StatefulGallery opens with 6 states
# - Apply template Modern Dark → countdown styling changes
# - Click candidates-title → PropertyPanel shows (EXTRA path works)
# - Click results-title (newly registered) → PropertyPanel shows
```

### Time estimate
~60-90 min

### Risk mitigation
- DO ALL 7 files in same session (atomic)
- Run build after each file edit (catch issues early)
- If any consumer breaks → revert ALL via git
- DON'T half-finish — either complete or rollback

---

## ⏭️ Step 4: H-TEMPLATE-EXTEND (Optional, ~30 min)

### When to do
- After Step 3 verified
- Same session OK (lower risk)
- OR can be skipped entirely

### Why optional
- Phase 3 (Canva-style templates) will rewrite template system completely
- Extending current templates = waste effort
- BUT: presets fallback still works during transition

### What to do (if doing)

Update `templateEngine.js` TEMPLATES.classic.elements and TEMPLATES.neon.elements 
to cover static elements (currently only covers 2 stateful elements).

For each static element instance in catalog:
```javascript
// In TEMPLATES.classic.elements (add):
"hero-title": { color: "#1a1a2e" },          // matches instance.presets.classic
"hero-subtitle": { color: "#374151" },
// ... etc for all 30 static elements
```

### Decision criteria
- **DO Step 4** if: you want template apply to work fully before Phase 3
- **SKIP Step 4** if: you want to go directly to Phase 3 (recommended)

### Recommendation
**SKIP** — Phase 3 will replace this anyway.

---

## ⏭️ Step 5: H-CATALOG-CLEANUP (Final, ~20 min)

### When to do
- After Step 3 verified + smoke tested
- Can combine with Step 4 if doing both

### What to do

1. **Delete files:**
   ```bash
   rm src/components/admin/editor/elementRegistry.js
   rm src/components/admin/editor/statefulRegistry.js
   ```

2. **Verify no references remain:**
   ```bash
   grep -rn "elementRegistry\|statefulRegistry" src/components/ --include="*.js"
   # Expected: 0 (or only in comments/strings)
   ```

3. **Update CLAUDE.md / DECISIONS.md:**
   - Add D-2XX: "elementCatalog is single source of truth"
   - Document migration completion

4. **Final verification:**
   ```bash
   npm run build
   # Expected: PASS
   
   npm run dev
   # Expected: [elementCatalog] ✓ Validation passed: 36 instances, 16 types
   # Expected: NO red errors
   ```

5. **Full smoke test:**
   - All 6 admin tabs
   - All 7 production pages (home, vote, results, candidates, party, closed, success)
   - Template apply (classic ↔ neon)
   - Element editing (text, color, size)

### Time estimate
~20 min

### Risk
LOW — if Step 3 passed, this is just removing dead code

---

## 🎉 After Phase 2 Complete

### State after Step 5
```
✅ Single source of truth: elementCatalog
✅ Type-instance architecture in place
✅ 36 instances + 16 types registered
✅ Section normalizations applied
✅ Cross-reference validation with pageRegistry
✅ Fallback gap fixed
✅ Old registries deleted
✅ All consumers using catalog
✅ vote-divider-text + results-* registered
```

### Document update tasks
1. Mark Phase 2 COMPLETE in MASTER_PLAN.md
2. Update DECISIONS.md with Phase 2 lessons (P-LOG-005 onwards)
3. Add catalog API documentation snippet
4. Demo to พี่อนุวัฒน์

### Next phase: Phase 3 Decision Point

```
After Phase 2 done, choose:

Path A: Phase 3 — Canva-Style Templates
  - Follow PHASE3_TEMPLATE_VISION.md
  - ~10-12 hours focused work
  - Major UX upgrade

Path B: UX Polish + Bug Fix
  - Fix "neon template button not clickable" issue
  - Performance optimization
  - Production hardening
  - ~3-5 hours

Path C: Phase 4 — Party Page Editor
  - /party?id=N editor (8+ sections)
  - Phase 4 also has Component Library + Image Library
  - ~15-20 hours

Recommendation order: Path B → Path A → Path C
- Stabilize first
- Then big UX feature (templates)
- Then expand coverage (party)
```

---

## 📅 Estimated Timeline

```
Session 1 (next, fresh): Step 2.1 + Step 3 WIRE
  Time: ~90 min
  Token: ~35-40%
  Risk: HIGH (atomic refactor)
  
Session 2: Step 5 CLEANUP + Phase 2 close-out
  Time: ~30 min
  Token: ~15-20%
  Risk: LOW
  
Session 3: Path B bug fix OR Phase 3 start
  Time: depends on path
  Token: 40-60%

Total: 2-3 sessions to complete Phase 2 + start next work
```

---

## 🛡️ Risk Mitigation Strategy

### Before starting Step 3
1. Read DECISIONS.md P-LOG-001 to P-LOG-004
2. Make backup branch: `git checkout -b phase2-step3-wip`
3. Have rollback plan ready: `git reset --hard HEAD~1`
4. Run baseline build: confirm pre-Step 3 state passes

### During Step 3
1. Update 1 consumer file at a time
2. Build after each file change
3. If build fails: fix THAT file before moving to next
4. Don't accumulate broken state

### After Step 3
1. Full smoke test (all admin tabs + production pages)
2. Verify validateCatalog runs clean in dev console
3. Test template apply (classic ↔ neon)
4. Test element editing (text bound + unbound)
5. Test stateful gallery (countdown + voteCTA)

### If Step 3 fails
1. Git reset to backup branch
2. Run self-reflection skill → identify what went wrong
3. Update DECISIONS.md with new P-LOG entry
4. Revise Step 3 spec
5. Try again with lessons learned

---

## 📝 Reflection Prompt for Claude Code Self-Reflection

After Step 2 execution today, use this prompt to extract lessons:

```
Use the self-reflection skill to review today's Step 2 work.

Specifically reflect on:
1. The deviation from spec (stateful elements kept presets when spec said null)
   - Why did you make that choice?
   - Was the reasoning sound or was it spec violation?
   - What rule could prevent similar deviations?

2. The orphan elements discovery (4 results-* Wraps unregistered)
   - How did you discover them?
   - Should diagnoses have caught this earlier?
   - What process improvement prevents future orphans?

3. The validation runtime gap (untested because no consumer imports yet)
   - Should Step 2 spec have included a validation harness?
   - How to verify catalog without wiring consumers?

4. The instance count regex confusion (31 vs 32)
   - Original regex excluded uppercase, causing false alarm
   - How to write more robust verification patterns?

Append P-LOG-005, P-LOG-006, P-LOG-007, P-LOG-008 (if applicable) to 
DECISIONS.md. Each P-LOG should have:
- Trigger: when does this lesson apply?
- Anti-pattern: what should NOT be done
- Correct pattern: what should be done
- Verification: how to detect violation
```

---

## End of Roadmap

This document captures all remaining Phase 2 work + decision points.
Reference when starting new sessions.

Cross-references:
- `MASTER_PLAN.md` — overall project status
- `PHASE2_ARCHITECTURE.md` — type-instance design
- `LIVE_STEP_H_CATALOG_CORE.md` — Step 2 spec (executed)
- `PHASE3_TEMPLATE_VISION.md` — what comes after Phase 2
- `DECISIONS.md` — all P-LOG lessons (pending: 5-8)
