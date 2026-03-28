# VM Deployment Guide

Simple deployment using Docker Compose on a single VM.

## Prerequisites

1. **VM** (AWS EC2, DigitalOcean, etc.)
   - Ubuntu 20.04+ recommended
   - At least 4GB RAM (8GB+ recommended for Kafka)

2. **Domain** (optional)
   - Point A record to your VM's IP

## VM Setup

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. Install Docker Compose

```bash
sudo apt update
sudo apt install docker-compose
```

### 3. Clone Repository

```bash
git clone https://github.com/your-repo/modheshwari.git ~/modheshwari
cd ~/modheshwari
```

### 4. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Required variables in .env:**

```env
# Database
DATABASE_URL=postgresql://user:password@db:5432/dbname

# JWT Secret (generate with: bunx node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-secret-key

# App URLs
APP_URL=http://your-domain.com
API_URL=http://your-domain.com
NEXT_PUBLIC_API_BASE_URL=http://your-domain.com

# Redis
REDIS_URL=redis://redis:6379

# Kafka
KAFKA_BROKERS=kafka:9092
```

### 5. Open Firewall Ports

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## Deployment

### Option 1: Manual Deploy

```bash
cd ~/modheshwari
docker-compose --env-file .env up -d --build
```

### Option 2: GitHub Actions (Recommended)

1. **Add GitHub Secrets:**
   - `HOST` - VM IP
   - `USER` - SSH user (`ubuntu`)
   - `SSH_KEY` - Private SSH key

2. **Push to main** - deployment triggers automatically!

## Services

| Port | Service     | URL                 |
| ---- | ----------- | ------------------- |
| 3000 | Next.js Web | `http://VM_IP:3000` |
| 3001 | Backend API | `http://VM_IP:3001` |
| 3002 | WebSocket   | `http://VM_IP:3002` |
| 6379 | Redis       | (internal)          |
| 9092 | Kafka       | (internal)          |
| 8080 | Kafka UI    | `http://VM_IP:8080` |

## Production Tips

### Using Nginx Reverse Proxy

```bash
sudo apt install nginx

sudo nano /etc/nginx/sites-available/modheshwari
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }

    location /ws {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/modheshwari /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Database Migrations

```bash
docker-compose --env-file .env exec be bunx prisma migrate deploy
```

### Logs

```bash
docker-compose logs -f be
docker-compose logs -f web
docker-compose logs -f ws
```

## Required Secrets

| Variable                   | Description           | Example                             |
| -------------------------- | --------------------- | ----------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection | `postgresql://user:pass@db:5432/db` |
| `JWT_SECRET`               | Token signing key     | (32+ char hex)                      |
| `REDIS_URL`                | Redis connection      | `redis://redis:6379`                |
| `KAFKA_BROKERS`            | Kafka brokers         | `kafka:9092`                        |
| `APP_URL`                  | Your app URL          | `http://yourdomain.com`             |
| `NEXT_PUBLIC_API_BASE_URL` | API URL               | `http://yourdomain.com`             |
| `CORS_ORIGIN`              | Allowed origins       | `http://yourdomain.com`             |

### Optional (for notifications)

- `EMAIL_PROVIDER` - smtp/sendgrid/ses
- `SMTP_*` - SMTP settings
- `SENDGRID_API_KEY` - SendGrid API key
- `FIREBASE_*` - Firebase for push notifications
- `RAZORPAY_*` - Payment gateway

## Troubleshooting

**Container won't start:**

```bash
docker-compose logs <service-name>
```

**Restart a service:**

```bash
docker-compose restart be
```

**Check running containers:**

```bash
docker-compose ps
```

**Rebuild without cache:**

```bash
docker-compose build --no-cache
docker-compose up -d
```
