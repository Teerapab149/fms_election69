# รายการติดตั้งและขึ้นระบบ FMS Online Voting (ปีการศึกษา 2569)

ไฟล์นี้ใช้ทำตามทีละข้อตั้งแต่เครื่องเปล่าจนถึงวันเปิดหีบ ทุกข้อมีคำสั่งและวิธีดูว่าสำเร็จ
ทำตามลำดับ อย่าข้ามข้อ และอย่าไปข้อถัดไปถ้าข้อก่อนหน้ายังไม่ผ่าน
คำอธิบายเชิงลึกของแต่ละเรื่องอยู่ใน [STAFF-IT-GUIDE.md](STAFF-IT-GUIDE.md) (อ้างเลขหัวข้อไว้ท้ายแต่ละส่วน)
งานดูแลต่อเนื่องและกรณีฉุกเฉินอยู่ใน [MAINTENANCE-RUNBOOK.md](MAINTENANCE-RUNBOOK.md)

เครื่องจริงของคณะไม่ใช้ Docker รายการนี้จึงเขียนตามทางไม่ใช้ Docker เป็นหลัก
ส่วนที่ต่างกันถ้าใช้ Docker เขียนไว้ในกรอบ "ถ้าใช้ Docker" ของแต่ละข้อ

สแตกของระบบ: Next.js 15 (โหมด standalone), PostgreSQL ผ่าน Prisma, NextAuth ต่อ PSU SSO (Authentik),
เว็บอยู่ที่ root ของโดเมน `https://ovs.fms.psu.ac.th` หลัง nginx
แอดมินเข้าด้วยชื่อผู้ใช้ที่ได้รับสิทธิ์และรหัสกลาง บัตรลงคะแนนเก็บแบบไม่ระบุตัวผู้ลงคะแนน เข้ารหัส และร้อยเป็นโซ่

คำสั่งที่มี `$APP_DATABASE_URL` และ `$MAINT_DATABASE_URL` หมายถึง URL ของบัญชีฐานข้อมูลสองตัว
(`fms_app` ของเว็บ และ `fms_migrate` ของงาน migration) ตั้งตามข้อ 3.1

---

## 0. ก่อนเริ่ม ต้องมีของเหล่านี้ครบ

- [ ] เครื่อง Linux สำหรับเว็บ ที่มี Bash, Git, Node.js 22, npm, `psql`, `curl`, `openssl`, nginx
- [ ] PostgreSQL (ของคณะหรือบนเครื่องเดียวกัน) และสิทธิ์สร้าง role กับ database
- [ ] ค่า PSU SSO ของปีนี้จากผู้ดูแล PSU SSO: client id, client secret, และ redirect URI ที่ลงทะเบียนแล้ว
      redirect URI ต้องตรงกับ `https://ovs.fms.psu.ac.th/api/auth/callback/authentik` ตามที่ผู้ดูแลลงทะเบียนไว้จริง ห้ามเดา
- [ ] DNS และใบรับรอง HTTPS ของ `ovs.fms.psu.ac.th` ชี้มาที่เครื่องนี้
- [ ] เครื่องอีกเครื่องที่ไม่ต่อเน็ตสำหรับพิธีสร้างกุญแจ (ข้อ 4) และที่เก็บไฟล์กุญแจสองที่ที่คณะคุมเอง
- [ ] ไฟล์รายชื่อผู้มีสิทธิ์เลือกตั้งปีนี้ (csv หรือ xlsx) และรายชื่อพรรคกับสมาชิกจริง
- [ ] เครื่องอีกเครื่องหนึ่งสำหรับเก็บสำเนา backup และปลายโซ่บัตรนอกเครื่อง (ข้อ 12)

---

## 1. ดึงโค้ดและติดตั้งแพ็กเกจ

```bash
sudo mkdir -p /opt/fms-election
sudo chown "$(id -un)":"$(id -gn)" /opt/fms-election
git clone <ที่อยู่ repository ที่คณะกำหนด> /opt/fms-election
cd /opt/fms-election
node -v
npm ci
npx prisma generate
```

ตรวจว่าสำเร็จ:
- [ ] `node -v` ขึ้น `v22.` นำหน้า
- [ ] `npm ci` จบโดยไม่มีบรรทัด `npm ERR!`
- [ ] `npx prisma generate` ขึ้น `Generated Prisma Client`

วางโปรเจกต์ในโฟลเดอร์ที่ไม่มีไฟล์ `package-lock.json` อยู่ข้างบน ไม่เช่นนั้น build จะเลือกโฟลเดอร์ผิดเป็นราก (STAFF-IT-GUIDE §3.7)

ถ้าใช้ Docker: ติดตั้ง Docker และ Docker Compose แทน Node ได้ตาม STAFF-IT-GUIDE §3.1 แล้วใช้ `sh scripts/setup.sh` ตาม §1 ของคู่มือนั้น

---

## 2. สร้าง secret ใหม่ทั้งหมด (ติดตั้งใหม่ปีนี้ให้หมุนทุกตัว)

ค่า secret รุ่นก่อนเคยอยู่ใน history ของ repository สาธารณะ จึงถือว่าหลุดแล้ว
ห้ามคัดลอกค่าใดจาก `.env` ของเครื่องเก่า จากไฟล์ compose เก่า หรือจากเอกสารเก่ามาใช้
ฐานข้อมูลที่ติดตั้งใหม่ต้องตั้งรหัสผ่านใหม่ด้วย และ seed ของ repository (`prisma/seed.js`) เป็นข้อมูลตัวอย่าง ห้ามรันบนเครื่องจริง

```bash
openssl rand -base64 32
openssl rand -hex 32
openssl rand -base64 24
```

