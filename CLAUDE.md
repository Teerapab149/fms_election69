# CLAUDE.md — FMS Online Voting System (SAMO 49)

## Project Overview
ระบบเลือกตั้งออนไลน์ คณะกรรมการบริหารสโมสรนักศึกษา คณะวิทยาการจัดการ มหาวิทยาลัยสงขลานครินทร์ (FMS PSU)
ใช้งานจริงในการเลือกตั้งประจำปีการศึกษา 2569 (SAMO 49)

## Tech Stack
- **Framework:** Next.js (App Router) with React
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js (PSU SSO OAuth — OpenID Connect)
- **Styling:** Tailwind CSS (utility-first, NO separate CSS files per component)
- **Animation:** Framer Motion (`motion`, `useSpring`, `useMotionValue`, `AnimatePresence`)
- **Charts:** Recharts (`BarChart`, `PieChart`, `ResponsiveContainer`)
- **Icons:** Lucide React
- **Deployment:** Docker with subpath `/fms-ovs`

## Directory Structure
```
src/
├── app/
│   ├── page.js                    # Home (SSR → HomeContent)
│   ├── admin/
│   │   ├── login/page.js          # Admin login (RSA-encrypted token)
│   │   └── page.js                # Admin console (tabs: overview, candidates, settings)
│   ├── candidates/page.js         # Party listing page
│   ├── party/page.js              # Single party detail (cinematic design)
│   ├── results/page.js            # Vote results + demographics
│   ├── vote/page.js               # Voting page
│   └── api/
│       ├── admin/
│       │   ├── candidates/route.js   # CRUD candidates + members
│       │   ├── dashboard/route.js    # Admin dashboard stats + actions
│       │   └── readiness/route.js    # ADM-1 ตรวจความพร้อมระบบ (read-only)
│       ├── check-status/route.js     # Election status check
│       ├── home-info/route.js        # Home page data (SSR)
│       ├── party/route.js            # Public party data
│       ├── results/route.js          # Vote results
│       └── vote/route.js             # Submit vote
├── components/
│   ├── HomeContent.js             # ⭐ Main home page (hardcoded sections — refactor target)
│   ├── Navbar.js                  # Public navigation bar
│   ├── CountdownTimer.js          # Election countdown with phase detection
│   ├── MeetCandidatesCard.js      # CTA card linking to candidates
│   ├── ResultCard.js              # Individual candidate result display
│   ├── DynamicListEditor.js       # Reusable drag list editor (reorder + edit items)
│   ├── EditCandidateModal.js      # Admin: edit party info modal
│   ├── EditCandidateMemberModal.js # Admin: edit member modal
│   ├── SmartImage.js              # Next/Image wrapper with fallback
│   ├── Providers.js               # SessionProvider wrapper
│   └── vote/
│       ├── LiquidMeshHeroBackground.js  # Animated blob background
│       ├── LiquidHero.js               # Party page hero with member photos
│       ├── CinematicNavbar.js           # Floating capsule navbar for party pages
│       └── AutoIntro.js                # Cinematic intro animation
├── hooks/
│   └── useVoteSystem.js           # Vote logic hook
├── utils/
│   ├── basePath.js                # ⚠️ CRITICAL: getPath() — ALL internal URLs must use this
│   ├── electionConfig.js          # Election dates + year constants
│   ├── auth.js                    # RSA encryption for admin token
│   └── PartyTheme.js             # Party-specific color themes
├── lib/
│   ├── db.js                      # Prisma client singleton
│   └── auth.js                    # NextAuth config (PSU SSO + DB sync)
prisma/
├── schema.prisma                  # Database schema
├── seed.js                        # Seed data (parties, members, mock voters)
└── migrations/                    # Migration history
```

