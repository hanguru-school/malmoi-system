# 🐳 DigitalOcean Droplet 설정 가이드

## 📋 Droplet 생성 단계

### **1단계: Droplet 생성**
1. **DigitalOcean 대시보드** 접속
2. **Create** → **Droplets** 클릭

### **2단계: 기본 설정**
```
Choose an image:
✅ Ubuntu 22.04 LTS (추천)

Choose a plan:
✅ Basic
✅ Regular with SSD
✅ $5/month (1GB RAM, 25GB SSD)

Choose a datacenter region:
✅ Singapore (가장 가까움, 한국에서 빠름)
```

### **3단계: 인증 설정**
```
Authentication:
✅ SSH key (추천) - 보안 강화
또는
✅ Password - 간단하지만 보안 약함
```

### **4단계: 최종 설정**
```
Finalize and create:
✅ Choose a hostname: hanguru-app
✅ Choose a project: hanguru-project (새로 생성)
✅ Create Droplet
```

---

## 🔑 SSH 키 설정 (추천)

### **로컬에서 SSH 키 생성**
```bash
# SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "hanguru-app"

# 공개키 확인
cat ~/.ssh/id_rsa.pub
```

### **DigitalOcean에 SSH 키 등록**
1. **Settings** → **Security** → **SSH Keys**
2. **Add SSH Key** 클릭
3. 위에서 생성한 공개키 복사/붙여넣기
4. **Add SSH Key** 클릭

---

## 🌐 서버 정보 확인

### **Droplet 생성 완료 후**
```
서버 IP: xxx.xxx.xxx.xxx (생성 후 확인)
사용자명: root
포트: 22 (SSH)
지역: Singapore
```

### **서버 접속 테스트**
```bash
# SSH 키로 접속
ssh root@YOUR_SERVER_IP

# 또는 비밀번호로 접속
ssh root@YOUR_SERVER_IP
# 비밀번호 입력
```

---

## 🔧 초기 서버 설정

### **서버 접속 후 실행할 명령어들**
```bash
# 시스템 업데이트
apt update && apt upgrade -y

# 필수 패키지 설치
apt install -y curl wget git nginx certbot python3-certbot-nginx

# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# PM2 설치
npm install -g pm2

# 하드웨어 리더 지원 패키지
apt install -y pcscd pcsc-tools libpcsclite-dev
systemctl enable pcscd
systemctl start pcscd
```

---

## 📊 서버 사양 확인

### **생성된 Droplet 정보**
```
CPU: 1 vCPU
RAM: 1GB
Storage: 25GB SSD
Bandwidth: 1TB
Region: Singapore
Cost: $5/month
```

### **성능 테스트**
```bash
# CPU 정보
lscpu

# 메모리 정보
free -h

# 디스크 정보
df -h

# 네트워크 속도
curl -o /dev/null -s -w "%{speed_download}\n" https://google.com
```

---

## 🔒 보안 설정

### **방화벽 설정**
```bash
# UFW 방화벽 활성화
ufw enable

# SSH 허용
ufw allow ssh

# HTTP/HTTPS 허용
ufw allow 80
ufw allow 443

# 방화벽 상태 확인
ufw status
```

### **SSH 보안 강화**
```bash
# SSH 설정 파일 편집
nano /etc/ssh/sshd_config

# 다음 설정 변경:
# PermitRootLogin no
# PasswordAuthentication no
# Port 2222 (기본 22에서 변경)

# SSH 재시작
systemctl restart sshd
```

---

## 🎯 다음 단계

### **Droplet 생성 완료 후**
1. **서버 IP 주소** 확인
2. **SSH 접속** 테스트
3. **초기 설정** 실행
4. **도메인 DNS** 설정 준비

---

## 📞 문제 해결

### **SSH 접속 안됨**
```bash
# 로컬에서 테스트
ping YOUR_SERVER_IP

# SSH 연결 테스트
ssh -v root@YOUR_SERVER_IP
```

### **서버 응답 없음**
- DigitalOcean 대시보드에서 **Console** 접속
- **Power** → **Power Off** → **Power On**

---

**Droplet을 생성하시겠습니까?** 

생성하시면 서버 IP를 알려주시면 다음 단계를 안내해드리겠습니다! 🚀 