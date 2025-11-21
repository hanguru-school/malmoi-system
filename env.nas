# ========================================
# MalMoi 한국어 교실 - NAS 서버 환경 변수
# Vercel + AWS 환경과 NAS 환경에서 공통 사용
# ========================================

# ========================================
# 서버 환경 설정
# ========================================
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://app.hanguru.school
NEXT_PUBLIC_PRODUCTION_URL=https://app.hanguru.school

# ========================================
# 데이터베이스 설정 (AWS RDS PostgreSQL)
# ========================================
DATABASE_URL=postgresql://malmoi_admin:malmoi_admin_password_2024@malmoi-system-db-tokyo.crooggsemeim.ap-northeast-1.rds.amazonaws.com:5432/malmoi_system?sslmode=require

# AWS RDS 개별 설정
AWS_RDS_HOST=malmoi-system-db-tokyo.crooggsemeim.ap-northeast-1.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=malmoi_system
AWS_RDS_USERNAME=malmoi_admin
AWS_RDS_PASSWORD=malmoi_admin_password_2024

# ========================================
# AWS 설정
# ========================================
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# ========================================
# AWS S3 설정
# ========================================
S3_BUCKET_NAME=malmoi-system-files
S3_REGION=ap-northeast-1
S3_BUCKET_REGION=ap-northeast-1

# ========================================
# AWS Cognito 설정
# ========================================
COGNITO_USER_POOL_ID=ap-northeast-1_5R7g8tN40
COGNITO_CLIENT_ID=4bdn0n9r92huqpcs21e0th1nve
COGNITO_CLIENT_SECRET=9ko7sn73f63en08gqh8uhhmvaagmt2o1vn9gnffjcgoecjskf8e
COGNITO_DOMAIN=https://malmoi-system-pool.auth.ap-northeast-1.amazoncognito.com

# Next.js Public Cognito 설정
NEXT_PUBLIC_COGNITO_CALLBACK_URL=https://app.hanguru.school/api/auth/callback/cognito
NEXT_PUBLIC_COGNITO_SIGNOUT_URL=https://app.hanguru.school
NEXT_PUBLIC_COGNITO_OAUTH_SCOPES=email openid phone

# ========================================
# JWT 설정
# ========================================
JWT_SECRET=4822d5d02c9ec4fd183db70c1645ec1e

# ========================================
# LINE 설정
# ========================================
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CALLBACK_URL=https://app.hanguru.school/api/auth/callback/line

# ========================================
# 이메일 설정 (필요시)
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# ========================================
# API 설정
# ========================================
API_BASE_URL=https://app.hanguru.school/api

# ========================================
# 기능 플래그
# ========================================
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
ENABLE_BACKUP=true
NEXT_PUBLIC_DEV_MODE=false

# ========================================
# 모니터링 설정
# ========================================
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info

# ========================================
# 백업 설정
# ========================================
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# ========================================
# NAS 서버 전용 설정 (NAS에서만 사용)
# ========================================
# NAS 서버에서 실행 시 포트 설정
PORT=3000
HOSTNAME=0.0.0.0

# NAS 서버에서 실행 시 로컬 URL (개발용)
# NEXT_PUBLIC_APP_URL=http://localhost:3000
# NEXT_PUBLIC_PRODUCTION_URL=http://localhost:3000 