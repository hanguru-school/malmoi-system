#!/usr/bin/env bash
set -euo pipefail

# LEGACY: rsync-based deploy. Prefer Git: see docs/DEPLOY_GIT.md and deploy/deploy.sh
#
# Safe deployment script:
# - Never sync runtime data (.data)
# - Build only on server (production)
# - Restart only systemd services

SERVER="${MALMOI_SERVER:-malmoi_deploy@192.168.1.41}"
REMOTE_DIR="${MALMOI_REMOTE_DIR:-/home/malmoi_deploy/apps/malmoi}"

echo "[1/4] Sync source code to server (excluding runtime data)"
rsync -avz --delete \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude ".next" \
  --exclude ".data" \
  --exclude ".DS_Store" \
  ./ "${SERVER}:${REMOTE_DIR}/"

echo "[2/4] Install dependencies and build production artifacts"
ssh "${SERVER}" "cd '${REMOTE_DIR}' && npm install && npm run build"

echo "[3/4] Restart production services"
ssh "${SERVER}" "sudo systemctl restart malmoi-web nginx"

echo "[4/4] Health check"
ssh "${SERVER}" "systemctl is-active malmoi-web cloudflared nginx && curl -s -o /dev/null -w 'internal /login: %{http_code}\n' http://127.0.0.1:3000/login"
curl -s -I https://portal.hanguru.blog/login | sed -n '1,12p'

echo "Done."
