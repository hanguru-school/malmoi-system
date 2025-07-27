import { PrismaClient } from '@prisma/client';

declare global {
  // 개발 환경에서 HMR로 인한 다중 인스턴스 방지
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma; 