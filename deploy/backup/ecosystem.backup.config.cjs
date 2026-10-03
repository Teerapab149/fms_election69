// ตัวอย่าง pm2 สำหรับรัน backup เป็นโปรเซสแยก (ไม่ต้องใช้ cron/systemd) — วิธีใช้เต็มดู README.md ข้าง ๆ ไฟล์นี้
//
//   cp deploy/backup/ecosystem.backup.config.cjs ./ecosystem.backup.config.cjs   (หรือรันจากที่เดิมก็ได้)
//   pm2 start deploy/backup/ecosystem.backup.config.cjs
//   pm2 save                       # ให้ขึ้นเองหลังรีบูต (ต้องเคยตั้ง `pm2 startup` แล้ว)
//   pm2 logs fms-backup            # log ทุกรอบ
//
// scripts/backup-loop.sh รัน scripts/backup.sh ทุก BACKUP_INTERVAL_HOURS ชั่วโมง
// (รอบแรกหลังเริ่ม 30 วินาที) · รอบที่ล้มลองใหม่เองใน 30 นาที ไม่ทำให้โปรเซสตาย
// สำรองทันทีหนึ่งรอบโดยไม่รอรอบ: ดูบรรทัด "สำรองทันที" ใน README.md (รัน backup.sh ตรง ๆ)
const path = require("path");

// แอปอยู่สองระดับเหนือไฟล์นี้ (deploy/backup/) — แก้เป็น path จริงถ้าย้ายไฟล์ไปไว้ที่อื่น
const APP_DIR = path.resolve(__dirname, "..", "..");

module.exports = {
  apps: [
    {
      name: "fms-backup",
      script: "scripts/backup-loop.sh",
      interpreter: "sh",
      cwd: APP_DIR,
      env: {
        // ไฟล์ KEY='value' ที่มี BACKUP_DATABASE_URL (chmod 600) — ห้ามใส่รหัสผ่านตรงนี้
        // เพราะ `pm2 env` / `pm2 show` พิมพ์ค่าในไฟล์นี้ให้ทุกคนที่รัน pm2 ได้เห็น
        BACKUP_ENV_FILE: "/etc/fms-backup.env",
        BACKUP_RUNNER: "pm2",
        BACKUP_INTERVAL_HOURS: "6",
      },
      autorestart: true,
      // ถ้า loop ตายเอง (เช่น เข้าโฟลเดอร์ไม่ได้) อย่าให้ pm2 รีสตาร์ทรัว ๆ จน dump ถี่เกิน
      exp_backoff_restart_delay: 5000,
      max_restarts: 10,
      // pm2 ส่ง SIGINT แล้วรอเท่านี้ก่อน SIGKILL: ถ้ากำลัง dump อยู่ ให้รอบนั้นจบก่อน
      // (SIGKILL กลาง dump ทิ้งไฟล์ .partial ค้าง — backup.sh ลบให้เมื่อเก่าเกิน 1 วัน)
      kill_timeout: 120000,
    },
  ],
};
