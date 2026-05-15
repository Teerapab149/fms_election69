# MASTER_PLAN.md — FMS Election Editor System

## Status as of 2026-05-11

**Project:** PSU FMS Election Editor System (SAMO 50)  
**Current Phase:** Phase 2 — Type-Instance Catalog Refactor  
**Current Step:** Step 1 (PREP) ✅ complete, Step 2 (CORE) ready to execute

## Project Overview

A Next.js-based election system for PSU FMS (Faculty of Management Sciences) 
allowing admins to design and manage student council elections through a 
visual editor. Replaces hardcoded election pages with a flexible, admin-
editable system that preserves historical elections for legacy.

## Architecture Map (CORRECTED Mental Model)

### Pages (7 in application — 6 in editor)

```
USER-FACING PAGES:
├── home          — landing page, hero, stats, voteCTA, meet candidates
├── vote          — voting ballot (uses MultiPartyView OR SinglePartyView component)
├── results       — election results display
├── candidates    — list of all candidate parties
├── party?id=N    — party detail page (hero, vision, mission, policies, 
│                    gallery, team, members, vote section — 8+ sections)
├── closed        — election closed state message
└── success       — vote submission success

ADMIN EDITOR HANDLES: home, vote, results, candidates, closed, success (6 pages)
                     /party page editor → Phase 4

ROUTING LOGIC:
- 2+ parties: candidates → user clicks party → /party?id=N
- 1 party:    candidates → auto-redirect → /party?id=1 (skip selection)
```

### Components (used internally)

```
VOTE PAGE COMPONENTS:
├── MultiPartyView    — renders when 2+ parties (grid + abstain button)
└── SinglePartyView   — renders when 1 party (cinematic, includes disapprove)
                       ⚠️ Used INSIDE /vote, NOT a separate /party page

Both use: vote-party-card, vote-header-*, vote-abstain-button
Single-party only: vote-disapprove-button
Multi-party only: vote-divider-text
```

### Critical Distinction (DO NOT CONFUSE)

```
/party?id=N (independent page) ≠ SinglePartyView (component in /vote)

/party = navigation destination, party detail content (Phase 4 editor)
SinglePartyView = rendering choice within /vote for 1-party scenario
```

## Stack

```
Frontend:  Next.js 14+ (App Router), React 18, Tailwind CSS, Framer Motion
Backend:   Next.js API routes (Node), Prisma ORM
Database:  PostgreSQL (Neon)
Auth:      NextAuth v5 (PSU SSO + mock CredentialsProvider for local)
Deploy:    Vercel (URL: /fms-ovs basePath)
```

## Key Files Reference

```
src/
├── app/
│   ├── (admin)/admin/
│   │   ├── page.js                     — admin dashboard
│   │   └── electionEditor/page.js      — main editor (tabs)
│   ├── home/page.js
│   ├── vote/page.js                    — uses VoteContent
│   ├── results/page.js
│   ├── candidates/page.js
│   ├── party/page.js                   — Phase 4 editor target
│   ├── closed/page.js
│   ├── success/page.js
│   └── api/
│       ├── admin/page-layout/route.js  — pageLayout CRUD
│       ├── auth/[...nextauth]/route.js
│       └── check-status/route.js
│
├── components/
│   ├── HomeContent.js                  — refactored, uses BlockRenderer
│   ├── MultiPartyView.js
│   ├── SinglePartyView.js
│   ├── CandidateCard.js
│   ├── BaseCard.js
│   ├── blocks/
│   │   ├── BlockRenderer.js            — block-based composition (Phase 1)
│   │   ├── HeroBlock.js
│   │   ├── StatsBlock.js
│   │   ├── VoteCTABlock.js
│   │   ├── MeetCandidatesBlock.js
│   │   └── ElectionBannerBlock.js
│   └── admin/
│       ├── PageDesignTab.js            — main editor tab
│       ├── PropertyPanel.js            — element edit sidebar
│       ├── QuickStyleBar.js            — template apply UI
│       └── editor/
│           ├── elementRegistry.js      — TO BE DEPRECATED Phase 2 Step 5
│           ├── statefulRegistry.js     — TO BE DEPRECATED Phase 2 Step 5
│           ├── templateEngine.js       — modified Step 1
│           ├── stateResolver.js        — modified Step 1
│           ├── EditorElement.js        — Wrap component
│           ├── StatefulGallery.js      — stateful element editor
│           ├── HomeEditorPreview.js
│           ├── VoteEditorPreview.js
│           ├── ResultsEditorPreview.js
│           ├── CandidatesEditorPreview.js
│           ├── ClosedEditorPreview.js
│           ├── SuccessEditorPreview.js
│           ├── elementTypes.js         — NEW in Phase 2 Step 2
│           ├── elementInstances.js     — NEW in Phase 2 Step 2
│           └── elementCatalog.js       — NEW in Phase 2 Step 2
│
└── utils/
    ├── pageRegistry.js                 — page + section definitions
    ├── basePath.js                     — getPath() helper
    └── ELECTION_CONFIG.js              — date constants
```

