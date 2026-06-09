# HANDOFF — Gumroad element-first refactor (continue next session)

> ## ⭐ UPDATE 2026-06-08 — 3-LAYER MODEL + all pages atomized
> The vision was pinned down (align session): **Layer 1 atom → Layer 2 component
> (group, locked) → Layer 3 page/template**, each layer with presets + build-your-own.
> Layout = **Hybrid C** (compose visually, compile to responsive flex/grid, NO absolute
> canvas). This **supersedes PHASE3 D-306** (noted in that doc).
>
> Built a composition engine `src/components/elements/_composer/` (`Composition.jsx` renders
> a frame/atom/node descriptor tree; `registry.js` = atom palette). **10 Layer-1 atoms**
> (`elements/<type>/gumroad.jsx`) + **5 Layer-2 composites** (`src/components/composites/`):
> party-card, stat-card, member-tile, vote-party-card, info-card.
>
> **Every gumroad page's primary repeating composite is atomized** (candidates/results/party/
> vote/single-party/closed/success) — byte-faithful + responsive. `npm run build` ✓ 30/30.
> Deep passes still open: results race/winner/charts, party hero/missions/policies, success
> note/header. Home deferred (already element-ized). **Full inventory + per-page status +
> tradeoffs: persistent memory note `three-layer-editor`.** Editor UI (drag-group/ungroup/
> palette) is the next phase — the data model is now in place.

---


**Date:** 2026-06-06 · **Branch:** `new-version` · **Everything UNCOMMITTED** (commit only when the user asks).
**Build:** `npm run build` → ✓ Compiled successfully. All routes 200, no console errors.

Read this WITH the persistent memory note **`element-first-workflow`** (the operating
contract) and the older **`HANDOFF-gumroad-polish.md`** (design system + env quirks).

---

## 0. The vision in one paragraph (so you don't drift)

