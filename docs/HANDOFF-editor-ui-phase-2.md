# HANDOFF — Composition Editor (Layer-2 visual editor) · for tomorrow

**Written 2026-06-08, end of a long session.** Branch `new-version`, everything UNCOMMITTED
(commit only when the user asks). Read WITH the persistent memory note **`three-layer-editor`**
(the canonical record) and the earlier specs `docs/HANDOFF-editor-ui-phase.md` (the original
plan) + `docs/HANDOFF-element-refactor.md`. This doc is the *current* ground truth.

> **Read order for a fresh session:** VISION.md → ADR-001 → DECISIONS.md → PRODUCT.md →
> memory `three-layer-editor` → this file. Then run the editor (`/compose-lab`) and click around
> for 2 minutes before touching code.

---

## ⭐ RESUME HERE (newest first) — session log 2026-06-09 "AUTO-mode polish round 2"

Continued in AUTO mode. **All changes in `src/components/admin/compose/CompositionEditor.jsx`**
(+ one line in `src/components/admin/editor/controls/SharedInputs.js`). Screenshots WORKED this
session — every visual change below was verified with `preview_screenshot` + `getComputedStyle`.
`npm run build` ✓ (all routes incl. `/compose-lab` 13.6 kB, `/candidates`). Regression: `/candidates`
still **2 cards / 7 `[data-element]` in card 1** (Composition.jsx NOT touched → public byte-identical).

**Done this session (the backlog A–F):**
- **A · thumbnails fixed** (the open issue). `NodePreview` is now **fit-to-box**: renders the
  descriptor at natural width (`fit-content`, capped 340px so text wraps), measures it with a
  `ResizeObserver`, and picks a box height from the content aspect (clamped 74–150px) so the
  content fills the width. Neutral `bg-slate-50`. Verified: stat scale 0.82 / CTA box 150px
  scale 0.55 / badge-row scale 1.21 — all three read clearly now.
- **B · marquee select.** Drag on EMPTY canvas (mousedown target === the canvas div) → rubber-band
  rect → selects nodes **fully enclosed**, then drops wrapping ancestors so you get the items
  (siblings → groupable). Populates the existing `checked` set → Layers checkboxes light up,
  จัดกลุ่ม enables, **Delete batch-removes** (deepest-first via `cmpPathDesc`, verified 6→0).
  A `suppressClick` ref stops the trailing click from re-selecting. Verified: enclose card → 6
  leaves; enclose 2 chips → "จัดกลุ่ม (2)" enabled. **Multi-MOVE is via group-then-drag** (group
  works, frames drag) — direct multi-node drag deferred (path-shift risk, not worth a buggy ship).
- **C · arrow-nudge + copy/paste.** ←/↑ = move earlier, →/↓ = later (reuses `moveSelected`).
  `Ctrl+C` clones selection (single OR `checked` multi) into a `clipboard` ref; `Ctrl+V` pastes
  after the selected node / into a selected frame / else appends. Verified: ArrowDown reordered
  0→1; copy/paste 5→6 children (clone right after original).
- **D · zoom + pan.** `Ctrl/⌘+wheel` zooms 25–300% (native non-passive listener), `Space+drag`
  pans (works over nodes too), toolbar `− 100% +` control with reset. `<Composition>` wrapped in a
  `translate()/scale()` layer; overlays stay OUTSIDE it (screen-coord math). selRect effect now
  deps on `[zoom,pan]` so handles re-track; resize divides deltas by `zoom`. Verified: zoom matrix
  1.1 + handles tracked, pan translate (0,0)→(60,40), reset → identity.