- [ ] บรรทัดแรกใช้เป็น `NEXTAUTH_SECRET`
- [ ] บรรทัดสองใช้เป็น `ADMIN_JWT_SECRET`
- [ ] บรรทัดสามใช้เป็นรหัสผ่านของ role ฐานข้อมูล (ทำสองครั้ง ได้รหัสของ `fms_app` และ `fms_migrate` คนละค่า)
- [ ] เก็บทุกค่าไว้ในตัวจัดการรหัสผ่านของเจ้าหน้าที่ก่อนปิดหน้าจอ ไม่ส่งทางแชตหรืออีเมลทั่วไป
- [ ] `BALLOT_CHAIN_SECRET` และกุญแจบัตรสร้างใหม่ในพิธีข้อ 4 ห้ามใช้ของปีก่อน

ตรวจว่าสำเร็จ: ไม่มีค่าใดซ้ำกับค่าในปีก่อนหรือในเอกสาร (STAFF-IT-GUIDE §3.2)

---

## 3. ฐานข้อมูล

### 3.1 สร้าง role และตั้ง URL

ให้ DBA หรือใช้บัญชีผู้ดูแล PostgreSQL สร้างสอง role ในฐานข้อมูลเปล่าชื่อ `fms_election`
(เปลี่ยน `<รหัส>` เป็นรหัสที่สุ่มไว้ในข้อ 2 แล้วพิมพ์ผ่านคำสั่ง `\password` ไม่เขียนลงไฟล์):

```sql
CREATE ROLE fms_migrate LOGIN;
\password fms_migrate
ALTER DATABASE fms_election OWNER TO fms_migrate;
ALTER SCHEMA public OWNER TO fms_migrate;
CREATE ROLE fms_app LOGIN;
\password fms_app
GRANT CONNECT ON DATABASE fms_election TO fms_app;
GRANT USAGE ON SCHEMA public TO fms_app;
```

จากนั้นตั้งตัวแปรใน terminal นี้ (พิมพ์แล้วไม่แสดงบนจอ):

```bash
read -r -s -p 'URL ของ fms_app: ' APP_DATABASE_URL; printf '\n'
read -r -s -p 'URL ของ fms_migrate: ' MAINT_DATABASE_URL; printf '\n'
psql "$APP_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT current_database(), current_user;'
psql "$MAINT_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT current_database(), current_user;'
```

ตรวจว่าสำเร็จ:
- [ ] คำสั่งแรกแสดง `fms_election` และ `fms_app`
- [ ] คำสั่งที่สองแสดง `fms_election` และ `fms_migrate`

### 3.2 ลง migration

```bash
DATABASE_URL="$MAINT_DATABASE_URL" npx prisma migrate deploy
DATABASE_URL="$MAINT_DATABASE_URL" npx prisma migrate status
```

โฟลเดอร์ `prisma/migrations` มี migration 11 ตัว ตั้งแต่ `20251231105732_init_new_database`
ถึง `20261003000000_votedat_hour_coarse`

ตรวจว่าสำเร็จ:
- [ ] `migrate deploy` ขึ้น `All migrations have been successfully applied`
- [ ] `migrate status` ขึ้น `Database schema is up to date!`
- [ ] ถ้าขึ้นว่ามี drift หรือ migration ค้าง ให้หยุด ห้ามใช้ `prisma db push` กับเครื่องจริง และปรึกษาทีมพัฒนา
- [ ] ตรวจแถวต้นโซ่ด้วยคำสั่งนี้ ต้องได้ `GENESIS` และ `0`:

```bash
psql "$MAINT_DATABASE_URL" -c 'SELECT id, head, seq FROM "ChainHead";'
```

### 3.3 ล็อกสิทธิ์ตารางบัตร

```bash
psql "$MAINT_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/sql/ballot-grants.sql
psql "$MAINT_DATABASE_URL" -c "SELECT privilege_type FROM information_schema.role_table_grants WHERE grantee='fms_app' AND table_name='Ballot';"
```

ตรวจว่าสำเร็จ:
- [ ] ไฟล์ grants จบโดยไม่มีบรรทัด `ERROR`
- [ ] คำสั่งตรวจสิทธิ์แสดงเฉพาะ `SELECT` และ `INSERT` (ห้ามมี `UPDATE` หรือ `DELETE`)

เหตุผลและวิธีตรวจละเอียดอยู่ใน STAFF-IT-GUIDE §3.5 และ §8.2
ถ้าใช้ Docker และใช้ DB ที่มากับ compose ให้ทำตาม §3.2 ของคู่มือนั้น (ต้องเปิด port DB แบบ `127.0.0.1` เท่านั้น)

---

## 4. พิธีสร้างกุญแจบัตร (เจ้าของระบบและกรรมการทำเองบนเครื่องที่ไม่ต่อเน็ต)

ทำปีละครั้ง private key ต้องไม่เคยอยู่บนเซิร์ฟเวอร์เลือกตั้ง อ่าน [BALLOT-SECURITY-GUIDE.md](BALLOT-SECURITY-GUIDE.md) ก่อนทำครั้งแรก

```bash
node scripts/generate-election-keys.js --out key-2569.enc
```

คำสั่งถามรหัสผ่านเพื่อเข้ารหัสไฟล์ ตั้งรหัสที่ยาวพอ แล้วไฟล์ `key-2569.enc` จะมี private key และ chain secret อยู่ข้างใน

- [ ] ตั้งชื่อไฟล์ตามปีของการเลือกตั้งจริง
- [ ] ก๊อปไฟล์ `.enc` ไปเก็บสองที่ที่คณะคุมเอง ให้ไฟล์อยู่กับคนหนึ่งและรหัสผ่านอยู่กับอีกคน
- [ ] ลบไฟล์ต้นทางออกจากเครื่องที่ใช้สร้าง และปิด terminal เพื่อล้างหน้าจอ
- [ ] ห้ามเก็บไฟล์ไว้บนเซิร์ฟเวอร์เลือกตั้ง ใน Git ในอีเมล หรือในชุด backup เดียวกับฐานข้อมูล
- [ ] ทันทีหลังสร้างไฟล์ สคริปต์พิมพ์ข้อความ 2 บรรทัดบนจอ คือ public key (ทั้งก้อนอยู่ในบรรทัดเดียว มี `\n` คั่น) กับ chain secret ให้ก๊อป 2 บรรทัดนี้ไปใส่ `.env` ของเซิร์ฟเวอร์ในข้อ 5 ผ่านช่องทางที่ปลอดภัย (เช่น USB ที่ลบทิ้งทันทีหลังใช้)
- [ ] ตอนติดตั้งจริงไม่ต้องรัน `--decrypt` เลย เปิดไฟล์กุญแจเฉพาะตอนมีข้อพิพาทและต้องนับใหม่ เพราะทุกครั้งที่เปิดมีโอกาสให้ private key หลุด

