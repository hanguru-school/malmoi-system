# 실제 하드웨어 리더 배포 가이드

## 🚀 실제 운영 환경 설정

### 📋 필수 요구사항

#### **1. 하드웨어 리더**
- **NFC 리더**: ACR122U, ACR1252U, OMNIKEY 5022 등
- **FeliCa 리더**: PaSoRi RC-S380, RC-S380/S 등
- **USB HID 리더**: 지원되는 USB NFC 리더
- **시리얼 리더**: RS-232/RS-485 NFC 리더
- **블루투스 리더**: 블루투스 NFC 리더

#### **2. 운영 환경**
- **HTTPS 필수**: Web NFC API 사용을 위해 SSL 인증서 필요
- **최신 브라우저**: Chrome 89+, Firefox 88+, Safari 14+
- **권한 설정**: 하드웨어 접근 권한 허용

### 🔧 설치 및 설정

#### **1. 하드웨어 리더 연결**

```bash
# 1. 리더를 컴퓨터에 연결
# 2. 드라이버 설치 (필요시)
# 3. 브라우저에서 권한 허용
```

#### **2. 환경 변수 설정**

```bash
# .env.local 파일에 추가
NEXT_PUBLIC_HARDWARE_READER_ENABLED=true
NEXT_PUBLIC_NFC_ENABLED=true
NEXT_PUBLIC_SERIAL_ENABLED=true
NEXT_PUBLIC_USB_HID_ENABLED=true
NEXT_PUBLIC_BLUETOOTH_ENABLED=true
```

#### **3. SSL 인증서 설정 (HTTPS)**

```bash
# 개발 환경
npm run dev -- --https

# 프로덕션 환경
# nginx 또는 Apache에서 SSL 설정
```

### 🛠️ 하드웨어별 설정

#### **1. Web NFC API (모바일/태블릿)**
```javascript
// 브라우저에서 자동 감지
if ('NDEFReader' in window) {
  const ndef = new NDEFReader();
  await ndef.scan();
}
```

#### **2. USB HID 리더**
```javascript
// USB 리더 연결
const devices = await navigator.hid.getDevices();
await devices[0].open();
```

#### **3. 시리얼 포트 리더**
```javascript
// 시리얼 리더 연결
const port = await navigator.serial.requestPort();
await port.open({ baudRate: 9600 });
```

#### **4. 블루투스 리더**
```javascript
// 블루투스 리더 연결
const device = await navigator.bluetooth.requestDevice({
  filters: [{ services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }]
});
```

### 📱 실제 운영 테스트

#### **1. IC 카드 등록 테스트**
1. **리더 연결**: 하드웨어 리더를 컴퓨터에 연결
2. **권한 허용**: 브라우저에서 하드웨어 접근 권한 허용
3. **카드 등록**: `/tagging/home` 페이지에서 "카드 읽기" 버튼 클릭
4. **카드 태그**: 실제 IC 카드를 리더에 태그
5. **UID 확인**: 실제 카드의 고유 UID가 자동 입력되는지 확인

#### **2. 학생 태깅 테스트**
1. **학생 카드 준비**: 등록된 학생 카드 준비
2. **태깅 페이지**: `/tagging/student` 페이지 접속
3. **카드 태그**: 학생 카드를 리더에 태그
4. **출석 확인**: 실제 UID로 출석이 기록되는지 확인

#### **3. 권한 인증 테스트**
1. **관리자 카드**: 관리자 권한이 있는 카드 준비
2. **포털 접근**: 관리자/학생/선생님 포털 접속
3. **카드 인증**: 카드를 리더에 태그하여 권한 확인
4. **접근 허용**: 권한이 있는 경우 포털 접근 허용 확인

### 🔍 문제 해결

#### **1. 리더 연결 실패**
```bash
# 확인사항
- 리더가 올바르게 연결되었는지 확인
- 드라이버가 설치되었는지 확인
- 브라우저 권한이 허용되었는지 확인
- HTTPS 환경인지 확인 (Web NFC API)
```

#### **2. 카드 읽기 실패**
```bash
# 확인사항
- 카드가 리더에 올바르게 태그되었는지 확인
- 카드가 손상되지 않았는지 확인
- 리더가 지원하는 카드 타입인지 확인
- 배터리/전원이 충분한지 확인
```

#### **3. 권한 오류**
```bash
# 확인사항
- 브라우저에서 하드웨어 접근 권한 허용
- HTTPS 환경에서 실행 중인지 확인
- 최신 브라우저 사용 중인지 확인
```

### 📊 모니터링 및 로그

#### **1. 콘솔 로그 확인**
```javascript
// 브라우저 개발자 도구에서 확인
console.log('하드웨어 리더 연결 성공');
console.log('실제 카드에서 읽은 UID:', uid);
```

#### **2. API 로그 확인**
```bash
# 서버 로그에서 확인
npm run dev  # 개발 환경
# 프로덕션 환경에서는 로그 파일 확인
```

### 🚀 프로덕션 배포

#### **1. 빌드 및 배포**
```bash
# 프로덕션 빌드
npm run build

# 배포
npm start  # 또는 PM2, Docker 등 사용
```

#### **2. 환경 설정**
```bash
# 프로덕션 환경 변수
NODE_ENV=production
NEXT_PUBLIC_HARDWARE_READER_ENABLED=true
```

#### **3. SSL 인증서 설정**
```bash
# nginx 설정 예시
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### ✅ 검증 체크리스트

- [ ] 하드웨어 리더가 올바르게 연결됨
- [ ] 브라우저에서 하드웨어 접근 권한 허용됨
- [ ] HTTPS 환경에서 실행 중
- [ ] 실제 카드 UID 읽기 테스트 성공
- [ ] IC 카드 등록 기능 정상 작동
- [ ] 학생 태깅 기능 정상 작동
- [ ] 권한 인증 기능 정상 작동
- [ ] 같은 카드 반복 태그 시 동일한 UID 반환
- [ ] 로그 및 모니터링 정상 작동

### 🎯 실제 운영 시 주의사항

1. **보안**: 실제 카드 UID는 민감한 정보이므로 안전하게 처리
2. **백업**: 등록된 카드 정보는 정기적으로 백업
3. **모니터링**: 하드웨어 리더 상태를 지속적으로 모니터링
4. **유지보수**: 리더 하드웨어 정기 점검 및 청소
5. **교육**: 사용자에게 올바른 카드 태깅 방법 교육

이제 **실제 하드웨어 리더와 연동하여 실제 카드 UID를 읽어오는 시스템**이 완성되었습니다! 🎉 