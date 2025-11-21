"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  studentName: string;
  serviceName: string;
  teacherName: string;
  status: "confirmed" | "cancelled" | "completed" | "no-show";
  isCompleted: boolean;
  isTagged: boolean;
  tagTime?: string;
  location?: string;
  duration?: number;
}

export default function AdminDashboard() {
  return <AdminDashboardContent />;
}

function AdminDashboardContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [activeTab, setActiveTab] = useState<"calendar" | "overview">("calendar");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // 예약 데이터 로드
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/reservations/list");
        const data = await response.json();
        
        if (data.success) {
          setReservations(data.reservations || []);
        } else {
          // 실제 오류인 경우에만 콘솔 에러 출력
          console.error("예약 데이터 로드 실패:", data.message);
          setReservations([]);
        }
      } catch (error) {
        console.error("예약 데이터 로드 오류:", error);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // 월별 날짜 계산
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // 이전 달의 마지막 날들
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push(prevDate);
    }
    
    // 현재 달의 날들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // 다음 달의 첫 날들 (7의 배수로 맞추기)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);

  // 예약 데이터 가져오기
  const getReservationsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(reservation => reservation.date === dateStr);
  };

  // 상태 아이콘
  const getStatusIcon = (status: string, isTagged: boolean) => {
    if (isTagged) {
      return <CheckCircle className="w-3 h-3 text-green-600 ml-1" />;
    }
    
    switch (status) {
      case "confirmed":
        return <AlertCircle className="w-3 h-3 text-blue-600 ml-1" />;
      case "completed":
        return <CheckCircle className="w-3 h-3 text-green-600 ml-1" />;
      case "cancelled":
        return <XCircle className="w-3 h-3 text-red-600 ml-1" />;
      default:
        return null;
    }
  };

  // 이전/다음 달
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 날짜 클릭
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
        <p className="text-lg text-gray-600">
          예약 일정을 관리하고 시스템 상태를 모니터링하세요
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === "calendar"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          예약 일정
        </button>
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === "overview"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          개요
        </button>
      </div>

      {/* 캘린더 탭 */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* 캘린더 헤더 */}
          <div className="flex items-center justify-between bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  viewMode === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                월별
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  viewMode === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                주별
              </button>
            </div>
          </div>

          {/* 월별 뷰 */}
          {viewMode === "month" && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
                {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center text-sm font-medium text-gray-700 bg-white"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 예약이 없을 때 안내 메시지 */}
              {reservations.length === 0 && (
                <div className="p-8 text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    등록된 예약이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    아직 등록된 예약이 없습니다. 새로운 예약을 생성해보세요.
                  </p>
                  <button
                    onClick={() => window.location.href = '/admin/reservations'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    예약 관리로 이동
                  </button>
                </div>
              )}

              {/* 날짜 그리드 */}
              {reservations.length > 0 && (
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {days.map((day, index) => {
                  const dayReservations = getReservationsForDate(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(day)}
                      className={`min-h-[180px] p-1 bg-white cursor-pointer hover:bg-gray-50 transition-colors ${
                        !isCurrentMonth ? "text-gray-400" : ""
                      } ${isToday ? "bg-blue-50 border-2 border-blue-300" : ""} ${
                        isSelected ? "bg-blue-100 border-2 border-blue-500" : ""
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {day.getDate()}
                      </div>

                      <div className="space-y-1 overflow-hidden">
                        {dayReservations
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .slice(0, 6)
                          .map((reservation) => (
                            <div
                              key={reservation.id}
                              className={`p-1 rounded text-xs border w-full ${
                                reservation.isCompleted
                                  ? "bg-green-50 border-green-200"
                                  : "bg-blue-50 border-blue-200"
                              }`}
                              title={`${reservation.startTime}-${reservation.endTime} ${reservation.studentName} ${reservation.serviceName}`}
                            >
                              <div className="text-gray-700 text-xs truncate">
                                <span className="font-medium text-gray-900">
                                  {reservation.startTime}~{reservation.endTime}
                                </span>
                                <span className="ml-1">{reservation.studentName}</span>
                                <span className="ml-1">{reservation.serviceName.includes('대면') ? '대면' : '온라인'}</span>
                                {getStatusIcon(reservation.status, reservation.isTagged)}
                              </div>
                            </div>
                          ))}
                        {dayReservations.length > 6 && (
                          <div className="text-xs text-gray-500 text-center bg-gray-100 rounded px-1 py-0.5">
                            +{dayReservations.length - 6}개 더
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 개요 탭 */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 예약이 없을 때 안내 메시지 */}
          {reservations.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 예약이 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                아직 등록된 예약이 없습니다. 새로운 예약을 생성해보세요.
              </p>
              <button
                onClick={() => window.location.href = '/admin/reservations'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                예약 관리로 이동
              </button>
            </div>
          )}

          {/* 통계 카드 */}
          {reservations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 예약</h3>
              <div className="text-3xl font-bold text-blue-600">
                {reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
              </div>
              <p className="text-gray-600">확정된 예약</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">이번 주 수업</h3>
              <div className="text-3xl font-bold text-green-600">
                {reservations.filter(r => r.isCompleted).length}
              </div>
              <p className="text-gray-600">완료된 수업</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">총 예약</h3>
              <div className="text-3xl font-bold text-purple-600">{reservations.length}</div>
              <p className="text-gray-600">전체 예약</p>
            </div>
          </div>
          )}

          {/* 시스템 정보 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">서버 상태</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600">정상</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">데이터베이스</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600">연결됨</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">마지막 업데이트</h4>
                <span className="text-gray-600">{new Date().toLocaleString()}</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">시스템 버전</h4>
                <span className="text-gray-600">v1.2.3</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
