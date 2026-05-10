# LIVE_STEP_H7A_FIX.md — Component Extraction + Real ResultsEditorPreview

## READ FIRST
Read `CLAUDE.md`, `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES", and 
`DECISIONS.md` (D-004 — no dummy components rule). Follow strictly.

## CONTEXT
After H-7a, ResultsEditorPreview has gaps:
- Mock JSX for stats summary cards (violates D-004)
- Missing Navbar
- Missing Demographics panels  
- Missing Footer
- Missing demo data for demographics

This batch fixes ALL of these by:
1. Extracting reusable components from inline JSX in `/results` page
2. Wiring real components into ResultsEditorPreview

This batch is LARGE but tightly coupled — treating as one unit prevents 
broken intermediate state.

## SCOPE (DO NOT EXCEED)
Modify exactly 4 files, create 3 new files:

CREATE:
1. `src/components/ResultsStatsBar.js` — extracted stats summary cards
2. `src/components/ResultsDemographics.js` — extracted demographics panels
3. `src/components/SiteFooter.js` — extracted footer (will use globalConfig in H-CON later)

MODIFY:
4. `src/app/results/page.js` — replace inline JSX with new components
5. `src/components/admin/ResultsEditorPreview.js` — use real components everywhere
6. `src/utils/editorDummyData.js` — add DUMMY_RESULTS_DEMOGRAPHICS + eligible total
7. (Optional if needed) `src/components/HomeContent.js` — replace inline footer with SiteFooter

Do NOT modify:
- ResultCard.js
- statefulRegistry / stateResolver / templateEngine
- Other pages' footers (only HomeContent + results — keep diff small)
- Any global config consumer migration (that's H-CON)
- API routes

## PART 1: CREATE `src/components/ResultsStatsBar.js`

Extract the inline JSX from `src/app/results/page.js` lines 393-425.

```jsx
"use client";

import { Activity, Users, PieChart as PieIcon } from 'lucide-react';

/**
 * ResultsStatsBar — 3-card stats summary used in Results page.
 * Extracted from inline JSX in src/app/results/page.js.
 * 
 * Props:
 *   totalVotes: number
 *   totalEligible: number
 *   isNotStarted: boolean — when true, shows "-" placeholders
 */
