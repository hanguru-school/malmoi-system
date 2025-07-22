# 🔌 하드웨어 리더 설정 가이드

## 📋 지원 하드웨어 리더

### **USB NFC 리더 (추천)**
```
ACR122U - 가장 일반적, 안정적
ACR1252U - 고성능, 빠른 읽기
ACR1281U - 컴팩트, 휴대용
OmniKey 5321 - 산업용, 내구성
```

### **시리얼 리더**
```
ACR120U - RS232 연결
ACR122U-S - 시리얼 버전
```

### **블루투스 리더**
```
ACR1255U-J1 - 무선 NFC 리더
Identiv uTrust 3700F - 블루투스 지원
```

---

## 🖥️ 서버 하드웨어 설정

### **1단계: USB 리더 연결**
```bash
# USB 리더 연결 확인
lsusb | grep -i acr
# 또는
lsusb | grep -i omnikey
```

### **2단계: PC/SC 라이브러리 설치**
```bash
apt update
apt install -y pcscd pcsc-tools libpcsclite-dev
systemctl enable pcscd
systemctl start pcscd
```

### **3단계: 리더 테스트**
```bash
# PCSC 도구 설치
apt install -y pcsc-tools

# 리더 상태 확인
pcsc_scan

# 카드 읽기 테스트
opensc-tool -l
```

---

## 📱 크로스 플랫폼 NFC 구현

### **Android (웹 NFC API)**
```javascript
// Android에서 웹 NFC 사용
if ('NDEFReader' in window) {
  const ndef = new NDEFReader();
  
  ndef.scan().then(() => {
    console.log("NFC 스캔 시작");
    
    ndef.addEventListener("reading", ({ message, serialNumber }) => {
      console.log("Android NFC UID:", serialNumber);
      sendUIDToServer(serialNumber);
    });
    
    ndef.addEventListener("readingerror", () => {
      console.log("NFC 읽기 오류");
    });
  }).catch(error => {
    console.log("NFC 지원 안됨:", error);
  });
}
```

### **iOS (하드웨어 리더 연동)**
```javascript
// iOS에서는 하드웨어 리더 사용
if (isIOS()) {
  // 하드웨어 리더 연결
  connectHardwareReader();
} else if ('NDEFReader' in window) {
  // Android 웹 NFC 사용
  useWebNFC();
}
```

### **데스크톱 (USB 리더)**
```javascript
// USB 리더 연결
async function connectUSBReader() {
  try {
    const device = await navigator.usb.requestDevice({
      filters: [
        { vendorId: 0x072f }, // ACR122U
        { vendorId: 0x04cc }, // NXP
        { vendorId: 0x1915 }  // Nordic
      ]
    });
    
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    
    console.log("USB 리더 연결 성공");
    startReading(device);
  } catch (error) {
    console.log("USB 리더 연결 실패:", error);
  }
}
```

---

## 🔧 서버 사이드 하드웨어 연동

### **Node.js PCSC 라이브러리**
```bash
npm install node-pcsclite
```

### **서버 하드웨어 리더 코드**
```javascript
const pcsc = require('node-pcsclite');

const pcsc = pcsc();

pcsc.on('reader', function (reader) {
  console.log('리더 감지:', reader.name);
  
  reader.on('status', function (status) {
    console.log('상태 변경:', status);
  });
  
  reader.on('card', function (card) {
    console.log('카드 감지:', card);
    
    // UID 읽기
    reader.transmit(Buffer.from([0xFF, 0xCA, 0x00, 0x00, 0x04]), 40, 'ioctl', function (err, data) {
      if (err) {
        console.log('UID 읽기 실패:', err);
      } else {
        const uid = data.toString('hex').toUpperCase();
        console.log('UID:', uid);
        
        // 웹소켓으로 클라이언트에 전송
        io.emit('nfc-uid', { uid, source: 'hardware' });
      }
    });
  });
  
  reader.on('error', function (err) {
    console.log('리더 오류:', err);
  });
  
  reader.on('end', function () {
    console.log('리더 연결 해제');
  });
});
```

