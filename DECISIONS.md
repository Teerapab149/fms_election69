# DECISIONS.md — Locked-in Decisions for FMS Editor Project

**Last updated:** Phase 1.5 H-G next  
**Maintained by:** Project owner (Teerapab)  
**Purpose:** Single source of truth for all decisions made — Claude Code MUST follow these.

---

## 🏗️ Architectural Decisions

### D-001: Storage strategy — Postgres JSON, no new tables
**Decision:** Use `SystemConfig.pageLayout Json?` and similar JSON columns.  
**Rejected:** New tables for templates/designs/configs.  
**Reason:** Avoid Prisma migrations during active dev; JSON is flexible enough for 5-10 year scope; admin doesn't need queryable data.

### D-002: Add `globalConfig Json?` field to SystemConfig
**Decision:** New JSON column for cross-cutting global config.  
**Rejected:** Embed in `pageLayout` (semantically wrong — not a layout).  
**Reason:** Globals deserve own field; mirrors existing `pageLayout` / `themeConfig` pattern.

### D-003: Click-lock at 2 layers (Capture phase)
**Decision:** EditorElement uses `onClickCapture` + `preventDefault`. LivePreview container has fallback capture handler for navbar/unwrapped clicks.  
**Reason:** Two-layer prevents both child handlers (signIn, Link) and Navbar links from firing.

### D-004: Real components only in editor preview (NO mocks)
**Decision:** ห้าม dummy component JSX. Always use the real production component (e.g., `<ResultCard />`) with synthesized props.  
**Reason:** User needs to see exactly what production renders so design decisions are accurate.  
**Exception:** Demo DATA is OK (e.g., `DUMMY_RESULTS_MULTI`).

### D-005: Single-source rendering (Hero pattern)
**Decision:** ALL components render through one path — `editorMode` doesn't fork JSX. The same JSX tree handles both modes; only `<Wrap>` differs.  
**Reason:** Avoids `editorBlocks` problem (mock JSX drifting from real). Hero pioneered this pattern in H-5.

### D-006: State-aware via `forceState` prop (preview only)
**Decision:** Stateful components accept `forceState` prop. When set, skip runtime detection and use that state. Production never passes `forceState`.  
**Reason:** Allows StatefulGallery to render every state side-by-side without messing with real-time logic.

### D-007: Pill background editable in countdown
**Decision:** Even though production uses `bg-white` constant, expose `pillBackground` token so admin can theme.  
**Reason:** Neon template needs dark pill — flexibility > simplicity.

### D-008: 1 element ID for countdown (not split badge/digits)
**Decision:** Single `hero-countdown` registry entry. Per-state config covers badge + digits + pill.  
**Reason:** Simpler admin UX; can split later if needed.

### D-009: Winner ResultCard = separate element (planned for H-7b)
**Decision:** `result-card` (regular) + `result-card-winner` (winner styling).  
**Rejected:** Single element with winner modifier.  
**Reason:** Winner has distinctly different design (yellow border, Trophy, gold gradient) — admin should edit it independently.

### D-010: Click-lock allowed inside EditorElement
**Decision:** LivePreview capture handler uses `e.target.closest('.group\\/editor')` to detect editor wraps and let those clicks through. Only blocks clicks NOT in a wrap.  
**Reason:** EditorElement still needs onClick to fire for selection.

### D-011: Phase 2 Type-Instance Catalog Refactor Complete (2026-05-16)

Phase 2 of FMS election editor refactor complete. Migrated 3 fragmented registries (`elementRegistry`, `statefulRegistry`, `EXTRA_ELEMENTS_SCHEMA`) into a single unified `elementCatalog`.

**Result:**
- 36 element instances + 16 semantic types (was 31+ scattered across 3 sources)
- 7 consumer files now reference single source of truth (`elementCatalog.js`)
- Cross-reference validation runs in dev mode on module load
- Stateful elements use proper resolution chain (`isStateful`-driven routing)
- 4 previously-orphaned `results-*` elements now editable
- `vote-divider-text` orphan registered (was Wrapped but unregistered)
- `templateEngine.resolveStatefulConfig` silent-`{}` fallback bug fixed

