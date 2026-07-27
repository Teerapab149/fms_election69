# MAINTENANCE & PANIC RUNBOOK — FMS Online Voting (SAMO 49)

คู่มือสำหรับ **staff ที่ดูแลระบบ + dev คนถัดไป** ให้ระบบอยู่ได้ยาว โดยคนที่ไม่ได้สร้างมันก็ดูแลต่อได้.
อ่านคู่กับ `CLAUDE.md` (ภาพรวม + conventions) และ `docs/HANDOFF-*.md` (สถานะงาน editor).

> หลักคิดที่ตกลงกันไว้ (memory `editor-strategy-decision`): สิ่งที่ทำให้ระบบ **อยู่ครบหลายปี = ความทนทานเชิง
> operation + เอกสารนี้** ไม่ใช่ความหลากหลายของดีไซน์. การเปลี่ยนหน้าตาแต่ละปีทำได้ด้วย **เลือก template +
> เปลี่ยนสี (theme tokens) + แก้เนื้อหา** ผ่านหน้า admin — ไม่ต้อง design ใหม่จากศูนย์.

---

## 0. ระบบนี้คืออะไร (1 ย่อหน้า)
Next.js (App Router) + PostgreSQL (Prisma) + NextAuth (PSU SSO OpenID). Deploy เป็น Docker ที่ subpath
`/fms-ovs`. หน้า admin ใช้ **httpOnly JWT cookie `admin_token`** (P0-1 — เลิกใช้ RSA token เก่าแล้ว). ข้อมูล
เลือกตั้ง (พรรค/สมาชิก/คะแนน) อยู่ใน DB; บัตรลงคะแนนเก็บแบบนิรนาม+เข้ารหัส+ต่อ hash chain (v2-SEC — ดู §11);
วันเวลาเลือกตั้งตั้งได้ใน admin (เก็บใน `SystemConfig.globalConfig`) โดยมีค่า default ในโค้ด
(`src/utils/electionConfig.js`) เป็น fallback. **Deploy ปีนี้: ไล่ `docs/DEPLOY-CHECKLIST-2026.md` ทีละขั้น.**

---

## 1. งานประจำปี — เปลี่ยนปีการเลือกตั้งใหม่ (checklist)
> ✅ **ตรวจสอบจริง 2026-06-09:** หน้า admin (`/fms-ovs/admin`, 5 แท็บ) ครอบคลุมงานรายปี **เกือบทั้งหมด** —
> staff ทำเองได้โดยไม่ต้องมี dev **ครบทุกข้อแล้ว** (รวมวันเวลาเลือกตั้ง — ดูข้อ 6, ย้ายเข้า admin แล้ว 2026-06-09).

ทำผ่านหน้า admin (ไม่ต้องแตะโค้ด) ตามแท็บ:

1. **ชื่อ/ปี/เลขครั้ง/เนื้อหา** — แท็บ **"ตั้งค่าทั่วไป"**: ชื่อการเลือกตั้ง (SAMO 50→51), เลขครั้งที่,
   ปีการศึกษา พ.ศ. (2570→2571), ปี ค.ศ., ชื่อโครงการ/องค์กร/คณะ/มหาวิทยาลัย/ปีลิขสิทธิ์ (ทุกช่องมีปุ่ม ↺ คืนค่า).
2. **พรรค + สมาชิก** — แท็บ **"จัดการผู้สมัคร"**: เพิ่ม/แก้/ลบพรรค + สมาชิก + รูป + สีพรรค (รูปถูก optimize อัตโนมัติ).
3. **หน้าตา/สี (ธีม)** — แท็บ **"ออกแบบหน้าเว็บ"** → **"ธีมสี / Theme Tokens"**: ปรับสี/ฟอนต์/มุมโค้งทั้งเว็บพร้อมกัน
   → **เปลี่ยนสีก็ทำให้ "รู้สึกใหม่" ได้ทั้งปีโดยไม่ต้องสร้าง template ใหม่** (กลไก variety หลัก). + เลือก template,
   จัด Sections หน้า Home (เปิด/ปิด/ลำดับ), สลับ variant ของ element (คลัง 47 ชนิด).
4. **โหมดระบบ + แสดงผล + Google Form** — แท็บ **"ตั้งค่าระบบ"**: `AUTO` (ใช้เวลาจาก electionConfig) /
   `MANUAL_OPEN` (force เปิด) / `PAUSE` / `ENDED`; toggle บังคับโชว์ผล real-time; ลิงก์ Google Form (หน้า success).
