// Firebase 테스트 사용자 생성 스크립트
// 사용법: node scripts/create-test-users.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase 설정 (실제 프로젝트 설정으로 교체)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 테스트 사용자 데이터
const testUsers = [
  {
    email: 'admin@hanguru.school',
    password: 'password123',
    name: '주용진',
    role: 'admin',
    department: '시스템관리팀',
    permissions: ['user:manage', 'reservation:manage', 'facility:manage', 'report:view', 'system:configure', 'security:manage', 'log:view', 'notification:manage'],
    phone: '010-0000-0000'
  },
  {
    email: 'teacher@hanguru.school',
    password: 'password123',
    name: '박교수',
    role: 'teacher',
    department: '컴퓨터공학과',
    permissions: ['reservation:manage', 'report:view', 'facility:view'],
    phone: '010-2345-6789'
  },
  {
    email: 'student@hanguru.school',
    password: 'password123',
    name: '김학생',
    role: 'student',
    department: '컴퓨터공학과',
    permissions: ['reservation:create', 'reservation:view', 'facility:view'],
    phone: '010-1234-5678'
  },
  {
    email: 'staff@hanguru.school',
    password: 'password123',
    name: '이직원',
    role: 'staff',
    department: '행정팀',
    permissions: ['reservation:manage', 'facility:manage', 'user:view', 'notification:manage'],
    phone: '010-3456-7890'
  }
];

async function createTestUsers() {
  console.log('테스트 사용자 생성 시작...');
  
  for (const userData of testUsers) {
    try {
      console.log(`${userData.email} 사용자 생성 중...`);
      
      // Firebase Auth에 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      // Firestore에 사용자 정보 저장
      const userDoc = {
        id: userCredential.user.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        permissions: userData.permissions,
        phone: userData.phone,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      
      console.log(`✅ ${userData.email} 사용자 생성 완료`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ ${userData.email} 사용자는 이미 존재합니다`);
      } else {
        console.error(`❌ ${userData.email} 사용자 생성 실패:`, error.message);
      }
    }
  }
  
  console.log('테스트 사용자 생성 완료!');
  process.exit(0);
}

// 스크립트 실행
createTestUsers().catch(console.error); 