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
          // pg 데이터베이스 사용
          const { authenticateUser } = await import('./database');
          const user = await authenticateUser(credentials.email, credentials.password);

          if (!user) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
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