ตรวจว่าสำเร็จ: บนเซิร์ฟเวอร์ต้องมีแค่ public key กับ chain secret ถ้าขาดตัวใดตัวหนึ่ง `/api/vote` จะตอบ 503 และโหวตไม่ได้ (ทดสอบในข้อ 8)
รายละเอียดใน STAFF-IT-GUIDE §3.3

---

## 5. สร้างไฟล์ `.env`

```bash
cd /opt/fms-election
umask 077
nano .env
```

ใส่ค่าต่อไปนี้ แทนทุกค่าที่ขึ้นต้นด้วย `REPLACE_` ด้วยค่าที่สุ่มใหม่:

```dotenv
DATABASE_URL="postgresql://fms_app:REPLACE_APP_PASSWORD@REPLACE_DB_HOST:5432/fms_election"
NEXTAUTH_URL="https://ovs.fms.psu.ac.th"
NEXTAUTH_SECRET="REPLACE_NEXTAUTH_SECRET"
ADMIN_JWT_SECRET="REPLACE_ADMIN_JWT_SECRET"
AUTHENTIK_CLIENT_ID="REPLACE_SSO_CLIENT_ID"
AUTHENTIK_CLIENT_SECRET="REPLACE_SSO_CLIENT_SECRET"
AUTHENTIK_REDIRECT_URI="REPLACE_REGISTERED_SSO_REDIRECT_URI"
ELECTION_BALLOT_PUBLIC_KEY="REPLACE_FROM_KEY_CEREMONY"
BALLOT_CHAIN_SECRET="REPLACE_FROM_KEY_CEREMONY"
BASE_PATH=
NEXT_PUBLIC_BASE_PATH=
ASSET_PREFIX=
UPLOAD_ROOT=/var/lib/fms-ovs/images
BACKUP_STATUS_DIR=/opt/fms-election/backups/status
TRUSTED_PROXY_HOPS=1
```

หมายเหตุของแต่ละค่า:

| ค่า | ต้องเป็นอย่างไร |
|---|---|
| `NEXTAUTH_URL` | ต้องเป็นโดเมนจริงที่ผู้ใช้เปิด ขึ้นต้นด้วย `https://` ตัวตรวจ CSRF ของเบราว์เซอร์ปัจจุบันตัดสินจากหัว `Sec-Fetch-Site` ไม่ดูค่านี้ ส่วนไคลเอนต์ที่ไม่ส่งหัวนั้นจะถูกเทียบ `Origin` กับ `Host` และค่านี้ ถ้าผิดไคลเอนต์กลุ่มนั้นจะถูกปฏิเสธ จึงตั้งให้ตรงโดเมนจริงไว้เสมอ |
| `BASE_PATH`, `NEXT_PUBLIC_BASE_PATH`, `ASSET_PREFIX` | ว่างทั้งสามตัว ใส่ตัวเดียวแล้วทั้งเว็บเป็น 404 |
| `UPLOAD_ROOT` | ใช้เมื่อไม่ใช้ Docker เท่านั้น ต้องอยู่นอกโฟลเดอร์โปรเจกต์ ผู้ใช้ที่รันเว็บต้องเขียนได้ ทำข้อ 6.1 ก่อนมีรูปแรก ถ้าใช้ Docker ห้ามตั้ง เพราะ compose ผูก `./public/images` ไว้แล้ว |
| `BACKUP_STATUS_DIR` | ใช้เมื่อไม่ใช้ Docker ให้หน้าตรวจความพร้อมหา backup เจอ |
| `TRUSTED_PROXY_HOPS` | จำนวนชั้น proxy ที่อยู่หน้าแอป ค่าเริ่มต้น 1 คือมี nginx ชั้นเดียว ถ้ามี load balancer อยู่หน้า nginx อีกชั้นให้ตั้ง 2 ไม่เช่นนั้นทุกคนจะถูกนับเป็น IP เดียวกันและตัวกันเดารหัสจะกันผิดคน |
| `ADMIN_TEST_TOOLS` | ห้ามใส่ในไฟล์นี้ ถ้าใส่ ข้อตรวจความพร้อม "เครื่องมือทดสอบของแอดมิน" จะไม่ผ่าน บนเครื่องจริง เครื่องมือนี้ใช้ได้เฉพาะฐานข้อมูลที่ชื่อลงท้าย `_e2e` หรือ `_test` |
| `NEXT_PUBLIC_ENABLE_MOCK_LOGIN` | ไม่ต้องใส่ ตัวกั้นการล็อกอินจำลองคือ `NODE_ENV=production` |

ตรวจว่าสำเร็จ:
- [ ] `ls -l .env` แสดงสิทธิ์ `-rw-------` (ถ้าไม่ใช่ รัน `chmod 600 .env`)
- [ ] `grep -c REPLACE_ .env` ได้ `0`
- [ ] `grep -c ADMIN_TEST_TOOLS .env` ได้ `0`
- [ ] ไม่ใส่คำอธิบายท้ายบรรทัดค่า เพราะตัวอ่านของสคริปต์อาจนับเป็นส่วนของค่า

ค่าที่ไม่ใช้แล้วและห้ามตั้ง: `ADMIN_PRIVATE_KEY`, `ADMIN_AUTH_SECRET`, `NEXT_PUBLIC_ADMIN_PUBLIC_KEY`,
`NEXT_PUBLIC_ADMIN_AUTH_SECRET`, `ADMIN_PASSWORD_AUTH_EXTRA`, `ADMIN_STUDENT_IDS`
รหัสผ่านแอดมินไม่อยู่ใน env แต่เก็บเป็น hash ในฐานข้อมูล (ข้อ 9)

