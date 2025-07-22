'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  User,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

interface Reservation {
  id: string;
  date: string;
  time: string;
  student: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  subject: {
    id: string;
    name: string;
  };
  status: 'upcoming' | 'confirmed' | 'completed' | 'cancelled';
  duration: number;
  location: string;
  price: number;
  createdAt: string;
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockReservations: Reservation[] = [
        {
          id: '1',
          date: '2024-01-15',
          time: '14:00',
          student: {
            id: '1',
            name: '김학생',
            email: 'student1@example.com',
            phone: '010-1234-5678'
          },
          teacher: {
            id: '1',
            name: '김선생님',
            email: 'teacher1@example.com'
          },
          subject: {
            id: '1',
            name: '한국어 회화'
          },
          status: 'confirmed',
          duration: 60,
          location: '온라인',
          price: 30000,
          createdAt: '2024-01-10T10:00:00Z'
        },
        {
          id: '2',
          date: '2024-01-16',
          time: '16:00',
          student: {
            id: '2',
            name: '이학생',
            email: 'student2@example.com',
            phone: '010-2345-6789'
          },
          teacher: {
            id: '2',
            name: '이선생님',
            email: 'teacher2@example.com'
          },
          subject: {
            id: '2',
            name: '문법'
          },
          status: 'upcoming',
          duration: 60,
          location: '오프라인',
          price: 35000,
          createdAt: '2024-01-11T14:30:00Z'
        },
        {
          id: '3',
          date: '2024-01-14',
          time: '10:00',
          student: {
            id: '3',
            name: '박학생',
            email: 'student3@example.com',
            phone: '010-3456-7890'
          },
          teacher: {
            id: '1',
            name: '김선생님',
            email: 'teacher1@example.com'
          },
          subject: {
            id: '3',
            name: '작문'
          },
          status: 'completed',
          duration: 90,
          location: '온라인',
          price: 45000,
          createdAt: '2024-01-09T09:15:00Z'
        },
        {
          id: '4',
          date: '2024-01-17',
          time: '15:30',
          student: {
            id: '4',
            name: '최학생',
            email: 'student4@example.com',
            phone: '010-4567-8901'
          },
          teacher: {
            id: '3',
            name: '박선생님',
            email: 'teacher3@example.com'
          },
          subject: {
            id: '4',
            name: '리스닝'
          },
          status: 'cancelled',
          duration: 45,
          location: '오프라인',
          price: 25000,
          createdAt: '2024-01-12T16:45:00Z'
        }
      ];

      setReservations(mockReservations);
      setTotalPages(Math.ceil(mockReservations.length / itemsPerPage));
      setLoading(false);
    } catch (error) {
      console.error('예약 로드 실패:', error);
      setLoading(false);
    }
  };

  // 필터링 및 검색
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    const matchesDate = !dateFilter || reservation.date === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
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
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
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
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '예정';
      case 'confirmed':
        return '확정';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      default:
        return '알 수 없음';
    }
  };

  const getDayOfWeek = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">예약 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">예약 관리</h1>
          <p className="text-lg text-gray-600">
            모든 예약을 확인하고 관리하세요
          </p>
        </div>
        <Link
          href="/admin/reservations/new"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          새 예약 추가
        </Link>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 검색 */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="학생, 선생님, 과목으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 상태 필터 */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'upcoming' | 'confirmed' | 'completed' | 'cancelled')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체 상태</option>
              <option value="upcoming">예정</option>
              <option value="confirmed">확정</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>

          {/* 날짜 필터 */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">총 예약</div>
              <div className="text-2xl font-bold text-gray-900">{reservations.length}건</div>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">확정</div>
              <div className="text-2xl font-bold text-green-600">
                {reservations.filter(r => r.status === 'confirmed').length}건
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">완료</div>
              <div className="text-2xl font-bold text-purple-600">
                {reservations.filter(r => r.status === 'completed').length}건
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">취소</div>
              <div className="text-2xl font-bold text-red-600">
                {reservations.filter(r => r.status === 'cancelled').length}건
              </div>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* 예약 목록 */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {paginatedReservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">예약이 없습니다</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || dateFilter
                ? '검색 조건에 맞는 예약이 없습니다.' 
                : '등록된 예약이 없습니다.'}
            </p>
            <Link
              href="/admin/reservations/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              첫 예약 추가하기
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예약 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학생
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    선생님
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    과목/가격
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(reservation.date).toLocaleDateString('ko-KR')} ({getDayOfWeek(reservation.date)})
                      </div>
                      <div className="text-sm text-gray-500">
                        {reservation.time} ({reservation.duration}분)
                      </div>
                      <div className="text-xs text-gray-400">
                        {reservation.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{reservation.student.name}</div>
                          <div className="text-xs text-gray-500">{reservation.student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{reservation.teacher.name}</div>
                          <div className="text-xs text-gray-500">{reservation.teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{reservation.subject.name}</div>
                          <div className="text-xs text-gray-500">{reservation.price.toLocaleString()}원</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusIcon(reservation.status)}
                        <span className="ml-1">{getStatusText(reservation.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/reservations/${reservation.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/reservations/${reservation.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>부터{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredReservations.length)}
                  </span>까지{' '}
                  <span className="font-medium">{filteredReservations.length}</span>개 중
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 