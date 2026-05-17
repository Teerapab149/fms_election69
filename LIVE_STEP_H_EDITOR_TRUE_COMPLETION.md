# LIVE_STEP_H_EDITOR_TRUE_COMPLETION.md — Phase 2.6: True Editor Completion

## READ FIRST (Mandatory)

Read in order:
1. `CLAUDE.md` — Engineering Discipline section
2. `DECISIONS.md` — P-LOG-001 through P-LOG-009 (especially 003, 004, 005, 009)
3. `MASTER_PLAN.md`
4. `PROGRESS.md` (if exists)
5. **`DIAGNOSE_EDITOR_COVERAGE_GAPS.md`** — critical context for this work
6. **THIS FILE** — execution spec

## CONTEXT — PHASE 2.6: WHY WE'RE HERE

Phase 2 was declared "complete" multiple times but DIAGNOSIS revealed:

```
Critical findings:
1. HomeEditorPreview.js (in editor/previews/) = DEAD CODE
   - PageDesignTab uses HomeContent.js directly for home page
   - 15-Wrap file was never connected
   
2. Block components (StatsBlock, MeetCandidatesBlock, etc.) = ZERO Wraps
   - HomeContent only wraps outer block level
   - 6 catalog entries unreachable in home alone
   
3. Section normalizations NEVER applied
   - Step 2 spec said voteHeader → header (etc.)
   - Implementation kept old names
   - Catalog ↔ pageRegistry section mismatches
   
4. Success page: 12+ regions but only 5 in catalog + Wraps
   - User wants megaphone card, chips, icons editable
   
5. Closed page: missing lock icon
   
6. Party page: 0 catalog entries (6 pageRegistry sections)
   - Will be Phase 4 — remove from EDITABLE_PAGES now
   
7. result-card-${index} = dynamic orphan Wrap
   - Strip it, let Phase 3 templates redesign
```

This step **truly completes** Phase 2 editor coverage.

**Risk: 🟢 LOW** — well-defined work, established patterns
**Time estimate: 2 hours total**
**Token estimate: 40-50% of fresh session**

---

## DECISIONS APPLIED IN THIS SPEC

```
Decision A: Full coverage (Option 1)
Decision B: Remove party from EDITABLE_PAGES temporarily (Option A)
Decision C: Strip result-card dynamic Wrap, defer redesign to Phase 3 (Option Z)
Decision D: Defer sidebar element list to Phase 3 (Option II)
```

These were confirmed by user before this spec was written.

---

## CRITICAL DISCIPLINE (FROM PREVIOUS FAILURES)

### P-LOG-004 — READ PRODUCTION FIRST
Before writing any Wrap or catalog entry, READ the actual production file. 
Don't trust diagnosis line numbers blindly — verify code structure yourself.

### P-LOG-005 — DON'T DEVIATE FROM SPEC
If spec says "Wrap region X", wrap region X. Don't substitute, don't 
"improve", don't skip. If you think spec is wrong, ASK before deviating.

### P-LOG-009 — VERIFY USER-FACING BEFORE SIGN-OFF
After implementation, MANUAL CLICK every visual region in browser. 
Don't claim done from build pass alone.

### NEW: P-LOG-010 — VERIFY ACTUAL RENDERER, NOT ASSUMED ONE
Phase 2 wrapped a dead-code file because no one verified PageDesignTab 
routing. ALWAYS confirm which component PageDesignTab actually renders 
before adding/modifying Wraps.

```bash
# To verify which renderer is active for any page:
grep -A30 "renderPreview" src/components/admin/PageDesignTab.js | head -60
```

### NEW: P-LOG-011 — VERIFY SPEC COMPLIANCE FIELD-BY-FIELD, NOT JUST COUNT
Phase 2 Step 3 reported "section normalizations applied" but they weren't. 
Audit by counting matches OR checking actual field values, not just file 
count or row count.

---

## SCOPE

### Sub-steps (in execution order)

```
P0: Pre-flight (5 min)
   Backup branch + baseline build

P1: Production renderer verification (5 min)
   Confirm PageDesignTab.renderPreview routing for each page

P2: Wrap block components (30 min)
   StatsBlock, MeetCandidatesBlock, plus HomeContent hero-status-badge

P3: Vote header badge (5 min)
   Add Wrap in MultiPartyView line ~70

P4: Section name normalizations (10 min)
   Fix elementInstances.js section field values
   
P5: result-card dynamic Wrap removal (10 min)
   Strip dynamic Wrap from ResultsEditorPreview

P6: Add success missing regions (35 min)
   8 new catalog entries + Wraps (icon, card, 2 chips, etc.)

P7: Add closed-lock-icon (5 min)
   1 new catalog entry + 1 Wrap

P8: Remove party from EDITABLE_PAGES (5 min)
   Until Phase 4 implements it

P9: Delete dead HomeEditorPreview (5 min)
   editor/previews/HomeEditorPreview.js

P10: Comprehensive manual test (20 min)
   Click every region on every page

P11: Documentation (10 min)
   Update PROGRESS.md, MASTER_PLAN.md, add P-LOG-010/011
```

### Files to modify (estimated)