ถ้าใช้ Docker: เพิ่ม `MIGRATE_DATABASE_URL` และ `POSTGRES_PASSWORD` ตาม STAFF-IT-GUIDE §3.2 ไม่ตั้ง `UPLOAD_ROOT`
และ `DATABASE_URL` ชี้ host ที่คอนเทนเนอร์เข้าถึงได้

---

## 6. สร้างโปรแกรมและเปิดเว็บ

### 6.1 เตรียมโฟลเดอร์รูป

```bash
sudo mkdir -p /var/lib/fms-ovs/images
sudo chown -R fms:fms /var/lib/fms-ovs/images
```

เปลี่ยน `fms:fms` เป็นผู้ใช้และกลุ่มที่รันเว็บ

ตรวจว่าสำเร็จ: `sudo -u fms touch /var/lib/fms-ovs/images/.t && sudo -u fms rm /var/lib/fms-ovs/images/.t` ไม่ขึ้น error

### 6.2 build

หยุดเว็บเก่าก่อน เพราะ build ลบ `.next` ทิ้ง

```bash
cd /opt/fms-election
npm run build
mkdir -p .next/standalone/.next
cp -a .next/static .next/standalone/.next/
cp -a public .next/standalone/
ln -sf "$PWD/.env" .next/standalone/.env
```

`npm run build` ดาวน์โหลดฟอนต์จาก Google ระหว่าง build (`next/font`) เครื่องที่ build ต้องออกเน็ตไป `fonts.googleapis.com` และ `fonts.gstatic.com` ได้
CI เคยล้มด้วย error ของ `next/font` หลายรอบ แล้วรันซ้ำผ่าน ถ้าล้มด้วยข้อความเกี่ยวกับฟอนต์ ให้รัน `npm run build` ซ้ำก่อน
ถ้าเครื่องจริงออกเน็ตไปสองโดเมนนั้นไม่ได้ ให้ build บนเครื่องอื่นที่ออกได้ (ระบบปฏิบัติการ สถาปัตยกรรม และ Node รุ่นหลักเดียวกับเครื่องจริง) แล้วคัดลอกโฟลเดอร์ `.next/standalone`
ทั้งโฟลเดอร์ไปเครื่องจริง จากนั้นทำสามบรรทัดที่เหลือ (`cp` สองบรรทัดและ `ln -sf`) บนเครื่องจริง
ค่า `BASE_PATH` และ `NEXT_PUBLIC_*` ถูกฝังตอน build จึงต้องตั้งให้ถูกบนเครื่องที่ build วิธีคัดลอกนี้ยังไม่ได้พิสูจน์ในโครงการนี้ ให้ทดสอบด้วยตรวจสุขภาพ (ข้อ 6.3) ก่อนใช้จริง

ตรวจว่าสำเร็จ:
- [ ] `npm run build` จบโดยไม่ล้ม
- [ ] `ls .next/standalone/server.js` พบไฟล์
- [ ] `ls -l .next/standalone/.env` เห็นลิงก์ชี้ไป `.env` ตัวจริง

### 6.3 เปิดเว็บให้ฟังเฉพาะเครื่องนี้

พอร์ตของแอปต้องผูกที่ `127.0.0.1` เท่านั้น ถ้าเปิดให้ทุก interface คนจะเรียกแอปตรงโดยไม่ผ่าน nginx ได้
ซึ่งทำให้ตัวกันเดารหัสและตัวตรวจต้นทางถูกหลบ ตัวอย่างไฟล์ `/etc/systemd/system/fms-ovs.service`
(แก้ `User` และ path ของ `node` ตาม `which node`):

```ini
[Unit]
Description=FMS online voting
After=network-online.target postgresql.service

[Service]
User=fms
WorkingDirectory=/opt/fms-election
Environment=PORT=3000 HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fms-ovs
ss -ltn | grep 3000
curl -i http://127.0.0.1:3000/api/health
```

ตรวจว่าสำเร็จ:
- [ ] `ss -ltn` แสดง `127.0.0.1:3000` ไม่ใช่ `0.0.0.0:3000` หรือ `*:3000`
- [ ] `curl` ได้ `200` และ `{"ok":true,"db":true}`
- [ ] ขอไฟล์ JS ของหน้าแรกแล้วได้ 200 (ถ้าได้ 404 แปลว่าลืม `cp -a .next/static`):

```bash
P=$(curl -s http://127.0.0.1:3000/ | grep -o '/_next/static/[^"]*\.js' | head -1)
curl -s -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:3000$P"
```

ถ้าใช้ pm2 หรือรันด้วย node ตรง ๆ ดูตัวอย่างใน STAFF-IT-GUIDE §3.7 (ต้องตั้ง `HOSTNAME=127.0.0.1` ที่ตัวรัน ไม่ใช่ใน `.env`)

ถ้าใช้ Docker: ไฟล์ `docker-compose.yml` ผูกพอร์ตเป็น `"127.0.0.1:3000:3000"` แล้ว (ฟังเฉพาะเครื่องนี้ nginx บนโฮสต์เข้าถึงได้) อย่าแก้กลับเป็น `"3000:3000"` หลังรัน `docker compose up` ให้ตรวจด้วย `ss -ltn | grep 3000` ให้เห็น `127.0.0.1:3000`

---

## 7. nginx

ตัวอย่างบล็อก server ของโดเมน (ใบรับรอง HTTPS ตั้งตามมาตรฐานของคณะ):

