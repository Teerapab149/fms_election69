# LIVE_STEP_H5_5.md — Click Lock for Editor Preview

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
In admin live preview, clicking elements like the Vote button or Navbar links 
triggers real navigation, throwing the admin out of the editor.

Diagnosis (DIAGNOSE_H5_5_CLICK_LOCK) confirmed:
- EditorElement uses `onClick` (bubble phase) → child handlers fire first → navigation
- Navbar is rendered OUTSIDE Wrap (not an EditorElement)
- Banner has no clickable elements (safe)

Fix: Two-layer click lock:
1. **EditorElement** — use `onClickCapture` to block child handlers before they fire
2. **LivePreview container** — capture-phase guard to catch Navbar / anything outside Wrap

## SCOPE (DO NOT EXCEED)
Modify exactly 2 files:
1. `src/components/admin/editor/EditorElement.js` — change onClick to onClickCapture + preventDefault
2. `src/components/admin/PageDesignTab.js` — add capture-phase click handler at LivePreview container

Do NOT modify any block component, Navbar, HomeContent, or hooks.
Do NOT install packages.
Do NOT change visual styling.

## PART 1: Modify `src/components/admin/editor/EditorElement.js`

### Change
The outer `<div>` currently uses `onClick` (bubble phase). Children's `onClick` 
handlers fire first → navigation happens before EditorElement gets the event.

Switch to capture phase + preventDefault to intercept BEFORE children:

**Find:**
```jsx
<div
  className="relative group/editor cursor-pointer"
  onClick={(e) => {
    e.stopPropagation();
    onSelect?.(id);
  }}
  onMouseEnter={() => onHover?.(id)}
  onMouseLeave={() => onHoverEnd?.()}
>
```

**Replace with:**
```jsx
<div
  className="relative group/editor cursor-pointer"
  onClickCapture={(e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(id);
  }}
  onMouseEnter={() => onHover?.(id)}
  onMouseLeave={() => onHoverEnd?.()}
>
```

### Why this works
- `onClickCapture` fires during the capture phase (top-down, before children)
- `e.preventDefault()` blocks default actions of any descendant — including 
  `<Link>` navigation and form submissions
- `e.stopPropagation()` prevents the event from continuing to descendants 
  during capture, which means child `onClick` handlers (like `signIn()` div) 
  never fire
- `onSelect?.(id)` still runs normally — selection works as before
- `onMouseEnter` / `onMouseLeave` are unaffected — they're separate event types

## PART 2: Modify `src/components/admin/PageDesignTab.js`

### Add capture-phase guard at LivePreview container

This catches clicks on elements OUTSIDE EditorElement (notably Navbar, footer 
links, hero badges that aren't wrapped, etc.).

**Find** the LivePreview preview area outer container — it's the `<div>` with 
`className="relative bg-slate-100/50 overflow-hidden"` and `style={{ height: '550px' }}`.

**Add** `onClickCapture` handler:

```jsx
<div 
  className="relative bg-slate-100/50 overflow-hidden" 
  style={{ height: '550px' }}
  onClickCapture={(e) => {
    // Block real navigation/actions in editor preview.
    // Selection via EditorElement is allowed because EditorElement's own 
    // onClickCapture also calls stopPropagation, but it fires AFTER this 
    // root capture. So we need to detect EditorElement clicks and let them through.
    
    // Check if click target is inside an editor element wrapper
    // EditorElement wraps with 'group/editor' class on its outer div
    const insideEditorElement = e.target.closest('.group\\/editor');
    
    if (!insideEditorElement) {
      // Click is on Navbar, footer, or unwrapped element — block it
      e.preventDefault();
      e.stopPropagation();
    }
    // If inside EditorElement, let it through — EditorElement's own 
    // onClickCapture will handle selection + block navigation
  }}
>
  {/* existing children — mobile/desktop preview wrappers */}
</div>
```

Note on the class selector: Tailwind generates `group/editor` as the class 
name. CSS selectors need to escape the `/`: `'.group\\/editor'` (in a 
JavaScript string, the backslash itself must be escaped).

If the escape is unreliable, use a more robust check via `.closest()` with a 
data attribute. To do that:

### Optional fallback — add data attribute (only if class selector fails)

If the class selector approach has issues, add this to EditorElement.js as well:

```jsx
<div
  className="relative group/editor cursor-pointer"
  data-editor-wrap="true"
  onClickCapture={...}
  ...
>
```

Then in PageDesignTab use:
```js
const insideEditorElement = e.target.closest('[data-editor-wrap="true"]');
```

This is more robust than the class selector. Use this approach if you encounter 
any issue with the class-based selector.

## DO NOT
- Do NOT modify any block component (VoteCTABlock, MeetCandidatesBlock, etc.)
- Do NOT modify Navbar or HomeContent
- Do NOT change EditorElement's overlay JSX (hover indicator, selection indicator)
- Do NOT change any onMouseEnter/onMouseLeave logic
- Do NOT install packages
- Do NOT add CSS pointer-events rules

## VERIFICATION

After both parts:

1. `npm run build` passes exit 0

2. Admin opens page design tab → live preview shows real components

3. **In editor preview, the following should NOT trigger navigation:**
   - Click "เข้าสู่ระบบ / Sign in" button → no OAuth redirect
   - Click Meet Candidates card → no navigation to /candidates
   - Click "หน้าแรก" / "ผลการลงคะแนน" in Navbar → no navigation
   - Click "Meet Candidates" button in Navbar → no navigation
   - Click Logout button (if visible) → no signOut

4. **In editor preview, the following should STILL work:**
   - Click voteCTA button → PropertyPanel/StatefulGallery opens
   - Click Meet Candidates section → PropertyPanel opens
   - Click any wrapped element → selection happens
   - Hover any wrapped element → purple dashed border appears
   - Hover off → border disappears

5. **Real `/` page (not editor):**
   - Vote button → real OAuth signin works
   - Meet Candidates → navigates to /candidates
   - Navbar links → navigate normally
   - All interactivity functions identically to before

## REPORT FORMAT

```
Modified src/components/admin/editor/EditorElement.js — onClick → onClickCapture + preventDefault to block child navigation before it fires
Modified src/components/admin/PageDesignTab.js — added onClickCapture guard at LivePreview container to catch clicks on Navbar/unwrapped elements
Build: PASS
```

No other commentary.
