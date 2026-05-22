# VISION.md — FMS Election System

**Project:** PSU FMS Election Editor (SAMO 50)
**Document version:** 1.1
**Created:** May 21, 2026 (Day 4)
**Last updated:** May 21, 2026 (timeline added)
**Status:** Living document — update as vision evolves

> **คำเตือนสำหรับ Claude session ใหม่ / Claude Code / Future readers:**
> เอกสารนี้คือ **source of truth** สำหรับ vision ของระบบ
> ถ้าตัดสินใจอะไรขัดกับเอกสารนี้ — ต้อง update เอกสารก่อน หรือยืนยันกับ user ก่อน
> User มีอำนาจสูงสุดในการตีความ vision

---

## 1. Vision Statement (TL;DR)

ระบบเลือกตั้ง SAMO ของคณะวิทยาการจัดการ ม.อ. ที่มาพร้อม **visual editor ระดับ Canva** ที่ทำให้ admin (นักศึกษารุ่นต่อรุ่น) ออกแบบหน้าตาเว็บได้อย่างอิสระและละเอียด โดยไม่ต้องมีความรู้ coding

ระบบจะสะสม design ของแต่ละปีเข้า **template gallery** เป็น **"สมบัติของสโมสรนักศึกษา"** ที่ส่งต่อจากรุ่นสู่รุ่น **อายุการใช้งานเป้าหมาย 10 ปี** โดยไม่ต้อง refactor core

**Primary identity:** Election system (เน้นเลือกตั้งเป็นหลัก)
**Secondary identity:** Visual CMS (editor + gallery + heritage system)
**Future ambition:** Plugin/framework ที่ใช้ได้กับเว็บอื่นๆ (post-graduation, ไม่ใช่ scope ตอนนี้)

---

## 2. Mental Model — Canva for Election Websites

```
Canva (analogy)                →   ระบบนี้ (reality)
─────────────────────────────       ──────────────────────────────
Template gallery               →   Template gallery (in admin panel)
หยิบ template ของคนอื่นมาใช้   →   หยิบ template ปีก่อนๆ มาใช้
ปรับ element ในนั้นได้         →   ปรับ element ในนั้นได้ละเอียด
เซฟเป็น template ใหม่ได้       →   Admin save → ระบบเก็บเป็น template ปีนี้
                                   → รุ่นถัดไปได้ใช้ต่อ
ลาก element ข้าม template      →   Swap element variants ข้าม templates
```

**Generational flow:**

```
ปี 2570:  Admin A สร้าง "Aurora" template → ระบบเก็บเข้า gallery
ปี 2571:  Admin B เห็น Aurora ใน gallery
          → ชอบ button design ของ Aurora → หยิบไปใช้
          → ทำของใหม่ → "Horizon" template → ระบบเก็บ
ปี 2572:  Admin C เห็นทั้ง Aurora + Horizon + built-ins
          → mix elements จาก 3 templates
          → ทำของตัวเอง → "Pulse" template → ระบบเก็บ
...
ปี 2580:  Gallery มี 10+ templates สะสม
          ทุกตัวคือ "ผลงานของรุ่นพี่"
          ระบบยังใช้งานได้ — ไม่ต้อง rewrite
```

---

## 3. 4 Pillars

ระบบประกอบด้วย 4 ส่วนที่ทำงานร่วมกัน:

### Pillar 1: Element Catalog
ห้องสมุดของ "element" ทั้งหมดในระบบ จัดหมวดตาม template + แยกตามหน้า

- ทุก element มี identity (e.g., `voteCTA-button`, `countdown-timer`, `hero-text`)
- ทุก element มี **multiple variants** ข้าม templates
  (e.g., `voteCTA-button` มีแบบ Classic / Modern Dark / Atelier / Editorial / ...)
- Element เป็น **self-contained Lego brick** — เอาไปติดที่ไหนก็ทำงานได้
- Element ต้อง **container-aware** + **responsive by default**

### Pillar 2: Template Gallery
ห้องสมุดของ template ทั้งหมด ทั้ง built-in และที่ admin สร้าง

