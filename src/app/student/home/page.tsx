'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  User,
  LogOut,
  Home,
  Award,
  Star,
  BookOpen,
  Play,
  FileText,
  Mic,
  PenTool,
  Globe,
  QrCode
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import PermissionAuth from '@/components/common/PermissionAuth';
import StudentQRCode from '@/components/student/StudentQRCode';
import QRCodeScanner from '@/components/student/QRCodeScanner';
import { StudentIdentifierData } from '@/types/student';
import { generateUniqueIdentifier } from '@/utils/identifierUtils';
import QRCode from 'react-qr-code';
import { useTranslation, Language } from '@/lib/translations';

interface AuthenticatedUser {
  cardId: string;
  uid: string;
  cardType: 'student' | 'teacher' | 'staff' | 'visitor' | 'admin' | 'super_admin';
  assignedTo?: string;
  lastTaggingTime: Date;
  permissions: string[];
}

interface StudentStats {
  totalClasses: number;
  completedClasses: number;
  upcomingClasses: number;
  currentLevel: string;
  points: number;
  studyStreak: number;
  averageScore: number;
  remainingTime: {
    total: number; // 전체 남은 시간 (분)
    available: number; // 예약 가능한 남은 시간 (분)
  };
}

interface RecentReservation {
  id: string;
  date: string;
  time: string;
  teacher: string;
  subject: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface RecentNote {
  id: string;
  title: string;
  date: string;
  hasAudio: boolean;
  duration: string;
}

export default function StudentHomePage() {
  const { user, logout } = useAuth();
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  
  // 관리자 권한 체크
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER';
  
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // QR코드 관련 상태
  const [studentIdentifierData, setStudentIdentifierData] = useState<StudentIdentifierData | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedData, setScannedData] = useState<StudentIdentifierData | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  
  // 언어 설정
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('language') as Language) || 'ko';
    }
    return 'ko';
  });
  const t = useTranslation(currentLanguage);

  // 랜덤 학습 메시지 배열
  const studyMessages = [
    "오늘도 열심히 공부해 봐요! 💪",
    "작은 진전이 큰 성공의 시작이에요! 🌟",
    "꾸준함이 최고의 실력이 됩니다! 📚",
    "오늘 배운 것이 내일의 자신감이에요! ✨",
    "한 걸음씩 차근차근 나아가봐요! 🚀",
    "실수해도 괜찮아요, 그것도 학습의 일부예요! 💡",
    "오늘의 노력이 미래의 성공을 만들어요! 🎯",
    "포기하지 않는 마음이 가장 큰 힘이에요! 💪",
    "매일 조금씩, 하지만 꾸준히! 📖",
    "당신의 열정이 가장 아름다운 빛이에요! ⭐"
  ];

  // 랜덤 메시지 선택
  const randomStudyMessage = studyMessages[Math.floor(Math.random() * studyMessages.length)];

  // 언어 전환 함수
  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'ko' ? 'ja' : 'ko');
  };

  // QR코드 스캔 핸들러
  const handleQRScan = (data: StudentIdentifierData) => {
    setScannedData(data);
    setShowQRScanner(false);
    // 여기서 스캔된 데이터를 처리할 수 있습니다
    console.log('Scanned student data:', data);
  };

  const handleQRScanError = (error: string) => {
    console.error('QR scan error:', error);
    // 에러 처리 로직
  };

  // 다국어 텍스트
  const texts = {
    ko: {
      welcome: '안녕하세요',
      studyMessage: '오늘도 열심히 공부해봐요!',
      student: '학생',
      logout: '로그아웃',
      thisMonthClasses: '이번 달 수업',
      completed: '완료',
      upcoming: '예정',
      currentLevel: '현재 레벨',
      averageScore: '평균 점수',
      points: '포인트',
      studyStreak: '연속 학습',
      days: '일',
      recentReservations: '최근 예약',
      recentNotes: '최근 레슨 노트',
      viewNote: '레슨 노트 확인하기',
      noReservations: '예약 내역이 없습니다',
      noNotes: '레슨 노트가 없습니다',
      mainMenu: '메인으로 돌아가기',
      learningProgress: '학습 진행률',
      remainingClasses: '목표 달성까지',
      remaining: '남음',
      viewAll: '전체보기',
      quickActions: '빠른 액션',
      newReservation: '새 예약',
      viewReservations: '예약 보기',
      viewNotes: '레슨 노트',
      viewHomework: '숙제',
      studyTip: '오늘의 학습 팁',
      tipTitle: '효과적인 학습을 위한 팁',
      tipContent: '매일 30분씩 꾸준히 공부하는 것이 가장 효과적입니다. 짧은 시간이라도 매일 반복하면 큰 효과를 볼 수 있어요!',
      status: {
        upcoming: '예정',
        completed: '완료',
        cancelled: '취소'
      }
    },
    ja: {
      welcome: 'こんにちは',
      studyMessage: '今日も頑張って勉強しましょう！',
      student: '学生',
      logout: 'ログアウト',
      thisMonthClasses: '今月の授業',
      completed: '完了',
      upcoming: '予定',
      currentLevel: '現在のレベル',
      averageScore: '平均点',
      points: 'ポイント',
      studyStreak: '連続学習',
      days: '日',
      recentReservations: '最近の予約',
      recentNotes: '最近のレッスンノート',
      viewNote: 'レッスンノートを確認',
      noReservations: '予約履歴がありません',
      noNotes: 'レッスンノートがありません',
      mainMenu: 'メインに戻る',
      learningProgress: '学習進捗率',
      remainingClasses: '目標達成まで',
      remaining: '残り',
      viewAll: 'すべて見る',
      quickActions: 'クイックアクション',
      newReservation: '新規予約',
      viewReservations: '予約を見る',
      viewNotes: 'レッスンノート',
      viewHomework: '宿題',
      studyTip: '今日の学習のヒント',
      tipTitle: '効果的な学習のためのヒント',
      tipContent: '毎日30分ずつコツコツと勉強することが最も効果的です。短い時間でも毎日繰り返すことで大きな効果を得ることができます！',
      status: {
        upcoming: '予定',
        completed: '完了',
        cancelled: 'キャンセル'
      }
    }
  };

  const localTexts = texts[currentLanguage];

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

  // 레슨노트 상세 보기
  const handleViewNote = (noteId: string) => {
    // 실제로는 레슨노트 상세 페이지로 이동하거나 모달을 열어야 함
    const note = recentNotes.find(n => n.id === noteId);
    if (note) {
      alert(`${note.title}\n\n날짜: ${note.date}\n소요시간: ${note.duration}\n${note.hasAudio ? '음성 파일 포함' : '음성 파일 없음'}\n\n상세 내용:\n• 문법: 현재완료 시제 복습\n• 어휘: 비즈니스 관련 단어 20개\n• 회화: 면접 상황 대화 연습\n• 숙제: 다음 수업까지 문법 문제 10개 풀기`);
    }
  };

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      const mockStats = {
        totalClasses: 12,
        completedClasses: 8,
        upcomingClasses: 4,
        currentLevel: '중급 B',
        points: 1250,
        studyStreak: 7,
        averageScore: 85,
        remainingTime: {
          total: 120, // 예시: 2시간 (120분)
          available: 60 // 예시: 1시간 (60분)
        }
      };

      setStats(mockStats);

      // QR코드 데이터 생성
      const identifierData: StudentIdentifierData = {
        studentId: user?.id || 'student-001',
        identifierCode: generateUniqueIdentifier(),
        studentName: user?.name || '홍길동',
        studentEmail: user?.email || 'student@example.com',
        department: user?.department || '영어학과',
        currentLevel: mockStats.currentLevel,
        points: mockStats.points,
        totalClasses: mockStats.totalClasses,
        completedClasses: mockStats.completedClasses,
        studyStreak: mockStats.studyStreak,
        averageScore: mockStats.averageScore,
        lastPaymentDate: new Date('2024-01-10'),
        lastPaymentAmount: 50000,
        createdAt: new Date(),
        version: '1.0'
      };

      setStudentIdentifierData(identifierData);

      setRecentReservations([
        {
          id: '1',
          date: '2024-01-15',
          time: '14:00',
          teacher: '김선생님',
          subject: '영어 회화',
          status: 'upcoming'
        },
        {
          id: '2',
          date: '2024-01-12',
          time: '16:00',
          teacher: '이선생님',
          subject: '문법',
          status: 'completed'
        }
      ]);

      setRecentNotes([
        {
          id: '1',
          title: '영어 회화 - 일상 대화',
          date: '2024-01-12',
          hasAudio: true,
          duration: '15:30'
        },
        {
          id: '2',
          title: '문법 - 현재완료',
          date: '2024-01-10',
          hasAudio: false,
          duration: '12:45'
        }
      ]);

      setLoading(false);
    }, 1000);
  }, [user]);

  // 권한 인증 모달 표시
  if (showAuthModal) {
    return (
      <PermissionAuth
        requiredPermissions={['student:*']}
        onAuthSuccess={handleAuthSuccess}
        onAuthFail={handleAuthFail}
        portalType="student"
      />
    );
  }

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
            학생 대시보드에 접근하려면 로그인이 필요합니다.
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

  // 학생 권한 확인 (관리자 제외)
  if (user.role !== 'STUDENT' && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600 mb-6">
            학생 대시보드에 접근할 권한이 없습니다.
            <br />
            현재 권한: {user.role === 'ADMIN' ? '관리자' : user.role === 'TEACHER' ? '강사' : user.role === 'STAFF' ? '직원' : user.role}
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
    <div className="max-w-7xl mx-auto p-4">
      {/* 관리자 네비게이션 */}
      {isAdmin && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">관리자 모드</h3>
                <p className="text-sm text-purple-700">다른 역할의 페이지로 이동할 수 있습니다</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/home"
                className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                관리자
              </Link>
              <Link
                href="/teacher/home"
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                선생님
              </Link>
              <Link
                href="/staff/home"
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                직원
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 환영 메시지 */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {t.welcome}, {user.name}님! 👋
            </h1>
            <p className="text-base lg:text-lg text-gray-600">
              {randomStudyMessage}
            </p>
          </div>
        </div>
      </div>

      {/* 주요 액션 버튼들 */}
      <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">주요 메뉴</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/student/reservations/new"
            className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 text-center">{t.newReservation}</span>
          </Link>
          
          <Link
            href="/student/reservations"
            className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Clock className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 text-center">{t.viewReservations}</span>
          </Link>
          
          <Link
            href="/student/notes"
            className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <BookOpen className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 text-center">{t.viewNotes}</span>
          </Link>

          <Link
            href="/student/profile"
            className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <User className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 text-center">마이페이지</span>
          </Link>
        </div>
      </div>

      {/* QR코드 표시 버튼 */}
      <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">QR코드</h2>
        <div className="flex justify-center">
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-3 px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <QrCode className="w-6 h-6" />
            <span className="font-medium">QR코드 표시</span>
          </button>
        </div>
      </div>

      {/* 학습 팁 */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.studyTip}</h3>
            <p className="text-gray-700 leading-relaxed">
              {t.tipContent}
            </p>
          </div>
        </div>
      </div>

      {/* 결제 알림 */}
      {(stats?.remainingTime.total <= 180 || stats?.remainingTime.available <= 180) && (
        <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">수업 시간 부족</h3>
              <p className="text-sm text-red-700">
                남은 수업 시간이 부족합니다. 추가 수업을 위해 결제를 진행해주세요.
              </p>
            </div>
            <Link
              href="/student/payment"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              결제하기
            </Link>
          </div>
        </div>
      )}

      {/* 남은 시간 정보 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          남은 수업 시간
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {Math.floor(stats?.remainingTime.total / 60)}시간 {stats?.remainingTime.total % 60}분
            </div>
            <div className="text-sm text-blue-700 font-medium">전체 남은 시간</div>
            <div className="text-xs text-blue-600 mt-1">
              총 {stats?.remainingTime.total}분
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {Math.floor(stats?.remainingTime.available / 60)}시간 {stats?.remainingTime.available % 60}분
            </div>
            <div className="text-sm text-green-700 font-medium">예약 가능한 시간</div>
            <div className="text-xs text-green-600 mt-1">
              예약 가능 {stats?.remainingTime.available}분
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">사용 불가능한 시간:</span>
            <span className="font-medium text-gray-900">
              {Math.floor((stats?.remainingTime.total - stats?.remainingTime.available) / 60)}시간 
              {(stats?.remainingTime.total - stats?.remainingTime.available) % 60}분
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            (이미 예약된 수업이나 시스템 점검 시간 등)
          </p>
        </div>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* 현재 레벨 */}
        <Link href="/student/level" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">{t.currentLevel}</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.currentLevel}</div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {t.averageScore} {stats?.averageScore}%
          </div>
        </Link>

        {/* 학습 진행률 */}
        <Link href="/student/progress" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">{t.learningProgress}</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.completedClasses}/{stats?.totalClasses}</div>
            </div>
            <Award className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {Math.round((stats?.completedClasses || 0) / (stats?.totalClasses || 1) * 100)}% {t.completed}
          </div>
        </Link>

        {/* 포인트 */}
        <Link href="/student/points" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">{t.points}</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.points}P</div>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {t.studyStreak} {stats?.studyStreak}{t.days}
          </div>
        </Link>

        {/* 1. 이번달 수업 */}
        <Link href="/student/classes" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">{t.thisMonthClasses}</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalClasses}회</div>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {t.completed} {stats?.completedClasses}회 / {t.upcoming} {stats?.upcomingClasses}회
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* 최근 레슨노트 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">{t.recentNotes}</div>
              <div className="text-2xl font-bold text-gray-900">{recentNotes.length}개</div>
            </div>
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {recentNotes.length > 0 ? (
              <div className="space-y-1">
                {recentNotes.slice(0, 2).map((note) => (
                  <div key={note.id} className="flex items-center justify-between">
                    <span className="truncate">{note.title}</span>
                    <span className="text-xs text-gray-400 ml-2">{note.date}</span>
                  </div>
                ))}
                {recentNotes.length > 2 && (
                  <div className="text-blue-600 text-xs">
                    +{recentNotes.length - 2}개 더보기
                  </div>
                )}
              </div>
            ) : (
              <span>{t.noNotes}</span>
            )}
          </div>
          <div className="mt-4">
            <Link
              href="/student/notes"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t.viewAll} →
            </Link>
          </div>
        </div>

        {/* 최근 예약 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">{t.recentReservations}</div>
              <div className="text-2xl font-bold text-gray-900">{recentReservations.length}개</div>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {recentReservations.length > 0 ? (
              <div className="space-y-1">
                {recentReservations.slice(0, 2).map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        reservation.status === 'upcoming' ? 'bg-blue-500' :
                        reservation.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="truncate">{reservation.subject}</span>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">{reservation.date}</span>
                  </div>
                ))}
                {recentReservations.length > 2 && (
                  <div className="text-blue-600 text-xs">
                    +{recentReservations.length - 2}개 더보기
                  </div>
                )}
              </div>
            ) : (
              <span>{t.noReservations}</span>
            )}
          </div>
          <div className="mt-4">
            <Link
              href="/student/reservations"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t.viewAll} →
            </Link>
          </div>
        </div>
      </div>



      {/* QR코드 스캐너 모달 */}
      {showQRScanner && (
        <QRCodeScanner
          onScan={handleQRScan}
          onError={handleQRScanError}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* QR코드 표시 모달 */}
      {showQRModal && studentIdentifierData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">QR코드</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <QRCode
                  value={JSON.stringify({
                    studentId: studentIdentifierData.studentId,
                    studentName: studentIdentifierData.studentName,
                    department: studentIdentifierData.department,
                    currentLevel: studentIdentifierData.currentLevel,
                    points: studentIdentifierData.points,
                    completedClasses: studentIdentifierData.completedClasses,
                    timestamp: new Date().toISOString()
                  })}
                  size={200}
                  level="M"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {studentIdentifierData.studentName}
                </div>
                <div className="text-sm text-gray-600">
                  {studentIdentifierData.department}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 스캔된 데이터 표시 모달 */}
      {scannedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">스캔된 학생 정보</h3>
              <button
                onClick={() => setScannedData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700">학생 이름</div>
                <div className="text-lg text-gray-900">{scannedData.studentName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">이메일</div>
                <div className="text-lg text-gray-900">{scannedData.studentEmail}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">학과</div>
                <div className="text-lg text-gray-900">{scannedData.department}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">현재 레벨</div>
                <div className="text-lg text-gray-900">{scannedData.currentLevel}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">포인트</div>
                <div className="text-lg text-gray-900">{scannedData.points}P</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">완료 수업</div>
                <div className="text-lg text-gray-900">{scannedData.completedClasses}회</div>
              </div>
              {scannedData.lastPaymentDate && (
                <div>
                  <div className="text-sm font-medium text-gray-700">최근 결제일</div>
                  <div className="text-lg text-gray-900">
                    {new Date(scannedData.lastPaymentDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setScannedData(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 