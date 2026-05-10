# LIVE_STEP_H_SYNC_FIX.md — Complete H-CON-BIND + Harden Context

## READ FIRST
Read `CLAUDE.md`, `MASTER_PLAN.md`, `DECISIONS.md`. Follow strictly.

## CONTEXT

Diagnosis (DIAGNOSE_STATE_SYNC.md) confirmed:

1. **H-CON-BIND was reported complete but PropertyPanel was never modified.** 
   PropertyPanel does not import `useGlobalConfigUpdate` or `getBinding`. 
   Bound element text edits write to `elementConfigs` (override store), but 
   HomeContent's `getText()` reads from `globalConfig[binding]` for bound 
   elements, ignoring the override entirely. **Result: admin types text in 
   element editor → preview frozen.**

2. **GlobalConfigContext has hardening gaps** (recommendations #2-#4 from 
   diagnosis): provider value re-created every render, useEffect overwrites 
   user edits on parent re-render, updateField rollback can stomp later 
   success.

This step:
- Completes the missing PropertyPanel binding wiring (PRIMARY FIX)
- Hardens GlobalConfigContext against race conditions and unwanted overwrites

## SCOPE (DO NOT EXCEED)
Modify exactly 2 files:

1. `src/components/admin/editor/PropertyPanel.js` — add binding logic for text input
2. `src/contexts/GlobalConfigContext.js` — fix recommendations #2, #3, #4

Do NOT modify:
- HomeContent.js (read path is correct)
- elementRegistry.js (boundTo metadata is correct)
- API routes
- Any other file

Do NOT install packages.

---

## PART 1: PropertyPanel.js — Add Binding for Text Edits

### 1.1 Add imports
At the top of the file:
```js
import { useGlobalConfig, useGlobalConfigUpdate } from '@/contexts/GlobalConfigContext';
import { getBinding, isBoundElement } from './elementRegistry'; // adjust path if different
```

If the path alias `@/` isn't set up in this project, use relative path 
based on existing imports. Check existing `import` statements for pattern.

### 1.2 Get config + update API in component body
Inside the PropertyPanel component, near other hooks (top of body, after 
existing useState/useCallback if any):

```jsx
const globalConfig = useGlobalConfig();
const { updateField, isUpdating } = useGlobalConfigUpdate();
```

CRITICAL: hooks must be called UNCONDITIONALLY. If component has early 
returns, ensure these hooks are called BEFORE any return.

### 1.3 Identify the text input rendering location

Find where the "ข้อความ" or "Text" input is rendered. Look for:
- `TextInput` from `./controls/SharedInputs`
- with label "ข้อความ" or similar
- with `value={config.text}` or similar
- with `onChange` calling `onUpdateConfig`

Original (around line 185 per diagnosis):
```jsx
<TextInput
  label="ข้อความ"
  value={config.text || ''}
  onChange={(v) => onUpdateConfig(selectedElement, 'text', v)}
/>
```

### 1.4 Wrap with binding-aware logic

Replace the original text input rendering with:

```jsx
{(() => {
  const binding = getBinding(selectedElement);
  
  if (binding) {
    // BOUND — text reads/writes globalConfig
    const currentValue = globalConfig[binding] ?? '';
    
    return (
      <div className="space-y-2">
        <TextInput
          label="ข้อความ"
          value={String(currentValue)}
          onChange={(v) => {
            // Coerce numeric fields back to number
            const numericFields = ['electionNumber', 'academicYearTh', 'electionCalendarYear', 'copyrightYear'];
            const finalValue = numericFields.includes(binding) 
              ? (Number(v) || v) 
              : v;
            updateField(binding, finalValue);
          }}
          disabled={isUpdating}
        />
        <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-xs">🔗</span>
          <p className="text-[10px] text-blue-700 leading-tight">
            ข้อความนี้ใช้ทั่วเว็บ (field: <code className="text-blue-900 font-mono">{binding}</code>) — 
            แก้ที่นี่หรือใน "ตั้งค่าทั่วไป" ก็ sync เหมือนกัน
          </p>
        </div>
      </div>
    );
  }
  
  // NON-BOUND — current override behavior (unchanged)
  return (
    <TextInput
      label="ข้อความ"
      value={config.text || ''}
      onChange={(v) => onUpdateConfig(selectedElement, 'text', v)}
    />
  );
})()}
```

