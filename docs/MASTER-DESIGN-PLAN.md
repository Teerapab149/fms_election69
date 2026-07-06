# MASTER DESIGN PLAN — Awwwards-Level Polish ของทุก Template
> เขียน 2026-07-07 โดย Fable 5 (advisor) ตามคำสั่งเจ้าของ · **เอกสารนี้คือ authority สูงสุดของงานดีไซน์**
> supersedes: docs/PLAN-REDESIGN-V2.md (WS1 ถูกยกเลิกแล้ว — ดู §1)
> อ่านคู่: CLAUDE.md (Engineering Discipline) · DECISIONS.md (P-LOG ถึง 077) · docs/HANDOFF-2026-07-05-PRE-DEPLOY.md

---

## §0 วิธีใช้เอกสารนี้ (สำหรับ AI ที่รับช่วงต่อ)

1. อ่าน §1 (รสนิยมเจ้าของ) ก่อนสิ่งอื่นใด — งานดีไซน์ที่ขัด §1 จะถูก reject แม้ execution สมบูรณ์
2. อ่าน §2 (นิยาม Awwwards ของโปรเจกต์นี้) เป็นเกณฑ์คุณภาพทุกชิ้นงาน
3. อ่าน §3 (แผนที่สถาปัตยกรรม) ก่อนแตะโค้ดใดๆ — ระบบธีมมี invariant ที่พังง่าย
4. เลือก ticket จาก §6 ตามลำดับ phase ใน §5 — ห้ามข้าม gate
5. ทุก ticket: ทำตาม §7 (กระบวนการ) เป๊ะ — advisor/worker split, verify ritual, no-commit-until-review
6. อย่าเดา: ถ้า spec ใน ticket ขัดกับโค้ดจริง → หยุด, แปะหลักฐาน, ถาม (CLAUDE.md Rule 1-3)

---

## §1 รัฐธรรมนูญรสนิยมเจ้าของ (Owner Taste Constitution) — เด็ดขาด

### ห้ามเด็ดขาด (เคย reject มาแล้วจริง)
- ❌ ความ "พิธีการ/ราชการ": ตราครุฑ, เลขที่หนังสือ, "ประกาศ" แบบเว้นวรรค, โครง "เอกสาร" —
  ทั้ง concept "ประกาศ" ถูก reject ว่า "ทางการมากไปจนดูตลก ดูเก่าดูแก่มาก ไม่สวยเลย"
- ❌ เลขไทย (๐-๙) ทุกตำแหน่งใน UI — "มันตลก"
- ❌ serif แบบโบราณ/แก่ เป็นตัวอักษรหลัก (serif เป็น accent ได้เฉพาะตระกูลที่ identity เป็นแบบนั้นอยู่แล้ว
  เช่น studio-dark italic accent, verdure editorial — ห้ามเพิ่มใหม่ในตระกูลโมเดิร์น)
- ❌ ของเวอร์เกินสำหรับระบบนักศึกษา: 3D, WebGL, particle ฟุ้งๆ, cursor แปลกๆ, loading นานเพื่อ effect
- ❌ rewrite/แทนที่ layout ที่เจ้าของชอบ — ดีไซน์ใหม่ = template ใหม่แยกเสมอ (additive only)

### ชอบ (baseline ที่ยืนยันแล้ว)
- ✅ โมเดิร์น รุ่นใหม่ ไม่ทางการมาก — "ทางการหน่อยๆ" คือเครื่องปรุง ไม่ใช่ตัวจาน
- ✅ Original v1 home (Kanit หนา สะอาด) · gumroad (สนุก มีพลัง) · studio-dark (ดาร์ก editorial) · verdure (ประณีต)
- ✅ สีสันสวยงาม น่ารัก เข้าถึงง่าย สบายตา — ธีมชมพูพาสเทลคือของรักของเจ้าของ (gumroad-bubblegum)
- ✅ สลับธีมแล้ว "ทั้งบรรยากาศ" ต้องเปลี่ยนเห็นชัด (ไม่ใช่แค่ accent)

### Protocol การเสนอดีไซน์ (บทเรียนจากการ reject 2 รอบ)
1. งานที่เปลี่ยน "โครง/บุคลิก" ของหน้า → ทำ concept board (widget mockup) ให้เจ้าของดูก่อนเสมอ
2. การ approve mockup **ไม่ถือเป็นที่สิ้นสุด** — เจ้าของอาจกลับคำเมื่อเห็นบริบทจริง → งานใหญ่ต้อง build
   ในไฟล์ใหม่หลัง slug ทดลอง (ยกเลิก = ลบไฟล์ ไม่ใช่ restore)
