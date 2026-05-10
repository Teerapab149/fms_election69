# Ultimate Prompt Series: Admin Page Editor Preview
# แบ่งเป็น 4 steps แยกกัน — รันทีละ step จบแล้วค่อยรัน step ถัดไป

---

# ============================================
# STEP 1: สร้าง PagePreviewRenderer (ไฟล์ใหม่เท่านั้น)
# ============================================

```
Read CLAUDE.md first.

Create ONE new file only. Do not modify any existing files.

Create: src/components/admin/previews/PagePreviewRenderer.js

This is a single component that receives a pageId and pageLayout state,
then renders a VISUAL REPRESENTATION of that page using actual project components
where possible, and clean mockups where not.

IMPORTANT: This component must look GOOD. Not placeholder boxes.
Each page preview should feel like a miniature version of the real page.

```jsx
"use client";
import { Ban, Check, Users, Trophy, BarChart3, CheckCircle } from 'lucide-react';

// For Home: import BlockRenderer if available
// For Vote: import MultiPartyView
// For others: build clean inline previews

const DUMMY_PARTIES = [
  { id: 1, number: 1, name: "The Unity Concord Of FMS 2", slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง", logoUrl: null },
  { id: 2, number: 2, name: "อะไรไม่รู้ครับ", slogan: "ทดสอบ", logoUrl: null },
];

const DUMMY_RESULTS = [
  { name: "The Unity Concord", number: 1, score: 245, color: "#8A2680" },
  { name: "อะไรไม่รู้ครับ", number: 2, score: 187, color: "#2563EB" },
  { name: "งดออกเสียง", number: 0, score: 68, color: "#F59E0B" },
];

export default function PagePreviewRenderer({ pageId, pageLayout, deviceMode = 'desktop' }) {
  const theme = pageLayout?.theme || {};
  const primaryColor = theme.primaryColor || '#8A2680';

  switch (pageId) {
    case 'home': return <HomePreview pageLayout={pageLayout} primaryColor={primaryColor} />;
    case 'vote': return <VotePreview config={pageLayout?.vote?.multiParty || {}} primaryColor={primaryColor} />;
    case 'results': return <ResultsPreview primaryColor={primaryColor} />;
    case 'candidates': return <CandidatesPreview primaryColor={primaryColor} />;
    case 'party': return <PartyPreview primaryColor={primaryColor} />;
    case 'success': return <SuccessPreview />;
    default: return <div className="p-8 text-center text-slate-400">Unknown page</div>;
  }
}
```

Each sub-component must be COMPLETE and SELF-CONTAINED inside this file.
Design quality must be HIGH — use Tailwind classes, proper spacing, realistic content.

### HomePreview:
- Try to import and use BlockRenderer from '../../blocks/BlockRenderer'
- If BlockRenderer works: pass pageLayout.home blocks to it
- If import fails: create inline version with:
  - Navbar mock (logo + menu items)
  - Hero: "SAMO 49" large text + countdown mock + subtitle
  - 2-column layout matching actual home page
  - Stats card (purple gradient, "342 คน")
  - Election banner placeholder
  - Vote CTA button

### VotePreview:
- Must respond to config prop in REAL-TIME
- Read gridCols → change grid-cols class
- Read cardVariant → "grid" shows logo+name+slogan, "compact" shows logo+name only  
- Read showDivider → show/hide "หรือ" divider
- Read abstainStyle → "standard"=full button, "compact"=pill, "minimal"=text link
- Party cards: white bg, rounded-xl, border, number badge top-left, centered logo circle
- Background: bg-[#F8F9FD]
- Header: "เลือกตั้งสโมสรนักศึกษา" with purple accent

### ResultsPreview:
- Header "ผลการลงคะแนนเสียง"
- Total votes summary
- 3 candidate result cards with:
  - Name + score on same line
  - CSS progress bar (colored by party)
  - Percentage below
- Use realistic numbers from DUMMY_RESULTS

### CandidatesPreview:
- Header "ทำความรู้จัก ผู้สมัคร"  
- 2 party cards in grid
- Each card: colored number badge, party name, slogan
- Background decorative gradient blobs (faint)

### PartyPreview:
- Dark theme (bg-slate-900)
- Hero area with gradient overlay
- Party name "The Unity Concord" large white text
- Slogan below
- Section previews: พันธกิจ, นโยบาย as cards with white/10 bg
- Member grid mock (small circles)

### SuccessPreview:
- Centered layout
- Large green checkmark circle
- "ลงคะแนนสำเร็จ!" heading
- Thank you message
- Google Form link button mock

After creating, verify: npm run build
The file should compile with no errors even if BlockRenderer import fails
(use try-catch or conditional import).
```

---

# ============================================
# STEP 2: Wire PagePreviewRenderer into admin tab
# ============================================

```
Read CLAUDE.md first.

Modify ONLY the admin page design tab component.

Find where the preview panel currently renders (likely has iframe or 
old BlockRenderer/VotePreview/ResultsPreview).

Replace the ENTIRE preview content area with:

import PagePreviewRenderer from the file created in Step 1.

Preview container structure:
```jsx
<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
  {/* Header */}
  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-slate-700">Live Preview</span>
      <span className="text-xs text-slate-400">· {selectedPageName}</span>
    </div>
    {/* Device toggle */}
    <div className="flex bg-slate-100 rounded-lg p-0.5">
      <button onClick={() => setDeviceMode('desktop')}
        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
          deviceMode === 'desktop' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
        Desktop
      </button>
      <button onClick={() => setDeviceMode('mobile')}
        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
          deviceMode === 'mobile' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
        Mobile
      </button>
    </div>
  </div>

  {/* Preview area */}
  <div className="relative bg-slate-100/50 overflow-hidden" style={{ height: '550px' }}>
    <div className={`absolute top-0 left-0 origin-top-left ${
      deviceMode === 'mobile' 
        ? 'w-[375px] left-1/2 -translate-x-1/2 origin-top'
        : ''
    }`} style={{
      transform: `scale(${deviceMode === 'mobile' ? 0.55 : 0.42})`,
      transformOrigin: deviceMode === 'mobile' ? 'top center' : 'top left',
      width: deviceMode === 'mobile' ? '375px' : `${100/0.42}%`,
      height: `${100/0.42}%`,
    }}>
      <PagePreviewRenderer
        pageId={selectedPage}
        pageLayout={pageLayout}
        deviceMode={deviceMode}
      />
    </div>
  </div>
</div>
```

KEY: pageLayout is React state. When admin changes ANY config value
(template, section order, vote gridCols, etc.), pageLayout state updates,
PagePreviewRenderer re-renders, preview updates INSTANTLY.

Remove:
- Old iframe code if exists
- Old VotePreview/ResultsPreview imports if they were used directly
- saveCount state if it was only for iframe reload

Keep:
- Device toggle state (deviceMode)
- All config controls (section list, vote config, template selector)

After modifying, verify: npm run build
Then test: change vote gridCols dropdown → preview should update instantly
```

---

# ============================================
# STEP 3: Vote config → preview real-time connection
# ============================================

```
Read CLAUDE.md first.

This step ensures the Vote page preview responds to config changes in real-time.

Check that the following data flow works:

1. Admin selects "หน้าลงคะแนน" page
2. Vote config controls appear (gridCols, cardVariant, showDivider, abstainStyle)  
3. Admin changes gridCols dropdown from "Auto" to "3"
4. pageLayout.vote.multiParty.gridCols updates in state
5. PagePreviewRenderer receives updated pageLayout prop
6. VotePreview inside renders with gridCols="3" → 3-column grid shown

If this flow is ALREADY working from Step 2 wiring, just verify and move on.

If NOT working, debug:
- Check that vote config controls update pageLayout state (not a separate state)
- Check that pageLayout is the SAME object passed to both config panel and preview
- The config controls might be updating voteConfig state separately — 
  merge it: when voteConfig changes, also update pageLayout.vote.multiParty

Fix pattern:
```jsx
const handleVoteConfigChange = (key, value) => {
  setVoteConfig(prev => ({ ...prev, [key]: value }));
  // ALSO update pageLayout so preview gets it
  setPageLayout(prev => ({
    ...prev,
    vote: {
      ...prev.vote,
      multiParty: { ...(prev.vote?.multiParty || {}), [key]: value }
    }
  }));
};
```

Test each control:
- gridCols: "auto" → "2" → "3" → preview grid changes
- cardVariant: "auto" → "grid" → "compact" → card size changes  
- showDivider: true → false → divider appears/disappears
- abstainStyle: "auto" → "standard" → "compact" → "minimal" → button style changes

After verifying all 4 controls work real-time, run: npm run build
```

---

# ============================================
# STEP 4: Visual polish + template preview sync
# ============================================

```
Read CLAUDE.md first.

Final polish pass. Small targeted fixes only.

### 4a. Template → preview sync
When admin clicks a template preset (Classic, Modern Dark, Playful, Minimal):
- pageLayout.theme should update (primaryColor, accentColor)
- HomePreview should reflect the theme color change
- VotePreview should also reflect if it uses primaryColor

Check: click "Modern Dark" template → does preview show dark theme?
If not, ensure applyTemplate function updates pageLayout state
and that previews read theme from pageLayout.theme.

### 4b. Mobile preview centering
When deviceMode === 'mobile':
- The 375px preview should be CENTERED in the container, not left-aligned
- Add a subtle phone frame: rounded-[2rem] border-4 border-slate-800 shadow-2xl
- Add "notch" indicator at top (small dark pill)

```jsx
{deviceMode === 'mobile' && (
  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[375px]"
    style={{ transform: 'scale(0.55)', transformOrigin: 'top center' }}>
    {/* Phone frame */}
    <div className="rounded-[2.5rem] border-[6px] border-slate-800 overflow-hidden shadow-2xl bg-white relative">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-2xl z-50" />
      {/* Content */}
      <div className="pt-6">
        <PagePreviewRenderer pageId={selectedPage} pageLayout={pageLayout} deviceMode="mobile" />
      </div>
    </div>
  </div>
)}
```

### 4c. Section hover → preview indicator
When admin hovers a section item in the config list on the left,
show a subtle label on the preview indicating which area corresponds.

Simple approach: add a state `hoveredSection` and pass it to PagePreviewRenderer.
In HomePreview, wrap each section area with:
```jsx
{hoveredSection === 'hero' && (
  <div className="absolute inset-0 border-2 border-dashed border-[#8A2680]/50 rounded-lg pointer-events-none z-40">
    <span className="absolute -top-5 left-2 text-[9px] font-bold text-[#8A2680] bg-white px-2 py-0.5 rounded">Hero</span>
  </div>
)}
```

Only implement this for HomePreview. Other previews can skip it for now.

### 4d. Preview "unsaved" indicator
If config has been changed but not saved, show a subtle pulsing dot on the preview header:
```jsx
{hasUnsavedChanges && (
  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
)}
```

After all polish, run: npm run build
```

---

# How to use these steps:

## Step 1:
```
Read CLAUDE.md. Then read the STEP 1 section of PROMPT_ULTIMATE_PREVIEW.md and execute it.
Create only the new file. Do not modify existing files. Verify build passes.
```

## Step 2:
```
Read CLAUDE.md. Then read the STEP 2 section of PROMPT_ULTIMATE_PREVIEW.md and execute it.
Only modify the admin page design tab. Verify build passes.
Test: preview shows for all 6 pages.
```

## Step 3:
```
Read CLAUDE.md. Then read the STEP 3 section of PROMPT_ULTIMATE_PREVIEW.md and execute it.
Focus only on vote config → preview real-time connection.
Test all 4 vote config controls update preview instantly.
```

## Step 4:
```
Read CLAUDE.md. Then read the STEP 4 section of PROMPT_ULTIMATE_PREVIEW.md and execute it.
Visual polish only. Small targeted changes.
```
