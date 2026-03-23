#!/usr/bin/env bash
# MalMoi production deploy script (server-side)
# Path: /home/malmoi_deploy/apps/malmoi/deploy/deploy-prod.sh
# Flow: git pull -> npm install/ci -> build -> restart -> health checks

set -euo pipefail

APP_DIR="/home/malmoi_deploy/apps/malmoi"
SERVICE_NAME="${MALMOI_SYSTEMD_SERVICE:-malmoi-web}"
INTERNAL_HEALTH_URL="http://127.0.0.1:3000/login"
EXTERNAL_HEALTH_URL="https://portal.hanguru.blog/login"

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: app directory not found: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

if [[ "$(pwd)" != "$APP_DIR" ]]; then
  echo "ERROR: wrong working directory. expected=$APP_DIR actual=$(pwd)"
  exit 1
fi

if [[ ! -f package.json ]]; then
  echo "ERROR: package.json not found in $APP_DIR"
  exit 1
fi

if [[ ! -d .git ]]; then
  echo "ERROR: $APP_DIR is not a git repository"
  exit 1
fi

LOG_DIR="${APP_DIR}/deploy/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/deploy-prod-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=============================================="
echo "MalMoi PROD deploy | $(date -Is)"
echo "APP_DIR=$APP_DIR"
echo "SERVICE=$SERVICE_NAME"
echo "LOG=$LOG_FILE"
echo "=============================================="

echo "[1/7] git fetch"
git fetch origin main

echo "[2/7] git pull origin main (ff-only)"
git pull --ff-only origin main

echo "[3/7] install dependencies"
if [[ -f package-lock.json ]]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

echo "[4/7] build"
if ! npm run build; then
  echo "ERROR: build failed. restart is skipped by design."
  exit 1
fi

echo "[5/7] restart service: $SERVICE_NAME"
if ! sudo -n systemctl restart "$SERVICE_NAME"; then
  echo "ERROR: failed to restart $SERVICE_NAME"
  echo "Hint: configure sudo NOPASSWD for systemctl restart/is-active"
  exit 1
fi

sleep 2

echo "[6/7] internal health check: $INTERNAL_HEALTH_URL"
if ! curl -fsSI "$INTERNAL_HEALTH_URL" >/tmp/malmoi-health-internal.txt; then
  echo "ERROR: internal health check failed"
  exit 1
fi
cat /tmp/malmoi-health-internal.txt

echo "[7/7] service status and logs"
sudo -n systemctl status "$SERVICE_NAME" --no-pager | sed -n '1,20p'
sudo -n journalctl -u "$SERVICE_NAME" -n 50 --no-pager | sed -n '1,80p'

echo "external health (best-effort): $EXTERNAL_HEALTH_URL"
if curl -fsSI "$EXTERNAL_HEALTH_URL" >/tmp/malmoi-health-external.txt; then
  cat /tmp/malmoi-health-external.txt
else
  echo "WARN: external health check failed (network/proxy/CDN issue possible)"
fi

echo "OK: deploy finished successfully"
