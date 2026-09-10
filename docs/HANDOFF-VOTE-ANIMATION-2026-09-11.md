# Handoff — Vote animation, success experience และ confirm step

วันที่: 2026-09-11 (Asia/Bangkok) · สถานะ: **merged เข้า main แล้ว**

## Git

- PR: [#7](https://github.com/Teerapab149/fms_election69/pull/7) merged
- merge commit `48db184` · commit เนื้องาน `5a7210d` (30 ไฟล์)
- branch `feat/success-mobile-cta-confirm-sheets` ลบแล้ว
- branch เดิม `fix/upload-hardening-next-auth` ถูก merge ไปตั้งแต่ PR #6 — งานรอบนี้แตกจาก `origin/main` ไม่ได้ต่อจาก branch เก่า
- working tree ยังมีรูปและไฟล์ของเจ้าของค้างอยู่ (`public/images/**`, `backups/`, `AGENTS.md`) **ไม่ได้ commit และห้าม reset หรือลบเหมารวม**

## สิ่งที่อยู่ใน main แล้ว

### ประสบการณ์หลังลงคะแนน

- `src/hooks/useVoteCast.js` — controller กลาง รอทั้ง submit จริงและ visual hold, กันกดย้ำ, จัดการ error/unmount และ**ไม่เคยแปลง "อนิเมชันจบ" เป็น "โหวตสำเร็จ"**
- `src/components/vote/VoteCastScene.js` — scene ต่อ family ~1 วินาที ไม่วนซ้ำ ไม่มี confetti รองรับ reduced motion
- `src/components/vote/VoteSuccessExperience.js` — success กลาง copy/art แยกตาม family แสดงเฉพาะตัวตนของผู้ใช้เอง ไม่แสดงตัวเลือกที่ลงคะแนน
- `src/components/vote/OriginalSuccess.js` — family default เดิมไม่มีงานศิลป์ของตัวเอง ตอนนี้มี ambient wash + grid + brand ramp ของ family, seal ของตัวเอง และการ์ด action แบบ gradient

### ปุ่มทำแบบประเมินต้องเห็นตั้งแต่จอแรกบนมือถือ (กฎที่เจ้าของเพิ่ม)

DOM เดิมเรียง ภาพ → หัวเรื่อง → ตัวตน → ปุ่ม พอ stack บนมือถือกิน 300–400px ก่อนถึงปุ่ม บวก shell ของ family อีก (วัดที่กว้าง 390px: fms-official 171px, studio-dark 201px) เดิมผ่าน **8 จาก 42** เคส

ตอนนี้ DOM คือลำดับของมือถือจริง — ยืนยัน → สิ่งที่ต้องทำต่อ → ภาพ → ตัวตน — แล้วประกอบ desktop 2 คอลัมน์กลับด้วย grid placement (`grid-column` / `grid-row` ตรง ๆ) จอมือถือจัดกึ่งกลางและบีบ action strip เพิ่ม

**ผลปัจจุบัน 42/42 ผ่าน** ที่ 360/390/412 เคสแย่สุด studio-dark unlocked ปุ่มจบที่ 638px

### confirm step แยกตาม template

`src/components/vote/VoteConfirm.js` — dispatcher ตัวเดียว + behaviour core + skin ต่อ family

| family | ภาษาที่ใช้ |
|---|---|
| blossom | โน้ตกระดาษ เส้นหมึก 1.5px ปุ่ม pill ป้ายเลือกเป็นแสตมป์ |
| gumroad | ขอบดำ 3px เงาแข็ง 8px แถบหัวดำ ตั๋วปรุ ปุ่ม lime |
| studio-dark | ราง `04 / CONFIRM` mono + serif italic pill lime |
| verdure | กระจก terrarium บน moss ตัวหนังสือ cream มนทั้งหมด |
| fms-official | หัวแถบ plum บนกระดาษขาว บรรทัดบันทึกมีเส้นขอบซ้าย |
| receipt | สลิปกระดาษเดิม (`ReceiptConfirmSlip`) dispatch ผ่านตัวเดียวกัน |
| classic/original | สร้างใหม่บน shell เดียวกัน ปุ่ม gradient ให้เข้ากับหน้า success ใหม่ |

Escape / scrim / focus move / ล็อกตอนกำลังส่ง **แชร์กันทั้งหมด** เพราะเป็นคุณสมบัติด้านความปลอดภัยของขั้นยืนยัน ไม่ใช่การตกแต่ง — modal เดิมไม่มีสักอย่างทั้งที่เป็น template default จึงถูกถอดออก (`src/components/VoteConfirmationModal.js` ลบแล้ว)

tone งดออกเสียง (ส้ม) และไม่รับรอง (แดง) ตรึงไว้ ไม่ให้กลายเป็นสีแบรนด์ของ template ไหน — กติกาเดียวกับที่ `ReceiptConfirmSlip` ใช้อยู่แล้ว

### บั๊กที่เจอระหว่างตรวจ แล้วแก้ไปด้วย

- **hydration mismatch ทุกหน้า preview** — `injectTemplateTheme` ถูกเรียกตอน iframe `onLoad` ซึ่งมาก่อน React hydrate ข้างใน มันเขียน inline Layer-1 token ลง `.fms-app` ทำให้ React เจอ attribute ที่ตัวเองไม่ได้ render ตอนนี้หน้า preview ยิง `fms-preview-hydrated` แล้ว injector รอสัญญาณนั้น (`injectTemplateThemeOnReady`)
- **ปุ่มหลักของ verdure state "ประเมินแล้ว" เป็นแคปซูลเปล่า** — `.vd-root a:not(.vd-btn){color:inherit}` specificity (0,2,1) ชนะ `.vx-verdure .vx-primary` (0,2,0) ตัวหนังสือ cream บนพื้น cream วัดได้ Δlum 0 พังเฉพาะ state นั้นเพราะอีก state เป็น `<button>` ไม่โดนกฎ แก้โดยยกเป็น `.vx-button.vx-primary`
- หน้า success ของ classic ใน preview ไม่มี chrome ทั้งที่อีกหกตระกูลมี และทั้งที่ vote/results/closed ของ classic เองก็ mount `<Navbar />` อยู่แล้ว

## วิธีตรวจซ้ำ

สคริปต์อยู่ใน `scripts/smoke/` ทุกตัวต้องมี dev server ที่ `:3000` และ **admin token** เพราะ `/template-preview` อยู่หลัง admin gate (`src/middleware.js` → `ADMIN_TOOL_PAGES`)

```bash
node scripts/smoke/successFold.mjs            # ปุ่มทำ form อยู่ใน first viewport ไหม
node scripts/smoke/successDesktop.mjs         # geometry 1440/1024/768 + ตรวจ overlap
node scripts/smoke/successButtonContrast.mjs  # ปุ่มอ่านออกไหม (จับเคส cream-on-cream)
node scripts/smoke/confirmSheets.mjs          # ทุก family เปิด sheet ของตัวเอง + Escape
node scripts/smoke/previewConsole.mjs         # กวาด console ทุกหน้า preview
node --test scripts/smoke/voteCast.test.mjs   # unit ของ controller
```

env ที่ใช้ได้: `QA_SLUGS`, `QA_W` / `QA_H`, `QA_VPS`, `QA_PICK=last` (เลือกงดออกเสียงเพื่อทดสอบ tone), `QA_OUT`, `QA_TOKEN_FILE` / `QA_ADMIN_TOKEN`

token: สคริปต์อ่านจาก `%TEMP%/qa-admin-token.txt` เป็นค่า default ถ้าไม่มีให้ออกใหม่ด้วย `node scripts/admin.js --rotate-password` แล้วใส่ `ADMIN_DEV_PASSWORD` ใน `.env.local` และรัน `node scripts/dev-admin-login.js` — **ห้าม commit ค่ารหัสลงไฟล์ใด ๆ ในรีโป**

ผลล่าสุดตอน merge:

```
successFold            42/42 in fold
successDesktop         1440/1024/768 overlap none
successButtonContrast  28 buttons, all readable
confirmSheets          7 families, focus moved, Escape ปิดได้ทุกตัว
previewConsole         121 surfaces, hydration/page/request error = 0
voteCast.test.mjs      tests 6, pass 6, fail 0
next lint              no warnings or errors
next build             compiled, 26/26 static pages
```

## ที่ยังค้าง

1. **flow vote จริงต่อ family** — cancel, submit ช้า, `fail=1`, กดย้ำ, keyboard focus บนหน้า ballot เอง ยังไม่ได้ไล่ครบทุก family (harness ที่เขียนไว้ขับได้แค่ขั้น confirm)
2. **ตรวจว่าบัตร receipt ถูกกล่องบังจริงทุก viewport** ยังไม่ได้ทำ
3. **success ที่มาจาก flow จริง** — form completion + result embargo ยังทำงานเหมือนเดิมไหม ต้องมี session จริง ยังไม่ได้ตรวจ
4. `previewConsole` ยังรายงาน warning เดิมสองตัวที่ไม่เกี่ยวกับงานนี้: `fill` Image ไม่มี `sizes` ที่ `OriginalHome.js:419` และ Recharts `width(-1)` ที่ results ของ classic — แยกเป็นงานต่างหาก
5. framer-motion จะเตือน `You have Reduced Motion enabled` บนหน้า preview เสมอ เพราะ preview ตั้ง `MotionConfig reducedMotion="always"` เองใน static mode — เป็น warning ที่ตั้งใจ ไม่ใช่บั๊ก แต่ทำให้ dev overlay ขึ้นป้าย "1 Issue"

## กับดักที่เจอ (เสนอเข้า Pitfall Log)

- **P-LOG-134** — iframe `load` ยิงก่อน React hydrate ข้างใน การเขียน inline style ลง DOM ตอนนั้นทำให้ hydration mismatch ทุกครั้ง ต้องรอสัญญาณ hydrate จากเอกสารข้างใน ไม่ใช่ `onLoad`
- **P-LOG-135** — ปุ่มที่เปลี่ยน element ระหว่าง state (`<button>` ตอนยังไม่ทำ, `<a>` ตอนทำแล้ว) จะโดนกฎ `a` แบบเหมาของ shell ที่ specificity สูงกว่า ทำให้พังเฉพาะ state เดียว เวลาทาสีปุ่มให้ใช้สองคลาสบน target เสมอ และวัดด้วยการเทียบสีที่ render จริง ไม่ใช่อ่านโค้ด
- **P-LOG-136** — overlay ที่ page เป็นคน render (modal, cast scene) อยู่นอก `.gum-root` / `.bl-root` / `.sd-root` / `.vd-root` จึงไม่ได้รับ CSS var ของ family ต้อง resolve palette ใน JS แล้วส่งเป็น inline var แบบที่ `VoteCastScene` ทำ — และเอาคลาส root ของ family มาแปะแทนไม่ได้ เพราะ `.sd-root` / `.bl-root` ทาพื้นเต็มจอ
- **P-LOG-137** — backtick ในคอมเมนต์ CSS ใน `<style jsx>` ปิด template literal ทำ build พังด้วย `Expected '</', got '…'` (เจอซ้ำสองครั้งใน session เดียว — ของเดิมเคยเจอมาแล้วในรอบ fms-official)
