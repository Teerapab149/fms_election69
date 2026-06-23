# HANDOFF — Interactive (clickable, DB-free) template preview

## ✅ STATUS: BUILT 2026-06-23 (`new-version`)

Shipped + verified. Commits: `ce1618f` (playground core + shared mocks +
template-preview refactor) · `f255419` (admin gallery launch button).

**What shipped**
- New route **`/template-playground?slug=<slug>&page=<page>`** — a fully clickable,
  DB-free prototype of all 7 pages × 3 families (verdure / studio-dark / gumroad).
- **Architecture decision changed from the original plan:** the `onNavigate` chrome
  seam was NOT built — replaced by a single **click-interception** wrapper
  (`onClickCapture` → `hrefToDest()` → local `setPage`). It catches the dock AND
  every scattered in-page `<a href={getPath()}>` across all families with ZERO
  component changes (the audit found nav is not centralized — Gumroad has no shared
  shell at all, so per-chrome `onNavigate` would have missed ~15 in-page links).
- Real components + mock data (`utils/templatePreviewMocks.js`, extracted + now
  shared with `/template-preview`) + local-state handlers; `onConfirm` → mock
  success page. **DB-safe by construction** — verified no `POST /api/vote` fires.
- **Auth safety:** home renders view-only (`editorMode`) so its `signIn()` CTA can't
  redirect; inner pages run interactive with NO session, so the chrome user pill +
  its `signOut` (which would log the admin out for real) never render.
- Floating **SANDBOX bar** (`.tpg`): template switch · page tabs · single/multi ·
  results locked/revealed · clear-selection. Reliable nav independent of the chrome.
- **Admin launch:** "เปิดแบบโต้ตอบ — กดเล่นได้จริง" button under the gallery
  ("ดูรายละเอียด") opens the playground in a new tab; gated to the 3 distinct families.

**Verified (preview, no DB):** Verdure select→confirm→success (no `/api/vote`),
dock click intercepted (URL unchanged), single/multi booth; Studio Dark + Gumroad
render + nav interception (clicked internal links, URL unchanged); console clean.

**Known limitations / possible follow-ups**
- Home is view-only (by design — avoids the `signIn()` redirect). Inner pages have
  no user pill (by design — avoids `signOut` logging the admin out).
- Single-vote cinematic intro plays each time you open Verdure vote in single mode
  (`editorMode` off). A "replay/skip intro" control in the SANDBOX bar would be nice
  (would need a small `skipIntro` prop on `VerdureSingleParty` — do NOT reuse
  `editorMode`, that kills clicks).
- The admin gallery button was NOT exercised in the authed admin UI (browser admin
  auth wall, P-LOG-066 + screenshot tool wedges). It's an additive `<a>` using
  already-imported symbols; the playground it opens is fully verified.
- Classic family has no interactive playground (only the 3 distinct layouts).

The plan below is the ORIGINAL pre-build design, kept for context. The build
diverged on navigation (click-interception, not `onNavigate`) — see above.

---

_(original pre-build plan follows)_

Written end of the 2026-06-23 session, **before building** (we hit the token
budget). Self-contained — next session has zero memory of this. Read top to bottom.

Branch: `new-version` (the Verdure consistency pass is committed:
`853c9f8` multi-vote · `730e42c` results · `921c9d2` closed+success). Working tree
clean at handoff. Dev server runs via the preview tool on **port 3000** (owner
watches it — **never stop it**, see [[feedback-keep-server-running]]).

---

## 0. THE ASK (owner's words, paraphrased)

