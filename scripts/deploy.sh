#!/bin/bash

# 운영 환경 전용 배포 스크립트
# 이 스크립트는 main 브랜치에서만 실행되어야 합니다

set -e

echo "🚀 운영 환경 배포 시작..."

# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ 오류: 이 스크립트는 main 브랜치에서만 실행할 수 있습니다."
    echo "현재 브랜치: $CURRENT_BRANCH"
    exit 1
fi

# 환경 변수 확인
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ 오류: VERCEL_TOKEN 환경 변수가 설정되지 않았습니다."
    exit 1
fi

# 빌드
echo "📦 프로젝트 빌드 중..."
npm run build

# 운영 환경 배포
echo "🚀 운영 환경에 배포 중..."
npx vercel --prod --token=$VERCEL_TOKEN

echo "✅ 배포 완료!"
echo "🌐 운영 URL: https://app.hanguru.school" 