# PLAN — SECURITY HARDENING (P0) + cleanup

Written 2026-06-10 (end of the Studio Dark v2 session, model: Fable 5).
**Read this top-to-bottom before touching anything.** This file is self-contained —
the next session has no memory of the conversation that produced it.

---

## ✅ PROGRESS (updated 2026-06-10, later same day)

Committed on `new-version`:
- `859f4ab` studio-dark template · `07f5710` picker families + gallery (Step 0a done)
- **`e92e4e1` P0-1 admin auth** — DONE + curl-verified (no-auth/forged-header/forged-cookie
  → 401 or redirect; real login → cookie → all admin endpoints 200; public routes open).
- **`51d512d` P0-2/3/4** — DONE + verified (atomic guard: 5 concurrent claims → 1 winner;
  candidateId ballot validation; check-status reads session not query param).

**⚠️ STILL REQUIRED for P0-1 to be safe in PRODUCTION (USER ACTION — not code):**
ROTATE secrets — the old ones are burned. `ADMIN_JWT_SECRET`, `ADMIN_PASSWORD_AUTH_EXTRA`,
retire `ADMIN_AUTH_SECRET` + the RSA keypair (`ADMIN_PRIVATE_KEY` / `NEXT_PUBLIC_ADMIN_*`).
After rotating `ADMIN_PASSWORD_AUTH_EXTRA`, set the admin user's `passwordHash=null` so the
new bootstrap password applies. (Dev still uses the old `--show` creds until rotated.)

**REMAINING P0:** P0-5 (uploads volume + backups — user owns) · P0-6 (ballot-secrecy
policy — ASK USER). **Cosmetic follow-up:** ~40 dead `x-admin-token` headers + the
`getEncryptedToken` stub + imports can be removed (zero security/functional impact now —
the server ignores the header, cookie does the auth). Then P1 / P2 below.

**Browser tab-by-tab admin test still recommended pre-deploy** (this session verified the
API contract via curl, not the UI — MCP preview was down). Every admin tab uses the now-
ignored header + the cookie, so they should work, but click through them once.

---

> Context chain: read with memory `studio-dark-progress` + `editor-strategy-decision`,
> and repo docs `DECISIONS.md` (Pitfall Log) + `docs/MAINTENANCE-RUNBOOK.md` + `CLAUDE.md`
> (Engineering Discipline — Task 0 audit is MANDATORY, Rule 8 = paste real outputs).

---

## What the last session shipped (status: DONE, verified, **NOT COMMITTED**)

1. **Template #2 "Studio Dark v2"** (slug `studio-dark`) — ALL 7 pages live
   (home/candidates/party/vote multi+single/results locked+revealed/success/closed),
   shared shell architecture, QA'd (console 0 errors, mobile 375px no overflow).
2. **Template picker restructure** — 3 family cards (Classic / Gumroad / Studio Dark);
   classic's recolors (modern-dark/playful/minimal) are now colour **swatches inside
   the Classic card** via new `layoutFamily` field.
3. **Live template gallery** — "ดูรายละเอียด" opens a 9-slide live-iframe gallery
   (new auth-free route `/template-preview?slug=&page=&variant=` rendering real layout
   components with mock data).
4. **Full-system security/quality audit** (Fable 5, code-verified) → this plan.

### ⚠️ Step 0a — COMMIT the uncommitted work FIRST

`git status` should show ~20 files. Commit BEFORE starting security work so the
template work is a clean checkpoint. Suggested split (explicit paths, never `-A`):

