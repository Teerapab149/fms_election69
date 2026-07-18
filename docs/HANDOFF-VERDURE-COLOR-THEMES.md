# HANDOFF — Verdure colour themes (accent-swap) + the strategy behind it

Written 2026-06-29 (planning only; session ended before implementation). Branch `new-version`.
For the next session to EXECUTE. Self-contained.

## WHY (the strategy we settled on)

Owner question: "are 4 themes enough for a 5-year-life system?" Conclusion after discussion:

- **The audience horizon is 4 years, not 5.** A student studies ≤4 years → votes ≤4 times.
  So **4 distinct layouts, rotated, means no single voter ever sees a repeat** (any 4-consecutive-year
  window = all 4 distinct). The global repeat at year 5 is invisible (no student spans years 1 & 5).
- **Do NOT force a rotation / block reuse.** Owner's principle: *the admin must be PROUD of the
  design they pick* — forcing an unloved template kills the site's soul. So **no repeat-guard**
  (at most a passive "ใช้ล่าสุด: SAMO 49" info label, never a block).
- **Variety lever = per-template COLOUR THEMES, not more templates.** More full templates = more
  components × pages to keep alive across 5 years of Next/React upgrades = the real longevity risk
  (Pillar 3, MAINTAINABLE). Colour themes give a rich menu (4 layouts × N palettes) while keeping
  only 4 layouts to maintain. Owner is OK that variants of one template look similar.
- So: **freeze at 4 layouts, add colour themes.** This task = the FIRST colour-theme template (verdure),
  as the proof + pattern to replicate to gumroad / studio-dark / original.

See `[[admin-template-only-redesign]]`, `[[five-year-readiness-plan]]`, `[[template-direction-5x4]]`.

## GOAL

Give **verdure** 4 selectable **accent** themes (same cream/moss layout, different accent), shown as
swatches on the verdure card in the template chooser (exactly like classic's modern-dark/playful/minimal
swatches work today). Owner-approved palette:

| slug | name | accent (primary) | accent-2 (darker) | mood |
|---|---|---|---|---|
| `verdure` | เวอร์เดอร์ · ดินเผา | `#BC5E3E` (terracotta, current) | `#A24E32` | warm (default) |
| `verdure-honey` | เวอร์เดอร์ · น้ำผึ้ง | `#C99A3F` | `#A87F2E` | luxe / bright |
| `verdure-teal` | เวอร์เดอร์ · ทะเล | `#2F8C8C` | `#246F6F` | fresh |
| `verdure-berry` | เวอร์เดอร์ · เบอร์รี | `#9B3B6A` | `#7E2E55` | bold |

**Keep cream (`#F4ECDB`) + moss (`#1F3A2C`) FIXED** — they ARE the verdure identity. Only the accent swaps
(matches the original "green base + 4 accent-swap" vision).

## AUDIT FINDINGS (from this session — verify before editing)

- Verdure colours are **hardcoded per component** (JS consts + styled-jsx + inline styles), NOT a shared
  CSS var. `VerdureHome.js` references a `terra` identifier ~12×; `VerdureChrome.js:188` has the literal
  `#BC5E3E` / `#A24E32`. No `--vd-*` vars exist yet. (verdure.js DEFINES `theme.tokens` like
  `--color-primary: TERRA` but the components don't read them — Rule 9 hardcoded.)
- **Verdure surface (≈13 files):** `home/VerdureHome.js`, `home/VerdureChrome.js`,
  `vote/Verdure{Shell,Vote,SingleParty,Candidates,Party,Results,Success,Closed,MemberModal}.js`,
  `login/VerdureLogin.js`. Each likely defines its own `const terra`/`moss`/`cream` (CONFIRM with
  `grep -n "const terra\|const moss\|const cream\|terra =" src/components/**/Verdure*.js`).
- **Dispatch checks use exact equality** `activeTemplateId === 'verdure'` (`isVerdure`) in:
  `app/{candidates,closed,party,results,success}/page.js` (grep gave line numbers). Home dispatch is in
  `components/home/HomeRenderer.js` (keyed by slug). `template-preview/page.js` already uses
  `family === 'verdure'` (family-based — fine). **These exact checks are the #1 gotcha** (below).

## APPROACH (recommended — minimal, low-risk)

**Tokenise the accent via one CSS var, swap it per theme.**

1. **Introduce `--vd-accent` + `--vd-accent-2`** at the verdure root. The cleanest injection point is
   `VerdureChrome` (the base wrapper every verdure page renders through) — emit a `<style>`/styled-jsx
   `:root`/scope that sets them, defaulting to terracotta, **overridable from the active template's accent**.
   - Thread the accent in: `VerdureChrome` reads the active template's accent (e.g.
     `BUILT_IN_TEMPLATES[activeTemplateId]?.colorSwatch?.primary` and a matching `accent2`), or accept an
     `accent`/`accent2` prop the page passes after resolving `activeTemplateId`.
