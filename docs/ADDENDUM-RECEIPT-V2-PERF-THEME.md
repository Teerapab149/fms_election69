# ADDENDUM-RECEIPT-V2 — PERF · THEME · NARRATIVE (ส่งรวม MASTER PLAN v2)

> เขียน 2026-07-14 โดย Claude (advisor รอบนอก) หลังวิเคราะห์ PLAN-RECEIPT-V2-PAGES.md ครบทุกหน้า
> เจตนา: **เติม ไม่รื้อ** — §A1-A6 และ spec ต่อหน้า B1-B8 เดิมคงไว้ทั้งหมด
> ไฟล์นี้เพิ่ม §A7-A10 + ระบุจุด conflict กับของเดิมชัดเจนให้ Fable ตัดสิน
> บริบทจาก owner: เว็บใช้ปีละครั้ง, voter จริง 1,600+ คน, device หลากหลายรวมเครื่องอ่อน,
> ห้ามใครเจอกระตุก, และต้องเป็น color-shifting template 4 ธีมเพื่อลดความซ้ำรายปี

---

## ⚠ จุด conflict กับ spec เดิม (Fable ตัดสินก่อน worker แตะ)

| # | ของเดิม | ข้อเสนอใหม่ | เหตุผล |
|---|---|---|---|
| C1 | A4: grain = SVG feTurbulence data-URI runtime | A7.2: static alpha tile (build-time) | ตัดต้นทุน rasterize บนเครื่องอ่อนเป็นศูนย์ ตาเปล่าแยกไม่ออก |
| C2 | A6: barcode **ref-only** | A10.2: QR จริง (สแกน+กดได้) เฉพาะใบเสร็จ success | เชื่อมฟอร์มประเมิน — function จริง ไม่ใช่ตกแต่ง |
| C3 | B2 tray: "ฉีกต้นขั้วเพื่อยืนยัน" | A9.2: ยืนยัน = หย่อนบัตรลงหีบ (metaphor ตาม vision owner) | ต้นขั้ว = ภาษาของ nav/CTA รอง; โมเมนต์ยืนยันโหวตต้องเป็น "หย่อนหีบ" ตามการเลือกตั้งจริง |
| C4 | ไม่ได้ระบุ | A10.3: บรรทัด mono = Latin/ตัวเลขเท่านั้น | กัน fallback font ไทยพังกลางบรรทัด |

---

## §A7 · PERFORMANCE (ระบบร่วม — บังคับทุกหน้า ทุก R)

หลักคิด: ความสวยของ theme นี้เป็นของ**นิ่ง** (texture/composition/typography) — paint ครั้งเดียวจบ
ศัตรูจริงคือ JS main thread กับ paint-heavy effects ไม่ใช่ CSS transform

### A7.1 กติกา animation (เหล็ก — code review gate)
- Animate ได้เฉพาะ `transform` และ `opacity` — ห้าม width/height/top/left/margin
- **ห้าม `backdrop-filter` ทุกกรณี** (รวมเทปโฮโล — ใช้ gradient + opacity แทน)
- ห้าม scroll listener — ใช้ IntersectionObserver, ทุก reveal fire **ครั้งเดียว** แล้ว disconnect
- ห้าม animation library (framer-motion ฯลฯ) — CSS transition/animation ล้วน
- Concurrent motion บนจอ ≤3 ชิ้น (สอดคล้อง B6 "hover ≤2 ชิ้น" เดิม)
- ห้าม `will-change` ค้างถาวร — ใส่ก่อน animate ถอนหลังจบ (กัน memory เครื่อง RAM ต่ำ)

### A7.2 Grain (แทน A4 เดิมบางส่วน — ดู C1)
- Pre-render grain เป็น **PNG/WebP tile 128×128 alpha-only** (ดำโปร่งใส opacity ≤0.02)
  ตั้งแต่ build time → `background-repeat` — ไฟล์เดียว ~2KB ใช้ทุกผืนกระดาษ ทุกธีม ทุก device
- Alpha-only สำคัญ: สีกระดาษ (--paper-tint ต่อธีม) โผล่ทะลุเอง — grain ไม่ต้องมี 4 เวอร์ชัน
- ผล: มือถือไม่ต้อง "ปิด grain ถ้า perf ตก" อีกต่อไป — ทุกคนได้เท่ากัน