- **E · font-weight bug — root-caused + honest fix.** Measured glyph advance (offscreen span):
  Anuphan (the body font) renders 400=586 / 600=603 / 700=611 px but **700=800=900=611** — it tops
  out at wght 700, so the toggle's "900" was a no-op. Fixed `WeightToggle` to **400/600/700**
  (ปกติ/หนา/หนามาก) — all visibly distinct, so the toggle always does something. ⚠️ **True Black-900
  Thai is NOT possible with Anuphan** — it'd need a 900-capable display font wired as the heading
  face (a design decision; flagged, not silently done). Old data storing 900 still renders (browser
  clamps→700). NB: WeightToggle is shared with PageDesignTab — strict improvement there too.
- **F · chrome.** Canvas bg: loud pink/cream/green gradient → **neutral `#F6F7F9` + subtle 16px
  dot-grid** (Figma/Canva artboard feel) so the themed card pops. Verified visually.

**What's still open / next (pick up here):**
- **Direct multi-node drag-move** (deferred from B). Safe approach: clone the checked set, remove all
  deepest-first, recompute target index, re-insert in order. Or just lean on group-then-move.
- **Alignment guides / snap lines** while dragging (§7.1 — still the biggest "feels pro" win, untouched).
- **True 900 weight** — needs the heading-font decision above (ask the user).
- The big one remains **§6 integration** (make the editor change real pages + DB persistence).
- Minor: `TBtn` still defined inside render (P-noted last session); zoom is center-origin not
  cursor-origin (fine for now).

---

## session log 2026-06-08 "polish round"

Continued the editor from the original phase-2 build with a **looks + usability polish pass**.
**All changes are in `src/components/admin/compose/CompositionEditor.jsx` + `src/app/compose-lab/page.js`**
(no new files). Verified via DOM + `getComputedStyle` (see the screenshot caveat below).

**What changed today (exact):**
1. **Chrome polish** (consistency → Linear/Figma feel):
   - Panels: `rounded-2xl border-gray-200 shadow-sm` → `rounded-xl border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.05)]` (all 4 left panels + toolbar, via replace-all).
   - Panel headers: `text-xs font-bold text-slate-700` → `text-[10.5px] font-semibold uppercase tracking-wide text-slate-400`; header icons `text-[#8A2680]` → `text-slate-400` (subtle, accent reserved for actions/selection).
   - Canvas: `rounded-2xl border shadow-sm p-8` → `rounded-xl ring-1 ring-slate-200 shadow-[…] p-10`.
   - Selection outline (the injected `selCss`): `2px / offset 2px` → `1.5px / offset 1px` (+ `border-radius:1px`).
   - Resize handles: `w-2.5 border-2 rounded-sm` → `w-2 border rounded-[2px] shadow`.
   - Drag badge: text "ลากย้าย" → the node's **type label** (`text-title` / `frame`), lighter styling.
   - Layers selected row: solid `bg-[#8A2680]` white text → light tint `bg-[#8A2680]/[0.08]` + `text-[#8A2680]`; hover `bg-slate-100`.
   - `page.js` shell: bg `#F8F9FD` → `#F4F5F7`; smaller header; a `/compose-lab` chip.
2. **Preset + saved-component THUMBNAILS** — added `NodePreview({node, scale})` (a scaled `<Composition>` in a clipped box) and rebuilt the preset list + "คอมโพเนนต์ของฉัน" list as **cards with a live thumbnail + name** (delete X is now a hover-reveal corner button on saved cards).
3. **Canvas hover highlight** — `hoveredPath` state + `onCanvasMove`/`onMouseLeave` on the canvas + an injected `hoverCss` (faint `rgba(138,38,128,.32)` outline) when hovering a non-selected node. Discoverability ("what can I click").
4. **Direct atom-body drag** — for a selected ATOM, a transparent `z-40` overlay sized to `selRect` is draggable (`startDragMove`) so you grab the element itself, not only the "ลากย้าย" handle; double-click the overlay = inline edit. (Frames still use the handle so you can still drill into them.)

