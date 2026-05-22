# MASTER_ROADMAP_TO_DEPLOY.md — 2-Week Plan to June Deploy

**Created:** 2026-05-17 (Saturday night planning session)
**Deploy target:** Early June 2026 (June 1-8)
**Total budget:** ~24 sessions over 14 days
**Owner:** Teerapab Boonsri

---

## 📌 Single Source of Truth

This document is THE plan. Update only when:
- Day completes (mark ✅)
- Day slips (mark 🟡 reschedule)
- Scope adjusts (DECISION required)

DO NOT silently deviate. Per P-LOG-005.

---

## 🎯 Mission

Ship Canva-style election website editor by early June 2026.

**Project:** PSU FMS Election Editor for SAMO 50  
**Deploy environment:** Self-hosted server (faculty IT)  
**Maintenance:** Ship-and-forget (no active maintenance post-deploy)  
**User base:** Student admin team (1 active at a time, typically art/tech lead)

---

## 🚦 Status Tracker (Live)

```
Phase 2.6   ████████████████ 100% ✅
Phase 3.1   ████████████████ 100% ✅ (Day 1 — MODEL, May 19)
Phase 3.2   ████████████████ 100% ✅ (Day 2A+2B — RESOLUTION+APPLY+auth bridge, May 20)
Phase 3.3   ░░░░░░░░░░░░░░░░   0% ⏳ Day 3 NEXT (DEFAULTS)
Phase 3.4   ░░░░░░░░░░░░░░░░   0%
Phase 3.5   ░░░░░░░░░░░░░░░░   0%
Phase 3.6   ░░░░░░░░░░░░░░░░   0%
Phase 4 Roles ░░░░░░░░░░░░░░ 0%
Phase 5 Activity ░░░░░░░░░░  0%
Phase 6 Polish ░░░░░░░░░░░  0%
Phase 7 Deploy ░░░░░░░░░░░  0%

Overall: 55% → target 100% by June 1-8
```

### Schedule Tracker

```
✅ Day 1 (Mon May 19) — H-TEMPLATE-MODEL (foundation)
✅ Day 2A (Tue May 20 AM) — H-TEMPLATE-RESOLUTION (SSR bridge)
✅ Day 2B (Tue May 20 PM) — H-TEMPLATE-APPLY (apply flow + auth bridge)
⏳ Day 3 (Wed May 21) — H-TEMPLATE-DEFAULTS (data enrichment) — NEXT
⏳ Day 4 (Thu May 22) — EDITOR TIERS
⏳ Day 5 (Fri May 23) — GALLERY UI polish
⏳ Day 6 (Sat May 24) — SAVE + ACTIVITY
⏳ Sun May 25 — Buffer + Week 1 review
```

Status: On track — Phase 3 50% done (3 of 6 steps). Auth bridge fix (P-LOG-016)
landed unplanned but unblocks all admin template ops. Foundation solid for Day 3.

---

## 📅 Week 1 — Templates (May 19-25)

### Goal
Phase 3 complete: Canva-style template system working end-to-end.

### Daily Sessions

#### **Monday May 19 — Phase 3 Step 1**
**Spec:** `LIVE_STEP_H_TEMPLATE_MODEL.md`  
**Estimated:** 2-3 hours

**Tasks:**
1. Prisma schema (Template model + activeTemplateId)
2. Migration script
3. Built-in template code files (classic FULL + 3 stubs)
4. Template loader (hybrid code + DB)
5. 8 API endpoints (CRUD + lock/fork/apply)
6. Manual API tests via curl
7. Documentation update

**Success criteria:**
- ✅ Migration applies cleanly
- ✅ `getTemplate("classic")` returns from code
- ✅ POST /api/admin/templates creates DB entry
- ✅ Build pass 29/29 pages
- ✅ No UI regression

**Status:** ✅ Complete (commit `921fca8`)  
**Actual:** ~3 hours  
**Notes:** Template loader (hybrid code + DB), 4 built-in code files, full CRUD + lock/fork/apply endpoints. See PROGRESS.md Phase 3 Day 1 section.

---

#### **Tuesday May 20 — Phase 3 Step 2: RESOLUTION**
**Spec:** Create tomorrow morning  
**Estimated:** 1.5-2 hours

