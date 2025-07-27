import NextAuth from 'next-auth';

// 동적 import로 authOptions 로드
async function getAuthOptions() {
  const { authOptions } = await import('@/lib/auth');
  return authOptions;
}

export async function GET(request: Request) {
  const authOptions = await getAuthOptions();
  return NextAuth(authOptions)(request);
}

export async function POST(request: Request) {
  const authOptions = await getAuthOptions();
  return NextAuth(authOptions)(request);
} 