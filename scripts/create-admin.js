const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // 기존 관리자 계정 확인
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@hanguru.school' }
    });

    if (existingAdmin) {
      console.log('관리자 계정이 이미 존재합니다:', existingAdmin.email);
      return;
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 관리자 계정 생성
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@hanguru.school',
        name: '관리자',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('관리자 계정이 생성되었습니다:', adminUser.email);
    console.log('이메일: admin@hanguru.school');
    console.log('비밀번호: admin123');

  } catch (error) {
    console.error('관리자 계정 생성 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 