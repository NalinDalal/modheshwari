
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

# WAL archive helper for PostgreSQL. Intended to be used as an archive_command.
# Example postgresql.conf setting:
# archive_mode = on
# archive_command = 'bash /path/to/scripts/wal-archive.sh "%p" "%f"'

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <path-to-wal-segment> <filename>" >&2
  exit 2
fi

PATH_TO_WAL="$1"
FILENAME="$2"

if [ -z "${AWS_S3_BUCKET-}" ]; then
  echo "AWS_S3_BUCKET must be set in environment" >&2
  exit 3
fi

echo "Archiving WAL ${FILENAME} to s3://${AWS_S3_BUCKET}/wal/"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found" >&2
  exit 4
fi

aws s3 cp "${PATH_TO_WAL}" "s3://${AWS_S3_BUCKET}/wal/${FILENAME}"

exit 0
