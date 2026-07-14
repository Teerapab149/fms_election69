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
  + **home addendum จาก mockup ที่ 2 ของ owner (Fable คัดแล้ว):** เชือกร้อย grommet
  โยงการ์ดโน้ต→ป้าย CTA, ghost stamp มีรายละเอียดวงแหวน+ตัวอักษรแบบตราจริง;
  ~~รอยฉีกขอบกระดาษ~~ **CANCELLED** — กระดาษฉีกขาดชนภาพ "ฉีกบัตรเลือกตั้ง"
  (owner ตั้งคำถาม + Fable วิเคราะห์เห็นพ้อง; ฉีกได้เฉพาะตามรอยปรุ — กติกาใหม่ทุก R);
  **โทนคงอุ่น + ม่วง FMS ตาม lock เดิม** (โทนเย็น/ลาเวนเดอร์ของ mockup = รอ owner
  สั่งเองเท่านั้น)
- **Acceptance R4:** embargo ไม่รั่ว score ก่อน reveal + recharts consts/fills
  untouched + closed ไม่ลิงก์ results ตาม seam + candidates ไม่นับ pseudo-candidate
  เป็นพรรค + ทุกธีม + 390px + fallback + spec `.specs/receipt/R4-RESULTS-CLOSED-CANDIDATES.md`
- ✅ **DONE 2026-07-13 `442777f`** — Fable รีวิวผ่าน (dispatch diff อ่านเอง 3 ไฟล์ +
  probe อิสระ: embargo 0 แถว/ไม่มีเลขคะแนน/foil seal จริง + API mask score=0 ต้นน้ำ,
  reveal 3 แถว+winner stamp+3 charts, closed ลิงก์ body = กลับหน้าแรกเท่านั้น
  (ผลคะแนนที่เจอ = topbar nav ชั้น chrome แชร์ทุกหน้า ถูกต้อง), candidates ไม่มี
  pseudo card + editorMode ถอด href ตาม P-LOG-002, ghost textPath จาก meta ไม่มี
  ปี hardcode, เชือก pointer-events none) · จุดแขวน R4.5: ตำแหน่งเชือกผูก grommet
  เป็น fixed offset — จูนสายตาตอน owner ดู

### R5 — Playground/preview/chooser + gate ✅ DONE (ยกเว้น build gate) 2026-07-13
- playground: receipt เข้า TEMPLATES/COMPONENTS ตามแบบ blossom เป๊ะ (party →
  ClassicPartyPreview fallthrough เหมือน blossom) · interact full flow ผ่านทั้ง multi
  (shared modal) + single (booth confirm) → success + secrecy · **เจอ+แก้ P-LOG-085**:
  receipt vote branch ใน renderInteractive อยู่หลัง classic catch-all → ย้ายขึ้นก่อน
  (diff = relocation เท่านั้น — Fable ตรวจ diff เอง)
- **admin chooser: ไม่ต้องแก้โค้ด** — receipt โผล่เป็น "ใบเสร็จ · ม่วง (ทดลอง)" + 4 ชิพ
  + สไลด์หน้าจริง; worker ทดสอบ **apply จริง** (mock admin) → activeTemplateId=receipt
  → ทุกหน้า live เป็น rc-root → **restore กลับ gumroad-bubblegum แล้ว** (Fable ยืนยัน
  อิสระ: หน้า live กลับเป็น gumroad ไม่มี rc-root)
- หมายเหตุ: chooser ORDER array ไม่มี blossom/receipt → ทั้งคู่เรียงท้ายสุด (พฤติกรรม
  เดิมของ blossom ไม่ใช่ bug; owner อยากจัดตำแหน่งค่อยเพิ่ม) · hydration warning
  DeepSeaParticles บน classic party fallthrough = ของเดิม ไม่เกี่ยว R5
- ⏳ **ค้างชิ้นเดียว: pre-deploy build gate** (หยุด server → rm -rf .next → build GREEN
  → smoke) — **owner ต้องหยุด server เอง** แล้วสั่งรันตอนสะดวก
- **Acceptance R5 (เดิม):** click-through ครบทุกหน้า + 4 ธีม probe + 390px overflow 0 ✅
  + pre-deploy gate ⏳ รอ owner

---

## 🎯 MASTER PLAN v2 — Identity & Completion (พิมพ์เขียว session หน้า — เขียน 2026-07-13 ค่ำ)

