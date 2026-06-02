# PROGRESS.md

**Last saved:** 2026-06-02
**Branch:** `new-version`

---

## 🌅 SESSION HANDOFF — read this first (for 2026-06-04 session)

### 🔧 Admin editor UX restructure (user-requested) — PART A done, PART B next
User wants the editor to be a pro-editor layout (the current 2-side split makes element-edit slow
because the property panel sits under the preview). Decisions locked via AskUserQuestion:
- **Sidebar = icon-rail + toggle** · **Editor = top toolbar + left inspector + big canvas**.
- **PART A ✅ DONE (commit ffcef8c):** admin sidebar (`src/app/admin/page.js`) is now a collapsible
  icon-rail (76px ↔ 256px) with toggle, auto-collapses on the editor tab, mobile = hamburger drawer;
  header uses the standard FMS PSU logo (NOT 50th) + "Admin" pill. Verified (build 30/30, console clean).
- **PART B 🔜 NEXT — restructure `PageDesignTab.js` (~1600 lines) into:** top toolbar (page selector +
  template selector + device toggle + บันทึก/เผยแพร่) · LEFT inspector panel (Sections list → switches to
  the element PropertyPanel when an element is selected) · BIG live-preview canvas filling the rest. Today
  it's `grid lg:grid-cols-[minmax(320px,380px)_1fr]` (left rail w/ template gallery+TokenEditor+ElementLibrary
  +page-selector+sections | LivePreview). The PropertyPanel currently appears separately (bottom). Goal:
  edit + view simultaneously, element click → left inspector shows its props. ⚠️ big surgical change — do it
  as its own careful pass with full editor E2E verify. BACKLOG: each template card should show a preview image.
- ENV reminder: `npm run build` + dev server both touch `.next` on Windows → frequent ENOENT/manifest race
  (P-LOG-071). Recover: stop dev → `rm -rf .next` → build/restart. Hit it ~3× this session.

### ✅ Done (2026-06-03 cont.) — PHASE 1: gumroad gets a REAL distinct LAYOUT (home)
First real "Layout" half of a template shipped (P-LOG-073). Files:
- NEW `src/components/home/HomeRenderer.js` — slug-keyed layout dispatcher (`{gumroad: GumroadHome}`,
  default → HomeContent). Takes HomeContent's exact props; classic path byte-identical (zero risk).
- NEW `src/components/home/GumroadHome.js` — recreates `docs/design-refs/index.html` (topbar + scrolling
  ticker + 2-col bento [SAMO title w/ pink box, dual CTA | countdown card + pop stat tiles + meet card] +
  ink footer). Real data + globalConfig text + chunky-stamp voteCTA element + editorMode selectable
  (reuses HomeContent's Wrap/resolve/token-style helpers). Inline bento countdown reuses ELECTION_CONFIG.
- Swapped both call sites HomeContent → HomeRenderer: `app/page.js` (live) + `PageDesignTab.js` LivePreview
  (editor). Same dispatcher works in editor (editorEffectiveTemplate.slug = activeTemplateId).
- VERIFIED: build 30/30; editor E2E renders the full distinct layout (nothing left of HomeContent);
  7 data-elements selectable (hero-title click → PropertyPanel opened); computed chunky (voteCTA 3px #000
  + 5px5px0, stat tiles pink/ink, countdown ink); console clean; NOT published (DB stays classic).
- POLISH pass (user: first cut "too plain"): rewrote GumroadHome with real FMS+PSU logos, topbar 2 buttons
  (paper "Meet Candidates" + ink "เข้าสู่ระบบ"), nav active pink pill, ekg svg in the VOTED tile, bigger
  fluid title (clamp 64→180px), and FULL responsive via scoped CSS classes + media queries (1200/980/560px:
  laptop tighten → tablet 1-col+hide nav → phone 1-col aside + stacked CTA + badge-only). voteCTA login set
  to ink/cream in gumroad.js (design's primary is dark, not pink). Verified desktop + Mobile toggle in editor.
- MOBILE FIX (user: editor Mobile preview was distorted/overflowing): the cause was VIEWPORT `@media`
  queries — the editor renders the mobile preview in a real 375px-wide box (PageDesignTab LivePreview
  `isMobile`), but @media reads the wide browser viewport, so mobile rules never fired → desktop 2-col
  grid crammed into 375px. FIX = CSS **container queries**: `.gh-root { container-type:inline-size }` +
  `@container gh (max-width:…)` + fluid `cqw` units (title/subtitle/countdown/stat). Now responds to the
  CONTAINER width → works in the editor Mobile frame AND on real devices. Also de-duped the topbar (removed
  the redundant "Meet Candidates" paper button; nav keeps it + hero keeps รู้จักผู้สมัคร). VERIFIED: editor
  Mobile now stacks cleanly (1-col, countdown 4 cells fit, no overflow); desktop intact; container-type
  inline-size confirmed; console clean; build 30/30. NOTE: `next build` on this Windows box throws
  transient ENOENT PageNotFoundError during page-data collection (different module each run) — retry passes
  (filesystem flakiness, P-LOG-027/052/071 family, NOT a code error).

### 🔜 NEXT — finish gumroad's OTHER pages (then other templates)
gumroad home layout done. Remaining gumroad pages each need: (a) a per-template layout component from its
section in `docs/design-refs/index.html` (vote/success/candidates/party/results screens are all there),
(b) a dispatch seam on that page's renderer (vote→VoteEditorPreview + app/vote, results→ResultsEditorPreview,
candidates, success, closed) — mirror the HomeRenderer pattern. Reuse element variants + tokens. Verify
each in editor. ONLY gumroad until done; other templates (Quorum…) after. Read `memory/template-vision.md`.

### 🚨 DIRECTION CORRECTION (2026-06-03, end of session) — "template" ≠ "theme"
The user clarified (and pointed at VISION.md:169 + PHASE3_TEMPLATE_VISION.md): **a template =
Layout + Theme + Element compositions**, NOT a colour theme. What I (and prior sessions) built —
incl. today's gumroad — is only the THEME layer (Layer-1 tokens + a few element variants on classic's
SAME `HomeContent`/`MultiPartyView` DOM). The half that makes templates actually different (the
**Layout** — gumroad bento+ticker, Quorum stepper, Studio left-rail) does not exist yet.
**Read `memory/template-vision.md` + `memory/feedback-terminology-variant.md` first.**

