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
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import PermissionAuth from '@/components/common/PermissionAuth';

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
  
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 언어 설정
  const [currentLanguage, setCurrentLanguage] = useState<'ko' | 'ja'>('ko');

  // 언어 전환 함수
  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'ko' ? 'ja' : 'ko');
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

  const t = texts[currentLanguage];

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
      setStats({
        totalClasses: 12,
        completedClasses: 8,
        upcomingClasses: 4,
        currentLevel: '중급 B',
        points: 1250,
        studyStreak: 7,
        averageScore: 85
      });

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
  }, []);

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

  // 학생 권한 확인
  if (user.role !== 'student') {
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
            현재 권한: {user.role === 'admin' ? '관리자' : user.role === 'teacher' ? '강사' : user.role === 'staff' ? '직원' : user.role}
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
              {t.welcome}, {user.name}님! 👋
            </h1>
            <p className="text-lg text-gray-600">
              {t.studyMessage}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* 현재 사용자 정보 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900">
                    {user.name} ({t.student})
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
              {t.logout}
            </button>
            
            {/* 언어 전환 버튼 */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={currentLanguage === 'ko' ? '日本語に切り替え' : '한국어로 전환'}
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium">
                {currentLanguage === 'ko' ? '🇯🇵' : '🇰🇷'}
              </span>
            </button>
            
            <Link href="/">
              <div className="p-3 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.quickActions}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/student/reservations/new"
            className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">{t.newReservation}</span>
          </Link>
          
          <Link
            href="/student/reservations"
            className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Clock className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">{t.viewReservations}</span>
          </Link>
          
          <Link
            href="/student/notes"
            className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <BookOpen className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">{t.viewNotes}</span>
          </Link>
          
          <Link
            href="/student/homework"
            className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <FileText className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">{t.viewHomework}</span>
          </Link>
        </div>
      </div>

      {/* 학습 팁 */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.studyTip}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">{t.tipTitle}</h3>
              <p className="text-sm text-gray-600">
                {t.tipContent}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">음성 녹음 활용</h3>
              <p className="text-sm text-gray-600">
                자신의 발음을 녹음해서 들어보면 개선점을 쉽게 발견할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
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
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">{t.currentLevel}</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.currentLevel}</div>
            </div>
            <Award className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {t.averageScore} {stats?.averageScore}점
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
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
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">{t.learningProgress}</div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round((stats?.completedClasses || 0) / (stats?.totalClasses || 1) * 100)}%
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {t.remainingClasses} {stats?.upcomingClasses}회 {t.remaining}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 최근 예약 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t.recentReservations}</h2>
            <Link
              href="/student/reservations"
              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              {t.viewAll}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {recentReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t.noReservations}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      reservation.status === 'upcoming' ? 'bg-blue-500' :
                      reservation.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">
                        {reservation.subject}
                      </div>
                      <div className="text-sm text-gray-600">
                        {reservation.date} {reservation.time} • {reservation.teacher}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      reservation.status === 'upcoming' ? 'text-blue-600' :
                      reservation.status === 'completed' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.status[reservation.status]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Link
              href="/student/reservations/new"
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.newReservation}
            </Link>
          </div>
        </div>

        {/* 최근 레슨노트 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t.recentNotes}</h2>
            <Link
              href="/student/notes"
              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              {t.viewAll}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t.noNotes}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{note.title}</div>
                      <div className="text-sm text-gray-600">
                        {note.date} • {note.duration}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {note.hasAudio && (
                      <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleViewNote(note.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t.viewNote}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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