1. `src/components/admin/PageDesignTab.js` (P8 — EDITABLE_PAGES list)
2. `src/components/admin/SuccessEditorPreview.js` (P6 — wraps)
3. `src/components/admin/ClosedEditorPreview.js` (P7 — 1 wrap)
4. `src/components/admin/ResultsEditorPreview.js` (P5 — strip dynamic)
5. `src/components/admin/editor/elementInstances.js` (P4 + P6 + P7 — section norms + new entries)
6. `src/components/blocks/StatsBlock.js` (P2 — 3 wraps inside)
7. `src/components/blocks/MeetCandidatesBlock.js` (P2 — 2 wraps inside)
8. `src/components/HomeContent.js` (P2 — hero-status-badge wrap)
9. `src/components/vote/MultiPartyView.js` (P3 — header-badge wrap)
10. `DECISIONS.md` (P11 — P-LOG-010, P-LOG-011)
11. `MASTER_PLAN.md` (P11 — Phase 2.6 status)
12. `PROGRESS.md` (P11 — final state)

### Files to delete

1. `src/components/admin/editor/previews/HomeEditorPreview.js` (P9 — dead code)

### Files to NOT modify

- `elementCatalog.js`, `elementTypes.js` (catalog API + types unchanged)
- Production page files (`src/app/*/page.js`) except as listed above
- `EditorElement.js`, `templateEngine.js`, `stateResolver.js`

---

## P0 — Pre-flight (5 min)

### 0.1 Create safety branch
```bash
git status
git checkout -b phase2-6-true-completion
# Or stay on current branch if clean
```

### 0.2 Baseline build
```bash
npm run build 2>&1 | tail -10
```
Must PASS. If fails, STOP.

### 0.3 Verify current state
```bash
# Confirm catalog count baseline
grep -cE '^  "[A-Za-z][A-Za-z0-9-]+": \{' src/components/admin/editor/elementInstances.js
# Expected: 40 (will become 49 after P6+P7)

# Confirm validation log baseline
# (open admin in dev mode, check console for "[elementCatalog] ✓")
```

---

## P1 — Production Renderer Verification (5 min)

Per P-LOG-010, confirm WHICH file PageDesignTab actually renders.

```bash
grep -A40 "renderPreview" src/components/admin/PageDesignTab.js | head -60
```

Expected output should show routing roughly like:
```javascript
function renderPreview(pageId) {
  if (pageId === 'home') return <HomeContent editorMode={true} .../>;
  if (pageId === 'vote') return <VoteEditorPreview .../>;
  if (pageId === 'candidates') return <CandidatesEditorPreview .../>;
  if (pageId === 'success') return <SuccessEditorPreview .../>;
  if (pageId === 'closed') return <ClosedEditorPreview .../>;
  if (pageId === 'results') return <ResultsEditorPreview .../>;
  // party — TBD
}
```

**Confirm:**
- home → HomeContent.js (NOT editor/previews/HomeEditorPreview)
- vote → VoteEditorPreview → MultiPartyView/SinglePartyView
- candidates → CandidatesEditorPreview → app/candidates/page.js
- success → SuccessEditorPreview directly
- closed → ClosedEditorPreview directly
- results → ResultsEditorPreview directly

Paste actual routing code in report.

---

## P2 — Wrap Block Components (30 min)

### P2.1 Read each block component first
```bash
view src/components/blocks/StatsBlock.js
view src/components/blocks/MeetCandidatesBlock.js
```

Identify:
- What JSX structure exists
- Where to insert Wraps
- Whether Wrap component is imported (likely NOT)
- Whether editor props (selectedElement, etc.) flow into the block

### P2.2 Understand prop flow

Check how HomeContent.js passes data into block components:
```bash
grep -B2 -A10 "StatsBlock\|MeetCandidatesBlock\|ElectionBannerBlock" src/components/HomeContent.js
```

Most likely blocks receive only data props (counts, text content), 
NOT editor props. Two options:

**Option A: Pass editor props through to blocks**
- Modify HomeContent.js to pass selectedElement, onSelectElement, etc.
- Modify each block component signature
- Add Wrap wrapper inside each block
- More invasive but proper

**Option B: Use React Context for editor props**
- HomeContent provides EditorContext
- Blocks consume via useEditor() hook
- Less prop drilling
- May already exist — check codebase

**Option C: Move Wraps OUT of blocks into HomeContent**
- HomeContent has block-level Wrap (current)
- Add MORE granular Wraps in HomeContent that wrap parts of block render
- Doesn't require block modification
- BUT blocks render their content internally so this may not be possible

**Recommended:** Check existing pattern. If Wraps live in production files 
(MultiPartyView), blocks should too. Option A.

### P2.3 Find Wrap component definition

```bash
# Where is the Wrap component defined? Look in HomeContent first
grep -n "const Wrap" src/components/HomeContent.js
grep -n "function Wrap" src/components/HomeContent.js
grep -n "import EditorElement" src/components/HomeContent.js
```

Verify pattern that HomeContent uses for its own Wraps:
```bash
view src/components/HomeContent.js [around lines 230-285]
```

Replicate the EXACT same pattern in blocks.

### P2.4 Modify StatsBlock.js

Need to wrap 3 elements:
- `stats-header` — section heading text
- `stats-progress-card` — progress card
- `stats-eligible-card` — eligible voters card

