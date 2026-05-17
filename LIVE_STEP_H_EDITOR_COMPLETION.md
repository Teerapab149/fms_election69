# LIVE_STEP_H_EDITOR_COMPLETION.md — Phase 2.5: Complete Editor Coverage

## READ FIRST

Read in order:
1. `CLAUDE.md` (Engineering Discipline)
2. `DECISIONS.md` (P-LOG-001 through P-LOG-008)
3. `MASTER_PLAN.md` (note: Phase 2 marked complete, but editor coverage incomplete)
4. `DIAGNOSE_CLOSED_SUCCESS_NOT_EDITABLE.md` (root cause analysis)
5. **THIS FILE**

## CONTEXT — PHASE 2.5

Phase 2 marked "COMPLETE" but admin coverage is incomplete:
- `closed` page: 0 catalog entries, no Wraps, no editor props
- `success` page: 5 catalog entries (good), props plumbed (good), but no Wraps

This is Phase 1.5 leftover work that catalog refactor didn't address.

**This step closes that gap.**

**Risk: 🟢 LOW** — established patterns from working pages (vote, home).

**Time estimate: 90-120 min total (2 sub-steps)**

---

## SUB-STEPS

```
Step 1: SUCCESS-WRAPS     (~30 min, S)
  └── Add EditorElement + Wrap pattern + 5 wraps
  └── Catalog already done, just connect

Step 2: CLOSED-FULL       (~60-90 min, M)
  └── Register 4 closed-* in catalog
  └── Add editor props to ClosedEditorPreview
  └── PageDesignTab pass props
  └── Add EditorElement + 4 wraps
```

Do them in order: Success first (easier, builds confidence), then Closed.

---

## STEP 1 — SUCCESS-WRAPS

### Goal
Make 5 success page elements clickable in admin editor.

### What's already there (don't touch)
- ✅ Catalog: success-title, success-subtitle1, success-subtitle2, success-form-btn, success-footer
- ✅ PageDesignTab passes editor props
- ✅ Component receives props in signature
- ✅ Section names match pageRegistry

### What's missing
- ❌ EditorElement import
- ❌ Wrap pattern definition
- ❌ 5 `<Wrap>` calls around content

### Steps

#### 1.1 Read existing files

```bash
# Read working reference (pattern source)
view src/components/admin/editor/VoteEditorPreview.js  
# Pay attention to: imports, Wrap pattern definition, Wrap usage

# Read target file
view src/components/admin/SuccessEditorPreview.js
# Note: full content + which 5 regions to wrap
```

#### 1.2 Identify the 5 wrap targets

In SuccessEditorPreview.js, find:
1. **Title** — likely `<h1>` containing "บันทึกคะแนนสำเร็จ!" or similar
2. **Subtitle1** — first paragraph (e.g., "ขอบคุณที่ร่วมเป็นส่วนหนึ่ง...")
3. **Subtitle2** — second paragraph (e.g., "กิจกรรมนักศึกษาคณะวิทยาการจัดการ")
4. **Form button** — primary action button (e.g., "เปิดแบบประเมิน")
5. **Footer** — "กลับหน้าหลัก" link/text

Confirm by grep:
```bash
grep -n "บันทึก\|ขอบคุณ\|กิจกรรม\|แบบประเมิน\|กลับหน้าหลัก" src/components/admin/SuccessEditorPreview.js
```

#### 1.3 Add EditorElement import

At top of `SuccessEditorPreview.js`:
```javascript
import EditorElement from './editor/EditorElement';
```

(Path: `./editor/EditorElement` since SuccessEditorPreview is in `admin/` and EditorElement is in `admin/editor/`.)

#### 1.4 Add Wrap pattern

Copy the exact pattern from VoteEditorPreview.js. Place inside the component function body, BEFORE the return statement:

