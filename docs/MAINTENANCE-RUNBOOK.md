# MAINTENANCE & PANIC RUNBOOK — FMS Online Voting (SAMO 49)

คู่มือสำหรับ **staff ที่ดูแลระบบ + dev คนถัดไป** ให้ระบบอยู่ได้ยาว โดยคนที่ไม่ได้สร้างมันก็ดูแลต่อได้.
อ่านคู่กับ `CLAUDE.md` (ภาพรวม + conventions) และ `DECISIONS.md` (บทเรียนที่เคยเจ็บมาแล้ว).
(ไฟล์ `docs/HANDOFF-*.md` ที่เคยอ้างถึงตรงนี้ถูกลบออกจาก tree แล้ว 2026-07-19 — หาได้จาก git history)

> หลักคิดที่ตกลงกันไว้ (memory `editor-strategy-decision`): สิ่งที่ทำให้ระบบ **อยู่ครบหลายปี = ความทนทานเชิง
> operation + เอกสารนี้** ไม่ใช่ความหลากหลายของดีไซน์. การเปลี่ยนหน้าตาแต่ละปีทำได้ด้วย **เลือก template +
> เปลี่ยนสี (theme tokens) + แก้เนื้อหา** ผ่านหน้า admin — ไม่ต้อง design ใหม่จากศูนย์.

---

## 0. ระบบนี้คืออะไร (1 ย่อหน้า)
Next.js (App Router) + PostgreSQL (Prisma) + NextAuth (PSU SSO OpenID). Deploy เป็น Docker บนโดเมน
ของตัวเอง `https://ovs.fms.psu.ac.th` เสิร์ฟจาก root. หน้า admin ใช้ **httpOnly JWT cookie `admin_token`** (P0-1 — เลิกใช้ RSA token เก่าแล้ว). ข้อมูล
เลือกตั้ง (พรรค/สมาชิก/คะแนน) อยู่ใน DB; บัตรลงคะแนนเก็บแบบนิรนาม+เข้ารหัส+ต่อ hash chain (v2-SEC — ดู §11);
วันเวลาเลือกตั้งตั้งได้ใน admin (เก็บใน `SystemConfig.globalConfig`) โดยมีค่า default ในโค้ด
(`src/utils/electionConfig.js`) เป็น fallback. **Deploy ปีนี้: ไล่ `docs/DEPLOY-CHECKLIST-2026.md` ทีละขั้น.**

---

## 1. งานประจำปี — เปลี่ยนปีการเลือกตั้งใหม่ (checklist)
> ✅ **ตรวจสอบจริง 2026-06-09:** หน้า admin (`/admin`, 6 แท็บ) ครอบคลุมงานรายปี **เกือบทั้งหมด** —
> staff ทำเองได้โดยไม่ต้องมี dev **ครบทุกข้อแล้ว** (รวมวันเวลาเลือกตั้ง — ดูข้อ 6, ย้ายเข้า admin แล้ว 2026-06-09).

ทำผ่านหน้า admin (ไม่ต้องแตะโค้ด) ตามแท็บ:

1. **ชื่อ/ปี/เลขครั้ง/เนื้อหา** — แท็บ **"ตั้งค่าทั่วไป"**: ชื่อการเลือกตั้ง (SAMO 50→51), เลขครั้งที่,
   ปีการศึกษา พ.ศ. (2570→2571), ปี ค.ศ., ชื่อโครงการ/องค์กร/คณะ/มหาวิทยาลัย/ปีลิขสิทธิ์ (ทุกช่องมีปุ่ม ↺ คืนค่า).
2. **พรรค + สมาชิก** — แท็บ **"จัดการผู้สมัคร"**: เพิ่ม/แก้/ลบพรรค + สมาชิก + รูป + สีพรรค (รูปถูก optimize อัตโนมัติ).
3. **หน้าตา/สี (ธีม)** — แท็บ **"เลือกธีม (Template)"**: เลือก template 1 ใน 31 แบบ (6 ตระกูลมีชุดสีให้เลือก + ธีมเดี่ยวอีก 4)
   กดดูตัวอย่างก่อนแล้วค่อย Apply → **เปลี่ยน template/ชุดสีก็ทำให้ "รู้สึกใหม่" ได้ทั้งปีโดยไม่ต้องเขียนโค้ด**
   (กลไก variety หลัก)
   > ⚠️ **ไม่มีตัวแก้แบบลากวาง** หน้า admin เป็น "เลือกแล้ว Apply" อย่างเดียว — เลย์เอาต์ของแต่ละ template
   > คงที่ ไม่มีการจัด Sections หน้า Home หรือสลับ variant ของ element จากหน้าเว็บ
   > (editor ตัวเต็ม `PageDesignTab` ยังอยู่ในโค้ดแต่เข้าได้ทาง URL `?advanced=1` เท่านั้น
   > เป็นเครื่องมือของ dev ไม่ใช่ของ staff — เพิ่มธีมใหม่คือเขียนไฟล์ธีมแล้ว deploy ดู §7)
