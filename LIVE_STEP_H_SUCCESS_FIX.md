# LIVE_STEP_H_SUCCESS_FIX.md — Fix Success Tab Auto-Redirect

## READ FIRST
Read `CLAUDE.md`, `MASTER_PLAN.md`, `DECISIONS.md`. Follow strictly.

## CONTEXT

Diagnosis (DIAGNOSE_SUCCESS_CLICKLEAK) confirmed: clicking "โหวตสำเร็จ" 
tab in admin causes browser to navigate to /vote (then /login).

**Root cause:** PagePreviewRenderer renders real `SuccessPage` which has a 
useEffect that calls `router.replace("/vote")` on mount when admin user has 
`isVoted = false`. Click-lock cannot intercept this — navigation is 
programmatic from a lifecycle hook, not from a click event.

This is not a click-lock bug. This is a "real production page in editor 
context" bug.

## STRATEGY

Defense in depth — fix at TWO layers:

1. **Create SuccessEditorPreview** — static component with no auth, no 
   redirect, no API calls. Mirrors ClosedEditorPreview pattern.

2. **Add editorMode prop to SuccessPage** — defensive guard so if any 
   caller renders SuccessPage in editor context, it skips auth/redirect 
   logic and shows static content.

3. **Wire SuccessEditorPreview** into PageDesignTab + /preview routing + 
   register 'success' as proper editable page.

4. **Add 'success' to elementProps + catch-all condition** so editor wraps 
   work for it.

## SCOPE (DO NOT EXCEED)

Modify exactly 4 files + Create 1 file:

1. **CREATE** `src/components/admin/SuccessEditorPreview.js`
2. **MODIFY** `src/app/success/page.js` — add editorMode prop with guard
3. **MODIFY** `src/components/admin/PageDesignTab.js` — wire SuccessEditorPreview branch + extend editorProps + catch-all
4. **MODIFY** `src/app/preview/page.js` — wire fullscreen success branch
5. **MODIFY** `src/components/admin/previews/PagePreviewRenderer.js` — defensive editorMode pass-through (in case ever rendered)

Do NOT modify:
- elementRegistry.js (no success elements registered yet — Phase 4)
- pageRegistry.js (success already in EDITABLE_PAGES — verify only)
- Other unaffected files

Do NOT install packages.

---

## PART 1: Create SuccessEditorPreview.js

```jsx
"use client";

import { CheckCircle2, Sparkles, Trophy } from 'lucide-react';
import Navbar from '../Navbar';
import SiteFooter from '../SiteFooter';
import { useGlobalConfig } from '@/contexts/GlobalConfigContext'; // adjust path

/**
 * SuccessEditorPreview — static admin preview of /success page.
 * NO useSession, NO useRouter, NO API calls.
 * Pure visual mockup for design editing.
 */
export default function SuccessEditorPreview({
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  const globalConfig = useGlobalConfig();
  
  // No EditorElement wraps — no success elements registered yet (Phase 4)
  // Static preview matches the production /success layout
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-purple-50">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Success card */}
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl p-8 lg:p-10 text-center relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-100 rounded-full blur-3xl opacity-60" />
            
            {/* Content */}
            <div className="relative">
              {/* Success icon */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              
              {/* Sparkle accent */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">โหวตสำเร็จ</span>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-black text-slate-800 mb-2">
                ขอบคุณที่ใช้สิทธิ์
              </h1>
              
              {/* Subtitle */}
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                คะแนนเสียงของคุณได้ถูกบันทึกในระบบแล้ว<br />
                ติดตามผลการเลือกตั้ง {globalConfig.electionName} ได้เร็วๆ นี้
              </p>
              
              {/* Action buttons */}
              <div className="space-y-2">
                <button className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#8A2680] to-[#9333EA] text-white font-bold text-sm shadow-lg shadow-[#8A2680]/30 hover:shadow-xl transition-shadow flex items-center justify-center gap-2">
                  <Trophy className="w-4 h-4" />
                  ดูผลคะแนน
                </button>
                <button className="w-full px-6 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors">
                  กลับสู่หน้าหลัก
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}
```

NOTES:
- Adjust import path for `useGlobalConfig` to match existing patterns in 
  the codebase (relative or `@/` alias)
- If `lucide-react` icons differ in availability, use any check-mark icon
- The visual is intentionally close to production /success but all clicks 
  are inert (`button` not `Link`, no onClick handlers that navigate)

---

## PART 2: Add editorMode guard to SuccessPage

### File: `src/app/success/page.js`

### 2.1 Find the function signature

Currently:
```js
export default function SuccessPage() {
  // hooks: useSession, useRouter, useState, useEffect (auth + check-status)
  // ...
}
```

