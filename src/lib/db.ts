import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

if (!global.__db__) {
  global.__db__ = new PrismaClient();
}

prisma = global.__db__;

export async function checkDbConnection() {
  try {
    await prisma.$connect();
    return true;
  } catch (err) {
    console.error('DB 연결 실패:', err);
    return false;
  }
}

export default prisma; 