4. **โหมดระบบ + แสดงผล + Google Form** — แท็บ **"ตั้งค่าระบบ"**: `AUTO` (ใช้เวลาจาก electionConfig) /
   `MANUAL_OPEN` (force เปิด) / `PAUSE` / `ENDED`; toggle บังคับโชว์ผล real-time; ลิงก์ Google Form (หน้า success).
5. **รีเซ็ตเริ่มปีใหม่** — **ทำที่ฐานข้อมูล ไม่ใช่หน้า admin** (ถอดปุ่มออก 2026-07-28):
   ```bash
   sh scripts/backup.sh                                    # สำรองก่อนเสมอ
   psql "<connection string ของ fms_migrate>" -f scripts/sql/annual-reset.sql
   npm run preflight                                       # ยืนยันว่าเป็นศูนย์จริง
   ```
   เหตุผลที่ไม่มีปุ่ม: role `fms_app` ที่เว็บใช้ **ไม่มีสิทธิ์ DELETE บน `Ballot`** โดยตั้งใจ
   (`scripts/sql/ballot-grants.sql`) ปุ่มจึงทำงานได้แค่บน dev และจะพังบน production
   ผลพลอยได้: ไม่มี API เส้นไหนลบบัตรได้ ต่อให้ session แอดมินหลุดก็ล้างผลไม่ได้.
   (`Candidate.score`=ยอดจริง, `User.isVoted`=กันโหวตซ้ำ.)
6. ✅ **วันเวลาเลือกตั้ง (เปิด/ปิดหีบ/เปิดตัวผู้สมัคร)** — **ทำใน admin ได้แล้ว (2026-06-09)**:
   แท็บ **"ตั้งค่าทั่วไป" → กลุ่ม "ช่วงเวลาเลือกตั้ง"** มี date-time picker 3 ช่อง. ใช้เฉพาะโหมด `AUTO`.
   **ปล่อยว่าง = ใช้ค่า default ในโค้ด** (`src/utils/electionConfig.js`, ยังเป็น fallback กันพลาด)
   → ไม่ต้องแก้โค้ด/redeploy เพื่อเปลี่ยนวันอีกแล้ว.
7. **ส่งมอบสิทธิ์แอดมินให้กรรมการชุดใหม่** — ต้องรันบนเซิร์ฟเวอร์ (ไม่มีปุ่มในหน้า admin โดยตั้งใจ):
   ```bash
   node scripts/admin.js --list                   # ชุดเก่ามีใครบ้าง
   node scripts/admin.js --revoke <รหัส นศ. เดิม>  # ทีละคน จนหมดชุดเก่า
   node scripts/admin.js --grant  <รหัส นศ. ใหม่>  # ทีละคน
   node scripts/admin.js --rotate-password         # รหัสกลางใหม่ แจกเฉพาะชุดใหม่
   ```
   ⚠️ **ทำทุกครั้งที่ปิดหีบ/เปลี่ยนชุดกรรมการ** — คนที่พ้นวาระยังจำรหัสกลางเดิมได้ ต้องตัดทั้ง
   สิทธิ์และรหัส (ดู §10). แอดมินที่เป็นนักศึกษายังลงคะแนนด้วยบัญชีตัวเองได้ตามปกติ

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
(action `ANONYMIZE_BALLOTS` — ชื่อเดิม P0-6, ตอนนี้คือ *การรับรองผลอย่างเป็นทางการ*).

⚠️ **ชื่อ action หลอก — มันไม่ได้ลบอะไร** บัตรทุกใบ **ไม่มีลิงก์ถึงผู้ลงคะแนนอยู่แล้วโดยโครงสร้าง**
(`Ballot` ไม่มี `userId` + choice เข้ารหัส) จึงไม่มี "ร่องรอยว่าใครเลือกใคร" ให้ลบตั้งแต่แรก.

สิ่งที่ปุ่มนี้ทำจริง (อัปเดต 2026-08-15):
- **กดได้เฉพาะบัญชี `role = STAFF`** (เจ้าหน้าที่คณะ จาก `admin.js --create-staff`) — กรรมการสโมฯ โดน 403
  ที่ API ไม่ใช่แค่ซ่อนปุ่ม เพราะการรับรองผลของตัวเองเป็น conflict of interest
- **ตั้งธง `globalConfig.ballotsAnonymized = true` + บันทึก `certifiedBy` / `certifiedAt`** (ชื่อจริงของคนที่กด)
  ซึ่งไปโผล่เป็นแถบรับรองบนหน้าผลคะแนน (สั่งพิมพ์เป็น PDF แนบรายงานได้) และลงใน `archive-year`