## Phase Roadmap

### ✅ Phase 1: LEGO Block System (Complete, ~2026-04-14)

- DB schema: pageLayout + themeConfig JSON in SystemConfig
- API: /api/admin/page-layout GET/PUT
- Block components system with BlockRenderer
- HomeContent refactored to fetch + render via blocks
- FALLBACK_BLOCKS safety net

### ✅ Phase 1.5: Admin Editor MVP (Complete)

- 6 admin editor pages with click-to-edit Wrap pattern
- PropertyPanel with controls per element type
- Stateful element gallery (countdown + voteCTA)
- Template apply system (classic + neon for stateful, 4 presets for static)
- Bidirectional sync (hero-title ↔ globalConfig.electionName)
- All EditorPreview components match production exactly
- Click-lock + success page redirect bypass fix
- 4 P-LOG entries from lessons learned

### ✅ Phase 2: Type-Instance Catalog Refactor (COMPLETE 2026-05-16)

**Goal:** Unify elementRegistry + statefulRegistry + EXTRA_ELEMENTS_SCHEMA 
into a single type-instance catalog system.

**Result:** Successfully unified 3 fragmented registries into a single catalog. 36 element instances + 16 semantic types. 7 consumer files migrated. 4 orphan `results-*` Wraps + `vote-divider-text` registered. Stateful presets normalized to null. Template-missing-element fallback bug fixed.

```
Step 1: H-CATALOG-PREP        ✅ DONE
Step 2: H-CATALOG-CORE        ✅ DONE
Step 3: H-CATALOG-WIRE        ✅ DONE
Step 4: H-TEMPLATE-EXTEND     ⏭️ SKIPPED (Phase 3 will rewrite templates)
Step 5: H-CATALOG-CLEANUP     ✅ DONE
```

**Active files (single source of truth):**
- `src/components/admin/editor/elementCatalog.js` — public API
- `src/components/admin/editor/elementTypes.js` — 16 semantic types
- `src/components/admin/editor/elementInstances.js` — 36 instances

**Deleted files:**
- `src/components/admin/editor/elementRegistry.js`
- `src/components/admin/editor/statefulRegistry.js`

**Known bugs deferred to Phase 3:**
- Template apply incomplete (only countdown + voteCTA respond visually; static elements have preset data but apply logic is incomplete)
- StatefulGallery mini-template buttons not clickable (pre-existing Phase 1.5 issue)

Phase 3 Canva-style template system will replace both subsystems and fix these as side effects. See `PHASE3_TEMPLATE_VISION.md`.

**Specs executed:**
- `DIAGNOSE_PHASE2_START.md` + `DIAGNOSE_PHASE2_DEEP.md` — diagnoses
- `PHASE2_ARCHITECTURE.md` — design document
- `LIVE_STEP_H_CATALOG_PREP.md` — Step 1
- `LIVE_STEP_H_CATALOG_CORE.md` — Step 2
- `LIVE_STEP_H_CATALOG_WIRE.md` — Step 3
- `LIVE_STEP_H_CATALOG_CLEANUP.md` — Step 5

