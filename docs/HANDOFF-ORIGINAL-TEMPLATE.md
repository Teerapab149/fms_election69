# HANDOFF — "Original" template (rolled-back gold classic, ee059dc)

Owner found the **classic** template degraded: when it was extracted into the web-
editor's block/element system, it lost ~60% of its hover/transition/gradient polish
(confirmed by diff — `HomeContent` went hover 28→0, transition 23→0, gradient 30→8).
The **gold version is commit `ee059dc`** (2026-02-04). Owner decided (AskUserQuestion):
1. Build it as a **NEW self-contained template** (like verdure) — do NOT touch the
   current classic-base (modern-dark/playful/minimal + the editor depend on it).
2. **Purple-white only for now**; theme variants come later.

## ✅ STATUS 2026-06-27 — Original template FUNCTIONALLY COMPLETE
- **HOME**: `OriginalHome` (ee059dc verbatim) + ee059dc's own Navbar/MeetCard/Countdown
  + **Kanit** font + **globalConfig** wired (SAMO 50 / 2570 / © 2027). commits
  `507dde0`, `cf94f47`, `7c50f74`.
- **HOVER (was "stiff/เด้ง")**: root cause = global `prefers-reduced-motion` block in
  `globals.css` (added after ee059dc) forced `transition-duration:0.01ms !important` on
  everything, and the owner's OS has reduce-motion ON → hovers snapped. Fixed: keep
  collapsing looping `animation`, but NOT `transition` (commit `62e0c6a`). GLOBAL fix —
  smooth hovers on every template. NOTE: the meet-card's color-CYCLING glow is an
  `animation` (still calmed under reduce-motion by design) — toggle OS reduce-motion OFF
  to see it (what most voters see).
- **INNER PAGES** (vote/results/candidates/party/success/closed): owner chose to REUSE
  the current classic components (they weren't degraded — diff showed they gained/kept
  hover; only home was stripped) + force **Kanit**. They already render via each page's
  `else` branch when active∉{verdure,studio-dark,gumroad}; Kanit is injected in
  `layout.js` when `activeTemplateId === "original"` (commit `6fec9af`). Verified live
  `/candidates` = Kanit 6/6 with active flipped to original (reverted after). NO per-page
  extraction needed — the table below is moot under this approach.

**To use it:** admin selects the "ออริจินัล" template (applies → `activeTemplateId="original"`).
**Minor follow-ups (optional):** (a) `/template-preview` + the interactive playground don't
inject Kanit for `slug=original` inner pages (only the LIVE active template does) — gallery
inner thumbnails show Anuphan; (b) add `original` to the playground COMPONENTS map; (c) the
countdown's hardcoded "SEE YOU 2027" could read electionCalendarYear (currently correct).

---
## ⏸️ (historical) STATUS 2026-06-24 (paused — owner hit weekly limit, resume Fri)
HOME is built as the `original` template (commits `507dde0`, `cf94f47`) — font fixed
to **Kanit** (default `font-sans` had been changed Kanit→Anuphan; root now `font-kanit`)
and ee059dc's own Navbar/MeetCard/Countdown extracted as `Original*` deps.
**🔴 UNRESOLVED:** owner says the **hover is still not right** ("แข็งๆ", not the gradual
color/gradient of ee059dc). Leads already checked: tailwind `shine` keyframe + the
`animation`/`keyframes` block + `globals.css` are **IDENTICAL ee059dc↔HEAD** — so it is
NOT a missing/changed keyframe.
**Next session — investigate the hover (in order):**
1. Force `:hover` on a specific button (login CTA, meet-card CTA) via CDP/devtools and
   compare computed `transition`/`background`/`color` to what ee059dc produces. The
   preview screenshot can't show hover — must inspect computed state or a video.
2. Diff the SPECIFIC button JSX in `OriginalHome` vs `ee059dc:HomeContent` — it was
   extracted verbatim so it *should* be identical; if so the cause is environmental.
3. Check for a global `transition`/`* {}` rule or `prefers-reduced-motion` block in
   `globals.css` / a layout-injected `<style>` / the `.fms-app` wrapper that could be
   overriding or shortening transitions in the current app but not at ee059dc.
4. Confirm Tailwind's transition timing-function default didn't change (config `theme`).

## ✅ DONE (commit `507dde0`) — HOME
- `src/components/home/OriginalHome.js` = `git show ee059dc:src/components/HomeContent.js`
  verbatim, imports repointed for the new path (`../../utils`, `../Navbar`,
  `../CountdownTimer`, `../MeetCandidatesCard`). Polish fully restored.
- `src/components/admin/editor/templates/builtIn/original.js` — template config
  (slug `original`, `layoutFamily:"original"`, `isLocked:true`, purple-white swatch).
- registered: `templates/index.js` BUILT_IN_TEMPLATES + `home/HomeRenderer.js` HOME_LAYOUTS.
- Verified `/template-preview?slug=original&page=home`: renders, 264 transitions / 33
  hover-class els, no errors.

## 🔜 REMAINING — the other pages (mirror the verdure dispatch pattern)
Each live page `app/<x>/page.js` already branches by `activeTemplateId` (isVerdure/
isStudio/isGumroad → family component, else classic). Add an `isOriginal` branch that
renders the ee059dc component. Extract each from `ee059dc:` into a namespaced file:

| page | ee059dc source (lines) | new file | dispatch site |
|---|---|---|---|
| vote (multi) | `vote/MultiPartyView.js` (61) | `OriginalMultiParty` | `app/vote/page.js` |
| vote (single) | `vote/SinglePartyView.js` (729) | `OriginalSingleParty` | `app/vote/page.js` |
| results | `app/results/page.js` (629) + `ResultCard.js` (200) | `OriginalResults` | `app/results/page.js` |
| candidates | `app/candidates/page.js` (229) | `OriginalCandidates` | `app/candidates/page.js` |
| party | (the ee059dc /party render) | `OriginalParty` | `app/party/page.js` |
| success | ee059dc success | `OriginalSuccess` | `app/success/page.js` |
| closed | ee059dc closed | `OriginalClosed` | `app/closed/page.js` |

Extraction recipe (same as home):
```
git show ee059dc:src/<path> > src/components/<new path>
# fix relative imports for the new location; rename default export
# verify polish counts (hover/transition/gradient) preserved
```
Reuse the CURRENT shared deps where they're ~intact (Navbar, CountdownTimer,
MeetCandidatesCard, ResultCard) — only extract the heavily-degraded page bodies.

## ⚠️ KNOWN ISSUE — election meta (SAMO 49 vs 50)
ee059dc predates the `globalConfig` system, so `OriginalHome` shows **hardcoded
SAMO 49 / 2569 / © 2026 / "SEE YOU 2027"** instead of the admin's current config
(SAMO 50 / 2570). DECIDE with owner:
- (A) leave as-is (faithful to ee059dc; wrong year — not production-correct), or
- (B) wire `useGlobalConfig()` into the Original components (swap the hardcoded
  electionName/number/year strings for `gc.*`) — keeps the design, fixes the data.
Recommended: B before real use (it's just swapping the few hardcoded meta strings,
NOT re-tokenising colours — leave the hover/gradient polish alone).

## THEME VARIANTS (later)
Owner wants 4 themes per template eventually. Original is hardcoded purple-white
(0 tokens). To add light/dark/etc., tokenise ONLY the colour values (var(--color-*))
and keep every hover/transition/gradient/animation class untouched — that careless
"simplify into blocks" step is exactly what stripped the polish the first time.
