# LIVE_STEP_H_SUCCESS_PREV_FIX.md — Rewrite SuccessEditorPreview to Match Production

## READ FIRST
Read `CLAUDE.md`, `MASTER_PLAN.md`, `DECISIONS.md`. Follow strictly.

## CONTEXT

H-SUCCESS-FIX created a generic SuccessEditorPreview that doesn't match 
production. Diagnosis (DIAGNOSE_SUCCESS_PAGE_REAL) revealed real /success 
has rich content:

- Green check icon + "บันทึกคะแนนสำเร็จ!"
- Activity card with megaphone icon + "รับทรานสคริปต์กิจกรรม"
- 2 chip badges (purple + rose) + lock unlock footer bar
- Primary button (dark, pulsing dot) + secondary button (locked gray)
- "กลับหน้าหลัก" link
- NO Navbar, NO SiteFooter (full-screen centered card)
- Two visual states: locked (default) vs unlocked (after form completion)

Per D-005 / D-004, editor preview must be visually accurate to production.

## STRATEGY

**Decision Q1 (form URL):** Keep hardcoded for now. Admin already has 
existing form URL management UI (separate). Migration to globalConfig is 
future work. Editor preview shows form URL as inert/visual only.

**Decision Q2 (state display):** Option B — toggle locked vs unlocked, 
consistent with vote (multi/single) and closed (waiting/ended/paused) 
patterns established in H-3PAGES-PREV.

## SCOPE (DO NOT EXCEED)

Modify exactly 3 files:

1. `src/components/admin/SuccessEditorPreview.js` — REWRITE to match production
2. `src/components/admin/PageDesignTab.js` — add successSimMode state + toggle UI + pass to SuccessEditorPreview
3. `src/app/preview/page.js` — pass simMode prop to fullscreen SuccessEditorPreview

Do NOT modify:
- `src/app/success/page.js` (already has editorMode guard from H-SUCCESS-FIX — keep)
- `src/components/admin/previews/PagePreviewRenderer.js` (defensive comment OK)
- elementRegistry.js (no success elements yet — Phase 4)
- Other unaffected files

Do NOT install packages.

---

## PART 1: Rewrite SuccessEditorPreview.js

### Replace ENTIRE file content with:

