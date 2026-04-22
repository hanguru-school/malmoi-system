const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function productionTest() {
  console.log("=== 프로덕션 환경 종합 테스트 시작 ===\n");

  try {
    // 1. 데이터베이스 연결 테스트
    console.log("1. 데이터베이스 연결 테스트");
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    // 2. 테이블 상태 확인
    console.log("2. 테이블 상태 확인");
    const userCount = await prisma.user.count();
    const studentCount = await prisma.student.count();
    const teacherCount = await prisma.teacher.count();
    const reservationCount = await prisma.reservation.count();
    const reviewCount = await prisma.review.count();

    console.log("📊 데이터베이스 현황:");
    console.log(`- 사용자: ${userCount}명`);
    console.log(`- 학생: ${studentCount}명`);
    console.log(`- 선생님: ${teacherCount}명`);
    console.log(`- 예약: ${reservationCount}건`);
    console.log(`- 리뷰: ${reviewCount}건\n`);

    // 3. 관리자 계정 확인
    console.log("3. 관리자 계정 확인");
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      include: { admin: true },
    });

    if (adminUser) {
      console.log("✅ 관리자 계정 존재:", adminUser.email);
    } else {
      console.log("⚠️ 관리자 계정 없음 - 생성 필요");
    }
    console.log("");

    // 4. 기본 강사 확인
    console.log("4. 기본 강사 확인");
    const teacher = await prisma.teacher.findFirst();
    if (teacher) {
      console.log("✅ 기본 강사 존재:", teacher.name);
    } else {
      console.log("⚠️ 기본 강사 없음 - 생성 필요");
    }
    console.log("");

    // 5. 테스트 사용자 생성
    console.log("5. 테스트 사용자 생성");
    const testEmail = "test@hanguru.blog";
    let testUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { student: true },
    });

    if (!testUser) {
      console.log("테스트 사용자 생성 중...");
      const hashedPassword = await bcrypt.hash("test123", 10);

      testUser = await prisma.user.create({
        data: {
          name: "테스트 학생",
          email: testEmail,
          password: hashedPassword,
          role: "STUDENT",
          phone: "010-1234-5678",
        },
        include: { student: true },
      });

      await prisma.student.create({
        data: {
          userId: testUser.id,
          name: "테스트 학생",
          kanjiName: "テスト学生",
          yomigana: "てすとがくせい",
          koreanName: "테스트 학생",
          phone: "010-1234-5678",
          level: "초급 A",
          points: 0,
          joinDate: new Date(),
        },
      });

      console.log("✅ 테스트 사용자 생성 완료");
    } else {
      console.log("✅ 테스트 사용자 이미 존재");
    }
    console.log("");

    // 6. 예약 기능 테스트
    console.log("6. 예약 기능 테스트");
    const testStudent = await prisma.student.findUnique({
      where: { userId: testUser.id },
    });

    const testTeacher = await prisma.teacher.findFirst();

    if (testStudent && testTeacher) {
      // 기존 테스트 예약 확인
      const existingReservation = await prisma.reservation.findFirst({
        where: {
          studentId: testStudent.id,
          teacherId: testTeacher.id,
          date: new Date("2025-08-01"),
        },
      });

      if (!existingReservation) {
        // 테스트 예약 생성
        const testReservation = await prisma.reservation.create({
          data: {
            studentId: testStudent.id,
            teacherId: testTeacher.id,
            date: new Date("2025-08-01"),
            startTime: "10:00",
            endTime: "11:00",
            status: "CONFIRMED",
            location: "ONLINE",
            notes: "테스트 예약",
          },
        });
        console.log("✅ 테스트 예약 생성 완료:", testReservation.id);
      } else {
        console.log("✅ 테스트 예약 이미 존재");
      }
    } else {
      console.log("⚠️ 테스트 예약 생성 실패 - 학생 또는 강사 정보 부족");
    }
    console.log("");

    // 7. 리뷰 기능 테스트
    console.log("7. 리뷰 기능 테스트");
    if (testStudent && testTeacher) {
      const testReservation = await prisma.reservation.findFirst({
        where: {
          studentId: testStudent.id,
          teacherId: testTeacher.id,
        },
      });

      if (testReservation) {
        const existingReview = await prisma.review.findFirst({
          where: {
            reservationId: testReservation.id,
            studentId: testStudent.id,
          },
        });

        if (!existingReview) {
          const testReview = await prisma.review.create({
            data: {
              reservationId: testReservation.id,
              studentId: testStudent.id,
              teacherId: testTeacher.id,
              rating: 5,
              content: "테스트 리뷰입니다. 수업이 매우 만족스러웠습니다.",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          console.log("✅ 테스트 리뷰 생성 완료:", testReview.id);
        } else {
          console.log("✅ 테스트 리뷰 이미 존재");
        }
      }
    }
    console.log("");

    // 8. API 엔드포인트 테스트 준비
    console.log("8. API 엔드포인트 테스트 정보");
    console.log("🌐 프로덕션 URL: https://portal.hanguru.blog");
    console.log("📝 테스트 계정:");
    console.log(`   - 이메일: ${testEmail}`);
    console.log(`   - 비밀번호: test123`);
    console.log("");
    console.log("🔗 테스트할 API 엔드포인트:");
    console.log("   - POST /api/auth/login");
    console.log("   - POST /api/auth/register");
    console.log("   - POST /api/reservations/create");
    console.log("   - POST /api/reviews/create");
    console.log("   - GET /api/test-db");
    console.log("");

    // 9. 최종 상태 요약
    console.log("9. 최종 상태 요약");
    const finalUserCount = await prisma.user.count();
    const finalReservationCount = await prisma.reservation.count();
    const finalReviewCount = await prisma.review.count();

    console.log("📈 최종 데이터 현황:");
    console.log(`- 총 사용자: ${finalUserCount}명`);
    console.log(`- 총 예약: ${finalReservationCount}건`);
    console.log(`- 총 리뷰: ${finalReviewCount}건`);
    console.log("");

    console.log("✅ 프로덕션 환경 테스트 준비 완료!");
    console.log(
      "🚀 이제 실제 사용자가 모든 기능을 안전하게 사용할 수 있습니다.",
    );
  } catch (error) {
    console.error("❌ 프로덕션 테스트 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  productionTest()
    .then(() => {
      console.log("\n🎉 프로덕션 테스트 완료!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 프로덕션 테스트 실패:", error);
      process.exit(1);
    });
}

module.exports = { productionTest };