### ⏳ Phase 3: Canva-Style Template System (DOCUMENTED, NOT BUILT)

**Vision:** Templates = complete design specifications for ALL pages and 
ALL elements (Canva analogy). Admin browses gallery, applies template, 
edits any element at CSS level, saves as new template.

**Key documents:**
- `PHASE3_TEMPLATE_VISION.md` — full vision spec

**Estimated steps:**
- H-TEMPLATE-MODEL (DB + API)
- H-TEMPLATE-RESOLUTION (6-layer chain)
- H-TEMPLATE-DEFAULTS (4 built-in templates)
- H-TEMPLATE-EDITOR-TIERS (Simple/Advanced/Expert)
- H-TEMPLATE-GALLERY-UI (browse + apply)
- H-TEMPLATE-SAVE-API (save/fork/lock)
- H-TEMPLATE-LAYOUT (drag-drop, optional)

**Total estimate:** ~10-12 hours

### ⏳ Phase 4: Advanced Features (NOT DETAILED)

**Scope:**
- `/party?id=N` page editor (8+ sections — hero, vision, mission, policies, 
  gallery, team, members, vote)
- Component Library (palette to add elements to pages)
- Image Library (user uploads + crops)
- Mobile-first design tools
- Drag-and-drop element positioning

Will be planned after Phase 3 complete.

## Critical Conventions

### Code Style
- All URLs via `getPath()` helper (basePath /fms-ovs)
- Primary color: #8A2680
- Accent color: #9333EA
- Background: #F8F9FD
- Thai language UI, English code comments

