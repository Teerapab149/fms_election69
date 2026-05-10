# LIVE_STEP_G_BTN_1.md — Expand button config + tiered Simple/Advanced controls

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## SCOPE (DO NOT EXCEED)
Modify exactly 3 files:
1. `src/components/admin/editor/elementRegistry.js` — expand voteCTA-button + meet-cta presets
2. `src/components/admin/editor/controls/SharedInputs.js` — add new input components
3. `src/components/admin/editor/PropertyPanel.js` — split button controls into Simple/Advanced

Do NOT modify HomeContent, block components, or page files in this step.
Do NOT bridge config to live blocks yet — that's next step.
Do NOT install packages.

## PART 1: Expand elementRegistry.js button presets

For `voteCTA-button` and `meet-cta`, update presets to include these properties:

Required properties per preset (all 4 presets: classic/dark/playful/minimal):
- `text` (existing)
- `backgroundType` — "solid" | "gradient"
- `backgroundColor` (existing — used when backgroundType = "solid")
- `gradientFrom` — hex color (used when backgroundType = "gradient")
- `gradientVia` — hex color | null
- `gradientTo` — hex color
- `gradientDirection` — "to-r" | "to-br" | "to-b" | "to-bl" | "to-l" | "to-tl" | "to-t" | "to-tr"
- `textColor` (existing)
- `borderRadius` (existing)
- `borderColor` — hex or "transparent"
- `borderWidth` — "0" | "1" | "2" | "4"
- `shadow` — "none" | "sm" | "md" | "lg" | "xl" | "2xl"
- `shadowColor` — hex color (tint for colored shadow)
- `paddingX` — "2" | "4" | "6" | "8" | "10" | "12"
- `paddingY` — "1" | "2" | "3" | "4" | "5" | "6"
- `fontSize` — "xs" | "sm" | "base" | "lg" | "xl" | "2xl"
- `fontWeight` — "normal" | "medium" | "semibold" | "bold" | "black"
- `iconName` — "None" | "LogIn" | "Vote" | "BarChart3" | "ArrowRight" | "Users"
- `iconPosition` — "none" | "left" | "right"
- `hoverEffect` — "none" | "scale" | "lift" | "glow"

### voteCTA-button presets

```js
classic: {
  text: "เข้าสู่ระบบ / Sign In",
  backgroundType: "gradient",
  backgroundColor: "#8A2680",
  gradientFrom: "#691E61",
  gradientVia: "#8A2680",
  gradientTo: "#C026D3",
  gradientDirection: "to-r",
  textColor: "#ffffff",
  borderRadius: "xl",
  borderColor: "transparent",
  borderWidth: "0",
  shadow: "lg",
  shadowColor: "#8A2680",
  paddingX: "10",
  paddingY: "4",
  fontSize: "lg",
  fontWeight: "bold",
  iconName: "LogIn",
  iconPosition: "right",
  hoverEffect: "lift"
},
dark: {
  text: "VOTE NOW",
  backgroundType: "solid",
  backgroundColor: "#06B6D4",
  gradientFrom: "#0891B2",
  gradientVia: null,
  gradientTo: "#06B6D4",
  gradientDirection: "to-r",
  textColor: "#ffffff",
  borderRadius: "full",
  borderColor: "transparent",
  borderWidth: "0",
  shadow: "xl",
  shadowColor: "#06B6D4",
  paddingX: "10",
  paddingY: "4",
  fontSize: "lg",
  fontWeight: "bold",
  iconName: "Vote",
  iconPosition: "right",
  hoverEffect: "glow"
},
playful: {
  text: "โหวตเลย!",
  backgroundType: "gradient",
  backgroundColor: "#EC4899",
  gradientFrom: "#F472B6",
  gradientVia: "#EC4899",
  gradientTo: "#DB2777",
  gradientDirection: "to-br",
  textColor: "#ffffff",
  borderRadius: "full",
  borderColor: "transparent",
  borderWidth: "0",
  shadow: "xl",
  shadowColor: "#EC4899",
  paddingX: "12",
  paddingY: "5",
  fontSize: "xl",
  fontWeight: "black",
  iconName: "Vote",
  iconPosition: "right",
  hoverEffect: "lift"
},
minimal: {
  text: "เข้าสู่ระบบ →",
  backgroundType: "solid",
  backgroundColor: "transparent",
  gradientFrom: "#1E293B",
  gradientVia: null,
  gradientTo: "#1E293B",
  gradientDirection: "to-r",
  textColor: "#1E293B",
  borderRadius: "none",
  borderColor: "#1E293B",
  borderWidth: "2",
  shadow: "none",
  shadowColor: "#1E293B",
  paddingX: "6",
  paddingY: "2",
  fontSize: "base",
  fontWeight: "semibold",
  iconName: "None",
  iconPosition: "none",
  hoverEffect: "none"
}
```

