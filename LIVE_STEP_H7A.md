# LIVE_STEP_H7A.md — Results Page Editor Wiring (Foundation)

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
Currently Results page in admin editor shows only a placeholder. We need to render
the REAL Results page in editor preview using the real `<ResultCard />` component
with synthesized demo data. This step does NOT make ResultCard stateful yet —
H-7b handles that.

CRITICAL RULE: Use REAL component. NO dummy/mock JSX for ResultCard. The real
`<ResultCard />` from `src/components/ResultCard.js` must render in editor preview
with demo props that match its expected shape.

Multi-party scenario (≥2 parties): show 2 parties + abstain (3 cards, no disapprove)
Single-party scenario (1 party): show 1 party + abstain + disapprove (3 cards)

## SCOPE (DO NOT EXCEED)
Modify exactly 3 files, create 1 new file:

1. CREATE `src/components/admin/ResultsEditorPreview.js`
2. MODIFY `src/utils/editorDummyData.js` — add results demo data
3. MODIFY `src/components/admin/PageDesignTab.js` — add 'results' branch + resultsSimMode toggle
4. MODIFY `src/components/HomeContent.js` — NONE (no changes)

Do NOT modify:
- ResultCard.js (stays untouched until H-7b)
- statefulRegistry, stateResolver, templateEngine
- Any other block component

Do NOT install packages.

## PART 1: Add demo data to `src/utils/editorDummyData.js`

KEEP all existing exports intact. ADD at the end of file:

```js
// =====================================================
// RESULTS PAGE DEMO DATA
// =====================================================
// Used in admin editor preview for Results page.
// ResultCard expects: { id, name, number, score, image?, logoUrl? }

// Multi-party scenario: 2 parties + abstain (NO disapprove in multi)
export const DUMMY_RESULTS_MULTI = [
  {
    id: 1,
    name: "The Unity Concord Of FMS 2",
    number: 1,
    score: 245,
    image: null,
    logoUrl: null
  },
  {
    id: 2,
    name: "อะไรไม่รู้ครับ",
    number: 2,
    score: 187,
    image: null,
    logoUrl: null
  },
  {
    id: 998,
    name: "งดออกเสียง",
    number: 0,
    score: 68,
    image: null,
    logoUrl: null
  }
];

// Single-party scenario: 1 party + abstain + disapprove (HAS disapprove)
export const DUMMY_RESULTS_SINGLE = [
  {
    id: 1,
    name: "The Unity Concord Of FMS 2",
    number: 1,
    score: 312,
    image: null,
    logoUrl: null
  },
  {
    id: 998,
    name: "งดออกเสียง",
    number: 0,
    score: 95,
    image: null,
    logoUrl: null
  },
  {
    id: 999,
    name: "ไม่รับรอง",
    number: -1,
    score: 43,
    image: null,
    logoUrl: null
  }
];

// Total votes for percentage calc
export const DUMMY_RESULTS_TOTALS = {
  multi: 500,
  single: 450
};
```

## PART 2: CREATE `src/components/admin/ResultsEditorPreview.js`

Pattern: render REAL `<ResultCard />` for each demo candidate. Wrap with 
`<EditorElement>` so admin can click them. Match the production layout grid
from `src/app/results/page.js`.

