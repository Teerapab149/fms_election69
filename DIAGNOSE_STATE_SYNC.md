# DIAGNOSE_STATE_SYNC.md — Admin Editor State Update Issues

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify any file. Just read and report findings.

## CONTEXT
User reports state-update issues in admin editor:
- "Toggle/edit ค่า rapid → Live Preview ค้าง / ไม่ update ทันที"
- Symptom intermittent, not always reproducible
- Happens when admin clicks/edits multiple things quickly

Possible causes (need to verify):
1. Optimistic update race conditions (H-CON-BIND added optimistic updates)
2. Multiple state stores not synchronizing (useEditorState + GlobalConfigContext + localStorage)
3. Debounce / batching delays
4. Re-render not triggered when props change
5. Stale closures in hooks

This diagnosis maps EXACTLY where state lives, how it propagates, and where 
race conditions could occur.

## INVESTIGATION

### Section 1: All state sources

For each state store/hook, report:

#### 1A: `useEditorState` (src/components/admin/editor/useEditorState.js)
- All `useState` declarations (list each one)
- All `useCallback` handlers (what they update)
- What triggers re-render of consumer components
- Is there `setHasUnsavedChanges` called? When?
- Are setters wrapped in any debounce/throttle?

#### 1B: `GlobalConfigContext` (src/contexts/GlobalConfigContext.js after H-CON-BIND)
- The `updateField` function — show full implementation
- Does it use optimistic update? With rollback?
- Is there a queue for concurrent updates?
- What happens if updateField called 3 times in 100ms?

#### 1C: `useGlobalConfig()` reads
- All components that call `useGlobalConfig()` — list 5-10 main consumers
- Do they re-render on context change automatically?

#### 1D: localStorage draft
- Where is `preview_draft` written/read?
- Frequency of write (every keystroke? on save?)
- Sync timing with Context state

### Section 2: Update flow trace

For a single user action — "admin edits hero-title text in element editor":

Trace the full path with line numbers + code snippets:

```
User types "x" in TextInput
  → onChange handler fires
    → ??? (which function?)
      → state update at ???
        → re-render of ???
          → preview reflects change at ???
```

Same trace for: "admin clicks template switcher"

Same trace for: "admin toggles section visibility"

Identify which path has fewest steps (fast) vs most steps (slow).

### Section 3: Race conditions audit

Look for these specific patterns:

#### 3A: Optimistic update without abort
```js
// Anti-pattern
const [state, setState] = useState();
const update = async (val) => {
  setState(val);  // optimistic
  await fetch(...);  // if 2nd update fires before this resolves → race
};
```

Find places using this pattern. Specifically check `updateField` in 
GlobalConfigContext after H-CON-BIND.

#### 3B: useState dependency on stale value
```js
// Anti-pattern
const update = useCallback((val) => {
  if (state.x === oldValue) {  // stale!
    setState(/* ... */);
  }
}, []);  // missing state in deps
```

Find places where useCallback handlers have empty deps array but read 
state inside.

#### 3C: Multiple setState in different stores
If updating field "electionName" requires:
- setState in GlobalConfigContext (immediate)
- POST to backend (delayed)
- localStorage update (?)

Are these synchronized? Or could they end up in different states?

### Section 4: Re-render triggers

For Live Preview component, report:
- What props does it receive?
- What's in its dependency arrays for useEffect/useMemo/useCallback?
- Could a parent re-render NOT trigger preview update due to memoization?
- Is there `React.memo` or `useMemo` that might skip re-render?

### Section 5: Network call patterns

For all admin actions that hit `/api/admin/*`:
- Is there debounce? Throttle?
- Is there abort controller for in-flight requests?
- What happens when user clicks Save 3 times rapidly?
- Any rate limiting?

### Section 6: Specific paths to verify

After H-CON-BIND, specifically check:

#### 6A: PropertyPanel bound element edit
When admin edits `hero-title` text (bound element):
1. TextInput onChange fires with new value
2. Calls `updateField(binding, finalValue)` from useGlobalConfigUpdate
3. updateField does optimistic setState → fetch → rollback if fail
4. Context re-renders consumers
5. HomeContent's preview re-renders with new globalConfig

Where could this break?
- TextInput re-renders during typing → cursor jumps?
- Multiple onChange in 50ms → multiple optimistic updates?
- fetch resolves out-of-order → final state stale?
- HomeContent uses globalConfig but also `getText()` — which wins on render?

Report any logic gaps.

#### 6B: Element override edit
When admin edits hero-title COLOR (non-bound design token):
1. ColorPicker onChange fires
2. Calls `onUpdateConfig(elementId, 'textColor', value)`
3. updateElementConfig in useEditorState updates local state
4. setHasUnsavedChanges(true)
5. Live preview re-renders

Where could this break?
- updateElementConfig might use stale closure
- localStorage write could be slow
- preview's useMemo deps might miss the change

#### 6C: Template switch
When admin clicks "Apply Neon template":
1. applyGlobalTemplate('neon') in useEditorState
2. setSourceTemplate + setElementOverrides({})
3. setHasUnsavedChanges(true)
4. Preview re-renders with new template

Where could this break?
- React 18 batching — multiple setState in single tick? (usually fine, but check)
- elementOverrides cleared mid-render of cached components?

### Section 7: Console error / warning audit

Look at PageDesignTab.js and key files for:
- console.error / console.warn statements
- React strict mode warnings (effects firing twice)
- Any try/catch that silently swallows errors

### Section 8: Symptom mapping

User mentioned "ค้าง" — match this to one of:

- **ค้าง = ไม่ update ตลอด** → state path broken, not race
- **ค้าง = update ช้า (>500ms)** → debounce too long or fetch slow
- **ค้าง = update บางครั้ง** → race condition, intermittent
- **ค้าง = preview frozen but list updated** → preview re-render not triggered
- **ค้าง = list frozen but preview updated** → list memoization issue

Based on the code, predict which symptom is most likely. Cross-reference 
the architecture against the symptom.

## OUTPUT FORMAT

```
=== Section 1: State Sources ===
1A. useEditorState — N states, M handlers, [list]
1B. GlobalConfigContext — updateField implementation: [code]
1C. useGlobalConfig consumers — [list]
1D. localStorage — [pattern]

=== Section 2: Update Flow Traces ===
Path A (text edit): User → ... → preview (N steps)
Path B (template switch): ...
Path C (visibility toggle): ...

=== Section 3: Race Conditions Found ===
3A. [List specific files/lines with anti-patterns]
3B. ...
3C. ...

=== Section 4: Re-render Analysis ===
Live Preview deps: [...]
Memoization concerns: [...]

=== Section 5: Network Calls ===
Debounce: yes/no, where
Concurrent handling: [...]

=== Section 6: Specific Path Audit ===
6A. PropertyPanel bound edit: [findings]
6B. Element override edit: [findings]  
6C. Template switch: [findings]

=== Section 7: Errors/Warnings ===
[List]

=== Section 8: Most Likely Root Cause ===
Hypothesis: [A/B/C]
Specific code lines responsible: [list]
Why this matches user's "intermittent" symptom: [reasoning]

=== Recommendations ===
For each issue:
- Severity (high/med/low)
- Fix approach (1-2 sentences)
- Where to fix (file + approximate line)
```

## DO NOT
- DO NOT modify any file
- DO NOT install anything  
- DO NOT write fix code
- ONLY read, trace, and report

Return your full diagnosis.
