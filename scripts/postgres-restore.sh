
#!/usr/bin/env bash
set -euo pipefail

# Load repository .env if present (repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
load_env() {
  local envfile="$1"
  [ -f "$envfile" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
    esac
    if [[ "$line" == *"="* ]]; then
      key="${line%%=*}"
      value="${line#*=}"
      value="${value%\"}"
      value="${value#\"}"
      value="${value%\'}"
      value="${value#\'}"
      if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
        export "$key"="$value"
      else
        echo "Skipping invalid key in .env: $key" >&2
      fi
    else
      echo "Skipping malformed .env line: $line" >&2
    fi
  done < "$envfile"
}

load_env "$REPO_ROOT/.env"

# Restore a PostgreSQL custom-format dump created by postgres-backup.sh
# Usage: ./postgres-restore.sh <dump-file>

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <dump-file>" >&2
  exit 2
fi

DUMP_FILE="$1"

if [ ! -f "$DUMP_FILE" ]; then
  echo "Dump file not found: $DUMP_FILE" >&2
  exit 3
fi

if [ -z "${DATABASE_URL-}" ]; then
  echo "Please set DATABASE_URL to the target database (or set PGHOST/PGUSER/PGDATABASE)." >&2
  exit 4
fi

echo "Restoring ${DUMP_FILE} into ${DATABASE_URL}"

if command -v pg_restore >/dev/null 2>&1; then
  pg_restore --clean --if-exists --dbname="$DATABASE_URL" "$DUMP_FILE"
else
  echo "pg_restore not found locally. Trying Docker fallback..."
  if ! command -v docker >/dev/null 2>&1; then
    cat <<'MSG' >&2
pg_restore not found and Docker is not available.
Install the Postgres client tools locally (macOS):
  brew install libpq
  echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
Or set PG_DOCKER_IMAGE=postgres:15 in .env and ensure Docker is installed.
MSG
    exit 127
  fi

  DOCKER_IMAGE="${PG_DOCKER_IMAGE:-postgres:17}"
  docker run --rm \
    -v "$(cd "$(dirname "$DUMP_FILE")" && pwd)":/backups \
    -e DATABASE_URL="${DATABASE_URL-}" \
    -e PGHOST="${PGHOST-}" -e PGPORT="${PGPORT-}" -e PGUSER="${PGUSER-}" -e PGPASSWORD="${PGPASSWORD-}" -e PGDATABASE="${PGDATABASE-}" \
    "$DOCKER_IMAGE" bash -lc "pg_restore --clean --if-exists --dbname=\"\${DATABASE_URL}\" /backups/$(basename "$DUMP_FILE")"
fi

echo "Restore complete."