### 1.5 Verify other inputs are NOT modified

ColorPicker, RadiusSelector, FontWeight, etc. — all keep their existing 
`onChange={(v) => onUpdateConfig(selectedElement, 'X', v)}` behavior. They 
write to elementOverride. This is correct — design tokens are per-element, 
not bound to globalConfig.

### 1.6 Edge case: hero-year-badge

`hero-year-badge` is bound to `academicYearTh` (numeric). The current 
displayed value in the editor should be the numeric year (e.g., 2569), 
NOT "ประจำปีการศึกษา 2569".

The component (HeroBlock or similar) handles the prefix in render. The 
admin edits ONLY the number.

This is automatically correct because `globalConfig.academicYearTh = 2569` 
is what the input shows — no extra logic needed.

---

## PART 2: GlobalConfigContext.js — Hardening

### 2.1 Memoize the provider value (Recommendation #3)

Find the GlobalConfigProvider's return statement around line 68. Currently:
```jsx
return (
  <GlobalConfigContext.Provider value={{ config, updateField, replaceConfig, isUpdating }}>
    {children}
  </GlobalConfigContext.Provider>
);
```

The object literal `{...}` creates a new reference on every render, causing 
all 12+ consumers to re-render whenever `isUpdating` toggles, even if their 
read data didn't change.

**Replace with:**
```jsx
const contextValue = useMemo(
  () => ({ config, updateField, replaceConfig, isUpdating }),
  [config, updateField, replaceConfig, isUpdating]
);

return (
  <GlobalConfigContext.Provider value={contextValue}>
    {children}
  </GlobalConfigContext.Provider>
);
```

Add `useMemo` to the React imports if not already there.

### 2.2 Guard the useEffect that resets config (Recommendation #4)

Find this useEffect (around line 24-26):
```js
useEffect(() => {
  setConfig(mergeWithDefaults(initialValue));
}, [initialValue]);
```

Problem: when parent (Providers.js / layout.js) re-renders with a new 
`initialValue` reference (even if content is the same), this wipes any 
pending optimistic updates.

**Replace with:**
```jsx
const isFirstRunRef = useRef(true);

useEffect(() => {
  // Skip the initial run — config was already set in useState initializer.
  // Only re-sync if initialValue actually CHANGED in content.
  if (isFirstRunRef.current) {
    isFirstRunRef.current = false;
    return;
  }
  
  // Compare by value, not reference
  const newConfig = mergeWithDefaults(initialValue);
  setConfig((prev) => {
    // If new config is identical to current, don't trigger re-render
    if (JSON.stringify(prev) === JSON.stringify(newConfig)) {
      return prev;
    }
    return newConfig;
  });
}, [initialValue]);
```

Add `useRef` to imports if not already there.

### 2.3 Sequence-safe rollback in updateField (Recommendation #2)

Find updateField around line 35-65. The current pattern captures `previous` 
at call time and rolls back to it on error — but this can stomp later 
successful updates.

**Replace updateField implementation with:**
```jsx
const updateSequenceRef = useRef(0);

const updateField = useCallback(async (fieldKey, newValue) => {
  // Sequence number for this update
  const mySeq = ++updateSequenceRef.current;
  
  // Optimistic update
  setConfig((prev) => ({ ...prev, [fieldKey]: newValue }));
  setIsUpdating(true);
  
  try {
    // Build full config with this field updated
    let nextConfig;
    setConfig((prev) => {
      nextConfig = { ...prev, [fieldKey]: newValue };
      return nextConfig;
    });
    
    const token = getEncryptedToken();
    const res = await fetch(getPath('/api/admin/global-config'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ globalConfig: nextConfig }),
    });
    
    if (!res.ok) {
      // Only roll back if this is still the LATEST update.
      // If a newer update has fired, leave its optimistic state alone.
      if (mySeq === updateSequenceRef.current) {
        console.error('updateField failed, rolling back:', fieldKey);
        setConfig((prev) => ({ ...prev, [fieldKey]: undefined }));
        // Note: this rollback removes only the failed field; other concurrent
        // optimistic updates remain.
      } else {
        console.warn('updateField failed but newer update exists, skipping rollback:', fieldKey);
      }
    }
  } catch (e) {
    console.error('updateField error:', e);
    if (mySeq === updateSequenceRef.current) {
      setConfig((prev) => ({ ...prev, [fieldKey]: undefined }));
    }
  } finally {
    // Only clear isUpdating if this was the latest update
    if (mySeq === updateSequenceRef.current) {
      setIsUpdating(false);
    }
  }
}, []);
```

