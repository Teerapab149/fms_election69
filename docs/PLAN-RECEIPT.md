# PLAN — Receipt "Paper Materiality" (Template Family #6)

> สำหรับ session หน้า อ่านไฟล์นี้ → `docs/CONCEPT-RECEIPT-TEMPLATE.md` (canonical)
> → `CLAUDE.md` (Engineering Discipline) ตามลำดับ · Branch `new-version`
> Workflow บังคับ: **Fable = advisor/reviewer เท่านั้น · Opus 4.8 subagent = worker
> ทุกงาน execution** (brief ต้องมี Task-0 audit + raw outputs + ห้าม commit จน
> รีวิวผ่าน + ห้ามหยุด dev server :3000 + verify computed styles จริง ไม่ใช่ screenshot
> อย่างเดียว + ครบทุกธีม + มือถือ 390px ทุก ticket)

## นิยาม 3 เสา (จาก concept §3)
1. **Material honesty** — ทุกชิ้นบนจอคือของที่พิมพ์ได้จริง วางบนโต๊ะกระดาษสว่างอุ่น
   จัดบน invisible grid (curated ไม่ใช่รก)
2. **Holographic foil = ลายเซ็น color-shifting** — hue ไหลช้า+ ตอบ pointer/tilt
   ใช้จำกัดจุด (ตราซีล / แถบ security บนใบเสร็จ / ขอบ CTA); reduced-motion → นิ่งแต่ยัง iridescent
3. **Journey = วงจรชีวิตกระดาษหนึ่งใบ** — home→vote→success→results พูดภาษาเดียว

---

## ⏰ สถานะ (2026-07-12)

- **R0 — Claude Design phase** ➡️ กำลังทำ (bundle authoring เสร็จ รอ Fable review + push เข้า design project)
  - ✅ `.specs/receipt/BRIEF.md` — design brief (แปลง concept §1-§6 + prompt §8 เป็นอังกฤษ)
  - ✅ `.specs/receipt/tokens-draft.md` — token `--rc-*` ตั้งต้น + accent/contrast + font load status
  - ✅ `.specs/receipt/reference-cards.md` — การ์ดอ้างอิงต่อหน้า + fallback rule
  - ✅ `docs/PLAN-RECEIPT.md` — ไฟล์นี้ (ไฟล์เดียวที่ลง git ใน R0)
  - ⏸ NEXT: owner iterate 2-3 direction ของ **Success/ใบเสร็จ** ใน claude.ai/design
    (workflow เดียวกับ Blossom v2-C) → ตอบคำถามเปิด §9 ทั้ง 4 ข้อจากภาพ
- R1..R5 = ยังไม่เริ่ม (build phase เริ่มเมื่อ owner เลือก direction จาก R0)

**เงื่อนไขเริ่ม build:** Blossom ต้องปิด (P4 gate) ก่อน — ห้ามคู่ขนานสองตระกูลครึ่ง ๆ กลาง ๆ
(concept §7) · owner ต้องเลือก Success direction + ยืนยัน ephemeral receipt (§9 Q4)

---

## แผนงาน R0-R5 + acceptance ต่อ R

### R0 — Claude Design phase (bundle + owner เลือก direction)
- **ทำอะไร:** Fable push bundle `receipt/` เข้า design-system project (BRIEF + token
  ตั้งต้น + reference cards) → owner iterate 2-3 direction ใน claude.ai/design
- **จุดที่ owner ต้องเลือกจากภาพ:** โทนโต๊ะ (กระดาษอุ่น vs เทาสตูดิโอ vs dark variant),
  จำนวนธีม (4 หรือน้อยกว่า), ท่าที doodle (ตราปั๊ม vs ลายมือ), ชุด accent 4 ธีม
- **Acceptance R0:** มี 2-3 direction ของหน้า Success ให้ owner เลือก + owner ตอบคำถาม
  §9 ครบ 4 ข้อ + ยืนยัน ephemeral receipt ก่อนลง build

### R1 — Success/ใบเสร็จ (หัวใจ ทำก่อน)
- **ทำอะไร:** ReceiptSuccess — moment พิมพ์ใบเสร็จทีละบรรทัด + holo strip + ตราซีล +
  ขอบหยักฉีก; เนื้อใบเสร็จตาม reference card (ephemeral ตาม §2)
- **Acceptance R1:** moment ผ่านสายตา owner + **ballot secrecy (§2) ครบทุกข้อ**
  (ไม่มี save/download/share, choice ephemeral, barcode = ref-only, ป้าย
  "ไม่ใช่หลักฐานทางการ") + fallback reduced-motion/JS-fail โชว์ใบเสร็จเต็มทันที +
  ทุกธีม + 390px + modal ฟอร์ม/auth guard คงอยู่ที่ parent

### R2 — Home + countdown บัตรคิว
- **ทำอะไร:** ReceiptHome — โต๊ะหน่วยเลือกตั้ง + countdown เป็นบัตรคิว + turnout
  register tape + CTA เข้าคูหา
- **Acceptance R2:** ทุกธีม + 390px + ทุกสถานะ CTA (ก่อนเปิด/เปิด/โหวตแล้ว/ปิด/pause
  ผ่าน template-preview interact) ไม่ layout shift + countdown fallback static

