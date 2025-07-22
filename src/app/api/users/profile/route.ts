import { NextRequest, NextResponse } from 'next/server';

interface UserProfile {
  uid: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'staff';
  department?: string;
  permissions: string[];
  lastLogin: Date;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
}

// 사용자 데이터베이스 (실제로는 DB에서 조회)
const userDatabase: Record<string, UserProfile> = {
  'STUDENT1234': {
    uid: 'STUDENT1234',
    name: '김학생',
    role: 'student',
    department: '컴퓨터공학과',
    email: 'student@university.edu',
    phone: '010-1234-5678',
    permissions: ['reservation:create', 'reservation:view', 'facility:view'],
    lastLogin: new Date(),
    status: 'active'
  },
  'TEACHER5678': {
    uid: 'TEACHER5678',
    name: '박교수',
    role: 'teacher',
    department: '컴퓨터공학과',
    email: 'professor@university.edu',
    phone: '010-2345-6789',
    permissions: ['reservation:manage', 'report:view', 'facility:view', 'user:view'],
    lastLogin: new Date(),
    status: 'active'
  },
  'STAFF9012': {
    uid: 'STAFF9012',
    name: '이직원',
    role: 'staff',
    department: '행정팀',
    email: 'staff@university.edu',
    phone: '010-3456-7890',
    permissions: ['reservation:manage', 'facility:manage', 'user:view', 'report:view'],
    lastLogin: new Date(),
    status: 'active'
  },
  'ADMIN3456': {
    uid: 'ADMIN3456',
    name: '최관리자',
    role: 'admin',
    department: '시스템관리팀',
    email: 'admin@university.edu',
    phone: '010-4567-8901',
    permissions: ['user:manage', 'reservation:manage', 'facility:manage', 'report:view', 'system:configure', 'security:manage'],
    lastLogin: new Date(),
    status: 'active'
  },
  'STUDENT7890': {
    uid: 'STUDENT7890',
    name: '정학생',
    role: 'student',
    department: '전자공학과',
    email: 'student2@university.edu',
    phone: '010-5678-9012',
    permissions: ['reservation:create', 'reservation:view', 'facility:view'],
    lastLogin: new Date(),
    status: 'active'
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'UID가 필요합니다' },
        { status: 400 }
      );
    }

    const userProfile = userDatabase[uid];

    if (!userProfile) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 마지막 로그인 시간 업데이트
    userProfile.lastLogin = new Date();

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('사용자 프로필 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, name, role, department, permissions } = body;

    // 필수 필드 검증
    if (!uid || !name || !role) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 새 사용자 생성
    const newUser: UserProfile = {
      uid,
      name,
      role,
      department,
      permissions: permissions || [],
      lastLogin: new Date(),
      status: 'active'
    };

    userDatabase[uid] = newUser;

    return NextResponse.json({
      success: true,
      data: newUser,
      message: '사용자가 성공적으로 생성되었습니다'
    });

  } catch (error) {
    console.error('사용자 생성 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 