- **ล็อกจริง** หลังรับรอง `/api/vote` ปฏิเสธทุกคะแนน (403) และเปลี่ยน `systemMode` ไม่ได้ (409)
  ยกเว้นตั้งเป็น `ENDED` ซ้ำ — คะแนนที่มีคนเซ็นรับรองแล้วต้องไม่ขยับได้อีก

ทำได้เฉพาะหลังปิดหีบ + เปิด `showResult` (ระบบกันทำกลางคัน). คะแนนรวมอยู่ที่ `Candidate.score`
(atomic increment ตอนโหวต) = บันทึกสุดท้ายอยู่แล้ว.
`decrypt-recount.js` และ `verify-ballot-chain.js` **ยังใช้ได้ตามปกติหลังรับรองผล** — ข้อพิพาทมักเกิดหลังประกาศผล.

**C. ตั้งปีใหม่ (admin UI):** ตามข้อ 1–6 ด้านบน — ตั้งชื่อ/ปี/วันเวลา, `systemMode=AUTO`, seed พรรคจริง,
ลบพรรคทดสอบ, `showResult=false`, import รายชื่อผู้มีสิทธิ์ปีใหม่ · ส่วนการล้างคะแนน/บัตร
ทำที่ฐานข้อมูลด้วย `scripts/sql/annual-reset.sql` (ไม่มีปุ่มในหน้า admin แล้ว — ดูข้อ 5).

> ⛔ **ห้ามลบรายชื่อผู้มีสิทธิ์ก่อนทำขั้น A (`archive-year`)**
>
> ปกติเจ้าหน้าที่จะลบรายชื่อเก่าทั้งชุดแล้ว import ทะเบียนปีใหม่ทับ ซึ่งถูกต้อง — แต่ต้องทำ
> **หลัง** archive เท่านั้น `scripts/archive-year.js:54` นับ turnout จากตาราง `User`
> (`isVoted = true` และ `year` อยู่ใน ปี 1-4) ณ วินาทีที่รัน ถ้าลบรายชื่อไปก่อน ยอดผู้ใช้สิทธิ์
> ใน `archive/<SAMO-XX>/results.json` จะกลายเป็น 0 อย่างถาวร — ไฟล์นั้นคือบันทึกชิ้นเดียว
> ที่เหลือของปีนั้น กู้กลับไม่ได้
>
> ลำดับที่ปลอดภัย: **รับรองผล → `npm run archive-year` → commit ไฟล์ archive → แล้วค่อย
> ล้าง/ทับรายชื่อ**

> **backup/restore ตรวจตัวเองแล้ว (2026-09-05)** — `backup.sh` จะไม่ลบ backup เก่าจนกว่าจะ
> ยืนยันว่า dump รอบนี้ใช้ได้จริง (มีหัวไฟล์ pg_dump + มี CREATE TABLE + `gzip -t` ผ่าน) และ
> `restore.sh` จะตรวจไฟล์ให้ครบ **ก่อน** แตะฐานข้อมูล แล้วสำรองสภาพปัจจุบันไว้ที่
> `backups/pre-restore-*.sql.gz` ก่อนล้าง · โหลดแบบ all-or-nothing (`ON_ERROR_STOP` +
> `--single-transaction`) และนับตาราง/แถวให้ดูหลังเสร็จ
>
> ยังต้องซ้อมกู้จริงกับเป้าหมายทิ้งได้อย่างน้อยหนึ่งครั้งก่อนวันเลือกตั้ง — สคริปต์ตรวจได้แค่ว่า
> ไฟล์ใช้ได้ ไม่ได้ตรวจว่า *ไฟล์ที่คุณเลือก* คือรอบที่ถูกต้อง

