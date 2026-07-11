# PLAN — Blossom "Candy Editorial" → 10/10 (Awwwards-grade ทั้ง flow)

> สำหรับ session หน้า อ่านไฟล์นี้ → CLAUDE.md (Engineering Discipline) → memory
> `blossom-claude-design-link` ตามลำดับ · Branch `new-version`
> Workflow บังคับ: **Fable = advisor/reviewer เท่านั้น · Opus 4.8 subagent = worker ทุกงาน execution**
> (brief ต้องมี Task-0 audit + raw outputs + ห้าม commit จนรีวิวผ่าน + ห้ามหยุด dev server :3000)

## ⏰ Automation (ตั้งไว้ 2026-07-11 กลางคืน — เจ้าของนอน)
- Scheduled task `blossom-autorun-0230` (2026-07-12 02:30 +07): P2 micro-craft ~3-5 ticket เล็ก
- Scheduled task `blossom-autorun-0800` (2026-07-12 08:00 +07): ปิด P2 ที่ค้าง → P3 ~2 ticket ใหญ่
  (T3.1 /candidates → T3.4 /success+/closed; หน้า vote T3.2/T3.3 รอเจ้าของคุม)
- เจ้าของอนุมัติล่วงหน้า: commit atomic ต่อ ticket หลัง verify ผ่าน + push ได้เลย
- **งบต่อ session (วัดจากของจริง):** งานเล็ก 3-5 ticket หรือ งานใหญ่ ~2 ticket แล้ว token หมด —
  อย่าเริ่ม ticket ใหม่ถ้าเหลือไม่พอทั้ง implement+verify+commit; ปิดรอบด้วย plan+memory+push เสมอ

## สถานะ commit (อัปเดต 2026-07-11 กลางคืน)
- ✅ P1 ทั้งหมด push แล้ว: `57d2c4b` token plumbing · `a3c574b` home redesign + 4 themes ·
  `be55013` docs + P-LOG-078/079
- ✅ P1.5 ปุ่ม hero → anchor scroll (แนวทาง A, เจ้าของอนุมัติ): `7e524a7`
- ✅ P1.6 footer classic single-line + fix countdown colon มือถือ: `e195ee6` · gitignore
  claude skill/: `1835349`
- ➡️ ถัดไป: P2 (เริ่มที่ T2.1)

## Feedback เจ้าของ 2026-07-11 (หลังดูของจริง)
- ✅ **ถูกใจ Blossom โดยรวม** — ทิศทาง Candy Editorial ผ่าน ไม่ต้องรื้อ concept
- ❌ **ปุ่ม "ดูผู้สมัคร" ซ้ำซ้อน** — hero มี `bl-cta2` "ดูผู้สมัคร →" (BlossomHome.js:354)
  แล้ว section ถัดมา (โปสเตอร์+copy "รู้จักผู้สมัครของคุณหรือยัง") มี `bl-go`
  "ดูผู้สมัครทั้งหมด" (BlossomHome.js:376) อีกอัน — ห่างกันแค่ scroll เดียว → แก้ใน P1.5
- 🎯 สั่งลุยต่อจนถึง 10/10 ตามแผนนี้

## สถานะ ณ 2026-07-11 (จบ session Claude Design → v2-C → 3 รอบ polish)

ทำแล้ว (⚠️ **ทั้งหมดยัง UNCOMMITTED** อยู่ใน working tree):
- `src/components/home/BlossomHome.js` — Candy Editorial เต็มหน้า: org-first headline
  (hollow สโมสรนักศึกษา / solid คณะ+accent, split config-safe ที่ "คณะ"), แหวน textPath 300px
  ทับ headline, โปสเตอร์แบบ pinned (กรอบขาว+เทป ไม่ crop), figures ไร้การ์ด + turnout bar,
  **countdown = แถบหมึกเข้ม full-bleed (climax)**, entrance choreography CSS-only,
  count-up on scroll, navbar full-bleed sticky + user chip 3 สถานะ + burger/sheet,
  ตกแต่งเรขาคณิตล้วน (ห้าม icon/ดอกไม้ — กติกา taste ถาวร)
