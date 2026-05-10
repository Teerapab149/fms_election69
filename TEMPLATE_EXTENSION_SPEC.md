# TEMPLATE_EXTENSION_SPEC.md — Adding a New Master Template

**Purpose:** This is the spec Claude Code reads when user says "เพิ่ม Ocean theme" 
or similar request to add a new master template. Following this spec ensures 
the new template integrates seamlessly without manual migration.

**Prerequisite:** H-CATALOG + H-FALLBACK-FIX must be complete (Phase 2 refactor).

---

## 📋 What You'll Do

When user requests to add template `<TEMPLATE_NAME>` with description `<VIBE>`:

1. Create template object covering ALL elements in elementCatalog
2. Add to TEMPLATES constant in templateEngine.js
3. Verify fallback works for any future element gaps
4. Ensure template appears in StatefulGallery + (future) Template Gallery
5. Test by switching to new template — every page should render correctly

---

## 🎨 Step-by-Step Instructions

### Step 1: Discover the full element list

Read `src/components/admin/editor/elementCatalog.js` (post-H-CATALOG).
List every element ID. Categorize by:
- Stateful elements (have `states[]` array)
- Static elements (have `presets[]` array)

Report count: "Found N elements: M stateful, K static"

### Step 2: Decide template's design language

Based on user's description (e.g. "ocean theme — calm blue/teal, soft waves"):
- Pick primary color (e.g. `#0EA5E9` for ocean)
- Pick accent color (e.g. `#06B6D4`)
- Pick background style (gradient direction, pattern type)
- Decide vibe: light/dark, sharp/soft, formal/playful

Document in template's `description` field.

### Step 3: Create template object structure

```js
// New template entry
{
  id: "ocean",                          // lowercase, no spaces
  name: "โอเชียน",                      // display name (Thai or EN)
  description: "เทมเพลตสีฟ้า-คราม สงบ ดูสบายตา",
  previewColor: "#0EA5E9",              // primary color shown in template switcher
  defaultBackgroundId: "gradient-blue-light",  // must reference existing background OR add new
  
  elements: {
    // ⚠️ MUST cover EVERY stateful element in elementCatalog
    // For static elements, the template doesn't store presets — it stores
    // overrides per-element (similar to stateful, but single config not per-state)
    
    "voteCTA-button": {
      login: { /* full config — NOT partial */ },
      notVoted: { /* full config */ },
      voted: { /* full config */ },
      ended: { /* full config */ },
      closed: { /* full config */ },
      paused: { /* full config */ }
    },
    
    "hero-countdown": {
      before: { /* full config */ },
      running: { /* full config */ },
      paused: { /* full config */ },
      manualEnded: { /* full config */ },
      nextYear: { /* full config */ }
    },
    
    // ... every other stateful element from elementCatalog
    
    "result-card": {
      showScore: { /* full config */ },
      showHidden: { /* full config */ },
      isWaiting: { /* full config */ }
    },
    
    "result-card-winner": {
      showScore: { /* full config */ },
      // (winner doesn't have showHidden / isWaiting per D-009)
    },
    
    // Static elements — single config per element
    "hero-title": { /* template's variant */ },
    "hero-subtitle": { /* template's variant */ },
    // ...
  }
}
```

### Step 4: Fill every element config

For each element, design configs that match the template's vibe.

**For stateful elements** (every state needs full config):
```js
"voteCTA-button": {
  login: {
    text: "Sign In",
    backgroundType: "gradient",
    gradientFrom: "#0EA5E9",
    gradientTo: "#06B6D4",
    gradientDirection: "to-r",
    textColor: "#ffffff",
    fontSize: "lg",
    fontWeight: "bold",
    borderRadius: "xl",
    borderWidth: "0",
    borderColor: "transparent",
    shadow: "lg",
    shadowColor: "#0EA5E9",
    paddingX: "10",
    paddingY: "4",
    iconName: "LogIn",
    iconPosition: "left",
    iconAnimation: "none",
    hoverEffect: "lift",
    letterSpacing: null,
    lineHeight: null,
    textTransform: null
  },
  notVoted: { /* same fields, different colors/text */ },
  // ... all states
}
```

**For static elements** (single config per element — Phase 2 unification):
```js
"hero-title": {
  text: "SAMO 49",  // or use globalConfig — depends on H-CON migration
  textColor: "#0F172A",
  fontSize: "5xl",
  fontWeight: "black",
  textTransform: null,
  letterSpacing: "-0.02em",
  // ... whatever fields the static template schema needs
}
```

### Step 5: Verify completeness via auto-check

