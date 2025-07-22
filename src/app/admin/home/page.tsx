'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  User,
  LogOut,
  Home,
  XCircle,
  Eye,
  GraduationCap,
  BookOpen,
  Activity,
  FileText,
  Zap,
  Settings,
  BarChart3,
  MessageSquare,
  Bell,
  Star,
  Volume2,
  CreditCard,
  Award,
  Layers,
  TestTube,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface AuthenticatedUser {
  cardId: string;
  uid: string;
  cardType: 'student' | 'teacher' | 'staff' | 'visitor' | 'admin' | 'super_admin';
  assignedTo?: string;
  lastTaggingTime: Date;
  permissions: string[];
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activeLessons: number;
  totalRevenue: number;
  pendingReviews: number;
  systemHealth: 'good' | 'warning' | 'error';
}

interface RecentActivity {
  id: string;
  type: 'lesson' | 'payment' | 'review' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export default function AdminHome() {
  const { user, logout } = useAuth();
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false); // Firebase 인증 사용으로 변경
  const [authFailed, setAuthFailed] = useState(false);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    activeLessons: 0,
    totalRevenue: 0,
    pendingReviews: 0,
    systemHealth: 'good'
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // 권한 인증 성공 처리
  const handleAuthSuccess = (user: AuthenticatedUser) => {
    setAuthenticatedUser(user);
    setShowAuthModal(false);
    setAuthFailed(false);
  };

  // 권한 인증 실패 처리
  const handleAuthFail = () => {
    setAuthFailed(true);
    setShowAuthModal(false);
  };

  useEffect(() => {
    // 실제 데이터 로딩 시뮬레이션
    const loadDashboardData = async () => {
      setLoading(true);
      
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalStudents: 1247,
        totalTeachers: 89,
        activeLessons: 23,
        totalRevenue: 12500000,
        pendingReviews: 156,
        systemHealth: 'good'
      });

      setRecentActivities([
        {
          id: '1',
          type: 'lesson',
          title: '새 수업 예약',
          description: '김영희 학생이 영어 회화 수업을 예약했습니다.',
          timestamp: '2분 전',
          status: 'success'
        },
        {
          id: '2',
          type: 'payment',
          title: '결제 완료',
          description: '박철수 학생의 월간 패키지 결제가 완료되었습니다.',
          timestamp: '5분 전',
          status: 'success'
        },
        {
          id: '3',
          type: 'review',
          title: '새 리뷰 등록',
          description: '이미영 학생이 수업 후기를 작성했습니다.',
          timestamp: '12분 전',
          status: 'info'
        },
        {
          id: '4',
          type: 'system',
          title: '시스템 업데이트',
          description: '태깅 시스템이 성공적으로 업데이트되었습니다.',
          timestamp: '1시간 전',
          status: 'success'
        }
      ]);

      setLoading(false);
    };

