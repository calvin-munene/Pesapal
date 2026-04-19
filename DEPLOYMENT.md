# Deployment Guide

PayFlow ships with ready-to-use configs for **Render**, **Railway**, **Docker**, and a **bare-metal VPS** (Ubuntu + Nginx + systemd). Pick the platform that fits your workflow.

| Platform | Best for | Files used |
|----------|----------|------------|
| [Render](#render) | Hands-off PaaS with managed Postgres | `render.yaml` |
| [Railway](#railway) | Fast deploys with simple env management | `railway.json`, `nixpacks.toml` |
| [Docker / Docker Compose](#docker) | Self-hosted, portable | `Dockerfile`, `docker-compose.yml`, `.dockerignore` |
| [VPS (Ubuntu)](#vps) | Full control, lowest cost | `deploy/deploy-vps.sh`, `deploy/payflow.service`, `deploy/nginx.conf.example` |

All deployments need the same four secrets:

- `PESAPAL_CONSUMER_KEY`
- `PESAPAL_CONSUMER_SECRET`
- `PESAPAL_ENV` (`sandbox` or `production`)
- `DATABASE_URL`

---

## Render

1. Push the repo to GitHub (already done if you forked it).
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect your GitHub account and pick this repo.
4. Render reads `render.yaml`, creates a **web service** + a **managed Postgres** automatically.
5. In the web service's **Environment** tab, paste:
   - `PESAPAL_CONSUMER_KEY`
   - `PESAPAL_CONSUMER_SECRET`
6. Click **Apply**. First deploy runs `npm install && npm run build && npm run db:push`, then `npm start`.
7. Health check: `/api/health` keeps the service alive.

> Render's free Postgres expires after 90 days — upgrade the plan in `render.yaml` for production use.

---

## Railway

1. Go to [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. Add a **PostgreSQL** plugin in the same project. Railway auto-injects `DATABASE_URL`.
3. In the service's **Variables** tab, add:
   - `PESAPAL_CONSUMER_KEY`
   - `PESAPAL_CONSUMER_SECRET`
   - `PESAPAL_ENV=production`
4. Railway uses `nixpacks.toml` to build, then runs the start command from `railway.json`.
5. Generate a public domain in **Settings → Networking → Generate Domain**.

---

## Docker

### Single container
```bash
docker build -t payflow .
docker run -d --name payflow -p 5000:5000 \
  -e PESAPAL_CONSUMER_KEY=xxx \
  -e PESAPAL_CONSUMER_SECRET=xxx \
  -e PESAPAL_ENV=production \
  -e DATABASE_URL=postgres://user:pass@host:5432/db \
  payflow
```

### Compose (app + Postgres)
```bash
cp .env.example .env   # then fill in PESAPAL_* values
docker compose up -d --build
```
The `db:push` migration runs automatically on container startup.

To update later:
```bash
git pull
docker compose up -d --build
```

---

## VPS

Tested on **Ubuntu 22.04 / 24.04**. The included script provisions everything: Node.js 20, PostgreSQL, Nginx, a system user, a systemd service, and a firewall.

### One-shot install
```bash
ssh root@your-vps-ip
curl -fsSL https://raw.githubusercontent.com/calvin-munene/Pesapal/main/deploy/deploy-vps.sh -o deploy-vps.sh
bash deploy-vps.sh
```

### After the script runs
1. Edit `/opt/payflow/.env` with your real credentials.
2. Run the database migration:
   ```bash
   sudo -u payflow bash -c 'cd /opt/payflow && npm run db:push'
   ```
3. Edit `/etc/nginx/sites-available/payflow` — replace `yourdomain.com` with your real domain.
4. Start the app and reload Nginx:
   ```bash
   sudo systemctl start payflow
   sudo systemctl reload nginx
   ```
5. Issue an SSL certificate:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

### Useful commands
```bash
sudo systemctl status payflow         # check status
sudo journalctl -u payflow -f         # tail logs
sudo systemctl restart payflow        # restart after .env change
cd /opt/payflow && sudo -u payflow git pull && sudo -u payflow npm install && sudo -u payflow npm run build && sudo systemctl restart payflow
```

---

## Important: Pesapal IPN URL

After your app is live, register the **public** IPN URL in Pesapal's merchant dashboard (or let the app auto-register on first payment):

```
https://yourdomain.com/api/pesapal/ipn
```

Without this, payment status updates won't reach your dashboard.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `EADDRINUSE` on port 5000 | Set a different `PORT` env var, or stop the conflicting process |
| `Database connection failed` | Confirm `DATABASE_URL` is reachable from the host; for Render/Railway, the URL is injected automatically |
| `Pesapal 401 Unauthorized` | Double-check `PESAPAL_CONSUMER_KEY` / `SECRET` and that `PESAPAL_ENV` matches the keys (sandbox keys won't work in production mode) |
| Payment never updates | Make sure your IPN URL is publicly reachable over HTTPS — Pesapal won't call HTTP endpoints in production |
| Nginx 502 Bad Gateway | App isn't running — check `sudo systemctl status payflow` and `sudo journalctl -u payflow -n 50` |
