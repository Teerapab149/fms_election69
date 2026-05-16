# DIAGNOSE_H6_COUNTDOWN.md — Countdown Timer for State-Aware Conversion

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify any file. DO NOT write code. Only read and report.

## CONTEXT
We are converting CountdownTimer to be state-aware (using the same pattern as 
voteCTA-button). Need full understanding of:
- Current implementation (states, design, real-time logic)
- What's editable vs what should stay locked
- Dependencies that need handling in editor mode

## FILES TO READ

1. `src/components/CountdownTimer.js`
2. `src/utils/electionConfig.js` (referenced by countdown for dates)
3. `src/components/HomeContent.js` (where countdown is used inside renderHero)
4. `src/components/admin/editor/statefulRegistry.js` (current pattern reference)
5. `src/components/admin/editor/templateEngine.js` (TEMPLATES.classic structure to follow)

## REPORT IN THIS EXACT STRUCTURE

---

### Section 1: Component signature

```js
export default function CountdownTimer({ ... })
```
List all props with defaults.

---

### Section 2: All visual states

For each phase the component renders:

| Phase ID (proposed) | Trigger condition | Visual description |
|-------|------------------|--------|
| `loading` | data not yet fetched | ... |
| `before` | systemMode AUTO + now < startDate | ... |
| `running` | AUTO + startDate ≤ now ≤ endDate | ... |
| `paused` | systemMode === "PAUSE" | ... |
| `manualEnded` | systemMode === "ENDED" | ... |
| `nextYear` | AUTO + now > endDate | ... |

For each phase report:
- Background color / gradient
- Text color
- Icon used (lucide-react import name)
- Animation (pulse / spin / etc.)
- Text labels (Thai + English)
- Border radius / shadow

---

### Section 3: Real-time logic

- Where is `setInterval` declared? Line number?
- How often does it tick? (every 1s? 60s?)
- What state values update on tick? (timeLeft, currentPhase, etc.)
- What happens when component unmounts? (cleanup logic)
- Does the tick logic depend on props that change? (systemMode could change mid-session)

---

### Section 4: Configuration source

- Where do `startDate` and `endDate` come from?
  - From props?
  - From `ELECTION_CONFIG` import?
  - From API fetch?
- What format are they? (ISO string / Date / timestamp)
- Can these be overridden by element config, or are they system-level (locked)?

---

### Section 5: Editable vs locked properties

For each phase, classify each property as:

- **DESIGN-EDITABLE** (admin can change): backgroundColor, textColor, fontSize, etc.
- **TEXT-EDITABLE** (admin can change wording per state): "เริ่มในอีก", "เหลือเวลา", "หมดเวลา"
- **LOGIC-LOCKED** (must stay hardcoded): which phase to show based on systemMode + dates
- **DATA-LOCKED**: actual countdown numbers (timeLeft) come from real-time computation

Report for each phase: which fields are which.

---

### Section 6: Editor mode handling

- Does CountdownTimer work when run in editor mode currently? (any errors?)
- What does it show in editor mode without modification? (probably still ticks based on ELECTION_CONFIG dates)
- Is there a way to "freeze" the countdown in admin preview so admin can see each phase rendered without waiting?

Suggested: a `forceState` prop similar to VoteCTABlock would let admin gallery 
render each phase explicitly. Diagnose if this is feasible — look for the 
state derivation block and whether it can be short-circuited cleanly.

---

### Section 7: Existing usage in HomeContent

- Where is `<CountdownTimer />` rendered? (renderHero — line number)
- What props are passed?
- Is it inside a Wrap currently? (`hero-countdown` element ID)

---

### Section 8: Static text strings (for editable text per state)

List EVERY hardcoded Thai/English string in the component:

| String (Thai/English) | Phase | Location |
|---|---|---|
| "เริ่มในอีก" | before | line N |
| ... | | |

These would become editable text per state in the gallery.

---

### Section 9: Design tokens needed for templates

Based on the 6 phases, what config properties does each phase need to be 
fully designable? Suggested fields (similar to voteCTA):

- text (per state, locked or editable?)
- backgroundType (solid/gradient)
- backgroundColor / gradientFrom / gradientTo / gradientDirection
- textColor
- borderRadius
- borderColor / borderWidth
- shadow / shadowColor
- iconName (which icons does the timer use? Calendar / Clock / Pause / etc.)
- animation (pulse / spin / none)

Report the actual defaults (current Tailwind classes) for each phase so we 
can replicate them as Classic preset values.

---

### Section 10: Other elements rendered alongside countdown

Does CountdownTimer render any sub-elements (like a separate label, a row of 
mini badges for D/H/M/S, a progress bar)? List them — they may need 
sub-element IDs in the registry.

---

## DO NOT
- DO NOT modify any file
- DO NOT suggest fixes / changes / refactors
- DO NOT install anything
- ONLY read and report

Return your full diagnosis report in markdown.