- Token: `onPrimary` slot ใน blossomPalettes → BlossomTheme → injectTemplateTheme
  (แก้ contrast CTA ธีมมินต์/บัตเตอร์)
- Mockup ต้นทาง: `.specs/blossom-home-v2-c.html` · Claude Design project "Blossom Home
  Redesign Brief" (2f43689c-...) + design system project มี `blossom/` bundle
- P-LOG ค้างลง DECISIONS.md ตอน commit (เลขต่อจาก 076): backtick ในคอมเมนต์ภายใน
  styled-jsx template literal = ปิด string ทั้งไฟล์พัง · `.bl-root a{}` ต้องใช้ `:where()`
  ไม่งั้น specificity ชนะทุก link class

## นิยาม 10/10 (สามเสา)
1. **Craft** — ทุก pixel มีเหตุผล: image treatment, จังหวะ motion, รายละเอียด hover
2. **Motion ตอบ scroll** — หน้าเล่าเรื่องตามการเลื่อน ไม่ใช่แค่ตอนโหลด
3. **Coherence ทั้ง flow** — home หน้าเดียวไม่พอ ทั้ง journey (home→login→vote→success→results)
   ต้องพูดภาษา Candy Editorial เดียวกัน ← **ช่องว่างใหญ่สุดตอนนี้**

---

## P1 — ปิดงานค้าง (ทำก่อนทุกอย่าง, ~30 นาที)
- [ ] Verify ritual ที่ค้าง: authed user chip (mock session ผ่าน scripts/dev-admin-login.js
      หรือ playground onSignIn), editor chooser slideshow
- [ ] **Commit แยกก้อน** (atomic, explicit paths):
      (1) token onPrimary 3 ไฟล์ · (2) BlossomHome.js redesign · (3) docs + DECISIONS.md
      (P-LOG ใหม่ 2 ข้อ ด้านบน) — ลงท้าย Co-Authored-By ตามกติกา
- Acceptance: build ไม่ต้องรัน (dev server ห้ามหยุด) แต่ compile log สะอาด + push

## P1.5 — แก้ปุ่ม "ดูผู้สมัคร" ซ้ำ (feedback เจ้าของ, commit แยกต่อจาก P1)
ปัญหา: hero `bl-cta2` (BlossomHome.js:354) กับ feature `bl-go` (BlossomHome.js:376)
พาไป `/candidates` ทั้งคู่ ห่างกัน 1 scroll (navbar มีลิงก์ "ผู้สมัคร" อีกทาง = 3 ทางรวม)

**แนวทางแนะนำ (A):** เปลี่ยน `bl-cta2` จากลิงก์ `/candidates` เป็น **anchor scroll
ลงไป section รู้จักผู้สมัคร** — label ประมาณ "รู้จักผู้สมัคร ↓" (smooth scroll,
`scroll-behavior` CSS หรือ scrollIntoView; ปิดใต้ reduced-motion ให้ jump ปกติ)
- เหตุผล: คง balance 2 ปุ่มใน hero (เอาออกเฉย ๆ hero จะโล่งข้างเดียว), หน้าได้
  narrative "เลื่อนลงมาอ่านก่อนค่อยไป" ตรงเสา Motion-ตอบ-scroll พอดี, ปุ่มพาออกหน้า
  เหลือจุดเดียวคือ `bl-go` ใน section ที่มี context ครบ
- editorMode: anchor ต้องไม่ scroll ใน editor preview (guard แบบเดียวกับ href เดิม)
- **Fallback (B) ถ้า owner ไม่ชอบ A:** ตัด `bl-cta2` ทิ้ง เหลือ CTA หลักเดี่ยว
  แล้วขยับ daterow/subline ให้ hero ยังแน่น — ทำ mock ให้ดูก่อนตัดจริง
- Acceptance: 4 ธีม + 390px + hero ทุกสถานะ CTA (ก่อนเปิด/เปิด/โหวตแล้ว/ปิด/pause
  ผ่าน template-preview interact) ไม่มี layout shift; commit แยก 1 ก้อน