**Tasks:**
1. Extend resolution chain to 6 layers:
   - type.baseConfig → instance.defaultConfig → template.elements[id] → userOverride → cssOverride → runtime
2. Update `templateEngine.resolveStatefulConfig` to use templates
3. Update `templateEngine.resolveConfig` for non-stateful elements
4. Backward compat: fallback to `instance.presets` if no template active
5. Verify template apply actually works visually

**Success criteria:**
- ✅ Apply "Modern Dark" → countdown changes (was working)
- ✅ Apply "Modern Dark" → hero-title changes (was NOT working — Phase 2 bug)
- ✅ All 47 elements respond to template change
- ✅ "Reset to template default" works

**Status:** ✅ Complete (Day 2A: `0e1ea8a` + `248912e`; Day 2B: `f0a29ca` + `43358ee`)  
**Actual:** ~6 hours across 2A + 2B (vs 1.5-2h estimate — slipped due to voteCTA visual regression + auth bridge discovery)  
**Notes:** Day split into 2A (SSR resolution + voteCTA preserve via Option C gate) and 2B (apply flow verify + x-admin-token auth bridge in requireAdmin). All 4 templates apply end-to-end, DB activeTemplateId updates, browser-verified. voteCTA visual still uses legacy fallback (deferred to Day 3 DEFAULTS). See P-LOG-013..016 in DECISIONS.md.  
**Critical:** Phase 2 deferred template apply bug — RESOLVED for non-voteCTA elements; voteCTA closes on Day 3

---

#### **Wednesday May 21 — Phase 3 Step 3: DEFAULTS**
**Estimated:** 2-3 hours

**Tasks:**
1. Read all current `instance.presets.classic` → populate `classic.js` if not done
2. Build `modern-dark.js` full coverage (47 elements)
3. Stub `playful.js` properly (~20 elements, key visuals)
4. Stub `minimal.js` properly (~20 elements)
5. Manual verify in browser: apply each → see distinct visual changes

**Success criteria:**
- ✅ 4 templates produce 4 visually different designs
- ✅ Switching between templates is smooth
- ✅ All 6 pages affected by template change

**Status:** ⏳ Pending

---

#### **Thursday May 22 — Phase 3 Step 4: EDITOR TIERS**
**Estimated:** 2 hours

**Tasks:**
1. Property panel tier system:
   - **Simple:** text, color, visible (current capability)
   - **Advanced:** + spacing, shadow, border, font weight
2. Reorganize PropertyPanel sections (collapsible)
3. Add "Reset to template default" button per field
4. SKIP "Expert" tier (raw CSS) — too risky for tight timeline

**Success criteria:**
- ✅ PropertyPanel shows Simple/Advanced toggle
- ✅ Advanced reveals more fields
- ✅ Reset button restores template default

**Status:** ⏳ Pending  
**Note:** Skip Expert tier to save 1-2 hours

---

#### **Friday May 23 — Phase 3 Step 5: GALLERY UI**
**Estimated:** 2-3 hours

**Tasks:**
1. Template Gallery page/modal
2. Cards display: color swatch + name + description
3. "Apply" button per card
4. "Currently active" indicator
5. Filter: built-in vs my templates
6. Confirmation dialog before apply ("This will replace current design")

**Success criteria:**
- ✅ Admin opens gallery → sees 4 built-ins + saved custom
- ✅ Click "Apply" → preview updates immediately
- ✅ Active template highlighted

**Status:** ⏳ Pending  
**Visual reference:** PHASE3_TEMPLATE_VISION.md mockup

---

#### **Saturday May 24 — Phase 3 Step 6: SAVE + ACTIVITY**
**Estimated:** 2-3 hours

**Tasks:**
1. "Save as new template" UI in gallery
2. Form: slug, name, description
3. Save current pageLayout + theme → new template entry
4. "Fork" existing template (copy + rename)
5. Templates list shows lineage (forkedFrom)
6. BONUS: Initial activity log structure (table + log on template create)

**Success criteria:**
- ✅ Admin can save current design as new template
- ✅ Can fork existing
- ✅ Activity logged in DB

