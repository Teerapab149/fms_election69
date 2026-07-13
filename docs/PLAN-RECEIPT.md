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

- **R0 — Claude Design phase** ➡️ **bundle PUSHED เข้า design project แล้ว** (2026-07-12) —
  รอ owner iterate direction ใน claude.ai/design
  - ✅ `.specs/receipt/BRIEF.md` — design brief (แปลง concept §1-§6 + prompt §8 เป็นอังกฤษ)
  - ✅ `.specs/receipt/tokens-draft.md` — token `--rc-*` ตั้งต้น + accent/contrast + font load status
  - ✅ `.specs/receipt/reference-cards.md` — การ์ดอ้างอิงต่อหน้า + fallback rule
  - ✅ `docs/PLAN-RECEIPT.md` — ไฟล์นี้ (ไฟล์เดียวที่ลง git ใน R0)
  - ✅ **Push เข้า design-system project** (id `019dca14-4c1f-7ac2-aa0a-b3ddfd851892`,
    โฟลเดอร์ `receipt/`): BRIEF + reference-cards + `tokens.css` (--rc-* จริง 4 ธีม) +
    การ์ด live 2 ใบ กลุ่ม "Receipt": **`holo-foil-demo.html`** (ฟอยล์ color-shift + ตอบ pointer
    + reduced-motion static — verify ด้วย Playwright แล้ว) + **`palette.html`** (base+4 accent
    contrast+holo ramp) — ยกจาก scratchpad, ไฟล์ต้นทางไม่ commit (design artifact)
  - ✅ **owner ตอบคำถามเปิด §9 ครบ 2026-07-12 (LOCKED):** กระดาษอุ่น · 4 ธีม ·
    ตราปั๊มเท่านั้น (ห้ามลายมือ) · ephemeral ยืนยัน — ดู CONCEPT §9
  - ✅ **Success direction A/B/C push เข้า project แล้ว** (การ์ดกลุ่ม "Receipt"):
    A = `holo-foil-demo.html` (ใบเสร็จกลาง symmetric + seal/CTA ข้าง — clean/product) ·
    B = `success-B-printer.html` (หัวเครื่องพิมพ์ + ใบเสร็จไหลลง — cinematic mobile,
    **Fable แนะนำ** เพราะตรง vision "ค่อยๆ print ออกมา" สุด + mobile-native + animate ง่าย) ·
    C = `success-C-collage.html` (headline + วัตถุกระดาษแปะเทป — editorial showpiece แต่ desktop-lean/sparse)
  - ⏸ NEXT: owner เลือก 1 direction (ปรับต่อใน claude.ai/design ได้) → เริ่ม R1 build
    (gate ครบทุกข้อแล้ว: Blossom ปิด + ephemeral ยืนยัน + รอแค่ตัวเลือก direction)
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

### R1 — Success/ใบเสร็จ ✅ DONE 2026-07-12 (`784b654` plumbing + `51c9f93` Success)
- Plumbing: receiptPalettes/ReceiptTheme/builtIn/receipt/injector case + Chakra Petch (layout.js)
- ReceiptSuccess จาก direction B — Fable image-review 4 ธีม × desktop/390 ผ่าน (เหลือง CTA=ink
  ✓, printer moment เป็น mobile-native, ballot-secrecy ครบ, base-visible ยืนยัน); P-LOG-084
  (negative-z paint-order) ลง DECISIONS
- ⚠️ **ค้างให้ owner ยืนยัน:** worker เพิ่ม prop `choice` (optional, ตัวที่ 5) — production
  ไม่เผยตัวเลือก (โชว์ "บันทึกแล้ว · เป็นความลับ"), editor/preview โชว์ตัวอย่าง; **R3 vote-flow
  จะเป็นคนตัดสินว่าจะส่ง choice ephemeral ตอน submit ไหม** (ผูก ballot secrecy §2 — ค่า default
  = ไม่เผย ปลอดภัยสุด) → ยืนยันตอนทำ R3
