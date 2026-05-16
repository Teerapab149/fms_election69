# LIVE_STEP_D.md — Refactor Vote Page for editor mode (with Single/Multi toggle)

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## TASK SCOPE (DO NOT EXCEED)
This step has 4 parts executed in order. Each part modifies specific files only.

Part 1: Add dummy data for single-party mode
Part 2: Add elements to registry for vote page
Part 3: Refactor MultiPartyView to support editor mode
Part 4: Refactor SinglePartyView to support editor mode
Part 5: Wire into admin tab with Single/Multi toggle

Read for reference only:
- `src/components/HomeContent.js` (pattern example)
- `src/components/admin/editor/EditorElement.js`
- `src/components/admin/editor/elementRegistry.js`
- `src/utils/styleMaps.js`
- `src/utils/editorDummyData.js`

---

## PART 1 — Add single-party dummy data

### File to modify: `src/utils/editorDummyData.js`

Add these exports AT THE END of the file (do not change existing exports):

```js
// Single party scenario — one party with approve/disapprove choice
export const DUMMY_PARTIES_SINGLE = [
  {
    id: 1,
    number: 1,
    name: "The Unity Concord Of FMS 2",
    slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน",
    logoUrl: null,
    groupImageUrl: null,
    voteCount: 245,
    color: "#8A2680"
  }
];

// Alias for clarity when using multi-party mode
export const DUMMY_PARTIES_MULTI = [
  {
    id: 1,
    number: 1,
    name: "The Unity Concord Of FMS 2",
    slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน",
    logoUrl: null,
    groupImageUrl: null,
    voteCount: 245,
    color: "#8A2680"
  },
  {
    id: 2,
    number: 2,
    name: "อะไรไม่รู้ครับ",
    slogan: "หกด",
    logoUrl: null,
    groupImageUrl: null,
    voteCount: 187,
    color: "#2563EB"
  }
];

// Special options (abstain, disapprove)
export const DUMMY_SPECIAL_OPTIONS = {
  abstain: { id: 998, number: 0, name: "งดออกเสียง", voteCount: 68 },
  disapprove: { id: 999, number: -1, name: "ไม่รับรอง", voteCount: 12 }
};
```

---

## PART 2 — Add vote elements to elementRegistry

### File to modify: `src/components/admin/editor/elementRegistry.js`

Add these element entries TO THE EXISTING `ELEMENT_PRESETS` object (keep all existing entries untouched):

```js
// === VOTE PAGE ELEMENTS ===
"vote-header-badge": {
  type: "text",
  label: "ป้าย 'ลงคะแนนเสียง'",
  section: "voteHeader",
  presets: {
    classic:  { text: "ลงคะแนนเสียง", fontSize: "xs", color: "#8A2680" },
    dark:     { text: "VOTE NOW", fontSize: "xs", color: "#06b6d4" },
    playful:  { text: "โหวตเลย!", fontSize: "sm", color: "#EC4899" },
    minimal:  { text: "ลงคะแนน", fontSize: "xs", color: "#64748b" }
  }
},
"vote-header-title": {
  type: "text",
  label: "หัวข้อหน้าโหวต",
  section: "voteHeader",
  presets: {
    classic:  { text: "เลือกตั้งสโมสรนักศึกษา", fontSize: "3xl", color: "#1a1a2e", fontWeight: "black" },
    dark:     { text: "เลือกตั้งสโมสรนักศึกษา", fontSize: "3xl", color: "#ffffff", fontWeight: "black" },
    playful:  { text: "เลือกพรรคที่ใช่!", fontSize: "3xl", color: "#EC4899", fontWeight: "black" },
    minimal:  { text: "เลือกตั้ง", fontSize: "2xl", color: "#1E293B", fontWeight: "bold" }
  }
},
"vote-header-subtitle": {
  type: "text",
  label: "ข้อความทักทาย",
  section: "voteHeader",
  presets: {
    classic:  { text: "โปรดเลือกพรรคที่ต้องการ", fontSize: "sm", color: "#64748b" },
    dark:     { text: "โปรดเลือกพรรคที่ต้องการ", fontSize: "sm", color: "#94a3b8" },
    playful:  { text: "เลือกพรรคในใจของคุณ!", fontSize: "base", color: "#be185d" },
    minimal:  { text: "โปรดเลือก", fontSize: "xs", color: "#94a3b8" }
  }
},
"vote-party-card": {
  type: "card",
  label: "การ์ดพรรค",
  section: "voteBody",
  presets: {
    classic:  { backgroundColor: "#ffffff", borderRadius: "2xl", borderColor: "#e2e8f0" },
    dark:     { backgroundColor: "#1e293b", borderRadius: "2xl", borderColor: "#334155" },
    playful:  { backgroundColor: "#fdf2f8", borderRadius: "3xl", borderColor: "#fbcfe8" },
    minimal:  { backgroundColor: "#ffffff", borderRadius: "lg", borderColor: "#e2e8f0" }
  }
},
"vote-abstain-button": {
  type: "button",
  label: "ปุ่มงดออกเสียง",
  section: "voteBody",
  presets: {
    classic:  { text: "งดออกเสียง", backgroundColor: "#ffffff", textColor: "#f97316", borderRadius: "xl", borderColor: "#fed7aa" },
    dark:     { text: "งดออกเสียง", backgroundColor: "#1e293b", textColor: "#f97316", borderRadius: "xl", borderColor: "#9a3412" },
    playful:  { text: "งดออกเสียง", backgroundColor: "#fff7ed", textColor: "#f97316", borderRadius: "full", borderColor: "#fed7aa" },
    minimal:  { text: "งดออกเสียง", backgroundColor: "transparent", textColor: "#64748b", borderRadius: "none" }
  }
},
"vote-disapprove-button": {
  type: "button",
  label: "ปุ่มไม่รับรอง (single-party)",
  section: "voteBody",
  presets: {
    classic:  { text: "ไม่รับรอง", backgroundColor: "#ffffff", textColor: "#dc2626", borderRadius: "xl", borderColor: "#fecaca" },
    dark:     { text: "ไม่รับรอง", backgroundColor: "#1e293b", textColor: "#ef4444", borderRadius: "xl", borderColor: "#7f1d1d" },
    playful:  { text: "ไม่รับรอง", backgroundColor: "#fef2f2", textColor: "#dc2626", borderRadius: "full", borderColor: "#fecaca" },
    minimal:  { text: "ไม่รับรอง", backgroundColor: "transparent", textColor: "#64748b", borderRadius: "none" }
  }
},
```