```jsx
"use client";

import { Check, Megaphone, CheckCircle2, Tag, Lock, BarChart3, ArrowRight } from 'lucide-react';

/**
 * SuccessEditorPreview — static admin preview of /success page.
 * Mirrors production layout but with:
 *  - NO useSession, NO useRouter, NO API calls
 *  - simMode toggle for locked vs unlocked visual states
 *  - Inert buttons (no navigation)
 *
 * Production source: src/app/success/page.js (lines 214-341 main card view)
 * Per DIAGNOSE_SUCCESS_PAGE_REAL: NO Navbar, NO SiteFooter, full-screen centered card
 */
export default function SuccessEditorPreview({
  simMode = "locked", // 'locked' | 'unlocked'
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  const isUnlocked = simMode === "unlocked";
  
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#8A2680 1px, transparent 1px), linear-gradient(90deg, #8A2680 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      
      {/* Main card */}
      <div className="relative w-full max-w-lg bg-white/90 backdrop-blur rounded-[2rem] shadow-[0_20px_60px_rgba(138,38,128,0.08)] overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#8A2680] via-purple-500 to-pink-500" />
        
        <div className="px-6 md:px-8 py-8 md:py-10 text-center">
          {/* Check icon circle */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-emerald-200/40 rounded-full blur-2xl" />
            <div className="relative w-20 h-20 bg-white border-4 border-emerald-100 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.15)]">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="w-7 h-7 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">
            บันทึกคะแนนสำเร็จ!
          </h1>
          
          {/* Subtitle */}
          <p className="text-sm text-slate-500 mb-6 leading-relaxed px-2">
            ขอบคุณที่ร่วมเป็นส่วนหนึ่งในการขับเคลื่อน<br />
            กิจกรรมนักศึกษาคณะวิทยาการจัดการ
          </p>
          
          {/* Activity card */}
          <div className="w-full bg-gradient-to-br from-purple-50/80 to-white border border-purple-100/80 rounded-2xl p-5 shadow-[0_2px_15px_rgba(138,38,128,0.05)] relative overflow-hidden text-left pb-6 mb-4">
            {/* Decorative bg icon */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 text-purple-100/50 opacity-20 pointer-events-none">
              <Megaphone size={100} />
            </div>
            
            <div className="flex gap-4 items-start relative z-10">
              {/* Left icon box */}
              <div className="bg-white p-3 rounded-2xl text-[#8A2680] shadow-sm ring-1 ring-purple-50 shrink-0 mt-1">
                <Megaphone size={24} strokeWidth={2.5} />
              </div>
              
              <div className="space-y-3 flex-1 min-w-0">
                {/* Title + subtitle */}
                <div>
                  <h3 className="font-bold text-[#8A2680] text-base md:text-lg leading-tight">
                    รับทรานสคริปต์กิจกรรม
                  </h3>
                  <p className="text-slate-500 text-xs md:text-sm mt-1">
                    กรุณาทำแบบประเมินให้ครบถ้วน
                  </p>
                </div>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100/80 text-[#8A2680] text-xs font-bold border border-purple-200 whitespace-nowrap">
                    <CheckCircle2 size={12} />
                    <span>ชั่วโมงกิจกรรม 2 ชม.</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 whitespace-nowrap">
                    <Tag size={12} />
                    <span>ประเภทเลือกเข้าร่วม</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lock unlock footer */}
            <div className="relative z-10 mt-4 pt-3 border-t border-purple-100/60">
              <p className="text-slate-600 text-xs md:text-sm flex items-center justify-center gap-2">
                <span className="shrink-0">🔓</span>
                <span className="truncate">
                  และ <span className="font-semibold text-[#8A2680] underline decoration-purple-200 decoration-2 underline-offset-2">ปลดล็อคหน้าสรุปผลคะแนนเสียง</span>
                </span>
              </p>
            </div>
          </div>
          
          {/* Button 1 — primary (form open) */}
          {!isUnlocked ? (
            <button
              type="button"
              className="w-full px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 mb-2"
              onClick={(e) => e.preventDefault()}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>เปิดแบบประเมิน (คลิกที่นี่)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full px-6 py-3.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm border border-emerald-200 flex items-center justify-center gap-2 mb-2 cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ส่งแบบประเมินเรียบร้อยแล้ว ✓</span>
            </button>
          )}
          
          {/* Button 2 — secondary (results) */}
          {!isUnlocked ? (
            <button
              type="button"
              disabled
              className="w-full px-6 py-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>ล็อค: กรุณาทำแบบประเมินก่อน</span>
            </button>
          ) : (
            <button
              type="button"
              className="w-full px-6 py-3 rounded-xl bg-[#8A2680] text-white font-bold text-sm shadow-lg shadow-[#8A2680]/30 hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
              onClick={(e) => e.preventDefault()}
            >
              <BarChart3 className="w-4 h-4" />
              <span>ไปดูผลคะแนน (Results)</span>
            </button>
          )}
          
          {/* Back link */}
          <div className="mt-6">
            <button
              type="button"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

NOTE:
- Adjust lucide imports if any icon name differs in the version installed
- All buttons use `onClick={e => e.preventDefault()}` to be inert
- No `<Link>` components — all navigation eliminated
- No EditorElement wraps (no success elements registered yet — Phase 4)

---

## PART 2: Update PageDesignTab.js

### 2.1 Add successSimMode state

Find where `voteSimMode`/`closedSimMode` are declared (around line 412-413):

```jsx
const [voteSimMode, setVoteSimMode] = useState('multi');
const [closedSimMode, setClosedSimMode] = useState('waiting');
const [successSimMode, setSuccessSimMode] = useState('locked'); // NEW
```

### 2.2 Pass simMode to SuccessEditorPreview

Find the existing SuccessEditorPreview branch in renderPreview (added in 
H-SUCCESS-FIX). Currently:
```jsx
if (selectedPage === 'success') {
  return (
    <SuccessEditorPreview
      selectedElement={editorProps?.selectedElement}
      ...
    />
  );
}
```

Update to pass simMode:
```jsx
if (selectedPage === 'success') {
  return (
    <SuccessEditorPreview
      simMode={successSimMode}
      selectedElement={editorProps?.selectedElement}
      hoveredElement={editorProps?.hoveredElement}
      onSelectElement={editorProps?.onSelectElement}
      onHoverElement={editorProps?.onHoverElement}
      onHoverEnd={editorProps?.onHoverEnd}
    />
  );
}
```

### 2.3 Pass successSimMode through LivePreview

If LivePreview is a separate component that destructures props, add 
successSimMode:
```jsx
function LivePreview({
  ...,
  resultsSimMode,
  voteSimMode,
  closedSimMode,
  successSimMode,  // NEW
  editorProps,
  ...
}) {
```

In the JSX render of LivePreview, pass:
```jsx
<LivePreview
  ...
  resultsSimMode={resultsSimMode}
  voteSimMode={voteSimMode}
  closedSimMode={closedSimMode}
  successSimMode={successSimMode}  // NEW
  ...
/>
```

### 2.4 Add success-specific left panel with sim toggle

Find the existing `selectedPage === 'success'` left panel branch (added in 
H-SUCCESS-FIX). Currently:
```jsx
{selectedPage === 'success' && (
  <div className="space-y-4">
    <PlaceholderPageSectionList ... />
  </div>
)}
```

Update to add the toggle BEFORE the section list:
```jsx
{selectedPage === 'success' && (
  <div className="space-y-4">
    {/* Sim mode toggle */}
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
        สถานะการปลดล็อค
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSuccessSimMode('locked')}
          className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
            successSimMode === 'locked'
              ? 'bg-[#8A2680] text-white'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          ยังไม่ทำฟอร์ม
        </button>
        <button
          type="button"
          onClick={() => setSuccessSimMode('unlocked')}
          className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
            successSimMode === 'unlocked'
              ? 'bg-[#8A2680] text-white'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          ทำฟอร์มแล้ว
        </button>
      </div>
    </div>
    
    <PlaceholderPageSectionList
      page={getPageById('success')}
      sections={otherPages['success'] || []}
      onMove={(index, dir) => handleOtherMove('success', index, dir)}
      onToggleVisible={(index) => handleOtherToggleVisible('success', index)}
    />
  </div>
)}
```

---

## PART 3: Update /preview/page.js

### 3.1 Pass simMode in fullscreen route

Find the existing success branch (added in H-SUCCESS-FIX):
```jsx
{pageId === 'success' && <SuccessEditorPreview />}
```

Update to default to 'locked' for fullscreen:
```jsx
{pageId === 'success' && <SuccessEditorPreview simMode="locked" />}
```

(Could be made dynamic via URL query param later, but for now defaulting 
to locked is sufficient — admin can toggle in editor and see their changes 
in editor live preview anyway.)

---

## DO NOT
- Do NOT touch SuccessPage source (already guarded with editorMode in H-SUCCESS-FIX)
- Do NOT add useSession, useRouter, or API calls to SuccessEditorPreview
- Do NOT add Navbar/SiteFooter (production /success has neither)
- Do NOT register success elements in elementRegistry (Phase 4 work)
- Do NOT migrate form URL to globalConfig (admin has existing UI for this)
- Do NOT install packages

---

## VERIFICATION

### 1. Build
```bash
npm run build
```
Must PASS exit 0.

### 2. Grep proof
```bash
# SuccessEditorPreview has correct content
grep -n "บันทึกคะแนนสำเร็จ\|รับทรานสคริปต์กิจกรรม\|ชั่วโมงกิจกรรม\|ปลดล็อคหน้าสรุป" src/components/admin/SuccessEditorPreview.js