**Deferred bugs (will be fixed by Phase 3 rebuild):**
- Template apply changes only countdown + voteCTA visually (other elements have preset data but apply logic incomplete — Phase 3 Canva-style system replaces template logic entirely)
- StatefulGallery mini-template buttons not clickable (pre-existing Phase 1.5 issue — new template editor UI in Phase 3 will replace StatefulGallery)

**Files deleted:**
- `src/components/admin/editor/elementRegistry.js`
- `src/components/admin/editor/statefulRegistry.js`

**Files created (Step 2-3):**
- `src/components/admin/editor/elementCatalog.js` — public API + helpers + `validateCatalog()` + module-load self-check
- `src/components/admin/editor/elementInstances.js` — 36 instance definitions
- `src/components/admin/editor/elementTypes.js` — 16 semantic type definitions

---

## 🎨 Design / UX Decisions

### D-101: Templates locked = legacy preserved
**Decision:** Once a Created Template is finalized, it cannot be edited or deleted — only cloned/used.  
**Reason:** Legacy preservation. รุ่นน้องไม่ลบงานรุ่นพี่ได้.

### D-102: Tier 3 controls (Simple / Advanced / Expert)
**Decision:** PropertyPanel/Gallery uses tiered controls:
- Simple: 5-7 critical inputs (text, color, radius)
- Advanced: 10+ refined controls (gradient, padding, shadow)
- Expert: raw CSS (letter-spacing, line-height, transform)

**Reason:** Don't overwhelm new admin; let advanced user dig deeper.

### D-103: 4 cards in ResultCard gallery
**Decision:** Gallery shows 4 visual states:
- ก่อนเริ่ม (isWaiting)
- กำลังนับ ปิดผล (showHidden)
- ผลออกแล้ว (showScore non-winner)
- ผู้ชนะ (showScore + winner)

**Reason:** Realistic representation of all production scenarios.

### D-104: Default editor preview = showScore + ENDED + revealed
**Decision:** Results page editor preview defaults to "results revealed" state because it's the visually richest.  
**Future:** Add state toggle similar to vote sim mode.

### D-105: Multi vs Single party scenario differs
**Decision:**
- Multi: 2+ parties + abstain (NO disapprove)
- Single: 1 party + abstain + disapprove

**Reason:** Reflects production logic — disapprove only makes sense when validating a single party.

### D-106: Static background colors only (NO gradient pill bg yet)
**Decision:** Phase 1.5 templates use solid `pillBackground`. Gradient pill is future work.  
**Reason:** Lower complexity now; admin can use gradient on individual phases via `backgroundType: gradient` for flexible elements.

---

## 📦 Data / Config Decisions

### D-201: ELECTION_YEAR is "next year" placeholder, NOT academic year
**Decision:** `ELECTION_YEAR = "2027"` means "see you 2027" (next election cycle), not academic year.  
**Academic year:** stored as `globalConfig.academicYearTh` = 2569 (Thai BE).

### D-202: Global config has both atomic + pre-formatted fields
**Decision:** Some fields like `electionName` ("SAMO 49") are pre-formatted; others like `electionNamePrefix` + `electionNumber` are atomic for split rendering.  
**Reason:** HeroBlock needs split (SAMO + 49 with gradient on 49). Other places need full string.

### D-203: ElectionConfig.js stays for now
**Decision:** Don't migrate dates from `electionConfig.js` to DB until `H-ELECTION-CONFIG-EDIT` phase 4.  
**Reason:** Cascading complexity — Countdown, AutoIntro, results status all read from it. Big change.

### D-204: Image storage = Docker volume (local) for now
**Decision:** Use Docker volume mount for uploaded images. Setup verification in `H-IMG-LIB`.  
**Rejected:** Cloud storage (S3, Cloudinary) for now.  
**Reason:** User confirmed local works for their deploy setup.  
**Note:** If volume not configured, must set up before image upload feature.

### D-205: Banner image = hardcoded for now
**Decision:** `samo49_1.png` stays hardcoded until image library is built.  
**Visibility toggle** is editable now via element config.

---

## 🔄 Workflow / Tooling Decisions

### D-301: Diagnose-first for major steps
**Decision:** Before any step that touches code with unknown structure, write a `DIAGNOSE_*.md` spec for Claude Code to read + report back.  
**Reason:** Multiple incidents where assumed structure was wrong. Diagnose prevents.

