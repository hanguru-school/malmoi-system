import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// 타입 확장
declare module "next-auth" {
  interface User {
    role?: string;
    student?: any;
    teacher?: any;
    staff?: any;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      student?: any;
      teacher?: any;
      staff?: any;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    student?: any;
    teacher?: any;
    staff?: any;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 빌드 시에는 인증을 건너뜀
        if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
          return null;
        }

        try {
          // 동적 import로 Prisma 로드
          const { prisma } = await import('./prisma');
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              student: true,
              teacher: true,
              staff: true
            }
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            student: user.student,
            teacher: user.teacher,
            staff: user.staff
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.student = user.student;
        token.teacher = user.teacher;
        token.staff = user.staff;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.student = token.student;
        session.user.teacher = token.teacher;
        session.user.staff = token.staff;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET
}; 