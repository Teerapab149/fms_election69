# LIVE_STEP_H6.md — Convert Countdown Timer to State-Aware

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
CountdownTimer has 6 phases (LOADING/BEFORE/RUNNING/PAUSED/MANUAL_ENDED/NEXT_YEAR) 
all hardcoded. Convert to state-aware so admin can:
- See all 5 design phases (LOADING is locked) in StatefulGallery
- Edit per-phase design (badge color, text color, border, shadow, icon, animation)
- Edit per-phase label text
- Apply Classic / Neon templates
- Override individual phases

LOGIC stays locked: phase detection is hardcoded based on systemMode + dates.
DATA stays locked: countdown numbers come from real-time computation.

## SCOPE (DO NOT EXCEED)
Modify exactly 5 files:

1. `src/components/admin/editor/statefulRegistry.js` — register hero-countdown
2. `src/components/admin/editor/stateResolver.js` — add countdown resolver
3. `src/components/admin/editor/templateEngine.js` — add countdown configs to TEMPLATES.classic + TEMPLATES.neon
4. `src/components/CountdownTimer.js` — accept resolvedConfig + forceState, fix ELECTION_NEXT_YEAR memo bug, dynamic SEE YOU year
5. `src/components/HomeContent.js` — resolve countdown state + config, pass to CountdownTimer
6. `src/components/admin/editor/StatefulGallery.js` — extend GalleryPreview to handle countdown type

Do NOT install packages.
Do NOT modify electionConfig.js (election dates editor is a future step).
Do NOT change PropertyPanel routing logic.
Do NOT add new state to useEditorState.

## PART 1: Modify `src/components/admin/editor/statefulRegistry.js`

Add a new entry to STATEFUL_ELEMENTS — KEEP existing voteCTA-button entry intact.

```js
// Add inside STATEFUL_ELEMENTS object, after "voteCTA-button":
"hero-countdown": {
  type: "countdown",
  label: "นาฬิกานับเวลา",
  section: "hero",
  isStateful: true,
  editableText: true,
  stateResolverKey: "countdown",
  states: [
    { id: "before",       label: "ก่อนเริ่ม",            description: "ก่อนถึงเวลาเริ่มเลือกตั้ง" },
    { id: "running",      label: "กำลังเลือกตั้ง",       description: "อยู่ในช่วงเลือกตั้ง — นับถอยหลังจนปิด" },
    { id: "paused",       label: "ระบบ PAUSE",           description: "admin สั่งปิดปรับปรุงชั่วคราว" },
    { id: "manualEnded",  label: "ปิดด้วย admin (ENDED)", description: "admin บังคับปิดก่อนเวลา" },
    { id: "nextYear",     label: "เลยช่วงเลือกตั้ง",      description: "เลยกำหนดเเล้ว รอปีถัดไป" }
  ],
  defaultConfig: {
    before: {
      label: "STARTS IN",
      pillBackground: "#ffffff",
      badgeBackgroundColor: "#9D3292",
      badgeTextColor: "#ffffff",
      textMain: "#9D3292",
      textSub: "#a78bfa",
      borderColor: "#e9d5ff",
      shadow: "md",
      shadowColor: "#9D3292",
      iconName: "Flag",
      iconAnimation: "none"
    },
    running: {
      label: "CLOSES IN",
      pillBackground: "#ffffff",
      badgeBackgroundColor: "#ef4444",
      badgeTextColor: "#ffffff",
      textMain: "#dc2626",
      textSub: "#f87171",
      borderColor: "#fecaca",
      shadow: "md",
      shadowColor: "#ef4444",
      iconName: "Zap",
      iconAnimation: "pulse"
    },
    paused: {
      label: "SYSTEM PAUSED",
      pillBackground: "#ffffff",
      badgeBackgroundColor: "#fed7aa",
      badgeTextColor: "#c2410c",
      textMain: "#ea580c",
      textSub: "#fb923c",
      borderColor: "#fed7aa",
      shadow: "sm",
      shadowColor: "#ea580c",
      iconName: "Hourglass",
      iconAnimation: "spin"
    },
    manualEnded: {
      label: "ELECTION ENDED",
      pillBackground: "#ffffff",
      badgeBackgroundColor: "#e2e8f0",
      badgeTextColor: "#334155",
      textMain: "#475569",
      textSub: "#94a3b8",
      borderColor: "#cbd5e1",
      shadow: "none",
      shadowColor: "#000000",
      iconName: "CalendarDays",
      iconAnimation: "none"
    },
    nextYear: {
      label: "SEE YOU {YEAR}",
      pillBackground: "#ffffff",
      badgeBackgroundColor: "#1e293b",
      badgeTextColor: "#ffffff",
      textMain: "#334155",
      textSub: "#94a3b8",
      borderColor: "#e2e8f0",
      shadow: "sm",
      shadowColor: "#000000",
      iconName: "CalendarDays",
      iconAnimation: "none"
    }
  }
}
```

