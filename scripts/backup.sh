#!/usr/bin/env sh
# FMS Election — backup the DB + uploaded images.
#
# สองทางในการรัน (เลือกด้วย DUMP_VIA):
#   DUMP_VIA=docker (ค่าเริ่มต้น เหมือนเดิมทุกอย่าง) — รันบนโฮสต์ที่ docker compose รันอยู่
#       sh scripts/backup.sh
#     dump ผ่าน `docker exec <DB_CONTAINER> pg_dump` ใช้ได้กับ DB ที่มากับ compose เท่านั้น
#   DUMP_VIA=direct — เรียก pg_dump ตรงจากที่ที่สคริปต์รัน (service `backup` ใน
#     docker-compose.yml ใช้ทางนี้ทุก BACKUP_INTERVAL_HOURS ชั่วโมง และใช้กับ DB ของคณะได้)
#       DUMP_VIA=direct PGHOST=… PGUSER=… PGDATABASE=… sh scripts/backup.sh
#     ข้อมูลการต่อ DB อ่านตามลำดับ: BACKUP_DATABASE_URL → PGHOST/PGUSER/PGDATABASE/PGPASSWORD
#     (หรือ ~/.pgpass) → DATABASE_URL · รหัสผ่านส่งทาง environment เท่านั้น ไม่อยู่บน
#     command line ของ pg_dump (คำสั่งบนเครื่องเดียวกันเห็น command line กันได้หมดผ่าน ps)
#
# รันบนโฮสต์ที่ไม่ใช้ Docker (cron / systemd timer / pm2) — สคริปต์นี้ตัวเดียวทำงานทุกแบบ
# ต่างกันแค่ใครเป็นคนเรียก · ตัวอย่างพร้อมใช้อยู่ใน deploy/backup/ (อ่าน README.md ในนั้น)
#   BACKUP_APP_DIR   โฟลเดอร์ของแอป (ถ้ามี สคริปต์ cd ไปที่นั่นก่อน — path ทุกตัวด้านล่างเทียบจากที่นี่)
#   BACKUP_ENV_FILE  ไฟล์ KEY='value' เก็บ BACKUP_DATABASE_URL ฯลฯ (0600) — ดู scripts/lib/backup-env.sh
#   BACKUP_RUNNER    ชื่อตัวรัน (cron|systemd|pm2|docker) เขียนลง LAST_OK/LAST_FAIL ให้หน้าตรวจ
#                    ความพร้อมบอกได้ว่าต้องไปดู log ที่ไหน · ไม่ตั้ง = เดาเอา (docker ถ้าอยู่ในคอนเทนเนอร์)
#   UPLOAD_ROOT      ถ้ารูปอัปโหลดอยู่นอก public/images: อ่านจาก environment หรือจาก .env ของแอป
#                    (เฉพาะ DUMP_VIA=direct นอกคอนเทนเนอร์) แล้ว archive รูปจากที่นั่น โดยใน tar
#                    ยังเป็น path public/images/ เสมอ — restore.sh ตรวจแบบนั้น
#
# Produces, under ./backups/ (OUT_DIR):
#   db-YYYYmmdd-HHMMSS.sql.gz       (pg_dump)
#   images-YYYYmmdd-HHMMSS.tar.gz   (public/images — party/member photos; ทำใหม่เฉพาะเมื่อ
#                                    รูปเปลี่ยน หรือ archive ล่าสุดเก่าเกิน 24 ชม. — FORCE_IMAGES=1 บังคับทำ)
#   status/LAST_OK, status/LAST_FAIL (JSON บรรทัดเดียว ให้หน้าตรวจความพร้อมอ่าน — ไม่มีข้อมูลส่วนบุคคล)
# Keeps the latest RETENTION days; older files are pruned — but ONLY after this
# run's backup has been verified. See "ทำไมต้องตรวจก่อน prune" below.
#
# ตรวจเนื้อ dump ก่อน gzip (แก้ 2026-10-01 — ซ้อม restore แล้วเจอ: DROP "Ballot" ทิ้ง รอบถัดไป
# ยัง dump 8 ตารางแล้วเขียน LAST_OK หน้าตรวจความพร้อมขึ้นเขียว) · ไม่ผ่านข้อใด = LAST_FAIL
# stage dump ไม่มีไฟล์ db-*.sql.gz ใหม่ และไม่ prune:
#   1. มีตารางหลักครบ (ESSENTIAL_TABLES ด้านล่าง)
#   2. กล่องบัตรสอดคล้องกับโซ่: ChainHead มี 1 แถว และจำนวนแถว Ballot = ChainHead.seq
#   3. จำนวนตารางไม่ลดลงจาก LAST_OK รอบก่อน — ยกเว้นจำนวน migration เปลี่ยน (แก้ schema โดยตั้งใจ)
#      ตั้งใจลบตารางโดยไม่มี migration จริง ๆ → `sudo rm backups/status/LAST_OK` แล้วรันใหม่
#
# Optional BACKUP_AFTER_CMD (host cron เท่านั้น): คำสั่งที่รันหลัง backup ผ่านการตรวจแล้ว
# เช่นคัดลอกออกนอกเครื่อง `rclone copy backups remote:fms-backup` · จำกัดเวลาด้วย
# BACKUP_AFTER_TIMEOUT วินาที (ค่าเริ่มต้น 1800) · ล้มเหลว = บันทึก LAST_FAIL stage "offsite"
# และจบด้วย exit 2 แต่ไม่ลบอะไรเลย backup ในเครื่องรอบนี้ยังใช้ได้
#
# ⚠️ A backup you have never restored is not a backup. Rehearse scripts/restore.sh
#    against a throwaway target at least once BEFORE election day.
#
# ── ทำไมต้องตรวจก่อน prune (แก้ 2026-09-05) ──────────────────────────────────
#
# ของเดิมเขียนว่า:
#     docker exec ... pg_dump ... | gzip > out.sql.gz
#
# ใน POSIX sh สถานะจบของ pipeline คือสถานะของ **คำสั่งสุดท้าย** ซึ่งคือ gzip
# ถ้า pg_dump ล้ม (คอนเทนเนอร์ไม่ได้รัน / ชื่อ DB ผิด / สิทธิ์ไม่พอ) gzip ก็ยัง "สำเร็จ"
# เพราะมันบีบอัดข้อความว่างเปล่าได้สบาย ๆ · `set -e` จึงไม่จับอะไรเลย สคริปต์เดินต่อ
# ไปจนถึงขั้น prune แล้ว **ลบ backup เก่าที่ยังดีอยู่ทิ้ง** เหลือไว้แต่ไฟล์เปล่าที่กู้อะไรไม่ได้
# นี่คือความล้มเหลวที่แย่ที่สุดเท่าที่สคริปต์สำรองข้อมูลจะทำได้ — มันทำลายของที่ควรปกป้อง
#
# ทำไมไม่ใช้ `set -o pipefail`: มันไม่ใช่ POSIX · บน Debian/Ubuntu `sh` คือ dash ซึ่ง
# ไม่มีตัวเลือกนี้ และสคริปต์นี้ถูกเรียกด้วย `sh scripts/backup.sh` (ตามตัวอย่าง cron
# ด้านบนและใน runbook) ซึ่งทำให้บรรทัด shebang ไม่มีผลเลย จะเปลี่ยนไปใช้ bash ก็ไม่ช่วย
# วิธีที่ทำงานได้ทุกเชลล์คือ dump ลงไฟล์ชั่วคราวก่อน แล้วเช็คสถานะของ pg_dump ตรง ๆ
set -eu

