#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

backup_dir="${CARTE_BACKUP_DIR:-/var/backups/carte}"
container="${CARTE_POSTGRES_CONTAINER:-carte-postgres-1}"
database="${CARTE_POSTGRES_DB:-carte}"
user="${CARTE_POSTGRES_USER:-carte}"
retention_days="${CARTE_BACKUP_RETENTION_DAYS:-7}"

if [[ ! "$retention_days" =~ ^[0-9]+$ ]]; then
  echo "CARTE_BACKUP_RETENTION_DAYS must be a non-negative integer" >&2
  exit 2
fi

if [[ "$(docker inspect --format '{{.State.Running}}' "$container" 2>/dev/null || true)" != "true" ]]; then
  echo "PostgreSQL container is not running: $container" >&2
  exit 1
fi

mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$backup_dir/carte-${timestamp}.sql.gz"
temporary="$output.tmp"

cleanup() {
  rm -f "$temporary"
}
trap cleanup EXIT

docker exec "$container" pg_dump \
  --username="$user" \
  --dbname="$database" \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip -9 > "$temporary"

if [[ ! -s "$temporary" ]]; then
  echo "Backup output is empty" >&2
  exit 1
fi

mv "$temporary" "$output"
find "$backup_dir" -maxdepth 1 -type f -name 'carte-*.sql.gz' -mtime "+$retention_days" -delete

echo "Created PostgreSQL backup: $output"
