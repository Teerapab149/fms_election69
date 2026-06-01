# ROADMAP.md — FMS Election Editor (path to "done")

**Created:** 2026-06-01 · **Branch:** `new-version`
**Source of truth:** VISION.md (4 Pillars + D13 95% no-code), ADR-001 (3-layer),
MASTER_PLAN.md (phases), DECISIONS.md (P-LOG debts), PROGRESS.md (current state).

Definition of "done":
- **MVP-done** = usable for the real election (Feb 2027): all 6 pages truly
  template-driven + enough templates/variants + core no-code controls.
- **Vision-done** = Pillars 1–4 fully realized (gallery thumbnails, slots/drag,
  Phase 4 power features).

Progress estimate (per MASTER_PLAN reconciliation): **~50–55%** of full vision.

---

## ✅ Done (foundation)
- [x] Phase 1/1.5/2 — block system, catalog (47 elements / 16 types), 3-layer arch (ADR-001)
- [x] Pillar 1 — Element Library **slice 1** (browse 47 types + variant swap)
- [x] Pillar 2 — Template Gallery **slice 1** (metadata cards + detail modal)
- [x] Pillar 3 — Tier 1 (TokenEditor) · Tier 2 (ElementVarsPanel + depth: voteCTA/banner/stats) · Tier 3 (custom CSS)
- [x] Pillar 4 — Save as new Template (heritage)
- [x] 4 built-in templates (classic + 3 stubs) · **home page tokenized end-to-end**

---

## 🔴 Remaining — critical path

### 0. Immediate
- [ ] Verify in-browser: the 3 stats cards each select independently in the editor
      (commit `827e2d0`; pending admin login)

### 1. ⭐ Multi-page tokenization (Phase 3.5) — BIGGEST UNBLOCK · **IN PROGRESS**
Only `home` resolves a template today; Tier 1/2/3 only affect home.
- [ ] Thread `resolvedTemplate` into `vote`
- [ ] Thread `resolvedTemplate` into `results`
- [ ] Thread `resolvedTemplate` into `candidates`
- [ ] Thread `resolvedTemplate` into `closed`
- [ ] Thread `resolvedTemplate` into `success`
- [ ] token / element-var / custom-CSS scope (`.fms-app`) emitted on every page
- [ ] verify Tier 1/2/3 edits show on each page (live + editor preview)

### 2. Pillar 3 — complete the 95% no-code surface (VISION D13)
- [ ] Tier 2 depth on more elements (only 3 of ~47 done; loop the banner/stats pattern)
- [ ] Animation presets (fade/slide/scale/glow/pulse + duration/easing)
- [ ] Hover / click effect presets
- [ ] Icon picker (swap Lucide 1000+)
- [ ] Typography completeness (font-family / line-height)
- [ ] Responsive viewport toggle (mobile / tablet / desktop) in editor

### 3. Pillar 1 — Element Library completion
- [ ] slice 2: per-page inventory ("which components does this page use")
- [ ] More variants per element type (VISION target ~25–30 by year 1; 2 multi-variant types today)

### 4. Pillar 2 — Template Gallery completion
- [ ] Page thumbnails (Canva horizontal scroll) — needs off-screen/scaled render pipeline
- [ ] Click an element inside a template to inspect its settings

### 5. Templates honesty
- [ ] modern-dark / playful / minimal are thin colour-override stubs → make each genuinely
      distinct, one at a time

### 6. Slots / drag positioning (large structural)
- [ ] Slot architecture + drag element between slots + free-position within slot
- [ ] Drag element from library → drop into a slot (Pillar 1 endpoint)

### 7. Phase 4 — power features
- [ ] `/party` page editor (8+ sections: hero/vision/mission/policies/gallery/team/members/vote)
- [ ] Component Library (palette to ADD new elements to a page — today only swap/edit)
- [ ] Image Library (upload + crop; Docker volume — D-204)

### 8. Debts / polish (DECISIONS + PROGRESS)
- [ ] voteCTA glow/shine not 100% in editor preview
- [ ] DB-active (non-built-in) template falls back to classic in editor preview
- [ ] Tokenization type-B (config-driven recolor: voteCTA/stats per-state)

---

## 🟣 Beyond "done" (Phase 5/6 — aspirational)
- [ ] Multi-admin permissions · version history / undo · template marketplace (PSU)
- [ ] AI-assisted design ("generate template matching SAMO brand")

---

## Suggested order to MVP-done
**#1 multi-page → #5 one real template → #2 animation/icon presets → #3 library slice 2.**
(#4 thumbnails, #6 slots/drag, #7 Phase 4 = full vision, not blocking real use.)
