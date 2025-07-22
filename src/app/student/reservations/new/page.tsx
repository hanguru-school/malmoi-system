'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  MapPin, 
  MessageSquare, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  availableDays: string[];
  availableTimes: string[];
  location: string;
  rating: number;
  totalStudents: number;
}

interface Subject {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  level: string;
  availableTimes: string[];
}

interface TimeSlot {
  time: string;
  available: boolean;
  teacherId?: string;
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

  // 데이터
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);

  // 수업 시간 옵션
  const durationOptions = [
    { duration: 60, description: '가장 기본적인 시간입니다. 초급 학생에게 적절합니다.' },
    { duration: 90, description: '회화 레슨에 가장 적절한 수업 시간입니다. 초급부터 상급까지 빠른 레벨업에 적절합니다.' },
    { duration: 120, description: '중급 이상의 학생에게 적절하며 다양한 실전회화를 연습할 수 있습니다.' },
    { duration: 150, description: '특별한 목적을 가진 전문적인 수업에 적합합니다. 중급 이상에게 적절합니다.' },
    { duration: 180, description: '특별한 목적을 가진 전문적인 수업에 적합합니다. 중급 이상에게 적절합니다.' },
    { duration: 80, description: '기본보다 조금 더 깊이 있는 수업이 가능합니다. 초급이나 발음 등의 집중레슨에 적절합니다.' }
  ];

  // 기존 예약 데이터 (실제로는 API에서 가져와야 함)
  const existingReservations = [
    { date: '2024-01-15', time: '10:00', duration: 90 },
    { date: '2024-01-15', time: '14:00', duration: 120 },
    { date: '2024-01-15', time: '16:30', duration: 60 },
    { date: '2024-01-16', time: '09:00', duration: 150 },
    { date: '2024-01-16', time: '13:00', duration: 90 },
  ];

  // 날짜 관련
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');

  useEffect(() => {
    // 최소 날짜 (오늘), 최대 날짜 (3개월 후)
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    setMinDate(today.toISOString().split('T')[0]);
    setMaxDate(threeMonthsLater.toISOString().split('T')[0]);

    // 데이터 로드
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLoading(false);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
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
      
      // 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5분 단위로 시간대 생성 (09:00 ~ 21:00)
      const slots: TimeSlot[] = [];
      for (let hour = 9; hour <= 21; hour++) {
        for (let minute = 0; minute < 60; minute += 5) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // 해당 날짜의 기존 예약 확인
          const dayReservations = existingReservations.filter(r => r.date === selectedDate);
          
          // 현재 시간대와 겹치는 예약이 있는지 확인
          const isConflicting = dayReservations.some(reservation => {
            const reservationStart = new Date(`2024-01-15 ${reservation.time}`);
            const reservationEnd = new Date(reservationStart.getTime() + (reservation.duration + 10) * 60000); // +10분 준비시간
            const currentStart = new Date(`2024-01-15 ${time}`);
            const currentEnd = new Date(currentStart.getTime() + (selectedDuration + 10) * 60000); // +10분 준비시간
            
            return currentStart < reservationEnd && currentEnd > reservationStart;
          });
          
          slots.push({
            time,
            available: !isConflicting
          });
        }
      }

      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error('가능한 시간대 로드 오류:', error);
      setAvailableTimeSlots([]);
    }
  };

  // 시간대 호버 상태 관리
  const [hoveredTime, setHoveredTime] = useState<string>('');

  // 시간대가 겹치는지 확인하는 함수
  const isTimeConflicting = (time: string) => {
    if (!selectedDuration) return false;
    
    const dayReservations = existingReservations.filter(r => r.date === selectedDate);
    const currentStart = new Date(`2024-01-15 ${time}`);
    const currentEnd = new Date(currentStart.getTime() + (selectedDuration + 10) * 60000);
    
    return dayReservations.some(reservation => {
      const reservationStart = new Date(`2024-01-15 ${reservation.time}`);
      const reservationEnd = new Date(reservationStart.getTime() + (reservation.duration + 10) * 60000);
      return currentStart < reservationEnd && currentEnd > reservationStart;
    });
  };

  // 시간이 선택된 범위에 포함되는지 확인하는 함수
  const isTimeInSelectedRange = (time: string) => {
    if (!selectedTime || !selectedDuration) return false;
    
    const selectedStart = new Date(`2024-01-15 ${selectedTime}`);
    const selectedEnd = new Date(selectedStart.getTime() + (selectedDuration + 10) * 60000);
    const currentTime = new Date(`2024-01-15 ${time}`);
    
    return currentTime >= selectedStart && currentTime < selectedEnd;
  };

  // 시간대의 상태를 결정하는 함수
  const getTimeSlotStatus = (time: string) => {
    if (!selectedDuration) return 'disabled';
    
    const isConflicting = isTimeConflicting(time);
    const isHovered = isTimeInHoveredRange(time);
    const isSelected = isTimeInSelectedRange(time);
    
    if (isSelected) {
      return 'selected';
    } else if (isConflicting) {
      return isHovered ? 'conflicting-hover' : 'conflicting';
    } else {
      return isHovered ? 'available-hover' : 'available';
    }
  };

  // 시간이 호버된 범위에 포함되는지 확인하는 함수
  const isTimeInHoveredRange = (time: string) => {
    if (!hoveredTime || !selectedDuration) return false;
    
    const hoverStart = new Date(`2024-01-15 ${hoveredTime}`);
    const hoverEnd = new Date(hoverStart.getTime() + (selectedDuration + 10) * 60000);
    const currentTime = new Date(`2024-01-15 ${time}`);
    
    return currentTime >= hoverStart && currentTime < hoverEnd;
  };

  // 시간대가 중복된 범위에 포함되는지 확인하는 함수
  const isTimeInConflictingRange = (time: string) => {
    if (!selectedDuration) return false;
    
    const dayReservations = existingReservations.filter(r => r.date === selectedDate);
    const currentTime = new Date(`2024-01-15 ${time}`);
    
    return dayReservations.some(reservation => {
      const reservationStart = new Date(`2024-01-15 ${reservation.time}`);
      const reservationEnd = new Date(reservationStart.getTime() + (reservation.duration + 10) * 60000);
      return currentTime >= reservationStart && currentTime < reservationEnd;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      setError('모든 필수 항목을 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 2000));

      const reservationData = {
        date: selectedDate,
        time: selectedTime,
        location: selectedLocation,
        notes: notes.trim() || undefined,
        duration: selectedDuration,
        price: selectedDuration * 10000 // 예시 가격 (10분당 10000원)
      };

      console.log('예약 데이터:', reservationData);

      // 성공 처리
      setSuccess(true);
      setTimeout(() => {
        router.push('/student/reservations');
      }, 2000);

    } catch (error) {
      console.error('예약 실패:', error);
      setError('예약 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
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
              원하는 선생님과 시간을 선택하여 수업을 예약하세요
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

          {/* 수업 시간 선택 */}
          {selectedLocation && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                수업 시간 선택
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          {selectedDuration > 0 && (
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
          {selectedDate && availableTimeSlots.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                시간 선택
              </h2>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {availableTimeSlots.map((slot) => {
                  const status = getTimeSlotStatus(slot.time);
                  const isInConflictingRange = isTimeInConflictingRange(slot.time);
                  const isInHoveredRange = isTimeInHoveredRange(slot.time);

                  const getButtonClasses = () => {
                    const baseClasses = "p-2 text-sm rounded transition-all duration-200 relative";

                    switch (status) {
                      case 'available':
                        return `${baseClasses} bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-400`;
                      case 'available-hover':
                        return `${baseClasses} bg-blue-100 border border-blue-400 text-blue-800`;
                      case 'conflicting':
                        return `${baseClasses} bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed`;
                      case 'conflicting-hover':
                        return `${baseClasses} bg-orange-100 border border-orange-400 text-orange-800`;
                      case 'selected':
                        return `${baseClasses} bg-blue-500 text-white border-blue-500 font-medium`;
                      default:
                        return `${baseClasses} bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed`;
                    }
                  };

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      onMouseEnter={() => setHoveredTime(slot.time)}
                      onMouseLeave={() => setHoveredTime('')}
                      className={getButtonClasses()}
                    >
                      {slot.time}
                      {isInHoveredRange && isInConflictingRange && status !== 'selected' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-red-500 transform rotate-45"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
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
          {selectedLocation && selectedDuration > 0 && selectedDate && selectedTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                예약 요약
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">수업 방식:</span>
                  <span className="font-medium">{selectedLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">수업 시간:</span>
                  <span className="font-medium">{selectedDuration}분 (준비시간 10분 포함)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">날짜:</span>
                  <span className="font-medium">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">시간:</span>
                  <span className="font-medium">
                    {selectedTime} ~ {(() => {
                      const startTime = new Date(`2024-01-15 ${selectedTime}`);
                      const endTime = new Date(startTime.getTime() + (selectedDuration + 10) * 60000);
                      return endTime.toTimeString().slice(0, 5);
                    })()}
                  </span>
                </div>
                {notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">메모:</span>
                    <span className="font-medium">{notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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
      </div>
    </div>
  );
} 