# dump มีชื่อ รหัสนักศึกษา สาขา และใครลงคะแนนแล้ว — ค่า umask ปกติ (022) ทำให้ผู้ใช้ทุกคน
# บนเครื่องอ่านไฟล์ได้ · 077 = เจ้าของอ่านได้คนเดียว (ไฟล์ 0600) ไฟล์สถานะเท่านั้นที่ถูก chmod
# ให้อ่านได้ทั่วไปทีหลัง เพราะเว็บ (ผู้ใช้คนละ uid) ต้องอ่าน และในนั้นไม่มีข้อมูลส่วนบุคคล
umask 077

# ── เตรียมบนโฮสต์: ไปโฟลเดอร์แอป + โหลดไฟล์ env ──────────────────────────────────
# ยังไม่ fail ตรงนี้: fail() ต้องใช้ตัวแปรและ trap ด้านล่าง (ไม่งั้น LAST_FAIL ไม่ถูกเขียน
# และหน้าตรวจความพร้อมไม่เห็นว่า cron ที่ตั้งไว้พัง) จึงจำสาเหตุไว้แล้วค่อย fail ทีหลัง
boot_err=""
script_dir="$(cd "$(dirname "$0")" 2>/dev/null && pwd)" || script_dir=""
if [ -n "${BACKUP_APP_DIR:-}" ]; then
  # ล้มตรงนี้จบทันทีโดยไม่เขียน LAST_FAIL: ไม่รู้ว่าโฟลเดอร์แอปอยู่ที่ไหน สถานะจะไปตกในโฟลเดอร์
  # แปลก ๆ (cwd ของ cron คือ $HOME) ที่เว็บไม่มีวันอ่านอยู่ดี — ผู้ตั้ง cron เห็นใน log ของ cron
  cd "$BACKUP_APP_DIR" 2>/dev/null || { echo "[backup] ✗ เข้าโฟลเดอร์ BACKUP_APP_DIR ($BACKUP_APP_DIR) ไม่ได้" >&2; exit 1; }
