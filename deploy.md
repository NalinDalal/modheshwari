# AWS Deployment (ECR + ECS Fargate)

This document explains the minimal steps to deploy this repository to AWS using Amazon ECR and Amazon ECS (Fargate).

## What this repo provides
- A GitHub Actions workflow (`.github/workflows/cd.yml`) that builds a Docker image, pushes it to ECR, registers an ECS task definition, and updates the ECS service.
- A task definition template: `.github/ecs/taskdef-template.json` used by the workflow.

## Required AWS resources
1. ECR repository
2. ECS cluster (Fargate)
3. ECS service using Fargate with a task definition family matching `ECS_TASK_FAMILY`
4. IAM roles:
   - `ecsTaskExecutionRole` (managed policy `AmazonECSTaskExecutionRolePolicy`)
   - Task role for your application (optional but recommended)
5. (Optional) ALB + Target Group + Security Group for HTTP traffic
6. CloudWatch Logs group (the task template writes to `/ecs/<family>`)

## GitHub Secrets to create
- `AWS_ACCESS_KEY_ID` — IAM user or role for GitHub Actions
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` — e.g. `us-east-1`
- `ECR_REGISTRY` — e.g. `123456789012.dkr.ecr.us-east-1.amazonaws.com`
- `ECR_REPOSITORY` — e.g. `my-app`
- `ECS_CLUSTER` — ECS cluster name
- `ECS_SERVICE` — ECS service name
- `ECS_TASK_EXECUTION_ROLE_ARN` — execution role ARN (for `executionRoleArn`)
- `ECS_TASK_ROLE_ARN` — task role ARN (for `taskRoleArn`)
- `ECS_TASK_FAMILY` — task family name used in the template

## Minimal IAM policy for CI (attach to the GitHub Actions IAM user)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect":"Allow","Action":["ecr:GetAuthorizationToken","ecr:BatchCheckLayerAvailability","ecr:CompleteLayerUpload","ecr:UploadLayerPart","ecr:InitiateLayerUpload","ecr:PutImage","ecr:GetDownloadUrlForLayer"],"Resource":"*"},
    {"Effect":"Allow","Action":["ecs:RegisterTaskDefinition","ecs:UpdateService","ecs:DescribeServices","ecs:DescribeTaskDefinition"],"Resource":"*"},
    {"Effect":"Allow","Action":["iam:PassRole"],"Resource":"arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole"},
    {"Effect":"Allow","Action":["logs:CreateLogStream","logs:PutLogEvents","logs:CreateLogGroup"],"Resource":"*"}
  ]
}
```

## How the workflow works
1. On push to `main`/`master`, the workflow builds the Docker image and pushes two tags: the SHA and `latest`.
2. It installs `jq` and uses `.github/ecs/taskdef-template.json`, replaces the image, family and role ARNs, registers the task definition, and updates the ECS service to the new task definition.

## Manual testing / console steps
1. Build and push a test image locally:
```bash
docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:sha .
docker push $ECR_REGISTRY/$ECR_REPOSITORY:sha
```
2. Prepare a filled `taskdef.json` (example using `jq`):
```bash
IMAGE="$ECR_REGISTRY/$ECR_REPOSITORY:sha"
jq --arg image "$IMAGE" --arg execRole "$ECS_TASK_EXECUTION_ROLE_ARN" --arg taskRole "$ECS_TASK_ROLE_ARN" --arg family "$ECS_TASK_FAMILY" '.containerDefinitions[0].image=$image | .executionRoleArn=$execRole | .taskRoleArn=$taskRole | .family=$family' .github/ecs/taskdef-template.json > taskdef.json

aws ecs register-task-definition --cli-input-json file://taskdef.json --region $AWS_REGION
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --task-definition <returned-arn-or-family:revision> --force-new-deployment --region $AWS_REGION
```

## AWS Console quick steps
1. Create an ECR repository: ECR → Repositories → Create repository → name = `ECR_REPOSITORY`.
2. Create ECS cluster: ECS → Clusters → Create cluster → choose `Networking only (Powered by AWS Fargate)`.
3. Create IAM roles:
   - `ecsTaskExecutionRole`: attach managed policy `AmazonECSTaskExecutionRolePolicy`.
   - Optional task role: allow access to other AWS services your app needs.
