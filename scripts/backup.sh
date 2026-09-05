#!/usr/bin/env sh
# FMS Election — backup the DB + uploaded images.
# Run on the server (where docker compose runs). Cron example (daily 02:00):
#   0 2 * * * cd /path/to/fms_election69 && sh scripts/backup.sh >> backups/backup.log 2>&1
#
# Produces, under ./backups/:
#   db-YYYYmmdd-HHMMSS.sql.gz       (pg_dump of the postgres container)
#   images-YYYYmmdd-HHMMSS.tar.gz   (public/images — party/member photos)
# Keeps the latest RETENTION days; older files are pruned — but ONLY after this
# run's backup has been verified. See "ทำไมต้องตรวจก่อน prune" below.
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

DB_CONTAINER="${DB_CONTAINER:-fms-election-db}"   # prod compose container name
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-fms_election}"
IMAGES_DIR="${IMAGES_DIR:-public/images}"
OUT_DIR="${OUT_DIR:-backups}"
RETENTION="${RETENTION_DAYS:-14}"

ts="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

fail() {
  echo "[backup $ts] ✗ ล้มเหลว: $1" >&2
  echo "[backup $ts]   ไม่ได้ลบ backup เก่าออกเลย ของเดิมยังอยู่ครบ" >&2
  exit 1
}

# ตรวจก่อนว่าคอนเทนเนอร์ฐานข้อมูลมีจริงและกำลังรัน — ถ้าไม่เช็ค ข้อความผิดพลาดที่ได้
# จะเป็นของ docker ซึ่งอ่านไม่ออกว่าเกิดอะไรขึ้น
docker inspect -f '{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null | grep -q true \
  || fail "ไม่พบคอนเทนเนอร์ '$DB_CONTAINER' ที่กำลังรัน (ตั้งชื่ออื่นได้ด้วย DB_CONTAINER=...)"

raw="$OUT_DIR/.db-$ts.sql.partial"
gz="$OUT_DIR/db-$ts.sql.gz"
# เก็บกวาดไฟล์ระหว่างทางเสมอ ไม่ว่าจะจบแบบไหน — ไม่ทิ้งไฟล์ .partial ไว้ให้สับสน
trap 'rm -f "$raw"' EXIT

echo "[backup $ts] dumping DB from container '$DB_CONTAINER'…"
# ไม่ใช้ pipeline: เขียนลงไฟล์ก่อน แล้วสถานะจบที่ได้คือของ pg_dump จริง ๆ
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$raw" \
  || fail "pg_dump ไม่สำเร็จ (ดูข้อความข้างบน)"

# ถึงจะ exit 0 ก็ยังต้องดูของจริง: dump ที่ใช้ได้ต้องมีหัวไฟล์ของ pg_dump และมีคำสั่ง
# สร้างตารางอยู่ · ไฟล์ว่างหรือไฟล์ที่มีแต่ error message จะไม่ผ่านสองด่านนี้
[ -s "$raw" ] || fail "ไฟล์ dump ว่างเปล่า"
grep -q 'PostgreSQL database dump' "$raw" || fail "ไฟล์ dump ไม่มีหัวไฟล์ของ pg_dump — น่าจะไม่ใช่ dump จริง"
grep -q 'CREATE TABLE' "$raw" || fail "ไฟล์ dump ไม่มีคำสั่ง CREATE TABLE สักบรรทัด — ฐานข้อมูลว่างหรือ dump ไม่ครบ"

tables="$(grep -c '^CREATE TABLE' "$raw" || true)"
echo "[backup $ts]   dump มี $tables ตาราง"

gzip -c "$raw" > "$gz" || fail "gzip ไม่สำเร็จ"
gzip -t "$gz" || fail "ไฟล์ .gz ที่ได้เสียหาย (gzip -t ไม่ผ่าน)"

images_ok=1
if [ -d "$IMAGES_DIR" ]; then
  echo "[backup $ts] archiving $IMAGES_DIR…"
  tar -czf "$OUT_DIR/images-$ts.tar.gz" "$IMAGES_DIR" || fail "tar รูปภาพไม่สำเร็จ"
  # ตรวจว่าอ่านกลับได้จริง ไม่ใช่แค่เขียนไฟล์ออกมาได้
  tar -tzf "$OUT_DIR/images-$ts.tar.gz" >/dev/null || fail "ไฟล์ tar รูปภาพเสียหาย (อ่านกลับไม่ได้)"
else
  echo "[backup $ts] WARN: $IMAGES_DIR not found — skipping images"
  images_ok=0
fi

# ── prune ทำที่นี่เท่านั้น: หลังจากรู้แล้วว่า backup รอบนี้ใช้ได้จริง ────────────────
# ทุก fail ด้านบนออกจากสคริปต์ไปก่อนถึงบรรทัดนี้ ของเก่าจึงไม่มีวันถูกลบเพราะรอบนี้พัง
echo "[backup $ts] pruning backups older than $RETENTION days…"
find "$OUT_DIR" -name 'db-*.sql.gz'     -mtime +"$RETENTION" -delete 2>/dev/null || true
find "$OUT_DIR" -name 'images-*.tar.gz' -mtime +"$RETENTION" -delete 2>/dev/null || true

echo "[backup $ts] ✓ เสร็จเรียบร้อย ตรวจไฟล์แล้วว่าใช้ได้:"
if [ "$images_ok" -eq 1 ]; then
  ls -lh "$gz" "$OUT_DIR/images-$ts.tar.gz"
else
  ls -lh "$gz"
fi