```javascript
const Wrap = ({ id, children }) => (
  <EditorElement
    id={id}
    config={elementConfigs?.[id] || {}}
    isSelected={selectedElement === id}
    isHovered={hoveredElement === id}
    onSelect={onSelectElement}
    onHover={onHoverElement}
    onHoverEnd={onHoverEnd}
  >
    {children}
  </EditorElement>
);
```

**IMPORTANT:** Check VoteEditorPreview for exact pattern — there may be additional 
props like `elementConfigs` that need to be in the function signature. Read 
working file FIRST per P-LOG-004.

#### 1.5 Wrap 5 regions

Surround each of the 5 elements:

```jsx
{/* Title */}
<Wrap id="success-title">
  <h1>...</h1>
</Wrap>

{/* Subtitle 1 */}
<Wrap id="success-subtitle1">
  <p>ขอบคุณที่ร่วมเป็นส่วนหนึ่ง...</p>
</Wrap>

{/* Subtitle 2 */}
<Wrap id="success-subtitle2">
  <p>กิจกรรมนักศึกษา...</p>
</Wrap>

{/* Form button */}
<Wrap id="success-form-btn">
  <button>...</button>
</Wrap>

{/* Footer */}
<Wrap id="success-footer">
  <a>กลับหน้าหลัก</a>
</Wrap>
```

Be careful not to break existing styling/layout. Wrap inserts a span-level 
wrapper but should be transparent visually.

#### 1.6 Verify
```bash
# Should have 5 Wraps now
grep -c '<Wrap id="success-' src/components/admin/SuccessEditorPreview.js
# Expected: 5

# IDs match catalog
grep -oP '<Wrap[[:space:]]+id="success-[^"]+"' src/components/admin/SuccessEditorPreview.js
# Expected: success-title, success-subtitle1, success-subtitle2, success-form-btn, success-footer

# Build pass
npm run build 2>&1 | tail -5
```

#### 1.7 Manual test
```bash
npm run dev
```

Open admin → ออกแบบหน้าเว็บ → "หน้าโหวตสำเร็จ":
- [ ] Click "บันทึกคะแนนสำเร็จ" → PropertyPanel opens with text/color fields
- [ ] Click subtitle → PropertyPanel updates
- [ ] Click "เปิดแบบประเมิน" button → PropertyPanel shows button fields
- [ ] Click "กลับหน้าหลัก" → PropertyPanel shows text fields
- [ ] Change a color → preview updates in real-time

### Step 1 Verification Output

Paste in report:
```
=== success Wraps added ===
$ grep -c '<Wrap id="success-' src/components/admin/SuccessEditorPreview.js
[N]

$ grep -oP '<Wrap[[:space:]]+id="success-[^"]+"' src/components/admin/SuccessEditorPreview.js
[list of 5 Wrap IDs]

=== Build ===
[output]

=== Manual test results ===
[checkboxes]
```

---

## STEP 2 — CLOSED-FULL

### Goal
Make `closed` page fully editable: register catalog entries, wire props, add Wraps.

### What's missing (everything)
- ❌ 0 catalog entries for closed-*
- ❌ PageDesignTab not passing editor props to ClosedEditorPreview
- ❌ ClosedEditorPreview signature doesn't accept editor props
- ❌ No EditorElement import
- ❌ No Wrap pattern
- ❌ No Wraps

### Sub-task 2A: Register catalog entries

#### 2A.1 Identify what to register

Read `src/components/admin/ClosedEditorPreview.js` fully. Identify editable regions.

Likely candidates (verify from actual source):
- Page title (e.g., "ระบบปิดอยู่")
- Description (e.g., "ขออภัย ระบบปิดให้บริการ...")
- Detail text (sub-message)
- Back button (e.g., "กลับหน้าหลัก")

Get exact text:
```bash
grep -nE "h1|h2|h3|<p>|<button|<a " src/components/admin/ClosedEditorPreview.js | head -30
```

Or:
```bash
grep -nE "ระบบปิด|ขออภัย|กลับ|ติดต่อ" src/components/admin/ClosedEditorPreview.js
```