> **Owner feedback ครบ 4 ข้อ:** (1) เรียบไป (2) party ยังเป็น classic (3) สลับธีมเปลี่ยนแค่
> สีตัวอักษร (4) **layout คล้าย Blossom ไม่ unique** + สั่ง: plan ให้เต็มที่สุด แล้วเริ่ม
> implement **session หน้า** + **BlossomParty ต้องเสร็จด้วย**
> Section R6-R8 ด้านล่างถูก **ดูดรวมเข้า v2 นี้แล้ว** (เลขใหม่ อ่านจากตรงนี้เป็นหลัก)

### 0 · วินิจฉัย "ทำไมเหมือน Blossom" (Fable ตรวจโค้ดจริงทั้งสองไฟล์)
- โครงจริงต่างกัน (Blossom = single-column editorial flow; Receipt = grid ซ้าย-ขวา) แต่
  **DNA ผิวซ้ำกันหมด**: sticky topbar + เส้น hairline เต็มจอ · eyebrow mono uppercase ·
  การ์ดขาวมุมมนบนพื้นกระดาษอ่อน · poster/รูปกลางหน้า · footer บรรทัดเดียวกลาง —
  สองตระกูลพูดภาษา "สิ่งพิมพ์ editorial" เดียวกัน ต่างแค่สำเนียง
- ของที่ Receipt มีแล้วและ **unique จริง** (ต้องดันขึ้นเป็นพระเอก): holo foil · split-flap ·
  ตราปั๊ม semantic · รอยปรุ/die-cut · printer moment (success) · เชือก+grommet · บัตรคิว
- **ยาที่ถูกโรค: เปลี่ยนกระดูก ไม่ใช่เพิ่มเครื่องสำอาง** → composition ใหม่ทั้งตระกูล

### ⚠️ AMENDMENT 2026-07-14 (owner review v2-R1 จริง — บังคับเหนือ §1 เดิม)
- Owner ดู v2-R1 แล้ว: **ม้วนใบเสร็จทั้งหน้า = "หนักข้างทันที" + ใบเสร็จควรเป็นของ
  หน้า success เท่านั้น** → แก้รัฐธรรมนูญ: **tape spine ไม่ใช่โครงสากลทุกหน้า**
- บทบาทวัสดุใหม่: **ใบเสร็จ = นาฬิกา (home: dispenser+สลิปคิว) และใบเสร็จจริง
  (success) เท่านั้น** · เนื้อหาหลัก home = กองกระดาษ+คลิปหนีบ (ภาษา R2.5 ที่ owner
  ชอบ) · ballot (vote) = แผ่นบัตรกระดาษ (ไม่ใช่ใบเสร็จ — คงตามเดิม) · results =
  แถบ tape ยาวได้ (ใบสรุปผล = ใบเสร็จโดยธรรมชาติ ยอมรับได้ แต่ให้ดูน้ำหนักตอน R3b)
- ตัวแยกจาก Blossom ที่เหลือยังบังคับครบ: stub topbar · dispenser hardware ·
  desk scatter/overlap · ตราปั๊ม · flip tiles · grain/วัสดุ · เชือก+grommet
- v2-R1 commit `cf7bc64` = checkpoint ก่อน rebalance; **v2-R1.5 = home rebalance +
  success polish (B4+QR ดึงมาทำเลย)** spec `.specs/receipt/V2-R1.5-REBALANCE.md`

### 1 · รัฐธรรมนูญ composition ใหม่: "TAPE SPINE + DESK SCATTER"
1. **Tape spine** — ใบเสร็จม้วนยาวต่อเนื่องเป็น "กระดูกสันหลัง" ของทุกหน้า: คอลัมน์
   receipt-stock กว้าง ~40-44% วาง **offset ซ้าย/ขวาไม่กลาง** (สลับข้างตามหน้า)
   เนื้อหาหลัก = "ท่อนที่พิมพ์บนเทป" คั่นด้วยแถบรอยปรุจริง (ฉีกตามปรุ — P-LOG-086)
   มือถือ: เทปกลายเป็น full-width (สัดส่วนใบเสร็จจริง) — โครงนี้ไม่มีตระกูลไหนใช้
2. **Dispenser anchor** — หัวเครื่องพิมพ์/ช่องจ่ายบัตร dock บนสุดของเทป (ใต้ topbar):
   ทั้งหน้า = สิ่งที่เครื่องนี้เพิ่งพิมพ์ออกมา (ขยาย signature ของ success ให้เป็นตรรกะ
   ของทั้งตระกูล)
