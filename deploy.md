# AWS Deployment Guide

This repo is a Bun-based backend (`apps/be`) and a Next.js frontend (`apps/web`) with a PostgreSQL database (Prisma). Below is a pragmatic AWS setup using containers.

## Architecture

- Frontend: ECS Fargate service (Node 20) behind an Application Load Balancer (ALB)
- Backend: ECS Fargate service (Bun 1.2) behind the same ALB (path-based routing `/api/*`)
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
- ALB Target Group: path-based routing `/*` under `/api/*`
  - Rule: `Path = /api/*` → forward to backend TG

### Frontend service

- Task definition using image: `modheshwari-web`
- CPU/Memory: `0.25 vCPU / 512MB` to start
- Port: 3000
- Env vars:
  - `NEXT_PUBLIC_API_URL=https://your-domain/api` (must point to backend route)
- ALB Target Group: default rule forwards `/*` to frontend TG

### Listener rules example

- `/*` → Frontend TG
- `/api/*` → Backend TG

## 5) Domain & TLS

- In Route 53, create `A` record for your domain pointing to the ALB
- Use AWS Certificate Manager to issue an SSL cert for your domain
- Attach the cert to the ALB’s 443 listener; redirect 80→443

## 6) CORS Configuration

We updated backend CORS to read `CORS_ORIGIN`. Set it to your HTTPS domain:

- Backend env: `CORS_ORIGIN=https://app.yourdomain.com`

## 7) Health Checks

- Backend: `/api/health` (GET)
- Frontend: `/` (GET) or `/api/health` proxied

## 8) CI/CD (Optional)

Use GitHub Actions to build/push on commit, then update the ECS service:

- Build, tag, and push to ECR
- Run `aws ecs update-service --force-new-deployment` for web/be

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
