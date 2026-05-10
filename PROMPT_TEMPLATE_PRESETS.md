# Prompt: Phase 1 — Template Presets System

```
Read CLAUDE.md and STYLED_BLOCKS_ARCHITECTURE.md first.

Do all changes without asking for confirmation. Execute everything in sequence.

## Goal
Add a Template Preset system to the admin "ออกแบบหน้าเว็บ" tab.
Admin can pick from 4 pre-designed themes → entire page config changes instantly.
Admin can then fine-tune individual settings after applying a template.
Templates are read-only masters. Applying a template copies its config into the active layout.

## Overview of changes:
1. Create template preset data file
2. Add template selector UI to existing admin page design tab  
3. Add live preview panel next to config panel
4. Connect template selection to pageLayout state

---

## PART 1 — Template Presets Data

Create: src/utils/templatePresets.js

Define 4 template presets. Each preset is a complete pageLayout JSON object
that matches the schema already used by the block system.

```js
export const TEMPLATE_PRESETS = [
  {
    id: "classic",
    name: "Classic",
    nameThเ: "คลาสสิก",
    description: "แบบทางการ สีม่วง/ขาว เหมาะกับการเลือกตั้งทั่วไป",
    thumbnail: "classic", // used for preview card styling
    theme: {
      primaryColor: "#8A2680",
      accentColor: "#9333EA",
      borderRadius: "rounded",
      backgroundStyle: "gradient-light" // light purple gradient
    },
    home: [
      { type: "hero", visible: true, order: 1, column: "left", config: { style: "gradient", showCountdown: true, showStatusBadge: true } },
      { type: "voteCTA", visible: true, order: 2, column: "left", config: {} },
      { type: "meetCandidates", visible: true, order: 3, column: "left", config: { style: "card" } },
      { type: "stats", visible: true, order: 1, column: "right", config: { style: "gradient", showPercentage: true, showTotalEligible: true } },
      { type: "electionBanner", visible: true, order: 2, column: "right", config: { style: "image" } }
    ],
    vote: { multiParty: { gridCols: "auto", cardVariant: "auto", showDivider: true, abstainStyle: "auto" } }
  },
  {
    id: "modern-dark",
    name: "Modern Dark",
    nameTh: "โมเดิร์นดาร์ก",
    description: "พื้นหลังเข้ม สีสดตัดกัน เหมาะกับแคมเปญที่ดูทันสมัย",
    thumbnail: "dark",
    theme: {
      primaryColor: "#7C3AED",
      accentColor: "#06B6D4",
      borderRadius: "rounded",
      backgroundStyle: "dark"
    },
    home: [
      { type: "hero", visible: true, order: 1, column: "left", config: { style: "dark", showCountdown: true, showStatusBadge: true } },
      { type: "voteCTA", visible: true, order: 2, column: "left", config: {} },
      { type: "meetCandidates", visible: true, order: 3, column: "left", config: { style: "card" } },
      { type: "stats", visible: true, order: 1, column: "right", config: { style: "dark", showPercentage: true, showTotalEligible: true } },
      { type: "electionBanner", visible: true, order: 2, column: "right", config: { style: "image" } }
    ],
    vote: { multiParty: { gridCols: "auto", cardVariant: "auto", showDivider: true, abstainStyle: "auto" } }
  },
  {
    id: "playful",
    name: "Playful",
    nameTh: "สนุกสนาน",
    description: "สีสันสดใส rounded มากขึ้น เหมาะกับบรรยากาศเลือกตั้งที่ fun",
    thumbnail: "playful",
    theme: {
      primaryColor: "#EC4899",
      accentColor: "#F59E0B",
      borderRadius: "pill",
      backgroundStyle: "gradient-warm"
    },
    home: [
      { type: "hero", visible: true, order: 1, column: "left", config: { style: "gradient", showCountdown: true, showStatusBadge: true } },
      { type: "meetCandidates", visible: true, order: 2, column: "left", config: { style: "card" } },
      { type: "voteCTA", visible: true, order: 3, column: "left", config: {} },
      { type: "stats", visible: true, order: 1, column: "right", config: { style: "gradient", showPercentage: true, showTotalEligible: true } },
      { type: "electionBanner", visible: true, order: 2, column: "right", config: { style: "image" } }
    ],
    vote: { multiParty: { gridCols: "auto", cardVariant: "auto", showDivider: false, abstainStyle: "compact" } }
  },
  {
    id: "minimal",
    name: "Minimal",
    nameTh: "มินิมอล",
    description: "ขาวสะอาด typography เด่น เรียบหรู ดูเป็นมืออาชีพ",
    thumbnail: "minimal",
    theme: {
      primaryColor: "#1E293B",
      accentColor: "#8A2680",
      borderRadius: "sharp",
      backgroundStyle: "white"
    },
    home: [
      { type: "hero", visible: true, order: 1, column: "left", config: { style: "minimal", showCountdown: true, showStatusBadge: false } },
      { type: "voteCTA", visible: true, order: 2, column: "left", config: {} },
      { type: "meetCandidates", visible: true, order: 3, column: "left", config: { style: "card" } },
      { type: "stats", visible: true, order: 1, column: "right", config: { style: "card", showPercentage: true, showTotalEligible: true } },
      { type: "electionBanner", visible: false, order: 2, column: "right", config: {} }
    ],
    vote: { multiParty: { gridCols: "2", cardVariant: "grid", showDivider: true, abstainStyle: "minimal" } }
  }
];