3. **Desk scatter** — ของรอง (โน้ตมะนิลา, โปสเตอร์, ตราปั๊ม, ซีล foil, ต้นขั้ว) วางนอกเทป
   เอียง/เหลื่อม **ทับขอบเทปเสมอ** (overlap = ความจริงของโต๊ะ) แทน grid คู่ขนานแบบเดิม
4. **Topbar เลิก hairline editorial** → "แถบหัวโต๊ะ": โลโก้บนป้ายกระดาษเสียบคลิป, nav เป็น
   ต้นขั้วบัตรเรียงกัน (active = ต้นขั้วถูกฉีกตามปรุ), user chip = บัตรพนักงานหนีบ —
   behaviour/DOM logic เดิมทุกอย่าง เปลี่ยนเฉพาะผิว+รูปทรง
5. **Motion = การพิมพ์** — ท่อนเทปล่างสุด "พิมพ์ออกมา" ตอน scroll เข้า viewport
   (translate-only + base-visible: JS-fail/reduced-motion เห็นเต็มทันที) · ตราปั๊มกดตอน
   select · foil ตอบ pointer — ห้าม fade-gate เนื้อหา (P-LOG เดิมทั้งหมด apply)

### 2 · Composition spec ต่อหน้า — ⭐ ฉบับละเอียดเต็มอยู่ที่ `docs/PLAN-RECEIPT-V2-PAGES.md`
> (วิเคราะห์จากภาพจริงทุกหน้า + spec ราย element + motion + mobile + verify ต่อหน้า +
> ตารางลำดับ v2-R1..R7 พร้อมงบ worker — worker ทุกตัวอ่านไฟล์นั้นก่อนเริ่ม R ของตัวเอง)
> สรุปย่อด้านล่างคงไว้เพื่อ orientation:
- **Home:** dispenser → เทปพิมพ์ [บัตรคิว countdown] → [ประกาศ/ชื่องาน] → [register
  turnout] → CTA = ป้าย tag ห้อยเชือกออก **นอกขอบเทป**; โน้ตมะนิลา+โปสเตอร์+ephemera
  scatter รอบเทป; ghost stamp ทับมุมเทป
- **Vote multi:** เทปกว้างขึ้นเป็นบัตรลงคะแนน (ท่อนเดียวยาว) แถวพรรคพิมพ์บนเทป,
  tray ยืนยัน = ต้นขั้วรอฉีกท้ายเทป (มีอยู่แล้ว — ยกเข้าตรรกะเทป)
- **Vote single:** โต๊ะประทับตรา — บัตรพรรคเต็มใบวางกลาง, ตราปั๊ม 3 อันวางเป็น "ของจริง
  บนโต๊ะ" ข้างแท่นหมึก (ไม่ใช่ 3 การ์ดเรียงแบบตอนนี้)
- **Success:** คงเดิม (unique อยู่แล้ว) + ผูกเข้า dispenser เดียวกับ home
- **Results:** เทป = แถบผลคะแนนยาว (มีแล้ว) — จัดเข้า spine + ผนึก SEALED คาดขวางเทป
- **Candidates:** เทป index รายชื่อพรรค + ใบปลิว scatter สองข้างเทป
- **Party (ใหม่):** แฟ้ม dossier เปิดวาง **ทับ** เทปที่พิมพ์ index ประวัติ — spec เดิม R6 ล่าง
- **Closed:** สลิปแปะเทปกลางโต๊ะ (หน้าเดียวที่ spine สั้น — จงใจให้เงียบ)