---

## PART 3 — Refactor MultiPartyView

### File to modify: `src/components/vote/MultiPartyView.js`

Add editor mode props and wrap elements. Apply same pattern as HomeContent.js from Step B.

### 3.1 Add imports at top
```js
import EditorElement from '../admin/editor/EditorElement';
import { SIZE_MAP, RADIUS_MAP, WEIGHT_MAP } from '../../utils/styleMaps';
```

### 3.2 Accept new props (all default to undefined/false)
Add to existing function signature:
```js
editorMode = false,
elementConfigs = null,
selectedElement = null,
hoveredElement = null,
onSelectElement = null,
onHoverElement = null,
onHoverEnd = null,
```

### 3.3 Add helpers inside component body
```jsx
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
) : children;

const cfg = (id, defaults = {}) => editorMode
  ? { ...defaults, ...(elementConfigs?.[id]?.config || {}) }
  : defaults;
```

### 3.4 Wrap these elements (only if they exist in the current render)
- `vote-party-card` — wrap each party card (loop index)
- `vote-abstain-button` — wrap the abstain button

For the party card, since there are multiple, use a unique wrapper approach:
```jsx
{regularParties.map((party, idx) => (
  idx === 0 && editorMode ? (
    <Wrap key={party.id} id="vote-party-card">
      <PartyCard ... />
    </Wrap>
  ) : (
    <PartyCard key={party.id} ... />
  )
))}
```
Only wrap the FIRST party card for editing (represents the style for all).

### 3.5 Apply cfg overrides ONLY in editor mode
For abstain button, merge style conditionally:
```jsx
<button style={editorMode ? {
  backgroundColor: cfg('vote-abstain-button').backgroundColor || undefined,
  color: cfg('vote-abstain-button').textColor || undefined,
  borderRadius: RADIUS_MAP[cfg('vote-abstain-button').borderRadius] || undefined,
  borderColor: cfg('vote-abstain-button').borderColor || undefined,
} : undefined}>
  {editorMode ? (cfg('vote-abstain-button').text || 'งดออกเสียง') : /* existing */}
</button>
```

### 3.6 Do NOT touch
- The auto-adaptive logic (partyCount ≤ 3 → grid, ≥ 4 → compact)
- HARD RULES (all parties render, abstain always visible, no disapprove in multi)
- onSelect logic
- Existing config prop behavior (gridCols, cardVariant, showDivider, abstainStyle)

---

## PART 4 — Refactor SinglePartyView

### File to modify: `src/components/vote/SinglePartyView.js`

Apply same pattern: props, imports, Wrap/cfg helpers.

### 4.1 Elements to wrap in SinglePartyView
- `vote-party-card` — the single party card
- `vote-abstain-button` — abstain button
- `vote-disapprove-button` — disapprove button (this only exists in single mode)

### 4.2 Do NOT touch
- createPortal logic (if present)
- approve/disapprove/abstain selection flow
- Existing styling classes in non-editor mode

---

## PART 5 — Wire into admin tab with Single/Multi toggle

### File to modify: admin page design tab (same file as Step C)

