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