```javascript
// Add to imports:
import EditorElement from '../admin/editor/EditorElement';

// In component signature, add editor props:
export default function StatsBlock({
  voted, eligible, percentage,
  // ADD:
  editorMode = false,
  selectedElement,
  hoveredElement,
  onSelectElement,
  onHoverElement,
  onHoverEnd,
  elementConfigs = {}
}) {
  // Add Wrap component inside function:
  const Wrap = editorMode ? ({ id, children }) => (
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
  ) : ({ children }) => children;  // production: pass-through
  
  // ... existing JSX with Wraps added:
  return (
    <section>
      <Wrap id="stats-header">
        <h2 className="...">สถิติผู้โหวต</h2>
      </Wrap>
      
      <div className="grid">
        {/* stats-voted-card already wrapped at HomeContent level */}
        <div>...voted card...</div>
        
        <Wrap id="stats-progress-card">
          <div className="card progress-card">...</div>
        </Wrap>
        
        <Wrap id="stats-eligible-card">
          <div className="card eligible-card">...</div>
        </Wrap>
      </div>
    </section>
  );
}
```

**IMPORTANT:** Don't break production (non-editor) rendering. The Wrap 
should be transparent when editorMode=false (or absent).

### P2.5 Modify HomeContent.js to pass editor props to StatsBlock

Find StatsBlock invocation:
```bash
grep -B2 -A8 "<StatsBlock" src/components/HomeContent.js
```

Add editor props:
```jsx
<StatsBlock
  voted={stats.voted}
  eligible={stats.eligible}
  percentage={stats.percentage}
  // ADD:
  editorMode={editorMode}
  selectedElement={selectedElement}
  hoveredElement={hoveredElement}
  onSelectElement={onSelectElement}
  onHoverElement={onHoverElement}
  onHoverEnd={onHoverEnd}
  elementConfigs={elementConfigs}
/>
```

Verify HomeContent has these props in signature already (yes — they flow 
to its own Wraps).

### P2.6 Modify MeetCandidatesBlock.js (same pattern)

Wrap 2 elements inside:
- `meet-title` — section title
- `meet-cta` — call-to-action button

Note: `meet-section` is wrapped at HomeContent level (outer). Don't 
double-wrap the outer card.

```javascript
// Same Wrap pattern + 2 inner Wraps
<Wrap id="meet-title">
  <h2>มาทำความรู้จัก ผู้สมัคร</h2>
</Wrap>

<Wrap id="meet-cta">
  <button>...</button>
</Wrap>
```

Update HomeContent to pass props to MeetCandidatesBlock too.

### P2.7 Add hero-status-badge Wrap in HomeContent

Currently `hero-status-badge` controls visibility of `hero-year-badge` 
toggle, but has no Wrap of its own. Decision: either:

**Option A: Wrap hero-status-badge somehow**
- But what does it wrap? It's a toggle for another element
- Doesn't have visual content of its own

**Option B: Remove hero-status-badge from catalog**
- It's redundant with hero-year-badge.visible
- Clean up unused entry

**Recommended: Option B** — remove `hero-status-badge` from catalog. 
The toggle-visibility role can be handled by `hero-year-badge.visible` 
field directly.

**Update:**
```bash
# Remove hero-status-badge from elementInstances.js
# Verify after: catalog count goes 40 → 39 → then +9 from P6+P7 → 48
```

If keeping it: ensure it has visual representation in HomeContent and wrap that.

### P2.8 Verify P2 builds
```bash
npm run build 2>&1 | tail -5
# Expected: PASS

# Wraps added in blocks
grep -c "<Wrap id=" src/components/blocks/StatsBlock.js
# Expected: 3

grep -c "<Wrap id=" src/components/blocks/MeetCandidatesBlock.js  
# Expected: 2
```

---

## P3 — Vote Header Badge (5 min)

### P3.1 Read MultiPartyView around line 70
```bash
view src/components/vote/MultiPartyView.js [view_range: [60, 100]]
```

Identify where to insert vote-header-badge.

### P3.2 Check what badge looks like

Per pageRegistry + catalog: `vote-header-badge` is a `text-label` type in 
section "header". Likely a small label/chip above the main title.

Check if it exists in production:
```bash
grep -B2 -A2 "vote-header-badge\|badge\|header-badge" src/components/vote/MultiPartyView.js
```

If badge isn't rendered in production at all → either:
- Add it (small badge above title)
- Remove from catalog

**Recommended:** Add minimal badge — admin can edit text.

### P3.3 Add Wrap

```jsx
{/* Add ABOVE vote-header-title at line ~70 */}
<Wrap id="vote-header-badge">
  <span className="badge">การลงคะแนน 2569</span>  {/* default text */}
</Wrap>

<Wrap id="vote-header-title">
  <h1>...</h1>
</Wrap>
```

### P3.4 Verify
```bash
grep -c '<Wrap id="vote-header' src/components/vote/MultiPartyView.js
# Expected: 3 (badge + title + subtitle)

npm run build 2>&1 | tail -5
```

---

## P4 — Section Name Normalizations (10 min)

Per Phase 2 Step 2 spec but never applied. Fix now.

### P4.1 Find non-normalized sections
```bash
grep -nE 'section: "voteHeader"|section: "voteBody"|section: "googleForm"' src/components/admin/editor/elementInstances.js
```

