# Next.js 앱 보안 가이드

## 🛡️ 적용된 보안 설정

### 1. **미들웨어 보안 (src/middleware.ts)**

- ✅ **브라우저만 허용**: User-Agent가 브라우저가 아니면 403 차단
- ✅ **API 보안**: hanguru.blog 도메인에서만 API 호출 허용
- ✅ **보안 헤더**: XSS, 클릭재킹, MIME 스니핑 방지

### 2. **Next.js 설정 보안 (next.config.js)**

- ✅ **HTTPS 강제**: HSTS 헤더로 HTTPS만 허용
- ✅ **권한 정책**: 카메라, 마이크, 위치 등 접근 제한
- ✅ **캐시 제어**: API 응답 캐싱 방지

### 3. **검색엔진 차단**

- ✅ **robots.txt**: 모든 검색엔진 크롤링 차단
- ✅ **meta robots**: 모든 페이지 noindex, nofollow

---

## 🚀 배포 방법

### **워드프레스와 함께 운영**

```
https://hanguru.blog/          ← 워드프레스 (교실 홈페이지)
https://hanguru.blog/app/      ← Next.js 앱 (예약/관리 시스템)
```

### **배포 단계**

1. **빌드**: `npm run build`
2. **업로드**: Next.js 앱을 서버의 `/app` 디렉터리에 배포
3. **실행**: `npm start` 또는 PM2로 백그라운드 실행
4. **프록시**: nginx/Apache로 `/app` 경로를 Next.js로 프록시

---

## 🔧 nginx 설정 예시

```nginx
server {
    listen 443 ssl;
    server_name hanguru.blog;

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

---

## 🧪 보안 테스트

### **정상 접근 테스트**

```bash
# 브라우저로 접근 (정상)
curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
     https://hanguru.blog/app/

# 브라우저로 API 호출 (정상)
curl -H "User-Agent: Mozilla/5.0" \
     -H "Referer: https://hanguru.blog/app/" \
     https://hanguru.blog/app/api/hardware/uid-reader
```

### **차단 테스트**

```bash
# 비정상 User-Agent (차단됨)
curl -H "User-Agent: python-requests/2.25.1" \
     https://hanguru.blog/app/

# 외부 도메인에서 API 호출 (차단됨)
curl -H "User-Agent: Mozilla/5.0" \
     -H "Referer: https://malicious-site.com" \
     https://hanguru.blog/app/api/hardware/uid-reader
```

---

## 📋 체크리스트

- [ ] Next.js 앱 빌드 성공
- [ ] 미들웨어 보안 설정 적용
- [ ] robots.txt 및 meta robots 설정
- [ ] nginx/Apache 프록시 설정
- [ ] SSL 인증서 적용
- [ ] 보안 헤더 확인
- [ ] 브라우저 접근 테스트
- [ ] 비정상 접근 차단 테스트

---

## 🔍 문제 해결

### **403 Forbidden 오류**

- User-Agent가 브라우저인지 확인
- Referer/Origin 헤더 확인

### **API 호출 실패**

- hanguru.blog 도메인에서 호출하는지 확인
- CORS 설정 확인

### **하드웨어 리더 연결 실패**

- HTTPS 환경인지 확인
- 브라우저 권한 허용 확인

---

이제 **워드프레스는 그대로 두고**, **Next.js 앱만 강력한 보안으로 보호**됩니다! 🎉