fi
env_err=""
if [ -z "$boot_err" ] && [ -n "$script_dir" ] && [ -f "$script_dir/lib/backup-env.sh" ]; then
  . "$script_dir/lib/backup-env.sh"
  load_backup_env
  boot_err="$env_err"
fi

DUMP_VIA="${DUMP_VIA:-docker}"
DB_CONTAINER="${DB_CONTAINER:-fms-election-db}"   # prod compose container name
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-fms_election}"
OUT_DIR="${OUT_DIR:-backups}"
STATUS_DIR="${STATUS_DIR:-$OUT_DIR/status}"
RETENTION="${RETENTION_DAYS:-14}"

# ตัวรัน: ใช้ตัดสินใจเรื่องที่ต่างกันระหว่างคอนเทนเนอร์กับโฮสต์ และบอกหน้าตรวจความพร้อมว่า
# log อยู่ที่ไหน · จำกัดอักขระเพราะค่านี้ลงไปใน JSON
in_container=0
if [ -f /.dockerenv ] || [ -f /run/.containerenv ]; then in_container=1; fi
runner="${BACKUP_RUNNER:-}"
if [ -z "$runner" ]; then
  if [ "$in_container" -eq 1 ]; then runner=docker; else runner=manual; fi
fi
runner="$(printf '%s' "$runner" | tr -cd 'A-Za-z0-9_-' | cut -c1-20)"
[ -n "$runner" ] || runner=manual

# โฟลเดอร์รูป: ถ้าไม่ได้ระบุ IMAGES_DIR ตรง ๆ ให้ดู UPLOAD_ROOT (ที่ที่แอปเก็บรูปอัปโหลดจริง ดู
# src/lib/media/storage.js) ก่อนใช้ public/images · อ่าน .env ของแอปเฉพาะบนโฮสต์ที่ dump ตรง:
# ใน compose แบบเดิม (DUMP_VIA=docker หรือในคอนเทนเนอร์) UPLOAD_ROOT ใน .env เป็น path ของ
# คอนเทนเนอร์เว็บ ซึ่งบนโฮสต์ไม่มีอยู่จริง — อ่านมาใช้จะทำให้ archive รูปหายเงียบ ๆ
IMAGES_DIR="${IMAGES_DIR:-}"
if [ -z "$IMAGES_DIR" ]; then
  upload_root="${UPLOAD_ROOT:-}"
  if [ -z "$upload_root" ] && [ "$DUMP_VIA" = direct ] && [ "$in_container" -eq 0 ] && [ -f .env ]; then
    upload_root="$(sed -n 's/^[[:space:]]*UPLOAD_ROOT=//p' .env | tail -n 1 | tr -d '\r')"
    case "$upload_root" in
      \"*\") upload_root="${upload_root#\"}"; upload_root="${upload_root%\"}" ;;
      \'*\') upload_root="${upload_root#\'}"; upload_root="${upload_root%\'}" ;;
      *) upload_root="$(printf '%s' "$upload_root" | sed 's/[[:space:]][[:space:]]*#.*$//; s/[[:space:]]*$//')" ;;
    esac
  fi
  IMAGES_DIR="${upload_root:-public/images}"
fi

ts="$(date +%Y%m%d-%H%M%S)"
raw=""
stage=""
fail_reason=""
status_written=0

# รอบห่างที่ตั้งไว้ (service backup ส่งมา) — เขียนลง LAST_OK ให้หน้าตรวจความพร้อมรู้ว่า
# "เก่าเกินไป" คือเท่าไร เพราะเว็บไม่รู้ค่านี้เอง · รันมือ/cron ไม่ได้ตั้ง = null → เว็บถือ 24 ชม.
case "${BACKUP_INTERVAL_HOURS:-}" in
  ''|*[!0-9]*) interval_json=null ;;
  *) interval_json="$BACKUP_INTERVAL_HOURS" ;;
esac

json_str() {
  # ข้อความ → เนื้อใน JSON string (escape \ กับ " และตัดอักขระควบคุมทิ้ง)
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' | tr -d '\000-\037'
}