    loadDashboardData();
  }, []);

  // 권한 확인
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">
            관리자 대시보드에 접근하려면 로그인이 필요합니다.
          </p>
          <Link
            href="/auth/login"
            className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  // 관리자 권한 확인
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600 mb-6">
            관리자 대시보드에 접근할 권한이 없습니다.
            <br />
            현재 권한: {user.role === 'teacher' ? '강사' : user.role === 'student' ? '학생' : user.role === 'staff' ? '직원' : user.role}
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              메인으로 돌아가기
            </Link>
            <button
              onClick={logout}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Eye className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const quickActions = [
    // 핵심 관리 기능
    {
      title: '학생 관리',
      description: '학생 정보 및 등록 관리',
      icon: <Users className="w-6 h-6" />,
      href: '/admin/customer-management',
      color: 'bg-blue-500 hover:bg-blue-600',
      category: 'core'
    },
    {
      title: '강사 관리',
      description: '강사 정보 및 스케줄 관리',
      icon: <GraduationCap className="w-6 h-6" />,
      href: '/admin/teacher-management',
      color: 'bg-green-500 hover:bg-green-600',
      category: 'core'
    },
    {
      title: '커리큘럼 관리',
      description: '수업 커리큘럼 및 자료 관리',
      icon: <BookOpen className="w-6 h-6" />,
      href: '/admin/curriculum-management',
      color: 'bg-purple-500 hover:bg-purple-600',
      category: 'core'
    },
    {
      title: '태깅 관리',
      description: '출석 및 접근 제어 시스템',
      icon: <Activity className="w-6 h-6" />,
      href: '/admin/tagging-management',
      color: 'bg-orange-500 hover:bg-orange-600',
      category: 'core'
    },
    
    // 서비스 및 예약 관리
    {
      title: '서비스 관리',
      description: '레슨 서비스 추가·수정·삭제',
      icon: <BookOpen className="w-6 h-6" />,
      href: '/admin/service-management',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      category: 'service'
    },
    {
      title: '예약 관리',
      description: '예약 생성·변경·취소 관리',
      icon: <Calendar className="w-6 h-6" />,
      href: '/admin/reservation-management',
      color: 'bg-teal-500 hover:bg-teal-600',
      category: 'service'
    },
    
    // 시스템 관리
    {
      title: '백업 관리',
      description: '데이터 백업 및 복구 관리',
      icon: <FileText className="w-6 h-6" />,
      href: '/backup-management',
      color: 'bg-gray-500 hover:bg-gray-600',
      category: 'system'
    },
    {
      title: '자동화 관리',
      description: '자동화 규칙 및 워크플로우 관리',
      icon: <Zap className="w-6 h-6" />,
      href: '/automation-management',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      category: 'system'
    },
    {
      title: '시스템 설정',
      description: '시스템 설정 및 관리',
      icon: <Settings className="w-6 h-6" />,
      href: '/admin/system-settings',
      color: 'bg-slate-500 hover:bg-slate-600',
      category: 'system'
    },
    
    // 분석 및 통계
    {
      title: '통계 분석',
      description: '학습 데이터 및 성과 분석',
      icon: <BarChart3 className="w-6 h-6" />,
      href: '/admin/statistics',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      category: 'analytics'
    },
    {
      title: '학습 분석',
      description: '학습 패턴 및 진도 분석',
      icon: <TrendingUp className="w-6 h-6" />,
      href: '/admin/learning-analytics',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      category: 'analytics'
    },
    {
      title: '분석 엔진',
      description: '고급 분석 및 인사이트',
      icon: <BarChart3 className="w-6 h-6" />,
      href: '/admin/analytics',
      color: 'bg-violet-500 hover:bg-violet-600',
      category: 'analytics'
    },
    
    // 통합 관리
    {
      title: '라인 연동',
      description: 'LINE 메신저 연동 관리',
      icon: <MessageSquare className="w-6 h-6" />,
      href: '/line-integration',
      color: 'bg-green-500 hover:bg-green-600',
      category: 'integration'
    },
    {
      title: '푸시 알림',
      description: '푸시 메시지 및 알림 관리',
      icon: <Bell className="w-6 h-6" />,
      href: '/admin/push-message-management',
      color: 'bg-red-500 hover:bg-red-600',
      category: 'integration'
    },
    {
      title: '알림 설정',
      description: '알림 규칙 및 템플릿 관리',
      icon: <Bell className="w-6 h-6" />,
      href: '/admin/notification-settings',
      color: 'bg-pink-500 hover:bg-pink-600',
      category: 'integration'
    },
    
    // 리뷰 및 피드백
    {
      title: '리뷰 관리',
      description: '수업 리뷰 및 피드백 관리',
      icon: <Star className="w-6 h-6" />,
      href: '/admin/review-management',
      color: 'bg-amber-500 hover:bg-amber-600',
      category: 'feedback'
    },
    {
      title: '향상된 리뷰',
      description: '고급 리뷰 분석 및 관리',
      icon: <Star className="w-6 h-6" />,
      href: '/admin/enhanced-review-management',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      category: 'feedback'
    },
    
    // 하드웨어 관리
    {
      title: 'IC 카드 관리',
      description: 'IC 카드 발급 및 관리',
      icon: <CreditCard className="w-6 h-6" />,
      href: '/admin/ic-card-management',
      color: 'bg-blue-500 hover:bg-blue-600',
      category: 'hardware'
    },
    
    // 학습 관리
    {
      title: '학습 동기부여',
      description: '학습 동기부여 시스템 관리',
      icon: <Award className="w-6 h-6" />,
      href: '/admin/motivation-management',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      category: 'learning'
    },
    {
      title: '통합 레슨 관리',
      description: '통합 레슨 계획 및 진행 관리',
      icon: <BookOpen className="w-6 h-6" />,
      href: '/admin/integrated-lesson-management',
      color: 'bg-lime-500 hover:bg-lime-600',
      category: 'learning'
    },
    {
      title: '커리큘럼 구성',
      description: '커리큘럼 구성 및 설계',
      icon: <Layers className="w-6 h-6" />,
      href: '/admin/curriculum-composition',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      category: 'learning'
    },
    {
      title: '문법 분류',
      description: '문법 분류 및 체계 관리',
      icon: <FileText className="w-6 h-6" />,
      href: '/admin/grammar-classification',
      color: 'bg-sky-500 hover:bg-sky-600',
      category: 'learning'
    },
    
    // 자료 관리
    {
      title: '자료 관리',
      description: '교육 자료 및 콘텐츠 관리',
      icon: <FileText className="w-6 h-6" />,
      href: '/admin/material-management',
      color: 'bg-purple-500 hover:bg-purple-600',
      category: 'materials'
    },
    {
      title: '학생 자료',
      description: '학생별 맞춤 자료 관리',
      icon: <Users className="w-6 h-6" />,
      href: '/admin/student-materials',
      color: 'bg-rose-500 hover:bg-rose-600',
      category: 'materials'
    },
    {
      title: '오디오 관리',
      description: '오디오 콘텐츠 및 음성 관리',
      icon: <Volume2 className="w-6 h-6" />,
      href: '/admin/audio-management',
      color: 'bg-fuchsia-500 hover:bg-fuchsia-600',
      category: 'materials'
    },
    
    // 기타 관리
    {
      title: '포인트 관리',
      description: '포인트 시스템 및 적립 관리',
      icon: <Star className="w-6 h-6" />,
      href: '/admin/points-management',
      color: 'bg-amber-500 hover:bg-amber-600',
      category: 'other'
    },
    {
      title: '라인 관리',
      description: 'LINE 채널 및 메시지 관리',
      icon: <MessageSquare className="w-6 h-6" />,
      href: '/admin/line-management',
      color: 'bg-green-500 hover:bg-green-600',
      category: 'other'
    },
    {
      title: '메모 관리',
      description: '시스템 메모 및 노트 관리',
      icon: <FileText className="w-6 h-6" />,
      href: '/admin/memo-management',
      color: 'bg-gray-500 hover:bg-gray-600',
      category: 'other'
    },
    {
      title: '권한 관리',
      description: '사용자 권한 및 역할 관리',
      icon: <Shield className="w-6 h-6" />,
      href: '/admin/permission-management',
      color: 'bg-red-500 hover:bg-red-600',
      category: 'other'
    },
    {
      title: '테스트 관리',
      description: '시스템 테스트 및 검증',
      icon: <TestTube className="w-6 h-6" />,
      href: '/admin/testing',
      color: 'bg-orange-500 hover:bg-orange-600',
      category: 'other'
    }
  ];

  const categories = {
    core: { title: '핵심 관리', color: 'bg-blue-50 border-blue-200' },
    service: { title: '서비스 관리', color: 'bg-green-50 border-green-200' },
    system: { title: '시스템 관리', color: 'bg-gray-50 border-gray-200' },
    analytics: { title: '분석 및 통계', color: 'bg-purple-50 border-purple-200' },
    integration: { title: '통합 관리', color: 'bg-cyan-50 border-cyan-200' },
    feedback: { title: '리뷰 및 피드백', color: 'bg-yellow-50 border-yellow-200' },
    hardware: { title: '하드웨어 관리', color: 'bg-indigo-50 border-indigo-200' },
    learning: { title: '학습 관리', color: 'bg-emerald-50 border-emerald-200' },
    materials: { title: '자료 관리', color: 'bg-rose-50 border-rose-200' },
    other: { title: '기타 관리', color: 'bg-slate-50 border-slate-200' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
              <p className="text-gray-600">시스템 현황 및 주요 지표를 한눈에 확인하세요</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 현재 사용자 정보 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">
                      {user.name} (관리자)
                    </div>
                    <div className="text-blue-700">
                      {user.email} • {user.department}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 로그아웃 버튼 */}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
              
              {/* HomeButton variant="header" */}
              <Link href="/">
                <div className="p-3 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 학생 수</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12% 이번 달</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 강사 수</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+3명 이번 달</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">진행 중인 수업</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeLessons}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>실시간 업데이트</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 매출</p>
                <p className="text-2xl font-bold text-gray-900">₩{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+8% 이번 달</span>
            </div>
          </div>
        </div>

        {/* 빠른 액세스 카드 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">빠른 액세스</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.filter(action => action.category === 'core').map((action, index) => {
              const IconComponent = action.icon.type;
              return (
                <Link
                  key={index}
                  href={action.href}
                  className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  <div className="text-center">
                    <div className={`${action.color} p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 빠른 액션 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">관리 기능</h2>
              
              {/* 카테고리별 액션 */}
              {Object.entries(categories).map(([categoryKey, category]) => {
                const categoryActions = quickActions.filter(action => action.category === categoryKey);
                if (categoryActions.length === 0) return null;
                
                return (
                  <div key={categoryKey} className="mb-8">
                    <h3 className={`text-lg font-medium text-gray-900 mb-4 p-3 rounded-lg ${category.color}`}>
                      {category.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryActions.map((action, index) => (
                        <Link
                          key={index}
                          href={action.href}
                          className="group p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-gray-300"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg text-white ${action.color} transition-colors`}>
                              {action.icon}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {action.title}
                              </h4>
                              <p className="text-sm text-gray-600">{action.description}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 최근 활동 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">최근 활동</h2>
              <Link href="/admin/activity-logs" className="text-sm text-blue-600 hover:text-blue-800">
                모두 보기
              </Link>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-4 border-l-4 rounded-r-lg ${getStatusColor(activity.status)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(activity.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 시스템 상태 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">시스템 상태</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                stats.systemHealth === 'good' ? 'bg-green-500' : 
                stats.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900">시스템 상태</p>
                <p className="text-sm text-gray-600">
                  {stats.systemHealth === 'good' ? '정상' : 
                   stats.systemHealth === 'warning' ? '주의' : '오류'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">데이터베이스</p>
                <p className="text-sm text-gray-600">정상</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">태깅 시스템</p>
                <p className="text-sm text-gray-600">정상</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 