**OPEN ISSUE the user flagged (do first next session):** the **preset thumbnails are unclear**
(esp. "บล็อก CTA" renders faint). Cause: fixed `scale(.46)` makes content tiny + the cream
preset bg has low contrast on the light thumbnail gradient. **Fix:** make `NodePreview` fit-to-box
(measure the rendered content, compute scale to fill the box width) OR bump box height (~88–96px)
+ scale (~.55) + a neutral/white thumbnail bg so content pops + center properly. Also consider a
small "drag to add" affordance on hover.

**SCREENSHOT TOOLING WAS DOWN ALL SESSION:** `preview_screenshot` timed out every time (renderer
fine — `preview_eval`/`getComputedStyle` worked, page rendered, no console errors). This is almost
certainly a stuck state in this session's preview/browser host, NOT the code. **A fresh session
should restore screenshots** — verify the visuals (esp. the thumbnails + hover + chrome) in a real
browser early.

**Resume options next session:**
- **Finish the polish the user asked for:** fix thumbnail clarity (above), then continue Track-A
  (visual) + Track-B (usability) together — see §7 backlog. Next queued: marquee select, arrow-key
  nudge, copy/paste, zoom, fix the font 700/900 bug (§5.1).
- Or pivot to **§6 integration** (make it real on pages) if the user wants that instead.
- The user's stance: **"เสร็จสมบูรณ์ = หน้าตา + ลื่น ต้องไปคู่กัน"** — keep both tracks moving.

---

## 0. One-paragraph state

