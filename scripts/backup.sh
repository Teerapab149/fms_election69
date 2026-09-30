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
# Produces, under ./backups/ (OUT_DIR):
#   db-YYYYmmdd-HHMMSS.sql.gz       (pg_dump)
#   images-YYYYmmdd-HHMMSS.tar.gz   (public/images — party/member photos; ทำใหม่เฉพาะเมื่อ
#                                    รูปเปลี่ยน หรือ archive ล่าสุดเก่าเกิน 24 ชม. — FORCE_IMAGES=1 บังคับทำ)
#   status/LAST_OK, status/LAST_FAIL (JSON บรรทัดเดียว ให้หน้าตรวจความพร้อมอ่าน — ไม่มีข้อมูลส่วนบุคคล)
# Keeps the latest RETENTION days; older files are pruned — but ONLY after this
# run's backup has been verified. See "ทำไมต้องตรวจก่อน prune" below.
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

DUMP_VIA="${DUMP_VIA:-docker}"
DB_CONTAINER="${DB_CONTAINER:-fms-election-db}"   # prod compose container name
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-fms_election}"
IMAGES_DIR="${IMAGES_DIR:-public/images}"
OUT_DIR="${OUT_DIR:-backups}"
STATUS_DIR="${STATUS_DIR:-$OUT_DIR/status}"
RETENTION="${RETENTION_DAYS:-14}"

ts="$(date +%Y%m%d-%H%M%S)"
raw=""
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
  if [ "$rc" -ne 0 ] && [ "$status_written" -eq 0 ]; then
    reason="${fail_reason:-สคริปต์หยุดกลางทาง (exit $rc)}"
    write_status LAST_FAIL "{\"at\":\"$(now_iso)\",\"run\":\"$ts\",\"stage\":\"dump\",\"reason\":\"$(json_str "$reason")\",\"interval_hours\":$interval_json}" \
      || echo "[backup $ts]   (บันทึก $STATUS_DIR/LAST_FAIL ไม่ได้ด้วย — ตรวจสิทธิ์โฟลเดอร์)" >&2
  fi
  exit "$rc"
}
trap on_exit EXIT
# dash ไม่รัน trap EXIT ตอนโดนสัญญาณ — แปลงเป็น exit ปกติ ไฟล์ .partial จึงถูกเก็บกวาดเสมอ
trap 'exit 130' INT
trap 'exit 143' TERM

mkdir -p "$OUT_DIR" 2>/dev/null || fail "สร้างโฟลเดอร์ $OUT_DIR ไม่ได้"
# โฟลเดอร์ที่ Docker สร้างให้เอง (bind mount ที่ยังไม่มีอยู่) เป็นของ root — service backup
# ที่รันด้วย uid ธรรมดาจะเขียนไม่ได้ และถ้าไม่เช็คตรงนี้ error ที่ได้จะไปโผล่เป็น "pg_dump ล้ม"
[ -w "$OUT_DIR" ] || fail "เขียนลงโฟลเดอร์ $OUT_DIR ไม่ได้ (ผู้ใช้ uid $(id -u)) — ให้เจ้าของโฟลเดอร์เป็นผู้ใช้ที่รัน backup เช่น chown -R \"\$(id -u):\$(id -g)\" backups"
if [ -d "$STATUS_DIR" ] && [ ! -w "$STATUS_DIR" ]; then
  fail "เขียนลงโฟลเดอร์ $STATUS_DIR ไม่ได้ (ผู้ใช้ uid $(id -u)) — หน้าตรวจความพร้อมจะไม่เห็นผล backup ให้แก้เจ้าของโฟลเดอร์ก่อน"
fi

