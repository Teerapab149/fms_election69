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

**UPDATE 2026-05-22 (later session):** `.gitignore` no longer ignores `*.md` (ADR-001-architecture.md staged via plain `git add` — `git check-ignore` returned no match). The `-f` workaround is NO LONGER NEEDED. Rule now reduces to: when any file won't stage, run `git check-ignore -v <path>` to confirm the cause before assuming gitignore. Do not pre-frame a commit around `-f` based on this stale pitfall.

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

### P-LOG-021: [2026-05-24] Phase 1 Week 2 Day 5 — P-LOG-019 stale: `.gitignore *.md` rule no longer applies; rule reduces to root-cause check

**Trigger:** Looking up the P-LOG-019 workaround for a new `.md` commit (Day 5 docs updates).

**Root cause:** P-LOG-019 itself was already amended on 2026-05-22 to note `.gitignore` no longer ignores `*.md`. The `-f` workaround is dead. Future sessions should not preemptively reach for `git add -f` based on the original P-LOG-019 framing.

**Correct pattern:** Trust plain `git add <file>.md`. When something won't stage, run `git check-ignore -v <path>` to confirm the cause before assuming gitignore. Treat P-LOG-019 as historical; this entry is the canonical pointer.

Tags: `#git` `#gitignore` `#stale-pitfall` `#projectSpecific`

---

### P-LOG-022: [2026-05-24] Phase 1 Week 2 Day 5 — Layer 1 token emission via .fms-app scope (unified pipeline)

**Trigger:** Implementing ADR-001 D11 — both live home page (SSR) and editor preview must emit CSS variables identically.

**Correct pattern:**
- Define `theme.tokens` as a flat `{ "--name": "value" }` map in each template (no nesting, no inheritance — every template defines all 15 tokens for snapshot stability per D5).
- A pure utility `buildTokenStyles(tokens, scope)` turns the map into CSS text, filtering out non-`--` keys defensively.
- HomeContent emits `<style dangerouslySetInnerHTML={{__html: …}} />` *inside* the `.fms-app` wrapper element, scoping vars to that subtree. Children read tokens via `var(--color-*)` in inline styles.
- Inline override (Layer 3) wins via `cfg.X || 'var(--token)'` — explicit element config takes precedence, token is the fallback.

**Why `.fms-app` not `:root`:** the admin editor preview can mount an independent `.fms-app` scope without bleeding its tokens to the surrounding chrome (which lives at `:root`).

**Byte-faithful check:** classic's tokens mirror the values its element configs already set, so JSX that falls back to a token resolves to the same hex. Verified in browser DevTools — page bg #F8F9FD, hero gradient unchanged, sub-card border #f1f5f9 all preserved.

Tags: `#tokens` `#css-vars` `#ADR-001` `#unified-pipeline`

---

### P-LOG-023: [2026-05-24] Phase 1 Week 2 Day 5 — Next.js basePath swallows direct `window.location.href` assignments in preview eval

**Trigger:** Verifying token changes across templates by switching `systemConfig.activeTemplateId` in DB and reloading the home page via `window.location.href = 'http://localhost:3000/fms-ovs/'` in `preview_eval`.

**Symptom:** After `await fetch(...)` + `window.location.href = ...`, the URL becomes `/?nocache=…` (basePath stripped), static chunks 404 (`/_next/static/...` instead of `/fms-ovs/_next/static/...`), and `main` renders empty. `document.querySelector('.fms-app')` returns null.

**Root cause:** Mixing `fetch()` of the basePath URL with `window.location.href` assignment in the same eval interferes with Next.js's basePath rewrite in dev mode — the browser tab ends up navigating to the bare `/` path on the wrong host context.

**Correct pattern:**
- Use `window.location.assign('http://localhost:3000/fms-ovs/')` (NOT `href = …`).
- Do NOT also `fetch()` the same URL in the same eval — assign-only.
- If the preview gets stuck on `<main></main>`, `preview_stop` + `preview_start` resets it.
- Verify `location.href` ends with `/fms-ovs/` (or `/fms-ovs`) before inspecting DOM.

