import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 빌드 시 Prisma 클라이언트 초기화 방지
if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  try {
    prisma.$connect();
  } catch (error) {
    console.warn("Prisma connection failed during build:", error);
  }
}
