# 🚀 hanguru.school 배포 가이드

## ✅ 빌드 완료!

프로덕션 빌드가 성공적으로 완료되었습니다. 이제 서버에 배포하겠습니다.

---

## 📋 배포 전 체크리스트

### **1. 빌드 파일 확인**
- ✅ `.next/` 디렉터리 생성됨
- ✅ `public/robots.txt` 생성됨
- ✅ `src/middleware.ts` 보안 설정 적용됨
- ✅ `next.config.js` 보안 헤더 설정됨

### **2. 보안 설정 확인**
- ✅ 브라우저만 접근 허용 (User-Agent 체크)
- ✅ hanguru.school 도메인에서만 API 호출 허용
- ✅ 검색엔진 크롤링 차단 (robots.txt)
- ✅ 모든 페이지 noindex, nofollow 설정

---

## 🎯 배포 방법

### **방법 1: 직접 서버 배포 (권장)**

#### **1단계: 파일 업로드**
```bash
# 서버에 접속
ssh user@hanguru.school

# Next.js 앱 디렉터리 생성
mkdir -p /var/www/hanguru-app

# 로컬에서 파일 업로드 (scp 사용)
scp -r .next/ user@hanguru.school:/var/www/hanguru-app/
scp -r public/ user@hanguru.school:/var/www/hanguru-app/
scp package.json user@hanguru.school:/var/www/hanguru-app/
scp next.config.js user@hanguru.school:/var/www/hanguru-app/
```

#### **2단계: 의존성 설치**
```bash
# 서버에서 실행
cd /var/www/hanguru-app
npm install --production
```

#### **3단계: nginx 설정**
```nginx
server {
    listen 443 ssl;
    server_name hanguru.school;

    # SSL 설정
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # 워드프레스 (메인)
    location / {
        # 워드프레스 설정
        try_files $uri $uri/ /index.php?$args;
    }

    # Next.js 앱 (서브 디렉터리)
    location /app/ {
        # 추가 보안: 브라우저 User-Agent 체크
        if ($http_user_agent !~* "(Mozilla|Chrome|Safari|Edge|Opera|Firefox)") {
            return 403;
        }
        
        # Next.js로 프록시
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 보안 헤더
        proxy_hide_header X-Powered-By;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
}
```

#### **4단계: PM2로 실행**
```bash
# PM2 설치 (없다면)
npm install -g pm2

# Next.js 앱 실행
cd /var/www/hanguru-app
pm2 start npm --name "hanguru-app" -- start

# PM2 자동 시작 설정
pm2 startup
pm2 save
```

#### **5단계: nginx 재시작**
```bash
sudo nginx -t  # 설정 테스트
sudo systemctl reload nginx
```

---

### **방법 2: Vercel 배포 (간단)**

#### **1단계: Vercel CLI 설치**
```bash
npm install -g vercel
```

#### **2단계: 배포**
```bash
vercel --prod
```

#### **3단계: 도메인 연결**
- Vercel 대시보드에서 `hanguru.school/app` 서브 디렉터리 설정
- DNS 설정에서 CNAME 추가

---

## 🔧 환경 변수 설정

### **서버에서 .env.local 생성**
```bash
# /var/www/hanguru-app/.env.local
NEXT_PUBLIC_APP_URL=https://hanguru.school
NEXT_PUBLIC_ALLOWED_DOMAIN=hanguru.school
NEXT_PUBLIC_HARDWARE_READER_ENABLED=true
NEXT_PUBLIC_NFC_ENABLED=true
NEXT_PUBLIC_SERIAL_ENABLED=true
NEXT_PUBLIC_USB_HID_ENABLED=true
NEXT_PUBLIC_BLUETOOTH_ENABLED=true
```

---

## 🧪 배포 후 테스트

### **1. 기본 접근 테스트**
```bash
# 브라우저로 접근 (정상)
curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
     https://hanguru.school/app/

# 비정상 User-Agent (차단됨)
curl -H "User-Agent: python-requests/2.25.1" \
     https://hanguru.school/app/
```

### **2. 하드웨어 리더 테스트**
- `https://hanguru.school/app/tagging/home` 접속
- "카드 읽기" 버튼 클릭
- 실제 NFC 리더 연결 테스트

### **3. 보안 헤더 확인**
```bash
curl -I https://hanguru.school/app/
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
```

---

## 📱 접속 URL

### **워드프레스 (기존)**
- `https://hanguru.school/` - 교실 홈페이지

### **Next.js 앱 (새로 추가)**
- `https://hanguru.school/app/` - 메인 대시보드
- `https://hanguru.school/app/tagging/home` - IC 카드 등록
- `https://hanguru.school/app/tagging/student` - 학생 태깅
- `https://hanguru.school/app/admin/` - 관리자 포털
- `https://hanguru.school/app/student/` - 학생 포털
- `https://hanguru.school/app/teacher/` - 선생님 포털

---

## 🔍 문제 해결

### **403 Forbidden 오류**
- User-Agent가 브라우저인지 확인
- nginx 설정에서 User-Agent 체크 확인

### **502 Bad Gateway 오류**
- Next.js 앱이 실행 중인지 확인: `pm2 status`
- 포트 3000이 열려있는지 확인: `netstat -tlnp | grep 3000`

### **하드웨어 리더 연결 실패**
- HTTPS 환경인지 확인
- 브라우저에서 권한 허용 확인
- 실제 리더가 연결되어 있는지 확인

---

## 📞 지원

배포 중 문제가 발생하면:
1. 서버 로그 확인: `pm2 logs hanguru-app`
2. nginx 로그 확인: `sudo tail -f /var/log/nginx/error.log`
3. 브라우저 개발자 도구에서 콘솔 오류 확인

---

## 🎉 배포 완료!

이제 **워드프레스는 그대로 두고**, **Next.js 앱이 강력한 보안으로 보호**되어 `https://hanguru.school/app/`에서 접속할 수 있습니다!

실제 하드웨어 리더와 연동하여 실제 카드 UID를 읽어오는 시스템이 완성되었습니다! 🚀 