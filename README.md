# 🏫 Malmöi Classroom Booking System

## 🚀 Deployed System
**Live URL:** https://malmoi-system.vercel.app

**Last Updated:** 2025-01-26 (배포 문제 해결용)

**Deployment Status:** 🔄 **재배포 필요**

## 🏗️ 시스템 아키텍처

### **Frontend**
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Vercel 배포**

### **Backend**
- **AWS Cognito** - 사용자 인증
- **AWS RDS PostgreSQL** - 데이터베이스
- **AWS S3** - 파일 저장소
- **Next.js API Routes** - 서버리스 함수

### **데이터베이스 스키마**
```sql
-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    cognito_user_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 강의실 테이블
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 예약 테이블
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    room_id INTEGER REFERENCES rooms(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 결제 테이블
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    reservation_id INTEGER REFERENCES reservations(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 설정 완료된 AWS 서비스

### **1. AWS S3 (파일 저장소)**
- **버킷 이름:** `malmoi-system-files`
- **리전:** `ap-northeast-2` (서울)
- **버전 관리:** 활성화
- **기본 암호화:** SSE-S3
- **공개 액세스:** 차단됨

### **2. AWS Cognito (인증)**
- **User Pool ID:** `ap-northeast-2_gnMo24nfg`
- **Client ID:** `597vkd6rjamd92p6s3bvk39p21`
- **리전:** `ap-northeast-2` (서울)

### **3. AWS RDS PostgreSQL (데이터베이스)**
- **엔드포인트:** `malmoi-system-db.cp4q8o4akkqg.ap-northeast-2.rds.amazonaws.com`
- **데이터베이스:** `malmoi_system`
- **사용자:** `malmoi_admin`
- **리전:** `ap-northeast-2` (서울)

## 📋 Vercel 환경 변수 설정

**Vercel 대시보드 → Settings → Environment Variables**에서 다음 변수들을 설정해야 합니다:

### **기본 환경 변수**
```env
# AWS Configuration
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Database
DATABASE_URL=postgresql://malmoi_admin:password@malmoi-system-db.cp4q8o4akkqg.ap-northeast-2.rds.amazonaws.com:5432/malmoi_system

# AWS Cognito
COGNITO_USER_POOL_ID=ap-northeast-2_gnMo24nfg
COGNITO_CLIENT_ID=597vkd6rjamd92p6s3bvk39p21
COGNITO_CLIENT_SECRET=your_cognito_client_secret

# AWS S3
S3_BUCKET_NAME=malmoi-system-files
S3_REGION=ap-northeast-2

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://hanguru.school
```

### **LINE 연동 환경 변수**
```env
# LINE Login Configuration
NEXT_PUBLIC_LINE_CLIENT_ID=your_line_channel_id_here
NEXT_PUBLIC_LINE_REDIRECT_URI=https://hanguru.school/auth/line/callback

# LINE Messaging API (Optional)
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here
LINE_CHANNEL_SECRET=your_line_channel_secret_here
```

### **필수 환경 변수:**
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=malmoi-system-files
AWS_COGNITO_USER_POOL_ID=ap-northeast-2_gnMo24nfg
AWS_COGNITO_CLIENT_ID=597vkd6rjamd92p6s3bvk39p21
AWS_RDS_HOST=malmoi-system-db.cp4q8o4akkqg.ap-northeast-2.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=malmoi_system
AWS_RDS_USERNAME=malmoi_admin
AWS_RDS_PASSWORD=your_rds_password
JWT_SECRET=your_jwt_secret_key
```

## 👤 관리자 계정 설정

### **AWS Cognito에서 관리자 사용자 생성:**

1. **AWS 콘솔** → **Cognito** → **User Pools** → **malmoi-system-users**
2. **Users and groups** → **Create user**
3. **사용자 정보 입력:**
   - **Username:** `hanguru.school@gmail.com`
   - **Email:** `hanguru.school@gmail.com`
   - **Password:** `alfl1204`
   - **Mark email as verified:** ✅ 체크
4. **Create user** 클릭

### **데이터베이스에 관리자 정보 추가:**
```sql
INSERT INTO users (email, name, role, cognito_user_id) VALUES 
('hanguru.school@gmail.com', '관리자', 'admin', 'admin_user_001');
```

## 🎯 주요 기능

### **관리자 기능**
- 📊 대시보드 통계
- 👥 사용자 관리
- 📅 예약 관리
- 🏢 강의실 관리
- 💰 결제 관리

### **학생 기능**
- 📅 예약 생성/수정/취소
- 🔍 예약 검색 및 필터
- 📋 예약 목록 조회
- 👤 프로필 관리

### **공통 기능**
- 🔐 AWS Cognito 인증
- 📱 반응형 디자인
- 🌐 다국어 지원 (한국어/일본어)

## 🚀 배포 방법

### **자동 배포 (권장)**
1. **GitHub 저장소 연결**
2. **Vercel 환경 변수 설정**
3. **자동 배포 완료**

### **수동 배포**
```bash
# 의존성 설치
npm install

# 빌드
npm run build

# Vercel 배포
vercel --prod
```

## 🔗 API 엔드포인트

### **인증**
- `POST /api/auth/aws-login` - 로그인
- `POST /api/auth/aws-register` - 회원가입
- `POST /api/auth/verify` - 토큰 검증

### **예약**
- `POST /api/reservations/create` - 예약 생성
- `GET /api/reservations/list` - 예약 목록
- `PUT /api/reservations/[id]` - 예약 수정
- `DELETE /api/reservations/[id]` - 예약 삭제

### **강의실**
- `GET /api/rooms/list` - 강의실 목록

### **파일 업로드**
- `POST /api/upload` - 파일 업로드
- `DELETE /api/upload` - 파일 삭제

## 🛠️ 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/hanguru-school/malmoi-system.git
cd malmoi-system

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 📝 기술 스택

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, AWS SDK
- **Database:** PostgreSQL (AWS RDS)
- **Authentication:** AWS Cognito
- **Storage:** AWS S3
- **Deployment:** Vercel
- **Version Control:** Git, GitHub

## 🔒 보안

- **JWT 토큰 기반 인증**
- **AWS IAM 권한 관리**
- **HTTPS 강제 적용**
- **SQL 인젝션 방지**
- **XSS 방지**

## 📞 지원

**시스템 관련 문의:** hanguru.school@gmail.com

---

**© 2024 Malmoi System. All rights reserved.**
