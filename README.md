# 🏫 Malmoi System - AWS 기반 실전 시스템

강의실 예약 및 관리 시스템입니다.

## 🚀 실전 배포 완료

### **✅ 구축된 실전 시스템:**

1. **AWS Cognito** - 사용자 인증 및 권한 관리
2. **AWS RDS PostgreSQL** - 실시간 데이터베이스
3. **AWS S3** - 파일 저장소
4. **Vercel** - 웹 애플리케이션 배포
5. **토스페이먼츠** - 실전 결제 시스템

---

## 🔧 AWS 설정 가이드

### **1. AWS Cognito 설정**

**사용자 풀 생성:**
1. AWS 콘솔 → Cognito → User Pools → Create user pool
2. **Step 1: Configure sign-in experience**
   - Cognito user pool sign-in options: Email
   - User name requirements: Allow email addresses
3. **Step 2: Configure security requirements**
   - Password policy: Custom
   - Minimum length: 8
   - Require uppercase letters: Yes
   - Require lowercase letters: Yes
   - Require numbers: Yes
   - Require special characters: Yes
4. **Step 3: Configure sign-up experience**
   - Self-service sign-up: Enabled
   - Cognito-assisted verification and confirmation: Email
5. **Step 4: Configure message delivery**
   - Email provider: Send email with Cognito
6. **Step 5: Integrate your app**
   - User pool name: `malmoi-system-users`
   - App client name: `malmoi-system-client`
7. **Step 6: Review and create**

**앱 클라이언트 설정:**
- Authentication flows: ALLOW_USER_PASSWORD_AUTH
- Generate client secret: No

### **2. AWS RDS PostgreSQL 설정**

**데이터베이스 생성:**
1. AWS 콘솔 → RDS → Databases → Create database
2. **Choose a database creation method:** Standard create
3. **Engine type:** PostgreSQL
4. **Version:** PostgreSQL 15.4
5. **Templates:** Free tier
6. **Settings:**
   - DB instance identifier: `malmoi-system-db`
   - Master username: `malmoi_admin`
   - Master password: `강력한비밀번호설정`
7. **Instance configuration:** db.t3.micro
8. **Storage:** 20 GB
9. **Connectivity:** Public access: Yes
10. **Database authentication:** Password authentication

### **3. AWS S3 버킷 설정**

**버킷 생성:**
1. AWS 콘솔 → S3 → Create bucket
2. **Bucket name:** `malmoi-system-files`
3. **Region:** Asia Pacific (Seoul) ap-northeast-2
4. **Block Public Access settings:** Uncheck all
5. **Bucket Versioning:** Enable
6. **Default encryption:** Enable (SSE-S3)
7. **Object Lock:** Disable

### **4. 토스페이먼츠 설정**

**계정 생성 및 설정:**
1. [토스페이먼츠](https://pay.toss.im/) 가입
2. **가맹점 정보 등록**
3. **API 키 발급**
   - Client Key
   - Secret Key

---

## 🔐 환경 변수 설정

### **Vercel 대시보드에서 설정:**

**AWS 설정:**
```
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**AWS Cognito 설정:**
```
AWS_COGNITO_USER_POOL_ID=ap-northeast-2_xxxxxxxxx
AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_COGNITO_IDENTITY_POOL_ID=ap-northeast-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**AWS RDS 설정:**
```
AWS_RDS_HOST=malmoi-system-db.xxxxxxxxx.ap-northeast-2.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=malmoi_system
AWS_RDS_USERNAME=malmoi_admin
AWS_RDS_PASSWORD=your-database-password
```

**AWS S3 설정:**
```
AWS_S3_BUCKET=malmoi-system-files
```

**토스페이먼츠 설정:**
```
TOSS_PAYMENTS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
TOSS_PAYMENTS_SECRET_KEY=test_sk_D4yKeq5bgrpKRd0JYbLVGX0lzW6Y
```

**JWT 설정:**
```
JWT_SECRET=your-super-secret-jwt-key-here
```

**앱 URL:**
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 📊 데이터베이스 스키마

### **PostgreSQL 테이블 생성:**

```sql
-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 강의실 테이블
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    description TEXT,
    hourly_rate INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 예약 테이블
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    room_id UUID REFERENCES rooms(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 결제 테이블
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    reservation_id UUID REFERENCES reservations(id),
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'KRW',
    payment_method VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_room_id ON reservations(room_id);
CREATE INDEX idx_reservations_time ON reservations(start_time, end_time);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

## 🚀 배포 명령어

### **자동 배포 (GitHub 연동):**
```bash
# 코드 변경 후
git add .
git commit -m "실전 시스템 업데이트"
git push origin main
# Vercel에서 자동 배포
```

### **수동 배포:**
```bash
npm run build
vercel --prod
```

---

## 📱 실전 기능

### **✅ 완료된 기능:**

1. **사용자 관리**
   - AWS Cognito 기반 인증
   - 역할별 권한 관리 (관리자/강사/학생)
   - 프로필 관리

2. **강의실 예약**
   - 실시간 예약 가능 여부 확인
   - 예약 충돌 방지
   - 예약 시간 제한 (최대 4시간)

3. **결제 시스템**
   - 토스페이먼츠 연동
   - 실시간 결제 처리
   - 결제 내역 관리

4. **관리자 대시보드**
   - 실시간 통계
   - 시스템 모니터링
   - 사용자 활동 추적

5. **파일 관리**
   - AWS S3 파일 업로드/다운로드
   - 파일 버전 관리
   - 보안 접근 제어

---

## 🔒 보안 설정

### **AWS IAM 권한:**
- Cognito 사용자 풀 관리
- RDS 데이터베이스 접근
- S3 버킷 읽기/쓰기
- SNS 알림 발송

### **네트워크 보안:**
- RDS 보안 그룹 설정
- VPC 구성
- SSL/TLS 암호화

---

## 📞 지원

**문제 발생 시:**
1. Vercel 대시보드에서 로그 확인
2. AWS CloudWatch에서 오류 추적
3. 데이터베이스 연결 상태 확인

**실전 운영 준비 완료!** 🎉
