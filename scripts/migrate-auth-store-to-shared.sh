#!/usr/bin/env bash
# Copy legacy auth-store.json into fixed shared path (no deletion of source).
# Run on the server as a user that can read the legacy file and write to /srv/malmoi/shared.
#
# Usage:
#   APP_DIR=/srv/malmoi/apps/malmoi-integrated/current bash scripts/migrate-auth-store-to-shared.sh
#   bash scripts/migrate-auth-store-to-shared.sh /other/path/auth-store.json
#
# If destination exists, abort unless FORCE=1 (both source and dest are backed up first).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="${APP_DIR:-/srv/malmoi/apps/malmoi-integrated/current}"
LEGACY="${1:-$APP_DIR/.data/auth-store.json}"
SHARED="/srv/malmoi/shared/auth-store.json"
BACKUP_ROOT="/srv/malmoi/shared/backups"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ ! -f "$LEGACY" ]]; then
  echo "ERROR: legacy store not found: $LEGACY"
  exit 1
fi

PARENT="$(dirname "$SHARED")"
if [[ ! -d "$PARENT" ]]; then
  echo "ERROR: directory missing: $PARENT"
  echo "Create it and chown to the service user, e.g.:"
  echo "  sudo mkdir -p $BACKUP_ROOT && sudo chown -R malmoi_deploy:malmoi_deploy /srv/malmoi/shared"
  exit 1
fi
if [[ ! -w "$PARENT" ]]; then
  echo "ERROR: not writable: $PARENT (fix ownership/permissions for deploy or service user)"
  exit 1
fi

mkdir -p "$BACKUP_ROOT"

echo "=== MalMoi auth-store migration to shared ==="
echo "LEGACY=$LEGACY"
echo "SHARED=$SHARED"
echo "BACKUP_ROOT=$BACKUP_ROOT"
echo "TS=$TS"

cp -a "$LEGACY" "$BACKUP_ROOT/auth-store.legacy-$TS.json"
echo "OK: backed up legacy -> $BACKUP_ROOT/auth-store.legacy-$TS.json"

if [[ -f "$SHARED" ]]; then
  cp -a "$SHARED" "$BACKUP_ROOT/auth-store.shared-before-$TS.json"
  echo "OK: backed up existing shared -> $BACKUP_ROOT/auth-store.shared-before-$TS.json"
  if [[ "${FORCE:-0}" != "1" ]]; then
    echo "ERROR: $SHARED already exists. Set FORCE=1 to overwrite from legacy (after backups)."
    exit 2
  fi
fi

cp -a "$LEGACY" "$SHARED"
echo "OK: copied legacy -> $SHARED"
echo ""
echo "Next steps:"
echo "  1) Install systemd drop-in (see deploy/systemd/malmoi-web.d-auth-store.conf.example)"
echo "  2) sudo systemctl daemon-reload && sudo systemctl restart malmoi-web"
echo "  3) AUTH_STORE_PATH=$SHARED npm run check:db   (from $APP_DIR)"
echo "  4) Verify /admin/system/db-check as admin"
echo ""
echo "Do NOT delete the legacy file until shared + systemd are verified."
