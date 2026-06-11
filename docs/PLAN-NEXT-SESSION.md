# HANDOFF — FMS Election (SAMO 49/50), next session

Last updated 2026-06-12 (end of a long multi-arc session). **Self-contained — the
next session has zero memory of the work that produced this.** Read top to bottom.

Branch: `new-version` · working tree CLEAN · `npm run build` GREEN · `npm run smoke` 8/8.

---

## 0. ORIENTATION — read these first (in order)

1. `CLAUDE.md` — conventions + Engineering Discipline. **Task 0 pre-flight audit is
   MANDATORY** before any spec; **Rule 8 = paste REAL command output, not "verified".**
2. This file (you're here).
3. `docs/MAINTENANCE-RUNBOOK.md` — ops, env vars, backup/restore, panic steps.
4. `DECISIONS.md` Pitfall Log (P-LOG-*) — accumulated failure lessons.
5. Memory files (loaded as `[[name]]`): `security-audit-p0`, `studio-dark-progress`,
   `gumroad-progress`, `editor-strategy-decision`, `template-vision`.

### How to work in this repo (env quirks — they WILL bite)
| Quirk | What to do |
|---|---|
| Windows `.next` EPERM / lock | Stop dev server BEFORE `npm run build` or `prisma generate`. `rm -rf .next` if stuck. |
| Dev server backgrounding | Use the **preview_start** MCP tool, not `npm run dev &` (the `&` detaches & exits; bad log paths like `/tmp/...`→`E:\tmp` fail). |
| Kill a stuck server on :3000 | PowerShell `Get-NetTCPConnection -LocalPort 3000 -State Listen` → `Stop-Process -Force`. |
| HMR stale after big batch edits | "spinner forever + console clean + curl 200" = restart dev. NEVER `rm .next` while the process lives (→ site-wide 404). |
| `prisma db push` (NOT migrate) | Migrations have drift; `db push` is how this DB is managed. Stop dev first (EPERM). |
| Bash `/tmp` | maps to `E:\tmp` (missing) — write temp files to the project dir (e.g. `_x.local`) and delete. |
| preview forces `prefers-reduced-motion: reduce` | animations show static in preview — that's expected; verify motion logic via computed styles. |
| preview_screenshot timeout | inject `*{animation:none!important}` + reload; fall back to DOM evals. |
| React interaction test via preview_eval | click in one eval, READ in the NEXT eval (same-eval reads see pre-render DOM). |

### How to log in (do it yourself — never ask the user)
- **Admin:** `node scripts/dev-admin-login.js --show` prints user/pass; then in-page
  `fetch('/fms-ovs/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})})`.
  Admin auth = httpOnly `admin_token` JWT cookie (sent automatically; `credentials:'include'`).
  ⚠️ If secrets were rotated (see §2A) the `--show` creds change — re-run it.
- **Student session (for /vote etc.):** open `/fms-ovs/login` → DEV-ONLY mock form →
  type a studentId (e.g. `6610510149`) → Mock Login. (A raw POST to the NextAuth
  callback does NOT persist the session — use the form.)
- **Auth-free page previews:** `/fms-ovs/template-preview?slug=<classic|gumroad|studio-dark>&page=<home|candidates|party|vote|results|success|closed>&variant=<multi|single|locked|revealed>` renders the REAL layout with mock data (no login).

### Dev DB state (as of handoff)
`activeTemplateId=studio-dark`, `systemMode=MANUAL_OPEN`, `showResult=true`, ballots
NOT anonymized. Election dates are in the PAST → countdowns show 0, status reads
"Ended"/voteCTA shows results — that's dev-data, not a bug. User `6610510149`:
`isVoted=true, candidateId=1`; there's a real party (`The Unity Concord Of FMS 2`,
№1) + a leftover `พรรคทดสอบ TEMP` (№2) + งดออกเสียง(0) + ไม่รับรอง(-1).
**When you mutate dev DB for a test, snapshot + restore it** (this arc did so every time).

---

## 1. WHAT WAS DONE THIS ARC (all committed on `new-version`)

**Template #2 "Studio Dark v2"** (premium dark + lime, persistent left-rail shell):
- `859f4ab` 7-page layout + shared rail/shell · `07f5710` picker-by-family + live gallery
- `f93dc72` per-template inner-page previews in editor + editable-scope hints
- `7fc7ef7` a11y: site-wide `prefers-reduced-motion` + bumped sub-10px labels
- Files: `src/components/home/StudioDark{Home,Rail}.js`, `src/components/vote/StudioDark{Shell,Candidates,Party,Vote,Results,Success,Closed}.js`, theme `src/components/admin/editor/templates/builtIn/studio-dark.js`, route `src/app/template-preview/page.js`.