export default function ResultsStatsBar({ 
  totalVotes = 0, 
  totalEligible = 0, 
  isNotStarted = false 
}) {
  const percentage = totalEligible > 0 
    ? ((totalVotes / totalEligible) * 100).toFixed(2) 
    : '0.00';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-8 lg:mb-12">
      {/* Card 1 — คะแนนเสียงรวม */}
      <div className="col-span-2 lg:col-span-1 bg-white/90 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-[#8A2680]/20 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[#8A2680]"></div>
        <div>
          <p className="text-xs font-bold text-[#8A2680] uppercase tracking-wider mb-1">
            คะแนนเสียงรวม
          </p>
          <p className="text-3xl lg:text-5xl font-black text-[#8A2680]">
            {isNotStarted ? "-" : totalVotes.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#8A2680]/10 p-2 lg:p-4 rounded-xl text-[#8A2680]">
          <Activity className="w-6 h-6 lg:w-8 lg:h-8" />
        </div>
      </div>

      {/* Card 2 — ผู้มีสิทธิ์ */}
      <div className="bg-white/90 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-slate-400"></div>
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            ผู้มีสิทธิ์
          </p>
          <p className="text-3xl lg:text-5xl font-black text-slate-700">
            {totalEligible.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-100 p-2 lg:p-4 rounded-xl text-slate-500">
          <Users className="w-6 h-6 lg:w-8 lg:h-8" />
        </div>
      </div>

      {/* Card 3 — ร้อยละ */}
      <div className="bg-white/90 backdrop-blur-sm p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-emerald-200 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500"></div>
        <div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            ร้อยละ
          </p>
          <p className="text-3xl lg:text-5xl font-black text-emerald-600">
            {isNotStarted ? "-%" : `${percentage}%`}
          </p>
        </div>
        <div className="bg-emerald-50 p-2 lg:p-4 rounded-xl text-emerald-500">
          <PieIcon className="w-6 h-6 lg:w-8 lg:h-8" />
        </div>
      </div>
    </div>
  );
}
```

CRITICAL: Match the EXACT classNames from results/page.js line 393-425. If any
class differs, copy from the original. Don't introduce visual changes.

## PART 2: CREATE `src/components/ResultsDemographics.js`

Extract from `src/app/results/page.js` lines 498-563. Keep the conditional 
tree (revealed/counting/locked) AS-IS so it works in both production and editor.

```jsx
"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, Lock } from 'lucide-react';

const COLORS_BAR = "#8A2680";
const YEAR_COLOR = "#fbbf24";

function getGenderColor(name) {
  if (name === "Male" || name === "M") return "#3b82f6";
  if (name === "Female" || name === "F") return "#ec4899";
  return "#94a3b8";
}

/**
 * ResultsDemographics — demographic chart panels for Results page.
 * 
 * Props:
 *   demographics: { byMajor, byYear, byGender }
 *   isMobile: boolean
 *   isRevealed: boolean
 *   isEnded: boolean
 *   isNotStarted: boolean
 */
export default function ResultsDemographics({ 
  demographics, 
  isMobile = false, 
  isRevealed = false, 
  isEnded = false, 
  isNotStarted = false 
}) {
  // Conditional tree from original results/page.js:498
  if (!isEnded && !isRevealed) {
    // Pre-vote / not ended / not revealed
    return (
      <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-100">
        <Lock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700 mb-1">สถิติยังไม่เปิดเผย</h3>
        <p className="text-sm text-slate-500">
          ข้อมูลสถิติจะแสดงหลังจากปิดหีบเลือกตั้งแล้วเท่านั้น
        </p>
      </div>
    );
  }
  
  if (isEnded && !isRevealed) {
    // ENDED + not revealed → counting placeholder
    return (
      <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-100">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 mb-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-600">COUNTING</span>
        </div>
        <h3 className="text-base font-bold text-slate-700 mb-1">
          กำลังนับคะเเนนเสียงชาว FMS
        </h3>
        <p className="text-sm text-slate-500">
          รอประกาศผลอย่างเป็นทางการ
        </p>
      </div>
    );
  }

  // isRevealed → full demographics
  const byMajor = demographics?.byMajor || [];
  const byYear = demographics?.byYear || [];
  const byGender = demographics?.byGender || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Major + Year (left column) */}
      <div className="space-y-4 lg:space-y-6">
        {/* By Major */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#8A2680]" />
            <h3 className="text-sm font-bold text-slate-700">แยกตามสาขา</h3>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
            <BarChart 
              data={byMajor} 
              layout="vertical"
              margin={{ top: 5, right: 20, left: isMobile ? 80 : 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                width={isMobile ? 70 : 90}
              />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS_BAR} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Year */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-700">ชั้นปี</h3>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <BarChart 
              data={byYear}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill={YEAR_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gender (right column) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-[#8A2680]" />
          <h3 className="text-sm font-bold text-slate-700">เพศ</h3>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 480}>
          <PieChart>
            <Pie
              data={byGender}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 50 : 80}
              outerRadius={isMobile ? 90 : 140}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {byGender.map((entry, idx) => (
                <Cell key={idx} fill={getGenderColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip />
            <Legend layout={isMobile ? "horizontal" : "vertical"} verticalAlign={isMobile ? "bottom" : "middle"} align={isMobile ? "center" : "right"} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

CRITICAL: Match the original chart structure exactly. If results/page.js uses 
slightly different config, prefer the original.

## PART 3: CREATE `src/components/SiteFooter.js`

```jsx
"use client";

/**
 * SiteFooter — shared footer used across all pages.
 * Replaces inline JSX duplicated in 6+ files.
 * 
 * In a future step (H-CON), this will read from useGlobalConfig() to get
 * year + faculty + university dynamically.
 * 
 * Props:
 *   className: extra classes for spacing (mt-8 lg:mt-16 etc.)
 */
export default function SiteFooter({ className = "" }) {
  return (
    <footer className={`text-center py-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm ${className}`}>
      <p className="text-slate-400 text-sm">
        © FMS@PSU 2026. All Rights Reserved.
      </p>
    </footer>
  );
}
```

NOTE: Hardcoded text stays for now. H-CON migration replaces with globalConfig.

## PART 4: Modify `src/app/results/page.js`

### 4a. Add imports
```js
import ResultsStatsBar from '../../components/ResultsStatsBar';
import ResultsDemographics from '../../components/ResultsDemographics';
import SiteFooter from '../../components/SiteFooter';
```

Remove now-unused imports IF they were only used by the extracted JSX:
- Recharts imports (BarChart, etc.) — ONLY remove if no other code in file uses them
- Activity / Users / PieChart icons — same caveat
- Lock icon — keep if used elsewhere

CHECK before removing. Use the original if uncertain.

### 4b. Replace inline stats bar JSX

**Find** lines 393-425 (the 3 stats cards inline JSX).

**Replace with:**
```jsx
<ResultsStatsBar
  totalVotes={totalVotes}
  totalEligible={demographics.totalEligible}
  isNotStarted={isNotStarted}
/>
```

### 4c. Replace inline demographics JSX

**Find** lines 498-563 (the conditional demographics block).

**Replace with:**
```jsx
<ResultsDemographics
  demographics={demographics}
  isMobile={isMobile}
  isRevealed={isRevealed}
  isEnded={finalStatus === "ENDED"}
  isNotStarted={isNotStarted}
/>
```

### 4d. Replace inline footer

**Find** lines 625-627 (the `<footer>` JSX).

**Replace with:**
```jsx
<SiteFooter className="mt-8 lg:mt-16" />
```

## PART 5: Modify `src/components/HomeContent.js` (optional but recommended)

Replace the inline footer (lines 388-390 area) with `<SiteFooter />`.

**Only if straightforward** — if the existing footer has unusual conditional 
rendering or wrapper, leave it for now and we'll address in H-CON.

## PART 6: Modify `src/utils/editorDummyData.js`

ADD at the end of file (keep all existing exports):

```js
// Demographics demo data for ResultsEditorPreview
export const DUMMY_RESULTS_DEMOGRAPHICS = {
  totalEligible: 1200,
  byMajor: [
    { name: "บัญชี", value: 142 },
    { name: "การเงิน", value: 98 },
    { name: "การจัดการ", value: 87 },
    { name: "การตลาด", value: 73 },
    { name: "ระบบสารสนเทศ", value: 56 },
    { name: "การจัดการโลจิสติกส์", value: 44 }
  ],
  byYear: [
    { name: "ปี 1", value: 145 },
    { name: "ปี 2", value: 132 },
    { name: "ปี 3", value: 118 },
    { name: "ปี 4", value: 105 }
  ],
  byGender: [
    { name: "Male", value: 234 },
    { name: "Female", value: 266 }
  ]
};
```

## PART 7: Modify `src/components/admin/ResultsEditorPreview.js`

Replace the entire mock-heavy version with REAL components throughout.

Replace the existing implementation entirely:

```jsx
"use client";

import Navbar from '../Navbar';
import ResultCard from '../ResultCard';
import ResultsStatsBar from '../ResultsStatsBar';
import ResultsDemographics from '../ResultsDemographics';
import SiteFooter from '../SiteFooter';
import EditorElement from './editor/EditorElement';
import { 
  DUMMY_RESULTS_MULTI, 
  DUMMY_RESULTS_SINGLE,
  DUMMY_RESULTS_TOTALS,
  DUMMY_RESULTS_DEMOGRAPHICS
} from '../../utils/editorDummyData';

/**
 * ResultsEditorPreview — admin editor preview of /results page.
 * 
 * Uses ALL real components. NO mock JSX (per D-004 rule).
 * 
 * Props:
 *   simMode: "multi" | "single"
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
  const totalEligible = DUMMY_RESULTS_DEMOGRAPHICS.totalEligible;

  // Default editor preview state: showScore + ENDED + revealed
  // (Per D-104 — most visually rich state)
  const status = "ENDED";
  const isRevealed = true;
  const isEnded = true;
  const isNotStarted = false;

  // Wrap helper — wraps each section with EditorElement for click selection
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Real Navbar */}
      <Navbar />
      
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-12 max-w-6xl w-full mx-auto">
        {/* Page header */}
        <Wrap id="results-header">
          <div className="text-center mb-8 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-600">REAL-TIME UPDATE</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800">
              ผลการเลือกตั้ง <span className="text-[#8A2680]">SAMO 49</span>
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              ระบบเลือกตั้งสโมสรนักศึกษา คณะวิทยาการจัดการ ประจำปีการศึกษา 2569
            </p>
          </div>
        </Wrap>

        {/* Real ResultsStatsBar */}
        <Wrap id="results-stats-bar">
          <ResultsStatsBar
            totalVotes={totalVotes}
            totalEligible={totalEligible}
            isNotStarted={isNotStarted}
          />
        </Wrap>

        {/* Candidates section heading */}
        <Wrap id="results-candidates-heading">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              🏆 สรุปผลการเลือกตั้ง (Official Results)
            </h2>
          </div>
        </Wrap>

        {/* Real ResultCard list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 bg-white sm:bg-transparent rounded-2xl border sm:border-0 border-slate-100 mb-8 lg:mb-12">
          {candidates.map((candidate, index) => (
            <Wrap key={candidate.id} id={`result-card-${index}`}>
              <ResultCard
                candidate={candidate}
                rank={index + 1}
                totalVotes={totalVotes}
                status={status}
                isRevealed={isRevealed}
                onClick={() => {}}
              />
            </Wrap>
          ))}
        </div>

        {/* Real Demographics */}
        <Wrap id="results-demographics">
          <ResultsDemographics
            demographics={DUMMY_RESULTS_DEMOGRAPHICS}
            isMobile={false}
            isRevealed={isRevealed}
            isEnded={isEnded}
            isNotStarted={isNotStarted}
          />
        </Wrap>
      </main>

      {/* Real Footer */}
      <SiteFooter className="mt-8 lg:mt-16" />
    </div>
  );
}
```

## DO NOT
- Do NOT change ResultCard
- Do NOT migrate hardcoded "SAMO 49" / year strings (that's H-CON)
- Do NOT touch the main Navbar component
- Do NOT add stateful registry entries (that's H-7b/H-8)
- Do NOT change the conditional logic of ResultsDemographics — it must work 
  the same way in production
- Do NOT install packages
- Do NOT replace footers in other pages (closed/login/candidates/party) — out of scope

## VERIFICATION

1. `npm run build` passes exit 0

2. Real `/results` page renders identically to before:
   - Status pill (REAL-TIME UPDATE / FINAL RESULT)
   - 3 stats cards (คะแนนเสียงรวม / ผู้มีสิทธิ์ / ร้อยละ)
   - ResultCard grid
   - Demographics charts (when revealed) OR placeholder (when not)
   - Footer "© FMS@PSU 2026..."
   
   ALL should look identical to before — only INTERNALLY using new extracted components.

3. Real `/` page footer renders identically (if we replaced HomeContent footer)

4. Admin → ออกแบบหน้าเว็บ → "ผลคะแนน":
   - **Navbar shown at top**
   - "REAL-TIME UPDATE" pill + "ผลการเลือกตั้ง SAMO 49" heading
   - **Real 3-card ResultsStatsBar** (with purple/slate/emerald accent bars)
   - "🏆 สรุปผลการเลือกตั้ง (Official Results)" heading
   - 3 ResultCards (real, with winner border + Trophy on first)
   - **Real Demographics charts** below: bar chart "แยกตามสาขา", "ชั้นปี", pie chart "เพศ"
   - **SiteFooter at bottom**
   - Toggle [หลายพรรค ↔ พรรคเดียว] still works

5. Hover any wrapped section → purple dashed border (Navbar/Footer not wrapped — fine)

6. Click any wrapped section → selection works (PropertyPanel may show "no controls" for elements without registry — expected)

7. Click ResultCard → still no navigation (click-lock from H-5.5 working)

## REPORT FORMAT

```
Created src/components/ResultsStatsBar.js — extracted 3-card stats bar
Created src/components/ResultsDemographics.js — extracted chart panels with conditional revealed/counting/locked tree
Created src/components/SiteFooter.js — shared footer (will use globalConfig in H-CON)
Modified src/app/results/page.js — replaced inline stats/demographics/footer JSX with new components
Modified src/components/HomeContent.js — replaced inline footer with SiteFooter (or skipped if too risky)
Modified src/utils/editorDummyData.js — added DUMMY_RESULTS_DEMOGRAPHICS
Modified src/components/admin/ResultsEditorPreview.js — fully real components: Navbar + ResultsStatsBar + ResultCards + ResultsDemographics + SiteFooter
Build: PASS
```

No other commentary.