### A7.3 ของเคลื่อนไหวถาวร
- Split-flap countdown (B1 T2): flip ด้วย transform เท่านั้น + **หยุดเมื่อ tab ซ่อน**
  (`visibilitychange`) + tick ด้วย rAF-aligned interval ไม่ใช่ setInterval ถี่
- เชือกแกว่ง/LED กะพริบ: CSS animation, `animation-play-state: paused` เมื่อ reduced-motion

### A7.4 เงา + วัสดุ (เสริม A4)
- เงา ≤2 ชั้นต่อชิ้น (contact 1-2px + ฟุ้ง 1 ชั้น), blur radius ≤24px
- ของ scatter ทุกชิ้น = CSS/SVG ล้วน **ห้ามไฟล์รูป** (ยกเว้นโลโก้พรรค/รูปทีมที่เป็นเนื้อหาจริง)
- รูปเนื้อหาจริง: `loading="lazy"` + ระบุ width/height เสมอ (คู่กับกติกา CLS=0)

### A7.5 JS budget ต่อ route (gzip)
- หน้า vote (multi+single): **≤150KB** — หน้าศักดิ์สิทธิ์สุด ห้ามมีอะไรที่ไม่ใช่การโหวต
- หน้าอื่น: ≤200KB
- Recharts: `next/dynamic` เฉพาะ results — probe ว่าไม่รั่วเข้า shared chunk
- ฟอนต์: Chakra Petch + mono รวม ≤2 family, subset thai+latin, `font-display: swap`,
  preload เฉพาะ weight ที่ใช้จริง

### A7.6 Tiering — "ทุกคนได้ experience เดียวกัน" แปลว่า:
- **เหมือนกัน 100%:** layout, เนื้อหา, ทุก function, ความสวยแบบนิ่งทั้งหมด (กระดาษ เงา
  ตราปั๊ม grain ปรุ) — เพราะ A7.2 ทำให้ static visual ถูกพอสำหรับทุกเครื่องแล้ว
- **ลดหลั่นได้เฉพาะ motion:** `prefers-reduced-motion` → ทุก motion ปิด เห็น state สุดท้ายทันที
- base-visible (กติกาเดิม) ยกเป็น **gate จริง**: ปิด JS แล้วทุกหน้าอ่านครบ โหวตไม่ได้แต่รู้ว่า
  เกิดอะไรขึ้น + ไม่มี layout โหว่

### A7.7 Verify gate ใหม่ (เพิ่มเข้าสูตร Task-0 → Playwright → Fable รีวิว เดิม)
- Lighthouse CI ที่ **CPU throttle 4x**: LCP <2.5s, CLS = 0, TBT <300ms — ทุก route, fail = block commit
- Smoke test เครื่อง Android จริงระดับกลาง-ล่าง 1 เครื่องบนหน้า home+vote ก่อน v2-R7 gate
- Playwright เพิ่ม probe: ไม่มี `backdrop-filter` / ไม่มี scroll listener / recharts ไม่อยู่ใน
  chunk ของหน้า vote

---

## §A8 · THEME SYSTEM — color shifting 4 ธีม (เข้า v2-R2 "ไฟล์เดียว+gate" พอดี)

หลักคิด: theme กระดาษ hue-rotate ทั้งจอไม่ได้ — "กระดาษต้องเป็นกระดาษ หมึกต้องเป็นหมึก"
แบ่ง token 2 ชั้นเด็ดขาด

### A8.1 ชั้น Physical — ล็อกตาย ทุกธีมห้ามแตะ
- หมึกพิมพ์ thermal (ดำ/เทาเข้ม), เงา, grain, รอยปรุ, ริมกระดาษ receiptEdge, มุมตัด
- **สี semantic โหวต เขียว/แดง/ส้ม (รับรอง/ไม่รับรอง/งดออกเสียง) คงที่ทุกธีมทุกปี** —
  ตรงกติกา R3 เดิม; นี่คือ integrity ของระบบเลือกตั้ง ไม่ใช่เรื่องความสวย
- LED เครื่องจ่าย (เขียว/เหลือง/แดง) = semantic เช่นกัน — ล็อก