### 2.2 Add editorMode prop and early-return guard

```js
export default function SuccessPage({ editorMode = false } = {}) {
  // ... existing hooks here, but guard the redirect useEffect
  
  // Existing useEffect (around lines 50-129):
  useEffect(() => {
    // NEW: skip all auth/redirect logic in editor mode
    if (editorMode) return;
    
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && session) {
      // ... existing fetch + router.replace logic
    }
  }, [status, session, router, isJustVoted, editorMode]);  // add editorMode to deps
  
  // ... rest of component unchanged
}
```

### 2.3 Optional — early static return in editor mode

If the rest of the component depends on session data and would break with 
session=null, add an early return at the top:

```js
if (editorMode) {
  // Render minimal static content for editor preview fallback
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500 text-sm">Success page preview</p>
    </div>
  );
}
```

Whether to add this depends on what other hooks the component uses. If 
all hooks safely handle null session, the redirect-skip is sufficient. If 
not, add the early return.

CRITICAL — read the rest of SuccessPage first before deciding whether 
early return is needed. If the component would crash without session, 
add the early return.

---

## PART 3: Wire SuccessEditorPreview in PageDesignTab.js

### 3.1 Add import

Near the top with other admin previews:
```js
import SuccessEditorPreview from './SuccessEditorPreview';
```

### 3.2 Add to renderPreview

In the `renderPreview` function, add a `'success'` branch BEFORE the 
PagePreviewRenderer fallback:

```jsx
function renderPreview(deviceMode) {
  if (selectedPage === 'home' && editorProps) { ... }
  if (selectedPage === 'results') { ... }
  if (selectedPage === 'vote') { ... }
  if (selectedPage === 'candidates') { ... }
  if (selectedPage === 'closed') { ... }
  
  // NEW
  if (selectedPage === 'success') {
    return (
      <SuccessEditorPreview
        selectedElement={editorProps?.selectedElement}
        hoveredElement={editorProps?.hoveredElement}
        onSelectElement={editorProps?.onSelectElement}
        onHoverElement={editorProps?.onHoverElement}
        onHoverEnd={editorProps?.onHoverEnd}
      />
    );
  }
  
  // Fallback
  return <PagePreviewRenderer ... />;
}
```

### 3.3 Extend editorProps to include 'success'

Find the editorProps creation (currently ~line 1165-1174):
```jsx
editorProps={
  ['home', 'results', 'vote', 'candidates', 'closed'].includes(selectedPage)
    ? { ... }
    : null
}
```

Update:
```jsx
editorProps={
  ['home', 'results', 'vote', 'candidates', 'closed', 'success'].includes(selectedPage)
    ? { ... }
    : null
}
```

### 3.4 Update catch-all condition for left panel

Find the catch-all PlaceholderPageSectionList:
```jsx
{!['home', 'vote', 'results', 'candidates', 'closed'].includes(selectedPage) && (
  <PlaceholderPageSectionList ... />
)}
```

Update:
```jsx
{!['home', 'vote', 'results', 'candidates', 'closed', 'success'].includes(selectedPage) && (
  <PlaceholderPageSectionList ... />
)}
```

### 3.5 Add success-specific left panel (minimum viable)

Add a new branch for selectedPage === 'success' that just shows the 
section list — no mode toggle needed (success has no state variations 
yet):

```jsx
{selectedPage === 'success' && (
  <div className="space-y-4">
    <PlaceholderPageSectionList
      page={getPageById('success')}
      sections={otherPages['success'] || []}
      onMove={(index, dir) => handleOtherMove('success', index, dir)}
      onToggleVisible={(index) => handleOtherToggleVisible('success', index)}
    />
    {/* No PropertyPanel — no success elements registered yet (Phase 4) */}
  </div>
)}
```

---

## PART 4: Wire fullscreen preview in /preview/page.js

### 4.1 Add import

```js
import SuccessEditorPreview from '../../components/admin/SuccessEditorPreview';
```

### 4.2 Add routing branch

Before the catch-all PagePreviewRenderer:
```jsx
{pageId === 'home' && <HomeContent ... />}
{pageId === 'results' && <ResultsEditorPreview ... />}
{pageId === 'vote' && <VoteEditorPreview ... />}
{pageId === 'candidates' && <CandidatesEditorPreview ... />}
{pageId === 'closed' && <ClosedEditorPreview ... />}

{/* NEW */}
{pageId === 'success' && <SuccessEditorPreview />}

{!['home','results','vote','candidates','closed','success'].includes(pageId) && (
  <PagePreviewRenderer ... />
)}
```

