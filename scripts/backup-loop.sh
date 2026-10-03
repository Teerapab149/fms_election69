#!/usr/bin/env sh
# FMS Election — ตัววนรอบของ service `backup` ใน docker-compose.yml
#
# รัน scripts/backup.sh แบบ DUMP_VIA=direct ทุก BACKUP_INTERVAL_HOURS ชั่วโมง (ค่าเริ่มต้น 6)
# รอบแรกเริ่มหลังคอนเทนเนอร์ขึ้น BACKUP_FIRST_DELAY_SECONDS วินาที (ค่าเริ่มต้น 30)
# log ทั้งหมดออก stdout/stderr → อ่านด้วย `docker compose logs backup` ไม่มีไฟล์ log โตในคอนเทนเนอร์
#
# ไม่ได้ออกแบบให้รันบนโฮสต์ · อยากได้ backup เดี๋ยวนี้หนึ่งรอบ (ไม่ต้องรอรอบ) ใช้
#   docker compose exec backup sh scripts/backup.sh
# (คอนเทนเนอร์นี้ตั้ง DUMP_VIA=direct และ PG* ไว้แล้ว — ดู MAINTENANCE-RUNBOOK §5)
set -u

# path ของ tar รูปต้องขึ้นต้นด้วย public/images เพราะ restore.sh ตรวจแบบนั้นแล้วแตกลง cwd
# จึงต้องรันจาก /app และส่ง IMAGES_DIR แบบ relative ไม่ใช่ /app/public/images
cd "${BACKUP_APP_DIR:-/app}" || { echo "[backup-loop] ✗ เข้าโฟลเดอร์ ${BACKUP_APP_DIR:-/app} ไม่ได้" >&2; exit 1; }

interval="${BACKUP_INTERVAL_HOURS:-6}"
case "$interval" in
  ''|*[!0-9]*|0) echo "[backup-loop] WARN: BACKUP_INTERVAL_HOURS='$interval' ใช้ไม่ได้ (ต้องเป็นจำนวนเต็มชั่วโมง ≥ 1) — ใช้ 6" >&2; interval=6 ;;
esac
first_delay="${BACKUP_FIRST_DELAY_SECONDS:-30}"
case "$first_delay" in ''|*[!0-9]*) first_delay=30 ;; esac

export BACKUP_INTERVAL_HOURS="$interval"
export DUMP_VIA=direct
export OUT_DIR="${OUT_DIR:-backups}"
export IMAGES_DIR="${IMAGES_DIR:-public/images}"

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