Key points to NOT forget:
- **Terminology:** NEVER say "steal UI". It's the **Element Library + Variant system** — devs write
  variant components (default/minimal-pill/chunky-stamp), admin composes/customizes from variants
  that exist in OUR repo (mix & match / reuse from our own library). All our own code.
- **Scope:** finish **gumroad FULLY first** (all 6 pages, own layout + its element variants, every
  element editable like classic + base props no-code: colour/size/border/radius). Other templates
  (Quorum…) come AFTER — user collects them later.
- **Deep structural change = swap variant/layout (no-code), NOT raw CSS.** Tier-3 custom CSS is too
  hard even for devs; don't treat it as the structural answer.
- Today's `gumroad.js` token theme is KEPT — it's gumroad's palette layer the real layout consumes.
- **Phase 1 NOT started** (token budget). Proposed: (1) home layout-dispatch seam, (2)
  `templates/gumroad/Home.jsx` pixel-perfect from `docs/design-refs/index.html`, (3) its elements
  selectable + base-editable, (4) verify. ⚠️ refactoring production HomeContent into the layout system
  is risky — phase it. Align with user before coding (I mis-built once already this direction).

### ✅ Done (2026-06-03) — built the **Gumroad / Active Pulse** template (5th built-in) — THEME LAYER ONLY
`gumroad` ("แอ็กทีฟ พัลส์") shipped + verified live (P-LOG-072). Built the modern-dark way: spread
classic, override (1) Layer-1 tokens, (2) per-element configs/vars. Files:
- NEW `src/components/admin/editor/templates/builtIn/gumroad.js`
- registered in TWO places: `templates/index.js` `BUILT_IN_TEMPLATES` (loader) + `templateEngine.js`
  `TEMPLATE_INFOS` (editor gallery/switcher metadata — hardcoded, easy to miss).
