# PLAN — Redesign ยกใหญ่ (2026-07-06)

> เป้าหมายจากเจ้าของ: "เว็บที่ดีและดีที่สุด ให้คณะใช้ได้ยาวๆ" — world-class UX/UI
> ปีนี้ไม่ใช้ original แต่ต้องทำให้สวยที่สุดสำหรับปีถัดๆ ไป
> ผู้วางแผน: Fable 5 (advisor) · ผู้ลงมือ: Opus 4.8 / Sonnet 5 (workers) ตาม workflow เดิม
> อ่านคู่: CLAUDE.md Engineering Discipline · docs/HANDOFF-2026-07-05-PRE-DEPLOY.md · DECISIONS.md (P-LOG ถึง 077)

## สรุป verdict จากการรีวิวหน้าตาทุก template (2026-07-06 ค่ำ)
- **studio-dark A-** — แนวคิดครบ execution ดี (จุดติ: การ์ดโลโก้ PSU บน rail เป็นก้อนแปะ)
- **verdure A-** — ประณีตสุด มีศักดิ์ศรีงานพิธี เหมาะเป็นหน้าเป็นตา
- **gumroad B** — identity ชัดแต่เสียงดัง; บับเบิ้ลกัมโครงสีตรง brief แต่ saturation จัดกว่าเจตนาพาสเทล
- **original C+** — "กระดานวิดเจ็ต" ไม่มีแนวคิดรวม; ตำหนิที่เห็นจริง: เลข 50 เฉดแพลทินัมจมบนสนามชมพู (crimson) ·
  ปุ่มฟ้า semantic ตีกับสนามแดง · banner duotone ได้ ~60% · สนามสีแบนไม่มีมิติ

---

## Workstream 1 — ❌ CANCELLED 2026-07-07: ORIGINAL V2 concept "ประกาศ"
> เจ้าของ reject ตอนเห็นทิศทางจริง: "ทางการมากไปจนดูตลก ดูเก่าดูแก่ ไม่สวย" — **เก็บ v1 ไว้ตามเดิม
> ห้าม rewrite** ถ้าอยากได้ดีไซน์ใหม่ให้สร้างเป็น template ใหม่แยก (→ พลังไปลง WS2)
> Taste ที่ยืนยันแล้ว: ไม่เอาราชการ/เลขไทย/serif แก่ๆ · ชอบโมเดิร์น รุ่นใหม่ ไม่ทางการมาก (v1 + gumroad คือ baseline ที่ชอบ)
> งานที่ยังมีผลกับ v1 (จาก audit): แก้รายจุดเท่านั้น — single-vote mobile วิกฤต, user chip, ปุ่ม Results hierarchy,
> เลข 50 จมใน crimson, banner duotone จูน — ทำแบบ targeted fix ห้ามแตะโครง
### (ARCHIVED concept เดิม — ไม่ทำแล้ว)
แทน layout กระดานวิดเจ็ตด้วยองค์ประกอบแบบเอกสารทางการยกระดับ:
- **Hero = หน้าประกาศ**: กระดาษมีพื้นผิว (แสง/เกรนจางๆ ไม่ใช่สีทาแบน) + lockup ตัวอักษรทางการ
  (หัวเรื่องใหญ่ + เลขที่ประกาศ ๕๐/๒๕๗๐ + เส้นบรรทัดคู่) + ตราซีล/สแตมป์ประจำธีม (บทเรียน wax-seal ของ verdure)
- **Countdown = บล็อก "กำหนดการ"** แบบตารางราชการ ไม่ใช่ pill ลอย
- **สถิติ = "รายงานผลอย่างเป็นทางการ"**: ตัวเลขใหญ่ serif/tabular + เส้น rule ไม่ใช่การ์ดม่วงป้ายใหญ่
- **Banner = ภาพในกรอบพิธีการ** + คำบรรยายใต้ภาพ + duotone v2 (จูน per-theme, mix-blend `hue`+`color` สองชั้น)
- **แก้บั๊กดีไซน์ที่พบ**: (1) คู่ gradient หัวเรื่องต่อธีมใช้ deep→brand (โลหะเป็น accent เท่านั้น ห้ามเป็นปลายเฉดบนสนามอ่อน)
  (2) กติกาใหม่ "semantic anchored, theme-tempered": สี semantic (ฟ้า results/เขียว vote) คงฐาน hue แต่ temper
  ด้วย color-mix เข้าหาธีม ~15% ให้ไม่ตีกัน — ต้องคุยเจ้าของก่อนแตะ เพราะขัดกติกา "ห้ามแตะ semantic" เดิม
  (3) สนามสีมี depth: radial vignette + gradient เย็น/อุ่นจางๆ per-theme
