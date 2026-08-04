# Deployment Learnings — August 4, 2026

Real deployment session notes from deploying Modheshwari to AWS EC2.

---

## What We Deployed

- **App:** Modheshwari — community management platform
- **Stack:** Next.js frontend + Elysia backend + WebSocket server + Kafka + Redis + Postgres
- **Infrastructure:** AWS EC2 `t3.medium` (4GB RAM, ap-south-1 Mumbai)
- **Database:** Neon hosted PostgreSQL (ap-southeast-1 Singapore)
- **Domain:** modheshwari.nerdev.in (Cloudflare DNS)
- **SSL:** Let's Encrypt via Certbot

---

## Timeline of Issues & Fixes

### 1. Docker Build Context Was 83MB (21 min transfer)

**Problem:** `.dockerignore` wasn't excluding enough. Build context was 83MB, taking 21 minutes just to transfer to Docker daemon.

**Root cause:** `apps/web/node_modules/` was 105MB and not being excluded properly.

**Fix:** Updated `.dockerignore` with explicit `**/` glob patterns:
```dockerignore
**/node_modules
**/.next
**/dist
**/build
.git
.env
.env*.local
**/.turbo
tests
scripts
infra
monitoring
*.md
*.yaml
*.yml
nginx.conf
.vscode
.idea
*.log
coverage
.github
```

**Result:** Context dropped to 16KB. Transfer time: <1 second.

**Lesson:** Always use `**/` prefix for recursive exclusion in `.dockerignore`.

---

### 2. `.dockerignore` Excluded `turbo.json`

**Problem:** Build failed with `Could not find turbo.json or turbo.jsonc`.

**Root cause:** EC2 had a different `.dockerignore` that listed `turbo.json`, `tsconfig.json`, `eslint.config.js`, and `.dockerignore` itself as exclusions.

**Fix:** Removed those entries. The Dockerfile needs:
- `turbo.json` — for `bunx turbo run build`
- `tsconfig.json` — TypeScript config
- `package.json`, `bun.lock` — for `bun install`
- `packages/db/schema.prisma` — for `prisma generate`

**Lesson:** Never exclude files the Dockerfile's `COPY` or build steps need. Test with `docker compose build` and check "transferring context" size.

---

### 3. OOM Kill on `t2.micro`

**Problem:** Docker build killed with `signal: killed` after 900+ seconds.

**Root cause:** `t2.micro` has only 1GB RAM. Building Bun + Next.js + native modules (bcrypt, esbuild, tree-sitter) needs 2-3GB peak.

**Fix:** Upgraded to `t3.medium` (4GB RAM) via EC2 console:
1. Stop instance
2. Change Instance Type → t3.medium
3. Start instance

**Lesson:** Minimum for this project: `t3.medium`. For production with Kafka: `t3.medium` or `t3.large`.

---

### 4. EC2 Public IP Changed After Instance Type Change

**Problem:** SSH couldn't connect after upgrading instance type.

**Root cause:** Public IP changes on stop/start (unless using Elastic IP).

**Fix:** Updated GitHub Actions `deploy.yml` HOST secret with new IP (3.111.41.101).

**Lesson:** Always use Elastic IP for production instances if IP stability matters.

---

### 5. Disk Full During Build

**Problem:** `no space left on device` during `exporting layers` step.

**Root cause:** 19GB volume + Docker images + build cache = full. `node_modules` with prebuilt binaries (tree-sitter, esbuild) is massive.

**Fix:** 
1. Expanded EBS volume from 19GB → 30GB
2. Ran `sudo growpart /dev/nvme0n1 1 && sudo resize2fs /dev/nvme0n1p1`
3. Cleaned with `docker system prune -a --volumes -f`

**Lesson:** Use 30GB+ gp3 volume. Build services sequentially if disk is tight:
```bash
docker compose --env-file .env build be
docker compose --env-file .env build ws
docker compose --env-file .env build web
docker compose --env-file .env up -d
```

---

### 6. Missing `JWT_REFRESH_SECRET` in `.env`

**Problem:** `be` and `ws` containers crashing with `Missing JWT_REFRESH_SECRET`.

**Root cause:** EC2 `.env` was missing `JWT_REFRESH_SECRET` and had wrong service URLs (`localhost` instead of Docker service names).

