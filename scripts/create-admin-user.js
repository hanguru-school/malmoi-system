const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase 설정 (환경 변수에서 가져오거나 기본값 사용)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function createAdminUser() {
  try {
    console.log('🔐 관리자 계정 생성 중...');
    console.log('📧 이메일: hanguru.school@gmail.com');
    console.log('🔑 비밀번호: alfl1204');
    
    // 새 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'hanguru.school@gmail.com', 
      'alfl1204'
    );
    
    const user = userCredential.user;
    
    console.log('✅ 관리자 계정이 성공적으로 생성되었습니다!');
    console.log('📧 이메일:', user.email);
    console.log('🆔 UID:', user.uid);
    console.log('📅 생성일:', user.metadata.creationTime);
    
    console.log('\n🎉 관리자 계정 설정 완료!');
    console.log('📝 로그인 정보:');
    console.log('   이메일: hanguru.school@gmail.com');
    console.log('   비밀번호: alfl1204');
    console.log('\n💡 이제 웹사이트에서 이 계정으로 로그인할 수 있습니다.');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  이미 존재하는 이메일입니다.');
      console.log('📝 기존 계정으로 로그인 가능:');
      console.log('   이메일: hanguru.school@gmail.com');
      console.log('   비밀번호: alfl1204');
    } else {
      console.error('❌ 오류 발생:', error.message);
      console.log('\n💡 Firebase 설정을 확인해주세요:');
      console.log('   - .env.local 파일에 Firebase 설정이 있는지 확인');
      console.log('   - Firebase 프로젝트가 올바르게 설정되었는지 확인');
    }
  }
}

// 스크립트 실행
createAdminUser(); 