4. Create log group: CloudWatch Logs → Create log group `/ecs/<family>`.
5. Create an ECS service pointing at a Fargate task definition (you can create a placeholder task definition first) and configure load balancer if needed.

## Next steps I can do for you
- Run a dry-run deploy and help fix any permission issues.
- Add health checks / ALB integration to the task template.
- Add secrets encryption via GitHub Actions OIDC (remove long-lived keys).

# AWS Deployment Guide

## Architecture

- Frontend: ECS Fargate service (Node 20) behind an Application Load Balancer (ALB)
- Backend: ECS Fargate service (Bun 1.2) behind the same ALB (path-based routing `/api/*`)
- Backend: ECS Fargate service (Bun 1.2) behind the same ALB (path-based routing `/api/*`)
- Real-time & Messaging: separate services for WebSocket server and background workers; infrastructure includes Kafka (AWS MSK or self-hosted) and Redis (ElastiCache)
- Database: Amazon RDS PostgreSQL
- CDN (optional): CloudFront in front of the frontend ALB for global caching
- Secrets: AWS Systems Manager Parameter Store or AWS Secrets Manager

## Prereqs

- AWS account with access to create VPC, ECS, ALB, RDS, ECR
- Domain in Route 53 (optional)
- Docker installed locally
- AWS CLI configured (`aws configure`)

## 1) Build & Push Images to ECR

Create two ECR repos: `modheshwari-web` and `modheshwari-be`.

```bash
# Create ECR repositories
aws ecr create-repository --repository-name modheshwari-web
aws ecr create-repository --repository-name modheshwari-be

# Get account and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
WEB_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/modheshwari-web"
BE_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/modheshwari-be"

# Login to ECR
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build images
docker build -t modheshwari-web -f apps/web/Dockerfile .
docker build -t modheshwari-be -f apps/be/Dockerfile .

# Tag & push
docker tag modheshwari-web:latest "$WEB_REPO:latest"
docker tag modheshwari-be:latest "$BE_REPO:latest"

docker push "$WEB_REPO:latest"
docker push "$BE_REPO:latest"

# Also push worker and ws images if you build them separately
docker build -t modheshwari-ws -f apps/ws/Dockerfile . || true
docker tag modheshwari-ws:latest "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/modheshwari-ws:latest" || true
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/modheshwari-ws:latest" || true
```

## 2) Create RDS PostgreSQL

- Choose PostgreSQL 14+ (small instance like `db.t4g.micro` is fine initially)
- Place RDS in private subnets in your VPC
- Security groups: allow inbound 5432 from the ECS tasks' SG only
- Note the connection string: `postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public`

## 3) Migrate the Database (Prisma)

Run migrations once (as a one-off task or locally with access to RDS):

```bash
# Ensure DATABASE_URL is set to your RDS connection string
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"

# Install deps then deploy migrations
npm install
npx prisma migrate deploy --schema packages/db/schema.prisma
```

Optionally seed:

```bash
# If you have seed data
bun run packages/db/seed.ts
```

## 4) Create ECS Cluster + Services

- Create an ECS cluster in your VPC subnets
- Create an ALB with listeners on 80/443 and attach to ECS services

### Messaging & Real-time infrastructure

- **Kafka**: used for reliable notification routing and worker coordination. Use AWS MSK or a self-managed Kafka cluster. Provide `KAFKA_BROKERS` (comma-separated), `KAFKA_CLIENT_ID` and any TLS/auth configs to your tasks.
- **Redis**: used for pub/sub (in-app realtime) and optional fan-out caching. Use ElastiCache Redis (cluster or single node) and provide `REDIS_URL` to services.

You will typically run the following additional ECS tasks/services:

- **WebSocket service (`apps/ws`)**: listens for WS upgrades (separate port, e.g. `WS_PORT=3002`) and subscribes to Redis channels for in-app delivery.
- **Worker services**: background consumers for Kafka topics (router, in-app worker, email/push/sms workers, fanout worker). These can run as long-running ECS services or as scheduled tasks.

Ensure security groups allow ECS tasks to reach Kafka brokers and Redis endpoints.

Create two services:

### Backend service