```bash
# commit 1 — template #2 (studio dark v2, all pages)
git add src/components/admin/editor/templates/builtIn/studio-dark.js \
        src/components/admin/editor/templates/index.js \
        src/components/admin/editor/templateEngine.js \
        src/app/layout.js \
        src/components/home/HomeRenderer.js src/components/home/StudioDarkHome.js \
        src/components/home/StudioDarkRail.js \
        src/components/vote/StudioDarkShell.js src/components/vote/StudioDarkCandidates.js \
        src/components/vote/StudioDarkParty.js src/components/vote/StudioDarkVote.js \
        src/components/vote/StudioDarkResults.js src/components/vote/StudioDarkSuccess.js \
        src/components/vote/StudioDarkClosed.js \
        src/app/candidates/page.js src/app/party/page.js src/app/vote/page.js \
        src/app/results/page.js src/app/success/page.js src/app/closed/page.js
git commit  # feat(studio-dark): template #2 — full 7-page layout + shared rail/shell

# commit 2 — picker families + live gallery
git add src/components/admin/PageDesignTab.js \
        src/components/admin/editor/templates/builtIn/classic.js \
        src/components/admin/editor/templates/builtIn/gumroad.js \
        src/app/template-preview/page.js docs/PLAN-NEXT-SESSION.md
git commit  # feat(editor): template picker by layout family + live page gallery
```

(`studio-dark.js` carries `layoutFamily` already; classic/gumroad got 1-line field adds.)

### Step 0b — Task 0 audit (per CLAUDE.md Rule 1)

- Branch `new-version`, working tree clean after the commits above.
- `npm run build` passes (it did at session end — paste output).
- DB dev state: `activeTemplateId=studio-dark`, `systemMode=MANUAL_OPEN`,
  `showResult=true`, user `6610510149` `isVoted=true`. Election dates in dev are in
  the PAST (countdowns show 0 — expected, not a bug).

### Step 0c — append pending P-LOG entries to DECISIONS.md

The last session's self-reflection produced 2 new pitfall entries + 1 knowledge-base
pattern that were output in-chat but NOT appended (user approval pending). Ask the
user, then append:
- P-LOG: Geist is NOT in next/font/google (it's Vercel's `geist` npm pkg) → substituted
  Inter + JetBrains Mono, vars named `--font-studio-sans/-mono`.
- P-LOG: HMR stale after >5-file batch writes = "spinner forever, console clean, curl
  200" + preview serverId desync → recovery: kill port-3000 owner via
  `Get-NetTCPConnection`, `rm -rf .next`, `preview_start`. NEVER `rm .next` while the
  process lives. (Pattern occurred 3× that session — also fingered innocent components
  in "Cannot update HotReload while rendering X" warnings.)
- KB pattern: two-step eval for React interaction tests (click in one preview_eval,
  read DOM in the next — same-eval reads see pre-render DOM).

---

# 🔴 P0 — SECURITY (must be done BEFORE the real election)

## P0-1 ⚠️⚠️⚠️ Admin auth is broken end-to-end (most critical item in this file)

### The flaw, with evidence

1. **`src/utils/auth.js`** — `getEncryptedToken()` runs **in the browser** and builds
   the admin token from `process.env.NEXT_PUBLIC_ADMIN_AUTH_SECRET`. Anything
   `NEXT_PUBLIC_*` is **compiled into the public JS bundle**. Any visitor can read the
   secret + the RSA public key from the bundle, mint a valid `x-admin-token`, and call
   every admin API. The RSA wrapping adds nothing — the secret itself is public.
2. **Server verifiers that trust that scheme** (all use private-key decrypt + compare
   to `ADMIN_AUTH_SECRET`):
   - `src/app/api/admin/candidates/route.js` (CRUD parties/members/images)
   - `src/app/api/admin/config/route.js`
   - `src/app/api/admin/dashboard/route.js` (**includes RESET-ALL-VOTES actions**, ~line 158)
   - `src/app/api/admin/global-config/route.js`
   - `src/app/api/admin/page-layout/route.js` (PUT)
   - `src/app/api/results/route.js` (`checkAdminAuth` → `isAdmin` **bypasses score
     masking during voting**)
   - plus the legacy fallback inside `src/lib/auth/adminCheck.js` (`verifyLegacyAdminToken`)
3. **`src/middleware.js`** — gates `/admin` pages by **cookie existence only**
   (`request.cookies.get('admin_token')?.value` truthy). Any forged cookie value passes.