#### 2A.2 Decide on instance IDs + types

Use consistent naming with other pages:

```
closed-title          → text-title       (main heading)
closed-description    → text-subtitle    (primary message)
closed-detail         → text-body        (sub-detail)
closed-back-btn       → button-secondary (action button)
```

If state messages vary by simMode (waiting/ended/paused), consider whether 
to register one instance per state OR one with state-aware default. 
Recommendation: ONE instance per visual region (4 total), since state 
variations are CONTENT not STRUCTURE.

#### 2A.3 Add to elementInstances.js

Append after results-* block. Use EXTRA_ELEMENTS_SCHEMA pattern (no presets, has defaultConfig):

```javascript
// ============== CLOSED PAGE (added in Phase 2.5) ==============
"closed-title": {
  id: "closed-title",
  typeId: "text-title",
  name: "หัวข้อหน้าปิดระบบ",
  pages: ["closed"],
  section: "closedMessage",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: TEXT_FIELDS,
  defaultConfig: { 
    text: "ระบบปิดอยู่",  // ← VERIFY from production
    fontSize: "4xl", 
    color: "#1a1a2e", 
    fontWeight: "900", 
    align: "center" 
  },
  presets: null,
  schemaVersion: "v1"
},

"closed-description": {
  id: "closed-description",
  typeId: "text-subtitle",
  name: "คำอธิบาย",
  pages: ["closed"],
  section: "closedMessage",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: TEXT_FIELDS,
  defaultConfig: { 
    text: "ขออภัย ระบบปิดให้บริการชั่วคราว",  // ← VERIFY from production
    fontSize: "lg", 
    color: "#64748b", 
    fontWeight: "normal", 
    align: "center" 
  },
  presets: null,
  schemaVersion: "v1"
},

"closed-detail": {
  id: "closed-detail",
  typeId: "text-body",
  name: "รายละเอียดเพิ่มเติม",
  pages: ["closed"],
  section: "closedMessage",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: TEXT_FIELDS,
  defaultConfig: { 
    text: "กรุณาติดต่อผู้ดูแลระบบ",  // ← VERIFY from production
    fontSize: "sm", 
    color: "#94a3b8", 
    fontWeight: "normal", 
    align: "center" 
  },
  presets: null,
  schemaVersion: "v1"
},

"closed-back-btn": {
  id: "closed-back-btn",
  typeId: "button-secondary",
  name: "ปุ่มกลับหน้าหลัก",
  pages: ["closed"],
  section: "closedMessage",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: BUTTON_FIELDS,
  defaultConfig: { 
    text: "กลับหน้าหลัก",  // ← VERIFY from production
    backgroundColor: "#0F172A",
    textColor: "#ffffff",
    borderRadius: "xl"
  },
  presets: null,
  schemaVersion: "v1"
},
```

**CRITICAL:** Verify default `text` values by reading actual production code. 
Don't guess. Per P-LOG-004.

#### 2A.4 Update instance count
Total catalog instances: 36 → 40 (+4)

Update validateCatalog expected count if hardcoded:
```bash
grep -n "Expected 36 instances\|=== 36" src/components/admin/editor/elementCatalog.js
```
If found, update to 40.

#### 2A.5 Verify
```bash
grep -cE '^  "[A-Za-z][A-Za-z0-9-]+": \{' src/components/admin/editor/elementInstances.js
# Expected: 40

grep -nE '^  "closed-' src/components/admin/editor/elementInstances.js
# Expected: 4 matches

npm run build 2>&1 | tail -5
# Expected: PASS
```

### Sub-task 2B: Update PageDesignTab to pass editor props

#### 2B.1 Find ClosedEditorPreview call site

```bash
grep -n "ClosedEditorPreview" src/components/admin/PageDesignTab.js
```

#### 2B.2 Compare with SuccessEditorPreview call (already correct)

