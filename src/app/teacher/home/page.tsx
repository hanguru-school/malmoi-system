'use client';

import { CheckCircle, Clock, AlertCircle, Calendar, Users, TrendingUp, DollarSign, ChevronRight, Wifi, MapPin, MessageSquare, BookOpen, User, LogOut, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PermissionAuth from '@/components/common/PermissionAuth';
import { useAuth } from '@/hooks/useAuth';

interface AuthenticatedUser {
  cardId: string;
  uid: string;
  cardType: 'student' | 'teacher' | 'staff' | 'visitor' | 'admin' | 'super_admin';
  assignedTo?: string;
  lastTaggingTime: Date;
  permissions: string[];
}

interface TodayClass {
  id: string;
  time: string;
  studentName: string;
  courseName: string;
  location: 'online' | 'offline';
  duration: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  isTagged: boolean;
}

interface TeacherStats {
  todayClasses: number;
  completedClasses: number;
  totalStudents: number;
  monthlySalary: number;
  attendanceStreak: number;
  averageRating: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

export default function TeacherHomePage() {
  const { user, logout } = useAuth();
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState<'not_checked' | 'checked_in' | 'checked_out'>('not_checked');

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

  // 출근/퇴근 처리
  const handleAttendanceAction = async () => {
    try {
      const action = attendanceStatus === 'checked_in' ? 'check_out' : 'check_in';
      
      // 사용자의 카드 ID 찾기 (실제로는 사용자 정보에서 가져와야 함)
      const cardId = user?.email === 'teacher@hanguru.school' ? 'CARD-002' : 'CARD-001';
      
      const response = await fetch('/api/tagging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          deviceId: 'WEB-DEVICE',
          location: '웹 시스템',
          action
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 출근 상태 업데이트
        setAttendanceStatus(action === 'check_in' ? 'checked_in' : 'checked_out');
        
        // 성공 메시지 표시 (실제로는 토스트나 알림 사용)
        alert(result.message);
      } else {
        alert(result.message || '처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('출근/퇴근 처리 오류:', error);
      alert('출근/퇴근 처리 중 오류가 발생했습니다.');
    }
  };

  // 수업 상세 정보 처리
  const handleClassDetail = (classId: string) => {
    // 실제로는 수업 상세 페이지로 이동하거나 모달을 열어야 함
    const classItem = todayClasses.find(cls => cls.id === classId);
    if (classItem) {
      alert(`${classItem.studentName}님의 ${classItem.courseName} 수업 상세 정보\n시간: ${classItem.time}\n상태: ${getStatusText(classItem.status)}\n위치: ${classItem.location === 'online' ? '온라인' : '오프라인'}`);
    }
  };

  // 담당 학생 목록 보기
  const handleViewStudents = () => {
    // 실제로는 담당 학생 목록 페이지로 이동하거나 모달을 열어야 함
    alert(`담당 학생 목록 (총 ${stats?.totalStudents}명)\n\n• 김학생 (컴퓨터공학과)\n• 이학생 (컴퓨터공학과)\n• 박학생 (컴퓨터공학과)\n• 최학생 (컴퓨터공학과)\n• 정학생 (컴퓨터공학과)\n• 한학생 (컴퓨터공학과)\n• 조학생 (컴퓨터공학과)\n• 임학생 (컴퓨터공학과)\n• 강학생 (컴퓨터공학과)\n• 윤학생 (컴퓨터공학과)\n• 송학생 (컴퓨터공학과)\n• 백학생 (컴퓨터공학과)`);
  };

  useEffect(() => {
    // 실제 API 호출로 대체
    const loadTeacherData = async () => {
      try {
        // 오늘의 출근 상태 확인
        const attendanceResponse = await fetch('/api/tagging');
        const attendanceResult = await attendanceResponse.json();
        
        // 오늘 날짜의 태깅 로그에서 현재 사용자의 출근 상태 확인
        const today = new Date().toDateString();
        const userTodayLogs = attendanceResult.logs?.filter((log: any) => {
          const logDate = new Date(log.timestamp).toDateString();
          return logDate === today && log.userId === user?.id;
        }) || [];

        // 가장 최근 태깅 로그로 출근 상태 결정
        if (userTodayLogs.length > 0) {
          const latestLog = userTodayLogs[0];
          if (latestLog.action === 'check_in') {
            setAttendanceStatus('checked_in');
          } else if (latestLog.action === 'check_out') {
            setAttendanceStatus('checked_out');
          }
        } else {
          setAttendanceStatus('not_checked');
        }

        // 수업 데이터 로드
        setTodayClasses([
          {
            id: '1',
            time: '09:00',
            studentName: '김학생',
            courseName: '영어 회화',
            location: 'online',
            duration: 60,
            status: 'completed',
            isTagged: true
          },
          {
            id: '2',
            time: '11:00',
            studentName: '이학생',
            courseName: '문법',
            location: 'offline',
            duration: 60,
            status: 'in_progress',
            isTagged: true
          },
          {
            id: '3',
            time: '14:00',
            studentName: '박학생',
            courseName: '리스닝',
            location: 'online',
            duration: 45,
            status: 'upcoming',
            isTagged: false
          },
          {
            id: '4',
            time: '16:00',
            studentName: '최학생',
            courseName: '작문',
            location: 'offline',
            duration: 60,
            status: 'upcoming',
            isTagged: false
          }
        ]);

        setStats({
          todayClasses: 4,
          completedClasses: 1,
          totalStudents: 12,
          monthlySalary: 2500000,
          attendanceStreak: 15,
          averageRating: 4.8
        });

        setLoading(false);
      } catch (error) {
        console.error('강사 데이터 로드 오류:', error);
        // 오류 시 기본 상태로 설정
        setAttendanceStatus('not_checked');
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [user?.id]);

  // 권한 인증 모달 표시
  if (showAuthModal) {
    return (
      <PermissionAuth
        requiredPermissions={['teacher:*']}
        onAuthSuccess={handleAuthSuccess}
        onAuthFail={handleAuthFail}
        portalType="teacher"
      />
    );
  }

  // 권한 인증 실패 시
  if (authFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600 mb-6">
            선생님 포털에 접근할 권한이 없습니다.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
            <Link
              href="/"
              className="block w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: '출근 태깅',
      description: '교실에서 카드로 출근 체크',
      icon: Clock,
      href: '/tagging',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: '2',
      title: '노트 작성',
      description: '수업 노트 작성하기',
      icon: BookOpen,
      href: '/teacher/notes',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: '3',
      title: '리뷰 확인',
      description: '학생 리뷰 확인 및 응답',
      icon: MessageSquare,
      href: '/teacher/reviews',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: '4',
      title: '급여 확인',
      description: '월별 급여 내역 확인',
      icon: DollarSign,
      href: '/teacher/salary',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '예정';
      case 'in_progress':
        return '진행중';
      case 'completed':
        return '완료';
      default:
        return '알 수 없음';
    }
  };

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
            강사 대시보드에 접근하려면 로그인이 필요합니다.
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

  // 강사 권한 확인
  if (user.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600 mb-6">
            강사 대시보드에 접근할 권한이 없습니다.
            <br />
            현재 권한: {user.role === 'admin' ? '관리자' : user.role === 'student' ? '학생' : user.role === 'staff' ? '직원' : user.role}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 환영 메시지 */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              안녕하세요, {user.name} 선생님! 👋
            </h1>
            <p className="text-lg text-gray-600">
              오늘도 좋은 수업 되세요!
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* 현재 사용자 정보 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                <div className="text-sm">
                  <div className="font-medium text-green-900">
                    {user.name} (강사)
                  </div>
                  <div className="text-green-700">
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
            
          </div>
        </div>
      </div>

      {/* 근태 상태 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              attendanceStatus === 'checked_in' 
                ? 'bg-green-100 text-green-600' 
                : attendanceStatus === 'checked_out'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-yellow-100 text-yellow-600'
            }`}>
              {attendanceStatus === 'checked_in' ? (
                <CheckCircle className="w-6 h-6" />
              ) : attendanceStatus === 'checked_out' ? (
                <Clock className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {attendanceStatus === 'checked_in' ? '출근 완료' : 
                 attendanceStatus === 'checked_out' ? '퇴근 완료' : '출근 대기'}
              </h3>
              <p className="text-sm text-gray-600">
                {attendanceStatus === 'checked_in' ? '오늘도 열심히 일하세요!' :
                 attendanceStatus === 'checked_out' ? '수고하셨습니다!' :
                 'UID 카드로 출근 체크해주세요'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleAttendanceAction}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {attendanceStatus === 'checked_in' ? '퇴근하기' : '출근하기'}
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">오늘 수업</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.todayClasses}회</div>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            완료 {stats?.completedClasses}회
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">담당 학생</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalStudents}명</div>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            연속 출근 {stats?.attendanceStreak}일
          </div>
          <button
            onClick={() => handleViewStudents()}
            className="mt-3 w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            보기
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">평균 평점</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.averageRating}</div>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            학생 만족도
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">이번 달 급여</div>
              <div className="text-2xl font-bold text-gray-900">
                ¥{(stats?.monthlySalary || 0) / 100}
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            예상 급여
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 오늘의 수업 일정 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">오늘의 수업</h2>
            <Link
              href="/teacher/schedule"
              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              전체보기
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {todayClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>오늘 예정된 수업이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayClasses.map((classItem) => (
                <div
                  key={classItem.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{classItem.time}</div>
                      <div className="text-xs text-gray-500">{classItem.duration}분</div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{classItem.studentName}</div>
                      <div className="text-sm text-gray-600">{classItem.courseName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {classItem.location === 'online' ? (
                          <Wifi className="w-3 h-3 text-blue-600" />
                        ) : (
                          <MapPin className="w-3 h-3 text-green-600" />
                        )}
                        <span className="text-xs text-gray-500">
                          {classItem.location === 'online' ? '온라인' : '오프라인'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(classItem.status)}`}>
                      {getStatusText(classItem.status)}
                    </span>
                    {classItem.isTagged && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    <button
                      onClick={() => handleClassDetail(classItem.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      확인하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 빠른 액션 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">빠른 액션</h2>
          <div className="grid grid-cols-1 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className={`flex items-center gap-4 p-4 rounded-lg text-white transition-colors ${action.color}`}
              >
                <action.icon className="w-6 h-6" />
                <div className="flex-1">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 알림 및 공지사항 */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">알림 및 공지사항 📢</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">새로운 학생 등록</h3>
              <p className="text-sm text-gray-600">
                이번 주 새로운 학생 2명이 등록되었습니다. 학생 정보를 확인해주세요.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
            <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">미응답 리뷰</h3>
              <p className="text-sm text-gray-600">
                학생 리뷰 3건에 대한 응답이 필요합니다. 확인 후 답변해주세요.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
            <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">급여 정산</h3>
              <p className="text-sm text-gray-600">
                이번 달 급여 정산이 완료되었습니다. 급여 내역을 확인해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 플로팅 홈 버튼 */}
      <Link href="/">
        <button className="fixed bottom-20 right-6 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors">
          <Home className="w-6 h-6" />
        </button>
      </Link>
    </div>
  );
} 