# successSimMode wired in PageDesignTab
grep -n "successSimMode" src/components/admin/PageDesignTab.js

# simMode passed to component
grep -n "simMode={successSimMode}\|simMode=\"locked\"" src/components/admin/PageDesignTab.js src/app/preview/page.js
```

Expected: all grep commands show matches.

### 3. Manual test — Visual accuracy
1. Admin → ออกแบบหน้าเว็บ → click "โหวตสำเร็จ"
2. ✅ Preview matches production /success layout (compare to your screenshot):
   - Green check icon in white circle with emerald glow
   - "บันทึกคะแนนสำเร็จ!" title
   - Subtitle about "การขับเคลื่อนกิจกรรมนักศึกษา..."
   - Activity card with megaphone + "รับทรานสคริปต์กิจกรรม"
   - 2 chips: "ชั่วโมงกิจกรรม 2 ชม." (purple) + "ประเภทเลือกเข้าร่วม" (rose)
   - Lock indicator: "🔓 ปลดล็อคหน้าสรุปผลคะแนนเสียง"
   - Dark button with pulsing dot: "เปิดแบบประเมิน (คลิกที่นี่) →"
   - Locked gray button: "ล็อค: กรุณาทำแบบประเมินก่อน"
   - "กลับหน้าหลัก" link

### 4. Manual test — Toggle states
1. Default: locked state shown
2. Click "ทำฟอร์มแล้ว" toggle:
   - ✅ Button 1 changes to emerald "ส่งแบบประเมินเรียบร้อยแล้ว ✓" (disabled)
   - ✅ Button 2 changes to purple "ไปดูผลคะแนน (Results)" with BarChart icon
3. Click "ยังไม่ทำฟอร์ม" toggle:
   - ✅ Reverts to locked state

### 5. Manual test — No navigation
1. Click any button or link in preview (locked or unlocked)
2. ✅ NO navigation
3. ✅ NO modal opens
4. ✅ Stays in admin

### 6. Other tabs unchanged
- All other tabs (home/vote/results/candidates/closed) work as before
- No regression from H-SYNC-FIX, H-3PAGES-PREV, H-3PAGES-FIX

### 7. Production /success unchanged
- Login + vote (multi-party flow)
- Navigate to /success
- ✅ Real success page renders (NOT the editor preview)
- ✅ Form modal works as before
- ✅ Lock/unlock based on form completion

### 8. Fullscreen preview
- From admin "โหวตสำเร็จ" tab, click expand button
- Opens /preview?page=success
- ✅ Shows SuccessEditorPreview in locked state
- ✅ No redirect

### 9. Console
- No red errors
- No `[getPath]` warnings

---

## REPORT FORMAT

```
Modified src/components/admin/SuccessEditorPreview.js — full rewrite to match production /success: green check icon + "บันทึกคะแนนสำเร็จ!" + activity card with megaphone + 2 chip badges + lock unlock footer + 2 buttons with simMode-driven states (locked: dark "เปิดแบบประเมิน" + locked gray; unlocked: emerald done + purple "ไปดูผลคะแนน") + "กลับหน้าหลัก" link; NO Navbar, NO SiteFooter, NO API calls; all buttons inert via e.preventDefault()

Modified src/components/admin/PageDesignTab.js — added successSimMode state with default 'locked'; passed simMode to SuccessEditorPreview branch in renderPreview; added successSimMode to LivePreview destructure and JSX usage; added 2-button toggle (ยังไม่ทำฟอร์ม / ทำฟอร์มแล้ว) above PlaceholderPageSectionList in success left panel

Modified src/app/preview/page.js — added simMode="locked" prop to SuccessEditorPreview in fullscreen route

Grep verifications (PROOF):
[paste actual grep output]

Build: PASS

Manual tests:
- Visual matches production /success layout ✅
- Toggle locked/unlocked changes button states ✅
- No navigation from preview clicks ✅
- Other tabs unchanged ✅
- Production /success unchanged ✅
```

No other commentary.
