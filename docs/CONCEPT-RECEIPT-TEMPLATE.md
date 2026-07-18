# CONCEPT — Template ตระกูลที่ 6: "Receipt" (ชื่อชั่วคราว)

> เอกสาร canonical ของ concept นี้ — session ใหม่อ่านไฟล์นี้ก่อนแตะงาน Receipt ทุกครั้ง
> สถานะ: CONCEPT PHASE (ยังไม่เริ่ม build — รอ Blossom ปิด + owner เลือก direction)
> เจ้าของ concept: owner (2026-07-12) · วิเคราะห์/ขยาย: Fable advisor session เดียวกัน

## 1. Vision หนึ่งประโยค

**"การเลือกตั้งจริงที่อยู่ในเว็บ"** — ผู้ใช้เดินเข้าคูหา กาบัตร หย่อนบัตร แล้วเครื่อง
**พิมพ์ใบเสร็จออกมาช้า ๆ ต่อหน้า** ยืนยันว่าเสียงของเขาถูกนับ — ทุก interaction ในเว็บ
คือ physical metaphor ของการเลือกตั้งจริง ผ่านภาษา "กระดาษ/สิ่งพิมพ์" ทั้งระบบ

Challenge จาก owner: เหมือนเลือกตั้งจริง + สวยงาม + ใช้งานง่ายที่สุด

## 2. คำตัดสินจากรอบวิเคราะห์ (Fable 2026-07-12 — คุยกับ owner แล้ว)

| ประเด็น | คำตัดสิน |
|---|---|
| Prompt เดิมของ owner (ดำสนิท + neo-brutalism + neon lime) | **ชนลายเซ็น gumroad (neo-brutal) + studio-dark (ดำ+lime) — ห้ามใช้ตามตรง** |
| Dark theme | **owner ยกเลิกแล้ว — ไม่จำเป็นต้อง dark** (2026-07-12) ทิศทางหลัก = โต๊ะกระดาษโทนสว่าง |
| Color shifting | **owner ต้องการ** → signature = holographic security foil (ดู §4) |
| Doodle ลายมือ/หน้ายิ้ม | **owner ตัดสิน 2026-07-12: ตราปั๊มเท่านั้น** — ห้ามลายมือเขียน/ลายเซ็น/หน้ายิ้ม/doodle ทุกชนิด; decoration = ตราปั๊มหมึก + รูเจาะ + รอยปรุ + die-cut เรขาคณิต + barcode เท่านั้น |
| **Ballot secrecy (ซีเรียส)** | ใบเสร็จโชว์ "เลือกอะไร" ได้**ครั้งเดียว ณ moment พิมพ์เท่านั้น** — ไม่ persist, ไม่มีปุ่ม save, ออกจากหน้าแล้วดูซ้ำไม่ได้, พิมพ์กำกับ "ไม่ใช่หลักฐานทางการ"; barcode/QR encode แค่ ballot-ref + timestamp **ห้าม encode ตัวเลือก** (กัน screenshot เป็นหลักฐานซื้อเสียง — ระบบนี้ผ่าน security audit จริงมาแล้ว) |
| ฟอนต์ไทย monospace | ไม่มีจริงในโลก → ใช้ **Chakra Petch** (ทรงเหลี่ยม/เทคนิคัล ให้เสียงสลิปเครื่องพิมพ์) + tabular numerals; Latin/เลข = mono แท้ (Space Mono/IBM Plex Mono); หัวเรื่อง = sans โครงสร้างทางการโมเดิร์น (ตัวเต็ง: IBM Plex Sans Thai — "ทางการพอ" ไม่แก่) |

## 3. เสาหลัก 3 ต้น

1. **Material honesty** — ทุกชิ้นบนจอคือของที่พิมพ์ได้จริง: ใบเสร็จ thermal ขอบหยัก,
   ต้นขั้วบัตร (ballot stub), บัตรคิว, แผ่นสติกเกอร์ die-cut, เทปใส, ตราปั๊มหมึก, รอยปรุ,
   barcode — วางบน "โต๊ะหน่วยเลือกตั้ง" พื้นกระดาษ/ผ้าโทนสว่างอุ่น เงานุ่มสมจริง
   จัดเรียงบน invisible grid (curated ไม่ใช่รก)
