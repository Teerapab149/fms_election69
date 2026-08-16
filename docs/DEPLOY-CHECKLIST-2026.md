# DEPLOY CHECKLIST — FMS Online Voting (SAMO 49, ปีการศึกษา 2569)

ขั้นตอน deploy จริงของปีนี้ **เรียงตามลำดับที่ต้องทำ**. ไล่จากบนลงล่าง ทำครบทุกข้อ
ก่อนเปิดหีบ. ไฟล์นี้ = source of truth ของ "วันขึ้นระบบ"; รายละเอียด ops ต่อเนื่อง
(backup / panic / รายปี) อยู่ที่ `docs/MAINTENANCE-RUNBOOK.md`, กติกาแก้โค้ดที่ `CLAUDE.md`.

> สแตก: Next.js (App Router, `output: 'standalone'`) + PostgreSQL (Prisma) + NextAuth
> (PSU SSO ผ่าน Authentik OIDC) · Docker ใต้ subpath **`/fms-ovs`** · admin = httpOnly
> JWT cookie · บัตรลงคะแนน = v2-SEC นิรนาม+เข้ารหัส+hash-chain.
>
> ทุกคำสั่ง/พาธในไฟล์นี้ถูกตรวจกับสคริปต์จริงในรีโปแล้ว (2026-07-17, HEAD `9314cf2`).

---

## 0. ก่อนเริ่ม — ต้องมีอะไรพร้อม

- [ ] เครื่อง **offline ที่เชื่อถือได้** (ไม่ต่อเน็ต) สำหรับพิธี gen กุญแจ (§2)
- [ ] ที่เก็บไฟล์กุญแจ 2 ที่ที่คณะคุมเอง (เช่น USB + ตัวจัดการรหัสผ่าน) — ไม่ต้องใช้เครื่องพิมพ์แล้ว
- [ ] เข้าถึง production DB (PostgreSQL) ในฐานะ role ที่ทำ DDL ได้ (`fms_migrate`/superuser)
- [ ] ค่า PSU SSO (Authentik) ปีนี้: client id / secret / redirect uri / issuer
- [ ] รายชื่อผู้มีสิทธิ์เลือกตั้งปีใหม่ (ปี 1–4) เป็นไฟล์พร้อม import
- [ ] build ผ่าน GREEN บน staging/dev แล้ว (`docs/TEMPLATE-SYSTEM-STATE.md §4` gate)

---

## 1. เตรียม environment variables (ยังไม่ตั้งกุญแจบัตร — ทำใน §2)

> 🛑 **บังคับ (2026-07-19):** docker-compose เวอร์ชันก่อนหน้าเคย hardcode
> รหัสผ่าน Postgres และ `NEXTAUTH_SECRET` ของเครื่อง dev ไว้ในไฟล์ — และ repo
> เป็น public บน GitHub ค่าเหล่านั้นจึงถือว่า**หลุดแล้ว** (ยังอยู่ใน git history)
> ห้ามนำค่าใดที่เคยอยู่ในไฟล์ compose มาใช้บน production เด็ดขาด — ทุก secret
> ของ prod ต้อง**สุ่มใหม่ทั้งหมด** และเครื่อง dev ควรเปลี่ยนรหัส Postgres ท้องถิ่นด้วย
> (compose ปัจจุบันอ่าน `POSTGRES_PASSWORD` จาก `.env` แล้ว ไม่มี secret ในไฟล์อีก)

> ✅ **Docker ผ่านการทดสอบจริงแล้ว (2026-07-19,** `docker-compose.local.yml`**):**
> build โดยไม่มี `.env` ใน image → `migrate deploy` ทั้ง 7 migrations ลง DB container
> เปล่า → seed → เว็บขึ้น :3000 — ตรวจแล้ว: static/รูปครบจาก standalone image,
> image optimizer (sharp) ทำงาน, mock login ไม่โผล่ใน prod image, สถานะเลือกตั้ง
> คำนวณเวลาไทยถูกบน container UTC, smoke ยิงใส่ container ผ่านหมด

ตั้งบน **server env** (Docker env / `.env` ที่ gitignored) — **ห้าม commit ลง git**:

| ตัวแปร | ค่า / หมายเหตุ |
|---|---|
| `DATABASE_URL` | connection string ของ production DB (role `fms_app` least-privilege — ดู §3) |
| `NEXTAUTH_SECRET` | สุ่มใหม่ทุกปี (`openssl rand -base64 32`) — เข้ารหัส session นักศึกษา |
| `NEXTAUTH_URL` | URL จริงของระบบ (เช่น `https://<host>/fms-ovs`) — ใช้ใน `layout.js`/callback |
| `BASE_PATH` | `/fms-ovs` — **ต้องมี** บอก Next.js ว่าเสิร์ฟที่ subpath ไหน |
| `NEXT_PUBLIC_BASE_PATH` | `/fms-ovs` — **ต้องมี** ตัวที่ `getPath()` ใช้สร้างลิงก์ฝั่งหน้าเว็บ |
| `ASSET_PREFIX` | `/fms-ovs` — ที่อยู่ของไฟล์ static (js/css/รูป) |
| `AUTHENTIK_CLIENT_ID` | PSU SSO client id (จาก PSU IT) |
| `AUTHENTIK_CLIENT_SECRET` | PSU SSO client secret |
| `AUTHENTIK_REDIRECT_URI` | callback URL ที่ลงทะเบียนไว้กับ PSU SSO |
| `ADMIN_JWT_SECRET` | สุ่มใหม่ (`openssl rand -hex 32`) — เซ็น/ตรวจ `admin_token` cookie |
| `ELECTION_BALLOT_PUBLIC_KEY` | **ตั้งใน §2** — public key เข้ารหัสบัตร (PEM, `\n`-escaped) |
| `BALLOT_CHAIN_SECRET` | **ตั้งใน §2** — secret ของ HMAC hash-chain บัตร |
| `NEXT_PUBLIC_ENABLE_MOCK_LOGIN` | ~~ต้องไม่ตั้งบน production~~ — **เลิกมีผลแล้ว (SEC-MOCK3, 2026-07-27)** ไม่ต้องตั้งและไม่ต้องกังวลว่าจะตั้งค้าง: ตัวกั้นจริงคือ `NODE_ENV=production` ซึ่งทำให้ NextAuth ไม่ register provider `mock-login` เลย และปุ่มบนหน้า login อ่านรายการ provider จาก `/api/auth/providers` ตอน runtime จึงหายตามไปเอง |

> ⚠️ **ตัวแปร base path ต้องตั้งครบทั้งสามตัว ไม่งั้นเว็บพังแบบเงียบ ๆ**
>
> `BASE_PATH` บอก Next.js ว่าเสิร์ฟที่ `/fms-ovs` ส่วน `NEXT_PUBLIC_BASE_PATH` เป็นตัวที่
> `getPath()` ใช้สร้างลิงก์ทุกอันในหน้าเว็บ · **สองตัวนี้คนละตัวกัน และค่า default ไม่ตรงกัน**
> ถ้าตั้งแค่ตัวใดตัวหนึ่ง เว็บจะเสิร์ฟที่ `/` แต่ลิงก์ทุกอันชี้ไป `/fms-ovs` → กดอะไรก็ 404 ทั้งเว็บ
> ทั้งที่ไม่มี error ในล็อกสักบรรทัด
>
> ถ้าใช้ `docker-compose.yml` ที่มากับโปรเจกต์ ตั้ง `BASE_PATH` กับ `ASSET_PREFIX` ใน `.env`
> พอ — compose ส่ง `NEXT_PUBLIC_BASE_PATH` ต่อให้เอง (บรรทัด 22) · ถ้า deploy วิธีอื่น ต้องตั้งเองครบทั้งสาม
>
> **เช็คหลัง deploy:** เปิดหน้าแรกแล้วกดเมนูสักอัน ถ้าเด้ง 404 ให้สงสัยข้อนี้ก่อนอย่างอื่น

> ⛔ **เลิกใช้แล้ว (P0-1)** — ห้ามตั้ง: `ADMIN_PRIVATE_KEY`, `ADMIN_AUTH_SECRET`,
> `NEXT_PUBLIC_ADMIN_PUBLIC_KEY`, `NEXT_PUBLIC_ADMIN_AUTH_SECRET`. ระบบ admin auth เก่า
> ฝัง secret ใน client bundle จึงถูกถอดออก. ถ้าย้ายมาจากปีก่อน ให้ **rotate `ADMIN_JWT_SECRET`**.
>
> ⛔ **เลิกใช้แล้ว (2026-07-28)** — ไม่ต้องตั้ง `ADMIN_PASSWORD_AUTH_EXTRA` และ
> `ADMIN_STUDENT_IDS` โค้ดไม่อ่านแล้วทั้งคู่. **รหัสผ่านแอดมินไม่อยู่ใน env อีกต่อไป** —
> หลัง deploy ให้รันบนเซิร์ฟเวอร์:
> ```bash
> node scripts/admin.js --grant <รหัส นศ. ของกรรมการแต่ละคน>
> node scripts/admin.js --rotate-password   # แสดงรหัสกลางครั้งเดียว แจกให้กรรมการ
> node scripts/admin.js --list              # ยืนยันว่ามีเฉพาะคนที่ตั้งใจ
> ```
> ดูเหตุผลและกฎเต็มที่ RUNBOOK §10.

