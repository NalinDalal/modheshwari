# Regular Backups of Data

This document outlines recommended backup strategies and provides a small, runnable script to take PostgreSQL logical backups and upload them to Amazon S3 (suitable for non-RDS or self-managed Postgres). For RDS users see "Recommended AWS options".

## Recommended approaches (ordered)

- **If using Amazon RDS / Aurora:** enable automated backups and snapshots and optionally use AWS Backup for cross-account / cross-region retention. This is the simplest and most reliable approach.
- **If self-managed Postgres / EC2 / Kubernetes:** use WAL-aware backup tools (pgBackRest, WAL-G) for point-in-time recovery. If you only need periodic logical backups, use `pg_dump` + upload to S3 (provided here).
- **File/object backups (S3):** use lifecycle rules to expire old backups and replication/replication rules for cross-region copies.

## What this repo includes

- `scripts/backup-postgres.sh` — example script: creates a compressed `pg_dump` in custom format, uploads to S3, and prunes older backups based on retention.

## Dependencies for the script

- `pg_dump` (PostgreSQL client tools)
- `aws` (AWS CLI v2)
- `jq` (for optional object listing)
- Linux shell (the script uses GNU `date` for retention calculation)

Install example (Ubuntu):
```bash
sudo apt-get update && sudo apt-get install -y postgresql-client awscli jq
```

## Environment variables used by the script

- `DATABASE_URL` — Postgres connection string (libpq format). Alternatively the usual `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGPORT`, `PGDATABASE` env vars are supported by `pg_dump`.
- `S3_BUCKET` — target S3 bucket (e.g. `my-backups-bucket`)
- `AWS_REGION` — AWS region for `aws` commands
- `BACKUP_RETENTION_DAYS` — number of days to retain backups (default: `30`)

Set these as environment variables in the environment that runs the script (ECS Scheduled Task, EC2 cron, or CI runner).

## Scheduling

- Run as a cron job on a management host / bastion that has network access to the database.
- Or run as an AWS Scheduled Task (ECS) or Lambda (container image) with access to the database and the S3 bucket.

## IAM permissions (minimum)

Attach a policy that allows the running principal to upload and list/remove objects in the S3 bucket and (if needed) to create CloudWatch log streams:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect":"Allow","Action":["s3:PutObject","s3:ListBucket","s3:DeleteObject","s3:GetObject"],"Resource":["arn:aws:s3:::YOUR_BUCKET","arn:aws:s3:::YOUR_BUCKET/*"]},
    {"Effect":"Allow","Action":["logs:CreateLogStream","logs:PutLogEvents"],"Resource":"*"}
  ]
}
```

## Restore notes

To restore a custom-format dump created by `pg_dump -Fc`:

```bash
# create database or drop+create
createdb -h HOST -U USER restored_db
pg_restore -h HOST -U USER -d restored_db /path/to/db-backup-2026-02-14T120000Z.dump
```

## Next steps / improvements

- Replace logical dumps with `pgBackRest` or `WAL-G` for PITR (recommended for production databases).
- Add multi-region replication of backups (S3 replication or AWS Backup vault copies).
- Add monitoring/alerting on backup success/failure (CloudWatch alarms, Slack/email notifications).