write_status() {
  # $1 = LAST_OK | LAST_FAIL, $2 = JSON หนึ่งบรรทัด
  # เขียนไฟล์ชั่วคราวแล้ว mv ทับ — rename ในโฟลเดอร์เดียวกันเป็น atomic เว็บจึงไม่มีทาง
  # อ่านเจอไฟล์ที่เขียนไปครึ่งเดียว
  mkdir -p "$STATUS_DIR" 2>/dev/null || return 1
  chmod 755 "$STATUS_DIR" 2>/dev/null || true
  # บนโฮสต์ web ไม่ได้ mount แค่ status/ เหมือนใน compose — มันอ่าน backups/status/ ตาม path จริง
  # แต่ umask 077 ทำให้ backups/ ที่สคริปต์สร้างเป็น 0700 (คนอื่นผ่านเข้าไปไม่ได้) หน้าตรวจความพร้อม
  # จึงอ่านไฟล์สถานะไม่ได้ทั้งที่ backup สำเร็จ · เปิดให้ "ผ่านได้" (o+x) อย่างเดียว ไม่เปิดให้ list:
  # ตัว dump ยังเป็น 0600 ของเจ้าของ · แตะเฉพาะเมื่อ status/ อยู่ใต้ backups/ และคนอื่นยังผ่านไม่ได้
  if [ "$STATUS_DIR" = "$OUT_DIR/status" ]; then
    case "$(ls -ld "$OUT_DIR" 2>/dev/null | cut -c10)" in
      x|t|s) ;;
      *) chmod o+x "$OUT_DIR" 2>/dev/null || true ;;
    esac
  fi
  _tmp="$STATUS_DIR/.$1.tmp.$$"
  if printf '%s\n' "$2" > "$_tmp" 2>/dev/null && chmod 644 "$_tmp" && mv -f "$_tmp" "$STATUS_DIR/$1"; then
    status_written=1
    return 0
  fi
  rm -f "$_tmp" 2>/dev/null || true
  return 1
}

now_iso() { date -u +%Y-%m-%dT%H:%M:%SZ; }

fail() {
  fail_reason="$1"
  echo "[backup $ts] ✗ ล้มเหลว: $1" >&2
  echo "[backup $ts]   ไม่ได้ลบ backup เก่าออกเลย ของเดิมยังอยู่ครบ" >&2
  exit 1
}

# ทุกทางที่จบแบบไม่สำเร็จผ่านตรงนี้ — ทั้ง fail() และคำสั่งที่ `set -e` จับได้เอง — จึงไม่มี
# ความล้มเหลวแบบเงียบที่ไม่ทิ้ง LAST_FAIL ไว้ให้หน้าตรวจความพร้อมเห็น
on_exit() {
  rc=$?
  if [ -n "$raw" ]; then rm -f "$raw"; fi
  # โฟลเดอร์จัดฉากของ tar รูป (มีแต่ symlink) — เช็คชื่อก่อน rm -rf เผื่อตัวแปรเพี้ยน
  case "$stage" in */fms-backup-stage.*) rm -rf "$stage" ;; esac
  if [ "$rc" -ne 0 ] && [ "$status_written" -eq 0 ]; then
    reason="${fail_reason:-สคริปต์หยุดกลางทาง (exit $rc)}"
    write_status LAST_FAIL "{\"at\":\"$(now_iso)\",\"run\":\"$ts\",\"stage\":\"dump\",\"reason\":\"$(json_str "$reason")\",\"runner\":\"$runner\",\"interval_hours\":$interval_json}" \
      || echo "[backup $ts]   (บันทึก $STATUS_DIR/LAST_FAIL ไม่ได้ด้วย — ตรวจสิทธิ์โฟลเดอร์)" >&2
  fi
  exit "$rc"
}
trap on_exit EXIT
# dash ไม่รัน trap EXIT ตอนโดนสัญญาณ — แปลงเป็น exit ปกติ ไฟล์ .partial จึงถูกเก็บกวาดเสมอ
trap 'exit 130' INT
trap 'exit 143' TERM

[ -z "$boot_err" ] || fail "$boot_err"

mkdir -p "$OUT_DIR" 2>/dev/null || fail "สร้างโฟลเดอร์ $OUT_DIR ไม่ได้"
# โฟลเดอร์ที่ Docker สร้างให้เอง (bind mount ที่ยังไม่มีอยู่) เป็นของ root — service backup
# ที่รันด้วย uid ธรรมดาจะเขียนไม่ได้ และถ้าไม่เช็คตรงนี้ error ที่ได้จะไปโผล่เป็น "pg_dump ล้ม"
[ -w "$OUT_DIR" ] || fail "เขียนลงโฟลเดอร์ $OUT_DIR ไม่ได้ (ผู้ใช้ uid $(id -u)) — ให้เจ้าของโฟลเดอร์เป็นผู้ใช้ที่รัน backup เช่น chown -R \"\$(id -u):\$(id -g)\" backups"
if [ -d "$STATUS_DIR" ] && [ ! -w "$STATUS_DIR" ]; then
  fail "เขียนลงโฟลเดอร์ $STATUS_DIR ไม่ได้ (ผู้ใช้ uid $(id -u)) — หน้าตรวจความพร้อมจะไม่เห็นผล backup ให้แก้เจ้าของโฟลเดอร์ก่อน"
fi

# ── ต่อ DB แบบ direct: แปลง URL เป็นตัวแปร PG* (use_url / pct_decode อยู่ใน scripts/lib/pgurl.sh) ──
# เหตุผลที่ไม่ส่ง URL ให้ pg_dump ตรง ๆ อยู่ในไฟล์นั้น
if [ -n "$script_dir" ] && [ -f "$script_dir/lib/pgurl.sh" ]; then
  . "$script_dir/lib/pgurl.sh"
