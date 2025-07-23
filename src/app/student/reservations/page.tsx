'use client';

import { Clock, CheckCircle, XCircle, AlertCircle, Plus, Search, Calendar, User, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Reservation {
  id: string;
  date: string;
  time: string;
  teacher: string;
  teacherAssigned: boolean; // 선생님이 지정되었는지 여부
  subject: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  duration: number;
  location: string;
  notes?: string;
}

export default function StudentReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 8;
  
  // 언어 설정
  const [currentLanguage, setCurrentLanguage] = useState<'ko' | 'ja'>('ko');

  // 언어 전환 함수
  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'ko' ? 'ja' : 'ko');
  };

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '내 예약',
      newReservation: '새 예약하기',
      search: '예약 검색...',
      all: '전체',
      upcoming: '예정',
      completed: '완료',
      cancelled: '취소',
      noReservations: '예약 내역이 없습니다',
      teacher: '선생님',
      duration: '분',
      location: '위치',
      notes: '메모',
      edit: '수정',
      cancel: '취소',
      back: '돌아가기',
      status: {
        upcoming: '예정',
        completed: '완료',
        cancelled: '취소'
      }
    },
    ja: {
      title: 'マイ予約',
      newReservation: '新規予約',
      search: '予約を検索...',
      all: 'すべて',
      upcoming: '予定',
      completed: '完了',
      cancelled: 'キャンセル',
      noReservations: '予約履歴がありません',
      teacher: '先生',
      duration: '分',
      location: '場所',
      notes: 'メモ',
      edit: '編集',
      cancel: 'キャンセル',
      back: '戻る',
      status: {
        upcoming: '予定',
        completed: '完了',
        cancelled: 'キャンセル'
      }
    }
  };

  const t = texts[currentLanguage];

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      const mockReservations: Reservation[] = [
        {
          id: '1',
          date: '2024-01-15',
          time: '14:00',
          teacher: '김선생님',
          teacherAssigned: true,
          subject: '영어 회화',
          status: 'upcoming',
          duration: 60,
          location: '온라인',
          notes: '일상 대화 연습'
        },
        {
          id: '2',
          date: '2024-01-12',
          time: '16:00',
          teacher: '이선생님',
          teacherAssigned: true,
          subject: '문법',
          status: 'completed',
          duration: 60,
          location: '오프라인',
          notes: '현재완료 시제'
        },
        {
          id: '3',
          date: '2024-01-10',
          time: '10:00',
          teacher: '박선생님',
          teacherAssigned: true,
          subject: '리스닝',
          status: 'completed',
          duration: 45,
          location: '온라인'
        },
        {
          id: '4',
          date: '2024-01-08',
          time: '15:30',
          teacher: '최선생님',
          teacherAssigned: false,
          subject: '작문',
          status: 'cancelled',
          duration: 60,
          location: '오프라인',
          notes: '개인 사정으로 취소'
        },
        {
          id: '5',
          date: '2024-01-18',
          time: '09:00',
          teacher: '',
          teacherAssigned: false,
          subject: '토익 준비',
          status: 'upcoming',
          duration: 90,
          location: '온라인',
          notes: 'RC 집중 연습'
        },
        {
          id: '6',
          date: '2024-01-20',
          time: '13:00',
          teacher: '',
          teacherAssigned: false,
          subject: '일본어 회화',
          status: 'upcoming',
          duration: 60,
          location: '오프라인'
        },
        {
          id: '7',
          date: '2024-01-22',
          time: '11:00',
          teacher: '정선생님',
          teacherAssigned: true,
          subject: '중국어 기초',
          status: 'upcoming',
          duration: 60,
          location: '온라인',
          notes: '성조 연습'
        },
        {
          id: '8',
          date: '2024-01-25',
          time: '14:30',
          teacher: '',
          teacherAssigned: false,
          subject: '스페인어 회화',
          status: 'upcoming',
          duration: 60,
          location: '오프라인'
        },
        {
          id: '9',
          date: '2024-01-05',
          time: '10:00',
          teacher: '김선생님',
          teacherAssigned: true,
          subject: '한국어 회화',
          status: 'completed',
          duration: 90,
          location: '온라인',
          notes: '일상 대화 연습 완료'
        },
        {
          id: '10',
          date: '2024-01-03',
          time: '15:00',
          teacher: '박선생님',
          teacherAssigned: true,
          subject: '문법',
          status: 'completed',
          duration: 60,
          location: '오프라인',
          notes: '조사와 어미 학습'
        },
        {
          id: '11',
          date: '2024-01-01',
          time: '13:30',
          teacher: '이선생님',
          teacherAssigned: true,
          subject: '작문',
          status: 'completed',
          duration: 120,
          location: '온라인',
          notes: '에세이 작성 연습'
        }
      ];

      setReservations(mockReservations);
      setTotalPages(Math.ceil(mockReservations.length / itemsPerPage));
      setLoading(false);
    }, 1000);
  }, []);

  // 필터링 및 검색
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    return t.status[status as keyof typeof t.status] || '알 수 없음';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-lg text-gray-600">
            수업 예약을 확인하고 관리하세요
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/student/reservations/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t.newReservation}
          </Link>
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
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 상태 필터 */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'upcoming' | 'completed' | 'cancelled')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t.all}</option>
              <option value="upcoming">{t.upcoming}</option>
              <option value="completed">{t.completed}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 예약 목록 */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {paginatedReservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noReservations}</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? '검색 조건에 맞는 예약이 없습니다.' 
                : '아직 예약한 수업이 없습니다.'}
            </p>
            <Link
              href="/student/reservations/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              첫 예약하기
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      날짜/시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.teacher}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      과목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.location}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(reservation.date).toLocaleDateString('ko-KR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reservation.time} ({reservation.duration}{t.duration})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className={`text-sm ${reservation.teacherAssigned ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                            {reservation.teacherAssigned ? reservation.teacher : '미확정'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{reservation.subject}</span>
                        {reservation.notes && (
                          <div className="text-xs text-gray-500 mt-1">{reservation.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{reservation.location}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                          {getStatusIcon(reservation.status)}
                          <span className="ml-1">{getStatusText(reservation.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {reservation.status === 'upcoming' && (
                            <>
                              <Link
                                href={`/student/reservations/${reservation.id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button className="text-red-600 hover:text-red-900">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <Link
                            href={`/student/reservations/${reservation.id}`}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            상세보기
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredReservations.length)}
                      </span>{' '}
                      / <span className="font-medium">{filteredReservations.length}</span>개
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 