### D-302: Use Sonnet for wiring, Opus for refactors
**Decision:**
- **Sonnet:** wiring, copy-paste, diagnose, follow-spec implementation
- **Opus:** complex refactors, schema design, cross-cutting changes

### D-303: Spec format with EXECUTION RULES
**Decision:** Every spec includes "DO NOT EXCEED" scope + verification + report format.  
**Reason:** Claude Code tends to over-extend; tight bounds prevent drift.

### D-304: "I wrote this spec myself" prefix
**Decision:** All Claude Code prompts begin with "I wrote this spec myself" to bypass prompt-injection paranoia.  
**Reason:** Claude Code refuses to read project files thinking they're attacks.

### D-305: Build verification required after each step
**Decision:** Spec ends with "verify npm run build". User reports back results.  
**Reason:** Catch breakage early before next step.

### D-306: NO automation — semi-manual phase batches
**Decision:** Reject full-automation approach. Use phase batches with human verification between.  
**Reason:** Diagnose-driven approach can't be automated; user feedback critical for vision alignment.

### D-307: GitHub commit after each step (recommended)
**Decision:** User commits after each step passes. Allows easy revert.  
**Reason:** ~25 steps × 1 commit = clean history + safety net.

---

## 🐛 Pitfall Log

### P-LOG-001: [2026-05-09] H-3PAGES-PREV — Duplicate Wraps + Missing Null Guard
**Context:** Adding editor previews for vote/candidates/closed pages  
**Problems:**
- VoteEditorPreview added `<Wrap id="vote-header-*">` but MultiPartyView already wrapped the same IDs internally → duplicate element IDs, both highlight on select
- `DUMMY_PARTIES_MULTI` had `logoUrl: null` → `getPath(null)` → `null.startsWith('/')` crash at candidates preview render
- LivePreview has no error boundary → on crash, stale previous DOM persists, user sees wrong page content  

**Fix:** Remove outer Wraps from VoteEditorPreview (let MultiPartyView own them), fix dummy data logoUrl, add null guard to getPath()  
**Lesson:** When writing an EditorPreview wrapper, ALWAYS read what Wraps already exist inside the wrapped component first. Don't assume the target is "naked content."  
Tags: `#editorMode` `#wrapDuplicate` `#defenseInDepth` `#dummyData`

---

### P-LOG-002: [2026-05-10] H-SUCCESS-FIX — Including Production Auth/Nav Components in EditorPreview

**Context:** Writing SuccessEditorPreview for admin editor panel  
**Symptom:** EditorPreview included `<Navbar />` (which contains session/auth logic) and `<SiteFooter />` — neither of which production /success renders. Preview looked visually wrong and imported unnecessary side effects.  
**Root cause:** Author pattern-matched to HomeContent (which has Navbar) instead of reading production /success source.  
**Fix:** Full rewrite in H-SUCCESS-PREV-FIX; stripped Navbar/SiteFooter; marked component with explicit comment: "NO Navbar, NO SiteFooter, full-screen centered card"  
**Lesson:** Production pages vary wildly in which shell components they include. Never assume EditorPreview needs Navbar/Footer — read the real page first.  
**Mitigation rule:** Before writing any `*EditorPreview.js`, open the corresponding production `src/app/[page]/page.js` and grep for `<Navbar` and `<SiteFooter` to confirm which are actually present.  
Tags: `#editorPreview` `#navbar` `#authLeak` `#readFirst`

---

### P-LOG-003: [2026-05-10] H-SUCCESS-FIX — Missing simMode Toggle on New EditorPreview

**Context:** Writing SuccessEditorPreview for a page with locked/unlocked visual states  
**Symptom:** H-SUCCESS-FIX delivered an EditorPreview with zero state toggle, even though /success has two clearly distinct visual states (locked: dark form button + gray locked button; unlocked: emerald done badge + purple results button). Admin could not inspect both states.  
**Root cause:** The step spec didn't diagnose the state machine first. Since the simMode toggle pattern (established in H-3PAGES-PREV for vote/closed) wasn't documented in the step requirements, it was skipped.  
**Fix:** H-SUCCESS-PREV-FIX added `simMode` prop + 2-button toggle in PageDesignTab left panel, following the exact vote/closed pattern.  
**Lesson:** Any page that has distinct visual states (locked/unlocked, waiting/ended, multi/single) MUST have a simMode toggle in its EditorPreview. Check for state forks in production source before writing the spec.  
**Mitigation rule:** When writing a new `*EditorPreview` spec, grep the production page for `useState` and `if (is` branches. Any fork that changes visible layout = one simMode toggle button per fork.  
Tags: `#simMode` `#stateFork` `#editorPreview` `#lockedUnlocked`