Tags: `#preview` `#nextjs` `#basePath` `#tooling`

---

### P-LOG-024: [2026-05-24] Phase 1 Week 2 Day 6 — Token activation pattern: remove the redundant cfg field, JSX `||` fallback hits the token

**Trigger:** Day 6 making Layer 1 tokens *active* (not fallback-only) after Day 5 laid the foundation.

**Pattern:** when an element config field VALUE equals the template's token value AND the JSX consumes the field via `cfg.X || 'var(--token)'`, **REMOVE the cfg field**. The JSX falls through to the token, so the rendered value is identical to before — but now editing the token in `template.theme.tokens` *propagates* to the rendered DOM. The same edit was a no-op before because the cfg's explicit hex won the cascade.

**Verification:** edit `--color-bg` in `classic.js` from `#F8F9FD` to `#ffe4e1` → home page bg turns pink. Revert → back to gray-blue. This is the "tokens are active" sanity check; if the page DOESN'T change, an upstream override is still winning — find the leak before proceeding.

**Out of pattern:** fields with NO `||` fallback in JSX (e.g. `borderRadius` — JSX only applies `style.borderRadius` *if* `cfg.borderRadius` is set; no token branch). Removing those silently drops the style entirely. Day 6 KEEPs all `borderRadius` fields. Day 7 extends JSX to add `|| var(--radius-card)` so radii become token-active too.

Tags: `#tokens` `#layer-1` `#activation` `#ADR-001`

---

### P-LOG-025: [2026-05-24] Phase 1 Week 2 Day 6 — Spread-inheritance leaks parent override into child template

**Trigger:** Removing `borderColor` from modern-dark's stats-progress-card config (expecting fallback to `--color-border #334155`), but the rendered border came out as `#f1f5f9` — classic's lighter custom border bled in through `...classicTemplate.elements["X"].config` spread.

**Root cause:** stub templates compose via `{ ...classicTemplate.elements["X"].config, ...overrides }`. When `overrides` removes a field that classic explicitly sets (e.g. classic's `#f1f5f9` sub-card border, classic's `#ffffff` banner border), the spread keeps classic's value alive. The token fallback never fires because `cfg.borderColor` is still truthy (just inherited rather than overridden).

