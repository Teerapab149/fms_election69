# ADR-001: Template / Element / Variant Architecture

**Status:** Accepted (May 22, 2026) — all blocking OQs resolved
**Version:** 1.1
**Supersedes:** Original D1 (per-element inline style only)
**Related:** VISION.md v1.2, DECISIONS.md (P-LOG-001 to 020)

---

## Context

After Phase 3 Day 4 completion (5 home blocks data-driven via per-element
inline style), the project gained a clearer vision (see VISION.md):

- 4 Pillars: Element Catalog / Template Gallery / Mix & Match Editor / Heritage
- Element variants across templates (mix & match)
- Layout slots (responsive grid)
- Theme/Layout/Element separation (3 layers — VISION I1)
- Template gallery + save-as-new (snapshot model — D5)
- 2-tier editor (Simple + Advanced CSS — D6)
- All pages, not just home

Diagnose (DIAGNOSE_ARCHITECTURE_GAP.md) revealed a critical contradiction:

> **VISION I1 (live theme tokens / 3-layer separation)** vs
> **DECISIONS D1 (per-element inline style, no CSS variables, mixed = forbidden)**

D1 was decided during Day 4 when scope was home-only and vision was unclear.
The new vision requires resolving this contradiction.

---

## Decision

**Adopt Option B2: Tokens + Element-Scope CSS Variables**

Two layers of CSS custom properties, with inline style as a third
override layer for per-instance customization.

### Three-Layer Architecture

```
Layer 1: Theme Tokens (template-wide)
  CSS vars on :root or scoped wrapper
  --color-primary, --color-accent, --color-surface, etc.
  Defined per template (classic, modern-dark, playful, minimal, ...)
  Owned by template, consumed everywhere

Layer 2: Element-Scope Variables (component-specific)
  CSS vars scoped to element selector
  [data-element="voteCTA-button"] { --btn-bg: var(--color-primary); ... }
  Defined per element variant
  Defaults reference Layer 1 tokens
  Owned by element variant, consumed by element JSX

Layer 3: Inline Style Overrides (admin per-instance customization)
  style={{ ... }} on element JSX
  For one-off admin customization
  Highest specificity, wins over Layer 1 + 2
  Owned by admin overrides table, optional
```

### Layer Responsibilities

| Layer | Owner | Use case | Specificity |
|-------|-------|----------|-------------|
| 1: Theme tokens | Template | Whole-template palette/typography/radius | Lowest |
| 2: Element vars | Element variant | Per-element-type defaults | Medium |
| 3: Inline override | Admin per-instance | Custom tweak this one element | Highest |

### Concrete Example

**Template `classic.js`:**
```js
{
  theme: {
    tokens: {
      "--color-primary": "#8A2680",
      "--color-accent": "#9333EA",
      "--color-surface": "#ffffff",
      "--color-bg": "#F8F9FD",
      "--color-text": "#1a1a2e",
      "--color-text-muted": "#64748b",
      "--radius-card": "24px",
      "--radius-button": "9999px",
      "--shadow-card": "0 8px 24px rgba(0,0,0,0.06)",
      "--font-display": "'Inter', sans-serif",
      "--font-body": "'Inter', sans-serif",
    }
  },
  elements: {
    "voteCTA-button": {
      variant: "default",  // ← which variant of this element type
      vars: {              // ← element-scope overrides for this template
        "--btn-bg": "var(--color-primary)",
        "--btn-text": "var(--color-surface)",
        "--btn-radius": "var(--radius-button)",
      }
    },
    "stats-voted-card": {
      variant: "gradient",
      vars: {
        "--card-bg-from": "#691E61",
        "--card-bg-via": "var(--color-primary)",
        "--card-bg-to": "#C026D3",
        "--card-text": "var(--color-surface)",
      }
    }
  }
}
```

**Template `modern-dark.js`:**
```js
{
  theme: {
    tokens: {
      "--color-primary": "#06b6d4",   // cyan
      "--color-accent": "#8b5cf6",    // purple
      "--color-surface": "#1e293b",
      "--color-bg": "#0f172a",
      "--color-text": "#f1f5f9",
      ...
    }
  },
  elements: {
    "voteCTA-button": {
      variant: "default",  // same variant, different tokens flow through
      vars: {}             // empty = inherit from theme tokens
    }
  }
}
```

**Element JSX (voteCTA-button, "default" variant):**
```jsx
<button
  data-element="voteCTA-button"
  className="..."
  style={inlineOverrides}  // Layer 3
>
  {label}
</button>
```

**Element CSS (compiled or styled):**
```css
[data-element="voteCTA-button"] {
  background: var(--btn-bg, var(--color-primary));
  color: var(--btn-text, var(--color-surface));
  border-radius: var(--btn-radius, var(--radius-button));
  ...
}
```