### R3 — Vote multi + single
- **ทำอะไร:** ReceiptVote (บัตรกระดาษ ☐ + ฉีกรอยปรุ) + ReceiptSingleParty
  (ตราปั๊ม 3 อัน semantic เขียว/แดง/ส้ม)
- **Acceptance R3:** semantic vote colours verified ไม่ถูก accent/holo แตะ +
  dispatch guard single vs multi + fallback ทุก interaction + ทุกธีม + 390px +
  shared confirmation modal ไม่ถูกแก้

### R4 — Results + Closed
- **ทำอะไร:** ReceiptResults (register tape ยาว + embargo SEALED holo, recharts
  ใส่กรอบกระดาษ consts ห้ามแตะ) + ReceiptClosed (สลิปแปะเทป reason-aware)
- **Acceptance R4:** embargo ไม่รั่ว score ก่อน reveal + recharts consts/fills
  untouched + closed ไม่ลิงก์ results ตาม seam + ทุกธีม + 390px + fallback

### R5 — Playground/preview/chooser + gate
- **ทำอะไร:** ต่อ receipt เข้า template-playground + /template-preview?interact=1
  เต็ม flow + chooser slideshow + pre-deploy gate
- **Acceptance R5:** click-through ครบทุกหน้า + 4 ธีม probe + 390px overflow 0 +
  pre-deploy gate (หยุด server → rm -rf .next → build GREEN → smoke → paste
  output จริง — ต้องให้ owner หยุด server เอง ถ้า classifier บล็อก)

---

## กติกาที่สืบทอด (จาก concept §6 — ห้ามลืม ทุก R)
ตระกูลใหม่แยกไฟล์ **ห้าม rewrite ของเดิม** · dispatch `slug.startsWith('receipt')`
ตาม seam ที่มีอยู่ (แบบ verdure/studio-dark/blossom) · **สี semantic โหวต
(เขียว/แดง/ส้ม) + PartyTheme.js + recharts consts ห้ามแตะ** · เนื้อหา visibility
**ห้ามพึ่ง JS** (animation พิมพ์ใบเสร็จ/ตราปั๊ม/ฉีก/foil ต้องมี fallback:
reduced-motion/JS-fail = โชว์เต็มทันที) · `getPath()` ทุก URL · **ไทยห้ามลงท้าย "."** ·
เลขไทย/ราชการ tropes แก่ ๆ ห้าม · mobile-first 390px · editorMode guards (P-LOG-002) ·
P-LOG-078/079/080/081/082/083 ทั้งหมด apply

### ลายเซ็นตระกูลอื่น ห้ามชน (concept §2)
ห้าม neon lime + ดำสนิท (studio-dark) · ห้ามขอบ brutalist หนา + offset shadow
(gumroad) · ห้าม marquee · ห้าม glass+ใบไม้ (verdure) — Receipt = die-cut edge +
curl shadow + รอยปรุ + ตราปั๊ม + holo foil เท่านั้น

### สถาปัตย์สี (single-source — ตาม tokens-draft)
`src/utils/receiptPalettes.js` (NEW · single source) → `ReceiptTheme.js`
(ReceiptBaseStyles emit `.rc-root --rc-*`) → `builtIn/receipt.js` (Layer-1 map
จาก ramp เดียวกัน) → `injectTemplateTheme.js` (preview morph) — applying variant
live = match preview byte-for-byte (parity rule)

### ฟอนต์ (impeccable rule — โหลดก่อนใช้)
Chakra Petch = **ต้องเพิ่มใน layout.js** (`next/font/google`, subsets thai+latin,
var `--font-chakra`, weights 400/500/600/700 + ใส่ `.variable` ใน body className) ·
IBM Plex Sans Thai (`--font-plex-thai`) + Space Mono (`--font-space-mono`) โหลดแล้ว
ใช้ซ้ำได้ — รายละเอียดใน `.specs/receipt/tokens-draft.md` §7

---

## PROMPT สำหรับเปิด session หน้า (คัดลอกได้เลย)

```
อ่าน docs/PLAN-RECEIPT.md ทั้งไฟล์ → docs/CONCEPT-RECEIPT-TEMPLATE.md (canonical)
→ CLAUDE.md (Engineering Discipline) ตามลำดับ ก่อนแตะงาน Receipt

สถานะ: R0 bundle authoring เสร็จแล้ว (.specs/receipt/BRIEF.md + tokens-draft.md +
reference-cards.md + docs/PLAN-RECEIPT.md) รอผมเลือก Success direction จาก
claude.ai/design ก่อน — อย่าเพิ่งเริ่ม build จนผมยืนยัน direction + ตอบคำถามเปิด §9

เงื่อนไขเริ่ม build R1: Blossom ต้องปิด P4 gate ก่อน (ห้ามคู่ขนานสองตระกูล) +
ผมยืนยัน ephemeral receipt (§9 Q4) + เลือก direction Success

workflow บังคับ: คุณ (Fable) = advisor/reviewer เท่านั้น — เขียน brief ลง .specs/
แล้ว spawn Opus 4.8 subagent เป็น worker ทุกงาน execution; worker ห้าม commit จน
คุณรีวิว raw outputs ผ่าน; ห้ามหยุด dev server :3000 (ผมดู live); verify computed
styles จริง + ครบทุกธีม + มือถือ 390px ทุก ticket

R1 = Success/ใบเสร็จก่อน (หัวใจตระกูล) — ballot secrecy §2 ต้องครบทุกข้อ ห้าม dilute
```
