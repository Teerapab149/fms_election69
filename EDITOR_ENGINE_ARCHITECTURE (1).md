# EDITOR_ENGINE_ARCHITECTURE.md
# Element-level Visual Page Editor with Mix & Match Presets

## Core Concept

ทุก element ใน page เป็นอิสระจากกัน แต่ละ element มี style presets 4 แบบ
(Classic, Dark, Playful, Minimal) ให้เลือก Admin สามารถ:
1. เลือก Page Template → ตั้งค่าทุก element เข้าชุดกัน (preset จุดเริ่มต้น)
2. คลิก element ไหนก็ได้ → เปลี่ยน preset เฉพาะ element นั้น (mix & match)
3. ปรับ manual ทีละค่า → override preset ได้อิสระ

Template = "จุดเริ่มต้น" ไม่ใช่ "กรอบจำกัด"

---

## Data Flow

```
Admin กดเลือก Template "Classic"
  ↓
ทุก element ถูกตั้งค่าเป็น preset "classic"
  ↓
Admin คลิกปุ่ม Vote → PropertyPanel เปิด
  ↓
Admin กด Quick Style [Dark] → ปุ่ม Vote เปลี่ยนเป็น Dark style
  ↓
Admin ปรับสีเพิ่มเป็น #059669 → override manual
  ↓
ผลลัพธ์: หน้าเว็บ layout Classic + ปุ่ม Vote สไตล์ Dark แต่สีเขียว
  ↓
Admin กด "บันทึก" → JSON ทั้งหมดถูก save ลง DB
```

---

## Element Registry — ELEMENT_PRESETS

Every editable element has 4 style presets. See elementRegistry.js for full list.

Element types and their configurable properties:
- text: text, fontSize, color, fontWeight, align
- button: text, backgroundColor, textColor, borderRadius, borderColor
- card: backgroundColor, borderColor, borderRadius, visible
- image: visible, borderRadius
- toggle: visible

Home page elements (15 total):
hero-title, hero-subtitle, hero-subtitle2, hero-year-badge, hero-countdown,
hero-status-badge, stats-header, stats-voted-card, stats-progress-card,
stats-eligible-card, voteCTA-button, meet-section, meet-title, meet-cta,
banner-section

---

## PropertyPanel with Quick Style

```
┌──────────────────────────────────┐
│ ปุ่มโหวต (Vote CTA)          ✕  │
│ Section: voteCTA                 │
│ ─────────────────────────────── │
│ Quick Style:                     │
│ [●คลาสสิก] [●ดาร์ก] [●สนุกสนาน]│
│ [●มินิมอล] [↩ Reset]            │
│ ─────────────────────────────── │
│ ปรับเอง:                        │
│ ข้อความ:    [_______________]   │
│ สีปุ่ม:     [●] #8A2680         │
│ สีตัวอักษร: [●] #ffffff         │
│ มุมโค้ง:    [xl        ▼]       │
└──────────────────────────────────┘
```

---

## File Structure

```
src/components/admin/editor/
├── EditorElement.js
├── useEditorState.js
├── elementRegistry.js
├── PropertyPanel.js
├── QuickStyleBar.js
├── controls/
│   └── SharedInputs.js
└── previews/
    └── HomeEditorPreview.js
```

---

## STEP-BY-STEP PROMPTS

### STEP 1: Foundation (3 new files)
Create EditorElement.js, useEditorState.js, controls/SharedInputs.js
No existing files modified.

### STEP 2: Registry + Panel (3 new files)
Create elementRegistry.js, QuickStyleBar.js, PropertyPanel.js
No existing files modified.

### STEP 3: Home Preview (1 new file)
Create previews/HomeEditorPreview.js
No existing files modified.

### STEP 4: Wire into admin tab (1 file modified)
Modify admin page design tab only.

### STEP 5: Polish + Save/Load
Small fixes, persistence, edge cases.

---

See full prompt details for each step in the STEP sections below.
Each step is self-contained — run one at a time.
