
#!/usr/bin/env bash
set -euo pipefail

# Load repository .env if present (repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# Safely load .env: only accept KEY=VALUE lines and skip malformed lines/comments
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
      # strip surrounding double or single quotes if present
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

# Simple PostgreSQL backup script supporting DATABASE_URL or PG env vars.
# Optional: set AWS_S3_BUCKET to upload backups to S3 (requires `aws` CLI configured).

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
OUT_DIR="${REPO_ROOT}/scripts/backups"
mkdir -p "$OUT_DIR"

FILENAME="db-${TIMESTAMP}.dump"
OUT_PATH="${OUT_DIR}/${FILENAME}"

echo "Creating PostgreSQL dump: ${OUT_PATH}"

# Use local pg_dump if available, otherwise attempt to use Docker (if configured)
if command -v pg_dump >/dev/null 2>&1; then
  if [ -n "${DATABASE_URL-}" ]; then
    pg_dump --format=custom --file="$OUT_PATH" --dbname="$DATABASE_URL"
  else
    pg_dump --format=custom --file="$OUT_PATH"
  fi
else
  echo "pg_dump not found locally. Trying Docker fallback..."
  if ! command -v docker >/dev/null 2>&1; then
    cat <<'MSG' >&2
pg_dump not found and Docker is not available.
Install the Postgres client tools locally (macOS):
  brew install libpq
  # then add to PATH (example for Homebrew on Apple Silicon):
  echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
Or set up Docker fallback by adding PG_DOCKER_IMAGE=postgres:15 to your .env and ensuring Docker is installed.
MSG
    exit 127
  fi

  DOCKER_IMAGE="${PG_DOCKER_IMAGE:-postgres:17}"
  echo "Using Docker image: $DOCKER_IMAGE"

  # Pass either DATABASE_URL or PG* vars into the container
  docker run --rm \
    -v "$OUT_DIR":/backups \
    -e DATABASE_URL="${DATABASE_URL-}" \
    -e PGHOST="${PGHOST-}" -e PGPORT="${PGPORT-}" -e PGUSER="${PGUSER-}" -e PGPASSWORD="${PGPASSWORD-}" -e PGDATABASE="${PGDATABASE-}" \
    "$DOCKER_IMAGE" bash -lc "if [ -n \"\$DATABASE_URL\" ]; then pg_dump --format=custom --file=/backups/${FILENAME} --dbname=\"\$DATABASE_URL\"; else pg_dump --format=custom --file=/backups/${FILENAME}; fi"
fi

echo "Backup created: ${OUT_PATH}"

if [ -n "${AWS_S3_BUCKET-}" ]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "aws CLI not found; skipping S3 upload" >&2
  else
    echo "Uploading ${OUT_PATH} to s3://${AWS_S3_BUCKET}/" 
    aws s3 cp "$OUT_PATH" "s3://${AWS_S3_BUCKET}/$(basename "$OUT_PATH")"
    echo "Upload complete"
  fi
fi

echo "Done."
