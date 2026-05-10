# LIVE_STEP_H_PREVIEW_INFRA.md — Universal Preview Infrastructure Fix

## READ FIRST
Read `CLAUDE.md`, `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES", and 
`DECISIONS.md`. Follow strictly.

## CONTEXT
Diagnosis (DIAGNOSE_PREVIEW_INFRA) confirmed two issues:

**Issue 1 — Small preview clips content:**
LivePreview container in PageDesignTab.js line 331 has `height: 550px` + 
`overflow: hidden` + `transform: scale(0.42)`. Content taller than ~1310px 
(native, after scale) gets clipped. ResultsEditorPreview's Demographics + 
Footer are below this threshold.

**Issue 2 — Fullscreen `/preview?page=results` shows old mock:**
`/preview/page.js` lines 77-91 has only home branch — falls through to 
PagePreviewRenderer (hardcoded mock) for all other pages.

This step fixes both at the infrastructure level — works for ALL pages, 
not just Results.

## SCOPE (DO NOT EXCEED)
Modify exactly 2 files:

1. `src/components/admin/PageDesignTab.js` — make small preview scrollable
2. `src/app/preview/page.js` — add 'results' branch + future-proof for other pages

Do NOT modify:
- ResultsEditorPreview.js
- PagePreviewRenderer.js (still used as fallback for vote/candidates/party/success)
- Other page components
- Schema or API

Do NOT install packages.

## PART 1: Fix Small Preview Container (PageDesignTab.js)

### Change strategy
Replace `overflow-hidden` with `overflow-y-auto` on the OUTER container.
Also increase height for better usability and remove fixed height clipping
from the scaled inner div.

### Locate the container (around line 331)

**Find:**
```jsx
<div className="relative bg-slate-100/50 overflow-hidden" style={{ height: '550px' }}>
```

**Replace with:**
```jsx
<div 
  className="relative bg-slate-100/50 overflow-y-auto overflow-x-hidden" 
  style={{ height: '650px' }}
  onClickCapture={(e) => {
    // Preserve existing click-lock behavior from H-5.5
    const insideEditorElement = e.target.closest('.group\\/editor');
    if (!insideEditorElement) {
      e.preventDefault();
      e.stopPropagation();
    }
  }}
>
```

NOTE: Keep the existing `onClickCapture` if one is already there from H-5.5.
If not, ADD it as shown above. The capture handler is part of click-lock — 
preserve it.

### Locate the scaled inner desktop div (around line 340)

**Find:**
```jsx
<div 
  className="absolute top-0 left-0 origin-top-left"
  style={{
    transform: `scale(0.42)`,
    transformOrigin: 'top left',
    width: `${100/0.42}%`,
    height: `${100/0.42}%`
  }}
>
```

**Replace with:**
```jsx
<div 
  className="origin-top-left"
  style={{
    transform: `scale(0.42)`,
    transformOrigin: 'top left',
    width: `${100/0.42}%`,
    // No fixed height — let content determine height
    // The outer container scrolls if content exceeds viewport
  }}
>
```

CRITICAL changes:
- Remove `absolute top-0 left-0` — absolute positioning breaks scroll height calc
- Remove `height: ${100/0.42}%` — let content be its natural height
- Outer container with `overflow-y-auto` will provide scroll

### Locate the mobile preview wrapper (around line 333-338)

**Find:**
```jsx
<div className="absolute top-4 left-1/2"
  style={{ transform: 'translateX(-50%) scale(0.55)', transformOrigin: 'top center', width: '375px' }}
>
  <div className="rounded-[2.5rem] border-[6px] border-slate-800 overflow-hidden shadow-2xl bg-white relative">
    <div className="pt-6">{renderPreview('mobile')}</div>
  </div>
</div>
```

**Replace with:**
```jsx
<div className="mx-auto py-4"
  style={{ 
    transform: 'scale(0.55)', 
    transformOrigin: 'top center', 
    width: '375px',
    /* center the phone frame */
    marginLeft: 'auto',
    marginRight: 'auto'
  }}
>
  <div className="rounded-[2.5rem] border-[6px] border-slate-800 overflow-hidden shadow-2xl bg-white relative mx-auto">
    <div className="pt-6">{renderPreview('mobile')}</div>
  </div>