- Browse แบบ Canva: thumbnails แต่ละหน้าของ template (horizontal scroll)
- คลิก template → ดูแต่ละหน้าละเอียด
- คลิก element ในนั้น → ดู settings ของ element นั้น
- มี metadata: ปีที่สร้าง, ผู้สร้าง, list ของ elements ที่ใช้, preview ของทุกหน้า

### Pillar 3: Mix & Match Editor
Editor ที่ใช้ template เป็นจุดเริ่ม แล้วปรับได้ทุกระดับ

- เลือก template เป็นจุดเริ่ม (built-in หรือจาก gallery ก็ได้)
- แต่ละ element ในหน้า → คลิก → ปุ่ม "เปลี่ยน variant"
- โชว์ variants ทั้งหมดของ element นี้จาก templates อื่น → swap ในจุดนั้น
- ปรับ properties ของ element ได้ 2 tier:
  - **User-friendly settings** (สี / ขนาด / spacing) = default visible
  - **CSS raw** (advanced) = expand only + warning "ห้ามแตะถ้าไม่ใช่ dev"
- Live preview ทันที
- Responsive preview (mobile / tablet / desktop)

### Pillar 4: Save as New Template (Heritage System)
เมื่อ admin ปรับจน "ลงตัว" → กดบันทึก → ระบบเก็บเข้า gallery

- เก็บเป็น **snapshot** (copy ค่าทั้งหมดในเวลานั้น) — ไม่ใช่ reference
- เหตุผล snapshot: ระบบกันการแตกหักย้อนหลัง — ถ้า source template ถูกลบ/แก้ ปีต่อๆ มาที่หยิบไปยังใช้ได้
- Auto-extract: element variants ที่ admin สร้างใหม่ → เพิ่มเข้า Element Catalog ด้วย
- Template ใหม่นี้ = "ผลงานปี" ของ admin คนนั้น เข้า heritage

---

## 4. Terminology Dictionary

User เรียก / Industry term / ความหมาย

| User term (ไทย) | Industry term (EN) | ความหมาย |
|---|---|---|
| **Element** | Element / Component (atomic) | หน่วยเล็กสุดที่ user มอง: 1 ปุ่ม / 1 card / 1 ข้อความใหญ่ |
| **Section** | Section / Region | กลุ่ม elements ที่อยู่ด้วยกัน (e.g., hero section = SAMO 50 text + subtitle + countdown) |
| **Page / Screen** | Page / Screen | ทั้งหน้า (home / vote / results / closed / etc.) |
| **Layout** | Layout / Structure | โครงสร้าง slots ของหน้า (grid system, navigation position) |
| **Theme** | Theme / Design tokens | สี / font / spacing scale ทั้งระบบ |
| **Template** | Template / Design preset | Layout + Theme + Element compositions รวมกัน |
| **Variant** | Variant | Element เดียวกัน คนละ design (e.g., button แบบ funny vs editorial) |
| **Gallery** | Asset library / Gallery | ที่เก็บ templates และ element variants ทั้งหมด |

**คำที่ผม (Claude) จะใช้ในการสื่อสาร:** เลือกตามที่ user ใช้ — ถ้า user เรียก "element" ผมก็เรียก "element"

---

## 5. Key Design Decisions (Confirmed)

### D1: Architecture — per-element inline style (พื้นฐาน)
- ✅ Confirmed Day 4 diagnose phase
- voteCTA pattern เป็น blueprint
- ✅ Not introducing CSS variable architecture (mixed = forbidden)
- หมายเหตุ: เป็นพื้นฐาน — vision 10 ปีอาจต้องขยาย (slot system, etc.)

### D2: Element granularity — Atomic UI components
- ✅ "1 button = 1 element", "1 timer = 1 element", "1 hero text = 1 element"
- ✅ MeetCandidatesCard = 1 element (ทั้งการ์ด — ไม่แตกย่อย)
- ✅ ไม่แยก sub-elements เช่น "button-bg" + "button-text"

