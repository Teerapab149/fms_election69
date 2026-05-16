# LIVE_STEP_E1.md — Hero section: full config-driven rendering

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## SCOPE (DO NOT EXCEED)
Modify exactly ONE file: `src/components/HomeContent.js`
Only touch the Hero section rendering (countdown, title, subtitle, subtitle2, year-badge, status-badge).
Do NOT touch: Stats, VoteCTA, MeetCandidates, ElectionBanner, or any other section.
Do NOT modify any other file.
Do NOT create new files.
Do NOT install packages.

## GOAL
Make every visual property of Hero elements readable from `elementConfigs` when in editor mode.
In normal mode (editorMode = false), fall back to the existing hardcoded values — do NOT change how the real production page looks.

## ELEMENTS IN SCOPE (HERO ONLY)
- `hero-countdown` (type: toggle) — visible only
- `hero-title` — text, fontSize, color, fontWeight, align
- `hero-subtitle` — text, fontSize, color
- `hero-subtitle2` — text, fontSize, color
- `hero-year-badge` — text, fontSize, color
- `hero-status-badge` (type: toggle) — visible only

## CHANGES

### 1. Add style helpers near the top of the component body
Right after the existing `cfg` helper (already added in Step B), add these helpers:

```jsx
// Get text content — prefers editor override, falls back to default
const getText = (id, defaultText) => {
  if (!editorMode) return defaultText;
  return cfg(id).text ?? defaultText;
};

// Get inline style object for text elements
// Returns empty {} in normal mode so existing Tailwind classes win
const getTextStyle = (id) => {
  if (!editorMode) return undefined;
  const c = cfg(id);
  const style = {};
  if (c.fontSize) style.fontSize = SIZE_MAP[c.fontSize];
  if (c.color) style.color = c.color;
  if (c.fontWeight) style.fontWeight = WEIGHT_MAP[c.fontWeight];
  if (c.align) style.textAlign = c.align;
  return style;
};

// Check if a toggle element is visible
const isVisible = (id) => {
  if (!editorMode) return true; // normal mode keeps existing logic
  return cfg(id).visible !== false;
};
```

### 2. Wrap and bind each Hero element

For each Hero element currently rendered:

#### hero-countdown
```jsx
{isVisible('hero-countdown') && (
  <Wrap id="hero-countdown">
    {/* existing countdown JSX unchanged */}
  </Wrap>
)}
```
In normal mode, `isVisible` always returns true, so behavior is identical to before.

#### hero-title
Find the SAMO 49 heading. Keep existing className.
- Wrap with `<Wrap id="hero-title">`
- Add `style={getTextStyle('hero-title')}` to the h1 tag
- Replace the text content: use `{getText('hero-title', 'existing text')}` where "existing text" is whatever is currently hardcoded

If the title has split styling (like "SAMO" black + "49" purple), keep the split — only bind text override to the whole string. For editor mode, render the text plain without the split. Use conditional:
```jsx
<h1 ... style={getTextStyle('hero-title')}>
  {editorMode 
    ? getText('hero-title', 'SAMO 49')
    : /* existing JSX with split spans */
  }
</h1>
```

#### hero-subtitle, hero-subtitle2, hero-year-badge
Same pattern:
- Wrap with `<Wrap id="...">`
- Add `style={getTextStyle('...')}` to the text tag
- Use `{getText('...', 'existing text')}`

#### hero-status-badge
```jsx
{isVisible('hero-status-badge') && (
  <Wrap id="hero-status-badge">
    {/* existing status badge JSX unchanged */}
  </Wrap>
)}
```

### 3. Do NOT change
- Existing className values on any tag
- The 2-column layout grid
- Countdown timer logic
- Any state, useEffect, refs
- Import statements (SIZE_MAP, WEIGHT_MAP, RADIUS_MAP already imported in Step B)
- Status badge visibility logic in normal mode (if there's existing conditional like `if (electionStatus === 'ENDED')`, keep it — just AND it with isVisible)

### 4. Verify normal mode unchanged
After your edit, the real `/` page (no admin, no editor props) must render identically to before. This means:
- All original className values intact
- All original text visible
- All original conditional logic intact
- Inline styles only apply in editor mode (empty {} otherwise)

## VERIFICATION
1. Run `npm run build` — must pass
2. Open `/` real page — must look IDENTICAL to before (no color shifts, no font size changes)
3. Open admin editor preview — hover hero elements → purple dashed border appears
4. Click hero-title → PropertyPanel opens → change color → preview title color changes instantly

## REPORT FORMAT
```
Modified src/components/HomeContent.js — Hero section only
Added helpers: getText, getTextStyle, isVisible
Wrapped and bound 6 hero elements with config-driven rendering
Build: PASS
```

No extra explanation.
