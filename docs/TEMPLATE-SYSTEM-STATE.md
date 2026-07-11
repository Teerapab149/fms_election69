# TEMPLATE SYSTEM — State of the System & Road to Deploy
> เขียน 2026-07-07 โดย Fable 5 (advisor) · สำหรับ Opus 4.8 workers ในอนาคต + ผู้ดูแลโปรเจกต์
> คู่กับ: README.md (dev ใหม่เริ่มที่นั่น) · docs/MASTER-DESIGN-PLAN.md (งานดีไซน์) · DECISIONS.md (P-LOG)
> ⚠️ PROGRESS.md เก่ากว่านี้มาก (ยุค editor ที่ถูก retire แล้ว) — อย่าใช้เป็น state

---

## §0 คำตัดสินสถานะ (TL;DR)

**ฟีเจอร์: ~95% เสร็จ · ความพร้อม deploy: ยังไม่ผ่านเกณฑ์ — ติด gate เดียวที่บล็อกทุกอย่าง**

| แกน | สถานะ |
|---|---|
| Flow เลือกตั้งครบวงจร (login→vote→success→results, single+multi mode) | ✅ ใช้งานได้ครบ 4 template |
| ระบบธีม 4 ตระกูล × 19 ธีม + preview/apply parity | ✅ เสร็จ, บั๊กใหญ่แก้หมด (token-bleed, morph staleness, portal scope) |
| Security P0 (admin auth JWT cookie, vote race) | ✅ เสร็จตั้งแต่ 2026-06-10 arc |
| Content binding (ปี/วันที่/ชื่องาน → globalConfig) | ✅ เสร็จ (1c8d09b, 3d26660) |
| เครื่องมือ annual reset (`preflight`, `archive-year`, `import-students`) | ✅ สคริปต์มีแล้ว — แต่ยังไม่เคยซ้อมรอบจริง |
| **`npm run build` เต็ม + `npm run smoke` บน tree ปัจจุบัน** | ✅ **ผ่านแล้ว 2026-07-13** (tree @ f1ee969): build ✓ 33/33 pages ไม่มี error · smoke ✓ 15 pass / 0 fail (auth/forged-token/rate-limit/vote-session/results-leak ครบ) — ดูหลักฐานเต็มใน §4.1 |
| งานดีไซน์ subjective (semantic-colour rule, user-chip, P3 จูน) | ⏳ รอ owner ตัดสิน — ไม่บล็อก deploy |

**นิยาม "พร้อม deploy" ของโปรเจกต์นี้ = ผ่าน §4 ทุกข้อ** ไม่ใช่แค่ "หน้าเว็บดูดี"

---

## §1 ระบบ template คืออะไร (product definition — อย่าเข้าใจผิดว่าเป็น editor)

**ผลิตภัณฑ์ = "เลือก template สำเร็จรูป" ไม่ใช่ web editor.** อดีตเคยเป็น Canva-style editor
(โค้ด infra ยังหลงเหลือ: elementRegistry, EditorElement, PageDesignTab) แต่ถูก **retire เชิงกลยุทธ์**
(2026-06-09: variety ≠ editor; ความทน 10 ปี = robustness ไม่ใช่ design tool) — admin ปัจจุบันคือ
**TemplateChooserTab**: การ์ดต่อตระกูล + swatch สี + สไลด์หน้าจริง + ปุ่ม apply

**4 ตระกูลจริง (layoutFamily มี layout ของตัวเองครบทุกหน้า):**

| ตระกูล | บุคลิก | ธีม | หมายเหตุ |
|---|---|---|---|
| `original` | SAMO คลาสสิก โมเดิร์นสะอาด (gold ee059dc) | **1: ม่วง FMS เท่านั้น** (owner call 2026-07-08 — งาน craft พาเลตต์เดียว, ธีม field 4 ตัวถูก un-register จาก chooser; palette/builder ยังอยู่ reversible) | home = OriginalHome, inner = classic layout themed |
| `gumroad` | นีโอบรูทัล สนุก มีพลัง | 6: base / cyber / retro / acid / premium / **bubblegum** (ชมพู — candidate ปีหน้า) | owner ชอบ อย่าแตะโครง |
| `studio-dark` | ดาร์ก editorial + rail ซ้าย + ไลม์ | 4: ไลม์ / ไซเบอร์ฟ้า / แมเจนต้า / ทองอำพัน | เกรดดีสุดใน audit (A-) |
| `verdure` | เซริฟ editorial เขียว + wax-seal ceremony | 4: คลาสสิก / อะคาเดมิก / ครีเอทีฟ / มินิมอล(เบอร์รี) | ประณีตสุด |

+ 4 ตัว legacy (`classic`, `modern-dark`, `playful`, `minimal`) = token-recolor บน classic layout ยุคเก่า
ยัง register อยู่เพื่อ compatibility — **ตัดสินใจค้าง: จะซ่อนจาก chooser ก่อน deploy หรือไม่**

