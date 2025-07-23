'use client';

import { BookOpen, Calendar, CheckCircle, TrendingUp, Star, Download, Share2, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
interface LearningStats {
  totalWords: number;
  wordCategories: {
    noun: number;
    verb: number;
    adjective: number;
    other: number;
  };
  totalLessons: number;
  totalHomework: number;
  completedHomework: number;
  averageRating: number;
  studyStreak: number;
  currentLevel: string;
  progressToNextLevel: number;
}

interface MonthlyProgress {
  month: string;
  lessons: number;
  homework: number;
  words: number;
  rating: number;
}

interface SkillAnalysis {
  grammar: number;
  vocabulary: number;
  pronunciation: number;
  conversation: number;
  writing: number;
  reading: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedDate?: string;
  progress: number;
  maxProgress: number;
}

export default function StudentLearningStatsPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [monthlyProgress, setMonthlyProgress] = useState<MonthlyProgress[]>([]);
  const [skillAnalysis, setSkillAnalysis] = useState<SkillAnalysis | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'skills' | 'achievements'>('overview');
  const [timeFilter, setTimeFilter] = useState<'3months' | '6months' | '1year'>('6months');

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      const mockStats: LearningStats = {
        totalWords: 245,
        wordCategories: {
          noun: 120,
          verb: 85,
          adjective: 30,
          other: 10
        },
        totalLessons: 32,
        totalHomework: 28,
        completedHomework: 25,
        averageRating: 4.2,
        studyStreak: 7,
        currentLevel: 'A-2',
        progressToNextLevel: 65
      };

      const mockMonthlyProgress: MonthlyProgress[] = [
        { month: '7월', lessons: 8, homework: 7, words: 45, rating: 4.1 },
        { month: '8월', lessons: 10, homework: 9, words: 52, rating: 4.3 },
        { month: '9월', lessons: 9, homework: 8, words: 48, rating: 4.0 },
        { month: '10월', lessons: 11, homework: 10, words: 55, rating: 4.4 },
        { month: '11월', lessons: 12, homework: 11, words: 58, rating: 4.2 },
        { month: '12월', lessons: 10, homework: 9, words: 50, rating: 4.3 }
      ];

      const mockSkillAnalysis: SkillAnalysis = {
        grammar: 75,
        vocabulary: 85,
        pronunciation: 70,
        conversation: 80,
        writing: 65,
        reading: 90
      };

      const mockAchievements: Achievement[] = [
        {
          id: '1',
          title: '첫 수업 완료',
          description: '첫 번째 수업을 완료했습니다',
          icon: '🎉',
          isUnlocked: true,
          unlockedDate: '2024-07-01',
          progress: 1,
          maxProgress: 1
        },
        {
          id: '2',
          title: '단어 마스터',
          description: '100개의 단어를 학습했습니다',
          icon: '📚',
          isUnlocked: true,
          unlockedDate: '2024-09-15',
          progress: 245,
          maxProgress: 100
        },
        {
          id: '3',
          title: '연속 학습',
          description: '7일 연속으로 학습했습니다',
          icon: '🔥',
          isUnlocked: true,
          unlockedDate: '2024-12-01',
          progress: 7,
          maxProgress: 7
        },
        {
          id: '4',
          title: '레벨 업',
          description: 'A-2 레벨에 도달했습니다',
          icon: '⭐',
          isUnlocked: true,
          unlockedDate: '2024-11-20',
          progress: 1,
          maxProgress: 1
        },
        {
          id: '5',
          title: '숙제 완벽주의',
          description: '모든 숙제를 완료했습니다',
          icon: '✅',
          isUnlocked: false,
          progress: 25,
          maxProgress: 30
        },
        {
          id: '6',
          title: '고급 학습자',
          description: 'B-1 레벨에 도달했습니다',
          icon: '🏆',
          isUnlocked: false,
          progress: 65,
          maxProgress: 100
        }
      ];

      setStats(mockStats);
      setMonthlyProgress(mockMonthlyProgress);
      setSkillAnalysis(mockSkillAnalysis);
      setAchievements(mockAchievements);
      setLoading(false);
    }, 1000);
  }, []);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSkillColor = (skill: number) => {
    if (skill >= 80) return 'bg-green-500';
    if (skill >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">학습 통계</h1>
        <p className="text-lg text-gray-600">
          학습 진행 상황과 성취도를 확인하세요
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-lg mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              전체 개요
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'progress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              학습 진도
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'skills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              스킬 분석
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'achievements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              성취도
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              {/* 주요 통계 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-600">총 학습 단어</div>
                      <div className="text-2xl font-bold text-blue-900">{stats.totalWords}</div>
                    </div>
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="mt-2 text-sm text-blue-700">
                    이번 달 +{stats.wordCategories.noun + stats.wordCategories.verb}개
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-green-600">총 수업</div>
                      <div className="text-2xl font-bold text-green-900">{stats.totalLessons}</div>
                    </div>
                    <Calendar className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="mt-2 text-sm text-green-700">
                    평균 별점 {stats.averageRating}점
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-600">숙제 완료율</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {Math.round((stats.completedHomework / stats.totalHomework) * 100)}%
                      </div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="mt-2 text-sm text-purple-700">
                    {stats.completedHomework}/{stats.totalHomework}개 완료
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-orange-600">연속 학습</div>
                      <div className="text-2xl font-bold text-orange-900">{stats.studyStreak}일</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="mt-2 text-sm text-orange-700">
                    현재 레벨: {stats.currentLevel}
                  </div>
                </div>
              </div>

              {/* 단어 카테고리 분포 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">단어 카테고리 분포</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(stats.wordCategories).map(([category, count]) => (
                    <div key={category} className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{count}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {category === 'noun' ? '명사' :
                         category === 'verb' ? '동사' :
                         category === 'adjective' ? '형용사' : '기타'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round((count / stats.totalWords) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 레벨 진행도 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">레벨 진행도</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">현재 레벨: {stats.currentLevel}</span>
                  <span className="text-sm font-medium text-gray-900">{stats.progressToNextLevel}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${stats.progressToNextLevel}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  다음 레벨까지 {100 - stats.progressToNextLevel}% 남음
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              {/* 시간 필터 */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">월별 학습 진도</h3>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as '3months' | '6months' | '1year')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="3months">최근 3개월</option>
                  <option value="6months">최근 6개월</option>
                  <option value="1year">최근 1년</option>
                </select>
              </div>

              {/* 월별 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {monthlyProgress.map((month, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">{month.month}</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">수업</span>
                        <span className="font-medium">{month.lessons}회</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">숙제</span>
                        <span className="font-medium">{month.homework}개</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">학습 단어</span>
                        <span className="font-medium">{month.words}개</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">평균 별점</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{month.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'skills' && skillAnalysis && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">스킬 분석</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(skillAnalysis).map(([skill, score]) => (
                  <div key={skill} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {skill === 'grammar' ? '문법' :
                         skill === 'vocabulary' ? '어휘' :
                         skill === 'pronunciation' ? '발음' :
                         skill === 'conversation' ? '회화' :
                         skill === 'writing' ? '작문' : '독해'}
                      </h4>
                      <span className={`text-lg font-bold ${getProgressColor(score)}`}>
                        {score}점
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getSkillColor(score)}`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {score >= 80 ? '매우 우수' :
                       score >= 60 ? '양호' : '개선 필요'}
                    </div>
                  </div>
                ))}
              </div>

              {/* 레이더 차트 설명 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">스킬 분석 가이드</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• 80점 이상: 매우 우수한 수준</p>
                  <p>• 60-79점: 양호한 수준</p>
                  <p>• 60점 미만: 추가 학습이 필요한 영역</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">성취도</h3>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="w-4 h-4" />
                    내보내기
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                    공유
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`border rounded-lg p-6 transition-all duration-300 ${
                      achievement.isUnlocked
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{achievement.icon}</div>
                      {achievement.isUnlocked && (
                        <Award className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-2">{achievement.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    
                    {achievement.isUnlocked ? (
                      <div className="text-sm text-green-600">
                        {achievement.unlockedDate && (
                          <div>획득일: {new Date(achievement.unlockedDate).toLocaleDateString('ko-KR')}</div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>진행도</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 