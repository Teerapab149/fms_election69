# PROGRESS.md

**Last saved:** 2026-06-01
**Branch:** `new-version`

---

## 🌅 SESSION HANDOFF — read this first (for 2026-06-02 session)

**Pillar 3 (Editor depth) shipped — Tier 2 full + Tier 3 custom CSS.** 3 atomic commits
on `new-version` (on top of `4a8945f`, which was pushed). Build PASS, browser-verified
with the user logged in, live page restored clean, dev server stopped.

### ✅ Done today (Pillar 3)
1. **Tier 2 depth (no-code).** `ElementVarsPanel` regrouped into 4 collapsible sections
   exposing ALL 17 `voteCTA-button` Layer 2 vars (was 6). New visual builders in
   `controls/SharedInputs.js`: `GradientPicker` (dir + 2–3 stops + on/off),
   `ShadowControl` (presets + X/Y/blur/opacity), `PxSlider` (emits `"<n>px"`),
   `SelectInput`. banner-section unchanged (3 vars). Pure-additive — reused the whole
   existing `elementVars` cascade.
2. **Tier 3 custom CSS (expert).** New `elementCss` slice in `useEditorState` (mirrors
   `elementVars`); `buildElementCss(map, scope)` helper; `CustomCssEditor.jsx`
   (collapsed, dev warning, declarations-only textarea); wired through PropertyPanel,
   PageDesignTab (editor inject + payload + load), HomeContent (live inject), and API
   validation. Stored at `pageLayout.elementCss.home[id]`.
