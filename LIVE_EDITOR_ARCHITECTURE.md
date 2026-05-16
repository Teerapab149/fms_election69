# LIVE_EDITOR_ARCHITECTURE.md
# Unified Component Pattern: Real Pages = Editor Previews

## Core Principle
One component, two modes. Same code renders the real public page AND the admin editor preview.

## Mode Detection

```jsx
<HomeContent />                           // Real page — fetches from API
<HomeContent editorMode={true} ... />     // Admin preview — uses dummy data + editable wrappers
```

## Required Props (all optional, default to normal mode)

```ts
{
  editorMode?: boolean = false,           // Main switch
  editorData?: object = null,             // Dummy data replacing API data
  elementConfigs?: object = null,         // Element style overrides
  selectedElement?: string | null = null,
  hoveredElement?: string | null = null,
  onSelectElement?: (id) => void = null,
  onHoverElement?: (id) => void = null,
  onHoverEnd?: () => void = null
}
```

## Pattern Rules

1. **Data resolution:** `const data = editorMode ? editorData : realApiData;`
2. **Skip API calls:** When `editorMode === true`, do not fetch from API
3. **Element wrapper:** Every editable element wrapped with conditional `<Wrap id="element-id">`
4. **Config resolution:** Every styled property reads from `cfg(id, defaults)` helper
5. **No breakage:** When all editor props are undefined, component behaves exactly as before

## Helpers Every Page Uses

```jsx
// Conditional wrapper — render EditorElement only in editor mode
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
) : <>{children}</>;

// Config resolver — merge defaults with editor overrides
const cfg = (id, defaults = {}) => editorMode
  ? { ...defaults, ...(elementConfigs?.[id]?.config || {}) }
  : defaults;
```

## Size/Radius Maps (shared across pages)

Create: `src/utils/styleMaps.js`
```js
export const SIZE_MAP = { 
  xs:'0.75rem', sm:'0.875rem', base:'1rem', lg:'1.125rem',
  xl:'1.25rem', '2xl':'1.5rem', '3xl':'1.875rem', 
  '4xl':'2.25rem', '5xl':'3rem', '6xl':'3.75rem', '7xl':'4.5rem'
};

export const RADIUS_MAP = { 
  none:'0', sm:'0.125rem', md:'0.375rem', lg:'0.5rem',
  xl:'0.75rem', '2xl':'1rem', '3xl':'1.5rem', full:'9999px' 
};

export const WEIGHT_MAP = {
  thin:'100', light:'300', normal:'400', medium:'500',
  semibold:'600', bold:'700', extrabold:'800', black:'900'
};
```

## Dummy Data Per Page

Create: `src/utils/editorDummyData.js`
```js
export const DUMMY_ELECTION = {
  title: "SAMO 49",
  subtitle: "โครงการเลือกตั้งคณะกรรมการบริหาร",
  subtitle2: "สโมสรนักศึกษาคณะวิทยาการจัดการ",
  year: 2569,
  endDate: "2027-01-01",
  status: "UPCOMING",
  totalVoted: 342,
  totalEligible: 1200,
  percentageVoted: 28.50
};

export const DUMMY_PARTIES = [
  { id: 1, number: 1, name: "The Unity Concord Of FMS 2", slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน", logoUrl: null, groupImageUrl: null, voteCount: 245, color: "#8A2680" },
  { id: 2, number: 2, name: "อะไรไม่รู้ครับ", slogan: "หกด", logoUrl: null, groupImageUrl: null, voteCount: 187, color: "#2563EB" }
];

export const DUMMY_ABSTAIN = { id: 998, number: 0, name: "งดออกเสียง", voteCount: 68 };

export const DUMMY_USER = { name: "Teerapab Boonsri", studentId: "6610510149" };

export const DUMMY_PARTY_DETAIL = {
  id: 1, number: 1, name: "The Unity Concord Of FMS 2",
  slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน",
  logoUrl: null, groupImageUrl: null,
  vision: "The Unity Concord of FMS สะท้อนถึงความสำคัญของการรวมตัวกันเป็นหนึ่งเดียวกันในหมู่คณะ...",
  policies: [
    "บูรณาการเสริมสร้างองค์ความรู้และพัฒนาเพื่อยกระดับทักษะด้านวิชาชีพ",
    "มุ่งเน้นการสร้างสังคมที่มีความเป็นหนึ่งเดียวจากความหลากหลาย",
    "เปิดโอกาสในการแสดงศักยภาพและความสามารถในทุกด้าน"
  ],
  team: [
    { name: "สมิตานันท์ ธรณสุนทร", role: "นายกสโมสรนักศึกษา", imageUrl: null },
    { name: "สุภัคกานต์ สุทธิพันธ์", role: "อุปนายกฝ่ายกิจการภายใน", imageUrl: null },
    { name: "นันทณัฐ หัสชัย", role: "อุปนายกฝ่ายกิจการภายนอก", imageUrl: null }
  ]
};
```

---

# EXECUTION RULES FOR CLAUDE CODE

**READ THESE RULES BEFORE EVERY STEP:**

1. **ONLY modify files explicitly listed in the step.** Do not touch any other file.
2. **DO NOT refactor unrelated code.** If you see code that "could be better", leave it.
3. **DO NOT add features not requested.** No extra controls, no extra states, no "nice-to-haves".
4. **DO NOT change imports, exports, or component APIs** unless the step explicitly says so.
5. **Preserve all existing behavior for non-editor mode.** When editor props are not passed, component must work exactly as before.
6. **Preserve all Thai comments** in existing code.
7. **Use `getPath()` for all URLs.**
8. **DO NOT install new npm packages.**
9. **DO NOT create files not listed in the step.**
10. **Verify `npm run build` passes after each step.** If it fails, fix only the errors — do not refactor.
11. **DO NOT run the dev server or suggest running it.**
12. **When a step says "minimal change" — count your diff lines. If over 50 lines added to one function, you are doing it wrong.**
13. **Report format when done: list files modified with 1-line summary each. No walls of explanation.**
