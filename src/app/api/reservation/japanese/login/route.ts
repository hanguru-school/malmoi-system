import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface JapaneseStudent {
  id: string;
  email: string;
  name: string;
  phone: string;
  uid: string;
  createdAt: Date;
}

// 샘플 사용자 데이터 (실제로는 데이터베이스에서 조회)
const students: Record<string, JapaneseStudent> = {
  'student1@example.com': {
    id: 'student-001',
    email: 'student1@example.com',
    name: '田中太郎',
    phone: '080-1234-5678',
    uid: 'STUDENT1234',
    createdAt: new Date('2024-01-01')
  },
  'student2@example.com': {
    id: 'student-002',
    email: 'student2@example.com',
    name: '佐藤花子',
    phone: '080-2345-6789',
    uid: 'STUDENT5678',
    createdAt: new Date('2024-01-02')
  }
};

// 비밀번호 데이터 (실제로는 해시된 비밀번호)
const passwords: Record<string, string> = {
  'student1@example.com': 'password123',
  'student2@example.com': 'password456'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      );
    }

    // 사용자 확인
    const student = students[email];
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const storedPassword = passwords[email];
    if (password !== storedPassword) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: student.id,
        email: student.email,
        name: student.name,
        uid: student.uid,
        type: 'japanese_student'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 쿠키 설정
    const cookieStore = await cookies();
    cookieStore.set('japanese_student_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30일
    });

    return NextResponse.json({
      success: true,
      user: {
        id: student.id,
        email: student.email,
        name: student.name,
        uid: student.uid
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 