The **3-layer editor vision** (atom → component → page/template, Hybrid-C responsive
composition) now has a **working visual editor** at the dev route **`/fms-ovs/compose-lab`**.
It is a **standalone sandbox** — deliberately NOT wired to the real pages yet (so it can't
break the live election site). The public gumroad pages were already atomized last pass (every
page's primary composite renders from Layer-1 atoms via `<Composition>`). The editor proves you
can select / edit / style / drag / group / save-and-reuse compositions. **The big remaining
work is integration:** make real pages render from a stored descriptor + persist to the DB so
the editor actually changes the site. Plus design-tool polish (the user's last feedback: "still
worse than Figma/Canva in every way, still hard to use" — we added undo/redo + keyboard +
toolbar as polish iteration #1; more is wanted).

---

## 1. The vision (do not drift — re-read memory `three-layer-editor`)

- **Layer 1 = Element (atom):** smallest editable piece. `src/components/elements/<type>/<variant>.jsx`.
- **Layer 2 = Component:** atoms grouped in frames, layout locked = a reusable component (the
  candidates party-card, a stat card…). It is **DATA** (a descriptor tree), not hardcoded JSX.
  `src/components/composites/<name>/<variant>.jsx` (a `buildX()` descriptor + a renderer).
- **Layer 3 = Page → Template:** components arranged into pages; all pages = a template.
- **Each layer has presets (ready-made, coherent) + build-your-own (flexible).** "Save" = snapshot
  into that layer's library. This **supersedes PHASE3 D-306** (noted in that doc).
- **Layout model = Hybrid C (CONFIRMED with user):** edit visually like Canva, but **compile to
  responsive flex/grid — NO absolute x/y canvas** (would break mobile; the user cares deeply).
  Every "free" feel (drag, resize) snaps to flow + carries `max-width:100%` guards.

---

## 2. What is BUILT (file map + what each does)

### 2a. Composition engine — `src/components/elements/_composer/`
- **`Composition.jsx`** — the renderer + the descriptor algebra. Exports:
  - `<Composition node={…} editorMode />` — walks the node tree, renders it. `editorMode` stamps
    `data-node-path` on every node (atoms wrapped in a `display:contents` span so layout is
    unchanged) → enables selection/click-delegation. **Public render (editorMode falsy) is
    byte-identical** — no wrappers, no attrs.
  - Node kinds: **`frame`** `{kind:'frame', as?, className?, layout?, style?, attrs?, href?, children:[]}`
    (`layout` → `compileLayout` → flex/grid inline); **`atom`** `{kind:'atom', type, variant?, props, style?}`
    (resolved via the registry); **`node`** `{kind:'node', render}` (raw ReactNode escape hatch — icons/bespoke).
  - Path scheme: root = `"0"`, children `"0/1"`, `"0/3/1"`. Helpers (ALL exported, used by the editor):
    `ROOT_PATH`, `getNodeAtPath`, `updateNodeAtPath`, `parentPath`, `indexInParent`,
    `insertChild` → `{root,path}`, `removeAtPath`, `moveAtPath` → `{root,path}`,
    `groupSiblings(root, framePath, indices)` → `{root,path}`, `ungroupAtPath(root, framePath)`.
- **`registry.js`** — atom palette: `ATOMS[type][variant]` → component; `resolveAtom(type, variant='gumroad')`
  (falls back to first variant, warns, never throws); `variantsOf(type)` → variant id list.

### 2b. Layer-1 atoms — `src/components/elements/<type>/<variant>.jsx`
10 atom types (each accepts a `style` passthrough; composites tune them via scoped class
overrides like `.el-card .el-title{…}`, NOT inline hacks):
- `image/gumroad` (props src/fit/empty/emptyContent), `badge/gumroad` + `badge/soft`,
  `text-title/gumroad` (`as` prop for h1/h2/h3), `text-label/gumroad`, `text-body/gumroad`,
  `text-meta/gumroad`, `text-stat/gumroad` (unit), `text-plain/gumroad`,
  `chip/gumroad` + `chip/soft` (tone), `button-primary/gumroad` + `button-primary/soft` (as/href/icon).
- **`soft` variant family** (badge/chip/button-primary) = rounded, soft-shadow, no chunky ink
  border — the clean counterpart to `gumroad` chunky. **Adding more variants = copy a variant
  file + register in `registry.js` + (optional) it shows in the editor's variant picker automatically.**

### 2c. Layer-2 composites — `src/components/composites/<name>/<variant>.jsx`
Each exports `buildX(...)` (the descriptor) + a default component rendering `<Composition>` +
its own frame CSS. Live on real pages today:
- `party-card/gumroad` (candidates), `stat-card/gumroad` (results), `member-tile/gumroad`
  (party + single-party), `vote-party-card/gumroad` (vote multi), `info-card/gumroad` (closed).

### 2d. The editor — `src/components/admin/compose/`
- **`CompositionEditor.jsx`** — THE editor (3-pane + toolbar). ~700 lines. Owns:
  the descriptor `node` state, selection (`selectedPath`), multi-select (`checked`), history
  (`past`/`future`), drag payload, drop hint, selection rect, inline-edit flag.
- **`componentStore.js`** — persistence ADAPTER for "คอมโพเนนต์ของฉัน". **v1 = localStorage**
  (key `fms-saved-components`). `loadComponents()` / `saveComponent(name,node)` / `removeComponent(id)`.
  **This is the single seam to swap to the DB** (see §6).
- **`presets.js`** — 3 built-in starter components (การ์ดสถิติ / บล็อก CTA / หัวข้อ+เลข).
- **Route:** `src/app/compose-lab/page.js` — public dev sandbox + a self-contained SAMPLE descriptor
  (frames via inline `layout`/`style` + atoms). **Not auth-gated on purpose** (dev). Remove/guard before prod.

### 2e. Editor capabilities (ALL verified live this session)
| Feature | How it works (so you can extend it) |
|---|---|
| Select | canvas click → event-delegation `closest('[data-node-path]')`; or Layers-tree row. Highlight via injected CSS (`[data-node-path="X"]` frames; `.cmp-node--atom[..]>*` atoms). |
| Inline text edit | **double-click** a text atom → overlay `<textarea>` at the selection rect, live `setProp('children')`, blur/Esc to close. |
| Style inspector | reuses `admin/editor/controls/SharedInputs` (ColorPickerInput/PxSlider/WeightToggle/AlignSelect/SelectInput). Atoms → `setStyle(color/fontSize/fontWeight/textAlign)`. Frames → `setLayout(direction/gap/align/justify)` + `setStyle(background/padding/borderRadius)`. |
| Variant picker | shows when `variantsOf(type).length>1` → `setVariant(node.variant)`. |
| Drag-drop | HTML5 DnD, no lib. Drag palette tile (insert) or Layers row (move) → canvas drop zone. Purple **insertion-line** computed from hovered node + mouse-Y. Payload via a `useRef` (getData blocked during dragover). `moveNodeTo` guards self/descendant drops. Palette tiles render a **live mini-preview** (= the drag ghost). |
| Drag handle | selected element shows a floating "⠿ ลากย้าย" badge (atoms are `display:contents`, can't be dragged directly → handle measured from the real box via `selRect`). |
| Resize | Figma-style handles (right `e` / bottom `s` / corner `se`), mouse-drag via window listeners. Sets `style.width/height` in px **+ forces `maxWidth:100%`** (responsive-safe). |
| Insert / delete / reorder | palette click / ↑↓ buttons / Delete key. |
| Group / ungroup | multi-select checkboxes in Layers → "จัดกลุ่ม" (≥2 same parent); ungroup button in frame inspector. |
| Save → persist → reuse | "บันทึก" snapshots the selected frame (or whole tree) to localStorage → appears in "คอมโพเนนต์ของฉัน" + presets are always there → click inserts a deep clone. **Only frame/atom descriptors serialize** (JSON); composites using the `node` escape hatch (raw icons) can't persist yet. |
| Undo / redo | **auto-history**: a `useEffect` on `[node]` with a **400ms debounce** snapshots the prior stable state into `past` (coalesces slider/resize/typing bursts into ONE entry); `skipHist` ref prevents re-capture during undo/redo. |
| Keyboard | `Ctrl/⌘+Z` undo · `+Shift`/`Ctrl+Y` redo · `Delete`/`Backspace` delete · `Ctrl/⌘+D` duplicate · `Esc` deselect. Ignores INPUT/TEXTAREA (except Esc). |
| Toolbar | top bar: undo/redo/สำเนา/ลบ + live "เลือก: <type>" indicator. |

---

## 3. The data-model contract (STABLE — build everything against this)

A Layer-2 component / page body = a **descriptor node tree** (see §2a for the 3 kinds). The
editor reads/writes this tree immutably via the `_composer` helpers. Anything that persists or
renders a composition uses THIS shape. When wiring real pages, the page body becomes such a tree.

**Key invariant:** frames carry layout (flex) + style; positioning that escapes flow (overlays
like a badge on a cover) is plain `position:absolute` inside a relative frame — still declarative,
never a free canvas.

---

## 4. How to run + verify (env quirks — these bit us repeatedly)

- **Preview:** `preview_start` name **`fms-dev`** (`.claude/launch.json`), port 3000, basePath
  `/fms-ovs`. Open **`http://localhost:3000/fms-ovs/compose-lab`** (no trailing slash).
- **The dev server stops itself sometimes** (and after a build). If `preview_list` is empty,
  `preview_start fms-dev` again. First request after start needs ~4s to compile.
- **`window.location.href` reloads** often return `Eval failed: Inspected target navigated or
  closed` — that's just the navigation; run the assertion in a SEPARATE `preview_eval` after a
  `setTimeout` wait (~3.5–4.5s for a fresh route compile).
- **Build:** `preview_stop` FIRST (Windows `.next` EPERM lock), `rm -rf .next`, `npm run build`,
  then `preview_start`. Last full build this session: **✓ 30/30 routes**.
- **Testing the editor via `preview_eval`:** select by clicking `.cmp-node--atom[data-node-path="X"]
  .el-…`; React state updates are async → `await setTimeout(250)` before asserting. **Gotcha:**
  the palette renders live atom previews too, so `querySelector('[data-element="button-primary"]')`
  may hit the PALETTE preview — scope canvas queries with `[data-node-path]`.
- **Synthetic DnD:** `new DragEvent('dragstart'/'dragover'/'drop', {bubbles:true, cancelable:true,
  dataTransfer:new DataTransfer(), clientX, clientY})`. Dispatch dragover/drop on the atom's REAL
  child (`.cmp-node--atom[..].firstElementChild`), not the contents-span (zero rect).
- **Resize/keyboard:** dispatch `MouseEvent('mousedown'…)` on the handle + `mousemove`/`mouseup`
  on `window`; `KeyboardEvent('keydown',{key:'Delete'|'d', metaKey:true, bubbles:true})` on `window`.
- **Regression check after any `Composition.jsx` change:** load `/candidates` → expect 2 cards,
  7 `[data-element]` in the first (public render must stay byte-identical).
- **Kill animations before screenshots** (`*{animation:none!important;transition:none!important}`).

---

## 5. KNOWN ISSUES (carry forward)
1. **Font weight 700 vs 900 looks identical** (user flagged). Root cause = font loading: Archivo
   Black is single-weight; the body font likely isn't loaded with distinct 700/900 via next/font,
   so the browser synthesizes bold. **Fix = load proper weights in `src/app/layout.js` (next/font
   `weight:[...]`) or choose weight-rich fonts.** Deferred.
2. **First action after a fresh mount may not be captured by undo** (debounce edge). Subsequent
   actions undo fine. Minor; revisit if it annoys.
3. **`node`-kind (raw icon) composites can't be saved/persisted** (JSON can't serialize React
   elements). Need a serialization strategy (e.g., store an icon NAME + a lookup) before those persist.
4. **Sandbox is public + unauth** (`/compose-lab`). Guard or remove before any prod deploy.
5. **Inline `TBtn` component** is defined inside `CompositionEditor` render → remounts each render
   (harmless now, but lift it out when you touch the toolbar).

---

## 6. ⭐ THE BIG NEXT STEP — integrate the editor into real pages

This is the answer to the user's recurring question "เอาไปใช้ยังไง / หน้าจริงยังเป็นแบบเดิม".
Today the sandbox is disconnected. To make it real, three things (decisions already taken with
the user where noted):

**6a. Persistence → `Template.components` (USER CHOSE THIS).** `Template` model exists
(`prisma/schema.prisma`: `pages/elements/theme Json`, fork/lock). Plan:
- Add `components Json?` to `Template` (a per-template saved-component library). `prisma db push`
  (NOT migrate — drift; and **`preview_stop` before `prisma generate`** — EPERM on Windows).
- A route `src/app/api/admin/components/route.js` (or reuse templates API): GET/PUT the active
  template's `components` (active template id = `SystemConfig.activeTemplateId`). Admin-token guarded.
- **Swap `componentStore.js`'s 3 functions** from localStorage to `fetch()` that route. Nothing
  else in the editor changes (that's why it's an adapter).

**6b. "frame CSS travels with the descriptor" (BLOCKER — decide first).** Today a composite's
frame styling (`.el-card*` etc.) lives in the composite COMPONENT's `<style>`, not in the
descriptor. So the editor can render the SAMPLE (inline-styled frames) but NOT a real composite
standalone. Options: (a) make composites express frame styling via inline `style`/`layout` in the
descriptor (self-contained — what the sandbox does), or (b) save a CSS payload alongside the
descriptor, or (c) keep composites as code and only let the editor edit atom-level props on real
pages. **Pick before 6c.** Recommendation: lean (a) for editor-created components; keep (c) as the
bridge for the existing hand-built composites.

**6c. Real page renders from a descriptor.** Pick ONE page (candidates — cleanest). Store its body
as a descriptor (in the template/page-layout), render via `<Composition>` instead of the hardcoded
`<PartyCard>`, wire selection into the existing `PageDesignTab` editor (see the Task-0 audit in
`docs/HANDOFF-editor-ui-phase.md` §1: `useEditorState`, `PageDesignTab`, `PropertyPanel`,
`EditorElement`). Then a "วาง component ลงหน้านี้" action drops a saved component onto the page.
**Open question: bridge the TWO registries** — `elements/registry.js` (47 named slots, what the
existing editor knows) vs `_composer/registry.js` (10 atoms). Decide merge vs bridge.

---

## 7. EDITOR POLISH BACKLOG (user wants "ดีกว่านี้ทุกด้าน, like Figma")

**DONE 2026-06-08 polish round:** chrome pass (consistent rounded-xl panels / subtle uppercase
headers / refined canvas+toolbar / lighter Layers-selected tint / cleaner resize handles /
type-label drag badge / cooler shell); **preset + saved-component THUMBNAILS** (`NodePreview`
renders a scaled `<Composition>`); **canvas hover highlight** (`hoveredPath` + faint outline);
**direct atom-body drag** (transparent z-40 overlay on selected atoms — drag the element itself,
not just the handle; double-click overlay = edit text). NOTE: **`preview_screenshot` timed out the
whole session** (renderer fine, eval/computed-style verification worked) — verify visuals in a real
browser. Still open, prioritized:
1. **Alignment guides / snap lines** while dragging (the single biggest "feels pro" win). Compute
   sibling edges/centers, show guide lines, snap within ~6px.
2. **Marquee select** (drag on empty canvas to rubber-band select) + **multi-select move**.
3. **Arrow-key nudge** (reorder within frame) + **copy/paste** (Ctrl+C/V across selections).
4. **Chrome polish to Linear/Figma grade** (product register, see PRODUCT.md): cooler neutral
   panels, tighter spacing, refined selection chrome (clean accent outline + dimension badge),
   consistent hover/focus/active states, 150–250ms transitions. Currently functional-but-plain Tailwind.
5. **Zoom + pan** on the canvas (Ctrl+scroll / space-drag).
6. Direct-drag the element body (not just the handle) — needs solving the `display:contents`
   draggability (or a transparent draggable overlay that still passes double-click + resize).
7. Fix the font-weight bug (§5.1) so the weight toggle is meaningful.

**Lever B (library richness) continuation:** more atom variants (text-title styles, image frames),
more presets, and eventually preset COMPONENTS per template theme.

---

## 8. Working agreements with this user (don't relearn the hard way)
- Reply in **Thai**. Honest > encouraging; **flag risk, no silent scope cuts** (vision-fidelity).
- The user gives blunt UX feedback and is right — treat "ใช้ยาก / ดูไม่ดี" as real signal, diagnose
  the root cause, don't defend v1.
- **Verify with computed values / measurements + screenshots**, not claims. The user caught a
  shallow test (weight 700/900) — be rigorous.
- **Commit only when asked.** Branch `new-version`, all uncommitted. Don't delete the temp 2nd
  party (candidates grid needs 2+ parties).
- Budget-aware: stop at clean checkpoints, write the handoff, don't half-finish DB migrations.

---

## 9. Discipline (from CLAUDE.md — these bit past sessions)
- **Task 0 audit before building** on the existing editor; STOP + paste evidence on divergence
  (P-LOG-005). Don't spec from stale memory.
- **No raw auth/redirect in editor previews** — static EditorPreview (P-LOG-002/004).
- **grep for orphan/duplicate Wraps** before adding editor seams (P-LOG-001/006).
- **`.next` manifest race on Windows** → `preview_stop` + `rm -rf .next` + restart on HMR rot.
- **Byte-faithful gate:** any change to `Composition.jsx` must keep the public pages identical
  (regression check in §4). After a meaningful work block, run the **self-reflection** skill.

---

## 10. Quick "where do I start tomorrow?" answer
If the user says **"make it more like Figma"** → start §7.1 (alignment guides) + §7.2 (marquee).
If the user says **"make it real / use it on the site"** → start §6 (decide 6b first, then 6a+6c).
Either way: `preview_start fms-dev`, open `/compose-lab`, click around 2 min, then go.