Expected matches:
- voteHeader (3 instances)
- voteBody (3+ instances)
- googleForm (1 instance)

### P4.2 Apply changes

```bash
# vote-header-* → section: "header"
# vote-party-card, vote-divider-text → section: "partyGrid"
# vote-abstain-button, vote-disapprove-button → section: "abstainButton"
# success-form-btn → section: "googleFormLink"
```

Use `str_replace` for each. Be specific to avoid wrong replacement:

```javascript
// Example for vote-header-title:
// OLD:
"vote-header-title": {
  ...
  section: "voteHeader",
  ...

// NEW:
"vote-header-title": {
  ...
  section: "header",
  ...
```

Do similar for each affected instance.

### P4.3 Verify
```bash
# Should be ZERO matches for old names:
grep -nE 'section: "voteHeader"|section: "voteBody"|section: "googleForm"[^L]' src/components/admin/editor/elementInstances.js
# Expected: empty

# New normalized names present:
grep -nE 'section: "header"|section: "partyGrid"|section: "abstainButton"|section: "googleFormLink"' src/components/admin/editor/elementInstances.js
# Expected: matches found

npm run build 2>&1 | tail -5
```

After P4, validation cross-reference check in elementCatalog should pass 
(was warning about missing sections before).

---

## P5 — Strip result-card Dynamic Wrap (10 min)

### P5.1 Read ResultsEditorPreview around line 89
```bash
view src/components/admin/ResultsEditorPreview.js [view_range: [80, 105]]
```

### P5.2 Strip dynamic Wrap

```jsx
// OLD:
{candidates.map((candidate, index) => (
  <Wrap key={candidate.id} id={`result-card-${index}`}>
    <CandidateResultCard candidate={candidate} />
  </Wrap>
))}

// NEW:
{candidates.map((candidate, index) => (
  <CandidateResultCard key={candidate.id} candidate={candidate} />
))}
```

**Decision rationale (Z):** Result cards will be redesigned in Phase 3 
templates. Don't create catalog entries for dynamic data. Strip Wrap to 
prevent confusing PropertyPanel that has no entry.

### P5.3 Verify
```bash
grep -n "result-card-" src/components/admin/ResultsEditorPreview.js
# Expected: zero matches (Wrap stripped)

npm run build 2>&1 | tail -5
```

---

## P6 — Add Success Missing Regions (35 min)

This is the biggest sub-step. 7-8 new catalog entries + Wraps.

### P6.1 Read SuccessEditorPreview FULLY
```bash
view src/components/admin/SuccessEditorPreview.js
```

List EVERY visual region with line numbers:

```
Production region                     | Line | Currently wrapped?
---------------------------------------|------|-----------------
Green check icon top                   | ?    | NO
Title h1                               | 63   | YES (success-title)
Subtitle p1                            | 70   | YES (success-subtitle1)
Subtitle p2                            | 77   | YES (success-subtitle2)
Megaphone card outer                   | ?    | NO
Megaphone icon inside card             | ?    | NO
Megaphone title inside card            | ?    | NO  
Megaphone description                  | ?    | NO
Chip 1 (orange/yellow)                 | ?    | NO
Chip 2 (green/pink)                    | ?    | NO
Lock indicator text                    | ?    | NO
Form button (black, bottom)            | 133  | YES (success-form-btn)
Footer "กลับหน้าหลัก"                  | 179  | YES (success-footer)
```

**Read source to fill in line numbers.** Paste actual table in report.

### P6.2 Add new catalog entries

Append to elementInstances.js after existing success-* block.

**Use ONLY default values from production source. Verify each text.**

```javascript
"success-check-icon": {
  id: "success-check-icon",
  typeId: "toggle-visibility",
  name: "ไอคอนเครื่องหมายถูก",
  pages: ["success"],
  section: "successMessage",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: TOGGLE_FIELDS,
  defaultConfig: { visible: true },
  presets: null,
  schemaVersion: "v1"
},

"success-megaphone-card": {
  id: "success-megaphone-card",
  typeId: "card-secondary",
  name: "การ์ดเตือนทำแบบประเมิน",
  pages: ["success"],
  section: "googleFormLink",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: CARD_FIELDS,
  defaultConfig: { 
    backgroundColor: "...",  // READ FROM PRODUCTION CSS
    borderColor: "...",
    borderRadius: "2xl",
    visible: true
  },
  presets: null,
  schemaVersion: "v1"
},

"success-megaphone-title": {
  id: "success-megaphone-title",
  typeId: "text-label",
  name: "หัวข้อใน Megaphone Card",
  pages: ["success"],
  section: "googleFormLink",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: TEXT_FIELDS,
  defaultConfig: { 
    text: "...",  // READ FROM PRODUCTION
    fontSize: "base",
    color: "...",
    fontWeight: "bold",
    align: "left"
  },
  presets: null,
  schemaVersion: "v1"
},

"success-megaphone-desc": {
  id: "success-megaphone-desc",
  typeId: "text-body",
  name: "คำอธิบายใน Megaphone Card",
  pages: ["success"],
  section: "googleFormLink",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: TEXT_FIELDS,
  defaultConfig: { 
    text: "...",
    fontSize: "sm",
    color: "...",
    fontWeight: "normal",
    align: "left"
  },
  presets: null,
  schemaVersion: "v1"
},

"success-chip-1": {
  id: "success-chip-1",
  typeId: "button-badge",
  name: "Chip Badge 1",
  pages: ["success"],
  section: "googleFormLink",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: BUTTON_FIELDS,
  defaultConfig: { 
    text: "...",
    backgroundColor: "...",
    textColor: "...",
    borderRadius: "full"
  },
  presets: null,
  schemaVersion: "v1"
},

"success-chip-2": {
  id: "success-chip-2",
  typeId: "button-badge",
  name: "Chip Badge 2",
  pages: ["success"],
  section: "googleFormLink",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: BUTTON_FIELDS,
  defaultConfig: { 
    text: "...",
    backgroundColor: "...",
    textColor: "...",
    borderRadius: "full"
  },
  presets: null,
  schemaVersion: "v1"
},

"success-lock-indicator": {
  id: "success-lock-indicator",
  typeId: "text-body",
  name: "ข้อความแจ้งล็อก",
  pages: ["success"],
  section: "googleFormLink",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: TEXT_FIELDS,
  defaultConfig: { 
    text: "...",  // READ FROM PRODUCTION
    fontSize: "xs",
    color: "...",
    fontWeight: "normal",
    align: "center"
  },
  presets: null,
  schemaVersion: "v1"
},
```