2. **Holographic foil = ลายเซ็น color shifting** — แรงบันดาลใจจากฟอยล์กันปลอมบน
   บัตร/ธนบัตรจริง: แถบ/ตราซีลที่ hue ไหลช้า ๆ ตลอดเวลา และ**ตอบสนอง** pointer
   (desktop) / tilt หรือ scroll (มือถือ) — ใช้จำกัดจุด: ตราซีลราชการของระบบ, แถบ security
   บนใบเสร็จ, ขอบปุ่ม CTA หลัก — เห็นปุ๊บรู้ว่าตระกูลนี้ + สื่อ "ของแท้/ตรวจสอบได้"
   (เทคนิค: conic/linear gradient หลาย stop + animation hue ช้า + pointer-driven
   background-position; reduced-motion → foil นิ่งแต่ยัง iridescent)
3. **Journey = วงจรชีวิตกระดาษหนึ่งใบ** — ทั้ง flow เล่าเรื่องเดียว: รับบัตรคิว → กาบัตร →
   หย่อน → เครื่องพิมพ์ใบเสร็จ → ต้นขั้วถูกนับบนบอร์ดผล

## 4. รายหน้า (ไอเดียตั้งต้น — ให้ Claude Design ตี 2-3 direction จากนี่)

- **Home** = โต๊ะหน่วยเลือกตั้ง: ป้ายประกาศงานเป็นการ์ดพิมพ์ + ต้นขั้วบัตรโผล่มุม,
  **countdown เป็นบัตรคิว** (เครื่องกดบัตรคิวพิมพ์ "อีก 03 วัน 12:04:33" — ตัวเลขเดินบนสลิป),
  สถิติ real-time เป็นแถบ register tape สั้น ๆ, CTA หลัก = ปุ่มกดรับบัตรคิว/เข้าคูหา
- **Vote multi** = บัตรเลือกตั้งกระดาษจริง: ช่องกา ☐ ต่อพรรค (กาแล้วเป็นรอยหมึก),
  เส้นปรุ, เลขบัตร; ยืนยัน = **ฉีกตามรอยปรุ** (micro-interaction) แล้วหย่อนช่อง
- **Vote single** = ตราปั๊ม 3 อัน (รับรอง/ไม่รับรอง/งดออกเสียง — สี semantic เขียว/แดง/ส้ม
  ห้ามแตะ): เลือกแล้วตราปั๊มลงบัตร "ปึก!" พร้อม texture หมึก
- **Confirm → Success = THE MOMENT**: บัตรมุดเข้าเครื่อง → ไฟกะพริบ → **ใบเสร็จค่อย ๆ
  พิมพ์ออกมาทีละบรรทัด** (jitter แบบ stepper motor, หัวพิมพ์ jam เสี้ยววินาทีได้เพื่อความจริง)
  จบด้วยแถบ holo foil + ตราซีล แล้วขอบหยักฉีก — เนื้อใบเสร็จ: โลโก้ ascii-ish ของงาน,
  รายการที่เลือก (ephemeral — ดู §2), ballot-ref, เวลา, barcode, ปุ่มสติกเกอร์
  "ทำแบบประเมิน" แปะท้ายใบเสร็จ
- **Results** = "ใบเสร็จรวมของทั้งงาน" register tape ยาว: แถวพรรค + แถบคะแนนแบบ
  หมึกพิมพ์ + เปอร์เซ็นต์ tabular; สถานะ embargo (ยังไม่เปิดผล) = สลิป "รอประกาศ"
  ปั๊มตรา "SEALED" holo; recharts เดิมใส่กรอบกระดาษ (consts ห้ามแตะ)
- **Closed** = สลิปแปะเทปบนเครื่อง: "หน่วยเลือกตั้งยังไม่เปิด / ปิดแล้ว / พักปรับปรุง"
  reason-aware แบบเดียวกับที่ Blossom ทำ

## 5. ระบบสี (ทิศทาง — ยังไม่ final)

- ฐานคงที่: โต๊ะกระดาษสว่างอุ่น (near-neutral ~97-98L — บทเรียน "สบายตา" จาก Blossom
  ใช้เลย), ใบเสร็จขาวแท้, หมึก near-black