**Correct pattern:** when a stub wants the **token** to drive a field (not classic's explicit value), **drop the spread for that element** and write an explicit field subset:

```js
"stats-progress-card": {
  config: {
    borderRadius: "3xl",
    numberColor:  "#f1f5f9",
    labelColor:   "#94a3b8",
    accentColor:  "#06b6d4"
  }
}
```

Verbose but unambiguous: only fields actually wanted are present, the rest fall through to JSX `|| var()` token fallbacks.

**Alternative (rejected):** `borderColor: undefined` after spread. Works functionally (JSX `||` treats undefined as falsy → token wins), but JSON.stringify drops undefined keys → snapshots stay clean. Readers, though, see a redundant `undefined` line that looks like a bug. Explicit subset is clearer.

**Rule:** every cross-template spread is a hidden coupling. Whenever a stub wants different (or token-driven) behaviour for a field its parent sets, break the spread for that element, not just override the field.

Tags: `#templates` `#spread` `#inheritance` `#tokens` `#layer-1`

---

### P-LOG-026: [2026-05-24] Phase 1 Week 2 Day 6 — Surface-alignment side effect: removing inherited override pulls a value toward the template's surface token

**Trigger:** Day 6 stripped minimal.banner-section's inherited `backgroundColor: #ffffff` (via classic spread). The new render computes from `--color-surface = #f9fafb`. Minimal's banner shifted `#ffffff → #f9fafb`.

**Why it happened:** minimal's other surfaces (sub-cards, meet) were already `#f9fafb` explicitly — only the banner was at `#ffffff` because classic's spread happened to set it. The Day 5 baseline was internally inconsistent; Day 6 token propagation reveals and resolves the inconsistency.

**Impact:** RGB diff (255,255,255) vs (249,250,251) — 6 bits, imperceptible side-by-side. No regression report risk.

**Decision:** accept the alignment. The architectural goal (one template = one surface token across all surfaces) outweighs perfect byte-for-byte parity on a vestigial inconsistency. Documented in the commit message + here so future readers don't try to "fix" it back to `#ffffff`.

**Process lesson:** when migrating templates, audit each stub's surface fields for *internal* consistency, not just parity with the previous render. The token activation pass is a natural moment to clean up these accidental drifts — flag, don't hide.

Tags: `#templates` `#tokens` `#minor-drift` `#minimal`

---

### P-LOG-027: [2026-05-24] Phase 1 Week 2 Day 6 — `.next` manifest race kills HMR mid-session after multiple template switches

**Trigger:** After 3+ template switches via DB writes + `window.location.assign` + HMR cycle, dev server starts throwing `UNKNOWN: open .next/server/app-paths-manifest.json` on every request → page renders empty `<main></main>`.

**Root cause:** Windows filesystem race between Next.js dev server's own manifest rewrites and HMR triggering reloads on every saved file change. (Related to but distinct from P-LOG-017 — that was build/dev clash; this is dev-only thrashing after sustained activity.) The first compile works; ~20–30 minutes in, the manifest write/read races corrupt the in-memory build graph.

**Correct pattern:**
- `preview_stop` → `rm -rf .next` → `preview_start` → wait 12 s before first navigation. Resets cleanly.
- For multi-template visual verify in one session, plan to restart the dev server at least once per template switch if the session has already done significant HMR work.
- Build output (`npm run build`) is unaffected — production path works fine. Only dev HMR is fragile here.

**Don't:** retry `window.location.reload()` repeatedly on a stuck page. The reload triggers further compile attempts, deepening the manifest corruption. Stop the server first.

Tags: `#nextjs` `#dev-server` `#hmr` `#windows` `#tooling` `#P-LOG-017-adjacent`

---

### P-LOG-028: [2026-05-24] Phase 1 Week 2 Day 7a — Radius token activation needs JSX `|| var()` AND cfg cleanup, just like color

**Trigger:** Day 7a Step 1 wired `s.borderRadius = (cfg.borderRadius && RADIUS_MAP[cfg.borderRadius]) || 'var(--radius-card)'` in 5 helpers. First activation test (`--radius-card` 24px→4px) showed token value updated to 4px but rendered banner/sub-card radii stayed 24px.

**Root cause:** element configs still set explicit `borderRadius: "3xl"` (=24px in RADIUS_MAP) → Layer 3 cfg won over Layer 1 token, same trap as Day 6's color cleanup. Token wiring is necessary but NOT sufficient — must also strip redundant cfg fields whose value matches the template's token.

**Correct pattern (matches P-LOG-024):** for every JSX field with a `|| var(--X)` fallback, audit element configs and REMOVE the cfg field where `cfg.X` value equals the template's token-value for `--X`. Day 7a removed 6 classic radius configs (banner, stats-voted, stats-progress, stats-eligible, meet-section, meet-cta) + 2 minimal ones (banner, meet-section). After removal, re-running the token tweak (24px→4px) propagated to all 4 card elements.

**Subtlety for stubs:** modern-dark / playful keep explicit radii (`"3xl"`=24px on banner) because their `--radius-card` ≠ 24px. Their cfg ≠ token → cfg correctly wins; visually byte-faithful with Day 6. Only remove cfg when value matches the relevant token.

Tags: `#tokens` `#radius` `#activation` `#layer-1` `#sibling-of-P-LOG-024`

---

### P-LOG-029: [2026-05-24] Phase 1 Week 2 Day 7a — Spread inheritance is a hidden coupling; explicit subset is the safer default in stubs

**Trigger:** Day 7a Part 2 audit of `...classicTemplate.elements["X"].config` spread sites in stubs. Several were "harmless today" (e.g. classic.meet-section only had `visible: true` after Day 6's stripping) but reactive in nature — if classic later adds a hex field, every stub auto-inherits it and silently breaks.

**Decision:** Replace such spreads with explicit field subsets (Option α per the Day 6 P-LOG-025 wording), even when there's no current visual leak. Verbose but unambiguous: each stub's intent is locally readable, no cross-file coupling, no surprise drift when classic evolves.

**Discovered side-effect during cleanup:** modern-dark.meet-section was inheriting classic's old `borderRadius: "3xl"` via spread → masking modern-dark's own `--radius-card=20px`. With spread removed AND Day 7a Step 1's radius wiring, modern-dark.meet radius shifted 24px → 20px (token-aligned, intentional). Parallels P-LOG-026's minimal banner surface alignment. Documented as P-LOG-031.

**Preserved spreads (intentional shared identity):**
- hero-title/subtitle/year-badge text + fontSize + fontWeight — shared content/typography, OK to inherit
- voteCTA-button states — complex multi-field structure, variant work (Day 7b) will restructure
- stats-voted-card — gradient + textColor are always overridden by stubs
- meet-cta `{text}` — text content is canonical in classic, shared by design

**Rule:** "every cross-template spread is a hidden coupling" (P-LOG-025) generalizes: prefer explicit subset by default, spread only when the inherited fields are deliberately shared and stable. When in doubt, write the fields out.

Tags: `#templates` `#spread` `#inheritance` `#layer-3` `#P-LOG-025-followup`

---

### P-LOG-030: [2026-05-24] Phase 1 Week 2 Day 7a — Layer 2 vars must be declared at element root with full key set (fallback chain defense)

**Trigger:** Implementing the banner-section Layer 2 pilot per ADR-001 D10. The chain pattern is `Layer 3 cfg > Layer 2 --banner-* > Layer 1 --color-*` — but **only if** the Layer 2 vars are declared at the right scope.

**Rule (D10):** every element entry's `vars: {...}` block MUST declare ALL Layer 2 vars the element consumes — not just the ones it overrides. The emitter creates one CSS rule per element scope (e.g. `.fms-app [data-element="banner-section"] { --banner-bg: ...; --banner-border: ...; --banner-radius: ...; }`). Each var defaults to `var(--color-surface)` etc., chaining to Layer 1. Partial declarations would mean an unset var resolves up the cascade, potentially picking up a parent element's `--banner-bg` if there were nesting — undefined behaviour.

**Verified pattern:**
```js
"banner-section": {
  config: { visible: true, borderColor: "#ffffff" },
  vars: {
    "--banner-bg":     "var(--color-surface)",  // L1 chain
    "--banner-border": "var(--color-border)",   // L1 chain
    "--banner-radius": "var(--radius-card)"     // L1 chain
  }
}
```

JSX consumes:
```js
style.backgroundColor = cfg.backgroundColor || 'var(--banner-bg)';
style.borderColor     = cfg.borderColor     || 'var(--banner-border)';
style.borderRadius    = (cfg.borderRadius && RADIUS_MAP[cfg.borderRadius])
                        || 'var(--banner-radius)';
```

JSX root carries `data-element="banner-section"` so the CSS rule scope matches.

**Activation evidence:** setting classic's `--banner-bg` to `#ff0000` (bypassing the L1 chain) turned the banner red without touching `--color-surface`. Revert to `var(--color-surface)` restored #ffffff. This is the editor's future override surface — admin can re-skin one element without touching theme tokens.

**Inheritance defense check:** grep confirmed `data-element="banner-section"` appears only in `ElectionBannerBlock.js` — no nested duplicate scopes, no shadow inheritance risk.

Tags: `#layer-2` `#data-element` `#fallback-chain` `#ADR-001-D10` `#banner-pilot`

---

### P-LOG-031: [2026-05-24] Phase 1 Week 2 Day 7a — modern-dark meet radius surface-aligned 24px→20px after spread removal

**Trigger:** Day 7a Step 2 dropped the `...classic.meet-section.config` spread in modern-dark (preventive spread cleanup). After the change, modern-dark.meet rendered radius shifted from 24px to 20px.

**Root cause:** Day 5-6 modern-dark.meet inherited classic's `borderRadius: "3xl"` (=24px) via spread, even though modern-dark's own `--radius-card=20px`. The inherited explicit cfg silently masked the token. After Day 7a Step 1 removed classic's redundant `borderRadius: "3xl"` AND Step 2 dropped the spread, modern-dark.meet falls through to `var(--banner-radius)` → `var(--radius-card)` → 20px.

**Decision:** accept the alignment. 4-bit perceptible diff (24→20px = ~15% smaller corners), but architecturally correct — modern-dark's token now drives its own rendering, no longer masked by spread inheritance. Parallels P-LOG-026 (minimal banner surface alignment). Day 5/6 had this latent inconsistency; Day 7a's cleanup pass reveals and resolves it.

**Process lesson:** removing a hidden coupling (spread) sometimes uncovers latent drift. Treat the post-cleanup state as the *correct* one — don't reach back to restore the inconsistency to chase "byte-faithful with Day 6." Faithful to architectural intent > faithful to historical accident.

Tags: `#templates` `#spread-cleanup` `#side-effect` `#alignment` `#P-LOG-026-sibling`

---

### P-LOG-032: [2026-05-24] Phase 1 Week 2 Day 7b — Variant component file structure: `src/components/elements/<id>/`

**Trigger:** First implementation of the variant-as-component pattern per ADR-001 v1.2 (Element Library + Registry) and VISION D12.

**Pattern:**
```
src/components/elements/banner-section/
├── index.js          ← resolver: getBannerVariant(id) → component
├── default.jsx       ← variant components, one per file
├── minimal-line.jsx  ← (alternative variants added here over time)
└── README.md         ← element + variant contract
```

**Wrapper layer:** the existing block file (`src/components/blocks/ElectionBannerBlock.js`) becomes a 5-line thin wrapper that reads `resolvedTemplate.elements['banner-section'].variant`, calls the resolver, and forwards all props. No caller refactor needed — every site that already imported `ElectionBannerBlock` keeps working unchanged. This is the **non-breaking** way to introduce variants to an existing element.

**Variant contract (5 rules, enforced in README):**
1. Root carries `data-element="<element-id>"` — Layer 2 vars resolve at this scope.
2. Same prop signature as the wrapper — `{ config, resolvedTemplate, elementConfigs }` for banner.
3. Layer 2 vars consumed via fallback chain (cfg → `var(--banner-bg)` → `var(--color-surface)`).
4. Self-contained — no globals, no shared mutable state.
5. Layer 3 inline (cfg explicit) wins — verified on both variants with bg=#ff0000 test.

**Project alias note:** this repo has no `jsconfig.json` / `tsconfig.json` path alias. Use relative imports (`../elements/banner-section`), NOT `@/components/elements/...`. The spec used the alias for illustration; the actual code uses relative.

Tags: `#variants` `#file-structure` `#elements-folder` `#ADR-001-v1.2` `#VISION-D12`

---

### P-LOG-033: [2026-05-24] Phase 1 Week 2 Day 7b — Variant resolver: explicit fallback to "default", soft warn on unknown ID

**Trigger:** Designing `getBannerVariant(variantId)` — what should it do when the template's `variant` field is missing, undefined, or a typo?

**Decision (per ADR-001):**
- Missing/undefined → return `VARIANTS.default` silently. Templates predate the variant field; many will never set it. No noise.
- Known ID → return the registered component.
- Unknown ID (typo, removed variant) → return `VARIANTS.default` **and** `console.warn` once with the offending ID. Dev sees the typo in their console; prod is unaffected because production builds strip `console.warn` by default in Next.js client bundles (and server logs surface in CI/deploy logs).

**Pattern:**
```js
export function getBannerVariant(variantId) {
  if (variantId && !VARIANTS[variantId] && typeof console !== 'undefined') {
    console.warn(`[banner-section] unknown variant "${variantId}", falling back to "default"`);
  }
  return VARIANTS[variantId] || VARIANTS.default;
}
```

**Verification:** temporarily removed `variant` field from classic.js → page rendered default banner unchanged, no warning. Set variant to `"minimal-line"` → swapped correctly. Setting to `"nonexistent"` would warn and fall back (not tested live but path is straightforward).

**Rejected:** throwing an error on unknown. Templates are admin-edited data — a typo should not crash the page. Silent fallback + dev warning is the right shape for end-user-facing template data.

Tags: `#variants` `#resolver` `#fallback` `#dev-ergonomics` `#variant-contract`

---

### P-LOG-034: [2026-05-24] Phase 1 Week 2 Day 7b — Variant swap mechanics: same data, different component, same scope

**Trigger:** Day 7b Part 3 swap test — classic with `variant: "minimal-line"` vs `variant: "default"`. Did the swap actually change the rendered tree, or just toggle some CSS?

**Verified behaviour (real browser, DevTools):**

| Property | variant: "default" | variant: "minimal-line" |
|---|---|---|
| Root element | `<div data-element="banner-section">` | `<div data-element="banner-section">` |
| `className` | `... rounded-3xl border-white bg-white shadow-2xl` | `... aspect-[16/9] py-2` (no card chrome) |
| `background-color` | `rgb(255,255,255)` | `rgba(0,0,0,0)` (transparent) |
| `border-top` | `1px solid #fff` (from cfg.borderColor) | `1px solid #fff` (rule) |
| `border-bottom` | (none — single border, all sides) | `1px solid #fff` (rule) |
| `border-left/right` | (single border) | `0px` |
| `border-radius` | `24px` | `0px` |
| `box-shadow` | `shadow-2xl` (computed) | `none` |
| Layer 3 override test | `cfg.backgroundColor=#ff0000` → `rgb(255,0,0)` ✓ | `cfg.backgroundColor=#ff0000` → `rgb(255,0,0)` ✓ |

**Key insight:** the swap is a React component swap, not a CSS class toggle. React unmounts `DefaultBanner` and mounts `MinimalLineBanner` (different file, different JSX tree). Both render the *same* `data-element="banner-section"` root → Layer 2 vars (`--banner-bg`, `--banner-border`) resolve identically for both, so the cascade is unbroken. Layer 3 cfg fields (`backgroundColor`, `borderColor`) flow into both via the same prop path.

**Why this matters for the editor (Day 10+):** admins will swap variants from a dropdown without losing their Layer 3 overrides or Layer 1 theme settings. Content (the slideshow images) is shared too — only the frame differs.

**Architectural rule (added to README):** "frame differs, content does not" — variants change wrappers/borders/radii/shadows, NOT what's *inside* the banner. If content needs to differ between variants, factor the content into a shared `<BannerContent />` component and let variants compose it. For Day 7b pilot, both variants inlined the slideshow because it's compact (~25 lines).

Tags: `#variants` `#swap-mechanics` `#layer-3` `#three-layer-cascade` `#editor-foundation`

---

### P-LOG-035: [2026-05-24] Phase 1 Week 2 Day 7b — Preview server died mid-test; restart cycle is now familiar enough to be procedure

**Trigger:** Mid Part 4 verify, after multiple navigations (default → L3 red → minimal-line + L3 red → revert), `preview_eval` returned `"Server not found. No running servers for this workspace."` — the dev process had exited silently.

**Root cause (likely):** Windows file-watcher race on `.next/` cache files during rapid sequential edits combined with route compilation. P-LOG-027's "manifest race" generalizes — sometimes the race corrupts the running process to the point Next.js cleanly shuts down rather than throwing manifest errors. The symptom shifted (process gone vs manifest 404s) but the cause family is the same.

**Recovery procedure (proven 5+ times across Day 6/7a/7b):**
1. `preview_stop` (if still listed) → just-in-case cleanup.
2. `rm -rf .next` (always, no exceptions).
3. `preview_start fms-dev`.
4. `sleep 15` before first navigation — gives Next.js time to do the cold compile.
5. `preview_eval window.location.assign(...)` to the full URL with basePath.
6. `sleep 18` for the SSR first-paint compile.
7. Inspect.

**For Day 8+:** this is now expected friction on this Windows dev box, not a per-session surprise. The total recovery time is ~45s per cycle, ~6× during a typical 3h session = ~5min lost. Acceptable; documented; not a blocker. Linux dev would likely eliminate it, but the project ships from Windows so we live with the workaround.

Tags: `#nextjs` `#dev-server` `#windows` `#hmr` `#procedure` `#tooling` `#P-LOG-027-followup`

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