else
  fail "ไม่พบ scripts/lib/pgurl.sh (สคริปต์นี้ต้องอยู่กับโฟลเดอร์ lib/ ในโปรเจกต์)"
fi

case "$DUMP_VIA" in
  docker)
    # ตรวจก่อนว่าคอนเทนเนอร์ฐานข้อมูลมีจริงและกำลังรัน — ถ้าไม่เช็ค ข้อความผิดพลาดที่ได้
    # จะเป็นของ docker ซึ่งอ่านไม่ออกว่าเกิดอะไรขึ้น
    docker inspect -f '{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null | grep -q true \
      || fail "ไม่พบคอนเทนเนอร์ '$DB_CONTAINER' ที่กำลังรัน (ตั้งชื่ออื่นได้ด้วย DB_CONTAINER=...)"
    ;;
  direct)
    command -v pg_dump >/dev/null 2>&1 || fail "ไม่พบคำสั่ง pg_dump บนเครื่องนี้ (DUMP_VIA=direct ต้องมี PostgreSQL client รุ่นหลักไม่ต่ำกว่าเซิร์ฟเวอร์)"
    if [ -n "${BACKUP_DATABASE_URL:-}" ]; then
      use_url "$BACKUP_DATABASE_URL" BACKUP_DATABASE_URL
    elif [ -n "${PGHOST:-}${PGDATABASE:-}${PGSERVICE:-}" ]; then
      :   # ใช้ PG* ตามที่ตั้งมา (service backup ตั้งไว้ใน compose)
    elif [ -n "${DATABASE_URL:-}" ]; then
      use_url "$DATABASE_URL" DATABASE_URL
    else
      fail "DUMP_VIA=direct แต่ไม่ได้บอกว่าจะต่อ DB ไหน — ตั้ง PGHOST/PGUSER/PGDATABASE หรือ BACKUP_DATABASE_URL"
    fi
    ;;
  *) fail "DUMP_VIA ต้องเป็น docker หรือ direct (ได้ '$DUMP_VIA')" ;;
esac

raw="$OUT_DIR/.db-$ts.sql.partial"
gz="$OUT_DIR/db-$ts.sql.gz"

# ไม่ใช้ pipeline: เขียนลงไฟล์ก่อน แล้วสถานะจบที่ได้คือของ pg_dump จริง ๆ
if [ "$DUMP_VIA" = docker ]; then
  echo "[backup $ts] dumping DB from container '$DB_CONTAINER'…"
  docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$raw" \
    || fail "pg_dump ไม่สำเร็จ (ดูข้อความข้างบน)"
else
  echo "[backup $ts] dumping DB '${PGDATABASE:-?}' on '${PGHOST:-local socket}' as '${PGUSER:-?}' (direct)…"
  # --no-password: ไม่มีคนนั่งพิมพ์รหัสให้ใน cron/service — ขาดรหัสต้องล้มทันที ไม่ใช่ค้างรอ
  pg_dump --no-password > "$raw" \
    || fail "pg_dump ไม่สำเร็จ (ดูข้อความข้างบน — รหัสผ่าน/ชื่อเครื่อง/รุ่น pg_dump ต่ำกว่าเซิร์ฟเวอร์)"
fi

# ถึงจะ exit 0 ก็ยังต้องดูของจริง: dump ที่ใช้ได้ต้องมีหัวไฟล์ของ pg_dump และมีคำสั่ง
# สร้างตารางอยู่ · ไฟล์ว่างหรือไฟล์ที่มีแต่ error message จะไม่ผ่านสองด่านนี้
[ -s "$raw" ] || fail "ไฟล์ dump ว่างเปล่า"
grep -q 'PostgreSQL database dump' "$raw" || fail "ไฟล์ dump ไม่มีหัวไฟล์ของ pg_dump — น่าจะไม่ใช่ dump จริง"
grep -q 'CREATE TABLE' "$raw" || fail "ไฟล์ dump ไม่มีคำสั่ง CREATE TABLE สักบรรทัด — ฐานข้อมูลว่างหรือ dump ไม่ครบ"

tables="$(grep -c '^CREATE TABLE' "$raw" || true)"
echo "[backup $ts]   dump มี $tables ตาราง"

