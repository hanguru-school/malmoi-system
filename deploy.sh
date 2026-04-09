#!/usr/bin/env bash
# 예시: 원격 서버에 SSH 후 통일 실행 경로에서 배포 스크립트만 실행 (git 작업은 deploy-prod.sh 가 수행)
# 호스트는 scripts/deploy.env 의 MALMOI_DEPLOY_SSH 사용 권장 → deploy-now.sh
set -euo pipefail
SSH_TARGET="${MALMOI_DEPLOY_SSH:-malmoi_deploy@YOUR_SERVER}"
ssh -o BatchMode=yes "$SSH_TARGET" << 'REMOTE'
set -euo pipefail
cd /srv/malmoi/apps/malmoi-integrated/current
bash deploy/deploy-prod.sh
REMOTE