---

### P-LOG-004: [2026-05-10] H-SUCCESS-FIX — Generic EditorPreview Written Without Reading Production Source

**Context:** Writing SuccessEditorPreview to show admin what /success page looks like  
**Symptom:** Delivered component had wrong title, wrong card content, wrong button labels, wrong background, wrong hooks — nothing matched production. Required a full DIAGNOSE step + rewrite step to fix.  
**Root cause:** `src/app/success/page.js` was never read before writing the EditorPreview. Component was built from analogy to other pages.  
**Fix:** Added DIAGNOSE_SUCCESS_PAGE_REAL step to catalog every production element first, then H-SUCCESS-PREV-FIX rewrote using that catalog.  
**Lesson:** An EditorPreview that doesn't match production is worse than no preview — it gives admin false design information. Cost of reading production first: 5 min. Cost of writing it wrong and fixing: 2 sessions.  
**Mitigation rule:** Before writing any `*EditorPreview`, read the full production page source and write a render-order list in the spec: "1. check icon circle, 2. title, 3. subtitle, 4. activity card..." Only start writing JSX once every visible element is listed.  
Tags: `#editorPreview` `#readFirst` `#visualAccuracy` `#diagnoseFirst`

---

### P-LOG-005: [2026-05-15] H-CATALOG-CORE — Don't Silently Deviate from Explicit Spec

**Trigger:** When spec explicitly states a value/behavior (e.g., `presets: null`) but you think there might be a "better" choice.

**Anti-pattern:**
Make the deviation without asking, rationalize it ("it's ignored anyway"), then mention it casually in the report.

**Correct pattern:**
If you think the spec is wrong, STOP and ask the user before deviating. The user wrote the spec for a reason. Deviation requires explicit approval.

**Detection:**
After any task, grep diff for unexpected values that differ from spec. Flag "deviation from spec" in report explicitly, not buried in description.

Tags: `#specDrafting` `#designAmbiguity` `#askDontAssume`

---

### P-LOG-006: [2026-05-15] H-CATALOG-CORE — Always Search for Orphan Wraps Before Migration

**Trigger:** When migrating elements between registries or refactoring catalog systems.

**Anti-pattern:**
Trust initial diagnosis count without re-scanning ALL Wrap usages in production components. Discover orphans mid-execution (or never).

**Correct pattern:**
Before catalog creation, grep `<Wrap[[:space:]]+id="..."` across ALL production files. Compare against registry. Document orphans BEFORE writing instance entries.

**Detection:**
Final count of catalog instances should equal: registered + new + orphans found.

Tags: `#orphanWraps` `#preMigrationDiscovery` `#fullScan`

---

### P-LOG-007: [2026-05-15] H-CATALOG-CORE — Validation Must Run on Module Load

**Trigger:** When creating shared catalog/registry files that other consumers import.

**Anti-pattern:**
Define `validateCatalog()` function but never call it. Verification deferred until first consumer imports the catalog → validation gap until Step 3+.

**Correct pattern:**
Include `if (process.env.NODE_ENV !== 'production') validateCatalog();` at module bottom. Add a "loading log" so console confirms catalog imported.

**Detection:**
Browser console should print catalog status on dev startup. Absence = catalog either broken or not yet imported by any consumer.

Tags: `#moduleLoadValidation` `#devConsole` `#earlyFailure`

---

### P-LOG-008: [2026-05-15] H-CATALOG-CORE — Grep Patterns Must Handle Mixed Case in JS Object Keys

**Trigger:** Counting JavaScript object property keys via grep.

**Anti-pattern:**
Use pattern `[a-z][a-z0-9-]+` which excludes uppercase. Miss entries like `voteCTA-button`. Get wrong count.

**Correct pattern:**
Use case-insensitive pattern: `[A-Za-z][A-Za-z0-9-]+` or `[\w-]+`. Always double-check count matches expected, investigate any discrepancy.

