# LIVE_STEP_HCON_BIND.md — Bind Election Data Fields to GlobalConfig

## READ FIRST
Read `CLAUDE.md`, `LIVE_EDITOR_ARCHITECTURE.md`, `MASTER_PLAN.md`, and 
`DECISIONS.md`. Follow strictly.

## CONTEXT
H-CON migrated hardcoded strings → globalConfig defaults. But element editor 
still saves text as override → admin who edited "SAMO 50" via element editor 
sees stale value because override wins over globalConfig fallback.

This step makes select elements **bound** to globalConfig — admin can edit 
text in EITHER place (Element editor OR ตั้งค่าทั่วไป), both paths write 
to the same globalConfig field, both surfaces show synced value.

Design tokens (color, radius, shadow, etc.) remain element overrides.

## SCOPE (DO NOT EXCEED)
Modify exactly 5 files:

1. `src/components/admin/editor/elementRegistry.js` — add `boundTo` field
2. `src/components/admin/editor/PropertyPanel.js` — bind text input to globalConfig for bound elements
3. `src/components/HomeContent.js` — read text from globalConfig for bound elements (not from override)
4. `src/contexts/GlobalConfigContext.js` — add update API + push to backend
5. `src/components/admin/GlobalConfigTab.js` — coordinate save (used as reference)

