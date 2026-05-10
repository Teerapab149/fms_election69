# DIAGNOSE_H7_RESULTCARD.md — ResultCard for State-Aware Conversion

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify any file. DO NOT write code. Only read and report.

## CONTEXT
We are converting ResultCard to be state-aware (same pattern as voteCTA + countdown).
ResultCard is on the Results page and has 3 states + winner modifier:
- showScore (revealed scores)
- showHidden (counting in progress, hidden)
- isWaiting (election not started yet)
- + winner modifier (rank 1)

Need full understanding of:
- States, sub-states, and combinations
- Design tokens needed for each
- Real-time data dependencies (vote counts, ranking, animation)
- How it's currently rendered + integrated with results page

## FILES TO READ

1. `src/components/ResultCard.js`
2. `src/app/results/page.js` (where ResultCard is used — check rendering, props, data)
3. `src/components/admin/editor/statefulRegistry.js` (current pattern reference)
4. `src/components/admin/editor/templateEngine.js` (TEMPLATES.classic structure to follow)
5. `src/components/admin/editor/stateResolver.js` (reference for adding new resolver)
6. `src/components/admin/editor/StatefulGallery.js` (reference for GalleryPreview pattern)
7. Any related result components (e.g. progress bar, winner banner) imported by ResultCard

## REPORT IN THIS EXACT STRUCTURE

---

### Section 1: Component signature

```js
export default function ResultCard({ ... })
```
List all props with defaults and types if obvious.

---

### Section 2: All visual states

For each state ResultCard renders:

| State ID (proposed) | Trigger condition | Visual description |
|------|------------------|--------|
| `showScore` | `(isEnded \|\| isOngoing) && isRevealed` | Real vote count + animated bar |
| `showHidden` | `(isEnded \|\| isOngoing) && !isRevealed` | Striped "HIDDEN" bar |
| `isWaiting` | `WAITING/PRE_CAMPAIGN/CLOSED` | Placeholder text |

For each state report:
- Background color / gradient
- Text color (rank label, party name, score)
- Bar/Progress fill style
- Badge / label / icon used
- Animation (pulse, count-up, etc.)
- Border / shadow / decoration
- All hardcoded text labels (Thai + English)

Also report the **WINNER modifier** (separately):
- Trigger: `rank === 1 && showScore`
- Visual differences from a non-winner card
- Icon used (Trophy?)
- Border/glow color
- Layout differences (full-width vs list-row?)

---

### Section 3: Sub-states & combinations

How do `state × winner` combinations interact?
- showScore + winner → ?
- showScore + NOT winner → ?
- showHidden + winner → ? (does winner exist when hidden?)
- isWaiting + winner → ? (probably no winner yet)

Report all valid combinations with their visual differences.

---

### Section 4: Real-time / animated logic

- Does ResultCard have any `setInterval` / animation hooks?
- Animated count-up on the score? (start from 0 → real value)
- Progress bar fill animation?
- LIVE pulse badge during ONGOING?
- Cleanup logic on unmount?

Show line numbers and code snippets.

---

### Section 5: Configuration source

For each piece of data:
- `rank` — where from? (prop / parent computed)
- `voteCount` / score — where from? (prop / API)
- `partyName` — prop
- `partyLogoUrl` — prop?
- `isEnded` / `isOngoing` / `isRevealed` — props from results page

What is LOGIC-LOCKED (must stay hardcoded)?
- State detection? (admin can't change)
- Winner condition? (rank === 1)

---

### Section 6: Editable vs locked properties (per state)

For each state + winner modifier, classify each property:

- **DESIGN-EDITABLE**: backgroundColor, textColor, borderColor, etc.
- **TEXT-EDITABLE**: labels like "HIDDEN SCORE", "รอเปิดลงคะแนน"
- **LOGIC-LOCKED**: state detection, winner condition
- **DATA-LOCKED**: actual vote count numbers

Report for each state.

---

### Section 7: Editor mode handling

- Does ResultCard work in editor mode without modification?
- Does it depend on results page wrapping context (e.g. `useEffect` for data fetch)?
- Is `forceState` feasible to inject?
- What demo data should StatefulGallery show?

---

### Section 8: Existing usage in results page

Find `<ResultCard />` rendering in `src/app/results/page.js`:
- Where in JSX (what section, what conditions)?
- All props passed (rank, party, isEnded, isOngoing, isRevealed, etc.)
- Is it inside a Wrap / EditorElement currently? (likely no — Results page hasn't been editor-wired yet)
- Is it in a list/map rendering (multiple cards)?
- Is there a separate winner card OR is the same component reused?

---

### Section 9: Static text strings

List EVERY hardcoded string in ResultCard:

| String | State | Location |
|---|---|---|
| "Voting in progress..." | showHidden | line N |
| "HIDDEN SCORE" | showHidden | line N |
| "รอเปิดลงคะแนน" | isWaiting | line N |
| "LIVE" | showScore (ongoing) | line N |

These would become editable text per state.

---

### Section 10: Design tokens needed for templates

Based on the states identified, what config properties does each state need to be 
fully designable? Suggested fields:

For `showScore` state:
- backgroundColor
- borderColor / borderWidth
- progressBarFill (color or gradient)
- progressBarBg (track color)
- rankBadgeColor
- partyNameColor
- scoreNumberColor
- shadow / shadowColor
- borderRadius

For `showHidden`:
- backgroundColor
- striped pattern color(s)
- badgeColor (HIDDEN badge)
- badgeTextColor
- iconAnimation (pulse?)

For `isWaiting`:
- backgroundColor
- textColor (placeholder text)
- borderColor

For `winner` modifier:
- glowColor
- trophyColor (icon)
- expandedLayout? (boolean — winner takes full width vs list row)
- crownColor

Report the actual current Tailwind/inline styling for each so we can replicate as Classic preset.

---

### Section 11: ResultCard layout variants

Looking at the rendered layout, are there major layout differences between:
- Standard list-row (rank > 1)?
- Winner full-width (rank 1)?

If yes, are these two SEPARATE return paths in JSX or one path with conditional classes?

This matters for how we model in registry — single state with a `isWinner: true` flag in config, OR a separate `winner-card` element with its own state structure.

---

### Section 12: Existing PropertyPanel/Gallery integration

Has Results page been click-wired in PageDesignTab yet? (Probably not.)
Will admin need:
- A separate Results page tab in admin?
- Or is ResultCard rendered in Home preview too?

Diagnose:
- Does PageDesignTab have a "results" page selector?
- Is there a results editor preview already?
- If yes, where? If no, what would need to be added?

---

## DO NOT
- DO NOT modify any file
- DO NOT suggest fixes
- DO NOT write code
- ONLY report findings

Return your full diagnosis.