### meet-cta presets

```js
classic: {
  text: "ดูรายชื่อพรรค →",
  backgroundType: "solid",
  backgroundColor: "#1a1a2e",
  gradientFrom: "#1a1a2e",
  gradientVia: null,
  gradientTo: "#1a1a2e",
  gradientDirection: "to-r",
  textColor: "#ffffff",
  borderRadius: "full",
  borderColor: "transparent",
  borderWidth: "0",
  shadow: "md",
  shadowColor: "#8A2680",
  paddingX: "4",
  paddingY: "2",
  fontSize: "sm",
  fontWeight: "bold",
  iconName: "ArrowRight",
  iconPosition: "right",
  hoverEffect: "scale"
},
dark: {
  text: "ดูรายชื่อพรรค →",
  backgroundType: "solid",
  backgroundColor: "#06b6d4",
  gradientFrom: "#06b6d4",
  gradientVia: null,
  gradientTo: "#06b6d4",
  gradientDirection: "to-r",
  textColor: "#ffffff",
  borderRadius: "full",
  borderColor: "transparent",
  borderWidth: "0",
  shadow: "md",
  shadowColor: "#06b6d4",
  paddingX: "4",
  paddingY: "2",
  fontSize: "sm",
  fontWeight: "bold",
  iconName: "ArrowRight",
  iconPosition: "right",
  hoverEffect: "scale"
},
playful: {
  text: "ไปดูกัน! →",
  backgroundType: "gradient",
  backgroundColor: "#EC4899",
  gradientFrom: "#F472B6",
  gradientVia: null,
  gradientTo: "#DB2777",
  gradientDirection: "to-r",
  textColor: "#ffffff",
  borderRadius: "full",
  borderColor: "transparent",
  borderWidth: "0",
  shadow: "lg",
  shadowColor: "#EC4899",
  paddingX: "5",
  paddingY: "2",
  fontSize: "sm",
  fontWeight: "bold",
  iconName: "ArrowRight",
  iconPosition: "right",
  hoverEffect: "lift"
},
minimal: {
  text: "ดูรายชื่อ →",
  backgroundType: "solid",
  backgroundColor: "transparent",
  gradientFrom: "#1E293B",
  gradientVia: null,
  gradientTo: "#1E293B",
  gradientDirection: "to-r",
  textColor: "#1E293B",
  borderRadius: "none",
  borderColor: "transparent",
  borderWidth: "0",
  shadow: "none",
  shadowColor: "#000000",
  paddingX: "2",
  paddingY: "1",
  fontSize: "sm",
  fontWeight: "medium",
  iconName: "ArrowRight",
  iconPosition: "right",
  hoverEffect: "none"
}
```

## PART 2: Add new inputs to SharedInputs.js

Add these named exports to the existing file. Keep all existing exports intact.

### 1. SegmentedToggle
For switching between a small set of options (like "solid" vs "gradient"):