## Database Schema (Key Models)
```prisma
model User {
  id, studentId (unique), name, email, facultyId, departmentId
  role ("student" | "ADMIN"), year, major, gender
  isVoted (Boolean), isFormCompleted (Boolean), isAdmin (Boolean), votedAt?
  // ⚠️ v2-SEC (2026-07-16): User.candidateId REMOVED — no voter→choice link exists.
  // The choice lives only in the anonymous encrypted Ballot table (see below).
}

model Candidate {
  id, name (unique), number (unique), slogan?, logoUrl?, color?
  groupImageUrls (Json?), officialImageUrl?, mobileHeroImage (Json?)
  logoMeaning?, missions (Json?), policies (Json?)
  members → Member[], score (Int)   // score = the tally; no `voters` relation (v2-SEC)
}

model Member {
  id, studentId (unique), name, number, imageUrl, modalImageUrl?
  major?, position?, candidateId → Candidate   // Member↔Candidate FK still exists
}

// v2-SEC — anonymous, encrypted, tamper-evident ballot box (LOCKED "B+")
model Ballot {
  seq (PK), payload (RSA-OAEP ciphertext of {c: candidateId, n: nonce})
  hourBucket? (coarse), prevHash, rowHash (HMAC chain — no userId, no fine time)
}
model ChainHead { id (always 1), head (default "GENESIS"), seq }  // chain tip

model SystemConfig {
  id (always 1), isVoteOpen (legacy — no longer gates after ADM-3), showResult
  systemMode ("AUTO"|"MANUAL_OPEN"|"PAUSE"|"ENDED"), googleFormUrl?
  globalConfig (Json — dates/meta/ballotsAnonymized flag), activeTemplateId?, updatedAt
}
```

## Critical Conventions — MUST FOLLOW

### 1. Base Path
**ทุก URL ภายในต้องผ่าน `getPath()`** — ห้ามใช้ path ตรงๆ
```js
import { getPath } from "../utils/basePath";
// ✅ getPath("/api/vote")  → "/fms-ovs/api/vote"
// ✅ getPath("/images/logo.png")  → "/fms-ovs/images/logo.png"
// ❌ "/api/vote" (จะพังใน Docker deployment)
```

### 2. Admin Authentication (P0-1 security fix, 2026-06-10)
Admin identity = httpOnly cookie `admin_token` (signed JWT จาก `/api/admin/login`)
ส่งอัตโนมัติทุก same-origin request — ฝั่ง client แค่ใส่ `credentials: 'include'`:
```js
fetch(getPath("/api/admin/..."), { credentials: 'include' });
```
ฝั่ง server ทุก admin route ต้องเรียก `adminGuard(request)` (หรือ `requireAdmin`)
จาก `src/lib/auth/adminCheck.js` — **ทางเข้าทางเดียวคือ cookie `admin_token`**
session ของ PSU SSO ไม่ให้สิทธิ์อะไรเลย (ของเดิมเคยให้ แล้วถูกถอดออก) และทุก request
อ่านธง `isAdmin` จาก DB ใหม่เสมอ ถอดสิทธิ์แล้วมีผลกับคลิกถัดไปทันที
ส่วนการรับรองผลต้องเป็น `role === "STAFF"` เพิ่มอีกชั้น — บัญชีเจ้าหน้าที่จาก
`scripts/admin.js --create-staff` เท่านั้น กรรมการสโมฯ กดไม่ได้.
⛔ ห้ามนำ pattern เก่ากลับมา: `getEncryptedToken()` / header `x-admin-token` /
`NEXT_PUBLIC_ADMIN_*` ถูกลบแล้ว (P0-1) เพราะ secret ฝังใน client bundle → ใครก็ forge ได้.

### 3. Design System Colors
- **Primary:** `#8A2680` (deep purple — FMS brand)
- **Primary Gradient:** `from-[#8A2680] to-[#601A59]`
- **Accent:** `#9333EA` (lighter purple for hover)
- **Background:** `#F8F9FD` or `bg-gray-50`
- **Card bg:** `bg-white` with `border border-gray-100 rounded-xl shadow-sm`
- **เมื่อ component เป็นของเฉพาะ Party:** ใช้ theme จาก `PartyTheme.js`

### 4. Component Patterns
- ใช้ `"use client"` directive เสมอสำหรับ client components
- ใช้ `Framer Motion` สำหรับ animation (ไม่ใช้ CSS animation โดยตรง ยกเว้น keyframes ง่ายๆ)
- ใช้ `Lucide React` สำหรับ icons
- Modal pattern: `{showModal && <ModalComponent onClose={() => setShowModal(false)} />}`
- Loading state: `<Loader2 className="animate-spin" />` จาก lucide-react

### 5. Responsive Design
- Mobile-first approach
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- Admin Panel: sidebar ซ่อนบน mobile (`hidden md:flex`)
- Public pages: full responsive ทุกหน้า

### 6. API Route Patterns
- GET routes ดึงข้อมูลปกติ ไม่ต้อง auth (public data)
- Admin routes ต้อง `verifyAdminToken(request)` ก่อนทำอะไร
- ใช้ `db` จาก `../../lib/db` (Prisma singleton)
- Response format: `NextResponse.json({ ... })`
- Error format: `NextResponse.json({ error: "message" }, { status: 500 })`

