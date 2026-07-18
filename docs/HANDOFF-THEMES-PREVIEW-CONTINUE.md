# HANDOFF — colour themes + preview polish (continue)

Written 2026-06-29 at end of a long session (context full). Branch `new-version`.
Self-contained. Read `docs/HANDOFF-VERDURE-COLOR-THEMES.md` for the worked verdure example.

## THE STRATEGY (settled with owner — don't relitigate)
- Product = **4 distinct templates** (original / gumroad / studio-dark / verdure), template-only
  (NO web editor). 4 is ENOUGH for the 5-year life: a student votes ≤4× (4-yr horizon), so 4
  distinct themes rotated = no voter ever sees a repeat.
- **Variety lever = per-template COLOUR THEMES**, NOT more templates (more templates = the
  maintainability risk). **No forced rotation / no repeat-guard** — the admin must be PROUD of
  their pick (an unloved theme = a soulless site).
- A colour theme must recolour the **WHOLE page** (background + dark surfaces + accent + ornaments),
  not just an accent dot — like a real dark/light theme. (Verdure proves this.)

## ✅ DONE THIS SESSION (committed on `new-version`)
- **Preview is COMPLETE**: 4 templates × 9 pages = 36/36 render, real components, filled bg, no errors.
  Fixes: distinct-family pages wrapped in `min-h-screen` + template bg (no white gap); classic/original
  party→`ClassicPartyPreview`, success→`SuccessPage editorMode`, results→`revealed` prop; single-vote
  ALL themes = the real page (classic via new `previewMode` prop on `SinglePartyView`).
- **Preview chrome**: `?chrome=1` full-screen toolbar + `TemplatePreviewWrapper.js` (device-viewport
  browser-shell: PC/Laptop/Tablet/Mobile) + device-aware peek carousel in the chooser detail.
- **VERDURE colour themes** (`ccda218`,`21cdaf9`,`1dc424a`): 4 full-palette themes
  (ดินเผา/น้ำผึ้ง/ทะเล/เบอร์รี) — each recolours cream(bg)+moss(dark surfaces)+terra(accent) cohesively.
  Mechanism: `VERDURE_THEMES` map + `verdureTheme(slug)` in `VerdureChrome.js`; `VerdureBaseStyles`
  reads the active slug (`useActiveTemplateId` live; `window.location ?slug=` effect on /template-preview)
  → interpolates `--cream*/--moss*/--terra*/--rule/--gold` on `.vd-root`. Chooser sidebar shows clickable
  swatches; selecting MORPHS in place (no reload, no jump to home) via `injectVerdureTheme()` pushing the
  palette onto the iframe's `.vd-root` + a `.vd-theming` class (CSS `transition: … .6s`). Registered
  verdure-honey/teal/berry in `BUILT_IN_TEMPLATES` (index.js — single source). Dispatch fixed:
  `=== 'verdure'` → `startsWith('verdure')` in app/{candidates,closed,party,results,success,vote}/page.js
  + HomeRenderer layoutFamily fallback.
- **Full-screen hang fixed** (`fd47042`): heavy pages (LiquidHero) didn't fire `onLoad` → iframe stuck
  at opacity 0 behind the spinner. Added a 1.4s fallback timer in TemplatePreviewWrapper.

## 🔧 NEXT TASKS (owner's latest feedback — do these)

### A) Full-screen preview UX (from the owner's screenshot, priority)
The `?chrome=1` full-screen view (TemplatePreviewWrapper + the chrome top bar built in
`src/app/template-preview/page.js` `PreviewPageControls`) needs:
1. **Add a THEME-COLOUR switcher** to the full-screen top bar (it's missing — you can only switch
   colour in the chooser detail, not in full-screen). For verdure, show the 4 accent swatches; clicking
   one should re-tint IN PLACE with the same morph (reuse the `injectVerdureTheme` idea on the wrapper's
   single iframe — TemplatePreviewWrapper iframes the raw page same-origin, so inject onto its
   `.vd-root`). Pass the swatches into TemplatePreviewWrapper's `actions` slot (already supported).
2. **Page selector is hard to see** — the `<select>` in `PreviewPageControls` is dark-on-dark in the
   neutral-900 bar. Make it clearly legible (lighter bg / border / a labelled button-group instead of a
   bare select).
