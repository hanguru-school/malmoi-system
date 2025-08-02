"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  User,
  XCircle,
  Eye,
  GraduationCap,
  BookOpen,
  Activity,
  FileText,
  Zap,
  Settings,
  BarChart3,
  Star,
  CreditCard,
  Shield,
  Building,
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  activeLessons: number;
  pendingReviews: number;
  systemHealth: "good" | "warning" | "error";
  monthlyGrowth: number;
  attendanceRate: number;
}

interface RecentActivity {
  id: string;
  type: "lesson" | "payment" | "review" | "system" | "student" | "teacher";
  title: string;
  description: string;
  timestamp: string;
  status: "success" | "warning" | "error" | "info";
  icon: any;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  bgColor: string;
}

interface RoleNavigation {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  bgColor: string;
}

export default function AdminHome() {
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalRevenue: 0,
    activeLessons: 0,
    pendingReviews: 0,
    systemHealth: "good",
    monthlyGrowth: 0,
    attendanceRate: 0,
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실제 데이터 로딩 시뮬레이션
    const loadDashboardData = async () => {
      setLoading(true);

      // Mock 데이터
      const mockStats: AdminStats = {
        totalStudents: 156,
        totalTeachers: 12,
        totalRevenue: 45000000,
        activeLessons: 8,
        pendingReviews: 23,
        systemHealth: "good",
        monthlyGrowth: 12.5,
        attendanceRate: 94.2,
      };

      const mockActivities: RecentActivity[] = [
        {
          id: "1",
          type: "student",
          title: "새 학생 등록",
          description: "김학생님이 시스템에 등록되었습니다.",
          timestamp: "5분 전",
          status: "success",
          icon: User,
        },
        {
          id: "2",
          type: "lesson",
          title: "수업 완료",
          description: "중급 회화 수업이 성공적으로 완료되었습니다.",
          timestamp: "15분 전",
          status: "success",
          icon: BookOpen,
        },
        {
          id: "3",
          type: "payment",
          title: "결제 완료",
          description: "이학생님의 월 수강료 결제가 완료되었습니다.",
          timestamp: "1시간 전",
          status: "success",
          icon: CreditCard,
        },
        {
          id: "4",
          type: "review",
          title: "리뷰 등록",
          description: "박선생님에 대한 새로운 리뷰가 등록되었습니다.",
          timestamp: "2시간 전",
          status: "info",
          icon: Star,
        },
        {
          id: "5",
          type: "system",
          title: "시스템 업데이트",
          description: "태깅 시스템이 성공적으로 업데이트되었습니다.",
          timestamp: "3시간 전",
          status: "success",
          icon: Zap,
        },
      ];

      // 실제 API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStats(mockStats);
      setRecentActivities(mockActivities);
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  const quickActions: QuickAction[] = [
    {
      id: "students",
      title: "학생 관리",
      description: "학생 등록, 정보 수정, 출석 관리",
      href: "/admin/students",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "teachers",
      title: "강사 관리",
      description: "강사 등록, 스케줄 관리, 급여 관리",
      href: "/admin/teachers",
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "schedule",
      title: "수업 일정",
      description: "수업 스케줄 관리 및 예약 시스템",
      href: "/admin/schedule",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "finance",
      title: "재정 관리",
      description: "수강료 관리, 결제 내역, 수익 분석",
      href: "/admin/finance",
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      id: "student-notes",
      title: "학생 노트 관리",
      description: "학생 수업 노트 및 평가 관리",
      href: "/admin/student-notes",
      icon: FileText,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      id: "reports",
      title: "리포트",
      description: "학습 진도, 출석률, 성과 분석",
      href: "/admin/reports",
      icon: BarChart3,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      id: "settings",
      title: "시스템 설정",
      description: "시스템 설정, 권한 관리, 백업",
      href: "/admin/settings",
      icon: Settings,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "info":
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      case "info":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>관리자 대시보드를 로드하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-lg text-gray-600">
            학원 운영 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* 오늘의 일정 - 최상단 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            오늘의 일정
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">관리자 회의</p>
                <p className="text-xs text-gray-600">14:00 - 15:00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  신규 학생 상담
                </p>
                <p className="text-xs text-gray-600">16:00 - 17:00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  월간 리포트 작성
                </p>
                <p className="text-xs text-gray-600">18:00 - 19:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">최근 활동</h2>
            <Link
              href="/admin/activities"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              전체 보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div
                    className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {activity.timestamp}
                    </p>
                  </div>
                  {getStatusIcon(activity.status)}
                </div>
              );
            })}
          </div>
        </div>

        {/* 역할별 페이지 접근 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            역할별 페이지 접근
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/student/home" className="group">
              <div className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">학생 페이지</h3>
                </div>
                <p className="text-sm text-gray-600">학생용 대시보드 및 기능</p>
              </div>
            </Link>

            <Link href="/teacher/home" className="group">
              <div className="p-6 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">선생님 페이지</h3>
                </div>
                <p className="text-sm text-gray-600">
                  선생님용 대시보드 및 기능
                </p>
              </div>
            </Link>

            <Link href="/staff/home" className="group">
              <div className="p-6 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">직원 페이지</h3>
                </div>
                <p className="text-sm text-gray-600">직원용 대시보드 및 기능</p>
              </div>
            </Link>

            <Link href="/parent/home" className="group">
              <div className="p-6 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">학부모 페이지</h3>
                </div>
                <p className="text-sm text-gray-600">
                  학부모용 대시보드 및 기능
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* 주요 기능 (기존 빠른 액션) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            주요 기능
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className={`${action.bgColor} p-4 rounded-lg hover:shadow-md transition-all duration-200 group`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${action.color} p-2 rounded-lg bg-white`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-gray-700">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 최근 교실 현황 - 통계 카드들을 하나의 상자에 묶어서 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            최근 교실 현황
          </h2>

          {/* 주요 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Link href="/admin/students" className="block">
              <div className="bg-blue-50 rounded-lg p-6 hover:bg-blue-100 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">총 학생 수</p>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {formatNumber(stats.totalStudents)}명
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/teachers" className="block">
              <div className="bg-green-50 rounded-lg p-6 hover:bg-green-100 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">총 강사 수</p>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                      {formatNumber(stats.totalTeachers)}명
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/finance" className="block">
              <div className="bg-yellow-50 rounded-lg p-6 hover:bg-yellow-100 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">총 수익</p>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                      {formatCurrency(stats.totalRevenue)}원
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/schedule" className="block">
              <div className="bg-purple-50 rounded-lg p-6 hover:bg-purple-100 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">진행 중 수업</p>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {stats.activeLessons}개
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* 추가 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link href="/admin/reports" className="block">
              <div className="bg-green-50 rounded-lg p-6 hover:bg-green-100 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">월 성장률</p>
                    <p className="text-2xl font-bold text-green-600 group-hover:text-green-700 transition-colors">
                      +{stats.monthlyGrowth}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600 group-hover:text-green-700 transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/admin/students" className="block">
              <div className="bg-blue-50 rounded-lg p-6 hover:bg-blue-100 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">평균 출석률</p>
                    <p className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                      {stats.attendanceRate}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/admin/reviews" className="block">
              <div className="bg-orange-50 rounded-lg p-6 hover:bg-orange-100 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">대기 리뷰</p>
                    <p className="text-2xl font-bold text-orange-600 group-hover:text-orange-700 transition-colors">
                      {stats.pendingReviews}개
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-orange-600 group-hover:text-orange-700 transition-colors" />
                </div>
              </div>
            </Link>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">시스템 상태</p>
                  <p
                    className={`text-2xl font-bold ${stats.systemHealth === "good" ? "text-green-600" : stats.systemHealth === "warning" ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {stats.systemHealth === "good"
                      ? "정상"
                      : stats.systemHealth === "warning"
                        ? "주의"
                        : "오류"}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 시스템 상태 상세 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            시스템 상태
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">전체 시스템</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stats.systemHealth)}`}
              >
                {stats.systemHealth === "good"
                  ? "정상"
                  : stats.systemHealth === "warning"
                    ? "주의"
                    : "오류"}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">태깅 시스템</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                정상
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">결제 시스템</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                정상
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">데이터베이스</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                정상
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
