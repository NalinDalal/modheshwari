#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# backup-notify.sh — Publish backup status to CloudWatch Metrics + SNS
#
# Usage:
#   ./backup-notify.sh success          # report successful backup
#   ./backup-notify.sh failure "msg"    # report failed backup with reason
#
# Environment variables:
#   AWS_REGION            — AWS region (required)
#   BACKUP_SNS_TOPIC_ARN — SNS topic ARN for email/Slack notifications (optional)
#   SLACK_WEBHOOK_URL     — Direct Slack Incoming Webhook URL (optional, used when
#                           SNS is NOT configured)
#   CW_NAMESPACE          — CloudWatch namespace (default: Modheshwari/Backups)
#   BACKUP_TYPE           — label: postgres, rds, wal (default: postgres)
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── load .env ─────────────────────────────────────────────────────────────────
load_env() {
  local envfile="$1"
  [ -f "$envfile" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|\#*) continue ;; esac
    if [[ "$line" == *"="* ]]; then
      key="${line%%=*}"; value="${line#*=}"
      value="${value%\"}"; value="${value#\"}"
      value="${value%\'}"; value="${value#\'}"
      if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
        export "$key"="$value"
      fi
    fi
  done < "$envfile"
}
load_env "$REPO_ROOT/.env"

# ── args ──────────────────────────────────────────────────────────────────────
STATUS="${1:-}"
REASON="${2:-}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [ -z "$STATUS" ]; then
  echo "Usage: $0 <success|failure> [reason]" >&2
  exit 2
fi

CW_NAMESPACE="${CW_NAMESPACE:-Modheshwari/Backups}"
BACKUP_TYPE="${BACKUP_TYPE:-postgres}"
AWS_REGION="${AWS_REGION:-$(aws configure get region 2>/dev/null || echo 'ap-south-1')}"

# ── CloudWatch custom metric ─────────────────────────────────────────────────
publish_metric() {
  if ! command -v aws >/dev/null 2>&1; then
    echo "aws CLI not found; skipping CloudWatch metric" >&2
    return
  fi

  local metric_value
  if [ "$STATUS" = "success" ]; then metric_value=1; else metric_value=0; fi

  echo "Publishing CloudWatch metric: ${CW_NAMESPACE}/BackupSuccess = ${metric_value}"

  aws cloudwatch put-metric-data \
    --region "$AWS_REGION" \
    --namespace "$CW_NAMESPACE" \
    --metric-name "BackupSuccess" \
    --dimensions "BackupType=${BACKUP_TYPE}" \
    --value "$metric_value" \
    --unit "Count" \
    --timestamp "$TIMESTAMP"
}

# ── SNS notification ─────────────────────────────────────────────────────────
publish_sns() {
  if [ -z "${BACKUP_SNS_TOPIC_ARN-}" ]; then return; fi
  if ! command -v aws >/dev/null 2>&1; then
    echo "aws CLI not found; skipping SNS notification" >&2
    return
  fi

  local subject body
  if [ "$STATUS" = "success" ]; then
    subject="✅ Backup succeeded — ${BACKUP_TYPE} (${TIMESTAMP})"
    body="Backup completed successfully.\n\nType: ${BACKUP_TYPE}\nTime: ${TIMESTAMP}"
  else
    subject="🚨 Backup FAILED — ${BACKUP_TYPE} (${TIMESTAMP})"
    body="Backup failed!\n\nType: ${BACKUP_TYPE}\nTime: ${TIMESTAMP}\nReason: ${REASON:-unknown}"
  fi

  echo "Publishing to SNS: ${BACKUP_SNS_TOPIC_ARN}"

  aws sns publish \
    --region "$AWS_REGION" \
    --topic-arn "$BACKUP_SNS_TOPIC_ARN" \
    --subject "$subject" \
    --message "$(echo -e "$body")"
}

# ── Direct Slack webhook (fallback when SNS is not configured) ────────────────
publish_slack() {
  if [ -n "${BACKUP_SNS_TOPIC_ARN-}" ]; then return; fi   # SNS handles Slack via Lambda
  if [ -z "${SLACK_WEBHOOK_URL-}" ]; then return; fi
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl not found; skipping Slack notification" >&2
    return
  fi

  local color text
  if [ "$STATUS" = "success" ]; then
    color="good"
    text="✅ *Backup succeeded* — \`${BACKUP_TYPE}\` at ${TIMESTAMP}"
  else
    color="danger"
    text="🚨 *Backup FAILED* — \`${BACKUP_TYPE}\` at ${TIMESTAMP}\nReason: ${REASON:-unknown}"
  fi

  local payload
  payload=$(cat <<EOF
{
  "attachments": [{
    "color": "${color}",
    "text": "${text}",
    "footer": "Modheshwari Backup Monitor",
    "ts": $(date +%s)
  }]
}
EOF
  )

  echo "Sending Slack notification"
  curl -s -X POST -H 'Content-type: application/json' \
    --data "$payload" \
    "$SLACK_WEBHOOK_URL" >/dev/null
}

# ── main ──────────────────────────────────────────────────────────────────────
publish_metric
publish_sns
publish_slack

if [ "$STATUS" = "success" ]; then
  echo "Backup notification sent: SUCCESS"
else
  echo "Backup notification sent: FAILURE — ${REASON:-unknown}"
  exit 1
fi