---

## 2. พิธี gen กุญแจบัตรลงคะแนน (v2-SEC) — owner + กรรมการทำเอง OFFLINE

⚠️ **นี่คือพิธี ทำ 1 ครั้งต่อปีการเลือกตั้ง โดย owner + กรรมการ ไม่ใช่ระบบ deploy อัตโนมัติ.**
ดีไซน์ "B+" (locked `60e0de2`) กำหนดว่า **private key ต้องไม่เคยอยู่บนเซิร์ฟเวอร์และไม่เคยเขียนลงดิสก์ระบบ**.

> **อ่าน `docs/BALLOT-SECURITY-GUIDE.md` ก่อนทำพิธีครั้งแรก** — อธิบายว่ากุญแจแต่ละดอกทำอะไร
> ทำไมต้องแยกเก็บ และมีใบบันทึกผู้ถือกุญแจให้ปรินต์กรอก · ข้างล่างนี้คือขั้นตอนลงมือ

ขั้นตอน (บนเครื่อง offline ที่เชื่อถือได้):

1. [ ] คัดลอกไฟล์ `scripts/generate-election-keys.js` ไปเครื่อง offline (ไม่ต้อง DB/เน็ต) แล้วรัน:
   ```bash
   node scripts/generate-election-keys.js --out key-2569.enc
   ```
   `--out` เขียน **ไฟล์เดียวที่เข้ารหัสด้วยรหัสผ่านที่คุณตั้ง** (AES-256-GCM + scrypt)
   ข้างในมี PRIVATE KEY + CHAIN SECRET · เปิดคืนได้ด้วย
   `node scripts/generate-election-keys.js --decrypt key-2569.enc`
   (ไม่ใส่ `--out` = พฤติกรรมเดิม พิมพ์ออกจอเฉย ๆ ไม่เขียนไฟล์)

2. [ ] **PRIVATE KEY → เก็บเป็นไฟล์เข้ารหัส ไม่ต้องพิมพ์กระดาษ**
   - ก๊อปไฟล์ไปเก็บ **2 ที่ที่คณะคุมเอง** (เช่น USB + ตัวจัดการรหัสผ่านของเจ้าหน้าที่)
   - **ห้าม**เก็บบนเซิร์ฟเวอร์เลือกตั้ง ใน git ในอีเมล หรือ**ในชุดสำรองเดียวกับฐานข้อมูล**
   - อยากได้ split-custody แบบไม่ใช้กระดาษ: **ให้ไฟล์คนหนึ่ง บอกรหัสผ่านอีกคนหนึ่ง**
     คนเดียวเปิดไม่ได้ ได้ผลเท่าซองปิดผนึกสองซอง
   - ลบไฟล์ต้นทางออกจากเครื่องที่ใช้สร้างเมื่อก๊อปครบแล้ว
   - ใช้เฉพาะตอนมีข้อพิพาท (offline `decrypt-recount` — §9)
   - กุญแจหาย = เสียแค่ dispute-recount **ไม่เสียผลเลือกตั้ง** (tally จริง = `Candidate.score`)

   > **ทำไมห้ามอยู่บนเซิร์ฟเวอร์** ตาราง `Ballot` ไม่มี id ผู้ลงคะแนน ถอดบัตรอย่างเดียว
   > จึงได้แค่ "กองตัวเลือก" ซึ่งก็คือผลที่ประกาศอยู่แล้ว · อันตรายอยู่ที่**การจับคู่**:
   > บัตรเรียงตามเวลา (`seq`) และ `User.votedAt` เก็บเวลาของแต่ละคนไว้ ใครที่ถือ
   > **ทั้งสำเนาฐานข้อมูลและ private key** จะเรียงสองอย่างนี้ทาบกันแล้วรู้ว่าใครเลือกอะไรได้
   > การแยกกุญแจออกจากเซิร์ฟเวอร์คือสิ่งเดียวที่กันเรื่องนี้