3. งาน "polish รายจุด" (แก้ตำหนิ ไม่เปลี่ยนบุคลิก) → ทำได้เลย ไม่ต้องขอ แต่ต้อง byte-safe ต่อของเดิม

---

## §2 นิยาม "Awwwards Style" ของโปรเจกต์นี้ (เกณฑ์คุณภาพ)

**สูตร: craft ระดับโลกใน 5 เรื่องพื้นฐาน ไม่ใช่ gimmick** — สวยจากจังหวะ ไม่ใช่จากของเล่น

| มิติ | เกณฑ์ผ่าน (ตรวจได้จริง) |
|---|---|
| Typography | scale ชัด ≤3 ระดับ/วิว · line-height 1.1 หัวเรื่อง / 1.6 เนื้อหา · ไม่มีไซส์กระโดดไร้เหตุผล · tabular-nums กับตัวเลขสถิติ |
| Spacing | จังหวะ 4/8px เสมอ · whitespace ใจกว้าง (แน่นแล้วเครียด) · ไม่มี element ชิดขอบ/ชนกันโดยไม่ตั้งใจ |
| Colour | contrast: เนื้อหา ≥4.5:1, หัวเรื่องใหญ่ ≥3:1 · ≤3 สีต่อวิว (ธีม+กลาง+accent) · ห้ามเฉดโลหะ/อ่อนเป็นตัวอักษรบนพื้นอ่อน |
| Motion | มีความหมายเท่านั้น (feedback/transition) · 150-300ms ease-out · เคารพ PRM ยกเว้น marquee ตกแต่ง (product call, ดู §4) · ไม่มีอะไรกระตุกหรือ loop เร่งเร้า |
| Hierarchy | ทุกหน้าตอบใน 1 วิ: "หน้าอะไร ทำอะไรต่อ" · CTA หลัก 1 เดียวเด่นสุด · ปุ่มรองห้ามแย่งซีน (บทเรียนปุ่มฟ้า Results) |

**Mobile-first gate (บังคับ):** review ทุกหน้าที่ 375px ก่อน desktop — mobile ต้อง "ถูกออกแบบ" ไม่ใช่ desktop ย่อ
**State ครบ:** ทุกหน้า/ทุก element สำคัญมี loading / empty / error / disabled ที่ตามธีม

---

## §3 แผนที่สถาปัตยกรรม (ต้องเข้าใจก่อนแตะโค้ด)

### ระบบธีม single-source (ห้าม drift — รากบั๊กใหญ่สุดในประวัติโปรเจกต์)
```
utils/<family>Palettes.js  (plain module, server+client)   ← แหล่งเดียวของสีทุกตระกูล
  → <Family>BaseStyles (client: ยิง family vars ลง root class, อ่าน activeTemplateId + ?slug= ผ่าน effect
      — ห้าม useSearchParams: hydration)   [gumroad=.gum-root --pink..., verdure=.vd-root, original=.orig-root --o-*,
      studio=.sd-root --sd-* (+:root เพราะ html/body), single-vote=--spv-* ที่ :root เพราะ portal]
  → builtIn/<family>.js  build<X>Template(slug,name,desc,palette) → Layer-1 --color-* + element configs (ตอน apply)
  → utils/injectTemplateTheme.js  (preview morph: push family vars + Layer-1 inline)
dispatch: activeTemplateId.startsWith('<family>') ทุกหน้า app · HomeRenderer: HOME_LAYOUTS[slug] || [layoutFamily]
template-preview เป็นเจ้าของ Layer-1 ของ slug ที่พรีวิว (Fix 66f7444) · layout.js SSR Layer-1 ของตัว active ที่ .fms-app
```

