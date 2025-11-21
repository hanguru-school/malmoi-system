# 🚀 개발부터 운영까지 완벽 가이드

## 📋 개요

**현재 상황**: UGREEN NASync DXP2800 구매 완료
**목표**: 개발은 Mac + ngrok, 완성 후 DXP2800으로 이전

---

## 🎯 3단계 계획

```
📍 1단계: 개발 (지금)
→ Mac에서 로컬 개발
→ ngrok으로 외부 테스트

📍 2단계: 테스트 (완성 후)
→ DXP2800에 배포
→ 내부 네트워크에서 테스트

📍 3단계: 운영 (서비스 오픈)
→ 공유기 포트포워딩 설정
→ DDNS로 외부 접속 가능
→ 실제 서비스 시작
```

---

## 🔵 1단계: 현재 개발 환경 (Mac + ngrok)

### 1.1 Mac에서 개발 서버 실행

```bash
cd /Users/jinasmacbook/booking-system

# 데이터베이스 동기화 (처음 한번만)
npx prisma db push
npx prisma generate

# 개발 서버 실행
npm run dev
```

### 1.2 ngrok으로 외부 접속 가능하게 설정

#### ngrok 설치 및 설정
```bash
# 1. ngrok 설치
brew install ngrok

# 2. ngrok 회원가입
# https://ngrok.com/signup

# 3. 인증토큰 복사 (대시보드에서)
# https://dashboard.ngrok.com/get-started/your-authtoken

# 4. 인증토큰 설정
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### ngrok 실행
```bash
# 새 터미널 창 열기 (Command + T)
ngrok http 3004

# 결과:
# Forwarding: https://abc123-456.ngrok-free.app -> http://localhost:3004
```

### 1.3 테스트

```bash
# 1. 브라우저에서 ngrok URL 접속
https://abc123-456.ngrok-free.app

# 2. 입회 테스트
# → /enrollment 페이지에서 학생 등록

# 3. 로그인 테스트
# → 학번 또는 이메일로 로그인
```

### 1.4 ngrok 무료 vs 유료

| 기능 | 무료 | 유료 ($8/월) |
|------|------|-------------|
| URL | 매번 변경 | 고정 가능 |
| 세션 시간 | 2시간 | 무제한 |
| 동시 터널 | 1개 | 3개 |
| 커스텀 도메인 | ❌ | ✅ |

**추천**: 개발 단계는 **무료**로 충분!

---

## 🟢 2단계: DXP2800 NAS 서버 설정

### 2.1 DXP2800 기본 설정

#### 하드웨어 연결
```bash
# 1. DXP2800 전원 켜기
# 2. 랜선으로 공유기에 연결
# 3. 모니터/키보드 연결 (초기 설정)
# 4. 또는 웹 UI로 접속 (192.168.x.x)
```

#### 관리자 계정 설정
```bash
# SSH 접속 활성화
# DXP2800 웹 UI → 설정 → SSH 활성화

# Mac에서 SSH 접속
ssh admin@192.168.x.x  # DXP2800 IP 주소
```

#### 고정 IP 설정
```bash
# DXP2800 웹 UI에서 설정
# 네트워크 → 고정 IP 설정
# 예: 192.168.0.100
```

### 2.2 필수 소프트웨어 설치

```bash
# SSH로 DXP2800 접속
ssh admin@192.168.0.100

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 설치 (18 이상)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git 설치
sudo apt install -y git

# PostgreSQL 클라이언트 설치
sudo apt install -y postgresql-client

# 버전 확인
node --version  # v18.x 이상
npm --version   # 9.x 이상
git --version
```

### 2.3 프로젝트 배포

```bash
# 프로젝트 클론
cd /home/admin
git clone https://github.com/YOUR_USERNAME/booking-system.git malmoi-system
cd malmoi-system

# 환경변수 설정
nano .env
```

#### .env 파일 내용
```bash
# 데이터베이스
DATABASE_URL="postgresql://username:password@localhost:5432/malmoi_db"

# NextAuth
NEXTAUTH_URL="http://192.168.0.100:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# 이메일 (선택)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# JWT
JWT_SECRET="your-jwt-secret"
```

#### 빌드 및 실행
```bash
# 의존성 설치
npm install

# Prisma 설정
npx prisma generate
npx prisma db push

# 빌드
npm run build

# 실행
npm run start