```nginx
server {
    listen 443 ssl;
    server_name ovs.fms.psu.ac.th;

    include /etc/nginx/snippets/auth-proxy-buffers.conf;
    client_max_body_size 200m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-Host $http_host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

- [ ] คัดลอก `deploy/nginx/auth-proxy-buffers.conf` ไปที่ `/etc/nginx/snippets/` (กัน 502 ตอนกลับจาก SSO เพราะ header ของ session ยาว)
- [ ] `Host $http_host` ต้องมี เบราว์เซอร์ปัจจุบันถูกตัดสินจากหัว `Sec-Fetch-Site` ซึ่งไม่ดู Host แต่ไคลเอนต์ที่ไม่ส่งหัวนั้นจะถูกเทียบ `Origin` กับ `Host` ถ้า nginx ส่ง Host ผิด ไคลเอนต์กลุ่มนั้นจะโหวตไม่ได้
- [ ] `client_max_body_size 200m;` ต้องมี ค่าเริ่มต้นของ nginx คือ 1 MB ทำให้รูปที่ใหญ่กว่า 1 MB ถูกปฏิเสธ
      แอปจำกัดไฟล์ละไม่เกิน 20 MB และรวมไม่เกิน 200 MB ต่อคำขอ แอปใช้ RAM ราว 4 เท่าของขนาดคำขอ ถ้าเครื่อง RAM น้อยให้ลดเลข 200 ลงตามที่รับได้
- [ ] สำรองไฟล์ config เดิมก่อนแก้ แล้วรัน `sudo nginx -t` ต้องขึ้น `test is successful` จึงค่อย `sudo systemctl reload nginx`

ตรวจว่าสำเร็จ (รันจากเครื่องอื่นหรือเครื่องนี้):

```bash
curl -i https://ovs.fms.psu.ac.th/api/health
curl -i -X POST https://ovs.fms.psu.ac.th/api/vote -H 'Origin: https://evil.example.com' -H 'Content-Type: application/json' -d '{}'
```

- [ ] คำสั่งแรกได้ `200` และ `{"ok":true,"db":true}` ผ่านโดเมนจริง
- [ ] คำสั่งที่สองได้ `403` และเนื้อหามีคำว่า `BAD_ORIGIN` (ตัวตรวจ CSRF ทำงาน)
- [ ] เปิดหน้าแรกในเบราว์เซอร์ต้องไม่มีใบรับรองเตือน และกดเมนูแล้วไม่ขึ้น 404

เรื่อง `TRUSTED_PROXY_HOPS`: ถ้าระหว่างผู้ใช้กับ nginx มี load balancer หรือ proxy ของคณะอีกชั้น ให้ตั้ง `TRUSTED_PROXY_HOPS=2`
รายละเอียดอยู่ใน STAFF-IT-GUIDE §3.8

---

## 8. ตรวจกุญแจและการล็อกอิน

- [ ] เปิด `https://ovs.fms.psu.ac.th` แล้วล็อกอินด้วย PSU SSO ของบัญชีทดสอบ ต้องกลับมาที่ระบบโดยไม่ขึ้น 502
- [ ] session ของนักศึกษาหมดอายุใน 1 ชั่วโมงหลังล็อกอินและไม่ต่ออายุเอง ใครอยู่หน้าลงคะแนนเกิน 1 ชั่วโมงต้องล็อกอินใหม่ นี่เป็นพฤติกรรมที่ตั้งใจ
- [ ] ทดสอบว่ากุญแจขาดแล้วโหวตไม่ได้: บนเครื่องทดสอบ (ไม่ใช่เครื่องจริง) ลบ `ELECTION_BALLOT_PUBLIC_KEY` แล้ว `/api/vote` ต้องตอบ 503

---

## 9. บัญชีแอดมินและเจ้าหน้าที่

รันบนเครื่องเว็บในโฟลเดอร์โปรเจกต์:

```bash
DATABASE_URL="$APP_DATABASE_URL" node scripts/admin.js --create-staff ovs-staff-01 --name "ชื่อ นามสกุลจริงของเจ้าหน้าที่"
DATABASE_URL="$APP_DATABASE_URL" node scripts/admin.js --grant <รหัส นศ. ของกรรมการแต่ละคน>
DATABASE_URL="$APP_DATABASE_URL" node scripts/admin.js --rotate-password
DATABASE_URL="$APP_DATABASE_URL" node scripts/admin.js --list
```

- [ ] ชื่อผู้ใช้ของ `--create-staff` ต้องไม่ซ้ำกับ username PSU Passport ของใครเลย (รวมเจ้าตัว) เพราะระบบใช้ username นั้นเป็นรหัสผู้ใช้
      ถ้าซ้ำและเจ้าของ username เผลอล็อกอินผ่านหน้า SSO ข้อมูลของบัญชีเจ้าหน้าที่จะถูกเขียนทับ ตัวอย่างข้างบนใช้รูปแบบ `ovs-staff-01` ที่ PSU Passport ไม่ใช้
- [ ] คำสั่ง `--create-staff` แสดงรหัสส่วนตัวของเจ้าหน้าที่ครั้งเดียว เก็บเข้าตัวจัดการรหัสผ่านทันที
- [ ] คำสั่ง `--rotate-password` แสดงรหัสกลางครั้งเดียว แจกให้กรรมการผ่านช่องทางที่เหมาะสม
- [ ] `--list` ต้องเห็นเฉพาะคนที่ตั้งใจให้เป็นแอดมิน และบัญชีเจ้าหน้าที่เป็น role `STAFF`

ตรวจว่าสำเร็จ: เปิด `https://ovs.fms.psu.ac.th/admin/login` แล้วเข้าได้ด้วยรหัส นศ. ของกรรมการ + รหัสกลาง
และเข้าได้ด้วยบัญชีเจ้าหน้าที่ + รหัสส่วนตัว (ลองก่อนวันจริง เพราะผู้รับรองผลคือบัญชีนี้)
session ของแอดมินหมดอายุใน 2 ชั่วโมง ส่วนของนักศึกษาหมดใน 1 ชั่วโมง
รายละเอียดใน STAFF-IT-GUIDE §4.1

---

## 10. นำเข้ารายชื่อ พรรคจริง และตั้งค่าในหน้าแอดมิน

```bash
DATABASE_URL="$APP_DATABASE_URL" npm run import-students -- /srv/fms-import/students-2569.xlsx
```