### A8.2 ชั้น Theme — ตัวแปรต่อธีมมีแค่ 5 ตัว
```css
[data-theme="t1"] {
  --accent:      oklch(0.45 0.12 262);  /* หมึกตราปั๊ม/CTA */
  --accent-deep: oklch(0.33 0.12 262);  /* ตัวอักษรบน accent อ่อน */
  --paper-tint:  oklch(0.97 0.008 262); /* สีเนื้อกระดาษเทป */
  --desk:        oklch(0.90 0.015 75);  /* พื้นโต๊ะ (โทนอุ่นคงที่หรือขยับเบา) */
  --seal:        oklch(0.62 0.10 262);  /* ซีล foil/เทปโฮโล tint */
}
```

### A8.3 ทุกเฉดย่อย = derivative — ห้าม define มือ
ทุกจุดที่ spec เดิมอ้าง "accent 8% / 5% / 4% / 30% / 55%" ให้คำนวณจากตัวแม่:
```css
.rc-nav-active   { background: color-mix(in oklch, var(--accent) 8%, transparent); }
.rc-row-selected { background: color-mix(in oklch, var(--accent) 5%, transparent); }
/* palette กราฟ results: accent / accent-deep / accent 55% / accent 30% — สูตรเดียว 4 ธีม */
```
- ธีมใหม่ในอนาคต = เพิ่ม 5 บรรทัด จบ ไม่แตะ component
- **กติกาเหล็ก: ห้ามมี theme logic ใน JSX** (`theme === 'x' ? :` = แบน) — ธีมมีตัวตน
  เฉพาะใน CSS custom properties; ไม่งั้น 4 ธีมกลายเป็นโค้ด 4 ชุดให้ debug

### A8.4 การเลือก 4 hue — ล็อก L/C เปลี่ยนแค่ H
สีที่ Lightness/Chroma เท่ากันใน oklch ให้ contrast บนกระดาษเท่ากันโดยคณิตศาสตร์ —
สลับธีมแล้ว contrast ไม่มีวันพังเอง ข้อเสนอ 4 ธีม (accent L 0.45 / C 0.12 คงที่):

| ธีม | ชื่อเล่น | Hue | คาแรกเตอร์ |
|---|---|---|---|
| t1 | หมึกน้ำเงิน (ink blue) | 262 | ปากกาหมึกซึมราชการ — ปีแรก ปลอดภัยสุด |
| t2 | ม่วงคราม (indigo-violet) | 300 | ตราประทับไปรษณีย์เก่า |
| t3 | ครามทะเล (teal-navy) | 210 | สำเนา carbonless ฟ้า |
| t4 | เลือดหมู (plum) | 345 | ตรายางหมึกแดงเลือดหมูโบราณ |

- **โซนต้องห้าม**: hue ±30° รอบ semantic (เขียว ~145 / แดงสด ~27 / ส้ม ~65) —
  ทั้ง 4 ค่าข้างบนพ้นโซนแล้ว; t4 (345) ใกล้แดงสุด → เพิ่ม probe เทียบข้างตราแดง semantic
  ใน verify (แยกกันด้วย L/C ที่ต่างชัด แต่ต้องพิสูจน์ด้วยภาพ)
- --paper-tint ต่อธีม = ความสมจริงฟรี: ใบเสร็จ/สำเนา carbonless จริงมีขาว ชมพู เหลือง
  ฟ้าอ่อน — ปีนี้ "ม้วนขาวหมึกน้ำเงิน" ปีหน้า "สำเนาฟ้าหมึกคราม" ความรู้สึกใหม่ทั้งระบบ
  จาก token 5 ตัว

### A8.5 กลไกสลับ — ต้นทุน runtime ศูนย์
- ธีม = `data-theme` attribute เดียวบน `<html>` — stylesheet เดียว ไม่โหลด CSS เพิ่ม
  ไม่ re-render React
- **ต้อง set จาก server ตอน SSR** (อ่าน config admin จาก DB — เข้าโครง Controlled
  Flexibility เดิม): ห้ามเกิด flash ธีมผิดแวบแรกเด็ดขาด
- Admin เปลี่ยนธีม = field เดียวใน settings — ไม่มี deploy

### A8.6 Verify (เข้า gate v2-R2 เดิม)
- Contrast probe อัตโนมัติ: ทุกคู่ text/พื้น ที่ derive จาก accent ต้องผ่าน WCAG AA ทั้ง 4 ธีม
- Probe "t4 ข้างตราแดง semantic" (A8.4)
- Playwright shots 4 ธีม × 2 viewport (มีอยู่แล้วใน spec เดิม — คงไว้)
- grep gate: ไม่มี hex/oklch hardcode ใน component นอกไฟล์ theme เดียว

---