**Status:** ⏳ Pending

---

#### **Sunday May 25 — BUFFER + Week 1 Review**
**Estimated:** 1-2 hours (or rest if on track)

**Buffer use cases:**
- Catch up if any day slipped
- Bug fixes from week 1 testing
- Browser test all template features
- Update PROGRESS.md + MASTER_PLAN.md

**Critical decision point:**
- Are templates working end-to-end? ✅/❌
- If ❌: Cut Week 2 scope (skip activity log polish)
- If ✅: Proceed Week 2 as planned

**Status:** ⏳ Pending

---

## 📅 Week 2 — Multi-Admin + Polish + Deploy (May 26 - June 1)

### Goal
Multi-admin working, STAFF role exists, polished UI, deployed.

### Daily Sessions

#### **Monday May 26 — Phase 4: Multi-Admin Foundation**
**Estimated:** 2 hours

**Tasks:**
1. Prisma schema: UserRole enum (USER, ADMIN, STAFF)
2. User.role field added (default USER)
3. Migration with backfill (existing admins → ADMIN)
4. Update auth helper:
   - `requireAdmin()` → allow ADMIN + STAFF
   - `requireStaff()` → allow STAFF only
5. Test: 2 admin accounts can both login + edit

**Success criteria:**
- ✅ 3 roles exist in DB
- ✅ Existing admin still works
- ✅ Can manually set USER → ADMIN via DB
- ✅ Auth check passes for both ADMIN and STAFF

**Status:** ⏳ Pending

---

#### **Tuesday May 27 — STAFF Role Setup**
**Estimated:** 2 hours

**Tasks:**
1. Update `prisma/seed.js`:
   ```javascript
   const STAFF_IDS = process.env.STAFF_STUDENT_IDS?.split(',') || [];
   for (const id of STAFF_IDS) {
     await prisma.user.upsert({
       where: { studentId: id },
       update: { role: 'STAFF' },
       create: { studentId: id, role: 'STAFF', /* ... */ }
     });
   }
   ```
2. Add `STAFF_STUDENT_IDS` to `.env.example` with documentation
3. Update README/docs with staff seeding procedure
4. UI: STAFF badge differentiation (e.g., gold color)
5. STAFF-only view: read-mostly dashboard (Phase 5 audit log if time)

**Success criteria:**
- ✅ Seed sets STAFF role from env variable
- ✅ Redeploy preserves STAFF assignments (env file)
- ✅ UI shows STAFF badge correctly
- ✅ Documentation clear for faculty handover

**Status:** ⏳ Pending

---

#### **Wednesday May 28 — Phase 5: Activity Log**
**Estimated:** 2-3 hours

**Tasks:**
1. ActivityLog model:
   ```prisma
   model ActivityLog {
     id          String   @id @default(uuid())
     timestamp   DateTime @default(now())
     userId      String
     action      String   // "template.created", "element.edited", etc.
     entityType  String   // "template", "element"
     entityId    String
     metadata    Json?    // additional context
     @@index([timestamp])
     @@index([userId])
   }
   ```
2. Log on each significant action:
   - Template create/edit/delete/fork/apply/lock
   - Element edit (significant changes)
3. Activity viewer page (admin/staff accessible)
4. Filter by user, date, action type
5. Show: who, when, what, optional reason

**Success criteria:**
- ✅ All admin actions logged
- ✅ Activity viewer works
- ✅ Staff can audit
- ✅ Performance OK (indexed properly)

**Status:** ⏳ Pending  
**Note:** Can defer to post-deploy if behind schedule

---

#### **Thursday May 29 — Phase 6.1: Polish (Loading + Errors)**
**Estimated:** 2 hours

**Tasks:**
1. Loading states for:
   - Template gallery loading
   - Template apply (spinner)
   - Save template (button disabled)
   - API requests in flight
2. Error boundaries:
   - PageDesignTab wrap in ErrorBoundary
   - PropertyPanel wrap in ErrorBoundary
   - Template gallery wrap in ErrorBoundary
3. Toast notification system:
   - Success: "Template applied"
   - Error: "Save failed: {reason}"
4. Empty states: "No saved templates yet"