- [ ] อ่านยอด สร้างใหม่ อัปเดต ข้าม และ Error เทียบกับจำนวนที่คาดไว้ คำสั่งนี้เขียนฐานข้อมูลทันที ไม่มีหน้ายืนยัน (STAFF-IT-GUIDE §4.2)
- [ ] ชั้นปีในไฟล์เป็นเลข 1 ถึง 4 เท่านั้น

ข้อมูลตัวอย่างของ repository ไม่ใช่ข้อมูลจริง ต้องใส่พรรคและสมาชิกจริงผ่านหน้าแอดมินเอง (ห้ามรัน `prisma/seed.js` บนเครื่องจริง)
เข้า `/admin` ด้วยบัญชีกรรมการแล้วทำตามนี้ (วิธีใช้แต่ละหน้าอยู่ใน [ADMIN-GUIDE.md](ADMIN-GUIDE.md)):

- [ ] เมนู ตั้งค่าทั่วไป: ชื่อโครงการ ครั้งที่ ปีการศึกษา และวันเวลา 3 ช่อง (เปิดตัวผู้สมัคร เปิดหีบ ปิดหีบ) เวลาเป็นเวลาไทย
- [ ] เมนู จัดการผู้สมัคร: ใส่พรรคจริง สมาชิก รูป และเบอร์พรรค (เบอร์ต้องถูกต้องก่อนมีบัตรใบแรก เพราะหลังจากนั้นแก้เบอร์ไม่ได้)
- [ ] เมนู เลือกธีม: เลือกธีมของปี ดูตัวอย่างก่อนกด ใช้ธีมนี้
- [ ] ที่ศูนย์ควบคุม โหมดระบบเป็น `AUTO` และไม่ได้ประกาศผล

---

## 11. กดตรวจความพร้อมระบบ

ที่เมนู ความพร้อมและระบบ ในหน้าแอดมิน การ์ด ตรวจความพร้อมระบบ ตรวจให้เองเมื่อเปิดหน้า
กดปุ่ม ตรวจซ้ำ เมื่อแก้อะไรแล้วต้องการดูผลใหม่ การตรวจอ่านอย่างเดียว ไม่แก้ข้อมูล

ระบบตรวจ 17 ข้อ แบ่งเป็นกลุ่มดังนี้:

| กลุ่ม | ข้อที่ตรวจ |
|---|---|
| เวลา | ลำดับเวลาเปิดปิดหีบ, เวลาเปิดตัวผู้สมัคร, แหล่งที่มาของเวลาเลือกตั้ง, ความสอดคล้องของเวลากับปัจจุบัน, โหมดการทำงานของระบบ |
| พรรค | จำนวนพรรคผู้สมัคร, ตัวเลือกกรณีพรรคเดียว, ความครบถ้วนของข้อมูลพรรค |
| ผู้มีสิทธิ์ | รายชื่อผู้มีสิทธิ์เลือกตั้ง |
| คะแนน | ความสอดคล้องของคะแนน |
| ตั้งค่า | ลิงก์แบบประเมิน (Google Form), การแสดงผลคะแนนก่อนปิดหีบ, ธีมหน้าเว็บที่ใช้งาน |
| เครื่อง | การเข้าสู่ระบบจำลอง, โฟลเดอร์เก็บรูปที่อัปโหลด, สำรองข้อมูลอัตโนมัติ (backup), เครื่องมือทดสอบของแอดมิน |

- [ ] ต้องไม่มีข้อ `ไม่ผ่าน` (สีแดง) ข้อ `เตือน` (สีเหลือง) ต้องอ่านและรู้ว่ารับได้ทุกข้อ
- [ ] ข้อ "การเข้าสู่ระบบจำลอง" ต้องผ่านเอง ถ้าไม่ผ่านแปลว่าเครื่องนี้ไม่ได้รันเป็น production build (เช่นรัน `npm run dev`)
- [ ] ข้อ "เครื่องมือทดสอบของแอดมิน" ต้องผ่าน ถ้าไม่ผ่านให้ลบ `ADMIN_TEST_TOOLS` ออกจาก `.env` แล้วรีสตาร์ต
- [ ] ข้อ "โฟลเดอร์เก็บรูปที่อัปโหลด" ต้องไม่แดง และข้อ backup ต้องผ่านหลังทำข้อ 12
- [ ] รันตัวตรวจสิทธิ์ฐานข้อมูลอีกชั้นหนึ่ง:

```bash
DATABASE_URL="$APP_DATABASE_URL" npm run preflight
```

ตรวจว่าสำเร็จ: preflight ต้องมีบรรทัด `app cannot delete ballots` ถ้าขึ้น `app CAN delete ballots` แปลว่า `DATABASE_URL` ของเว็บยังชี้ผิด role ให้แก้ก่อนเปิดหีบ

---

## 12. สำรองข้อมูลและสำเนานอกเครื่อง

เครื่องจริงไม่ใช้ Docker จึงไม่มี service backup ให้ ต้องตั้ง cron เองและต้องตั้งก่อนวันซ้อมระบบ
เลือกตัวตั้งเวลาอย่างเดียวและอย่าตั้งซ้อน ขั้นตอนเต็มอยู่ที่ [../deploy/backup/README.md](../deploy/backup/README.md)

### 12.1 backup ฐานข้อมูลและรูป

```bash
sudo apt-get install -y postgresql-client
sudo cp deploy/backup/backup.env.example /etc/fms-backup.env
sudo chown fms: /etc/fms-backup.env
sudo chmod 600 /etc/fms-backup.env
sudo nano /etc/fms-backup.env
mkdir -p backups
crontab -e
```

- [ ] ใน `/etc/fms-backup.env` ใส่ `BACKUP_DATABASE_URL` ของบัญชีที่อ่านได้ทุกตาราง (ไม่ใช่ `fms_app`) และ `UPLOAD_ROOT` เป็น path เดียวกับใน `.env` ของแอป
- [ ] ใน crontab เพิ่มบรรทัดจาก `deploy/backup/crontab.example` โดยแก้ `/opt/fms-election` ให้ตรง
- [ ] `pg_dump` ต้องมีรุ่นหลักไม่ต่ำกว่าเซิร์ฟเวอร์ฐานข้อมูล