## §A9 · MOTION BUDGET + ฉากหย่อนหีบ

### A9.1 หลัก: ไม่มี page transition ทั่วระบบ
ทุก navigation = instant ความเร็วคือ luxury ที่แท้จริงบนเครื่องอ่อน — เก็บ motion budget
ทั้งหมดไปลงฉากเดียวที่ user เจอครั้งเดียวต่อปี:

### A9.2 ฉากหย่อนบัตรลงหีบ (vote → success) — signature moment ที่สองคู่กับโต๊ะประทับตรา B3
Metaphor ตาม vision owner: โชว์บัตร (login) → กาในคูหา (vote) → **หย่อนหีบ** → รับใบเสร็จ (success)
- Sequence (~900ms รวม, transform/opacity ล้วน):
  1. กดยืนยันใน tray → บัตร (ท่อนเทปที่กาแล้ว) พับครึ่ง (scaleY + shadow) ~250ms
  2. เลื่อนลงช่อง slot หีบที่โผล่ขึ้นล่างจอ (translateY + clip) ~400ms
  3. ตัดเข้า success — เครื่องพิมพ์เริ่มพิมพ์ใบเสร็จ (ต่อ printer moment เดิมของ B4 ที่ห้ามรื้อ)
- **Optimistic timing**: ยิง API บันทึกโหวต *ก่อน* เริ่ม animation — 900ms กลบ network latency
  พอดี = ได้ทั้งอารมณ์และความเร็วรับรู้; ถ้า API fail ระหว่างเล่น → หยุด, บัตรเด้งกลับ, error
  บนสลิปแดง (ห้ามโหวตหายเงียบ)
- Fallback: reduced-motion / JS-fail → ข้ามไป success ทันที; ผลโหวตต้องบันทึกสำเร็จ
  ไม่ขึ้นกับ animation ทุกกรณี (animation = ชั้นเปลือกแท้ๆ)
- แทนที่ผิว "ฉีกต้นขั้วเพื่อยืนยัน" ของ B2 tray (ดู C3) — ต้นขั้วยังใช้กับ nav/CTA รองตาม A3 เดิม

### A9.3 เสียง (R5 owner-guided — optional)
เสียงพิมพ์ thermal ตอนใบเสร็จออก · thunk ตราปั๊ม B3 · กระดาษเลื่อนลงหีบ A9.2 —
mute by default, toggle จิ๋วบน dispenser, ไฟล์รวม ≤50KB, ไม่โหลดจนกว่าจะเปิด

---

## §A10 · NARRATIVE GAPS — อุด metaphor ให้ครบวงจรเลือกตั้งจริง

### A10.1 โมเมนต์ login "ยื่นบัตรให้เจ้าหน้าที่"
ฉากเปิดของ metaphor ที่ยังไม่มี spec ถ้า auth เป็น SSO redirect ให้ทำ framing รอบ redirect:
- ก่อน redirect: หน้า/แผงเล็ก "เคาน์เตอร์เจ้าหน้าที่" — บัตรคล้องคอ (ภาษา A3 เดิม) เสียบเข้า
  เครื่องอ่าน + ข้อความ mono "กำลังตรวจสอบสิทธิ์..."
- หลังกลับมา: สลิปจิ๋ว "ตรวจสอบแล้ว ✓ เชิญเข้าคูหา" ~800ms แล้วเข้า vote
  (ข้ามได้, reduced-motion = ไม่มี)
- ห้ามแตะ auth logic ใดๆ — เป็นผิว UI รอบ NextAuth flow เดิมเท่านั้น

### A10.2 QR จริงบนใบเสร็จ success (ขอ exception จาก A6 — ดู C2)
- QR encode ลิงก์ฟอร์มประเมิน: กดบนจอได้ + สแกนจากเครื่องอื่นได้จริง — ตอบโจทย์
  "ปุ่มฟอร์มที่ยังคิดไม่ออก" ของ owner ด้วยของที่อยู่บนใบเสร็จจริงอยู่แล้ว
- Render เป็น SVG (ไม่ใช่รูป), หมึกดำ thermal, มี label mono ใต้ QR "สแกนเพื่อประเมิน
  การใช้งาน"; **ห้าม encode ข้อมูล voter ใดๆ ใน QR** — ลิงก์ฟอร์มเปล่าเท่านั้น
  (กติกา secrecy ของ B4 เดิมคุมต่อ)