Before committing, run a verification:

```js
// Pseudo-code — H-CATALOG should expose this helper
import { listAllElements } from './elementCatalog';
import { TEMPLATES } from './templateEngine';

function verifyTemplate(templateId) {
  const template = TEMPLATES[templateId];
  const allElements = listAllElements();
  const missing = [];
  
  for (const el of allElements) {
    if (!template.elements[el.id]) {
      missing.push(el.id);
      continue;
    }
    if (el.isStateful) {
      for (const state of el.states) {
        if (!template.elements[el.id][state.id]) {
          missing.push(`${el.id}.${state.id}`);
        }
      }
    }
  }
  
  return missing.length === 0 ? 'PASS' : missing;
}
```

If `verifyTemplate("ocean")` returns missing items:
- Either fill them OR rely on defaultConfig fallback (H-FALLBACK-FIX)
- Document which fields are intentionally minimal

### Step 6: Add to TEMPLATES constant

Edit `src/components/admin/editor/templateEngine.js`:

```js
export const TEMPLATES = {
  classic: { /* existing */ },
  neon:    { /* existing */ },
  ocean:   { /* NEW — your template */ }
};
```

### Step 7: Add new background if needed

If template uses a unique background not in BACKGROUNDS:

```js
// In templateEngine.js BACKGROUNDS:
export const BACKGROUNDS = [
  // ... existing
  {
    id: "gradient-ocean",
    name: "ฟ้า-คราม",
    type: "gradient",
    config: {
      from: "#0EA5E9",
      via: "#06B6D4",
      to: "#0891B2",
      direction: "to-br"
    }
  }
];
```

### Step 8: Add new icons if needed

If template uses icons not yet imported (e.g. lucide `Waves`):

In every component that uses ICON_MAP (CountdownTimer, VoteCTABlock, etc.):
```js
import { ..., Waves, Anchor } from 'lucide-react';

const ICON_MAP = {
  ..., Waves, Anchor
};
```

### Step 9: Verify build + visual

```bash
npm run build
# Should pass
```

Manual verification:
1. Admin → ออกแบบหน้าเว็บ → click any element with Gallery → switch to Ocean template
2. All states render with new colors
3. Switch to "หน้าหลัก" / "ผลคะแนน" / etc. → consistent theme

### Step 10: Update DECISIONS.md

Add entry:
```
### D-XXX: Master template "Ocean" added
**Decision:** Added Ocean theme (calm blue/teal). Default background gradient-ocean.
**Reason:** [user's rationale]
```

Update PROGRESS.md if running as a tracked step.

---

## 🚨 Pitfalls to Avoid

1. **Partial state coverage** — Don't define only some states for a stateful element. ALL states required (or rely on registry defaultConfig + fallback).

2. **Hardcoded colors** — Don't use Tailwind class names like `bg-blue-500`. Use hex values for all color tokens. Templates use INLINE STYLES, not classes.

3. **Missing icons** — Verify every iconName referenced in template exists in ICON_MAP of every component that uses it.

4. **Missing background** — If `defaultBackgroundId` references a background not in BACKGROUNDS, switching to template will break.

5. **Inconsistent vibe across elements** — If voteCTA-button is dark blue but hero-countdown is light pink, the template feels broken. Pick a palette and stick to it.

6. **Forgetting to test fallback** — Add the template, then deliberately delete one element's config, confirm `defaultConfig` fallback kicks in.

---

## ✅ Output Format

After implementing, report:

```
Template "ocean" added.

Elements covered: N stateful + M static
States covered: K (out of total L)
Backgrounds added: 1 (gradient-ocean)
Icons added: 2 (Waves, Anchor)

verifyTemplate("ocean"): PASS
Build: PASS
Visual test: All elements render correctly in admin preview.

Updated:
- src/components/admin/editor/templateEngine.js (TEMPLATES + BACKGROUNDS)
- src/components/CountdownTimer.js (ICON_MAP)
- src/components/blocks/VoteCTABlock.js (ICON_MAP)
- DECISIONS.md (new entry)
```

---

## 🌍 Future-Proofing Notes

- New element added later → Ocean template will fallback to elementCatalog.defaultConfig
- New state added to existing element → Ocean covers it via fallback
- User can override Ocean's defaults per-state via StatefulGallery
- User can clone Ocean as base for Created Template (Phase 3)
- Master templates are immutable to admin (read-only) — only devs add/modify

---

**This spec is callable** — when user says "Claude, please add Ocean theme as a master template, with calm blue/teal, soft wave aesthetic", you read this spec + execute steps 1-10 in order.
