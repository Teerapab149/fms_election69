#!/usr/bin/env sh
# FMS Election — restore DB + images from a backup made by scripts/backup.sh.
# Run on the server. Usage:
#   sh scripts/restore.sh backups/db-YYYYmmdd-HHMMSS.sql.gz [backups/images-YYYYmmdd-HHMMSS.tar.gz]
#
# ⚠️ DESTRUCTIVE: drops & recreates the public schema in the target DB, then
#    overwrites public/images. Use on a throwaway target first to rehearse.
set -eu

DB_DUMP="${1:?usage: restore.sh <db-*.sql.gz> [images-*.tar.gz]}"
IMAGES_TAR="${2:-}"
DB_CONTAINER="${DB_CONTAINER:-fms-election-db}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-fms_election}"

[ -f "$DB_DUMP" ] || { echo "DB dump not found: $DB_DUMP" >&2; exit 1; }

printf 'This will OVERWRITE the database "%s" in container "%s". Continue? [y/N] ' "$DB_NAME" "$DB_CONTAINER"
read -r ans
[ "$ans" = "y" ] || [ "$ans" = "Y" ] || { echo "aborted"; exit 1; }

echo "[restore] resetting schema…"
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "[restore] loading $DB_DUMP…"
gunzip -c "$DB_DUMP" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

if [ -n "$IMAGES_TAR" ]; then
  [ -f "$IMAGES_TAR" ] || { echo "images archive not found: $IMAGES_TAR" >&2; exit 1; }
  echo "[restore] extracting $IMAGES_TAR…"
  tar -xzf "$IMAGES_TAR"   # archive stores the public/images/ path
fi

echo "[restore] done. Restart the web container if it was running:"
echo "  docker compose restart web"
