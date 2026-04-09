#!/usr/bin/env bash
# MalMoi production deploy script (server-side)
# 반드시 앱 루트(또는 릴리스 루트)에서 실행: bash deploy/deploy-prod.sh
#
# 정답 경로(기본):
#   MALMOI_USE_RELEASES=0: Git 작업·빌드·실행 모두 /srv/malmoi/apps/malmoi-integrated/current
#   MALMOI_USE_RELEASES=1: Git·releases/ 는 /srv/malmoi/apps/malmoi-integrated, 실행은 .../current 심볼릭
#
# DEPLOY_APP_DIR 로 위 기본을 덮어쓸 수 있습니다. AUTH_STORE_PATH 및 /srv/malmoi/shared/* 는 변경하지 않습니다.

set -euo pipefail

MALMOI_INTEGRATED_ROOT="${MALMOI_INTEGRATED_ROOT:-/srv/malmoi/apps/malmoi-integrated}"
USE_RELEASES="${MALMOI_USE_RELEASES:-0}"
if [[ -n "${DEPLOY_APP_DIR:-}" ]]; then
  APP_DIR="$DEPLOY_APP_DIR"
elif [[ "$USE_RELEASES" == "1" ]]; then
  APP_DIR="$MALMOI_INTEGRATED_ROOT"
else
  APP_DIR="${MALMOI_INTEGRATED_ROOT}/current"
fi

GIT_REF="${DEPLOY_GIT_REF:-main}"
SERVICE_NAME="${MALMOI_SYSTEMD_SERVICE:-malmoi-web}"
INTERNAL_HEALTH_URL="http://127.0.0.1:3000/login"
EXTERNAL_HEALTH_URL="https://portal.hanguru.school/login"

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
echo "GIT_REF=$GIT_REF"
echo "SERVICE=$SERVICE_NAME"
echo "MALMOI_USE_RELEASES=$USE_RELEASES"
echo "LOG=$LOG_FILE"
echo "=============================================="

release_deploy_failed_cleanup() {
  local rel_path="$1"
  echo "ERROR: release deploy failed — removing incomplete tree: $rel_path"
  rm -rf "$rel_path"
  echo "NOTE: 기존 current 심볼릭/디렉터리는 변경하지 않았습니다."
}

if [[ "$USE_RELEASES" == "1" ]]; then
  echo "[release 1/8] git fetch origin $GIT_REF"
  git fetch origin "$GIT_REF"

  echo "[release 2/8] git checkout + reset to origin/$GIT_REF"
  git checkout -B "$GIT_REF" "origin/$GIT_REF"
  git reset --hard "origin/$GIT_REF"

  REL_ID="$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"
  REL_PATH="${APP_DIR}/releases/${REL_ID}"
  mkdir -p "${APP_DIR}/releases"

  echo "[release 3/8] git archive → $REL_PATH"
  mkdir -p "$REL_PATH"
  if ! git archive HEAD | tar -x -C "$REL_PATH"; then
    release_deploy_failed_cleanup "$REL_PATH"
    exit 1
  fi

  cd "$REL_PATH"

  if [[ ! -f package.json ]]; then
    release_deploy_failed_cleanup "$REL_PATH"
    echo "ERROR: archived tree missing package.json"
    exit 1
  fi

  echo "[release 4/8] clean Next cache + install dependencies (include dev for build)"
  rm -rf .next
  if [[ -f package-lock.json ]]; then
    npm ci --include=dev
  else
    npm install --include=dev
  fi

  echo "[release 5/8] build"
  if ! npm run build; then
    release_deploy_failed_cleanup "$REL_PATH"
    exit 1
  fi

  echo "[release 6/8] switch current symlink (atomic)"
  cd "$APP_DIR"
  ln -sfn "$REL_PATH" "${APP_DIR}/current.new"
  mv -Tf "${APP_DIR}/current.new" "${APP_DIR}/current"

  echo "[release 7/8] restart service: $SERVICE_NAME"
  if ! sudo -n systemctl restart "$SERVICE_NAME"; then
    echo "ERROR: failed to restart $SERVICE_NAME"
    exit 1
  fi

  sleep 2

  echo "[release 8/8] internal health check: $INTERNAL_HEALTH_URL"
  if ! curl -fsSI "$INTERNAL_HEALTH_URL" >/tmp/malmoi-health-internal.txt; then
    echo "ERROR: internal health check failed after release switch"
    exit 1
  fi
  cat /tmp/malmoi-health-internal.txt

  echo "[release] service status (snippet)"
  sudo -n systemctl status "$SERVICE_NAME" --no-pager | sed -n '1,20p' || true

  SHARED_STORE="${MALMOI_SHARED_AUTH_STORE:-/srv/malmoi/shared/auth-store.json}"
  echo "----------------------------------------------"
  echo "AUTH_STORE_PATH / shared store sanity (best-effort, 경로 변경 없음)"
  ENV_LINE="$(sudo -n systemctl show "$SERVICE_NAME" -p Environment --value 2>/dev/null || true)"
  if echo "$ENV_LINE" | tr ' ' '\n' | grep -q '^AUTH_STORE_PATH='; then
    echo "OK: AUTH_STORE_PATH is present in systemd Environment for $SERVICE_NAME"
    echo "$ENV_LINE" | tr ' ' '\n' | grep '^AUTH_STORE_PATH=' || true
  else
    echo "WARN: AUTH_STORE_PATH not found in systemd Environment for $SERVICE_NAME"
    echo "      Production should use fixed path: $SHARED_STORE"
  fi
  if [[ -f "$SHARED_STORE" ]]; then
    SZ="$(stat -c%s "$SHARED_STORE" 2>/dev/null || wc -c <"$SHARED_STORE")"
    echo "OK: $SHARED_STORE exists (${SZ} bytes)"
  else
    echo "NOTE: $SHARED_STORE not found on disk (OK if using another AUTH_STORE_PATH)"
  fi
  echo "----------------------------------------------"

  echo "external health (best-effort): $EXTERNAL_HEALTH_URL"
  if curl -fsSI "$EXTERNAL_HEALTH_URL" >/tmp/malmoi-health-external.txt; then
    cat /tmp/malmoi-health-external.txt
  else
    echo "WARN: external health check failed (network/proxy/CDN issue possible)"
  fi

  echo "OK: release deploy finished successfully ($REL_ID)"
  exit 0