Note: `{YEAR}` placeholder in the `nextYear.label` will be replaced at render time 
with `ELECTION_YEAR + 1` from electionConfig.

## PART 2: Modify `src/components/admin/editor/stateResolver.js`

Add `countdown` resolver to STATE_RESOLVERS — KEEP existing voteCTA resolver.

```js
// Add inside STATE_RESOLVERS object:
countdown: (context) => {
  const { systemMode, electionPhase } = context || {};
  
  if (systemMode === "PAUSE") return "paused";
  if (systemMode === "ENDED") return "manualEnded";
  if (systemMode === "MANUAL_OPEN") return "running";
  
  // AUTO mode — phase comes from date comparison done in buildRuntimeContext
  if (electionPhase === "before") return "before";
  if (electionPhase === "running") return "running";
  if (electionPhase === "ended") return "nextYear";
  
  return "before"; // safe default
}
```

Update `buildRuntimeContext` to compute electionPhase from current time + 
ELECTION_CONFIG dates:

```js
import { ELECTION_CONFIG } from '../../../utils/electionConfig';

export function buildRuntimeContext({ session, systemConfig, electionStatus, userData }) {
  // Compute electionPhase from real time vs ELECTION_CONFIG
  const now = new Date();
  const start = ELECTION_CONFIG.ELECTION_START;
  const end = ELECTION_CONFIG.ELECTION_END;
  
  let electionPhase;
  if (now < start) electionPhase = "before";
  else if (now < end) electionPhase = "running";
  else electionPhase = "ended";

  return {
    session: session || null,
    electionPhase: electionStatus || electionPhase,
    systemMode: systemConfig?.systemMode || "AUTO",
    isSystemOpen: systemConfig?.isSystemOpen !== false,
    isVoted: userData?.isVoted || session?.user?.isVoted || false,
    isRevealed: systemConfig?.showResult === true
  };
}
```

If the electionConfig import path is different, adjust to match.

## PART 3: Modify `src/components/admin/editor/templateEngine.js`

Add `hero-countdown` configs to BOTH templates. KEEP existing voteCTA-button 
entries intact.

### TEMPLATES.classic.elements — add this entry:

```js
"hero-countdown": {
  before: {
    label: "STARTS IN",
    pillBackground: "#ffffff",
    badgeBackgroundColor: "#9D3292",
    badgeTextColor: "#ffffff",
    textMain: "#9D3292",
    textSub: "#a78bfa",
    borderColor: "#e9d5ff",
    shadow: "md",
    shadowColor: "#9D3292",
    iconName: "Flag",
    iconAnimation: "none"
  },
  running: {
    label: "CLOSES IN",
    pillBackground: "#ffffff",
    badgeBackgroundColor: "#ef4444",
    badgeTextColor: "#ffffff",
    textMain: "#dc2626",
    textSub: "#f87171",
    borderColor: "#fecaca",
    shadow: "md",
    shadowColor: "#ef4444",
    iconName: "Zap",
    iconAnimation: "pulse"
  },
  paused: {
    label: "SYSTEM PAUSED",
    pillBackground: "#ffffff",
    badgeBackgroundColor: "#fed7aa",
    badgeTextColor: "#c2410c",
    textMain: "#ea580c",
    textSub: "#fb923c",
    borderColor: "#fed7aa",
    shadow: "sm",
    shadowColor: "#ea580c",
    iconName: "Hourglass",
    iconAnimation: "spin"
  },
  manualEnded: {
    label: "ELECTION ENDED",
    pillBackground: "#ffffff",
    badgeBackgroundColor: "#e2e8f0",
    badgeTextColor: "#334155",
    textMain: "#475569",
    textSub: "#94a3b8",
    borderColor: "#cbd5e1",
    shadow: "none",
    shadowColor: "#000000",
    iconName: "CalendarDays",
    iconAnimation: "none"
  },
  nextYear: {
    label: "SEE YOU {YEAR}",
    pillBackground: "#ffffff",
    badgeBackgroundColor: "#1e293b",
    badgeTextColor: "#ffffff",
    textMain: "#334155",
    textSub: "#94a3b8",
    borderColor: "#e2e8f0",
    shadow: "sm",
    shadowColor: "#000000",
    iconName: "CalendarDays",
    iconAnimation: "none"
  }
}
```

