# FMS Online Voting System (FMS-OVS)

ระบบเลือกตั้งออนไลน์ของสโมสรนักศึกษา คณะวิทยาการจัดการ ม.สงขลานครินทร์
ใช้จริงครั้งแรกในการเลือกตั้ง SAMO 49 (ปีการศึกษา 2569) และออกแบบมาให้ทีมรุ่นถัดไป
ใช้ซ้ำได้ทุกปีโดยไม่ต้องแก้โค้ด — ตั้งวันเลือกตั้ง ปี ชื่องาน และเลือกหน้าตาเว็บทั้งระบบ
ได้จากหน้า admin

จุดที่เราให้ความสำคัญที่สุดคือความน่าเชื่อถือของผลเลือกตั้ง: นักศึกษา login ด้วย
PSU Passport โหวตได้คนละหนึ่งครั้ง บัตรทุกใบถูกเก็บแบบนิรนาม เข้ารหัส และร้อยเป็น
hash chain ที่ตรวจย้อนหลังได้ — ไม่มีข้อมูลไหนในระบบที่บอกได้ว่าใครเลือกพรรคอะไร

## ความสามารถหลัก

- โหวตหนึ่งคนหนึ่งเสียง กันโหวตซ้ำระดับ DB (ผ่านการทดสอบยิงพร้อมกันสองคำขอ)
- บัตรนิรนาม + เข้ารหัส + hash chain, private key อยู่กับกรรมการแบบ offline เท่านั้น
  ถ้ากุญแจบนเซิร์ฟเวอร์ไม่ครบ ระบบปิดรับโหวตทันที (fail closed)
- รองรับ 2-6 พรรค — หลายพรรคเป็นบัตรเลือกพรรค พรรคเดียวเป็นหน้า showcase
  พร้อมตัวเลือก รับรอง / ไม่รับรอง / งดออกเสียง
- template ทั้งระบบ 6 ตระกูล 23 แบบ (original, gumroad, studio-dark, verdure,
  blossom, receipt) สลับได้จาก admin คลิกเดียว ดูตัวอย่างก่อนได้ที่
  `/template-preview` และ `/template-playground` โดยไม่แตะ DB
- ผลคะแนน + demographics แบบ real-time โดยคะแนนถูกปิด (embargo) ตั้งแต่ชั้น API
  จนกว่า admin จะสั่งเปิดเผย
- ฝั่ง admin มีปุ่มตรวจความพร้อมก่อนเปิดระบบ (14 รายการ), audit log บันทึกทุกคำสั่ง
  และตัวล็อกกันกดรีเซ็ตข้อมูลระหว่างการโหวตยังเปิดอยู่

Stack: Next.js (App Router), PostgreSQL + Prisma, NextAuth (PSU SSO), Tailwind,
Framer Motion, Recharts, Playwright — deploy ด้วย Docker ใต้ subpath `/fms-ovs`

## เริ่มพัฒนา

```bash
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev        # http://localhost:3000/fms-ovs
```

ตัวแปร env ที่ต้องมีใน `.env`:

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | เข้ารหัส session |
| `ADMIN_JWT_SECRET` | เซ็น cookie ของ admin (รหัสผ่าน admin อยู่ใน DB ไม่ใช่ env — ดู `scripts/admin.js`) |
| `ELECTION_BALLOT_PUBLIC_KEY`, `BALLOT_CHAIN_SECRET` | กุญแจบัตรลงคะแนน (ดูหัวข้อความปลอดภัย) |
| `NEXT_PUBLIC_ENABLE_MOCK_LOGIN` | ไม่ได้ใช้แล้ว — เก็บไว้เฉย ๆ ก็ได้ ไม่มีผลกับหน้า login |

ตอน dev เข้าระบบด้วย Mock Login บนหน้า login ได้เลย ส่วน admin ตั้งรหัสด้วย
`node scripts/admin.js --rotate-password` แล้วใส่ค่าที่ได้เป็น `ADMIN_DEV_PASSWORD`
ใน `.env.local` จากนั้น `node scripts/dev-admin-login.js` จะล็อกอินให้อัตโนมัติ

เข้าหน้า admin ด้วย **รหัส นศ. ที่ถูก `--grant` + รหัสกลาง** (ไม่ใช่รหัสประจำตัวใครคนใดคนหนึ่ง)
— กติกาเต็มอยู่ใน `docs/MAINTENANCE-RUNBOOK.md` §10

Mock Login เปิดให้เองเมื่อรัน dev และปิดเองบน production build — ปุ่มอ่านรายการ
provider จาก `/api/auth/providers` ตอน runtime จึงเป็นเงาของตัวกั้นจริง
(`NODE_ENV=production` ⇒ NextAuth ไม่ register provider นี้) ไม่มี env ให้ตั้งค้าง