**CRITICAL:** All "..." placeholders MUST be filled with actual values 
from SuccessEditorPreview.js. NO PLACEHOLDERS in final code (P-LOG-005).

### P6.3 Add Wraps in SuccessEditorPreview.js

Wrap each region. Note: megaphone-card contains nested Wraps (chips, title, etc).

```jsx
{/* Top icon */}
<Wrap id="success-check-icon">
  <div className="...check icon...">
    <CheckIcon />
  </div>
</Wrap>

<Wrap id="success-title">...</Wrap>     {/* existing */}
<Wrap id="success-subtitle1">...</Wrap> {/* existing */}
<Wrap id="success-subtitle2">...</Wrap> {/* existing */}

{/* Megaphone card with NESTED Wraps */}
<Wrap id="success-megaphone-card">
  <div className="megaphone-card-container">
    <div className="icon">
      <MegaphoneIcon />
    </div>
    
    <Wrap id="success-megaphone-title">
      <h3>...</h3>
    </Wrap>
    
    <Wrap id="success-megaphone-desc">
      <p>...</p>
    </Wrap>
    
    <div className="chips-row">
      <Wrap id="success-chip-1">
        <span className="chip-1">...</span>
      </Wrap>
      <Wrap id="success-chip-2">
        <span className="chip-2">...</span>
      </Wrap>
    </div>
    
    <Wrap id="success-lock-indicator">
      <div className="lock-indicator">...</div>
    </Wrap>
  </div>
</Wrap>

<Wrap id="success-form-btn">...</Wrap>  {/* existing */}
<Wrap id="success-footer">...</Wrap>    {/* existing */}
```

**Nested Wrap behavior:** Click on inner element (e.g., chip-1) should 
select chip-1, not outer card. EditorElement should already handle this 
via event propagation. If not — DON'T modify EditorElement, just verify 
in manual test (P10).

### P6.4 Verify P6
```bash
grep -c '<Wrap id="success-' src/components/admin/SuccessEditorPreview.js
# Expected: 12 (5 existing + 7 new)

grep -oP '<Wrap[[:space:]]+id="success-[^"]+"' src/components/admin/SuccessEditorPreview.js | sort -u
# Expected: 12 unique IDs (paste list)

grep -c '"success-' src/components/admin/editor/elementInstances.js
# Expected: 12 (5 existing + 7 new entries)

npm run build 2>&1 | tail -5
```

---

## P7 — Add closed-lock-icon (5 min)

### P7.1 Add catalog entry

In elementInstances.js, append:
```javascript
"closed-lock-icon": {
  id: "closed-lock-icon",
  typeId: "toggle-visibility",
  name: "ไอคอนล็อก",
  pages: ["closed"],
  section: "closedMessage",
  boundTo: null,
  isStateful: false,
  stateResolverKey: null,
  states: null,
  propertyFields: TOGGLE_FIELDS,
  defaultConfig: { visible: true },
  presets: null,
  schemaVersion: "v1"
},
```

### P7.2 Add Wrap in ClosedEditorPreview.js

```jsx
{/* Top of card, before title */}
<Wrap id="closed-lock-icon">
  <div className="...lock icon container...">
    <Lock />
  </div>
</Wrap>

{/* Existing Wraps stay */}
<Wrap id="closed-title">...</Wrap>
<Wrap id="closed-description">...</Wrap>
<Wrap id="closed-detail">...</Wrap>
<Wrap id="closed-back-btn">...</Wrap>
```

### P7.3 Verify
```bash
grep -c '<Wrap id="closed-' src/components/admin/ClosedEditorPreview.js
# Expected: 5 (4 existing + 1 new)

grep -c '"closed-' src/components/admin/editor/elementInstances.js
# Expected: 5 (4 existing + 1 new)
```

---

## P8 — Remove Party from EDITABLE_PAGES (5 min)

Per Decision B — party page implementation is Phase 4.