3. [ ] **PUBLIC KEY → env `ELECTION_BALLOT_PUBLIC_KEY`** บนเซิร์ฟเวอร์ (ใช้บรรทัด `\n`-escaped ที่สคริปต์ให้)

4. [ ] **CHAIN SECRET → env `BALLOT_CHAIN_SECRET`** บนเซิร์ฟเวอร์ + **เก็บสำเนานอกเครื่อง**
   (ใช้ตอน verify โซ่ + export ปลายโซ่ — จำเป็นต่อการตรวจจับการแก้บัตร)

5. [ ] ก๊อปไฟล์กุญแจไปเก็บให้ครบ 2 ที่ แล้วลบไฟล์ต้นทาง · ล้าง scrollback / ปิดเทอร์มินัล

> ✅ **เช็ค:** เซิร์ฟเวอร์ต้องมีแค่ **public key + chain secret** เท่านั้น. ถ้า 2 ตัวนี้ไม่ครบ
> → `/api/vote` **fail closed** (คืน 503, โหวตไม่ได้, ไม่มีการเก็บ plaintext) — ทดสอบใน §7.

---

## 3. เตรียม production DB + least-privilege grants

1. [ ] สร้าง 2 roles (รันในฐานะ superuser/owner) — role แอปต้องเป็น least-privilege:
   ```sql
   CREATE ROLE fms_app LOGIN PASSWORD '<<เก็บใน server env เท่านั้น>>';
   GRANT CONNECT ON DATABASE fms_election TO fms_app;
   GRANT USAGE  ON SCHEMA public TO fms_app;
   ```
   (`DATABASE_URL` ของแอปชี้ไปที่ `fms_app`; DDL/migration รันด้วย role อื่น เช่น `fms_migrate`)

2. [ ] รัน migrations **ก่อน** apply grants (ต้องมีตาราง `Ballot`/`ChainHead` ก่อน) — ดู §4

3. [ ] apply grants — **path จริง = `scripts/sql/ballot-grants.sql`** (ไม่ใช่ `prisma/`):
   ```bash
   psql "$MIGRATE_DATABASE_URL" -f scripts/sql/ballot-grants.sql
   ```
   ไฟล์นี้ทำให้ role แอป **INSERT-only บน `Ballot`** (ห้าม UPDATE/DELETE) และ SELECT+UPDATE บน `ChainHead`
   → แอปแก้/ลบบัตรไม่ได้เชิงโครงสร้างแม้ถูก compromise.

4. [ ] ตรวจว่า lockdown ติดจริง (คำสั่งอยู่ท้ายไฟล์ grants):
   ```sql
   SELECT privilege_type FROM information_schema.role_table_grants
   WHERE grantee='fms_app' AND table_name='Ballot';
   -- คาดหวัง: SELECT, INSERT เท่านั้น (ต้องไม่มี UPDATE / DELETE)
   ```

---

## 4. Apply schema (prisma migrate deploy)

Docker image รัน `npx prisma generate` ตอน build แล้ว แต่ **ไม่ได้ migrate อัตโนมัติ**
(`CMD ["node","server.js"]`) → ต้องรัน migrate เองด้วย role ที่ทำ DDL ได้:

```bash
npx prisma migrate deploy       # apply committed migrations ตามลำดับ
```

migration ที่ต้องมีครบ (ล่าสุด = v2-SEC):
```
20251231105732_init_new_database
20260102175233_add_logo_url
20260114190038_add_slogan
20260519120000_add_templates_phase3
20260716120000_v2_sec_anonymous_ballots   ← สร้าง Ballot + ChainHead + seed genesis (id=1, head='GENESIS', seq=0)
```

- [ ] ตรวจ `npx prisma migrate status` = up to date
- [ ] ตรวจว่า `ChainHead` มี 1 แถว (`id=1, head='GENESIS', seq=0`) — migration seed ให้แบบ idempotent
- [ ] import รายชื่อผู้มีสิทธิ์ปีใหม่: `npm run import-students -- <ไฟล์รายชื่อ>`
- [ ] seed พรรคจริง (หรือกรอกผ่าน admin แท็บ "จัดการผู้สมัคร") + ลบพรรคทดสอบทิ้ง