---

## PART 5: Defensive guard in PagePreviewRenderer.js

### 5.1 Find the 'success' case

Around line 95-107:
```jsx
case 'success':
  return (
    <SuccessPage
      editorMode={true}
      pageLayout={pageLayout}
      ...
    />
  );
```

### 5.2 Now that SuccessPage accepts editorMode, this case is safer

After PART 2, SuccessPage respects `editorMode={true}` and skips redirects. 
So this fallback is now safe even if hit.

**Verify** that the editorMode prop is actually passed (some H-3PAGES-PREV 
work passed it but SuccessPage ignored it). After this step, both sides 
agree on the contract.

No structural change needed here, but add a comment for clarity:
```jsx
case 'success':
  // Note: SuccessPage now respects editorMode (PART 2 of H-SUCCESS-FIX) so this
  // fallback won't trigger redirects. Primary path is SuccessEditorPreview via
  // PageDesignTab and /preview/page.js routing — this is defensive only.
  return (
    <SuccessPage
      editorMode={true}
      pageLayout={pageLayout}
      ...
    />
  );
```

---

## DO NOT
- Do NOT modify Navbar component
- Do NOT register success elements in elementRegistry (Phase 4 work)
- Do NOT add EditorElement wraps to SuccessEditorPreview content yet
- Do NOT remove the PagePreviewRenderer 'success' case (defense in depth)
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
grep -n "SuccessEditorPreview" src/components/admin/PageDesignTab.js src/app/preview/page.js
grep -n "editorMode" src/app/success/page.js
grep -n "'success'" src/components/admin/PageDesignTab.js
```

Expected:
- SuccessEditorPreview imported + used in both PageDesignTab and /preview
- editorMode appears in success/page.js function sig + useEffect guard
- 'success' appears in renderPreview branch + editorProps + catch-all

### 3. Manual test — Primary fix
1. Open admin → ออกแบบหน้าเว็บ
2. Click "หน้าหลัก" first
3. Click "โหวตสำเร็จ" tab
4. ✅ NO browser navigation
5. ✅ Stays in admin
6. ✅ Preview shows success card mockup (CheckCircle, "ขอบคุณที่ใช้สิทธิ์")

### 4. Click test in success preview
1. Click anywhere in success preview area (buttons, decorative elements)
2. ✅ NO navigation
3. ✅ Click-lock at LivePreview container catches non-EditorElement clicks

### 5. Other tabs unchanged
- Click "หน้าหลัก" → home preview works
- Click "ผลคะแนน" → results preview works
- Click "หน้าลงคะแนน" → vote preview works
- Click "รายชื่อผู้สมัคร" → candidates preview works (no crash from H-3PAGES-FIX)
- Click "หน้าระบบปิด" → closed preview works

### 6. Production page unchanged
1. Logout (or fresh session)
2. Try to navigate to /success directly
3. ✅ Redirects to /login (production behavior preserved)

If logged in and voted:
1. Navigate to /success
2. ✅ Shows real success page (not editor preview)

### 7. Fullscreen preview
1. Click expand button while on "โหวตสำเร็จ" tab
2. Opens /preview?page=success
3. ✅ Shows SuccessEditorPreview (no redirect)

### 8. Console check
- No red errors when switching to success tab
- No `[getPath] received non-string input` warnings

---

## REPORT FORMAT

```
Created src/components/admin/SuccessEditorPreview.js — static admin preview with Navbar + success card mockup (CheckCircle icon + "ขอบคุณที่ใช้สิทธิ์" + 2 inert buttons) + SiteFooter; uses globalConfig.electionName for dynamic text; NO useSession/useRouter/API calls

Modified src/app/success/page.js — added editorMode prop with default false; guarded auth useEffect to skip redirect when editorMode=true; added editorMode to useEffect deps

Modified src/components/admin/PageDesignTab.js — added SuccessEditorPreview import; added 'success' branch in renderPreview; extended editorProps to include 'success'; added 'success' left panel branch with PlaceholderPageSectionList; updated catch-all condition

Modified src/app/preview/page.js — added SuccessEditorPreview import; added pageId === 'success' branch; updated catch-all condition

Modified src/components/admin/previews/PagePreviewRenderer.js — added defensive comment to 'success' case (no structural change; now safe because SuccessPage respects editorMode)

Grep verifications (PROOF):
[paste actual grep output]

Build: PASS

Manual tests:
- Admin "โหวตสำเร็จ" tab: no redirect, shows static preview ✅
- Click within preview: no navigation ✅  
- Other tabs: unchanged ✅
- Production /success: still redirects properly ✅
```

No other commentary.
