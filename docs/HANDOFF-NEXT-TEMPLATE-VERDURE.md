# HANDOFF — Next template "Verdure" + the new direction

Written end of a long studio-dark polish session (branch `new-version`).
**Self-contained — the next session has zero memory of this work.** Read top to bottom.

Branch: `new-version` · working tree should be CLEAN · `npm run build` GREEN · `npm run smoke` 15/15.
Latest commit at handoff: `9a99c56` (Design Library tab). 28 commits ahead of origin/new-version, unpushed.

---

## 0. THE DIRECTION CHANGE (read this first — it reframes everything)

The owner has decided the product is **NOT a Canva-style web editor**. The realistic,
shippable shape is:

> **5 distinct templates, each with 4 colour themes.** Pick a template + a colour
> theme. That's the customization surface. No per-element drag-editing.

This **confirms and sharpens** the earlier `editor-strategy-decision` memory ("ship
3–5 templates + token recolor; the Canva engine is a portfolio/author tool, not the
prod surface"). Act on this:

- **DO** build full, distinct, self-contained template layouts (like studio-dark).
- **DO** give each template 4 colour-theme presets (token sets).
- **DO** use the new **"คลัง Design" (Design Library)** admin tab as the *browse*
  surface — "what designs exist in the system", read-only.
- **DON'T** invest in making every element click-to-edit in the editor. The editor's
  job shrinks to: pick template, pick colour theme, edit the handful of central
  text/config fields (election name, dates, etc.).
- **DON'T** add more shared "variants" that any template can swap into. Each
  template OWNS its button/card/heading design. (Owner was explicit: "ไม่ใช่ variant
  แบบนี้ … แต่ละ template แยกอันกันชัดเจน".)

The next template to build is **"Verdure"** (name = verdant/green — a fresh, natural,
green-forward look). The owner will decide the exact visual; this doc gives the *recipe*.

---

## 1. WHERE THINGS STAND

### Templates that exist
`src/components/admin/editor/templates/builtIn/`: `classic`, `gumroad`, `studio-dark`
are **full layout families** (own page layouts). `modern-dark`, `playful`, `minimal`
are **token-only** recolours of the classic layout (no own layout) — they're the
"4 colour themes" idea in embryonic form but not structured as such yet.

So toward "5 templates": **classic, gumroad, studio-dark are done (3)**; **Verdure = #4**;
one more = #5 (owner's call).

### studio-dark = the reference implementation (built + polished THIS session)
All 7 pages + login, fully distinct (persistent 240px left rail, warm-dark #14140F +
electric-lime #D5FF3F, hairlines, Inter/Instrument-Serif/JetBrains). Components:
```
home/StudioDarkRail.js      ← the signature layout move (fixed left rail; mounts on EVERY studio page)
vote/StudioDarkShell.js     ← shared chrome (rail + sticky scene-bar + base tokens) for inner pages
home/StudioDarkHome.js      ← home (uses Rail directly, NOT Shell)
vote/StudioDarkCandidates.js · StudioDarkParty.js · StudioDarkVote.js
vote/StudioDarkSingleParty.js  ← single-party = intro overlay + party presentation + 3-choice ballot
vote/StudioDarkResults.js · StudioDarkSuccess.js · StudioDarkClosed.js
vote/StudioDarkPartyIntro.js   ← cinematic single-party opener (swappable-intro contract)
vote/StudioDarkMemberModal.js  ← shared member modal + lightbox (also used by Party)
login/StudioDarkLogin.js       ← themed PSU-Passport login (gumroad has GumroadLogin too)
```

### What this session shipped (commits, newest first — all on `new-version`)
- `9a99c56` **Design Library** admin tab ("คลัง Design") — read-only catalog of each
  template's voteCTA button in its own palette. `src/components/admin/DesignLibrary.js`,
  data-driven `BUTTON_DESIGNS[]` — extend it for more element families.
- `4db6fab` fix: studio rail's `html,body{color-scheme:dark}` was leaking into the
  admin editor (inline preview) and turning native inputs dark → gated on `!editorMode`.
- `ff3682c` ThemedLoadingScreen sets its own dark/light canvas (no white frame).
- `79df4f9` studio home marquee → framer-motion (CSS keyframes were killed by the
  global reduced-motion rule; see quirk below).
- `0cc6283` login themed per active template (StudioDarkLogin/GumroadLogin, classic default).
- `9259046`/`b798e41`/`1091bc4`/`75c3bf8`/`b4a05bd`/`0b7dc46`/`4e6cd98`/`d02acf8` — studio
  polish: deck lines, full project name + academic year, TH clock, working CTA hover,
  graceful countdown, rail logout-as-its-own-button + drop "Profile" nav + renumber
  (01 Index · 02 Candidates · 03 Vote · 04 Returns), party Vision = photo banner +
  readable story + missions ledger, single-party vote page.
- `a2ce5b7` dynamic `<title>` + working OG/Twitter image (metadataBase + basePath).
- `c4d2c81` results: **embargo turnout demographics until reveal** (studio was the only
  template leaking them; admin still sees live via its own dashboard).
- Earlier (pre-studio polish): `9087591` score-as-single-source-of-truth + reconcile
  script; `ae6742d` SSO role rule extracted + smoke; `699d710` /api/health; `ed33c0a`
  useVoteStatus hook; `3f3b39f` smoke runner fixed for Node 24.

### DB / dev state at handoff
`activeTemplateId=studio-dark`, `systemMode=MANUAL_OPEN`, 2 real parties (Unity №1 +
`พรรคทดสอบ TEMP` №2) + งดออกเสียง(0) + ไม่รับรอง(-1). Election dates are PAST → countdowns
show the "เปิดรับลงคะแนนอยู่" graceful state. User `6610510149` is admin (also in the
legacy admin pair). **Snapshot+restore the DB around any mutating test** (this session did).

---

## 2. RECIPE — build a new full template (Verdure), derived from studio-dark

A full template = **(A) a token/theme file** + **(B) its own layout components** +
**(C) wiring at every dispatch seam**. Miss a seam and that page silently falls back to
classic. Here is every seam:

### A. Theme file — `src/components/admin/editor/templates/builtIn/verdure.js`
Copy `studio-dark.js`'s shape: `import { classicTemplate }` then spread + override.
Set `id`/`slug:"verdure"`, `name` (Thai), `layoutFamily:"verdure"`, `colorSwatch`,
`pages{}`, `theme.tokens` (the 15 Layer-1 `--color-*`/`--radius-*`/`--font-*`), and the
`elements{}` overrides for the catalog elements the **home** still composes (voteCTA
variant + vars, stats, meet, banner, hero text). Per **P-LOG-005: never edit classic.js**;
always spread from `classicTemplate` first. (Verdure will likely want its OWN voteCTA
button look — see §3 "own designs".)

### B. Register the template — TWO places (a classic miss)
1. `templates/index.js` → import + add to `BUILT_IN_TEMPLATES`.
2. `templateEngine.js` → add to `TEMPLATE_INFOS` (`{ id, name, previewColor }`).

### C. Layout components — `src/components/{home,vote}/Verdure*.js`
Mirror the studio set. Decide Verdure's **signature layout move** (studio = left rail;
gumroad = chunky bento). Build:
- A shared shell (`VerdureShell.js`) if inner pages share chrome, OR per-page chrome.
- `VerdureHome.js` (home) — dispatched in `HomeRenderer.js` by slug.
- `VerdureCandidates / Party / Vote / SingleParty / Results / Success / Closed`.
- Optional: intro overlay, member modal/lightbox (reuse studio's as templates).
- `login/VerdureLogin.js`.

Identity (colors/fonts/shadows) **hardcoded in the components** per **Rule 9** (the
Layer-2 vars are the *default variant's* tokens, not yours).

### D. Wire EVERY dispatch seam (grep these and add a `verdure` branch)
- `src/components/home/HomeRenderer.js` — home by slug.
- `src/app/vote/page.js` · `results/page.js` · `party/page.js` · `candidates/page.js`
  · `success/page.js` · `closed/page.js` — each reads `activeTemplateId` and does
  `isStudio ? <StudioDark…> : isGumroad ? <Gumroad…> : <Classic…>`. Add `isVerdure`.
- `src/app/login/page.js` — `if (activeTemplateId?.startsWith("verdure")) return <VerdureLogin…>`.
- `src/components/ThemedLoadingScreen.js` — add a `VerdureLoading` variant + a
  `slug.startsWith("verdure")` branch (sets its own html/body canvas colour).
- `src/app/template-preview/page.js` — the auth-free gallery preview; add verdure to the
  `family === 'studio-dark' || 'gumroad'` dispatch so the editor gallery shows it.
- Editor previews: `VoteEditorPreview / ResultsEditorPreview / CandidatesEditorPreview /
  SuccessEditorPreview / ClosedEditorPreview` — add the verdure layout branch.
- `PageDesignTab.js` — the picker + the 9-slide gallery (`GALLERY_SLIDES`) work by
  `layoutFamily`; verify verdure shows.
- `src/components/admin/DesignLibrary.js` — add verdure's button (and any new designs)
  to `BUTTON_DESIGNS[]`.

### E. Verify (paste real output — Rule 8)
Sweep all pages via `/template-preview?slug=verdure&page=<home|candidates|party|vote|
results|success|closed>&variant=<multi|single|locked|revealed>` and assert: no
`<nextjs-portal>` error overlay, no console errors, key elements present (this session
did exactly this for studio-dark). Then `npm run build` GREEN + `npm run smoke` 15/15.

---

## 3. THE "4 COLOUR THEMES PER TEMPLATE" — needs design (not built yet)

Today a template has ONE palette (its `theme.tokens` + `colorSwatch`). The classic family
already shows **colour-theme swatches** in the picker (see `PageDesignTab.js` +
`classic.js colorSwatch`) — that's the closest reference. There is **no formal
"4 themes per template" structure yet**. Design task for the next session:

- Define, per template, an array of 4 token-overlay presets (e.g. `verdure.colorThemes =
  [{ id, name, swatch, tokens:{…overrides} }]`). Theme = a sparse override on the base tokens.
- Surface them in the admin (the template picker / a swatch row) + persist the chosen
  one (alongside `activeTemplateId` in SystemConfig, e.g. `activeColorThemeId`).
- `layout.js` already emits the active template's tokens site-wide via
  `getThemeTokenCss()` — extend it to overlay the chosen colour theme.
- The Design Library could show each template × its 4 themes.

Align with the owner on how many tokens a "colour theme" is allowed to change (just the
accent? the whole palette?) before building.

---

## 4. OPEN ITEMS / KNOWN BUGS (from the owner's latest messages)

🟡 **Per-template lock (remove the variant picker)** — the editor still presents voteCTA
as swappable variants (Default/Minimal-Pill/Chunky-Stamp). The owner wants each template
locked to its OWN design. Plan: hide `VariantPicker` for built-in templates (or remove the
swap entirely) so a template just renders its design; the Design Library is the browse surface.

🟡 **Studio editor: only voteCTA is click-selectable** — studio inner pages wrap only
voteCTA + central text with `EditorElement`. Per the new direction this is probably FINE
(editor shrinks to template+theme+central-text). Confirm with owner; don't invest in
wrapping every element unless asked.

🟡 **Classic single-party vote bug** — in the **editor preview** the classic vote shows
empty white party cards (`VoteEditorPreview` → `MultiPartyView`/`SinglePartyView` with
`DUMMY_PARTIES_*`). Not yet diagnosed. The live classic page may be fine; this is the
editor preview path. Start at `src/components/admin/VoteEditorPreview.js` + the classic
`MultiPartyView`/`SinglePartyView` card render in editorMode.

🟡 **Gumroad ticker/ekg freeze under reduce-motion** — gumroad home uses CSS animation,
which the global `prefers-reduced-motion` rule zeroes out (same root cause fixed for
studio marquees). Convert to framer-motion when gumroad is worked on.

🟢 **Design Library** currently shows only the voteCTA buttons. Extend `BUTTON_DESIGNS`-style
catalogs to other element families (party card, headings, banners) as templates gain
distinct designs.

🔴 **Infra (owner's, NOT code) — still pending from the original handoff** (`docs/PLAN-NEXT-SESSION.md` §2A):
rotate burned secrets (`ADMIN_JWT_SECRET`, `ADMIN_PASSWORD_AUTH_EXTRA`), set
`ADMIN_STUDENT_IDS`, cron `scripts/backup.sh`, **rehearse `scripts/restore.sh` once**, and
the day-of go-live checklist (destructive — wipes dev test data; do NOT run on dev).

---

## 5. ENVIRONMENT QUIRKS (they WILL bite — all hit this session)

| Quirk | What to do |
|---|---|
| **`.next` corruption on Windows** (`Cannot find module './NNNN.js'`, missing `vendor-chunks/styled-jsx.js`, blank page, "spinner ค้าง") | Caused by mixing `npm run build` with the dev server on the same `.next`. Fix: `preview_stop` → `rm -rf .next` → `preview_start`. Hit this MANY times. To commit-with-build safely: stop dev, `rm -rf .next`, build, commit, `rm -rf .next`, start dev. |
| **Global `prefers-reduced-motion` kills CSS animation** (`globals.css`) | Any marquee/ticker/ekg using CSS `animation` FREEZES on machines with the OS reduce-motion setting on. Use **framer-motion** (`animate={{x:[…]}}`) for decorative motion instead. |
| **`color-scheme:dark` on html/body leaks into the admin editor** | When a dark template previews INLINE in the editor, a global `html,body{color-scheme:dark}` turns the admin's native inputs dark. Gate such global rules on `!editorMode` (the rail/components receive `editorMode`). |
| Build before dev / EPERM | Stop dev before `npm run build` or `prisma generate`. |
| `prisma db push` (NOT migrate) | Migrations have drift; `db push` manages this DB. Stop dev first. |
| Bash `/tmp` → `E:\tmp` (missing) | Write temp files to the project dir as `_x.local`, delete after. `*.local` is gitignored but the glob MISSES `.json` (so `_x.local.json` shows untracked — delete it manually). |
| preview forces `prefers-reduced-motion` + sometimes `preview_screenshot` times out | Verify motion via computed `transform` deltas; for screenshots inject `*{animation:none!important}` + reload, fall back to DOM evals. React click→read: click in one eval, READ in the NEXT. |

### How to log in (do it yourself — never ask)
- **Admin:** `node scripts/dev-admin-login.js --show` → prints creds → in-page
  `fetch('/fms-ovs/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({username,password})})`.
- **Student:** open `/fms-ovs/login` → DEV mock form → type studentId (e.g. `6610510149`) → Mock Login.
- **Auth-free page preview:** `/fms-ovs/template-preview?slug=…&page=…&variant=…`.

---

## 6. KEY FILE MAP
```
Templates:   src/components/admin/editor/templates/builtIn/*.js  (+ index.js + templateEngine.js TEMPLATE_INFOS)
Home seam:   src/components/home/HomeRenderer.js (slug → home layout)
Page seams:  src/app/{vote,results,party,candidates,success,closed,login}/page.js (activeTemplateId dispatch)
Loading:     src/components/ThemedLoadingScreen.js (per-template loader)
Editor:      src/components/admin/PageDesignTab.js (picker/gallery/preview) · DesignLibrary.js (catalog)
             src/components/admin/{Vote,Results,Candidates,Success,Closed}EditorPreview.js
Preview:     src/app/template-preview/page.js (auth-free, used by the gallery)
Tokens:      src/app/layout.js getThemeTokenCss() (emits active template tokens site-wide)
studio ref:  src/components/{home,vote}/StudioDark*.js · src/components/login/StudioDarkLogin.js
Ops/auth:    src/lib/auth/* · scripts/backup.sh|restore.sh · scripts/reconcile-scores.js · scripts/smoke/
```

## 7. FIRST MOVES (next session)
1. Read `CLAUDE.md` (Engineering Discipline — Task 0 audit mandatory, Rule 8 paste real
   output), then this file, then `docs/PLAN-NEXT-SESSION.md` (infra/owner items),
   `DECISIONS.md` (P-LOG-*), memory `editor-strategy-decision` + `studio-dark-progress`.
2. Task 0: `git status` clean, on `new-version`, `npm run build` GREEN, `npm run smoke`
   15/15 (start dev first; mind the `.next` quirk). Paste outputs.
3. Confirm with owner: Verdure's signature layout move + its 4 colour themes (and whether
   to do the "lock per-template / remove variant picker" cleanup first).
4. Build Verdure via §2 recipe; verify via the §2E sweep + screenshots; commit atomically.