### TEMPLATES.neon.elements — add this entry:

```js
"hero-countdown": {
  before: {
    label: "INCOMING",
    pillBackground: "#0f172a",
    badgeBackgroundColor: "#06b6d4",
    badgeTextColor: "#ffffff",
    textMain: "#06b6d4",
    textSub: "#67e8f9",
    borderColor: "#0e7490",
    shadow: "xl",
    shadowColor: "#06b6d4",
    iconName: "Flag",
    iconAnimation: "none"
  },
  running: {
    label: "LIVE NOW",
    pillBackground: "#0f172a",
    badgeBackgroundColor: "#84cc16",
    badgeTextColor: "#ffffff",
    textMain: "#a3e635",
    textSub: "#bef264",
    borderColor: "#65a30d",
    shadow: "2xl",
    shadowColor: "#84cc16",
    iconName: "Zap",
    iconAnimation: "pulse"
  },
  paused: {
    label: "PAUSED",
    pillBackground: "#0f172a",
    badgeBackgroundColor: "#f59e0b",
    badgeTextColor: "#ffffff",
    textMain: "#fbbf24",
    textSub: "#fcd34d",
    borderColor: "#d97706",
    shadow: "xl",
    shadowColor: "#f59e0b",
    iconName: "Hourglass",
    iconAnimation: "spin"
  },
  manualEnded: {
    label: "ENDED",
    pillBackground: "#0f172a",
    badgeBackgroundColor: "#475569",
    badgeTextColor: "#cbd5e1",
    textMain: "#94a3b8",
    textSub: "#64748b",
    borderColor: "#334155",
    shadow: "md",
    shadowColor: "#000000",
    iconName: "CalendarDays",
    iconAnimation: "none"
  },
  nextYear: {
    label: "SEE YOU {YEAR}",
    pillBackground: "#0f172a",
    badgeBackgroundColor: "#a855f7",
    badgeTextColor: "#ffffff",
    textMain: "#c084fc",
    textSub: "#d8b4fe",
    borderColor: "#7e22ce",
    shadow: "xl",
    shadowColor: "#a855f7",
    iconName: "CalendarDays",
    iconAnimation: "none"
  }
}
```

## PART 4: Modify `src/components/CountdownTimer.js`

### 4a. Fix ELECTION_NEXT_YEAR pre-existing bug
Wrap the computation with `useMemo` so it doesn't recreate every render:

**Find:**
```js
const ELECTION_NEXT_YEAR = new Date(ELECTION_START);
ELECTION_NEXT_YEAR.setFullYear(ELECTION_NEXT_YEAR.getFullYear() + 1);
```

**Replace with:**
```js
const ELECTION_NEXT_YEAR = useMemo(() => {
  const d = new Date(ELECTION_START);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}, []);
```

Add `useMemo` to the React import at top:
```js
import { useState, useEffect, useMemo } from 'react';
```

### 4b. Add new props
**Find component signature:**
```js
export default function CountdownTimer({ compact = false, systemMode = "AUTO" })
```

**Replace with:**
```js
export default function CountdownTimer({ 
  compact = false, 
  systemMode = "AUTO",
  resolvedConfig = null,
  forceState = null
})
```

### 4c. Add forceState short-circuit
At the START of the existing `useEffect` that runs `calculate` + setInterval:

```js
useEffect(() => {
  // forceState mode (used in admin gallery preview) — show frozen demo values
  if (forceState) {
    setPhase(mapForceStateToPhase(forceState));
    setTimeLeft({ days: 12, hours: 4, minutes: 35, seconds: 20 });
    return; // skip setInterval
  }
  
  // ... existing setInterval logic stays unchanged
}, [ELECTION_START, ELECTION_END, ELECTION_NEXT_YEAR, systemMode, forceState]);
```

Add `forceState` to the dependency array (last item).

Add this helper function inside the file (above the component or as a const):

```js
function mapForceStateToPhase(forceState) {
  // Map state IDs from registry → internal phase values
  const map = {
    before: "BEFORE",
    running: "RUNNING",
    paused: "PAUSED",
    manualEnded: "MANUAL_ENDED",
    nextYear: "NEXT_YEAR"
  };
  return map[forceState] || "BEFORE";
}
```

### 4d. Apply resolvedConfig overrides
Find the `getConfig()` switch statement (returns the per-phase config object 
with label, badgeBg, textMain, etc.).

After `getConfig()` returns its base config, apply resolvedConfig overrides:

