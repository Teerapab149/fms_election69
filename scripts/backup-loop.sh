#!/usr/bin/env sh
# FMS Election — ตัววนรอบของ service `backup` ใน docker-compose.yml
#
# รัน scripts/backup.sh แบบ DUMP_VIA=direct ทุก BACKUP_INTERVAL_HOURS ชั่วโมง (ค่าเริ่มต้น 6)
# รอบแรกเริ่มหลังคอนเทนเนอร์ขึ้น BACKUP_FIRST_DELAY_SECONDS วินาที (ค่าเริ่มต้น 30)
# log ทั้งหมดออก stdout/stderr → อ่านด้วย `docker compose logs backup` ไม่มีไฟล์ log โตในคอนเทนเนอร์
#
# รันได้สองที่:
#   - คอนเทนเนอร์ของ compose (ตัวเดิม ไม่เปลี่ยน): โฟลเดอร์แอปคือ /app
#   - โฮสต์ที่ไม่ใช้ Docker ภายใต้ pm2 (deploy/backup/ecosystem.backup.config.cjs) หรือ
#     `nohup sh scripts/backup-loop.sh` · โฟลเดอร์แอปคือที่ที่สคริปต์นี้อยู่ (scripts/..)
#     ตั้ง BACKUP_APP_DIR ทับได้ · ข้อมูลต่อ DB อยู่ใน BACKUP_ENV_FILE (scripts/lib/backup-env.sh)
# ถ้าใช้ cron หรือ systemd timer ไม่ต้องใช้สคริปต์นี้ — ให้ตัวตั้งเวลาเรียก backup.sh ตรง ๆ
#
# อยากได้ backup เดี๋ยวนี้หนึ่งรอบ (ไม่ต้องรอรอบ) ใช้
#   docker compose exec backup sh scripts/backup.sh      (compose)
#   sh scripts/backup.sh พร้อม BACKUP_ENV_FILE / DUMP_VIA=direct   (โฮสต์ — ดู deploy/backup/README.md)
set -u

# path ของ tar รูปต้องขึ้นต้นด้วย public/images เพราะ restore.sh ตรวจแบบนั้นแล้วแตกลง cwd
# จึงต้องรันจากโฟลเดอร์แอป · ค่าเริ่มต้น = โฟลเดอร์แม่ของ scripts/ ที่สคริปต์นี้อยู่ ซึ่งในคอนเทนเนอร์
# (`sh scripts/backup-loop.sh` ใน working_dir /app) ก็คือ /app เหมือนเดิมทุกประการ ไม่ใช่
# ค่าตายตัว /app ที่บนโฮสต์ไม่มีอยู่จริง
app_dir="${BACKUP_APP_DIR:-}"
if [ -z "$app_dir" ]; then
  app_dir="$(cd "$(dirname "$0")/.." 2>/dev/null && pwd)" || app_dir=/app
fi
cd "$app_dir" || { echo "[backup-loop] ✗ เข้าโฟลเดอร์ $app_dir ไม่ได้" >&2; exit 1; }

# ไฟล์ env ใช้ที่นี่เพื่ออ่านรอบ/หน่วงรอบแรกเท่านั้น (backup.sh โหลดซ้ำเองทุกรอบ จึงแก้รหัสผ่าน
# ในไฟล์แล้วมีผลรอบถัดไปโดยไม่ต้องรีสตาร์ท) · ไฟล์เสียที่นี่แค่เตือน ปล่อยให้ backup.sh บันทึก LAST_FAIL
if [ -f "$app_dir/scripts/lib/backup-env.sh" ]; then
  . "$app_dir/scripts/lib/backup-env.sh"
  load_backup_env
  [ -z "$env_err" ] || echo "[backup-loop] WARN: $env_err" >&2
fi

interval="${BACKUP_INTERVAL_HOURS:-6}"
case "$interval" in
  ''|*[!0-9]*|0) echo "[backup-loop] WARN: BACKUP_INTERVAL_HOURS='$interval' ใช้ไม่ได้ (ต้องเป็นจำนวนเต็มชั่วโมง ≥ 1) — ใช้ 6" >&2; interval=6 ;;