Do NOT modify:
- statefulRegistry.js / templateEngine.js (state-aware system unchanged)
- editorRegistry/Catalog (just add field, don't restructure)
- API route /api/admin/global-config (already exists)
- VoteCTABlock / Countdown / other stateful components

Do NOT install packages.

## BINDING DESIGN

### Field-level bindings

```js
// In elementRegistry.js — add `boundTo` field per element

ELEMENT_PRESETS = {
  // BOUND — election data (admin edits sync everywhere)
  "hero-title": {
    boundTo: "electionName",
    /* existing presets stay */
  },
  "hero-subtitle": {
    boundTo: "campaignTitle",
  },
  "hero-subtitle2": {
    boundTo: "organizationName",
  },
  "hero-year-badge": {
    boundTo: "academicYearTh",  // atomic — component adds prefix
  },
  
  // NOT BOUND — generic text (admin override OK)
  "voteCTA-button": {
    boundTo: null,  // state-aware text per state, not bound
  },
  "meet-cta": {
    boundTo: null,
  },
  "stats-header": {
    boundTo: null,
  },
  // etc.
}
```

### Render rules

When component renders an element:
- If element has `boundTo` → text comes from `globalConfig[boundTo]`
  - Override on `text` field is IGNORED for bound elements
  - Design tokens (color, radius) still apply
- If `boundTo === null` → text comes from override or default (current behavior)

### Edit rules

In PropertyPanel:
- If element has `boundTo` → text input is bound to globalConfig
  - Reading: `value = globalConfig[boundTo]`
  - Writing: PUT to `/api/admin/global-config` (not page-layout)
  - Show hint: "🔗 ข้อความนี้ใช้ทั่วเว็บ"
- If `boundTo === null` → text input writes to elementOverride.text (current behavior)

Design tokens (color, radius, etc.) ALWAYS write to elementOverride regardless 
of `boundTo`.

## PART 1: Modify `elementRegistry.js`

Add `boundTo` field to specific elements.

**Find each entry, add:**

```js
"hero-title": {
  // existing fields
  type: "text",
  section: "hero",
  presets: [/* unchanged */],
  
  boundTo: "electionName",  // NEW
}

"hero-subtitle": {
  // existing
  boundTo: "campaignTitle",  // NEW
}

"hero-subtitle2": {
  // existing  
  boundTo: "organizationName",  // NEW
}

"hero-year-badge": {
  // existing
  boundTo: "academicYearTh",  // NEW (numeric — component adds prefix)
}
```

For all other elements (voteCTA-button, meet-cta, etc.), add:
```js
boundTo: null,  // explicit
```

Add helper export at the bottom:
```js
export function getBinding(elementId) {
  const element = ELEMENT_PRESETS[elementId];
  return element?.boundTo || null;
}

export function isBoundElement(elementId) {
  return getBinding(elementId) !== null;
}
```

## PART 2: Update `GlobalConfigContext.js`

Add an update function so other components can write to globalConfig 
without going through GlobalConfigTab.

**Replace the existing context implementation with:**

```jsx
"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import { GLOBAL_CONFIG_DEFAULTS, mergeWithDefaults } from '../utils/globalConfigDefaults';
import { getEncryptedToken } from '@/utils/auth'; // adjust path to actual

const GlobalConfigContext = createContext({
  config: GLOBAL_CONFIG_DEFAULTS,
  updateField: () => {},
  isUpdating: false
});

export function GlobalConfigProvider({ value: initialValue, children }) {
  const [config, setConfig] = useState(() => mergeWithDefaults(initialValue));
  const [isUpdating, setIsUpdating] = useState(false);

  const updateField = useCallback(async (fieldKey, newValue) => {
    // Optimistic update
    const newConfig = { ...config, [fieldKey]: newValue };
    setConfig(newConfig);
    setIsUpdating(true);

    try {
      const token = getEncryptedToken(); // mirror admin token pattern
      const res = await fetch('/api/admin/global-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ globalConfig: newConfig })
      });
      
      if (!res.ok) {
        // Rollback on failure
        setConfig(config);
        console.error('Failed to update globalConfig field:', fieldKey);
      }
    } catch (e) {
      setConfig(config);
      console.error('Error updating globalConfig:', e);
    } finally {
      setIsUpdating(false);
    }
  }, [config]);

  return (
    <GlobalConfigContext.Provider value={{ config, updateField, isUpdating }}>
      {children}
    </GlobalConfigContext.Provider>
  );
}

// Backward-compatible — components reading config get the merged values
export function useGlobalConfig() {
  const ctx = useContext(GlobalConfigContext);
  return ctx.config;
}

// New — components that need to update config (admin only)
export function useGlobalConfigUpdate() {
  const ctx = useContext(GlobalConfigContext);
  return {
    updateField: ctx.updateField,
    isUpdating: ctx.isUpdating
  };
}
```

CRITICAL: Match the existing `getEncryptedToken` import path used by 
GlobalConfigTab.js. If the function is named differently, mirror that.

## PART 3: Update `PropertyPanel.js`

When admin selects a bound element, the text input must read/write 
globalConfig instead of elementOverride.

**Add imports:**
```js
import { useGlobalConfig, useGlobalConfigUpdate } from '@/contexts/GlobalConfigContext';
import { getBinding, isBoundElement } from './elementRegistry'; // adjust path
```

**In the component, get config + update API:**
```jsx
const globalConfig = useGlobalConfig();
const { updateField, isUpdating } = useGlobalConfigUpdate();
```

**Find the text input rendering for static elements** (look for where 
"ข้อความ" / "Text" input is rendered):

```jsx
// BEFORE
<TextInput
  label="ข้อความ"
  value={config.text || ''}
  onChange={(v) => onUpdateConfig(selectedElement, 'text', v)}
/>
```

**Replace with conditional:**

```jsx
{(() => {
  const binding = getBinding(selectedElement);
  
  if (binding) {
    // Bound element — read/write globalConfig
    return (
      <div className="space-y-2">
        <TextInput
          label="ข้อความ"
          value={String(globalConfig[binding] || '')}
          onChange={(v) => {
            // For numeric fields like academicYearTh, parse
            const numFields = ['electionNumber', 'academicYearTh', 'electionCalendarYear', 'copyrightYear'];
            const finalValue = numFields.includes(binding) ? Number(v) || v : v;
            updateField(binding, finalValue);
          }}
          disabled={isUpdating}
        />
        <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-xs">🔗</span>
          <p className="text-[10px] text-blue-700 leading-tight">
            ข้อความนี้ใช้ทั่วเว็บ — แก้ที่นี่หรือใน "ตั้งค่าทั่วไป" ก็ sync เหมือนกัน
          </p>
        </div>
      </div>
    );
  }
  
  // Non-bound — current override behavior
  return (
    <TextInput
      label="ข้อความ"
      value={config.text || ''}
      onChange={(v) => onUpdateConfig(selectedElement, 'text', v)}
    />
  );
})()}
```

Other inputs (color, radius, shadow, etc.) remain unchanged — they always 
write to elementOverride.

## PART 4: Update `HomeContent.js`

For bound elements, read text from globalConfig (not from override or default).

**Find the `getText()` calls in renderHero** (around line 205-274):

```js
// BEFORE
const heroTitle = getText('hero-title', editorData?.title || globalConfig.electionName);
const heroSubtitle = getText('hero-subtitle', /* ... */ globalConfig.campaignTitle);
const heroSubtitle2 = getText('hero-subtitle2', /* ... */ globalConfig.organizationName);
const heroYearBadge = getText('hero-year-badge', /* ... */ `ประจำปีการศึกษา ${globalConfig.academicYearTh}`);
```

**Replace with bound-aware reading:**

```js
import { getBinding, isBoundElement } from './admin/editor/elementRegistry';

// Helper that respects boundTo
function getElementText(elementId, fallback, globalConfig, getTextFn) {
  const binding = getBinding(elementId);
  if (binding) {
    return globalConfig[binding] ?? fallback;
  }
  return getTextFn(elementId, fallback);
}

// Use:
const heroTitle = getElementText('hero-title', globalConfig.electionName, globalConfig, getText);
const heroSubtitle = getElementText('hero-subtitle', globalConfig.campaignTitle, globalConfig, getText);
const heroSubtitle2 = getElementText('hero-subtitle2', globalConfig.organizationName, globalConfig, getText);

// Year badge — special: globalConfig has atomic year, component adds prefix
const heroYearValue = isBoundElement('hero-year-badge') 
  ? globalConfig.academicYearTh 
  : getText('hero-year-badge', null);
const heroYearBadge = `ประจำปีการศึกษา ${heroYearValue}`;
```

For the **split rendering** of "SAMO" + "49" (gradient on number):

```jsx
// If hero-title is bound — split using globalConfig.electionNamePrefix + electionNumber
// If admin overrode (non-bound mode), show single text

const isHeroTitleBound = isBoundElement('hero-title');

return isHeroTitleBound ? (
  <h1>
    <span>{globalConfig.electionNamePrefix}</span>
    <span className="gradient">{globalConfig.electionNumber}</span>
  </h1>
) : (
  <h1>{heroTitle}</h1>
);
```

NOTE: Admin editing "hero-title" via element editor writes to `electionName` 
(full string like "SAMO 50") via boundTo. The split into `electionNamePrefix` + 
`electionNumber` is read-only — admin shouldn't have to edit those separately. 
Update the rendering to use `electionName` whole instead, OR auto-derive prefix/
number from electionName for split:

```jsx
// Auto-split electionName into prefix + number
function splitElectionName(name) {
  const match = name.match(/^(.+?)\s*(\d+)$/);
  if (match) return { prefix: match[1], number: match[2] };
  return { prefix: name, number: '' };
}

const { prefix, number } = splitElectionName(globalConfig.electionName);

return (
  <h1>
    <span>{prefix}</span>
    {number && <span className="gradient">{number}</span>}
  </h1>
);
```

This way admin edits ONLY `electionName` field ("SAMO 50") and split is 
automatic. Cleaner UX.

## PART 5: Reference — `GlobalConfigTab.js` (no changes)

GlobalConfigTab still works as-is — it edits the same fields. Both surfaces 
write to the same backend. The Context layer ensures local state syncs.

If admin opens element editor + edits "hero-title" → globalConfig updates → 
reflected in GlobalConfigTab on next render (via Context).

If admin opens GlobalConfigTab + edits "electionName" → updateField fires → 
Context state updates → all consumers (HomeContent, ResultsEditorPreview, 
SiteFooter, etc.) re-render with new value.

## DO NOT
- Do NOT bind voteCTA-button or any stateful element
- Do NOT bind countdown labels (they're state-aware, not election data)
- Do NOT modify state-aware elements (statefulRegistry/templateEngine paths)
- Do NOT change API route logic
- Do NOT remove getText() — non-bound elements still use it

## VERIFICATION

After all 5 files:

1. `npm run build` passes exit 0

2. **Test bidirectional sync:**
   - Open admin → "ตั้งค่าทั่วไป"
   - Change electionName = "SAMO 99"
   - Save
   - Open `/` → Hero shows "SAMO 99" (split into "SAMO" + "99")
   - Open admin → "ออกแบบหน้าเว็บ" → click hero-title
   - Text input shows "SAMO 99" + 🔗 hint
   - Change to "TEST 50" in element editor
   - Open `/results` → "ผลการเลือกตั้ง TEST 50"
   - Open admin → "ตั้งค่าทั่วไป" → field shows "TEST 50" (synced!)

3. **Test design still works:**
   - On hero-title element, change text color → only color changes
   - Text content stays from globalConfig
   - Non-bound elements (voteCTA, meet-cta) text editing works as before

4. **Test fallback:**
   - Set hero-subtitle in element editor → globalConfig.campaignTitle updates
   - Reset → both surfaces revert to default

5. **Test no regression:**
   - voteCTA button text editable per state (not bound)
   - Countdown labels editable per state (not bound)
   - Footer auto-shows latest copyrightYear (already from H-CON)

## REPORT FORMAT

```
Modified src/components/admin/editor/elementRegistry.js — added boundTo field to 4 hero elements (hero-title→electionName, hero-subtitle→campaignTitle, hero-subtitle2→organizationName, hero-year-badge→academicYearTh) and explicit null for non-bound; added getBinding/isBoundElement helpers
Modified src/contexts/GlobalConfigContext.js — added updateField API + isUpdating state, exported useGlobalConfigUpdate hook, optimistic update with rollback on error
Modified src/components/admin/editor/PropertyPanel.js — bound elements read/write globalConfig via updateField; show 🔗 hint; non-bound use override path; design tokens always override
Modified src/components/HomeContent.js — getElementText() respects boundTo; hero-title auto-splits electionName into prefix+number; year-badge composes prefix + atomic value
Build: PASS
```

No other commentary.