> ⚠️ **หมายเหตุ drift (P-LOG-091):** ใน **dev** โปรเจกต์นี้ใช้ `prisma db push` ไม่ใช่ `migrate dev`
> (schema มี drift ประวัติศาสตร์). แต่สำหรับ **production fresh deploy** `migrate deploy` คือทางที่ถูก
> (apply migration ที่ commit ไว้ รวม v2-SEC). ถ้า `migrate deploy` รายงาน drift/ค้าง → **หยุด สอบสวน
> ก่อน** อย่า `db push` ทับบน prod. (ให้ Fable/owner ตัดสินถ้าเจอ drift จริงตอน deploy)

---

## 5. Build + ขึ้น Docker

```bash
# (Windows dev) หยุด dev server ก่อนเพื่อกัน .next EPERM lock
rm -rf .next
npm run build            # ต้องผ่านครบทุก route ก่อน deploy
```

- [ ] `npm run build` GREEN
- [ ] `docker build` + `docker compose up` (image ใช้ `node:20-alpine`, non-root `nextjs:1001`)
- [ ] mount volume `./public/images` (รูปผู้สมัคร/สมาชิก — redeploy ไม่หาย)
- [ ] ตั้ง env ทั้งหมดจาก §1–§2 ให้ container เห็นครบ

---

## 6. ตั้งค่าการเลือกตั้งในหน้า admin

เข้า `/fms-ovs/admin` (login ด้วย bootstrap password / บัญชี staff SSO) แล้ว:

- [ ] แท็บ **"ตั้งค่าทั่วไป"**: ชื่อการเลือกตั้ง / เลขครั้ง / ปีการศึกษา พ.ศ.+ค.ศ. / ชื่อคณะ-องค์กร
- [ ] แท็บ **"ตั้งค่าทั่วไป" → "ช่วงเวลาเลือกตั้ง"**: ตั้ง 3 ช่อง (เปิดตัวผู้สมัคร / เปิดหีบ / ปิดหีบ)
  — เวลาถูก pin เป็น **Asia/Bangkok** end-to-end (ADM-2)
- [ ] แท็บ **"ตั้งค่าระบบ"**: `systemMode = AUTO`, `showResult = false` (ซ่อนผลจนกว่าปิดหีบ)
- [ ] แท็บ **"จัดการผู้สมัคร"**: พรรคจริงครบ + สมาชิก + รูป + สีพรรค (พรรคเดียวต้องมี −1 และ 0)
- [ ] ล้างคะแนน/บัตรทดสอบก่อนเปิดจริง — **ไม่มีปุ่มในหน้า admin แล้ว (2026-07-28)**
  รันที่ฐานข้อมูลด้วยบัญชี `fms_migrate`: `psql ... -f scripts/sql/annual-reset.sql`
  → score=0, กล่องบัตรว่าง, โซ่กลับ genesis, คืนสิทธิ์โหวตปี 1-4, ปลดธง `ballotsAnonymized`
- [ ] ตั้งลิงก์ Google Form (หน้า success) ถ้ามี

---

## 7. กดปุ่มตรวจความพร้อม (ADM-1) — ต้องไม่มี fail

- [ ] แท็บ **"ตั้งค่าระบบ" → ปุ่ม "ตรวจความพร้อมระบบ"** (เรียก `GET /api/admin/readiness`, read-only)
- [ ] ตรวจครบ **14 ข้อ** ต้อง **ไม่มี `fail`** (warn ให้อ่านทีละข้อว่ายอมรับได้ไหม):

  | กลุ่ม | ข้อ |
  |---|---|
  | schedule | ลำดับเปิด-ปิดหีบ · เวลาเปิดตัวผู้สมัคร · แหล่งที่มาของเวลา · ความสอดคล้องกับปัจจุบัน |
  | schedule | โหมดการทำงาน (mode.coherence) |
  | candidates | จำนวนพรรค · ตัวเลือกกรณีพรรคเดียว · ความครบถ้วนของข้อมูลพรรค |
  | voters | รายชื่อผู้มีสิทธิ์ (ปี 1–4) > 0 |
  | tally | ความสอดคล้องคะแนน (`sum(score) == #บัตร == #isVoted`) |
  | config | ลิงก์ Google Form · การรั่วของผลก่อนปิดหีบ · ธีมที่ใช้งานมีจริง |
  | env | mock-login ปิดอยู่ (production build ปิดให้เอง — ดูหมายเหตุใต้ตาราง) |