### P8.1 Find EDITABLE_PAGES
```bash
grep -n "EDITABLE_PAGES\|editablePages" src/components/admin/PageDesignTab.js
grep -n "EDITABLE_PAGES" src/utils/pageRegistry.js
```

### P8.2 Remove 'party' from list

```javascript
// In PageDesignTab.js (or wherever defined):
// OLD:
const EDITABLE_PAGES = ['home', 'vote', 'results', 'candidates', 'party', 'closed', 'success'];

// NEW:
const EDITABLE_PAGES = ['home', 'vote', 'results', 'candidates', 'closed', 'success'];
// Note: 'party' removed — Phase 4 will add back when implemented
```

Add a comment explaining why.

### P8.3 Verify
```bash
grep -A2 "EDITABLE_PAGES" src/components/admin/PageDesignTab.js
# Confirm 'party' not in list

npm run build 2>&1 | tail -5
```

Admin UI should now show 6 page tabs (not 7).

---

## P9 — Delete Dead HomeEditorPreview (5 min)

### P9.1 Verify it's truly dead
```bash
# Confirm no imports anywhere
grep -rn "from ['\"].*editor/previews/HomeEditorPreview['\"]" src/ --include="*.js" --include="*.jsx"
grep -rn "import.*HomeEditorPreview" src/ --include="*.js" --include="*.jsx" | grep -v "src/components/admin/HomeEditorPreview"
```

If ANY import exists → don't delete. Report.

### P9.2 Delete
```bash
git rm src/components/admin/editor/previews/HomeEditorPreview.js
# or
rm src/components/admin/editor/previews/HomeEditorPreview.js
```

### P9.3 Verify build
```bash
npm run build 2>&1 | tail -5
# Expected: PASS (no imports broke)
```

If `src/components/admin/editor/previews/` directory becomes empty:
```bash
rmdir src/components/admin/editor/previews/ 2>/dev/null
```

---

## P10 — Comprehensive Manual Test (20 min)

Per P-LOG-009 — verify region-by-region in browser.

```bash
npm run dev
```

Open admin → ออกแบบหน้าเว็บ. Test EACH region:

### Home page (15 elements expected)
```
[ ] hero-title — click → PropertyPanel text fields
[ ] hero-subtitle — click → PropertyPanel
[ ] hero-subtitle2 — click → PropertyPanel
[ ] hero-year-badge — click → PropertyPanel  
[ ] hero-countdown — click → StatefulGallery (5 states)
[ ] stats-header (NEW) — click → PropertyPanel ✨
[ ] stats-voted-card — click → PropertyPanel
[ ] stats-progress-card (NEW) — click → PropertyPanel ✨
[ ] stats-eligible-card (NEW) — click → PropertyPanel ✨
[ ] voteCTA-button — click → StatefulGallery (6 states)
[ ] meet-section — click → PropertyPanel
[ ] meet-title (NEW) — click → PropertyPanel ✨
[ ] meet-cta (NEW) — click → PropertyPanel ✨
[ ] banner-section — click → PropertyPanel
```

If `hero-status-badge` was removed: -1 = 14 total clickable.

### Vote page (7 elements expected)
```
[ ] vote-header-badge (NEW) — click → PropertyPanel ✨
[ ] vote-header-title — click → PropertyPanel
[ ] vote-header-subtitle — click → PropertyPanel
[ ] vote-party-card — click → PropertyPanel (first card only)
[ ] vote-divider-text — click → PropertyPanel
[ ] vote-abstain-button — click → PropertyPanel
[ ] (vote-disapprove-button — single-party scenario only)
```

### Results page (4 elements)
```
[ ] results-header — click
[ ] results-stats-bar — click
[ ] results-candidates-heading — click
[ ] results-demographics — click
[ ] (result-card-N — should NOT be clickable after P5 strip)
```

### Candidates page (5 elements)
```
[ ] candidates-tagline — click
[ ] candidates-title — click
[ ] candidates-subtitle — click
[ ] candidates-counter — click
[ ] candidates-party-card — click (first card only)
```

### Success page (12 elements)
```
[ ] success-check-icon (NEW) — click ✨
[ ] success-title — click
[ ] success-subtitle1 — click
[ ] success-subtitle2 — click
[ ] success-megaphone-card (NEW) — click outer card ✨
[ ] success-megaphone-title (NEW) — click ✨
[ ] success-megaphone-desc (NEW) — click ✨
[ ] success-chip-1 (NEW) — click ✨
[ ] success-chip-2 (NEW) — click ✨
[ ] success-lock-indicator (NEW) — click ✨
[ ] success-form-btn — click
[ ] success-footer — click
```

### Closed page (5 elements)
```
[ ] closed-lock-icon (NEW) — click ✨
[ ] closed-title — click
[ ] closed-description — click
[ ] closed-detail — click
[ ] closed-back-btn — click
```

### Party tab
```
[ ] Tab is HIDDEN from EDITABLE_PAGES list ✨
    (Should NOT be visible in admin)
```

### Validation console
```
[ ] [elementCatalog] ✓ Validation passed: N instances, 16 types
    (N depends on hero-status-badge decision: 47 or 48)
```

### Production page test
```
[ ] /home renders normally
[ ] /vote renders normally
[ ] /results renders normally
[ ] /candidates renders normally
[ ] /success renders normally
[ ] /closed renders normally
[ ] /party — still accessible to public users (just not editable in admin)
```