## §2 สถาปัตยกรรม (แผนที่สำหรับ worker — อ่านก่อนแตะโค้ดธีมทุกครั้ง)

```
[1] utils/<family>Palettes.js        แหล่งสีเดียวต่อตระกูล (plain module — server+client import ได้)
      │
      ├─→ [2] <Family>BaseStyles (client)   ยิง family vars ลง root class ตาม active slug + ?slug=
      │       gumroad→.fms-app.gum-root(--pink…) · verdure→.vd-root(--moss/--cta…)
      │       original→.orig-root(--o-*) · studio→.sd-root+:root(--sd-*) · single-vote→:root(--spv-*)
      │
      ├─→ [3] builtIn/<family>.js  build<X>Template(slug,name,desc,palette)
      │       → Layer-1 tokens (--color-*) + element configs + colorSwatch ต่อ "ธีม" (1 ธีม = 1 template slug)
      │       → register ใน templates/index.js BUILT_IN_TEMPLATES
      │
      └─→ [4] utils/injectTemplateTheme.js   preview morph (chooser swatch / full-screen)
              push family vars + Layer-1 inline — mapping ต้อง byte-match builder (parity rule)

[5] Apply: POST /api/admin/templates/<slug>/apply → strip editor overrides → SystemConfig.activeTemplateId
[6] Render: layout.js SSR Layer-1 ของ active ที่ .fms-app · HomeRenderer: HOME_LAYOUTS[slug]||[layoutFamily]
    · 6 หน้า app dispatch ด้วย activeTemplateId?.startsWith('<family>')
[7] Preview: /template-preview?slug=X (bare=damped) · +&chrome=1 (swatch bar) · +&interact=1 (จำลอง flow จริง
    + motion เต็ม) · /template-playground (DB-free) — template-preview emit Layer-1 ของ slug ที่พรีวิวเอง (66f7444)
```

**Invariants 7 ข้อ** อยู่ที่ MASTER-DESIGN-PLAN §3 — ตัวที่พังบ่อยสุด: portal ห้าม `var(--color-*)` (P-LOG-077),
Layer-2 colour vars ต้อง reference token (752f375), Tailwind arbitrary ห้าม comma-fallback

**สูตรเพิ่มธีมใหม่ในตระกูลเดิม (ใช้แล้ว 3 รอบ พิสูจน์แล้ว):** เพิ่ม entry ใน palette → export ใน builder →
register ใน index.js → จบ (BaseStyles/injector/dispatch/chooser ตามอัตโนมัติ) · verify: bare preview ทุกธีม
+ chrome=1 morph round-trip + base ต้อง byte-identical + restore active เดิม

## §3 Scorecard ราย subsystem (หลักฐาน = commit)

| Subsystem | สถานะ | หลักฐาน/หมายเหตุ |
|---|---|---|
| Palette arch ทั้ง 4 ตระกูล | ✅ | studioDark สุดท้าย 065cf9c |
| Preview↔live parity | ✅ | token-bleed 66f7444, morph staleness 752f375/4f5b173, ticker 4a0b322+8179862 |
| Single-vote cinematic themed | ✅ | portal repair 9d4c28d (ปุ่ม DISCOVER เคยโปร่งใสทุกธีม!) |
| Multi-vote / results / success / closed ทุกตระกูล | ✅ | arcs ก่อนหน้า + modal tokenize d9d8a85 |
| Content = globalConfig | ✅ | ปี 1c8d09b · วันที่ closed 3d26660 |
| Objective UX fixes | ✅ | T1.2 83b74fb · T2.O2 fc632e9 · T2.S2 11680c1 · T2.V1 df7ec31 · T2.O1 c029fb6 |
| Admin chooser UX | ✅ ใช้ได้ | ปุ่ม "เปิดแบบโต้ตอบ" ยัง gate 3 ตระกูล (backlog เล็ก) |
| Test net | ⚠️ มีแต่ไม่ถูกใช้ | `smoke` (15 เคส) + Playwright `e2e:gate` — ไม่เคยรันบน tree ปัจจุบัน |
| Annual reset | ⚠️ สคริปต์มี ยังไม่ซ้อม | `preflight-year`, `archive-year`, `import-students` |
| Editor legacy code | 🧟 อยู่เฉยๆ | ไม่บล็อก แต่เพิ่ม maintenance surface — ดู §5.4 |

## §4 ✅ CHECKLIST ก่อน DEPLOY (เรียงลำดับ — ทำบนลงล่าง)

