#!/bin/bash
set -euo pipefail

# 원격 서버 정보
REMOTE_USER="malmoi"
REMOTE_HOST="100.80.210.105"
REMOTE_DIR="~/booking-system"

echo "⚡ 빠른 배포 시작 (빌드 없이 코드만 업로드)..."

# 코드 업로드
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'backups' \
  --exclude 'logs' \
  --exclude '.env*' \
  --exclude '*.log' \
  --exclude '.git' \
  --exclude '*.tsbuildinfo' \
  --exclude '.DS_Store' \
  --exclude 'data' \
  ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo "✅ 코드 업로드 완료!"
echo ""
echo "원격 서버에서 다음 명령 실행:"
echo "  cd ~/booking-system"
echo "  export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\""
echo "  npm run dev  # 개발 모드"
echo "  또는"
echo "  npm run build && npm start  # 프로덕션 모드"