- Accent ต่อธีม (แนว 4 ธีมตาม convention ตระกูลอื่น): ตัวเต็ง Electric Blue #2B5CFF /
  Official Purple (โยงแบรนด์ FMS #8A2680) / Signal Yellow / Jade — **ห้าม lime เขียวนีออน
  (studio-dark) และระวังชนสี semantic (แดง/เขียว/ส้ม = ปุ่มโหวต)**
- Holo foil ramp = ของกลางทุกธีม (เปลี่ยนเฉพาะ tint เริ่มต้นตาม accent)
- Token namespace: `--rc-*` + palette module `src/utils/receiptPalettes.js` ตาม
  single-source architecture เดิม (palettes → BaseStyles → builtIn → injector)

## 6. กติกาแข็งที่สืบทอดทันที (จากทุกตระกูลก่อนหน้า)

ตระกูลใหม่แยกไฟล์ ห้าม rewrite ของเดิม · dispatch startsWith('receipt') ตาม seam ที่มีอยู่ ·
สี semantic โหวต + PartyTheme.js + recharts consts ห้ามแตะ · เนื้อหา visibility ห้ามพึ่ง JS
(animation พิมพ์ใบเสร็จต้องมี fallback: reduced-motion/JS-fail = ใบเสร็จโชว์เต็มทันที) ·
getPath ทุก URL · ไทยห้ามลงท้าย "." · เลขไทย/ราชการ tropes แก่ ๆ ห้าม · mobile-first 390px ·
editorMode guards (P-LOG-002) · P-LOG-078/079/080/081/082 ทั้งหมด apply

## 7. แผนงาน (เริ่มเมื่อ Blossom ปิด — ห้ามคู่ขนานสองตระกูลครึ่ง ๆ กลาง ๆ)

1. **R0 — Claude Design phase**: Fable push bundle `receipt/` เข้า design-system project
   (BRIEF ฉบับนี้แปลงเป็น design brief + token ตั้งต้น + reference การ์ด) → owner iterate
   2-3 direction ใน claude.ai/design (workflow เดียวกับ Blossom v2-C ที่พิสูจน์แล้ว)
   จุดที่ต้องให้ owner เลือกจากภาพ: โทนโต๊ะ (กระดาษอุ่น vs เทาสตูดิโอ), ระดับความจัดจ้าน
   ของ sticker, ท่าที doodle (ตราปั๊ม vs ลายมือ), ชุด accent 4 ธีม
2. **R1 — Success/ใบเสร็จก่อน** (หัวใจของตระกูล ทำ moment เด็ดให้ผ่านก่อนลงทุนทั้ง flow)
3. **R2 — Home + countdown บัตรคิว** → R3 vote multi/single → R4 results/closed →
   R5 playground/preview/chooser + gate — ทุก R ใช้ workflow Fable advisor + Opus worker,
   commit ต่อ ticket หลัง verify, บันทึกใน docs/PLAN-RECEIPT.md (สร้างตอนเริ่ม R0)

## 8. Prompt ฉบับปรับแล้ว (ให้ Claude Design — แทน prompt เดิมของ owner)

```
Premium web UI for a Thai university student-council election. Identity = PAPER MATERIALITY
on a bright, warm paper desk (~98L, calm — NOT black): the hero object is a long white
thermal receipt (jagged die-cut edges, soft curl shadow, faint print banding). A slow
line-by-line receipt-printing animation is the product's signature moment (vote confirm).
COLOR-SHIFTING signature: holographic security-foil elements (official seal sticker,
receipt security strip, CTA edge) whose hue drifts slowly and reacts to pointer/tilt —
inspired by anti-counterfeit foil on real ballots/banknotes. Supporting cast: die-cut
stickers, queue tickets, ballot stubs, perforation lines, ink stamps, tape, barcode/QR
(encoding ballot-ref only, never the choice). Typography: Chakra Petch for Thai receipt
voice (tabular numerals) + IBM Plex Sans Thai for structural headings + real mono for
Latin/digits. Accents per theme: electric blue / official purple / signal yellow / jade —
strictly NO neon lime-green, NO pitch-black canvas, NO thick brutalist borders/offset
shadows (sibling templates own those). Decoration = print ephemera & stamps only, no
hand-drawn smiley doodles. Youthful, high-energy, meticulously aligned to an invisible
grid. Mobile-first 390px; Thai text must read perfectly on the receipt.
```

## 9. คำถามเปิด — ✅ OWNER ตอบครบแล้ว 2026-07-12 (LOCKED — เป็นกติกา build ทันที)

1. **โต๊ะพื้นหลัง = กระดาษอุ่น** (warm paper `--rc-desk #F7F4EE` ~97L) — ไม่มี dark variant
2. **จำนวนธีม = 4** (ม่วง FMS default / ฟ้า / เหลือง fill-only / เจด) ตาม convention พี่น้อง
3. **ลายมือ = ตราปั๊มเท่านั้น** — ห้ามลายมือเขียน/ลายเซ็น/หน้ายิ้ม/doodle ทุกชนิด;
   decoration = ตราปั๊มหมึก + รูเจาะ + รอยปรุ + die-cut เรขาคณิต + barcode เท่านั้น
4. **Ephemeral receipt = ยืนยัน** — ใบเสร็จโชว์ตัวเลือกครั้งเดียวไม่ persist (ballot secrecy §2
   ครบทุกข้อ: ไม่มี save/download/share, barcode=ref-only, ป้าย "ไม่ใช่หลักฐานทางการ")
