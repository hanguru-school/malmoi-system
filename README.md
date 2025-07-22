# 🏫 한구루 스쿨 예약 시스템

Firebase 기반의 현대적인 교육 시설 예약 관리 시스템입니다.

## ✨ 주요 기능

- **🔐 Firebase 인증**: 이메일/비밀번호 로그인
- **🗄️ Firestore 데이터베이스**: 실시간 데이터 동기화
- **📅 예약 관리**: 생성, 조회, 수정, 삭제
- **👥 사용자 관리**: 역할별 권한 시스템
- **🏢 교실 관리**: 시설 정보 및 가용성 관리
- **📚 코스 관리**: 교육 과정 정보 관리
- **📱 반응형 UI**: 모바일 친화적 인터페이스

## 🚀 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Deployment**: Vercel (권장)

## 📋 시스템 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn
- Firebase 프로젝트 (선택사항)

## 🛠️ 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd booking-system
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 🔧 Firebase 설정 (선택사항)

실제 Firebase 서비스를 사용하려면 `FIREBASE_SETUP.md` 파일을 참조하여 설정하세요.

### 환경 변수 설정

`.env.local` 파일을 생성하고 Firebase 설정 정보를 추가:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 초기 데이터 생성

```bash
node scripts/init-firebase-data.js
```

## 👤 사용자 역할

### 관리자 (Admin)
- 모든 기능 접근 가능
- 사용자 관리
- 시스템 설정

### 교사 (Teacher)
- 예약 관리
- 보고서 조회
- 시설 조회

### 학생 (Student)
- 예약 생성/조회
- 시설 조회

### 직원 (Staff)
- 예약 관리
- 시설 관리
- 사용자 조회

## 🔑 테스트 계정

Firebase 설정 없이도 개발 모드에서 다음 계정으로 테스트 가능:

- **관리자**: `admin@hanguru.school` / `password123`
- **교사**: `teacher@hanguru.school` / `password123`
- **학생**: `student@hanguru.school` / `password123`
- **직원**: `staff@hanguru.school` / `password123`

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # 인증 관련 페이지
│   ├── master/            # 관리자 대시보드
│   ├── reservation/       # 예약 관련 페이지
│   └── api/               # API 라우트 (Firebase 기반)
├── hooks/                 # 커스텀 React 훅
│   ├── useAuth.tsx        # 인증 관리
│   ├── useReservations.ts # 예약 관리
│   ├── useRooms.ts        # 교실 관리
│   └── useCourses.ts      # 코스 관리
├── lib/                   # 유틸리티 라이브러리
│   ├── firebase.ts        # Firebase 설정
│   └── firestore.ts       # Firestore 유틸리티
└── components/            # 재사용 가능한 컴포넌트
```

## 🔄 개발 모드 vs 프로덕션 모드

### 개발 모드
- Firebase 연결 실패 시 자동 폴백
- 하드코딩된 테스트 데이터 사용
- 빠른 개발 및 테스트

### 프로덕션 모드
- 실제 Firebase 서비스 사용
- 실시간 데이터 동기화
- 완전한 기능 제공

## 📊 주요 페이지

- **로그인**: `/auth/login`
- **마이페이지**: `/reservation/japanese/mypage`
- **새 예약**: `/reservation/japanese/new`
- **관리자 대시보드**: `/master`

## 🚀 배포

### Vercel 배포 (권장)

1. Vercel 계정 생성
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포

### 수동 배포

```bash
npm run build
npm start
```

## 🔒 보안

- Firebase 보안 규칙 적용
- 역할 기반 접근 제어
- 인증된 사용자만 접근 가능
- 데이터 검증 및 필터링

## 📈 성능 최적화

- Next.js App Router 사용
- 이미지 최적화
- 코드 스플리팅
- 캐싱 전략

## 🐛 문제 해결

### 일반적인 문제

1. **Firebase 연결 오류**
   - 환경 변수 확인
   - 네트워크 연결 상태 확인

2. **인증 오류**
   - Firebase Authentication 설정 확인
   - 이메일/비밀번호 제공업체 활성화

3. **데이터 로딩 오류**
   - Firestore 보안 규칙 확인
   - 데이터베이스 위치 설정 확인

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해 주세요.

---

**한구루 스쿨 예약 시스템** - 현대적인 교육 시설 관리 솔루션 🎓
