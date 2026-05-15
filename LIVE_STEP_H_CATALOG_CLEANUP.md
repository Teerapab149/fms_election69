# LIVE_STEP_H_CATALOG_CLEANUP.md — Step 5/5: Final Cleanup + Phase 2 Closure

## READ FIRST

Read in order:
1. `CLAUDE.md` (Engineering Discipline)
2. `DECISIONS.md` (P-LOG-001 through latest)
3. `MASTER_PLAN.md`
4. `PROGRESS.md`
5. `PHASE2_REMAINING_ROADMAP.md`
6. **THIS FILE**

## CONTEXT — FINAL STEP OF PHASE 2

Steps 1-3 complete:
- ✅ Step 1 PREP: Static imports
- ✅ Step 2 CORE: elementCatalog created (36 instances + 16 types)
- ✅ Step 3 WIRE: 7 consumers using catalog, EXTRA_SCHEMA deleted, fallback fixed
- ⏭️ Step 4 EXTEND: SKIPPED per roadmap (Phase 3 will rewrite templates)
- 🔵 **Step 5 CLEANUP: THIS STEP**

After Step 5: Phase 2 COMPLETE. Phase 3 can begin.

**Risk level: 🟢 LOW** — removing dead code that no consumer imports.

**Time estimate: 20-30 min**

## KNOWN ISSUES (do NOT fix in this step)

These bugs existed BEFORE Step 3 and are deferred to Phase 3:

1. **Template apply doesn't change anything for most elements**
   - Templates (classic/neon) cover only 2 stateful elements (countdown, voteCTA)
   - Static elements have `presets` data but apply logic is incomplete
   - **Defer to Phase 3** — Canva-style template system will replace this entirely

2. **StatefulGallery mini buttons not clickable** (Phase 1.5 issue)
   - "นีออน" / "คลาสสิก" buttons inside StatefulGallery don't respond
   - Pre-existing, not introduced by Phase 2
   - **Defer to Phase 3** — new template editor will replace StatefulGallery UI

**Do NOT attempt to fix these in Step 5.** Document and move on.

---

## SCOPE

### Files to DELETE
1. `src/components/admin/editor/elementRegistry.js`
2. `src/components/admin/editor/statefulRegistry.js`

### Files to UPDATE (documentation only)
1. `DECISIONS.md` — mark Phase 2 complete + document known bugs
2. `MASTER_PLAN.md` — update progress tracker
3. `PROGRESS.md` — final state checkpoint

### Files NOT to modify
- Any consumer file (Step 3 done)
- elementCatalog/Types/Instances (Step 2 done)
- Any production page

---

## TASK 5.1 — Pre-flight Verification

### 5.1.1 Confirm zero imports of old registries
```bash
grep -rn "from ['\"].*elementRegistry['\"]" src/ --include="*.js" --include="*.jsx"
grep -rn "from ['\"].*statefulRegistry['\"]" src/ --include="*.js" --include="*.jsx"
```
**Expected: ZERO matches in both.**

If ANY match found → STOP, do not delete. Report which file still imports.

### 5.1.2 Confirm baseline build passes
```bash
npm run build 2>&1 | tail -10
```
Expected: ✓ Compiled successfully, 29/29 pages.

### 5.1.3 Confirm catalog is active
Visual check: open dev mode, verify console shows:
```
[elementCatalog] ✓ Validation passed: 36 instances, 16 types
```

This is from Step 3 verification. If this works → proceed.

---

## TASK 5.2 — Delete Old Registry Files

### 5.2.1 Verify file contents one last time (paranoid safety)

Just check they exist before deleting:
```bash
ls -la src/components/admin/editor/elementRegistry.js
ls -la src/components/admin/editor/statefulRegistry.js
```

### 5.2.2 Delete files

```bash
rm src/components/admin/editor/elementRegistry.js
rm src/components/admin/editor/statefulRegistry.js
```

OR (safer with git):
```bash
git rm src/components/admin/editor/elementRegistry.js
git rm src/components/admin/editor/statefulRegistry.js
```

### 5.2.3 Verify deletion
```bash
ls src/components/admin/editor/element*.js
# Expected: only elementCatalog.js, elementInstances.js, elementTypes.js

ls src/components/admin/editor/stateful*
# Expected: only StatefulGallery.js (not statefulRegistry)
```

### 5.2.4 Build still passes
```bash
npm run build 2>&1 | tail -10
```
Expected: ✓ Compiled successfully + 29/29 pages.

