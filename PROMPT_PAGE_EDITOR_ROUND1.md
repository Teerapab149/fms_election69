# Prompt: Page Editor Round 1 — Page Selector + Template + Live Preview

```
Read CLAUDE.md and STYLED_BLOCKS_ARCHITECTURE.md first.

Do all changes without asking for confirmation. Execute in sequence.
Verify npm run build passes after each major part.

## Goal

Redesign the admin "ออกแบบหน้าเว็บ" tab into a proper Page Editor with:
1. Template selector at top (already exists — enhance it)
2. Page selector to choose which page to edit
3. Section list that changes based on selected page
4. Live preview panel (functional for Home, placeholder for others)

---

## PART 1 — Page Registry Data

Create: src/utils/pageRegistry.js

Define all editable pages and their grid/section structure:

```js
import { Home, Vote, BarChart3, Users, PartyPopper, CheckCircle } from 'lucide-react';

export const EDITABLE_PAGES = [
  {
    id: "home",
    name: "หน้าหลัก",
    nameEn: "Landing Page", 
    icon: "Home",
    path: "/",
    gridLayout: "two-column",  // left + right columns
    columns: {
      left: ["hero", "voteCTA", "meetCandidates"],
      right: ["stats", "electionBanner"]
    },
    description: "หน้าแรกของเว็บไซต์ แสดง countdown, สถิติ, ปุ่มโหวต"
  },
  {
    id: "vote",
    name: "หน้าลงคะแนน",
    nameEn: "Vote Page",
    icon: "Vote",
    path: "/vote",
    gridLayout: "single-column",
    columns: {
      main: ["header", "partyGrid", "abstainButton"]
    },
    description: "หน้าเลือกพรรค (Multi-party / Single-party)",
    hasSubModes: true  // single vs multi
  },
  {
    id: "results",
    name: "ผลคะแนน",
    nameEn: "Results Page",
    icon: "BarChart3",
    path: "/results",
    gridLayout: "single-column",
    columns: {
      main: ["header", "chartSection", "candidateCards", "demographics"]
    },
    description: "แสดงผลการลงคะแนนเสียงแบบ Real-time"
  },
  {
    id: "candidates",
    name: "รายชื่อผู้สมัคร",
    nameEn: "Candidates Page",
    icon: "Users",
    path: "/candidates",
    gridLayout: "single-column",
    columns: {
      main: ["header", "partyCardGrid"]
    },
    description: "แสดงรายชื่อพรรคทั้งหมดที่ลงสมัคร"
  },
  {
    id: "party",
    name: "หน้าพรรค",
    nameEn: "Party Detail",
    icon: "PartyPopper",
    path: "/party",
    gridLayout: "cinematic",
    columns: {
      main: ["hero", "vision", "policies", "gallery", "team", "voteSection"]
    },
    description: "หน้ารายละเอียดของแต่ละพรรค (Cinematic layout)"
  },
  {
    id: "success",
    name: "โหวตสำเร็จ",
    nameEn: "Success Page",
    icon: "CheckCircle",
    path: "/success",
    gridLayout: "centered",
    columns: {
      main: ["successMessage", "googleFormLink"]
    },
    description: "หน้าแสดงผลหลังโหวตเสร็จ"
  }
];

export const getPageById = (id) => EDITABLE_PAGES.find(p => p.id === id);
export const DEFAULT_PAGE = "home";
```

---

## PART 2 — Redesign the ออกแบบหน้าเว็บ Tab

Find the existing PageDesignTab or equivalent component in the admin page.
Restructure it with this layout:

### Top section — Template Selector (keep existing, minor enhance):
- Keep the 4 template cards that already work
- Add a badge showing current active template name

### Middle section — Page Selector (NEW):
```
┌─────────────────────────────────────────────────────────────┐
│  📄 เลือกหน้าที่ต้องการแก้ไข                                │
│                                                             │
│  [🏠 หน้าหลัก] [🗳 หน้าลงคะแนน] [📊 ผลคะแนน]              │
│  [👥 รายชื่อผู้สมัคร] [🎉 หน้าพรรค] [✅ โหวตสำเร็จ]         │
└─────────────────────────────────────────────────────────────┘
```

UI: horizontal scrollable pill buttons on mobile, flex-wrap on desktop
Each pill shows: icon + Thai name
Selected state: bg-[#8A2680] text-white
Default selected: "home"

State: const [selectedPage, setSelectedPage] = useState("home");

### Bottom section — Split layout (config + preview):

```
Desktop (lg+):
┌──────────────────────┬───────────────────────────────┐
│  Section List        │  Live Preview                 │
│  (for selected page) │  (for selected page)          │
│  w-full lg:w-[45%]   │  w-full lg:w-[55%]            │
│                      │                               │
│  Shows sections      │  Home: BlockRenderer          │
│  relevant to the     │  Others: Placeholder card     │
│  selected page       │  with screenshot/message      │
│                      │                               │
│  [บันทึก] button     │  [Desktop] [Mobile] toggle    │
└──────────────────────┴───────────────────────────────┘

