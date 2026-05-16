# LIVE_STEP_H_3PAGES_PREV.md — Vote / Candidates / Closed Editor Previews

## READ FIRST
Read `CLAUDE.md`, `MASTER_PLAN.md`, `DECISIONS.md`. Follow strictly.

## CONTEXT
After H-SYNC-FIX, only 3 pages need editor previews. Diagnosis 
(DIAGNOSE_3PAGES) revealed multiple architectural issues that must be 
fixed alongside the previews:

1. **Vote**: MultiPartyView uses `vote-header`/`vote-subtitle`/`vote-abstain-btn` 
   IDs that don't match elementRegistry's `vote-header-badge/title/subtitle`/
   `vote-abstain-button`. PageDesignTab doesn't wire editorProps for vote.
   → Cannot click vote elements in preview today.

2. **Candidates**: PagePreviewRenderer renders `<CandidatesPage editorMode={false}>` 
   — bug, real API fetch attempted. CandidatesPage already has full editor 
   support (editorMode prop pattern). Element IDs only in EXTRA_ELEMENTS_SCHEMA.

3. **Closed**: Page not in EDITABLE_PAGES at all — no editor support whatsoever.
   Hardcoded date string. 3 natural state variations (waiting/ended/paused).

This step batches all 3 page previews + fixes the architectural gaps.

## SCOPE (DO NOT EXCEED)

**Create 3 files:**
1. `src/components/admin/VoteEditorPreview.js`
2. `src/components/admin/CandidatesEditorPreview.js`
3. `src/components/admin/ClosedEditorPreview.js`

**Modify exactly 5 files:**
4. `src/components/admin/MultiPartyView.js` — fix element ID mismatch
5. `src/components/admin/PageDesignTab.js` — wire 3 new branches + editorProps
6. `src/utils/pageRegistry.js` — add 'closed' page
7. `src/app/preview/page.js` — wire 3 new fullscreen branches
8. `src/components/admin/previews/PagePreviewRenderer.js` — fix editorMode=true for candidates

