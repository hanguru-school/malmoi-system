import { PrismaClient } from "@prisma/client";

declare global {
  // 개발 환경에서 HMR로 인한 다중 인스턴스 방지
  var prisma: PrismaClient | undefined;
}

// Singleton 패턴으로 Prisma 클라이언트 관리
const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

const prisma = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// 연결 상태 확인 함수
export async function checkPrismaConnection() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return { success: true, message: "Database connection successful" };
  } catch (error) {
    console.error("Prisma connection failed:", error);
    return {
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    };
  }
}

export default prisma;