export const getPresetById = (id) => TEMPLATE_PRESETS.find(p => p.id === id);
export const DEFAULT_PRESET_ID = "classic";
```

---

## PART 2 — Template Selector UI

Modify the existing admin page design tab (wherever the "ออกแบบหน้าเว็บ" tab component is).

Add a NEW section at the TOP of the tab, ABOVE the existing section list:

### Template Selector Section:
```
┌─────────────────────────────────────────────────────────┐
│  🎨 เลือก Template                          [ใช้งาน]   │
│  เลือกธีมสำเร็จรูป แล้วปรับแต่งเพิ่มเติมได้            │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Classic  │ │  Modern  │ │ Playful  │ │ Minimal  │   │
│  │ ●active  │ │  Dark    │ │          │ │          │   │
│  │ 🟣⬜     │ │ 🟣🔵    │ │ 🩷🟡    │ │ ⬛🟣    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

Each template card shows:
- Template name (Thai)
- Color dots showing primaryColor + accentColor
- Description text (1 line, truncated)
- Selected state: border-2 border-[primaryColor] + check badge
- On click: show confirm dialog "ต้องการใช้ template นี้หรือไม่? การตั้งค่าปัจจุบันจะถูกแทนที่"
- On confirm: copy preset's home[], vote{}, theme{} into pageLayout state
- The "บันทึก" (save) button saves to API as usual

Template cards layout: grid grid-cols-2 md:grid-cols-4 gap-3

### Important UX:
- After applying template, the section list below updates to reflect new order/visibility
- Admin can still manually adjust sections after applying template
- Current active template is detected by comparing theme.primaryColor with presets
- If config doesn't match any preset exactly → show "Custom" badge instead

---

## PART 3 — Live Preview Panel

Add a live preview to the right side of the page design tab on desktop.

### Desktop layout (lg+):
```
┌────────────────────┬─────────────────────────────┐
│   Config Panel     │   Live Preview              │
│   (existing)       │   (NEW)                     │
│   w-full lg:w-1/2  │   w-full lg:w-1/2           │
│                    │                             │
│   Template cards   │   ┌─────────────────────┐   │
│   Section list     │   │  Scaled-down         │   │
│   Multi-party cfg  │   │  BlockRenderer       │   │
│                    │   │  scale(0.5)           │   │
│                    │   │  transform-origin:    │   │
│                    │   │  top center           │   │
│                    │   └─────────────────────┘   │
│                    │   [Desktop] [Mobile] toggle  │
└────────────────────┴─────────────────────────────┘
```

### Mobile layout (< lg):
- Preview hidden by default
- Button "ดู Preview" toggles preview overlay

### Preview implementation:
- Import BlockRenderer from existing blocks
- Pass current pageLayout state directly (no API fetch)
- Wrap in a container with:
  - overflow: hidden
  - border: 1px solid border-slate-200
  - border-radius: rounded-xl
  - Fixed height: h-[600px]
  - Inner div: transform scale(0.5), transform-origin top center, width 200%
- Device toggle: 
  - "Desktop" → inner width 200% (scales to fill container)
  - "Mobile" → inner width 375px centered, with device frame border

### Preview updates in real-time:
- Every state change in config panel → preview re-renders automatically
- No need for save → preview is driven by React state, not API

---

## PART 4 — Wire template to pageLayout state

When admin selects a template and confirms:

```js
const applyTemplate = (presetId) => {
  const preset = getPresetById(presetId);
  if (!preset) return;
  
  setPageLayout(prev => ({
    ...prev,
    home: preset.home,
    vote: preset.vote,
    theme: preset.theme,
    _appliedTemplate: presetId // track which template was base
  }));
};
```

The existing save flow (PUT /api/admin/page-layout) saves the entire pageLayout 
including the new theme values. No API changes needed.

---

## Files summary:

NEW:
- src/utils/templatePresets.js

MODIFY:
- Admin page design tab component (add template selector + live preview)
  (Check which file contains the ออกแบบหน้าเว็บ tab — likely inside admin/page.js 
  or a separate component imported there)

DO NOT MODIFY:
- BlockRenderer.js, block components, HomeContent.js, vote/page.js
- API routes
- Database schema

## Constraints:
- No new npm dependencies (use existing Tailwind + Lucide + Framer Motion)
- Template presets are static data — not stored in DB, defined in code
- getPath() for any URLs
- Admin auth pattern unchanged
- Preserve Thai comments
- Mobile-first responsive

## Verification:
1. [ ] Template cards render in admin tab with correct colors
2. [ ] Clicking template shows confirm dialog
3. [ ] Confirming applies template config to state
4. [ ] Section list updates after template applied
5. [ ] Live preview shows BlockRenderer output
6. [ ] Preview updates in real-time when config changes
7. [ ] Device toggle switches preview width
8. [ ] Save button persists template config to API
9. [ ] Public home page reflects saved template
10. [ ] Mobile admin layout hides preview, shows toggle button
```
