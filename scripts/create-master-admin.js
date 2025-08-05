const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createMasterAdmin() {
  try {
    console.log('마스터 관리자 생성 시작...');
    
    // 기존 관리자 확인
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN',
        email: 'master@hanguru.school'
      }
    });
    
    if (existingAdmin) {
      console.log('마스터 관리자가 이미 존재합니다:', existingAdmin.email);
      return;
    }
    
    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash('master1234', 10);
    
    // 관리자 사용자 생성
    const user = await prisma.user.create({
      data: {
        email: 'master@hanguru.school',
        password: hashedPassword,
        name: '마스터 관리자',
        role: 'ADMIN',
      },
    });
    
    // 관리자 프로필 생성
    const admin = await prisma.admin.create({
      data: {
        userId: user.id,
        name: '마스터 관리자',
        kanjiName: 'マスター管理者',
        yomigana: 'ますたーかんりしゃ',
        koreanName: '마스터 관리자',
        phone: '010-0000-0000',
        permissions: {
          all: true,
          userManagement: true,
          reservationManagement: true,
          teacherManagement: true,
          studentManagement: true,
          paymentManagement: true,
          systemSettings: true,
        },
        isApproved: true,
      },
    });
    
    console.log('마스터 관리자 생성 완료!');
    console.log('이메일: master@hanguru.school');
    console.log('비밀번호: master1234');
    console.log('관리자 ID:', admin.id);
    
  } catch (error) {
    console.error('마스터 관리자 생성 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMasterAdmin();
