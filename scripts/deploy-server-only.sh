#!/usr/bin/env bash
# Re-run server deploy without git push (e.g. after fixing server-only issue).
# Uses same scripts/deploy.env as deploy-from-local.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/scripts/deploy.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE"
fi

SSH_TARGET="${MALMOI_DEPLOY_SSH:-}"
REMOTE_SCRIPT="${MALMOI_REMOTE_DEPLOY_SCRIPT:-/home/malmoi_deploy/apps/malmoi/deploy/deploy.sh}"

if [[ -z "$SSH_TARGET" ]]; then
  echo "ERROR: Set MALMOI_DEPLOY_SSH in scripts/deploy.env"
  exit 1
fi

echo "SSH: $SSH_TARGET"
ssh -o BatchMode=yes "$SSH_TARGET" "bash -lc 'set -euo pipefail; bash ${REMOTE_SCRIPT}'"
echo "Done."
