# LIVE_STEP_H4.md — Wire Stateful Overrides to Admin Save/Load

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
H-1 created foundation. H-2 bridged config to live page. H-3 added the Gallery UI.
The Gallery calls `onUpdateStatefulOverride`, `onResetStatefulState`, 
`onApplyTemplateToElement` handlers — but these are currently no-op.

H-4 implements those handlers in useEditorState + wires them into admin tab,
persists via existing save endpoint, and loads overrides back on mount.

After H-4 the full loop works:
  click element → open gallery → edit override → auto-save to localStorage 
  → click Save → persist to DB → real page shows changes

## SCOPE (DO NOT EXCEED)
Modify exactly 2 files:
1. `src/components/admin/editor/useEditorState.js` — add state for overrides + handlers
2. Admin page design tab (likely `src/app/admin/page.js` or its tab component) — 
   wire handlers + pass to PropertyPanel + include in save payload

Do NOT modify:
- statefulRegistry, stateResolver, templateEngine (H-1)
- VoteCTABlock, HomeContent, page.js (H-2)
- PropertyPanel, StatefulGallery (H-3)
- API routes or Prisma schema

## PART 1: Modify `src/components/admin/editor/useEditorState.js`

### Goal
Add state + handlers for:
- `sourceTemplate` (string, default "classic")
- `elementOverrides` (object, keyed by elementId → stateId → { ...partial config })
- `backgroundId` (string, for later use — keep it simple now)

Expose handlers:
- `updateStatefulOverride(elementId, stateId, key, value)`
- `resetStatefulState(elementId, stateId)`
- `applyTemplateToElement(elementId, templateId)` — copy all 6 states' configs from that template into overrides for the element

### Changes

Near top of the hook, add new useState:

```js
const [sourceTemplate, setSourceTemplate] = useState('classic');
const [elementOverrides, setElementOverrides] = useState({});
const [backgroundId, setBackgroundId] = useState('gradient-purple-light');
```

In the initialization useEffect (where elementConfigs loads from initialPageLayout), add:

```js
useEffect(() => {
  if (!initialPageLayout) return;
  
  if (initialPageLayout.sourceTemplate) {
    setSourceTemplate(initialPageLayout.sourceTemplate);
  }
  if (initialPageLayout.elementOverrides) {
    setElementOverrides(initialPageLayout.elementOverrides);
  }
  if (initialPageLayout.backgroundId) {
    setBackgroundId(initialPageLayout.backgroundId);
  }
}, [initialPageLayout]);
```

Add handler functions:

```js
// Update one property override for one state of one stateful element
const updateStatefulOverride = useCallback((elementId, stateId, key, value) => {
  setElementOverrides(prev => {
    const next = { ...prev };
    if (!next[elementId]) next[elementId] = {};
    if (!next[elementId][stateId]) next[elementId][stateId] = {};
    next[elementId] = {
      ...next[elementId],
      [stateId]: {
        ...next[elementId][stateId],
        [key]: value
      }
    };
    return next;
  });
  setHasUnsavedChanges(true);
}, []);

// Reset one state back to template defaults (delete overrides for that state)
const resetStatefulState = useCallback((elementId, stateId) => {
  setElementOverrides(prev => {
    const next = { ...prev };
    if (!next[elementId]) return prev;
    const copy = { ...next[elementId] };
    delete copy[stateId];
    if (Object.keys(copy).length === 0) {
      delete next[elementId];
    } else {
      next[elementId] = copy;
    }
    return next;
  });
  setHasUnsavedChanges(true);
}, []);

// Apply template to a single element — copy all its states from template to overrides
// This "pins" the element to that template independently of global sourceTemplate
const applyTemplateToElement = useCallback((elementId, templateId) => {
  // Import lazily to avoid circular deps
  const { getTemplate } = require('./templateEngine');
  const template = getTemplate(templateId);
  if (!template) return;
  
  const elementStates = template.elements?.[elementId];
  if (!elementStates) return;
  
  // Copy every state's full config into overrides
  // This way the element uses this template regardless of global sourceTemplate
  setElementOverrides(prev => ({
    ...prev,
    [elementId]: { ...elementStates }
  }));
  setHasUnsavedChanges(true);
}, []);

// Apply template globally (change sourceTemplate for all elements)
const applyGlobalTemplate = useCallback((templateId) => {
  setSourceTemplate(templateId);
  // Clear all overrides — template defaults take over
  // Admin can then customize individual states if desired
  setElementOverrides({});
  setHasUnsavedChanges(true);
}, []);
```

Update `getSavePayload()` to include new fields:

```js
const getSavePayload = useCallback(() => {
  return {
    home: elementConfigs,       // existing static elements
    sourceTemplate,              // NEW
    elementOverrides,            // NEW
    backgroundId                 // NEW
  };
}, [elementConfigs, sourceTemplate, elementOverrides, backgroundId]);
```

Expose new values + handlers from the hook return:

```js
return {
  // existing...
  selectedElement, hoveredElement, elementConfigs, hasUnsavedChanges,
  setSelectedElement, setHoveredElement, updateElementConfig,
  applyPresetToElement, applyTemplateToAll, resetElement,
  getElementConfig, getSavePayload, markSaved,
  
  // NEW from H-4
  sourceTemplate,
  elementOverrides,
  backgroundId,
  updateStatefulOverride,
  resetStatefulState,
  applyTemplateToElement,
  applyGlobalTemplate,
  setBackgroundId
};
```