### Invariants (ละเมิด = บั๊กทันที)
1. **portal ห้ามใช้ var(--color-*)** — scope .fms-app ไปไม่ถึง → ใช้ ramp ที่ :root (--spv-*) (P-LOG-077)
2. **Layer-2 element colour vars ต้อง reference token** (`var(--color-primary)`) ไม่ใช่ literal hex — ไม่งั้น stale ตอน morph (752f375, 4f5b173)
3. palette slot ใหม่ต้องนับจาก grep จุดประกาศจริงใน components ไม่ใช่จาก builtIn (P-LOG-075)
4. `<style jsx>` ห้าม render แบบมีเงื่อนไข — SWC พังทั้ง module; ใช้ plain `<style>` (P-LOG-076)
5. Tailwind arbitrary: `[var(--x)]` ห้าม comma fallback · opacity-on-var → `[color-mix(in_srgb,var(--x)_N%,transparent)]`
6. ห้ามแตะ: PartyTheme.js · สี semantic 3 choices (เขียว/แดง/ส้ม c47af13) · recharts consts (COLORS_BAR/POPS)
7. ปี/ชื่องานทุกจุด bind useGlobalConfig (1c8d09b) — ห้าม hardcode เพิ่ม

### Preview surfaces (ใช้ verify — DB-free)
- `/fms-ovs/template-preview?slug=X` (bare, damped, screenshot ได้) · `+&chrome=1` (มี swatch bar morph)
- `+&interact=1` (จำลอง flow จริง, motion เต็ม) · `&page=vote&variant=single` (หน้า single-vote)
- apply จริง: `node scripts/dev-admin-login.js` → cookie → `POST /fms-ovs/api/admin/templates/<slug>/apply` → **restore ตัวเดิมเสมอ**

---

## §4 กติกากระบวนการ (ห้ามข้าม — จ่ายค่าเรียนมาแล้วทุกข้อ)

1. **Advisor/Worker split**: main agent (Fable ถ้ามี) = คิด/ตรวจ/commit เท่านั้น; execution ทุกชิ้น = Agent
   subagent (opus=งาน judgment, sonnet=งาน mechanical) พร้อม brief self-contained
2. **ห้ามหยุด dev server :3000** (เจ้าของดู live) — mcp preview_start ชื่อ `fms-dev` เท่านั้น · ห้าม `npm run build` ขณะ dev รัน
3. worker **ห้าม commit** — advisor ตรวจ raw evidence ก่อน แล้ว commit เอง: atomic, explicit paths,
   ลงท้าย `Co-Authored-By: Claude <model> <noreply@anthropic.com>` · **ห้ามใส่ double-quote ในข้อความ commit ผ่าน PowerShell** (argument แตก)
4. **Progress file**: งาน >30 นาทีต้องเขียน `.specs/<TASK>-PROGRESS.md` (gitignored) อัปเดตตลอด — session limit ฆ่า worker บ่อย (~ทุก 5 ชม.) แล้ว resume จากไฟล์
5. verify ด้วย **computed styles ผ่าน preview_eval** ไม่ใช่ screenshot อย่างเดียว (หน้า animate → screenshot timeout) ·
   หน้า bare damped ใช้ screenshot ประกอบได้ · แท็บ preview แชร์กับเจ้าของ — single-shot evals
6. เครื่องเจ้าของเปิด **OS reduce-motion** — animation "ค้าง/นิ่ง" บน live อาจเป็น a11y โดยตั้งใจ ไม่ใช่บั๊ก
   (นโยบาย: live เคารพ PRM ยกเว้น .gtick__track marquee ตกแต่ง; interact preview เปิด motion เต็มเพื่อจำลองดีไซน์จริง)
7. ภาษาไทยห้ามลงท้ายประโยคด้วย `.` · scheduled task ต้องให้เจ้าของกด Run now ก่อนหนึ่งครั้ง (pre-approve permission)
8. Windows quirks: `.next` stale บ่อย (chunk เก่าค้างแม้ HMR recompile — อาการ "โค้ดถูกแต่หน้าผิด" → ต้องขอเจ้าของ
   restart + ลบ .next) · Node ESM ไม่รับ .jsx · ไม่มี `@/` alias

---

## §5 ลำดับ Execution (phases + gates)

| Phase | เนื้อหา | Gate เข้า |
|---|---|---|
| **P0** | pre-deploy gate: หยุด server (ขอเจ้าของ) → ลบ .next → `npm run build` GREEN → `npm run smoke` 15/15 → paste output จริง | เจ้าของนัดเวลา |
| **P1** | Critical UX fixes (T1.x ใน §6) — ของพังจริงที่กระทบผู้ใช้วันเลือกตั้ง | ไม่ต้องรอ P0 |
| **P2** | Per-template polish (T2.x) — ทีละตระกูล ทีละหน้า ตามเกณฑ์ §2 | P1 เสร็จ |
| **P3** | Cross-cutting systems (T3.x) — user chip, motion policy, state pages | ทำแทรกได้ |
| **P4** | จัดบ้านโค้ด (T4.1) + template ใหม่ Blossom Civic (T4.2, เจ้าของสั่งเปิดเอง) | หลัง P0 |