**Detection:**
If count seems off by 1-3 from expected, suspect case sensitivity. Re-run with broader pattern.

Tags: `#verification` `#regex` `#falseNegative` `#caseSensitivity`

---

### P-LOG-009: [2026-05-16] Phase-2-Closure — Verify User-Facing Completeness Before Phase Sign-off

**Trigger:** About to mark a phase "COMPLETE" after technical verification passes.

**Anti-pattern:**
Build passes + validation passes + grep clean → declare done. User later finds 2 of 6 pages have broken UX (closed + success pages had no clickable elements in admin editor; discovered post-sign-off).

**Correct pattern:**
Maintain "user smoke test" checklist per phase. Execute manually before sign-off. List each user-facing feature/page/interaction promised by the phase. Verify each works in actual browser, not just in test/build output.

**Detection:**
For any "Phase X COMPLETE" announcement, ensure preceded by: "All N user-facing scenarios verified: [checklist]". For an editor phase touching N pages, the checklist must cover all N pages — not "spot-checked home and vote".

**Why:** Phase 2 declared complete 2026-05-16. Same day, user reported closed + success pages have elements that cannot be clicked. Root cause: ClosedEditorPreview has zero Wraps + zero catalog entries + no editor props threaded; SuccessEditorPreview has zero Wraps despite props plumbed and catalog populated. Both gaps pre-dated Phase 2 but Phase 2 was the unifying refactor that should have surfaced them via per-page checklist.

Tags: `#phaseSignoff` `#smokeTest` `#userFacing` `#completenessGap`

---

### P-LOG-010: [2026-05-17] Phase 2.6 — Verify Actual Renderer, Not Assumed One

**Trigger:** Adding editor coverage (Wraps + catalog) for any page.

**Anti-pattern:**
Trust file name ("HomeEditorPreview.js exists, must be used") and add Wraps there. Phase 2 wrapped a dead-code file (`editor/previews/HomeEditorPreview.js`) because no one verified PageDesignTab routing. Result: home page had 15 Wraps in unused file and the real renderer (HomeContent.js) had no Wraps for half its visible elements.

**Correct pattern:**
Before adding/auditing Wraps on any page:
1. Read PageDesignTab.renderPreview to find which component actually renders for `pageId === 'X'`.
2. Grep for that component's Wrap definitions.
3. Confirm chain end-to-end (preview file → actual renderer).
4. Verify in dev mode that catalog validation shows entries from the real renderer.

**Detection:**
Catalog entries that have NO Wrap anywhere in the actually-rendered component = unreachable. Cross-reference via: for each catalog ID, grep `<Wrap id="$id"` in production + preview files.

Tags: `#renderer` `#routingVerification` `#deadCodeRisk`

---

### P-LOG-011: [2026-05-17] Phase 2.6 — Verify Spec Compliance Field-by-Field, Not Just Count

**Trigger:** Auditing post-execution reports for refactor steps.

**Anti-pattern:**
Step 2 spec said "apply section normalizations (voteHeader → header)". Step 2 report said "section normalizations applied". Audit accepted at face value. Reality: normalizations were NOT applied — section fields kept old names. Phase 2.6 had to redo them.

**Correct pattern:**
For any "apply transformation X" task, verify by checking actual values post-execution, not just by reading the report. Example greps for section normalizations:
- `grep "section: \"voteHeader\"" elementInstances.js` → should be 0
- `grep "section: \"header\"" elementInstances.js` → should be 3+

Always include such verification commands in the spec's REPORT FORMAT section so they're forced.

Tags: `#specCompliance` `#auditing` `#verification`

---

### P-LOG-012: [2026-05-17] Phase 2.6 — Scan Block/Component Recursively, Not Just Direct Files

**Trigger:** Coverage audits for editor Wraps.

**Anti-pattern:**
Grep `<Wrap` in EditorPreview files only. Miss the fact that HomeContent.js renders block components (StatsBlock, MeetCandidatesBlock → MeetCandidatesCard) which contain UI elements but ZERO Wraps. Result: 6 unreachable catalog entries hidden inside block components (stats-header, stats-progress-card, stats-eligible-card, meet-title, meet-cta, plus the dead-file confusion above).