# ── ต่อ DB แบบ direct: แปลง URL เป็นตัวแปร PG* ────────────────────────────────
# ไม่ส่ง URL ให้ pg_dump ตรง ๆ เพราะรหัสผ่านจะอยู่บน command line · และ URL ของ Prisma
# มักมี ?schema=public / connection_limit=… ที่ libpq ไม่รู้จักแล้วปฏิเสธทั้งบรรทัด จึงเก็บไว้
# แค่ sslmode (ความหมายเดียวกันทั้งสองฝั่ง) ที่เหลือทิ้ง
pct_decode() {
  # %XX → ไบต์ · LC_ALL=C ให้ awk พิมพ์เป็นไบต์ดิบ ไม่ใช่อักขระ Unicode
  printf '%s' "$1" | LC_ALL=C awk '
    BEGIN { hex = "0123456789abcdef" }
    { s = $0; out = ""
      while ((i = index(s, "%")) > 0) {
        h = tolower(substr(s, i + 1, 2))
        a = index(hex, substr(h, 1, 1)); b = index(hex, substr(h, 2, 1))
        if (length(h) == 2 && a > 0 && b > 0) {
          out = out substr(s, 1, i - 1) sprintf("%c", (a - 1) * 16 + (b - 1)); s = substr(s, i + 3)
        } else { out = out substr(s, 1, i); s = substr(s, i + 1) }
      }
      printf "%s", out s }'
}

use_url() {
  _url="$1"
  case "$_url" in
    postgres://*|postgresql://*) ;;
    *) fail "$2 ไม่ใช่ URL แบบ postgresql://…" ;;
  esac
  _rest="${_url#*://}"
  _query=""
  case "$_rest" in *\?*) _query="${_rest#*\?}"; _rest="${_rest%%\?*}" ;; esac
  _userinfo=""
  case "$_rest" in *@*) _userinfo="${_rest%@*}"; _rest="${_rest##*@}" ;; esac
  _db=""
  case "$_rest" in */*) _db="${_rest#*/}"; _rest="${_rest%%/*}" ;; esac
  _port=""
  case "$_rest" in
    \[*\]:*) _port="${_rest##*]:}"; _rest="${_rest%]:*}]" ;;
    \[*) ;;
    *:*) _port="${_rest##*:}"; _rest="${_rest%:*}" ;;
  esac
  _rest="${_rest#[}"; _rest="${_rest%]}"
  if [ -n "$_userinfo" ]; then
    case "$_userinfo" in
      *:*) PGUSER="$(pct_decode "${_userinfo%%:*}")"; PGPASSWORD="$(pct_decode "${_userinfo#*:}")"; export PGUSER PGPASSWORD ;;
      *) PGUSER="$(pct_decode "$_userinfo")"; export PGUSER ;;
    esac
  fi
  if [ -n "$_rest" ]; then PGHOST="$(pct_decode "$_rest")"; export PGHOST; fi
  if [ -n "$_port" ]; then PGPORT="$_port"; export PGPORT; fi
  if [ -n "$_db" ]; then PGDATABASE="$(pct_decode "$_db")"; export PGDATABASE; fi
  _old_ifs="$IFS"; IFS='&'; set -f
  for _kv in $_query; do
    case "$_kv" in sslmode=*) PGSSLMODE="${_kv#sslmode=}"; export PGSSLMODE ;; esac
  done
  set +f; IFS="$_old_ifs"
}

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
    tar -czf "$OUT_DIR/images-$ts.tar.gz" "$IMAGES_DIR" || fail "tar รูปภาพไม่สำเร็จ"
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
write_status LAST_OK "{\"at\":\"$(now_iso)\",\"run\":\"$ts\",\"file\":\"db-$ts.sql.gz\",\"tables\":${tables:-0},\"images\":$images_json,\"interval_hours\":$interval_json}" \
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
    write_status LAST_FAIL "{\"at\":\"$(now_iso)\",\"run\":\"$ts\",\"stage\":\"offsite\",\"reason\":\"$(json_str "BACKUP_AFTER_CMD ไม่สำเร็จ ($why)")\",\"interval_hours\":$interval_json}" \
      || echo "[backup $ts]   (บันทึก $STATUS_DIR/LAST_FAIL ไม่ได้ด้วย)" >&2
    status_written=1
    exit 2
  fi
fi
