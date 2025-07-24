# 🚀 교실 시스템 배포 가이드

## 📋 배포 옵션

### 1. Vercel 배포 (권장)

#### 자동 배포 (GitHub 연동)
1. GitHub에 저장소 생성
2. 코드 푸시
3. Vercel에서 GitHub 저장소 연결
4. 자동 배포 완료

#### 수동 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

### 2. Netlify 배포

#### 자동 배포
1. GitHub 저장소 연결
2. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `out`
3. 자동 배포 완료

#### 수동 배포
```bash
# 정적 사이트 생성
npm run build
npm run export

# Netlify CLI 설치
npm install -g netlify-cli

# 배포
netlify deploy --prod --dir=out
```

### 3. GitHub Pages 배포

#### 설정
1. `next.config.js` 수정:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

2. 빌드 및 배포:
```bash
npm run build
npm run export
```

3. GitHub Pages 설정에서 `out` 폴더 배포

### 4. Docker 배포

#### Dockerfile 생성
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### 배포
```bash
# 이미지 빌드
docker build -t booking-system .

# 컨테이너 실행
docker run -p 3000:3000 booking-system
```

## 🔧 환경 변수 설정

### 필수 환경 변수
```env
# 데이터베이스
DATABASE_URL="postgresql://username:password@localhost:5432/booking_system"

# Firebase (선택사항)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com

# 기타 설정
NODE_ENV=production
```

## 📊 배포 상태 확인

### 빌드 테스트
```bash
# 로컬 빌드 테스트
npm run build

# 타입 체크
npm run type-check

# 린트 체크
npm run lint
```

### 성능 최적화
- 이미지 최적화
- 코드 스플리팅
- 캐싱 설정
- CDN 사용

## 🛡️ 보안 설정

### HTTPS 강제
- 모든 배포 플랫폼에서 HTTPS 자동 적용

### 환경 변수 보안
- 민감한 정보는 환경 변수로 관리
- Git에 커밋하지 않음

### 접근 제어
- 미들웨어를 통한 인증
- 역할 기반 권한 관리

## 📱 모바일 최적화

### PWA 설정
- Service Worker 설정
- 매니페스트 파일 생성
- 오프라인 지원

### 반응형 디자인
- 모바일 우선 디자인
- 터치 인터페이스 최적화

## 🔄 CI/CD 파이프라인

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📈 모니터링

### 성능 모니터링
- Core Web Vitals 추적
- 에러 로깅
- 사용자 행동 분석

### 알림 설정
- 배포 성공/실패 알림
- 에러 알림
- 성능 저하 알림

## 🆘 문제 해결

### 일반적인 문제
1. **빌드 실패**: 의존성 문제 확인
2. **환경 변수 누락**: 배포 플랫폼에서 설정 확인
3. **데이터베이스 연결 실패**: 연결 문자열 확인
4. **API 라우트 오류**: 서버리스 함수 설정 확인

### 디버깅
```bash
# 로컬 테스트
npm run dev

# 프로덕션 빌드 테스트
npm run build && npm start

# 로그 확인
vercel logs
```

## 📞 지원

배포 관련 문제가 발생하면:
1. 로그 확인
2. 환경 변수 검증
3. 빌드 설정 확인
4. 플랫폼별 문서 참조 