### 3 · ลำดับงาน (เลขใหม่ v2 — ทำตามลำดับ ทีละ R ต่อ session ได้)
| R | งาน | หมายเหตุ |
|---|---|---|
| **v2-R1** | **Home recompose** เป็น tape-spine + desk-scatter + topbar ใหม่ | หน้าอ้างอิงของโครงใหม่; logic seams ห้ามแตะ; Playwright shot ทุกธีม×2 viewport |
| **v2-R2** | **Tinted paper themes** (ธีมละโต๊ะ: ครีม/ฟ้าเช้า/งาช้างแดด/sage) | แก้ receiptPalettes ไฟล์เดียว + contrast gate 4×3 + chroma ต่ำคุม "ยังเป็นกระดาษ" |
| **v2-R3** | **Propagate โครงใหม่**: vote multi/single → results → candidates → closed → success (เบา) | ทีละหน้า commit แยก; แต่ละหน้า verify ครบชุด |
| **v2-R4** | **ReceiptParty** แฟ้ม dossier (ภาษาโครงใหม่) + ถอน classic fallthrough ฝั่ง receipt | ตาม spec R6 เดิมล่าง + hydration warning classic หายเอง |
| **v2-R5** | **Richness pass** (แก้ "เรียบไป") + เก็บตก R4.5: emboss opacity, จุดผูกเชือก, "SAMO 50 · 0002" spacing, queue-slip done-state, chooser ORDER | owner-guided ทีละหน้า |
| **v2-R6** | **BlossomParty** (ตระกูล Blossom — worker แยก อ่าน PLAN-BLOSSOM-AWWWARDS ก่อน) | ภาษา blossom ไม่ใช่ receipt; dispatch party/page.js + ถอน fallthrough ฝั่ง blossom; แก้ hydration warning เดิมไปในตัว |
| **v2-R7** | **Gate ปิดท้าย**: chooser ครบ 9 สไลด์จริง + interact full-flow + build gate (owner หยุด server เอง) | + Playwright screenshot ครบทุกหน้า×4 ธีม เป็นหลักฐานส่งมอบ |

### 4 · Workflow มาตรฐาน (อัปเดตจากบทเรียน session นี้)
- Fable = advisor/reviewer · Opus 4.8 subagent = worker ต่อ R · ห้าม commit จน Fable
  รีวิว raw outputs + probe อิสระ · ห้ามแตะ :3000 (worker server pin :56989 แล้ว)
- **Screenshot ใช้ Playwright ได้แล้ว** (สคริปต์ต้นแบบ: scratchpad `shot-receipt.js` —
  require playwright จาก node_modules โปรเจกต์ตรงๆ) → ทุก R ต่อจากนี้ **แนบภาพจริง**
  ไม่ใช่ probe อย่างเดียว; ระวัง artifact: bg fixed ไม่ตามใน fullPage capture
- worker ชน session limit → SendMessage resume จาก transcript เดิม (พิสูจน์แล้วใช้ได้)
- กติกาแข็งเดิมทั้งหมด (base-visible / semantic / getPath / ไทยไม่ลงท้าย "." / 390px /
  editorMode guards / ห้าม torn edge — ฉีกตามปรุเท่านั้น) apply ทุก R

### 5 · คำถามเปิดถึง owner — ✅ ตอบครบ 2026-07-14 (LOCKED)
- **Q1 เทป = เยื้องซ้าย** (owner มอบ Fable ตัดสิน) · **Q2 topbar ต้นขั้ว = แบบกล้า**
  (owner มอบ Fable) · **Q3+Q4 = อนุมัติ**: 4 ธีมต่างแบบ "เนื้อกระดาษอุ่น/เย็น" ไม่ใช่
  สีจัดตัดกัน → lineup: ม่วง FMS/ครีมอุ่น (default) · หมึกน้ำเงิน/ขาวเย็น ·
  ครามทะเล/สำเนาฟ้า · สำเนาถ่านดำ/เทา — ยุบเหลือง+เจดตาม forbidden-zone rule
- **Owner สั่งเริ่ม implement ทันที 2026-07-14** (ไม่รอ session ใหม่) — v2-R1 เริ่มแล้ว

(คำถามเดิมด้านล่างเก็บเป็นบันทึก)
1. เทป spine offset ซ้ายหรือขวาบนหน้า home (Fable แนะนำ**ซ้าย** — สายตาไทยอ่าน
   ซ้าย→ขวา ให้ scatter/CTA อยู่ขวา)
2. topbar แบบ "ต้นขั้วบัตร nav" กล้าพอไหม หรือเอาแบบกลางๆ ก่อน (Fable แนะนำ**กล้า** —
   นี่คือจุดที่ฆ่าความเหมือน Blossom ได้เยอะสุดรองจาก spine)
3. ธีมฟ้า/เจด โทนกระดาษเย็นลงเล็กน้อยโดย "ครีมอุ่น" เป็นแค่ธีมม่วง default — โอเคไหม
   (lock เดิมบอกกระดาษอุ่น; v2-R2 ตีความว่า lock = default ไม่ใช่ทุกธีม)