- A6 อัปเดตเป็น: "barcode ref-only · QR ใช้งานจริงเฉพาะใบเสร็จ success"

### A10.3 กติกา mono × ภาษาไทย (ดู C4)
- บรรทัด mono ทุกจุด = **Latin/ตัวเลข/สัญลักษณ์เท่านั้น** (`SAMO 3 · VOTE`, `No. 0042`)
- ข้อความไทยในบรรทัดเดียวกัน = Chakra Petch เสมอ ผสมแบบตั้งใจ (`ท่อนที่ 02` →
  "ท่อนที่" Chakra / "02" mono) — ห้ามปล่อยไทยตกลง fallback ของ font mono
- เพิ่ม probe: grep ข้อความไทยใน element ที่ class mono

---

## Map เข้า master v2 (ไม่เพิ่ม R ใหม่ — สอดเข้าของเดิม)

| ของใหม่ | เข้า R | หมายเหตุ |
|---|---|---|
| §A7 ทั้งหมด | v2-R1 (วางกระดูก) + gate ทุก R ถัดไป | A7.7 เพิ่มเข้าสูตร verify เดิม |
| §A8 ทั้งหมด | v2-R2 (tinted themes เดิม) | ตรง scope "ไฟล์เดียว+gate" พอดี |
| A9.2 หย่อนหีบ | v2-R3a (VOTE) + จุดต่อ B4 | B4 ยังห้ามรื้อ — ต่อหัว sequence เท่านั้น |
| A10.1 login | v2-R5 (richness/owner-guided) | ผิวรอบ auth — ความเสี่ยงต่ำ ทำท้ายๆ ได้ |
| A10.2 QR | v2-R3c (SUCCESS) | แก้ A6 ก่อนใน v2-R1 |
| A10.3 mono | v2-R1 | เป็นกติการะบบร่วม |
| A9.3 เสียง | v2-R5 | optional สุดท้าย |

ทุกขั้นคงสูตรเดิม: Task-0 audit → ทำ → Playwright (+ Lighthouse 4x ใหม่) → Fable รีวิว →
commit → checkpoint

---

# ✅ FABLE IN-REPO RULING (2026-07-14 — คำตัดสินหลังเทียบโค้ดจริง; worker อ่านส่วนนี้ก่อนใช้ addendum)

## คำตัดสิน conflict C1-C4
- **C1 grain static tile — ACCEPT.** สร้าง PNG alpha tile ครั้งเดียวใน v2-R1 (gen ผ่าน
  สคริปต์+Playwright rasterize แล้ว commit ลง public/images/receipt/) — ยกเลิกวิธี
  feTurbulence runtime ใน §A4/PLAN-V2-PAGES
- **C2 QR จริงบน success — ACCEPT มีเงื่อนไข:** encode `SystemConfig.googleFormUrl`
  จาก config เท่านั้น (schema มี field นี้อยู่แล้ว) · lib QR ต้อง dynamic-import เฉพาะหน้า
  success (นับเข้า budget A7.5) · **ปุ่มประเมินเดิมห้ามลบ** (QR = สแกนจากเครื่องอื่น,
  ปุ่ม = กดบนเครื่องเดียวกัน) · ห้ามข้อมูล voter ใน QR ตามที่เขียน
- **C3 หย่อนบัตรลงหีบ — ACCEPT + โน้ต seam:** จุดต่อ = `vote/page.js onConfirmVote`
  หลัง shared modal คืนคำตอบ (modal เองห้ามแตะเหมือนเดิม) · ต้องเคารพ `isRedirecting`
  lock · **ephemeral + soft router.push ของ receipt คงเดิมทุกกรณี** (ฉากเล่นก่อน push)
  · "ยิง API ก่อน animation" = ตรง flow ปัจจุบันอยู่แล้ว (await submitVote → จึงเริ่มฉาก
  ระหว่างรอ ให้เริ่มฉากพร้อม fire แล้ว hold เฟรมสุดท้ายจน resolve) · ฉากต้องเล่นทั้ง
  เส้น multi และ single-booth · preview interact เล่นฉากเดียวกัน (client-side ล้วน)
- **C4 mono Latin-only — ACCEPT.** ข้อเท็จจริงจากโค้ด: Space Mono ไม่มี glyph ไทย —
  ไทยใน .rc-*ที่เป็น mono ทุกวันนี้ตกลง fallback อยู่แล้วโดยไม่ตั้งใจ; กฎนี้คือ formalize
  ของจริง ทำใน v2-R1 ทั้งตระกูล