**If build fails:** something still imports the deleted files. Don't try to fix — 
git restore the files and report which import is broken.

```bash
# If broken:
git checkout HEAD -- src/components/admin/editor/elementRegistry.js src/components/admin/editor/statefulRegistry.js
```

---

## TASK 5.3 — Update DECISIONS.md

Append the following to DECISIONS.md (find appropriate section, likely after 
last P-LOG entry or under "Decisions" section).

### 5.3.1 Add Phase 2 closure decision

```markdown
## D-2XX: Phase 2 Type-Instance Catalog Refactor Complete (2026-05-XX)

Phase 2 of FMS election editor refactor complete. Migrated 3 fragmented 
registries (elementRegistry, statefulRegistry, EXTRA_ELEMENTS_SCHEMA) into 
a single unified elementCatalog.

**Result:**
- 36 element instances + 16 semantic types (was 31+ scattered)
- 7 consumer files now reference single source of truth
- Cross-reference validation runs in dev mode
- Stateful elements use proper resolution chain
- 4 previously-orphaned results-* elements now editable

**Deferred bugs (will be fixed by Phase 3 rebuild):**
- Template apply changes only countdown + voteCTA visually (other elements 
  have preset data but apply logic incomplete)
- StatefulGallery mini-template buttons not clickable (pre-existing)
- These bugs exist by design — Phase 3 Canva-style system replaces template 
  logic entirely

**Files deleted:**
- src/components/admin/editor/elementRegistry.js
- src/components/admin/editor/statefulRegistry.js

**Files created (Step 2-3):**
- src/components/admin/editor/elementCatalog.js (public API)
- src/components/admin/editor/elementInstances.js (36 instances)
- src/components/admin/editor/elementTypes.js (16 types)
```

### 5.3.2 Optionally add P-LOG entries from Phase 2 lessons

If not already added by previous reflection sessions:

```markdown
## P-LOG-005: Don't Silently Deviate from Explicit Spec

**Trigger:** When spec explicitly states a value/behavior (e.g., "presets: null") 
but you think there might be a "better" choice.

**Anti-pattern:**
Make the deviation without asking, rationalize it ("it's ignored anyway"), 
then mention it casually in the report.

**Correct pattern:**
If you think the spec is wrong, STOP and ask the user before deviating. 
The user wrote the spec for a reason. Deviation requires explicit approval.

**Detection:**
After any task, grep diff for unexpected values that differ from spec. 
Flag "deviation from spec" in report explicitly, not buried in description.

---

## P-LOG-006: Always Search for Orphan Wraps Before Migration

**Trigger:** When migrating elements between registries or refactoring catalog systems.

**Anti-pattern:**
Trust initial diagnosis count without re-scanning ALL Wrap usages in production 
components. Discover orphans mid-execution (or never).

**Correct pattern:**
Before catalog creation, grep `<Wrap[[:space:]]+id="..."` across ALL production 
files. Compare against registry. Document orphans BEFORE writing instance entries.

**Detection:**
Final count of catalog instances should equal: registered + new + orphans found.

---

## P-LOG-007: Validation Must Run on Module Load

**Trigger:** When creating shared catalog/registry files that other consumers import.

**Anti-pattern:**
Define validateCatalog() function but never call it. Verification deferred 
until first consumer imports the catalog → validation gap until Step 3+.

**Correct pattern:**
Include `if (process.env.NODE_ENV !== 'production') validateCatalog();` at 
module bottom. Add a "loading log" so console confirms catalog imported.

**Detection:**
Browser console should print catalog status on dev startup. Absence = catalog 
either broken or not yet imported by any consumer.

---

## P-LOG-008: Grep Patterns Must Handle Mixed Case in JS Object Keys

**Trigger:** Counting JavaScript object property keys via grep.

**Anti-pattern:**
Use pattern `[a-z][a-z0-9-]+` which excludes uppercase. Miss entries like 
"voteCTA-button". Get wrong count.

**Correct pattern:**
Use case-insensitive pattern: `[A-Za-z][A-Za-z0-9-]+` or `[\w-]+`. Always 
double-check count matches expected, investigate any discrepancy.

**Detection:**
If count seems off by 1-3 from expected, suspect case sensitivity. Re-run 
with broader pattern.
```

