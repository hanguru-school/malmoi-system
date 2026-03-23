#!/usr/bin/env bash
# Local (Cursor) → git push → SSH → server deploy/deploy-prod.sh
# Usage:
#   bash scripts/deploy-from-local.sh [commit message]
# Config: copy scripts/deploy.env.example → scripts/deploy.env

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ROOT}/scripts/deploy.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE"
fi

SSH_TARGET="${MALMOI_DEPLOY_SSH:-}"
REMOTE_SCRIPT="${MALMOI_REMOTE_DEPLOY_SCRIPT:-/home/malmoi_deploy/apps/malmoi/deploy/deploy-prod.sh}"

if [[ -z "$SSH_TARGET" ]]; then
  echo "ERROR: Set MALMOI_DEPLOY_SSH in scripts/deploy.env"
  echo "  cp scripts/deploy.env.example scripts/deploy.env"
  echo "  # edit: MALMOI_DEPLOY_SSH=malmoi_deploy@your-host"
  exit 1
fi

MSG="${1:-chore: deploy $(date -u +%Y-%m-%dT%H%MZ)}"

echo "=== [1/3] git commit (if needed) ==="
if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  git add -A
  git commit -m "$MSG"
else
  echo "Nothing to commit (clean working tree)."
fi

echo "=== [2/3] git push origin main ==="
git push origin main

echo "=== [3/3] remote deploy via SSH ==="
echo "SSH: $SSH_TARGET"
echo "RUN: $REMOTE_SCRIPT"
ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$SSH_TARGET" "bash -lc 'set -euo pipefail; bash ${REMOTE_SCRIPT}'"

echo "Done."