5. **รีเซ็ตเริ่มปีใหม่** — แท็บ **"ตั้งค่าระบบ"**: ปุ่ม **"ล้างคะแนนโหวตทั้งหมด"** + **"ล้างพรรคและสมาชิกทั้งหมด"**.
   ⚠️ **สำรอง DB ก่อนเสมอ** (ดู §5). (`Candidate.score`=ยอดจริง, `User.isVoted`=กันโหวตซ้ำ.)
6. ✅ **วันเวลาเลือกตั้ง (เปิด/ปิดหีบ/เปิดตัวผู้สมัคร)** — **ทำใน admin ได้แล้ว (2026-06-09)**:
   แท็บ **"ตั้งค่าทั่วไป" → กลุ่ม "ช่วงเวลาเลือกตั้ง"** มี date-time picker 3 ช่อง. ใช้เฉพาะโหมด `AUTO`.
   **ปล่อยว่าง = ใช้ค่า default ในโค้ด** (`src/utils/electionConfig.js`, ยังเป็น fallback กันพลาด)
   → ไม่ต้องแก้โค้ด/redeploy เพื่อเปลี่ยนวันอีกแล้ว.

> เลขพรรคพิเศษ: `number = 0` → งดออกเสียง, `number = -1` → ไม่รับรอง (ใช้ตอนมีพรรคเดียว), `> 0` → พรรคจริง.
> ปีผู้มีสิทธิ์ที่ valid: `ปี 1`–`ปี 4` เท่านั้น.

### 1.1 ลำดับงานรายปี (push-button) + ตัวช่วย script (อ่านอย่างเดียว ไม่ลบข้อมูล)
ทำตามลำดับนี้ทุกปี — admin UI ทำส่วนที่ "แก้ข้อมูล", script 2 ตัวช่วย "เก็บของเก่า" + "ตรวจก่อนเปิด":

**A. ปิดปีเก่า (หลังรับรองผล — `showResult=true`, คะแนนสุดท้ายแล้ว):**
```
npm run archive-year         # → archive/<SAMO-XX>/ (results.json + design.json + README)
git add archive/<SAMO-XX> && git commit -m "archive(<SAMO-XX>): results + design"
```
เก็บ "ปีนั้น = ผลนี้ + หน้าตานี้" ลง git ถาวร **ก่อน** reset (ตอนคะแนนยังอยู่). ดู `archive/README.md`.

**B. รับรองผล / Certify (หลังปิดหีบ + เผยแพร่ผล):** กดปุ่ม **"รับรองผล"** ในแท็บ "ตั้งค่าระบบ"
(action `ANONYMIZE_BALLOTS` — ชื่อเดิม P0-6, ตอนนี้เป็น *certification flag*).
⚠️ **v2-SEC เปลี่ยนความหมาย:** บัตรทุกใบ **ไม่มีลิงก์ถึงผู้ลงคะแนนอยู่แล้วโดยโครงสร้าง** (`Ballot`
ไม่มี `userId` + choice เข้ารหัส) — ไม่มี "ร่องรอยว่าใครเลือกใคร" ให้ลบเหมือนโมเดลเก่า. ปุ่มนี้จึงแค่
**ตั้งธง `globalConfig.ballotsAnonymized = true`** เป็นหมุดรับรองผล ที่ downstream tools ยอมรับ
(เช่น reconcile-scores ถือว่า `Candidate.score` ถูก freeze แล้ว). ทำได้เฉพาะหลังปิดหีบ + เปิด `showResult`
(ระบบกันทำกลางคัน). คะแนนรวมอยู่ที่ `Candidate.score` (atomic increment ตอนโหวต) = บันทึกสุดท้ายอยู่แล้ว.

**C. ตั้งปีใหม่ (admin UI):** ตามข้อ 1–6 ด้านบน — ตั้งชื่อ/ปี/วันเวลา, `systemMode=AUTO`, seed พรรคจริง,
ลบพรรคทดสอบ, **"ล้างคะแนนโหวตทั้งหมด"** (RESET_VOTES), `showResult=false`, import รายชื่อผู้มีสิทธิ์ปีใหม่.

