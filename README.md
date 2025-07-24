# Booking System - Vercel + AWS

강의실 예약 시스템입니다.

## 🚀 배포 방법 (Vercel + AWS)

### 1. AWS 설정

#### S3 버킷 생성
1. AWS 콘솔에서 S3 서비스로 이동
2. "버킷 만들기" 클릭
3. 버킷 이름: `malmoi-system-files`
4. 리전: `ap-northeast-2` (서울)
5. 퍼블릭 액세스 차단 해제 (파일 공개 필요)
6. **고급 설정**에서 **버킷 버전 관리 활성화** (체크)

#### IAM 사용자 생성
1. IAM 서비스에서 새 사용자 생성
2. 권한: `AmazonS3FullAccess`
3. Access Key와 Secret Key 생성

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정:

```env
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=malmoi-system-files
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

### 3. 배포

```bash
# 배포 스크립트 실행
chmod +x deploy.sh
./deploy.sh

# 또는 수동 배포
npx vercel --prod
```

## 📁 파일 구조

```
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React 컴포넌트
│   ├── hooks/         # Custom hooks
│   └── lib/           # 유틸리티 함수
├── aws-config.js      # AWS 설정
├── vercel.json        # Vercel 설정
└── deploy.sh          # 배포 스크립트
```

## 🔧 주요 기능

- ✅ 강의실 예약 시스템
- ✅ 파일 업로드 (AWS S3)
- ✅ 실시간 업데이트
- ✅ 반응형 디자인
- ✅ 사용자 인증

## 🌐 접속 주소

배포 완료 후 Vercel에서 제공하는 URL로 접속 가능합니다.

## 📞 지원

문제가 있으면 이슈를 생성해주세요.
