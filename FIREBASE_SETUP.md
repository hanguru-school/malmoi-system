# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `booking-system-dev` (또는 원하는 이름)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. 웹 앱 추가

1. 프로젝트 대시보드에서 "웹" 아이콘 클릭
2. 앱 닉네임: `booking-system-web`
3. "Firebase Hosting 설정" 체크 해제
4. 앱 등록

## 3. Firebase 설정 정보 복사

등록된 앱의 설정 정보를 복사하여 `.env.local` 파일에 추가:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 4. Authentication 설정

### 4.1 이메일/비밀번호 로그인
1. 왼쪽 메뉴에서 "Authentication" 클릭
2. "시작하기" 클릭
3. "이메일/비밀번호" 제공업체 활성화
4. "사용자 등록" 활성화

### 4.2 LINE 로그인 설정
1. Authentication > Sign-in method에서 "LINE" 제공업체 추가
2. LINE Developers Console에서 앱 생성:
   - [LINE Developers Console](https://developers.line.biz/) 접속
   - 새 Provider 생성
   - Messaging API 채널 생성
   - Channel ID와 Channel Secret 복사
3. Firebase에 LINE 설정 정보 입력:
   - Channel ID 입력
   - Channel Secret 입력
   - Authorized redirect URI: `https://your-project.firebaseapp.com/__/auth/handler`
4. LINE 앱 설정에서 Callback URL 추가:
   - `https://your-project.firebaseapp.com/__/auth/handler`

## 5. Firestore Database 설정

1. 왼쪽 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. 보안 규칙: "테스트 모드에서 시작" 선택
4. 위치: `asia-northeast3 (서울)` 선택

## 6. Firestore 보안 규칙 설정

Firestore Database > 규칙 탭에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        (request.auth.token.role == 'admin' || request.auth.token.role == 'staff');
    }
    
    // 예약 문서
    match /reservations/{reservationId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.role == 'admin' || 
         request.auth.token.role == 'teacher' || 
         request.auth.token.role == 'staff');
    }
    
    // 교실 문서
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || request.auth.token.role == 'staff');
    }
    
    // 코스 문서
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || request.auth.token.role == 'staff');
    }
    
    // 알림 문서
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.role == 'admin' || 
         request.auth.token.role == 'staff');
    }
  }
}
```

## 7. Storage 설정 (선택사항)

1. 왼쪽 메뉴에서 "Storage" 클릭
2. "시작하기" 클릭
3. 보안 규칙: "테스트 모드에서 시작" 선택
4. 위치: `asia-northeast3 (서울)` 선택

## 8. 초기 데이터 생성

환경 변수 설정 후 다음 명령어 실행:

```bash
node scripts/init-firebase-data.js
```

## 9. 개발 모드 vs 프로덕션 모드

- **개발 모드**: Firebase 연결 실패 시 하드코딩된 테스트 사용자로 작동
- **프로덕션 모드**: 실제 Firebase 서비스 사용

환경 변수가 설정되면 자동으로 프로덕션 모드로 전환됩니다.

## 10. 배포 준비

1. Firebase Hosting 설정 (선택사항)
2. 환경 변수 설정
3. 보안 규칙 최적화
4. 성능 모니터링 설정

## 문제 해결

### Firebase 연결 오류
- API 키가 올바른지 확인
- 프로젝트 ID가 일치하는지 확인
- 네트워크 연결 상태 확인

### 인증 오류
- Authentication 설정 확인
- 이메일/비밀번호 제공업체 활성화 확인
- LINE 제공업체 설정 확인

### Firestore 오류
- 보안 규칙 확인
- 데이터베이스 위치 설정 확인

### LINE 로그인 오류
- Channel ID와 Channel Secret 확인
- Callback URL 설정 확인
- LINE 앱 상태 확인 (개발/운영 모드) 