**D. ตรวจก่อนเปิดหีบ (gate) — มี 2 ทาง ใช้คู่กัน:**
```
# ทาง 1 (แนะนำ กรรมการกดเองได้): แท็บ "ตั้งค่าระบบ" → ปุ่ม "ตรวจความพร้อมระบบ" (ADM-1)
#   เรียก GET /api/admin/readiness (read-only) → สรุป pass/warn/fail 14 ข้อ:
#   schedule (ลำดับเวลา/เปิดตัวผู้สมัคร/แหล่งเวลา/อดีต), mode.coherence, candidates
#   (มีพรรค/พรรคเดียวมีตัวเลือกครบ/เนื้อหาครบ), voters, tally.integrity, config
#   (googleForm/ผลรั่ว/ธีม), env.mock — ต้อง "ไม่มี fail" (warn อ่านทีละข้อ)

# ทาง 2 (CLI สำหรับ dev): script อ่านอย่างเดียว
npm run preflight            # ✓/⚠/✗ (mode/showResult/พรรคทดสอบ/คะแนน=0/ยังไม่โหวต/
                             #   วันเวลา/รายชื่อ/secrets/mock-login) — exit 1 ถ้ามี ✗
```
ถ้ายังมี fail/✗ = **ยังไม่พร้อม** ห้ามเปิด. แก้ให้เขียวก่อน แล้วค่อยเปิดหีบ.

---

## 2. Environment variables ที่ต้องมี (ตั้งตอน deploy)
```
DATABASE_URL              # PostgreSQL connection string
NEXTAUTH_SECRET           # คีย์เข้ารหัส NextAuth (session นักศึกษา)
NEXT_PUBLIC_BASE_PATH     # subpath ตอน deploy (ค่า: /fms-ovs)
ADMIN_JWT_SECRET          # เซ็น/ตรวจ admin_token JWT cookie (auth แอดมิน — P0-1)
ADMIN_PASSWORD_AUTH_EXTRA # bootstrap password แอดมิน (ครั้งแรก) — ดู /api/admin/login
                          # ⚠️ รหัสที่กรอกตอน login ไม่ใช่ค่านี้ตรง ๆ แต่เป็น
                          #    "<email ของแอดมินใน DB>+<ค่านี้>"  (ต่อด้วย + ไม่มีเว้นวรรค)
                          #    เช่น 6610510129@email.psu.ac.th+xxxxx — ดู login/route.js
                          #    (บรรทัด `const expected = \`${dbEmail}+${bootstrapSecret}\``)
ADMIN_STUDENT_IDS         # รหัส นศ. ที่เป็นแอดมิน (คั่นด้วย ,) — ดู §10
ELECTION_BALLOT_PUBLIC_KEY # v2-SEC: public key เข้ารหัสบัตร (PEM, \n-escaped) — ดู §11 + DEPLOY-CHECKLIST
BALLOT_CHAIN_SECRET       # v2-SEC: secret สำหรับ HMAC hash-chain ของบัตร — ดู §11 + DEPLOY-CHECKLIST
```
> 🔑 **`ELECTION_BALLOT_PUBLIC_KEY` + `BALLOT_CHAIN_SECRET` ไม่ครบ → `/api/vote` fail closed**
> (โหวตไม่ได้ ไม่มีการเก็บ plaintext). **private key ไม่อยู่บนเซิร์ฟเวอร์** (offline, dispute-only — §11).
+ ตัวแปร PSU SSO (client id/secret/issuer) — ดู `src/lib/auth.js`. **เก็บในที่ปลอดภัย + สำรองไว้** (ถ้าหาย = ตั้งใหม่). ห้าม commit ลง git.

> ⚠️ **เลิกใช้แล้ว (P0-1, 2026-06-10):** `ADMIN_PRIVATE_KEY` / `ADMIN_AUTH_SECRET` /
> `NEXT_PUBLIC_ADMIN_PUBLIC_KEY` / `NEXT_PUBLIC_ADMIN_AUTH_SECRET` — ระบบ admin auth เก่า
> ฝัง secret ใน client bundle (ใครก็ปลอม token ได้) จึงถูกถอดออก. ลบตัวแปรพวกนี้ทิ้งได้.
> **ต้อง ROTATE** `ADMIN_JWT_SECRET` + `ADMIN_PASSWORD_AUTH_EXTRA` ใหม่ (ของเก่าถือว่ารั่ว)
> แล้วตั้ง admin user `passwordHash=null` เพื่อให้ bootstrap password ใหม่มีผล.

---

## 3. รันในเครื่อง (dev)
```
npm install
npx prisma generate         # ถ้าเพิ่งแก้ schema: npx prisma db push  (อย่า migrate — ดู §6)
npm run dev                 # http://localhost:3000/fms-ovs
```
Windows quirk: ถ้า `.next` ล็อก/พัง → หยุด dev server, `rm -rf .next`, รันใหม่.

---

## 4. Build + Deploy
```
# (Windows) หยุด dev server ก่อน แล้วค่อยลบ .next กัน EPERM lock
rm -rf .next
npm run build               # ต้องผ่านครบทุก route ก่อน deploy
```
Deploy เป็น Docker ที่ subpath `/fms-ovs`. **ทุก URL ภายในต้องผ่าน `getPath()`** (utils/basePath.js) —
ถ้าเห็นลิงก์/รูปพังหลัง deploy มักเพราะมี path ตรงๆ ที่ไม่ผ่าน `getPath()`.

---

## 4.1 Pre-merge gate — test net (รันก่อน merge/ก่อน deploy ทุกครั้ง)
"นโยบาย: ถ้า gate ไม่เขียว ห้าม merge" — กันการแก้โค้ดทำ flow เลือกตั้งพังเงียบๆ ตลอด 5 ปี.
```
# หยุด dev server ก่อน (มันจะ build → .next ล็อกบน Windows)
bash scripts/verify.sh          # build GREEN → e2e vote-net → smoke (ครบ = ผ่าน)

