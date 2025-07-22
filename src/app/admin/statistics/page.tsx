'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Star, 
  Clock, 
  BookOpen, 
  MessageSquare,
  Download,
  Filter,
  Calendar as CalendarIcon,
  User,
  Target,
  Award
} from 'lucide-react';

interface StatisticsData {
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
  };
  reservations: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    completionRate: number;
  };
  reviews: {
    total: number;
    averageRating: number;
    responseRate: number;
    googleReviews: number;
  };
  students: {
    total: number;
    active: number;
    newThisMonth: number;
    averageLessons: number;
  };
  teachers: {
    total: number;
    active: number;
    averageRating: number;
    totalLessons: number;
  };
  monthlyData: {
    month: string;
    attendance: number;
    reservations: number;
    reviews: number;
    revenue: number;
  }[];
  topStudents: {
    id: string;
    name: string;
    level: string;
    lessonsCompleted: number;
    averageRating: number;
  }[];
  topTeachers: {
    id: string;
    name: string;
    lessonsTaught: number;
    averageRating: number;
    responseRate: number;
  }[];
  serviceStats: {
    service: string;
    bookings: number;
    revenue: number;
    averageRating: number;
  }[];
}

export default function StatisticsPage() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTeacher, setSelectedTeacher] = useState('all');

  useEffect(() => {
    initializeMockData();
  }, []);

  const initializeMockData = () => {
    const mockData: StatisticsData = {
      attendance: {
        total: 1250,
        present: 1180,
        absent: 45,
        late: 25,
        rate: 94.4
      },
      reservations: {
        total: 1300,
        completed: 1180,
        cancelled: 75,
        noShow: 45,
        completionRate: 90.8
      },
      reviews: {
        total: 890,
        averageRating: 4.6,
        responseRate: 85.2,
        googleReviews: 156
      },
      students: {
        total: 85,
        active: 72,
        newThisMonth: 12,
        averageLessons: 14.7
      },
      teachers: {
        total: 8,
        active: 7,
        averageRating: 4.7,
        totalLessons: 1180
      },
      monthlyData: [
        { month: '1월', attendance: 95, reservations: 120, reviews: 85, revenue: 8500000 },
        { month: '2월', attendance: 92, reservations: 115, reviews: 78, revenue: 8200000 },
        { month: '3월', attendance: 88, reservations: 110, reviews: 72, revenue: 7800000 },
        { month: '4월', attendance: 94, reservations: 125, reviews: 88, revenue: 8800000 },
        { month: '5월', attendance: 96, reservations: 130, reviews: 92, revenue: 9200000 },
        { month: '6월', attendance: 98, reservations: 135, reviews: 95, revenue: 9500000 }
      ],
      topStudents: [
        { id: '1', name: '김학생', level: 'B', lessonsCompleted: 45, averageRating: 4.8 },
        { id: '2', name: '이학생', level: 'A', lessonsCompleted: 42, averageRating: 4.7 },
        { id: '3', name: '박학생', level: 'C', lessonsCompleted: 38, averageRating: 4.6 },
        { id: '4', name: '최학생', level: 'B', lessonsCompleted: 35, averageRating: 4.5 },
        { id: '5', name: '정학생', level: 'A', lessonsCompleted: 32, averageRating: 4.4 }
      ],
      topTeachers: [
        { id: '1', name: '박선생님', lessonsTaught: 180, averageRating: 4.8, responseRate: 95 },
        { id: '2', name: '김선생님', lessonsTaught: 165, averageRating: 4.7, responseRate: 92 },
        { id: '3', name: '이선생님', lessonsTaught: 150, averageRating: 4.6, responseRate: 88 },
        { id: '4', name: '최선생님', lessonsTaught: 135, averageRating: 4.5, responseRate: 85 },
        { id: '5', name: '정선생님', lessonsTaught: 120, averageRating: 4.4, responseRate: 82 }
      ],
      serviceStats: [
        { service: '초급 회화', bookings: 450, revenue: 31500000, averageRating: 4.6 },
        { service: '중급 문법', bookings: 380, revenue: 26600000, averageRating: 4.7 },
        { service: '고급 읽기', bookings: 320, revenue: 22400000, averageRating: 4.5 },
        { service: '비즈니스 한국어', bookings: 150, revenue: 10500000, averageRating: 4.8 }
      ]
    };

    setData(mockData);
    setLoading(false);
  };

  const renderProgressBar = (percentage: number, color: string) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">데이터 통계 및 분석</h1>
          <p className="text-gray-600">교실 운영 현황을 한눈에 파악할 수 있는 종합 통계</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">이번 주</option>
              <option value="month">이번 달</option>
              <option value="quarter">이번 분기</option>
              <option value="year">올해</option>
            </select>
            
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 선생님</option>
              <option value="teacher1">박선생님</option>
              <option value="teacher2">김선생님</option>
              <option value="teacher3">이선생님</option>
            </select>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>보고서 다운로드</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">출석률</p>
                <p className="text-2xl font-bold text-gray-900">{data.attendance.rate}%</p>
                <p className="text-xs text-gray-500">
                  {data.attendance.present}/{data.attendance.total} 수업
                </p>
              </div>
            </div>
            {renderProgressBar(data.attendance.rate, 'bg-blue-500')}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">예약 완료율</p>
                <p className="text-2xl font-bold text-gray-900">{data.reservations.completionRate}%</p>
                <p className="text-xs text-gray-500">
                  {data.reservations.completed}/{data.reservations.total} 예약
                </p>
              </div>
            </div>
            {renderProgressBar(data.reservations.completionRate, 'bg-green-500')}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">평균 평점</p>
                <p className="text-2xl font-bold text-gray-900">{data.reviews.averageRating}</p>
                <p className="text-xs text-gray-500">
                  {data.reviews.total}개 리뷰
                </p>
              </div>
            </div>
            <div className="flex space-x-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={`w-4 h-4 ${
                    star <= data.reviews.averageRating 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">답변율</p>
                <p className="text-2xl font-bold text-gray-900">{data.reviews.responseRate}%</p>
                <p className="text-xs text-gray-500">
                  리뷰 응답률
                </p>
              </div>
            </div>
            {renderProgressBar(data.reviews.responseRate, 'bg-purple-500')}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              월별 추이
            </h3>
            <div className="space-y-4">
              {data.monthlyData.map((monthData, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-12">{monthData.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>출석률: {monthData.attendance}%</span>
                      <span>예약: {monthData.reservations}건</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1 bg-blue-100 rounded h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded"
                          style={{ width: `${monthData.attendance}%` }}
                        ></div>
                      </div>
                      <div className="flex-1 bg-green-100 rounded h-2">
                        <div 
                          className="bg-green-500 h-2 rounded"
                          style={{ width: `${(monthData.reservations / 150) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(monthData.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              서비스별 성과
            </h3>
            <div className="space-y-4">
              {data.serviceStats.map((service, index) => (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{service.service}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{service.bookings}건</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`w-3 h-3 ${
                              star <= service.averageRating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>매출: {formatCurrency(service.revenue)}</span>
                    <span>평점: {service.averageRating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Students */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              우수 학생
            </h3>
            <div className="space-y-3">
              {data.topStudents.map((student, index) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">레벨 {student.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{student.lessonsCompleted}회</p>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500">{student.averageRating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Teachers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              우수 선생님
            </h3>
            <div className="space-y-3">
              {data.topTeachers.map((teacher, index) => (
                <div key={teacher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{teacher.name}</p>
                      <p className="text-sm text-gray-500">{teacher.lessonsTaught}회 수업</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-900">{teacher.averageRating}</span>
                    </div>
                    <p className="text-xs text-gray-500">답변율 {teacher.responseRate}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">상세 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">학생 현황</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">총 학생 수</span>
                  <span className="font-medium">{data.students.total}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">활성 학생</span>
                  <span className="font-medium">{data.students.active}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">신규 학생 (이번 달)</span>
                  <span className="font-medium">{data.students.newThisMonth}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 수업 수</span>
                  <span className="font-medium">{data.students.averageLessons}회</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">선생님 현황</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">총 선생님 수</span>
                  <span className="font-medium">{data.teachers.total}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">활성 선생님</span>
                  <span className="font-medium">{data.teachers.active}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 평점</span>
                  <span className="font-medium">{data.teachers.averageRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 수업 수</span>
                  <span className="font-medium">{data.teachers.totalLessons}회</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">리뷰 현황</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">총 리뷰 수</span>
                  <span className="font-medium">{data.reviews.total}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 평점</span>
                  <span className="font-medium">{data.reviews.averageRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">답변율</span>
                  <span className="font-medium">{data.reviews.responseRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Google 리뷰</span>
                  <span className="font-medium">{data.reviews.googleReviews}개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 