**ตัวช่วย (ไม่บังคับ):** ถ้า import ด้วย `node scripts/import-students.js <ไฟล์>` ตัวสคริปต์จะ
รายงานให้เองว่ามีใครยังมีสิทธิ์อยู่ใน DB แต่หายไปจากทะเบียนใหม่ (= พ้นสภาพแล้วแต่ยังโหวตได้)
สั่ง `--retire` ต่อท้ายเพื่อย้ายคนเหล่านั้นไป `year = "พ้นสภาพ"` โดยไม่ลบแถวทิ้ง · ถ้าเจ้าหน้าที่
ลบรายชื่อเองอยู่แล้วก็ไม่ต้องใช้ มันเป็นตาข่ายกันลืมเฉย ๆ · ตัวสคริปต์จะไม่ถอนสิทธิ์ใครเลย
ถ้าอ่านรหัสนักศึกษาจากไฟล์ไม่ได้สักรายการ (กันไฟล์ที่ export หัวคอลัมน์เพี้ยนแล้วถอนสิทธิ์ทั้งคณะ)

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
BASE_PATH                 # subpath ที่ Next.js เสิร์ฟ (ค่า: ว่าง — เสิร์ฟที่ root)
NEXT_PUBLIC_BASE_PATH     # subpath ที่ getPath() ใช้สร้างลิงก์ (ค่า: ว่าง)
ASSET_PREFIX              # ที่อยู่ไฟล์ static js/css/รูป (ค่า: ว่าง)
                          # ⚠️ ระบบอยู่บนโดเมนตัวเองแล้ว → ทั้งสามตัวต้องว่าง
                          #    ใส่ /fms-ovs กลับมาตัวเดียว = เว็บเสิร์ฟที่ / แต่ลิงก์ชี้ /fms-ovs
                          #    กดอะไรก็ 404 ทั้งเว็บ โดยไม่มี error ในล็อกเลย
                          #    จะย้ายไป subpath ต้องตั้งครบทั้งสาม + แก้ NEXTAUTH_URL
                          #    + AUTHENTIK_REDIRECT_URI + ลงทะเบียน redirect ใหม่กับ PSU IT
ADMIN_JWT_SECRET          # เซ็น/ตรวจ admin_token JWT cookie (auth แอดมิน — P0-1)
                          # ⚠️ รหัสผ่านแอดมิน "ไม่ได้" อยู่ใน env — อยู่ใน DB เป็น bcrypt hash
                          #    ตั้ง/เปลี่ยนด้วย  node scripts/admin.js --rotate-password  (ดู §10)
ELECTION_BALLOT_PUBLIC_KEY # v2-SEC: public key เข้ารหัสบัตร (PEM, \n-escaped) — ดู §11 + DEPLOY-CHECKLIST
BALLOT_CHAIN_SECRET       # v2-SEC: secret สำหรับ HMAC hash-chain ของบัตร — ดู §11 + DEPLOY-CHECKLIST
```
> 🔑 **`ELECTION_BALLOT_PUBLIC_KEY` + `BALLOT_CHAIN_SECRET` ไม่ครบ → `/api/vote` fail closed**
> (โหวตไม่ได้ ไม่มีการเก็บ plaintext). **private key ไม่อยู่บนเซิร์ฟเวอร์** (offline, dispute-only — §11).
+ ตัวแปร PSU SSO (client id/secret/issuer) — ดู `src/lib/auth.js`. **เก็บในที่ปลอดภัย + สำรองไว้** (ถ้าหาย = ตั้งใหม่). ห้าม commit ลง git.

> ⚠️ **เลิกใช้แล้ว (P0-1, 2026-06-10):** `ADMIN_PRIVATE_KEY` / `ADMIN_AUTH_SECRET` /
> `NEXT_PUBLIC_ADMIN_PUBLIC_KEY` / `NEXT_PUBLIC_ADMIN_AUTH_SECRET` — ระบบ admin auth เก่า
> ฝัง secret ใน client bundle (ใครก็ปลอม token ได้) จึงถูกถอดออก. ลบตัวแปรพวกนี้ทิ้งได้.
> **ต้อง ROTATE `ADMIN_JWT_SECRET`** ใหม่ (ของเก่าถือว่ารั่ว).
>
> ⚠️ **เลิกใช้แล้ว (2026-07-28):** `ADMIN_PASSWORD_AUTH_EXTRA` (bootstrap `<email>+<secret>`)
> และ `ADMIN_STUDENT_IDS` (allowlist ตอน SSO) — โค้ดไม่อ่านทั้งคู่แล้ว ลบทิ้งได้.
> แทนที่ด้วย: สิทธิ์ = `User.isAdmin` ที่ตั้งด้วย `scripts/admin.js` + รหัสกลางใน DB (§10).

---

## 3. รันในเครื่อง (dev)
```
npm install
npx prisma generate         # แก้ schema ตอน dev: npx prisma db push (บน production ใช้ migrate deploy — §6)
npm run dev                 # http://localhost:3000
```
Windows quirk: ถ้า `.next` ล็อก/พัง → หยุด dev server, `rm -rf .next`, รันใหม่.

---

## 4. Build + Deploy
```
# (Windows) หยุด dev server ก่อน แล้วค่อยลบ .next กัน EPERM lock
rm -rf .next
npm run build               # ต้องผ่านครบทุก route ก่อน deploy
```
Deploy เป็น Docker บนโดเมนของตัวเอง เสิร์ฟจาก root. **ทุก URL ภายในยังต้องผ่าน `getPath()`**
(utils/basePath.js) — ตอนอยู่ root มันไม่เติมอะไร แต่มันคือจุดเดียวที่ทำให้ย้ายไป subpath ได้
ด้วยการตั้ง env เฉย ๆ · ถ้าเห็นลิงก์/รูปพังหลัง deploy มักเพราะมี path ตรงๆ ที่ไม่ผ่าน `getPath()`.

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
- ⚠️ `e2e/admin-console.spec.js` (ชุดเก่าของ editor ที่เลิกใช้แล้ว) มี 26 เคส และถูก **exclude ทั้งไฟล์**
  ด้วย `testIgnore` ใน `playwright.config.js` — ยังแดงค้างอยู่ ไม่ได้อยู่ในด่าน gate
  จำนวนที่รันจริงจึงเป็น **9 เคส 4 ไฟล์** (`npm run e2e`) และ **7 เคส** (`npm run e2e:gate`)

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
- `npm run lint` ใช้เป็น gate ได้แล้ว (2026-09-05) — เดิมเรียก `next lint` ที่เปิด wizard
  ถามการตั้งค่าแล้วรอ input · ใน CI มันค้าง ส่วนแบบไม่มี stdin มัน **จบด้วย exit 0 ทั้งที่ไม่ได้
  ตรวจไฟล์สักไฟล์** ตอนนี้ใช้ ESLint CLI + `eslint.config.mjs` · **error = 0** (บังคับ)
  ส่วน warning ยังเหลือ 136 ข้อ ตั้งใจไม่บังคับ ส่วนใหญ่คือ `no-img-element` (96)
  ซึ่งเป็นคำแนะนำเรื่องประสิทธิภาพ ไม่ใช่บั๊ก
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

**เช็คก่อนทุกอย่าง:** `curl https://ovs.fms.psu.ac.th/api/health`
- `200 {"ok":true,"db":true}` → app + DB ปกติ (ปัญหาอยู่ชั้นอื่น เช่น SSO/หน้าเว็บเฉพาะหน้า)
- `503 {"ok":false,"db":false}` → app ขึ้นแต่ DB ล่ม → ตรวจ container Postgres / `DATABASE_URL`
- ไม่ตอบเลย → app ล่ม → ตรวจ Docker/host
แนะนำตั้ง uptime checker (เช่น cron + curl, UptimeRobot) ยิง endpoint นี้ทุก 1-5 นาทีช่วงวันเลือกตั้ง.