```jsx
"use client";

import ResultCard from '../ResultCard';
import EditorElement from './editor/EditorElement';
import { 
  DUMMY_RESULTS_MULTI, 
  DUMMY_RESULTS_SINGLE,
  DUMMY_RESULTS_TOTALS 
} from '../../utils/editorDummyData';

/**
 * ResultsEditorPreview — renders the Results page in admin editor preview.
 * 
 * Uses REAL ResultCard components with demo data. No mocked JSX.
 * 
 * Props:
 *   simMode: "multi" | "single" — which scenario to show
 *   selectedElement, hoveredElement, onSelectElement, onHoverElement, onHoverEnd
 */
export default function ResultsEditorPreview({
  simMode = "multi",
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null
}) {
  const candidates = simMode === "single" ? DUMMY_RESULTS_SINGLE : DUMMY_RESULTS_MULTI;
  const totalVotes = simMode === "single" 
    ? DUMMY_RESULTS_TOTALS.single 
    : DUMMY_RESULTS_TOTALS.multi;

  // Default editor preview: showScore + revealed (most visually rich state)
  // H-7b will add a state toggle so admin can see other states
  const status = "ENDED";
  const isRevealed = true;

  // Wrap helper — same pattern as HomeContent
  const Wrap = ({ id, children }) => (
    <EditorElement
      id={id}
      isSelected={selectedElement === id}
      isHovered={hoveredElement === id}
      onSelect={onSelectElement}
      onHover={onHoverElement}
      onHoverEnd={onHoverEnd}
    >
      {children}
    </EditorElement>
  );

  return (
    <div className="min-h-[600px] bg-gradient-to-b from-slate-50 to-white p-6">
      {/* Header */}
      <Wrap id="results-header">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600">REAL-TIME UPDATE</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800">
            ผลการเลือกตั้ง <span className="text-[#8A2680]">SAMO 49</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            ระบบเลือกตั้งสโมสรนักศึกษา คณะวิทยาการจัดการ ประจำปีการศึกษา 2569
          </p>
        </div>
      </Wrap>

      {/* Stats summary placeholder — converted in H-8 */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500 font-bold mb-1">คะแนนเสียงรวม</p>
          <p className="text-2xl font-black text-slate-800">{totalVotes}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500 font-bold mb-1">ผู้มีสิทธิ์</p>
          <p className="text-2xl font-black text-slate-800">1,200</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500 font-bold mb-1">ร้อยละ</p>
          <p className="text-2xl font-black text-emerald-500">
            {((totalVotes / 1200) * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Results candidates grid — REAL ResultCard components */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          สรุปผลคะแนนปัจจุบัน (Real-time Results)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 bg-white sm:bg-transparent rounded-2xl border sm:border-0 border-slate-100">
          {candidates.map((candidate, index) => (
            <Wrap key={candidate.id} id={`result-card-${index}`}>
              <ResultCard
                candidate={candidate}
                rank={index + 1}
                totalVotes={totalVotes}
                status={status}
                isRevealed={isRevealed}
                onClick={() => {}}  /* no-op in editor */
              />
            </Wrap>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Note: each result card has a unique Wrap id (`result-card-0`, `result-card-1`, etc.)
For now they all share the same selection target. In H-7b we'll change to a 
single shared id `result-card` so editing one applies to all (since they share 
the same template config).

Adjust import paths if the file structure differs.

## PART 3: Modify `src/components/admin/PageDesignTab.js`

### Step 3a: Add imports
At the top, add:
```js
import ResultsEditorPreview from './ResultsEditorPreview';
```

### Step 3b: Add state for resultsSimMode

Near other simMode state (likely `voteSimMode`):
```js
const [resultsSimMode, setResultsSimMode] = useState('multi'); // 'multi' | 'single'
```

### Step 3c: Add toggle UI for results page

Find where vote sim mode toggle is rendered (when `selectedPage === 'vote'`).
Add an analogous toggle when `selectedPage === 'results'`:

```jsx
{selectedPage === 'results' && (
  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg mb-3">
    <span className="text-xs font-bold text-slate-600">โหมดจำลอง:</span>
    <button
      onClick={() => setResultsSimMode('multi')}
      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
        resultsSimMode === 'multi' 
          ? 'bg-[#8A2680] text-white' 
          : 'bg-white text-slate-600 border border-slate-200'
      }`}
    >
      หลายพรรค
    </button>
    <button
      onClick={() => setResultsSimMode('single')}
      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
        resultsSimMode === 'single' 
          ? 'bg-[#8A2680] text-white' 
          : 'bg-white text-slate-600 border border-slate-200'
      }`}
    >
      พรรคเดียว
    </button>
  </div>
)}
```

### Step 3d: Add 'results' branch in LivePreview rendering

Find the existing branches:
- `selectedPage === 'home'` → `<HomeContent editorMode ... />`
- `selectedPage === 'vote'` → `<MultiPartyView>` or `<SinglePartyView>`
- All others → placeholder

Add a new branch before the placeholder fallback:

```jsx
{selectedPage === 'results' && (
  <ResultsEditorPreview
    simMode={resultsSimMode}
    selectedElement={editor.selectedElement}
    hoveredElement={editor.hoveredElement}
    onSelectElement={editor.setSelectedElement}
    onHoverElement={editor.setHoveredElement}
    onHoverEnd={() => editor.setHoveredElement(null)}
  />
)}
```

The placeholder fallback should now only fire for pages that aren't home/vote/results.

## PART 4: Verification of click-lock (no code changes)

Since H-5.5 added click-lock at LivePreview container level, and ResultsEditorPreview
renders inside that container, ResultCard's `onClick` will be blocked by capture phase.
ResultCard's onClick prop is a no-op in editor (`() => {}`) but if it were a real
handler it would still be intercepted.

## DO NOT
- Do NOT modify ResultCard.js
- Do NOT add `editorMode` or `forceState` to ResultCard yet (that's H-7b)
- Do NOT modify statefulRegistry/stateResolver/templateEngine
- Do NOT remove or alter existing PageDesignTab logic for home/vote
- Do NOT install packages
- Do NOT use mock JSX for ResultCard — must use real component

## VERIFICATION

1. `npm run build` passes exit 0

2. Real `/results` page renders identically to before (no changes touched it)

3. Admin → ออกแบบหน้าเว็บ → click "ผลคะแนน" tab
   - Live preview shows real Results page layout
   - Header: "ผลการเลือกตั้ง SAMO 49"
   - Stats summary cards
   - Toggle: [หลายพรรค ●] [พรรคเดียว]
   - Default mode: multi → 3 cards (2 parties + abstain)
   - First card has yellow winner border + Trophy
   - Cards use REAL `<ResultCard />` component (purple gradient bar, rank badge, etc.)

4. Click [พรรคเดียว] toggle
   - Cards switch to: 1 party + abstain + disapprove
   - Disapprove card shows red Ban-style overlay

5. Hover any card → purple dashed border appears (EditorElement working)

6. Click any card → selection happens, but no `setSelectedParty` modal opens 
   (because `onClick={() => {}}` and click-lock from H-5.5)

7. PropertyPanel — clicking result card sets `selectedElement` to 
   `result-card-0` etc. PropertyPanel will show "no controls" or fallback 
   for now (because no registry entry exists). That's expected — H-7b adds 
   the stateful entry + Gallery controls.

## REPORT FORMAT

```
Modified src/utils/editorDummyData.js — added DUMMY_RESULTS_MULTI, DUMMY_RESULTS_SINGLE, DUMMY_RESULTS_TOTALS
Created src/components/admin/ResultsEditorPreview.js — renders real ResultCard components with demo data, multi/single mode support, EditorElement wrap
Modified src/components/admin/PageDesignTab.js — added resultsSimMode state, multi/single toggle UI for results page, results branch in LivePreview rendering
Build: PASS
```

No other commentary.