# ── ตรวจเนื้อ dump ก่อน gzip: DB ที่เสียต้องไม่มีวันกลายเป็น db-*.sql.gz ─────────────
# dump ที่ "ถูกรูปแบบ" ไม่ได้แปลว่า "ข้อมูลครบ" — pg_dump ของ DB ที่ตารางหายไปก็สำเร็จสวยงาม
#
# ตารางหลัก = ทุกตารางใน prisma/migrations + _prisma_migrations
# ⚠️ รายชื่อนี้ต้องตรงกับ ESSENTIAL_TABLES ใน scripts/restore.sh — เพิ่ม model ใหม่ให้แก้ทั้งสองไฟล์
#    กติกา schema ต่างกันโดยตั้งใจ: ที่นี่รับ schema ใดก็ได้ เพราะ use_url ทิ้ง ?schema= ของ URL ไป
#    สคริปต์จึงไม่รู้ว่าแอปใช้ schema ไหน · restore.sh บังคับ public เพราะมันล้างและโหลดลง public
ESSENTIAL_TABLES="User Candidate Member Ballot ChainHead SystemConfig Template AdminAuditLog _prisma_migrations"
create_lines="$(grep '^CREATE TABLE ' "$raw" || true)"
missing=""
for t in $ESSENTIAL_TABLES; do
  # รับทั้งชื่อมี/ไม่มีเครื่องหมายคำพูด และ schema ใดก็ได้ (public."User", public._prisma_migrations)
  printf '%s\n' "$create_lines" | grep -Eq "^CREATE TABLE ([a-z0-9_]+|\"[^\"]+\")\.(\"$t\"|$t) \(" \
    || missing="$missing $t"
done
# ข้อความสั้นโดยตั้งใจ — หน้าตรวจความพร้อมตัด reason ที่ 200 ตัวอักษร
[ -z "$missing" ] || fail "dump ไม่มีตารางหลัก:$missing"