**Correct pattern:**
For coverage audits, scan ALL files that could render Wraps:
1. Direct EditorPreview files
2. Production components those previews render
3. Block / sub-components those production files render
4. Continue recursively until reaching leaf components

For wrapped elements deep in a render tree, editor props (`selectedElement`, `onSelectElement`, `elementConfigs`, etc.) must be passed down via prop drilling or context. A missing prop chain silently produces "Wrap present but never triggers".

**Detection:**
Map every catalog ID to a specific file:line where its Wrap exists. Catalog IDs without an entry in that map = unreachable.

Tags: `#coverage` `#recursiveScan` `#blockComponents`

---

### P-LOG-013: [2026-05-20] Phase 3 Day 2 — Commit Before Diagnostic Git Operations

**Trigger:** About to use `git stash` / `restore` / file revert during investigation of a possible regression.

**Anti-pattern:**
- Visual issue appears
- `git stash` to test "is this caused by my changes?"
- Confirm working without changes
- Forget to `git stash pop`
- Continue without restoring work
- Next session starts with work missing — no signal that something was stashed

**Correct pattern:**
- BEFORE diagnostic git operations: commit current work (cheap WIP commit on a branch is fine)
- Or use a disposable branch for testing (`git checkout -b probe`)
- Or explicitly note "stash applied, must pop before next session" in the running summary
- After diagnosis: verify state matches expectation (`git status` + `git stash list`)
- Always `git stash list` after a stash to confirm pop happened

**Today's evidence:**
Day 2A code stashed to test whether voteCTA regression was caused by Day 2A changes. Stash pop never happened. Next session started with Day 2A code missing → required recovery sequence (`.next` cleanup + `git stash pop`) before Day 2B could begin.

Tags: `#git` `#workflow` `#stateVerification`

---

### P-LOG-014: [2026-05-20] Phase 3 Day 2 — Verify Canonical Source Before Extracting "Classic"

**Trigger:** Extracting "classic" / "default" state from existing data structures during template/preset migration.

**Anti-pattern:**
- Use first source found (e.g., `defaultConfig`)
- Assume it equals "the classic design"
- Extract verbatim without comparing against richer sources
- Ship with silent visual loss

**Correct pattern:**
- Multiple sources often coexist for the same concept:
  - `instance.defaultConfig` (basic shape — minimum to render)
  - `TEMPLATES.classic` (full design — gradient/shadow/padding/etc.)
  - JSX hardcoded Tailwind classes (legacyClassName)
- Identify CANONICAL source for VISUAL DESIGN before extraction
- Diff sources side-by-side to detect missing fields
- Document which source was chosen and why in the extracted file's header comment

**Today's evidence:**
Day 1 extracted `classic.js` voteCTA-button from `elementInstances.defaultConfig` (6 fields). Actual original design lived in `templateEngine.TEMPLATES.classic` (18 fields) + hardcoded JSX Tailwind classes. Day 2A wired the template into render → voteCTA visually regressed (flat button). Required Option C workaround (gate on user override → fall back to legacy JSX path) to restore production visual.

Tags: `#dataExtraction` `#refactoring` `#verification`

---

### P-LOG-015: [2026-05-20] Phase 3 Day 2 — Hardcoded vs Data-Driven Design Tension

**Trigger:** Component has both hardcoded Tailwind in JSX AND data-driven props (config object) for the same visual concern.

**Anti-pattern:**
- Switch fully to data-driven (e.g., `hasOverride = true` unconditionally)
- Inadvertently bypass the hardcoded path
- Production visual regression

**Correct pattern:**
- Default to legacy hardcoded path when no user customization exists
- Use data-driven ONLY when user explicitly overrides (or template carries the full field set)
- Document the tension explicitly in component header comments
- Plan the migration in order: (1) enrich data fields, (2) verify parity, (3) flip the gate, (4) remove hardcoded fallback

**Today's evidence:**
`VoteCTABlock` has rich `legacyClassName` (gradient/shadow/glow Tailwind) AND `buildButtonStyle()` for inline styles from config. Day 2A set `hasOverride = true` unconditionally → bypassed legacy → flat button. Option C gate: pass `null` when no user override → legacy renders → design preserved. Migration step #4 (remove fallback) deferred to Day 3 after `classic.js` voteCTA fields are enriched.

