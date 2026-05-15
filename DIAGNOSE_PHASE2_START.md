# DIAGNOSE_PHASE2_START.md — Foundation State Before H-CATALOG Batch

## READ FIRST
Read `CLAUDE.md` (with Engineering Discipline section), `DECISIONS.md` 
(with P-LOG-001 through P-LOG-004), and `MASTER_PLAN.md`. Follow the 
discipline rules strictly.

## TASK
Diagnose only — DO NOT modify any file. Read and report comprehensively. 
This diagnosis informs the H-CATALOG mega-batch step.

## CONTEXT
After Phase 1.5 completion, foundation gaps identified for Phase 2:

1. **2 separate registries** — elementRegistry (21 elements) + 
   statefulRegistry (2 elements) → drift risk
2. **resolveStatefulConfig fallback gap** — when template exists but 
   element missing, returns {} instead of defaultConfig
3. **Section name mismatch** — pageRegistry uses one naming, 
   elementRegistry uses another
4. **No `pages[]` field on elements** — can't query "all elements on home"
5. **No `category` field** — Component Library can't filter
6. **EXTRA_ELEMENTS_SCHEMA in PropertyPanel** — candidates-* elements 
   exist there but not in elementRegistry → fragmented schema source

This batch fixes all 6 — but first we need precise structural map.

## INVESTIGATION

### Section 1: elementRegistry.js full audit

Read `src/components/admin/editor/elementRegistry.js`. Report:

1. **Full structure** — show the export shape (e.g., array of objects, 
   keyed object). Include 2-3 sample entries verbatim.

2. **All registered elements** — list IDs and their schema fields:
   ```
   ID                          | section          | type   | boundTo (if any) | other fields
   hero-title                  | heroSection      | text   | electionName     | ...
   ...
   ```

3. **Helper functions exported** — getBinding, getElementMeta, 
   getElementsBySection, etc. Show signatures.

### Section 2: statefulRegistry.js full audit

Read whatever file contains statefulRegistry (likely 
`src/components/admin/editor/statefulRegistry.js` or similar). Report:

1. **Full structure** — how is it different from elementRegistry?
2. **All entries** — which elements are stateful + what states each has
3. **Helper functions** — resolveStatefulConfig, getStateDefinitions, etc.
4. **The fallback gap** — show the actual code in resolveStatefulConfig 
   where it falls back to {} when template/element combo missing

### Section 3: pageRegistry.js full audit

Read `src/utils/pageRegistry.js`. Report:

1. **EDITABLE_PAGES** — full array, each page entry with all fields
2. **SECTION_LABELS** — full export
3. **Helper functions** — getPageById, etc.
4. **Section names used** — list all section IDs across all pages

### Section 4: Section name mismatch detection

Cross-reference Section 1 (elementRegistry sections) with Section 3 
(pageRegistry sections).

For each page:
```
Page: home
  pageRegistry sections: ["hero", "stats", "voteCTA", "meet"]
  elementRegistry sections (where elements have section field): 
    ["heroSection", "statsSection", "voteCTASection", "meetSection"]
  Mismatches: ALL — pageRegistry uses short names, elementRegistry uses *Section suffix
```

Repeat for vote, results, candidates, closed, success.

### Section 5: defaultConfig presence