### D3: Layout system — Grid-based responsive (compromise)
- ✅ Ideal: Figma/Canva free positioning (acknowledged แต่ยอม compromise)
- ✅ Realistic: Grid-based responsive system
- ✅ Grid ต้อง work ทุก viewport: mobile / tablet / notebook / desktop
- ✅ Admin วาง element ใน slot → ระบบ handle responsive

### D4: Element behavior — Self-contained "Lego brick"
- ✅ Container-aware (ปรับตาม width slot)
- ✅ Snapshot-friendly (config ทั้งหมดใน element เอง)
- ⚠️ **Smart contrast hint** (เพิ่มจาก user clarification):
  - ระบบควรช่วยแนะนำสี text ตาม background (ทึบ ↔ สว่าง)
  - แต่ admin มีอำนาจตัดสินใจสุดท้าย (override ได้)
  - ไม่บังคับ — เป็น hint/suggestion เท่านั้น

### D5: Save model — Snapshot (deep copy)
- ✅ Snapshot at save time, not reference
- ✅ Auto-extract new element variants → Element Catalog
- ✅ ภาคใช้: ระบบ resilient ต่อการลบ/แก้ source template

### D6: Editor UX — Two-tier properties
- ✅ Tier 1 (Simple): สี, ขนาด, spacing — default visible
- ✅ Tier 2 (Advanced): CSS raw — expand + warning
- ✅ ไม่บังคับ admin เลือก tier — แสดง Tier 1 ก่อน, ขยายเข้า Tier 2 ได้

### D7: Compatibility/validation — Grid enforces, admin decides
- ✅ Element ใหม่ที่ swap เข้ามาต้อง fit slot เดิม (ระบบบังคับ)
- ✅ "ทุก element ต้อง adjust กับ space ที่มี" = container query / flex / responsive
- ⚠️ ถ้า element ใหม่ design ไม่เข้ากันกับ theme อื่น (e.g., chunky border ใน editorial) — ปล่อยให้ admin ตัดสิน, อาจมี hint ว่า "design นี้อาจไม่เข้ากับ theme ปัจจุบัน"

### D8: Gallery UX — Horizontal scroll thumbnails + drill-down
- ✅ Template gallery: thumbnails แต่ละหน้า horizontal scroll
- ✅ คลิก template → ดูแต่ละหน้าละเอียด
- ✅ คลิก element → ดู settings + CSS (expand)
- ✅ Element gallery: หมวดหมู่ตาม template + ตามหน้า
- ✅ In-place swap ใน editor (popup แสดง variants)

---

## 6. Implications & Constraints (ที่ vision นี้บังคับ)

### I1: Architecture ต้องแยก 3 layers ชัดเจน
```
Template = Layout (slots) + Theme (tokens) + Elements (compositions)
```
- Layout = where things live (grid)
- Theme = visual tokens (color/font/spacing)
- Elements = filled slots with theme applied

แยกออกจากกัน → swap element ข้าม template ไม่พังกัน

### I2: ทุก element ต้องเป็น "Lego brick"
- Container-aware (responsive ในตัว)
- Theme-independent หรือ theme-aware (รับ theme tokens เข้ามา)
- Self-contained config (snapshot ได้)

### I3: Element ต้อง versionable + portable
- Element variant ของปี 2570 ต้องใช้ได้ในปี 2580
- ห้าม breaking changes ใน element schema (additive only)
- = schema versioning + migration system

### I4: Editor ต้องเป็น 1st-class citizen
- ของเดิม: election system + admin tool
- ของใหม่: election system + **Canva-grade editor**
- = editor UX มีน้ำหนักเท่ากับ election functionality

### I5: Long-term thinking
- ระบบต้องอยู่ 10 ปีโดยไม่ refactor core
- = invest ใน architecture ดี > ship features ไว
- = ทุก design decision ต้อง ask "อันนี้ใช้ได้อีก 10 ปีไหม"

---

## 7. Generational Continuity Goal (10-Year)

