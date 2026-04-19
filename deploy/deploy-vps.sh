#!/usr/bin/env bash
# One-shot deploy script for a fresh Ubuntu 22.04 / 24.04 VPS.
# Usage: bash deploy-vps.sh

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/calvin-munene/Pesapal.git}"
APP_DIR="/opt/payflow"
APP_USER="payflow"

echo "==> Updating system"
sudo apt-get update -y && sudo apt-get upgrade -y

echo "==> Installing Node.js 20, PostgreSQL, Nginx, Git"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql nginx git ufw

echo "==> Creating app user"
if ! id "$APP_USER" &>/dev/null; then
  sudo useradd --system --create-home --shell /bin/bash "$APP_USER"
fi

echo "==> Cloning repo into $APP_DIR"
sudo mkdir -p "$APP_DIR"
sudo chown "$APP_USER:$APP_USER" "$APP_DIR"
sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR" || \
  (cd "$APP_DIR" && sudo -u "$APP_USER" git pull)

echo "==> Installing dependencies & building"
cd "$APP_DIR"
sudo -u "$APP_USER" npm install
sudo -u "$APP_USER" npm run build

echo "==> Setting up .env (edit afterwards!)"
if [ ! -f "$APP_DIR/.env" ]; then
  sudo -u "$APP_USER" cp .env.example .env
  echo "   >>> Edit $APP_DIR/.env with your real credentials, then:"
  echo "   >>> sudo -u $APP_USER bash -c 'cd $APP_DIR && npm run db:push'"
fi

echo "==> Installing systemd service"
sudo cp deploy/payflow.service /etc/systemd/system/payflow.service
sudo systemctl daemon-reload
sudo systemctl enable payflow

echo "==> Installing Nginx site"
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/payflow
sudo ln -sf /etc/nginx/sites-available/payflow /etc/nginx/sites-enabled/payflow
sudo nginx -t

echo "==> Configuring firewall"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo ""
echo "==> Done. Next steps:"
echo "   1. Edit $APP_DIR/.env with real PESAPAL & DATABASE_URL values"
echo "   2. Edit /etc/nginx/sites-available/payflow — set your real domain"
echo "   3. Run: sudo -u $APP_USER bash -c 'cd $APP_DIR && npm run db:push'"
echo "   4. Run: sudo systemctl start payflow && sudo systemctl reload nginx"
echo "   5. Run: sudo certbot --nginx -d yourdomain.com (install certbot first)"