# โหมดเร็ว: ใช้ server ที่รันอยู่แล้ว ไม่ build ใหม่ (เช่น dev :3000 เปิดอยู่)
VERIFY_REUSE_URL=http://localhost:3000 bash scripts/verify.sh
```
ครอบอะไรบ้าง:
- **e2e** (`npm run e2e` ครบชุด / `npm run e2e:gate` = `vote-flow` + `invariants`):
  happy path (login→เลือก→ยืนยัน→success โชว์ identity receipt→หีบ +1 + โซ่ HMAC verify ผ่าน)
  + invariants ที่ห้าม regress — vote-once, race (1 ชนะ), results embargo (API+หน้าเว็บไม่รั่ว
  tally ก่อน reveal แม้ admin), eligibility (ปี 1-4), admin-auth (no-cookie/forge → 401 ทั้ง
  dashboard และ readiness), vote-no-session → 401 · บวก `abstain` (งดออกเสียงไม่แตะพรรคจริง)
  และ `closed` (ENDED → /vote เด้ง /closed + API ปฏิเสธ) ในชุดเต็ม.
  **v2-R11: e2e รันบน test DB แยก + server แยก (:3100) — ไม่แตะ dev DB/dev server แล้ว (ดู §4.2).**
- **smoke** (`npm run smoke`): invariants ระดับ HTTP + กฎสิทธิ์ admin (roleFromSso) — ยังรันกับ
  dev server :3000 ตามเดิม.
- ลำดับ e2e ก่อน smoke ไม่ critical แล้ว (คนละ server คนละ DB) — แต่ smoke ยัง trip login
  rate-limit ของ :3000 เองตามเดิม (10/5นาที/IP).
- ⚠️ `e2e/admin-console.spec.js` (ของเดิม คนละชุด) ยังมี 11 เคสแดงค้าง — ถูก exclude ออกจาก
  playwright config (`testIgnore`) รอแก้แยก.

## 4.2 e2e test DB (v2-R11) — วิธีทำงาน + วิธีรัน
e2e ทั้งชุดแยกตัวจาก dev สมบูรณ์: **DB ของตัวเอง + server ของตัวเอง**. คนดูแลรุ่นถัดไปกดรันได้เลย:
```
npm run build        # 1) ต้องมี prod build ก่อน (หยุด dev server ตอน build — Windows .next lock)
npm run e2e:gate     # 2) หรือ npm run e2e (ครบชุด) — setup ทำทุกอย่างให้อัตโนมัติ
```
สิ่งที่ globalSetup (e2e/global.setup.js) ทำให้อัตโนมัติ:
1. เช็ค `.next/BUILD_ID` — ไม่มี = fail-fast พร้อมข้อความบอกให้ build (ไม่ build ให้เอง)
2. สร้าง DB `<ชื่อ dev DB>_e2e` ถ้ายังไม่มี (เช่น `fms_election_e2e`) + sync schema ด้วย
   `prisma db push` (⚠️ ไม่ใช่ `migrate deploy` — migration history เก่าไม่ครบ schema ปัจจุบัน
   เช่น `SystemConfig.systemMode` ไม่เคยถูก capture เป็น migration; พบตอนทำ v2-R11 ต้องเก็บ
   drift นี้เป็น migration จริงก่อน deploy รอบหน้า)
3. seed fixture เล็ก: 2 พรรค + งดออกเสียง/ไม่รับรอง + voter 3 คน + admin 1 + SystemConfig
   MANUAL_OPEN + template `receipt` (หน้า success พิมพ์ identity receipt ที่ spec ตรวจ)
4. รัน `next start -p 3100` ชี้ `DATABASE_URL` ไป test DB (dev :3000 ไม่ถูกแตะ)
5. globalTeardown: ปิด server + TRUNCATE ทุกตารางใน test DB (เก็บ DB ไว้ให้รอบหน้าเร็ว)

กติกาความปลอดภัย (สำคัญที่สุด):
- **ทุก destructive SQL (CREATE/TRUNCATE/UPDATE ตรง) ผ่าน guard `assertTestDb` ใน
  `e2e/helpers/testDb.js`** — ถาม `current_database()` จาก connection จริงแล้วปฏิเสธทันที
  ถ้าชื่อไม่ลงท้าย `_e2e`. dev DB (`fms_election`) จึงพังจาก e2e ไม่ได้เชิงโครงสร้าง.
- e2e gate รันกับ **build local เท่านั้น** — mock login ถูก bake ตอน build
  (`NEXT_PUBLIC_ENABLE_MOCK_LOGIN=true` ใน .env.local). build สำหรับ deploy จริงใช้ env prod
  (mock=false) และ**ห้าม**รัน e2e กับ build นั้น (login panel ไม่มีให้กด — fail เอง).
- server :3100 ถูก start ด้วย `NODE_ENV=development` โดยเจตนา (เสิร์ฟ prod build เหมือนเดิม
  แต่ NextAuth ยอม register mock-login provider ซึ่ง gate ที่ `NODE_ENV !== 'production'`).
- ลำดับ gate เต็ม: **build → smoke → e2e:gate** (นโยบาย §4.1: ไม่เขียว ห้าม merge).

---

## 5. สำรอง/กู้คืน DB + รูป (ทำก่อนงานเสี่ยงทุกครั้ง)
ใช้สคริปต์สำเร็จ (รันบน server ที่มี docker compose):
```
sh scripts/backup.sh
# → backups/db-<ts>.sql.gz (pg_dump) + backups/images-<ts>.tar.gz (public/images)
# ตั้ง cron รายวัน: 0 2 * * * cd /path/to/fms_election69 && sh scripts/backup.sh >> backups/backup.log 2>&1