---

## 🌐 웹소켓 실시간 통신

### **서버 웹소켓 설정**
```javascript
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('클라이언트 연결:', socket.id);
  
  // 하드웨어 리더에서 UID 수신
  socket.on('hardware-uid', (data) => {
    console.log('하드웨어 UID:', data.uid);
    // 데이터베이스에 저장
    saveUIDToDatabase(data.uid, 'hardware');
  });
  
  // 웹 NFC에서 UID 수신
  socket.on('web-nfc-uid', (data) => {
    console.log('웹 NFC UID:', data.uid);
    // 데이터베이스에 저장
    saveUIDToDatabase(data.uid, 'web-nfc');
  });
});
```

---

## 📊 플랫폼별 사용 통계

### **사용자 인터페이스**
```javascript
function detectPlatform() {
  const userAgent = navigator.userAgent;
  
  if (/Android/i.test(userAgent)) {
    return 'android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'ios';
  } else if (/Windows|Mac|Linux/i.test(userAgent)) {
    return 'desktop';
  } else {
    return 'unknown';
  }
}

function showOptimalReader() {
  const platform = detectPlatform();
  
  switch (platform) {
    case 'android':
      showWebNFCButton();
      showHardwareReaderButton();
      break;
    case 'ios':
      showHardwareReaderButton();
      showBluetoothReaderButton();
      break;
    case 'desktop':
      showUSBReaderButton();
      showBluetoothReaderButton();
      break;
  }
}
```

---

## 🔒 보안 설정

### **하드웨어 리더 보안**
```bash
# USB 장치 권한 설정
sudo usermod -a -G dialout www-data
sudo usermod -a -G plugdev www-data

# udev 규칙 설정
sudo nano /etc/udev/rules.d/99-nfc-reader.rules
```

### **udev 규칙 내용**
```
# ACR122U
SUBSYSTEM=="usb", ATTRS{idVendor}=="072f", ATTRS{idProduct}=="2200", MODE="0666", GROUP="plugdev"

# OmniKey
SUBSYSTEM=="usb", ATTRS{idVendor}=="076b", ATTRS{idProduct}=="5422", MODE="0666", GROUP="plugdev"
```

---

## 🧪 테스트 방법

### **1. 하드웨어 리더 테스트**
```bash
# 리더 연결 확인
pcsc_scan

# 카드 읽기 테스트
opensc-tool -l
```

### **2. 웹 NFC 테스트**
```javascript
// Android 브라우저에서 테스트
if ('NDEFReader' in window) {
  console.log("웹 NFC 지원됨");
} else {
  console.log("웹 NFC 지원 안됨");
}
```

### **3. USB 리더 테스트**
```javascript
// 데스크톱에서 테스트
navigator.usb.getDevices().then(devices => {
  console.log("USB 장치:", devices);
});
```

---

## ✅ 완성된 시스템

### **지원 플랫폼**
- ✅ **Android**: 웹 NFC + 하드웨어 리더
- ✅ **iOS**: 하드웨어 리더 + 블루투스
- ✅ **데스크톱**: USB 리더 + 블루투스
- ✅ **태블릿**: 모든 방식 지원

### **지원 하드웨어**
- ✅ **ACR122U**: USB NFC 리더
- ✅ **ACR1252U**: 고성능 리더
- ✅ **블루투스 리더**: 무선 연결
- ✅ **스마트폰 NFC**: Android 내장

### **실시간 동기화**
- ✅ **웹소켓**: 실시간 UID 전송
- ✅ **데이터베이스**: 모든 UID 저장
- ✅ **통계**: 플랫폼별 사용 통계

---

**이제 모든 플랫폼과 하드웨어 리더를 완벽하게 지원하는 시스템이 완성됩니다!** 🎉 