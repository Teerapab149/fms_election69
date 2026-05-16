# EDITOR_STEP2.md — Element Registry + QuickStyleBar + PropertyPanel

```
Read CLAUDE.md and EDITOR_ENGINE_ARCHITECTURE.md first.
Create 3 new files only. Do not modify any existing files.
Verify npm run build passes.

## File 1: src/components/admin/editor/elementRegistry.js

Export these:

### ELEMENT_PRESETS object
Every Home page element with 4 presets each. Full list:

"hero-title": type "text", label "ชื่อหลัก", section "hero"
  classic:  { text: "SAMO 49", fontSize: "5xl", color: "#1a1a2e", fontWeight: "900", align: "left" }
  dark:     { text: "SAMO 49", fontSize: "5xl", color: "#ffffff", fontWeight: "900", align: "left" }
  playful:  { text: "SAMO 49", fontSize: "5xl", color: "#EC4899", fontWeight: "900", align: "center" }
  minimal:  { text: "SAMO 49", fontSize: "4xl", color: "#1E293B", fontWeight: "700", align: "left" }

"hero-subtitle": type "text", label "คำอธิบายหลัก", section "hero"
  classic:  { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "base", color: "#374151" }
  dark:     { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "base", color: "#94a3b8" }
  playful:  { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "lg", color: "#831843" }
  minimal:  { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "sm", color: "#64748b" }

"hero-subtitle2": type "text", label "คำอธิบายรอง", section "hero"
  classic:  { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#6b7280" }
  dark:     { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#64748b" }
  playful:  { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#9d174d" }
  minimal:  { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "xs", color: "#94a3b8" }

"hero-year-badge": type "text", label "ปีการศึกษา", section "hero"
  classic:  { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#6b7280" }
  dark:     { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#64748b" }
  playful:  { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#be185d" }
  minimal:  { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#94a3b8" }

"hero-countdown": type "toggle", label "Countdown Timer", section "hero"
  classic: { visible: true }, dark: { visible: true }, playful: { visible: true }, minimal: { visible: false }

"hero-status-badge": type "toggle", label "Status Badge", section "hero"
  classic: { visible: true }, dark: { visible: true }, playful: { visible: true }, minimal: { visible: false }

"stats-header": type "text", label "หัวข้อสถิติ", section "stats"
  classic:  { text: "สถิติผู้เข้าร่วมลงคะแนนโหวต", fontSize: "xs", color: "#374151" }
  dark:     { text: "สถิติผู้เข้าร่วมลงคะแนนโหวต", fontSize: "xs", color: "#e2e8f0" }
  playful:  { text: "มาโหวตกันเถอะ!", fontSize: "sm", color: "#be185d" }
  minimal:  { text: "สถิติ", fontSize: "xs", color: "#64748b" }

"stats-voted-card": type "card", label "กล่องจำนวนผู้โหวต", section "stats"
  classic:  { backgroundColor: "#8A2680", textColor: "#ffffff", borderRadius: "2xl" }
  dark:     { backgroundColor: "#0f172a", textColor: "#06b6d4", borderRadius: "2xl", borderColor: "#06b6d4" }
  playful:  { backgroundColor: "#EC4899", textColor: "#ffffff", borderRadius: "3xl" }
  minimal:  { backgroundColor: "#1E293B", textColor: "#ffffff", borderRadius: "lg" }

"stats-progress-card": type "card", label "กล่องความคืบหน้า", section "stats"
  classic:  { backgroundColor: "#ffffff", borderRadius: "xl", borderColor: "#e2e8f0" }
  dark:     { backgroundColor: "#1e293b", borderRadius: "xl", borderColor: "#334155" }
  playful:  { backgroundColor: "#fdf2f8", borderRadius: "2xl", borderColor: "#fbcfe8" }
  minimal:  { backgroundColor: "#ffffff", borderRadius: "md", borderColor: "#e2e8f0" }

"stats-eligible-card": type "card", label "กล่องผู้มีสิทธิ์", section "stats"
  (same presets as stats-progress-card)

"voteCTA-button": type "button", label "ปุ่มโหวต", section "voteCTA"
  classic:  { text: "เข้าสู่ระบบ / Sign In", backgroundColor: "#8A2680", textColor: "#ffffff", borderRadius: "xl" }
  dark:     { text: "VOTE NOW", backgroundColor: "#06B6D4", textColor: "#ffffff", borderRadius: "full" }
  playful:  { text: "โหวตเลย!", backgroundColor: "#EC4899", textColor: "#ffffff", borderRadius: "full" }
  minimal:  { text: "เข้าสู่ระบบ →", backgroundColor: "transparent", textColor: "#1E293B", borderRadius: "none", borderColor: "#1E293B" }

"meet-section": type "card", label "การ์ดรู้จักผู้สมัคร", section "meetCandidates"
  classic:  { backgroundColor: "#ffffff", borderRadius: "2xl", borderColor: "#fecdd3", visible: true }
  dark:     { backgroundColor: "#1e293b", borderRadius: "2xl", borderColor: "#334155", visible: true }
  playful:  { backgroundColor: "#fdf2f8", borderRadius: "3xl", borderColor: "#fbcfe8", visible: true }
  minimal:  { backgroundColor: "#ffffff", borderRadius: "lg", borderColor: "#e2e8f0", visible: true }

"meet-title": type "text", label "หัวข้อรู้จักผู้สมัคร", section "meetCandidates"
  classic:  { text: "รู้จักผู้สมัครของคุณหรือยัง?", fontSize: "sm", color: "#1a1a2e", fontWeight: "700" }
  dark:     { text: "รู้จักผู้สมัครของคุณหรือยัง?", fontSize: "sm", color: "#e2e8f0", fontWeight: "700" }
  playful:  { text: "มาทำความรู้จักกัน!", fontSize: "base", color: "#be185d", fontWeight: "700" }
  minimal:  { text: "ผู้สมัคร", fontSize: "sm", color: "#374151", fontWeight: "500" }

"meet-cta": type "button", label "ปุ่มดูรายชื่อ", section "meetCandidates"
  classic:  { text: "ดูรายชื่อพรรค →", backgroundColor: "#1a1a2e", textColor: "#ffffff", borderRadius: "full" }
  dark:     { text: "ดูรายชื่อพรรค →", backgroundColor: "#06b6d4", textColor: "#ffffff", borderRadius: "full" }
  playful:  { text: "ไปดูกัน! →", backgroundColor: "#EC4899", textColor: "#ffffff", borderRadius: "full" }
  minimal:  { text: "ดูรายชื่อ →", backgroundColor: "transparent", textColor: "#1E293B", borderRadius: "none" }

"banner-section": type "image", label "แบนเนอร์เลือกตั้ง", section "electionBanner"
  classic: { visible: true, borderRadius: "2xl" }
  dark: { visible: true, borderRadius: "2xl" }
  playful: { visible: true, borderRadius: "3xl" }
  minimal: { visible: false, borderRadius: "lg" }

### PRESET_NAMES object
  classic: { name: "คลาสสิก", color: "#8A2680" }
  dark: { name: "ดาร์ก", color: "#7C3AED" }
  playful: { name: "สนุกสนาน", color: "#EC4899" }
  minimal: { name: "มินิมอล", color: "#1E293B" }

### getPresetDefaults(presetId) function
  Loops ELEMENT_PRESETS, returns object with all elements set to that preset's config.
  Returns: { [elementId]: { type, label, section, config: preset.config } }

### getElementPresets(elementId) function
  Returns the presets object for a single element.

---

## File 2: src/components/admin/editor/QuickStyleBar.js

"use client" component.

Props: elementId, currentConfig, onApplyPreset

Renders 4 preset buttons in a flex row (flex-wrap gap-2):
- Each button: flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
  border transition-all
- Shows: colored dot (w-3 h-3 rounded-full) + preset Thai name
- Active detection: compare currentConfig values with preset values
  If ALL values match → this preset is active → bg-slate-800 text-white border-slate-800
  If not matching → bg-white text-slate-600 border-slate-200 hover:border-slate-400
- Click → onApplyPreset(elementId, presetId)

Plus a reset button: text-xs text-slate-400 hover:text-[#8A2680] "↩ รีเซ็ต"

Import ELEMENT_PRESETS, PRESET_NAMES from elementRegistry.

---

## File 3: src/components/admin/editor/PropertyPanel.js

"use client" component.

Props: selectedElement (string|null), elementConfigs (object),
       onUpdateConfig(elementId, key, value), 
       onApplyPreset(elementId, presetId),
       onDeselect()

### When no element selected:
Show empty state:
- Centered in container
- Hand pointer icon (use CSS or ☝ character)
- "คลิก element ใน preview เพื่อแก้ไข"
- text-sm text-slate-400

### When element selected:
Get element data: elementConfigs[selectedElement]
Get type: element.type
Get config: element.config

Layout:
1. Header bar: 
   - Left: element label (font-bold text-sm text-slate-800) + "ใน {section}" (text-xs text-slate-400)
   - Right: close button (X icon, onClick → onDeselect)
   - bg-slate-50 px-4 py-3 border-b

2. QuickStyleBar:
   - px-4 py-3
   - Pass elementId, currentConfig=config, onApplyPreset

3. Divider: border-b with "ปรับเอง" label (text-[10px] text-slate-400 uppercase)

4. Controls area (px-4 py-3 space-y-4 overflow-y-auto):
   Based on type, render controls from SharedInputs:
   
   type "text":
   - TextInput label="ข้อความ" value={config.text}
   - SizeSelect label="ขนาด" value={config.fontSize}
   - ColorPickerInput label="สี" value={config.color}
   - WeightSelect label="น้ำหนัก" value={config.fontWeight}
   - AlignSelect label="จัดแนว" value={config.align}

   type "button":
   - TextInput label="ข้อความปุ่ม" value={config.text}
   - ColorPickerInput label="สีปุ่ม" value={config.backgroundColor}
   - ColorPickerInput label="สีตัวอักษร" value={config.textColor}
   - RadiusSelect label="มุมโค้ง" value={config.borderRadius}
   - ColorPickerInput label="สีขอบ" value={config.borderColor}

   type "card":
   - ColorPickerInput label="สีพื้นหลัง" value={config.backgroundColor}
   - ColorPickerInput label="สีขอบ" value={config.borderColor}
   - RadiusSelect label="มุมโค้ง" value={config.borderRadius}
   - ToggleSwitch label="แสดง" value={config.visible}

   type "image":
   - ToggleSwitch label="แสดง" value={config.visible}
   - RadiusSelect label="มุมโค้ง" value={config.borderRadius}

   type "toggle":
   - ToggleSwitch label="แสดง" value={config.visible}

   Each control: onChange → onUpdateConfig(selectedElement, key, value)

Overall: max-h-[calc(100vh-300px)] overflow-y-auto
Design: clean, compact, matching admin console style
```