# กู้คืน (DESTRUCTIVE — ยืนยันก่อน):
sh scripts/restore.sh backups/db-<ts>.sql.gz backups/images-<ts>.tar.gz
docker compose restart web
```
- รูปผู้สมัคร/สมาชิก mount เป็น volume `./public/images` ใน compose แล้ว → redeploy ไม่หาย.
- **สำรองก่อน: เปิดเลือกตั้ง, รีเซ็ตคะแนน, รับรองผล (Certify), แก้ schema, อัปเดต deps.**
- ⚠️ **backup ที่ไม่เคยกู้ = ไม่มี backup** → ซ้อม `restore.sh` ใส่ DB ทิ้งๆ อย่างน้อย 1 ครั้งก่อนวันเลือกตั้ง.

### 5.1 ตรวจคะแนนก่อนประกาศผล (certification — ทำทุกครั้งก่อนเปิด showResult)
หน้า results อ่านคะแนนจากคอลัมน์ `Candidate.score` (single source of truth, 2026-06-12).
⚠️ **v2-SEC เปลี่ยนวิธีตรวจ:** บัตรตอนนี้ **นิรนาม+เข้ารหัส (ไม่มี `User.candidateId`)** — recount
รายพรรคจาก plaintext ทำไม่ได้บนเซิร์ฟเวอร์ (ทำได้เฉพาะ offline ด้วย private key — §11). ก่อนประกาศผล
ให้ตรวจ 2 อย่าง: **โซ่ HMAC ไม่ถูกแก้** + **invariant รวมตรงกัน** (`#บัตร == sum(score) == #isVoted ปี1-4`):
```
node scripts/verify-ballot-chain.js       # recompute โซ่ทั้งตาราง + cross-check ChainHead + count
node scripts/reconcile-scores.js          # audit เดียวกัน (แชร์ scripts/lib/chainVerify.js) — ต้อง PASS
```
> ทั้งสองต้องการ `BALLOT_CHAIN_SECRET` ใน env/.env. **ไม่มี `--fix` อีกแล้ว** — score ถูก maintain
> แบบ atomic ตอนโหวต + กล่องบัตร append-only → mismatch = เหตุจริงต้องสอบสวน (มี code path แตะข้างเดียว)
> ไม่ใช่เขียนทับ. reconcile ยังรันได้หลังรับรองผล (`ballotsAnonymized`) แต่จะเตือนว่าคะแนน freeze แล้ว.

---

## 6. PANIC — อาการพัง + วิธีแก้