| อาการ | สาเหตุที่พบบ่อย | แก้ |
|---|---|---|
| **Login PSU ไม่ได้ทั้งระบบ** | PSU เปลี่ยน SSO endpoint/cert หรือ client secret หมดอายุ | ขอค่าใหม่จาก PSU IT → อัปเดต env (issuer/client id/secret ใน `lib/auth.js`) → redeploy. **อาการนี้มากับเวลา ไม่เกี่ยวโค้ดเรา** |
| **`npm run build` พัง** | deps/Next.js เปลี่ยน หรือ `.next` ค้าง | `rm -rf .next node_modules && npm install && npm run build`; อ่าน error route แรกที่ fail |
| **admin เข้าไม่ได้** | ลืมรหัสกลาง · ไม่ได้ถูก `--grant` · `ADMIN_JWT_SECRET` เปลี่ยน/หาย | `node scripts/admin.js --list` ก่อน (บอกทั้งรายชื่อและว่ารหัสกลางตั้งหรือยัง) · ลืมรหัส → `--rotate-password` ออกใหม่ แสดงครั้งเดียว บอกกรรมการทุกคน · ไม่มีชื่อในรายการ → `--grant <รหัส นศ.>` · ยังไม่ได้ → ตรวจ `ADMIN_JWT_SECRET` · ทุกคนล็อกอินไม่ได้พร้อมกันตอนวันจริง → `--break-glass` (§10) |
| **ลิงก์/รูปพังหลัง deploy · กดเมนูแล้ว 404 ทั้งเว็บ** | ตัวแปร base path ไม่ตรงกัน — ระบบอยู่ root แต่มี `BASE_PATH`/`NEXT_PUBLIC_BASE_PATH`/`ASSET_PREFIX` ตัวใดตัวหนึ่งค้างเป็น `/fms-ovs` (หรือกลับกัน) หรือมี path ตรงๆ ที่ไม่ผ่าน `getPath()` | ทำให้ทั้งสามตัวว่างพร้อมกัน (หรือถ้าตั้งใจอยู่ subpath ก็ตั้งครบทั้งสาม) แล้ว **rebuild** ไม่ใช่แค่ restart — `NEXT_PUBLIC_*` ถูกฝังตอน build (ดู §2); ถ้ายังพังเฉพาะบางลิงก์ ให้หา path ตรงๆ ในโค้ด |
| **คะแนนเพี้ยน/โหวตซ้ำ** | `User.isVoted` ไม่ได้เซ็ต | ตรวจ logic `api/vote/route.js`; restore DB ถ้าจำเป็น |
| **prisma generate EPERM (Windows)** | dev server ล็อกไฟล์ | หยุด server ก่อน แล้วค่อย `prisma generate` |