- Task definition using image: `modheshwari-be` (ECR URI)
- CPU/Memory: `0.25 vCPU / 512MB` to start
- Port: 3001
- Env vars:
  - `PORT=3001`
  - `DATABASE_URL=postgresql://...` (RDS)
  - `JWT_SECRET=...` (choose a strong secret)
  - `CORS_ORIGIN=https://your-domain` (matches frontend’s origin)
  - `REDIS_URL=redis://...` (ElastiCache endpoint)
  - `KAFKA_BROKERS=broker1:9092,broker2:9092` (or MSK connection string)
  - `NOTIFICATION_CACHE=true|false` (optional — enables Redis caching for fan-out)
  - `NOTIFICATION_CACHE_TTL_SECONDS=604800` (TTL for cached notifications, default 7 days)
  - `NOTIFICATION_PREVIEW_TTL_SECONDS=60` (TTL for preview dedupe keys, default 60s)
- ALB Target Group: path-based routing `/*` under `/api/*`
  - Rule: `Path = /api/*` → forward to backend TG

### Frontend service

- Task definition using image: `modheshwari-web`
- CPU/Memory: `0.25 vCPU / 512MB` to start
- Port: 3000
- Env vars:
  - `NEXT_PUBLIC_API_URL=https://your-domain/api` (must point to backend route)
  - `NEXT_PUBLIC_API_BASE_URL=https://your-domain/api` (some clients use this env name)
- ALB Target Group: default rule forwards `/*` to frontend TG

### Listener rules example

- `/*` → Frontend TG
- `/api/*` → Backend TG
 - `/ws/*` or a dedicated subdomain (recommended) → WebSocket TG (if you proxy WS through ALB)

## 5) Domain & TLS

- In Route 53, create `A` record for your domain pointing to the ALB
- Use AWS Certificate Manager to issue an SSL cert for your domain
- Attach the cert to the ALB’s 443 listener; redirect 80→443

## 6) CORS Configuration

We updated backend CORS to read `CORS_ORIGIN`. Set it to your HTTPS domain:

- Backend env: `CORS_ORIGIN=https://app.yourdomain.com`

## 6.1) WebSocket Auth Note

- The WebSocket server no longer accepts JWTs via the `?token=` query string (this was a dev convenience). Browser clients should perform an auth handshake immediately after opening the socket by sending a JSON message:

```json
{ "type": "auth", "token": "<JWT>" }
```

- For production, prefer setting an HttpOnly, secure cookie on login so the server can validate tokens during the upgrade. The server also supports Authorization header for non-browser clients.

## 7) Health Checks

- Backend: `/api/health` (GET)
- Frontend: `/` (GET) or `/api/health` proxied

## 8) CI/CD (Optional)

Use GitHub Actions to build/push on commit, then update the ECS service:

- Build, tag, and push to ECR
- Run `aws ecs update-service --force-new-deployment` for web/be

Also include worker and ws images in your CI pipeline and update their ECS services similarly.

Sample job matrix:

- `build:web` → push `modheshwari-web`
- `build:be` → push `modheshwari-be`
- `build:ws` → push `modheshwari-ws`
- `deploy:ecs` → update services (web, be, ws, workers)

## 9) Cost & Scaling

- Start with 1 task each; add autoscaling based on CPU/Memory
- RDS: enable storage autoscaling; set backups
- CloudFront (optional) reduces latency/cost for static assets

## 10) Troubleshooting

- 4xx on API: confirm ALB listener rules and `NEXT_PUBLIC_API_URL`
- CORS errors: ensure `CORS_ORIGIN` matches the frontend URL exactly
- DB errors: verify `DATABASE_URL` and SG rules allow ECS → RDS traffic

## Alternative: Amplify for Frontend

If you prefer managed hosting for Next.js:

- Use AWS Amplify Hosting for `apps/web` (supports SSR)
- Keep backend on ECS/RDS
- Set `NEXT_PUBLIC_API_URL` to the backend load balancer URL

## Summary