**ANY failed region must be addressed before declaring complete.**

---

## P11 — Documentation (10 min)

### P11.1 Update PROGRESS.md
```markdown
# Phase 2.6 Complete

True editor coverage achieved. All admin editor pages have ALL catalog 
entries reachable. 

Catalog total: 48 instances (or 47 if hero-status-badge removed)
All 6 admin tabs: clickable region-by-region (verified manually)

Party page: removed from EDITABLE_PAGES — Phase 4 will implement.
Dead code (HomeEditorPreview.js in editor/previews/) deleted.

Resume next session: Phase 3 (Canva templates) per PHASE3_TEMPLATE_VISION.md
```

### P11.2 Update MASTER_PLAN.md
```markdown
## Phase 2.6: H-EDITOR-TRUE-COMPLETION ✅ COMPLETE 2026-05-XX

- Fixed 6 unreachable catalog entries in home (StatsBlock, MeetCandidatesBlock wraps)
- Added vote-header-badge Wrap  
- Applied section normalizations (voteHeader → header, etc.)
- Stripped result-card dynamic orphan Wrap
- Added 7 success page entries (icon, card, 2 chips, etc.)
- Added closed-lock-icon
- Removed party from EDITABLE_PAGES (defer to Phase 4)
- Deleted dead editor/previews/HomeEditorPreview.js

Phase 2 truly complete now.

Project Progress (Visual):
Phase 1   [████████████████] 100% ✅
Phase 1.5 [████████████████] 100% ✅
Phase 2   [████████████████] 100% ✅
Phase 2.5 [████████████████] 100% ✅ (superseded by 2.6)
Phase 2.6 [████████████████] 100% ✅ ← TRUE editor completion
Phase 3   [██░░░░░░░░░░░░░░] 10%
Phase 4   [░░░░░░░░░░░░░░░░] 0%
```

### P11.3 Append P-LOG-010 and P-LOG-011 to DECISIONS.md

```markdown
### P-LOG-010: [2026-05-XX] Phase 2.6 — Verify Actual Renderer, Not Assumed One

Trigger: Adding editor coverage (Wraps + catalog) for any page.

Anti-pattern:
Trust file name ("HomeEditorPreview.js exists, must be used") and add 
Wraps there. Phase 2 wrapped a dead-code file because no one verified 
PageDesignTab routing. Result: home page had 15 Wraps in unused file 
and 5+4 Wraps in actual renderer (HomeContent.js).

Correct pattern:
Before adding/auditing Wraps on any page:
1. Read PageDesignTab.renderPreview to find which component actually renders
2. Grep for that component's Wrap definitions
3. Confirm chain end-to-end (preview file → actual renderer)
4. Verify in dev mode that catalog validation shows entries from real renderer

Detection:
Catalog entries that have NO Wrap anywhere in the actually-rendered 
component = unreachable. Cross-reference via:
  for each catalog ID: grep '<Wrap id="$id"' in production files

Tags: #renderer #routingVerification #deadCodeRisk

---

### P-LOG-011: [2026-05-XX] Phase 2.6 — Verify Spec Compliance Field-by-Field, Not Just Count

Trigger: Auditing post-execution reports for refactor steps.

Anti-pattern:
Step 2 spec said "apply section normalizations (voteHeader → header)".
Step 2 report said "section normalizations applied".
Audit accepted at face value.
Reality: normalizations were NOT applied — section fields kept old names.

Correct pattern:
For any "apply transformation X" task, verify by checking actual values 
post-execution, not just by reading the report. Example greps for 
section normalizations:
  grep "section: \"voteHeader\"" elementInstances.js  → should be 0
  grep "section: \"header\"" elementInstances.js       → should be 3+

Always include such verification commands in the spec's REPORT FORMAT 
section so they're forced.

Detection:
Audit reports asking "what did you change?" instead of "show me the diff":
- Audit: ❌ Trust without verify
- Audit: ✅ Grep actual values + cross-reference spec

Tags: #specCompliance #auditing #verification

---

### P-LOG-012: [2026-05-XX] Phase 2.6 — Scan Block/Component Recursively, Not Just Direct Files

Trigger: Coverage audits for editor Wraps.

Anti-pattern:
Grep `<Wrap` in EditorPreview files only. Miss the fact that 
HomeContent.js renders block components (StatsBlock, MeetCandidatesBlock) 
which contain UI elements but ZERO Wraps. Result: 6 unreachable catalog 
entries hidden inside block components.

Correct pattern:
For coverage audits, scan ALL files that could render Wraps:
1. Direct EditorPreview files
2. Production components those previews render
3. Block / sub-components those production files render
4. Continue recursively until reaching leaf components

Detection:
Map every catalog ID to a specific file:line where its Wrap exists. 
Catalog IDs without an entry in that map = unreachable.

Tags: #coverage #recursiveScan #blockComponents
```

