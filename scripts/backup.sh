#!/usr/bin/env sh
# FMS Election — backup the DB + uploaded images.
# Run on the server (where docker compose runs). Cron example (daily 02:00):
#   0 2 * * * cd /path/to/fms_election69 && sh scripts/backup.sh >> backups/backup.log 2>&1
#
# Produces, under ./backups/:
#   db-YYYYmmdd-HHMMSS.sql.gz       (pg_dump of the postgres container)
#   images-YYYYmmdd-HHMMSS.tar.gz   (public/images — party/member photos)
# Keeps the latest RETENTION days; older files are pruned.
#
# ⚠️ A backup you have never restored is not a backup. Rehearse scripts/restore.sh
#    against a throwaway target at least once BEFORE election day.
set -eu

DB_CONTAINER="${DB_CONTAINER:-fms-election-db}"   # prod compose container name
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-fms_election}"
IMAGES_DIR="${IMAGES_DIR:-public/images}"
OUT_DIR="${OUT_DIR:-backups}"
RETENTION="${RETENTION_DAYS:-14}"

ts="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

echo "[backup $ts] dumping DB from container '$DB_CONTAINER'…"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$OUT_DIR/db-$ts.sql.gz"

if [ -d "$IMAGES_DIR" ]; then
  echo "[backup $ts] archiving $IMAGES_DIR…"
  tar -czf "$OUT_DIR/images-$ts.tar.gz" "$IMAGES_DIR"
else
  echo "[backup $ts] WARN: $IMAGES_DIR not found — skipping images"
fi

echo "[backup $ts] pruning backups older than $RETENTION days…"
find "$OUT_DIR" -name 'db-*.sql.gz'    -mtime +"$RETENTION" -delete 2>/dev/null || true
find "$OUT_DIR" -name 'images-*.tar.gz' -mtime +"$RETENTION" -delete 2>/dev/null || true

echo "[backup $ts] done:"
ls -lh "$OUT_DIR"/db-"$ts".sql.gz "$OUT_DIR"/images-"$ts".tar.gz 2>/dev/null || true