**Editor:** picker now shows 3 real templates (Classic w/ colour-theme swatches /
Gumroad / Studio Dark) via a `layoutFamily` field; "ดูรายละเอียด" = live 9-slide
gallery; inner-page previews dispatch to the real gumroad/studio layouts.

**Security P0-1…P0-6 (all done + verified):**
- `e92e4e1` P0-1: admin auth = verified `admin_token` JWT cookie (`requireAdmin`/
  `adminGuard` in `src/lib/auth/adminCheck.js` + `verifyAdminJwt.js`); edge middleware
  verifies via `jose`; killed the client-minted `x-admin-token` (secret was in the
  public bundle). `80a59a0` swept all client call sites to `credentials:'include'`,
  deleted `src/utils/auth.js`.
- `51d512d` P0-2 atomic vote guard (updateMany compare-and-set), P0-3 ballot-rule
  validation, P0-4 check-status reads session not `?studentId`.
- `ff0a910` admin turnout dashboard + **per-party tally hidden from admin too** until
  reveal (no `isAdmin` bypass). `aa6e5dc` P0-6 ballot anonymize (option A): freeze
  tally → null `candidateId` after certification; results reads frozen `score` when
  `globalConfig.ballotsAnonymized`.

**Robustness P0-5 + P1:**
- `8d13db3` P0-5: `scripts/backup.sh` + `restore.sh`, compose secret cleanup, runbook.
- `17f1d99` P1: rate limit (`src/lib/rateLimit.js`), `AdminAuditLog` model + writes,
  admin IDs → `ADMIN_STUDENT_IDS` env, smoke suite `scripts/smoke/` (`npm run smoke`).

---

## 2. WHAT REMAINS — grouped BY OWNER

### A) 🔴 USER / INFRA — NOT code (next session can't do these; remind the user)
1. **ROTATE SECRETS** (old ones are burned — were in the client bundle): new
   `ADMIN_JWT_SECRET`, `ADMIN_PASSWORD_AUTH_EXTRA` (then set the admin user's
   `passwordHash=null` so the new bootstrap password applies). Delete the now-unused
   `ADMIN_PRIVATE_KEY` / `ADMIN_AUTH_SECRET` / `NEXT_PUBLIC_ADMIN_*` from `.env`.
2. **Set `ADMIN_STUDENT_IDS`** in prod `.env` (comma-separated; code falls back to the
   legacy pair if unset, but prod should be explicit).
3. **Apply ops:** `docker compose up`, cron `scripts/backup.sh` daily, and **rehearse
   `scripts/restore.sh` once** against a throwaway target before election day.
4. **Go-live checklist (day-of, destructive — do NOT run on dev now):** set real dates
   in admin, `systemMode=AUTO`, seed real parties, **delete `พรรคทดสอบ TEMP`**,
   `RESET_VOTES`, `showResult=false`, then full E2E (login→vote→success→results→
   turnout dashboard). After certification: press **Anonymize** in admin settings.

### B) 🟡 DESIGN-TASTE — needs the USER'S EYE (do NOT change unilaterally)
Lesson (P-LOG / gumroad): don't macro-restructure what the owner approved. Propose,
let them pick.
1. **Gumroad vote-header still reuses the home pink-box** ("เลือกตั้ง สโมสรนักศึกษา")
   — the last "each-page-distinct" gap. → Propose 2-3 directions, user picks.
2. **Studio-dark ballot leads in English** ("Choose one, then confirm.") — Thai is
   secondary. Product call: keep (Thai is in the deck/options) vs flip hierarchy on
   /vote only. **Ask the user.**
3. **Studio-dark inner pages (candidates/party/vote/results/success/closed) have only
   had a glance from the owner** — home got 1 feedback round + polish; the rest is the
   assistant's judgment. → Have the user open them (DB is studio-dark; visit
   `/fms-ovs/candidates`, `/party?id=1`, etc.) and give per-page feedback like home got.