Tags: `#componentDesign` `#migration` `#visualRegression`

---

### P-LOG-016: [2026-05-20] Phase 3 Day 2B — Audit All Auth Mechanisms Before Adding A New One

**Trigger:** Multiple admin auth mechanisms coexist in the same codebase (e.g., NextAuth session + custom RSA token).

**Anti-pattern:**
- Add a new auth helper assuming all consumers use one mechanism
- Don't audit existing admin entry points
- Get 401 errors only after wiring a real consumer
- Pre-execution diagnose passes because it only inspects code, not runtime auth

**Correct pattern:**
- Before adding a helper, enumerate every existing admin auth path and the cookie/header each one sets
- New helper should ACCEPT both during the transition period (bridge mode)
- Update consumers to send auth in the format the new helper expects
- Don't deprecate the old mechanism until full migration is verified in browser
- Pre-execution diagnose for any auth-touching change MUST include a runtime probe (real fetch, not just grep)

**Today's evidence (Day 2B):**
Day 1's `requireAdmin()` only checked `getServerSession()` (NextAuth). The dedicated `/admin/login` page (used in dev + by non-SSO admins in prod) sets only the RSA `x-admin-token` cookie. Every `/api/admin/templates/*` returned 401 for legacy admins → gallery silently empty. Day 2B pre-execution diagnose missed this because it only read code; the bug surfaced on first real browser fetch. Fix: `requireAdmin(request)` tries session first, then falls back to verifying `x-admin-token`. 6 routes updated to pass `request`; PageDesignTab fetches updated to send the header.

Tags: `#auth` `#migration` `#bridging` `#runtimeVerify`

---

### P-LOG-017: [2026-05-22] Phase 3 Day 4 — Concurrent `next build` corrupts a running `next dev`

**Trigger:** Running `npm run build` as a per-step gate while the `next dev` preview server is still running for visual verification.

**Symptom:** Dev-served page goes blank — `document.body.innerText.length === 0`, zero rendered sections — even though the server returns HTTP 200 with full HTML. Looks like a hydration/render bug.

**Root cause:** `next build` and `next dev` write the same `.next/` directory; the production build clobbers the dev server's chunk state.

**Correct pattern:** Stop the dev server → run `npm run build` → restart dev → reload → visual verify. Never run them concurrently.

Tags: `#build` `#devserver` `#nextjs` `#verification`

---

### P-LOG-018: [2026-05-22] Phase 3 Day 4 — Dead config drifts from JSX; live-migration causes silent regression

**Trigger:** Migrating hardcoded block JSX to read a config field that was previously *unread* ("dead data").

**Symptom:** No error — but the migrated block silently changes from its hardcoded look (e.g. classic `stats-progress-card` config said `borderRadius:"xl"`/12px while the JSX rendered `rounded-[24px]`). Flipping the dead field to authoritative would shrink the radius unnoticed.

**Root cause:** When a config field is never read, nothing keeps it in sync with the hardcoded JSX, so the two drift apart over time.