esac
first_delay="${BACKUP_FIRST_DELAY_SECONDS:-30}"
case "$first_delay" in ''|*[!0-9]*) first_delay=30 ;; esac

export BACKUP_INTERVAL_HOURS="$interval"
export DUMP_VIA=direct
export OUT_DIR="${OUT_DIR:-backups}"
# ไม่ export IMAGES_DIR แล้ว: backup.sh ตั้งเองได้ (public/images หรือ UPLOAD_ROOT) ซึ่งในคอนเทนเนอร์
# ได้ public/images เหมือนค่าที่เคย export ไว้
# ตัวรัน: ในคอนเทนเนอร์ backup.sh ตรวจเองว่า docker · นอกนั้นถ้าไม่มีใครตั้ง (pm2 ตั้ง "pm2") ก็คือ "loop"
if [ -z "${BACKUP_RUNNER:-}" ] && [ ! -f /.dockerenv ] && [ ! -f /run/.containerenv ]; then
  export BACKUP_RUNNER=loop
fi

interval_s=$((interval * 3600))
# รอบที่ล้มไม่ควรต้องรออีกเต็มรอบ (6 ชม. ในวันเลือกตั้งคือยาวมาก) — ลองใหม่ภายใน 30 นาที
retry_s=1800
[ "$interval_s" -lt "$retry_s" ] && retry_s="$interval_s"

# sleep แบบขัดจังหวะได้: sh รอคำสั่ง foreground จบก่อนค่อยรัน trap · `sleep 21600` ตรง ๆ
# ทำให้ `docker compose stop` ต้องรอจนโดน SIGKILL · sleep ใน background แล้ว wait
# ถูกสัญญาณตัดได้ทันที
sleep_pid=""
nap() {
  sleep "$1" &
  sleep_pid=$!
  wait "$sleep_pid" 2>/dev/null || true
  sleep_pid=""
}
stop() {
  echo "[backup-loop] ได้รับสัญญาณหยุด — ออก"
  if [ -n "$sleep_pid" ]; then kill "$sleep_pid" 2>/dev/null || true; fi
  exit 0
}
trap stop TERM INT

echo "[backup-loop] เริ่มทำงาน: ทุก $interval ชม. (uid $(id -u), $(pg_dump --version 2>/dev/null || echo 'ไม่พบ pg_dump')) รอบแรกในอีก ${first_delay} วินาที"
nap "$first_delay"

while :; do
  # `|| …` สำคัญ: รอบที่ล้มต้องไม่ทำให้ตัววนตาย — ถ้าตาย restart: always จะปลุกขึ้นมา
  # แล้วเริ่มรอบแรกใหม่ทันที กลายเป็นวนยิงฐานข้อมูลถี่ ๆ โดยไม่มีใครตั้งใจ
  if sh scripts/backup.sh; then
    wait_s="$interval_s"
  else
    rc=$?
    if [ "$rc" -eq 2 ]; then
      # exit 2 = backup ในเครื่องสำเร็จและตรวจแล้ว แค่สำเนานอกเครื่องล้ม (ดู backup.sh)
      # ลองใหม่ใน 30 นาทีจะได้แค่ dump ซ้ำเต็ม ๆ ทุกครึ่งชั่วโมงเพื่อไปล้มที่เดิม — รอรอบปกติ
      wait_s="$interval_s"
      echo "[backup-loop] ! backup ในเครื่องสำเร็จ แต่คัดลอกออกนอกเครื่องไม่สำเร็จ (exit 2) — รอบถัดไปตามปกติในอีก $interval ชม." >&2
    else
      wait_s="$retry_s"
      echo "[backup-loop] ✗ รอบนี้ไม่สำเร็จ (exit $rc) — ลองใหม่ในอีก $((wait_s / 60)) นาที" >&2
    fi
  fi
  nap "$wait_s"
done
