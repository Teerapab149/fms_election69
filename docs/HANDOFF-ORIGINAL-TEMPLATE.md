# HANDOFF — "Original" template (rolled-back gold classic, ee059dc)

Owner found the **classic** template degraded: when it was extracted into the web-
editor's block/element system, it lost ~60% of its hover/transition/gradient polish
(confirmed by diff — `HomeContent` went hover 28→0, transition 23→0, gradient 30→8).
The **gold version is commit `ee059dc`** (2026-02-04). Owner decided (AskUserQuestion):
1. Build it as a **NEW self-contained template** (like verdure) — do NOT touch the
   current classic-base (modern-dark/playful/minimal + the editor depend on it).
2. **Purple-white only for now**; theme variants come later.

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
