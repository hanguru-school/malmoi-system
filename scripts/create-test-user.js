const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('=== 테스트 사용자 생성 시작 ===');

    // 1. 기존 테스트 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@hanguru.school' }
    });

    if (existingUser) {
      console.log('기존 테스트 사용자 발견:', existingUser.id);
      
      // 기존 학생 프로필 확인
      const existingStudent = await prisma.student.findUnique({
        where: { userId: existingUser.id }
      });

      if (existingStudent) {
        console.log('기존 학생 프로필 발견:', existingStudent.id);
        return {
          userId: existingUser.id,
          studentId: existingStudent.id,
          email: existingUser.email,
          password: 'test123'
        };
      }
    }

    // 2. 새 테스트 사용자 생성
    console.log('새 테스트 사용자 생성 중...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const newUser = await prisma.user.create({
      data: {
        name: '테스트 학생',
        email: 'test@hanguru.school',
        password: hashedPassword,
        role: 'STUDENT',
        phone: '010-1234-5678'
      }
    });

    console.log('새 사용자 생성됨:', newUser.id);

    // 3. 학생 프로필 생성
    console.log('학생 프로필 생성 중...');
    const newStudent = await prisma.student.create({
      data: {
        userId: newUser.id,
        name: '테스트 학생',
        kanjiName: 'テスト学生',
        yomigana: 'てすとがくせい',
        koreanName: '테스트 학생',
        phone: '010-1234-5678',
        level: '초급 A',
        points: 0
      }
    });

    console.log('학생 프로필 생성됨:', newStudent.id);

    // 4. 기본 강사 생성 (없는 경우)
    let teacher = await prisma.teacher.findFirst();
    if (!teacher) {
      console.log('기본 강사 생성 중...');
      
      const teacherUser = await prisma.user.create({
        data: {
          name: '기본 강사',
          email: 'teacher@hanguru.school',
          password: await bcrypt.hash('teacher123', 10),
          role: 'TEACHER',
          phone: '010-0000-0000'
        }
      });

      teacher = await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          name: '기본 강사',
          kanjiName: '基本講師',
          yomigana: 'きほんこうし',
          koreanName: '기본 강사',
          phone: '010-0000-0000',
          subjects: ['일본어'],
          hourlyRate: 30000
        }
      });

      console.log('기본 강사 생성됨:', teacher.id);
    }

    console.log('=== 테스트 사용자 생성 완료 ===');
    console.log('사용자 ID:', newUser.id);
    console.log('학생 ID:', newStudent.id);
    console.log('이메일:', newUser.email);
    console.log('비밀번호: test123');

    return {
      userId: newUser.id,
      studentId: newStudent.id,
      email: newUser.email,
      password: 'test123'
    };

  } catch (error) {
    console.error('테스트 사용자 생성 오류:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  createTestUser()
    .then(result => {
      console.log('\n=== 생성된 테스트 계정 ===');
      console.log('이메일:', result.email);
      console.log('비밀번호:', result.password);
      console.log('사용자 ID:', result.userId);
      console.log('학생 ID:', result.studentId);
      process.exit(0);
    })
    .catch(error => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { createTestUser }; 