# LIVE_STEP_H2.md — Bridge voteCTA-button Config to Live Page

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
H-1 created foundation files (statefulRegistry, stateResolver, templateEngine).
H-2 bridges this foundation to the real voteCTA button so both:
- Production page (`/`) renders with resolved config
- Admin editor preview renders with resolved config
- Admin save persists: sourceTemplate + elementOverrides

## SCOPE (DO NOT EXCEED)
Modify exactly 3 files:
1. `src/components/blocks/VoteCTABlock.js` — accept resolved config, apply inline styles
2. `src/components/HomeContent.js` — resolve state + pass config to VoteCTABlock  
3. `src/app/page.js` — add runtime context data to SSR

Do NOT modify statefulRegistry, stateResolver, or templateEngine (from H-1).
Do NOT touch MeetCandidatesBlock or other blocks yet.
Do NOT touch PropertyPanel (Gallery UI comes in H-3).
Do NOT modify API routes.

## BEHAVIOR REQUIREMENTS

After this step:
- `/` page renders voteCTA with resolved template config (currently "classic" default)
- If no pageLayout saved yet → uses TEMPLATES.classic defaults from templateEngine
- If pageLayout has `sourceTemplate: "neon"` → uses Neon defaults
- If pageLayout has `elementOverrides.voteCTA-button.login.backgroundColor = "#ff0000"` → override wins
- Existing btnConfig state logic in VoteCTABlock STILL works for icon/animation

## PART 1: Modify `src/components/blocks/VoteCTABlock.js`

### Goal
Accept a `resolvedConfig` prop with merged template + override values.
Apply inline styles to override the hardcoded Tailwind classes.
Keep existing icon + animation logic intact (those depend on state, not design).

### Changes

Add new prop to component signature:
```js
export default function VoteCTABlock({ config = {}, data = {}, resolvedConfig = null }) {
```

Near the top of the component (after destructuring existing data/state):

```js
// Style overrides from editor config — null in legacy mode
const styleOverride = resolvedConfig;

const hasOverride = !!styleOverride;

// Build inline style only when override is active
const buttonInlineStyle = hasOverride ? buildButtonStyle(styleOverride) : undefined;
const textOverride = hasOverride ? styleOverride.text : null;
```

Add this helper function INSIDE the file (not exported, after imports):

```js
function buildButtonStyle(cfg) {
  if (!cfg) return undefined;
  
  const style = {};
  
  // Background
  if (cfg.backgroundType === "gradient") {
    const parts = [cfg.gradientFrom];
    if (cfg.gradientVia) parts.push(cfg.gradientVia);
    parts.push(cfg.gradientTo);
    const direction = {
      "to-r": "to right", "to-l": "to left",
      "to-t": "to top", "to-b": "to bottom",
      "to-tr": "to top right", "to-tl": "to top left",
      "to-br": "to bottom right", "to-bl": "to bottom left"
    }[cfg.gradientDirection] || "to right";
    style.backgroundImage = `linear-gradient(${direction}, ${parts.join(", ")})`;
    style.backgroundColor = cfg.gradientFrom; // fallback
  } else if (cfg.backgroundType === "solid") {
    style.backgroundColor = cfg.backgroundColor;
    style.backgroundImage = "none";
  }
  
  // Text
  if (cfg.textColor) style.color = cfg.textColor;
  if (cfg.fontSize) {
    const sizeMap = { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" };
    style.fontSize = sizeMap[cfg.fontSize] || "1.125rem";
  }
  if (cfg.fontWeight) {
    const weightMap = { normal: "400", medium: "500", semibold: "600", bold: "700", black: "900" };
    style.fontWeight = weightMap[cfg.fontWeight] || "700";
  }
  
  // Radius
  if (cfg.borderRadius) {
    const radiusMap = { none: "0", sm: "0.125rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem", full: "9999px" };
    style.borderRadius = radiusMap[cfg.borderRadius] || "0.75rem";
  }
  
  // Border
  if (cfg.borderWidth && cfg.borderWidth !== "0") {
    style.borderWidth = `${cfg.borderWidth}px`;
    style.borderStyle = "solid";
    style.borderColor = cfg.borderColor || "transparent";
  }
  
  // Shadow
  if (cfg.shadow && cfg.shadow !== "none") {
    const shadowMap = {
      sm: "0 1px 2px 0",
      md: "0 4px 6px -1px",
      lg: "0 10px 15px -3px",
      xl: "0 20px 25px -5px",
      "2xl": "0 25px 50px -12px"
    };
    const shadowColor = cfg.shadowColor ? `${cfg.shadowColor}66` : "rgba(0,0,0,0.25)";
    style.boxShadow = `${shadowMap[cfg.shadow] || shadowMap.lg} ${shadowColor}`;
  }
  
  // Padding
  if (cfg.paddingX) style.paddingLeft = style.paddingRight = `${parseInt(cfg.paddingX) * 0.25}rem`;
  if (cfg.paddingY) style.paddingTop = style.paddingBottom = `${parseInt(cfg.paddingY) * 0.25}rem`;
  
  return style;
}
```

### Apply inline style to the button JSX

Find the `<button>` or `<InnerButton>` element. If `hasOverride`:
- Apply `buttonInlineStyle` via `style={...}` prop
- Replace text with `textOverride` if provided, otherwise use existing `btnConfig.text`
- Keep icon logic (`btnConfig.icon`) unchanged — icon comes from state, not config

Pattern:
```jsx
<button
  className={/* existing class but REMOVE hardcoded bg-gradient-to-r, rounded-xl, shadow-* when hasOverride */}
  style={buttonInlineStyle}
>
  ...
  <span className="...">
    {textOverride ?? btnConfig.text}
    {/* icon span stays */}
  </span>
</button>
```