The existing `/template-preview` (the one iframed in the admin "ดูรายละเอียด"
gallery) **can't be clicked** — it renders every page in `editorMode`, which
disables all interaction on purpose (static thumbnail). The owner wants a
**clickable prototype**: the real pages, fully usable — select a party, open
candidate cards, hit confirm → land on the success page, move between pages — with
**mock data and NOTHING written to the database** ("like a Claude-crafted HTML/CSS
prototype you can play with, but it does nothing to the DB").

### Decisions locked (via AskUserQuestion, 2026-06-23)
1. **Navigation = working in-app dock/nav** (click the real bottom dock to move
   between pages — feels like the real site; needs a small additive chrome tweak).
2. **Scope = all three templates** (Verdure + Studio Dark + Gumroad).

---

## 1. WHY IT'S NOT CLICKABLE TODAY

`src/app/template-preview/page.js` renders each family's page component with
`editorMode` + `noop` handlers. `editorMode` does **triple duty** across the
components: (a) disables clicks (`onSelect`/buttons are noop/disabled), (b) makes
the dock/nav links inert (`href={undefined}`), (c) skips the cinematic intro and
hides the auth user pill. So you can't just "turn editorMode off" — that would
re-enable clicks BUT the dock would then navigate to the **real** auth-gated routes
(`/fms-ovs/vote`, etc.), breaking out of the sandbox. We need clicks ON but nav
**contained** to the sandbox → hence a dedicated `onNavigate` seam (below).

The components already run **fully interactive on the live site** — the sandbox
just feeds them mock data + local-state handlers + contained navigation.

---

## 2. THE PLAN (build order — verify each chunk in the preview, don't stop the server)

### Chunk A — Verdure first (proves the pattern end-to-end)
1. **New route `src/app/template-playground/page.js`** (`"use client"`, wrapped in
   `<Suspense>` like template-preview). Keep `/template-preview` UNCHANGED — it
   stays the static gallery thumbnail. Playground = a separate interactive route.
   - Local state: `{ page, selectedPartyId, viewParty, isSingleParty, revealed }`.
   - Reuse the mock data already in `template-preview/page.js` (PARTIES, SPECIAL,
     DEMOGRAPHICS, resultsCandidates, DUMMY_USER, mkParty…) — lift the shared mock
     into a small `src/utils/playgroundMockData.js` (or import from editorDummyData
     where possible) so both routes share one source.
   - Dispatch by `?slug=` → family (`BUILT_IN_TEMPLATES[slug].layoutFamily`), same
     as template-preview, but render with **`editorMode={false}`** + stateful
     handlers:
       - `onSelect(id)`   → `setSelectedPartyId(id)`
       - `onConfirm()`    → `setPage('success')`   ← NO DB; pure state
       - `onViewDetails(p)` → `setViewParty(p); setPage('party')`
       - `onSelectParty(p)` (results) → `setViewParty(p); setPage('party')`
       - `onNavigate(key)`  → `setPage(key)`   ← the new seam (chunk uses it)
   - A small **floating "SANDBOX" control** (clearly labelled, fixed corner): toggle
     single/multi party, toggle results revealed/locked, reset vote, replay intro.
     So the owner can exercise every state.
2. **Additive `onNavigate` prop on the Verdure chrome** (`VerdureChrome.js`):
   thread an optional `onNavigate(pageKey)` → `VerdureShell` → `VerdureChrome` →
   `VerdureDock` (and the cornermark "home" link + any back link). When present,
   dock links do `onClick={e => { e.preventDefault(); onNavigate(n.key); }}` instead
   of `href` navigation. **Editor/live behaviour unchanged when the prop is absent.**
   - Verify: dock clicks switch sandbox pages; live site + gallery still navigate
     normally (prop absent there).
3. **Intro in the sandbox:** `VerdureSingleParty` computes
   `introDone = editorMode && !forceIntro`. With `editorMode={false}` the intro
   plays every visit (annoying in a playground). Add a small **`skipIntro` prop**
   (sandbox passes `skipIntro` by default; the SANDBOX control's "replay intro"
   flips `forceIntro`). Don't reuse `editorMode` for this (it'd kill clicks).
