'use client';

import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Edit, 
  Save, 
  X, 
  Camera, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Shield, 
  Bell, 
  Settings, 
  PenTool,
  Award,
  Star,
  Clock,
  TrendingUp,
  BookOpen,
  FileText,
  Mic,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: string;
  points: number;
  totalClasses: number;
  completedClasses: number;
  remainingHours: number;
  joinDate: string;
  lastLogin: string;
  avatar?: string;
}

interface ClassHistory {
  id: string;
  date: string;
  teacher: string;
  subject: string;
  duration: number;
  score?: number;
  notes?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  progress?: number;
  maxProgress?: number;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [classHistory, setClassHistory] = useState<ClassHistory[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'achievements' | 'settings'>('overview');

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      setProfile({
        id: '1',
        name: '김학생',
        email: 'student@example.com',
        phone: '010-1234-5678',
        level: '중급 B',
        points: 1250,
        totalClasses: 24,
        completedClasses: 20,
        remainingHours: 8,
        joinDate: '2023-03-15',
        lastLogin: '2024-01-14'
      });

      setClassHistory([
        {
          id: '1',
          date: '2024-01-12',
          teacher: '김선생님',
          subject: '영어 회화',
          duration: 60,
          score: 85,
          notes: '일상 대화 연습, 발음 개선 필요'
        },
        {
          id: '2',
          date: '2024-01-10',
          teacher: '이선생님',
          subject: '문법',
          duration: 60,
          score: 92,
          notes: '현재완료 시제 완벽 이해'
        },
        {
          id: '3',
          date: '2024-01-08',
          teacher: '박선생님',
          subject: '리스닝',
          duration: 45,
          score: 78,
          notes: '속도 조절 필요'
        }
      ]);

      setAchievements([
        {
          id: '1',
          title: '첫 수업 완료',
          description: '첫 번째 수업을 완료했습니다',
          icon: '🎉',
          earnedAt: '2023-03-20'
        },
        {
          id: '2',
          title: '연속 학습',
          description: '7일 연속으로 학습했습니다',
          icon: '🔥',
          earnedAt: '2024-01-14',
          progress: 7,
          maxProgress: 30
        },
        {
          id: '3',
          title: '포인트 수집가',
          description: '1000포인트를 모았습니다',
          icon: '⭐',
          earnedAt: '2024-01-10'
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">프로필을 찾을 수 없습니다</h3>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">마이페이지</h1>
        <p className="text-lg text-gray-600">
          학습 현황과 개인 정보를 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 프로필 카드 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
            {/* 프로필 정보 */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>

            {/* 레벨 및 포인트 */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">현재 레벨</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{profile.level}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">보유 포인트</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{profile.points}P</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">남은 시간</span>
                </div>
                <span className="text-lg font-bold text-green-600">{profile.remainingHours}시간</span>
              </div>
            </div>

            {/* 통계 */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">학습 통계</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">총 수업</span>
                  <span className="text-sm font-medium text-gray-900">{profile.totalClasses}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료 수업</span>
                  <span className="text-sm font-medium text-gray-900">{profile.completedClasses}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료율</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round((profile.completedClasses / profile.totalClasses) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="space-y-2">
              <Link href="/student/settings/profile" className="block">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Edit className="w-4 h-4" />
                  프로필 수정
                </button>
              </Link>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Settings className="w-4 h-4" />
                설정
              </button>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2">
          {/* 탭 네비게이션 */}
          <div className="bg-white rounded-xl shadow-lg mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', name: '개요', icon: TrendingUp },
                  { id: 'history', name: '수업 이력', icon: Calendar },
                  { id: 'achievements', name: '성취', icon: Award },
                  { id: 'settings', name: '설정', icon: Settings }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* 개요 탭 */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 학습 진행도 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">학습 진행도</h3>
                    <div className="bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(profile.completedClasses / profile.totalClasses) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>완료: {profile.completedClasses}회</span>
                      <span>목표: {profile.totalClasses}회</span>
                    </div>
                  </div>

                  {/* 최근 활동 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">레슨노트 열람</div>
                          <div className="text-xs text-gray-600">2시간 전</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">숙제 제출</div>
                          <div className="text-xs text-gray-600">1일 전</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mic className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">듣기 연습</div>
                          <div className="text-xs text-gray-600">2일 전</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 빠른 링크 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 링크</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/student/reservations"
                        className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">예약 관리</span>
                      </Link>
                      <Link
                        href="/student/notes"
                        className="flex items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">레슨노트</span>
                      </Link>
                      <Link
                        href="/student/homework"
                        className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">숙제</span>
                      </Link>
                      <Link
                        href="/student/vocabulary"
                        className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <PenTool className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">단어 복습</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* 수업 이력 탭 */}
              {activeTab === 'history' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">수업 이력</h3>
                    <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                      <Download className="w-4 h-4" />
                      내보내기
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {classHistory.map((classItem) => (
                      <div key={classItem.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{classItem.subject}</h4>
                          {classItem.score && (
                            <span className="text-sm font-medium text-green-600">{classItem.score}점</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>{classItem.teacher}</span>
                          <span>{new Date(classItem.date).toLocaleDateString('ko-KR')}</span>
                          <span>{classItem.duration}분</span>
                        </div>
                        {classItem.notes && (
                          <p className="text-sm text-gray-600">{classItem.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 성취 탭 */}
              {activeTab === 'achievements' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">성취</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{new Date(achievement.earnedAt).toLocaleDateString('ko-KR')}</span>
                          {achievement.progress && achievement.maxProgress && (
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          )}
                        </div>
                        {achievement.progress && achievement.maxProgress && (
                          <div className="mt-2 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 설정 탭 */}
              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">설정</h3>
                  <div className="space-y-4">
                    <Link href="/student/settings/notifications" className="block">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <h4 className="font-medium text-gray-900">알림 설정</h4>
                          <p className="text-sm text-gray-600">수업 알림 및 리마인더 설정</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                    
                    <Link href="/student/settings/line" className="block">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <h4 className="font-medium text-gray-900">LINE 연동</h4>
                          <p className="text-sm text-gray-600">LINE 알림 연동 설정</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                    
                    <Link href="/student/settings/profile" className="block">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <h4 className="font-medium text-gray-900">개인정보</h4>
                          <p className="text-sm text-gray-600">개인정보 수정 및 관리</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                    
                    <Link href="/student/settings/security" className="block">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <h4 className="font-medium text-gray-900">계정 보안</h4>
                          <p className="text-sm text-gray-600">비밀번호 변경 및 보안 설정</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                    
                    <Link href="/student/settings/language" className="block">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <h4 className="font-medium text-gray-900">언어 설정</h4>
                          <p className="text-sm text-gray-600">한국어/일본어 언어 선택</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 