This site is a **Canva-style, template-swappable web editor** for the FMS election. A
template = **Layout + Theme + Element compositions** (VISION.md). Future admins pick a
base template (gumroad is template #2 of a planned ~5), then edit it no-code — swap
element variants, recolour, resize — and **save as their own template** into a heritage
gallery for juniors. So **everything we build must be a reusable LIBRARY ELEMENT**, not
code buried in a page. We are doing **gumroad FIRST, fully**, then other templates.

**Operating rule (decided 2026-06-06):** every new UI piece →
`src/components/elements/<type>/<variant>.jsx`, self-contained Lego brick, `data-element`
on root, exposes `--<ns>-*` Layer-2 vars. **Library-first, NOT template-lock** — a
template *references* elements; the "lock" is the snapshot at save time. Heavy editor
wiring (registry.js + PropertyPanel) is DEFERRED to the editor element-coverage phase;
authoring element-shaped now makes that additive, not a rewrite. **พอดีๆ, no over-engineer.**

---

## 1. What got done this session

### A. Party page → gumroad template
- NEW `src/components/vote/GumroadParty.js` — gumroad `/party` detail (hero + story +
  missions + policies + members + modal + gallery lightbox + back-to-vote bar). Per-party
  colour via `buildPartyTheme`. Modeled on GumroadSingleParty, no vote section.
- `src/app/party/page.js` — added `activeTemplateId` dispatch: `isGumroad ? <GumroadParty> : classic`. Classic cinematic page preserved.

### B. Per-party colour engine (no more hardcode)
- `src/utils/partyColors.js`:
  - `defaultPartyColor(i)` now **generates** via golden-angle hue rotation (137.5°,
    base hue 208 = blue), pastel S/L — replaces the hardcoded 8-colour list. Unlimited
    parties, evenly spread. Party 1 blue, 2 red-pink, 3 green, …
  - `buildPartyTheme(party, index)` — derives a full readable set (soft / main /
    textOnLight / textOnDark / gradient) from the one signature hex (admin pick via
    `Candidate.color`, else generated). Has HSL helpers (`clamp01` is a **function
    declaration** — hoisting matters, `DEFAULT_PARTY_COLORS` builds at module load).
- `src/components/EditCandidateModal.js` — the admin colour picker ALREADY existed; added
  a **live derived-palette preview** (3 swatches + gradient bar, "อัตโนมัติ" ↔ "จากสีที่เลือก").

### C. Shared navbar element + rollout (the big one)
- NEW `src/components/elements/site-navbar/gumroad.jsx` (+ `index.js`) — the gumroad
  navbar as ONE element. 3 balanced zones (brand / centred nav / actions) so the centre
  nav stays centred regardless of logged-in name width (**fixed the off-centre bug**).
  Embeds the shared `GumroadMobileMenu`. Own `@media (max-width:900px)` for burger.
- **Rolled out to ALL 8 gumroad pages** (home, candidates, party, results, vote,
  single-party, closed, success): removed every `g*-topbar` markup + CSS, replaced with
  `<SiteNavbar active=".." />`. `active` = "home" / "candidates" / "results" / "" (vote,
  single-party, closed, success have no active link).

### D. HOME fully element-ized
GumroadHome is now **pure Layout** (mosaic grid + the hero SECTION shell: `.gh-hero` card
+ eyebrow sticker + `.gh-cta` wrapper + mobile meet shortcut). Extracted into the library:
- `home-ticker/gumroad`, `site-footer/gumroad`, `hero-countdown/gumroad`,
  `stats-voted-card/gumroad`, `stats-eligible-card/gumroad`, `meet-section/gumroad`,
  `hero-title/gumroad`, `hero-subtitle/gumroad`, `hero-year-badge/gumroad`.
- Each: `data-element`, self-contained scoped CSS, `--ns-*` vars (hardcode the ละมุน
  palette as fallback). Layout resolves text (bindings/getText) + keeps the editor `Wrap`,
  passes resolved text/style as props. voteCTA was already a real library element.

### E. SAMO title overflow fix (edge-case tested)
- `hero-title/gumroad.jsx`: the title was sized `13cqw` of the **whole page**, but lives
  in a ~1.6/3.6-width tile → overflowed (SAMO 19–105px, long names 256–342px). Fixed:
  wrap in a `container-type:inline-size; width:100%` div → font `clamp(42px, 29cqi, 128px)`
  relative to the TILE + `overflow-wrap:anywhere`. **Re-tested 320–1512px × SAMO/long
  names → 0 overflow everywhere.** (`width:100%` is essential — `.gh-hero` is
  `align-items:center` on tablet/phone which would otherwise collapse the container.)

---

## 2. Files touched (all uncommitted on `new-version`)

**New element files** (`src/components/elements/`):
`site-navbar/gumroad.jsx`+`index.js`, `home-ticker/gumroad.jsx`, `site-footer/gumroad.jsx`,
`hero-countdown/gumroad.jsx`, `stats-voted-card/gumroad.jsx`, `stats-eligible-card/gumroad.jsx`,
`meet-section/gumroad.jsx`, `hero-title/gumroad.jsx`, `hero-subtitle/gumroad.jsx`,
`hero-year-badge/gumroad.jsx`.
**New:** `src/components/vote/GumroadParty.js`.
**Modified:** `src/utils/partyColors.js`, `src/components/EditCandidateModal.js`,
`src/app/party/page.js`, `src/components/home/GumroadHome.js`,
`src/components/vote/Gumroad{Candidates,Results,Vote,SingleParty,Closed,Success}.js`.
**Memory:** `element-first-workflow.md` (+ MEMORY.md index).

---

## 3. NEXT — start here

**Continue element-extraction page by page** (same recipe as home). Suggested order:
1. **candidates** — small: navbar done; extract the head (title/subtitle/counter/confetti)
   + `candidates-party-card` (`gc-card`) into elements.
2. **results** — content-rich: race rows / winner card (`result-card-winner` per D-009) /
   demographics charts / stat tiles → elements.
3. **party** (GumroadParty) — hero / story / missions / policies / members + modal → elements.
4. **closed** — small: icon card + message → element.

**ON HOLD (do NOT touch until the user verifies + says go):** `vote` (single-party AND
multi-party) and `success`. The user wants to confirm those pages work first.

**Separate follow-up tasks (not now):**
- **Token reconciliation:** Layer-1 `--color-*` are STALE vs the live ละมุน palette
  (`--color-border` #1A1A1A ≠ ink #26271c; `--color-primary` #8A2680 purple ≠ pink
  #FF9CE9). New elements hardcode ละมุน + expose `--ns-*` (Rule 9) and do NOT chain to
  `--color-*`. Someday: update `templates/builtIn/gumroad.js` tokens to match ละมุน.
- **Editor wiring:** register the new elements in `registry.js` (the `navigation`
  category is reserved+empty for site-navbar) + PropertyPanel — the element-coverage phase.

---

## 4. Recipe for extracting an element (proven this session)

1. Create `src/components/elements/<type>/gumroad.jsx`:
   - `"use client"`, render the markup with `data-element="<type>" data-variant="gumroad"`.
   - Move that piece's CSS into the element's `<style jsx global>`; convert palette refs
     to `var(--ns-x, <ละมุน hex>)` (cream #FFF6EC, ink #26271c, pink #FF9CE9, lime #C2F47E,
     paper #FFFDFA, fonts via `--font-archivo`/`--font-space-grotesk`/`--font-anuphan`).
   - Receive DATA as props (layout resolves bindings/getText/getPath).
2. In the page (layout): import it, replace the markup, **keep** the `Wrap`/`data-element`
   editor seam + grid-area wrapper, remove the moved CSS from the page's `<style>`.
3. Remove now-unused imports (e.g. `Image`, `Calendar`) or the build warns.

**Gotchas that bit me:**
- styled-jsx: **NO backticks inside CSS comments** — they terminate the `` ` `` template
  literal → "Syntax Error", blank page. (Cost me a debug cycle.)
- Container-relative font (`cqi`) needs a wrapper `container-type:inline-size` AND
  `width:100%` (flex `align-items:center` collapses it otherwise).
- `<style jsx>` inside `<h1>`/`<p>` is invalid — use a `<>…</>` fragment sibling.

---

## 5. Env / verify quick-ref (see HANDOFF-gumroad-polish.md for full)

- **Preview:** `preview_start` name `dev`, port 3000, `http://localhost:3000/fms-ovs`
  (no trailing slash). Kill animations before `preview_screenshot`
  (`*{animation:none!important}` via `preview_eval`) or ticker/ekg hang it.
- **Build:** `preview_stop` FIRST (Windows `.next` lock), then `npm run build`, then restart.
- **Admin:** `node scripts/dev-admin-login.js --show` → POST `/api/admin/login` in the
  preview browser to set the cookie (admin_token ≠ NextAuth student session).
- **Student-gated pages** (vote/success/single-party): mock-login `/login`, student
  `6610510148` (isVoted toggles vote↔success).
- **DB state:** `systemMode=MANUAL_OPEN, showResult=true, activeTemplateId=gumroad`;
  temp party #2 "พรรคทดสอบ TEMP" kept on purpose (`node scripts/tmp-party.js add|remove`).
- **Verify with computed values** (`preview_eval` getComputedStyle), not just screenshots.
  Always check `preview_console_logs level=error` after changes.

---

## 6. Working agreements (don't relearn the hard way)

- Iterate one page/element at a time, SHOW it, get a reaction. Offer 2–4 variants for
  subjective choices. **honest > encouraging** — flag risk, don't over-promise, no
  silent scope cuts (vision-fidelity).
- Don't big-bang the most-polished pages; verify each breakpoint. Byte-faithful unless
  the user asked to change the look.
- Reply in Thai. No tilts (เบี้ยว). Soft ละมุน tone. Each page keeps its own identity.
- Commit ONLY when asked. Don't delete the temp party.