## แก้ไข 4 จุดที่ addendum ไม่เห็นโค้ดจริง
1. **A7.7 Lighthouse/bundle gate ต่อ commit — ทำไม่ได้ระหว่าง session:** การวัด
   ต้อง `npm run build` ซึ่งห้ามรันตอน dev server ทำงาน (กติกา owner) → **ย้าย
   Lighthouse 4x + bundle budget ไป v2-R7 build gate** (ตอน owner หยุด server);
   ระหว่างทางใช้ static probes แทน (grep: ไม่มี backdrop-filter / scroll listener /
   animate นอก transform+opacity / recharts import อยู่เฉพาะ results) — บังคับทุก R
2. **A8.5 กลไก [data-theme] บน <html> + SSR — REJECT กลไก, intent มีอยู่แล้ว:**
   ระบบธีมของ repo = receipt 4 slugs ใน template system (admin เลือกใน chooser →
   DB → token pipeline เดิม) ซึ่งตอบ "เปลี่ยนไม่ต้อง deploy" อยู่แล้ว — **A8.2/A8.3
   ให้ implement ลง `receiptPalettes.js` → `--rc-*` chain เดิม** (5 ตัวแม่ต่อธีม +
   derivative ผ่าน color-mix ใน component CSS ได้) ห้ามสร้างกลไกขนานใหม่;
   กติกา "ห้าม theme logic ใน JSX" — ACCEPT เต็ม (โค้ดปัจจุบันผ่านอยู่แล้ว รักษาไว้)
3. **A8.4 lineup 4 hue — ACCEPT กรอบ (L/C lock + forbidden zones) แต่แก้ lineup:**
   - **Find สำคัญของ addendum ที่ยืนยันแล้ว:** ธีมเจดปัจจุบัน (#0FA37F, H~160) อยู่ใน
     โซนต้องห้ามของเขียว semantic (145±30) และเหลือง (#F5C400, H~90) เฉียดโซนส้ม
     (65±30) — สองธีมเดิมผิดกฎที่ควรเป็นกฎมาตลอด
   - **Default ต้องเป็นม่วง FMS** (#8A2680 ≈ oklch H~340 — anchor แบรนด์ ห้ามเปลี่ยน):
     lineup ที่ Fable เสนอ = t1 ม่วง FMS (340) · t2 หมึกน้ำเงิน (262) · t3 ครามทะเล (210)
     · t4 **สำเนาถ่านดำ carbon-gray (achromatic C≤0.03)** — "ใบเสร็จสำเนาถ่าน" แทน
     plum 345 (ชนม่วง FMS ±30) และแทน indigo 300 (ก็เฉียดม่วง) — ทั้ง 4 พ้นโซน
     semantic หมดและแยกจากกันชัด → **คำถามเปิด Q4 ถึง owner** (เพราะ = ยุบธีม
     เหลือง+เจดทิ้ง): เอา lineup ใหม่นี้ หรือให้เก็บเหลือง/เจดแบบขยับ hue หนีโซน
   - paper-tint ต่อธีม (ขาว/ฟ้า carbonless/ครีม/เทาถ่าน) — ACCEPT แทนแนว "ย้อมโต๊ะแรง"
     ของ v2-R2 ร่างแรก (เทปครองจอหลัง v2-R1 → เปลี่ยน paper-tint = ความรู้สึกเปลี่ยน
     ทั้งระบบโดย desk ขยับเบาได้)
4. **A7.1 ห้าม backdrop-filter — โดนของจริง:** `.rc-topbar` ปัจจุบันใช้ blur(12px) →
   ถอนออกใน v2-R1 พร้อมงาน topbar ต้นขั้ว (ใช้พื้น desk ทึบ ~96% + hairline แทน)

## เพิ่มเข้า master plan
- คำถามเปิด §5 เพิ่ม **Q4 = theme lineup** (ด้านบน) — ไม่ตอบ = Fable ใช้ lineup ที่เสนอ
- A9.3 เสียง + A10.1 login framing = v2-R5 owner-guided ตามตาราง map เดิม — เห็นด้วย
- ไฟล์นี้ + PLAN-RECEIPT-V2-PAGES.md + PLAN-RECEIPT.md §v2 = ชุดอ่านบังคับของ
  worker ทุกตัว (ตามลำดับ: master → pages → addendum+ruling)
