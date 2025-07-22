'use client';

import { Plus, ChevronLeft, ChevronRight, Search, Calendar, CheckCircle, Wifi, MapPin, Edit, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
interface ClassSchedule {
  id: string;
  date: string;
  time: string;
  studentName: string;
  courseName: string;
  location: 'online' | 'offline';
  duration: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  isTagged: boolean;
  notes?: string;
  room?: string;
}

export default function TeacherSchedulePage() {
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      const mockSchedule: ClassSchedule[] = [
        {
          id: '1',
          date: '2024-01-15',
          time: '09:00',
          studentName: '김학생',
          courseName: '영어 회화',
          location: 'online',
          duration: 60,
          status: 'completed',
          isTagged: true,
          notes: '일상 대화 연습, 발음 개선 필요'
        },
        {
          id: '2',
          date: '2024-01-15',
          time: '11:00',
          studentName: '이학생',
          courseName: '문법',
          location: 'offline',
          duration: 60,
          status: 'in_progress',
          isTagged: true,
          room: 'A-101'
        },
        {
          id: '3',
          date: '2024-01-15',
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
          date: '2024-01-15',
          time: '16:00',
          studentName: '최학생',
          courseName: '작문',
          location: 'offline',
          duration: 60,
          status: 'upcoming',
          isTagged: false,
          room: 'B-203'
        },
        {
          id: '5',
          date: '2024-01-16',
          time: '10:00',
          studentName: '정학생',
          courseName: '토론',
          location: 'online',
          duration: 90,
          status: 'upcoming',
          isTagged: false
        }
      ];

      setSchedule(mockSchedule);
      setLoading(false);
    }, 1000);
  }, []);

  // 날짜별 그룹화
  const groupedSchedule = schedule.reduce((groups, classItem) => {
    const date = classItem.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(classItem);
    return groups;
  }, {} as Record<string, ClassSchedule[]>);

  // 필터링
  const filteredSchedule = schedule.filter(classItem => {
    const matchesSearch = 
      classItem.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
      case 'cancelled':
        return '취소';
      default:
        return '알 수 없음';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getViewModeText = () => {
    switch (viewMode) {
      case 'today':
        return '오늘';
      case 'week':
        return '이번 주';
      case 'month':
        return '이번 달';
      default:
        return '';
    }
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">수업 일정</h1>
          <p className="text-lg text-gray-600">
            수업 일정을 확인하고 관리하세요
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            새 수업
          </button>
        </div>
      </div>

      {/* 뷰 모드 선택 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 뷰 모드 버튼 */}
          <div className="flex gap-2">
            {[
              { id: 'today', label: '오늘' },
              { id: 'week', label: '이번 주' },
              { id: 'month', label: '이번 달' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === mode.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* 날짜 네비게이션 */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium text-gray-900">
              {selectedDate.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="학생 이름, 과목명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 상태 필터 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체 상태</option>
            <option value="upcoming">예정</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>
      </div>

      {/* 일정 목록 */}
      <div className="space-y-6">
        {Object.keys(groupedSchedule).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">수업 일정이 없습니다</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? '검색 조건에 맞는 수업이 없습니다.' 
                : `${getViewModeText()} 예정된 수업이 없습니다.`}
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              새 수업 등록
            </button>
          </div>
        ) : (
          Object.entries(groupedSchedule).map(([date, classes]) => (
            <div key={date} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatDate(date)}
                </h3>
                <p className="text-sm text-gray-600">
                  총 {classes.length}개 수업
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {classes.map((classItem) => (
                  <div key={classItem.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">{classItem.time}</div>
                          <div className="text-sm text-gray-500">{classItem.duration}분</div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-semibold text-gray-900">{classItem.studentName}</h4>
                            {classItem.isTagged && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="text-gray-600 mb-2">{classItem.courseName}</div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              {classItem.location === 'online' ? (
                                <Wifi className="w-4 h-4" />
                              ) : (
                                <MapPin className="w-4 h-4" />
                              )}
                              <span>{classItem.location === 'online' ? '온라인' : '오프라인'}</span>
                            </div>
                            {classItem.room && (
                              <span>강의실: {classItem.room}</span>
                            )}
                          </div>
                          {classItem.notes && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {classItem.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(classItem.status)}`}>
                          {getStatusText(classItem.status)}
                        </span>
                        
                        <div className="flex gap-2">
                          {classItem.status === 'upcoming' && (
                            <>
                              <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {classItem.status === 'completed' && (
                            <Link
                              href={`/teacher/notes/${classItem.id}`}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Link>
                          )}
                          
                          <Link
                            href={`/teacher/schedule/${classItem.id}`}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            상세보기
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 