- 5 ธีมเดิมนั่งบนสถาปัตยกรรม palette เดิม (originalPalettes.js ขยาย slot ได้ ห้ามระบบใหม่)
- ลำดับ: (1) Fable ทำ concept board (widget mockup) → เจ้าของ approve → (2) สร้าง `OriginalV2Home`
  แบบ component ใหม่ข้างเคียง (ห้ามทับของเดิมจน approve) → (3) inner pages → (4) verify ritual ทุกธีม

## Workstream 2 — ⭐ TEMPLATE #5 ใหม่: "world-class, สีสันน่ารัก เข้าถึงง่าย แต่ทางการหน่อยๆ"
ชื่อชั่วคราว: **"Blossom Civic"** — soft-pop civic design
- DNA: เรขาคณิตมน + พาสเทลแคนดี้แบบ muted + ตัวอักษรใหญ่เป็นมิตร + micro-interaction ขี้เล่นพอดีๆ
  บนโครง IA สงบแบบทางการ (serif accent สำหรับความ official) — โทน Duolingo/Notion x งานราชการโมเดิร์น
- **ธีม base = ชมพูพาสเทลของเจ้าของ** (ชมพูหลัก + ฟ้า/มินต์/ดำอมพลัมเสริม — ยกบทเรียน bubblegum มา
  แต่คุม saturation ต่ำกว่า) + ธีมสำรอง 2-3 (ฟ้า/มินต์/ครีม)
- นี่คือ candidate จริงสำหรับปีหน้า (สำคัญต่อชีวิตเจ้าของ)
- สร้างตาม recipe ครบวงจร (palette เดี่ยว → BaseStyles → injector branch → builder → register → dispatch)
  และ**ใช้โครง folder ใหม่ตั้งแต่วันแรก** (ดู WS5)
- ลำดับ: concept board → home → 6 หน้า (candidates/party/vote single+multi/results/success/closed) → themes