4. **Theme lineup ใหม่ (จาก ADDENDUM+ruling):** กฎ forbidden-zone จับได้ว่าเจด
   ชนโซนเขียว semantic และเหลืองเฉียดโซนส้ม → Fable เสนอ 4 ธีมใหม่: ม่วง FMS
   (default คงเดิม) · หมึกน้ำเงิน 262 · ครามทะเล 210 · สำเนาถ่านดำ achromatic —
   ยุบเหลือง+เจดทิ้ง โอเคไหม หรือให้เก็บโดยขยับ hue หนีโซน (ไม่ตอบ = ใช้ lineup ใหม่)

> **ADDENDUM บังคับอ่าน:** `docs/ADDENDUM-RECEIPT-V2-PERF-THEME.md` (perf gates /
> theme token 2 ชั้น / ฉากหย่อนหีบ / QR / mono rule) — **พร้อมส่วน FABLE IN-REPO
> RULING ท้ายไฟล์** ที่แก้ 4 จุดซึ่ง advisor รอบนอกไม่เห็นโค้ดจริง (Lighthouse →
> build gate เท่านั้น · A8 ลง palette chain เดิมห้ามสร้าง data-theme ใหม่ ·
> lineup ธีมต้องคงม่วง FMS default · backdrop-filter topbar ต้องถอนใน v2-R1)

### PROMPT เปิด session หน้า (คัดลอกได้เลย)
```
อ่าน docs/PLAN-RECEIPT.md ตั้งแต่ "MASTER PLAN v2" → CONCEPT-RECEIPT-TEMPLATE.md
→ CLAUDE.md Engineering Discipline แล้วเริ่ม v2-R1 (Home recompose: tape spine +
desk scatter + topbar ใหม่) — Fable advisor + Opus worker ตามเดิม, screenshot ด้วย
Playwright ทุกรอบ, ห้ามแตะ :3000, commit หลัง Fable รีวิวเท่านั้น
ตอบคำถามเปิด §5 ของผม: (1)... (2)... (3)...
```

---

## 🆕 R6-R8 — Owner feedback round 2026-07-13 ค่ำ (จากการดู chooser จริง — ถูกดูดเข้า v2 แล้ว อ่านเฉพาะ spec รายละเอียด R6/R7/R8 ที่ v2 อ้างถึง)

> Owner feedback 3 ข้อ: (1) โดยรวม **เรียบมาก มากไปด้วย** (2) **หน้า party ยังไม่เปลี่ยน**
> (สไลด์ 3/9 โชว์ classic fallthrough) (3) **สลับธีมแล้วเปลี่ยนแค่สีตัวอักษร** อยากให้
> เปลี่ยนทั้งหน้าแบบ template อื่น — สถานะ: **แผนเขียนแล้ว รอ owner เคาะก่อนลงมือ**

### R6 — ReceiptParty "แฟ้มประวัติพรรค" (ปิดช่อง classic fallthrough)
- **คอนเซปต์:** หน้า party = **แฟ้มเอกสารพรรค (dossier)** เปิดวางบนโต๊ะ — hero เป็น
  ปกแฟ้มกระดาษแข็ง + แถบ index tab + ตราปั๊มหมายเลขพรรค + logo; สมาชิก = บัตร
  ประจำตัวพิมพ์/รูปแปะเทปเรียงใน grid; นโยบาย = คูปองรอยปรุฉีกได้ทีละใบ (ฉีกตามปรุ
  เท่านั้น — P-LOG-086); วิสัยทัศน์ = จดหมายพิมพ์บนหัวกระดาษพรรค; แถบ foil ที่สัน
  แฟ้ม = ลายเซ็นตระกูล
- **Seam:** ไฟล์ใหม่ `src/components/vote/ReceiptParty.js` + dispatch ใน
  `party/page.js` ตามแบบ GumroadParty/VerdureParty เป๊ะ (props: party,
  galleryImages, showBackToVote) + ถอน receipt ออกจาก blossom-style classic
  fallthrough ใน template-playground/template-preview → ชี้ ReceiptParty
  (สไลด์ chooser อัปเดตเองอัตโนมัติ) — Blossom ไม่แตะ (ของเขาเป็น by-design)
- **Acceptance:** ทุกธีม + 390px + ไม่มี auth logic ในตัว component + PartyTheme.js
  ห้ามแตะ + hydration warning ตัวเก่า (DeepSeaParticles) หายไปเองเพราะเลิกใช้ classic