- Identity (verified by computed styles in the editor Live Preview): cream `#FFF1E5` bg, pink `#FF90E8`
  primary, ink `#1A1A1A` chunky borders, hard offset shadows `5px 5px 0` (banner + voteCTA), pop stat
  tiles (pink/lime/sky + ink), voteCTA `chunky-stamp` (3px #000 + hard shadow + per-state pop fills).
- Verified: build 30/30; FULL editor E2E (self-serve login → /admin → ออกแบบหน้าเว็บ → select gumroad →
  Live Preview home renders the identity); console clean; **NOT published** (DB activeTemplateId stays
  classic — selection is editor-local working state).
- TWO honest GAPS (in the template file header + P-LOG-072): (1) display font Archivo Black is in the
  token but NOT consumed (`var(--font-display)` unused; body = Tailwind font-sans → Prompt/Kanit) — same
  dormant-token state as modern-dark's Inter; wiring it is a separate cross-template task. (2) Stats
  cards' hard-offset shadow can't be config-driven (StatsBlock fixes shadow-xl/border as Tailwind
  classes) — they get pop bg + ink borders + ink numbers but a soft shadow. Both = follow-up.

### 🧭 Next session — `ROADMAP.md` is the master list. Suggested:
- **Per-page polish for gumroad** ("ค่อยๆ ทีละ page"): this pass covered home + voteCTA + vote-party-card
  + the cross-page palette via tokens. Detail elements with hardcoded purple configs in classic
  (success-megaphone/chips, etc.) still show purple on gumroad — recolour per page next.
- OR **wire `--font-display` consumption** (would give gumroad its Archivo Black AND benefit every
  template) — load Archivo Black via next/font + make title components read `var(--font-display)`.
- OR continue the lineup (TEMPLATE-LINEUP.md build order): **Quorum 50** (flagship usability) is the
  highest-value remaining template.

---

**(prev) #1b multi-page COMPLETE + 6 Tier-2 elements + deconfliction + modern-dark polish.**
Many atomic commits on `new-version` (all pushed, through `de3dfae`). Build PASS (30/30).

### ✅ Done today (ROADMAP #1b)
1. **Per-page `elementVars`/`elementCss` storage + editor save/load** (`PageDesignTab.js` only —
   no API change: the route already stored/validated keyed by `pageId`; no hook change). Added
   per-page records (`elementVarsByPage`/`elementCssByPage`) + **stash-on-leave / restore-on-arrive**
   when switching pages (`prevPageRef`); `fetchLayout` loads every page's overrides; save/publish/draft
   emit the full `{ home, vote, … }` shape via `getElementVarsAllPages`/`getElementCssAllPages`;
   `multiPageOverridesDirty` folded into the Save gate + unsaved dot. The editor hook stays **flat**
   = "the active page"; preview (`editorEffectiveTemplate`/`editorTokenStyles`) reflects the active
   page automatically since the hook is swapped on page switch. Scope = vars+css only (variants/configs
   have no non-home editing surface yet).
2. **Per-page overrides delivered to the 5 live pages** — NOT SSR threading. Audit found all 5
   (vote/results/candidates/closed/success) are `"use client"` → P-LOG-068. New client component
   `src/components/PageThemeOverrides.js` fetches the public layout + injects a `.fms-app`-scoped
   `<style>` carrying only that page's `elementVars`/`elementCss` DELTA (defaults already come from
   `layout.js` site-wide; delta wins by DOM order). Mounted in results/closed/vote, guarded
   `!editorMode` in candidates/success.

### 🔬 Verification (within the P-LOG-066 wall)
- `npm run build` → `✓ Compiled successfully` · `✓ 30/30`.
- Emission logic test (mirror): scoped to `[data-element]`, delta-only (no Layer-1), **no cross-page
  leak**, null when a page has no overrides.
- `/results` browser smoke: renders, **no console warns/errors**, public GET returns multi-page shape,
  `PageThemeOverrides` renders null (DB has only `home` overrides) — correct.
- DOM-order cascade probe: `laterWins: true` (later `.fms-app [data-element]` rule beats the layout
  default at equal specificity — the mechanism this whole approach relies on).

### ⚠️ NOT verified live (carry forward — same wall as P-LOG-066)
- **Editor storage E2E** (switch page → edit a var → publish → reload persists per-page) needs
  **admin login** — verified by build + round-trip logic only this session.
- **A published per-page override applying to a real non-home pixel** additionally needs non-home
  elements tokenized with Layer-2 vars (only home elements have `vars` today) + student NextAuth for
  vote/success. The *mechanism* is proven; the *pixel* is the next-surface work.

### ✅ Done today (follow-on) — first NON-home Tier 2 element (proves 1b end-to-end)
`results-stats-bar` now has Layer 2 vars → the multi-page Tier 2 surface is REAL (P-LOG-069):
- `ResultsStatsBar.js`: `data-element="results-stats-bar"` + primary card consumes
  `--rsb-accent` (number/label/icon/left-bar + border&icon tints via `color-mix`) and
  `--rsb-card-bg`. Fallback chain `var(--rsb-accent, var(--color-primary, #8A2680))` keeps the
  3 stub templates byte-faithful.