- เดิม: ReceiptSuccess — moment พิมพ์ใบเสร็จทีละบรรทัด + holo strip + ตราซีล + ขอบหยักฉีก
- **Acceptance R1:** moment ผ่านสายตา owner + **ballot secrecy (§2) ครบทุกข้อ**
  (ไม่มี save/download/share, choice ephemeral, barcode = ref-only, ป้าย
  "ไม่ใช่หลักฐานทางการ") + fallback reduced-motion/JS-fail โชว์ใบเสร็จเต็มทันที +
  ทุกธีม + 390px + modal ฟอร์ม/auth guard คงอยู่ที่ parent

### ⚠️ Operating mode จาก owner (2026-07-12 ดึก — บังคับทุก R ที่เหลือ)
- owner **ยังไม่ถูกใจ design โดยรวม** แต่สั่ง: **ทำให้ครบทุกหน้าก่อน แล้ว polish ใหญ่
  ทีเดียวตอนจบ** (ดูภาพรวมก่อนค่อยจูน) → เพิ่ม phase **R4.5 — Owner-guided polish round**
  (ไล่เก็บ feedback ทีละหน้าจากภาพรวมจริง ก่อน R5 gate)
- เป้าเพิ่ม: owner ต้อง **เข้าไปดูเล่นได้จากฝั่ง admin** (chooser slideshow) — receipt
  4 slugs register แล้วตั้งแต่ R1; slide จะจริงขึ้นเรื่อย ๆ เมื่อ R2-R4 ลง; verify chooser
  ทุกครั้งที่หน้าใหม่ลง
- Build pass แต่ละหน้า = "good first pass, family-consistent" — gates แข็ง (token/
  semantic/base-visible/mobile/P-LOG) ยังบังคับเต็ม แต่การถกดีไซน์ละเอียดยกไป R4.5

### R2.5 — Home "Elegant Desk" polish (owner-directed 2026-07-13 — IN FLIGHT)
- **ที่มา:** owner ส่ง image-gen prompt (โต๊ะกระดาษ elegant) + feedback: (1) พื้นหลังห้าม
  watermark logo ซ้ำๆ ("PSU ตลกมาก") ต้อง elegant (2) UI ยังอ่านเป็น "การ์ด" ซ้ำ template อื่น
  → ดันเป็น "กระดาษจริง" (3) **Home ที่ polish แล้ว = reference ทุกหน้าที่เหลือ** แล้วไล่ทำ
  ต่อเนื่องทุกหน้าเลย ไม่ต้องรอ (แก้ operating mode เดิมบางส่วน — polish home ก่อน แล้ว
  build หน้าที่เหลือด้วยภาษาใหม่)
- **Fable วิเคราะห์ prompt:** เอา laid-paper bg + blind-emboss seal 2-3 จุด (ห้าม tile) +
  paper-stack hero + paperclip + split-flap countdown tiles + manila note stats +
  die-cut tag CTA + light audit ทิศเดียว + topbar เส้นปรุ; ตัดทิ้ง walnut frame /
  กิ่งมะกอก / ตราโลหะโบราณ / เส้นลายมือ (owner lock ตราปั๊มเท่านั้น)
- **Spec:** `.specs/receipt/R2.5-HOME-ELEGANT-DESK.md` · worker = Opus 4.8 subagent
- ✅ **DONE 2026-07-13 `e003fc3`** — Fable review ผ่านทุกแกนที่ตรวจได้ (probe อิสระ:
  laid ::after จริง, seal 3/2 จุด desktop/mobile, paperclip+stack 2 แผ่น, tile 3px+seam,
  note #F5EDDA คงที่ 4 ธีม + contrast 5.06:1, grommet+studs เป็น pseudo, เงาทิศเดียว
  down-right, topbar ปรุ, 390px scrollWidth=390, yellow onAccent=ink)
- ⚠️ **pixel capture ล่มทั้ง session** (screenshot timeout ทุก call ทั้ง worker+Fable —
  DOM/JS ปกติ) → visual eyeball สุดท้าย = owner ตอน R4.5; จุดจูนที่แขวนไว้: opacity
  emboss seal (~5% ink) ถ้าจางไป/เข้มไปปรับที่ `.rc-desk-seals`
