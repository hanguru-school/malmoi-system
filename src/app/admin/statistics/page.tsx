'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp,
  Activity,
  Star,
  CheckCircle
} from 'lucide-react';

interface StatisticsData {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalRevenue: number;
    activeLessons: number;
    monthlyGrowth: number;
    attendanceRate: number;
  };
  trends: {
    studentGrowth: { month: string; count: number }[];
    revenueGrowth: { month: string; amount: number }[];
    lessonCompletion: { month: string; rate: number }[];
  };
  demographics: {
    ageGroups: { group: string; count: number }[];
    levels: { level: string; count: number }[];
    subjects: { subject: string; count: number }[];
  };
  performance: {
    teacherRatings: { teacher: string; rating: number; students: number }[];
    topStudents: { student: string; attendance: number; progress: number }[];
    popularCourses: { course: string; enrollment: number; rating: number }[];
  };
}

export default function AdminStatisticsPage() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      const mockStats: StatisticsData = {
        overview: {
          totalStudents: 156,
          totalTeachers: 12,
          totalRevenue: 45000000,
          activeLessons: 8,
          monthlyGrowth: 12.5,
          attendanceRate: 94.2
        },
        trends: {
          studentGrowth: [
            { month: '10월', count: 120 },
            { month: '11월', count: 135 },
            { month: '12월', count: 145 },
            { month: '1월', count: 156 }
          ],
          revenueGrowth: [
            { month: '10월', amount: 38000000 },
            { month: '11월', amount: 41000000 },
            { month: '12월', amount: 43000000 },
            { month: '1월', amount: 45000000 }
          ],
          lessonCompletion: [
            { month: '10월', rate: 88 },
            { month: '11월', rate: 91 },
            { month: '12월', rate: 89 },
            { month: '1월', rate: 94 }
          ]
        },
        demographics: {
          ageGroups: [
            { group: '10-15세', count: 45 },
            { group: '16-20세', count: 38 },
            { group: '21-25세', count: 32 },
            { group: '26-30세', count: 28 },
            { group: '31세+', count: 13 }
          ],
          levels: [
            { level: 'A-1 (기초)', count: 52 },
            { level: 'A-2 (초급)', count: 45 },
            { level: 'B-1 (중급)', count: 38 },
            { level: 'B-2 (고급)', count: 21 }
          ],
          subjects: [
            { subject: '한국어 회화', count: 68 },
            { subject: '한국어 문법', count: 45 },
            { subject: '한국어 작문', count: 32 },
            { subject: '한국어 듣기', count: 11 }
          ]
        },
        performance: {
          teacherRatings: [
            { teacher: '김선생님', rating: 4.8, students: 25 },
            { teacher: '이선생님', rating: 4.6, students: 22 },
            { teacher: '박선생님', rating: 4.7, students: 20 },
            { teacher: '최선생님', rating: 4.5, students: 18 }
          ],
          topStudents: [
            { student: '김학생', attendance: 98, progress: 95 },
            { student: '이학생', attendance: 96, progress: 92 },
            { student: '박학생', attendance: 94, progress: 88 },
            { student: '최학생', attendance: 92, progress: 85 }
          ],
          popularCourses: [
            { course: '한국어 기초 과정', enrollment: 45, rating: 4.6 },
            { course: '한국어 초급 과정', enrollment: 38, rating: 4.5 },
            { course: '한국어 중급 과정', enrollment: 32, rating: 4.7 },
            { course: '한국어 고급 과정', enrollment: 18, rating: 4.8 }
          ]
        }
      };

      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">통계 및 분석</h1>
          <p className="text-lg text-gray-600">학원 운영 통계를 확인하세요</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">주간</option>
          <option value="month">월간</option>
          <option value="quarter">분기</option>
          <option value="year">연간</option>
        </select>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 학생 수</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.overview.totalStudents)}명</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+{stats.overview.monthlyGrowth}%</span>
            <span className="text-gray-500 ml-1">이번 달</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 강사 수</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.overview.totalTeachers)}명</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">활성</span>
            <span className="text-gray-500 ml-1">모든 강사</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 수익</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.overview.totalRevenue)}원</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+8.2%</span>
            <span className="text-gray-500 ml-1">이번 달</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 출석률</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.attendanceRate}%</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+2.1%</span>
            <span className="text-gray-500 ml-1">이번 달</span>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 학생 성장 추이 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">학생 성장 추이</h3>
          <div className="space-y-3">
            {stats.trends.studentGrowth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(item.count / 200) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}명</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 수익 성장 추이 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">수익 성장 추이</h3>
          <div className="space-y-3">
            {stats.trends.revenueGrowth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(item.amount / 50000000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}원</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 상세 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 인구 통계 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">연령대별 분포</h3>
          <div className="space-y-3">
            {stats.demographics.ageGroups.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.group}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(item.count / 60) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}명</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 레벨별 분포 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">레벨별 분포</h3>
          <div className="space-y-3">
            {stats.demographics.levels.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.level}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(item.count / 60) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}명</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 과목별 분포 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">과목별 분포</h3>
          <div className="space-y-3">
            {stats.demographics.subjects.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.subject}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(item.count / 80) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}명</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 성과 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 강사 평가 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">강사 평가</h3>
          <div className="space-y-4">
            {stats.performance.teacherRatings.map((teacher, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{teacher.teacher}</p>
                  <p className="text-sm text-gray-600">{teacher.students}명의 학생</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(teacher.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{teacher.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 인기 코스 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">인기 코스</h3>
          <div className="space-y-4">
            {stats.performance.popularCourses.map((course, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{course.course}</p>
                  <p className="text-sm text-gray-600">{course.enrollment}명 수강</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(course.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{course.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 