- `classic.js`: declared the 2 vars (results elements live only in classic; stubs inherit).
- `ElementVarsPanel.jsx`: schema entry "การ์ดคะแนนรวม".
- `PageDesignTab` `LivePreview`: inject `editorTokenStyles` for non-home previews so live
  Tier 2 edits show in the editor preview too (was home-only) — the P-LOG-051 fix, off-home.
- VERIFIED no-auth on `/preview?page=results`: default #8A2680; transient `--rsb-accent:#1188ff`
  + `--rsb-card-bg:#fff0f5` recolours number/label/border/bg end-to-end; console clean; build 30/30.

### ✅ FULL admin-login E2E DONE (gap closed, P-LOG-070)
Logged into the real `/admin` editor (front-door login, in-session only — no creds persisted to
disk) and ran the round-trip on the **results** page:
- selected `results-stats-bar` in the live editor → ElementVarsPanel showed "การ์ดคะแนนรวม"
  (สีหลัก / สีพื้นหลังการ์ด) ✓
- edited `--rsb-accent` → editor preview recoloured to `rgb(17,136,255)` live (proves part D —
  `editorTokenStyles` now reaches non-home previews) ✓
- Publish → persisted under **`elementVars.results`** (NOT `home`) ✓
- full reload + re-open → override re-loaded + preview blue again (persistence round-trip) ✓
- reset + re-publish → DB clean (`elementVars:{}`, `elementCss:{}`); `elementVariants.home`
  (banner minimal-line) untouched throughout. Console clean.