**Success criteria:**
- ✅ No blank screens on any operation
- ✅ Errors caught gracefully (no full crashes)
- ✅ User always knows what's happening

**Status:** ⏳ Pending

---

#### **Friday May 30 — Phase 6.2: Polish (Mobile + Edge Cases)**
**Estimated:** 2-3 hours

**Tasks:**
1. Mobile responsive check (basic):
   - Production pages render OK on phone
   - Admin editor — desktop-only (acknowledge in UI)
2. Edge case testing:
   - Apply template with 0 saved → works
   - Fork template that's locked → error message
   - Delete active template → error message
   - Login expiry mid-edit → redirect to login
3. Browser compatibility:
   - Chrome ✅ (primary)
   - Safari (basic test)
   - Firefox (basic test)
4. Performance check:
   - Template apply < 1 second
   - Gallery loads < 2 seconds

**Success criteria:**
- ✅ Phone users can vote (production pages OK)
- ✅ Edge cases don't crash
- ✅ Major browsers work

**Status:** ⏳ Pending

---

#### **Saturday May 31 — Phase 7.1: Documentation**
**Estimated:** 2-3 hours

**Tasks:**
1. **ADMIN_GUIDE.md** — for student admins:
   - How to login
   - How to apply template
   - How to customize
   - How to save custom template
   - Common troubleshooting
2. **STAFF_GUIDE.md** — for faculty staff:
   - Role assignment procedure
   - STAFF_STUDENT_IDS env config
   - Database backup procedure
   - Emergency admin reset
3. **DEPLOYMENT_GUIDE.md** — for IT staff:
   - Server requirements
   - Environment variables
   - Migration steps
   - Health check endpoints
4. **HANDOFF.md** — overall project context for future devs:
   - Architecture overview
   - Key files map
   - Common modifications
   - Known limitations
5. Screenshots for visual guides

**Success criteria:**
- ✅ 4 documents covering all stakeholders
- ✅ Screenshots illustrate key flows
- ✅ Anyone reading can use the system

**Status:** ⏳ Pending

---

#### **Sunday June 1 — Phase 7.2: Pre-Deploy Testing + Demo Prep**
**Estimated:** 2-3 hours

**Tasks:**
1. Full E2E test scenarios:
   - User: vote successfully
   - Admin: create template, apply, vote → results appear
   - Admin: edit element, save, refresh, persists
   - Staff: login, view activity, no edit needed
2. Demo script for พี่อนุวัฒน์:
   - Live walkthrough of features
   - Anticipate questions
3. Pre-deploy checklist:
   - All env variables documented
   - Migration scripts ready
   - Seed data prepared (or skip if faculty handles)
   - Build production: `npm run build` clean
4. Backup current local DB

**Success criteria:**
- ✅ All scenarios pass
- ✅ Demo confident
- ✅ Ready for server upload

**Status:** ⏳ Pending

---

## 📅 Buffer Week (June 2-8) — IF NEEDED

If anything slips, deploy here instead of June 1.

### Possible activities:
- Bug fixes from demo feedback
- Last-minute documentation updates
- Final polish based on user testing
- Actual server deployment

**Hard deadline:** June 8, 2026 (3 weeks from May 18)

---

## 🚨 Risk Register

```
Risk 1: Phase 3 Step 2 (Resolution) more complex than estimated
├── Likelihood: Medium
├── Impact: Push Week 1 by 1 day
└── Mitigation: Sunday buffer day in Week 1

Risk 2: Multi-admin role system has auth edge cases
├── Likelihood: Medium
├── Impact: Push Week 2 by 1-2 days
└── Mitigation: Keep simple, can defer some UI features

Risk 3: Mobile responsive issues discovered late
├── Likelihood: High
├── Impact: 2-3 hours fixes
└── Mitigation: Already in Week 2 Friday plan

Risk 4: Deploy environment surprises (server config)
├── Likelihood: High (first time deploying)
├── Impact: Push to Week 3 (June 2-8 buffer)
└── Mitigation: Coordinate with faculty IT early

Risk 5: User finds critical bug in demo
├── Likelihood: Medium
├── Impact: Cannot deploy until fixed
└── Mitigation: Week 3 buffer for fixes
```