**เช็คก่อนทุกอย่าง:** `curl https://<host>/fms-ovs/api/health`
- `200 {"ok":true,"db":true}` → app + DB ปกติ (ปัญหาอยู่ชั้นอื่น เช่น SSO/หน้าเว็บเฉพาะหน้า)
- `503 {"ok":false,"db":false}` → app ขึ้นแต่ DB ล่ม → ตรวจ container Postgres / `DATABASE_URL`
- ไม่ตอบเลย → app ล่ม → ตรวจ Docker/host
แนะนำตั้ง uptime checker (เช่น cron + curl, UptimeRobot) ยิง endpoint นี้ทุก 1-5 นาทีช่วงวันเลือกตั้ง.

| อาการ | สาเหตุที่พบบ่อย | แก้ |
|---|---|---|
| **Login PSU ไม่ได้ทั้งระบบ** | PSU เปลี่ยน SSO endpoint/cert หรือ client secret หมดอายุ | ขอค่าใหม่จาก PSU IT → อัปเดต env (issuer/client id/secret ใน `lib/auth.js`) → redeploy. **อาการนี้มากับเวลา ไม่เกี่ยวโค้ดเรา** |
| **`npm run build` พัง** | deps/Next.js เปลี่ยน หรือ `.next` ค้าง | `rm -rf .next node_modules && npm install && npm run build`; อ่าน error route แรกที่ fail |
| **admin เข้าไม่ได้** | ลืมรหัส หรือ `ADMIN_JWT_SECRET` เปลี่ยน/หาย | **ทางที่แนะนำ:** `node scripts/create-admin.js --rotate` — ออกรหัสใหม่ให้บัญชีเดียวนั้น แสดงครั้งเดียว เก็บเป็น bcrypt hash (ไม่มีที่ไหนเก็บตัวจริง) · ดูว่าใครเป็นแอดมินอยู่: `--list` · อยากให้เหลือบัญชีเดียวจริง ๆ: `--only` · ตรวจ `ADMIN_JWT_SECRET` ด้วยถ้ายัง login ไม่ได้ · *(ทางเก่า bootstrap `<email>+<ADMIN_PASSWORD_AUTH_EXTRA>` ยังใช้ได้เฉพาะบัญชีที่ยังไม่มี passwordHash — ดู §2)* |
| **ลิงก์/รูปพังหลัง deploy** | path ไม่ผ่าน `getPath()` หรือ `NEXT_PUBLIC_BASE_PATH` ผิด | ตั้ง base path = `/fms-ovs`; หา path ตรงๆ ในโค้ด |
| **คะแนนเพี้ยน/โหวตซ้ำ** | `User.isVoted` ไม่ได้เซ็ต | ตรวจ logic `api/vote/route.js`; restore DB ถ้าจำเป็น |
| **prisma generate EPERM (Windows)** | dev server ล็อกไฟล์ | หยุด server ก่อน แล้วค่อย `prisma generate` |

⚠️ **ใช้ `prisma db push` ไม่ใช่ `migrate`** สำหรับ schema นี้ (มี drift; ดู handoff). สำรอง DB ก่อนทุกครั้ง.

---

## 7. ถ้าต้องเพิ่ม template ใหม่ (ต้องใช้ dev)
แนวทางที่ตกลงไว้: **มี 3-5 template ก็พอ**, เพิ่มแบบ lazy เมื่อต้องการจริง ไม่ตุนไว้ล่วงหน้า.
มี skill ช่วย: `fms-add-template` / `fms-add-element`. เครื่องมือ author เร็วขึ้น = `/fms-ovs/compose-lab`
(composition editor — เป็น lab สำหรับ dev/author เท่านั้น ไม่ใช่หน้าให้ผู้ใช้ทั่วไปลากเอง).

---

## 8. ใครดูแล / ติดต่อใคร
- **ผู้สร้างเดิม:** (ระบุชื่อ/ติดต่อ — เติมเอง)
- **Staff คณะที่ดูแล operation:** (เติมเอง)
- เอกสารสถานะงานล่าสุด: `docs/HANDOFF-editor-ui-phase-2.md`, memory note ของโปรเจกต์.

> 🔧 จุดที่ควรเติมเองให้ครบ: ชื่อ/เบอร์ผู้ดูแล, ที่อยู่ deploy/Docker host, ที่เก็บ backup env + DB,
> และค่า PSU SSO ปัจจุบัน. กรอกแล้วคู่มือนี้จะใช้กู้ระบบได้จริงตอนฉุกเฉิน.

---

## 9. Robustness audit (เป้า "อยู่ได้หลายปี") — ตรวจ 2026-06-09

