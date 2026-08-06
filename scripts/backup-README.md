Postgres Backup & Restore

The Postgres backup logic now lives directly in [.github/workflows/postgres-backup.yml](../.github/workflows/postgres-backup.yml). Trigger it from GitHub Actions and configure `DATABASE_URL` for the database connection. Add `AWS_S3_BUCKET` plus AWS credentials only if you want the job to upload the dump to S3.

To restore a dump manually, use `pg_restore` directly:

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" backups/db-20260101T120000Z.dump
```

For large databases, prefer provider-native snapshots or application-level backup tooling that fits your infrastructure. Keep credentials out of the repo and use CI secrets or a secret manager.