- [ ] ยืนยัน `env.mock` = pass (mock-login ปิด) — บน production build ข้อนี้ **เขียวเอง**
  เพราะ `NODE_ENV=production` ทำให้ provider ไม่ถูก register · ถ้าเจอ fail แปลว่า
  เซิร์ฟเวอร์นั้นไม่ได้รันเป็น production build จริง (เช่น `npm run dev`) ไม่ใช่เรื่อง env
  ตัวใดตัวหนึ่งตั้งค้าง — ยืนยันแล้วบน production build ที่จงใจ build ตอน
  `NEXT_PUBLIC_ENABLE_MOCK_LOGIN=true` ก็ยังได้ pass (SEC-MOCK3)

---

## 8. เลือก template ของปีนี้

- [ ] แท็บ **"ออกแบบหน้าเว็บ" → template chooser**: preview flow จริงก่อน (`?interact=1`) แล้ว apply
  (`activeTemplateId`) — ตระกูล gumroad / studio-dark / verdure (สลับสีได้) / original / receipt / blossom
- [ ] ปรับธีมสี/ฟอนต์/มุมโค้ง (theme tokens) ถ้าต้องการหน้าตาใหม่โดยไม่แก้โค้ด

---

## 9. Smoke test หลัง deploy (ก่อนประกาศเปิดหีบ)

- [ ] **health:** `curl https://<host>/fms-ovs/api/health` → `200 {"ok":true,"db":true}`
- [ ] **fail-closed:** ถ้า `ELECTION_BALLOT_PUBLIC_KEY`/`BALLOT_CHAIN_SECRET` หาย → `/api/vote` คืน 503 (ทดสอบบน staging)
- [ ] **โหวตจริง 1 ครั้ง** (บัญชีทดสอบ/ช่วง staging): login → เลือก → ยืนยัน → success → `isVoted` ติด, โหวตซ้ำถูกปฏิเสธ
- [ ] **โซ่บัตร:** `node scripts/verify-ballot-chain.js` → ทุกข้อ PASS (ต้องมี `BALLOT_CHAIN_SECRET` ใน env)
- [ ] ตั้ง uptime checker ยิง `/api/health` ทุก 1–5 นาที ช่วงวันเลือกตั้ง
- [ ] ตั้ง cron `sh scripts/backup.sh` รายวัน (RUNBOOK §5) + ซ้อม `restore.sh` อย่างน้อย 1 ครั้ง

**หลังปิดหีบ + ก่อนประกาศผล (certification):**
- [ ] `node scripts/verify-ballot-chain.js` + `node scripts/reconcile-scores.js` → PASS (โซ่ไม่ถูกแก้ + invariant ตรง)
- [ ] `node scripts/export-chain-head.js` เก็บปลายโซ่ไว้นอก DB
- [ ] เปิด `showResult = true` แล้วกดปุ่ม **"รับรองผล"** (ตั้งธง `ballotsAnonymized` — RUNBOOK §1.1 B / §11)
- [ ] `npm run archive-year` เก็บผล+หน้าตาปีนี้ลง git (ก่อน reset ปีถัดไป)

> dispute-recount รายพรรค (ถ้าจำเป็น) = `node scripts/decrypt-recount.js --key <path>` — **offline เท่านั้น**
> ด้วย private key แบ่งเก็บจาก §2. เซิร์ฟเวอร์อ่านบัตรกลับไม่ได้ตามดีไซน์.

---

## 10. อ้างอิงไฟล์/สคริปต์ (ทุกตัวมีจริงในรีโป)

| ใช้ทำอะไร | path |
|---|---|
| gen กุญแจบัตร (offline) | `scripts/generate-election-keys.js` |
| grants least-privilege | `scripts/sql/ballot-grants.sql` |
| ตรวจโซ่บัตร | `scripts/verify-ballot-chain.js` |
| audit คะแนน = โซ่ + invariant | `scripts/reconcile-scores.js` |
| export ปลายโซ่ | `scripts/export-chain-head.js` |
| dispute recount (offline) | `scripts/decrypt-recount.js` |
| preflight รายปี (CLI) | `scripts/preflight-year.js` (`npm run preflight`) |
| import ผู้มีสิทธิ์ | `scripts/import-students.js` (`npm run import-students`) |
| archive ปีเก่า | `scripts/archive-year.js` (`npm run archive-year`) |
| readiness 14 ข้อ (ADM-1) | `src/app/api/admin/readiness/route.js` |
| crypto/chain ของบัตร | `src/lib/ballotCrypto.js` · `src/lib/ballotChain.js` |
| ops ต่อเนื่อง/panic | `docs/MAINTENANCE-RUNBOOK.md` |