สั่งสำรองหนึ่งรอบทันที แล้วตรวจ:

```bash
cd /opt/fms-election && BACKUP_ENV_FILE=/etc/fms-backup.env BACKUP_RUNNER=cron DUMP_VIA=direct sh scripts/backup.sh
ls -l backups backups/status
```

- [ ] ใน `backups/` มีไฟล์ `db-....sql.gz` และ `images-....tar.gz` และใน `backups/status/` มี `LAST_OK`
- [ ] ที่หน้า ความพร้อมและระบบ กด ตรวจซ้ำ ข้อสำรองข้อมูลอัตโนมัติ ต้องผ่าน
- [ ] ซ้อมกู้กับฐานข้อมูลทิ้งได้ 1 ครั้ง ทำกับฐานข้อมูลแยกเท่านั้น ห้ามทำกับฐานจริง เพราะคำสั่งล้าง schema เดิมทิ้ง:

```bash
RESTORE_VIA=direct RESTORE_DATABASE_URL="postgresql://<ผู้ใช้>@<เครื่อง>:5432/fms_restore_test" BACKUP_APP_DIR=/opt/fms-election sh scripts/restore.sh backups/db-....sql.gz
```

### 12.2 สำเนา backup ออกนอกเครื่อง

ไฟล์ใน `backups/` อยู่ดิสก์เดียวกับฐานข้อมูล ถ้าเครื่องเสียจะหายหมด ต้องคัดลอกออกไปอีกเครื่อง เช่น

```
45 */6 * * * rsync -a /opt/fms-election/backups/ backupuser@nas.example:/srv/fms-backup/
```

- [ ] เปลี่ยนผู้ใช้และเครื่องปลายทางให้ตรงของจริง และตั้ง SSH key ให้เข้าได้โดยไม่ถามรหัส
- [ ] ไม่ใส่ `--delete` เพื่อให้ปลายทางเก็บไฟล์ไว้นานกว่าเครื่องหลัก
- [ ] ตรวจที่ปลายทางว่ามีไฟล์ใหม่เข้ามาจริง ผลของคำสั่งนี้ไม่ขึ้นในหน้าตรวจความพร้อม

### 12.3 เก็บปลายโซ่บัตรไว้นอกเครื่อง

ปลายโซ่คือค่าที่ใช้พิสูจน์ว่าบัตรเก่าไม่ถูกแก้ ค่านี้ไม่เปิดเผยว่าใครเลือกอะไร ต้องเก็บไว้เครื่องอื่นที่คนแก้ฐานข้อมูลเข้าไม่ถึง

```bash
node scripts/export-chain-head.js
```

- [ ] คำสั่งพิมพ์บรรทัดเดียวมีเวลา `head=` `seq=` และ `ballots=` ถ้าพิมพ์ `NO_CHAIN_HEAD` แปลว่าแถวต้นโซ่ขาด ให้กลับไปข้อ 3.2
- [ ] ตั้ง cron ส่งออกทุก 30 นาทีช่วงเปิดหีบไปเก็บเครื่องอื่น ตัวอย่างที่ส่งผ่าน SSH:

```
*/30 * * * * cd /opt/fms-election && node scripts/export-chain-head.js | ssh backupuser@nas.example 'cat >> /srv/fms-chain/chain-head.log'
```

- [ ] ตรวจที่ปลายทางว่าไฟล์ `chain-head.log` มีบรรทัดใหม่เข้ามาทุกครึ่งชั่วโมง

---

## 13. ซ้อมระบบแล้วล้างบัตรซ้อม

- [ ] ซ้อมกับกรรมการโดยใช้โหมด `OPEN` ที่ศูนย์ควบคุม ลงคะแนนด้วยบัญชีทดสอบ 1 ถึง 2 บัตร แล้วเปลี่ยนกลับเป็น `AUTO`
- [ ] ห้ามกดรับรองผลตอนซ้อม เพราะย้อนกลับเองไม่ได้
- [ ] ตรวจโซ่หลังซ้อม ต้องผ่านทุกข้อ:

```bash
DATABASE_URL="$APP_DATABASE_URL" node scripts/verify-ballot-chain.js; echo "exit=$?"
```

  exit 0 คือผ่านทุกข้อ, exit 2 คือมีค่าไม่ตรง (โซ่ถูกแก้ ยอดไม่เท่ากัน หรือเปลี่ยนไปจากที่รับรองไว้), exit 1 คือรันไม่ได้ (เช่นไม่มี `BALLOT_CHAIN_SECRET`)

- [ ] ล้างบัตรซ้อมก่อนวันจริง ด้วยบัญชี `fms_migrate` หลังสำรองก่อนเสมอ:

```bash
cd /opt/fms-election && BACKUP_ENV_FILE=/etc/fms-backup.env BACKUP_RUNNER=cron DUMP_VIA=direct sh scripts/backup.sh
psql "$MAINT_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/sql/annual-reset.sql
DATABASE_URL="$APP_DATABASE_URL" npm run preflight
```

ตรวจว่าสำเร็จ:
- [ ] ที่หน้า ความพร้อมและระบบ ข้อความสอดคล้องของคะแนนผ่าน โดยคะแนนรวม บัตรในหีบ และผู้ลงคะแนนเป็นศูนย์
- [ ] ถ้าล้างหลังการรับรอง คำสั่งล้างจะลบตัวเลขที่รับรองไว้และธงรับรองด้วย (ดู STAFF-IT-GUIDE §5)

คำสั่งนี้ลบข้อมูลถาวร กู้คืนได้เฉพาะจาก backup

---

## 14. วันเลือกตั้ง

