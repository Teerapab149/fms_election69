# DIAGNOSE_H5_5_CLICK_LOCK.md — EditorElement Structure for Click-Lock

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify any file. DO NOT write code. Only read and report.

## CONTEXT
In admin live preview, clicking buttons/links inside the preview triggers 
real navigation (e.g. clicking "Vote Now" → goes to /vote, leaving editor).
This is a bug. Admin should be able to:
- ✅ Click element to SELECT it (opens PropertyPanel)
- ❌ Click element to TRIGGER navigation/action

We need to design a click-blocking mechanism. To do this, we need to understand
the current EditorElement implementation.

## FILES TO READ

1. `src/components/admin/editor/EditorElement.js`
2. `src/components/admin/editor/useEditorState.js` (look for click handlers / select logic)
3. `src/components/admin/PageDesignTab.js` (look for LivePreview JSX wrapper structure)
4. `src/components/HomeContent.js` (only the parts where Wrap is defined and used — line 108-118 area)
5. `src/components/admin/editor/StatefulGallery.js` (reference — if needed)

## REPORT IN THIS EXACT STRUCTURE

---

### Section 1: EditorElement component

**File:** src/components/admin/editor/EditorElement.js

**Full component signature (props):**
```js
export default function EditorElement({ ... })
```

**Full JSX returned by EditorElement:**
Show the complete return statement with all wrappers, divs, and event handlers.

**Click event flow:**
- What does it do `onClick`?
- Does it call `e.stopPropagation()`?
- Does it call `e.preventDefault()`?
- Does it use `onClickCapture` instead of `onClick`?

**Key props it accepts:**
- `id`, `isSelected`, `isHovered` — already known
- Any others? (className override? children pass-through?)

**Outer wrapper details:**
- What HTML element? (div / span)
- What CSS classes / inline style?
- Does it have any `data-*` attributes?
- What's the position behavior? (relative / absolute / static)

---

### Section 2: How EditorElement is used (Wrap helper)

In `HomeContent.js`, find the `Wrap` helper function (around line 108-118).

**Current implementation:**
```js
const Wrap = ({ id, children }) => editorMode ? (...) : children;
```
Show the full code.

**What does children look like inside Wrap?**
- Is `children` a React component? (e.g. `<VoteCTABlock>`)
- Or raw JSX with buttons/links inside?
- Examples from the codebase: pick 2-3 different Wrap usages and show what's inside.

---

### Section 3: LivePreview container structure

In `PageDesignTab.js`, find where `<LivePreview>` is rendered.

**Container hierarchy:**
- Show the JSX from the LivePreview wrapper down to where HomeContent is rendered
- Note any `transform: scale(...)` for device toggle
- Note any overflow / positioning containers

**Where would a click-capture handler best go?**
- On the LivePreview outer div?
- On the HomeContent wrapper?
- Inline on individual blocks?

---

### Section 4: Existing click prevention mechanisms

**Search the codebase for:**
- `pointer-events-none` usage anywhere
- `e.preventDefault()` calls in editor files
- `onClickCapture` usages
- `editorMode` checks that affect interactivity

Report findings — there might already be partial logic we should preserve or extend.

---

### Section 5: Real components inside Wrap

After H-5, real block components (VoteCTABlock, MeetCandidatesBlock, etc.) 
render inside Wrap. These contain navigation elements:

**For each real block, identify what triggers navigation:**

1. `<VoteCTABlock>` 
   - Does it use `<Link>`? Or `<a>`? Or `<button onClick={signIn(...)}>`?
   - Show the click trigger code

2. `<MeetCandidatesBlock>` (and the inner `<MeetCandidatesCard>`)
   - Same questions

3. `<ElectionBannerBlock>`
   - Any clickable elements?

4. `<Navbar>` rendered above HomeContent in editor preview?
   - Are there links in navbar that navigate?
   - Profile dropdown that opens?

5. `<HeroBlock>` content (in renderHero)
   - Year badge, status badge — any links?

---

### Section 6: Existing EditorElement click behavior

When admin clicks an EditorElement-wrapped section:

1. Does the EditorElement's onClick fire?
2. Does the onClick of inner content (e.g. real button) ALSO fire?
3. What is the actual order? (capture phase → bubble phase)
4. If a `<Link href="/vote">` is inside EditorElement, what happens currently?

This is critical for designing the click-lock — we need to know what the 
current behavior is.

---

### Section 7: Best place to add `data-*` marker

If we add a marker attribute like `data-editor-element="true"` or 
`data-editor-id={id}` to EditorElement, will any existing CSS or JS query 
selectors conflict? Search the codebase for existing `data-` attribute usage.

---

### Section 8: Strategy recommendation

Based on findings, recommend the BEST click-lock strategy:

- **Option A:** Capture-phase listener at LivePreview root that calls preventDefault on all clicks not targeting EditorElement
- **Option B:** Pointer-events CSS (none on container, auto on EditorElement)
- **Option C:** Wrap interactive children in a non-interactive context provider
- **Option D:** Modify EditorElement to stopPropagation when in editor mode (block clicks from reaching children)
- **Option E:** Other — describe

For each option:
- Implementation complexity
- Side effects / risks
- Compatibility with existing hover/select interaction

---

## DO NOT

- DO NOT modify any file
- DO NOT write code
- DO NOT install anything
- ONLY read and report

Return your full diagnosis.