# 백그라운드 실행 (터미널 닫아도 계속 실행)
nohup npm run start > /dev/null 2>&1 &
```

### 2.4 자동 시작 설정 (systemd)

```bash
# 서비스 파일 생성
sudo nano /etc/systemd/system/malmoi.service
```

#### malmoi.service 내용
```ini
[Unit]
Description=MalMoi Korean Class System
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/malmoi-system
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### 서비스 활성화
```bash
# 서비스 등록
sudo systemctl daemon-reload
sudo systemctl enable malmoi
sudo systemctl start malmoi

# 상태 확인
sudo systemctl status malmoi

# 로그 확인
sudo journalctl -u malmoi -f
```

### 2.5 방화벽 설정

```bash
# 방화벽 설정 (필요한 포트 열기)
sudo ufw allow 22    # SSH
sudo ufw allow 3000  # Next.js
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# 상태 확인
sudo ufw status
```

### 2.6 내부 네트워크 테스트

```bash
# Mac이나 다른 기기에서 접속 테스트
# 브라우저 열기
http://192.168.0.100:3000

# 입회 테스트
# 로그인 테스트
# 모든 기능 확인
```

---

## 🔴 3단계: 외부 인터넷 접속 설정 (운영)

### 3.1 공유기 포트포워딩 설정

#### 공유기 관리자 페이지 접속
```bash
# 일반적인 공유기 주소
192.168.0.1
192.168.1.1
```

#### 포트포워딩 규칙 추가
```
외부 포트: 80 → 내부 IP: 192.168.0.100, 포트: 3000
외부 포트: 443 → 내부 IP: 192.168.0.100, 포트: 3000
```

### 3.2 DDNS 설정 (동적 도메인)

#### Duck DNS 사용 (무료, 추천!)

```bash
# 1. Duck DNS 가입
https://www.duckdns.org/

# 2. 도메인 생성
malmoi-korean.duckdns.org

# 3. DXP2800에 Duck DNS 클라이언트 설치
sudo apt install curl

# 4. Duck DNS 업데이트 스크립트 생성
nano ~/duckdns.sh
```

#### duckdns.sh 내용
```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=malmoi-korean&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns.log -K -
```

#### 자동 업데이트 설정
```bash
# 실행 권한 부여
chmod +x ~/duckdns.sh

# cron 설정 (5분마다 IP 업데이트)
crontab -e

# 추가:
*/5 * * * * ~/duckdns.sh >/dev/null 2>&1
```

### 3.3 SSL 인증서 설정 (HTTPS)

#### Nginx 설치
```bash
sudo apt install -y nginx
```

#### Nginx 설정
```bash
sudo nano /etc/nginx/sites-available/malmoi
```

#### malmoi nginx 설정
```nginx
server {
    listen 80;
    server_name malmoi-korean.duckdns.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 설정 활성화
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/malmoi /etc/nginx/sites-enabled/

# Nginx 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

#### Let's Encrypt SSL 인증서 (무료)
```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d malmoi-korean.duckdns.org

# 자동 갱신 설정 (이미 자동 설정됨)
sudo certbot renew --dry-run
```

### 3.4 최종 테스트

```bash
# 외부 인터넷에서 접속 (4G/5G로 테스트)
https://malmoi-korean.duckdns.org

# 모든 기능 테스트
# - 입회 신청
# - 로그인
# - 규정 동의
# - 학생 대시보드
```

---

## 📊 전체 아키텍처

```
┌─────────────────────────────────────────────────┐
│              개발 단계 (지금)                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Mac (localhost:3004)                           │
│    ↓ ngrok 터널                                 │
│  https://abc123.ngrok-free.app                  │
│    ↓ 외부 접속 가능                             │
│  친구/동료에게 공유                              │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              완성 단계                           │
├─────────────────────────────────────────────────┤
│                                                 │
│  DXP2800 NAS (192.168.0.100:3000)               │
│    ↓ 내부 네트워크                              │
│  http://192.168.0.100:3000                      │
│    ↓ 같은 WiFi에서 테스트                       │
│  모든 기능 확인                                  │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              운영 단계 (서비스 오픈)             │
├─────────────────────────────────────────────────┤
│                                                 │
│  인터넷 (4G/5G/WiFi)                            │
│    ↓                                            │
│  https://malmoi-korean.duckdns.org              │
│    ↓ 공유기 포트포워딩                          │
│  DXP2800 NAS (192.168.0.100)                    │
│    ↓ Nginx Reverse Proxy                       │
│  Next.js App (localhost:3000)                   │
│    ↓                                            │
│  PostgreSQL Database                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ 단계별 명령어 요약

### 개발 단계 (Mac)
```bash
# 1. 개발 서버 실행
npm run dev

# 2. ngrok 터널 (새 터미널)
ngrok http 3004

# 3. 테스트
# https://abc123.ngrok-free.app
```