- [ ] เช้าวันจริง: `curl -i https://ovs.fms.psu.ac.th/api/health` ได้ 200 และหน้า ความพร้อมและระบบไม่มีข้อสีแดง
- [ ] ข้อ backup เป็นรอบล่าสุด และ `chain-head.log` ที่เครื่องปลายทางมีบรรทัดใหม่
- [ ] ตั้ง uptime checker ยิง `/api/health` ทุก 1 ถึง 5 นาที
- [ ] ไม่อัปเดตโค้ด ไม่รีสตาร์ตเว็บโดยไม่จำเป็นระหว่างเปิดหีบ
- [ ] โหมด `AUTO`: เมื่อเลยเวลาปิดหีบ บัตรที่ยังรอคิวอยู่ในระบบจะถูกปฏิเสธ ผู้ใช้ที่กดส่งช้าจะเห็นข้อความว่าปิดหีบแล้ว นี่เป็นพฤติกรรมที่ตั้งใจ ถ้าต้องการให้ลงคะแนนต่อ ต้องขยายเวลาปิดหีบก่อนถึงเวลาเดิม

---

## 15. หลังปิดหีบ

ทำตามลำดับ:

1. [ ] ให้แน่ใจว่าหีบปิด (`AUTO` เลยเวลา หรือกด ENDED ที่ศูนย์ควบคุม) แล้วตรวจโซ่และยอด:

```bash
DATABASE_URL="$APP_DATABASE_URL" node scripts/reconcile-scores.js
DATABASE_URL="$APP_DATABASE_URL" node scripts/verify-ballot-chain.js; echo "exit=$?"
node scripts/export-chain-head.js
```

   ต้องผ่านทุกข้อและ `exit=0` เก็บบรรทัดของ `export-chain-head.js` ไว้เครื่องอื่นอีกชุดหนึ่ง

2. [ ] กรรมการกด ประกาศผล ที่ศูนย์ควบคุม
3. [ ] เจ้าหน้าที่เข้าด้วยบัญชี `STAFF` ของตนเองแล้วกด รับรองผล ระบบจะตรวจโซ่และเทียบจำนวนบัตร คะแนนรวม และจำนวนผู้ลงคะแนนก่อน ถ้าไม่ตรงกันจะปฏิเสธพร้อมบอกเหตุ ถ้าผ่านจะบันทึกตัวเลขที่รับรอง (คะแนนรายพรรค จำนวนบัตร ปลายโซ่) ลงระบบ
4. [ ] เจ้าหน้าที่คัดลอกส่วน ตัวเลขที่รับรองไว้ ในศูนย์ควบคุม (ปุ่มคัดลอกหรือดาวน์โหลด) เก็บสำเนานอกระบบ เช่นพิมพ์ลงกระดาษหรือเก็บไว้เครื่องอื่น
5. [ ] รันตรวจอีกครั้งหลังรับรอง ครั้งนี้สคริปต์เทียบฐานข้อมูลปัจจุบันกับตัวเลขที่รับรองไว้ด้วย:

```bash
DATABASE_URL="$APP_DATABASE_URL" node scripts/verify-ballot-chain.js; echo "exit=$?"
```

   `exit=0` ผ่าน, `exit=2` ไม่ตรง (มีบรรทัด FAIL บอกว่าค่าไหนต่างไป), `exit=1` รันไม่ได้

6. [ ] เจ้าหน้าที่ฐานข้อมูลรัน `CLUSTER "User" USING "User_studentId_key";` ด้วย `fms_migrate` หนึ่งครั้ง (STAFF-IT-GUIDE §4.3)
7. [ ] สำรองทันทีหนึ่งรอบ เก็บสำเนาสิ้นปีไว้นอก `backups/` และนอกเครื่อง
8. [ ] `npm run archive-year` เก็บผลและตัวเลขที่รับรองของปีนี้ ให้เก็บโฟลเดอร์นี้ไว้ในที่ที่คณะกำหนดก่อนล้างข้อมูลปีถัดไป repository นี้เป็น public จึงนำเข้า repository เฉพาะเมื่อคณะอนุมัติ

ถ้ามีข้อพิพาทต้องนับใหม่ ใช้ `node scripts/decrypt-recount.js --key <ไฟล์ private key แบบ pem>` บนเครื่องที่ไม่ต่อเน็ตเท่านั้น โดยถอดไฟล์ `.enc` จากข้อ 4 ออกมาเป็นไฟล์ pem ก่อน (ขั้นตอนใน BALLOT-SECURITY-GUIDE) ห้ามเอา private key ขึ้นเซิร์ฟเวอร์

---

## 16. สคริปต์ที่ใช้ในรายการนี้

| ใช้ทำอะไร | path |
|---|---|
| สร้างกุญแจบัตร (เครื่องไม่ต่อเน็ต) | `scripts/generate-election-keys.js` |
| ล็อกสิทธิ์ตารางบัตร | `scripts/sql/ballot-grants.sql` |
| ล้างข้อมูลขึ้นปีใหม่หรือล้างบัตรซ้อม | `scripts/sql/annual-reset.sql` |
| จัดการแอดมินและบัญชีเจ้าหน้าที่ | `scripts/admin.js` |
| นำเข้ารายชื่อผู้มีสิทธิ์ | `scripts/import-students.js` (`npm run import-students`) |
| ตรวจสภาพก่อนเปิดเลือกตั้ง | `scripts/preflight-year.js` (`npm run preflight`) |
| ตรวจโซ่บัตรและเทียบกับตัวเลขที่รับรอง | `scripts/verify-ballot-chain.js` |
| ตรวจยอดคะแนน บัตร และผู้ลงคะแนน | `scripts/reconcile-scores.js` |
| ส่งออกปลายโซ่บัตร | `scripts/export-chain-head.js` |
| นับบัตรใหม่ (เครื่องไม่ต่อเน็ต) | `scripts/decrypt-recount.js` |
| สำรองและกู้ข้อมูล | `scripts/backup.sh`, `scripts/restore.sh`, `deploy/backup/` |
| เก็บผลปีนี้ลงโฟลเดอร์ archive | `scripts/archive-year.js` (`npm run archive-year`) |
| ตั้งค่า buffer ของ nginx สำหรับ SSO | `deploy/nginx/auth-proxy-buffers.conf` |
