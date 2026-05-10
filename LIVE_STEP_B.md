# LIVE_STEP_B.md — Refactor HomeContent.js for editor mode

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES" section. Follow strictly.

## TASK SCOPE (DO NOT EXCEED)
Modify exactly 1 file: `src/components/HomeContent.js`
Read for reference only: `src/components/admin/editor/EditorElement.js`, `src/utils/styleMaps.js`, `src/utils/editorDummyData.js`, `src/components/admin/editor/elementRegistry.js`
Do NOT modify any other file.
Do NOT touch block components (HeroBlock, StatsBlock, etc.).
Do NOT change API routes or hooks.

## GOAL
Make HomeContent render identically in both modes:
- **Normal mode:** no new props passed — behaves exactly as today, same API fetch, same output
- **Editor mode:** `editorMode={true}` + props → uses dummy data + editable element wrappers

## CHANGES TO MAKE

### 1. Add props to the component signature
Accept these new optional props (all default to undefined/false):
```
editorMode = false
editorData = null
elementConfigs = null
selectedElement = null
hoveredElement = null
onSelectElement = null
onHoverElement = null
onHoverEnd = null
```

### 2. Add imports at the top
```js
import EditorElement from './admin/editor/EditorElement';
import { SIZE_MAP, RADIUS_MAP, WEIGHT_MAP } from '../utils/styleMaps';
```

### 3. Skip API/fetch when in editor mode
Find places where the component fetches election data / pageLayout / useSWR / useEffect fetches.
Wrap them so they don't run when `editorMode === true`.
Pattern:
```js
// existing: const { data } = useSWR(...)
const { data: fetchedData } = useSWR(editorMode ? null : '/api/...', fetcher);
const data = editorMode ? editorData : fetchedData;
```
If `useSWR` isn't used, find the equivalent fetch logic and apply the same guard.
**If unsure about a fetch, leave it alone and just add `if (editorMode) return;` at the top of its useEffect.**

### 4. Add helper functions inside the component body (before return)
```jsx
const Wrap = ({ id, children }) => editorMode ? (
  <EditorElement
    id={id}
    config={elementConfigs?.[id]}
    isSelected={selectedElement === id}
    isHovered={hoveredElement === id}
    onSelect={onSelectElement}
    onHover={onHoverElement}
    onHoverEnd={onHoverEnd}
  >{children}</EditorElement>
) : children;

const cfg = (id, defaults = {}) => editorMode
  ? { ...defaults, ...(elementConfigs?.[id]?.config || {}) }
  : defaults;
```

### 5. Wrap the SAME elements that HomeEditorPreview already covers
Use these exact IDs (they match `elementRegistry.js`):
- `hero-countdown` — wrap the countdown badge
- `hero-title` — wrap the SAMO 49 heading
- `hero-subtitle` — wrap "โครงการเลือกตั้ง..."
- `hero-subtitle2` — wrap "สโมสรนักศึกษา..."
- `hero-year-badge` — wrap "ประจำปีการศึกษา 2569"
- `hero-status-badge` — wrap the status badge (if present)
- `voteCTA-button` — wrap the vote button
- `meet-section` — wrap the entire meet-candidates card
- `meet-title` — wrap the card's heading text
- `meet-cta` — wrap the card's CTA button
- `stats-header` — wrap the stats section header
- `stats-voted-card` — wrap the main voted count card
- `stats-progress-card` — wrap the progress percentage card
- `stats-eligible-card` — wrap the eligible count card
- `banner-section` — wrap the election banner image/container

### 6. Apply cfg() overrides to styled properties
For each wrapped element, apply config overrides to its inline style.
**ONLY override properties that exist in the element's preset schema.**

Example for `hero-title`:
```jsx
<Wrap id="hero-title">
  <h1 style={editorMode ? {
    fontSize: SIZE_MAP[cfg('hero-title').fontSize] || undefined,
    color: cfg('hero-title').color || undefined,
    fontWeight: cfg('hero-title').fontWeight || undefined,
    textAlign: cfg('hero-title').align || undefined,
  } : undefined}>
    {editorMode ? (cfg('hero-title').text || 'SAMO 49') : /* existing content */}
  </h1>
</Wrap>
```

**CRITICAL:** In normal mode, do NOT change the existing rendering. The inline style above must only apply when `editorMode === true`. Pass `undefined` as style in normal mode so existing Tailwind classes win.

### 7. Use editorData for values shown to user
When `editorMode === true`, read values from `editorData` prop (shape: DUMMY_ELECTION):
- `editorData.title` → hero title text
- `editorData.subtitle` → hero subtitle
- `editorData.totalVoted` → stats voted count
- `editorData.totalEligible` → stats eligible count
- `editorData.percentageVoted` → stats progress %
- `editorData.year` → year badge text

In normal mode, keep existing data sources.

### 8. For toggle elements (hero-countdown, hero-status-badge)
In editor mode, honor `cfg(id).visible !== false`.
In normal mode, keep existing show/hide logic.

## WHAT NOT TO DO
- Do NOT change block component files (HeroBlock, StatsBlock, etc.)
- Do NOT change the 2-column layout structure
- Do NOT modify Tailwind classes in non-editor path
- Do NOT add new state, useEffect, or refs beyond what's listed
- Do NOT refactor existing code for "cleanliness"
- Do NOT rename variables
- Do NOT delete comments

## VERIFICATION
1. Run `npm run build` — must pass exit 0
2. Open `/` (real home page) without any admin — must look identical to before
3. Element IDs must match `elementRegistry.js` exactly

## REPORT FORMAT
```
Modified src/components/HomeContent.js:
- Added editor props (editorMode, editorData, elementConfigs, handlers)
- Added Wrap and cfg helpers
- Wrapped N elements with editor IDs: [list IDs]
- Guarded API/fetch with editorMode check
Build: PASS
```

Do not explain further. Do not run dev server. Do not suggest additional work.