```js
const baseConfig = getConfig();

// If resolvedConfig is provided (from editor), override visual properties
const finalConfig = resolvedConfig ? {
  ...baseConfig,
  // Override only the editable design tokens
  label: resolvedConfig.label || baseConfig.label,
  // Translate token names to internal config shape:
  badgeBg: resolvedConfig.badgeBackgroundColor 
    ? `inline-style-bg-${resolvedConfig.badgeBackgroundColor}` 
    : baseConfig.badgeBg,
  badgeTextColor: resolvedConfig.badgeTextColor || null,
  textMain: resolvedConfig.textMain || null,
  textSub: resolvedConfig.textSub || null,
  borderColorOverride: resolvedConfig.borderColor || null,
  shadowOverride: resolvedConfig.shadow || null,
  shadowColorOverride: resolvedConfig.shadowColor || null,
  iconName: resolvedConfig.iconName || null,
  iconAnimation: resolvedConfig.iconAnimation || null,
  pillBackground: resolvedConfig.pillBackground || null
} : baseConfig;
```

This is rough — actual implementation depends on how getConfig returns config.
The key insight: when resolvedConfig exists, use INLINE STYLES on the JSX 
elements (not Tailwind classes) so any color value works.

Modify the return JSX:

```jsx
return (
  <div 
    className="inline-flex items-center gap-3 ... rounded-full border"
    style={resolvedConfig ? {
      backgroundColor: resolvedConfig.pillBackground || '#ffffff',
      borderColor: resolvedConfig.borderColor || undefined,
      boxShadow: resolvedConfig.shadow !== 'none' 
        ? `0 4px 6px -1px ${resolvedConfig.shadowColor}33` 
        : 'none'
    } : undefined}
  >
    {/* Badge */}
    <div 
      className="flex items-center gap-2 rounded-full px-3 py-1"
      style={resolvedConfig ? {
        backgroundColor: resolvedConfig.badgeBackgroundColor,
        color: resolvedConfig.badgeTextColor
      } : /* existing badge classes */ undefined}
    >
      <IconComponent className={resolvedConfig?.iconAnimation === 'pulse' ? 'animate-pulse' : resolvedConfig?.iconAnimation === 'spin' ? 'animate-spin' : ''} />
      <span>{resolvedConfig?.label?.replace('{YEAR}', String(ELECTION_YEAR_NEXT))  || existingLabel}</span>
    </div>
    
    {/* Digits */}
    <div className="flex items-baseline gap-1.5">
      <TimeUnit value={timeLeft.days} unit="d" colorMain={resolvedConfig?.textMain} colorSub={resolvedConfig?.textSub} />
      ...
    </div>
  </div>
);
```

For ELECTION_YEAR_NEXT replacement:
```js
import { ELECTION_YEAR } from '../utils/electionConfig'; // adjust path

// Compute next year string
const nextYearStr = String(parseInt(ELECTION_YEAR) + 1);

// Use in label substitution:
const displayLabel = (resolvedConfig?.label || baseConfig.label || "")
  .replace('{YEAR}', nextYearStr);
```

### 4e. Map iconName string to lucide component
Add a helper:

```js
import { Flag, Zap, Hourglass, CalendarDays, Clock } from 'lucide-react';

const ICON_MAP = {
  Flag, Zap, Hourglass, CalendarDays, Clock
};

function resolveIcon(iconName, fallback) {
  return ICON_MAP[iconName] || fallback;
}
```

When rendering:
```jsx
const IconComponent = resolvedConfig 
  ? resolveIcon(resolvedConfig.iconName, baseConfig.icon || CalendarDays)
  : baseConfig.icon;

<IconComponent className={...} />
```

### 4f. Pass through TimeUnit
TimeUnit currently has hardcoded color classes. Make it accept colorMain / 
colorSub overrides:

**Find TimeUnit definition.** Update signature to accept color overrides:

```js
function TimeUnit({ value, unit, color, colorSub, colorMainOverride, colorSubOverride }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span 
        className={`tabular-nums font-bold ${color}`}
        style={colorMainOverride ? { color: colorMainOverride } : undefined}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span 
        className={`text-xs font-medium ${colorSub}`}
        style={colorSubOverride ? { color: colorSubOverride } : undefined}
      >
        {unit}
      </span>
    </div>
  );
}
```

Where TimeUnit is called, pass overrides when resolvedConfig exists:
```jsx
<TimeUnit 
  value={timeLeft.days} 
  unit="d" 
  color={baseConfig.textMain} 
  colorSub={baseConfig.textSub}
  colorMainOverride={resolvedConfig?.textMain}
  colorSubOverride={resolvedConfig?.textSub}
/>
```

