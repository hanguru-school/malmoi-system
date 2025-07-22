'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Clock, 
  MessageSquare, 
  Calendar, 
  Users, 
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  User,
  Shield
} from 'lucide-react';

interface StaffPermissions {
  canViewReservations: boolean;
  canEditReservations: boolean;
  canViewMessages: boolean;
  canSendMessages: boolean;
  canViewReports: boolean;
  canManageStudents: boolean;
}

const navigation = [
  { 
    name: '홈', 
    href: '/staff/home', 
    icon: Home,
    requiredPermission: null 
  },
  { 
    name: '업무 기록', 
    href: '/staff/work-log', 
    icon: Clock,
    requiredPermission: null 
  },
  { 
    name: '근태 확인', 
    href: '/staff/attendance', 
    icon: Clock,
    requiredPermission: null 
  },
  { 
    name: '메시지 관리', 
    href: '/staff/messages', 
    icon: MessageSquare,
    requiredPermission: 'canViewMessages' 
  },
  { 
    name: '예약 관리', 
    href: '/staff/reservations', 
    icon: Calendar,
    requiredPermission: 'canViewReservations' 
  },
  { 
    name: '학생 관리', 
    href: '/staff/students', 
    icon: Users,
    requiredPermission: 'canManageStudents' 
  },
  { 
    name: '내 정보', 
    href: '/staff/profile', 
    icon: User,
    requiredPermission: null 
  },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  // 실제로는 API에서 권한 정보를 가져와야 함
  const [permissions] = useState<StaffPermissions>({
    canViewReservations: true,
    canEditReservations: false,
    canViewMessages: true,
    canSendMessages: true,
    canViewReports: false,
    canManageStudents: false
  });

  const hasPermission = (permission: string | null) => {
    if (!permission) return true;
    return permissions[permission as keyof StaffPermissions] || false;
  };

  const filteredNavigation = navigation.filter(item => 
    hasPermission(item.requiredPermission)
  );

  return (
    <div className="min-h-screen bg-gray-50">
          {/* 모바일 사이드바 오버레이 */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* 사이드바 */}
          <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">사무 포털</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="mt-6 px-3">
              <div className="space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                      {item.requiredPermission && !permissions[item.requiredPermission as keyof StaffPermissions] && (
                        <Shield className="w-4 h-4 ml-auto text-gray-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* 권한 정보 */}
            <div className="absolute bottom-20 left-0 right-0 p-4">
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-900 mb-2">권한 정보</h3>
                <div className="space-y-1 text-xs text-yellow-800">
                  <div className="flex items-center justify-between">
                    <span>예약 관리:</span>
                    <span>{permissions.canEditReservations ? '편집 가능' : '열람만'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>메시지 발송:</span>
                    <span>{permissions.canSendMessages ? '가능' : '불가'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>학생 관리:</span>
                    <span>{permissions.canManageStudents ? '가능' : '불가'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 로그아웃 버튼 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <LogOut className="w-5 h-5 mr-3" />
                로그아웃
              </button>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:pl-64">
            {/* 상단 헤더 */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-4">
                  <div className="hidden sm:block">
                    <div className="text-sm text-gray-500">안녕하세요,</div>
                    <div className="text-lg font-semibold text-gray-900">김사무직원님</div>
                  </div>
                  
                  {/* 알림 아이콘 */}
                  <div className="relative">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <div className="w-5 h-5 relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                          1
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* 설정 아이콘 */}
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </header>

            {/* 페이지 콘텐츠 */}
            <main className="p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
    );
} 