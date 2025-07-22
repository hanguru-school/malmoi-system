'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useReservations } from '@/hooks/useReservations';
import { useRooms } from '@/hooks/useRooms';
import { useCourses } from '@/hooks/useCourses';

export default function NewReservationPage() {
  const { user } = useAuth();
  const { addReservation, loading: reservationLoading } = useReservations();
  const { rooms, loading: roomsLoading } = useRooms();
  const { courses, loading: coursesLoading } = useCourses();
  const router = useRouter();

  const [formData, setFormData] = useState({
    courseId: '',
    roomId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  const [error, setError] = useState('');

  // 로그인 확인
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('로그인이 필요합니다');
      return;
    }

    try {
      // 예약 데이터 생성
      const reservationData = {
        userId: user.id,
        courseId: formData.courseId,
        roomId: formData.roomId,
        date: new Date(formData.date),
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: 'pending' as const,
        notes: formData.notes || undefined
      };

      await addReservation(reservationData);
      
      // 예약 완료 후 마이페이지로 이동
      router.push('/reservation/japanese/mypage');
    } catch (err: any) {
      setError(err.message || '예약 생성에 실패했습니다');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
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
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">새 예약 생성</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 코스 선택 */}
            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
                코스 선택 *
              </label>
              <select
                id="courseId"
                value={formData.courseId}
                onChange={(e) => handleInputChange('courseId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={coursesLoading}
              >
                <option value="">코스를 선택하세요</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} - {course.duration}분 ({course.price.toLocaleString()}원)
                  </option>
                ))}
              </select>
              {coursesLoading && (
                <p className="mt-1 text-sm text-gray-500">코스 목록 로딩 중...</p>
              )}
            </div>

            {/* 교실 선택 */}
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                교실 선택 *
              </label>
              <select
                id="roomId"
                value={formData.roomId}
                onChange={(e) => handleInputChange('roomId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={roomsLoading}
              >
                <option value="">교실을 선택하세요</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} (수용인원: {room.capacity}명)
                  </option>
                ))}
              </select>
              {roomsLoading && (
                <p className="mt-1 text-sm text-gray-500">교실 목록 로딩 중...</p>
              )}
            </div>

            {/* 날짜 선택 */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                날짜 *
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* 시간 선택 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  시작 시간 *
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  종료 시간 *
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* 메모 */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                메모 (선택사항)
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예약에 대한 추가 요청사항을 입력하세요"
              />
            </div>

            {/* 오류 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={reservationLoading || coursesLoading || roomsLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {reservationLoading ? '예약 생성 중...' : '예약 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 