### 5.3.3 Verify DECISIONS.md updated
```bash
grep -n "D-2XX\|D-200\|D-201\|P-LOG-005\|Phase 2.*Complete" DECISIONS.md | head -10
```
Expected: matches found showing new entries.

---

## TASK 5.4 — Update MASTER_PLAN.md

Find the Phase 2 status section and update:

### 5.4.1 Mark Phase 2 complete

```markdown
### ✅ Phase 2: Type-Instance Catalog Refactor (COMPLETE 2026-05-XX)

**Result:** Successfully unified 3 fragmented registries into single catalog.

```
Step 1: H-CATALOG-PREP        ✅ DONE
Step 2: H-CATALOG-CORE        ✅ DONE
Step 3: H-CATALOG-WIRE        ✅ DONE
Step 4: H-TEMPLATE-EXTEND     ⏭️ SKIPPED (Phase 3 will rewrite)
Step 5: H-CATALOG-CLEANUP     ✅ DONE
```

**Active files (single source of truth):**
- elementCatalog.js
- elementTypes.js  
- elementInstances.js

**Known bugs deferred to Phase 3:**
- Template apply incomplete (only 2 stateful elements respond visually)
- StatefulGallery mini-template buttons unclickable

These will be fixed by Phase 3 Canva-style template system rewrite.
```

### 5.4.2 Update progress tracker

```markdown
## Project Progress (Visual)

```
Phase 1   [████████████████] 100% COMPLETE
Phase 1.5 [████████████████] 100% COMPLETE  
Phase 2   [████████████████] 100% COMPLETE ✨
Phase 3   [██░░░░░░░░░░░░░░]  10% DESIGNED (vision documented)
Phase 4   [░░░░░░░░░░░░░░░░]   0% NOT STARTED

Overall: ~40-45% complete (factoring all phases)
```

### 5.4.3 Update "Current State Summary"

```markdown
## Current State Summary

```
✅ Phase 1 + Phase 1.5: COMPLETE
✅ Phase 2: COMPLETE — catalog system active

🔵 NEXT DECISION POINT:
   Phase 3: Canva-style template system (per PHASE3_TEMPLATE_VISION.md)
   OR
   UX polish: fix template apply bugs first, smaller scope
   OR
   Phase 4: /party page editor (8+ sections)
```

---

## TASK 5.5 — Update PROGRESS.md

Replace or update with final Phase 2 closure state:

```markdown
# PROGRESS.md — Phase 2 Complete

**Last saved:** [DATE]
**Phase 2 Status:** ✅ COMPLETE

## Phase 2 Summary
- Steps 1, 2, 3, 5 executed (Step 4 skipped per design decision)
- 36 element instances + 16 types in unified catalog
- 7 consumer files migrated successfully
- 2 old registry files deleted
- 4 previously-orphan elements (results-*) registered
- vote-divider-text registered (was unregistered)
- Stateful presets cleaned (set to null)
- templateEngine fallback bug fixed

## Known Bugs (deferred to Phase 3)
- Template apply: only countdown + voteCTA respond visually
- StatefulGallery mini-buttons: not clickable

These are pre-existing issues that Phase 3 will resolve via Canva-style 
template system rewrite (see PHASE3_TEMPLATE_VISION.md).

## What's Next
Decision point for user. Options:

### Option A: Phase 3 — Canva-Style Templates
- Follow PHASE3_TEMPLATE_VISION.md
- 7 sub-steps, ~10-12 hours focused work
- Major UX upgrade
- Fixes all known Phase 2 deferred bugs

### Option B: UX Polish + Quick Fixes
- Patch template apply (smaller scope)
- Fix StatefulGallery clickability
- Production hardening
- ~3-5 hours
- ⚠️ Work might be redundant if doing Phase 3 anyway

### Option C: Phase 4 — Party Page Editor
- /party?id=N editor (8+ sections)
- Component Library
- Image Library
- ~15-20 hours

## Recommendation
**Option A** — Phase 3 will fix Phase 2 bugs as side effects + deliver 
the template gallery user wanted. Most ROI per session.

## Resume Protocol
Next session start prompt:
```
Continuing FMS work. Phase 2 complete. Read CLAUDE.md, DECISIONS.md 
(latest P-LOGs), MASTER_PLAN.md, PROGRESS.md, PHASE3_TEMPLATE_VISION.md.
Ready to start Phase 3 [choose: Step 1 MODEL or different approach].
```
```

---

## TASK 5.6 — Final Verification