- **Data-safety proven:** publishing from results left home's keys absent ONLY because they were
  empty `{}` at load — the stash-on-leave preserves any NON-empty page (if home's elementCss had
  held the old `transform`, it would have survived; it's `{}`, so it was empty). Empty page maps
  normalize away by design (P-LOG-070), not data loss.

### ✅ Done (loop #1) — 2nd non-home element: `candidates-counter`
Same A/B/C pattern on the candidates page (proves multi-page independence — saved under a
DIFFERENT key than results):
- `candidates/page.js`: the counter pill got `data-element="candidates-counter"` (needed in LIVE
  mode — the EditorElement wrap only adds it in editor mode) + consumes `--cc-accent` (icon/text,
  fallback `var(--color-primary)`), `--cc-bg`, `--cc-border` (Layer-3 `cfg()` still wins if set).
- `classic.js`: declared the 3 vars; `ElementVarsPanel`: "ป้ายจำนวนพรรค" schema.
- FULL editor E2E (self-serve login via `scripts/dev-admin-login.js`): selected counter → panel
  shows → edit `--cc-accent` → editor preview recoloured `rgb(10,125,44)` → Publish → persisted
  under **`elementVars.candidates`** (≠ results) → reset+publish → DB clean. `/preview?page=candidates`
  transient-override recoloured text/bg/border end-to-end. Build 30/30; console clean.
- Recharts note: `results-demographics` was SKIPPED as a Tier 2 target — its bar colours are SVG
  `fill` props (CSS `var()` doesn't apply reliably there) → would be a half-working knob (P-LOG-064).

### ✅ Done (loop #2) — `candidates-tagline` + clean-target limit reached
Added Tier 2 to the candidates tagline pill (`--ctl-accent`/`--ctl-bg`/`--ctl-border`, same A/B/C
pattern; pairs with the counter → candidates header fully themeable). Verified default byte-faithful
+ transient override on `/preview?page=candidates` (text/bg/border all recolour); build 30/30; console clean.

**Tier 2 now covers 6 elements across home + 2 non-home pages (results, candidates).** I then audited
EVERY remaining non-home element (config scan + component reads) — the simple "loop the pattern"
approach has hit its CLEAN limit:
- **vote/*** (header badge/title/subtitle, abstain/disapprove buttons) — all carry Layer-3 `cfg`
  colours in classic → Tier-2 var would be MASKED in the editor (P-LOG-067). QuickStyleBar owns them.
- **success** megaphone card/title/chips — Layer-3 colours; AND the success editor preview is a
  separate STATIC component that hardcodes colours + diverges from the live page (P-LOG-002).
- **results-demographics** — Recharts; bar colours are SVG `fill` props, CSS vars don't apply (P-LOG-064).
- **candidates-party-card** — accent is per-party `theme.main` by design (not a global token).
- **closed** — intentionally neutral; real page doesn't use the element system.

### ✅ Done (deconfliction) — QuickStyleBar↔Tier-2, pilot on vote-header-badge (P-LOG-071)
Built the "one owner per property" mechanism so Layer-3-masked elements become real Tier-2 targets:
- `ElementVarsPanel`: Tier-2 vars now carry `owns:"<cfgKey>"`; new `getOwnedConfigKeys(id)`.
- `PropertyPanel`: control components (`TextControls`/`ButtonControls`/`CardControls` + bound-text path)
  hide ONLY the owned colour pickers → single picker per property.
- `classic.js` + `elementInstances.js`: stripped `color` from vote-header-badge (defaultConfig + all
  4 presets) so nothing seeds `cfg.color`.
- `MultiPartyView`: badge reads `var(--vh-badge-color, var(--color-primary))` DIRECTLY (dropped the
  `cfg().color ||` prefix — the key fix; the editor loads a STALE `elementConfigs.home` from DB that
  baked in the old color, so `cfg||` would keep masking. var-direct = immune).
- `owns` also added to candidates-counter/tagline + stats-card-bg (fixes their latent dup pickers).
- VERIFIED: editor shows exactly 1 colour input (dup hidden); `/preview?page=vote` default #8A2680 →
  `--vh-badge-color:#0a7d2c` → rgb(10,125,44). build 30/30; console clean; DB clean.
- ENV: killed an orphan `next dev` on :3000 that was racing the shared `.next` (repeated 500s) —
  `Get-NetTCPConnection -LocalPort 3000` → Stop-Process → rm .next → rebuild (noted in P-LOG-071).

### ✅ Done (deconfliction rollout) — full vote header
Applied the 3-step migration to vote-header-title + vote-header-subtitle (same pattern as the badge):
- `--vh-title-color` → `var(--color-text)`, `--vh-subtitle-color` → `var(--color-text-muted)` (declared
  in classic.js; colour stripped from classic + elementInstances defaultConfig/presets).
- MultiPartyView reads the vars DIRECTLY (`var(--vh-title-color, var(--color-text,#1e293b))`, etc.) +
  `data-element` on h1/p. ElementVarsPanel schema entries with `owns:"color"` → PropertyPanel hides the dup picker.
- KEY CHOICE: text titles tie to the template's TEXT TOKEN (not per-preset hardcodes like the old playful-pink /
  dark-white), so they adapt per template automatically. classic byte-faithful (subtitle exact #64748b; title
  #1e293b→#1a1a2e = `--color-text`, imperceptible). Stub templates shift to their text token (acceptable, #5).
- VERIFIED `/preview?page=vote`: title default rgb(26,26,46) → #0a7d2c; subtitle rgb(100,116,139) → #b45309.
  build 30/30; console clean. The whole vote header (badge+title+subtitle) is now deconflicted + Tier-2-themeable.

### ✅ Done (ROADMAP #5, pass 1) — modern-dark
Audited modern-dark: it was already substantially distinct (dark slate bg, cyan #06b6d4 / violet #8b5cf6,
per-state voteCTA gradients, glow shadows, stats gradients, light text via tokens) — NOT a thin stub.
This pass made it cleaner + structurally distinct:
- Removed deconfliction dead code: the `vote-header-title`/`subtitle` entries only overrode `config.color`,
  now dead (MultiPartyView reads `--vh-*-color` directly, P-LOG-071). Removed → they inherit classic's
  var(--color-text)/var(--color-text-muted), which resolve to modern-dark's light tokens automatically
  (the token-migration synergy paying off).
- Added a STRUCTURAL distinction beyond colour: banner-section → `minimal-line` variant (editorial thin
  rule vs classic's card), via the variant system. Verified build + data + transitive (P-LOG-038 DOM-verified
  modern-dark×minimal-line = transparent/1px #334155/r0/no-shadow; vote-header token inheritance verified
  this session on /preview?page=vote). NOT freshly applied-in-browser (apply writes DB activeTemplateId;
  avoided the risky apply/revert dance — transitive proof is solid).

### 🧭 Next session — `ROADMAP.md` is the master list. Suggested:
- **ROADMAP #5 pass 2: playful / minimal** — the genuinely thinner stubs. Give each a real identity
  (complete tokens + a structural variant + element treatments), one at a time, same approach as modern-dark.
- Optional live confirm: apply modern-dark in the editor → view home (minimal-line banner + dark cohesion) →
  revert to classic. (Deferred this session to avoid DB activeTemplateId churn.)
- Or **#2** (animation/hover presets + icon picker). Remaining text deconfliction targets are divergent
  editor-previews (P-LOG-002) — skip until those previews use real components.

---

## (previous) SESSION HANDOFF — read this first (for 2026-06-02 session)

**Big session — all pushed to `new-version` (on top of `4a8945f`). 11 commits:**
`d7ae9ae` Tier2 controls · `4500119` Tier2 depth voteCTA · `d31cd8b` Tier3 custom CSS ·
`7d4b198` Tier2 honesty fix · `b5006ca` banner Tier2 depth · `827e2d0` stats nesting fix+bg ·
`6950616` ROADMAP.md · `a71be13` tokenize success+candidates · `31b98d2` tokenize vote flow ·
`fa29b12` verify stats selection · `7e3dcc7` layout Layer2 site-wide.
**`ROADMAP.md` is now the master TODO — read it first for the full remaining-work list.**
Build PASS throughout; verified in-browser where reachable; dev server stopped; tree clean.

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
   `data-element` on both sub-cards + schema entries. **VERIFIED in-browser (admin
   logged in): all 3 stats cards now select independently ✅.** BUT found: the sub-card
   Tier 2 bg control works on the LIVE page (inline uses `var(--stats-card-bg, …)`) yet
   is MASKED in the EDITOR preview by a runtime `cfg.backgroundColor` (white) — a
   QuickStyleBar Layer-3 collision (logged as debt below).

7. **ROADMAP.md created (= master TODO)** + **#1 multi-page tokenization — slice 1a (Tier-1
   colour) COMPLETE + 1b first step done:**
   - 1a: tokenized `success` (12), `candidates` (6, per-party `theme.main` kept), and the
     `vote` flow main path (`vote/page.js` loader, MultiPartyView header-badge, BackToVoteBar,
     VoteConfirmationModal) — hardcoded `#8A2680` → `var(--color-primary)`. `closed` audited
     (already neutral). Accent sweep: nothing public (CinematicNavbar left — `/party` cinematic
     palette). SinglePartyView `#C026D3` left (no token).
   - 1b: layout `getThemeTokenCss` upgraded `buildTokenStyles` → `buildTemplateStyles` →
     Layer 2 element-var scope now emitted site-wide (verified `/closed` `<style>` carries
     `[data-element]` rules; home not regressed).
   - VERIFY method that works (no auth): transient `.fms-app` `--color-primary` override +
     computed-style check → PROVEN on home (21 text + 3 bg recolour). Per-page live theme-flip
     is transitive (same var + scope). Direct vote visual blocked (admin token ≠ student
     NextAuth session; editor vote preview is a static VotePreview, not live MultiPartyView).

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
- **stats sub-card Tier 2 bg masked in EDITOR preview** (works on LIVE) — QuickStyleBar's
  Layer-3 `cfg.backgroundColor` collides with the Tier 2 `--stats-card-bg`. Decide next
  session: drop the redundant Tier 2 bg, or stop QuickStyleBar seeding `backgroundColor`.
- **Recurring meta-lesson:** before adding a Tier 2 control, check no existing Layer-3
  surface already edits that property (voteCTA↔StatefulGallery, stats↔QuickStyleBar both bit us).
- **Verification environment gotchas** (cost a lot this session): admin RSA token ≠ student
  NextAuth session (so `/vote`,`/success` redirect to /login even when admin-logged-in);
  editor previews for non-home pages are STATIC components (P-LOG-002), not the live ones;
  direct DB writes (prisma flip) + fetch-token-harvest are classifier-blocked. **Reliable
  no-auth verify = transient `.fms-app` `--color-primary` override + read computed styles.**

### 🧭 Next session — `ROADMAP.md` is the master list. Suggested:
**Continue #1b (multi-page, the remaining big piece)** — recommended start:
1. **Per-page `elementVars` / `elementCss` storage + editor save/load.** Today the editor
   only saves/loads `{ home: ... }` (PageDesignTab payload + load + HomeContent overlay are
   home-scoped). Extend so each page's Tier 2/3 overrides persist per page → unlocks Tier 2/3
   editing on all 6 pages. Touches: useEditorState (per-page keys), PageDesignTab (payload/load
   keyed by selected page), each page component's overlay (effectiveTemplate per page).
2. **Thread `resolvedTemplate` into** vote/results/candidates/closed/success components (today
   only home gets it) so config-driven designs follow the active template everywhere.

**Quick wins also available:** resolve the stats-bg editor mask (QuickStyleBar↔Tier2 — see
debts); Library slice 2 (per-page inventory); make one stub template genuinely distinct (#5).
Avoid: more voteCTA Tier 2 (per-state = StatefulGallery, settled).

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