### หลักการ
ระบบนี้ไม่ใช่ของ admin คนใดคนหนึ่ง — เป็น **สมบัติของสโมสรนักศึกษาคณะวิทยาการจัดการ**

ทุก template ที่ admin สร้างจะถูกเก็บไว้:
- ปีถัดไปเอามาใช้ต่อได้
- ปีถัดๆ ไปดูเป็น inspiration ได้
- 10 ปีผ่าน — gallery จะเต็มไปด้วยผลงานของรุ่นพี่

### Implications สำหรับ design
- **Database schema** ต้อง forward-compatible (เก่าอ่านได้, ใหม่อ่านได้)
- **Element schema** ต้อง additive (เพิ่มได้, ไม่ลบ)
- **Migration tools** เผื่อ schema เปลี่ยนใหญ่
- **Documentation** สำหรับ admin รุ่นต่อไป (วิธีใช้, วิธีสร้าง template)
- **Self-hosted** (faculty IT มี DB access) — ไม่พึ่ง cloud service ภายนอก

### สิ่งที่ระบบ "ส่งต่อ" จริงๆ
1. Template snapshots (สำเร็จรูป — โหลดมาใช้เลย)
2. Element variants library (ผสมข้าม templates ได้)
3. Design language ของแต่ละปี (สะสม)
4. Code base ที่ใช้งานได้ (ไม่ต้อง rewrite)

---

## 8. Open Questions / Pending Decisions

ส่วนนี้ track สิ่งที่ยังไม่ตัดสินใจ — update เมื่อมีคำตอบ

### OQ1: Layout system technical foundation
- Grid framework: CSS Grid? Tailwind grid? Custom?
- Slot definition: explicit (named slots like Vue) หรือ flexible (drag-to-position)?
- **Status:** Pending — ต้องคิดใน architecture design session

### OQ2: Element variant storage
- เก็บแยกไฟล์ต่อ variant หรือ in-database?
- Built-in variants vs admin-created variants — แยก path?
- **Status:** Pending — ต้องดู scale (กี่ variants ใน 10 ปี?)

### OQ3: Editor performance with deep customization
- เปลี่ยน element → re-render ทั้งหน้า? ใช้ Suspense?
- CSS-in-JS vs inline style vs CSS variables — มี performance trade-off
- **Status:** Pending — ต้อง prototype

### OQ4: Smart contrast hint algorithm
- WCAG contrast ratio check?
- เตือนเฉยๆ หรือเสนอสีแทน?
- **Status:** Pending — D4 acknowledged แต่ implementation ยังไม่ตัดสิน

### OQ5: Heritage versioning — backward compat
- ปี 2580 admin โหลด template ปี 2570 → ระบบทำยังไง?
- Auto-migrate? Show as-is? Locked version?
- **Status:** Pending — สำคัญสำหรับ 10-year goal

### OQ6: Plugin/framework future
- User mention "อยากทำ plugin ใช้กับเว็บอื่น"
- ตอนนี้ scope = election system
- แต่ architecture ควรเตรียมไว้สำหรับ extraction ไหม?
- **Status:** Not active scope — keep in mind for architecture decisions

---

## 9. Out of Scope (ที่ระบบนี้จะ NOT เป็น)

ชัดเจนว่าระบบนี้ **ไม่ใช่**:

- ❌ Generic CMS (Wordpress, Webflow) — แม้จะคล้าย แต่ scope = election
- ❌ Code editor (VS Code-style) — admin ไม่ควรเห็น code (ยกเว้น advanced tier)
- ❌ Multi-tenant SaaS — 1 deployment = 1 faculty
- ❌ Real-time collaborative (Figma-style multi-cursor) — single admin per session
- ❌ Full freeform canvas (Figma-grade) — grid-based slot system แทน
- ❌ AI-generated designs (current scope) — admin design manually

---

