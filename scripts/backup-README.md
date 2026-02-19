Postgres Backup & Restore

Overview

Environment

Example usage
Create backup locally:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb" ./postgres-backup.sh
```

Restore from a dump:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb" ./postgres-restore.sh backups/db-20260101T120000Z.dump
```

Cron example (daily at 02:00 UTC)
```
# Edit crontab with `crontab -e` and add:
0 2 * * * cd /path/to/repo/scripts && /usr/bin/env bash ./postgres-backup.sh >> ./backups/backup.log 2>&1
```

Retention & archival

Security

- For large databases consider using streaming, incremental snapshots, or provider-native snapshotting (EBS snapshots, cloud DB backups).
CI / Scheduled Backups
CI / Scheduled Backups
- A GitHub Actions workflow is available at `.github/workflows/postgres-backup.yml` to run backups on a schedule or manually. Configure the following repository secrets: `DATABASE_URL`, `AWS_S3_BUCKET`, and `AWS_REGION`. The workflow will also load a repository `.env` file if present (for local/testing flows), but do NOT store production secrets in a committed `.env`.

Make scripts executable
- Run `chmod +x ./scripts/*.sh` or execute `./scripts/make-scripts-exec.sh` to mark scripts executable locally.

Using a `.env` file
- Copy `.env.example` to `.env` at the repository root and populate values. The scripts in `./scripts/` will automatically load variables from `.env` when present.
- Important: Do not commit `.env` to source control. Use CI secrets for production workflows.

Installing Postgres client tools
- The scripts prefer local `pg_dump`/`pg_restore`. On macOS install them with Homebrew:

```
brew install libpq
# add to your shell PATH if brew doesn't link into /usr/local
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
```

Docker fallback
 If `pg_dump`/`pg_restore` are not available locally the scripts will attempt to use a Docker image (default `postgres:17`). Set `PG_DOCKER_IMAGE` in `.env` to override, and make sure the image major version matches your Postgres server (e.g. `postgres:17` for a Postgres 17 server):

 ```
 PG_DOCKER_IMAGE=postgres:17
 ```

 Direct streaming to S3 (no local dump)
 To avoid creating large local files and to prevent committing dumps to git, enable streaming to S3 by setting `STREAM_TO_S3=true` and `AWS_S3_BUCKET` in your `.env` (or environment). The script will compress the dump with `gzip` and upload directly to `s3://$AWS_S3_BUCKET/db-<TIMESTAMP>.dump.gz` using the `aws` CLI.
 Example in `.env`:

 ```
 STREAM_TO_S3=true
 AWS_S3_BUCKET=my-backup-bucket
 PG_DOCKER_IMAGE=postgres:17
 ```

 The script uses `pg_dump | gzip | aws s3 cp - s3://...` when `STREAM_TO_S3=true`; if `pg_dump` is unavailable it falls back to running `pg_dump` inside Docker and streaming the output to S3. Ensure AWS credentials are available to the host or CI environment (AWS CLI configured or environment variables).

This requires Docker to be installed and running. When using the Docker fallback the scripts mount the `scripts/backups` directory into the container so the generated dumps are accessible locally.

WAL shipping (Point-in-time recovery)
- To enable WAL archiving to S3, set `archive_mode = on` in `postgresql.conf` and use an archive command such as:

```
archive_command = 'bash /path/to/repo/scripts/wal-archive.sh "%p" "%f"'
```

- Ensure `AWS_S3_BUCKET` is configured and the `aws` CLI has permission to write to the `wal/` prefix. During recovery, download WAL segments from S3 and replay them to reach a point in time.

Provider snapshots (RDS/EBS)
- For Amazon RDS the included `scripts/rds-snapshot.sh` creates a snapshot of an RDS instance and can copy it to another region. Provide `RDS_INSTANCE`, `DEST_REGION`, and AWS credentials (these may be supplied via `.env` for local runs).
- For EBS-backed hosts prefer provider-level snapshots (EBS snapshots) combined with application-level backups (for example, `pg_basebackup`) to ensure consistency.

Terraform S3 retention & cross-region replication
- Example Terraform is provided in `infra/terraform/` to create a versioned S3 bucket with lifecycle rules and a replica bucket for replication. Before running `terraform apply`, set `primary_bucket_name` and `replica_bucket_name` and ensure the executing AWS identity has S3 and IAM permissions.

Security & operations notes
- Keep secret values in a secrets manager or CI vault. Do not commit credentials.
- Test restore procedures regularly in a non-production environment.

Monitoring & alerting
Both `postgres-backup.sh` and `rds-snapshot.sh` automatically report success/failure via `backup-notify.sh` (if it exists and is executable). The notification script supports three channels:

1. **CloudWatch custom metric** (`Modheshwari/Backups` → `BackupSuccess`):
   Published on every run. A CloudWatch alarm (provisioned in `infra/terraform/monitoring.tf`) fires when no successful metric is recorded in 24 hours.

2. **SNS email notifications:**
   Set `BACKUP_SNS_TOPIC_ARN` in the environment (output of `terraform apply`). Subscribe an email address via Terraform variable `alert_email` or manually in the AWS console.

3. **Slack notifications:**
   - *Via Lambda* (recommended): Set `slack_webhook_url` Terraform variable. A Lambda function subscribes to the SNS topic and forwards alerts to Slack.
   - *Direct webhook* (no Terraform required): Set `SLACK_WEBHOOK_URL` in your `.env`. The script will POST directly to Slack when SNS is not configured.

Required environment variables for notifications:
```
AWS_REGION=ap-south-1
BACKUP_SNS_TOPIC_ARN=arn:aws:sns:ap-south-1:123456789012:modheshwari-backup-alerts  # optional
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...                     # optional
```

To deploy the monitoring infrastructure:
```
cd infra/terraform
terraform apply -var="alert_email=ops@example.com" -var="slack_webhook_url=https://hooks.slack.com/..."
```
