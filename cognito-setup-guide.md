# AWS Cognito 설정 가이드 (처음부터)

## 1. AWS Cognito User Pool 생성

### 1.1 User Pool 생성
1. **AWS 콘솔** → **Cognito** → **User Pools** → **Create user pool**
2. **Configure sign-in experience:**
   - **Cognito user pool sign-in options:** `Email` 선택
   - **User name requirements:** `Allow email addresses` 선택
   - **Next**

### 1.2 Password policy 설정
1. **Configure security requirements:**
   - **Password policy:** `Cognito defaults` 선택
   - **Multi-factor authentication:** `No MFA` 선택
   - **User account recovery:** `Self-service recovery` 선택
   - **Next**

### 1.3 Sign-up experience 설정
1. **Configure sign-up experience:**
   - **Self-service sign-up:** `Enable self-service sign-up` 체크
   - **Cognito-assisted verification and confirmation:** `Cognito will send an email with a verification code` 선택
   - **Next**

### 1.4 Message delivery 설정
1. **Configure message delivery:**
   - **Email provider:** `Send email with Cognito` 선택
   - **From email address:** `no-reply@verificationemail.com` 선택
   - **Next**

### 1.5 Integrate your app 설정
1. **Integrate your app:**
   - **User pool name:** `malmoi-system-pool-v2`
   - **Initial app client:**
     - **App client name:** `malmoi-system-client-v2`
     - **Confidential client:** 체크 해제
   - **Next**

### 1.6 Review and create
1. **Review and create**
2. **Create user pool** 클릭

## 2. App Client 설정

### 2.1 App Client 편집
1. **생성된 User Pool** → **App integration** → **App client and analytics**
2. **malmoi-system-client-v2** 클릭
3. **Edit app client** 클릭

### 2.2 Authentication flows 설정
1. **Authentication flows:**
   - ✅ **Sign in with username and password: ALLOW_USER_PASSWORD_AUTH** 체크
   - ✅ **Sign in with secure remote password (SRP): ALLOW_USER_SRP_AUTH** 체크
   - ✅ **Get user tokens from existing authenticated sessions: ALLOW_REFRESH_TOKEN_AUTH** 체크
   - ❌ **Sign in with server-side administrative credentials: ALLOW_ADMIN_USER_PASSWORD_AUTH** 체크 해제
   - ❌ **Sign in with custom authentication flows from Lambda triggers: ALLOW_CUSTOM_AUTH** 체크 해제
2. **Save changes** 클릭

## 3. 관리자 사용자 생성

### 3.1 사용자 생성
1. **User Pool** → **Users and groups** → **Create user**
2. **사용자 정보:**
   - **Username:** `hanguru.school@gmail.com`
   - **Email:** `hanguru.school@gmail.com`
   - **Password:** `alfl1204`
   - **Mark email as verified:** ✅ 체크
3. **Create user** 클릭

## 4. 환경 변수 업데이트

### 4.1 새로운 User Pool 정보
- **User Pool ID:** (새로 생성된 ID)
- **Client ID:** (새로 생성된 ID)

### 4.2 Vercel 환경 변수 업데이트
```
AWS_COGNITO_USER_POOL_ID=새로운_USER_POOL_ID
AWS_COGNITO_CLIENT_ID=새로운_CLIENT_ID
```

## 5. 코드 테스트

### 5.1 로그인 테스트
1. **배포된 애플리케이션에서 로그인 시도**
2. **이메일:** `hanguru.school@gmail.com`
3. **비밀번호:** `alfl1204` 