**Correct pattern:** Before wiring a dead field, read the ACTUAL rendered Tailwind/value and reconcile the config TO the JSX (not the config's stale claimed value). Confirm each migrated block resolves to the original computed style in the browser. (Day 4: corrected several classic radii `xl`/`2xl` → `3xl` to preserve the real look.)

Tags: `#migration` `#deadcode` `#regression`

---

### P-LOG-019: [2026-05-22] Phase 3 Day 4 — New `.md` files are gitignored (`*.md`); plain `git add` silently no-ops

**Trigger:** Committing a NEW markdown file (e.g. VISION.md) in this repo.

**Symptom:** File absent from `git status`; `git add <file>.md` stages nothing and exits 0 (no error). A literal follow of an instruction commits nothing yet appears to succeed.

**Root cause:** `.gitignore` contains `*.md`. Already-tracked docs (CLAUDE.md, DECISIONS.md…) are unaffected (ignore rules don't apply to tracked files), but any NEW `.md` is ignored.

**Correct pattern:** `git add -f <file>.md` to stage without modifying `.gitignore`; verify with `git status --porcelain` showing `A <file>` before committing. When any file mysteriously won't stage, run `git check-ignore -v <path>`.

Tags: `#git` `#gitignore` `#docs` `#projectSpecific`

---

### P-LOG-020: [2026-05-22] Phase 3 Day 4 Step 5 — Decorative gating must key on a config FLAG, not `hasOverride`

**Trigger:** Migrating a block with heavy decorative layers (glow, blobs, animated `<style jsx>` gradient) where the ACTIVE template (classic) always supplies a config.

**Anti-pattern:** Gate decorative effects on `!hasOverride` (the voteCTA pattern). Because classic always resolves a config on the live page, `hasOverride` is always true → the decorative layers are stripped → classic loses its OWN signature look (regression).

**Correct pattern:**
- Gate decorative layers on an explicit per-template config flag (Day 4 used `meet-section.surfaceLight`), defaulting to render in legacy mode (`!hasSection || cfg.surfaceLight !== false`). Classic sets the flag `true` to keep its look; dark/minimal set `false`.
- Enrich the active template's config to REPRODUCE its current decorative look (glow color stops, etc.), so "data-driven" ≠ "stripped".

**Animated `<style jsx>` handling:** swap only the COLOR (inline `backgroundImage` from config) and keep the animation class (`.animate-gradient-xy`, which animates `background-position` via `background-size:200%`) untouched. Motion stays declarative; color becomes data. Worked cleanly with zero animation regressions.

Tags: `#migration` `#decorative` `#stylejsx` `#P-LOG-015-adjacent`

---

## 🚫 Rejected Approaches

### R-001: ❌ HeroBlock as the editable hero
**Decision:** HeroBlock.js is dead code. HomeContent renders inline.  
**Future:** Either delete HeroBlock or make HomeContent use it. Not urgent.

### R-002: ❌ Reuse StatsBlock for results page
**Decision:** Visual design too different (Bento vs row). Use distinct `ResultsStatsBar`.

### R-003: ❌ Cloud storage for images (Phase 1)
**Decision:** Use Docker volume per user preference.

### R-004: ❌ Single ResultCard element with winner modifier
**Decision:** Two elements (regular + winner) for independent admin control.

### R-005: ❌ Hardcoded UI text per step
**Decision:** Use globalConfig once H-CON migration completes.

---

## 🔮 Future Decisions (Pending)

### P-001: Component Library tab structure
**TBD:** Filter UI, layout, browse-only experience.

### P-002: Admin authentication for new tabs
**TBD:** Use existing RSA admin token; verify pattern works for new APIs.

### P-003: Election date editor UX
**TBD:** Calendar picker vs raw input. Validation rules.

### P-004: Mobile editor experience
**TBD:** Touch-friendly Gallery. Possibly different layout.

### P-005: Backup/export feature for admin
**TBD:** Export all globalConfig + designs as JSON for archive.

---

## 📋 Convention Reminders (also in CLAUDE.md)

- All URLs via `getPath()` (basePath /fms-ovs)
- Admin API requires RSA-encrypted token via `x-admin-token` header
- Primary: `#8A2680`, Accent: `#9333EA`, Background: `#F8F9FD`
- `Candidate.number = 0` → งดออกเสียง
- `Candidate.number = -1` → ไม่รับรอง
- `Candidate.number > 0` → พรรคจริง
- Multi-party: NO disapprove (`-1`) hidden
- Single-party: HAS disapprove
- Valid voter years: `['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4']`
- Tailwind only (no custom CSS files)
- All admin-edit data → JSON in DB, never new tables
- Static text → globalConfig (after H-CON)

---

## 🎯 Definition of Done

### Per-step DoD:
- ✅ Spec executed in scope
- ✅ `npm run build` passes
- ✅ Real page renders identically (no regression)
- ✅ Admin preview shows expected change
- ✅ User confirms in browser

### Per-phase DoD:
- ✅ All steps complete
- ✅ User does end-to-end test
- ✅ Git commit + tag (e.g., `phase-1.5-complete`)
- ✅ Update PROJECT_PLAN.md status

### Project DoD:
- ✅ All Phase 1.5 - 4 steps complete
- ✅ All hardcoded strings replaced with globalConfig
- ✅ All P0 elements stateful + editable
- ✅ Saved designs + Created templates working
- ✅ Image library functional
- ✅ Document handed off to next admin (รุ่นน้อง)
