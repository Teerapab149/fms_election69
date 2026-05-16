# DIAGNOSE_PAGEDESIGNTAB_RESULTS_ROUTING.md

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify any file. Just search and report.

## CONTEXT
ResultsEditorPreview.js was correctly rewritten with real components, but 
the admin preview still shows mock cards. Hypothesis: PageDesignTab is NOT 
rendering ResultsEditorPreview when `selectedPage === 'results'`. It may 
still be using a placeholder, PagePreviewRenderer, or older component.

## INVESTIGATION

### Section 1: ResultsEditorPreview usage

Search ENTIRE codebase for "ResultsEditorPreview":
```bash
grep -r "ResultsEditorPreview" src/
```

Report every match with file path + line + context.

Expected: at least 1 import + 1 JSX usage in PageDesignTab.

### Section 2: PageDesignTab — where 'results' page renders

Open `src/components/admin/PageDesignTab.js`.

Search for ALL occurrences of `'results'` (with quotes) in the file. Report 
each match with line number + 5 lines of context.

Then find the LivePreview/preview rendering area. Look for the conditional 
that picks the component to render based on `selectedPage`.

Show the FULL conditional tree. Examples:
```js
{selectedPage === 'home' && <HomeContent ... />}
{selectedPage === 'vote' && <SinglePartyView ... />}
{selectedPage === 'results' && <??? />}  ← what's here?
{!['home','vote','results'].includes(selectedPage) && <PlaceholderPageSectionList ... />}
```

Report exactly what's rendered for `'results'`.

### Section 3: PagePreviewRenderer.js — what it renders for results

Open `src/components/admin/previews/PagePreviewRenderer.js` if it exists.

Look at the rendering for `pageId === 'results'` or similar. Show the JSX.

The screenshot shows mock cards with "245 / 49.0%" text and a progress bar — 
it likely matches PagePreviewRenderer's results tile rendering (line 109-194 
area mentioned in earlier diagnosis).

### Section 4: PlaceholderPageSectionList.js — what it does

If file exists at something like `src/components/admin/PlaceholderPageSectionList.js`:
- What does it render?
- Does it render the "Sections ของ ผลคะแนน" left panel + a mock preview right panel?

### Section 5: LivePreview component definition

In PageDesignTab.js, find the `LivePreview` sub-component definition. 
What props does it accept?

What does it render based on `selectedPage`?

Show the full LivePreview component code.

### Section 6: Two LivePreview call sites

The user mentioned earlier that there are 2 LivePreview render sites 
(desktop sidebar + mobile overlay). Find both.

For each, list the props passed. Make sure both pass:
- `resultsSimMode`  
- All editor handlers needed for ResultsEditorPreview

### Section 7: Quick visual confirm

Show me the EXACT lines in PageDesignTab where results page is selected and 
preview renders. We need to see if:
- There's an `if (selectedPage === 'results') return <ResultsEditorPreview ... />`
- OR the branch is missing
- OR it falls through to the placeholder

## OUTPUT FORMAT

Be concise. Just answer:

1. **Is ResultsEditorPreview imported in PageDesignTab?** Y/N + line number
2. **Does PageDesignTab have a `selectedPage === 'results'` branch?** Y/N
3. **What does that branch render?** Component name + line number
4. **Is the branch BEFORE or AFTER the placeholder fallback?** (order matters)
5. **What does PagePreviewRenderer render for 'results'?** Brief description

Then provide the FULL relevant code sections so we can see what's actually wired.

## DO NOT
- DO NOT modify any file
- DO NOT install anything
- ONLY read and report