4. **The good mechanism already exists but is never verified**:
   `src/app/api/admin/login/route.js` does bcrypt (+ bootstrap password) and issues a
   **signed JWT** (`ADMIN_JWT_SECRET`, 2h) in an **httpOnly SameSite=strict cookie**
   `admin_token`. **No code anywhere calls `jwt.verify` on it.**

### Impact
Anyone on the internet can: reset all votes, edit candidates, change system mode,
read live scores during voting, deface every page. For an election this is fatal.

### The fix (use what exists — do NOT invent a new auth system)

**Phase 1 — make the JWT real:**
- New helper `src/lib/auth/verifyAdminJwt.js` (node runtime): read cookie
  `admin_token` → `jwt.verify(token, process.env.ADMIN_JWT_SECRET)` → return payload
  or null. (`jsonwebtoken` is already a dependency.)
- Extend `requireAdmin()` in `src/lib/auth/adminCheck.js`: accept **(a)** NextAuth
  session admin (keep as-is — PSU SSO staff path), **(b)** valid `admin_token` JWT
  cookie. **Delete the `verifyLegacyAdminToken` x-admin-token fallback.**

**Phase 2 — port every admin route to `requireAdmin(request)`:**
- Replace the local `verifyAdminToken`/`checkAdminAuth` copies in the 6 routes listed
  above (results route: `isAdmin = (await requireAdmin(request)).ok`).
- `src/app/api/admin/members/route.js` currently has **NO auth at all** and leaks
  member `studentId`s — add `requireAdmin` (or strip studentId if it must stay public).

**Phase 3 — middleware verifies, not just checks existence:**
- `src/middleware.js` runs on edge runtime → `jsonwebtoken` won't work there. Use
  `jose` (`npm i jose`, tiny, zero-dep): `jwtVerify(token, new TextEncoder().encode(secret))`.
  Invalid/expired → redirect to `/admin/login` + clear cookie.

**Phase 4 — client cleanup (the sweep):**
- Find every call site: `grep -rn "getEncryptedToken\|x-admin-token" src/ --include=*.js`
  (expect: PageDesignTab.js, admin/page.js tabs, results/page.js, possibly more).
- The cookie is sent automatically; most fetches already use `credentials:'include'`.
  Remove the header + the `getEncryptedToken()` import from each call site.
- Delete `src/utils/auth.js` (client token minting) once no imports remain.
- `grep -rn "NEXT_PUBLIC_ADMIN" src/ Dockerfile docker-compose*` → remove
  `NEXT_PUBLIC_ADMIN_AUTH_SECRET` + `NEXT_PUBLIC_ADMIN_PUBLIC_KEY` ARG/ENV from the
  Dockerfile (lines ~28-36) and any compose/env files.

**Phase 5 — rotate, because the old secrets are burned:**
- Rotate `ADMIN_AUTH_SECRET` (now unused — can delete), `ADMIN_JWT_SECRET`,
  `ADMIN_PASSWORD_AUTH_EXTRA`, and the RSA key pair (delete if nothing uses it after
  phase 4). Admin user's `passwordHash` was bootstrap-derived from the old extra
  secret → reset `passwordHash=null` so the new bootstrap password applies.

**Verify (Rule 8 — paste real outputs):**
- `curl -H "x-admin-token: <old-style token>" /api/admin/dashboard` → **401/403**.
- Forged cookie `admin_token=junk` on `/admin` → redirected to login.
- Real login via UI → admin tabs work (candidates list loads, config saves).
- `grep -rn "NEXT_PUBLIC_ADMIN" src/` → **zero hits**.
- PSU-SSO admin session still passes templates API (`requireAdmin` path a).
- `npm run build` passes.

**Watch out:** admin UI does many fetches per tab — miss one header-removal and that
tab 401s. Test EVERY admin tab in the browser after the sweep (ภาพรวม / ตั้งค่าทั่วไป /
จัดการผู้สมัคร / ออกแบบหน้าเว็บ / ตั้งค่าระบบ + เผยแพร่ + dashboard actions).

## P0-2 Vote race condition (TOCTOU) — `src/app/api/vote/route.js`

