'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useReservations } from '@/hooks/useReservations';
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function MyPage() {
  const { user } = useAuth();
  const { reservations, loading, error, updateReservation, removeReservation } = useReservations();
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  // 로그인 확인
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // 상태별 예약 필터링
  const filteredReservations = reservations.filter(reservation => {
    if (selectedStatus === 'all') return true;
    return reservation.status === selectedStatus;
  });

  // 예약 취소
  const handleCancelReservation = async (reservationId: string) => {
    if (confirm('정말로 이 예약을 취소하시겠습니까?')) {
      try {
        await updateReservation(reservationId, 'cancelled');
        alert('예약이 취소되었습니다.');
      } catch (err: any) {
        alert('예약 취소에 실패했습니다: ' + err.message);
      }
    }
  };

  // 예약 삭제
  const handleDeleteReservation = async (reservationId: string) => {
    if (confirm('정말로 이 예약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await removeReservation(reservationId);
        alert('예약이 삭제되었습니다.');
      } catch (err: any) {
        alert('예약 삭제에 실패했습니다: ' + err.message);
      }
    }
  };

  // 상태별 아이콘 및 색상
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', text: '대기중' };
      case 'confirmed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', text: '확정' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', text: '완료' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', text: '취소' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50', text: '알 수 없음' };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
              <p className="text-gray-600 mt-1">
                안녕하세요, {user.name}님! ({user.role})
              </p>
            </div>
            <button
              onClick={() => router.push('/reservation/japanese/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              새 예약하기
            </button>
          </div>
        </div>

        {/* 상태 필터 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">예약 상태별 보기</h2>
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => {
              const statusInfo = status === 'all' 
                ? { text: '전체', color: 'text-gray-600', bg: 'bg-gray-100' }
                : getStatusInfo(status);
              
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedStatus === status
                      ? `${statusInfo.bg} ${statusInfo.color} border-2 border-current`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {statusInfo.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* 예약 목록 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            예약 목록 ({filteredReservations.length}개)
          </h2>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">예약 목록을 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {!loading && filteredReservations.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">예약이 없습니다.</p>
              <button
                onClick={() => router.push('/reservation/japanese/new')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                첫 예약하기
              </button>
            </div>
          )}

          {!loading && filteredReservations.length > 0 && (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => {
                const statusInfo = getStatusInfo(reservation.status);
                const StatusIcon = statusInfo.icon;
                const reservationDate = reservation.date instanceof Date 
                  ? reservation.date 
                  : new Date(reservation.date);

                return (
                  <div key={reservation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {reservationDate.toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {reservation.startTime} - {reservation.endTime}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              교실: {reservation.roomId}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              코스: {reservation.courseId}
                            </span>
                          </div>
                        </div>

                        {reservation.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{reservation.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {reservation.status === 'pending' && (
                          <button
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            취소
                          </button>
                        )}
                        
                        {(reservation.status === 'cancelled' || reservation.status === 'completed') && (
                          <button
                            onClick={() => handleDeleteReservation(reservation.id)}
                            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 