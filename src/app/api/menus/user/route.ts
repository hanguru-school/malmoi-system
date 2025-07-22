import { NextRequest, NextResponse } from 'next/server';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  roles: string[];
  permissions?: string[];
  category: string;
  order: number;
}

interface UserProfile {
  uid: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'staff';
  permissions: string[];
}

// 전체 메뉴 정의
const allMenus: MenuItem[] = [
  {
    id: 'dashboard',
    title: '대시보드',
    description: '전체 시스템 현황 및 통계',
    icon: 'Building',
    href: '/master/dashboard',
    roles: ['admin', 'teacher', 'staff'],
    category: 'main',
    order: 1
  },
  {
    id: 'user-management',
    title: '사용자 관리',
    description: '사용자 등록, 수정, 삭제',
    icon: 'Users',
    href: '/master/users',
    roles: ['admin'],
    permissions: ['user:manage'],
    category: 'management',
    order: 2
  },
  {
    id: 'reservation-management',
    title: '예약 관리',
    description: '예약 승인, 거부, 조정',
    icon: 'Calendar',
    href: '/master/reservations',
    roles: ['admin', 'teacher', 'staff'],
    permissions: ['reservation:manage'],
    category: 'management',
    order: 3
  },
  {
    id: 'facility-management',
    title: '시설 관리',
    description: '시설 정보 및 상태 관리',
    icon: 'Building',
    href: '/master/facilities',
    roles: ['admin', 'staff'],
    permissions: ['facility:manage'],
    category: 'management',
    order: 4
  },
  {
    id: 'reports',
    title: '보고서',
    description: '사용 통계 및 분석 보고서',
    icon: 'BookOpen',
    href: '/master/reports',
    roles: ['admin', 'teacher'],
    permissions: ['report:view'],
    category: 'analytics',
    order: 5
  },
  {
    id: 'settings',
    title: '시스템 설정',
    description: '시스템 환경 설정',
    icon: 'Settings',
    href: '/master/settings',
    roles: ['admin'],
    permissions: ['system:configure'],
    category: 'system',
    order: 6
  },
  {
    id: 'security',
    title: '보안 관리',
    description: '접근 권한 및 보안 설정',
    icon: 'Shield',
    href: '/master/security',
    roles: ['admin'],
    permissions: ['security:manage'],
    category: 'system',
    order: 7
  },
  {
    id: 'logs',
    title: '시스템 로그',
    description: '시스템 활동 로그 조회',
    icon: 'FileText',
    href: '/master/logs',
    roles: ['admin'],
    permissions: ['log:view'],
    category: 'system',
    order: 8
  },
  {
    id: 'notifications',
    title: '알림 관리',
    description: '시스템 알림 설정 및 관리',
    icon: 'Bell',
    href: '/master/notifications',
    roles: ['admin', 'staff'],
    permissions: ['notification:manage'],
    category: 'management',
    order: 9
  }
];

// 사용자별 메뉴 필터링 함수
function filterMenusByUser(user: UserProfile): MenuItem[] {
  return allMenus
    .filter(menu => {
      // 역할 체크
      if (!menu.roles.includes(user.role)) {
        return false;
      }

      // 권한 체크
      if (menu.permissions) {
        const hasPermission = menu.permissions.some(permission => 
          user.permissions.includes(permission)
        );
        if (!hasPermission) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => a.order - b.order);
}

// 메뉴를 카테고리별로 그룹화
function groupMenusByCategory(menus: MenuItem[]) {
  const grouped: Record<string, MenuItem[]> = {};
  
  menus.forEach(menu => {
    if (!grouped[menu.category]) {
      grouped[menu.category] = [];
    }
    grouped[menu.category].push(menu);
  });

  return grouped;
}

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

    // 사용자 프로필 조회 (실제로는 사용자 API 호출)
    const userProfiles: Record<string, UserProfile> = {
      'STUDENT1234': {
        uid: 'STUDENT1234',
        name: '김학생',
        role: 'student',
        permissions: ['reservation:create', 'reservation:view']
      },
      'TEACHER5678': {
        uid: 'TEACHER5678',
        name: '박교수',
        role: 'teacher',
        permissions: ['reservation:manage', 'report:view', 'facility:view']
      },
      'STAFF9012': {
        uid: 'STAFF9012',
        name: '이직원',
        role: 'staff',
        permissions: ['reservation:manage', 'facility:manage', 'user:view', 'notification:manage']
      },
      'ADMIN3456': {
        uid: 'ADMIN3456',
        name: '최관리자',
        role: 'admin',
        permissions: ['user:manage', 'reservation:manage', 'facility:manage', 'report:view', 'system:configure', 'security:manage', 'log:view', 'notification:manage']
      }
    };

    const userProfile = userProfiles[uid];

    if (!userProfile) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 사용자별 메뉴 필터링
    const availableMenus = filterMenusByUser(userProfile);
    
    // 카테고리별 그룹화
    const groupedMenus = groupMenusByCategory(availableMenus);

    return NextResponse.json({
      success: true,
      data: {
        user: userProfile,
        menus: availableMenus,
        groupedMenus,
        totalCount: availableMenus.length
      }
    });

  } catch (error) {
    console.error('메뉴 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 