⚠️ **บน production ใช้ `npx prisma migrate deploy`** — `scripts/setup.sh` รันให้อยู่แล้ว และเป็นขั้นตอนใน
`DEPLOY-CHECKLIST §4` · ตอนนี้รีโปมี migration ครบ 9 ตัว และ drift เก่าถูกเก็บเป็น migration แล้ว
(2026-07-18) จึง deploy ลง DB เปล่าได้จบในคำสั่งเดียว
**`prisma db push` ใช้เฉพาะบนเครื่อง dev และใน e2e test DB เท่านั้น** (ดู §4.2) — อย่าใช้กับ production
เพราะมันข้าม migration history · สำรอง DB ก่อนทุกครั้ง

---

## 7. ถ้าต้องเพิ่ม template ใหม่ (ต้องใช้ dev)
แนวทางที่ตกลงไว้: **มี 3-5 template ก็พอ**, เพิ่มแบบ lazy เมื่อต้องการจริง ไม่ตุนไว้ล่วงหน้า.
มี skill ช่วย: `fms-add-template` / `fms-add-element`. เครื่องมือ author เร็วขึ้น = `/compose-lab`
(composition editor — เป็น lab สำหรับ dev/author เท่านั้น ไม่ใช่หน้าให้ผู้ใช้ทั่วไปลากเอง).

---

## 8. ใครดูแล / ติดต่อใคร
- **ผู้สร้างเดิม:** (ระบุชื่อ/ติดต่อ — เติมเอง)
- **Staff คณะที่ดูแล operation:** (เติมเอง)
- เอกสารสถานะงานล่าสุด: `docs/TEMPLATE-SYSTEM-STATE.md` และ `PROGRESS.md`
  (ไฟล์ `docs/HANDOFF-*.md` ที่เคยอยู่ตรงนี้ถูกลบออกจาก tree แล้ว 2026-07-19 — หาได้จาก git history)

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

## 10. ใครได้สิทธิ์ admin (แก้ใหม่ 2026-07-28 — อ่านทั้งข้อก่อนแตะอะไร)

**เข้าแอดมินต้องมีครบสองอย่าง** ขาดอย่างใดอย่างหนึ่งเข้าไม่ได้:

| | คืออะไร | ใครแก้ได้ |
|---|---|---|
| **ตัวตน** | แถวใน `User` ที่ `isAdmin=true` — พิมพ์รหัส นศ. ตัวเองตอนล็อกอิน | `scripts/admin.js --grant/--revoke` เท่านั้น |
| **ความลับ** | "รหัสกลาง" ตัวเดียวที่กรรมการใช้ร่วมกัน เก็บเป็น bcrypt hash แถวเดียวใน `SystemConfig.adminPasswordHash` | `scripts/admin.js --rotate-password` |

```bash
node scripts/admin.js --list                 # ใครเป็นแอดมิน + รหัสกลางตั้งหรือยัง
node scripts/admin.js --grant 6610510149     # ให้สิทธิ์ (ต้องมีแถวใน DB อยู่ก่อน)
node scripts/admin.js --revoke 6610510149    # ถอดสิทธิ์ มีผลกับ request ถัดไปทันที
node scripts/admin.js --rotate-password      # ออกรหัสกลางใหม่ แสดงครั้งเดียว
node scripts/admin.js --break-glass          # บัญชีสำรองที่มีรหัสของตัวเอง
```

**สิ่งที่เปลี่ยนไปจากเดิม และเหตุผล**

- **SSO ไม่ให้สิทธิ์แอดมินอีกแล้ว** เดิมกลุ่ม `staff` → `role=ADMIN` และกลุ่ม `faculty` →
  `role=STAFF` ซึ่ง `adminCheck` รับทั้งคู่ **โดยไม่ต้องใช้รหัสผ่าน** และ `middleware.js`
  จับแค่ `/admin/:path*` ไม่ครอบ `/api/admin/*` เท่ากับใครที่ PSU ใส่ไว้ในกลุ่ม `staff`
  ยิง API แอดมินได้ตรง ๆ จากเบราว์เซอร์ · ตอนนี้ `role` เหลือเป็นแค่ป้ายบอกว่ามาจากกลุ่มไหน
  ไม่ให้อำนาจอะไร — ห้ามเอา `role === "ADMIN"` กลับมาเป็นเงื่อนไขตรวจสิทธิ์