**Fix:** Synced `.env` from local (which had correct values):
- `REDIS_URL=redis://redis:6379` (not `localhost`)
- `KAFKA_BROKER=kafka:9092` (not `localhost`)
- Added `JWT_REFRESH_SECRET`

**Lesson:** In Docker, services communicate via service names (`redis`, `kafka`, `be`), not `localhost`.

---

### 7. Nginx Cached Old Backend IP

**Problem:** `502 Bad Gateway` from nginx, but `curl http://localhost:3001/api/health` worked.

**Root cause:** Nginx container cached the old backend container IP (172.18.0.4 vs 172.18.0.8).

**Fix:** `docker compose restart nginx`

**Lesson:** Always restart nginx after rebuilding backend containers.

---

### 8. Port 80 Not Accessible from Browser

**Problem:** `curl localhost` worked but browser timed out.

**Root cause:** EC2 security group didn't have HTTP (port 80) inbound rule.

**Fix:** Added inbound rule:
| Type | Port | Source |
|------|------|--------|
| HTTP | 80 | 0.0.0.0/0 |

**Lesson:** Security group changes are instant. Also check if the security group is attached to the correct instance (new instance after type change = new security group).

---

### 9. Setting Up SSL with Certbot + Docker Nginx

**Problem:** Docker nginx container uses port 80, but certbot needs port 80 for HTTP challenge.

**Fix:**
```bash
# 1. Stop Docker nginx
docker compose stop nginx

# 2. Get certificate (standalone mode)
sudo certbot certonly --standalone -d modheshwari.nerdev.in

# 3. Start Docker nginx
docker compose start nginx

# 4. Update nginx.conf with SSL config
# 5. Mount certs into container
# 6. Add port 443 to docker-compose.yml
```

**Nginx SSL config:**
```nginx
server {
    listen 80;
    server_name modheshwari.nerdev.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name modheshwari.nerdev.in;
    ssl_certificate /etc/letsencrypt/live/modheshwari.nerdev.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/modheshwari.nerdev.in/privkey.pem;
    # ... proxy_pass rules
}
```

**docker-compose.yml nginx changes:**
```yaml
nginx:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

**Auto-renewal:**
```bash
echo '0 12 * * * /usr/bin/certbot renew --quiet --post-hook "cd /home/ubuntu/modheshwari && docker compose restart nginx"' | sudo crontab -
```

---

### 10. Cloudflare DNS Setup

**DNS record:**
| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | modheshwari | 3.111.41.101 | Proxied |

**Security group needed:**
| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

---

## Final Architecture

```
Browser → Cloudflare (HTTPS) → EC2:443 → Nginx (SSL termination)
                                           ├→ /api/* → be:3001
                                           ├→ /ws → ws:3002
                                           └→ /* → web:3000

be → Neon PostgreSQL (ap-southeast-1)
be → Redis (redis:6379)
be → Kafka (kafka:9092)
ws → Redis + Kafka
```

---

## Quick Reference Commands

```bash
# Build and deploy
docker compose --env-file .env up -d --build

# Build sequentially (if disk is tight)
docker compose --env-file .env build be
docker compose --env-file .env build ws
docker compose --env-file .env build web
docker compose --env-file .env up -d

# Check status
docker compose ps
docker compose logs --tail=20

# Restart specific service
docker compose restart nginx

# Run migrations
docker compose exec be bunx prisma migrate deploy --schema packages/db/schema.prisma

# Clean up
docker system prune -a --volumes -f
df -h /

# SSL renewal
sudo certbot renew
```

---

## Files Modified During Deployment

| File | Change |
|------|--------|
| `.dockerignore` | Added recursive exclusions, removed turbo.json etc. |
| `Dockerfile` | Added `# syntax=docker/dockerfile:1`, bun cache mount |
| `docker-compose.yml` | Added port 443, cert volume mount for nginx |
| `nginx.conf` | Added SSL server block, HTTP→HTTPS redirect |
| `apps/web/app/medical/page.tsx` | Removed unused `logout` |
| `apps/web/app/notifications/page.tsx` | Removed unused `apiFetch`, `Me`, `userLoading` |
| `apps/web/app/resources/page.tsx` | Removed unused `useCallback`, `Me` |
| `deploy.md` | Added lessons learned section |
