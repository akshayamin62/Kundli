# Deployment Guide — kundli.astrogyan.org
**Server:** Hostinger KVM 2 (Ubuntu 22.04 LTS)  
**Domain:** `kundli.astrogyan.org`  
**Backend port:** `5014` (FastAPI / Uvicorn)  
**Frontend port:** `3014` (Next.js)  
**Nginx:** reverse proxy on port 80 / 443

---

## 1. DNS — Point Subdomain to Your VPS

In Hostinger DNS panel (or wherever astrogyan.org DNS is managed):

| Type | Name   | Value              | TTL  |
|------|--------|--------------------|------|
| A    | kundli | `<YOUR_VPS_IP>`    | 300  |

> Replace `<YOUR_VPS_IP>` with the public IPv4 of your Hostinger KVM 2 VPS.  
> Wait 5–10 min for propagation before running Certbot.

---

## 2. First Login & Server Prep

```bash
# SSH into VPS as root
ssh root@<YOUR_VPS_IP>

# Update system packages
apt update && apt upgrade -y

# Install essentials
apt install -y git curl wget unzip nginx certbot python3-certbot-nginx \
               python3 python3-pip python3-venv build-essential
```

---

## 3. Install Node.js 20 (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify
node -v   # should show v20.x.x
npm -v
```

---

## 4. Install PM2 (Process Manager)

```bash
npm install -g pm2

# Auto-start PM2 on reboot
pm2 startup systemd
# Copy the command it prints and run it, e.g.:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

---

## 5. Clone Your GitHub Repo

```bash
# Create a clean app directory
mkdir -p /var/www/astrology
cd /var/www/astrology

# Clone (replace with your actual GitHub repo URL)
git clone https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git .
```

> If the repo is private, use a Personal Access Token:  
> `git clone https://<TOKEN>@github.com/<USER>/<REPO>.git .`

---

## 6. Backend Setup (FastAPI — port 5014)

### 6.1 Create Python virtual environment & install deps

```bash
cd /var/www/astrology/backend

python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### 6.2 CORS is already configured

CORS is already set correctly in `backend/app/main.py` in the repo — no manual edits needed on the server.

---

## 7. Frontend Setup (Next.js — port 3014)

### 7.1 Install dependencies & build

```bash
cd /var/www/astrology/frontend

npm install

# Build for production with correct API URL
NEXT_PUBLIC_API_URL=https://kundli.astrogyan.org npm run build
```

> The build uses the env variable at **build time** (Next.js bakes it in).  
> Always rebuild after changing `NEXT_PUBLIC_API_URL`.

---

## 8. Start Both Services with PM2

```bash
# Start backend
PYTHONPATH=/var/www/astrology/backend \
pm2 start /var/www/astrology/backend/.venv/bin/uvicorn \
  --name astrology-backend \
  --interpreter /var/www/astrology/backend/.venv/bin/python3 \
  -- app.main:app --host 127.0.0.1 --port 5014 --workers 2

# Start frontend
pm2 start node_modules/.bin/next \
  --name astrology-frontend \
  --cwd /var/www/astrology/frontend \
  -- start --port 3014

# Save so both survive reboots
pm2 save

# Check status
pm2 list
pm2 logs astrology-backend --lines 30
pm2 logs astrology-frontend --lines 30
```

> If you ever need to restart after a `git pull`:
> ```bash
> pm2 restart astrology-backend
> pm2 restart astrology-frontend
> ```

---

## 9. Nginx Config — Reverse Proxy

### 9.1 Create site config

```bash
nano /etc/nginx/sites-available/kundli.astrogyan.org
```

Paste this:

```nginx
server {
    listen 80;
    server_name kundli.astrogyan.org;

    # Frontend — Next.js
    location / {
        proxy_pass         http://127.0.0.1:3014;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Backend — FastAPI
    location /api/ {
        proxy_pass         http://127.0.0.1:5014;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Next.js static assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3014;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 9.2 Enable site & test

```bash
ln -s /etc/nginx/sites-available/kundli.astrogyan.org \
      /etc/nginx/sites-enabled/kundli.astrogyan.org

# Remove default site if still active
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 10. SSL Certificate (HTTPS via Let's Encrypt)

```bash
certbot --nginx -d kundli.astrogyan.org

# Follow prompts:
# - Enter email address
# - Agree to terms: Y
# - Redirect HTTP → HTTPS: 2 (recommended)
```

Certbot will automatically update your Nginx config with SSL.

### Auto-renew test

```bash
certbot renew --dry-run
```

Certbot sets up a systemd timer for auto-renewal — no manual action needed.

---

## 11. Open Firewall Ports

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'    # opens 80 and 443
ufw enable
ufw status
```

> Ports 3014 and 5014 are **internal only** (bound to `127.0.0.1`), so they don't need to be opened in the firewall. Nginx proxies traffic to them.

---

## 12. Verify Deployment

```bash
# Check both PM2 processes are online
pm2 list

# Test backend API directly
curl http://127.0.0.1:5014/
# Expected: {"status":"ok","message":"Astrology API is running"}

# Test frontend directly
curl http://127.0.0.1:3014/
# Expected: HTML response

# Test via domain (after DNS propagates)
curl https://kundli.astrogyan.org/
curl https://kundli.astrogyan.org/api/
```

---

## 13. Future Updates (Re-deploy after GitHub push)

```bash
cd /var/www/astrology

# Pull latest code
git pull origin main

# Re-install backend deps if requirements.txt changed
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
deactivate

# Rebuild frontend
cd frontend
NEXT_PUBLIC_API_URL=https://kundli.astrogyan.org npm run build
cd ..

# Restart both services
pm2 restart astrology-backend
pm2 restart astrology-frontend
```

---

## 14. Useful PM2 Commands

```bash
pm2 list                          # show all processes + status
pm2 logs astrology-backend        # live backend logs
pm2 logs astrology-frontend       # live frontend logs
pm2 restart astrology-backend     # restart only backend
pm2 restart astrology-frontend    # restart only frontend
pm2 stop all                      # stop everything
pm2 delete all                    # remove from PM2 (won't delete files)
```

---

## 15. File Structure on Server

```
/var/www/astrology/
├── backend/
│   ├── .venv/                ← Python virtualenv
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   └── services/
│   ├── ephemeris_data/
│   │   └── de421.bsp         ← make sure this is committed to git
│   └── requirements.txt
└── frontend/
    ├── .next/                ← built output (auto-generated)
    ├── src/
    ├── package.json
    └── next.config.js
```

> **Important:** Make sure `backend/ephemeris_data/de421.bsp` is committed to GitHub (it's a ~17 MB binary). If it's in `.gitignore`, download it manually on the server:
> ```bash
> mkdir -p /var/www/astrology/backend/ephemeris_data
> cd /var/www/astrology/backend/ephemeris_data
> wget https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de421.bsp
> ```

---

## Quick Reference

| Service     | Internal URL              | PM2 Name              |
|-------------|---------------------------|-----------------------|
| Frontend    | http://127.0.0.1:3014     | astrology-frontend    |
| Backend     | http://127.0.0.1:5014     | astrology-backend     |
| Public URL  | https://kundli.astrogyan.org | via Nginx          |
| API Public  | https://kundli.astrogyan.org/api/ | via Nginx    |
