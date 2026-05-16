# LIVE_STEP_H7A_FIX_WIRE.md — Wire ResultsEditorPreview into PageDesignTab

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
Diagnosis confirmed: `ResultsEditorPreview` exists with correct real-component 
implementation, but `PageDesignTab.js` never imports or uses it. When user 
clicks "ผลคะแนน" tab, results page falls through to `PagePreviewRenderer` 
which renders a hardcoded mock (the "245 / 49.0%" cards seen in screenshot).

This step adds the missing wiring. Tiny scope — single file modification.

## SCOPE (DO NOT EXCEED)
Modify exactly 1 file:
1. `src/components/admin/PageDesignTab.js` — add ResultsEditorPreview import + 'results' branch in renderPreview + 'results' branch in left panel

Do NOT modify:
- ResultsEditorPreview.js (already correct)
- PagePreviewRenderer.js (don't remove hardcoded ResultsPreview — other places may need it)
- Any other file

## PART 1: Add import

At the top of `PageDesignTab.js`, add:
```js
import ResultsEditorPreview from './ResultsEditorPreview';
```

If `resultsSimMode` state is already declared (per H-7a) keep it. If missing, add:
```js
const [resultsSimMode, setResultsSimMode] = useState('multi');
```

## PART 2: Add 'results' branch in renderPreview function

**Find** the `renderPreview` function (around line 263-288). Currently:
```js
function renderPreview(deviceMode) {
  if (selectedPage === 'home' && editorProps) {
    return <HomeContent ... />;
  }
  return (
    <PagePreviewRenderer pageId={selectedPage} ... />
  );
}
```

**Modify** to add a results branch BEFORE the fallback:
```js
function renderPreview(deviceMode) {
  if (selectedPage === 'home' && editorProps) {
    return <HomeContent ... />;
  }
  
  // NEW: results branch
  if (selectedPage === 'results') {
    return (
      <ResultsEditorPreview
        simMode={resultsSimMode}
        selectedElement={editor.selectedElement}
        hoveredElement={editor.hoveredElement}
        onSelectElement={editor.setSelectedElement}
        onHoverElement={editor.setHoveredElement}
        onHoverEnd={() => editor.setHoveredElement(null)}
      />
    );
  }
  
  // Fallback for other pages
  return (
    <PagePreviewRenderer pageId={selectedPage} ... />
  );
}
```

The exact prop names depend on what's available in scope — match the pattern 
used by the home branch. If `editor.selectedElement` doesn't exist in scope, 
look for the equivalent (e.g., `selectedElement`, `hoveredElement` may be 
direct destructured props).

If `renderPreview` is inside `LivePreview` sub-component, the editor handlers 
must come from props passed into LivePreview. Check what LivePreview receives 
and use those.

## PART 3: Add 'results' branch in LEFT PANEL

**Find** the left panel conditional tree (around line 782-924). Currently:
```jsx
{selectedPage === 'home' && <home sections block>}
{selectedPage === 'home' && <PropertyPanel ...>}
{selectedPage === 'vote' && <vote config block>}
{!['home', 'vote'].includes(selectedPage) && (
  <PlaceholderPageSectionList ... />
)}
```

**Modify** to:
```jsx
{selectedPage === 'home' && <home sections block>}
{selectedPage === 'home' && <PropertyPanel ...>}
{selectedPage === 'vote' && <vote config block>}

{/* NEW: results page panel */}
{selectedPage === 'results' && (
  <div className="space-y-4">
    {/* Sim mode toggle */}
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
        โหมดจำลอง
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setResultsSimMode('multi')}
          className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
            resultsSimMode === 'multi'
              ? 'bg-[#8A2680] text-white'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          หลายพรรค
        </button>
        <button
          type="button"
          onClick={() => setResultsSimMode('single')}
          className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
            resultsSimMode === 'single'
              ? 'bg-[#8A2680] text-white'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          พรรคเดียว
        </button>
      </div>
    </div>

    {/* Section list (same pattern as home) */}
    <PlaceholderPageSectionList 
      pageId="results"
      blocks={pageBlocks}  
      onReorder={...}
      onToggleVisibility={...}
    />

    {/* PropertyPanel for selected element */}
    {editor.selectedElement && (
      <PropertyPanel
        selectedElement={editor.selectedElement}
        elementConfigs={editor.elementConfigs}
        pageLayout={editorPageLayout}
        onUpdateConfig={editor.updateElementConfig}
        onApplyPreset={editor.applyPresetToElement}
        onDeselect={() => editor.setSelectedElement(null)}
        onUpdateStatefulOverride={editor.updateStatefulOverride}
        onResetStatefulState={editor.resetStatefulState}
        onApplyTemplateToElement={editor.applyTemplateToElement}
      />
    )}
  </div>
)}

{!['home', 'vote', 'results'].includes(selectedPage) && (
  <PlaceholderPageSectionList ... />
)}
```

CRITICAL: 
- Update the catch-all condition from `!['home', 'vote'].includes(selectedPage)` 
  to `!['home', 'vote', 'results'].includes(selectedPage)` so results doesn't 
  fall through to the placeholder anymore
- Use the EXACT prop names that match the existing PropertyPanel signature 
  in this file
- For PlaceholderPageSectionList props, match what other pages pass — check 
  what `'vote'` page or fallback uses

If you're unsure about props, just include the toggle + a basic Section list. 
PropertyPanel can be deferred — minimum viable is the toggle + preview rendering.

## PART 4: Pass resultsSimMode through LivePreview if needed

If `LivePreview` is a sub-component that takes specific props, ensure 
`resultsSimMode` reaches its `renderPreview` function:

```jsx
<LivePreview
  selectedPage={selectedPage}
  editorProps={editorProps}
  resultsSimMode={resultsSimMode}  // ← NEW
  ...other props
/>
```

And `LivePreview` signature should include `resultsSimMode` prop.

If LivePreview is just an inline JSX block (not a separate component), this 
step is not needed — `resultsSimMode` is already in scope.

## DO NOT
- Do NOT modify ResultsEditorPreview (already correct)
- Do NOT remove or modify PagePreviewRenderer's ResultsPreview function
- Do NOT change other page branches (home/vote)
- Do NOT install packages
- Do NOT add new components

## VERIFICATION

1. `npm run build` passes exit 0

2. Admin → ออกแบบหน้าเว็บ → click "ผลคะแนน" tab

3. Live Preview (right side) now shows:
   - ✅ Real Navbar at top
   - ✅ Header "REAL-TIME UPDATE" + "ผลการเลือกตั้ง SAMO 49"
   - ✅ Real 3-card stats bar (purple/slate/emerald accent bars + Activity/Users/PieChart icons)
   - ✅ "🏆 สรุปผลการเลือกตั้ง (Official Results)" heading
   - ✅ 3 ResultCards with winner #1 having yellow border + Trophy icon
   - ✅ Real demographics charts: bar chart "แยกตามสาขา", "ชั้นปี", pie chart "เพศ"
   - ✅ Footer at bottom

4. Left panel now shows:
   - Toggle "หลายพรรค ↔ พรรคเดียว"
   - (PropertyPanel and section list — minimum viable)

5. Toggle [พรรคเดียว] → Live Preview switches to 1 party + abstain + disapprove

6. Hover any wrapped section → purple dashed border

7. Click any section → selection works (PropertyPanel may show empty for stateful 
   elements without registry — that's expected, fixed in H-7b)

## REPORT FORMAT

```
Modified src/components/admin/PageDesignTab.js — added ResultsEditorPreview import, added 'results' branch in renderPreview, added 'results' branch in left panel with sim mode toggle, updated catch-all condition to exclude 'results'
Build: PASS
```

No other commentary.
