# EDITOR_STEP1.md — Foundation Files

```
Read CLAUDE.md and EDITOR_ENGINE_ARCHITECTURE.md first.
Create 3 new files only. Do not modify any existing files.
Verify npm run build passes after creating all 3.

## File 1: src/components/admin/editor/EditorElement.js

Wrapper component for every editable element in preview.

Props: id, config (object with type/label/section), isSelected, isHovered,
       onSelect, onHover, onHoverEnd, children

Behavior:
- Renders children inside a div
- onClick → onSelect(id) with e.stopPropagation()
- onMouseEnter → onHover(id)  
- onMouseLeave → onHoverEnd()

Visual states:
- Normal: no overlay
- Hovered (not selected): dashed border-2 border-[#8A2680]/40 rounded-lg
  + label tooltip at -top-6 left-1: element label text, bg-white, text-[#8A2680],
    text-[9px] font-bold, px-2 py-0.5 rounded, shadow-sm, border border-[#8A2680]/20
- Selected: solid border-2 border-[#8A2680] rounded-lg + slight bg-[#8A2680]/5
  + label at -top-6: bg-[#8A2680] text-white with "✎" edit icon
  
All overlays: position absolute, inset-0, pointer-events-none, z-40
Wrapper div: position relative, cursor-pointer
Add transition-all duration-200 for smooth state changes

## File 2: src/components/admin/editor/useEditorState.js

"use client" hook.

States:
- selectedElement (string|null)
- hoveredElement (string|null)  
- elementConfigs (object) — loaded from saved data or defaults
- hasUnsavedChanges (boolean)

Params: initialPageLayout (to load saved configs on mount)

On mount logic:
- If initialPageLayout?.elementConfigs?.home exists → use it as elementConfigs
- Else → call getPresetDefaults('classic') from elementRegistry as fallback

Functions:
- setSelectedElement(id|null)
- setHoveredElement(id|null)
- updateElementConfig(elementId, key, value):
    update elementConfigs[elementId].config[key] = value
    set hasUnsavedChanges = true
- applyPresetToElement(elementId, presetId):
    get preset from ELEMENT_PRESETS[elementId].presets[presetId]
    replace elementConfigs[elementId].config entirely
    set hasUnsavedChanges = true
- applyTemplateToAll(presetId):
    call getPresetDefaults(presetId) → replace entire elementConfigs
    set hasUnsavedChanges = true
- resetElement(elementId):
    detect current template (from _appliedTemplate or 'classic')
    reset this element to that template's preset
- getElementConfig(elementId): return elementConfigs[elementId]?.config || {}
- getSavePayload(): return { home: elementConfigs }
- markSaved(): set hasUnsavedChanges = false

Import getPresetDefaults from elementRegistry (will be created in Step 2,
so use dynamic import or just reference it — the build will resolve it in Step 2).
For now, if elementRegistry doesn't exist yet, use inline fallback defaults.

Return: { selectedElement, hoveredElement, elementConfigs, hasUnsavedChanges,
  setSelectedElement, setHoveredElement, updateElementConfig, 
  applyPresetToElement, applyTemplateToAll, resetElement,
  getElementConfig, getSavePayload, markSaved }

## File 3: src/components/admin/editor/controls/SharedInputs.js

"use client" — Reusable input components. Each is a named export.

### ColorPickerInput({ label, value, onChange })
- Label text (text-xs font-bold text-slate-500 uppercase tracking-wide mb-1)
- Row: colored circle (w-8 h-8 rounded-full border-2) showing current color + hex text input (w-24)
- Below: 8 preset swatch circles in a flex row, gap-1.5
  Swatches: #8A2680, #7C3AED, #2563EB, #059669, #DC2626, #F59E0B, #EC4899, #1E293B
  Each: w-6 h-6 rounded-full cursor-pointer, ring-2 ring-offset-1 when matches value
  Click swatch or change input → onChange(hexColor)

### TextInput({ label, value, onChange, placeholder })
- Label + text input (w-full, border border-slate-200, rounded-lg, px-3 py-2, text-sm)
- onChange on every keystroke

### SizeSelect({ label, value, onChange })
- Label + select dropdown
- Options: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
- Styled select: border border-slate-200, rounded-lg, px-3 py-2, text-sm, bg-white

### WeightSelect({ label, value, onChange })
- Label + 3 toggle buttons in a row: "ปกติ"(400) "หนา"(700) "หนามาก"(900)
- Active: bg-slate-800 text-white, Inactive: bg-white text-slate-600 border
- Each button: px-3 py-1.5 text-xs font-bold rounded-lg

### AlignSelect({ label, value, onChange })
- Label + 3 buttons: left/center/right
- Use simple CSS lines as icons (no lucide needed):
  Left: 3 horizontal lines left-aligned
  Center: 3 lines centered  
  Right: 3 lines right-aligned
- Active: bg-slate-800 text-white

### RadiusSelect({ label, value, onChange })
- Label + select: none, md, xl, 2xl, 3xl, full
- Same style as SizeSelect

### ToggleSwitch({ label, value, onChange })
- Label on left + toggle on right (flex justify-between)
- Toggle: w-10 h-5 rounded-full, bg-green-500 when true, bg-slate-300 when false
- Circle: w-4 h-4 bg-white rounded-full, translate-x based on value
- Click → onChange(!value)

### PaddingSelect({ label, value, onChange })
- Label + select: 2, 4, 6, 8, 12, 16
- Same style as SizeSelect

All components: max height 36px per input row (label above doesn't count).
Clean, compact, consistent styling. No extra wrappers needed.
Each exported as named export.
```