### 7. Election System Modes
```
AUTO         → ใช้เวลาจาก electionConfig.js ตัดสิน
MANUAL_OPEN  → เปิดรับโหวตแบบ force (ไม่สนเวลา)
PAUSE        → หยุดชั่วคราว (maintenance)
ENDED        → ปิดอย่างเป็นทางการ
```

## Current Home Page Sections (HomeContent.js)
เรียงลำดับปัจจุบัน (hardcoded):
1. **Navbar** — Navigation bar
2. **Hero Section** — SAMO 49 title + countdown + election status badge
3. **MeetCandidatesCard** — CTA ไปหน้า candidates
4. **Stats Panel** — จำนวนผู้ใช้สิทธิ์ (real-time) + percentage + total eligible
5. **Election Banner Image** — ภาพโปรโมท "เลือกตั้ง"
6. **Vote/Login CTA Button** — Dynamic button ตาม election status + login state
7. **Footer** — Copyright

## Existing Reusable Patterns
- `DynamicListEditor.js` — มี drag-and-drop reorder อยู่แล้ว (ArrowUp/ArrowDown + edit inline) ใช้เป็น reference ได้
- `SystemConfig` model — เก็บ config แบบ single-row (id=1) + Json fields รองรับอยู่แล้ว
- Admin tab system — เพิ่ม tab ใหม่ได้ง่าย (array `menuItems` ใน `admin/page.js`)

## File Naming
- Components: PascalCase (`HomeContent.js`, `ResultCard.js`)
- Utils/hooks: camelCase (`basePath.js`, `useVoteSystem.js`)
- API routes: `route.js` ใน folder structure
- Images: stored in `public/images/` organized by type

## Environment Variables
```
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_SECRET       # NextAuth encryption key
NEXT_PUBLIC_BASE_PATH # Subpath for deployment (default: /fms-ovs)
ADMIN_PRIVATE_KEY     # RSA private key for admin auth
ADMIN_AUTH_SECRET     # Secret for admin token validation
```

## Important Notes
- `Candidate.number = 0` → งดออกเสียง (No Vote)
- `Candidate.number = -1` → ไม่รับรอง (Disapprove) — ใช้เฉพาะเมื่อมีพรรคเดียว
- `Candidate.number > 0` → พรรคจริง
- Valid voter years: `['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4']` เท่านั้น
- Score ใน DB คือ actual vote count (increment on vote)
- Election dates ตั้งค่าใน `utils/electionConfig.js` ไม่ได้อยู่ใน DB

## ⚠️ Engineering Discipline

Read DECISIONS.md → Pitfall Log section before starting any new spec.

Rules enforced from past pitfalls:
1. (P-LOG-001) Before adding EditorElement Wraps to a wrapper component, grep target child component for existing Wraps with same IDs to avoid duplicates.
2. (P-LOG-002) Never render production pages with auth/redirect logic raw in admin editor — use static EditorPreview component or editorMode prop guard.
3. (P-LOG-003) Multi-file specs MUST end with grep verification commands; actual command output MUST be pasted in the report.
4. (P-LOG-004) Before writing any EditorPreview component, read the full production page source and list every visual element. No generic placeholders.

After completing any meaningful work, invoke the self-reflection skill to consolidate lessons.

---

## Engineering Discipline — Patterns That Have Broken Specs

This section accumulates lessons across sessions so that future Claude
Code instances can catch issues before they cause cost. Every entry
came from a real session failure documented in DECISIONS.md (P-LOG-NNN).

The spec writer (Claude.ai in a separate session) cannot see live code.
Specs are written from memory + project snapshots which may be stale.
Your job is to verify before acting, not to silently work around
discrepancies.

---

### Rule 1 — Pre-flight audit is mandatory, not ceremony

Every spec must have Task 0 that verifies:
- Branch + HEAD commit hash match spec expectation
- Working tree clean (or only `.next/` + `.claude/` dirty)
- Files referenced in spec actually exist with structure spec assumes
- State variables (states, configs, etc.) match spec's count and names

**If anything diverges:** STOP, paste evidence, ask. Do not proceed
on spec assumption that's already been falsified.

**Real example (Day 9a):** spec said "7 states", reality has 6
(registry.js:84, elementInstances.js:311-318, stateResolver.js:28-37
all agreed). Caught in Task 0. The right move was to flag it, not
silently rename the seventh state.

