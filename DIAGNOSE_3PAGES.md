# DIAGNOSE_3PAGES.md — Vote / Candidates / Closed Pages

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify any file. Just read and report.

## CONTEXT
After H-SYNC-FIX, only 3 pages remain without editor preview infrastructure:
- `/vote` — voting ballot
- `/candidates` — party list
- `/closed` — election ended message

We need to:
1. Understand structure of each page
2. Identify reusable components (and which need extraction)
3. Identify state-aware logic (mode toggles, phases)
4. Find existing dummy/preview data
5. Plan editor preview pattern

This diagnosis informs the LIVE_STEP that creates editor previews for all 3.

## INVESTIGATION

### Section 1: /vote page

Read `src/app/vote/page.js`. Report:

1. Top-level structure — what sections does it have?
   (e.g., header, party grid, abstain button, submit button)

2. State-aware logic — does it differ based on:
   - Multi-party vs single-party (voteMode)?
   - User authenticated vs not?
   - System mode (PRE_CAMPAIGN / OPEN / ENDED / PAUSED)?
   - User has voted vs hasn't?

3. Inline components vs imported — which sections are:
   - Already separate components (good for reuse)
   - Inline JSX (need extraction)

4. List the data dependencies:
   - Candidates fetched from API?
   - Election config?
   - User session?

### Section 2: /candidates page

Read `src/app/candidates/page.js`. Report same questions as Section 1:
- Sections
- State variations (PRE_CAMPAIGN vs CAMPAIGN_OPEN — does behavior change?)
- Inline JSX vs components
- Data dependencies

Specifically check: does it show "ยังไม่เปิดเผยรายชื่อ" placeholder during 
PRE_CAMPAIGN? When does the party list show?

### Section 3: /closed page

Read `src/app/closed/page.js`. Report:

1. Structure (likely simpler than vote/candidates)
2. Hardcoded text vs dynamic
3. Date handling (is the date hardcoded or from electionConfig)
4. Any conditional rendering

### Section 4: Existing dummy data

Read `src/utils/editorDummyData.js`. Report:

1. What dummy exports already exist?
2. Specifically check:
   - DUMMY_VOTE_*  (anything for vote page?)
   - DUMMY_CANDIDATES_*
   - DUMMY_RESULTS_* (we know this exists)
   - DUMMY_ELECTION

3. Are there enough dummy data to render preview without API?

### Section 5: Existing component reuse

Search for these components and report if they exist + what they render:
- `<Navbar />` — used everywhere
- `<SiteFooter />` — used after H-CON
- Vote page: party card component? abstain button component? disapprove?
- Candidates page: party card component for list? 
- Login flow: any preview-friendly variant?

### Section 6: State-aware components needed

For each page, what runtime states need to be displayed in editor:
- Vote: multi-party vs single-party (and within each, different election phases?)
- Candidates: pre-campaign vs open vs ended?
- Closed: just one state

Recommend: how many "preview modes" does each page need?

### Section 7: Existing preview tiles

In `src/components/admin/previews/PagePreviewRenderer.js`, find the 
inline preview tiles for:
- VotePreview
- CandidatesPreview  
- ClosedPreview (or SuccessPreview)

Show the JSX of each. We'll deprecate these for editor preview but keep 
them for the small thumbnail tiles in PagePreviewRenderer.

### Section 8: PageRegistry sections

Read `src/utils/pageRegistry.js`. Report the sections defined for:
- vote page (look for vote columns)
- candidates page
- closed page (or success page)

These section IDs determine the left-panel section list in admin editor.

### Section 9: Element registry coverage

In `src/components/admin/editor/elementRegistry.js`, which elements are 
registered for:
- vote page (e.g., vote-header-*, vote-party-card, vote-abstain-button)
- candidates page (any registered?)
- closed page (any registered?)

Report element IDs + sections.

### Section 10: PageDesignTab current handling

In `src/components/admin/PageDesignTab.js`:

1. What's currently rendered when `selectedPage === 'vote'`?
2. When `selectedPage === 'candidates'`?
3. When `selectedPage === 'closed'`?

(After H-7a-FIX-WIRE we know home/results have explicit branches; these 3 
likely fall to PlaceholderPageSectionList + PagePreviewRenderer fallback.)

Show the relevant code sections.

## OUTPUT FORMAT

```
=== Section 1: /vote ===
Structure: [list]
State variations: [list]
Components: [imported | inline]
Data: [API | static | dummy]

=== Section 2: /candidates ===
[same format]

=== Section 3: /closed ===
[same format]

=== Section 4: Dummy data ===
Existing exports: [list]
Missing for preview: [list]

=== Section 5: Components ===
Reusable today: [list]
Need extraction: [list]

=== Section 6: Preview modes per page ===
vote: N modes — [describe]
candidates: N modes — [describe]
closed: N modes — [describe]

=== Section 7: Existing preview tiles ===
[code snippets — for reference, not to delete]

=== Section 8: PageRegistry sections ===
vote: [section IDs]
candidates: [section IDs]
closed/success: [section IDs]

=== Section 9: Element registry ===
vote elements: [list]
candidates elements: [list]
closed elements: [list]

=== Section 10: PageDesignTab handling ===
vote → [what renders]
candidates → [what renders]
closed → [what renders]

=== Recommendations ===
For each page, recommend the editor preview component scope:
- Component to create
- Components to extract (if any)
- Dummy data to add (if any)
- Preview mode toggle needed
- Estimated complexity (S/M/L)
```

## DO NOT
- DO NOT modify any file
- DO NOT install anything
- DO NOT write code
- ONLY read and report