### P11.4 Commit Phase 2.6
```bash
git add -A
git status  # review

git commit -m "Phase 2.6: True editor completion — all catalog entries reachable

- Wrapped block components (StatsBlock, MeetCandidatesBlock) — 5 new wraps
- Added vote-header-badge Wrap in MultiPartyView
- Applied section normalizations (voteHeader→header, voteBody→partyGrid+abstainButton, googleForm→googleFormLink)
- Stripped result-card-N dynamic orphan Wrap
- Added 7 success page entries + Wraps (icon, card, chips, etc.)
- Added closed-lock-icon
- Removed party from EDITABLE_PAGES (Phase 4 will implement)
- Deleted dead editor/previews/HomeEditorPreview.js
- Added P-LOG-010, P-LOG-011, P-LOG-012

Phase 2 now truly complete — all 6 admin tabs have ALL catalog entries 
reachable via click in browser. Verified region-by-region per P-LOG-009."
```

---

## REPORT FORMAT (per P-LOG-003)

```
=== PHASE 2.6 H-EDITOR-TRUE-COMPLETION — COMPLETION REPORT ===

P0 Pre-flight: PASS
[paste baseline build]

P1 Renderer verification: 
[paste actual routing code from PageDesignTab.renderPreview]

P2 Block wraps:
- StatsBlock.js: 3 Wraps added (paste grep result)
- MeetCandidatesBlock.js: 2 Wraps added (paste grep result)  
- HomeContent.js: hero-status-badge decision (removed/wrapped)
[paste grep verifications]

P3 Vote header badge:
[paste grep showing Wrap added]

P4 Section normalizations:
$ grep "section: \"voteHeader\"" elementInstances.js
(empty)
$ grep "section: \"header\"" elementInstances.js  
[N matches]
[similar for other normalizations]

P5 result-card stripped:
$ grep "result-card-" ResultsEditorPreview.js
(empty)

P6 Success page:
- 7 new catalog entries: [list IDs]
- 7 new Wraps in SuccessEditorPreview
- Total success Wraps: 12 (was 5)
[paste verification]

P7 Closed lock icon:
- 1 new catalog entry: closed-lock-icon
- 1 new Wrap
- Total closed Wraps: 5 (was 4)

P8 Party removed from EDITABLE_PAGES:
[paste EDITABLE_PAGES current value]

P9 Dead code deleted:
[paste rm output + verification]

P10 Manual test results:
- Home: [N/15] clickable (with checkboxes)
- Vote: [N/7] clickable
- Results: [N/4] clickable
- Candidates: [N/5] clickable
- Success: [N/12] clickable
- Closed: [N/5] clickable
- Validation log: [paste]

P11 Documentation:
- PROGRESS.md updated
- MASTER_PLAN.md Phase 2.6 marked ✅
- DECISIONS.md appended P-LOG-010, 011, 012

=== Final State ===
Total catalog: 47 or 48 instances (specify)
All entries reachable via click: ✅
Build: PASS / 29 pages
Phase 2 TRULY complete

=== Status: PHASE 2.6 COMPLETE ===
```

---

## DO NOT

- Do NOT skip P1 — must verify renderer routing first
- Do NOT add Wraps in `editor/previews/HomeEditorPreview.js` (dead code, will be deleted)
- Do NOT use placeholder text in catalog entries — read production
- Do NOT skip section normalizations — they were missed in Phase 2
- Do NOT remove `party` page entirely — just from EDITABLE_PAGES (it's still a user-facing page)
- Do NOT proceed to P10 (manual test) without all P1-P9 building
- Do NOT claim complete from build pass alone — manual test is mandatory (P-LOG-009)
- Do NOT modify EditorElement.js, templateEngine.js, stateResolver.js
- Do NOT touch consumer files from Step 3 (HomeContent imports — except for prop passing to blocks)
- Do NOT install new packages
- Do NOT add type tier system or CSS overrides — that's Phase 3 scope

---

## FAILURE HANDLING

### If block components don't receive editor props
- HomeContent might not pass them through
- Trace: HomeContent gets props (yes) → passes to blocks (probably no)
- Add prop passing to HomeContent's block invocations

### If Wrap inside block selects whole block (wrong target)
- Event propagation issue
- Test in browser: does clicking stats-header select stats-voted-card?
- If yes: outer Wrap intercepts. Need stopPropagation in inner Wrap
- ONLY add if confirmed problem

### If validateCatalog warns about section mismatches after P4
- Catalog section name doesn't match pageRegistry
- Re-check P4 normalizations — may have missed some

### If party tab still shows after P8
- EDITABLE_PAGES not the right constant
- Find what filter populates the tabs

### If manual test reveals more missing regions
- Document but don't try to fix in this step
- May require Phase 2.7 if extensive
- For minor: add to spec and continue

---

## End of Phase 2.6 Spec

After this step: Phase 2 is TRULY complete with verified user-facing coverage.

Next session decision points after Phase 2.6:

```
Option A: Phase 3 — Canva-Style Template System (recommended)
  - Per PHASE3_TEMPLATE_VISION.md
  - ~10-12 hours
  - Fixes Phase 2 deferred bugs (template apply, neon button)
  - Major UX win

Option B: Phase 4 — Party Page + Libraries
  - /party?id=N editor
  - Component Library + Image Library
  - ~15-20 hours

Option C: UX Polish + Production hardening
  - Performance optimization
  - Loading states
  - Error boundaries
  - A11y audit
  - ~3-5 hours

Recommendation: A (Phase 3) — biggest user impact + fixes existing gaps.
```