- **`ADMIN_STUDENT_IDS` เลิกใช้** พร้อมกับ allowlist ที่ hardcode รหัส นศ. สองคนไว้ในโค้ด
  ถ้ายังตั้ง env ตัวนี้อยู่ก็ไม่มีผลอะไร ลบทิ้งได้
- **`ADMIN_PASSWORD_AUTH_EXTRA` เลิกใช้** ทางเดิมรับรหัสรูปแบบ `<email>+<secret>` และตั้ง
  hash ให้บัญชีที่ยังไม่มีอัตโนมัติ — มองจากข้างนอกไม่ออกทั้งสองข้อ (ล็อกเจ้าของออกจาก
  ระบบมาแล้วหนึ่งครั้ง) และมันเปิดให้ทุกแถวที่ `isAdmin=true` แต่ไม่มี hash ซึ่งรวมแถวที่ SSO
  เคยตั้งให้เอง · ลบ env ตัวนี้ทิ้งได้เลย
- **ถอดสิทธิ์แล้วมีผลทันที** `requireAdmin` อ่าน `isAdmin` จาก DB ใหม่ทุก request ไม่ได้เชื่อ
  ค่าที่ฝังอยู่ใน token — คนที่เพิ่งโดน `--revoke` จะได้ 403 และ cookie ถูกล้างในคำขอถัดไป
  ไม่ต้องรอ token หมดอายุ 2 ชั่วโมง

**สิ่งที่ยอมรับร่วมกัน:** รหัสกลางที่กรรมการรู้ทั้งชุด แปลว่าคนที่พ้นวาระยังจำรหัสได้
กันด้วยขั้นตอน ไม่ใช่โค้ด — **ปิดหีบเสร็จให้ `--revoke` ทุกคนแล้ว `--rotate-password`**
(อยู่ในเช็คลิสต์ §1 แล้ว) · รหัสกลางอย่างเดียวเปิดอะไรไม่ได้ ต้องมีรหัส นศ. ที่ถูก grant ด้วย

**บัญชีสำรอง (`--break-glass`)** มีรหัสของตัวเองแยกจากรหัสกลาง ไว้ใช้ตอน SSO ล่มหรือรหัส
กลางหาย · บัญชีนี้ตั้งใจให้ `year=null` ด่านตรวจสิทธิ์ ปี 1-4 ใน `/api/vote` เลยปฏิเสธ
ลงคะแนนไม่ได้ · ส่วนแอดมินที่เป็นนักศึกษายังใช้สิทธิ์เลือกตั้งด้วยบัญชีตัวเองได้ตามปกติ
· รหัสประจำบัญชีไม่ควรมีอยู่บนแถว**นักศึกษา** ถ้า `--list` ขึ้นว่า "มีรหัสของตัวเอง" บนบัญชีกรรมการ
ให้ล้างด้วย `--clear-personal` (ของเก่าจาก seed ซึ่งรหัสตัวจริงเคยอยู่ใน git สาธารณะ)

> ⛔ **ยกเว้นบัญชีเจ้าหน้าที่ (`role = STAFF`) — ห้ามล้าง** บัญชีจาก `--create-staff` **ต้อง**มีรหัสของตัวเอง
> เพราะเป็นบัญชีที่เซ็นรับรองผล ถ้าล้างแล้วรหัสกลางจะเปิดบัญชีนั้นได้ แปลว่ากรรมการคนไหนก็ปลอมลายเซ็น
> เจ้าหน้าที่ได้ · `npm run preflight` แยกให้แล้ว: บัญชี STAFF ขึ้นเป็น PASS ไม่ใช่ WARN

**บัญชีเจ้าหน้าที่คณะ (`--create-staff`)** — บัญชีประจำ ไม่ใช่ทางหนีไฟ ใช้รหัสของตัวเอง
`year=null` (โหวตไม่ได้ ไม่ถูกนับใน turnout) และเป็น **role เดียวที่กดรับรองผลได้**
```bash
node scripts/admin.js --create-staff anuwat.s --name "ชื่อ นามสกุล"   # เติม --ask-password เพื่อตั้งรหัสเอง
```
ชื่อที่ใส่จะถูกบันทึกเป็นผู้รับรองผลและขึ้นบนหน้าผลคะแนน

**หมายเหตุ (แก้ 2026-06-12):** เดิมโค้ดดูแค่ `groups[0]` (กลุ่มแรกเท่านั้น) → แก้ให้สแกน
ทั้ง array แล้ว ตอนนี้ `roleFromSsoGroups` ยังสแกนทั้ง array เหมือนเดิม แต่ผลลัพธ์เป็นแค่ป้าย

---

## 11. บัตรลงคะแนนแบบนิรนาม+เข้ารหัส+ตรวจการแก้ได้ (v2-SEC "B+", locked `60e0de2`, impl `8166d41`)