- ⚠️ ช่องว่างแผนเดิม: ตระกูลอื่นมีหน้า **Candidates** (BlossomCandidates) แต่ R0-R5
  ไม่มี ReceiptCandidates → เพิ่มเข้า R4 (ไม่งั้น nav /candidates หลุดตระกูล)
- ⚠️ R3 ค้าง untracked: ReceiptVote.js + ephemeralChoice.js — คิวถัดไป ทำต่อด้วย
  ภาษา desk ใหม่จาก home (laid bg + light ทิศเดียว + tile materiality)

### R2 — Home + countdown บัตรคิว
- **ทำอะไร:** ReceiptHome — โต๊ะหน่วยเลือกตั้ง + countdown เป็นบัตรคิว + turnout
  register tape + CTA เข้าคูหา
- **Acceptance R2:** ทุกธีม + 390px + ทุกสถานะ CTA (ก่อนเปิด/เปิด/โหวตแล้ว/ปิด/pause
  ผ่าน template-preview interact) ไม่ layout shift + countdown fallback static

### R3 — Vote multi + single ✅ DONE 2026-07-13 (`1fe8259` + chore `9947c52`)
- ReceiptVote (ต่อจากร่างค้าง) + ReceiptSingleParty ใหม่ (ปั๊ม 3 อัน #16A34A/#DC2626/
  #EA580C คงที่ทุกธีม) + **ภาษา desk แยกเป็น shared class `.rc-desk` ใน
  ReceiptBaseStyles** (T1 gate: home computed เดิมเป๊ะ) + ephemeral wiring
  (set ที่ vote/page.js on POST success → **soft router.push** เฉพาะ receipt เพื่อให้
  module memory รอด → consume ครั้งเดียวที่ success mount, StrictMode-guarded) +
  dispatch vote/success/template-preview ครบ; Fable รีวิวผ่าน (probe อิสระ: multi 3 แถว
  ไม่มีแถว -1, kick ส้ม semantic, tray 129px, single dispatch ถูก, ปั๊ม 3 สีคงที่บนธีมเหลือง,
  390 = 390, อ่าน wiring จริงทั้งสองฝั่ง)
- Divergence ที่ยอมรับ: receipt ใช้ soft nav ไป /success (ตระกูลอื่น hard nav) — จำเป็นต่อ
  ephemeral, comment ในโค้ดครบ · playground entry เลื่อนไป R5 ตามแผน ·
  launch.json pin worker server ที่ :56989 กันแย่ง :3000 ของ owner
- **Acceptance R3 (เดิม):** semantic vote colours verified ไม่ถูก accent/holo แตะ +
  dispatch guard single vs multi + fallback ทุก interaction + ทุกธีม + 390px +
  shared confirmation modal ไม่ถูกแก้ — ครบทุกข้อ (raw ใน worker report R3)

### R4 — Results + Closed + Candidates + home addendum (ขยาย 2026-07-13)
- **ทำอะไร:** ReceiptResults (register tape ยาว + embargo SEALED holo, recharts
  ใส่กรอบกระดาษ consts ห้ามแตะ) + ReceiptClosed (สลิปแปะเทป reason-aware)
  + **ReceiptCandidates** (ช่องว่างแผนเดิม — ตาม grammar BlossomCandidates)
  + **home addendum จาก mockup ที่ 2 ของ owner (Fable คัดแล้ว):** รอยฉีกขอบกระดาษ
  เผยชั้นกระดาษเข้มกว่า (ห้ามหินอ่อน — ขัด material honesty), เชือกร้อย grommet
  โยงการ์ดโน้ต→ป้าย CTA, ghost stamp มีรายละเอียดวงแหวน+ตัวอักษรแบบตราจริง;
  **โทนคงอุ่น + ม่วง FMS ตาม lock เดิม** (โทนเย็น/ลาเวนเดอร์ของ mockup = รอ owner
  สั่งเองเท่านั้น)
- **Acceptance R4:** embargo ไม่รั่ว score ก่อน reveal + recharts consts/fills
  untouched + closed ไม่ลิงก์ results ตาม seam + candidates ไม่นับ pseudo-candidate
  เป็นพรรค + ทุกธีม + 390px + fallback + spec `.specs/receipt/R4-RESULTS-CLOSED-CANDIDATES.md`

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