</div>
```

CRITICAL: Remove `absolute top-4 left-1/2` — same reason.
Keep the phone frame `overflow-hidden` (the rounded device frame should clip 
its OWN content visually, but the OUTER container scrolls).

### Why this works
- Outer container is now scrollable (`overflow-y-auto`)
- Inner scaled content takes natural height
- When scaled content exceeds container height, scrollbar appears
- User can scroll DOWN to see Footer / Demographics / etc.
- Click-lock from H-5.5 preserved via onClickCapture

## PART 2: Fix Fullscreen Preview Routing (`src/app/preview/page.js`)

### Goal
Add a `'results'` branch that uses `ResultsEditorPreview` instead of 
PagePreviewRenderer. Make the conditional structure extensible so vote/
candidates/etc. can be added later without breaking changes.

### Add import
```js
import ResultsEditorPreview from '../../components/admin/ResultsEditorPreview';
```

### Replace the routing ternary (around line 77-91)

**Find:**
```jsx
{pageId === 'home' ? (
    <HomeContent
        editorMode={false}
        editorData={DUMMY_ELECTION}
        pageLayout={draftLayout}
        theme={draftLayout.theme}
    />
) : (
    <PagePreviewRenderer
        pageId={pageId}
        pageLayout={draftLayout}
        deviceMode="desktop"
    />
)}
```

**Replace with:**
```jsx
{pageId === 'home' && (
    <HomeContent
        editorMode={false}
        editorData={DUMMY_ELECTION}
        pageLayout={draftLayout}
        theme={draftLayout.theme}
    />
)}

{pageId === 'results' && (
    <ResultsEditorPreview
        simMode="multi"
        // No interaction handlers — production-like rendering
        // (selectedElement etc. default to null, no editor overlays)
    />
)}

{!['home', 'results'].includes(pageId) && (
    <PagePreviewRenderer
        pageId={pageId}
        pageLayout={draftLayout}
        deviceMode="desktop"
    />
)}
```

### Why production-like for fullscreen results
- Diagnosis Section 8 confirmed: home uses `editorMode={false}` in fullscreen
- ResultsEditorPreview's interaction props all default to null
- Without onSelect/onHover, EditorElement still wraps but no purple overlays
- For fullscreen, we want THE PAGE — not the editing tools
- Per D-004: real component, real production-like rendering

### Future-proofing note
When other pages get their own EditorPreview component (vote, candidates, 
closed), follow the same pattern — add a `pageId === 'X'` branch with the 
new component, and add 'X' to the catch-all `!['home', 'results', 'X'].includes`. 
That's planned in H-VOTE-PREV / H-CAND-PREV / H-CLOSED-PREV.

## DO NOT
- Do NOT modify ResultsEditorPreview.js
- Do NOT modify PagePreviewRenderer.js (still needed for vote/candidates/party/success fallback)
- Do NOT change the home branch behavior
- Do NOT remove or alter draftLayout / DUMMY_ELECTION imports
- Do NOT install packages
- Do NOT add scroll buttons or scroll indicators (let native scrollbar handle it)

## VERIFICATION

After completion:

1. `npm run build` passes exit 0

2. **Small preview test (PageDesignTab):**
   - Admin → ออกแบบหน้าเว็บ → คลิก "ผลคะแนน"
   - Live Preview shows ResultsEditorPreview
   - **Scroll inside the preview container**
   - Can scroll DOWN to see: 3 stats cards → ResultCards → Demographics → Footer
   - All sections of Results page visible by scrolling
   - Container height looks reasonable (~650px instead of cramped 550px)

3. **Click-lock still works:**
   - Click vote button in preview → no navigation (still blocked)
   - Click navbar links → no navigation
   - Hover wrapped section → purple dashed border still appears

4. **Mobile preview still works:**
   - Toggle to "Mobile" device
   - Phone frame visible
   - Can scroll inside phone frame too

5. **Fullscreen preview test:**
   - Click expand button (top-right arrow) when "ผลคะแนน" is selected
   - Opens new tab `/preview?page=results`
   - Shows REAL ResultsEditorPreview (Navbar + StatsBar + ResultCards + Demographics + Footer)
   - NOT the old purple-card mock anymore
   - No editor overlays (no purple borders, no click-to-edit)
   - Looks like the production /results page

6. **Home preview unchanged:**
   - Click expand for "หน้าหลัก" → still works
   - `/preview?page=home` shows real home page

7. **Other pages unchanged:**
   - `/preview?page=vote` still uses PagePreviewRenderer (mock for now — H-VOTE-PREV later)
   - Same for candidates/party/success

## REPORT FORMAT

```
Modified src/components/admin/PageDesignTab.js — replaced overflow-hidden with overflow-y-auto on small preview container, removed absolute positioning + fixed height from scaled inner div, increased container height from 550px to 650px, preserved click-lock onClickCapture handler
Modified src/app/preview/page.js — added ResultsEditorPreview import, added pageId === 'results' branch using production-like rendering, kept home branch + PagePreviewRenderer fallback for other pages
Build: PASS
```

No other commentary.
