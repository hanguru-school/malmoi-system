#!/usr/bin/env bash
# MalMoi — server-side Git deploy
# Path on server: /home/malmoi_deploy/apps/malmoi/deploy/deploy.sh
# Does NOT touch .data/ (runtime). Build failure => no service restart.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

LOG_DIR="${REPO_ROOT}/deploy/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/deploy-$(date +%Y%m%d-%H%M%S).log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "=============================================="
echo "MalMoi deploy | $(date -Is)"
echo "PWD=$REPO_ROOT"
echo "LOG=$LOG_FILE"
echo "=============================================="

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is not installed."
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: not a git repository: $REPO_ROOT"
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "ERROR: git remote 'origin' is not configured."
  echo "  git remote add origin <your-repo-url>"
  exit 1
fi

echo "=== [1/4] git fetch ==="
git fetch origin main

echo "=== [2/4] git pull (ff-only) ==="
if ! git pull --ff-only origin main; then
  echo "ERROR: git pull --ff-only failed. Fix conflicts or reset on server manually."
  exit 1
fi

echo "=== [3/4] npm ci + build ==="
if [[ ! -f package-lock.json ]]; then
  echo "WARN: no package-lock.json; using npm install"
  npm install --omit=dev
else
  npm ci --omit=dev
fi

if ! npm run build; then
  echo "ERROR: npm run build failed — service will NOT be restarted."
  exit 1
fi

SERVICE_NAME="${MALMOI_SYSTEMD_SERVICE:-malmoi-web}"
echo "=== [4/4] systemctl restart ${SERVICE_NAME} ==="
if command -v sudo >/dev/null 2>&1; then
  if ! sudo -n systemctl restart "${SERVICE_NAME}" 2>/dev/null; then
    echo "ERROR: 'sudo -n systemctl restart ${SERVICE_NAME}' failed."
    echo "Configure NOPASSWD for malmoi_deploy, e.g. sudo visudo:"
    echo "  malmoi_deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart ${SERVICE_NAME}, /bin/systemctl is-active ${SERVICE_NAME}"
    exit 1
  fi
else
  systemctl restart "${SERVICE_NAME}"
fi

if sudo -n systemctl is-active --quiet "${SERVICE_NAME}" 2>/dev/null || systemctl is-active --quiet "${SERVICE_NAME}" 2>/dev/null; then
  echo "OK: ${SERVICE_NAME} is active."
else
  echo "WARN: ${SERVICE_NAME} may not be active — check: systemctl status ${SERVICE_NAME}"
  exit 1
fi

echo "=== deploy finished OK ==="
exit 0
