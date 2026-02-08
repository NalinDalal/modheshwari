# AWS Deployment Guide

This repo is a Bun-based backend (`apps/be`) and a Next.js frontend (`apps/web`) with a PostgreSQL database (Prisma). Below is a pragmatic AWS setup using containers.

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