Mobile (< lg):
- Config panel full width
- Preview hidden, button "ดู Preview" toggles it
```

---

## PART 3 — Section List per Page

When selectedPage changes, the section list must show
ONLY the sections relevant to that page.

For "home": show the existing block list (hero, stats, meetCandidates, etc.)
  — this already works, keep it

For other pages: show the sections from pageRegistry columns,
  but with a "Coming Soon" overlay or simplified controls.

```jsx
const getPageSections = (pageId) => {
  const page = getPageById(pageId);
  if (!page) return [];
  
  if (pageId === "home") {
    // Return actual homeBlocks from pageLayout state (existing logic)
    return homeBlocks;
  }
  
  // For other pages: generate section items from registry
  const allSections = Object.values(page.columns).flat();
  return allSections.map((sectionId, index) => ({
    type: sectionId,
    order: index,
    visible: true,
    config: {},
    _isPlaceholder: true  // flag to show "coming soon" in controls
  }));
};
```

For placeholder sections (non-home pages), show:
- Section name + icon
- Toggle visible (saves to pageLayout[pageId] in state)
- Reorder arrows (saves order)
- But NO config expand — just a muted text "รายละเอียดเพิ่มเติมเร็วๆ นี้"

For "vote" page specifically:
- Show the multiParty config controls that already exist
  (gridCols, cardVariant, showDivider, abstainStyle)
- These controls should still save to pageLayout.vote.multiParty

---

## PART 4 — Live Preview Panel

### For "home" page:
- Import BlockRenderer
- Pass current pageLayout.home state
- Wrap in scaled container:
  ```jsx
  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white h-[600px]">
    <div className="origin-top-left" style={{
      transform: `scale(${deviceMode === 'mobile' ? 0.4 : 0.45})`,
      width: deviceMode === 'mobile' ? '375px' : '200%',
      height: '200%'
    }}>
      {/* Render actual page content */}
      <BlockRenderer blocks={currentPageBlocks} data={previewData} />
    </div>
  </div>
  ```

### Device toggle:
```jsx
const [deviceMode, setDeviceMode] = useState('desktop');

<div className="flex gap-2">
  <button 
    onClick={() => setDeviceMode('desktop')}
    className={deviceMode === 'desktop' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}
  >Desktop</button>
  <button 
    onClick={() => setDeviceMode('mobile')}
    className={deviceMode === 'mobile' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}
  >Mobile</button>
</div>
```

### For other pages (not home):
Show a placeholder card:
```jsx
<div className="h-[600px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-center p-8">
  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
    {/* page icon */}
  </div>
  <h3 className="text-lg font-bold text-slate-700 mb-2">{page.name}</h3>
  <p className="text-sm text-slate-400 mb-4">Live preview สำหรับหน้านี้กำลังพัฒนา</p>
  <a href={getPath(page.path)} target="_blank" 
     className="text-sm text-[#8A2680] font-bold hover:underline">
    เปิดหน้าจริง →
  </a>
</div>
```

---

## PART 5 — Save Logic Update

Currently save sends pageLayout as a flat object.
Extend it to save per-page config:

```js
const handleSave = async () => {
  const payload = {
    ...pageLayout,
    // Ensure page-specific configs are included
    home: homeBlocks,
    vote: pageLayout.vote || {},
    results: pageLayout.results || {},
    candidates: pageLayout.candidates || {},
    party: pageLayout.party || {},
    success: pageLayout.success || {},
    theme: pageLayout.theme || {}
  };
  
  // existing PUT logic
  const res = await fetch(getPath('/api/admin/page-layout'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify(payload)
  });
  // ... existing success/error handling
};
```

No API changes needed — pageLayout is Json type, accepts any shape.

---

## Files summary:

NEW:
- src/utils/pageRegistry.js

MODIFY:
- Admin page design tab component (wherever ออกแบบหน้าเว็บ content lives)
  Most likely a component imported in admin/page.js or defined inline there.

DO NOT MODIFY:
- BlockRenderer.js, block components, HomeContent.js
- vote/page.js, results/page.js, candidates/page.js
- API routes, database schema
- Template presets file (keep as-is)

## Constraints:
- No new npm dependencies
- Use existing Lucide icons
- getPath() for all URLs
- Admin auth unchanged
- Preserve Thai comments
- Mobile-first responsive
- Preview must not block the page — use React state, not API fetch

## Verification:
1. [ ] Page selector renders 6 page pills
2. [ ] Clicking a page pill changes section list below
3. [ ] "home" shows existing block list with full controls
4. [ ] "vote" shows multiParty config controls
5. [ ] Other pages show section list with placeholder controls
6. [ ] Live preview renders BlockRenderer for "home"
7. [ ] Live preview shows placeholder for other pages
8. [ ] Device toggle changes preview width
9. [ ] Template selector still works — applying template updates home sections
10. [ ] Save button persists all page configs to API
11. [ ] Mobile admin: preview hidden, toggle button works
12. [ ] npm run build passes with no errors
```