### DXP2800 배포
```bash
# 1. SSH 접속
ssh admin@192.168.0.100

# 2. 프로젝트 클론
git clone https://github.com/YOUR_USERNAME/booking-system.git malmoi-system
cd malmoi-system

# 3. 환경 설정
nano .env

# 4. 설치 및 빌드
npm install
npx prisma generate
npx prisma db push
npm run build

# 5. 서비스 등록
sudo cp malmoi.service /etc/systemd/system/
sudo systemctl enable malmoi
sudo systemctl start malmoi

# 6. 확인
sudo systemctl status malmoi
```

### 외부 접속 설정
```bash
# 1. DDNS 설정
# Duck DNS에서 도메인 생성 후
nano ~/duckdns.sh
chmod +x ~/duckdns.sh
crontab -e  # */5 * * * * ~/duckdns.sh

# 2. Nginx + SSL
sudo apt install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/malmoi
sudo ln -s /etc/nginx/sites-available/malmoi /etc/nginx/sites-enabled/
sudo certbot --nginx -d malmoi-korean.duckdns.org

# 3. 완료!
# https://malmoi-korean.duckdns.org
```

---

## 📋 체크리스트

### ✅ 개발 단계 (지금)
- [ ] Mac에서 개발 서버 실행 (`npm run dev`)
- [ ] ngrok 설치 및 계정 생성
- [ ] ngrok 터널 생성 (`ngrok http 3004`)
- [ ] 외부에서 접속 테스트
- [ ] 입회/로그인 기능 테스트

### ✅ DXP2800 배포 (완성 후)
- [ ] DXP2800 전원 및 네트워크 연결
- [ ] 고정 IP 설정 (예: 192.168.0.100)
- [ ] SSH 접속 활성화
- [ ] Node.js, Git, PostgreSQL 설치
- [ ] 프로젝트 클론 및 환경변수 설정
- [ ] 빌드 및 실행
- [ ] systemd 서비스 등록
- [ ] 내부 네트워크에서 테스트

### ✅ 외부 접속 설정 (서비스 오픈)
- [ ] 공유기 포트포워딩 설정
- [ ] DDNS 도메인 생성 및 설정
- [ ] Nginx 설치 및 설정
- [ ] SSL 인증서 발급
- [ ] 외부 인터넷에서 접속 테스트
- [ ] 모든 기능 최종 확인

---

## 🚨 문제 해결

### ngrok 연결 안 됨
```bash
# 인증토큰 재설정
ngrok config add-authtoken YOUR_TOKEN

# ngrok 재실행
ngrok http 3004
```

### DXP2800 SSH 접속 안 됨
```bash
# IP 주소 확인 (공유기 관리자 페이지에서)
# 또는 DXP2800 웹 UI에서 확인

# 다른 포트로 시도
ssh -p 22 admin@192.168.0.100
```

### 서비스 시작 실패
```bash
# 로그 확인
sudo journalctl -u malmoi -f

# 수동 실행 테스트
cd /home/admin/malmoi-system
npm run start
```

### 외부 접속 안 됨
```bash
# 1. 공유기 포트포워딩 확인
# 2. 방화벽 확인
sudo ufw status

# 3. Nginx 확인
sudo systemctl status nginx
sudo nginx -t

# 4. DDNS IP 업데이트 확인
cat ~/duckdns.log
```

---

## 💰 비용 비교

| 방법 | 초기 비용 | 월 비용 | 외부 접속 |
|------|----------|---------|----------|
| **ngrok 무료** | 0원 | 0원 | ✅ (URL 변경) |
| **ngrok 유료** | 0원 | $8 | ✅ (고정 URL) |
| **DXP2800 + DDNS** | DXP2800 가격 | 0원 | ✅ (고정 도메인) |
| **Vercel** | 0원 | 0~$20 | ✅ (자동 HTTPS) |

**추천**: DXP2800 이미 구매하셨으니 **0원 운영** 가능! 🎉

---

## 🎯 최종 추천 플랜

```
📅 Week 1-2: 개발
→ Mac + ngrok으로 개발
→ 기능 완성

📅 Week 3: DXP2800 설정
→ NAS 기본 설정
→ 프로젝트 배포
→ 내부 테스트

📅 Week 4: 외부 접속 설정
→ 포트포워딩
→ DDNS
→ SSL
→ 최종 테스트

📅 Week 5: 서비스 오픈! 🚀
```

---

## 📞 도움이 필요하면

- DXP2800 설정: `DXP2800_DEPLOYMENT_GUIDE.md` 참고
- Nginx 설정: `nginx/nginx.conf` 참고
- 서비스 설정: `malmoi.service` 참고
- 스크립트: `scripts/nas-setup.sh` 참고

모든 준비가 완료되었습니다! 🎉




