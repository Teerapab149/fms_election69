# DIAGNOSE_EXTENSIBILITY.md — System Extensibility Audit for Master Plan

## READ FIRST
Read `CLAUDE.md`, `DECISIONS.md`, and `PROJECT_PLAN.md` first.

## TASK
Diagnose only — DO NOT modify any file. Just read and report findings.

## CONTEXT
We need to design a Master Plan that ensures the editor system is fully 
extensible — so that:

1. **Adding a new master template** (e.g. "Ocean", "Vintage", "Dark") 
   should be a one-shot operation that integrates seamlessly. New template 
   must support every existing element. If template misses any element, 
   system must auto-fallback to Classic defaults OR generate a custom 
   variant for that template.

2. **Element gallery must be category-organized** with per-page visibility 
   too. Same element can be used across pages.

3. **Bidirectional integration**: Master templates ↔ element configs ↔ 
   gallery — adding/removing elements or templates must propagate cleanly.

This diagnosis surveys the current system to know:
- What's already extensible
- What needs refactoring before we add scale
- What fallback logic exists (or doesn't)

## INVESTIGATION

### Section 1: Template Engine Schema

Read `src/components/admin/editor/templateEngine.js`. Report:

1. Full structure of `TEMPLATES` constant
   - How many templates currently exist?
   - For each template, what shape does it have? (id, name, elements{})
2. Helper functions exported (listTemplates, getTemplate, resolveStatefulConfig)
3. How is `resolveStatefulConfig` doing fallback?
   - If template "neon" doesn't have config for "result-card", what happens?
   - If element has no config in any template, what's the default?

### Section 2: Stateful Registry Schema

Read `src/components/admin/editor/statefulRegistry.js`. Report:

1. List ALL elements currently registered (by id)
2. For each element, show:
   - id
   - type (button / countdown / card / etc.)
   - section (hero / vote / results / etc.) — if exists
   - Whether it has `category` field
3. What fields does each registry entry have?
4. Show `STATEFUL_ELEMENTS` full keys + `GLOBAL_STATE_DIMENSIONS` if exists

### Section 3: State Resolver Coverage

Read `src/components/admin/editor/stateResolver.js`. Report:

1. List ALL resolver keys in STATE_RESOLVERS
2. For each, what runtime context does it need?
3. Are there resolvers without registered elements? Or vice versa?

### Section 4: Element-Template Coverage Matrix

Build a matrix:

| Element ID | Section | In Classic? | In Neon? | Fallback works? |
|-----------|---------|-------------|----------|-----------------|
| voteCTA-button | hero | ? | ? | ? |
| hero-countdown | hero | ? | ? | ? |
| ... | ... | ... | ... | ... |

Report any gaps where an element exists in registry but not in a template.

### Section 5: Fallback Logic Today

Test the resolveStatefulConfig logic mentally:

Scenario A: `template = "neon"`, `elementId = "voteCTA-button"`, `state = "login"`
- Does template engine return Neon's config? Or fallback?

Scenario B: `template = "ocean"` (doesn't exist), `elementId = "voteCTA-button"`
- Does it return null? Throw? Fallback to Classic?

Scenario C: `template = "neon"`, `elementId = "future-element"` (not in template)
- Same questions

Show actual code logic that handles each.

### Section 6: Element Categorization

Currently, are elements grouped by:
- Page (home / vote / results / etc.)?
- Type (button / card / heading)?
- Use case (hero / cta / status)?

Look at how `getStatefulElement`, `isStatefulElement`, `getStatesOf` are used.
Are there existing filter/group APIs?

### Section 7: Backgrounds System

Read templateEngine.js for `BACKGROUNDS` constant. Report:
- List of all backgrounds
- Shape (id, name, type, value)
- How are backgrounds applied to pages?
- Is BackgroundId per-page or global?

### Section 8: Saved Designs / Created Templates schema

Currently in PROJECT_PLAN.md these are pending. Verify:
- Is `SystemConfig.pageLayout.savedDesigns[]` field used anywhere?
- Is `SystemConfig.pageLayout.createdTemplates[]` field used anywhere?
- If neither — confirm we need to add them in Phase 3

### Section 9: Component Library data source

If we wanted to build a Component Library tab today, what would be the 
"single source of truth" for:
- All elements
- All templates
- All states per element
- All categories

Identify the function/object we'd query. Or if it doesn't exist, propose 
the API needed.

### Section 10: PageRegistry

Read `src/utils/pageRegistry.js`. Report full content. This is critical for 
plan — pages drive element placement.

How does pageRegistry relate to:
- Block layout (per page)
- Element registration (per page)
- Section ordering

### Section 11: Element-Page Mapping

Currently, how does the system know which elements belong to which page?

Example:
- `voteCTA-button` → Home page only? Or universal?
- `result-card` → Results page only? Or could be reused?

Look at:
- `EDITABLE_PAGES` registry (sections list)
- Element `section` field in statefulRegistry
- Block types in pageLayout

Report the current "element discovery" mechanism per page.

### Section 12: Cross-page element reuse capability

Diagnosis question: If admin wants to add "voteCTA-button" to candidates 
page (currently only on home), can the system support it today?
- Would the element render correctly?
- Would the gallery show it as available?
- What blocks the use case?

### Section 13: Template Switcher Scope

When admin switches from Classic to Neon:
- Does it apply to all pages at once? Or per-page?
- `sourceTemplate` is stored where? Single field or per-page?
- If per-page, how is "global theme" expressed?

## OUTPUT FORMAT

Be thorough but concise. Use bullets and tables. Show actual code only when 
critical to understanding.

Focus on identifying:
- ✅ What already supports extensibility
- ⚠️ What partially supports it (would work but with gaps)
- ❌ What blocks extensibility (would need refactor)

End the report with:

### Recommendations

For each gap found, recommend:
- Severity (high/med/low)
- Whether to fix in Phase 1.5 / Phase 2 / Phase 3 / Phase 4
- Brief approach

## DO NOT
- DO NOT modify any file
- DO NOT install anything
- DO NOT write code
- ONLY read and report