fi

echo "[1/7] git fetch origin $GIT_REF"
git fetch origin "$GIT_REF"

echo "[2/7] git checkout + hard reset to origin/$GIT_REF (main = GitHub 유일 원본)"
git checkout -B "$GIT_REF" "origin/$GIT_REF"
git reset --hard "origin/$GIT_REF"

echo "[3/7] remove .next cache + install dependencies (include dev for build)"
rm -rf .next
if [[ -f package-lock.json ]]; then
  npm ci --include=dev
else
  npm install --include=dev
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

SHARED_STORE="${MALMOI_SHARED_AUTH_STORE:-/srv/malmoi/shared/auth-store.json}"
echo "----------------------------------------------"
echo "AUTH_STORE_PATH / shared store sanity (best-effort)"
ENV_LINE="$(sudo -n systemctl show "$SERVICE_NAME" -p Environment --value 2>/dev/null || true)"
if echo "$ENV_LINE" | tr ' ' '\n' | grep -q '^AUTH_STORE_PATH='; then
  echo "OK: AUTH_STORE_PATH is present in systemd Environment for $SERVICE_NAME"
  echo "$ENV_LINE" | tr ' ' '\n' | grep '^AUTH_STORE_PATH=' || true
else
  echo "WARN: AUTH_STORE_PATH not found in systemd Environment for $SERVICE_NAME"
  echo "      Production should use fixed path (see docs/storage-path-migration.md):"
  echo "      $SHARED_STORE"
fi
if [[ -f "$SHARED_STORE" ]]; then
  SZ="$(stat -c%s "$SHARED_STORE" 2>/dev/null || wc -c <"$SHARED_STORE")"
  echo "OK: $SHARED_STORE exists (${SZ} bytes)"
else
  echo "NOTE: $SHARED_STORE not found on disk (OK if using another AUTH_STORE_PATH)"
fi
echo "----------------------------------------------"

echo "external health (best-effort): $EXTERNAL_HEALTH_URL"
if curl -fsSI "$EXTERNAL_HEALTH_URL" >/tmp/malmoi-health-external.txt; then
  cat /tmp/malmoi-health-external.txt
else
  echo "WARN: external health check failed (network/proxy/CDN issue possible)"
fi

echo "OK: deploy finished successfully"
