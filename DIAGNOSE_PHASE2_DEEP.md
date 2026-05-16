# DIAGNOSE_PHASE2_DEEP.md — Validate State for Type-Instance Refactor

## READ FIRST
Read `CLAUDE.md` (with Engineering Discipline section), `DECISIONS.md` 
(P-LOG-001 to P-LOG-004), `MASTER_PLAN.md`. Follow discipline rules strictly.

## TASK
Diagnose only — DO NOT modify any file. Validate prior diagnosis findings 
and gather missing data needed for type-instance architecture refactor.

## CONTEXT
Prior diagnosis (DIAGNOSE_PHASE2_START) provided structural overview. This 
deep diagnosis confirms current state before atomic 4-step refactor and 
gathers data specific to type-instance separation:
- Map current "element ID = registry key" semantics → instance-based
- Identify potential cross-page reuse opportunities
- Verify section normalization safety
- Catch any edge cases not in prior diagnosis

## INVESTIGATION

### Section 1: Reaffirm registry counts

Run grep + count:
```bash
# Count entries in each registry
grep -c "^  \"" src/components/admin/editor/elementRegistry.js
grep -c "^  \"" src/components/admin/editor/statefulRegistry.js
grep -c "^    \"" src/components/admin/editor/PropertyPanel.js
```

Report actual counts. Prior diagnosis said:
- elementRegistry: 21 entries
- statefulRegistry: 2 entries (voteCTA-button, hero-countdown)
- EXTRA_ELEMENTS_SCHEMA: 10 entries

Verify these numbers.

### Section 2: Cross-page reuse potential

For each element, check if its visual/semantic role appears on multiple 
pages currently. Examples to consider:

- **page-title** pattern: vote-header-title, candidates-title, results-heading 
  — these are similar visually. Could become ONE type "page-title" with 
  multiple instances.
- **abstain-button** pattern: vote-abstain-button could appear on /party 
  (single-party flow) too.
- **stats-card** pattern: stats-voted-card, stats-progress-card, 
  stats-eligible-card — same type, different config.

Report:
1. **Truly single-instance types** (only used once, e.g., banner-section)
2. **Multi-instance types within same page** (e.g., 3 stats cards = same type)
3. **Cross-page reuse candidates** (same type on different pages)

This determines:
- Which IDs become TYPE definitions (one per visual pattern)
- Which IDs become INSTANCE definitions (placement-specific)

### Section 3: Existing config divergence audit

For potential type-instance conversions, check if 2 instances of "same" 
type currently have DIFFERENT configs that would conflict.

Example:
- vote-header-title presets vs candidates-title default
- stats-voted-card presets vs stats-progress-card presets

Report config divergences. Major divergence = keep separate types.

### Section 4: PropertyPanel field schema source

Currently, PropertyPanel decides which fields to show based on `element.type` 
("text", "button", "card", etc.). For type-instance refactor, we want 
`propertyFields[]` array on the TYPE definition.

Read PropertyPanel.js render logic (around the fields rendering switch). 
Show:
1. The switch/conditional logic that decides which inputs to show per type
2. Field-to-control mapping (e.g., "color" → ColorPickerInput, "text" → TextInput)
3. Any fields that are TYPE-SPECIFIC (e.g., card has borderColor, text has fontSize)

This data feeds the `propertyFields[]` schema in elementTypes.

### Section 5: Layout/responsive constraints (currently)

Check if any component currently has hardcoded layout constraints:
- minWidth, maxWidth
- Different layout per breakpoint
- Container queries

Search for:
```bash
grep -rn "min-w-\|max-w-\|sm:\|md:\|lg:" src/components/admin/ | head -50
```

Report patterns. Phase 2.5 will formalize, but Phase 2 needs to know what 
constraints exist informally.

### Section 6: Stateful element deep dive

For voteCTA-button and hero-countdown, identify:
1. **State trigger logic** — what code determines current state at runtime?
   - voteCTA-button: useSession + useVoteSystem checks?
   - hero-countdown: time comparison?
2. **State transitions** — can state change while user is on page?
3. **Per-state config completeness** — are all states fully defined?

This informs how to structure `stateResolverKey` in type definition.

### Section 7: Template-element coverage matrix