**สิ่งที่ดีอยู่แล้ว (ไม่ต้องแตะ):**
- ✅ **Docker reproducible** — `Dockerfile` ใช้ `npm ci` (อ่าน `package-lock.json` → install เหมือนเดิมทุกครั้ง),
  multi-stage, `output:'standalone'`, รันด้วย non-root user (`nextjs:1001`), `npx prisma generate` ใน build.
- ✅ **Node version pinned** ผ่าน base image (prod ใช้ Docker → ไม่ขึ้นกับ Node ในเครื่อง dev).
- ✅ **DB ล่มไม่ทำหน้าเว็บ crash ทั้งหมด** — `layout.js` (`getGlobalConfig`/`getThemeTokenCss`) มี try/catch คืน null;
  มี `src/app/global-error.js` รับ error ระดับ catastrophic.
- ✅ deploy ยืดหยุ่น — `basePath`/`assetPrefix` มาจาก env.

**ข้อควรแก้เพื่ออยู่ยาว (เรียงตามความสำคัญ):**
1. ✅ **แก้แล้ว 2026-06-09: `node:18-alpine` → `node:20-alpine`** (Node 18 EOL เม.ย. 2025).
   ⚠️ **ต้อง `docker build` + smoke test ก่อน deploy** เพราะ build ครั้งนี้ทดสอบได้แค่ `npm run build` (local) ไม่ได้ทดสอบใน Docker.
   ถ้าอยากรันยาวกว่านี้พิจารณา `node:22-alpine` (active LTS) ภายหลัง.
2. ⚠️ **ยังไม่มี backup อัตโนมัติ** — ตอนนี้เป็น manual `pg_dump` (§5). สำหรับ unattended หลายปีควรตั้ง **cron `pg_dump` รายวัน + เก็บนอกเครื่อง**
   (ขึ้นกับ host — ตั้งที่ระดับ infra ไม่ใช่โค้ด).
3. ◽ **error boundary ละเอียดขึ้น (optional)** — มีแต่ `global-error.js`; ถ้าอยาก graceful ต่อหน้า (เช่น results โชว์ "ข้อมูลไม่พร้อม"
   แทนจอ error เต็ม) เพิ่ม `error.js`/`not-found.js` ราย route ได้ — งานเสริม ไม่ด่วน.
4. ◽ **ปักหมุด Node สำหรับ dev นอก Docker** — เพิ่ม `.nvmrc` (เช่น `20`) หรือ `engines.node` ใน `package.json` เป็นเอกสารกำกับ (ไม่บังคับ).

**dependency versions:** ทุกตัวเป็น `^` (caret) แต่ **`package-lock.json` ปักหมุดจริง** → `npm ci` install เป๊ะเสมอ
(อย่ารัน `npm update` / อย่าลบ lockfile โดยไม่ตั้งใจ — นั่นคือสิ่งเดียวที่จะทำให้ version เลื่อน).

---

## 10. ใครได้สิทธิ์ admin (กฎการให้สิทธิ์ — ตั้งใจไว้แบบนี้)

โค้ดอยู่ที่ `src/lib/auth.js` (jwt callback) + ตรวจสิทธิ์ที่ `src/lib/auth/adminCheck.js`.
**มี 3 ทางที่ทำให้ผู้ใช้ได้สิทธิ์ admin** (ทางใดทางหนึ่งก็พอ):

| ทาง | เงื่อนไข | ได้ระดับ |
|---|---|---|
| **1. SSO group `staff`** | บัญชี PSU อยู่ในกลุ่ม `staff` (กลุ่มไหนก็ได้ใน `groups` ไม่จำเป็นต้องตัวแรก) | `role=ADMIN` → admin เต็ม |
| **2. SSO group `faculty`** | บัญชี PSU อยู่ในกลุ่ม `faculty` | `role=STAFF` → นับเป็น admin (ผ่าน `adminCheck`) |
| **3. รหัส นศ. ใน `ADMIN_STUDENT_IDS`** | studentId ตรงกับค่าใน env (คั่นด้วย `,`) | `isAdmin=true` → admin เต็ม (role ยังเป็น student) |