- Build images with provided Dockerfiles
- Provision RDS and run Prisma migrations
- Deploy ECS services behind a single ALB with path routing
- Set critical env vars: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`

## 11) Regular Backups & Restore

Goals
- Ensure recoverability from data loss, corruption, or accidental deletion.
- Keep backups encrypted, retained according to policy, and tested for restores.

Strategy (recommended)
- Use RDS automated backups + snapshots for point-in-time recovery (PITR); set retention (e.g. 7–30 days) in the RDS console.
- Maintain application-level logical backups (pg_dump) uploaded to an S3 bucket with lifecycle rules (transition to IA/Glacier and expire after retention period).
- Keep S3 lifecycle rules to handle pruning; avoid ad-hoc deletion scripts unless required.
- Run periodic backup jobs (daily) as a scheduled task: choices
  - GitHub Actions scheduled workflow (simple, uses OIDC to assume a role)
  - AWS EventBridge → Lambda or ECS Scheduled Task (Fargate)

Quick checklist
- Enable RDS automated backups and set backup window and retention.
- Create an S3 bucket (e.g. `modheshwari-backups`) and add a lifecycle policy to expire backups older than N days.
- Create an IAM role/user for backup jobs with the minimal policy (see example below).
- Schedule backups daily and test restores monthly.

Sample pg_dump → S3 backup script (`scripts/backup-postgres-to-s3.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail

# Required env vars: DATABASE_URL (or PG_*), S3_BUCKET, AWS_REGION, RETENTION_DAYS
# Example: export DATABASE_URL=postgresql://user:pass@host:5432/dbname

TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
FNAME="db-backup-${TIMESTAMP}.sql.gz"

if [ -z "${S3_BUCKET:-}" ]; then
  echo "S3_BUCKET is not set" >&2
  exit 1
fi

echo "Creating logical dump and uploading to s3://$S3_BUCKET/backups/$FNAME"

# Use pg_dump (plain SQL) piped and gzipped. If you prefer custom format use -Fc and pg_restore.
pg_dump "$DATABASE_URL" | gzip > "/tmp/$FNAME"

aws s3 cp "/tmp/$FNAME" "s3://$S3_BUCKET/backups/$FNAME" --region "${AWS_REGION:-us-east-1}" --storage-class STANDARD_IA
rm -f "/tmp/$FNAME"

echo "Backup uploaded. Consider using S3 lifecycle rules to expire old backups."

exit 0
```

Restore example (plain SQL dump)
```bash
# Download the backup from S3 and restore
aws s3 cp s3://$S3_BUCKET/backups/db-backup-20250101T000000Z.sql.gz - | gunzip | psql "$DATABASE_URL"
```

IAM policy for backup job (minimal)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect":"Allow","Action":["s3:PutObject","s3:GetObject","s3:ListBucket","s3:DeleteObject"],"Resource":["arn:aws:s3:::modheshwari-backups","arn:aws:s3:::modheshwari-backups/*"]},
    {"Effect":"Allow","Action":["rds:DescribeDBInstances","rds:DescribeDBSnapshots"],"Resource":"*"},
    {"Effect":"Allow","Action":["logs:CreateLogStream","logs:PutLogEvents"],"Resource":"*"}
  ]
}
```

Notes & operational practices
- Prefer S3 lifecycle rules for retention instead of custom prune scripts — simpler and robust.
- Encrypt backups at rest: enable default S3 bucket encryption (SSE-S3 or SSE-KMS). If using KMS, ensure the backup role can use the key.
- Test restores regularly (monthly): spin up a temporary RDS instance or restore into a staging database to validate backups.
- For large DBs consider logical incremental strategies (pg_dump is full dump) or use physical snapshotting and AWS snapshot export.
- Consider storing backup metadata (manifest with file names, checksum, timestamps) in a small DynamoDB table or a JSON file in S3 for auditing.

Automation options
- GitHub Actions (scheduled): simple to add if you already use Actions. Use OIDC to assume an IAM role and run the script above.
- AWS EventBridge + Lambda/ECS Scheduled Task: keep backups inside AWS, lower latency to RDS, no external credentials required.

Example S3 lifecycle rule (console): transition to STANDARD_IA after 7 days, expire after 30 days.

Where to put the script
- Add `scripts/backup-postgres-to-s3.sh` and make it executable. Place a small README explaining required env vars and secrets.

Restore & Recovery runbook (short)
1. Identify the backup (S3 key) for the required timestamp.
2. Restore to staging RDS: create a new RDS instance or restore snapshot (if using snapshots).
3. Run smoke-tests against staging to validate application behavior.
4. Promote restored DB to production (follow your traffic-cutover plan) or export necessary data and apply to prod carefully.

