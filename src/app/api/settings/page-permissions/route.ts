import { NextRequest, NextResponse } from 'next/server';

interface PagePermission {
  id: string;
  name: string;
  path: string;
  requireAuth: boolean;
  requireTagging: boolean;
  requirePassword: boolean;
  roles: string[];
  permissions: string[];
}

// 페이지 권한 설정 (실제로는 DB에 저장)
let pagePermissions: PagePermission[] = [
  {
    id: 'master',
    name: '마스터 페이지',
    path: '/master',
    requireAuth: true,
    requireTagging: false,
    requirePassword: false,
    roles: ['admin', 'teacher', 'staff'],
    permissions: []
  },
  {
    id: 'master-dashboard',
    name: '대시보드',
    path: '/master/dashboard',
    requireAuth: true,
    requireTagging: false,
    requirePassword: false,
    roles: ['admin', 'teacher', 'staff'],
    permissions: []
  },
  {
    id: 'master-users',
    name: '사용자 관리',
    path: '/master/users',
    requireAuth: true,
    requireTagging: false,
    requirePassword: false,
    roles: ['admin'],
    permissions: ['user:manage']
  },
  {
    id: 'master-reservations',
    name: '예약 관리',
    path: '/master/reservations',
    requireAuth: true,
    requireTagging: false,
    requirePassword: false,
    roles: ['admin', 'teacher', 'staff'],
    permissions: ['reservation:manage']
  },
  {
    id: 'master-facilities',
    name: '시설 관리',
    path: '/master/facilities',
    requireAuth: true,
    requireTagging: false,
    requirePassword: false,
    roles: ['admin', 'staff'],
    permissions: ['facility:manage']
  },
  {
    id: 'master-reports',
    name: '보고서',
    path: '/master/reports',
    requireAuth: true,
    requireTagging: false,
    requirePassword: false,
    roles: ['admin', 'teacher'],
    permissions: ['report:view']
  },
  {
    id: 'master-settings',
    name: '시스템 설정',
    path: '/master/settings',
    requireAuth: true,
    requireTagging: false,
    requirePassword: false,
    roles: ['admin'],
    permissions: ['system:configure']
  },
  {
    id: 'master-security',
    name: '보안 관리',
    path: '/master/security',
    requireAuth: true,
    requireTagging: false,
    requirePassword: false,
    roles: ['admin'],
    permissions: ['security:manage']
  }
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: pagePermissions
    });
  } catch (error) {
    console.error('페이지 권한 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pages } = body;

    if (!pages || !Array.isArray(pages)) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터입니다' },
        { status: 400 }
      );
    }

    // 페이지 권한 업데이트
    pagePermissions = pages;

    return NextResponse.json({
      success: true,
      message: '페이지 권한이 성공적으로 저장되었습니다'
    });

  } catch (error) {
    console.error('페이지 권한 저장 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 