2. **Replace hardcoded terra with the var.** If each component has `const terra = "#BC5E3E"`, change it to
   `const terra = "var(--vd-accent)"` (and `terra2`/`#A24E32` → `var(--vd-accent-2)`). styled-jsx
   `${terra}` and inline `style={{color: terra}}` both accept a `var(...)` string → near one-line per file.
   Do the same for the literal hex in `VerdureChrome:188`, `VerdureMemberModal`, `VerdureLogin`.
   - Leave the chooser-swatch/loading files that reference terra for *display* (`PageDesignTab`,
     `DesignLibrary`, `ThemedLoadingScreen`) — those are not the verdure page itself.
3. **Register the 4 themes** as built-in templates, **in BOTH places** (the two-place rule —
   `[[template-build-recipe]]`):
   - `src/components/admin/editor/templates/index.js` → `BUILT_IN_TEMPLATES` (add `verdure-honey/teal/berry`;
     each `...verdureTemplate, slug, name, colorSwatch:{primary:accent, secondary:MOSS, background:CREAM}`,
     and a token/accent field carrying accent + accent-2).
   - the template registry/infos (`templateEngine.js` `TEMPLATE_INFOS` or equivalent — confirm path).
   - All four share `layoutFamily:"verdure"` → the chooser auto-groups them into one card with 4 swatches
     (see `TemplateChooserTab` SidebarCard / the families grouping — already handles multi-theme families).
4. **Fix the dispatch checks (gotcha #1):** change every `activeTemplateId === 'verdure'` →
   `activeTemplateId?.startsWith('verdure')` in `app/{candidates,closed,party,results,success}/page.js`,
   and make `HomeRenderer` map all `verdure*` slugs → `VerdureHome` (or key by `layoutFamily`). Otherwise
   `verdure-honey` falls through to the classic layout. (studio-dark already uses `startsWith` — mirror it.)
5. **Apply flow check:** applying `verdure-honey` sets `activeTemplateId`; pages dispatch verdure layout
   (step 4); `VerdureChrome` sets `--vd-accent` from that slug's accent (step 1) → everything recolours.

## VERIFICATION (paste real output — Rule 8)

- `npm run build` GREEN (stop dev first; Windows .next lock).
- In-browser, apply each of the 4 verdure themes (or preview `?slug=verdure-honey&page=home` etc.):
  buttons / discs / dock / marquee / wax-seal intro recolour to the accent; **cream + moss base unchanged**;
  default `verdure` still byte-identical terracotta (regression gate).
- Screenshot all 4 on home + vote·single (the intro) + results.
- Chooser: verdure card shows 4 swatches; clicking each applies + the live site recolours.
- `npm run e2e:gate` + `npm run smoke` still green.

## THEN — rollout to the other 3 (same pattern)

Once verdure proves it: repeat for **gumroad** (swap lime/pink accents), **studio-dark** (swap the lime
accent), **original** (tokenise the purple accent — careful, OriginalHome is the hand-crafted "gold"; do
last + most carefully). Each: pick the swappable colour(s), tokenise to a `--XX-accent` var, register N
theme entries (two places), fix `=== 'slug'` → `startsWith`. Owner picks every palette (design = owner's eye).

## PITFALLS

- **#1 the `=== 'verdure'` exact checks** — miss one and that page renders classic for `verdure-*`. Grep them all.
- Two-place registration (index.js + the infos registry) or the theme won't appear / won't resolve.
- Keep base identity (cream/moss) fixed; only accent is a var. Don't tokenise everything.
- `colorSwatch.primary` per variant must equal its accent so the chooser swatch shows the right colour.
- Verify each component actually defines `const terra` (vs importing) before assuming the one-line swap.