### 5.6.1 Build pass
```bash
npm run build 2>&1 | tail -10
```
Expected: ✓ Compiled successfully, 29/29 pages.

### 5.6.2 Dev mode validation
```bash
npm run dev
```
Open browser → Admin → ออกแบบหน้าเว็บ → console:
- ✅ `[elementCatalog] ✓ Validation passed: 36 instances, 16 types`
- ✅ NO red errors
- ✅ Admin tabs all load
- ✅ PropertyPanel opens on element click

### 5.6.3 Git status check
```bash
git status
git diff --stat
```

Expected modifications:
- DECISIONS.md (Phase 2 closure + P-LOGs)
- MASTER_PLAN.md (progress update)
- PROGRESS.md (final state)

Expected deletions:
- src/components/admin/editor/elementRegistry.js
- src/components/admin/editor/statefulRegistry.js

Plus Step 3 changes still uncommitted (acceptable — same Phase 2 work):
- HomeContent.js, PageDesignTab.js, PropertyPanel.js, QuickStyleBar.js
- StatefulGallery.js, stateResolver.js, templateEngine.js
- elementCatalog.js, elementInstances.js, elementTypes.js (untracked new files)

### 5.6.4 Smoke test (quick)
Open admin → ออกแบบหน้าเว็บ:
- [ ] Home tab loads
- [ ] Click hero-title → PropertyPanel works
- [ ] Click hero-countdown → StatefulGallery opens
- [ ] /home production page loads
- [ ] /vote production page loads

(Detailed smoke test was done in Step 3 — this is a quick sanity check.)

---

## REPORT FORMAT (per P-LOG-003)

```
=== STEP 5: H-CATALOG-CLEANUP — COMPLETION REPORT ===

5.1 Pre-flight:
=== No old registry imports ===
[paste grep output]

=== Baseline build ===
[paste npm run build tail]

5.2 File deletion:
$ rm src/components/admin/editor/elementRegistry.js → DONE
$ rm src/components/admin/editor/statefulRegistry.js → DONE

$ ls src/components/admin/editor/element*.js
[paste output — should show only Catalog/Types/Instances]

5.3 DECISIONS.md updates:
- Appended D-XXX (Phase 2 closure)
- Appended P-LOG-005 through 008 (if not already there)
[paste grep verification]

5.4 MASTER_PLAN.md updates:
- Marked Phase 2 100% complete
- Updated progress tracker
- Updated current state summary

5.5 PROGRESS.md final state written

5.6 Final verifications:

=== Build ===
[paste output]

=== Dev validation ===
[paste console text or describe]

=== Git status ===
[paste output]

5.7 Smoke test (quick):
[checkboxes with status]

=== Phase 2 Status: ✅ COMPLETE ===

Files deleted: 2
Files modified: 3 (docs only)
Files unchanged: all consumer + catalog files (intentional)

Next: User decides Phase 3 vs Phase 4 vs UX polish.
```

---

## After Step 5 Complete

### Immediate
1. Commit Phase 2 work if not already:
   ```bash
   git add .
   git commit -m "Phase 2 complete: type-instance catalog refactor"
   ```

2. Optional: Demo to พี่อนุวัฒน์ — show that:
   - Editor still works exactly as before (no regression)
   - Foundation laid for Phase 3 template system
   - Old registry files removed (code cleanup)

### Next Session
User chooses next direction. Recommendation: **Phase 3** per PHASE3_TEMPLATE_VISION.md.

---

## FAILURE HANDLING

### If build fails after delete
- Some consumer still imports deleted file (Step 3 missed something)
- Restore files via git:
  ```bash
  git checkout HEAD -- src/components/admin/editor/elementRegistry.js src/components/admin/editor/statefulRegistry.js
  ```
- Grep for offending import
- Fix that consumer to use elementCatalog
- Re-run Step 5

### If validation log doesn't appear
- Catalog might not be imported by anyone
- Check elementCatalog has `if (process.env.NODE_ENV !== 'production') validateCatalog();`
- Check consumers actually use catalog functions (not just imported but unused)

### If smoke test fails
- Likely unrelated to Step 5 (deletion is non-functional)
- Check Step 3 wire — may have missed a consumer
- Roll back delete + investigate

---

## End of Step 5 Spec

This step completes Phase 2. After execution:
- Phase 2 documentation finalized
- Old code removed
- System cleaned
- Ready for Phase 3

Estimated time: 20-30 min total.
Risk: LOW — just cleanup.