Current templates cover only stateful elements. For each non-stateful 
element (29 entries), it uses `presets[templateName]` instead.

Report:
- Elements where presets are IDENTICAL across all 4 templates (could 
  collapse to defaultConfig only)
- Elements where presets DIFFER significantly (must keep)
- Stateful elements that templates don't cover yet (future migrations)

### Section 8: Naming convention verification

Confirm normalization mapping is safe:
- voteHeader (3 elements) → header: ✓ no collision (results, candidates 
  also use "header" but for different elements)
- voteBody → partyGrid + abstainButton split: which 2 elements go to 
  partyGrid, which 1 to abstainButton?
- googleForm → googleFormLink: only 1 element affected

Verify by listing every section name across all 3 sources before/after.

### Section 9: ID convention for instances

Decide ID convention for instances after refactor:

**Option 1: keep current IDs unchanged** (backward compat)
- "hero-title" stays "hero-title"
- It's an instance of type "hero-title-type" or "type:text-hero"

**Option 2: rename to instance-style**
- "hero-title" → "hero-title-home" 
- Type is "type:hero-title"

Recommend with rationale.

### Section 10: Backward compatibility surface area

Find ALL code that:
1. Imports from elementRegistry/statefulRegistry → needs update
2. Reads `element.type`, `element.section`, etc. directly → needs to handle new shape
3. Uses element ID as a string in render logic (e.g., `if (id === "hero-title")`)

Search:
```bash
grep -rn "element.type\|element\[.type.\]" src/
grep -rn '"hero-title"\|"voteCTA-button"' src/
grep -rn 'elementRegistry\|statefulRegistry' src/
```

Report all callsites that need adaptation.

## OUTPUT FORMAT

```
=== Section 1: Counts (verified) ===
elementRegistry: ___ entries
statefulRegistry: ___ entries  
EXTRA_ELEMENTS_SCHEMA: ___ entries
Total unique elements: ___ (after dedup of voteCTA-button, hero-countdown)

=== Section 2: Cross-page reuse potential ===
Truly single-instance types: [list]
Multi-instance same-page: [list with counts]
Cross-page reuse candidates: [list with rationale]

=== Section 3: Config divergence ===
Candidates for type unification:
  type "page-title": instances vote-header-title, candidates-title 
    Diverge in: [fields]
  ...

=== Section 4: PropertyPanel fields ===
Type "text" fields: [list]
Type "button" fields: [list]
Type "card" fields: [list]
Type "image" fields: [list]
Type "toggle" fields: [list]
Type "countdown" fields: [list]

=== Section 5: Layout constraints ===
Patterns found: [...]

=== Section 6: Stateful logic ===
voteCTA-button:
  State trigger: ___
  Transitions: ___
hero-countdown:
  State trigger: ___
  Transitions: ___

=== Section 7: Template-element matrix ===
Identical across templates: [list]
Diverge significantly: [list]

=== Section 8: Naming verification ===
voteHeader → header:
  Pre-collision check: [result]
voteBody split:
  → partyGrid (cards): [list]
  → abstainButton: [list]

=== Section 9: ID convention recommendation ===
Recommend: Option 1 (keep IDs) or Option 2 (rename)
Rationale: ___

=== Section 10: Backward compat surface ===
Files importing from old registries: [list]
Files reading element.type directly: [list]
Files with ID-string conditionals: [list]
Total LOC to update: ___

=== RECOMMENDATIONS ===

For Path A type-instance refactor, propose:

1. ID convention: keep current IDs (Option 1) — minimize churn, treat 
   current IDs as instance IDs, derive type IDs from instance category

2. Type definitions count: ___ types (after collapsing duplicate visual patterns)

3. Instance definitions count: 31 instances (1:1 with current entries)

4. Migration safety: [LOW/MED/HIGH]

5. Recommended step ordering:
   Step 2 (CORE): Create elementTypes.js + elementInstances.js + helpers
   Step 3 (WIRE): Update 7 consumers
   Step 4 (CLEANUP): Delete old files
   
6. Risks identified:
   - [risk 1]
   - [risk 2]
```

## DO NOT
- DO NOT modify any file
- ONLY read and report
- Per P-LOG-003: be thorough, paste actual code excerpts not summaries