**Result of the cascade:**
1. Template root sets Layer 1 tokens
2. Element block scope sets Layer 2 vars (using Layer 1 tokens)
3. Element CSS reads Layer 2 vars (falling back to Layer 1)
4. Inline `style={}` wins if present (Layer 3)

---

## How This Resolves The Contradiction

**VISION I1 requirements satisfied:**
- ✅ Theme tokens are LIVE — defined per template, consumed by elements
- ✅ Layout / Theme / Element separated (Layout = upcoming slot system, Theme = Layer 1, Elements = Layer 2 variants)
- ✅ Swap template → entire palette/typography swaps via root-level vars
- ✅ Snapshot = save tokens + variant IDs + per-instance overrides

**Original D1 spirit preserved:**
- ✅ Per-instance inline style still possible (now Layer 3)
- ✅ Admin can override any single element
- ✅ "No mixed by accident" rule preserved — each layer has explicit role

**New constraint added:**
- ⚠️ Mixing across layers must be DELIBERATE, not accidental
- ⚠️ JSX should NOT hardcode colors as Tailwind classes
- ⚠️ Colors come from var() references; layout/spacing/animation can stay Tailwind

---

## Variant Concept (NEW)

Element entries now have a `variant` field that picks the structural
implementation:

```js
"voteCTA-button": { variant: "default" }
"voteCTA-button": { variant: "atelier" }  // different JSX entirely
"voteCTA-button": { variant: "editorial" }
"voteCTA-button": { variant: "funny-chunky" }
```

Each variant is a React component file:
```
src/components/elements/voteCTA-button/
├── default.jsx
├── atelier.jsx
├── editorial.jsx
├── funny-chunky.jsx
└── index.js  (variant resolver: takes variantId → returns component)
```

Each variant:
- Consumes Layer 1 + 2 CSS vars
- Defines its own structural decorations (borders, shadows, layout)
- Self-contained Lego brick (VISION I2)
- Container-aware (responsive)

**Admin "swap variant" UI:**
- Click element in editor
- See all variants of that element type (across templates)
- Click → swap variant ID in current template config

---

## Snapshot Strategy (D5 made concrete)

When admin saves as new template:

```js
{
  id: "admin-template-2570-aurora",
  theme: { tokens: { /* copy of all current tokens */ } },
  elements: {
    "voteCTA-button": {
      variant: "atelier",        // referenced variant ID
      vars: { /* full snapshot */ },
      overrides: { /* admin's inline overrides */ }
    },
    ...
  },
  schemaVersion: "v2",
  inheritsFrom: "classic",  // metadata only, not live link
  createdBy: "...",
  createdAt: "..."
}
```

**Snapshot includes:**
- Full theme tokens (no var() references to other templates)
- Variant IDs (references to variant components, which are versioned code)
- Full element-scope vars (resolved values, no inheritance)
- Admin overrides (per-instance)

**Variant components are still referenced by ID** — if a variant is
removed from code in year 5, snapshots referencing it must either:
1. Auto-migrate to a fallback variant
2. Show "variant unavailable" warning
3. Be locked to a variant version (variant + version tuple)

→ Track as Open Question (handled in Phase 2+)

---

## Implementation Phases

### Phase 1 Week 2: Foundation Refactor (revised scope)

**Goal:** Convert Day 4's inline-style architecture to Layer 1 + Layer 2 vars.

```
Day 5: Token extraction
  - Define token schema in classic.js theme.tokens
  - Migrate 4 templates to use tokens
  - Update voteCTA + CountdownTimer + 5 Day-4 blocks to consume vars
  - Build verify + visual verify 4 templates × home page

Day 6: Variant infrastructure
  - Create elements/<element-id>/ folder structure
  - Implement variant resolver
  - Convert voteCTA-button to "default" variant
  - Define variant schema in element entries

Day 7: Token propagation
  - All 5 migrated blocks use vars only (no hardcoded colors)
  - Element-scope vars defined for each element
  - Editor PropertyPanel still works (reads vars from template)

Build verify + visual verify after each day.
```

### Phase 1 Week 3: First Production-Ready Template + Editor Tier 1

```
Day 8-9: Polish "Classic" as production template
  - Ensure full data-driven coverage on home
  - Document tokens
  - Test 4 templates still differentiate

Day 10-11: Editor Tier 1 (Simple)
  - Theme token editor (color pickers for tokens)
  - Variant picker (swap variant for element)
  - Per-element vars panel (Layer 2 overrides)

Day 12: Save/load + buffer
```

### Phase 2 (June-October): Expand

- Implement Atelier variant for voteCTA-button
- Layout slot system (responsive grid)
- 2-tier editor (add Advanced CSS = Tier 3 inline overrides)
- Templates #2 + #3
- Save as new template (full snapshot pipeline)