### 5.1 Add imports
```js
import MultiPartyView from '../../components/vote/MultiPartyView';
import SinglePartyView from '../../components/vote/SinglePartyView';
import { 
  DUMMY_PARTIES_SINGLE, 
  DUMMY_PARTIES_MULTI, 
  DUMMY_SPECIAL_OPTIONS,
  DUMMY_USER
} from '../../utils/editorDummyData';
```

### 5.2 Add state for vote mode toggle
Near other state declarations:
```js
const [voteSimMode, setVoteSimMode] = useState('multi'); // 'single' | 'multi'
```

### 5.3 Add toggle UI (visible only when selectedPage === 'vote')
Above the Live Preview panel when viewing vote page, add:
```jsx
{selectedPage === 'vote' && (
  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg mb-3">
    <span className="text-xs font-bold text-slate-600">โหมดจำลอง:</span>
    <button
      onClick={() => setVoteSimMode('single')}
      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
        voteSimMode === 'single' ? 'bg-[#8A2680] text-white' : 'bg-white text-slate-600 border border-slate-200'
      }`}
    >
      1 พรรค
    </button>
    <button
      onClick={() => setVoteSimMode('multi')}
      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
        voteSimMode === 'multi' ? 'bg-[#8A2680] text-white' : 'bg-white text-slate-600 border border-slate-200'
      }`}
    >
      หลายพรรค
    </button>
  </div>
)}
```

### 5.4 Render the right component in preview
Find where Home is rendered (from Step C). Add a sibling branch for vote:

```jsx
{selectedPage === 'vote' && voteSimMode === 'multi' && (
  <MultiPartyView
    regularParties={DUMMY_PARTIES_MULTI}
    specialOptions={DUMMY_SPECIAL_OPTIONS}
    selectedPartyId={null}
    onSelect={() => {}}
    onViewDetails={() => {}}
    config={pageLayout?.vote?.multiParty || {}}
    editorMode={true}
    elementConfigs={editor.elementConfigs}
    selectedElement={editor.selectedElement}
    hoveredElement={editor.hoveredElement}
    onSelectElement={editor.setSelectedElement}
    onHoverElement={editor.setHoveredElement}
    onHoverEnd={() => editor.setHoveredElement(null)}
  />
)}

{selectedPage === 'vote' && voteSimMode === 'single' && (
  <SinglePartyView
    party={DUMMY_PARTIES_SINGLE[0]}
    specialOptions={DUMMY_SPECIAL_OPTIONS}
    selectedPartyId={null}
    onSelect={() => {}}
    onViewDetails={() => {}}
    user={DUMMY_USER}
    editorMode={true}
    elementConfigs={editor.elementConfigs}
    selectedElement={editor.selectedElement}
    hoveredElement={editor.hoveredElement}
    onSelectElement={editor.setSelectedElement}
    onHoverElement={editor.setHoveredElement}
    onHoverEnd={() => editor.setHoveredElement(null)}
  />
)}
```

Adjust prop names based on what SinglePartyView actually expects (check its current usage).

### 5.5 Keep existing behavior
- Home preview wiring from Step C stays
- Other pages' previews (Results, Candidates, Party, Success) stay as-is
- All scaling/device toggle wrappers stay

---

## WHAT NOT TO DO (CRITICAL)
- Do NOT change Hard Rules of vote logic (all parties render, abstain visible, etc.)
- Do NOT modify useVoteSystem, VoteFooter, VoteConfirmationModal
- Do NOT refactor onSelect flow or party selection logic
- Do NOT remove the existing `config` prop on MultiPartyView
- Do NOT change PartyCard component
- Do NOT create new preview files
- Do NOT add "nice-to-have" features

## VERIFICATION
1. `npm run build` passes exit 0
2. Real `/vote` page with 1 party → renders SinglePartyView normally
3. Real `/vote` page with 2+ parties → renders MultiPartyView normally
4. Admin tab → select หน้าลงคะแนน → toggle 1 พรรค / หลายพรรค → preview switches between SinglePartyView and MultiPartyView
5. Hover vote-party-card, vote-abstain-button, vote-disapprove-button → purple dashed highlight appears

## REPORT FORMAT
```
Part 1: Modified src/utils/editorDummyData.js — added DUMMY_PARTIES_SINGLE, DUMMY_PARTIES_MULTI, DUMMY_SPECIAL_OPTIONS
Part 2: Modified src/components/admin/editor/elementRegistry.js — added 6 vote elements
Part 3: Modified src/components/vote/MultiPartyView.js — editor props + 2 wrapped elements
Part 4: Modified src/components/vote/SinglePartyView.js — editor props + 3 wrapped elements
Part 5: Modified [admin tab path] — voteSimMode toggle + conditional vote component rendering
Build: PASS
```

No extra explanation.
