'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  MapPin, 
  MessageSquare, 
  ArrowLeft, 
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Star,
  Phone,
  Mail,
  Award,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: string;
  points: number;
  totalClasses: number;
  joinDate: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  rating: number;
  totalStudents: number;
  status: 'active' | 'inactive';
}

interface Reservation {
  id: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  notes?: string;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'confirmed';
  createdAt: string;
  updatedAt: string;
  student: Student;
  teacher: Teacher;
  subject: {
    id: string;
    name: string;
    description: string;
    level: string;
  };
}

export default function AdminReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockReservation: Reservation = {
        id: reservationId,
        date: '2024-01-15',
        time: '14:00',
        duration: 60,
        location: '온라인',
        notes: '일상 대화 연습을 하고 싶습니다.',
        price: 30000,
        status: 'confirmed',
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-12T15:30:00Z',
        student: {
          id: '1',
          name: '김학생',
          email: 'student@example.com',
          phone: '010-1234-5678',
          level: '중급 B',
          points: 1250,
          totalClasses: 12,
          joinDate: '2023-06-15'
        },
        teacher: {
          id: '1',
          name: '김선생님',
          email: 'teacher@example.com',
          phone: '010-9876-5432',
          subjects: ['한국어 회화', '문법', '작문'],
          rating: 4.8,
          totalStudents: 25,
          status: 'active'
        },
        subject: {
          id: '1',
          name: '한국어 회화',
          description: '일상 대화와 실용적인 한국어 표현 학습',
          level: '초급~고급'
        }
      };

      setReservation(mockReservation);
      setLoading(false);
    } catch (error) {
      console.error('예약 조회 실패:', error);
      setError('예약 정보를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true);
      
      // 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('예약 상태 업데이트:', reservationId, newStatus);
      
      // 성공 시 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
      setError('상태 업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      
      // 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('예약 취소:', reservationId);
      
      // 성공 시 목록으로 이동
      router.push('/admin/reservations');
    } catch (error) {
      console.error('예약 취소 실패:', error);
      setError('예약 취소 중 오류가 발생했습니다.');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

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
        return <Award className="w-4 h-4" />;
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
    return new Date(date).toLocaleDateString('ko-KR', { weekday: 'long' });
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

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">오류 발생</h1>
            <p className="text-lg text-gray-600 mb-8">
              {error || '예약을 찾을 수 없습니다.'}
            </p>
            <Link
              href="/admin/reservations"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              예약 목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">예약 상세 관리</h1>
            <p className="text-lg text-gray-600">
              예약 정보를 확인하고 관리하세요
            </p>
          </div>
          <Link
            href="/admin/reservations"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            예약 목록으로
          </Link>
        </div>

        {/* 예약 정보 카드 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* 상태 헤더 */}
          <div className={`px-6 py-4 ${getStatusColor(reservation.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(reservation.status)}
                <span className="font-medium">{getStatusText(reservation.status)}</span>
              </div>
              <div className="text-sm">
                예약 ID: {reservation.id}
              </div>
            </div>
          </div>

          {/* 예약 상세 정보 */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 기본 정보 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 정보</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-600">날짜</div>
                        <div className="font-medium text-gray-900">
                          {reservation.date} ({getDayOfWeek(reservation.date)})
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-sm text-gray-600">시간</div>
                        <div className="font-medium text-gray-900">
                          {reservation.time} ({reservation.duration}분)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="text-sm text-gray-600">과목</div>
                        <div className="font-medium text-gray-900">{reservation.subject.name}</div>
                        <div className="text-xs text-gray-500">{reservation.subject.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="text-sm text-gray-600">장소</div>
                        <div className="font-medium text-gray-900">{reservation.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-sm text-gray-600">수강료</div>
                        <div className="font-medium text-gray-900">
                          {reservation.price.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                {reservation.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">메모</h3>
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div className="text-gray-700 bg-gray-50 rounded-lg p-3 flex-1">
                        {reservation.notes}
                      </div>
                    </div>
                  </div>
                )}

                {/* 예약 이력 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 이력</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">생성일</span>
                      <span className="text-gray-900">
                        {new Date(reservation.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">수정일</span>
                      <span className="text-gray-900">
                        {new Date(reservation.updatedAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 학생 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">학생 정보</h3>
                <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">{reservation.student.name}</div>
                      <div className="text-sm text-gray-600">학생</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{reservation.student.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{reservation.student.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-900">{reservation.student.level}</div>
                      <div className="text-xs text-blue-700">현재 레벨</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-900">{reservation.student.points}</div>
                      <div className="text-xs text-blue-700">포인트</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-900">{reservation.student.totalClasses}</div>
                      <div className="text-xs text-blue-700">총 수업</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-900">
                        {new Date(reservation.student.joinDate).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="text-xs text-blue-700">가입일</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 선생님 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">선생님 정보</h3>
                <div className="bg-green-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900">{reservation.teacher.name}</div>
                      <div className="text-sm text-gray-600">선생님</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{reservation.teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{reservation.teacher.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{reservation.teacher.rating}</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-600">수강생 {reservation.teacher.totalStudents}명</span>
                  </div>

                  <div className="pt-3 border-t border-green-200">
                    <div className="text-sm font-medium text-gray-900 mb-2">전문 과목</div>
                    <div className="flex flex-wrap gap-1">
                      {reservation.teacher.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-green-200">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reservation.teacher.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {reservation.teacher.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 관리 액션 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">관리 액션</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 상태 변경 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예약 상태 변경
              </label>
              <select
                value={reservation.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="upcoming">예정</option>
                <option value="confirmed">확정</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex flex-col gap-2">
              <Link
                href={`/admin/reservations/${reservation.id}/edit`}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                예약 수정
              </Link>
              <Link
                href={`/admin/students/${reservation.student.id}`}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <User className="w-4 h-4" />
                학생 관리
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/admin/teachers/${reservation.teacher.id}`}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <User className="w-4 h-4" />
                선생님 관리
              </Link>
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                예약 취소
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/admin/reports/reservation/${reservation.id}`}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                상세 리포트
              </Link>
              <Link
                href={`/admin/communications/${reservation.id}`}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                메시지 전송
              </Link>
            </div>
          </div>
        </div>

        {/* 취소 확인 모달 */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 취소</h3>
              <p className="text-gray-600 mb-6">
                정말로 이 예약을 취소하시겠습니까? 취소된 예약은 복구할 수 없습니다.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      취소 중...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      예약 취소
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 