---

## 🎯 Cuts If Behind Schedule

In order of cut priority (most expendable first):

```
Cut 1: Activity log viewer UI (keep just logging)
       Saves: 1 hour
       Loss: Manual DB query needed for audit

Cut 2: Expert PropertyPanel tier
       Already cut

Cut 3: Multiple template apply confirmation polish
       Saves: 30 min
       Loss: Less hand-holding UX

Cut 4: Forkedfrom lineage display
       Saves: 30 min
       Loss: Users can't see template family tree

Cut 5: Toast notifications system
       Saves: 1-2 hours
       Loss: Use simple alert() instead

Cut 6: Browser compat testing (Firefox/Safari)
       Saves: 1 hour
       Loss: May break in non-Chrome browsers

Cut 7: Mobile responsive checking
       Saves: 2 hours
       Loss: Production pages may look bad on phone
       (But: most students vote on desktop anyway?)

HARD FLOOR (do not cut):
- Template system working
- Multi-admin login
- STAFF role
- Basic polish
- Documentation
- Build clean
```

---

## 📊 Daily Check-In Template

At end of each session:

```
Date: ___
Day Plan: ___
Hours Spent: ___ (estimate vs actual)
Completed: ___
Blocked: ___
Tomorrow: ___
Mood: 🟢🟡🔴
Notes: ___
```

Update PROGRESS.md daily.

---

## 🚦 Decision Triggers

### Re-evaluate plan IF:
- 2+ days behind by end of Week 1 → cut Activity log
- 4+ days behind by end of Week 1 → defer Multi-admin to post-deploy
- Critical bug found post-deploy testing → push deploy to Week 3

### Stop and ask IF:
- Phase 3 Step 2 (Resolution) takes >3 hours → architectural rethink
- Cannot get auth working with 3 roles → simplify to 2
- Server deployment hits unknown blocker → consult faculty IT

---

## 🌟 Definition of "Ship Ready"

Cannot ship unless ALL:
- ✅ All 6 admin tabs work (verified Phase 2.6)
- ✅ Template gallery + apply works
- ✅ Can save custom templates
- ✅ Multi-admin login OK
- ✅ STAFF role configured
- ✅ Build passes 29/29 pages
- ✅ No crash on critical user flows
- ✅ Documentation complete
- ✅ Production page accessible (vote, results)

NICE-TO-HAVE for ship (can deploy without):
- 🟡 Activity log viewer
- 🟡 All 4 templates fully designed
- 🟡 Mobile responsive perfect
- 🟡 All toast notifications

---

## 📚 Reference Documents

Read for context on any day:

1. `CLAUDE.md` — engineering discipline (always)
2. `DECISIONS.md` — P-LOG-001 to 012 (always)
3. `MASTER_PLAN.md` — high-level project plan
4. `PROGRESS.md` — current state checkpoint
5. `PHASE3_TEMPLATE_VISION.md` — template architecture
6. `PHASE5_ROLE_SYSTEM_VISION.md` — future role context (not implementing)
7. `LIVE_STEP_H_TEMPLATE_MODEL.md` — Phase 3.1 spec (Monday)
8. This document — DAILY check

---

## ✅ Today's Status (May 17, Saturday night)

- Phase 2.6 verified COMPLETE (47 regions clickable)
- Phase 3 architecture decisions locked
- Plan documented (this file)
- Ready to start Monday May 19

**Tonight:** REST 🌙  
**Tomorrow (Sunday):** Optional light review of `LIVE_STEP_H_TEMPLATE_MODEL.md`  
**Monday May 19:** Phase 3 Step 1 execution

---

## 💪 Encouragement

This is achievable:
- 11 working sessions in Week 1
- 12 working sessions in Week 2
- Ship by June 1 (with June 2-8 safety buffer)

Phase 2 took 12 days with many false starts.  
Phase 3 will be faster — we have:
- Clear specs
- 12 P-LOGs of lessons learned
- Stable foundation (catalog working)
- Decisions locked

You've got this. 🚀

---

## End of Master Roadmap

This is the plan. Stick to it. Update when reality differs.
See you Monday.
