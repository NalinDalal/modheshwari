# Deployment Guide - Modheshwari App

Complete deployment instructions for AWS EC2 with GitHub Actions CI/CD.

---

## Architecture

**Detected Stack:**

- **Frontend:** Next.js 15 (React 19) - Port 3000
- **Backend:** Elysia + Bun - Port 3001
- **WebSocket:** Bun + ws - Port 3002
- **Database:** PostgreSQL 15 - Port 5432
- **Cache:** Redis 7 - Port 6379
- **Message Queue:** Kafka - Port 9092
- **Build Tool:** Turbo monorepo
- **Runtime:** Bun 1.x

---

## Prerequisites

| Item        | Requirement            |
| ----------- | ---------------------- |
| VM          | AWS EC2 Ubuntu 22.04   |
| RAM         | 4GB+ (8GB with Kafka)  |
| Storage     | 30GB+                  |
| Domain      | Optional (recommended) |
| GitHub Repo | Your forked repo       |

---

## AWS EC2 Setup

### 1. Launch Instance

1. **AWS Console → EC2 → Launch Instance**
2. **Name:** modheshwari-prod
3. **AMI:** Ubuntu 22.04 LTS
4. **Instance Type:**
   - Without Kafka: `t3.small` (2GB RAM, ~$15/month)
   - With Kafka: `t3.medium` (4GB RAM, ~$30/month)
5. **Key Pair:** Create new or use existing (ec2-modheshwari.pem)
6. **Storage:** 30GB gp3

### 2. Security Group

Create/modify security group with these **Inbound Rules:**

| Type       | Port | Source     | Description    |
| ---------- | ---- | ---------- | -------------- |
| SSH        | 22   | Your IP/32 | SSH access     |
| HTTP       | 80   | 0.0.0.0/0  | Nginx          |
| HTTPS      | 443  | 0.0.0.0/0  | SSL (optional) |
| Custom TCP | 3000 | 0.0.0.0/0  | Next.js Web    |
| Custom TCP | 3001 | 0.0.0.0/0  | Backend API    |
| Custom TCP | 3002 | 0.0.0.0/0  | WebSocket      |

### 3. Get Public IP

Note your instance public IP (e.g., `13.203.102.177`)

---

## Local Setup (One Time)

### 1. Generate JWT Secret

```bash
# On your local machine
openssl rand -base64 32
```

Copy the output - you'll need it for .env

### 2. Create GitHub Secrets

Go to **GitHub → Repo → Settings → Secrets → Actions**

Add these secrets:

| Secret    | Value               | Example              |
| --------- | ------------------- | -------------------- |
| `HOST`    | VM Public IP        | `13.203.102.177`     |
| `USER`    | SSH username        | `ubuntu`             |
| `SSH_KEY` | Private key content | (paste .pem content) |

### 3. Add SSH Key to VM

```bash
# Copy public key to VM
ssh ubuntu@YOUR_VM_IP "echo 'YOUR_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
```

Or in VM:

```bash
sudo nano ~/.ssh/authorized_keys
# Paste your public key
```

---

## VM Setup (First Time Only)

### 1. Connect to VM

```bash
chmod 400 /path/to/ec2-modheshwari.pem
ssh -i /path/to/ec2-modheshwari.pem ubuntu@YOUR_VM_IP
```

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt update
sudo apt install docker-compose git nginx -y
```

### 3. Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/modheshwari.git
cd modheshwari
```

### 4. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Edit required variables:**

```env
# ============================================
# CORE (Required)
# ============================================

# Database - uses docker service name "db"
DATABASE_URL=postgresql://modheshwari:changeme@db:5432/modheshwari

# JWT Secret - generate with: openssl rand -base64 32
JWT_SECRET=YOUR_GENERATED_SECRET_HERE

# Redis - uses docker service name "redis"
REDIS_URL=redis://redis:6379

# Kafka - uses docker service name "kafka" (skip if not using Kafka)
KAFKA_BROKERS=kafka:9092

# App URLs - replace with your VM IP or domain
APP_URL=http://YOUR_VM_IP:3000
API_URL=http://YOUR_VM_IP:3001
NEXT_PUBLIC_API_BASE_URL=http://YOUR_VM_IP:3001
CORS_ORIGIN=http://YOUR_VM_IP:3000

# WebSocket
WS_PORT=3002
NODE_ENV=production

# ============================================
# OPTIONAL - Notifications
# ============================================

# Email (choose one: smtp, sendgrid, ses)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SEND_FROM_EMAIL=noreply@yourdomain.com

# Or SendGrid:
# EMAIL_PROVIDER=sendgrid
# SENDGRID_API_KEY=your-sendgrid-key

# Push Notifications (Firebase)
# FIREBASE_PROJECT_ID=your-project
# FIREBASE_PRIVATE_KEY=your-private-key
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# ============================================
# OPTIONAL - Payments
# ============================================

# Razorpay (India)
# RAZORPAY_KEY_ID=your-key-id
# RAZORPAY_KEY_SECRET=your-key-secret
```

Save: `Ctrl+X`, `Y`, `Enter`

### 5. Kafka Configuration (Optional)