Add `useCallback` to imports if not already imported:
```js
import { useState, useEffect, useCallback } from 'react';
```

## PART 2: Wire admin page design tab

### Goal
Pass new handlers/state from `editor` hook to PropertyPanel.
Build pageLayout object that merges static + stateful data for rendering.
Include in save payload.

### Changes

Find where `useEditorState` is called and where `<PropertyPanel>` is rendered.

### Step 2a — Build merged pageLayout for PropertyPanel

Near where other state/derived values are computed, add:

```js
// Pass the stateful portion of the editable state to PropertyPanel
const editorPageLayout = {
  sourceTemplate: editor.sourceTemplate,
  elementOverrides: editor.elementOverrides,
  backgroundId: editor.backgroundId
};
```

### Step 2b — Pass props to PropertyPanel

Update existing `<PropertyPanel ...>` usage to include new props:

```jsx
<PropertyPanel
  selectedElement={editor.selectedElement}
  elementConfigs={editor.elementConfigs}
  pageLayout={editorPageLayout}                              // NEW
  onUpdateConfig={editor.updateElementConfig}
  onApplyPreset={editor.applyPresetToElement}
  onDeselect={() => editor.setSelectedElement(null)}
  onUpdateStatefulOverride={editor.updateStatefulOverride}   // NEW
  onResetStatefulState={editor.resetStatefulState}           // NEW
  onApplyTemplateToElement={editor.applyTemplateToElement}   // NEW
/>
```

### Step 2c — Update livePageLayout (for LivePreview)

Find `livePageLayout` useMemo (mentioned in earlier diagnosis). It builds the 
object passed as `pageLayout` prop to LivePreview. Add stateful fields:

```js
const livePageLayout = useMemo(() => ({
  home: normalizedBlocks,
  vote: { multiParty: voteConfig },
  theme,
  elementConfigs: editor.elementConfigs,
  
  // NEW — stateful data
  sourceTemplate: editor.sourceTemplate,
  elementOverrides: editor.elementOverrides,
  backgroundId: editor.backgroundId,
  
  ...normalizedOther
}), [normalizedBlocks, voteConfig, theme, editor.elementConfigs, 
     editor.sourceTemplate, editor.elementOverrides, editor.backgroundId, 
     normalizedOther]);
```

Adjust dependency array according to actual variable names in the file.

### Step 2d — Update save payload

Find `handleSave` function. Update the payload:

```js
const payload = {
  home: normalizedBlocks,
  vote: { multiParty: voteConfig },
  theme,
  elementConfigs: { home: editor.elementConfigs },
  
  // NEW
  sourceTemplate: editor.sourceTemplate,
  elementOverrides: editor.elementOverrides,
  backgroundId: editor.backgroundId,
  
  ...normalizedOther
};
```

API route accepts any JSON shape — no API changes needed.

### Step 2e — localStorage auto-save

If there's an auto-save effect that writes to localStorage for `/preview` page,
include the new fields:

```js
useEffect(() => {
  try {
    const draft = {
      ...livePageLayout,
      elementConfigs: { home: editor.elementConfigs },
      // sourceTemplate, elementOverrides, backgroundId are already in livePageLayout now
    };
    localStorage.setItem('preview_draft', JSON.stringify(draft));
  } catch (e) {}
}, [livePageLayout, editor.elementConfigs]);
```

If the effect already depends on livePageLayout (which now includes stateful fields), 
no changes needed — it will auto-rerun on override changes.

## DO NOT
- Do NOT modify API route — JSON column accepts any shape
- Do NOT modify Prisma schema
- Do NOT modify H-1/H-2/H-3 files
- Do NOT add new UI components — controls already exist in StatefulGallery (H-3)
- Do NOT change existing save/load flow for static elements

## VERIFICATION

After H-4 complete:

1. `npm run build` passes exit 0
2. Admin opens page design tab → click voteCTA-button → StatefulGallery shows
3. Expand any state card → edit color
4. ✅ Preview updates live (reads livePageLayout)
5. ✅ "Custom" badge appears on edited state card
6. Click another state → edit → "Custom" badge on that too
7. Click "Reset state นี้" on a card → badge disappears, config returns to template default
8. Click template switch [Neon] in gallery header → element switches to Neon styling
9. Click "บันทึก" → save succeeds
10. Reload admin tab → all overrides restored (persist test)
11. Open real `/` page → voteCTA shows saved style (assuming state matches — e.g. logged in + not voted → notVoted state)
12. Open `/preview?page=home` → shows draft state including overrides

## REPORT FORMAT

```
Modified src/components/admin/editor/useEditorState.js — added sourceTemplate/elementOverrides/backgroundId state, handlers (updateStatefulOverride, resetStatefulState, applyTemplateToElement, applyGlobalTemplate), updated getSavePayload
Modified [admin tab file path] — build editorPageLayout, pass new props to PropertyPanel, include stateful fields in livePageLayout + handleSave payload + localStorage auto-save
Build: PASS
```

No other commentary. Do not run dev server.
