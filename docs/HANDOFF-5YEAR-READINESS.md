# HANDOFF — making FMS Election "5-years ready"

Written 2026-06-27 (end of the Original-template + perf arc). A STRATEGIC roadmap, not
a single spec — for the owner's question "what do we do next to make this system ready
for the next 5 years?" Self-contained; references the existing docs instead of repeating
them. Branch `new-version`.

## 0. WHERE WE ARE (so we don't redo done work)
- **Security foundation = DONE** (P0-1..P0-6 + P1). Verified admin JWT cookie auth,
  atomic vote guard (no double-vote / race), ballot-rule validation, tally hidden from
  admin until reveal, ballot anonymize, rate limit, AdminAuditLog, backup/restore scripts.
  Authoritative detail: **`docs/PLAN-NEXT-SESSION.md`** §1. DO NOT re-audit from scratch.
- **DB migrations exist** (`prisma/migrations/`, 5 + lock) — but there's drift vs `db push`
  (a clean baseline is still a P2, below).
- **Tests are THIN**: `npm run smoke` = only 2 files (`election`, `roleFromSso`). Playwright
  is installed (`@playwright/test`) but UNUSED. → biggest longevity gap (see Pillar 1).
- **Ops docs exist**: `docs/MAINTENANCE-RUNBOOK.md` (env, backup/restore, panic steps).
- **Templates**: classic(+modern-dark/playful/minimal token themes), gumroad, studio-dark,
  verdure, **original** (just rebuilt from ee059dc). Stack: Next 14 / React 18 / Prisma 6.
- Owner's framing has settled into **"distinct templates, each selectable, theme-tokened"**
  (NOT the web-editor). See `[[editor-strategy-decision]]`, `[[template-direction-5x4]]`.

## The 4 pillars of "5-years ready" (a system RUN ANNUALLY for 5 years)

### Pillar 1 — TRUSTWORTHY: prove integrity every year  ⭐ highest leverage
The security CODE is done; what's missing is **a test net so 5 years of edits can't silently
break voting.** This is the single biggest longevity investment.
1. **E2E vote flow (Playwright — already installed, unused).** login → vote → success →
   results → turnout. Plus the INVARIANTS that must never regress:
   - vote-once (second submit rejected; the atomic guard),
   - concurrent double-submit race (two requests, one wins),
   - ballot secrecy / anonymize (admin can't see per-party tally pre-reveal; anonymize nulls candidateId),
   - eligibility (only valid years/faculty),
   - admin-auth (no forged `admin_token`; non-staff SSO ≠ admin).
2. **Unit tests** for the pure logic: `useVoteSystem` selection, ballot-rule validation,
   `roleFromSso`, results tally math (single vs multi vs anonymized).
3. Wire into a **pre-merge gate**: `build` GREEN + `smoke` + new e2e must pass. (The
   recurring "pre-merge gate" we keep owing becomes a real CI-ish checklist.)

### Pillar 2 — REPEATABLE: push-button "new election year"
The system is used **every year** — the thing that makes it survive 5 years is that
running a fresh year is easy + safe, not a heroic manual effort.
1. **"Run a new year" runbook + script** (one place): set election meta (globalConfig —
   electionNumber/year/dates already wired), import the new voter roll
   (`scripts/import-students.js` exists), seed real parties, **RESET_VOTES**, delete test
   parties, `showResult=false`, `systemMode=AUTO`. Most pieces exist (PLAN §2A go-live
   checklist) — consolidate into ONE annual checklist + a dry-run script.
2. **Archive last year before reset**: snapshot results + voter turnout to a file/table,
   and snapshot the active template into `ARCHIVE_TEMPLATES` (the slot exists, empty) so
   each year's exact look is preserved in git. → "SAMO 49 = this design + these results."
3. Document the **data lifecycle** (anonymize after certification — code done; when/how).

### Pillar 3 — MAINTAINABLE: survives new maintainers + dep churn
1. **Migration baseline** (P2 from PLAN §2C): generate a clean init migration so
   `prisma migrate status` is clean on a fresh clone, future schema changes are safe over
   5 years. ⚠️ risky — do carefully (was intentionally deferred).
2. **Dependency / runtime upgrade policy**: Next 14→15+, React 18→19, Prisma, Node — a
   documented cadence (e.g. each year before the election, patch security CVEs + test).
   Pin Node version (`.nvmrc`/engines). Without this, in 3 years the app won't build.
3. **Split the scary file**: `PageDesignTab.js` (~2,300 lines) into modules (PLAN §P3).
   Lower priority now (editor is de-emphasized) but it's the main maintenance landmine.
4. Keep the **DECISIONS.md / P-LOG discipline + CLAUDE.md** current — this is what lets a
   cold maintainer (or future Claude) not repeat the classic-degradation mistake.

### Pillar 4 — PRODUCT: the templates + UX (owner-facing, lower urgency)
1. **Finish OR freeze the template set.** Decide: ship the current ~5 distinct templates as
   the stable "5-year library", or finish the "5×4 themes" vision. Each template should have
   all 7 pages + (optional) theme variants. (Verdure done; Original home done + inner pages
   via Kanit-injection; studio-dark/gumroad inner pages had only a glance — PLAN §2B.3.)
2. **Original-template follow-ups** (from `[[original-template-rollback]]`): `/template-
   preview` + playground don't inject Kanit for original inner pages; add `original` to the
   playground COMPONENTS map.
3. **Perf + a11y budgets**: we just fixed hover jank (don't animate blur/big-shadow) and the
   reduce-motion transition bug — make these a checklist item for every new template.

## RECOMMENDED NEXT-SESSION SEQUENCE
1. **(Owner, anytime real election runs)** Execute PLAN §2A go-live: rotate secrets, set
   `ADMIN_STUDENT_IDS`, cron `backup.sh`, **rehearse `restore.sh` once**. Code can't do these.
2. **(Code, highest leverage)** Pillar 1.1 — stand up the **Playwright E2E vote flow + the 5
   invariants**, and make a pre-merge gate. This protects everything else for 5 years.
3. **(Code)** Pillar 2.1+2.2 — the **annual "new year" runbook + archive** (consolidate the
   existing pieces; add the template-archive into the empty `ARCHIVE_TEMPLATES`).
4. Then Pillar 3 (migration baseline, upgrade policy) and Pillar 4 (templates) as capacity allows.

## FIRST MOVE next session
Task-0 audit (`git status` clean on `new-version`; `npm run build` GREEN; `npm run smoke`;
start dev first — paste outputs per CLAUDE.md Rule 8). Then confirm with the owner: start
**Pillar 1 (the test net)** — recommended — vs execute **go-live (Pillar-2 owner items)** if
a real election is imminent. Read `docs/PLAN-NEXT-SESSION.md` + `docs/MAINTENANCE-RUNBOOK.md`
first.