### R7 — Theme depth: "เปลี่ยนธีม = เปลี่ยนโต๊ะทั้งตัว" (tinted paper system)
- **วินิจฉัยจากสถาปัตย์:** ปัจจุบัน desk/deskShade/receipt/note/line เป็น **ค่าคงที่
  ข้ามธีม** (by design เดิม — "ink/card constant" กันคอนทราสต์เพี้ยน) เหลือแค่
  accent+holoShift หมุนต่อธีม → ตาสัมผัสจึงเห็นแค่ "สีตัวหนังสือเปลี่ยน" ตามที่ owner ว่า
- **ทางแก้:** ทำ **กระดาษย้อมโทนต่อธีม** — ธีมละ "โต๊ะ" ของตัวเอง โดย **ink คงที่เดิม**
  (รักษาบทเรียนคอนทราสต์) และ semantic โหวต/holo ramp คงที่:
  - ม่วง (default) — ครีมอุ่นเดิม `#F7F4EE` / โน้ตมะนิลา `#F5EDDA`
  - ฟ้า — กระดาษเทา-ฟ้าเช้าตรู่ ~`#F0F3F7` / โน้ตฟ้าซีด ~`#E9EFF7`
  - เหลือง — งาช้างอาบแดด ~`#F9F3E1` / โน้ตฟางเข้ม ~`#F6ECC9`
  - เจด — กระดาษ sage ~`#EFF4EE` / โน้ต celadon ซีด ~`#E7F0E5`
  - ต่อธีมยังย้อม: deskShade / receiptEdge / line / stampLine (derived จาก desk
    โทนเดียวกัน) + receipt stock ขยับได้เล็กน้อย (~1-2 จุด hue ห้ามหลุด near-white)
- **จุดแข็งของสถาปัตย์เรา:** ทุกอย่างไหลผ่าน `--rc-*` อยู่แล้ว → **แก้ค่าที่
  receiptPalettes.js ไฟล์เดียว** (makeTheme รับ per-theme paper set) ที่เหลือ
  ReceiptTheme/builtIn/injector รับไปเอง ไม่ต้องแตะ component ใดเลย
- **Gate แข็ง:** ink2 บน desk+note+receipt ของทุกธีม ≥4.5:1 (คำนวณจริง paste ตัวเลข
  ครบ 4×3 ค่า) · semantic โหวต (เขียว/แดง/ส้ม) ตรวจบนกระดาษย้อมทุกโทน · chooser
  ชิพ 4 สีอัปเดตสะท้อนโต๊ะจริง · parity preview=live byte-for-byte เหมือนเดิม
- **เสี่ยงที่ต้องระวัง:** ย้อมแรงไป = หลุด "กระดาษ" กลายเป็น "หน้าจอสี" — คุม chroma
  ต่ำ (โทนกระดาษจริง ไม่ใช่ pastel UI) + Fable image-review ก่อน commit

### R8 — "Dress the desk 2" — richness pass แก้ "เรียบไป" (ทำหลัง R7)
- **หลัก:** เพิ่มความแน่นแบบ curated (เสา 1 ของ concept) ไม่ใช่รก — เติม "ของบนโต๊ะ"
  และ "ร่องรอยการใช้งาน" ให้ทุกหน้า:
  - Home: เติมคอลัมน์ซ้ายใต้ hero (ตรายาง+แท่นหมึก / ใบเสร็จม้วนงอ / คลิปเสียบ
    กองเอกสาร) + queue ticket สถานะปิดหีบให้มีเนื้อขึ้น + เส้นคั่น section เป็นแถบรอยปรุ
  - Vote: หัวบัตรเพิ่ม watermark band + เลขบัตรจัด spacing ("SAMO 50 · 0002") +
    ephemera ขอบโต๊ะ
  - Candidates: ใบปลิวเพิ่มเทป/มุมพับ/ตราปั๊มวันที่
  - Results/Closed/Success: grain กระดาษจางๆ (SVG feTurbulence data-URI คุม
    ขนาด+perf) + ตราปั๊มประปราย
  - ทุกหน้า: มือถือคงความสงบ (density เพิ่มเฉพาะ ≥900px เป็นหลัก)
- **โหมดทำงาน:** ทีละหน้าแบบ R4.5 (owner ดู chooser → feedback → เก็บ) — เริ่มจาก
  home เป็น reference density แล้วไล่ทั้งตระกูล

**ลำดับแนะนำ:** R6 (ช่องโหว่ที่เห็นชัดสุด) → R7 (ไฟล์เดียว impact ทั้งระบบ) → R8
(ต้องเห็นโทนสุดท้ายจาก R7 ก่อนถึงจูน density ถูก) — R6+R7 autonomous ได้,
R8 = owner-guided

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
