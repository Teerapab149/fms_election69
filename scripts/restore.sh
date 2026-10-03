#!/usr/bin/env sh
# FMS Election — restore DB + images from a backup made by scripts/backup.sh.
# Run on the server. Usage:
#   sh scripts/restore.sh backups/db-YYYYmmdd-HHMMSS.sql.gz [backups/images-YYYYmmdd-HHMMSS.tar.gz]
#
# ⚠️ DESTRUCTIVE: drops & recreates the public schema in the target DB, then
#    overwrites public/images. Use on a throwaway target first to rehearse.
#
# ── ลำดับที่แก้ไว้ 2026-09-05 — ทำไมลำดับถึงสำคัญกว่าตัวคำสั่ง ──────────────────
#
# ของเดิมทำสามอย่างผิดลำดับและผิดวิธี:
#
#   1. DROP SCHEMA ทิ้ง **ก่อน** แตะไฟล์ dump เลยสักครั้ง — ถ้า dump เสีย ว่างเปล่า
#      หรือชี้ผิดไฟล์ ฐานข้อมูลถูกล้างไปแล้วและไม่มีอะไรจะเอากลับมา นี่คือการทำลาย
#      ของที่มีอยู่จริง เพื่อแลกกับของที่ยังไม่รู้ว่ามีไหม
#   2. โหลด dump ด้วย psql เปล่า ๆ ไม่มี ON_ERROR_STOP — psql จะข้าม SQL ที่ error
#      แล้วเดินต่อจนจบและ **จบด้วยสถานะ 0** ตารางหายไปครึ่งหนึ่งก็ยังรายงานว่าสำเร็จ
#   3. ไม่ตรวจอะไรเลยหลังโหลดเสร็จ คนกดจึงไม่มีทางรู้ว่าที่ได้กลับมาครบหรือเปล่า
#
# ลำดับใหม่: ตรวจไฟล์ → สำรองของเดิมไว้ก่อน → ค่อยล้าง → โหลดแบบ all-or-nothing
# → นับของที่ได้กลับมา · ทุกขั้นที่ล้มเหลวก่อนถึง DROP จะไม่แตะฐานข้อมูลเลย
#
# ── สองทาง (เลือกด้วย RESTORE_VIA) ──────────────────────────────────────────────
#   RESTORE_VIA=docker (ค่าเริ่มต้น เหมือนเดิมทุกอย่าง) — ใช้ `docker exec <DB_CONTAINER> psql`
#       sudo sh scripts/restore.sh backups/db-….sql.gz [backups/images-….tar.gz]
#   RESTORE_VIA=direct — เครื่องที่ไม่ใช้ Docker: เรียก psql/pg_dump ตรงจากเครื่องนี้ (ต้องมี
#       PostgreSQL client) ต่อ DB ด้วย RESTORE_DATABASE_URL → BACKUP_DATABASE_URL → PGHOST/PGUSER/
#       PGDATABASE/PGPASSWORD (ไม่ใช้ DATABASE_URL ของแอปโดยตั้งใจ: สคริปต์นี้ DROP SCHEMA public
#       ผู้ใช้ของแอปไม่ควรมีสิทธิ์นั้น และเป้าหมายที่ล้างต้องเป็นสิ่งที่ผู้รันสั่งเอง) · ไฟล์ env
#       แบบเดียวกับ backup.sh: BACKUP_ENV_FILE (ดู deploy/backup/README.md) · ต้องรันจากโฟลเดอร์แอป
#       หรือตั้ง BACKUP_APP_DIR เพราะ archive รูปแตกลง cwd เป็น public/images/
#       ซ้อมกู้ใส่ DB ทิ้ง ๆ: RESTORE_DATABASE_URL=postgresql://…/fms_restore_test sh scripts/restore.sh …
set -eu

DB_DUMP="${1:?usage: restore.sh <db-*.sql.gz> [images-*.tar.gz]}"
IMAGES_TAR="${2:-}"

die() { echo "[restore] ✗ $1" >&2; exit 1; }
# lib/pgurl.sh เรียก fail() เมื่อ URL ผิดรูปแบบ
fail() { die "$1"; }