# กล่องบัตร ↔ โซ่: ทุกบัตรเพิ่ม ChainHead.seq ทีละ 1 ใน transaction เดียวกัน
# (src/lib/ballotChain.js:52-61) และ annual-reset ล้างทั้งคู่พร้อมกัน (scripts/sql/annual-reset.sql:23-25)
# pg_dump อ่านจาก snapshot เดียว ตัวเลขสองตัวจึงต้องเท่ากันเสมอ · ไม่เท่า = บัตรถูกลบ/เพิ่มนอกระบบ
# อ่านไฟล์รอบเดียว: นับแถวในบล็อก COPY ของ Ballot / ChainHead / _prisma_migrations
# หาตำแหน่งคอลัมน์ seq จากหัว COPY ไม่ fix เลข เผื่อ migration เพิ่มคอลัมน์
copy_stats="$(LC_ALL=C awk '
  BEGIN { inblk = 0; blk = ""; b = 0; h = 0; m = 0; hseq = ""; seqcol = 0; sb = 0; sh = 0; sm = 0 }
  inblk {
    if ($0 == "\\.") { inblk = 0; blk = ""; next }
    if (blk == "b") b++
    else if (blk == "m") m++
    else if (blk == "h") { h++; if (seqcol > 0) { split($0, f, "\t"); hseq = f[seqcol] } }
    next
  }
  /^COPY [^ ]+ \(.*\) FROM stdin;$/ {
    inblk = 1; name = $2; sub(/^.*\./, "", name); gsub(/"/, "", name)
    blk = ""
    if (name == "Ballot") { blk = "b"; sb = 1 }
    else if (name == "_prisma_migrations") { blk = "m"; sm = 1 }
    else if (name == "ChainHead") {
      blk = "h"; sh = 1
      cols = $0; sub(/^COPY [^(]*\(/, "", cols); sub(/\) FROM stdin;$/, "", cols)
      n = split(cols, a, ", ")
      for (i = 1; i <= n; i++) { c = a[i]; gsub(/"/, "", c); if (c == "seq") seqcol = i }
    }
  }
  END { printf "%d %d %d %d %d %d %s\n", sb, sh, sm, b, h, m, (hseq == "" ? "-" : hseq) }
' "$raw")" || fail "อ่านบล็อกข้อมูลใน dump ไม่ได้ (awk ล้ม)"
set -- $copy_stats
seen_ballot=$1; seen_head=$2; seen_mig=$3; ballots=$4; head_rows=$5; migrations=$6; head_seq=$7
[ "$seen_ballot" = 1 ] && [ "$seen_head" = 1 ] && [ "$seen_mig" = 1 ] \
  || fail "dump ไม่มีข้อมูล (COPY) ของ Ballot/ChainHead/_prisma_migrations — น่าจะเป็น dump แบบ schema-only"
[ "$head_rows" = 1 ] || fail "ChainHead ต้องมี 1 แถว แต่ใน dump มี $head_rows แถว"
case "$head_seq" in ''|*[!0-9]*) fail "อ่านค่า ChainHead.seq ใน dump ไม่ได้ (ได้ '$head_seq')" ;; esac
[ "$ballots" -eq "$head_seq" ] \
  || fail "บัตรใน Ballot ($ballots แถว) ไม่เท่ากับ ChainHead.seq ($head_seq) — กล่องบัตรถูกแก้นอกระบบ"
echo "[backup $ts]   ✓ ตารางหลักครบ · บัตร $ballots ใบ = ChainHead.seq · migration $migrations รายการ"

# จำนวนตารางลดลงจากรอบก่อน = มีตารางหาย (ตารางหลักข้างบนจับได้แค่ที่รู้ชื่อล่วงหน้า)
# ยกเว้นเมื่อจำนวน migration เปลี่ยน = แก้ schema โดยตั้งใจ (migration ลบ/รวมตาราง)
# LAST_OK รุ่นก่อนไม่มีช่อง migrations → ข้ามข้อนี้ไปหนึ่งรอบ · ไม่มี LAST_OK เลย (รอบแรก) → ข้าม
prev_ok="$(cat "$STATUS_DIR/LAST_OK" 2>/dev/null || true)"
prev_tables="$(printf '%s' "$prev_ok" | sed -n 's/.*"tables":\([0-9][0-9]*\).*/\1/p')"
prev_migrations="$(printf '%s' "$prev_ok" | sed -n 's/.*"migrations":\([0-9][0-9]*\).*/\1/p')"
if [ -n "$prev_tables" ] && [ -n "$prev_migrations" ] \
   && [ "$tables" -lt "$prev_tables" ] && [ "$migrations" -eq "$prev_migrations" ]; then
  fail "ตารางลดจาก $prev_tables เหลือ $tables ทั้งที่ migration เท่าเดิม — ถ้าตั้งใจลบตารางจริง: sudo rm backups/status/LAST_OK แล้วรันใหม่"
fi

gzip -c "$raw" > "$gz" || fail "gzip ไม่สำเร็จ"
gzip -t "$gz" || fail "ไฟล์ .gz ที่ได้เสียหาย (gzip -t ไม่ผ่าน)"

# ── รูปภาพ: ทำ archive ใหม่เฉพาะเมื่อจำเป็น ─────────────────────────────────────
# service backup รันทุกไม่กี่ชั่วโมง ถ้า tar รูปทั้งโฟลเดอร์ทุกรอบ ดิสก์จะเต็มด้วยสำเนารูปชุด
# เดิมซ้ำ ๆ · ทำใหม่เมื่อ (ก) ยังไม่มี archive ที่อายุไม่ถึง 24 ชม. หรือ (ข) มีไฟล์/โฟลเดอร์
# ใต้ IMAGES_DIR ใหม่กว่า archive ล่าสุด (โฟลเดอร์เปลี่ยน mtime เมื่อมีไฟล์เพิ่ม/ลบด้วย)
# ถ้าไม่ต้องทำ archive ล่าสุดคือคู่ของ dump รอบนี้ — เนื้อหาเหมือนกันทุกไบต์
images_file=""
if [ -d "$IMAGES_DIR" ]; then
  latest_img="$(ls -1 "$OUT_DIR"/images-*.tar.gz 2>/dev/null | tail -n 1 || true)"
  need_images=0
  if [ "${FORCE_IMAGES:-0}" = 1 ] || [ -z "$latest_img" ]; then
    need_images=1
  elif [ -z "$(find "$latest_img" -mtime -1 2>/dev/null)" ]; then
    need_images=1
  elif [ -n "$(find "$IMAGES_DIR" -newer "$latest_img" 2>/dev/null | head -n 1)" ]; then
    need_images=1
  fi
  if [ "$need_images" -eq 1 ]; then
    echo "[backup $ts] archiving $IMAGES_DIR…"
    if [ "$IMAGES_DIR" = public/images ]; then
      tar -czf "$OUT_DIR/images-$ts.tar.gz" "$IMAGES_DIR" || fail "tar รูปภาพไม่สำเร็จ"
    else
      # รูปอยู่นอก public/images (UPLOAD_ROOT) แต่ restore.sh ตรวจว่า archive ขึ้นต้นด้วย
      # public/images/ — จึงสร้างโฟลเดอร์จัดฉากที่มี public/images เป็น symlink ไปที่จริง แล้ว tar
      # แบบตาม symlink (-h) · ไม่ใช้ --transform เพราะเป็นของ GNU tar เท่านั้น (busybox/bsdtar ไม่มี)
      case "$IMAGES_DIR" in /*) img_abs="$IMAGES_DIR" ;; *) img_abs="$(pwd)/$IMAGES_DIR" ;; esac
      stage="$(mktemp -d "${TMPDIR:-/tmp}/fms-backup-stage.XXXXXX")" || fail "สร้างโฟลเดอร์ชั่วคราวสำหรับ tar รูปไม่ได้"
      mkdir "$stage/public" && ln -s "$img_abs" "$stage/public/images" || fail "จัดฉาก tar รูปไม่สำเร็จ"
      tar -czhf "$OUT_DIR/images-$ts.tar.gz" -C "$stage" public/images || fail "tar รูปภาพจาก $IMAGES_DIR ไม่สำเร็จ"
    fi
    # ตรวจว่าอ่านกลับได้จริง ไม่ใช่แค่เขียนไฟล์ออกมาได้
    tar -tzf "$OUT_DIR/images-$ts.tar.gz" >/dev/null || fail "ไฟล์ tar รูปภาพเสียหาย (อ่านกลับไม่ได้)"
    images_file="images-$ts.tar.gz"
  else
    images_file="$(basename "$latest_img")"
    echo "[backup $ts] รูปไม่เปลี่ยนตั้งแต่ $images_file — ใช้ archive นั้นคู่กับ dump รอบนี้"
  fi
else
  echo "[backup $ts] WARN: $IMAGES_DIR not found — skipping images"
fi

# ── prune ทำที่นี่เท่านั้น: หลังจากรู้แล้วว่า backup รอบนี้ใช้ได้จริง ────────────────
# ทุก fail ด้านบนออกจากสคริปต์ไปก่อนถึงบรรทัดนี้ ของเก่าจึงไม่มีวันถูกลบเพราะรอบนี้พัง
echo "[backup $ts] pruning backups older than $RETENTION days…"
find "$OUT_DIR" -name 'db-*.sql.gz'     -mtime +"$RETENTION" -delete 2>/dev/null || true
find "$OUT_DIR" -name 'images-*.tar.gz' -mtime +"$RETENTION" -delete 2>/dev/null || true
# ไฟล์ครึ่งทางจากรอบที่ถูก kill -9 (trap ไม่ได้รัน) — ทิ้งไว้จะกินดิสก์เงียบ ๆ
find "$OUT_DIR" -name '.db-*.sql.partial' -mtime +1 -delete 2>/dev/null || true

if [ -n "$images_file" ]; then images_json="\"$images_file\""; else images_json=null; fi
write_status LAST_OK "{\"at\":\"$(now_iso)\",\"run\":\"$ts\",\"file\":\"db-$ts.sql.gz\",\"tables\":${tables:-0},\"migrations\":${migrations:-0},\"images\":$images_json,\"runner\":\"$runner\",\"interval_hours\":$interval_json}" \
  || echo "[backup $ts] WARN: บันทึก $STATUS_DIR/LAST_OK ไม่ได้ — backup ใช้ได้ แต่หน้าตรวจความพร้อมจะไม่เห็นรอบนี้" >&2

echo "[backup $ts] ✓ เสร็จเรียบร้อย ตรวจไฟล์แล้วว่าใช้ได้:"
if [ -n "$images_file" ]; then
  ls -lh "$gz" "$OUT_DIR/$images_file"
else
  ls -lh "$gz"
fi

# ── สำเนานอกเครื่อง (ถ้าตั้งไว้) ─────────────────────────────────────────────
# backup ในดิสก์เดียวกับฐานข้อมูลไม่รอดถ้าดิสก์หรือเครื่องหาย · ล้มตรงนี้ไม่ย้อนไปลบอะไร
# และไม่ทำให้ backup รอบนี้กลายเป็น "ใช้ไม่ได้" — แค่ต้องรู้ จึงบันทึกแยก stage
if [ -n "${BACKUP_AFTER_CMD:-}" ]; then
  after_timeout="${BACKUP_AFTER_TIMEOUT:-1800}"
  echo "[backup $ts] off-machine copy: running BACKUP_AFTER_CMD (timeout ${after_timeout}s)…"
  if command -v timeout >/dev/null 2>&1; then
    set -- timeout "$after_timeout" sh -c "$BACKUP_AFTER_CMD"
  else
    echo "[backup $ts] WARN: ไม่มีคำสั่ง timeout บนเครื่องนี้ — รันโดยไม่จำกัดเวลา" >&2
    set -- sh -c "$BACKUP_AFTER_CMD"
  fi
  if "$@"; then
    echo "[backup $ts] ✓ คัดลอกออกนอกเครื่องเสร็จ"
  else
    after_rc=$?
    if [ "$after_rc" -eq 124 ]; then why="เกินเวลา ${after_timeout} วินาที"; else why="exit $after_rc"; fi
    echo "[backup $ts] ✗✗ คัดลอกออกนอกเครื่องไม่สำเร็จ ($why) — backup ในเครื่องรอบนี้ยังใช้ได้ แต่ยังไม่มีสำเนานอกเครื่อง" >&2
    status_written=0
    write_status LAST_FAIL "{\"at\":\"$(now_iso)\",\"run\":\"$ts\",\"stage\":\"offsite\",\"reason\":\"$(json_str "BACKUP_AFTER_CMD ไม่สำเร็จ ($why)")\",\"runner\":\"$runner\",\"interval_hours\":$interval_json}" \
      || echo "[backup $ts]   (บันทึก $STATUS_DIR/LAST_FAIL ไม่ได้ด้วย)" >&2
    status_written=1
    exit 2
  fi
fi