### Phase 3 (Nov-Jan): Variant gallery + Multi-page

- SSR plumb resolvedTemplate to all pages
- Variant gallery UI
- Mix & match swap UX
- Multi-admin
- Documentation

---

## Migration Cost (revised honest estimate)

```
Refactor Day 4 work to vars: 3-4 days
Variant infrastructure setup: 2-3 days
Token system documentation: 1 day
Editor Tier 1 implementation: 3-4 days
Total Phase 1 Week 2-3: 9-12 days
```

**Implication:** 15 มิ.ย. soft milestone may shift to **late June 2026**.
Hard deadline (election Feb 27) unaffected.

---

## Open Questions (Tracked)

### OQ1: Variant versioning
If `voteCTA-button:atelier` is removed in year 5, what happens to snapshots referencing it?
**Defer to:** Phase 2 (when first non-default variant ships)

### OQ2: Token naming conventions — RESOLVED 2026-05-22
**Decision:**
- Layer 1: category prefix + system role
  - `--color-primary`, `--color-accent`, `--color-surface`, `--color-bg`, `--color-text`, `--color-text-muted`
  - `--radius-button`, `--radius-card`, `--radius-sm`, `--radius-md`
  - `--shadow-card`, `--shadow-button`
  - `--font-display`, `--font-body`
- Layer 2: component prefix + role
  - `--btn-bg`, `--btn-text`, `--btn-radius`
  - `--card-bg`, `--card-border`
  - `--stats-hero-grad-from`, `--stats-hero-grad-to`
- Rule: Layer 1 = system roles only (no component names)
- Rule: No double prefix (avoid `--theme-color-primary`)

### OQ3: Element-scope var scoping mechanism — RESOLVED 2026-05-22
**Decision:** `[data-element="<element-id>"]` attribute selector
**Critical addition (CSS variable inheritance defense):**
- Every element MUST declare Layer 2 var defaults at element root
- Pattern: `var(--scoped-var, var(--global-fallback))` (fallback chain)
- This prevents element-A's vars leaking into nested element-B
- Example:
  ```css
  [data-element="voteCTA-button"] {
    /* Declare ALL Layer 2 defaults at element root */
    --btn-bg: var(--color-primary);
    --btn-text: var(--color-surface);
    --btn-radius: var(--radius-button);
    /* Then use them */
    background: var(--btn-bg);
    color: var(--btn-text);
    border-radius: var(--btn-radius);
  }
  ```
- Layer 3 inline style wins via standard CSS specificity (no `!important` needed)

### OQ5: Editor preview channel — RESOLVED 2026-05-22
**Decision:** Unified render pipeline.
- Single root component handles both contexts
- Receives config from either source:
  - Live page: API → resolved template → root
  - Editor: editor state → root
- Same `<style>` block emitted in both
- Guarantees WYSIWYG: editor preview === production render
- Eliminates dual-channel drift bugs (Day 4 P-LOG observation)

### OQ6: Animation color params
- `<style jsx>` animations have color in keyframes
- Day 4 P-LOG-020 used inline color swap inside animations
- With vars: `@keyframes glow { from { background: var(--btn-glow-from) } ... }` should just work
**Status:** Decided here (use vars in keyframes)

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Refactor breaks Day 4 visual fidelity | Medium | High | Visual verify per step, classic byte-faithful test |
| Editor UX harder than expected | Medium | Medium | Tier 1 keeps current PropertyPanel shape; tier 2/3 deferred |
| CSS specificity bugs | Medium | Medium | Document layer rules; lint for hardcoded colors |
| 15 มิ.ย. milestone slip | High | Low | Election Feb 27 is the real deadline; soft slip acceptable |
| Variant fallback complexity | Low | High | Defer to Phase 2; document as Open Question |
| Token naming creates churn | High | Low | Decide OQ2 before Day 5 |

---

## Success Criteria

Before declaring this architecture done:
- [ ] Theme tokens defined in all 4 templates
- [ ] All Day-4 blocks consume vars (no hardcoded colors)
- [ ] voteCTA + CountdownTimer migrated to vars
- [ ] Variant infrastructure works for at least 1 element
- [ ] 4 templates visually distinct (no regression from Day 4 final state)
- [ ] Classic byte-faithful (no color drift)
- [ ] Editor Tier 1 can edit tokens + swap variant
- [ ] Documentation: ARCHITECTURE.md explains 3 layers to a junior

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-05-22 | 1.0 | Initial ADR. Decision: B2 (Tokens + element-scope vars + inline overrides as 3 layers). Supersedes original D1. |
| 2026-05-22 | 1.1 | OQ2, OQ3, OQ5 resolved. Token naming locked, data-element scoping + fallback chain pattern locked, unified render pipeline locked. All 3 blocking OQs cleared — Day 5 can begin. |

---

## END OF ADR-001