RESTORE_VIA="${RESTORE_VIA:-docker}"
script_dir="$(cd "$(dirname "$0")" 2>/dev/null && pwd)" || script_dir=""
if [ -n "${BACKUP_APP_DIR:-}" ]; then
  # path ของไฟล์ที่ผู้ใช้พิมพ์มาเทียบกับ cwd เดิม — ทำเป็น path เต็มก่อน cd ไม่งั้นความหมายเปลี่ยน
  case "$DB_DUMP" in /*) ;; *) DB_DUMP="$(pwd)/$DB_DUMP" ;; esac
  case "$IMAGES_TAR" in ''|/*) ;; *) IMAGES_TAR="$(pwd)/$IMAGES_TAR" ;; esac
  cd "$BACKUP_APP_DIR" 2>/dev/null || die "เข้าโฟลเดอร์ BACKUP_APP_DIR ($BACKUP_APP_DIR) ไม่ได้"
fi
if [ "$RESTORE_VIA" = direct ]; then
  [ -n "$script_dir" ] && [ -f "$script_dir/lib/backup-env.sh" ] && [ -f "$script_dir/lib/pgurl.sh" ] \
    || die "ไม่พบ scripts/lib/ (backup-env.sh, pgurl.sh) — สคริปต์นี้ต้องอยู่กับโฟลเดอร์ lib/ ในโปรเจกต์"
  . "$script_dir/lib/backup-env.sh"
  . "$script_dir/lib/pgurl.sh"
  env_err=""
  load_backup_env
  [ -z "$env_err" ] || die "$env_err"
fi

DB_CONTAINER="${DB_CONTAINER:-fms-election-db}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-fms_election}"
OUT_DIR="${OUT_DIR:-backups}"

# สามฟังก์ชันนี้คือจุดเดียวที่ต่างกันระหว่างสองทาง — ที่เหลือของสคริปต์ใช้ร่วมกัน
# db_psql ไม่ส่ง stdin ต่อ (ใช้กับ -c / -tAc) · db_psql_i ส่ง stdin ต่อ (ใช้โหลด dump)
# ทางโดคเกอร์คงรูปคำสั่งเดิมไว้ทุกตัวอักษร (-i เฉพาะที่เดิมมี -i)
db_psql() {
  if [ "$RESTORE_VIA" = direct ]; then psql --no-password "$@"
  else docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" "$@"; fi
}
db_psql_i() {
  if [ "$RESTORE_VIA" = direct ]; then psql --no-password "$@"
  else docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" "$@"; fi
}
db_dump() {
  if [ "$RESTORE_VIA" = direct ]; then pg_dump --no-password
  else docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME"; fi
}

# ตารางหลัก = ทุกตารางใน prisma/migrations + _prisma_migrations
# ⚠️ รายชื่อนี้ต้องตรงกับ ESSENTIAL_TABLES ใน scripts/backup.sh — เพิ่ม model ใหม่ให้แก้ทั้งสองไฟล์
#    รายชื่อเดียวกัน แต่กติกา schema ต่างกันโดยตั้งใจ: ที่นี่ต้องเป็น schema public เท่านั้น เพราะ
#    สคริปต์นี้ DROP/CREATE SCHEMA public แล้วแอปอ่านตารางจาก public · backup.sh รับ schema ใดก็ได้
#    (มันแค่ถ่ายของที่มีอยู่ และ use_url ทิ้ง ?schema= ของ URL ไปแล้ว จึงไม่รู้ว่าแอปใช้ schema ไหน)
ESSENTIAL_TABLES="User Candidate Member Ballot ChainHead SystemConfig Template AdminAuditLog _prisma_migrations"

# $1 = ไฟล์ .sql.gz → พิมพ์ชื่อตารางหลักที่ไม่มีใน schema public ของ dump (ว่าง = ครบ)
# รับทั้งชื่อมี/ไม่มีเครื่องหมายคำพูด แต่ schema ต้องเป็น public ตรง ๆ — "Ballot" ที่อยู่ใน schema อื่น
# จะไม่ถูกนับ เพราะโหลดแล้วแอปมองไม่เห็น (เจอตอนทดสอบ: ผ่านด่านนี้ไปถึง DROP แล้วค่อยล้มหลังโหลด)
missing_essential() {
  _create="$(gunzip -c "$1" | grep '^CREATE TABLE ' || true)"
  _missing=""
  for _t in $ESSENTIAL_TABLES; do
    printf '%s\n' "$_create" | grep -Eq "^CREATE TABLE public\.(\"$_t\"|$_t) \(" \
      || _missing="$_missing $_t"
  done
  printf '%s' "$_missing"
}

[ -f "$DB_DUMP" ] || die "ไม่พบไฟล์ dump: $DB_DUMP"

case "$RESTORE_VIA" in
  docker)
    docker inspect -f '{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null | grep -q true \
      || die "ไม่พบคอนเทนเนอร์ '$DB_CONTAINER' ที่กำลังรัน (ตั้งชื่ออื่นได้ด้วย DB_CONTAINER=...)"
    target_desc="the database \"$DB_NAME\" in container \"$DB_CONTAINER\""
    ;;
  direct)
    command -v psql >/dev/null 2>&1 && command -v pg_dump >/dev/null 2>&1 \
      || die "ไม่พบ psql/pg_dump บนเครื่องนี้ (RESTORE_VIA=direct ต้องมี PostgreSQL client)"
    if [ -n "${RESTORE_DATABASE_URL:-}" ]; then use_url "$RESTORE_DATABASE_URL" RESTORE_DATABASE_URL
    elif [ -n "${BACKUP_DATABASE_URL:-}" ]; then use_url "$BACKUP_DATABASE_URL" BACKUP_DATABASE_URL
    elif [ -n "${PGHOST:-}${PGDATABASE:-}${PGSERVICE:-}" ]; then :
    else die "RESTORE_VIA=direct แต่ไม่ได้บอกว่าจะกู้ลง DB ไหน — ตั้ง RESTORE_DATABASE_URL (หรือ BACKUP_DATABASE_URL / PGHOST+PGDATABASE+PGUSER) ก่อน"
    fi
    # ต่อได้จริงไหมตรวจก่อนทำอย่างอื่น: ผิดตรงนี้ยังไม่ได้แตะอะไร
    db_psql -tAc "select 1" >/dev/null 2>&1 \
      || die "ต่อฐานข้อมูล '${PGDATABASE:-?}' บน '${PGHOST:-local socket}' ในชื่อ '${PGUSER:-?}' ไม่ได้ (รหัสผ่าน/ชื่อเครื่อง/DB ไม่มีอยู่)"
    target_desc="the database \"${PGDATABASE:-?}\" on \"${PGHOST:-local socket}\" (user \"${PGUSER:-?}\")"
    ;;
  *) die "RESTORE_VIA ต้องเป็น docker หรือ direct (ได้ '$RESTORE_VIA')" ;;
esac

# ── 1. ตรวจไฟล์ก่อน ยังไม่แตะฐานข้อมูล ───────────────────────────────────────
echo "[restore] ตรวจไฟล์ backup ก่อน (ยังไม่แตะฐานข้อมูล)…"
gzip -t "$DB_DUMP" || die "ไฟล์ .gz เสียหาย: $DB_DUMP"
gunzip -c "$DB_DUMP" | grep -q 'PostgreSQL database dump' || die "ไม่ใช่ dump ของ pg_dump: $DB_DUMP"
dump_tables="$(gunzip -c "$DB_DUMP" | grep -c '^CREATE TABLE' || true)"
[ "$dump_tables" -gt 0 ] || die "dump ไม่มี CREATE TABLE สักบรรทัด — ฐานข้อมูลจะว่างเปล่าถ้าโหลดไฟล์นี้"
# มีตารางแต่ขาดตารางหลัก = โหลดแล้วได้ระบบที่ใช้ไม่ได้ (เช่น dump จาก DB ที่ "Ballot" ถูก DROP ไป)
# ต้องปฏิเสธตรงนี้ ก่อน DROP SCHEMA — หลังจากนั้นของเดิมหายไปแล้ว
dump_missing="$(missing_essential "$DB_DUMP")"
[ -z "$dump_missing" ] || die "dump ขาดตารางหลัก:$dump_missing — ไม่โหลดไฟล์นี้ (ฐานข้อมูลยังไม่ถูกแตะ) ให้เลือก backup ตัวอื่น"
echo "[restore]   ✓ dump ใช้ได้ · มี $dump_tables ตาราง"

if [ -n "$IMAGES_TAR" ]; then
  [ -f "$IMAGES_TAR" ] || die "ไม่พบไฟล์รูปภาพ: $IMAGES_TAR"
  tar -tzf "$IMAGES_TAR" >/dev/null || die "ไฟล์ tar รูปภาพเสียหาย: $IMAGES_TAR"
  # tar เก็บ path แบบ relative (public/images/...) และจะแตกไฟล์ลง cwd — ถ้ารันผิด
  # โฟลเดอร์ไฟล์จะไปโผล่ที่อื่น เช็คว่าข้างในเป็น public/images จริงก่อน
  tar -tzf "$IMAGES_TAR" | head -1 | grep -q '^public/images' \
    || die "ไฟล์ tar ไม่ได้เก็บ path 'public/images/' — อาจไม่ใช่ archive ที่ backup.sh สร้าง"
  echo "[restore]   ✓ archive รูปภาพใช้ได้"
fi

printf 'This will OVERWRITE %s. Continue? [y/N] ' "$target_desc"
read -r ans
[ "$ans" = "y" ] || [ "$ans" = "Y" ] || { echo "aborted"; exit 1; }

# ── 2. สำรองของเดิมไว้ก่อนล้าง ───────────────────────────────────────────────
# ถ้าการ restore ล้มกลางคัน อย่างน้อยยังมีทางกลับไปยังสภาพก่อนหน้า · ขั้นนี้อาจล้มได้
# ถ้าฐานข้อมูลเดิมพังอยู่แล้ว ซึ่งก็คือเหตุผลที่กำลัง restore อยู่ จึงเตือนแล้วไปต่อได้
mkdir -p "$OUT_DIR"
safety="$OUT_DIR/pre-restore-$(date +%Y%m%d-%H%M%S).sql.gz"
safety_ok=1
echo "[restore] สำรองสภาพปัจจุบันไว้ที่ $safety …"
# umask 077 เฉพาะใน subshell นี้: ไฟล์สำรองคือ dump เต็ม (รหัสนักศึกษา/ใครลงคะแนนแล้ว) ต้องเป็น
# 0600 เหมือนที่ backup.sh ทำ · ไม่ตั้งทั้งสคริปต์ เพราะ tar ตอนแตกรูปด้านล่างจะสร้างไฟล์/โฟลเดอร์
# 0600/0700 แล้วเว็บ (uid 1001) อ่านรูปไม่ได้
# pipeline คืนสถานะของ gzip เท่านั้น (ไม่มี pipefail ใน sh) — ความสำเร็จของ pg_dump จึงดูจาก
# บรรทัดท้ายไฟล์ "dump complete" ที่ pg_dump เขียนเมื่อจบครบเท่านั้น
if ( umask 077; db_dump 2>/dev/null | gzip > "$safety" ) \
   && gzip -t "$safety" 2>/dev/null && [ -s "$safety" ] \
   && gunzip -c "$safety" | tail -n 5 | grep -q 'PostgreSQL database dump complete'; then
  # ต้องเช็คด้วยว่า "ของเดิม" มีอะไรให้กลับไปหาจริงไหม
  #
  # ถ้าฐานข้อมูลตอนนี้ว่างอยู่แล้ว (เช่นเพิ่ง restore ล้มไปรอบก่อน) pg_dump จะสำเร็จและได้
  # ไฟล์ .gz ที่ถูกต้องทุกประการ — แต่ข้างในไม่มี CREATE TABLE สักบรรทัด เอาไปกู้ไม่ได้
  # ด่านตรวจของสคริปต์นี้เองจะปฏิเสธมันตอนพยายามใช้ · ถ้าไม่เช็คตรงนี้ สคริปต์จะไปบอกคนกด
  # ว่า "กลับไปสภาพเดิมได้ด้วยไฟล์นี้" ซึ่งเป็นคำแนะนำที่ล้มเหลวแน่นอนตอนที่เขาเดือดร้อนที่สุด
  # (เจอตอนทดสอบ restore ล้มสองรอบติดกัน)
  if gunzip -c "$safety" | grep -q '^CREATE TABLE'; then
    safety_missing="$(missing_essential "$safety")"
    if [ -z "$safety_missing" ]; then
      echo "[restore]   ✓ สำรองไว้แล้ว"
    else
      # เก็บไฟล์ไว้ (เป็นสภาพเดิมชุดเดียวที่มี) แต่ด่านตรวจข้างบนจะปฏิเสธมันถ้าเอามา restore
      # จึงห้ามแนะนำให้ใช้ไฟล์นี้กู้กลับตอนโหลดล้ม
      safety_ok=0
      echo "[restore]   ⓘ สำรองไว้แล้ว แต่ฐานข้อมูลปัจจุบันขาดตารางหลัก:$safety_missing — ใช้ไฟล์นี้กับ restore.sh ไม่ได้"
    fi
  else
    rm -f "$safety"
    safety=""
    echo "[restore]   ⓘ ฐานข้อมูลปัจจุบันว่างอยู่ ไม่มีอะไรให้สำรอง — ข้ามขั้นนี้"
  fi
else
  rm -f "$safety"
  safety=""
  echo "[restore]   ⚠ สำรองไม่สำเร็จ (ฐานข้อมูลเดิมอาจใช้การไม่ได้อยู่แล้ว) — ไปต่อ"
fi

# ── 3. ล้างแล้วโหลดแบบ all-or-nothing ────────────────────────────────────────
echo "[restore] resetting schema…"
db_psql_i -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" || die "ล้าง schema ไม่สำเร็จ"

echo "[restore] loading $DB_DUMP…"
# ON_ERROR_STOP=1 → เจอ SQL ผิดแล้วหยุดทันทีและคืนสถานะ non-zero
# --single-transaction → ถ้าหยุดกลางคัน ทุกอย่างถูก rollback ไม่เหลือสภาพครึ่ง ๆ กลาง ๆ
if ! gunzip -c "$DB_DUMP" | db_psql_i -v ON_ERROR_STOP=1 --single-transaction -q -o /dev/null; then
  echo "[restore] ✗ โหลด dump ไม่สำเร็จ — ถูก rollback แล้ว ฐานข้อมูลว่างอยู่ตอนนี้" >&2
  if [ -n "$safety" ] && [ "$safety_ok" = 1 ]; then
    echo "[restore]   กลับไปสภาพเดิมได้ด้วย:" >&2
    echo "[restore]     sh scripts/restore.sh $safety" >&2
  elif [ -n "$safety" ]; then
    echo "[restore]   สภาพเดิมเก็บไว้ที่ $safety แต่ขาดตารางหลัก กู้ด้วยสคริปต์นี้ไม่ได้" >&2
    echo "[restore]   ให้เลือก backup ตัวอื่นใน $OUT_DIR แล้วลองใหม่" >&2
  else
    echo "[restore]   ไม่มีไฟล์สำรองของสภาพก่อนหน้า (ฐานข้อมูลว่างอยู่ก่อนแล้ว)" >&2
    echo "[restore]   ให้เลือก backup ตัวอื่นใน $OUT_DIR แล้วลองใหม่" >&2
  fi
  exit 1
fi

# ── 4. นับของที่ได้กลับมา ────────────────────────────────────────────────────
# psql จบด้วย 0 ไม่ได้แปลว่าข้อมูลครบ — ต้องมองของจริงในฐานข้อมูล
echo "[restore] ตรวจผลหลังโหลด…"
restored_tables="$(db_psql -tAc \
  "select count(*) from information_schema.tables where table_schema='public';" | tr -d ' \r')"
echo "[restore]   ตารางในฐานข้อมูล: $restored_tables (ใน dump มี $dump_tables)"
[ "$restored_tables" -gt 0 ] || die "หลังโหลดแล้วไม่มีตารางเลย"

# ทุกตารางหลักต้องนับได้ — นับไม่ได้ = ตารางไม่มีจริงหลังโหลด ห้ามรายงานว่าสำเร็จ
# (ของเดิมมี `|| echo '-'` ที่ปลาย pipeline ซึ่งไม่เคยทำงาน เพราะสถานะคือของ tr — ตารางที่หาย
#  จึงพิมพ์ช่องว่างแล้วเดินต่อจนขึ้น ✓)
for t in $ESSENTIAL_TABLES; do
  n="$(db_psql -tAc \
       "select count(*) from \"$t\";" 2>/dev/null | tr -d ' \r')"
  case "$n" in
    ''|*[!0-9]*) die "หลังโหลดแล้วนับแถวตาราง $t ไม่ได้ — ข้อมูลไม่ครบ อย่าเปิดเว็บ ให้ restore ใหม่จาก backup ตัวอื่น" ;;
  esac
  echo "[restore]   $t: $n แถว"
done

if [ -n "$IMAGES_TAR" ]; then
  echo "[restore] extracting $IMAGES_TAR…"
  tar -xzf "$IMAGES_TAR" || die "แตกไฟล์รูปภาพไม่สำเร็จ"
fi

echo "[restore] ✓ เสร็จเรียบร้อย · ตัวเลขด้านบนคือของที่กู้กลับมาได้จริง"
[ -n "$safety" ] && echo "[restore]   สภาพก่อน restore เก็บไว้ที่ $safety (ลบทิ้งได้เมื่อมั่นใจแล้ว)"
if [ "$RESTORE_VIA" = direct ]; then
  echo "[restore]   รีสตาร์ทเว็บให้อ่านข้อมูลใหม่ (pm2 restart <ชื่อแอป> / sudo systemctl restart <ชื่อ service> ตามที่รันอยู่)"
  if [ -n "$IMAGES_TAR" ] && [ -n "${UPLOAD_ROOT:-}" ]; then
    echo "[restore]   รูปถูกแตกที่ ./public/images — แอปนี้ตั้ง UPLOAD_ROOT=$UPLOAD_ROOT ให้คัดลอกรูปที่ต้องการไปไว้ที่นั่นด้วย"
  fi
else
  echo "[restore]   รีสตาร์ท web ถ้ากำลังรันอยู่:  docker compose restart web"
fi
