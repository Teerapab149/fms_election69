# LIVE_STEP_C.md — Wire real HomeContent into admin preview

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## TASK SCOPE (DO NOT EXCEED)
Modify exactly 1 file: the admin page design tab (likely `src/app/admin/page.js` or a component it imports — find the file that currently imports and uses `HomeEditorPreview`).

Read for reference only:
- `src/components/HomeContent.js` (just refactored in Step B)
- `src/utils/editorDummyData.js`

Do NOT modify HomeContent.js again.
Do NOT modify HomeEditorPreview.js (we will keep it as a fallback).
Do NOT create new files.

## GOAL
Replace `<HomeEditorPreview />` in the admin preview panel with `<HomeContent editorMode={true} ... />`.

## CHANGES TO MAKE

### 1. Add imports to the admin tab file (if not already present)
```js
import HomeContent from '../../components/HomeContent';
import { DUMMY_ELECTION } from '../../utils/editorDummyData';
```
Adjust relative paths based on the actual location.

### 2. Find the existing usage
Look for:
```jsx
<HomeEditorPreview
  elementConfigs={...}
  selectedElement={...}
  ...
/>
```

### 3. Replace it with:
```jsx
<HomeContent
  editorMode={true}
  editorData={DUMMY_ELECTION}
  elementConfigs={editor.elementConfigs}
  selectedElement={editor.selectedElement}
  hoveredElement={editor.hoveredElement}
  onSelectElement={editor.setSelectedElement}
  onHoverElement={editor.setHoveredElement}
  onHoverEnd={() => editor.setHoveredElement(null)}
/>
```

Adjust the prop names on the right side to match whatever state/handlers are already in scope (check the HomeEditorPreview usage to see exact names).

### 4. Keep the scaled container wrapper
Do NOT change the outer container that scales the preview (the `transform: scale(...)` wrapper). Just swap the inner component.

### 5. Keep HomeEditorPreview import for now
Do NOT remove the `HomeEditorPreview` import line. It might be used elsewhere or needed as fallback. Just stop using it in this spot.

## WHAT NOT TO DO
- Do NOT modify HomeContent.js
- Do NOT modify the scaling container or device toggle
- Do NOT change any other page's preview (vote, results, etc. stay as-is for now)
- Do NOT touch useEditorState hook
- Do NOT add new UI controls
- Do NOT refactor unrelated code

## VERIFICATION
1. Run `npm run build` — must pass
2. Logic check: when `selectedPage === 'home'`, the preview should now render real HomeContent in editor mode

## REPORT FORMAT
```
Modified [file path]:
- Imported HomeContent and DUMMY_ELECTION
- Replaced <HomeEditorPreview /> with <HomeContent editorMode ... /> for Home page
Build: PASS
```

No other commentary.
