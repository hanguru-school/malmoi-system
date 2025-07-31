'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MessageSquare, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import Link from 'next/link';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface ExistingReservation {
  date: string;
  time: string;
  duration: number;
  status: string;
}

export default function NewReservationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 폼 데이터
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // 모달 상태
  const [showTimeConfirmModal, setShowTimeConfirmModal] = useState(false);
  const [tempSelectedTime, setTempSelectedTime] = useState<string>('');

  // 데이터
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [existingReservations, setExistingReservations] = useState<ExistingReservation[]>([]);

  // 수업 시간 옵션 (간소화)
  const durationOptions = [
    { duration: 60, description: '기본 수업 (60분)' },
    { duration: 90, description: '표준 수업 (90분)' },
    { duration: 120, description: '심화 수업 (120분)' }
  ];

  // 날짜 관련
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');

  useEffect(() => {
    // 최소 날짜 (오늘), 최대 날짜 (3개월 후)
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    const todayString = today.toISOString().split('T')[0];
    setMinDate(todayString);
    setMaxDate(threeMonthsLater.toISOString().split('T')[0]);
    
    // 기본값을 오늘 날짜로 설정
    setSelectedDate(todayString);

    // 데이터 로드
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // 실제 예약 데이터 가져오기
      const reservationsResponse = await fetch('/api/reservations/list');
      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json();
        const formattedReservations = reservationsData.reservations.map((reservation: any) => ({
          date: reservation.date,
          time: reservation.startTime,
          duration: 60, // 기본값
          status: reservation.status
        }));
        setExistingReservations(formattedReservations);
      }

      await loadAvailableTimeSlots();
      
    } catch (error) {
      console.error('초기 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 선택 시 가능한 시간대 로드
  useEffect(() => {
    if (selectedDate && selectedDuration > 0) {
      loadAvailableTimeSlots();
    }
  }, [selectedDate, selectedDuration]);

  const loadAvailableTimeSlots = async () => {
    try {
      if (!selectedDuration) return;
      
      // 현재 시간 확인
      const now = new Date();
      const selectedDateObj = new Date(selectedDate);
      const isToday = selectedDateObj.toDateString() === now.toDateString();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // 30분 단위로 시간대 생성 (09:00 ~ 21:00)
      const slots: TimeSlot[] = [];
      for (let hour = 9; hour <= 21; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // 오늘 날짜인 경우 현재 시간 이전은 예약 불가
          let isPastTime = false;
          if (isToday) {
            const timeHour = parseInt(time.split(':')[0]);
            const timeMinute = parseInt(time.split(':')[1]);
            
            if (timeHour < currentHour || (timeHour === currentHour && timeMinute <= currentMinute)) {
              isPastTime = true;
            }
          }
          
          // 해당 날짜의 기존 예약 확인
          const dayReservations = existingReservations.filter(r => r.date === selectedDate);
          
          // 현재 시간대와 겹치는 예약이 있는지 확인
          const isConflicting = dayReservations.some(reservation => {
            const reservationStart = new Date(`2024-01-15 ${reservation.time}`);
            const reservationEnd = new Date(reservationStart.getTime() + (reservation.duration + 10) * 60000);
            const currentStart = new Date(`2024-01-15 ${time}`);
            const currentEnd = new Date(currentStart.getTime() + (selectedDuration + 10) * 60000);
            
            return currentStart < reservationEnd && currentEnd > reservationStart;
          });
          
          slots.push({
            time,
            available: !isConflicting && !isPastTime
          });
        }
      }

      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error('가능한 시간대 로드 오류:', error);
      setAvailableTimeSlots([]);
    }
  };

  // 시간 선택 처리
  const handleTimeSelect = (time: string) => {
    setTempSelectedTime(time);
    setShowTimeConfirmModal(true);
  };

  // 시간 확인 모달에서 확인
  const handleTimeConfirm = () => {
    setSelectedTime(tempSelectedTime);
    setShowTimeConfirmModal(false);
    setTempSelectedTime('');
  };

  // 시간 확인 모달에서 취소
  const handleTimeCancel = () => {
    setShowTimeConfirmModal(false);
    setTempSelectedTime('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !selectedDuration || !selectedLocation) {
      setError('모든 필수 항목을 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 실제 API 호출
      const response = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          duration: selectedDuration,
          location: selectedLocation,
          notes: notes.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '예약 생성에 실패했습니다.');
      }

      console.log('예약 성공:', data);

      // 성공 처리
      setSuccess(true);
      setTimeout(() => {
        router.push('/student/reservations');
      }, 2000);

    } catch (error) {
      console.error('예약 실패:', error);
      setError(error instanceof Error ? error.message : '예약 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDayOfWeek = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', { weekday: 'long' });
  };

  // 선택된 시간의 종료 시간 계산
  const getEndTime = (startTime: string, duration: number) => {
    const start = new Date(`2024-01-15 ${startTime}`);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toTimeString().slice(0, 5);
  };

  // 시간대 렌더링
  const renderTimeSlots = () => {
    if (!selectedDate) return null;

    const timeSlots = [];
    const startHour = 9; // 오전 9시부터
    const endHour = 21; // 오후 9시까지
    const currentTime = new Date();
    const selectedDateObj = new Date(selectedDate);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) { // 30분 단위로 변경
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotTime = new Date(selectedDateObj);
        slotTime.setHours(hour, minute, 0, 0);

        // 과거 시간이거나 현재 시간 이전인지 확인
        const isPast = selectedDateObj.toDateString() === currentTime.toDateString() && 
                      slotTime <= currentTime;
        
        // 실제 예약된 시간인지 확인
        const isBooked = existingReservations.some(reservation => 
          reservation.date === selectedDate && 
          reservation.time === timeString &&
          ['CONFIRMED', 'PENDING'].includes(reservation.status)
        );

        const isAvailable = !isPast && !isBooked;

        timeSlots.push(
          <button
            key={timeString}
            onClick={() => isAvailable && handleTimeSelect(timeString)}
            disabled={!isAvailable}
            className={`
              p-3 rounded-lg text-sm font-medium transition-all duration-200
              ${isAvailable 
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' 
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }
              ${selectedTime === timeString ? 'bg-blue-600 text-white border-blue-600' : ''}
              hover:${isAvailable ? 'bg-orange-100 border-orange-300' : ''}
              w-full sm:w-auto min-w-[80px]
            `}
          >
            {timeString}
          </button>
        );
      }
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {timeSlots}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">예약이 완료되었습니다!</h1>
            <p className="text-lg text-gray-600 mb-8">
              예약이 성공적으로 등록되었습니다. 예약 관리 페이지로 이동합니다.
            </p>
            <div className="animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">새 예약하기</h1>
            <p className="text-lg text-gray-600">
              수업 방식, 시간, 날짜를 선택하여 수업을 예약하세요
            </p>
          </div>
          <Link
            href="/student/reservations"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            예약 목록으로
          </Link>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* 예약 폼 */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 온라인/대면 선택 */}
          {!selectedTime && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                수업 방식 선택
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['온라인', '대면'].map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => setSelectedLocation(location)}
                    className={`p-6 border-2 rounded-lg text-center transition-all ${
                      selectedLocation === location
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg font-semibold text-gray-900 mb-2">{location}</div>
                    <div className="text-sm text-gray-600">
                      {location === '온라인' ? '화상 수업으로 진행' : '직접 만나서 수업'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 수업 시간 선택 */}
          {selectedLocation && !selectedTime && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                수업 시간 선택
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {durationOptions.map((option) => (
                  <button
                    key={option.duration}
                    type="button"
                    onClick={() => setSelectedDuration(option.duration)}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      selectedDuration === option.duration
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg font-semibold text-gray-900">{option.duration}분</div>
                    <div className="text-sm text-gray-600">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 날짜 선택 */}
          {selectedDuration > 0 && !selectedTime && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                날짜 선택
              </h2>
              <div className="max-w-md">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {selectedDate && (
                  <p className="text-sm text-gray-600 mt-2">
                    선택된 날짜: {selectedDate} ({getDayOfWeek(selectedDate)})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 시간 선택 */}
          {selectedDate && availableTimeSlots.length > 0 && !selectedTime && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                시간 선택
              </h2>
              {renderTimeSlots()}
              {availableTimeSlots.every(slot => !slot.available) && (
                <p className="text-sm text-gray-500 mt-4">
                  선택하신 날짜에는 가능한 시간이 없습니다. 다른 날짜를 선택해주세요.
                </p>
              )}
            </div>
          )}

          {/* 메모 */}
          {selectedTime && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-600" />
                추가 정보
              </h2>
              
              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모 (선택사항)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="수업에 대한 특별한 요청사항이나 질문이 있으시면 입력해주세요."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* 예약 요약 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">예약 요약</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">날짜:</span>
                <span className="font-medium text-gray-900">{selectedDate || '선택되지 않음'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">시간:</span>
                <span className="font-medium text-gray-900">{selectedTime || '선택되지 않음'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">수업 시간:</span>
                <span className="font-medium text-gray-900">{selectedDuration}분</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">수업 방식:</span>
                <span className="font-medium text-gray-900">{selectedLocation || '선택되지 않음'}</span>
              </div>
              {notes && (
                <div className="flex justify-between">
                  <span className="text-gray-600">메모:</span>
                  <span className="font-medium text-gray-900">{notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* 제출 버튼 */}
          {selectedLocation && selectedDuration > 0 && selectedDate && selectedTime && (
            <div className="flex justify-end gap-4">
              <Link
                href="/student/reservations"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    예약 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    예약하기
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* 시간 확인 모달 */}
        {showTimeConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">시간 확인</h3>
                <button
                  onClick={handleTimeCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  선택하신 시간으로 예약을 진행하시겠습니까?
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">날짜:</span>
                      <span className="font-medium">{selectedDate} ({getDayOfWeek(selectedDate)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">시간:</span>
                      <span className="font-medium">
                        {tempSelectedTime} ~ {getEndTime(tempSelectedTime, selectedDuration)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">수업 시간:</span>
                      <span className="font-medium">{selectedDuration}분</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleTimeCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  돌아가기
                </button>
                <button
                  type="button"
                  onClick={handleTimeConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 