3. **Slow load + the spinner "doesn't spin"** — verdure/vote pages are heavy (LiquidHero blob +
   continuous keyframes) so the iframe load janks the main thread and the CSS spinner stutters/freezes.
   Options: (a) reduce motion in preview — have heavy components honor `editorMode`/`previewMode` to
   pause continuous animations (LiquidHero, the `vdDot` pulse, framer loops); (b) a lighter load
   indicator outside the iframe; (c) lazy/defer the heaviest bits. This also fixes the screenshot-tool
   timeouts (renderer never idles).

### B) Roll out full-palette colour themes to the other 3 templates (same pattern as verdure)
For each: **gumroad**, **studio-dark**, **original** —
1. Find where its CSS vars live. ⚠️ gumroad is HARDER than verdure: its vars (`--ink/--cream/--pink/
   --lime/…`) are **duplicated per component** in styled-jsx (GumroadHome:271, GumroadVote:180, …), NOT
   one shared base like verdure's `VerdureBaseStyles`. So first either (i) extract a single `GumroadBaseStyles`
   (like verdure) and have every Gumroad* component render it + drop their local var blocks, or (ii) make
   each component read a shared `gumroadTheme(slug)` and interpolate. studio-dark: check its base-styles
   file similarly. original (OriginalHome): hand-crafted "gold" — tokenise carefully, do LAST.
2. Define full palettes (owner picks colours — propose 3-4 each like verdure's). Register N variant
   entries in `index.js` (layoutFamily = the family).
3. Fix dispatch `=== '<slug>'` → `startsWith('<slug>')` in app/*/page.js + HomeRenderer (the #1 gotcha).
4. The chooser already groups by family into swatches + does the in-place morph for verdure; generalise
   `injectVerdureTheme` to read each template's var set (e.g. carry a `themeVars` per variant, inject onto
   the iframe's themeable root via a `[data-theme-root]` attr) so it's not verdure-specific.

### C) Loose ends (still open, owner aware)
- `next build` full run NOT done across this arc (dev server live). Run it (stop dev first; Windows .next
  lock) before any merge — there are many commits to validate.
- `schema.prisma` still `activeTemplateId @default("classic")` — flip to `"original"` for fresh installs
  (small migration). The running DB is already `original`.
- `DesignLibrary.js` orphaned (delete when sure).
- gumroad colour-theme work was explicitly CANCELLED earlier then re-scoped under (B) — do verdure-style.

## KEY FILES
- `src/components/home/VerdureChrome.js` — `VERDURE_THEMES`, `verdureTheme()`, `VerdureBaseStyles` (the
  one-source recolour). The PATTERN to copy.
- `src/components/admin/TemplateChooserTab.js` — chooser; `injectVerdureTheme()`, `PreviewStage`
  (familySlug stable + themeSlug inject), `SidebarCard` (clickable swatches), `BrowserSlide`.
- `src/components/admin/TemplatePreviewWrapper.js` — full-screen device frame (`actions` slot, loaded fade).
- `src/app/template-preview/page.js` — preview route; `PreviewPageControls` (the chrome top-bar controls
  to extend in task A), `renderPage()`, `?chrome=1` branch.
- `src/components/admin/editor/templates/index.js` — `BUILT_IN_TEMPLATES` (register variants; single source).
- `src/components/admin/editor/templates/builtIn/verdure.js` — verdure + 3 variant entries (the template
  is `verdureTemplate`; variants spread it with new slug/name/colorSwatch).

## VERIFY (per CLAUDE.md Rule 8 — paste real output)
- Don't stop the owner's dev server (port 3000); use `preview_start`. Admin login:
  `node scripts/dev-admin-login.js` (self-serve, reads .env — never put literal creds in docs).
  Restore `activeTemplateId` to `original` after any apply test.
- Verdure/vote pages have heavy continuous animation → `preview_screenshot` TIMES OUT (renderer never
  idles). Verify via `preview_eval` reading computed styles / `.vd-root` vars / iframe content instead.
- Gate: `npm run e2e:gate` + `npm run smoke` (e2e BEFORE smoke — rate limiter).