Lines ~115-134: `isVoted` is checked, THEN a transaction increments. Two concurrent
POSTs both pass the check → double `score` increment / mid-air vote change.
(`/api/results` counts `_count.voters` so final results survive, but the `score`
column + admin dashboard drift, and "1 คน 1 ครั้ง" isn't atomically enforced.)

**Fix — make the guard atomic:**
```js
const res = await db.$transaction(async (tx) => {
  const updated = await tx.user.updateMany({
    where: { id: user.id, isVoted: false },        // ← atomic compare-and-set
    data: { isVoted: true, candidateId: parsedId },
  });
  if (updated.count === 0) return "ALREADY_VOTED";
  await tx.candidate.update({ where: { id: parsedId }, data: { score: { increment: 1 } } });
  return "OK";
});
if (res === "ALREADY_VOTED") return NextResponse.json({ error: "คุณใช้สิทธิ์เลือกตั้งไปแล้ว" }, { status: 403 });
```
**Verify:** fire 5 parallel POSTs (node script, same session cookie) → exactly 1
succeeds, score +1, user.candidateId set once. Paste the script output.

## P0-3 Validate `candidateId` against ballot rules — same file

Currently any existing Candidate id is accepted (e.g. ไม่รับรอง №-1 while multiple
parties are running — CLAUDE.md says -1 is single-party-only).

**Fix:** before the transaction:
```js
const cands = await db.candidate.findMany({ select: { id: true, number: true } });
const target = cands.find(c => c.id === parsedId);
if (!target) return 400;
const realCount = cands.filter(c => c.number > 0).length;
const valid = target.number > 0 || target.number === 0 || (target.number === -1 && realCount === 1);
if (!valid) return NextResponse.json({ error: "ตัวเลือกไม่ถูกต้องสำหรับบัตรเลือกตั้งนี้" }, { status: 400 });
```

## P0-4 `/api/check-status` — identity from session, not query param

`src/app/api/check-status/route.js` is called as `?studentId=...` (see call sites in
success/home pages). **Audit the route first** (Rule 1 — read it; the last session
verified call sites but not the route body). If it trusts the param, anyone can query
anyone's `isVoted`. Fix = `getServerSession(authOptions)` like vote/route.js does and
ignore the param; update call sites (`grep -rn "check-status" src/`) to drop it.

## P0-5 Ops: uploads volume + backups (user said they'll own this — verify it happened)

- `api/admin/candidates/route.js` writes images to `public/images/...` **inside the
  container**; `Dockerfile` has no VOLUME → every redeploy deletes all party/member
  photos. Mount a volume for `public/images/candidates` + `public/images/members`.
- Backup cron: `pg_dump` + the images volume. **Rehearse a restore once** before
  election day. Record both in `docs/MAINTENANCE-RUNBOOK.md`.

## P0-6 Ballot secrecy decision (policy — ASK THE USER, don't decide alone)

`User.candidateId` (schema.prisma:35) stores **who voted for which party**, readable
by any admin/DB access. Options: (a) keep for audit but never expose via API + wipe
(`candidateId=null`) after results are certified; (b) move to a separate `Ballot`
table without user linkage (loses per-user audit); (c) keep as-is, documented.
Present options → user decides → implement.

---

# 🟡 P1 — before go-live (strongly recommended)

1. **Rate limiting** — at minimum on `/api/admin/login` (bcrypt brute force) and
   `/api/vote`. Simplest: nginx `limit_req` in front; or a tiny in-memory limiter
   (Map by IP, sliding window) since it's a single-container deploy.
2. **Admin audit log** — new `AdminAuditLog` model (who/action/payload/timestamp);
   write from every mutating admin route (especially dashboard reset actions).
   Election credibility depends on this trail.
3. **Hardcoded admin studentIds** — `src/lib/auth.js` ~lines 191-194 hardcodes
   `6610510149`/`6610510129` → `setAdmin=true`. Move to env `ADMIN_STUDENT_IDS`
   (comma-separated). These students graduate; the system shouldn't care.
4. **SSO group mapping** — `groups[0]==="staff" → ADMIN` (lib/auth.js ~185). Confirm
   with PSU who controls that group; document in runbook.
5. **Single-party flow live-verify** (deferred gap #1) — now provable two ways:
   `/template-preview?slug=studio-dark&page=vote&variant=single` (mock, already
   verified) + real-DB pass when the TEMP party (`พรรคทดสอบ TEMP`) is deleted during
   go-live prep (P2 checklist in the old plan: real dates, AUTO mode, seed real
   parties, clear scores, showResult=false, full E2E login→vote→success→results).

---

# 🟠 P2 — long-term quality (the 10-year axis)

1. **Smoke tests (~10 cases) — currently ZERO test files.** Critical path only:
   vote API (double-vote, out-of-window, invalid year, invalid candidate), results
   masking when locked, requireAdmin rejects forged tokens. `node --test` +
   `scripts/smoke/*.test.mjs` against dev server is enough; no framework needed.
2. **Migration baseline** — repo uses `prisma db push` (migrations have drift, see
   P-LOG; `migrate deploy` would reset). Generate a baseline
   (`prisma migrate diff --from-empty --to-schema-datamodel … --script > init.sql`),
   document the restore path in the runbook.
3. **Drop or reconcile `Candidate.score`** — results already trust `_count.voters`;
   the denormalized column is a second source of truth that drifts (esp. with P0-2
   pre-fix data). Either remove usages or add a post-close reconcile script.
4. **`useVoteStatus()` hook** — JWT caches `isVoted` at sign-in; every page
   re-fetches `/api/check-status` as a workaround (GumroadHome, StudioDarkHome,
   success…). Consolidate into one hook.
5. **Dead code:** `MonitorTab.js` hardcoded 2024 dates (wire to `resolveElectionDates`
   or delete); commented-out `verifyAdminToken` block at top of vote/route.js.
6. **Per-page `/api/admin/page-layout` fetch** — every public page blocks a
   round-trip on mount for template dispatch. Add `s-maxage=30` cache header or
   resolve server-side in layout and pass via context.
7. **Editor previews for studio-dark inner pages** (deferred gap #3) — PageDesignTab
   previews for candidates/vote/results/party/success still render classic layout.
   The `/template-preview` route from this session already solved the hard part
   (mock-data rendering of real layouts) — the editor preview can likely reuse it.

---

# Working notes for the next session (env quirks — they WILL bite)

| Quirk | Recovery |
|---|---|
| HMR stale after editing >5 files (spinner forever, console clean, curl 200) | Proactively restart dev server after batch writes: kill port-3000 owner (`Get-NetTCPConnection -LocalPort 3000` → Stop-Process), `rm -rf .next`, `preview_start`. NEVER `rm .next` while process lives (→ site-wide 404s) |
| "Cannot update HotReload while rendering X" console errors after hot-editing X | Fast-Refresh residue, NOT a code bug (3 occurrences last session). Clean restart + single load = definitive test |
| `preview_screenshot` timeout | Inject `*{animation:none!important}` + reload first; if it still hangs (e.g. /closed page), verify via DOM evals instead |
| Admin login (never ask the user) | `node scripts/dev-admin-login.js --show` → in-page `fetch('/fms-ovs/api/admin/login', {method:'POST', …})`. NOTE: P0-1 phase 5 rotates the bootstrap secret — re-run `--show` after |
| Student session | /login page → DEV ONLY mock form → fill studentId (e.g. 6610510149) → Mock Login |
| React interaction tests via preview_eval | Click in one eval, read DOM in the NEXT eval (same-eval reads pre-render DOM) |
| `npm run build` | Stop the dev server first (`.next` race, P-LOG-052) |
| prisma generate EPERM (Windows) | preview_stop before `prisma generate` |
| DB schema changes | `prisma db push` (NOT migrate — drift) |

**Definition of done for P0-1 (the big one):** all 6 verify bullets pass with pasted
output + every admin tab manually clicked through + secrets rotated + a commit per
phase (atomic, explicit paths). If any phase exceeds 2× its expected effort, STOP and
report (CLAUDE.md Rule 6).
