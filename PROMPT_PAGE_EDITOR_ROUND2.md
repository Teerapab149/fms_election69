# Prompt: Page Editor Round 2 — Live Preview All Pages + Drag Reorder

```
Read CLAUDE.md, STYLED_BLOCKS_ARCHITECTURE.md, and src/utils/pageRegistry.js first.

Do all changes without asking for confirmation. Execute in sequence.
Verify npm run build passes after each major part.

## Context
Round 1 is complete. The admin "ออกแบบหน้าเว็บ" tab now has:
- Template selector (4 presets)
- Page selector (6 pages)
- Section list with reorder/toggle for Home
- Live preview for Home page using BlockRenderer
- Placeholder preview for other pages

Round 2 goals:
1. Live preview for Vote and Results pages
2. Constrained drag-drop reorder on the section list (not free-form — grid-locked)
3. Visual improvements to the editor layout
4. Section config expand panels for Vote page

---

## PART 1 — Live Preview for Vote Page

When selectedPage === "vote", render a simplified vote page preview instead of placeholder.

Create: src/components/admin/previews/VotePreview.js

This component renders a SIMPLIFIED version of the multi-party vote layout:
- Header text "เลือกตั้งสโมสรนักศึกษา"
- Party card grid (use dummy data: 2-3 fake party cards with colored circles as logos)
- Abstain button
- Reads config from pageLayout.vote.multiParty to show correct grid/variant/style

```jsx
"use client";
import { Ban } from 'lucide-react';

const DUMMY_PARTIES = [
  { id: 1, number: 1, name: "พรรค A", color: "#8A2680" },
  { id: 2, number: 2, name: "พรรค B", color: "#2563EB" },
  { id: 3, number: 3, name: "พรรค C", color: "#059669" },
];