---

## §6 Task tickets (ละเอียดพอให้ทำได้โดยไม่ถาม)

### P1 — Critical fixes
**T1.1 · Original single-vote mobile redesign (วิกฤตสุด — ยืนยันด้วยตา 2026-07-06)**
- ไฟล์: src/components/vote/{SinglePartyView,LiquidHero}.js (+SinglePartyBaseStyles ถ้าต้องเพิ่ม slot)
- อาการ: mobile วงกลม hero เต็มจอ + การ์ดสมาชิกอัดกริดชนหัวเรื่อง, ขาวบนภาพหน้าคนอ่านไม่ได้, ปุ่ม glass จมภาพ;
  desktop: ชื่อพรรคล้นวง, subtitle ครึ่งนอกวงขาวบนขาว, การ์ดโดน mask ตัดกลางหน้า, chrome "SYSTEM_READY" tech-noise
- ทำ: (mobile <768px) จำกัดการ์ดสมาชิกที่ลอยในวง ≤4 ใบ + dark scrim gradient (deep 70%→transparent) หลังโซน
  typography + หัวเรื่อง/ปุ่มย้ายออกนอกวง (วงเป็น backdrop เลื่อนอยู่หลัง); (desktop) หัวเรื่อง fit วงด้วย clamp()
  หรือวางบนแถบ scrim ข้ามวง (เลือกทางที่ contrast ผ่าน) + subtitle มีพื้นรอง + ลบ/ลด chrome tech-noise
- เกณฑ์: 375px ทุกตัวอักษร contrast ≥4.5:1 บนพื้นจริง (วัด computed + จุดสุ่มบนภาพ) · ไม่มี element ถูกตัดกลางหน้า
  โดยไม่ตั้งใจ · byte-safe ต่อ desktop เดิมเท่าที่ไม่ขัดการแก้ · verify ผ่าน ?page=vote&variant=single&interact=1 ทุกธีม original
**T1.2 · Gumroad single-vote confirm affordance**
- ไฟล์: GumroadSingleParty.js — ปุ่มยืนยันต้องดู disabled จริง (opacity+cursor+ข้อความ "เลือกก่อนยืนยัน") จนกว่าจะเลือก
  1 ใน 3 · แตะเฉพาะสไตล์/disabled state ห้ามแตะ logic โหวต · เช็คตระกูลอื่นมีอาการเดียวกันไหม (studio/verdure/classic) แล้วรายงาน
**T1.3 · หน้า closed: วันที่ไทย hardcode** — สร้าง util formatThaiDate(date) (เดือนไทยเต็ม, พ.ศ.) ใช้
  resolveElectionDates(globalConfig) ที่ src/app/closed/page.js:~50 + ClosedEditorPreview.js:~16 (flag ไว้ตั้งแต่ 1c8d09b)

### P2 — Per-template polish (ทีละ ticket ทีละหน้า; ทุก ticket จบด้วย verify ritual + 375px gate)
**T2.O · ORIGINAL (v1 — targeted เท่านั้น ห้ามเปลี่ยนบุคลิก)**
- T2.O1 home: ปุ่ม Results ลดบทเป็น secondary (outline/เบาลง) ให้ CTA โหวตเด่นเดี่ยว · สมดุลคอลัมน์ desktop
  (ซ้ายเบา-ขวาหนัก) · จูน banner wash รายธีม (0.4-0.6) ให้ "แดง-เทา-ทอง" จริงบน crimson · grid ink 5-9% จูนตามตา