4. **Studio-dark contrast tradeoff:** ~13 remaining 10px `--sd-mono` labels in
   `--sd-ink-3` (#7F7A6E on #14140F ≈ 4:1, just under WCAG AA). Fixing = brighter/bigger
   labels = louder than the intended "quiet dim" look. **User decides** a11y-strict vs
   aesthetic (assistant's view: acceptable to keep — these are secondary labels).
5. **Gumroad results-head redesign** (done an earlier session) still awaits the user's
   reaction (keep / change).
6. true-900 Thai heading weight still deferred (Anuphan tops out at 700 — needs a
   900-capable Thai font = a design decision).

### C) 🟢 CODE-READY — next session CAN do (no user decision needed)
**P1 leftover:**
- **SSO "staff" group → ADMIN mapping** (`src/lib/auth.js` ~line 180): confirm who
  controls the PSU "staff" group; if loose, tighten. Document in runbook.

**P2 (robustness, 10-year axis — pick highest value, none block go-live):**
- **Migration baseline** — repo uses `db push` (drift; `migrate deploy` would reset).
  Generate an init migration (`prisma migrate diff --from-empty …`) + document restore.
  ⚠️ risky — do carefully, was intentionally skipped this arc.
- **`Candidate.score` as single source of truth** — results currently reads
  `_count.voters` live (and frozen `score` post-anonymize). The `score` column drifts
  (P0-2 fixed the increment; anonymize now recomputes it). Consider making `score` the
  one source + a reconcile script. (Linked to P0-6.)
- **`useVoteStatus()` hook** — every page re-fetches `/api/check-status` because the
  NextAuth JWT caches `isVoted` until re-login. Consolidate into one hook.
- **Dead code:** `MonitorTab.js` hardcodes 2024 dates; commented-out blocks.

**P3 (polish — DEFERRED, do NOT do pre-go-live; refactor risk on working code):**
- Split `PageDesignTab.js` (~2,300 lines, the scariest file) into modules.
- Undo/redo in PageDesignTab (compose-lab has it; the staff-facing editor doesn't).
- Add editor Wraps to studio-dark/gumroad inner pages IF the user wants per-element
  editing there (currently theme-token + central-text editing only — that's by design
  per `editor-strategy-decision`).

---

## 3. DESIRED RESULT per remaining code item (so "done" is unambiguous)

- **SSO staff-group:** a documented, intentional rule for who becomes ADMIN via SSO;
  a non-staff PSU account must NOT get admin. Verify with a test account if possible.
- **Migration baseline:** `prisma migrate status` clean on a fresh clone + DB; restore
  path in runbook; no data loss on the existing DB (use `db push`-compatible baseline).
- **score-as-SoT:** results identical before/after the change in all states (locked,
  revealed, single-party, anonymized) — verify with the same save/restore DB cycle this
  arc used; paste outputs.
- **useVoteStatus:** one fetch per navigation instead of N; vote→success→results still
  reflects fresh status without re-login.

## 4. KEY FILE MAP
```
Auth:      src/lib/auth.js (NextAuth+SSO) · src/lib/auth/adminCheck.js (requireAdmin/
           adminGuard) · src/lib/auth/verifyAdminJwt.js · src/middleware.js (jose)
Vote:      src/app/api/vote/route.js (atomic guard + ballot validation + rate limit)
Results:   src/app/api/results/route.js (tally-hide policy + turnout breakdown + frozen-
           score-when-anonymized)
Admin API: src/app/api/admin/{dashboard,config,global-config,page-layout,candidates,
           members,login}/route.js  (all use requireAdmin/adminGuard)
Admin UI:  src/app/admin/page.js (overview turnout dashboard + settings + Anonymize btn)
           src/components/admin/PageDesignTab.js (editor — picker/gallery/preview)
Templates: src/components/admin/editor/templates/builtIn/*.js (+ index.js + templateEngine.js)
           src/components/home/HomeRenderer.js (slug→home layout)
Studio DK: src/components/home/StudioDark{Home,Rail}.js · src/components/vote/StudioDark*.js
Ops:       scripts/backup.sh · scripts/restore.sh · scripts/smoke/ · docker-compose.yml
Rate/Audit: src/lib/rateLimit.js · prisma/schema.prisma (AdminAuditLog)
```

## 5. FIRST MOVES for the next session
1. Task 0 audit: `git status` clean, on `new-version`, `npm run build` passes, `npm run
   smoke` 8/8 (start dev first). Paste outputs.
2. Ask the user which lane to take: **(B) design polish** (they drive — start by having
   them review studio-dark inner pages or pick a gumroad vote-head direction), or
   **(C) code robustness** (SSO check / a P2 item), or confirm **(A) go-live** timing.
3. If unsure, the highest-leverage non-blocking code item is the **SSO staff-group
   check** (security, no user taste needed). Everything in (A) is the user's to run.