Do NOT modify:
- ClosedPage source (`src/app/closed/page.js`) — keep production page intact
- VotePage source (`src/app/vote/page.js`)
- CandidatesPage source — already correct
- elementRegistry.js — only ADD vote element IDs (not full refactor; that's H-CATALOG)

Do NOT install packages.

---

## PART 1: Fix MultiPartyView Element ID Mismatch

### File: `src/components/admin/MultiPartyView.js`

Find usages of:
- `<EditorElement id="vote-header" ...>` → change to `vote-header-title`
- `<EditorElement id="vote-subtitle" ...>` → change to `vote-header-subtitle`
- `<EditorElement id="vote-abstain-btn" ...>` → change to `vote-abstain-button`

Also if there's a badge/pill ID that should be `vote-header-badge`, rename accordingly.

After this, IDs in MultiPartyView match elementRegistry exactly.

DO NOT modify the JSX structure — only rename id attributes on EditorElement wrappers.

---

## PART 2: Create VoteEditorPreview.js

```jsx
"use client";

import Navbar from '../Navbar';
import VoteFooter from '../VoteFooter';
import MultiPartyView from './MultiPartyView';
import SinglePartyView from './SinglePartyView';
import EditorElement from './editor/EditorElement';
import { useGlobalConfig } from '@/contexts/GlobalConfigContext'; // adjust path
import {
  DUMMY_PARTIES_MULTI,
  DUMMY_PARTIES_SINGLE,
  DUMMY_SPECIAL_OPTIONS,
  DUMMY_USER
} from '../../utils/editorDummyData';

/**
 * VoteEditorPreview — admin editor preview of /vote page.
 * Toggles between multi-party and single-party modes.
 * 
 * Production page logic (vote submission, modals, intro animations) is 
 * stripped — preview is design-focused.
 */
export default function VoteEditorPreview({
  simMode = "multi",
  pageLayout = null,
  elementConfigs = {},
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  const globalConfig = useGlobalConfig();
  
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
  
  if (simMode === "single") {
    // Single-party mode — uses SinglePartyView's editorMode short-circuit render
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <SinglePartyView
          editorMode={true}
          party={DUMMY_PARTIES_SINGLE[0]}
          specialOptions={DUMMY_SPECIAL_OPTIONS}
          onVote={() => {}}
          pageLayout={pageLayout}
          elementConfigs={elementConfigs}
          selectedElement={selectedElement}
          hoveredElement={hoveredElement}
          onSelectElement={onSelectElement}
          onHoverElement={onHoverElement}
          onHoverEnd={onHoverEnd}
        />
        <VoteFooter />
      </div>
    );
  }
  
  // Multi-party mode (default)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-12">
        {/* Header section — replicates inline JSX from vote/page.js */}
        <Wrap id="vote-header-badge">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A2680]/10 border border-[#8A2680]/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#8A2680] animate-pulse" />
            <span className="text-xs font-bold text-[#8A2680]">ลงคะแนนเสียง</span>
          </div>
        </Wrap>
        
        <Wrap id="vote-header-title">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 mb-2">
            เลือกตั้ง<span className="text-[#8A2680]">{globalConfig.organizationShort}</span>
          </h1>
        </Wrap>
        
        <Wrap id="vote-header-subtitle">
          <p className="text-sm text-slate-500 mb-8">
            สวัสดี {DUMMY_USER.name}, กรุณาเลือกพรรคที่ต้องการลงคะแนน
          </p>
        </Wrap>
        
        {/* Party grid + abstain — uses real MultiPartyView */}
        <MultiPartyView
          editorMode={true}
          regularParties={DUMMY_PARTIES_MULTI}
          specialOptions={DUMMY_SPECIAL_OPTIONS}
          selectedPartyId={null}
          onSelect={() => {}}
          onViewDetails={() => {}}
          config={pageLayout?.vote?.multiPartyConfig || {}}
          pageLayout={pageLayout}
          elementConfigs={elementConfigs}
          selectedElement={selectedElement}
          hoveredElement={hoveredElement}
          onSelectElement={onSelectElement}
          onHoverElement={onHoverElement}
          onHoverEnd={onHoverEnd}
        />
      </div>
      
      <VoteFooter />
    </div>
  );
}
```

NOTE: If `VoteFooter` import path differs, adjust. If `SinglePartyView` 
takes different props, match its actual signature — read SinglePartyView 
to confirm.

---

## PART 3: Create CandidatesEditorPreview.js

CandidatesPage already has full editor pattern. This is a thin wrapper:

```jsx
"use client";

import CandidatesPage from '../../app/candidates/page';
import { DUMMY_PARTIES_MULTI } from '../../utils/editorDummyData';

/**
 * CandidatesEditorPreview — admin editor preview of /candidates page.
 * Wraps CandidatesPage in editorMode with dummy data.
 */
export default function CandidatesEditorPreview({
  pageLayout = null,
  elementConfigs = {},
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  return (
    <CandidatesPage
      editorMode={true}
      candidates={DUMMY_PARTIES_MULTI}
      pageLayout={pageLayout}
      elementConfigs={elementConfigs}
      selectedElement={selectedElement}
      hoveredElement={hoveredElement}
      onSelectElement={onSelectElement}
      onHoverElement={onHoverElement}
      onHoverEnd={onHoverEnd}
    />
  );
}
```

NOTE: If CandidatesPage default export uses a different prop name 
(e.g., `editorCandidates` instead of `candidates`), match the actual prop name.

---

## PART 4: Create ClosedEditorPreview.js

```jsx
"use client";

import { Lock } from 'lucide-react';
import Navbar from '../Navbar';
import SiteFooter from '../SiteFooter';
import { useGlobalConfig } from '@/contexts/GlobalConfigContext';

const STATE_MESSAGES = {
  waiting: {
    title: "ยังไม่เปิดรับลงคะแนน",
    description: "การลงคะแนนเสียงจะเริ่มในเร็วๆ นี้",
    detail: "วันที่ 6 กุมภาพันธ์ 2569 เวลา 08.30 น. - 17.00 น.",
  },
  ended: {
    title: "สิ้นสุดระยะเวลาลงคะแนน",
    description: "ขอขอบคุณที่ใช้สิทธิ์ลงคะแนนเสียง",
    detail: "ติดตามผลการเลือกตั้งได้ที่หน้า ผลคะแนน",
  },
  paused: {
    title: "ระบบปิดรับลงคะแนน",
    description: "ระบบกำลังปรับปรุง กรุณารอสักครู่",
    detail: "ขออภัยในความไม่สะดวก",
  },
};

/**
 * ClosedEditorPreview — static preview of /closed page.
 * 3 modes: waiting / ended / paused
 * No EditorElement wrapping (no elements registered yet — Phase 2 expansion).
 */
export default function ClosedEditorPreview({ simMode = "waiting" }) {
  const globalConfig = useGlobalConfig();
  const message = STATE_MESSAGES[simMode] || STATE_MESSAGES.waiting;
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 lg:p-12 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-slate-500" />
          </div>
          
          <h1 className="text-xl lg:text-2xl font-black text-slate-800 mb-2">
            {message.title}
          </h1>
          
          <p className="text-sm text-slate-600 mb-3">
            {message.description}
          </p>
          
          <p className="text-xs text-slate-500">
            {message.detail}
          </p>
          
          <div className="mt-6">
            <button className="px-6 py-2 rounded-md bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">
              กลับสู่หน้าหลัก
            </button>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}
```

---

## PART 5: Update pageRegistry.js — Add Closed Page

In `src/utils/pageRegistry.js`:

Add 'closed' entry to EDITABLE_PAGES (place after 'success' or wherever fits):

```js
{
  id: "closed",
  name: "หน้าระบบปิด",
  nameEn: "Closed",
  icon: "Lock",  // or Ban — match existing icon import pattern
  path: "/closed",
  description: "หน้าแสดงเมื่อระบบปิดรับลงคะแนน",
  gridLayout: "single-column",
  hasSubModes: true,
  columns: {
    main: ["closedMessage"]
  }
}
```

Add to SECTION_LABELS:
```js
closedMessage: "ข้อความระบบปิด"
```

If icon names need import in another file, ensure consistency with 
existing pattern (other pages reference icons by string, resolved elsewhere).

---

## PART 6: Update PageDesignTab.js

### 6.1 Add imports
```js
import VoteEditorPreview from './VoteEditorPreview';
import CandidatesEditorPreview from './CandidatesEditorPreview';
import ClosedEditorPreview from './ClosedEditorPreview';
```

### 6.2 Add state for sim modes
Find where `resultsSimMode` is declared (around line 352):
```js
const [resultsSimMode, setResultsSimMode] = useState('multi');
const [voteSimMode, setVoteSimMode] = useState('multi');         // NEW
const [closedSimMode, setClosedSimMode] = useState('waiting');   // NEW
// candidates has only 1 mode — no toggle state needed
```

### 6.3 Update renderPreview function
Find renderPreview (around line 263). Add branches BEFORE the fallback:

```jsx
function renderPreview(deviceMode) {
  if (selectedPage === 'home' && editorProps) {
    return <HomeContent ... />;
  }
  
  if (selectedPage === 'results') {
    return <ResultsEditorPreview simMode={resultsSimMode} ... />;
  }
  
  // NEW
  if (selectedPage === 'vote') {
    return (
      <VoteEditorPreview
        simMode={voteSimMode}
        pageLayout={livePageLayout}
        elementConfigs={editorProps?.elementConfigs}
        selectedElement={editorProps?.selectedElement}
        hoveredElement={editorProps?.hoveredElement}
        onSelectElement={editorProps?.onSelectElement}
        onHoverElement={editorProps?.onHoverElement}
        onHoverEnd={editorProps?.onHoverEnd}
      />
    );
  }
  
  if (selectedPage === 'candidates') {
    return (
      <CandidatesEditorPreview
        pageLayout={livePageLayout}
        elementConfigs={editorProps?.elementConfigs}
        selectedElement={editorProps?.selectedElement}
        hoveredElement={editorProps?.hoveredElement}
        onSelectElement={editorProps?.onSelectElement}
        onHoverElement={editorProps?.onHoverElement}
        onHoverEnd={editorProps?.onHoverEnd}
      />
    );
  }
  
  if (selectedPage === 'closed') {
    return <ClosedEditorPreview simMode={closedSimMode} />;
  }
  
  // Fallback for other pages (party, success)
  return <PagePreviewRenderer pageId={selectedPage} ... />;
}
```

### 6.4 Pass new state through LivePreview props
Find the LivePreview render site (around line 940) and add to its destructured signature:
```jsx
function LivePreview({
  ...,
  resultsSimMode,
  voteSimMode,            // NEW
  closedSimMode,          // NEW
  editorProps,
  ...
}) {
```

And pass them in the JSX usage (around line 990):
```jsx
<LivePreview
  ...
  resultsSimMode={resultsSimMode}
  voteSimMode={voteSimMode}             // NEW
  closedSimMode={closedSimMode}          // NEW
  editorProps={...}
  ...
/>
```

### 6.5 Extend editorProps to include vote/candidates/closed
Find around line 1011-1022 where `editorProps` is created. Currently:
```jsx
editorProps={
  (selectedPage === 'home' || selectedPage === 'results')
    ? { elementConfigs: editor.elementConfigs, selectedElement: ... }
    : null
}
```

Update condition to include vote, candidates, closed:
```jsx
editorProps={
  ['home', 'results', 'vote', 'candidates', 'closed'].includes(selectedPage)
    ? { 
        elementConfigs: editor.elementConfigs, 
        selectedElement: editor.selectedElement,
        hoveredElement: editor.hoveredElement,
        onSelectElement: editor.selectElement,
        onHoverElement: editor.hoverElement,
        onHoverEnd: editor.clearHover
      }
    : null
}
```

(Match existing prop wiring; the actual handler names depend on what's already in scope.)

### 6.6 Add left panel branches for new pages

Find the section containing `selectedPage === 'results'` panel (left panel). 
Add THREE new branches (vote, candidates, closed) following the same pattern.

For **vote** (replace existing vote handling around line 885 if present):

```jsx
{selectedPage === 'vote' && (
  <div className="space-y-4">
    {/* Sim mode toggle */}
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
        โหมดจำลอง
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setVoteSimMode('multi')}
          className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
            voteSimMode === 'multi'
              ? 'bg-[#8A2680] text-white'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          หลายพรรค
        </button>
        <button
          type="button"
          onClick={() => setVoteSimMode('single')}
          className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
            voteSimMode === 'single'
              ? 'bg-[#8A2680] text-white'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          พรรคเดียว
        </button>
      </div>
    </div>
    
    {/* Existing vote config form (preserve gridCols/cardVariant/abstainStyle dropdowns)
        OR replace with PlaceholderPageSectionList — choose based on simplicity */}
    <PlaceholderPageSectionList
      page={getPageById('vote')}
      sections={otherPages['vote'] || []}
      onMove={(index, dir) => handleOtherMove('vote', index, dir)}
      onToggleVisible={(index) => handleOtherToggleVisible('vote', index)}
    />
    
    {editor.selectedElement && (
      <PropertyPanel
        selectedElement={editor.selectedElement}
        elementConfigs={editor.elementConfigs}
        onUpdateConfig={editor.updateElementConfig}
        onApplyPreset={handleApplyPresetToElement}
        onDeselect={editorClearSelection}
      />
    )}
  </div>
)}
```

NOTE: If existing vote config form (with gridCols/cardVariant dropdowns) 
should be preserved, keep it. Otherwise the section list is sufficient.

For **candidates**:
```jsx
{selectedPage === 'candidates' && (
  <div className="space-y-4">
    <PlaceholderPageSectionList
      page={getPageById('candidates')}
      sections={otherPages['candidates'] || []}
      onMove={(index, dir) => handleOtherMove('candidates', index, dir)}
      onToggleVisible={(index) => handleOtherToggleVisible('candidates', index)}
    />
    
    {editor.selectedElement && (
      <PropertyPanel
        selectedElement={editor.selectedElement}
        elementConfigs={editor.elementConfigs}
        onUpdateConfig={editor.updateElementConfig}
        onApplyPreset={handleApplyPresetToElement}
        onDeselect={editorClearSelection}
      />
    )}
  </div>
)}
```

For **closed** (mode toggle + section list, no element panel — no elements registered yet):
```jsx
{selectedPage === 'closed' && (
  <div className="space-y-4">
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
        สถานะระบบ
      </label>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setClosedSimMode('waiting')}
          className={`px-2 py-2 rounded-md text-xs font-bold transition-all ${
            closedSimMode === 'waiting'
              ? 'bg-[#8A2680] text-white'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          ยังไม่เปิด
        </button>
        <button
          type="button"
          onClick={() => setClosedSimMode('ended')}
          className={`px-2 py-2 rounded-md text-xs font-bold transition-all ${
            closedSimMode === 'ended'
              ? 'bg-[#8A2680] text-white'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          สิ้นสุด
        </button>
        <button
          type="button"
          onClick={() => setClosedSimMode('paused')}
          className={`px-2 py-2 rounded-md text-xs font-bold transition-all ${
            closedSimMode === 'paused'
              ? 'bg-[#8A2680] text-white'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          ปิดปรับปรุง
        </button>
      </div>
    </div>
    
    <PlaceholderPageSectionList
      page={getPageById('closed')}
      sections={otherPages['closed'] || []}
      onMove={(index, dir) => handleOtherMove('closed', index, dir)}
      onToggleVisible={(index) => handleOtherToggleVisible('closed', index)}
    />
  </div>
)}
```

### 6.7 Update catch-all condition
Find:
```jsx
{!['home', 'vote', 'results'].includes(selectedPage) && ( ... )}
```

Update to:
```jsx
{!['home', 'vote', 'results', 'candidates', 'closed'].includes(selectedPage) && ( ... )}
```

---

## PART 7: Update /preview/page.js for Fullscreen

Add imports:
```js
import VoteEditorPreview from '../../components/admin/VoteEditorPreview';
import CandidatesEditorPreview from '../../components/admin/CandidatesEditorPreview';
import ClosedEditorPreview from '../../components/admin/ClosedEditorPreview';
```

Update routing block:
```jsx
{pageId === 'home' && <HomeContent editorMode={false} editorData={DUMMY_ELECTION} pageLayout={draftLayout} theme={draftLayout.theme} />}

{pageId === 'results' && <ResultsEditorPreview simMode="multi" />}

{pageId === 'vote' && <VoteEditorPreview simMode="multi" pageLayout={draftLayout} />}

{pageId === 'candidates' && <CandidatesEditorPreview pageLayout={draftLayout} />}

{pageId === 'closed' && <ClosedEditorPreview simMode="waiting" />}

{!['home', 'results', 'vote', 'candidates', 'closed'].includes(pageId) && (
  <PagePreviewRenderer pageId={pageId} pageLayout={draftLayout} deviceMode="desktop" />
)}
```

---

## PART 8: Fix PagePreviewRenderer.js editorMode bug

Find candidates case (around line 87):
```js
case 'candidates':
  return <CandidatesPage editorMode={false} ... />;  // ← bug
```

Change to:
```js
case 'candidates':
  return <CandidatesPage editorMode={true} candidates={DUMMY_PARTIES} pageLayout={pageLayout} />;
```

This is a defense-in-depth fix — even if PagePreviewRenderer is hit (shouldn't 
be after PART 6 changes), it won't try real API fetch.

---

## DO NOT
- Do NOT modify production page sources (vote/page.js, candidates/page.js, closed/page.js)
- Do NOT register candidates-* elements in elementRegistry yet (Phase 2 H-CATALOG)
- Do NOT add EditorElement wraps around closed content (no elements registered)
- Do NOT change election logic, vote logic, or auth flow
- Do NOT install packages
- Do NOT refactor unrelated code

---

## VERIFICATION

After implementation, run grep to PROVE changes were applied:
```bash
grep -rn "VoteEditorPreview\|CandidatesEditorPreview\|ClosedEditorPreview" src/components/admin/PageDesignTab.js src/app/preview/page.js
grep -n "voteSimMode\|closedSimMode" src/components/admin/PageDesignTab.js
grep -n "vote-header-title\|vote-header-subtitle\|vote-abstain-button" src/components/admin/MultiPartyView.js
grep -n "id: \"closed\"" src/utils/pageRegistry.js
```

Then build:
```bash
npm run build
```

Build must compile (existing pre-existing openid-callback error is OK — not a regression).

### Manual tests after build:

1. **Admin → ออกแบบหน้าเว็บ:**
   - "หน้าลงคะแนน" tab visible
   - Click → preview shows MultiPartyView with parties
   - Toggle "พรรคเดียว" → preview switches to single-party view
   - Toggle back to "หลายพรรค"
   - Click hero-style elements (vote-header-title, etc.) → selection works

2. **"รายชื่อผู้สมัคร" tab:**
   - Click → preview shows party list (DUMMY_PARTIES_MULTI)
   - No real API fetch (no console errors about /api/party)
   - Section list on left works

3. **"หน้าระบบปิด" tab (NEW):**
   - Visible in page selector
   - Click → preview shows Lock icon + "ยังไม่เปิดรับลงคะแนน"
   - Toggle "สิ้นสุด" → text changes to "สิ้นสุดระยะเวลาลงคะแนน"
   - Toggle "ปิดปรับปรุง" → "ระบบปิดรับลงคะแนน"

4. **Fullscreen preview:**
   - Expand on each page → /preview?page=vote / candidates / closed → renders real component
   - No editor overlays in fullscreen

5. **Production pages unchanged:**
   - /vote works normally (production)
   - /candidates works normally
   - /closed works normally

6. **No regression:**
   - /  still works (home)
   - /results still works
   - hero-title bound editing still syncs (H-SYNC-FIX)

---

## REPORT FORMAT

```
Created src/components/admin/VoteEditorPreview.js — multi/single mode toggle, real Navbar + MultiPartyView/SinglePartyView + VoteFooter; uses DUMMY_PARTIES_MULTI/SINGLE
Created src/components/admin/CandidatesEditorPreview.js — thin wrapper around CandidatesPage in editorMode with DUMMY_PARTIES_MULTI
Created src/components/admin/ClosedEditorPreview.js — static 3-mode preview (waiting/ended/paused) with Navbar + Lock icon card + SiteFooter
Modified src/components/admin/MultiPartyView.js — fixed EditorElement IDs to match registry (vote-header→vote-header-title, vote-subtitle→vote-header-subtitle, vote-abstain-btn→vote-abstain-button)
Modified src/utils/pageRegistry.js — added 'closed' page entry to EDITABLE_PAGES + closedMessage section label
Modified src/components/admin/PageDesignTab.js — added 3 imports + voteSimMode/closedSimMode state + 3 renderPreview branches + extended editorProps to vote/candidates/closed + 3 left panel branches with mode toggles + updated catch-all condition
Modified src/app/preview/page.js — added 3 imports + 3 routing branches for vote/candidates/closed + updated catch-all
Modified src/components/admin/previews/PagePreviewRenderer.js — fixed candidates case editorMode false→true (defense-in-depth)

Grep verifications (PROOF):
[paste actual grep output here]

Build: PASS (or note pre-existing openid-callback if still present)
```

No other commentary.