> ข้อนี้เป็นสรุปทางเทคนิคสำหรับทีมพัฒนา · **คำอธิบายฉบับเจ้าหน้าที่** — กุญแจแต่ละดอกใช้ยังไง
> หายแล้วเสียอะไร ใบบันทึกผู้ถือกุญแจ และวิธีรับมือเมื่อเกิดเหตุ — อยู่ที่
> `docs/BALLOT-SECURITY-GUIDE.md`

**โมเดล (แทนที่ของเก่าที่เก็บ `User.candidateId`):** ทุกใบลงในตาราง `Ballot`
- **ไม่มี `userId`** + เวลาหยาบระดับชั่วโมง (`hourBucket`) เท่านั้น → เชื่อมกลับหาคนโหวตไม่ได้เชิงโครงสร้าง
  (เวลาโหวตละเอียดอยู่บน `User.votedAt` = ข้อมูลของ voter เอง ไม่ลับ)
- **`payload` = RSA-OAEP ciphertext** ของ `{c: candidateId, n: nonce}` ด้วย public key กรรมการ
- **HMAC hash-chain ต่อใบ** (`prevHash → rowHash`, secret = `BALLOT_CHAIN_SECRET`) → แก้บัตรย้อนหลัง = โซ่ขาด ตรวจเจอ
- **tally จริง = `Candidate.score`** (atomic increment ตอนโหวต) — กุญแจ private หาย = เสียแค่ dispute-recount ไม่เสียผล

**Key ceremony (ทำ 1 ครั้ง/ปี บนเครื่อง offline — รายละเอียดใน `docs/DEPLOY-CHECKLIST-2026.md`):**
```
node scripts/generate-election-keys.js --out key-<ปี>.enc   # แนะนำ: เก็บ private key + chain secret ลงไฟล์เข้ารหัส
node scripts/generate-election-keys.js                      # ไม่ใส่ --out = พิมพ์ออกจอเฉย ๆ ไม่เขียนดิสก์
```
- **private key** → ไฟล์เข้ารหัสจาก `generate-election-keys.js --out` เก็บ 2 ที่ที่คณะคุมเอง (จะแยกไฟล์กับรหัสผ่านให้คนละคนก็ได้) **ห้ามอยู่บนเซิร์ฟเวอร์/ใน repo/ในชุดสำรองเดียวกับฐานข้อมูล**
- **public key** → env `ELECTION_BALLOT_PUBLIC_KEY` · **chain secret** → env `BALLOT_CHAIN_SECRET` + สำเนานอกเครื่อง

**ระหว่าง/หลังเลือกตั้ง:**
```
node scripts/verify-ballot-chain.js       # ตรวจโซ่ + count (certification, ก่อนเปิด showResult)
node scripts/export-chain-head.js         # เก็บปลายโซ่ไว้นอก DB เป็นระยะ (cron) → จับ tamper ที่ปลอมโซ่ด้วย
node scripts/decrypt-recount.js --key <path-to-private.pem>   # OFFLINE เท่านั้น, เฉพาะข้อพิพาท (นับรายพรรค)
```
> **Production ต้อง apply `scripts/sql/ballot-grants.sql`** → DB role ของแอปได้แค่ `SELECT, INSERT` บน `Ballot`
> (แก้/ลบบัตรไม่ได้เชิงโครงสร้าง แม้แอปถูก compromise). superuser DB ยังแก้ได้เสมอ (ไม่มีระบบไหนกัน 100%)
> — แต่ "แก้แบบไม่ถูกจับ" ต้องมี chain secret + superuser + rewrite ปลายโซ่ที่ export ออกไปแล้ว = แทบเป็นไปไม่ได้.
>
> ⚠️ **การป้องกันนี้ขึ้นกับ 3 อย่างพร้อมกัน**: สร้าง role `fms_app` · apply ไฟล์ grants · ชี้ `DATABASE_URL`
> มาที่ role นั้น · **ถ้าชี้ไป superuser แทน ทุกอย่างยังทำงานปกติแต่การป้องกันไม่มีอยู่จริง**
> `npm run preflight` มีด่านจับข้อนี้แล้ว (2026-08-15) — ต้องขึ้น `app cannot delete ballots`

> ปุ่ม **"รับรองผล"** (§1.1 B) ตั้งธง `ballotsAnonymized` + บันทึกชื่อผู้รับรอง — ไม่ได้ลบบัตร
> (บัตรนิรนามอยู่แล้ว) แต่**ล็อกระบบจริง**: กดได้เฉพาะ `role = STAFF` และหลังกดแล้วโหวตไม่ได้ เปลี่ยนโหมดไม่ได้