- T2.O2 ธีม crimson: เลข "50" เปลี่ยนคู่ gradient เป็น deep→brand (ห้าม glow โลหะเป็นปลายเฉดบนพื้นอ่อน — ใช้ทุกธีมที่ glow อ่อน)
- T2.O3 inner pages (candidates/results/vote multi): ไล่เกณฑ์ §2 รายหน้า — spacing rhythm, tabular-nums, hierarchy ปุ่ม
**T2.G · GUMROAD** — T2.G1 บับเบิ้ลกัม: ลด saturation ไฮไลต์ (#FF74C4→~#FF8FD0 family + พื้นไฮไลต์อ่อนลง) ·
  T2.G2 การ์ดภาพกลุ่ม: crop ไม่ทับโลโก้ (object-position/padding) · T2.G3 เลข "1" tile จัด alignment กับโลโก้ ·
  T2.G4 ticker ความเร็ว/ความถี่ข้อความ review (35s โอเคไหมบนจอแคบ)
**T2.S · STUDIO-DARK** — T2.S1 การ์ดโลโก้ PSU บน rail ทำให้กลืน identity (ปรับ mat/ขนาด/พื้น) ·
  T2.S2 การ์ดโลโก้พรรคใน single-vote mobile โดน crop ขวา — reposition · T2.S3 home mobile: hero ว่าง + CTA
  voted จาง — เพิ่มน้ำหนัก CTA โซนแรก
**T2.V · VERDURE** — T2.V1 bottom pill nav ทับ caption ภาพกลุ่ม (z/offset/จบภาพก่อน nav) ·
  T2.V2 ขอบภาพกลุ่มมี text artifact ฉูดฉาด — ตรวจที่มา (ภาพ asset เองหรือ CSS) แล้วเก็บงานขอบ
**ทุกตระกูล**: หน้า results/success/closed ไล่เกณฑ์ §2 (ยังไม่เคย audit ละเอียด — worker เก็บ screenshot bare
  ทุกหน้า แปะรายงานให้ advisor ตัดสินรายจุดก่อนแก้)

### P3 — Cross-cutting
**T3.1 · User chip มาตรฐานต่อ template** — ปัจจุบัน: classic/original วงกลมม่วง+chevron ไร้ชื่อ · gumroad ข้อความ
  truncate+ปุ่มแยก รก · studio/verdure monogram จืด → ออกแบบ chip เดียวกัน 4 บุคลิก: avatar+ชื่อ (ellipsis ~12ch)
  +dropdown (โปรไฟล์/ออกจากระบบ) · ทุก breakpoint · concept board ให้เจ้าของเลือกก่อน build (งานเปลี่ยนหน้าตา)
**T3.2 · Motion policy เป็นเอกสาร** — ตาราง: surface × พฤติกรรม (live/bare/chrome/interact × PRM on/off) ลง docs/
**T3.3 · State pages audit** — loading/error/empty ทุกตระกูลตามธีม (ThemedLoadingScreen มีแล้ว — เช็คครบทุก state)

### P4
**T4.1 · Folder refactor** — components/templates/{original,gumroad,studio-dark,verdure}/ · git mv + แก้ import +
  grep verify + build GREEN · commit เดี่ยว mechanical ห้ามปนงานดีไซน์ · ทำหลัง P0 เท่านั้น
**T4.2 · Blossom Civic (template ที่ 5)** — DEFERRED จนเจ้าของสั่งเปิด · brief เดิม: world-class สีสันน่ารัก
  เข้าถึงง่าย ทางการหน่อยๆ ธีม base ชมพูพาสเทล · เริ่มด้วย concept board หลายทิศทาง ห้าม build ก่อน approve

---

## §7 Definition of Done ต่อ ticket (advisor ตรวจตามนี้)
1. Task-0 audit ในรายงาน (สภาพจริงก่อนแก้ + inventory ที่เกี่ยว)
2. Diff แคบตรง scope · ไม่มีไฟล์แปลกปน
3. Evidence: computed styles expected-vs-observed + (ถ้าเป็นงานตา) screenshot bare ก่อน/หลัง · 375px ก่อน desktop
4. Base/flagship byte-safe เว้นแต่ ticket ระบุว่าเปลี่ยน (แล้วต้องแปะ before/after)
5. ทุกธีมของตระกูลนั้น verify (morph ผ่าน chrome=1 หรือ apply+restore)
6. Console + server error ว่าง · live ไม่กระทบ (ถ้าไม่ได้ apply)
7. Progress file จบสถานะ · advisor commit + push · อัปเดตเอกสารนี้ (ขีดฆ่า ticket ที่เสร็จ พร้อม commit hash)

## §8 สถานะปัจจุบัน (2026-07-07)
- Branch new-version @ d3e1f8f (pushed) · active DB template = gumroad-premium (เจ้าของเลือกดูเอง)
- เสร็จแล้วรอบก่อน: studio-dark 4 ธีม · token-bleed fix · morph staleness fix · ticker (interact+live PRM) ·
  original palette+field+60-30-10+banner duotone · single-vote portal repair · bubblegum theme · year binding
- ค้าง: ทุก ticket ใน §6 ยังไม่เริ่ม · P0 gate ยังไม่ได้นัด