```bash
grep -B2 -A8 "SuccessEditorPreview" src/components/admin/PageDesignTab.js
```

#### 2B.3 Update ClosedEditorPreview call

Add editor props (same shape as SuccessEditorPreview):

```jsx
<ClosedEditorPreview
  simMode={closedSimMode}
  selectedElement={editorProps?.selectedElement}
  hoveredElement={editorProps?.hoveredElement}
  onSelectElement={editorProps?.onSelectElement}
  onHoverElement={editorProps?.onHoverElement}
  onHoverEnd={editorProps?.onHoverEnd}
  elementConfigs={editorProps?.elementConfigs}
/>
```

Adjust based on what other working previews pass. Match the pattern exactly.

### Sub-task 2C: Refactor ClosedEditorPreview

#### 2C.1 Update function signature

```javascript
// BEFORE
export default function ClosedEditorPreview({ simMode = "ended" }) {
  // ...
}

// AFTER
export default function ClosedEditorPreview({
  simMode = "ended",
  selectedElement,
  hoveredElement,
  onSelectElement,
  onHoverElement,
  onHoverEnd,
  elementConfigs = {}
}) {
  // ...
}
```

#### 2C.2 Add EditorElement import

```javascript
import EditorElement from './editor/EditorElement';
```

#### 2C.3 Add Wrap pattern

Same as success step:
```javascript
const Wrap = ({ id, children }) => (
  <EditorElement
    id={id}
    config={elementConfigs?.[id] || {}}
    isSelected={selectedElement === id}
    isHovered={hoveredElement === id}
    onSelect={onSelectElement}
    onHover={onHoverElement}
    onHoverEnd={onHoverEnd}
  >
    {children}
  </EditorElement>
);
```

#### 2C.4 Wrap 4 regions

```jsx
<Wrap id="closed-title">
  <h1>...</h1>
</Wrap>

<Wrap id="closed-description">
  <p>...</p>
</Wrap>

<Wrap id="closed-detail">
  <p>...</p>
</Wrap>

<Wrap id="closed-back-btn">
  <a>...</a>  {/* or <button> */}
</Wrap>
```

**WARNING:** STATE_MESSAGES per simMode renders different text. The Wraps stay 
constant (same IDs across simModes), but the CONTENT changes. This is correct 
— the Wrap wraps the dynamic content, but ID is stable.

#### 2C.5 Verify
```bash
grep -c '<Wrap id="closed-' src/components/admin/ClosedEditorPreview.js
# Expected: 4

grep -oP '<Wrap[[:space:]]+id="closed-[^"]+"' src/components/admin/ClosedEditorPreview.js
# Expected: 4 matches with closed-title, closed-description, closed-detail, closed-back-btn

npm run build 2>&1 | tail -5
# Expected: PASS
```

#### 2C.6 Manual test
```bash
npm run dev
```

Admin → ออกแบบหน้าเว็บ → "หน้าระบบปิด":
- [ ] simMode switcher (waiting/ended/paused) shows different content
- [ ] Click closed-title → PropertyPanel opens
- [ ] Click closed-description → PropertyPanel opens
- [ ] Click closed-detail → PropertyPanel opens
- [ ] Click closed-back-btn → PropertyPanel opens (button type)
- [ ] Change color → preview updates

### Step 2 Verification Output

Paste in report:
```
=== Catalog entries for closed ===
$ grep -cE '^  "closed-' src/components/admin/editor/elementInstances.js
4

$ grep -nE '^  "closed-' src/components/admin/editor/elementInstances.js
[paste]

=== Total catalog count ===
$ grep -cE '^  "[A-Za-z][A-Za-z0-9-]+": \{' src/components/admin/editor/elementInstances.js
40

=== PageDesignTab props ===
$ grep -A8 "ClosedEditorPreview" src/components/admin/PageDesignTab.js
[paste]

=== Closed Wraps ===
$ grep -c '<Wrap id="closed-' src/components/admin/ClosedEditorPreview.js
4

=== Build ===
[output]

=== Dev validation ===
[elementCatalog] ✓ Validation passed: 40 instances, 16 types

=== Manual test ===
[checkboxes]
```