Note: the rollback now removes the failed field rather than reverting whole 
config to `previous`. This is safer because it doesn't stomp other concurrent 
successful updates.

If you want a stronger fix, replace the `undefined` set with a re-fetch of 
truth from server. But for now, simple field-level removal is acceptable.

---

## DO NOT
- Do NOT change `HomeContent.getText()` (read path is correct)
- Do NOT modify elementRegistry.js boundTo definitions
- Do NOT touch the API route
- Do NOT install packages
- Do NOT add new dependencies (lodash, etc.)
- Do NOT refactor unrelated code

## VERIFICATION

After implementation:

1. `npm run build` passes exit 0

2. **Primary symptom fix — bound text edit:**
   - Open admin → ออกแบบหน้าเว็บ → home → click hero-title
   - Text input shows current `electionName` (e.g., "SAMO 49")
   - 🔗 hint visible: "ข้อความนี้ใช้ทั่วเว็บ (field: electionName)"
   - Type "TEST_99" → preview hero updates LIVE
   - Open `/results` (real page) → "ผลการเลือกตั้ง TEST_99"
   - Open admin "ตั้งค่าทั่วไป" → field shows "TEST_99" (synced!)

3. **Reverse direction:**
   - In ตั้งค่าทั่วไป, change electionName = "REVERSED"
   - Save
   - Without refresh, switch to ออกแบบหน้าเว็บ → home → click hero-title
   - Text input shows "REVERSED" (synced!)

4. **Numeric field:**
   - Click hero-year-badge in editor
   - Input shows numeric year (e.g., 2569)
   - Type 2570 → real `/` page hero shows "ประจำปีการศึกษา 2570"

5. **Rapid typing test:**
   - Type "ABCDEFGHIJ" rapidly in hero-title input
   - All chars should appear in preview
   - No frozen state
   - No skipped chars
   - Network tab shows 1 PUT per char (this is OK — recommendation #2 prevents 
     race issues, but a future optimization could add debounce)

6. **Design tokens still work:**
   - On hero-title, change textColor → preview updates
   - Save → both color override AND text persist correctly

7. **Non-bound elements unchanged:**
   - Click voteCTA-button → no 🔗 hint
   - Edit text in voteCTA-button (per state in Gallery) → preview updates
   - State-aware behavior preserved

8. **Provider memoization (manual check):**
   - Open React DevTools → Profiler
   - Make a single edit to hero-title text
   - Confirm: HomeContent re-renders (expected), but unrelated components 
     (e.g., Sidebar) do NOT re-render unnecessarily

## REPORT FORMAT

```
Modified src/components/admin/editor/PropertyPanel.js — added imports for useGlobalConfig + useGlobalConfigUpdate + getBinding/isBoundElement; wrapped text input with binding detection — bound elements (hero-title/subtitle/subtitle2/year-badge) read+write globalConfig via updateField with 🔗 hint and field name display; numeric fields coerced; non-bound text inputs unchanged; design tokens unchanged
Modified src/contexts/GlobalConfigContext.js — memoized provider value with useMemo; guarded initial-value useEffect with isFirstRunRef + JSON content compare to prevent stomping pending edits; replaced updateField rollback with sequence-number-aware field-level removal to avoid race conditions on concurrent updates
Build: PASS
```

No other commentary.
