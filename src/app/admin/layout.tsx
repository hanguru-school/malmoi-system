'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Home,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  Database,
  LogOut,
  Menu,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  UserPlus,
  FileText,
  Mail,
  GraduationCap,
  DollarSign,
  BarChart3,
  Star,
  CreditCard,
  BookOpen,
  Tag,
  Shield,
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Receipt,
  Wallet,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'NEW_ENROLLMENT' | 'NEW_RESERVATION' | 'NEW_INQUIRY' | 'NEW_TRIAL_LESSON' | 'SYSTEM';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: '대시보드',
    href: '/admin/dashboard',
    icon: Home,
  },
  {
    name: '예약관리',
    icon: Calendar,
    children: [
      {
        name: '예약하기',
        href: '/admin/reservations/new',
        icon: Plus,
      },
      {
        name: '예약관리',
        href: '/admin/reservations',
        icon: Calendar,
      },
      {
        name: '예약설정',
        href: '/admin/reservations/settings',
        icon: Settings,
      },
    ],
  },
  {
    name: '수업관리',
    icon: BookOpen,
    children: [
      {
        name: '수업관리',
        href: '/admin/lessons',
        icon: BookOpen,
      },
      {
        name: '수업 추가',
        href: '/admin/lessons/new',
        icon: Plus,
      },
      {
        name: '수업 시간 관리',
        href: '/admin/settings/durations',
        icon: Clock,
      },
    ],
  },
  {
    name: '학생관리',
    icon: Users,
    children: [
      {
        name: '학생관리',
        href: '/admin/students',
        icon: Users,
      },
    ],
  },
  {
    name: '선생님관리',
    icon: GraduationCap,
    children: [
      {
        name: '선생님관리',
        href: '/admin/teachers',
        icon: GraduationCap,
      },
      {
        name: '선생님 업무시간',
        href: '/admin/teachers/schedule',
        icon: Clock,
      },
    ],
  },
  {
    name: '결제관리',
    icon: DollarSign,
    children: [
      {
        name: '학생결제관리',
        href: '/admin/payments',
        icon: CreditCard,
      },
      {
        name: '선생님 및 직원 급여',
        href: '/admin/payments/salary',
        icon: Receipt,
      },
      {
        name: '교실 지출입 관리',
        href: '/admin/payments/expenses',
        icon: Wallet,
      },
    ],
  },
  {
    name: '메시지관리',
    icon: MessageSquare,
    children: [
      {
        name: '메시지관리',
        href: '/admin/messages',
        icon: MessageSquare,
      },
      {
        name: '리뷰관리',
        href: '/admin/review-management',
        icon: Star,
      },
      {
        name: '푸시알림관리',
        href: '/admin/push-notification-settings',
        icon: Bell,
      },
    ],
  },
  {
    name: '데이터관리',
    icon: Database,
    children: [
      {
        name: '데이터관리',
        href: '/admin/data-management',
        icon: Database,
      },
      {
        name: '통계관리',
        href: '/admin/statistics',
        icon: BarChart3,
      },
      {
        name: '분석관리',
        href: '/admin/analytics',
        icon: TrendingUp,
      },
      {
        name: '태깅관리',
        href: '/admin/tagging-management',
        icon: Tag,
      },
    ],
  },
  {
    name: '설정',
    icon: Settings,
    children: [
      {
        name: '교실운영시간관리',
        href: '/admin/settings/operating-hours',
        icon: Clock,
      },
      {
        name: '관리자 설정',
        href: '/admin/admin-management',
        icon: Shield,
      },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  // 알림 가져오기
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (error) {
      console.error('알림 가져오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (id: string) => {
    try {
      // 즉시 UI 업데이트 (낙관적 업데이트)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ read: true }),
      });
      
      if (!response.ok) {
        // 실패 시 원래 상태로 복구
        fetchNotifications();
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      // 오류 시 알림 목록 다시 가져오기
      fetchNotifications();
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      // 즉시 UI 업데이트 (낙관적 업데이트)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      const response = await fetch('/api/admin/notifications/read-all', {
        method: 'PUT',
        credentials: 'include',
      });
      
      if (!response.ok) {
        // 실패 시 원래 상태로 복구
        fetchNotifications();
      }
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error);
      // 오류 시 알림 목록 다시 가져오기
      fetchNotifications();
    }
  };

  // 시간 포맷팅
  const formatTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return notificationDate.toLocaleDateString('ko-KR');
  };

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_ENROLLMENT':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'NEW_RESERVATION':
        return <Calendar className="w-4 h-4 text-green-600" />;
      case 'NEW_INQUIRY':
        return <Mail className="w-4 h-4 text-yellow-600" />;
      case 'NEW_TRIAL_LESSON':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  // 알림 클릭 처리
  const handleNotificationClick = async (notification: Notification) => {
    // 읽음 처리
    await markAsRead(notification.id);
    
    // 알림 타입에 따라 적절한 페이지로 이동
    if (notification.data) {
      switch (notification.type) {
        case 'NEW_ENROLLMENT':
          router.push(`/admin/data-management?tab=students&studentId=${notification.data.studentId}`);
          break;
        case 'NEW_RESERVATION':
          router.push(`/admin/data-management?tab=reservations&reservationId=${notification.data.reservationId}`);
          break;
        case 'NEW_INQUIRY':
          router.push(`/admin/data-management?tab=inquiries&inquiryId=${notification.data.inquiryId}`);
          break;
        case 'NEW_TRIAL_LESSON':
          router.push(`/admin/data-management?tab=trial-lessons&trialId=${notification.data.trialId}`);
          break;
      }
    }
    setNotificationOpen(false);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };

    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen]);

  // 초기 알림 로드 및 폴링
  useEffect(() => {
    fetchNotifications();
    
    // 30초마다 알림 업데이트
    pollIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);


  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    try {
      document.cookie = 'user-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('로그아웃 오류:', error);
      window.location.href = '/auth/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 모바일에서만 닫기 버튼 표시 */}
        <div className="lg:hidden flex items-center justify-end h-16 px-6 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus.has(item.name);
              const isActive = pathname === item.href || (hasChildren && item.children?.some(child => pathname === child.href));

              if (hasChildren) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children?.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href || '#'}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                isChildActive
                                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                            >
                              <child.icon className="w-4 h-4 mr-3" />
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href || '#'}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* 로그아웃 버튼 */}
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
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

            <div className="flex items-center space-x-4 ml-auto">
              {/* 알림 아이콘 */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="p-2 text-gray-400 hover:text-gray-600 relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* 알림 드롭다운 */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">알림</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            모두 읽음으로 표시
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="p-4 text-center text-gray-500">로딩 중...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">알림이 없습니다</div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getNotificationIcon(notification.type)}
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </h4>
                                  {notification.priority === 'high' && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                                      긴급
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatTime(notification.time)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main>{children}</main>
      </div>
    </div>
  );
}