### Constants
- ELECTION_YEAR_TH = "2569" (Thai BE for academic year)
- ELECTION_CALENDAR = "2027" (Gregorian for election event)
- SAMO 50 (election #50)
- Candidate.number: -1 disapprove (single-party only), 0 abstain, >0 real party
- Multi-party: NO disapprove option
- Single-party: HAS disapprove option

### Auth & Mocking
- Mock admin tokens: 6610510149, 6610510129
- CredentialsProvider with try-catch wrapping DB calls
- DB errors must NOT redirect to /api/auth/error

### Element Patterns
- Hard locks in vote components (NEVER violate):
  - All regularParties must render
  - Abstain always shows
  - No disapprove in multi-party
- Click-to-edit via `<Wrap id="element-id">` pattern
- Stateful elements use stateResolver + templateEngine
- Bound elements (hero-title → electionName) use globalConfig

## Engineering Discipline (MANDATORY)

Per pitfall lessons (DECISIONS.md P-LOG section):

### P-LOG-001: Verify Before Adding
Before adding Wraps to a component, grep existing Wraps. Don't assume 
elements aren't already wrapped.

### P-LOG-002: No Raw Production Pages in Editor
Production pages with useEffect router redirects MUST NOT be rendered raw 
in admin editor. Use static EditorPreview component or editorMode prop guard.

### P-LOG-003: Grep Verification Mandatory
Multi-file specs MUST end with grep verification commands. Actual command 
output MUST be pasted in report. Claims of "verified ✓" without proof are 
unacceptable.

### P-LOG-004: Read Source Before Writing EditorPreview
Before writing any *EditorPreview component, read the FULL production page 
source and list every visual element. No generic placeholders.

### Process Rules
- Read CLAUDE.md → Engineering Discipline before any spec
- Read DECISIONS.md → P-LOG-001 to P-LOG-N before any work
- Verify build PASS before claiming step complete
- Use grep verification with pasted output (not "✓" claims)
- 1 session = 1 step (per session-awareness recommendation)

## Persistent Files (across sessions)

```
PROJECT ROOT:
├── CLAUDE.md                     — project-specific rules (read first)
├── DECISIONS.md                  — accumulated decisions + P-LOGs
├── MASTER_PLAN.md                — THIS FILE
├── PROGRESS.md                   — current step state (when in progress)
├── PHASE2_ARCHITECTURE.md        — Phase 2 design
├── PHASE3_TEMPLATE_VISION.md     — Phase 3 design (Canva-style)
├── DIAGNOSE_PHASE2_DEEP.md       — diagnosis findings
└── LIVE_STEP_H_*.md              — current step spec being executed

USER HOME (.claude/skills/):
├── self-reflection/              — auto-extract lessons learned
├── session-awareness/            — token + health monitoring
└── [other project skills]
```

## Resume Protocol (New Session)

```
1. Open new session named: "[Phase] [Step] - [Brief]"
   Example: "Phase 2 Step 2 - CORE create catalog"

2. First prompt:
   "Continuing FMS election editor work. Please read in order:
    - CLAUDE.md (with Engineering Discipline section)
    - DECISIONS.md (especially P-LOG-001 through P-LOG-N)
    - MASTER_PLAN.md
    - PROGRESS.md (if exists)
    - Current spec: [LIVE_STEP_*.md]
    
    Current task: [Step ID and brief description]"

3. Claude Code reads files, confirms understanding, executes step.

4. Before pause/stop:
   "Save state to PROGRESS.md. We need to pause."
   Or:
   "Run self-reflection skill, extract P-LOGs, update DECISIONS.md."
```

## Token Budget Awareness

```
Average step token usage:
- Simple step (PREP, CLEANUP):    10-15% of context
- Medium step (CORE creation):    25-35%
- Complex step (WIRE atomic):     30-40%
- Reading specs at session start: 5-10%

Recommended session pattern:
- Step 1 session: PREP (low risk, can combine with planning)
- Step 2 session: CORE only (medium risk, needs focus)
- Step 3 session: WIRE only (high risk, needs maximum freshness)
- Step 4 session: TEMPLATE-EXTEND (low risk, can combine)
- Step 5 session: CLEANUP (low risk)

If session-awareness skill detects degradation → checkpoint immediately.
```

## Stakeholder Communication

**พี่อนุวัฒน์ (project owner):**
- Status updates after each phase completion
- Demo before any architectural pivot
- Approval needed for: database schema changes, auth changes, 
  /party page UX (Phase 4)

**Self (development):**
- Decisions logged in DECISIONS.md
- Lessons logged as P-LOG entries
- Visions captured in PHASE_*_VISION.md before token exhaustion

## Current State Summary (for next session)

```
✅ Phase 1 + Phase 1.5: COMPLETE
✅ Phase 2: COMPLETE — catalog system active (36 instances + 16 types)

🔵 NEXT DECISION POINT:
   Option A — Phase 3: Canva-style template system (per PHASE3_TEMPLATE_VISION.md)
              ~10-12 hours focused work; fixes Phase 2 deferred bugs as side effects
   Option B — UX polish: patch template apply + StatefulGallery clickability
              ~3-5 hours; may be redundant if doing Phase 3 anyway
   Option C — Phase 4: /party page editor (8+ sections)
              ~15-20 hours; Component Library + Image Library included

Recommendation: Option A (Phase 3) — highest ROI per session and resolves
known Phase 2 deferred bugs in the process.
```

## Project Progress (Visual)

```
Phase 1   [████████████████] 100% COMPLETE
Phase 1.5 [████████████████] 100% COMPLETE  
Phase 2   [████████████████] 100% COMPLETE ✨
Phase 3   [██░░░░░░░░░░░░░░]  10% DESIGNED (vision documented)
Phase 4   [░░░░░░░░░░░░░░░░]   0% NOT STARTED

Overall: ~40-45% complete (factoring all phases)
```

## Vision Beyond Phase 3 (For Context)

```
Phase 4: Power User Features
  /party page editor (8+ sections)
  Component Library (drag elements to pages)
  Image Library (uploads + crops)
  Mobile-first design mode

Phase 5: Collaboration & Sharing
  Multi-admin permissions
  Template marketplace within PSU
  Real-time co-editing
  Version history / undo

Phase 6: AI-Assisted Design (Aspirational)
  "Generate template matching SAMO 50 brand"
  Auto-layout suggestions
  Content suggestions
```

End of MASTER_PLAN.md