---

## FINAL VERIFICATION (Phase 2.5 Complete)

### Build pass
```bash
npm run build 2>&1 | tail -10
```

### Total catalog count
```bash
grep -cE '^  "[A-Za-z][A-Za-z0-9-]+": \{' src/components/admin/editor/elementInstances.js
```
Expected: 40 (was 36, +4 closed-*)

### All pages editable check
Open admin → ออกแบบหน้าเว็บ. For each tab:
- [ ] หน้าหลัก — click test passes
- [ ] หน้าลงคะแนน — click test passes  
- [ ] ผลคะแนน — click test passes
- [ ] รายชื่อผู้สมัคร — click test passes
- [ ] หน้าระบบปิด — click test passes ✨ NEW
- [ ] โหวตสำเร็จ — click test passes ✨ NEW

### Validation log
```
[elementCatalog] ✓ Validation passed: 40 instances, 16 types
```

---

## DO NOT
- Do NOT touch consumer files (HomeContent, etc.) — they're done
- Do NOT modify elementCatalog.js logic (just count constants if hardcoded)
- Do NOT skip reading working files (VoteEditorPreview, SuccessEditorPreview's props plumbing)
- Do NOT guess default text values — read production source per P-LOG-004
- Do NOT change pageRegistry — sections already defined ("closedMessage" exists)
- Do NOT add new TEXT_FIELDS / BUTTON_FIELDS constants — reuse from elementInstances

---

## REPORT FORMAT

```
=== PHASE 2.5 H-EDITOR-COMPLETION — COMPLETION REPORT ===

STEP 1: SUCCESS-WRAPS
[paste all verification outputs from Step 1]

STEP 2: CLOSED-FULL

2A Catalog (4 new entries):
[paste]

2B PageDesignTab props:
[paste before/after]

2C ClosedEditorPreview refactor:
[paste verification]

FINAL VERIFICATION:
- Build: PASS / 29/29 pages
- Total catalog: 40 instances (36 + 4 closed-*)
- Validation log: [elementCatalog] ✓ Validation passed: 40 instances, 16 types
- All 6 admin tabs editable: ✅ confirmed

=== Phase 2.5 Status: COMPLETE ===

True Phase 2 closure achieved. All admin editor pages now fully editable.

Known issues remaining (deferred to Phase 3):
- Template apply doesn't change static elements visually (Phase 3 will replace)
- StatefulGallery mini-buttons not clickable (Phase 3 will replace)
```

---

## NEXT STEPS

After Phase 2.5 complete:

1. **Phase 2 truly done** — all 6 admin pages editable
2. **Update MASTER_PLAN.md** — Phase 2.5 ✅, mark "full editor coverage"
3. **Commit**: `git commit -m "Phase 2.5: complete editor coverage (closed + success)"`
4. **Then**: Phase 3 (Canva templates) — fresh session

---

## FAILURE HANDLING

### If build fails after adding Wraps
- Most likely: missing prop in Wrap pattern (mismatch with VoteEditorPreview)
- Re-read VoteEditorPreview, ensure pattern is byte-identical
- Check function signature has all required props

### If clicks don't trigger PropertyPanel
- Verify editor props are received (add console.log temporarily)
- Verify PageDesignTab passes props correctly
- Check EditorElement actually receives onSelect callback

### If wrong element selected
- Verify Wrap IDs match catalog instance IDs exactly
- Check for typos (e.g., "subtitle1" vs "subtitle-1")

### If validation log shows "37 instances" not 40
- Catalog count hardcoded somewhere — search and update
- Or 3 closed entries didn't take — re-check syntax

---

## End of Phase 2.5 Spec

This step closes the editor coverage gap left from Phase 1.5.
After completion: project truly has 6/6 admin pages editable.
