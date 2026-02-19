
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

# ── Notification helper ───────────────────────────────────────────────────────
NOTIFY_SCRIPT="${SCRIPT_DIR}/backup-notify.sh"

trap_failure() {
  local exit_code=$?
  if [ $exit_code -ne 0 ] && [ -x "$NOTIFY_SCRIPT" ]; then
    BACKUP_TYPE=rds "$NOTIFY_SCRIPT" failure "rds-snapshot.sh exited with code ${exit_code}" || true
  fi
}
trap trap_failure EXIT

# Create an RDS snapshot and optionally copy it to another region.
# Usage: RDS_INSTANCE=<identifier> DEST_REGION=<region> ./rds-snapshot.sh

if [ -z "${RDS_INSTANCE-}" ]; then
  echo "Please set RDS_INSTANCE environment variable (DB instance identifier)" >&2
  exit 2
fi

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
SNAP_NAME="${RDS_INSTANCE}-snapshot-${TIMESTAMP}"

echo "Creating snapshot ${SNAP_NAME} for ${RDS_INSTANCE}"
aws rds create-db-snapshot --db-instance-identifier "$RDS_INSTANCE" --db-snapshot-identifier "$SNAP_NAME"

if [ -n "${DEST_REGION-}" ]; then
  echo "Waiting for snapshot to be available..."
  aws rds wait db-snapshot-available --db-snapshot-identifier "$SNAP_NAME"
  echo "Copying snapshot to ${DEST_REGION}"
  aws rds copy-db-snapshot --source-db-snapshot-identifier arn:aws:rds:${AWS_REGION:-$(aws configure get region)}:${AWS_ACCOUNT_ID:-}:snapshot:${SNAP_NAME} --target-db-snapshot-identifier "${SNAP_NAME}-${DEST_REGION}" --source-region "${AWS_REGION:-$(aws configure get region)}" --region "$DEST_REGION"
  echo "Copy initiated."
fi

# ── Report success ────────────────────────────────────────────────────────────
if [ -x "$NOTIFY_SCRIPT" ]; then
  BACKUP_TYPE=rds "$NOTIFY_SCRIPT" success || true
fi

echo "Done."
