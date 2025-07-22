# 🔧 서버 접속 테스트 가이드

## 📋 서버 정보

### **생성된 Droplet 정보**
```
이름: hanguru-app
지역: Singapore
플랜: $8/월 (1GB RAM, 1 vCPU, 35GB SSD)
IP 주소: xxx.xxx.xxx.xxx (확인 필요)
사용자: root
포트: 22 (SSH)
```

---

## 🚀 서버 접속 테스트

### **1단계: 서버 IP 확인**
```bash
# DigitalOcean 대시보드에서 IP 주소 복사
# 예: 159.89.123.456
```

### **2단계: SSH 접속 테스트**
```bash
# 터미널에서 실행
ssh root@YOUR_SERVER_IP

# 예시:
ssh root@159.89.123.456
```

### **3단계: 접속 성공 확인**
```bash
# 접속 성공 시 다음과 같은 메시지가 나타남:
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-88-generic x86_64)

# 서버 정보 확인
uname -a
lsb_release -a
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

# 방화벽 설정
ufw enable
ufw allow ssh
ufw allow 80
ufw allow 443
```

---

## 📊 서버 성능 확인

### **시스템 정보 확인**
```bash
# CPU 정보
lscpu

# 메모리 정보
free -h

# 디스크 정보
df -h

# 네트워크 정보
ip addr show
```

### **성능 테스트**
```bash
# 네트워크 속도 테스트
curl -o /dev/null -s -w "%{speed_download}\n" https://google.com

# 디스크 속도 테스트
dd if=/dev/zero of=test_file bs=1M count=100
rm test_file
```

---

## 🔒 보안 설정

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

### **서버 설정 완료 후**
1. **애플리케이션 배포** 준비
2. **도메인 DNS 설정** 준비
3. **SSL 인증서 설정** 준비

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

**서버 IP 주소를 알려주시면 접속 테스트를 도와드리겠습니다!** 🚀 