## PART 5: Modify `src/components/HomeContent.js`

### 5a. Add countdown state resolution
Near where voteCTA state/config is resolved:

```js
// Existing voteCTA resolution stays unchanged

// Add countdown resolution:
const countdownState = resolveElementState('hero-countdown', runtimeCtx);
const countdownSourceTemplate = pageLayout?.sourceTemplate || 'classic';
const countdownOverrides = pageLayout?.elementOverrides?.['hero-countdown']?.[countdownState] || {};
const countdownResolvedConfig = resolveStatefulConfig(
  countdownSourceTemplate,
  'hero-countdown',
  countdownState,
  countdownOverrides
);
```

### 5b. Pass to CountdownTimer
**Find** the CountdownTimer rendering in renderHero:
```jsx
<CountdownTimer systemMode={initialData?.systemMode || "AUTO"} />
```

**Replace with:**
```jsx
<CountdownTimer 
  systemMode={initialData?.systemMode || "AUTO"}
  resolvedConfig={countdownResolvedConfig}
/>
```

Note: do NOT pass `forceState` here — that's only used in StatefulGallery. 
Live mode auto-detects state.

## PART 6: Modify `src/components/admin/editor/StatefulGallery.js`

Extend `GalleryPreview` to handle countdown type. Find the existing function:

```js
function GalleryPreview({ elementId, stateId, resolvedConfig, type }) {
  if (elementId === 'voteCTA-button') {
    return (
      <div className="bg-slate-50 rounded-md p-4 flex items-center justify-center min-h-[80px]">
        <VoteCTABlock config={{}} data={{}} resolvedConfig={resolvedConfig} forceState={stateId} />
      </div>
    );
  }
  
  // Add new branch:
  if (elementId === 'hero-countdown') {
    return (
      <div className="bg-slate-50 rounded-md p-4 flex items-center justify-center min-h-[80px]">
        <CountdownTimer resolvedConfig={resolvedConfig} forceState={stateId} />
      </div>
    );
  }
  
  return (
    <div className="bg-slate-50 rounded-md p-4 flex items-center justify-center text-xs text-slate-400">
      Preview not yet available for {elementId}
    </div>
  );
}
```

Add import at top:
```js
import CountdownTimer from '../../CountdownTimer';
```

## DO NOT
- Do NOT modify electionConfig.js
- Do NOT modify any block component
- Do NOT modify VoteCTABlock or its forceState logic
- Do NOT change StatefulGallery's tier control (Simple/Advanced/Expert) — countdown will use the same controls
- Do NOT install packages

## VERIFICATION

1. `npm run build` passes exit 0

2. Real `/` page renders countdown identically to before (because resolvedConfig falls back to template defaults that match original Tailwind colors)

3. Admin clicks countdown in live preview → StatefulGallery opens
   - Header: "นาฬิกานับเวลา" + "มี 5 สถานะ"
   - Template switcher: [Classic] [Neon]
   - 5 state cards each showing real countdown widget with frozen demo values

4. Each card shows different style:
   - "ก่อนเริ่ม" — purple badge "STARTS IN", Flag icon
   - "กำลังเลือกตั้ง" — red badge "CLOSES IN", Zap icon pulse
   - "ระบบ PAUSE" — orange badge, Hourglass icon spin
   - "ปิดด้วย admin" — slate badge "ELECTION ENDED", CalendarDays
   - "เลยช่วงเลือกตั้ง" — dark badge "SEE YOU 2027", CalendarDays

5. Click [Neon] template → all 5 phases switch to dark pill backgrounds with neon colors

6. Edit any state's badge color → preview updates instantly

7. Save → reload → overrides persist

8. Real `/` page now uses chosen template/overrides

## REPORT FORMAT

```
Modified statefulRegistry.js — registered hero-countdown with 5 states + defaultConfig
Modified stateResolver.js — added countdown resolver + electionPhase computation in buildRuntimeContext
Modified templateEngine.js — added hero-countdown configs to classic + neon templates
Modified CountdownTimer.js — added resolvedConfig + forceState props, fixed ELECTION_NEXT_YEAR memo bug, dynamic SEE YOU year, ICON_MAP for icon resolution, inline style overrides
Modified HomeContent.js — resolve countdown state + config, pass resolvedConfig to CountdownTimer
Modified StatefulGallery.js — added countdown branch in GalleryPreview using real CountdownTimer with forceState
Build: PASS
```

No other commentary.