1. ✅ **PASSED 2026-07-13 (Fable session, owner-approved server stop; tree @ f1ee969):**
   `npm run build` → `✓ Generating static pages (33/33)` + route table เต็ม 33 routes ไม่มี error/warning
   · `npm run smoke` → `tests 15 · pass 15 · fail 0` (4.2s) — ครอบ: public results ไม่ leak score ·
   admin API 401 no-auth/forged-cookie · admin login wrong-pw 401/correct 200+httpOnly · vote ต้องมี
   session · login rate-limited 429 · role/privilege invariants 7 เคส · dev server restart กลับแล้ว (:3000 live)
   · `npm run e2e:gate` (Playwright) ยังไม่รัน — optional เพิ่มความมั่นใจ ไม่บล็อก
2. **[บล็อก] Production config sweep:** `.env` จริง (DATABASE_URL, NEXTAUTH_SECRET, ADMIN_PRIVATE_KEY,
   ADMIN_AUTH_SECRET, NEXT_PUBLIC_BASE_PATH=/fms-ovs) · **`NEXT_PUBLIC_ENABLE_MOCK_LOGIN` ต้องไม่ = true**
   (ตอนนี้เปิดอยู่ใน .env.local!) · PSU SSO callback URL จริง
3. **[บล็อก] Security rotate (สโคปจริงใหญ่กว่าที่คิด — grep เต็ม 2026-07-13):** docs 2 ไฟล์ scrub แล้ว (8c000f6)
   แต่ dev admin password ตัวเดิมยัง**ฝังเป็น literal ใน `prisma/seed.js:284,287` + `e2e/admin-console.spec.js:9`
   + `scripts/smoke/election.test.mjs:16` (fallback)** — เป็น dev-seed โดยดีไซน์ + อยู่ใน git history ด้วย
   → ก่อน deploy/แชร์ repo: **ROTATE `ADMIN_JWT_SECRET`/`ADMIN_PASSWORD_AUTH_EXTRA` (owner ทำ)** +
   ticket เสริม: ย้าย seed/e2e password ไปอ่าน env (smoke ทำถูกแล้ว: `process.env.ADMIN_PASS || fallback`)
   · เช็คซ้ำ `git grep -n 9QpZxL`
4. **[ตัดสินใจ] เลือก template+ธีม production แล้ว apply** (ตอนนี้ DB = gumroad-premium จากการลองของ owner)
   · เช็ค `prisma/schema.prisma` activeTemplateId default ยัง "classic" → ควรเปลี่ยน "original" (Task C เก่า ยังค้าง)
5. **[ตัดสินใจ] Legacy templates 4 ตัว** ซ่อนจาก chooser หรือคงไว้
6. **ซ้อม annual-reset หนึ่งรอบบน dev DB:** preflight-year → archive-year → import-students → seed ปีใหม่
   — พิสูจน์ว่าปีหน้าทำได้โดยไม่มี dev
7. **Docker build + subpath smoke** บนสภาพจริง (getPath ทุกเส้นทาง, images, SSO redirect)
8. หลัง deploy: T4.1 folder refactor + งาน subjective ค้าง (MASTER-PLAN §8b) ทำเป็นรอบถัดไป

## §5 บันทึกถึง worker อนาคต

1. **Workflow:** อ่าน CLAUDE.md Engineering Discipline + MASTER-DESIGN-PLAN §1(taste)/§4(process) ก่อนเสมอ
   — กติกาห้ามหยุด dev server, restore active template, raw evidence, no-commit-until-review, progress file
2. **บทเรียนแพงสุดของ arc นี้:** (ก) ตัวเลข contrast ผ่าน ≠ สวย — งาน visual ต้องมีตา (เจ้าของ) ดูก่อนนับว่าจบ
   (T1.1 revert) · (ข) เจ้าของชอบอะไร → แตะให้น้อยที่สุด, ดีไซน์ใหม่ = template ใหม่ ห้าม rewrite (ประกาศ-concept
   ถูก reject ยกชุด) · (ค) commit message ห้ามมี double-quote บน PowerShell — ใช้ `git commit -F <ไฟล์>`
3. **P-LOG-078/079 (เสนอแล้วยังไม่ append เข้า DECISIONS.md — รอ owner ยืนยัน):** verification-vs-aesthetics
   + structural guard สำหรับ commit quotes — ถ้าคุณคือ session ใหม่และ owner เห็นชอบ ให้ append ได้เลย
4. **Editor legacy (elementRegistry/PageDesignTab/EditorElement/DesignLibrary.js orphan):** อย่าลบพละการ —
   หน้า chooser ยังพึ่งบางชิ้น (EditorPreview components, buildTemplateStyles) · ถ้าจะเก็บกวาด ทำเป็น audit
   แยกหลัง deploy พร้อม grep พิสูจน์ว่าไม่มี import
5. **แผนที่เอกสาร:** README.md (ภาพรวม dev ใหม่) → ไฟล์นี้ (state+deploy) → MASTER-DESIGN-PLAN (ดีไซน์) →
   DECISIONS.md P-LOG-001..077 (บทเรียน) → docs/HANDOFF-* (ประวัติราย arc) → memory dir (ส่วนตัวของ AI)
