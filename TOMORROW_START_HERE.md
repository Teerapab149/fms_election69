# TOMORROW_START_HERE.md — Quick Resume for Monday May 19

**Status:** Plan locked Saturday May 17 night. Sunday optional rest day.
**Today is:** Monday May 19 — Day 1 of execution
**Today's task:** Phase 3 Step 1 — Template System Foundation

---

## ⚡ Quick Start (5 min)

### 1. Open Claude Code in new session, name it:
```
"Phase 3.1 - H-TEMPLATE-MODEL"
```

### 2. First prompt (copy-paste this):

```
Continuing FMS work. Phase 2.6 verified COMPLETE Saturday. Today: 
Phase 3 Step 1 (Template System foundation).

Please read in order:
1. CLAUDE.md (Engineering Discipline)
2. DECISIONS.md (P-LOG-001 through P-LOG-012)  
3. MASTER_ROADMAP_TO_DEPLOY.md (2-week plan, today = Day 1)
4. MASTER_PLAN.md
5. PROGRESS.md
6. PHASE3_TEMPLATE_VISION.md
7. LIVE_STEP_H_TEMPLATE_MODEL.md (today's execution spec)

Critical reminders:
- P-LOG-003: Paste actual grep/build output
- P-LOG-004: Read elementInstances.js BEFORE writing classic.js (extract presets.classic values verbatim)
- P-LOG-005: Don't deviate from spec silently
- P-LOG-009: Verify user-facing before declaring complete (manual API tests required)

Execute Phase 3 Step 1 per the spec. Stop after Task 5 (manual API testing).
Step 2 RESOLUTION is tomorrow's session.

Time budget: 2-3 hours
Risk: LOW (additive, no UI changes)
```

### 3. Watch for these checkpoints:

```
Within first 10 min:
├── Claude Code reads all 7 docs
├── Confirms scope understanding
└── Starts Task 1 (Pre-flight)

Within 30 min:
├── Task 2 (Prisma schema) complete
├── Migration generated
└── Build pass

Within 90 min:
├── Task 3 (Built-in code files) complete  
├── classic.js fully populated (47 elements)
├── 3 stubs created
└── Build pass

Within 2 hours:
├── Task 4 (API endpoints) complete
├── 8 endpoints created
└── Build pass

Within 2.5 hours:
├── Task 5 (Manual API tests) underway
├── curl tests passing
└── Approaching completion

Within 3 hours:
├── Task 6 (Documentation) done
├── Final report
└── Step 1 COMPLETE
```

---

## 🚨 Red Flags — Stop If You See:

```
❌ Prisma migration fails → STOP, diagnose before forcing
❌ classic.js missing elements vs catalog → STOP, P-LOG-009 violation
❌ Build breaks unrelated pages → STOP, rollback before continuing
❌ Auth helper conflicts with existing → STOP, ask user
❌ 90+ min in but Task 2 not done → behind schedule, simplify
```

---

## ✅ Today's Definition of Done

Complete when:
- ✅ Prisma Template model migrated
- ✅ 4 code files exist (classic.js full + 3 stubs)
- ✅ Hybrid loader works
- ✅ 8 API endpoints respond correctly
- ✅ Built-in protection works (403 on edit attempt)
- ✅ Locked protection works
- ✅ Build passes 29/29 pages
- ✅ PROGRESS.md updated
- ✅ MASTER_ROADMAP_TO_DEPLOY.md Day 1 marked ✅

---

## 🎯 Tomorrow's Preview (May 20)

After today's Step 1 — Step 2 RESOLUTION:
- Wire templates into existing config resolution chain
- Fix Phase 2 deferred bug (template apply not working for static elements)
- All 47 elements respond to template changes
- ~1.5-2 hours

---

## 💪 You Got This

Phase 2 (12 P-LOGs ago):
- Multiple false starts
- 3 "Phase Complete" claims
- Major coverage gaps discovered

Phase 3 (Today onward):
- Clear specs
- Lessons learned applied
- Decisions locked
- 2-week timeline doable

**Execute → Verify → Document → Done**

Good luck! 🚀

---

## 📞 If Stuck

1. Check `DIAGNOSE_*` files for similar past issues
2. Read relevant P-LOGs in DECISIONS.md
3. Pause and write a `DIAGNOSE_*` file for current blocker
4. Adjust plan via MASTER_ROADMAP_TO_DEPLOY.md if needed

Remember: Pausing to diagnose ALWAYS saves time vs forcing through.
