# FMS Election — โหลดไฟล์ env ของ backup (source ด้วย `. scripts/lib/backup-env.sh`)
#
# ใช้ร่วมกันโดย scripts/backup.sh และ scripts/backup-loop.sh เพื่อให้ cron / systemd / pm2
# ใส่รหัสผ่านฐานข้อมูลไว้ที่เดียวกัน (ไฟล์เดียว สิทธิ์ 0600) แทนที่จะฝังในบรรทัด crontab
# ซึ่งทุกคนบนเครื่องเห็นผ่าน `ps` / `crontab -l` ได้
#
# เปิดใช้เมื่อตั้ง BACKUP_ENV_FILE เท่านั้น — ไม่ตั้ง = ไม่แตะอะไร service `backup` ใน
# docker-compose.yml ไม่ตั้งตัวนี้ จึงทำงานเหมือนเดิมทุกอย่าง
#
# รูปแบบไฟล์: บรรทัดละ KEY='value' (ครอบด้วย single quote) — รูปแบบนี้ทั้ง sh และ systemd
# EnvironmentFile อ่านได้ตรงกัน จึงใช้ไฟล์เดียวกันกับ fms-backup.service ได้
# ค่าในไฟล์ชนะค่าที่ส่งมาทาง environment · ไม่เคยพิมพ์เนื้อไฟล์ออกจอ
#
# คืนผ่านตัวแปร env_err: ว่าง = โหลดแล้ว (หรือไม่ได้ขอให้โหลด) · ไม่ว่าง = ข้อความสาเหตุ
# ให้ผู้เรียกส่งต่อให้ fail() ของตัวเอง — ไฟล์นี้ไม่ exit เอง เพราะ backup.sh ต้องบันทึก LAST_FAIL
load_backup_env() {
  env_err=""
  [ -n "${BACKUP_ENV_FILE:-}" ] || return 0
  _f="$BACKUP_ENV_FILE"
  [ -f "$_f" ] || { env_err="ไม่พบไฟล์ BACKUP_ENV_FILE ($_f)"; return 0; }
  [ -r "$_f" ] || { env_err="อ่านไฟล์ BACKUP_ENV_FILE ($_f) ไม่ได้ (ผู้ใช้ uid $(id -u))"; return 0; }
  # `.` ของ dash หยุดทั้งเชลล์เมื่อไฟล์มี syntax error และข้อความของ bash อาจโชว์ส่วนของค่าที่อ่านอยู่
  # (ซึ่งอาจเป็นรหัสผ่าน) จึงตรวจแยกก่อนโดยทิ้งข้อความทั้งหมด
  if ! sh -n "$_f" >/dev/null 2>&1; then
    env_err="ไฟล์ BACKUP_ENV_FILE ($_f) เขียนผิดรูปแบบ — ต้องเป็นบรรทัดละ KEY='value' (ไม่แสดงเนื้อไฟล์เพราะอาจมีรหัสผ่าน)"
    return 0
  fi
  # รหัสผ่านอยู่ในไฟล์นี้ — เตือนถ้าคนอื่นบนเครื่องอ่านได้ (ไม่ล้ม: เจ้าหน้าที่แก้ได้หลัง backup ผ่านแล้ว)
  _mode="$(ls -ld "$_f" 2>/dev/null | cut -c5-10)"
  case "$_mode" in
    ------|'') ;;
    *) echo "[backup] WARN: $_f ให้ group/คนอื่นอ่านได้ ($_mode) — ควร chmod 600 เพราะมีรหัสผ่านฐานข้อมูล" >&2 ;;
  esac
  case "$_f" in /*|./*|../*) ;; *) _f="./$_f" ;; esac   # `.` กับชื่อเปล่า ๆ ไปหาใน PATH
  set -a
  . "$_f"
  set +a
  return 0
}
