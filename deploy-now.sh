#!/usr/bin/env bash
# 로컬에서 실행: 푸시 없이 서버만 GitHub main 기준으로 재배포
# 설정: scripts/deploy.env (MALMOI_DEPLOY_SSH)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${ROOT}/scripts/deploy.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE"
fi
SSH_TARGET="${MALMOI_DEPLOY_SSH:-}"
REMOTE_SCRIPT="${MALMOI_REMOTE_DEPLOY_SCRIPT:-/srv/malmoi/apps/malmoi-integrated/current/deploy/deploy-prod.sh}"
if [[ -z "$SSH_TARGET" ]]; then
  echo "ERROR: MALMOI_DEPLOY_SSH 가 scripts/deploy.env 에 없습니다."
  exit 1
fi
echo "SSH: $SSH_TARGET → $REMOTE_SCRIPT"
ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$SSH_TARGET" \
  "bash -lc 'set -euo pipefail; bash ${REMOTE_SCRIPT}'"
echo "Done."