export default function VotePreview({ config = {} }) {
  const { gridCols = "auto", cardVariant = "auto", showDivider = true, abstainStyle = "auto" } = config;
  const partyCount = DUMMY_PARTIES.length;
  const resolvedVariant = cardVariant === "auto" ? (partyCount <= 3 ? "grid" : "compact") : cardVariant;
  const resolvedAbstain = abstainStyle === "auto" ? (partyCount <= 3 ? "standard" : "compact") : abstainStyle;

  // Determine grid classes
  const gridClasses = gridCols === "2" ? "grid-cols-2" 
    : gridCols === "3" ? "grid-cols-3" 
    : "grid-cols-2";

  return (
    <div className="bg-[#F8F9FD] min-h-full p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex px-3 py-1 rounded-full bg-purple-50 border border-purple-100 mb-3">
          <span className="text-[10px] font-bold text-[#8A2680]">ลงคะแนนเสียง</span>
        </div>
        <h1 className="text-xl font-black text-slate-800">
          เลือกตั้ง<span className="text-[#8A2680]">สโมสรนักศึกษา</span>
        </h1>
      </div>

      {/* Party Grid */}
      <div className={`grid ${gridClasses} gap-3 max-w-md mx-auto mb-4`}>
        {DUMMY_PARTIES.map(party => (
          <div key={party.id} className="bg-white rounded-xl border border-slate-100 p-4 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: party.color }}>
              {party.number}
            </div>
            <p className="text-xs font-bold text-slate-700">{party.name}</p>
            {resolvedVariant === "grid" && (
              <p className="text-[8px] text-slate-400 mt-1">สโลแกนพรรค</p>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      {showDivider && (
        <div className="flex items-center gap-3 max-w-xs mx-auto mb-3">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-[8px] text-slate-400 font-bold">หรือ</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>
      )}

      {/* Abstain */}
      {resolvedAbstain === "standard" && (
        <div className="max-w-xs mx-auto bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-2">
          <Ban size={16} className="text-orange-500" />
          <span className="text-xs font-bold text-slate-600">งดออกเสียง</span>
        </div>
      )}
      {resolvedAbstain === "compact" && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border border-slate-200 bg-white">
            <Ban size={12} className="text-orange-500" />
            <span className="text-[10px] font-bold text-slate-500">งดออกเสียง</span>
          </div>
        </div>
      )}
      {resolvedAbstain === "minimal" && (
        <div className="text-center">
          <span className="text-[10px] text-slate-400">งดออกเสียง</span>
        </div>
      )}
    </div>
  );
}
```

### Wire it into the preview panel:
In the live preview section of the admin tab:
```jsx
if (selectedPage === "home") {
  // existing BlockRenderer preview
} else if (selectedPage === "vote") {
  <VotePreview config={pageLayout?.vote?.multiParty || {}} />
} else {
  // placeholder
}
```

---

## PART 2 — Live Preview for Results Page

Create: src/components/admin/previews/ResultsPreview.js

Simplified results page with dummy data:
- Header "ผลการลงคะแนนเสียง"
- Dummy bar chart (pure CSS, no recharts needed)
- 2-3 candidate result cards with progress bars
- Total votes summary

```jsx
"use client";

const DUMMY_RESULTS = [
  { name: "พรรค A", score: 156, color: "#8A2680" },
  { name: "พรรค B", score: 98, color: "#2563EB" },
  { name: "งดออกเสียง", score: 42, color: "#F59E0B" },
];

export default function ResultsPreview({ config = {} }) {
  const total = DUMMY_RESULTS.reduce((s, r) => s + r.score, 0);
  const maxScore = Math.max(...DUMMY_RESULTS.map(r => r.score));

  return (
    <div className="bg-[#F8F9FD] min-h-full p-6">
      <div className="text-center mb-6">
        <h1 className="text-xl font-black text-slate-800">ผลการลงคะแนนเสียง</h1>
        <p className="text-xs text-slate-400 mt-1">รวมทั้งหมด {total} คะแนน</p>
      </div>

      <div className="space-y-3 max-w-md mx-auto">
        {DUMMY_RESULTS.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-700">{r.name}</span>
              <span className="text-sm font-black" style={{ color: r.color }}>{r.score} คะแนน</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" 
                style={{ width: `${(r.score / maxScore) * 100}%`, backgroundColor: r.color }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{((r.score / total) * 100).toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Wire into preview: selectedPage === "results" → <ResultsPreview />

---

## PART 3 — Constrained Drag-Drop Reorder

Replace the ArrowUp/ArrowDown buttons in the section list with drag-drop reorder.

DO NOT install new npm packages. Use native HTML5 Drag and Drop API:

```jsx
// Inside section list component

const [draggedIndex, setDraggedIndex] = useState(null);
const [dragOverIndex, setDragOverIndex] = useState(null);

const handleDragStart = (e, index) => {
  setDraggedIndex(index);
  e.dataTransfer.effectAllowed = 'move';
  // Make drag image semi-transparent
  e.currentTarget.style.opacity = '0.5';
};

const handleDragEnd = (e) => {
  e.currentTarget.style.opacity = '1';
  setDraggedIndex(null);
  setDragOverIndex(null);
};

const handleDragOver = (e, index) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  setDragOverIndex(index);
};

const handleDrop = (e, dropIndex) => {
  e.preventDefault();
  if (draggedIndex === null || draggedIndex === dropIndex) return;
  
  // Reorder the blocks array
  const newBlocks = [...blocks];
  const [dragged] = newBlocks.splice(draggedIndex, 1);
  newBlocks.splice(dropIndex, 0, dragged);
  
  // Update order values
  const reordered = newBlocks.map((block, i) => ({ ...block, order: i }));
  setBlocks(reordered);
  setDraggedIndex(null);
  setDragOverIndex(null);
};
```

Each section item:
```jsx
<div
  draggable
  onDragStart={(e) => handleDragStart(e, index)}
  onDragEnd={handleDragEnd}
  onDragOver={(e) => handleDragOver(e, index)}
  onDrop={(e) => handleDrop(e, index)}
  className={`... existing classes ...
    ${dragOverIndex === index ? 'border-t-2 border-[#8A2680]' : ''}
    ${draggedIndex === index ? 'opacity-50' : ''}
    cursor-grab active:cursor-grabbing
  `}
>
  {/* Add drag handle icon on the left */}
  <div className="text-slate-300 hover:text-slate-500 mr-2">
    <GripVertical size={16} />
  </div>
  {/* ... rest of section item content */}
</div>
```

Import GripVertical from lucide-react.

KEEP the ArrowUp/ArrowDown buttons as well — some users prefer clicking.
The drag is an enhancement, not a replacement.

Visual feedback during drag:
- Dragged item: opacity-50
- Drop target: top border highlight in purple (#8A2680)
- Invalid drop (same position): no highlight

---

## PART 4 — Visual Improvements

### 4a. Preview panel improvements:
- Add a subtle shadow inside the preview container: shadow-inner
- Add "scale indicator" text: "Preview 45%" in small muted text
- Device toggle buttons: use Lucide Monitor and Smartphone icons
- Mobile preview: center the 375px width container with a phone-like rounded border

### 4b. Section list improvements:
- Each section item should have a subtle left color bar (4px) matching its type:
  - hero: purple (#8A2680)
  - stats: green (#059669)  
  - voteCTA: red (#DC2626)
  - meetCandidates: blue (#2563EB)
  - electionBanner: amber (#D97706)
- Hover state: slight bg change + shadow

### 4c. Page selector improvements:
- Add a subtle transition when switching pages
- Show the page path below the page name in smaller text: "/vote", "/results" etc.
- Selected pill should have a subtle shadow

---

## PART 5 — Vote Page Config Controls

When selectedPage === "vote", the section list area should show
the multiParty config controls that already exist from Round 1.

Make sure these controls are visible and functional:
- Grid Columns (dropdown: Auto, 2, 3)
- Card Variant (dropdown: Auto, Grid, Compact)
- Show Divider (toggle)
- Abstain Style (dropdown: Auto, Standard, Compact, Minimal)

When any of these change → VotePreview re-renders immediately showing the change.
This creates the "live editing" experience for the vote page.

---

## Files summary:

NEW:
- src/components/admin/previews/VotePreview.js
- src/components/admin/previews/ResultsPreview.js

MODIFY:
- Admin page design tab component (add previews, drag-drop, visual improvements)

DO NOT MODIFY:
- BlockRenderer.js, block components, HomeContent.js
- Public page files (vote/page.js, results/page.js etc.)
- API routes, database schema
- templatePresets.js, pageRegistry.js

## Constraints:
- No new npm dependencies (use HTML5 Drag API, not @dnd-kit)
- Lucide icons only
- getPath() for URLs
- Preserve Thai comments
- Mobile-first responsive

## Verification:
1.  [ ] Vote page preview renders with dummy party cards
2.  [ ] Vote preview responds to multiParty config changes in real-time
3.  [ ] Results page preview renders with dummy bar charts
4.  [ ] Drag-drop reorder works on section list (Home page)
5.  [ ] Drop indicator shows purple top border on target
6.  [ ] ArrowUp/ArrowDown buttons still work alongside drag
7.  [ ] GripVertical drag handle shows on each section item
8.  [ ] Device toggle (Desktop/Mobile) works on all preview types
9.  [ ] Section items have colored left border bars
10. [ ] Page selector pills have path text and transition
11. [ ] Vote config controls (gridCols, cardVariant etc.) visible when "vote" selected
12. [ ] Vote config changes update VotePreview immediately
13. [ ] Saving after vote config change persists to API
14. [ ] npm run build passes with no errors
```