3. Verified live: text-transform var + `transform: rotate(-2deg)` custom CSS apply in
   editor AND on the real `/` page, persist through Publish→reload, reset clean.
   P-LOG-062 (Tier 3 scoping) + P-LOG-063 (don't harvest admin token) written.
4. **Tier 2 honesty + functional fix (P-LOG-064).** Found 2 controls I'd just shipped
   were dead on voteCTA: `buildButtonStyle` never read `--btn-bg-gradient` and had no
   `--btn-shadow` fallback. Wired both as real Layer 2 fallbacks (Layer 3 config still
   wins; `"none"` stays explicit). Added an honest info note in ElementVarsPanel for
   stateful elements → per-state colour/gradient/shadow is edited in the Stateful
   Gallery; these vars are fallbacks + text controls. KEY INSIGHT: for a stateful
   element, single-value Tier 2 vars are the wrong layer — per-state config is the
   real editing surface.
5. **banner-section Tier 2 depth (the VISIBLE win).** Added `--banner-shadow` +
   `--banner-border-width` (variant reads them; defaults byte-faithful = shadow-2xl /
   1px), declared in all 4 templates, expanded the schema (border colour/width slider
   + radius + shadow builder + bg). Verified VISIBLY: on the Default variant, the
   shadow builder ("คม" → hard 5px 5px 0) and border-width slider (1px→6px) actually
   change the banner frame. This is the honest Canva payoff — non-stateful elements,
   where single-value vars truly drive the look. (Not published; editor state only.)
6. **Stats sub-card bg controls + editor nesting fix (P-LOG-065).** Wanted bg controls
   on the stats sub-cards (bg unmasked — cfg.backgroundColor unset since Day 6). Found
   they were UNSELECTABLE: HomeContent wrapped the whole StatsBlock as `stats-voted-card`,
   and `EditorElement`'s `onClickCapture` (outermost-first) swallowed every sub-card
   click. Fix: removed `stats` from `WRAP_ID_MAP`, moved the `stats-voted-card` wrap
   inside StatsBlock around just the hero card (added optional `className` to
   `EditorElement` to keep the hero's `col-span-2`). Added `--stats-card-bg` +
   `--stats-card-bg-gradient` to `buildCardStyle` (var fallback, byte-faithful) +
   `data-element` on both sub-cards + schema entries. Live `/` verified: bento layout
   intact, sub-cards byte-faithful white. NOTE: in-browser editor click-selection NOT
   yet confirmed (admin session expired; user delegated) — verify next session: each of
   the 3 stats cards selects independently + sub-card bg control changes the card.

7. **ROADMAP.md created** + started **#1 multi-page tokenization (Tier-1, slice 1a)**:
   tokenized `success` (12) + `candidates` (6) pages — hardcoded brand `#8A2680` →
   `var(--color-primary)` (per-party `theme.main` preserved). Build PASS + grep-clean.
   ⚠️ Visual theme-flip NOT confirmed: editor needs login (expired), DB-flip needs
   consent (classifier-blocked), candidates redirects (1 party), success is auth-gated.
   Verified by build + grep + parity with the already-verified results page (Pass 3,
   same `[var(--color-primary)]` in `.fms-app`). **Next: vote flow + closed — but those
   should be visually verified (ask user to log in) since vote is the critical path.**

### ⚠️ Known debts / gotchas (carry forward)
- **API 400 for `elementCss` NOT exercised live** — auth-gating needs a token; verified
  by code-mirror vs the shipped `elementVars` gate (P-LOG-063). Low risk.
- **Tier 2 visible effect is bounded by element tokenization** (P-LOG-054): on voteCTA,
  `--btn-bg`/`--btn-bg-gradient`/`--btn-shadow`/padding are masked by Layer 3 config, so
  they were verified via the emitted CSS rule, not the rendered button. `--btn-text-transform`
  / `--btn-letter-spacing` ARE consumed unconditionally (default.jsx:109-110) → fully visible.
- Only voteCTA-button (17) + banner-section (3) have Layer 2 vars. Other elements need
  vars declared in templates before they get a Tier 2 panel (no fake knobs).
- shadow color round-trip is lossy (rgba→hex for the picker) — acceptable for a builder.
- DB-active (non-built-in) template still falls back to classic in editor preview (old debt).

### 🧭 Tomorrow — pick ONE
The proven pattern now (banner-section is the worked example): pick a NON-stateful element →
confirm its variant component CONSUMES `var(--x)` (P-LOG-064) and the prop is VISIBLE (not
hidden behind an image / not masked by Layer 3) → add the var to all 4 templates byte-faithful
→ expand ELEMENT_VAR_SCHEMA. Repeat to grow the no-code surface honestly.
1. **Tier 2 for more non-stateful elements** — e.g. stats cards (visible bg/gradient),
   meet-section, headings. Each needs vars declared + variant wired + schema entry.
2. ~~Element tokenization completeness for voteCTA~~ — EXPLORED + rejected: voteCTA's
   per-state gradient/shadow ARE the design (Layer 3), edited via the Stateful Gallery,
   not single Tier 2 vars. Flattening them = regression. Don't.
3. **Library slice 2** — per-page inventory ("หน้านี้ใช้ component อะไรบ้าง").
4. **Pillar 2 slice 2** — page thumbnails (needs scaled render pipeline; bigger).

---

## (previous) SESSION HANDOFF (for 2026-06-01 session)

**Branch `new-version`. 4 commits today, ALL LOCAL (not pushed yet):**
```
86e110b  fix(editor): close P-LOG-051 — thread resolvedTemplate into live preview
282e48b  feat(editor): Element Library (Pillar 1, slice 1) — catalog + variant swap
e20fd5f  fix(editor): stop Live Preview hover flicker (component-in-render remount)
91947a9  Pillar 2 (gallery slice 1): template metadata + detail modal
```
(prior HEAD was `a0bf300`.) → **First action tomorrow: decide whether to `git push`.**

### ✅ Done today
1. **Pillar 2 gallery slice 1** — template cards show metadata (element/page count,
   creator, year, derived swatch) + a lazy-loaded detail modal (pages + element
   list + apply). Page THUMBNAILS deferred.
2. **Hover flicker fixed (root cause)** — `Wrap` was defined inside render in 9
   files → remount on every hover → animation replay. Fixed with stable
   `useCallback`+`useRef`. User confirmed gone. (P-LOG-059)
3. **Element Library (Pillar 1) slice 1** — `ElementLibraryPanel.jsx` in the left
   rail: 47 types by Thai category + search; multi-variant types (voteCTA, banner)
   expand to live VariantPicker + apply. (P-LOG-060)
4. **P-LOG-051 closed** — editor preview now threads `resolvedTemplate` →
   config-driven designs (voteCTA gradient, stats gradients) render byte-identical
   to production. (P-LOG-061)

### 🧭 Tomorrow — pick ONE (recommended order)
The agreed north star is the Canva-grade "คลังสมบัติ" editor (VISION Pillars 1–4).
Vision verified with user this session — A/B/C confirmed: no-code + expert Tier 3
expand; gallery both per-page AND per-category; drag wanted but swap-first.

1. **(Recommended) Editor depth — Pillar 3 Tier expansion (the "A" answer).**
   More no-code controls per element (gradient/shadow/padding/font/icon pickers)
   + an "ขั้นสูง" expand = Tier 3 custom CSS for experts. This is what makes "แก้
   design ทั้งหมดของปุ่มแบบ Canva" real. Biggest payoff for the daily editing UX.
2. **Library slice 2 — per-page inventory.** "หน้านี้ใช้ component อะไรบ้าง" view
   (the per-page axis of B). Smaller; complements slice 1.
3. **Pillar 2 slice 2 — page thumbnails** (Canva horizontal scroll). Needs an
   off-screen/scaled template-render pipeline — bigger lift.
4. **Templates honesty** — modern-dark/playful/minimal are THIN STUBS (color
   overrides of classic, not 47 bespoke designs). Making them genuinely distinct
   = many sessions, one at a time. The user knows; do for real, not fake.

### ⚠️ Known debts / gotchas for next session
- voteCTA **glow/shine** animation (extra Tailwind layers in `VoteCTABlock.legacyClassName`)
  may not be 100% in editor preview — config gradient/shadow now correct, animation TBD.
- **DB-active templates** fall back to classic in the editor preview
  (`editorEffectiveTemplate` only knows `BUILT_IN_TEMPLATES`). Built-ins (4) fine;
  a DB template active → needs to fetch its full object. Slice for later.
- Tokenization type-B (config-driven recolor) still deferred (TOKENIZATION_NOTES.md).
- `.next` corrupts under sustained HMR on Windows (~hit 2× today). Recovery:
  `preview_stop` → `rm -rf .next` → `npm run build` → `preview_start` → warm home.
- Admin login = `admin_token` cookie, expires ~2h. If verification needs the
  editor and it's expired → just ASK the user to log in (don't mint tokens — feedback.md).

### Where to read context (in order)
VISION.md → ADR-001 → DECISIONS.md (now through P-LOG-061) → this handoff →
`.specs/ADMIN_UX_NOTES.md` + `.specs/TOKENIZATION_NOTES.md`.

---

## Editor preview fidelity — P-LOG-051 fully closed ✅ (P-LOG-061)

**User complaint:** voteCTA is a rich gradient button on the live page but flat in
the admin preview. (Day 11's "close" only added the token scope — not enough.)

**Root cause:** the editor mounted `<HomeContent editorMode>` with
`resolvedTemplate = null` → config-driven designs (voteCTA gradient/shadow, stats
gradients) had no template config to resolve → flat. Hardcoded-identity variants
(chunky-stamp) still showed, masking the gap.

**Fix (PageDesignTab.js):** extracted `editorEffectiveTemplate` (active base +
token + var edits — the object already feeding `editorTokenStyles`) and threaded
it as `resolvedTemplate` through LivePreview → HomeContent.

**Verified:** editor voteCTA computed style now = `linear-gradient(to right,
#691E61,#8A2680,#C026D3)` + `rgba(138,38,128,0.4) 0 10px 15px -3px` shadow + 16x40
padding — byte-identical to production. Console clean.

---

## Pillar 1 — Element Library, slice 1 (catalog browser + variant swap) ✅ (P-LOG-060)

The "คลังสมบัติ" — an organized, browsable catalog of every element type.

**Files:** `src/components/admin/editor/ElementLibraryPanel.jsx` (new) +
`PageDesignTab.js` (import + mount in left rail, ungated/global).

**What ships:**
- Collapsible panel: 47 element types grouped by registry category, relabeled to
  Thai (ปุ่ม / แบนเนอร์ / ข้อมูล / ข้อความ / รูปภาพ); empty navigation/layout hidden.
- Search filter (name/description/id).
- Per type: variant-count + "ตามสถานะ" (stateful) badges.
- Multi-variant types (voteCTA-button:3, banner-section:2) expand inline to the
  existing `VariantPicker` — real live mini-previews; click applies via
  `editor.setElementVariant` → editor preview + live page reflect the swap.
- Honest: 45 single-variant types are read-only rows; library grows as devs add
  variants (heritage). NO fake previews.

**Verified (browser):** 5 Thai categories (6/3/8/26/4 = 47); search "countdown"→1;
expand voteCTA → 3 live previews; apply Chunky Stamp → editor preview voteCTA
renders border 3px + hard `5px 5px 0 #000` shadow + uppercase + fw 800.

**Deferred (slice 2+):** per-page inventory; live previews for more types;
drag-new-element onto slot (needs slot architecture).

---

## Editor Live Preview — hover flicker fix ✅ (P-LOG-059)

**User report:** hovering an element in the admin "ออกแบบหน้าเว็บ" Live Preview
flickers รัวๆ; editor-only (public page smooth); user guessed it was animation.

**Root cause:** `const Wrap = (...) => …` was defined **inside** the component
render in 9 files → new function identity each render → React remounted the whole
wrapped subtree on every re-render → animations replayed. Hover fires
`setState(hoveredElement)` → re-render → remount → flicker.

**Fix (9 files):** stable `Wrap` via `useCallback([])` + live state from `useRef`.
Hover = re-render, not remount. Call sites unchanged.
- HomeContent.js, blocks/StatsBlock.js, MeetCandidatesCard.js (home chain — user-confirmed fixed)
- admin/{Vote,Results,Closed,Success}EditorPreview.js, vote/MultiPartyView.js, vote/SinglePartyView.js (sweep — same latent bug on other pages)

**Also (P-LOG-058, PageDesignTab.js):** hardened `LivePreview` fit against
ResizeObserver churn — idempotent `setFit` (tolerances) + stable effect deps +
`scrollbar-gutter: stable`. NOTE: this was NOT the flicker cause (I mis-diagnosed
first, then re-traced to the Wrap remount) — kept as a real perf hardening.

**Verification:** build PASS (clean rebuild after `.next` HMR corruption ×2);
"remount detector" (mark DOM node → repeated hover → assert `isConnected`) → all
wraps survive on home + vote + results + closed + success; user confirmed home
flicker gone with real cursor.

**Lesson burned in:** never define a component inside render (remount trap);
reproduce the REAL trigger repeatedly (a single synthetic event hid it once).

---

## Pillar 2 — Template Gallery, slice 1 (metadata + detail modal) ✅

**Goal (VISION Pillar 2):** turn the bare template *picker* into a *gallery* —
metadata on cards + a detail view. This slice = metadata + detail modal.
**Page-thumbnail rendering deferred** (needs an off-screen/scaled render pipeline).

**Files (2, additive — no new dep / route / DB table):**
- `src/components/admin/editor/templates/index.js` — `listTemplates` enriched:
  `elementCount` / `pageCount` / `authorName` for all rows; DB rows pull the
  JSON blobs + `author{name}`, compute counts + `deriveColorSwatch(theme)`
  (tokens → legacy colors → brand fallback), then **strip the blobs** from the
  list payload (lean). Built-ins compute from their in-memory object.
- `src/components/admin/PageDesignTab.js` — `TemplateCard` → keyboard-accessible
  `<div role="button">` with metadata chips (`47 element · 6 หน้า · ต้นฉบับ`)
  + "ดูรายละเอียด" trigger; new `TemplateDetailModal` lazy-fetches the full
  record via `GET /api/admin/templates/:slug` (swatch, description, metadata grid,
  badges, Thai page chips, scrollable 47-element list with `:variant` tags,
  apply button reusing the confirm flow — hidden when template already active).

**Verification:**
- Build: `✓ Compiled successfully`, exit 0, zero errors/warnings.
- Logic unit test: classic → 47 el / 6 pg; `deriveColorSwatch` fallback chain OK.
- In-browser (real admin, user logged in): chips render on all 4 cards · detail
  modal opens + lazy-loads · per-template swatch correct (modern-dark header
  `#06b6d4`/`#8b5cf6`, not default) · apply hidden on active / shown on non-active
  · apply→confirm wiring works · console clean (only pre-existing Image `sizes`).

**Lessons:** P-LOG-056 (list payload hygiene: derive-then-strip + lazy detail
fetch; `<div role=button>` so nested detail button is valid HTML),
P-LOG-057 (don't mint tokens to bypass admin login — ask the user).

> Note: the same-day-after-Day-11 reflections referenced "P-LOG-052..057"
> pending append, but only 052–055 had been written. This session claims
> 056–057; any Pillar 4 / Admin-UX lessons still to be written should use 058+.

---

## Same-day follow-on (after Day 11) — Admin UX + Tokenization

**Admin editor UX (PageDesignTab) — Phase 1 ✅ + Phase 2 partial.**
See `.specs/ADMIN_UX_NOTES.md` for full analysis + remaining plan.
- P1.1 `33a977f` — fix horizontal overflow (admin shell `min-w-0` + grid fr units)
- P1.2 `4f09840` — sticky action topbar (pinned Save/Publish)
- P1.3 `9bd2eac` — PropertyPanel pinned to right column (instant feedback on select)
- P2.1 `1f079db` — canvas fit-to-container (ResizeObserver, design 1280px) replaces scale hack
- P2.3 `6e1f8bb` — visual polish (unify accent icons to brand; Theme Tokens collapsed default)
- P2.2 `0c06658` — **LEFT RAIL done** — 3-zone [sidebar | rail: Template+Theme+Pages+Sections | work: canvas+properties]. Not a literal 3rd column (sidebar 256px would squeeze canvas); rail holds setup. **Admin UX Phase 1+2 COMPLETE.**

**Tokenization (make the Day 11 token editor recolor live pages).**
See `.specs/TOKENIZATION_NOTES.md` for backlog + patterns.
- Pass 1 `66889f0` — HomeContent hero gradients + year badge + StatsBlock icon → var(--color-primary)
- Pass 2 `cc8b5fa` — Navbar (13) → var(--color-primary,#8A2680) with fallback
- `cd6616c` — **token scope moved to layout level → every page inherits theme** (the unblock)
- Pass 3 `93d4472` — /results page (ResultsStatsBar 5 + ResultCard 5 + demographics icon)
- 🔜 remaining = type-B config (classic.js voteCTA/stats-card/vote-badge/success) — has color-math landmines (e.g. `${shadowColor}66`); modest payoff. Deferred.

**Pillar 4 — Save as New Template (heritage) ✅ `53705aa`.** Snapshot the
current design (theme tokens + element variant/config/vars + pages, deep copy)
→ POST existing /api/admin/templates → appears in picker → applyable. The
10-year heritage feature. E2E verified (save → picker → apply).

All verified in-browser + pushed (`486efad..53705aa`). New lessons (P-LOG-052..057
+ patterns) noted in reflections; pending append to DECISIONS.md.

---

## Phase 1 Week 3 Day 11 — Theme Token Editor + Tier 2 Vars (Editor Tier 1+2) ✅ COMPLETE

**Day 11 (Tier 1 theme token editor + Tier 2 per-element vars panel): ✅ DONE.**
Admin can now recolor the whole template (Layer 1 tokens) and override a
single element's style (Layer 2 vars) from the editor — both live, persisted,
validated. ADR-001 "Day 10-11 Editor Tier 1" block is complete.

| Step | Scope | Commit |
|------|-------|--------|
| A | useEditorState themeTokens + elementVars slices | `c7c227d` |
| Pre-step | Editor preview emits `.fms-app` token scope (close P-LOG-051) | `8ef4508` |
| B | TokenEditor (Tier 1) — 15 tokens, grouped, live | `e88076f` |
| C | API persist + validate themeTokens/elementVars (400 on bad) | `72a4ab5` |
| D | HomeContent live overlay (effectiveTemplate) — **Layer 1 checkpoint** | `d77c9dd` |
| E+F | ElementVarsPanel (Tier 2) + editor/live overlay | `d496674` |
| Final | DECISIONS (P-LOG-052..055) + PROGRESS | (this commit) |

### What ships
- **TokenEditor (Tier 1, Layer 1):** collapsible card in PageDesignTab, 7 colors
  + 4 radii + 2 shadows + 2 fonts. Edit → whole page recolors live. Per-token
  + reset-all. Stored sparse in `pageLayout.themeTokens`.
- **ElementVarsPanel (Tier 2, Layer 2):** in PropertyPanel next to the variant
  picker; curated vars for voteCTA-button (6) + banner-section (3). Edit →
  only that element changes. Stored in `pageLayout.elementVars.home[id]`.
- **Cascade (one overlay, both channels):** `effectiveTemplate` in HomeContent
  merges variant > tokens > vars onto the resolved template; editor preview
  builds its `.fms-app` scope from `editorTokenStyles` (BUILT_IN_TEMPLATES +
  live edits). P-LOG-051 closed.
- **API:** 400 on unknown token key / empty value / non-`--` var name, before persist.

### E2E (browser) — all pass
Tier 1: edit Primary → editor + live `--color-primary` #8A2680→#1188ff → save
→ DB → reload persists → reset-all restores. Tier 2: edit voteCTA `--btn-bg`
→ editor + live element scope #00aa55 → save → DB. API 400s verified.

### Key lessons (P-LOG-052..055)
- Never `npm run build` while the dev preview server runs — shared `.next`
  corrupts → 500s (P-LOG-052). Stop → rm .next → build → restart.
- Editor token scope: build `<style>` upstream, leave config-resolution
  untouched (P-LOG-053).
- Layer 2 template vars are var() refs, not hex → Tier 2 shows override-or-empty
  for colors; visible recolor bounded by element tokenization (P-LOG-054).
- One effectiveTemplate overlay now merges variant+tokens+vars (P-LOG-055).

### Deferred
- Element tokenization completeness (replace hardcoded `#8A2680` in home blocks
  with var(--color-*)) so token edits fully propagate visually
- Tier 3 (Layer 3 custom CSS), save-as-new-template (heritage), layout slots

---

## Phase 1 Week 3 Day 10 — Variant Picker UI (Editor Tier 1 Part 1) ✅ COMPLETE

**Day 10 (variant picker with live mini-previews + persistence): ✅ DONE.**
Admin can now swap an element's variant from the editor UI — no template
file edits. The library mental model (VISION D12) is now interactive.

| Step | Scope | Commit |
|------|-------|--------|
| chore | Fix pageLayout prop drop into PropertyPanel (audit Bug 1) — all 4 mounts | `d8ee876` |
| A | `useEditorState` elementVariants slice (state/setters/reset/dirty/baseline/loader) | `253fcb8` |
| B | `VariantPicker.jsx` (live previews) + PropertyPanel mount (both branches) + PageDesignTab wiring | `883b460` |
| C | PUT `/api/admin/page-layout` validates elementVariants via registry `hasVariant` (400 reject) | `d4f6346` |
| D | HomeContent `effectiveTemplate` overlay + livePageLayout/payload/fetchLayout wiring + e2e | `6055411` |
| Final | DECISIONS (P-LOG-048..051) + PROGRESS | (this commit) |

### What ships
- **VariantPicker** — one card per registered variant, each a LIVE mini-render
  of the real variant component with MOCK_DATA (notVoted state). Self-contained
  PREVIEW_VARS token scope (classic flavor) so previews render outside `.fms-app`.
  "คืนค่า Template" reset link shows only when an override exists. Hidden for
  single-variant elements.
- **Cascade:** `elementVariants[id]` > template default > `'default'`, resolved
  once in HomeContent (`effectiveTemplate`) for both live + editor channels.
- **API:** rejects unknown element/variant with 400 before persist.
- **Persistence:** stored additively in `SystemConfig.pageLayout.elementVariants`
  (no migration). Loaded as baseline on editor open; cleared on template apply.

### E2E (browser, 10 steps + edge cases) — all pass
voteCTA picker (stateful element) → pick chunky-stamp → editor preview + live
home both render it → save → DB carries it → reload persists → banner minimal-line
picked + saved together → reset voteCTA → falls back to default while banner
override survives → invalid DB variant falls back to default + console warn →
API 400 on fake-variant/unknown-element/bad-shape.

### Key lessons (P-LOG-048..051)
- Editor lives outside `.fms-app` → picker needs its own token scope (P-LOG-048)
- voteCTA is stateful → picker must mount before the stateful-vs-flat branch;
  spec's literal snippet would have failed (P-LOG-049)
- Registry-driven API validation rejects before persist (P-LOG-050)
- Editor home preview lacks token scope → var()-based identity can collapse
  there (live page is faithful); D11 follow-up (P-LOG-051)

### Deferred to Day 11
- Theme token editor (Layer 1 color pickers)
- Per-element Layer 2 vars panel
- Editor-preview token scope unification (P-LOG-051)

---

## Phase 1 Week 3 Day 9b — voteCTA Variants (minimal-pill + chunky-stamp) ✅ COMPLETE

**Day 9b (3-variant family on stateful element + state fallback helper +
4×3 matrix verification): ✅ DONE.** voteCTA-button library content
expanded from 1 → 3 variants. Pattern proven on stateful element with
6 states. Variant infrastructure ready for Day 10+ (Editor + Library UI).

| Step | Scope | Commit |
|------|-------|--------|
| A | `stateMap.js` — semantic state-fallback helper (login→notVoted, closed→ended, paused→voted) | `988146d` |
| B | `minimal-pill.jsx` — thin 1.5px outline + transparent bg + hover fill + index.js wire + registry update | `7638211` |
| C | `chunky-stamp.jsx` — 3px hard border + 5px hard offset shadow + bold uppercase + README update | `6ecff3d` |
| Final | DECISIONS (P-LOG-044..047) + PROGRESS | (this commit) |

### Variants (3)
- **default** (Day 9a) — gradient + glow + shine; 6 states explicit
- **minimal-pill** — transparent bg, primary-color outline + text, pill radius, hover fills with primary (text inverts to surface)
- **chunky-stamp** — Gumroad-style; 3px black border, hardcoded `5px 5px 0 #000` shadow (NO blur), bold uppercase + 0.05em tracking, hover lifts(-2,-2) + shadow grows to 7px 7px, active(0,0) shadow gone

### State coverage
| Variant       | login    | notVoted | voted | ended | closed | paused |
|---------------|----------|----------|-------|-------|--------|--------|
| default       | explicit | explicit | explicit | explicit | explicit | explicit |
| minimal-pill  | →notVoted | explicit | explicit | explicit | →ended | →voted |
| chunky-stamp  | →notVoted | explicit | explicit | explicit | →ended | →voted |

Derived states (→) inherit STYLE from the mapped primary; TEXT/icon/href
stay on the ORIGINAL state (P-LOG-044). E.g. paused borrows voted's
outline/shadow but still says "ระบบปิดปรับปรุง / Maintenance".

### 21-cell verification matrix

**Tier 1 (12 cells, 4 templates × 3 variants × notVoted)**

| Template    | default       | minimal-pill        | chunky-stamp        |
|-------------|---------------|---------------------|---------------------|
| classic     | ✓ live anchor | ✓ live (login=notVoted via stateMap) | ✓ live (login=notVoted) |
| modern-dark | ✓ transitive (Day 9a) | ✓ transitive | ✓ transitive |
| playful     | ✓ transitive (Day 9a) | ✓ transitive | ✓ transitive |
| minimal     | ✓ transitive (Day 9a) | ✓ transitive | ✓ transitive |

Live cells (3): each variant's PRIMARY_STYLES.notVoted block produced
correct DOM (data-element="voteCTA-button" + computed styles match
declared values + Layer 1 tokens chain through). Other 9 cells follow
transitively because variants are template-agnostic — same `var(--color-X)`
references resolve to each template's Layer 1 differences. See
P-LOG-046 for rationale.

**Live data captured:**
- classic + default + login: `linear-gradient(to right, rgb(105,30,97), rgb(138,38,128), rgb(192,38,211))`, color rgb(255,255,255), padding 16px 40px, font-size 18px, font-weight 700, box-shadow `rgba(138,38,128,0.4) 0 10px 15px -3px`, border-radius 12px
- classic + minimal-pill + login(→notVoted): bg transparent (rgba(0,0,0,0)), color rgb(138,38,128) (=#8A2680 primary), border 1.5px solid #8A2680 (Chrome snaps to 1px @ DPR 1), box-shadow none, radius 12px (Layer 3 xl), padding 16px 40px
- classic + chunky-stamp + login(→notVoted): bg rgb(138,38,128), color white, border 3px solid rgb(0,0,0), **box-shadow `rgb(0,0,0) 5px 5px 0px 0px`** (HARD, no blur ✓), text "เข้าสู่ระบบ / SIGN IN" (uppercase applied), font-weight 800, letter-spacing 0.9px (= 0.05em × 18px)

**Tier 2 (6 cells, classic × 3 variants × {voted, ended})**

Deterministic from PRIMARY_STYLES blocks (no runtime branching):

| Variant       | voted                                                 | ended                                                  |
|---------------|-------------------------------------------------------|--------------------------------------------------------|
| default       | gradient #0369a1→#0284c7→#38bdf8, text white          | gradient #334155→#1e293b→#0f172a, text #94a3b8         |
| minimal-pill  | transparent bg, muted text+border (#64748b), 1.5px, opacity 0.75, cursor not-allowed | transparent bg, accent text+border, 1.5px |
| chunky-stamp  | surface bg, text-color border, 3px, 3px 3px 0 shadow, opacity 0.85, cursor not-allowed | accent bg, surface text, 3px black border, 5px 5px 0 #000 shadow |

**Tier 3 (3 cells, fallback semantic mapping)**

`stateMap.js` unit test (Step A sanity output, paste from Part 1):
```
login   -> notVoted (primary: false)
closed  -> ended    (primary: false)
paused  -> voted    (primary: false)
```

Variant render path is `PRIMARY_STYLES[mapToPrimaryState(currentState)]`
— deterministic lookup, no branching to leak. P-LOG-046 documents why
this is sufficient for the time-pressured tier.

**Console clean:** no `[voteCTA-button]` warnings across live cells.
Only pre-existing Next.js Image `sizes` warnings (unrelated).

### Two bugs caught + fixed (live verify)

Both same pattern — see P-LOG-045 for the rule:
1. **minimal-pill (Step B)**: initial `color: var(--btn-text, var(--color-primary))` resolved to white (templates always set `--btn-text` to `--color-surface`). White-on-transparent = invisible. Fix: hardcode `var(--color-primary)`, stop spreading Layer 3 color fields (they're designed for filled defaults).
2. **chunky-stamp (Step C)**: initial `boxShadow: var(--btn-shadow, 5px 5px 0 #000)` resolved to default's soft `0 4px 12px rgba(138,38,128,0.25)` — no stamp. Same for `borderColor: var(--btn-border-color, #000)` → transparent. Fix: hardcode both. Layer 2 vars are *the default variant's* tokens; cross-variant fallback breaks identity.

### Operational notes

- Hit `.next` manifest race twice on Windows during Step C (P-LOG-027/035). Stop + nuke `.next` + cold restart + sleep 20s resolved both times.
- Final preview server stopped at the end of Step C.

### New lessons (DECISIONS.md)
- P-LOG-044 — State derivation via semantic mapping: STYLE follows mapped state, TEXT/icon/href stay on ORIGINAL state
- P-LOG-045 — Layer 2 vars are variant-scoped: cross-variant fallback breaks identity (chunky-stamp shadow + minimal-pill text)
- P-LOG-046 — Tiered verification extended for multi-variant matrix (live anchor + transitive)
- P-LOG-047 — Spec example for variant data flow was wrong; default.jsx is the source of truth

### Next (Day 10-11): Editor Tier 1
- Variant picker UI in PropertyPanel (reads registry — already decoupled per Day 8)
- Token editor UI (color pickers for Layer 1 — drives all variants uniformly)
- Per-element vars panel (Layer 2 editing — currently template-locked)
- Unified pipeline in place (D11: live + preview share the same `<style>` block)
- voteCTA-button now has 3 variants ready to be presented as Library cards

---

## Phase 1 Week 3 Day 9a — voteCTA-button Foundation + Default Variant ✅ COMPLETE

**Day 9a (17 Layer 2 vars + element folder + 1:1 default extraction +
stateful preservation): ✅ DONE.** Stress-test of the variant pattern on
the most complex element (stateful, 6 election states, ~108 config entries
across 4 templates). 1:1 extraction proven byte-faithful via live anchor
+ Layer cascade proof. Day 9b will add minimal-pill + chunky-stamp.

| Step | Scope | Commit |
|------|-------|--------|
| A | 17 Layer 2 vars + `variant: "default"` added to voteCTA-button entry in all 4 templates (classic / modern-dark / playful / minimal) | `01f42ae` |
| B | `src/components/elements/voteCTA-button/` (default.jsx + index.js + README.md); VoteCTABlock.js → thin wrapper | `435f445` |
| Final | DECISIONS (P-LOG-040/041/042/043) + PROGRESS | (this commit) |

### 17 Layer 2 vars (4 groups)
- **Core (7):** `--btn-bg`, `--btn-bg-gradient`, `--btn-text`, `--btn-border-color`, `--btn-border-width`, `--btn-radius`, `--btn-shadow`
- **Sizing (4):** `--btn-padding-x`, `--btn-padding-y`, `--btn-font-size`, `--btn-font-weight`
- **Hover (3):** `--btn-hover-bg`, `--btn-hover-shadow`, `--btn-hover-transform`
- **Decoration (3):** `--btn-icon-color`, `--btn-letter-spacing`, `--btn-text-transform`

All 4 templates declare the same 17 keys, all chaining to Layer 1 tokens
(D10 fallback chain). Each template's *Layer 1* token differences drive
the visual differentiation, not Layer 2 divergence.

### 16-cell verification matrix (Part 5)

**Method:** 1 live anchor cell DOM-inspected + Layer 2 var inspection +
Layer 3 cascade proof. The other 15 cells follow transitively because
`buildButtonStyle` is byte-preserved and template configs are untouched.
See P-LOG-042 for rationale.

| Template    | State    | bg (from config)                              | text     | radius        | Match Day 8? |
|-------------|----------|-----------------------------------------------|----------|---------------|--------------|
| classic     | notVoted | gradient(→r, #10B981→#059669→#047857)         | #ffffff  | xl (0.75rem)  | ✓ |
| classic     | voted    | gradient(→r, #0369a1→#0284c7→#38bdf8)         | #ffffff  | xl (0.75rem)  | ✓ |
| classic     | ended    | gradient(→r, #334155→#1e293b→#0f172a)         | #94a3b8  | xl (0.75rem)  | ✓ |
| classic     | login    | gradient(→r, #691E61→#8A2680→#C026D3)         | #ffffff  | xl (12px live)| ✓ live anchor |
| modern-dark | notVoted | gradient(→r, #06b6d4→#0891b2→#0e7490)         | #ffffff  | xl            | ✓ |
| modern-dark | voted    | gradient(→r, #8b5cf6→#7c3aed→#6d28d9)         | #ffffff  | xl            | ✓ |
| modern-dark | ended    | (classic.ended object reused)                 | #94a3b8  | xl            | ✓ |
| modern-dark | closed   | (classic.closed object reused)                | #94a3b8  | xl            | ✓ tier-2 spot |
| playful     | notVoted | gradient(→r, #f59e0b→#f97316→#ea580c)         | #ffffff  | 2xl (1rem)    | ✓ |
| playful     | voted    | gradient(→r, #ec4899→#d946ef→#a855f7)         | #ffffff  | 2xl           | ✓ |
| playful     | ended    | (classic.ended) + br: 2xl                     | #94a3b8  | 2xl           | ✓ |
| playful     | paused   | (classic.paused) + br: 2xl                    | #ffffff  | 2xl           | ✓ tier-2 spot |
| minimal     | notVoted | solid #374151 (no gradient, shadow:none)      | #ffffff  | md (0.375rem) | ✓ |
| minimal     | voted    | solid #6b7280                                 | #ffffff  | md            | ✓ |
| minimal     | ended    | solid #9ca3af                                 | #94a3b8  | md            | ✓ |
| minimal     | login    | solid #1f2937                                 | #ffffff  | md            | ✓ tier-2 spot |

**Live anchor cell (classic + login):** computed
`background-image: linear-gradient(to right, rgb(105,30,97), rgb(138,38,128), rgb(192,38,211))`,
`color: rgb(255,255,255)`, `padding: 16px 40px`, `font-size: 18px`,
`font-weight: 700`, `box-shadow: rgba(138,38,128,0.4) 0 10px 15px -3px`,
`border-radius: 12px`. All 17 `--btn-*` vars emitted at element scope.
Layer 3 (`borderRadius: "xl"`=12px) wins over Layer 2 (`--btn-radius: 9999px`).

### Registry sanity (Part 5)
```
Registered: true
Category: action
Variants: [ 'default' ]
Stateful: true
Has default: true
Has minimal-pill (not yet): false
```

### New lessons (DECISIONS.md)
- P-LOG-040 — Stateful element 1:1 extraction preserves state-selection JSX inside variant
- P-LOG-041 — Layer 2 fallback paths intentionally dead today, live tomorrow
- P-LOG-042 — Tiered visual verification: live anchor + transitive proof
- P-LOG-043 — Spec text vs codebase: voteCTA has 6 states, not 7 (no error state)

### Next (Day 9b): voteCTA-button minimal-pill + chunky-stamp variants
- Design `minimal-pill` (thin outline + hover fill, 3-state focus)
- Design `chunky-stamp` (Gumroad-style hard border + hard offset shadow)
- Each variant: focus 3 primary states (notVoted/voted/ended) + 3 fallback
- Register both in resolver + update `registry.variants`
- Full 4×3 swap matrix (4 templates × 3 variants = 12 cells visual)
- Complete remaining state cells deferred from Day 9a

---

## Phase 1 Week 3 Day 8 — Element Type Registry + Categorization ✅ COMPLETE

**Day 8 (central registry + 7 categories + 47 elements categorized + banner
resolver wired): ✅ DONE.** Day 7b debt cleared (cross-template variant swap
verified on all 4 templates). Foundation ready for Day 10-11 editor + Day
12-13 library UI.

| Step | Scope | Commit |
|------|-------|--------|
| (Part 1) | Day 7b debt: 4×1 minimal-line swap verified (modern-dark / playful / minimal) | (verify only, no commit) |
| A | `src/components/elements/registry.js` — 7 categories + banner-section entry + 6 helpers | `f0e437c` |
| B | All 47 current element types categorized (6 action / 3 section-header / 8 data-display / 26 content / 4 media) | `a1a89e3` |
| C | `banner-section/index.js` cross-references registry; 3-branch defensive resolver (missing/drift/unknown); 4×2 swap matrix verified | `9066ade` |
| Final | DECISIONS (P-LOG-036/037/038/039) + PROGRESS | (this commit) |

### Part 1 — Day 7b debt: 4×1 minimal-line matrix
| Template | DOM root present | computed `border-color` | Rule visual |
|---|---|---|---|
| classic | ✓ | `rgb(255,255,255)` (L3 cfg) | white-on-white invisible (Day 7b state) |
| modern-dark | ✓ | `rgb(51,65,85)` (L2 token #334155) | slate |
| playful | ✓ | `rgb(251,207,232)` (L3 cfg #fbcfe8) | pink |
| minimal | ✓ | `rgb(229,231,235)` (L2 token #e5e7eb) | gray |

All 4 templates resolve `variant: "minimal-line"` correctly. Layer 2 vars flow
per template; Layer 3 cfg overrides win where set. **Debt cleared.**

### Categorization breakdown (Part 3)
- **action** (6): voteCTA-button, meet-cta, vote-abstain-button, vote-disapprove-button, success-form-btn, closed-back-btn
- **section-header** (3): banner-section, meet-section, success-megaphone-card
- **data-display** (8): hero-countdown, stats-header, stats-voted-card, stats-progress-card, stats-eligible-card, results-stats-bar, results-demographics, candidates-counter
- **content** (26): all titles / subtitles / badges / chips / footnotes
- **media** (4): vote-party-card, candidates-party-card, success-check-icon, closed-lock-icon
- **navigation** (0): reserved for Phase 2+
- **layout** (0): reserved for Phase 2+
- **Total:** 47 ✓
- **Stateful:** voteCTA-button (6 election states), hero-countdown (5 phases)

### Part 4 — 4×2 full swap matrix (registry-wired resolver, live)
| Template | default | minimal-line |
|---|---|---|
| classic | bg #fff, border #fff, r 24px, card | bg transparent, rule 1px #fff, r 0, no shadow |
| modern-dark | bg #1e293b, border #334155, r 24px, card | bg transparent, rule 1px #334155, r 0, no shadow |
| playful | bg #fff, border #fbcfe8, r 24px, card | bg transparent, rule 1px #fbcfe8, r 0, no shadow |
| minimal | bg #f9fafb, border #e5e7eb, r 8px, card | bg transparent, rule 1px #e5e7eb, r 0, no shadow |

**Console:** zero `[banner-section]` warnings across all 8 cells — registered
variants silent per design (P-LOG-037). Only pre-existing Next.js Image
`sizes` warnings unrelated to the registry work.

### New lessons (DECISIONS.md)
- P-LOG-036 — Registry / component decoupling (metadata ≠ implementation).
- P-LOG-037 — Defensive resolver: warn + fallback, never throw.
- P-LOG-038 — Day 7b debt cleared (cross-template swap verified).
- P-LOG-039 — Node ESM can't import `.jsx`; sanity tests split registry/JS vs browser/JSX.

### Next (Day 9): voteCTA-button variant pattern
- Apply variant pattern to voteCTA-button (stress-test stateful element)
- 6 states must survive variant migration unchanged
- Author 2-3 voteCTA variants (default + alternative styles)
- Update registry voteCTA-button.variants array
- Verify across 4 templates × every state

---

## Phase 1 Week 2 Day 7b — Variant Infrastructure ✅ COMPLETE

**Day 7b (variant pilot on banner-section): ✅ DONE.** Element variants
introduced as separate React component files with a resolver. Layer 3 cascade,
Layer 2 vars, and Layer 1 tokens all continue to work uniformly across
variants. Pattern is ready to extend to other elements in Phase 2.

| Step | Scope | Commit |
|------|-------|--------|
| A | New `src/components/elements/banner-section/` (default.jsx 1:1 extraction + index.js resolver + README); ElectionBannerBlock → thin wrapper | `7b18592` |
| B | `variant: "default"` field added to banner-section entries in 4 templates | `c3b3854` |
| C | `minimal-line.jsx` alternative variant + registered + README updated | `fb28ee4` |
| Final | DECISIONS (P-LOG-032/033/034/035) + PROGRESS | (this commit) |

### Variant resolver fallback test (Part 2.3)
Temporarily removed the `variant` field from classic.banner-section →
page still rendered the `default` variant (bg #fff, radius 24px). Resolver
correctly falls back. Field restored.

### Variant swap matrix (Part 3 + Part 4)
Tested classic on both variants via direct template edit + reload:

| Template | Variant | Background | Radius | Shadow | Verdict |
|---|---|---|---|---|---|
| classic | `default` | `rgb(255,255,255)` | 24px | `shadow-2xl` | ✓ card chrome |
| classic | `minimal-line` | `rgba(0,0,0,0)` | 0px | `none` | ✓ editorial frame |

Stubs (modern-dark / playful / minimal) declared `variant: "default"` but
were not swap-tested live this session — by Layer-2 scope-independence
(P-LOG-030 + P-LOG-034) the swap mechanics are template-agnostic, so
stub × minimal-line is expected to work; verifying it is a 30-second
spot-check for Day 8 if needed.

### Layer 3 override test (Part 4.3)
classic + `variant: "default"` + `config.backgroundColor: "#ff0000"`
→ banner rendered `rgb(255,0,0)` (Layer 3 wins). Same override on
`variant: "minimal-line"` → also `rgb(255,0,0)`. Both variants respect
Layer 3 identically. Override removed; classic returned to white.

### Console clean
No errors, no warnings in browser console across the verified states.

### New lessons (DECISIONS.md)
- P-LOG-032 — Variant component file structure pattern (no path alias here, use relative).
- P-LOG-033 — Resolver fallback to "default", soft `console.warn` on unknown ID.
- P-LOG-034 — Variant swap = React component swap; frame differs, content doesn't.
- P-LOG-035 — Preview-server restart cycle is now familiar procedure (~45s × ~6/session).

### Next (Day 8-9): Polish classic for production
- Audit all home elements for production-ready quality on classic
- Decide which elements adopt variant pattern next (Day 10+)
- Begin Editor Tier 1 planning (variant picker UI)

---

## Phase 1 Week 2 Day 7a — Infrastructure Cleanup + Layer 2 pilot ✅ COMPLETE

**Day 7a (3-layer refactor, pre-variant cleanup): ✅ DONE.** Radius tokens
active across 5 JSX helpers; remaining spread inheritance leaks eliminated in
stubs; Layer 2 element-scope vars infrastructure scaffolded; banner-section
pilots the full 3-layer cascade.

| Step | Scope | Commit |
|------|-------|--------|
| A | Wire `\|\| var(--radius-*)` in 5 JSX helpers + strip redundant cfg.borderRadius (classic ×6, minimal ×2) | `d884044` |
| B | Spread cleanup: 4 stub elements (playful banner/meet, modern-dark meet, minimal meet) → explicit subset | `aa7dde7` |
| C | `buildTemplateStyles` extends `buildTokenStyles`; HomeContent passes full template | `ba3c6c0` |
| D | banner-section: data-element attr + `vars` in all 4 templates + JSX uses `--banner-*` | `9cb9435` |

**Radius activation test (Step A):** `--radius-card` 24px → 4px on classic →
banner, sub-cards, hero, meet all rendered with 4px corners; revert 4px → 24px
restored baseline. Radius tokens are now active in parallel to color tokens.

**Layer 2 activation test (Step D):** classic `--banner-bg` directly set to
`#ff0000` → banner turned red (`rgb(255,0,0)`); revert to
`var(--color-surface)` → back to `rgb(255,255,255)`. Layer 2 override works
independently of Layer 1 tokens.

**4-template Layer 2 verify (DevTools on `[data-element="banner-section"]`):**

| Template | --banner-bg | --banner-border | --banner-radius | Rendered bg | Visual |
|---|---|---|---|---|---|
| classic | `#ffffff` (←surface) | `#e2e8f0` (←border) | `24px` (←card) | `rgb(255,255,255)` | byte-faithful Day 6 ✓ |
| modern-dark | `#1e293b` | `#334155` | `20px` | `rgb(30,41,59)` | (radius cfg "3xl" L3 wins → 24px rendered) |
| playful | `#ffffff` | `#fde68a` | `32px` | `rgb(255,255,255)` | byte-faithful Day 6 ✓ |
| minimal | `#f9fafb` | `#e5e7eb` | `8px` | `rgb(249,250,251)` | byte-faithful Day 6 ✓ |

**4×5 visual verify table (byte-faithful with Day 6 final):**

| Block | classic | modern-dark | playful | minimal |
|---|---|---|---|---|
| Page bg | `#F8F9FD` ✓ | `#0f172a` ✓ | `#fffbeb` ✓ | `#ffffff` ✓ |
| Banner bg/border/r | `#fff` / `#fff` / 24px ✓ | `#1e293b` / `#334155` / 24px ✓ | `#fff` / `#fbcfe8` / 24px ✓ | `#f9fafb` / `#e5e7eb` / 8px ✓ |
| Sub-cards | 24px ✓ | 24px ✓ | 16px ✓ | 6px ✓ |
| Hero card | purple 3-stop ✓ | cyan 3-stop ✓ | orange→pink→fuchsia ✓ | solid `#1f2937` ✓ |
| Meet card | `#fff` 24px ✓ | `#1e293b` **20px** * | `#fff` 24px ✓ | `#f9fafb` 8px ✓ |

*modern-dark meet radius shifted 24px → 20px after spread removal (P-LOG-031,
surface alignment with modern-dark's own --radius-card token). Architecturally
desired; documented.

**New lessons (DECISIONS.md):**
- P-LOG-028 — Radius activation parallels color (wiring + cfg cleanup needed).
- P-LOG-029 — Spread is hidden coupling; prefer explicit subset by default.
- P-LOG-030 — Layer 2 vars must be declared at element root, full key set, chain to Layer 1.
- P-LOG-031 — modern-dark meet radius alignment side-effect from spread removal.

**Next (Day 7b):** Variant component file structure (`src/components/elements/banner-section/`),
variant resolver, banner-section default + alternative variant, variant swap test.

---

## Phase 1 Week 2 Day 6 — Token Propagation (Layer 1 active) ✅ COMPLETE

**Day 6 (3-layer refactor, Layer 1 activation): ✅ DONE.** Removed redundant
explicit hex from element configs where the value matched the template's own
token. JSX `cfg.X || 'var(--token)'` fallbacks now actively pull from tokens;
editing a token in `template.theme.tokens` propagates to rendering.

| Step | Template | Removals | Commit |
|------|----------|----------|--------|
| A | classic.js | 7 (pages.home, banner bg, 2× sub-card bg, meet bg, 2× meet-cta) | `f152d1c` |
| B | modern-dark.js | 8 (+ 2 spread-drop fixes per P-LOG-025) | `ef4c632` |
| C | playful.js | 6 (preemptive spread-drop on sub-cards) | `9edaa08` |
| D | minimal.js | 6 (+ minimal banner surface alignment, P-LOG-026) | `4dce143` |

**Token activation test (Task 6):** edited `--color-bg` in classic.js from
`#F8F9FD` → `#ffe4e1` → page bg turned **pink** (`rgb(255,228,225)`). Reverted
→ back to `rgb(248,249,253)`. Layer 1 is **active**, not fallback-only.

**4×5 visual verify table (live browser, byte-faithful vs Day 5):**

| Block | classic | modern-dark | playful | minimal |
|---|---|---|---|---|
| Page bg | `#F8F9FD` ✓ | `#0f172a` ✓ | `#fffbeb` ✓ | `#ffffff` ✓ |
| Banner bg/border | `#fff`/`#fff` ✓ | `#1e293b`/`#334155` ✓ | `#fff`/`#fbcfe8` ✓ | `#f9fafb`/`#e5e7eb` * |
| Sub-cards | `#fff` `#f1f5f9` 24px ✓ | `#1e293b` `#334155` ✓ | `#fff` `#fde68a` 16px ✓ | `#f9fafb` `#e5e7eb` 6px ✓ |
| Hero card | purple 3-stop ✓ | cyan 3-stop ✓ | orange→pink→fuchsia ✓ | solid `#1f2937` ✓ |
| Meet card | `#fff` ✓ | `#1e293b` ✓ | `#fff` ✓ | `#f9fafb` ✓ |

*minimal banner bg shifted `#fff` → `#f9fafb` (P-LOG-026; surface alignment).

**New lessons (DECISIONS.md):**
- P-LOG-024 — Token activation pattern (remove duplicate cfg → JSX `||` hits token).
- P-LOG-025 — Spread-inheritance leak; drop the spread, write explicit subset.
- P-LOG-026 — Minimal banner surface alignment (intentional, imperceptible).
- P-LOG-027 — `.next` manifest race during sustained HMR; clean restart fixes.

**Activation NOT fully reached for `borderRadius` tokens** (JSX has no `||
var(--radius-*)` fallback — radius values still hardcoded as `"3xl"`/`"lg"`/
etc. and resolve via RADIUS_MAP only). Day 7 will extend JSX patterns so
`--radius-card` / `--radius-button` become active too.

**Next (Day 7):** Layer 2 element-scope vars + variant component scaffolding;
voteCTA + CountdownTimer migrate to variant pattern.

---

## Phase 1 Week 2 Day 5 — Token Extraction (Layer 1) ✅ COMPLETE

**Day 5 (3-layer refactor, Layer 1 only): ✅ DONE.** 15 Layer 1 tokens emitted
per template via unified pipeline (ADR-001 D11); 5 home blocks consume them via
`var(--color-*)`. Classic byte-faithful with Day 4; 3 stubs visually distinct.

| Step | Scope | Commit |
|------|-------|--------|
| A | Add tokens to classic.js (15 tokens) | `2d7f209` |
| B | `src/lib/templateTokens.js` (`buildTokenStyles`) | `62dd015` |
| C | 5 home blocks consume tokens via `var()` + `.fms-app` scope | `cb7e99a` |
| D | Token overrides on modern-dark, playful, minimal | `fa15988` |

- Build PASS each step (`npm run build` clean).
- Live verify in real browser across all 4 templates (preview_inspect on
  `.fms-app` + each block — 20 checkpoints, all match spec values).
- Tokens emitted via `<style dangerouslySetInnerHTML>` scoped to `.fms-app`
  (NOT `:root`) so the editor preview can run its own scope later.
- Inline override (Layer 3) preserved as `cfg.X || 'var(--token)'` — element
  config wins, tokens are the safety net.
- Gradients (hero card 3-stop, meet-section glow) stay inline this iteration —
  Day 6 may add Layer 2 vars for gradient stops.

**4×5 visual verify table (block × template):**

| Block          | classic              | modern-dark          | playful              | minimal              |
|----------------|----------------------|----------------------|----------------------|----------------------|
| Page bg        | `#F8F9FD` ✓          | `#0f172a` ✓          | `#fffbeb` ✓          | `#ffffff` ✓          |
| Banner         | `#fff` / `#fff`      | `#1e293b` / `#334155`| `#fff` / `#fbcfe8`   | `#fff` / `#e5e7eb`   |
| Sub-cards (2)  | `#fff` `#f1f5f9` 24px| `#1e293b` `#334155`  | `#fff` `#fde68a` 16px| `#f9fafb` `#e5e7eb` 6px |
| Hero card      | purple 3-stop ✓      | cyan 3-stop ✓        | orange→pink→fuchsia ✓| solid `#1f2937` ✓    |
| Meet card      | `#fff` 24px (purple glow)|`#1e293b` 24px (cyan glow)|`#fff` 24px (orange glow)|`#f9fafb` 8px (gray glow)|

**New lessons (DECISIONS.md):**
- P-LOG-021 — P-LOG-019 stale: `.gitignore *.md` rule no longer applies.
- P-LOG-022 — Layer 1 token emission via `.fms-app` scope (unified pipeline).
- P-LOG-023 — `window.location.href` + `fetch` in same preview_eval breaks
  Next.js basePath rewrite; use `window.location.assign(...)` solo instead.

**Next (Day 6):** Layer 2 element-scope vars + variant component scaffolding;
voteCTA + CountdownTimer migrate to the variant pattern.

---

## Phase 3 Day 4 — Home Block JSX Migration ✅ COMPLETE

**Phase 3 Step 5 (Block JSX Migration): ✅ DONE.** All 5 home blocks migrated to
per-element inline style (voteCTA pattern), home page only.

| Step | Block | Commit |
|------|-------|--------|
| 1 | Page background | `16166a8` |
| 2 | banner-section | `f72c174` |
| 3 | Stats sub-cards | `e199a8e` |
| 4 | Stats hero card | `b630298` |
| 5 | MeetCandidatesCard | `39bcc7a` |

- Build PASS each step; visual-verified in real browser across all 4 templates
  (final sweep = 20 checkpoints, 5 blocks × 4 templates, all distinct & cohesive).
- Classic preserved byte-faithfully on every block. Legacy fallbacks intact (P-LOG-015).
- Verification technique: flip `SystemConfig.activeTemplateId` via prisma, reload, read
  computed styles (admin UI is auth-gated). DB restored to `classic` after.
- New lessons: DECISIONS.md P-LOG-017 (build/dev `.next` clash), 018 (dead-config drift),
  019 (`*.md` gitignored), 020 (decorative gating via flag + `<style jsx>` color-swap).

**Deferred (NOT done):**
- SSR plumbing of `resolvedTemplate` into vote/results/closed/success/candidates pages
  (only the home page resolves a template today) → Phase 3.5.
- Navbar (no catalog entry) → out of scope.
- Out-of-scope observation: modern-dark hero "SAMO" base word renders faint on dark bg
  (pre-existing hero-title element from earlier phases, not a Day 4 block).

**Next:** Phase 3 Step 6 = Editor Tiers (Simple/Advanced PropertyPanel) — Day 5.

---

# PROGRESS.md — Phase 2.6 Complete (pending manual browser test)

**Last saved:** 2026-05-17
**Phase 2.6 Status:** ✅ TECHNICAL COMPLETE — manual P10 browser test PENDING
**Branch:** `new-version`

---

## Phase 2.6 Summary — True Editor Completion

All 11 spec sub-steps (P0–P11) executed except P10 manual browser test, which is gated on user verification.

### Catalog state
- **Before Phase 2.6:** 40 instances (from Phase 2 close)
- **After Phase 2.6:** 47 instances (40 − 1 hero-status-badge + 7 success + 1 closed-lock-icon)
- 16 semantic types unchanged

### Changes by sub-step

| Step | Change | Verification |
|---|---|---|
| P0 | Baseline build PASS; baseline catalog count 40 | grep count 40 |
| P1 | Renderer routing verified: home→HomeContent, results/vote/candidates/closed/success → *EditorPreview, party→fall-through | PageDesignTab:273–353 |
| P2 | StatsBlock.js +3 Wraps (stats-header, stats-progress-card, stats-eligible-card); MeetCandidatesCard.js +2 Wraps (meet-title, meet-cta); MeetCandidatesBlock.js prop pass-through; HomeContent.js editor prop pass-through to blocks; hero-status-badge removed from catalog; hero-year-badge extended with `visible` field and toggled directly by isVisible | 3+2 Wraps grep PASS |
| P3 | MultiPartyView.js +1 Wrap (vote-header-badge) above title | 3 vote-header-* Wraps |
| P4 | Section normalizations: voteHeader→header (3), voteBody→partyGrid (2) + abstainButton (2), googleForm→googleFormLink (1) | 0 old names left |
| P5 | ResultsEditorPreview dynamic Wrap stripped | 0 result-card-N |
| P6 | 7 new success catalog entries + 7 Wraps in SuccessEditorPreview | 12 success Wraps total |
| P7 | closed-lock-icon catalog entry + Wrap in ClosedEditorPreview | 5 closed Wraps total |
| P8 | `{id:"party"}` entry removed from EDITABLE_PAGES in pageRegistry.js | grep `id: "party"` → 0 |
| P9 | Dead file `editor/previews/HomeEditorPreview.js` deleted; empty `previews/` directory cleaned | file gone |
| P10 | **PENDING** — manual region-by-region browser test required per P-LOG-009 | dev server running on :3000 |
| P11 | DECISIONS.md appended P-LOG-010, P-LOG-011, P-LOG-012; this file + MASTER_PLAN.md updated | this commit |

### Builds verified
Every sub-step (P2..P9) ended with `npm run build` PASS.

### Files modified
- `src/components/blocks/StatsBlock.js` — editor props + 3 Wraps
- `src/components/blocks/MeetCandidatesBlock.js` — editor prop pass-through
- `src/components/MeetCandidatesCard.js` — editor props + 2 Wraps
- `src/components/HomeContent.js` — editor prop pass-through to blocks; isVisible('hero-status-badge') → isVisible('hero-year-badge')
- `src/components/vote/MultiPartyView.js` — vote-header-badge Wrap
- `src/components/admin/SuccessEditorPreview.js` — 7 new Wraps
- `src/components/admin/ClosedEditorPreview.js` — closed-lock-icon Wrap
- `src/components/admin/ResultsEditorPreview.js` — dynamic result-card Wrap stripped
- `src/components/admin/editor/elementInstances.js` — section normalizations + 7 success entries + closed-lock-icon entry; hero-status-badge removed; hero-year-badge extended
- `src/utils/pageRegistry.js` — party object removed from EDITABLE_PAGES
- `DECISIONS.md` — P-LOG-010..012 appended
- `MASTER_PLAN.md` — Phase 2.6 marked complete
- `PROGRESS.md` — this file

### Files deleted
- `src/components/admin/editor/previews/HomeEditorPreview.js` (dead code)
- `src/components/admin/editor/previews/` directory (empty)

---

## P10 — Required Manual Verification (USER)

Dev server: http://localhost:3000  → admin → ออกแบบหน้าเว็บ

### Checklist (47 catalog entries → click every region)

**Home (14):**
- [ ] hero-title
- [ ] hero-subtitle
- [ ] hero-subtitle2
- [ ] hero-year-badge (now toggleable in PropertyPanel)
- [ ] hero-countdown (StatefulGallery, 5 states)
- [ ] stats-header ✨ NEW
- [ ] stats-voted-card
- [ ] stats-progress-card ✨ NEW
- [ ] stats-eligible-card ✨ NEW
- [ ] voteCTA-button (StatefulGallery, 6 states)
- [ ] meet-section
- [ ] meet-title ✨ NEW (inside MeetCandidatesCard)
- [ ] meet-cta ✨ NEW (inside MeetCandidatesCard)
- [ ] banner-section

**Vote (7):**
- [ ] vote-header-badge ✨ NEW
- [ ] vote-header-title
- [ ] vote-header-subtitle
- [ ] vote-party-card (first card)
- [ ] vote-divider-text
- [ ] vote-abstain-button
- [ ] vote-disapprove-button (single-party simMode)

**Results (4):**
- [ ] results-header
- [ ] results-stats-bar
- [ ] results-candidates-heading
- [ ] results-demographics
- [ ] result-card-N should NOT be clickable (stripped)

**Candidates (5):**
- [ ] candidates-tagline
- [ ] candidates-title
- [ ] candidates-subtitle
- [ ] candidates-counter
- [ ] candidates-party-card

**Success (12):**
- [ ] success-check-icon ✨ NEW
- [ ] success-title
- [ ] success-subtitle1
- [ ] success-subtitle2
- [ ] success-megaphone-card ✨ NEW
- [ ] success-megaphone-title ✨ NEW
- [ ] success-megaphone-desc ✨ NEW
- [ ] success-chip-1 ✨ NEW
- [ ] success-chip-2 ✨ NEW
- [ ] success-lock-indicator ✨ NEW
- [ ] success-form-btn
- [ ] success-footer

**Closed (5):**
- [ ] closed-lock-icon ✨ NEW
- [ ] closed-title
- [ ] closed-description
- [ ] closed-detail
- [ ] closed-back-btn

**Party tab:**
- [ ] HIDDEN from admin page selector (Phase 4)

**Validation console:**
- [ ] `[elementCatalog] ✓ Validation passed: 47 instances, 16 types`

**Production pages:**
- [ ] / renders normally
- [ ] /vote renders normally
- [ ] /results renders normally
- [ ] /candidates renders normally
- [ ] /success renders normally
- [ ] /closed renders normally
- [ ] /party still accessible publicly (just not editable)

---

## What's Next

After user signs off on P10 manual test:

- **Option A (recommended):** Phase 3 — Canva-style template system per `PHASE3_TEMPLATE_VISION.md`. ~10–12 hours. Fixes Phase 2 deferred bugs (template apply, StatefulGallery clickability) as side effects.
- **Option B:** UX polish + production hardening.
- **Option C:** Phase 4 — /party page editor + Component Library + Image Library.

---

## Cross-References

- `MASTER_PLAN.md` — Phase 2.6 marked complete
- `DECISIONS.md` — P-LOG-010, P-LOG-011, P-LOG-012 appended
- `LIVE_STEP_H_EDITOR_TRUE_COMPLETION.md` — spec executed
- `DIAGNOSE_EDITOR_COVERAGE_GAPS.md` — diagnosis that drove this phase

---

## Phase 3 Day 2A/2B — Template Resolution + Apply Flow (2026-05-20)

### Day 2A: SSR Template Resolution Wire (commit `0e1ea8a`)
- page.js fetches `activeTemplateId` from SystemConfig, resolves via Day 1 loader
- `resolvedTemplate` prop flows to HomeContent → StatefulGallery
- `resolveStatefulConfig` accepts Phase 3 object shape: `elements[id].config[stateId]`
- `resolveConfig` accepts `resolvedTemplate` in context
- VoteCTABlock `hasOverride` guard fixed: empty `{}` was truthy → broken style switch

### Day 2B: Apply Flow + Cleanup (commit `f0a29ca`)
- PageDesignTab `confirmApplyTemplate` async → POST `/api/admin/templates/:id/apply`
- Gallery loads from `GET /api/admin/templates` (built-ins + DB)
- TemplateCard uses new `colorSwatch` shape; active badge from `activeTemplateId`
- `page-layout` GET returns `activeTemplateId`
- Deleted `templateEngine.TEMPLATES` (364 lines), legacy `getTemplate()`, `utils/templatePresets.js`
- `resolveStatefulConfig` simplified to object-only (string bridge removed)
- HomeContent: `voteCTATemplateArg`/`countdownTemplateArg = resolvedTemplate` (no string fallback)

### voteCTA Design Preservation (post-Day 2B)
Issue: Original voteCTA design lives as hardcoded Tailwind classes in
`VoteCTABlock.legacyClassName` (gradient + shadow + glow + shine + animated icon).
Day 2A wiring made `hasOverride=true` → legacy design bypassed → "flat pink button"
because classic.js voteCTA-button config has only 6 fields (missing backgroundType,
gradient*, shadow*, padding*, icon* — 13 fields short of the old `templateEngine.TEMPLATES`
config).

Fix (Option C — Hybrid): Gate template resolution on user override existence.
When `Object.keys(voteCTAOverrides).length === 0` → pass `null` to VoteCTABlock →
`hasOverride=false` → `legacyClassName` renders → original gradient/shadow/glow intact.

Files: `src/components/HomeContent.js` (1 logic change)
Also kept: `VoteCTABlock.buildButtonStyle` fallback for `backgroundColor` without
explicit `backgroundType` (defensive — handles future templates that omit the field).

Deferred (Day 3+): Enrich `classic.js` voteCTA-button with 13 missing fields
(`backgroundType: "gradient"`, `gradientFrom/Via/To/Direction`, `shadow/shadowColor`,
`paddingX/Y`, `borderColor/Width`, `iconName/Position`, `hoverEffect`) sourced from
`git show HEAD~6:src/components/admin/editor/templateEngine.js`. Once enriched for all
4 templates, remove the override gate to enable full template-driven design.

Other elements: Day 2A/2B wiring active for non-voteCTA elements (countdown,
hero-title, etc. — these don't have rich hardcoded JSX so template-driven works).

### Known limitation — StatefulGallery preview voteCTA (DEFERRED to Day 3)

Admin editor's StatefulGallery preview for `voteCTA-button` renders 6 flat
colored buttons (no gradient/shadow/glow) — does not match the home page's
restored design.

Cause: StatefulGallery (line 188-193) always calls `resolveStatefulConfig(...)`
with a non-empty result (defaultConfig fallback when no template object) →
passes the 6-field object to `<VoteCTABlock resolvedConfig={...} />` →
`hasOverride=true` → `legacyClassName` bypassed → only `buildButtonStyle`
inline styles applied. The hardcoded Tailwind gradient/shadow/glow/shine in
`VoteCTABlock.legacyClassName` (only used when `!hasOverride`) is never rendered.

Additional sub-issue: VoteCTABlock function signature doesn't accept `forceState`
prop. StatefulGallery passes it (line 267) but it's silently ignored → all 6
preview cards render VoteCTABlock's internal `btnConfig` default branch
(login state with LogIn icon) regardless of which state card it is.

Why deferred:
- Production-facing home page works correctly (Option C gate)
- Admin functionality (clicking, editing, saving) intact
- Day 3 "DEFAULTS" plan enriches `classic.js` voteCTA-button with 13 missing
  fields → resolvedConfig will have 18 fields → `buildButtonStyle` renders
  gradient/shadow/padding properly → preview matches home automatically
- Touching `VoteCTABlock` for a cosmetic admin issue would cross the
  production/editor boundary unnecessarily (P-LOG-002 principle)

Action for Day 3:
1. Enrich `classic.js` voteCTA-button states with full 18 fields (per state)
2. Enrich `modern-dark.js`, `playful.js`, `minimal.js` voteCTA-button states
3. Once data complete, optionally remove HomeContent override gate (let
   template fully drive design)
4. (Optional) Add `forceState` support to VoteCTABlock so per-state previews
   render their own internal `btnConfig` branch
5. Verify StatefulGallery preview matches home

### Verification (post Day 2A/2B + Option C)
- ✅ Build pass 37/37 routes
- ✅ Home voteCTA: gradient/shadow/glow visible
- ✅ Home countdown: renders correctly with template config
- ✅ Admin editor Phase 2.6 baseline intact: clicks work, gallery opens
- ⚠️  Admin StatefulGallery voteCTA preview: flat (documented limitation)
- ✅ Apply Flow (Day 2B): POST `/api/admin/templates/:id/apply` works
- ✅ Gallery shows 4 templates from API
- ✅ No console errors
- ✅ Cleanup verification grep: zero matches for `TEMPLATES[`, legacy
  `getTemplate`, `TEMPLATE_PRESETS`

---

## Phase 3 Day 2B — Complete (2026-05-20)

Most of Day 2B's apply flow + gallery work was already implemented in commit
`248912e` (Day 2A session). This session completes remaining items and adds
an unplanned auth bridge fix discovered during browser verification.

### What was verified (P-LOG-009 — real browser, not curl)
- Gallery loads 4 cards: classic, modern-dark, playful, minimal
- Color swatches render from `tpl.colorSwatch.primary/secondary`
- Active template indicator updates per apply
- All 4 templates apply via `POST /api/admin/templates/:id/apply`:
  - `classic` → DB.activeTemplateId = "classic" ✅
  - `modern-dark` → DB.activeTemplateId = "modern-dark" ✅
  - `playful` → DB.activeTemplateId = "playful" ✅
  - `minimal` → DB.activeTemplateId = "minimal" ✅
- `router.refresh()` triggers SSR re-fetch (no full reload needed)
- Home page renders cleanly per active template
- Console: zero errors across apply cycle

### Fixes shipped

1. **GAP-A — gallery fetch auth** (`PageDesignTab.js:570`)
   - Added `credentials: 'include'` and `r.ok` check
   - Also sends `x-admin-token` header for legacy admin login compatibility

2. **GAP-A2 — confirmApplyTemplate auth** (`PageDesignTab.js:600`)
   - Both `POST /apply` and `GET /:id` now include `x-admin-token` header
   - Matches the auth bridge contract in `requireAdmin()`

3. **Auth bridge — requireAdmin** (`src/lib/auth/adminCheck.js`)
   - **Discovered during browser test:** Phase 3 template APIs use
     NextAuth `getServerSession()` but the dedicated `/admin/login` page
     (used in dev and by non-SSO admins) only sets an RSA `x-admin-token`
     cookie — no NextAuth session exists.
   - Result: `GET /api/admin/templates → 401 Unauthorized`, gallery empty.
   - Fix: `requireAdmin(request)` now tries NextAuth session first, then
     falls back to verifying `x-admin-token` (RSA + timestamp + secret,
     mirroring legacy `verifyAdminToken` from `page-layout/route.js`).
   - All 6 template routes updated to pass `request` to `requireAdmin`.

### Known limitations (DEFERRED to Day 3)

1. **voteCTA template apply still uses HomeContent fallback gate**
   - Template change updates DB and resolvedTemplate, but voteCTA design
     remains visually identical because `classic.js` lacks 13 design fields
     (backgroundType, gradientFrom/To/Via, shadow, padding, etc.).
   - Day 3 will enrich `classic.js` + 3 stubs with full design fields,
     then remove the HomeContent override gate.

2. **Modern-dark / Playful / Minimal visual changes are subtle**
   - Stub templates inherit most fields from classic.
   - Only `theme.colors` and `pages[*].backgroundColor` differ.
   - Day 3 "DEFAULTS" will expand each stub to full 47-element overrides.

3. **StatefulGallery preview voteCTA** (carried from Day 2A)
   - Documented above.

### Files changed (Day 2B)
- `src/components/admin/PageDesignTab.js` — auth headers added (2 fetches)
- `src/lib/auth/adminCheck.js` — x-admin-token fallback in `requireAdmin`
- `src/app/api/admin/templates/route.js` — pass `request` to requireAdmin
- `src/app/api/admin/templates/[id]/route.js` — pass `request` (3 handlers)
- `src/app/api/admin/templates/[id]/apply/route.js` — pass `request`
- `src/app/api/admin/templates/[id]/fork/route.js` — pass `request`
- `src/app/api/admin/templates/[id]/lock/route.js` — pass `request`
- `PROGRESS.md` — this section

### Next: Day 3 — DEFAULTS
- Expand `modern-dark.js` / `playful.js` / `minimal.js` to full 47-element overrides
- Enrich `classic.js` voteCTA-button with 13 missing design fields
- Remove HomeContent voteCTA override gate (now data-driven)
- Visual test: each template = distinctly different look
- Time estimate: 2-3 hours

---

## Day 2 Reflection — May 19-20, 2026

### What went well
- Caught the voteCTA visual regression early — didn't dismiss it as "good enough"
- Bridge mode (Day 2A) preserved backward compat without breaking production
- Auth bridge fix in Day 2B prevented a real 401 bug shipping
- Followed P-LOG-009 strictly: real browser visual verify, not curl + grep
- Diagnose-first approach before each surgical fix
- Transparent documentation of deferred items (no hand-waving "done")

### What was hard
- Day 2A blew past 1.5-2h estimate (turned into 4+ hours)
- Multiple compounding unknowns: state shape, buildButtonStyle fallback, auth drift
- Stash incident lost Day 2A code temporarily — recovery cost ~30 min
- Pre-execution diagnose for 2B was code-only, missed the runtime auth gap

### Surprises
- ~80% of Day 2B was already implemented in `248912e` (Day 2A's late commit)
- Auth bridge gap (NextAuth session vs RSA x-admin-token) was structural, not config
- voteCTA design lived in hardcoded JSX, not data — architectural finding, not just a bug

### For Day 3
- Day 3 = data work (47 elements × 3 stub templates = 141 entries + classic.js enrichment)
- Fresh brain matters more than process — data quality > velocity
- Plan: enrich `classic.js` voteCTA first → verify visual parity → then 3 stubs
- After Day 3: remove HomeContent voteCTA gate (truly template-driven)

### Compounding lessons
P-LOG count: 12 → 16 (+4 today — see DECISIONS.md P-LOG-013..016)
Foundation: rock-solid through visual verify (browser, not curl)
Pattern: diagnose → understand → surgical fix → verify → commit → document