4. **Launch point** — in the admin gallery `TemplateDetailModal`
   (`src/components/admin/PageDesignTab.js`), add an **"เปิดแบบโต้ตอบ ↗"** button
   that opens `/template-playground?slug=<slug>` in a new tab. (This is the "show
   in admin template-select section" the owner asked for.)
5. **Verify (Verdure):** click a party → it selects (row turns moss); open a
   candidate card → modal; confirm → success page (no network/DB call —
   confirm with `preview_network` that no POST to `/api/vote` fires); dock moves
   between home/candidates/vote/results; single/multi + reveal toggles work.

### Chunk B — Studio Dark
Repeat 2–5 for Studio Dark. **Read `StudioDarkShell.js` + its chrome FIRST** — its
dock/nav structure differs from Verdure; thread the SAME optional `onNavigate` seam.
Wire `StudioDark*` components into the playground dispatch. Verify clickable.

### Chunk C — Gumroad
Same again. **Read the Gumroad chrome/shell FIRST** (Gumroad's nav is a top
bar/ticker, not a bottom dock — the seam attaches to its nav links). Wire
`Gumroad*` components in. Verify.

### Chunk D — polish
Success→home loop, "reset sandbox" affordance, make the floating control consistent
across the three families, mobile pass. Then commit-clean + update this handoff.

---

## 3. RISKS / GOTCHAS (read before coding)

- **Per-template chrome differs.** Verify each family's nav structure before
  threading `onNavigate` (Verdure = bottom dock; Gumroad = top bar; Studio = left
  rail/dock). Don't assume Verdure's shape. (Rule 1 — audit before acting.)
- **`useSession` in the chrome.** `VerdureCornerStatus` reads `useSession()` (not the
  `user` prop) for the top-right user pill. Sandbox has no NextAuth session → the
  user pill is hidden + the default countdown chip shows. Acceptable. If the owner
  wants the pill visible, add an optional `userOverride` prop to the chrome that
  bypasses `useSession` when set (defer unless asked).
- **DB safety is structural:** the playground never imports the vote API / submit
  hook. `onConfirm` only sets local state. Double-check with `preview_network` that
  no `/api/vote` request fires on confirm.
- **Keep `/template-preview` untouched** (it's the static gallery thumbnail; making
  it interactive would change the gallery's behaviour). Playground is a NEW route.
- **`editorMode` overload:** the whole reason for the `onNavigate` + `skipIntro`
  seams is to stop reusing `editorMode` (which couples "no clicks" + "static nav" +
  "no intro"). Add narrow props instead of widening `editorMode`.
- **Thai-no-trailing-period** ([[feedback-thai-no-trailing-period]]) on any new UI
  copy (the SANDBOX control labels). **No JS-hidden content**
  ([[feedback-no-js-hidden-content]]).

---

## 4. KEY FILES

```
Static gallery preview (LEAVE AS-IS):  src/app/template-preview/page.js
NEW interactive route:                 src/app/template-playground/page.js
Verdure chrome (add onNavigate):       src/components/home/VerdureChrome.js
Verdure shell (thread onNavigate):     src/components/vote/VerdureShell.js
Verdure pages:  components/vote/Verdure{Vote,SingleParty,Results,Success,Closed,Candidates,Party}.js
Studio Dark shell/chrome + pages:      components/vote/StudioDark*.js  (read shell first)
Gumroad chrome + pages:                components/vote/Gumroad*.js     (read chrome first)
Admin gallery (add launch button):     src/components/admin/PageDesignTab.js (TemplateDetailModal)
Mock data to reuse/lift:               src/app/template-preview/page.js + src/utils/editorDummyData.js
```

## 5. PRE-MERGE GATE (still owed, from the consistency pass)
Before `new-version` → `main`: `preview_stop` → `rm -rf .next` → `npm run build`
(GREEN) → `rm -rf .next` → restart dev → `npm run smoke` (15/15). Needs the server
stopped → do it when the owner is free. Paste outputs.
