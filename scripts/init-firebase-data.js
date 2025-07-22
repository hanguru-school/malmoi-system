// Firebase 초기 데이터 생성 스크립트
// 사용법: node scripts/init-firebase-data.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');

// Firebase 설정 (실제 프로젝트 설정으로 교체 필요)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "booking-system-dev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "booking-system-dev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "booking-system-dev.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 컬렉션 이름
const COLLECTIONS = {
  USERS: 'users',
  RESERVATIONS: 'reservations',
  COURSES: 'courses',
  ROOMS: 'rooms',
  NOTIFICATIONS: 'notifications'
};

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

// 테스트 교실 데이터
const testRooms = [
  {
    name: '101호 강의실',
    capacity: 30,
    facilities: ['프로젝터', '화이트보드', '에어컨'],
    description: '일반 강의용 교실',
    isActive: true
  },
  {
    name: '102호 실습실',
    capacity: 20,
    facilities: ['컴퓨터', '프로젝터', '에어컨'],
    description: '컴퓨터 실습용 교실',
    isActive: true
  },
  {
    name: '103호 세미나실',
    capacity: 15,
    facilities: ['프로젝터', '화이트보드', '회의테이블'],
    description: '소규모 세미나용 교실',
    isActive: true
  },
  {
    name: '104호 대강의실',
    capacity: 50,
    facilities: ['대형프로젝터', '음향시스템', '에어컨'],
    description: '대규모 강의용 교실',
    isActive: true
  }
];

// 테스트 코스 데이터
const testCourses = [
  {
    name: '기초 프로그래밍',
    description: '프로그래밍의 기초를 배우는 과정',
    duration: 60,
    price: 50000,
    category: 'programming',
    isActive: true
  },
  {
    name: '웹 개발 기초',
    description: 'HTML, CSS, JavaScript를 이용한 웹 개발',
    duration: 90,
    price: 80000,
    category: 'web',
    isActive: true
  },
  {
    name: '데이터베이스 설계',
    description: 'SQL과 데이터베이스 설계 기초',
    duration: 120,
    price: 100000,
    category: 'database',
    isActive: true
  },
  {
    name: '알고리즘과 자료구조',
    description: '컴퓨터 과학의 핵심 알고리즘 학습',
    duration: 90,
    price: 90000,
    category: 'algorithm',
    isActive: true
  }
];

async function createUser(userData) {
  try {
    console.log(`${userData.email} 사용자 생성 중...`);
    
    // Firebase Auth에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    // Firestore에 사용자 정보 저장
    await setDoc(doc(db, COLLECTIONS.USERS, userCredential.user.uid), {
      id: userCredential.user.uid,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      permissions: userData.permissions,
      phone: userData.phone,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ ${userData.email} 사용자 생성 완료`);
    return userCredential.user.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️ ${userData.email} 사용자가 이미 존재합니다`);
      return null;
    } else {
      console.log(`❌ ${userData.email} 사용자 생성 실패:`, error.message);
      return null;
    }
  }
}

async function createRoom(roomData) {
  try {
    console.log(`${roomData.name} 교실 생성 중...`);
    
    const docRef = await addDoc(collection(db, COLLECTIONS.ROOMS), {
      ...roomData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ ${roomData.name} 교실 생성 완료 (ID: ${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.log(`❌ ${roomData.name} 교실 생성 실패:`, error.message);
    return null;
  }
}

async function createCourse(courseData) {
  try {
    console.log(`${courseData.name} 코스 생성 중...`);
    
    const docRef = await addDoc(collection(db, COLLECTIONS.COURSES), {
      ...courseData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ ${courseData.name} 코스 생성 완료 (ID: ${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.log(`❌ ${courseData.name} 코스 생성 실패:`, error.message);
    return null;
  }
}

async function createSampleReservations(userIds, roomIds, courseIds) {
  try {
    console.log('샘플 예약 데이터 생성 중...');
    
    const sampleReservations = [
      {
        userId: userIds[2], // 학생
        courseId: courseIds[0], // 기초 프로그래밍
        roomId: roomIds[0], // 101호
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1주일 후
        startTime: '09:00',
        endTime: '10:00',
        status: 'confirmed',
        notes: '첫 번째 수업입니다.'
      },
      {
        userId: userIds[2], // 학생
        courseId: courseIds[1], // 웹 개발 기초
        roomId: roomIds[1], // 102호
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2주일 후
        startTime: '14:00',
        endTime: '15:30',
        status: 'pending',
        notes: '실습 수업입니다.'
      }
    ];
    
    for (const reservation of sampleReservations) {
      await addDoc(collection(db, COLLECTIONS.RESERVATIONS), {
        ...reservation,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('✅ 샘플 예약 데이터 생성 완료');
  } catch (error) {
    console.log('❌ 샘플 예약 데이터 생성 실패:', error.message);
  }
}

async function main() {
  console.log('🚀 Firebase 초기 데이터 생성 시작...\n');
  
  try {
    // 1. 사용자 생성
    console.log('📝 사용자 생성 중...');
    const userIds = [];
    for (const userData of testUsers) {
      const userId = await createUser(userData);
      if (userId) userIds.push(userId);
    }
    console.log('');
    
    // 2. 교실 생성
    console.log('🏢 교실 생성 중...');
    const roomIds = [];
    for (const roomData of testRooms) {
      const roomId = await createRoom(roomData);
      if (roomId) roomIds.push(roomId);
    }
    console.log('');
    
    // 3. 코스 생성
    console.log('📚 코스 생성 중...');
    const courseIds = [];
    for (const courseData of testCourses) {
      const courseId = await createCourse(courseData);
      if (courseId) courseIds.push(courseId);
    }
    console.log('');
    
    // 4. 샘플 예약 생성
    if (userIds.length > 0 && roomIds.length > 0 && courseIds.length > 0) {
      await createSampleReservations(userIds, roomIds, courseIds);
    }
    
    console.log('\n🎉 Firebase 초기 데이터 생성 완료!');
    console.log('\n📊 생성된 데이터:');
    console.log(`- 사용자: ${userIds.length}명`);
    console.log(`- 교실: ${roomIds.length}개`);
    console.log(`- 코스: ${courseIds.length}개`);
    console.log('- 샘플 예약: 2개');
    
    console.log('\n🔑 테스트 계정:');
    testUsers.forEach(user => {
      console.log(`- ${user.role}: ${user.email} / ${user.password}`);
    });
    
  } catch (error) {
    console.error('❌ 초기 데이터 생성 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  main().then(() => {
    console.log('\n✨ 스크립트 실행 완료');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 스크립트 실행 실패:', error);
    process.exit(1);
  });
}

module.exports = { main }; 