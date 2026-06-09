# HANDOFF — Editor UI phase (Layer-2 visual composition)

**Written 2026-06-08** at the end of the atomization auto-pass, with ~20% budget —
deliberately STOPPED before building the editor UI (too big to finish responsibly in
that budget) and wrote this grounded spec instead. Next session has full budget: execute
this. Read WITH memory notes `three-layer-editor` (the model) + `gumroad-progress`.

---

## 0. The decision & why this phase

The 3-layer data model is BUILT and verified (every gumroad page renders its primary
composite from Layer-1 atoms via `<Composition>`). What's missing is the **editor UI** that
lets an admin (รุ่นน้อง) actually DO the Canva-like thing: pick atoms from the library,
arrange them, group into a Layer-2 component, edit each piece, save. Until that exists, the
composition model is invisible to the user — it only powers the public render.

**This phase = make the descriptor manipulable in the admin editor.** The data model is the
stable substrate; the UI is additive on top (library-first, per `element-first-workflow`).

---

## 1. What already exists (VERIFY in Task 0 — do not trust this from memory)

| Thing | Path | State |
|---|---|---|
| Composition renderer | `src/components/elements/_composer/Composition.jsx` | renders `frame`/`atom`/`node` descriptor tree → responsive flex/grid |
| Atom registry (palette source) | `src/components/elements/_composer/registry.js` | 10 atoms (image, badge, text-title/label/body/meta/stat/plain, chip, button-primary) |
| Layer-2 composites | `src/components/composites/<name>/gumroad.jsx` | party-card, stat-card, member-tile, vote-party-card, info-card — each exports `buildX()` (descriptor) + a component |
| Existing palette UI | `src/components/admin/editor/ElementLibraryPanel.jsx` | browse 47 named-slot TYPES by category + **variant-swap only**. NO placement/insert. "slot placement deferred — needs slot architecture" (its own words) |
| Existing element registry (named slots) | `src/components/elements/registry.js` | 47 types + 7 categories. SEPARATE from the `_composer` atom registry — reconcile or bridge |
| Generic semantic types | `src/components/admin/editor/elementTypes.js` | 16 types w/ forward-compat `layout`/`componentLibrary` fields ("Phase 2.5+ wires them") — these ARE the atom types conceptually |
| Editor state | `src/components/admin/editor/useEditorState.js` | READ FIRST — how selection/config/page-layout are held |
| Selection seam | `src/components/admin/editor/EditorElement.js` | wraps an element → selectable/hoverable in editor; pages pass `Wrap` |
| Editor host | `src/components/admin/editor/PageDesignTab.js` (large) | the admin "ออกแบบหน้าเว็บ" tab |
| Property editing | `src/components/admin/editor/PropertyPanel.js` | per-element field controls |
| Per-page editor previews | `src/components/admin/{Candidates,Results,...}EditorPreview.js` | static previews (P-LOG-002/004 — no raw auth/redirect) |

**Two registries exist** (`elements/registry.js` named-slots vs `_composer/registry.js`
atoms). Decide the bridge in Task 0 — likely: atoms/composites become first-class library
entries the palette can browse + INSERT (not just variant-swap).

---

## 2. Build order (safe increments — verify each in browser before next)

**Task 0 — audit.** Read `useEditorState.js`, `PageDesignTab.js`, `PropertyPanel.js`,
`EditorElement.js` fully. Confirm: how a page's element configs are stored, how selection
flows, how the public page receives editor props. Paste findings. STOP if reality diverges
from §1.

**Step 1 — Palette can list atoms + composites.** Extend `ElementLibraryPanel` (or a new
tab) to list `_composer/registry.js` atoms + the composites, with live mini-previews. No
insert yet — just browse. Verify it renders.

**Step 2 — Render a page from a descriptor in the editor.** Pick ONE page (candidates — it's
the cleanest, already a Layout shell + party-card composite). Store its body as a descriptor
in editor state; render via `<Composition>` in the editor preview. Verify byte-identical to
the live page.

**Step 3 — Select an atom inside a composite.** Make `<Composition>` emit selectable nodes
in editorMode (reuse the `EditorElement` seam pattern — wrap atoms when an `editorMode` flag
is passed through the descriptor/renderer). Click an atom → it highlights + becomes the
selection. Verify.

**Step 4 — Edit selected atom's props.** Wire `PropertyPanel` to the selected atom: text
(children), tone, style fields. Change → descriptor updates → live preview updates. Verify.

**Step 5 — Insert / delete / reorder atoms.** Drag (or click-add) an atom from the palette
into a frame; delete; reorder within a frame. Compile to flex order (NO absolute coords —
Hybrid C). Verify responsive stays intact.

**Step 6 — Group / ungroup (the Canva core).** Multi-select atoms → "group" wraps them in a
new `frame` node (a Layer-2 component in-the-making) → "save as component" snapshots it into
the composites library. Ungroup = inline a frame's children. Verify.

**Step 7 — Persist.** Save the page descriptor (extend the page-layout JSON / SystemConfig
or a new field) + the saved-component library. Reload → persists.

Each step is shippable on its own. If budget runs low, stop at a completed step.

---

## 3. The data-model contract (STABLE — build the UI against this)

Descriptor node (rendered by `_composer/Composition.jsx`):
```
frame: { kind:'frame', as?, className?, layout?:{display,direction,gap,align,justify,wrap,columns}, style?, attrs?, href?, children:[] }
atom:  { kind:'atom', type, variant?='gumroad', props, style? }      // type ∈ _composer/registry.js
node:  { kind:'node', render }                                        // raw ReactNode escape hatch (icons/bespoke)
```
- `layout` compiles to flex/grid inline (responsive; never absolute — Guardrail #2 / Hybrid C).
- Atoms accept a `style` passthrough; composites TUNE atoms via scoped class overrides
  (`.el-card .el-title{…}`), not inline hacks — the UI's "style" edits should follow this.
- A Layer-2 component = a `frame` subtree + its own scoped CSS. "Lock/save" = snapshot it.

---

## 4. Open questions (decide with the user before/at Step 6)

1. **CSS authoring in-editor.** Composites today hand-write scoped CSS. Does the editor let
   admins edit that (Expert tier, PHASE3 D-305) or only props + a constrained style panel?
2. **Atom variants.** Atoms are single-variant ("gumroad") tuned to first use. A real variant
   taxonomy (or a style-prop system) is needed for atoms reused across very different looks.
   Decide before the palette implies "any atom anywhere looks right".
3. **Two registries** — merge `elements/registry.js` (named slots) into the atom/composite
   library model, or bridge? Affects how the palette + PropertyPanel resolve a selection.
4. **Persistence shape** — extend `pageLayout` JSON vs a new `pageDescriptor` field vs the
   `Template` model. Don't migrate the working named-slot configs until the new path is proven.

---

## 5. Discipline (from CLAUDE.md — these bit past sessions)

- Task 0 audit mandatory; STOP + paste evidence on divergence (Rule 1, P-LOG-005).
- No raw auth/redirect in editor previews — static EditorPreview (P-LOG-002/004).
- grep for orphan/duplicate Wraps before adding editor seams (P-LOG-001/006).
- `.next` manifest race on Windows → `preview_stop` + `rm -rf .next` + restart on HMR rot.
- Byte-faithful gate: editor render of a page MUST match its live render (Rule 4).
- Commit only when the user asks. Don't delete the temp 2nd party (candidates grid needs 2+).