กติกาการแก้โค้ด (basePath, ระบบสี token, ข้อห้ามต่างๆ) อยู่ใน [CLAUDE.md](CLAUDE.md)
และบทเรียนที่เคยเจ็บมาแล้วทั้งหมดอยู่ใน [DECISIONS.md](DECISIONS.md)

## ความปลอดภัยของบัตรลงคะแนน

ก่อนเลือกตั้งแต่ละปีต้องทำ key ceremony หนึ่งครั้งบนเครื่อง offline:

```bash
node scripts/generate-election-keys.js
```

private key พิมพ์ลงกระดาษแบ่งเก็บระหว่างเจ้าหน้าที่ผู้ดูแลระบบกับอาจารย์ที่ปรึกษา ห้ามอยู่บน
เซิร์ฟเวอร์หรือใน repo — ใช้เฉพาะตอนมีข้อพิพาทเพื่อ recount แบบ offline ส่วน public key
กับ chain secret ตั้งเป็น env บนเซิร์ฟเวอร์ และบน production ต้องรัน
`scripts/sql/ballot-grants.sql` เพื่อให้แอปมีสิทธิ์แค่ INSERT บนตารางบัตร
(การเลือกตั้งที่จบแล้วจึงแก้ไม่ได้แม้ยึด server ได้)

ระหว่างและหลังเลือกตั้ง: `verify-ballot-chain.js` ตรวจโซ่ทั้งตาราง,
`export-chain-head.js` เก็บปลายโซ่ไว้นอกเครื่อง, `reconcile-scores.js` audit
ก่อนเปิดผล

## การทดสอบ

```bash
npm run build      # ต้องผ่านก่อน deploy เสมอ
npm run smoke      # sanity 15 เคส (server ต้องรันอยู่)
npm run e2e        # Playwright 9 เคส: โหวตครบวงจร, โหวตซ้ำ/แข่งกัน, embargo, ฯลฯ
```

e2e ใช้ฐานข้อมูลทดสอบแยก (`<ชื่อ DB>_e2e` สร้างเองอัตโนมัติ) กับ server แยกที่ :3100
— ไม่มีทางไปแตะข้อมูลจริง เพราะทุกคำสั่งลบ/ล้างมี guard บังคับชื่อ DB ก่อนเสมอ
ลำดับ gate ก่อน deploy คือ build → smoke → e2e รายละเอียดอยู่ใน
`docs/MAINTENANCE-RUNBOOK.md`

## Deploy และงานประจำปี

ขั้นตอน deploy จริงไล่ทีละข้อใน [docs/DEPLOY-CHECKLIST-2026.md](docs/DEPLOY-CHECKLIST-2026.md)
(key ceremony, migrate, grants, env production, ปุ่มตรวจความพร้อมเป็นด่านสุดท้าย)
คู่มือแยกตามคนใช้ คนละไฟล์: [docs/STAFF-IT-GUIDE.md](docs/STAFF-IT-GUIDE.md) สำหรับ IT คณะ
(เซิร์ฟเวอร์ ฐานข้อมูล ติดตั้งด้วย `sh scripts/setup.sh` คำสั่งเดียว บัญชีแอดมิน) และ
[docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md) สำหรับสโมสรนักศึกษา (หน้าแอดมิน ไม่มีคำสั่งให้พิมพ์เลย)

เปลี่ยนปีการศึกษา: `npm run preflight` → `npm run archive-year` →
`npm run import-students -- <ไฟล์รายชื่อ>` → ตั้งวันและเลือก template ในหน้า admin
→ key ceremony ชุดใหม่ของปีนั้น

## เอกสาร

| เรื่อง | ไฟล์ |
|---|---|
| **คู่มือ IT คณะ — เซิร์ฟเวอร์/ฐานข้อมูล (ส่งมอบงาน)** | `docs/STAFF-IT-GUIDE.md` |
| **คู่มือสโมสรนักศึกษา — หน้าแอดมิน (ส่งมอบงาน)** | `docs/ADMIN-GUIDE.md` |
| สถานะระบบ + checklist ก่อน deploy | `docs/TEMPLATE-SYSTEM-STATE.md` |
| คู่มือดูแลระบบ | `docs/MAINTENANCE-RUNBOOK.md` |
| กติกาแก้โค้ด | `CLAUDE.md` |
| บทเรียน/pitfall ทั้งหมด | `DECISIONS.md` |

---

พัฒนาโดยสโมสรนักศึกษา คณะวิทยาการจัดการ ม.อ. ร่วมกับ Claude (Anthropic)
