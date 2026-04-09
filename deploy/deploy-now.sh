#!/usr/bin/env bash
# 서버에서 즉시 배포: current 에서 fetch → reset → .next 제거 → ci → build → restart
# 사용: cd /srv/malmoi/apps/malmoi-integrated/current && bash deploy/deploy-now.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "$SCRIPT_DIR/deploy-prod.sh"