## P2 — Home micro-craft ✅ DONE ทั้ง 5 (commit `0488db1`, 2026-07-11 ดึก)
- [x] **T2.1 Digit roll** — per-char cells + glyph-keyed remount, no layout shift, stroke inherits
- [x] **T2.2 Poster treatment** — duotone ผ่าน overlay --bl-primary mix-blend color, hover เผยสีจริง,
      touch ได้ tint อ่อนแบบ always-on
- [x] **T2.3 Scroll parallax** — CSS scroll-driven (@supports gated), base state visible เสมอ
- [x] **T2.4 CTA physics** — magnetic-lite rAF (hover+fine pointer เท่านั้น, ปิดใน editor/reduce)
      + nav underline slide
- [x] **T2.5 จูน texture** — dot-grid 15%/24px, crop marks 45%
- ⚠️ **หนี้ verify ค้าง:** browser pane ของเครื่อง dev บังคับ prefers-reduced-motion:reduce +
  screenshot ค้าง → motion สด (digit roll ticking จริง / parallax / magnetic) verify ได้แค่
  CSSOM+computed — ต้องรอบ visual กับเจ้าของบนเครื่องปกติ + ตั้งวันเลือกตั้งอนาคตชั่วคราว
  เพื่อเห็น countdown เดินสด

## P3 — Inner pages ภาษา Blossom (ยกจาก 9 → 10, งานใหญ่สุด, ~2-3 sessions)
ตอนนี้หน้า inner ใช้ classic layout + Layer-1 token จาก builtIn/blossom.js — ใช้งานได้
แต่ไม่ใช่ Candy Editorial. ทำทีละหน้า (ลำดับตาม journey ผู้ใช้):
- [x] **T3.1 /candidates** ✅ DONE 2026-07-12 เช้ามืด — BlossomCandidates.js (editorial index:
      hollow "ผู้สมัคร" + count numeral + party index rows + empty state), dispatch isBlossom
      ใน candidates/page.js (recipe เดียวกับ verdure), preview wiring interact+static,
      BlossomTopBar → export + active prop; hover = row tint 7% (advisor ยอมรับ deviation
      จาก underline — ชื่อพรรคไทย 2 บรรทัด clamp ทำ underline ดูพัง); verify 4 ธีม/390px/
      classic untouched ผ่าน; P-LOG-080 (frozen-transition artifact) ลง DECISIONS แล้ว
- [x] **T3.2 /vote multi** ✅ DONE 2026-07-12 (`441e02f`, owner คุมสด) — BlossomVote
      (ballot moment: hollow "เลือกพรรค" + voter receipt + ballot index rows เลือกได้
      selected = ink border + diamond เรขาคณิต; งดออกเสียง คง semantic ส้ม #ea580c
      ไม่ทาสี candy; confirm bar fixed → เปิด shared VoteConfirmationModal ที่ parent
      ไม่แตะ modal — อ่านโทน candy เองผ่าน PageThemeOverrides); dispatch guard
      `isBlossom && !isSingleParty` (single ตกไป classic จนกว่า T3.3); disapprove
      ไม่ render ใน multi ตาม convention MultiPartyView; preview wiring interact
      (selection → popup → success) + static; verify flow เต็ม + 4 slug + 390px
      (logo พับ, bar ซ้อนแนวตั้ง) + siblings/live untouched; P-LOG-082 (rAF ×2
      หลัง programmatic click ก่อนอ่าน computed) ลง DECISIONS
- [ ] **T3.3 /vote single (booth)** — cinematic เวอร์ชัน candy
- [x] **T3.4 /success + /closed** ✅ DONE 2026-07-12 (`a05194c`) — BlossomSuccess (ink-band
      ฉลอง + receipt line + confetti เรขาคณิต + next-step panel, modal ฟอร์ม/auth guard คงอยู่ที่
      parent) / BlossomClosed (ประกาศเงียบ reason-aware) + dispatch + preview wiring;
      closed ไม่มีลิงก์ results ตาม seam จริงของพี่น้อง (ไม่ขยาย seam)
