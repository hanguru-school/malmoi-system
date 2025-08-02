const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createMasterAdmin() {
  try {
    console.log("마스터 관리자 계정을 생성합니다...");

    // 기존 마스터 관리자 확인
    const existingMaster = await prisma.user.findFirst({
      where: {
        email: "master@malmoi.com",
      },
    });

    if (existingMaster) {
      console.log("마스터 관리자 계정이 이미 존재합니다.");
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash("master1234", 12);

    // 마스터 관리자 생성
    const masterAdmin = await prisma.user.create({
      data: {
        email: "master@malmoi.com",
        name: "주용진 (주용진) / 주용진",
        password: hashedPassword,
        role: "ADMIN",
        phone: "010-0000-0000",
        admin: {
          create: {
            name: "주용진 (주용진) / 주용진",
            kanjiName: "주용진",
            yomigana: "주용진",
            koreanName: "주용진",
            phone: "010-0000-0000",
            permissions: {
              userManagement: true,
              systemSettings: true,
              adminApproval: true,
              allPermissions: true,
            },
            isApproved: true, // 마스터는 자동 승인
          },
        },
      },
      include: {
        admin: true,
      },
    });

    console.log("마스터 관리자 계정이 성공적으로 생성되었습니다.");
    console.log("이메일: master@malmoi.com");
    console.log("비밀번호: master1234");
    console.log(
      "이 계정으로 로그인하여 다른 관리자 계정을 승인할 수 있습니다.",
    );
  } catch (error) {
    console.error("마스터 관리자 생성 중 오류가 발생했습니다:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createMasterAdmin();