```jsx
export function SegmentedToggle({ label, value, onChange, options }) {
  // options: [{ value: "solid", label: "สีเดียว" }, { value: "gradient", label: "ไล่สี" }]
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">{label}</label>
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              value === opt.value
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 2. IconSelect
For picking an icon:

```jsx
export function IconSelect({ label, value, onChange }) {
  const options = [
    { value: "None", label: "ไม่มี" },
    { value: "LogIn", label: "เข้าสู่ระบบ" },
    { value: "Vote", label: "โหวต" },
    { value: "BarChart3", label: "กราฟ" },
    { value: "ArrowRight", label: "ลูกศร" },
    { value: "Users", label: "คน" }
  ];
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">{label}</label>
      <select
        value={value || "None"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
```

### 3. GradientDirectionSelect
```jsx
export function GradientDirectionSelect({ label, value, onChange }) {
  const options = [
    { value: "to-r", label: "→ ซ้ายไปขวา" },
    { value: "to-l", label: "← ขวาไปซ้าย" },
    { value: "to-b", label: "↓ บนลงล่าง" },
    { value: "to-t", label: "↑ ล่างขึ้นบน" },
    { value: "to-br", label: "↘ ทแยงมุมล่างขวา" },
    { value: "to-bl", label: "↙ ทแยงมุมล่างซ้าย" },
    { value: "to-tr", label: "↗ ทแยงมุมบนขวา" },
    { value: "to-tl", label: "↖ ทแยงมุมบนซ้าย" }
  ];
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">{label}</label>
      <select
        value={value || "to-r"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
```

### 4. GenericSelect (use for shadow, iconPosition, hoverEffect, paddingX, paddingY, fontSize, fontWeight)
```jsx
export function GenericSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">{label}</label>
      <select
        value={value ?? options[0]?.value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
```

### 5. CollapsibleSection
For the Advanced section expand/collapse:
```jsx
export function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-t border-slate-200 pt-3 mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-800 uppercase tracking-wide mb-2"
      >
        <span>{title}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  );
}
```

Import `React` at top if not already imported: `import React, { useState } from 'react';`

## PART 3: Update PropertyPanel.js — Tiered Simple/Advanced

Replace the existing `ButtonControls` function with a new version that splits into two sections.

```jsx
function ButtonControls({ config, onChange }) {
  const handleChange = (key, value) => onChange(key, value);
  const bgType = config.backgroundType || "solid";

  return (
    <div className="space-y-3">
      {/* ========= SIMPLE SECTION (always visible) ========= */}
      
      <TextInput 
        label="ข้อความปุ่ม" 
        value={config.text || ""} 
        onChange={(v) => handleChange('text', v)} 
      />
      
      <SegmentedToggle
        label="ประเภทพื้นหลัง"
        value={bgType}
        onChange={(v) => handleChange('backgroundType', v)}
        options={[
          { value: "solid", label: "สีเดียว" },
          { value: "gradient", label: "ไล่สี" }
        ]}
      />
      
      {bgType === "solid" && (
        <ColorPickerInput 
          label="สีพื้นหลัง" 
          value={config.backgroundColor} 
          onChange={(v) => handleChange('backgroundColor', v)} 
        />
      )}
      
      {bgType === "gradient" && (
        <>
          <ColorPickerInput 
            label="ไล่สีจาก" 
            value={config.gradientFrom} 
            onChange={(v) => handleChange('gradientFrom', v)} 
          />
          <ColorPickerInput 
            label="ไล่สีถึง" 
            value={config.gradientTo} 
            onChange={(v) => handleChange('gradientTo', v)} 
          />
        </>
      )}
      
      <ColorPickerInput 
        label="สีตัวอักษร" 
        value={config.textColor} 
        onChange={(v) => handleChange('textColor', v)} 
      />
      
      <RadiusSelect 
        label="มุมโค้ง" 
        value={config.borderRadius} 
        onChange={(v) => handleChange('borderRadius', v)} 
      />
      
      <GenericSelect
        label="ขนาด"
        value={config.fontSize}
        onChange={(v) => handleChange('fontSize', v)}
        options={[
          { value: "xs", label: "เล็กมาก" },
          { value: "sm", label: "เล็ก" },
          { value: "base", label: "ปกติ" },
          { value: "lg", label: "ใหญ่" },
          { value: "xl", label: "ใหญ่มาก" },
          { value: "2xl", label: "ใหญ่พิเศษ" }
        ]}
      />
      
      {/* ========= ADVANCED SECTION (collapsible) ========= */}
      
      <CollapsibleSection title="ตัวเลือกขั้นสูง" defaultOpen={false}>
        
        {bgType === "gradient" && (
          <>
            <ColorPickerInput 
              label="สีกลาง (ไล่สี)" 
              value={config.gradientVia || ""} 
              onChange={(v) => handleChange('gradientVia', v || null)} 
            />
            <GradientDirectionSelect 
              label="ทิศทางไล่สี" 
              value={config.gradientDirection} 
              onChange={(v) => handleChange('gradientDirection', v)} 
            />
          </>
        )}
        
        <GenericSelect
          label="ความหนาขอบ"
          value={config.borderWidth}
          onChange={(v) => handleChange('borderWidth', v)}
          options={[
            { value: "0", label: "ไม่มี" },
            { value: "1", label: "บาง" },
            { value: "2", label: "ปกติ" },
            { value: "4", label: "หนา" }
          ]}
        />
        
        <ColorPickerInput 
          label="สีขอบ" 
          value={config.borderColor} 
          onChange={(v) => handleChange('borderColor', v)} 
        />
        
        <GenericSelect
          label="เงา"
          value={config.shadow}
          onChange={(v) => handleChange('shadow', v)}
          options={[
            { value: "none", label: "ไม่มี" },
            { value: "sm", label: "เล็ก" },
            { value: "md", label: "ปกติ" },
            { value: "lg", label: "ใหญ่" },
            { value: "xl", label: "ใหญ่มาก" },
            { value: "2xl", label: "ใหญ่พิเศษ" }
          ]}
        />
        
        <ColorPickerInput 
          label="สีเงา" 
          value={config.shadowColor} 
          onChange={(v) => handleChange('shadowColor', v)} 
        />
        
        <GenericSelect
          label="น้ำหนักตัวอักษร"
          value={config.fontWeight}
          onChange={(v) => handleChange('fontWeight', v)}
          options={[
            { value: "normal", label: "ปกติ" },
            { value: "medium", label: "กลาง" },
            { value: "semibold", label: "กึ่งหนา" },
            { value: "bold", label: "หนา" },
            { value: "black", label: "หนามาก" }
          ]}
        />
        
        <GenericSelect
          label="ระยะภายในแนวนอน"
          value={config.paddingX}
          onChange={(v) => handleChange('paddingX', v)}
          options={[
            { value: "2", label: "เล็กมาก" },
            { value: "4", label: "เล็ก" },
            { value: "6", label: "ปกติ" },
            { value: "8", label: "ใหญ่" },
            { value: "10", label: "ใหญ่มาก" },
            { value: "12", label: "ใหญ่พิเศษ" }
          ]}
        />
        
        <GenericSelect
          label="ระยะภายในแนวตั้ง"
          value={config.paddingY}
          onChange={(v) => handleChange('paddingY', v)}
          options={[
            { value: "1", label: "เล็กมาก" },
            { value: "2", label: "เล็ก" },
            { value: "3", label: "ปกติ" },
            { value: "4", label: "ใหญ่" },
            { value: "5", label: "ใหญ่มาก" },
            { value: "6", label: "ใหญ่พิเศษ" }
          ]}
        />
        
        <IconSelect 
          label="ไอคอน" 
          value={config.iconName} 
          onChange={(v) => handleChange('iconName', v)} 
        />
        
        <GenericSelect
          label="ตำแหน่งไอคอน"
          value={config.iconPosition}
          onChange={(v) => handleChange('iconPosition', v)}
          options={[
            { value: "none", label: "ไม่แสดง" },
            { value: "left", label: "ซ้าย" },
            { value: "right", label: "ขวา" }
          ]}
        />
        
        <GenericSelect
          label="เอฟเฟกต์เมื่อชี้เมาส์"
          value={config.hoverEffect}
          onChange={(v) => handleChange('hoverEffect', v)}
          options={[
            { value: "none", label: "ไม่มี" },
            { value: "scale", label: "ขยายใหญ่" },
            { value: "lift", label: "ลอยขึ้น" },
            { value: "glow", label: "เรืองแสง" }
          ]}
        />
        
      </CollapsibleSection>
    </div>
  );
}
```

Ensure imports at top of PropertyPanel.js include the new inputs:
```js
import {
  TextInput, ColorPickerInput, SizeSelect, WeightSelect, AlignSelect,
  RadiusSelect, ToggleSwitch, PaddingSelect,
  SegmentedToggle, IconSelect, GradientDirectionSelect, GenericSelect,
  CollapsibleSection
} from './controls/SharedInputs';
```

## DO NOT
- Do NOT modify HomeContent.js
- Do NOT modify VoteCTABlock.js or MeetCandidatesCard.js
- Do NOT modify any page file
- Do NOT change existing element entries besides voteCTA-button and meet-cta
- Do NOT delete any existing inputs in SharedInputs.js

## VERIFY
1. npm run build passes
2. Open admin → click voteCTA-button in preview
3. PropertyPanel shows:
   - Simple section: text, bg type toggle, color picker(s), text color, radius, size
   - "ตัวเลือกขั้นสูง" button that expands to show: gradient via, direction, border, shadow, padding, icon, hover
4. Quick Style presets (classic/dark/playful/minimal) still work — clicking them should apply new expanded config
5. Changes to advanced properties update live preview immediately
6. Live production page NOT yet affected (next step bridges config to block)

## REPORT FORMAT
```
Modified elementRegistry.js — expanded voteCTA-button + meet-cta presets with 21 properties each
Modified SharedInputs.js — added 5 new inputs: SegmentedToggle, IconSelect, GradientDirectionSelect, GenericSelect, CollapsibleSection
Modified PropertyPanel.js — restructured ButtonControls into Simple + Advanced (CollapsibleSection) tiers
Build: PASS
```