For each element in elementRegistry, does it have a `defaultConfig` field 
(used as fallback when template doesn't define an override)?

Report:
- Elements WITH defaultConfig: [list]
- Elements WITHOUT defaultConfig: [list]
- Elements that should have one but don't (per Phase 2 plans): [list]

### Section 6: EXTRA_ELEMENTS_SCHEMA in PropertyPanel

Read `src/components/admin/editor/PropertyPanel.js`. Find 
EXTRA_ELEMENTS_SCHEMA (around line 29-41 per prior diagnosis).

Report:
1. Full content
2. Which element IDs are defined there
3. Which of these are MISSING from elementRegistry.js
4. What fields each EXTRA entry has (compare to elementRegistry shape)

### Section 7: Consumer audit

Find all files that import from elementRegistry, statefulRegistry, or use 
their helpers. Report:

```
File                                       | What it imports/uses
src/components/HomeContent.js              | getBinding, isBoundElement
src/components/admin/editor/PropertyPanel.js | getElementMeta, EXTRA_ELEMENTS_SCHEMA
... etc
```

This tells us what code needs updating during the refactor.

### Section 8: Template structure

Read whatever file contains template definitions (likely 
`src/components/admin/editor/templates.js` or `getPresetDefaults` source).

Report:
1. **Template structure** — what's the shape of a template?
2. **Templates available** — list each (Classic, Modern Dark, Playful, 
   Minimal, etc.) and its element overrides
3. **resolveStatefulConfig caller** — where is it called from? Show the 
   call site + what happens on {} fallback (any silent UI issue?)

### Section 9: Current category usage (if any)

Search the codebase for any existing "category" field on elements 
(searched: 'category:'). Report findings.

This determines if we need to ADD category from scratch or if there's 
already an informal categorization.

### Section 10: pages[] field equivalent

Each element currently has `section` (singular). For Phase 2 we want 
`pages[]` (which pages this element appears on, for cross-page query).

Currently this is implicit — by checking which page's renderer uses the 
element ID. Report:
- Elements that appear on MULTIPLE pages (if any)
- Elements pinned to single page (most)

This informs migration: defaults pages = [section_implies_page].

## OUTPUT FORMAT

```
=== Section 1: elementRegistry.js ===
Structure: [array | object | other]
Sample entries:
  [...3 entries verbatim...]

Full element list (21 entries):
ID                  | section       | type    | boundTo       | hasDefaultConfig
hero-title          | heroSection   | text    | electionName  | yes
hero-subtitle       | heroSection   | text    | campaignTitle | yes
...

Helper functions:
- getBinding(id) → returns boundTo or null
- ...

=== Section 2: statefulRegistry.js ===
Location: src/...
Structure: ___
Entries:
  result-card: 3 states (waiting, hidden, score)
  hero-countdown: 4 states (...)

Helpers:
- resolveStatefulConfig(elementId, state, templateId) — line ___:
  [show the function body, especially fallback branch]

Fallback gap (line ___):
```js
if (!template[elementId]) return {};   // ← BUG: should fall to defaultConfig
```

=== Section 3: pageRegistry.js ===
EDITABLE_PAGES (6 entries):
  home: { columns: { main: ["hero", "stats", "voteCTA", "meet"] }, ... }
  vote: { columns: { main: ["header", "partyGrid", "abstainButton"] }, ... }
  ... etc

SECTION_LABELS:
  hero: "Hero (Countdown + Title)"
  stats: "สถิติผู้โหวต (Stats)"
  ...

=== Section 4: Section name mismatch ===
Page: home
  pageRegistry: ["hero", "stats", "voteCTA", "meet"]
  elementRegistry: ["heroSection", "statsSection", "voteCTASection", "meetSection"]
  Mismatches: 4/4 — all use *Section suffix

[repeat for all 6 pages]

=== Section 5: defaultConfig presence ===
WITH defaultConfig (n): [list]
WITHOUT defaultConfig (n): [list]
SHOULD have but don't: [list]

=== Section 6: EXTRA_ELEMENTS_SCHEMA ===
Location: PropertyPanel.js line ___
Full content:
```js
const EXTRA_ELEMENTS_SCHEMA = {
  'candidates-tagline': { ... },
  ...
};
```
Element IDs defined: [list]
Missing from elementRegistry: [list]
Schema shape comparison: [compatible | divergent — explain]

=== Section 7: Consumer audit ===
Files importing elementRegistry: [count + list]
Files importing statefulRegistry: [count + list]
Combined: [union, deduplicated — these need updating in refactor]

=== Section 8: Templates ===
Template file: src/...
Template count: ___
Sample template structure:
```js
{
  id: 'classic',
  name: 'คลาสสิก',
  elements: { 'hero-title': { color: '#...' }, ... }
}
```

resolveStatefulConfig called from:
- file:line — context

=== Section 9: Existing category usage ===
[matches found or "none — need to add from scratch"]

=== Section 10: Cross-page elements ===
Multi-page elements: [list — likely SiteFooter, Navbar elements only]
Single-page (most): [counts per page]

=== RECOMMENDATIONS ===

For H-CATALOG mega-batch:

1. **New file:** `src/components/admin/editor/elementCatalog.js`
   - Export: `ELEMENTS` (combined registry), helpers (getElement, getByPage, getByCategory, etc.)
   - Include both regular + stateful elements
   - Add fields: pages[] (array), category (string), states[] (for stateful only)
   - defaultConfig for every element

2. **Migration mapping:**
   elementRegistry entries  → ELEMENTS with `category: 'static'`
   statefulRegistry entries → ELEMENTS with `category: 'stateful'`, `states: [...]`
   EXTRA_ELEMENTS_SCHEMA    → ELEMENTS with appropriate category

3. **Fallback fix:**
   resolveStatefulConfig (or new resolveConfig) returns:
     templateOverride || elementCatalog[id].defaultConfig || {}
   (instead of just {})

4. **Section normalization:**
   Decide on canonical naming:
   Option A: short ("hero", "stats", "voteCTA")
   Option B: suffix ("heroSection", "statsSection")
   Recommend: ___

5. **Backward compat shims (optional):**
   elementRegistry.js / statefulRegistry.js re-export from elementCatalog 
   for transition period — OR delete and update all imports atomically.
   Recommend: ___

6. **Files needing updates:** [list from Section 7]

7. **Estimated complexity:** S/M/L
   Risks: [list any concerning patterns found]
```

## DO NOT
- DO NOT modify any file
- DO NOT install anything
- ONLY read and report
- Per P-LOG-003 discipline: NO grep verification needed for read-only diagnose, 
  but DO be thorough — paste actual code excerpts not summaries