IMPORTANT: When `hasOverride` is true, strip gradient/radius/shadow Tailwind classes 
from className so inline style wins. When false (legacy mode / no editor config), 
keep ALL existing Tailwind classes — nothing should change visually.

Example className handling:
```jsx
const legacyClassName = `relative w-full sm:w-auto overflow-hidden rounded-xl bg-gradient-to-r ${btnConfig.gradientBase} px-10 py-4 text-lg font-bold text-white ${btnConfig.shadow} ring-1 ring-white/20 ...`;

const overrideClassName = `relative w-full sm:w-auto overflow-hidden ring-1 ring-white/20 transition-all duration-500 ease-out transform group-hover:scale-[1.02] group-hover:-translate-y-1 active:scale-95 isolate text-white`;

const btnClassName = hasOverride ? overrideClassName : legacyClassName;
```

Keep the hover overlay, shine sweep, and glow wrapper divs — they depend on 
gradient classes which won't exist when overrides are active. Guard them:

```jsx
{!hasOverride && (
  <>
    {/* existing hover overlay */}
    {/* existing shine sweep */}
  </>
)}

{!hasOverride && (
  /* existing glow wrapper with gradient */
)}
```

For the icon area, keep existing logic — icons come from `btnConfig.icon` 
which is computed from state (LogIn/Vote/BarChart3/etc.), not from config.

## PART 2: Modify `src/components/HomeContent.js`

### Goal
Resolve the current state of voteCTA-button using H-1 helpers, then resolve
final config by merging template defaults + admin overrides, then pass to
VoteCTABlock as `resolvedConfig` prop.

### Changes

Add imports at top:
```js
import { resolveElementState, buildRuntimeContext } from './admin/editor/stateResolver';
import { resolveStatefulConfig } from './admin/editor/templateEngine';
```

Inside HomeContent function body, after pageLayout is available:

```js
// Build runtime context for state-aware elements
const runtimeCtx = buildRuntimeContext({
  session,
  systemConfig: initialData?.systemConfig,
  electionStatus: initialData?.electionStatus,
  userData: initialData?.userData
});

// Resolve voteCTA-button state + config
const voteCTAState = resolveElementState('voteCTA-button', runtimeCtx);
const voteCTASourceTemplate = pageLayout?.sourceTemplate || 'classic';
const voteCTAOverrides = pageLayout?.elementOverrides?.['voteCTA-button']?.[voteCTAState] || {};
const voteCTAResolvedConfig = resolveStatefulConfig(
  voteCTASourceTemplate,
  'voteCTA-button',
  voteCTAState,
  voteCTAOverrides
);
```

Find where `<VoteCTABlock>` is rendered (likely inside renderColumn switch).
Change to pass resolvedConfig:

```jsx
case 'voteCTA':
  return <VoteCTABlock 
    config={block.config || {}} 
    data={blockData} 
    resolvedConfig={voteCTAResolvedConfig}
  />;
```

Also apply in the editor mode branch if voteCTA is rendered there.
Keep existing logic untouched — only ADD the `resolvedConfig` prop.

## PART 3: Modify `src/app/page.js`

### Goal
Ensure `initialData` passed to HomeContent contains the runtime context data
needed for state resolution (systemConfig with systemMode, electionStatus, 
userData with isVoted).

### Changes

Find `getHomeData()` function. Verify it returns (or add if missing):
```js
return {
  // ...existing fields (pageLayout, candidates, stats)...
  systemConfig: systemConfig ? {
    systemMode: systemConfig.systemMode,
    isSystemOpen: systemConfig.isSystemOpen,
    showResult: systemConfig.showResult,
  } : null,
  electionStatus: /* compute from systemMode + dates, or pass through */,
  userData: session?.user ? {
    isVoted: session.user.isVoted || false,
    isFormCompleted: session.user.isFormCompleted || false
  } : null
};
```

If `systemConfig`, `electionStatus`, or `userData` already exist in 
`getHomeData` return, leave as-is. Only add if missing.

Pass `session` and all of `homeData` to HomeContent (should already be there):
```jsx
<HomeContent 
  session={session} 
  initialData={homeData}
  pageLayout={homeData.pageLayout}
/>
```

## DO NOT
- Do NOT modify statefulRegistry.js, stateResolver.js, templateEngine.js (from H-1)
- Do NOT change VoteCTABlock's internal state detection (btnConfig switch by state)
- Do NOT remove any existing Tailwind classes in legacy mode path
- Do NOT break existing behavior when `resolvedConfig` prop is absent
- Do NOT install packages
- Do NOT add new UI controls

## VERIFICATION

After all 3 parts complete:

1. `npm run build` passes exit 0
2. Open `/` (real page) — voteCTA button renders
   - If no pageLayout in DB → uses Classic defaults from templateEngine (purple gradient for login)
   - Text + gradient matches TEMPLATES.classic.elements["voteCTA-button"].login
3. Manually set in DB `pageLayout.sourceTemplate = "neon"` → refresh `/` → button should change to Neon style (cyan solid, "SIGN IN" text)
4. Admin editor preview still works (no regression)
5. Login to real site → button changes to "Vote Now" green (classic notVoted state)

## REPORT FORMAT
```
Modified src/components/blocks/VoteCTABlock.js — added resolvedConfig prop, buildButtonStyle helper, conditional inline style override
Modified src/components/HomeContent.js — build runtime context, resolve voteCTA state + config, pass resolvedConfig to block
Modified src/app/page.js — ensure runtime context fields in getHomeData return
Build: PASS
```

No extra commentary. Do not run dev server.
