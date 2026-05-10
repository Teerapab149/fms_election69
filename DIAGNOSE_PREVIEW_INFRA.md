# DIAGNOSE_PREVIEW_INFRA.md — Preview Infrastructure (Small + Fullscreen)

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify any file. Just read and report.

## CONTEXT
User has TWO preview surfaces:
1. **Small Live Preview** in admin "ออกแบบหน้าเว็บ" tab (right panel)
2. **Fullscreen Preview** opened by expand button (top-right arrow icon)

Both should:
- Show the SAME real component for each page
- For Results page → render `ResultsEditorPreview` (not old mock)
- Small preview should NOT cut content — either scroll or expand height to fit

Currently:
- ✅ Small preview (after H-7a-FIX-WIRE) shows real Results
- ❌ Fullscreen preview still shows old mock for results
- ⚠️ Small preview cuts content (Demographics + Footer not visible)

## INVESTIGATION

### Section 1: Fullscreen Preview Page

Find `src/app/preview/page.js` — show its full content if file is small, 
or show the relevant routing logic if large.

Key questions:
- How does it route based on `?page=` query param?
- Where does the Results case render?
- Does it import HomeContent for home? What about results?

### Section 2: Expand Button location

Search the codebase for the expand button (top-right arrow in admin tab):
```bash
grep -rn "Maximize\|ExternalLink\|expand\|preview?page" src/components/admin/
```

Find the button. What URL does it navigate to?

### Section 3: Small Preview Container Scaling

Show the LivePreview component in `PageDesignTab.js`. Specifically:
- The container div with `transform: scale(...)`
- Its height (probably 550px or similar fixed)
- Its overflow setting
- Mobile preview wrapper structure

Show full render block of LivePreview component.

### Section 4: Page rendering map

Make a table comparing the 3 surfaces (real page, small preview, fullscreen preview):

| Page | Real (`/`, `/results`, etc.) | Small preview | Fullscreen preview |
|------|----|----|----|
| Home | HomeContent | HomeContent (editorMode) | ? |
| Vote | vote/page.js | ? | ? |
| Results | results/page.js | ResultsEditorPreview ✅ | ❌ still old mock? |
| Candidates | candidates/page.js | placeholder | ? |
| Closed | closed/page.js | placeholder | ? |

Verify by reading actual code — what each surface ACTUALLY renders today.

### Section 5: Preview page query handling

In `src/app/preview/page.js`, find the switch/conditional that decides what 
to render based on `?page=`. Show the FULL code.

Specifically look for:
- `searchParams.get('page')` usage
- `if (page === 'home')` / `'results'` / etc. branches
- What component is rendered for each

### Section 6: Why fullscreen results renders old mock

Hypothesis: Fullscreen preview likely uses one of:
- (a) Reuses `<HomeContent editorMode />` only for home
- (b) Falls back to `PagePreviewRenderer` (the mock source) for non-home pages
- (c) Has its own routing similar to PageDesignTab — and missing the results branch

Confirm which one by reading the code.

### Section 7: Container sizing strategy

Look at how the small preview container handles content overflow. Specifically:
- Is it `height: 550px` fixed?
- Is it `overflow: hidden` (cut) or `overflow-y: auto` (scroll)?
- Does it scale content with `transform: scale(0.42)`?

For fullscreen preview, what's the container?
- Full screen?
- Fixed height with scroll?
- Natural document flow?

### Section 8: Wrap helper in fullscreen mode

Critical: When user clicks expand and opens fullscreen preview, should 
EditorElement wrappers still be active? Or should it render as production-like?

Check: does `/preview` pass `editorMode={true}`? Or production-like rendering?

## REPORT IN THIS FORMAT

```
=== Section 1: /preview/page.js ===
[Full file content or relevant excerpt]

=== Section 2: Expand button ===
File: ...
Line: ...
URL pattern: ...

=== Section 3: Small preview container ===
[Code excerpt with line numbers]

=== Section 4: Rendering map ===
[Table]

=== Section 5: Preview routing ===
[Code excerpt]

=== Section 6: Why fullscreen results broken ===
Hypothesis (a/b/c) confirmed: ...

=== Section 7: Container sizing ===
Small preview: height=Xpx, overflow=Y, scale=Z
Fullscreen: ...

=== Section 8: Editor mode in fullscreen ===
editorMode value when /preview opens: ...
```

## DO NOT
- DO NOT modify any file
- DO NOT install anything
- ONLY read and report
