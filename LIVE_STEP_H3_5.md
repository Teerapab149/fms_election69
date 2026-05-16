# LIVE_STEP_H3_5.md — Real VoteCTABlock in Gallery (forceState pattern)

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
H-3 used a fake mini-button preview in StatefulGallery. The user wants the 
ACTUAL VoteCTABlock to render in each gallery card so admin sees the real 
button (with gradient, shadow, icon, animation) — not a simplified mock.

The challenge: VoteCTABlock auto-detects state from runtime (session, 
electionStatus, isVoted). For the gallery, we need to FORCE each card to 
render a specific state.

## SCOPE (DO NOT EXCEED)
Modify exactly 2 files:
1. `src/components/blocks/VoteCTABlock.js` — add `forceState` prop
2. `src/components/admin/editor/StatefulGallery.js` — use real VoteCTABlock with forceState

Do NOT modify any other file.
Do NOT touch H-1/H-2/H-4 files.
Do NOT change the runtime detection logic — only allow override via prop.

## PART 1: Modify `src/components/blocks/VoteCTABlock.js`

### Goal
Allow caller to force a specific state for preview purposes.
When `forceState` is provided, skip runtime detection and use the forced state.
When absent, behave exactly as before (runtime detection).

### Changes

Update component signature:
```js
export default function VoteCTABlock({ 
  config = {}, 
  data = {}, 
  resolvedConfig = null,
  forceState = null     // NEW — "login" | "notVoted" | "voted" | "ended" | "closed" | "paused"
}) {
```

Find where the component currently determines state and selects `btnConfig`.
There should be a section like:
```js
// existing state detection — looks at session, systemMode, isVoted, etc.
const state = ...computed from runtime...
const btnConfig = STATES[state] || STATES.login;
```

Wrap state detection so forceState wins when provided:

```js
// If forceState is set, use it directly (preview/gallery mode)
// Otherwise compute from runtime
const computedState = forceState || (/* existing detection logic */);

const btnConfig = STATES[computedState] || STATES.login;
```

If the existing code uses `if/else if` chains instead of a STATES map, 
restructure carefully so:
- When `forceState === 'paused'` → orange gradient, "ระบบปิดปรับปรุง"
- When `forceState === 'ended'` → slate gradient, "อยู่นอกระยะเวลา"  
- When `forceState === 'closed'` → slate gradient, "ระบบปิดรับลงคะแนน"
- When `forceState === 'voted'` → blue gradient, "ดูผลคะแนน"
- When `forceState === 'notVoted'` → green gradient, "ลงคะแนน"
- When `forceState === 'login'` → purple gradient, "เข้าสู่ระบบ"

The simplest approach: extract state detection into a small helper function,
then short-circuit:

```js
function detectState({ session, systemMode, isSystemOpen, isVoted }) {
  if (systemMode === "PAUSE") return "paused";
  if (systemMode === "ENDED") return "ended";
  if (isSystemOpen === false) return "closed";
  if (!session) return "login";
  if (isVoted) return "voted";
  return "notVoted";
}

// inside component:
const state = forceState || detectState({ session, systemMode, isSystemOpen, isVoted });
```

Adjust to whatever variable names already exist in the file.

### Disable interactivity in preview mode
When `forceState` is set, the button should NOT be clickable (it's just preview).
Add `pointer-events-none` class to the button OR wrap with non-interactive parent
when `forceState` is truthy. Simplest:

```jsx
<button
  className={`... ${forceState ? 'pointer-events-none' : ''}`}
  onClick={forceState ? undefined : existingHandler}
>
```

## PART 2: Modify `src/components/admin/editor/StatefulGallery.js`

### Goal
Replace the fake `GalleryPreview` mini-button with the real VoteCTABlock 
rendered with forceState + resolvedConfig per state.

### Changes

Add import at top:
```js
import VoteCTABlock from '../../blocks/VoteCTABlock';
```

Find the existing `GalleryPreview` component definition (the inner function 
that renders the small button). REPLACE its body to dispatch by element type 
to the real component:

```jsx
function GalleryPreview({ elementId, stateId, resolvedConfig, type }) {
  // For each stateful element type, render the actual production component
  // with forceState + resolvedConfig so the admin sees the REAL look
  
  if (elementId === 'voteCTA-button') {
    return (
      <div className="bg-slate-50 rounded-md p-4 flex items-center justify-center min-h-[80px]">
        <VoteCTABlock
          config={{}}
          data={{}}
          resolvedConfig={resolvedConfig}
          forceState={stateId}
        />
      </div>
    );
  }
  
  // Fallback for elements not yet supported
  return (
    <div className="bg-slate-50 rounded-md p-4 flex items-center justify-center text-xs text-slate-400">
      Preview not yet available for {elementId}
    </div>
  );
}
```

Find where `<GalleryPreview ... />` is called (in the state card map). 
Update the call to pass the new props:

```jsx
<GalleryPreview 
  elementId={elementId}
  stateId={state.id}
  resolvedConfig={resolvedConfig}
  type={element.type} 
/>
```

### Remove now-unused helper functions
The previous helpers `buildPreviewBg`, `buildPreviewRadius`, `buildPreviewShadow` 
inside StatefulGallery.js are no longer needed (real component does the styling).
Delete them.

## DO NOT
- Do NOT modify the state detection logic for runtime cases (no forceState)
- Do NOT modify VoteCTABlock's icon/animation logic
- Do NOT install packages
- Do NOT change H-1/H-2/H-4 files
- Do NOT make the preview button interactive (pointer-events-none required)

## VERIFICATION

1. `npm run build` passes exit 0
2. Real `/` page — voteCTA still works exactly as before (no regression)
3. Admin → click voteCTA-button in preview → Gallery opens
4. Each of 6 state cards shows the REAL button:
   - "ยังไม่ล็อกอิน" → purple gradient with LogIn icon, real shadow, real hover effects
   - "ยังไม่โหวต" → green gradient with Vote icon (animate-pulse)
   - "โหวตแล้ว" → blue gradient with BarChart3 icon
   - "หมดเวลา" → slate dark with muted Vote icon
   - "ปิดรับโหวต" → slate dark
   - "PAUSE" → orange with spinning Vote icon
5. Hovering over preview buttons doesn't trigger click (pointer-events-none)
6. Editing state config still updates the preview live

## REPORT FORMAT

```
Modified src/components/blocks/VoteCTABlock.js — added forceState prop, extracted state detection, disabled clicks when forced
Modified src/components/admin/editor/StatefulGallery.js — GalleryPreview now uses real VoteCTABlock with forceState, removed unused helpers
Build: PASS
```

No other commentary.