- [x] **T3.5 /results** ✅ DONE 2026-07-12 (`02b045b`) — BlossomResults (data moment:
      hollow "ผลคะแนน" masthead + figures row ตาม stat grammar ของ home; EMBARGOED =
      ink band เต็มจอ + countdown ไม่มี score รั่วก่อน reveal; revealed = ranking rows
      ผู้ชนะใช้ diamond+pill เรขาคณิตล้วน + demographics เป็น recharts เดิมใน Blossom
      panel — แตะแค่กรอบ, chart fills อ่านจาก blossomPalettes เพราะ SVG fill ไม่ resolve
      var()) + dispatch + preview wiring interact+static; verify 4 ธีม/390px/original+
      gumroad+live results ไม่กระทบ; ระหว่าง verify เจอ manifest race (Rule 7) → P-LOG-081
- แนวทาง: ทำเป็น Blossom* components ใหม่ dispatch ด้วย `startsWith('blossom')`
  (แบบที่ตระกูลอื่นทำ) — **ห้าม rewrite classic**; ดู recipe ตระกูล verdure/studio-dark
- Acceptance ต่อหน้า: 4 ธีมผ่าน + mobile + interact-mode ใน template-preview ไม่พัง (P-LOG-002)

## P4 — Flow polish + gate
- [ ] Transition ต่อเนื่องระหว่างหน้า (อย่างน้อย: token คงเส้น, navbar/footer ร่วม)
- [ ] template-playground + /template-preview?interact=1 รองรับ blossom เต็ม flow
- [ ] chooser slideshow ภาพครบทุกหน้า
- [ ] ปิดท้าย: pre-deploy gate ปกติ (นัดหยุด server กับ owner → rm -rf .next → build GREEN
      → smoke 15/15 → paste output จริง)

## กติกาที่สืบทอด (ห้ามลืม)
สี = var(--bl-*) เท่านั้น, ออกแบบบนชมพูแล้วตรวจ 4 ธีมทุกครั้ง · mobile-first 390px ·
ตกแต่ง = เรขาคณิตเท่านั้น ห้าม icon/illustration/emoji · ห้ามลายเซ็นตระกูลอื่น (marquee,
ขอบดำหนา+offset shadow, มืด+neon+rail, glass+ใบไม้) · ภาษาไทยห้ามลงท้าย "." ·
เลขไทย/ราชการ tropes ห้าม · เนื้อหา visibility ห้ามพึ่ง JS · getPath ทุก URL ·
semantic vote colours + PartyTheme.js + recharts consts ห้ามแตะ

---

## PROMPT สำหรับเปิด session หน้า (คัดลอกได้เลย)

```
อ่าน docs/PLAN-BLOSSOM-AWWWARDS.md ทั้งไฟล์ก่อน แล้วทำตามลำดับ
P1 → P1.5 → P2 → P3 (P1 commit งานค้างต้องเสร็จก่อนแตะอะไรใหม่)

P1.5 คือ feedback ล่าสุดของผม: ปุ่ม "ดูผู้สมัคร" ใน hero ซ้ำกับปุ่ม
"ดูผู้สมัครทั้งหมด" ใน section ถัดมา — ทำตามแนวทาง A ในแผน (เปลี่ยนปุ่ม hero
เป็น anchor scroll) แล้วให้ผมดูก่อน ถ้าไม่ชอบค่อย fallback B

workflow บังคับ: คุณ (Fable) เป็น advisor/reviewer เท่านั้น — เขียน brief ลง .specs/
แล้ว spawn Opus 4.8 subagent เป็น worker ทุกงาน execution; worker ห้าม commit
จนคุณรีวิว raw outputs ผ่าน; ห้ามหยุด dev server :3000 (ผมดู live);
verify ธีม = ดู computed styles จริง ไม่ใช่ screenshot อย่างเดียว แล้วตรวจครบ 4 ธีม
(blossom / -sky / -mint / -butter) + มือถือ 390px ทุก ticket

เป้าหมาย: ยก Blossom จาก ~8/10 เป็น 10/10 ตามนิยามสามเสาในแผน
(craft / scroll motion / coherence ทั้ง flow) เริ่มจากรายงานสถานะ working tree
กับผมก่อนว่า P1 ค้างอะไรบ้าง แล้วค่อยเริ่ม
```
