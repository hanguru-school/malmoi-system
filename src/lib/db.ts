import { PrismaClient } from '@prisma/client';

// 전역 타입 선언
declare global {
  var prisma: PrismaClient | undefined;
}

// 전역 캐시를 사용한 Prisma 클라이언트 초기화
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

  // 연결 이벤트 핸들러
  client.$on('query', (e: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Query: ' + e.query);
      console.log('Params: ' + e.params);
      console.log('Duration: ' + e.duration + 'ms');
    }
  });

  client.$on('error', (e: any) => {
    console.error('Prisma Error:', e);
  });

  return client;
}

// 전역 캐시에서 Prisma 클라이언트 가져오기
function getPrismaClient(): PrismaClient {
  if (!globalThis.prisma) {
    globalThis.prisma = createPrismaClient();
  }
  return globalThis.prisma;
}

// 데이터베이스 연결 확인 함수
export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$connect();
    
    // 간단한 쿼리로 연결 테스트
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// 데이터베이스 연결 종료 함수
export async function disconnectDb(): Promise<void> {
  try {
    if (globalThis.prisma) {
      await globalThis.prisma.$disconnect();
      globalThis.prisma = undefined;
    }
  } catch (error) {
    console.error('Database disconnection failed:', error);
  }
}

// Prisma 클라이언트 인스턴스
const prisma = getPrismaClient();

export default prisma; 