## Workstream 3 — GUMROAD tune (เจ้าของชอบ เก็บไว้)
- ลด saturation แถบไฮไลต์บับเบิ้ลกัมลงขั้นเดียว (#FF74C4 → โซน #FF8FD0 + พื้นไฮไลต์อ่อนลง)
- optional ธีม "โตขึ้น" หนึ่งตัว (ink นุ่ม กระดาษอุ่น accent เดียว) ถ้าเจ้าของอยาก

## Workstream 4 — เกณฑ์คุณภาพรวม (ทุก template ต้องผ่าน)
- Contrast: ข้อความจริง ≥ 4.5:1, หัวเรื่องใหญ่ ≥ 3:1, ห้ามเฉดโลหะ/อ่อนเป็นสีตัวอักษรบนสนามอ่อน
- Motion: จัดทำนโยบาย PRM ต่อ surface เป็นเอกสาร (live เคารพ ยกเว้น marquee ตกแต่ง=product call · interact preview เปิดเต็ม)
- Typography scale ต่อตระกูล (ตอนนี้บางหน้าไซส์กระโดด)
- หน้า loading/error/empty ตามธีมครบ (ThemedLoadingScreen มีแล้ว — audit ให้ครบทุก state)

## Workstream 5 — จัดบ้านโค้ด (เจ้าของขอ)
`components/home/*` + `components/vote/*` เป็นถังรวมทุกตระกูล → ย้ายเป็น
`src/components/templates/{original,gumroad,studio-dark,verdure,blossom}/…` (git mv + แก้ import + grep verify + build)
- ทำ**หลัง P4 gate** เพื่อไม่ให้ diff ยักษ์ค้างช่วง deploy · commit เดี่ยว mechanical ห้ามปนงานดีไซน์

## ลำดับ execution (แต่ละ phase = คุยเปิด phase กับเจ้าของก่อนเสมอ)
0. **P4 pre-deploy gate** (ค้างอยู่ — นัดหยุด server: rm .next → build GREEN → smoke 15/15 → paste output) — ปลดล็อกทุกอย่าง
1. WS1 Original v2 (concept → approve → home → inner → ritual)
2. WS2 Blossom Civic (concept → approve → build ครบ 6 หน้า)
3. WS3 gumroad tune + WS4 audit กวาด
4. WS5 folder refactor + อัปเดต docs/handoff ทั้งชุด
ประมาณการ: แต่ละ phase กิน 1-3 sessions (5h window) — ตัดงานเป็นชิ้นที่จบใน window เดียว + progress file `.specs/` เสมอ

## ภาคผนวก — ผล audit ละเอียดรอบสอง (2026-07-06 ค่ำ: mobile / single-vote / navbar)

### Single-vote ราย template (หน้าที่คนใช้จริงเยอะสุดวันเลือกตั้ง — mobile-first คือเกณฑ์หลัก)
- **original (วิกฤตสุด — ยืนยันด้วยตา):**
  - desktop: ชื่อพรรคล้นวงกลมไปกองบนพื้นขาว · subtitle ขาวครึ่งนอกวง = อ่านไม่ออก ·
    การ์ดสมาชิกโดน mask ตัดกลางหน้า · chrome สาย tech (SYSTEM_READY, corner ticks) ขัดความทางการ
  - mobile: วงกลมเต็มจอ + การ์ดสมาชิกอัดกริดแน่นชนตัวหนังสือ · ขาวบนภาพหน้าคน = contrast แย่ ·
    ปุ่ม glass ลอยบนภาพยุ่ง · จังหวะหน้า ว่างบน-แน่นกลาง
  - ทางแก้ (เข้า WS1): mobile ต้องออกแบบแยก — สมาชิกโชว์ 3-5 ใบพอ + dark scrim gradient
    หลัง typography + title หลุดออกนอกวง (วงเป็น backdrop) — ห้ามใช้ desktop ย่อส่วน
- **gumroad:** mobile ดีสุดในสี่ตัว · ติ: ปุ่มยืนยันดู enabled ทั้งที่ยังไม่เลือก (affordance ต้องชัด:
  disabled จริงจนกว่าจะเลือก) · เลข "1" tile ลอย asymmetric กับโลโก้ · group photo crop ทับโลโก้มุม
- **studio-dark:** ดี · ติ: การ์ดโลโก้พรรคขาวโดน crop ขอบขวาบน mobile — reposition/ลด
- **verdure:** งามสุด · ติ: bottom pill nav ทับ caption ภาพกลุ่ม · ขอบภาพมี text artifact ฉูดฉาดหลุดโทน

### Navbar / user chip (ที่เจ้าของว่า "แปลกๆ" — ยืนยัน จริงทุกตัว)
- classic/original: วงกลมม่วง + chevron ลอยๆ ไม่มีชื่อ = ดูหลุดจากดีไซน์
- gumroad: "Mock Student 66105..." truncate + ปุ่มออกจากระบบแยกก้อน = รก
- studio/verdure: monogram circle เฉยๆ — generic เกินกว่า identity ของ template
- **WS4 เพิ่ม: user-chip มาตรฐานต่อ template** — avatar + ชื่อ (ellipsis) + dropdown เดียว
  (โปรไฟล์/ออกจากระบบ) ดีไซน์ตาม identity ของแต่ละตระกูล ทุก breakpoint

### Responsive / สมมาตร / content
- original home: ปุ่มฟ้า Results ใหญ่กลบ hierarchy บน mobile (ควรเป็นรอง ไม่ใช่พระเอก) ·
  คอลัมน์ desktop ซ้ายเบา-ขวาหนัก ไม่สมดุล
- studio home mobile: hero ว่างเยอะ + CTA state voted จาง จนหน้าดูไม่มีจุดหมาย
- **content bug ข้ามตระกูล: ปี hardcode ปนกัน** — meet chip "FMS ELECTION 2026" อยู่ข้าง
  "SEE YOU 2027"/"ปีการศึกษา 2570" (เจอทั้ง original + gumroad "2027") → WS4 เพิ่ม:
  audit ผูกปีทุกจุดเข้า globalConfig ห้าม hardcode
- WS4 เพิ่ม: mobile-first gate — ทุกหน้าใหม่ต้อง review ที่ 375px ก่อน desktop

## กติกาที่สืบทอด (ย้ำ)
worker ห้าม commit จน advisor ตรวจ · ห้ามหยุด dev server · restore active template เดิมเสมอ ·
ห้ามแตะ PartyTheme/semantic 3 choices/recharts consts · ภาษาไทยไม่ลงท้าย `.` ·
portal ห้ามใช้ var(--color-*) (P-LOG-077) · `<style jsx>` ห้าม conditional (P-LOG-076) ·
palette slot นับจาก grep จุดประกาศจริง (P-LOG-075)