---

### Rule 2 — Spec writer's memory is unreliable

The Claude.ai writing specs is working from:
- Project knowledge that may be stale
- Patterns inferred from prior sessions
- DECISIONS.md, docs/MASTER-DESIGN-PLAN.md (these are authoritative)

The spec writer **cannot** verify:
- Exact prop shapes of components they reference
- Whether `@/` alias works (it doesn't here — P-LOG-032)
- Whether helpers exist at the path they imagine
- The current count or names of states/variants/fields
- Whether `node -e require(...)` works for the file type
  (Node ESM rejects .jsx — P-LOG-039)

**Treat every "the spec says X, this file should have Y" as a
hypothesis, not fact.** Verify in Task 0 + Part 1 audit.

---

### Rule 3 — No silent workarounds

When the spec says X but reality is Y:

- ❌ Do NOT silently write Y instead
- ❌ Do NOT silently write "modified X"
- ❌ Do NOT try increasingly creative fixes around the assumption
- ✅ Pause, paste evidence of the discrepancy, ask user

**Exception:** typos/path-fix that are obviously the spec writer's
intent (e.g., `.js` extension when file is `.jsx`). Note inline in
report and continue.

**Real example (Day 9b):** spec said use
`var(--btn-shadow, '5px 5px 0 #000')` for chunky-stamp.
Reality: `--btn-shadow` resolves to default variant's soft purple
drop-shadow, breaking the stamp identity. Right call: hardcode the
stamp shadow in variant component, document as P-LOG-045
"Layer 2 vars are the default variant's tokens". Wrong call would
have been to silently ship a non-stamp chunky-stamp.

---

### Rule 4 — Byte-faithful gates are hard

When spec says "byte-faithful with Day N":
- Visual must match precisely (computed CSS values identical to baseline)
- Any drift → STOP, do not commit, iterate
- "Close enough" or "imperceptible" is not acceptable for these gates
- Document any deviation explicitly in report (e.g., Day 6 minimal
  banner #fff → #f9fafb alignment was documented + accepted)

This applies especially to:
- Baseline extractions (1:1 moves like Day 9a default.jsx)
- Refactors that should be invisible (Day 6 token propagation)
- "Day N+1 must match Day N" assertions

---

### Rule 5 — Atomic commits, explicit staging

- Never `git add -A` or `git add .` — too broad
- Never `git commit -a` — same reason
- Always `git add <explicit paths>` then `git status` to verify
- Each commit = one logical change
- Failed step → revert that step, don't accumulate WIP into next commit

**Real example (Day 4):** the `*.md` rule confusion came from
mixing `git add -f` with unstaged `.gitignore` change. Cleanup
required 3 commits over a session because the cross-contamination
made bisection painful.

---

### Rule 6 — Time exceeds 2× budget → STOP

Specs come with time budgets. If a single part exceeds 2× its
estimated budget:
- STOP
- Commit WIP (with explicit `[WIP]` prefix in message)
- Report what's blocking + current state
- Ask, don't push past

**Why:** the spec writer estimates from optimistic assumptions.
Hitting 2× means an assumption broke. Continuing without flagging
silently accumulates risk and the user can't help if they don't know.

---

### Rule 7 — Known environment quirks (this repo)

These were learned the hard way. Always assume they apply:

| Quirk | Recovery |
|---|---|
| No `@/` path alias (no jsconfig) | Use relative imports `../foo` |
| Node ESM cannot parse `.jsx` | Test pure-JS portions separately, verify JSX behavior in browser |
| `.next` manifest race on Windows | `preview_stop` + `rm -rf .next` + `preview_start` + sleep 15-20s. Happens ~6×/session under sustained HMR + DB switches |
| `.specs/` is gitignored | Save spec files there; they don't need to commit |
| `*.md` rule removed from .gitignore | Plain `git add` works for new .md files — no `-f` needed (P-LOG-021) |
| `STATE_RESOLVERS.voteCTA` for state mapping | Single source of truth at `src/utils/stateResolver.js` (or similar — verify in Task 0) |

---

### Rule 8 — Verification reports must paste actual outputs

Per P-LOG-003:
- ❌ "Build passes" — not enough
- ✅ Paste the actual `npm run build` summary
- ❌ "Visual looks correct" — not enough
- ✅ Paste DOM root + computed CSS (or screenshot evidence)
- ❌ "All tests pass" — not enough
- ✅ Paste sanity check output verbatim

The user audits these reports. Summaries don't allow audit; raw
outputs do.

---

### Rule 9 — Variant identity ≠ Layer 2 vars

Architectural insight from Day 9b. This is subtle but important.

The Layer 2 vars declared on `[data-element="X"]` in a template are
the **default variant's identity** — they describe what default
looks like in that template.

When implementing a NEW variant (minimal-pill, chunky-stamp, etc.):
- Variant-specific identity (color, shadow, border style that
  defines the variant) should be **hardcoded in the variant
  component's PRIMARY_STYLES** (or equivalent)
- Layer 2 vars are still used for **shared properties** that work
  across variants: sizing, padding, font size, font weight, radius
- Do NOT use `var(--btn-shadow)` if the variant needs a specific
  shadow that differs from default — hardcode instead

**Example pattern (chunky-stamp):**
```js
const PRIMARY_STYLES = {
  notVoted: {
    // Variant identity — hardcoded
    borderColor: '#000000',
    borderWidth: '3px',
    boxShadow: '5px 5px 0 #000000',
    fontWeight: '800',
    textTransform: 'uppercase',

    // Shared properties — Layer 2 vars
    paddingLeft: 'var(--btn-padding-x)',
    fontSize: 'var(--btn-font-size)',
    backgroundColor: 'var(--btn-bg, var(--color-primary))',  // OK to inherit
    color: 'var(--btn-text, var(--color-surface))',          // OK to inherit
    borderRadius: stateConfig.borderRadius || 'var(--btn-radius)',
  }
}
```

This rule may evolve in Day 10+ if variant-namespaced vars are
introduced (Option C from Day 9b discussion). Until then: hardcode
identity, share infrastructure.

---

### Rule 10 — When to push back on the spec

The spec writer is not infallible. You should push back when:
- Spec contradicts source code reality (audit revealed mismatch)
- Spec's verification commands are wrong (e.g., grep regex too broad)
- Spec's time budget is unrealistic given audit findings
- Spec's architectural rule contradicts docs/MASTER-DESIGN-PLAN.md or DECISIONS.md
- Spec asks for behavior change in something marked "preserve"

Push back format:
1. Quote the spec sentence
2. Show evidence of the conflict
3. Propose 2-3 alternative approaches
4. Wait for user decision

Do NOT push back as "I disagree" alone — show the receipt.

---

### Rule 11 — Document P-LOG entries inline when you find them

If during a session you discover something worth a P-LOG entry:
- Note it in your part report ("Surprises" section)
- Propose the P-LOG number + 1-line description
- The closeout commit appends to DECISIONS.md

This prevents lessons from being lost between sessions. Every P-LOG
is a future spec's failure prevented.

---

### Self-audit prompt — run this at session end

Before final push, audit your own session:

```
Reading my own commits:
1. Did I follow Rule 1 (Task 0 audit)?
2. Did I follow Rule 3 (no silent workarounds)?
3. Did I follow Rule 5 (atomic commits)?
4. Are my reports per Rule 8 (raw outputs, not summaries)?
5. What surprised me? Did I document as P-LOG?
6. Did I rush any byte-faithful gate (Rule 4)?

If any "no" answer → flag in final report, don't hide.
```

---

### Where to find context for next session

| Need | File |
|---|---|
| Project overview / onboarding | README.md |
| System state + pre-deploy checklist | docs/TEMPLATE-SYSTEM-STATE.md, docs/DEPLOY-CHECKLIST-2026.md |
| Design plan + owner taste + tickets | docs/MASTER-DESIGN-PLAN.md |
| Accumulated lessons | DECISIONS.md (P-LOG-001..NNN) |
| Current state | PROGRESS.md |
| Engineering discipline (this) | CLAUDE.md |
| Past session specs | .specs/ (gitignored, may not exist on fresh clone) |

> Historical planning docs (VISION.md, ADR-001, PHASE*/PLAN-*/HANDOFF-* of closed
> arcs) were removed from the tree 2026-07-19 (owner order: keep only living docs)
> — recover any of them from git history before that date if ever needed.

Always read in this order at session start. The spec is downstream
of these.

---

### Closing note

This section grows over time. Every entry is paid for by a real
session cost (token, time, frustration). Treat the rules as cheap
defense against expensive failures — running a 30-second audit
beats 30 minutes of post-hoc debugging.

When in doubt: pause, ask, don't guess.
