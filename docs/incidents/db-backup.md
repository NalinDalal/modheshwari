# Incident Report: PostgreSQL Backup Workflow Failure

**Repository:** nerdev-co/modheshwari
**Workflow:** `.github/workflows/postgres-backup.yml`
**Date:** 2026-08-06
**Reported by:** Nalin
**Severity:** Medium (scheduled backup job failing — no data loss, but no durable backups were being produced)
**Status:** Resolved (pending final secret confirmation)

---

## 1. Summary

The scheduled PostgreSQL backup GitHub Actions job failed during a run (Run ID `31072638013`, Job ID `92523574796`). The job called `./scripts/postgres-backup.sh`, which failed to connect to a database and could not publish its failure metric to CloudWatch due to missing AWS credentials. Root-cause investigation led to a broader decision to remove all shell-script-based backup tooling and inline the backup logic directly into the GitHub Actions workflow YAML, followed by setup of the required secrets and an S3 destination for durable backup storage.

---

## 2. Timeline

| Step | Action |
|---|---|
| 1 | Scheduled run of `postgres-backup.sh` fails with `pg_dump: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: No such file or directory` |
| 2 | CloudWatch metric publish also fails: `Unable to locate credentials` |
| 3 | Job exits with code 1 |
| 4 | Investigation confirms script defaults to a local `pg_dump` (Docker fallback only if `pg_dump` binary is missing) and requires `DATABASE_URL` or `PG*` env vars, which were not set in the run environment |
| 5 | Decision made to eliminate the shell-script layer entirely and inline dump/upload logic directly into the workflow YAML, removing duplication between CI and local usage |
| 6 | Five shell scripts removed: `postgres-backup.sh`, `backup-notify.sh`, `postgres-restore.sh`, `rds-snapshot.sh`, `wal-archive.sh`, `make-scripts-exec.sh`; docs (`backup-README.md`, `SECRETS.md`) and a broken `package.json` npm alias (`run-stress-test.sh`, pointing at a non-existent file) cleaned up to match |
| 7 | Workflow updated so S3 upload is optional — job skips upload gracefully if `AWS_S3_BUCKET` / AWS credentials aren't present, instead of failing |
| 8 | S3 bucket created (`modheshwari-github-actions-s3-backup`, ap-south-1, General purpose, Block Public Access on, versioning enabled, SSE-S3) |
| 9 | Custom least-privilege IAM policy (`s3:PutObject` on the bucket) created and attached to the AWS identity used by the workflow |
| 10 | GitHub Actions secrets configured: `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `DATABASE_URL` |

---

## 3. Root Cause

Two independent issues combined to cause the failure:

1. **No database connection configured for the job.** The workflow/script expected `DATABASE_URL` (or discrete `PG*` vars) to be set as a secret, but it wasn't present at run time, so `pg_dump` fell back to a local Unix socket that doesn't exist on the GitHub-hosted runner.
2. **No AWS credentials configured.** Even if the dump had succeeded, the notification step's CloudWatch metric publish (and, separately, any S3 upload) had no AWS auth available, so those calls would have failed too.

A secondary, structural issue was identified during investigation: backups written by a GitHub-hosted runner with no S3 (or equivalent durable) upload are **not real backups** — the runner is ephemeral and the dump file is lost when the job ends.

---

## 4. Impact

- Scheduled backup jobs were failing silently from a durability standpoint (dump created, if at all, only on ephemeral CI storage).
- No actual data loss occurred — this affected the backup *pipeline*, not the production database itself.
- Backup coverage was effectively zero for the period this went undetected.

---

## 5. Resolution

- **Architecture change:** Backup logic moved out of standalone shell scripts and inlined directly into `postgres-backup.yml`, removing duplicate code paths between CI and local/manual use.
- **Graceful degradation:** Workflow now skips S3 upload (rather than failing) when bucket/credentials aren't present, so local dump creation can still succeed independently for testing.
- **Durable storage added:** New S3 bucket `modheshwari-github-actions-s3-backup` created specifically for this purpose, with public access blocked and versioning enabled.
- **Least-privilege IAM:** Custom policy scoped to `s3:PutObject` (and optionally `s3:ListBucket`) on the single backup bucket, rather than using a broad managed policy like `AmazonS3FullAccess`.
- **Secrets configured:** `DATABASE_URL`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` set in GitHub Actions repository secrets.

---

## 6. Follow-up / Open Items

- [ ] Confirm a scheduled run succeeds end-to-end (dump created + uploaded to S3) after secret configuration.
- [ ] Consider migrating from long-lived `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` to GitHub Actions OIDC + an assumed IAM role, to avoid storing static AWS keys.
- [ ] `AWS_REGION` is currently passed into the workflow but unused — either wire it in or remove it to avoid confusion.
- [ ] Set an S3 lifecycle policy on `modheshwari-github-actions-s3-backup` to control retention/cost of accumulating dumps.
- [ ] Verify the `CloudWatch metric: Modheshwari/Backups/BackupSuccess` publish works now that AWS credentials are present, since this depends on `cloudwatch:PutMetricData` permission not yet confirmed as attached.

---

## 7. Lessons Learned

- Backup jobs should fail fast and loudly when required connection secrets are missing, rather than falling through to a misleading local-socket default.
- Consolidating backup logic into a single YAML-defined workflow (vs. shell scripts called from CI) reduced duplicated logic and dangling references across docs/scripts.
- "It ran without error" is not sufficient validation for a backup job — durability of the *output* (i.e., confirming the dump lands somewhere off-host) needs to be part of the success criteria going forward.