# สำรองข้อมูลอัตโนมัติ — เลือกตามวิธีรันแอป

สคริปต์ที่สำรองจริงมีตัวเดียว คือ [scripts/backup.sh](../../scripts/backup.sh) (dump ฐานข้อมูล ตรวจเนื้อ dump แล้วค่อยบีบอัด tar รูป ลบไฟล์เก่า และเขียนผลลง `backups/status/`)
ทุกแบบด้านล่างต่างกันแค่ว่าใครเป็นคนสั่งให้มันรัน

| แอปรันแบบไหน | ใช้อะไรตั้งเวลา | ไฟล์ในโฟลเดอร์นี้ |
| --- | --- | --- |
| `docker compose up -d` | service `backup` ใน `docker-compose.yml` (มีอยู่แล้ว ไม่ต้องทำอะไร) | ไม่ต้องใช้ |
| `node .next/standalone/server.js` หรือ `npm start` โดยไม่มี Docker | cron | `crontab.example` |
| รันด้วย systemd (หรืออยากได้ตัวตั้งเวลาที่ catch up รอบที่พลาด) | systemd timer | `fms-backup.service`, `fms-backup.timer` |
| รันด้วย pm2 | pm2 รัน `scripts/backup-loop.sh` เป็นโปรเซสแยก | `ecosystem.backup.config.cjs` |

เลือกอย่างเดียว อย่าตั้งซ้อนกัน (จะได้ backup สองชุดและเปลืองดิสก์) ถ้าเปลี่ยนวิธีรันแอปปีหน้า ให้ปิดตัวตั้งเวลาเดิมก่อน
ผลของทุกแบบขึ้นที่เดียวกัน: แอดมิน แท็บตั้งค่าระบบ การ์ด "ตรวจความพร้อมระบบ READINESS" ข้อ "สำรองข้อมูลอัตโนมัติ (backup)"

## ทำครั้งเดียวสำหรับทุกแบบที่ไม่ใช่ Docker

1. ติดตั้ง PostgreSQL client ให้มี `pg_dump` รุ่นหลักไม่ต่ำกว่าเซิร์ฟเวอร์ฐานข้อมูล (Ubuntu: `sudo apt install postgresql-client`) ตรวจด้วย `pg_dump --version` กับ `psql -V` บนเครื่องเดียวกับ DB
2. สร้างไฟล์ env เก็บรหัสผ่านฐานข้อมูล แยกจาก `.env` ของแอป:
   ```
   sudo cp deploy/backup/backup.env.example /etc/fms-backup.env
   sudo chown <ผู้ใช้ที่รัน backup>: /etc/fms-backup.env
   sudo chmod 600 /etc/fms-backup.env
   sudo nano /etc/fms-backup.env      # ใส่ BACKUP_DATABASE_URL จริง
   ```
   บัญชีใน URL ต้องอ่านได้ทุกตารางรวม `_prisma_migrations` ไม่ใช่ `fms_app` ของแอป ([STAFF-IT-GUIDE §8.2](../../docs/STAFF-IT-GUIDE.md))
   รหัสผ่านไม่อยู่ในบรรทัด crontab / unit / ecosystem เพราะคนอื่นบนเครื่องเห็นได้ผ่าน `crontab -l`, `ps`, `pm2 show`
   ถ้าไฟล์นี้ group/คนอื่นอ่านได้ `backup.sh` จะเตือนใน log
3. โฟลเดอร์โปรเจกต์ต้องเขียน `backups/` ได้โดยผู้ใช้ที่รัน backup: `mkdir -p backups` แล้ว `chown` ให้ผู้ใช้นั้น
   ไฟล์ dump เป็น 0600 (มีรหัสนักศึกษาและใครลงคะแนนแล้ว) อ่านได้เฉพาะผู้ใช้นั้น ส่วน `backups/status/` เปิดให้เว็บอ่านได้เพราะมีแค่เวลาและชื่อไฟล์
4. ถ้าแอปตั้ง `UPLOAD_ROOT` (รูปอัปโหลดอยู่นอก `public/images`) ใส่ค่าเดียวกันเป็น path เต็มใน `/etc/fms-backup.env` ไม่งั้นรูปที่อัปโหลดจะไม่อยู่ใน archive
   `backup.sh` ลองอ่าน `UPLOAD_ROOT` จาก `.env` ของแอปให้ถ้าไม่ได้ตั้ง แต่ค่าที่ตั้งชัดเจนใน env ไฟล์นี้แน่นอนกว่า
   ใน tar ยังเป็น path `public/images/...` เสมอ (ตามที่ `restore.sh` ตรวจ) ไม่ว่ารูปจริงอยู่ที่ไหน

### เว็บต้องอ่านโฟลเดอร์สถานะให้เจอ

หน้าตรวจความพร้อมอ่านผลจาก `BACKUP_STATUS_DIR` ถ้าไม่ได้ตั้ง จะอ่าน `<โฟลเดอร์ที่โปรเซสเว็บรันอยู่>/backups/status`
`node .next/standalone/server.js` ย้ายโฟลเดอร์ทำงานไปที่ `.next/standalone` เองตอนบูต (`process.chdir(__dirname)` ใน server.js ที่ Next สร้าง)
แอปจึงเดินหา `.next/standalone/backups/status` ทั้งที่ backup เขียนไว้ที่ `backups/status` ของโฟลเดอร์โปรเจกต์
โค้ดรุ่นนี้ลองโฟลเดอร์ของโปรเจกต์ให้เองเมื่อเจอรูปแบบ `.next/standalone` แต่ถ้ารันแบบอื่น (โฟลเดอร์ปลายทางย้ายไปไว้ที่อื่น ฯลฯ) ให้ตั้งตรง ๆ ใน `.env` ของแอปแล้วรีสตาร์ทเว็บ:

```
BACKUP_STATUS_DIR=/opt/fms-election/backups/status
```

เว็บกับ backup เป็นคนละผู้ใช้ได้: `backup.sh` เปิดสิทธิ์ให้ผ่านเข้า `backups/` ได้ (`o+x`) และตั้ง `backups/status/` เป็น 755, ไฟล์สถานะ 644 ส่วนไฟล์ dump ยัง 0600

## cron (node ตรง ๆ)

```
crontab -e                       # หรือ sudo crontab -e ถ้าให้ root สำรอง
```

วางบรรทัดจาก [crontab.example](crontab.example) แล้วแก้ `/opt/fms-election` เป็นโฟลเดอร์จริง
ถ้าเขียน log ที่ `/var/log/fms-backup.log` ไม่ได้ ให้ชี้ไปที่ที่ผู้ใช้เขียนได้ และตั้ง logrotate ถ้าอยากไม่ให้ไฟล์โต
log ของ cron เอง: `grep CRON /var/log/syslog` (Debian/Ubuntu) หรือ `journalctl -u cron`

สำรองทันที: รันบรรทัดเดียวกับใน crontab ตัดส่วน `>> …` ออก (ตัวอย่างอยู่ท้ายไฟล์ `crontab.example`)

## systemd timer

```
sudo cp deploy/backup/fms-backup.service deploy/backup/fms-backup.timer /etc/systemd/system/
sudo nano /etc/systemd/system/fms-backup.service     # แก้ WorkingDirectory กับ User ตามเครื่องจริง
sudo systemctl daemon-reload
sudo systemctl enable --now fms-backup.timer
```

ตรวจ: `systemctl list-timers fms-backup.timer` (ต้องเห็นเวลารอบถัดไป), `journalctl -u fms-backup -n 50`
สำรองทันที: `sudo systemctl start fms-backup.service` (รอจนจบ แล้วดูผลด้วย `journalctl -u fms-backup -n 20`)
`Persistent=true` ทำให้ถ้าเครื่องปิดอยู่ตอนถึงเวลา รอบนั้นรันทันทีที่เครื่องเปิด
ถ้าความถี่เปลี่ยน แก้ `OnCalendar` ใน timer และ `BACKUP_INTERVAL_HOURS` ใน service ให้ตรงกัน

## pm2

```
pm2 start deploy/backup/ecosystem.backup.config.cjs
pm2 save
```

ตรวจ: `pm2 status` (ต้อง `online` ชื่อ `fms-backup`), `pm2 logs fms-backup`
รอบแรกเริ่มหลังรัน 30 วินาที แล้วทุก `BACKUP_INTERVAL_HOURS` (ค่าเริ่มต้น 6) รอบที่ล้มลองใหม่เองใน 30 นาที
สำรองทันที (โดยไม่แตะโปรเซสที่รันอยู่):

```
cd /opt/fms-election && BACKUP_ENV_FILE=/etc/fms-backup.env BACKUP_RUNNER=pm2 DUMP_VIA=direct sh scripts/backup.sh
```

ถ้าไฟล์ ecosystem ของแอปมีอยู่แล้ว เพิ่ม entry `fms-backup` นี้เข้าไปได้เลย ไม่ต้องแยกไฟล์

## ตรวจว่าทำงาน

หลังตั้งเสร็จให้สำรองทันทีหนึ่งรอบ (คำสั่งของแต่ละแบบข้างบน) แล้วดู:

```
ls -l backups backups/status
cat backups/status/LAST_OK          # JSON บรรทัดเดียว มีช่อง "runner" บอกว่ารอบนี้มาจาก cron/systemd/pm2
```

จากนั้นกด "ตรวจตอนนี้" ในหน้าตรวจความพร้อม ข้อ backup ต้องเขียวและบอกตัวรัน
ถ้ายังเหลืองว่าไม่พบประวัติ ทั้งที่มี `LAST_OK` แล้ว แปลว่าเว็บอ่านคนละโฟลเดอร์ ดูหัวข้อ "เว็บต้องอ่านโฟลเดอร์สถานะให้เจอ"
ถ้าแดง ข้อความบอกสาเหตุที่ `backup.sh` เจอ (รหัสผ่านผิด, `pg_dump` รุ่นต่ำกว่าเซิร์ฟเวอร์, ไม่มีตารางหลักใน dump ฯลฯ) และไม่มีไฟล์เก่าถูกลบ

## สำเนานอกเครื่อง

backup ในดิสก์เดียวกับ DB ไม่รอดถ้าเครื่องเสีย ตั้ง `BACKUP_AFTER_CMD` ใน `/etc/fms-backup.env` เช่น `rclone copy backups remote:fms-backup`
คำสั่งนี้รันหลัง backup ผ่านการตรวจแล้วเท่านั้น ล้มแล้วหน้าตรวจความพร้อมขึ้นเหลือง (backup ในเครื่องยังใช้ได้)

## กู้คืน

ดู [MAINTENANCE-RUNBOOK §5](../../docs/MAINTENANCE-RUNBOOK.md) ซ้อมกู้ใส่ฐานข้อมูลทิ้ง ๆ อย่างน้อยหนึ่งครั้งก่อนวันเลือกตั้ง
`restore.sh` บนเครื่องที่ไม่ใช้ Docker ต้องตั้ง `RESTORE_VIA=direct` และ `BACKUP_ENV_FILE` (อ่านวิธีใน runbook)