**กฎที่ตั้งใจ:** บัญชี PSU ที่ **ไม่ได้** อยู่กลุ่ม `staff`/`faculty` และ **ไม่ได้** อยู่ใน
`ADMIN_STUDENT_IDS` → ได้แค่ `role=student` (โหวตได้ ไม่มีสิทธิ์ admin).
ดังนั้น **ความปลอดภัยของ admin ขึ้นกับว่าใครคุมสมาชิกกลุ่ม `staff`/`faculty` ใน PSU SSO** —
กลุ่มนี้ต้องเป็นกลุ่มเล็ก/คณะคุมเอง. ถ้ากลุ่มกว้างขึ้น (เช่น PSU เปลี่ยนนิยาม `staff` =
พนักงานทุกคน) ให้ย้ายไปใช้ allowlist แทน: เพิ่ม `STAFF_STUDENT_IDS` (โครงสร้างเดียวกับ
`ADMIN_STUDENT_IDS`) แล้วตัด `groups.includes("faculty"/"staff")` ออกจาก `auth.js`.

**หมายเหตุ (แก้ 2026-06-12):** เดิมโค้ดดูแค่ `groups[0]` (กลุ่มแรกเท่านั้น) → ถ้า IdP
ส่งลำดับกลุ่มไม่ตรง admin จริงอาจตกเป็น student เงียบ ๆ. แก้ให้สแกนทั้ง array แล้ว.
ถ้าจะตั้ง admin **โดยไม่ผ่านกลุ่ม SSO** ให้ใช้ทาง 3 (`ADMIN_STUDENT_IDS`) — ไม่ต้องแตะกลุ่ม.

---

## 11. บัตรลงคะแนนแบบนิรนาม+เข้ารหัส+ตรวจการแก้ได้ (v2-SEC "B+", locked `60e0de2`, impl `8166d41`)

**โมเดล (แทนที่ของเก่าที่เก็บ `User.candidateId`):** ทุกใบลงในตาราง `Ballot`
- **ไม่มี `userId`** + เวลาหยาบระดับชั่วโมง (`hourBucket`) เท่านั้น → เชื่อมกลับหาคนโหวตไม่ได้เชิงโครงสร้าง
  (เวลาโหวตละเอียดอยู่บน `User.votedAt` = ข้อมูลของ voter เอง ไม่ลับ)
- **`payload` = RSA-OAEP ciphertext** ของ `{c: candidateId, n: nonce}` ด้วย public key กรรมการ
- **HMAC hash-chain ต่อใบ** (`prevHash → rowHash`, secret = `BALLOT_CHAIN_SECRET`) → แก้บัตรย้อนหลัง = โซ่ขาด ตรวจเจอ
- **tally จริง = `Candidate.score`** (atomic increment ตอนโหวต) — กุญแจ private หาย = เสียแค่ dispute-recount ไม่เสียผล

**Key ceremony (ทำ 1 ครั้ง/ปี บนเครื่อง offline — รายละเอียดใน `docs/DEPLOY-CHECKLIST-2026.md`):**
```
node scripts/generate-election-keys.js    # พิมพ์ keypair + chain secret ออก stdout เท่านั้น (ไม่เขียนดิสก์)
```
- **private key** → ไฟล์เข้ารหัสจาก `generate-election-keys.js --out` เก็บ 2 ที่ที่คณะคุมเอง (จะแยกไฟล์กับรหัสผ่านให้คนละคนก็ได้) **ห้ามอยู่บนเซิร์ฟเวอร์/ใน repo/ในชุดสำรองเดียวกับฐานข้อมูล**
- **public key** → env `ELECTION_BALLOT_PUBLIC_KEY` · **chain secret** → env `BALLOT_CHAIN_SECRET` + สำเนานอกเครื่อง

**ระหว่าง/หลังเลือกตั้ง:**
```
node scripts/verify-ballot-chain.js       # ตรวจโซ่ + count (certification, ก่อนเปิด showResult)
node scripts/export-chain-head.js         # เก็บปลายโซ่ไว้นอก DB เป็นระยะ (cron) → จับ tamper ที่ปลอมโซ่ด้วย
node scripts/decrypt-recount.js --key <path-to-private.pem>   # OFFLINE เท่านั้น, เฉพาะข้อพิพาท (นับรายพรรค)
```
> **Production ต้อง apply `scripts/sql/ballot-grants.sql`** → DB role ของแอปเป็น **INSERT-only บน `Ballot`**
> (แก้/ลบบัตรไม่ได้เชิงโครงสร้าง แม้แอปถูก compromise). superuser DB ยังแก้ได้เสมอ (ไม่มีระบบไหนกัน 100%)
> — แต่ "แก้แบบไม่ถูกจับ" ต้องมี chain secret + superuser + rewrite ปลายโซ่ที่ export ออกไปแล้ว = แทบเป็นไปไม่ได้.

> ปุ่ม **"รับรองผล"** (§1.1 B) ตั้งธง `ballotsAnonymized` — ไม่ได้ลบบัตร (บัตรนิรนามอยู่แล้ว) แค่หมุดรับรอง.