If using **t3.small (1GB RAM)**, skip Kafka:

```bash
nano docker-compose.override.yml
```

```yaml
# Skip Kafka on small instances
services:
  zookeeper:
    deploy:
      resources:
        limits:
          memory: 512M
  kafka:
    deploy:
      resources:
        limits:
          memory: 1G
  kafka-ui:
    # Don't run kafka-ui without kafka
```

### 6. Initial Database Setup

```bash
# Start database and redis first
docker-compose up -d db redis

# Wait for database to be ready
sleep 10

# Run migrations
docker-compose exec db bunx prisma migrate deploy

# Optional: Seed database
docker-compose exec db bun run db:seed
```

### 7. Deploy All Services

```bash
# Build and start all services
docker-compose --env-file .env up -d --build
```

⏳ First build takes 10-15 minutes

---

## GitHub Actions CI/CD (Auto-Deploy)

### How It Works

1. Push code to `main` branch
2. GitHub Actions runs: `bun install` → `bun run check-types` → `bun run build`
3. On success, auto-deploys to VM via SSH

### Workflow File

The workflow is at `.github/workflows/deploy.yml`:

```yaml
name: CI & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run check-types
      - run: bun run build

  deploy:
    needs: ci
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/modheshwari
            git pull
            docker-compose --env-file .env up -d --build
```

### Trigger Deployment

```bash
# Make a small change and push
git add .
git commit -m "test deployment"
git push origin main
```

---

## Service URLs

| Service     | Port | URL                               |
| ----------- | ---- | --------------------------------- |
| Next.js Web | 3000 | http://YOUR_VM_IP:3000            |
| Backend API | 3001 | http://YOUR_VM_IP:3001/api/health |
| WebSocket   | 3002 | ws://YOUR_VM_IP:3002              |
| Kafka UI    | 8080 | http://YOUR_VM_IP:8080            |

---

## Nginx Reverse Proxy (Production)

### Install & Configure

```bash
sudo nano /etc/nginx/sites-available/modheshwari
```

```nginx
upstream nextjs {
    server 127.0.0.1:3000;
}

upstream backend {
    server 127.0.0.1:3001;
}

upstream websocket {
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name YOUR_VM_IP;  # Or your domain

    # Frontend
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/modheshwari /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### URLs After Nginx

| Service   | URL                   |
| --------- | --------------------- |
| Web       | http://YOUR_VM_IP     |
| API       | http://YOUR_VM_IP/api |
| WebSocket | ws://YOUR_VM_IP/ws    |

---

## Maintenance Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f be      # Backend
docker-compose logs -f web    # Frontend
docker-compose logs -f ws     # WebSocket
docker-compose logs -f db    # Database
docker-compose logs -f redis # Redis
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart be
docker-compose restart web
```

### Update Code

```bash
# Pull latest and rebuild
git pull
docker-compose --env-file .env up -d --build
```

### Database Migrations

```bash
docker-compose exec be bunx prisma migrate deploy
docker-compose exec be bunx prisma generate
```

### Check Status

```bash
docker-compose ps
docker stats
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Common issues:
# - DATABASE_URL wrong → check .env
# - Port already in use → sudo lsof -i :3000
# - Out of memory → use smaller instance or skip Kafka
```

### Database Connection Failed

```bash
# Check if db is running
docker-compose ps db

# Check db logs
docker-compose logs db

# Wait for health check
docker-compose up -d db
sleep 15
```

### Build Fails

```bash
# Rebuild without cache
docker-compose build --no-cache

# Or clean and rebuild
docker-compose down
docker system prune -a
docker-compose up -d --build
```

### Out of Memory

If using t3.small, skip Kafka:

```bash
# Edit docker-compose.override.yml
nano docker-compose.override.yml
```

```yaml
services:
  zookeeper:
    profiles: ["full"]
  kafka:
    profiles: ["full"]
  kafka-ui:
    profiles: ["full"]
```

Then run without Kafka profiles:

```bash
docker-compose --env-file .env up -d --profile default
```

---

## Complete Quick Start Commands

```bash
# 1. SSH to VM
ssh -i ec2-modheshwari.pem ubuntu@YOUR_VM_IP

# 2. Install Docker (first time)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt update && sudo apt install docker-compose git nginx -y

# 3. Clone & configure
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/modheshwari.git
cd modheshwari
cp .env.example .env
nano .env  # Edit with your values

# 4. Deploy
docker-compose --env-file .env up -d --build

# 5. Test
curl http://localhost:3001/api/health
```

---

## Cost Estimate

| Resource               | Monthly Cost |
| ---------------------- | ------------ |
| t3.small (no Kafka)    | ~$15         |
| t3.medium (with Kafka) | ~$30         |
| t3.large (production)  | ~$60         |
| Domain (optional)      | ~$12/year    |

---

## Files Reference

| File                           | Purpose                           |
| ------------------------------ | --------------------------------- |
| `docker-compose.yml`           | All services definition           |
| `Dockerfile`                   | Multi-stage build for be, ws, web |
| `.env.example`                 | Environment template              |
| `.github/workflows/deploy.yml` | CI/CD pipeline                    |
| `deploy.md`                    | This file                         |