## 10. Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-05-21 | 1.0 | Initial vision document created from Day 4 conversation. 4 pillars + 8 design decisions + 6 open questions captured. |
| 2026-05-21 | 1.1 | Added realistic timeline to Appendix B. Confirmed hard deadline = election Feb 2027, soft milestone = mid-June 2026 (semester start). 9-month development arc, 5-phase plan. |

---

## Appendix A: Confirmed Templates Pool (Research)

User ส่งมา 6 templates เป็น research/inspiration (ไม่ใช่ ship ทั้งหมด):

| Template | Identity | Status |
|---|---|---|
| Atelier 50 | Bone paper + cobalt, gallery/museum coded | Research |
| Editorial Narrative | Cream + oxblood serif, magazine-coded | Research |
| Studio Dark | Warm dark + lime, Awwwards-coded | Research |
| Verdure | Moss + cream + terracotta, earth | Research |
| funny (Active Pulse) | Cream + pink/lime, Gumroad-coded | Research |
| dark_design | Purple + magenta + amber, editorial dark | Research |

**Note:** Templates เหล่านี้ช่วย derive ว่า engine ต้องรองรับอะไรบ้าง (layouts, fonts, treatments) — ไม่ใช่ deliverable list

---

## Appendix B: Current State + Timeline

### Current State (as of doc creation)
- **Phase:** Phase 3 Day 4 (paused at Step 4 for vision capture)
- **Latest commit:** 4 commits past `0d1c09f` (page bg + banner + stats sub-cards + stats hero)
- **Working:** voteCTA + CountdownTimer + Day 4 Steps 1-4 done
- **Pending:** MeetCandidatesCard migration, then re-evaluate vs new vision
- **Architecture:** per-element inline style (D1)
- **Element catalog:** 47 instances, 16 types

### Realistic Timeline (confirmed May 21, 2026)

**Hard deadline:** Election day = February 2027 (~9 months out)
**Soft milestone:** v1 production-ready by mid-June 2026 (before user's semester starts)

```
Phase 1 — Before 15 June 2026 (~3 weeks intense):
  Week 1: Day 4 finish + Architecture design
  Week 2: 1 template production-ready + Editor Tier 1
  Week 3: Save/load + polish + buffer

Phase 2 — June-October 2026 (5 months, steady pace):
  Layout slot system, smart contrast, 2-tier editor,
  Template #2, save as new template, variant gallery basic

Phase 3 — November 2026 - January 2027 (3 months):
  Templates #3 + #4, mix & match, heritage gallery,
  multi-admin, documentation, dry runs

Phase 4 — February 2027:
  ELECTION DAY — system in production use

Phase 5 — March-April 2027:
  Post-election polish, final deploy, junior handoff
```

**Total active development:** ~9 months
**Vision completion target:** ~90% by election day, 100% by post-election polish

### Plan Rationale
- User has semester break NOW (mid-June 2026 = start of classes)
- Wants v1 stable before classes (less stress while studying)
- Election is the hard deadline — system must work then
- "ทำเรื่อยๆ" during semester = sustainable, no burnout
- Post-election = handoff-quality polish for juniors

---

## Appendix C: For Future Claude Sessions

ถ้าคุณคือ Claude ที่เพิ่งเริ่ม session ใหม่กับ user คนนี้:

1. **อ่านเอกสารนี้ทั้งหมดก่อน**
2. **อย่าตีความ vision ใหม่** — ถามถ้าไม่แน่ใจ
3. **เคารพ Open Questions** — ห้ามสมมุติคำตอบ
4. **เคารพ Out of Scope** — ห้ามเสนอ feature นอก scope
5. **User เรียก "คุณ"** ไม่ใช่ "พี่" (user request)
6. **User เน้น honest > encouraging** — บอกตรงๆ ถ้ามีกังวล
7. **Workflow:** spec.md + English Claude Code prompt (text inline ใน chat) เสมอ
8. **ทุก step → ใช้ memory จาก DECISIONS.md (P-LOG-001 through P-LOG-016)**

User trusts deeply but expects quality. Earn it through honest, careful work.

---

## END OF VISION DOCUMENT

This is the heart of the project. Treat it with care.

🎯
