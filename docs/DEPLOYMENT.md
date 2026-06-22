# Deployment Guide

> How to deploy HazardMap to a production server.

---

## Prerequisites

- Linux server (Ubuntu 22.04 LTS recommended)
- Docker Engine 24+ and Docker Compose v2+
- 4GB RAM minimum (8GB recommended)
- 20GB disk space
- Domain name (for SSL)

---

## Server Setup

### 1. Install Docker

```bash
# Ubuntu
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone the Repository

```bash
git clone https://github.com/akrlabcoral/hazardMapLS.git
cd hazardMapLS
git checkout main
```

### 3. Configure Environment

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit .env with production values
nano .env
```

**Required changes:**
```bash
# .env
POSTGRES_PASSWORD=your_strong_password_here

# backend/.env
DATABASE_URL=postgresql://hazardmap:your_strong_password_here@db:5432/hazardmap
ENV=production
CORS_ORIGINS=https://your-domain.com

# frontend/.env.local
VITE_BACKEND_URL=https://your-domain.com/api
VITE_ML_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com/api/ws/live
```

### 4. Deploy

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 5. Verify

```bash
docker-compose ps
# All containers should show "Up"

curl https://your-domain.com/api/health
# Should return {"status":"ok"}
```

---

## SSL / HTTPS

Use a reverse proxy (nginx or Caddy) with Let's Encrypt:

```nginx
# /etc/nginx/sites-available/hazardmap
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }
}
```

---

## Monitoring

### Docker Health Checks

```bash
# View logs
docker-compose logs -f backend

# Check resource usage
docker stats

# Restart a service
docker-compose restart backend
```

### Database Backup

```bash
# Backup
docker-compose exec db pg_dump -U hazardmap hazardmap > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20250622.sql | docker-compose exec -T db psql -U hazardmap hazardmap
```

---

## Updating

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 504 Gateway Timeout | Increase nginx `proxy_read_timeout`; check backend logs |
| Database connection refused | Verify `DATABASE_URL` in `backend/.env` |
| Frontend shows blank page | Check `VITE_BACKEND_URL` points to correct domain |
| WebSocket fails | Ensure WSS (not WS) is used with HTTPS |

---

*For local development, see `CONTRIBUTING.md`.*
