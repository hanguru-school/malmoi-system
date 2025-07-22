# 🚀 hanguru.app 서버 설정 가이드

## 📋 사전 준비사항

### **도메인 정보**
- 도메인: `hanguru.app`
- 구입처: Namecheap
- 비용: $19.88/년

### **서버 정보**
- 호스팅: DigitalOcean
- 서버: Ubuntu 22.04 LTS
- 비용: $5/월
- 지역: Singapore (가장 가까움)

---

## 🔧 1단계: 서버 기본 설정

### **서버 접속**
```bash
ssh root@YOUR_SERVER_IP
```

### **시스템 업데이트**
```bash
apt update && apt upgrade -y
```

### **필수 패키지 설치**
```bash
apt install -y curl wget git nginx certbot python3-certbot-nginx
```

### **Node.js 설치**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
```

### **PM2 설치**
```bash
npm install -g pm2
```

---

## 🌐 2단계: Nginx 설정

### **Nginx 기본 설정**
```bash
# 기본 사이트 비활성화
rm /etc/nginx/sites-enabled/default

# hanguru.app 설정 파일 생성
nano /etc/nginx/sites-available/hanguru.app
```

### **Nginx 설정 내용**
```nginx
server {
    listen 80;
    server_name hanguru.app www.hanguru.app;
    
    # 보안 헤더
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 브라우저만 허용
    if ($http_user_agent !~* "(Mozilla|Chrome|Safari|Edge|Opera|Firefox)") {
        return 403;
    }
    
    # Next.js 앱으로 프록시
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 보안 헤더
        proxy_hide_header X-Powered-By;
    }
    
    # 정적 파일 캐싱
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### **Nginx 활성화**
```bash
ln -s /etc/nginx/sites-available/hanguru.app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🔒 3단계: SSL 인증서 설정

### **Let's Encrypt SSL 인증서 발급**
```bash
certbot --nginx -d hanguru.app -d www.hanguru.app
```

### **SSL 자동 갱신 설정**
```bash
crontab -e
# 다음 줄 추가:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📁 4단계: 애플리케이션 배포

### **애플리케이션 디렉터리 생성**
```bash
mkdir -p /var/www/hanguru-app
cd /var/www/hanguru-app
```

### **배포 파일 업로드 (로컬에서 실행)**
```bash
# 로컬 컴퓨터에서 실행
scp hanguru-app-deploy.tar.gz root@YOUR_SERVER_IP:/var/www/hanguru-app/
```

### **서버에서 파일 압축 해제**
```bash
cd /var/www/hanguru-app
tar -xzf hanguru-app-deploy.tar.gz
npm install --production
```

### **환경 변수 설정**
```bash
nano .env.local
```

### **환경 변수 내용**
```env
NEXT_PUBLIC_APP_URL=https://hanguru.app
NEXT_PUBLIC_ALLOWED_DOMAIN=hanguru.app
NEXT_PUBLIC_HARDWARE_READER_ENABLED=true
NEXT_PUBLIC_NFC_ENABLED=true
NEXT_PUBLIC_SERIAL_ENABLED=true
NEXT_PUBLIC_USB_HID_ENABLED=true
NEXT_PUBLIC_BLUETOOTH_ENABLED=true
```

### **PM2로 애플리케이션 실행**
```bash
pm2 start npm --name "hanguru-app" -- start
pm2 startup
pm2 save
```

---

## 🌍 5단계: 도메인 DNS 설정

### **Namecheap DNS 설정**
1. Namecheap 대시보드 접속
2. `hanguru.app` 도메인 선택
3. **Domain** 탭 → **Advanced DNS** 클릭
4. **A Record** 추가:
   ```
   Type: A Record
   Host: @
   Value: YOUR_SERVER_IP
   TTL: Automatic
   ```
5. **CNAME Record** 추가:
   ```
   Type: CNAME Record
   Host: www
   Value: hanguru.app
   TTL: Automatic
   ```

---

## 🧪 6단계: 배포 테스트

### **기본 접근 테스트**
```bash
# 브라우저에서 접속
https://hanguru.app/
```

### **보안 테스트**
```bash
# 비정상 User-Agent 차단 테스트
curl -H "User-Agent: python-requests/2.25.1" https://hanguru.app/
# 403 Forbidden 응답 확인
```

### **하드웨어 리더 테스트**
```bash
# 브라우저에서 접속
https://hanguru.app/tagging/home
```

---

## 📊 7단계: 모니터링 설정

### **PM2 모니터링**
```bash
pm2 monit
```

### **Nginx 로그 확인**
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### **애플리케이션 로그 확인**
```bash
pm2 logs hanguru-app
```

---

## 🔧 8단계: 백업 설정

### **자동 백업 스크립트 생성**
```bash
nano /root/backup.sh
```

### **백업 스크립트 내용**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/hanguru-app"

mkdir -p $BACKUP_DIR

# 애플리케이션 백업
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/hanguru-app/

# Nginx 설정 백업
tar -czf $BACKUP_DIR/nginx_$DATE.tar.gz /etc/nginx/

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### **백업 자동화**
```bash
chmod +x /root/backup.sh
crontab -e
# 다음 줄 추가:
0 2 * * * /root/backup.sh
```

---

## ✅ 배포 완료!

### **최종 접속 URL**
- **메인**: https://hanguru.app/
- **IC 카드 등록**: https://hanguru.app/tagging/home
- **관리자**: https://hanguru.app/admin/
- **학생**: https://hanguru.app/student/
- **선생님**: https://hanguru.app/teacher/

### **보안 기능**
- ✅ 브라우저만 접근 허용
- ✅ HTTPS 강제 적용
- ✅ 보안 헤더 설정
- ✅ 하드웨어 리더 연동 가능

### **비용 요약**
- 도메인: $19.88/년
- 서버: $5/월 ($60/년)
- **총 비용: $79.88/년**

---

## 🆘 문제 해결

### **502 Bad Gateway**
```bash
pm2 status
pm2 restart hanguru-app
```

### **SSL 인증서 오류**
```bash
certbot --nginx -d hanguru.app
```

### **도메인 연결 안됨**
- DNS 설정 확인
- 24-48시간 대기 (DNS 전파 시간)

---

**이제 hanguru.app으로 완벽한 시스템이 구축됩니다!** 🎉 