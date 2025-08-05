"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  Eye,
  MapPin,
} from "lucide-react";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import Navigation from "@/components/common/Navigation";

// 이벤트 텍스트 한 줄 표시를 위한 CSS 스타일
const eventStyles = `
  /* 이벤트 박스 전체 (둥근 모서리 박스) */
  .reservation-item {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    display: block !important;
    max-width: 100% !important;
    width: 100% !important;
    line-height: 1.2 !important;
    height: 1.2em !important;
    flex-shrink: 0 !important;
  }
  
  /* 이벤트 내부 텍스트 */
  .reservation-text,
  .reservation-text * {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    display: inline !important;
  }
  
  /* 이벤트 시간 */
  .event-time {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    display: inline !important;
  }
  
  /* 이벤트 제목 */
  .event-title {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    display: inline !important;
  }
`;

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
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MASTER"]}>
      <div className="min-h-screen bg-gray-50">
        <style dangerouslySetInnerHTML={{ __html: eventStyles }} />
        <Navigation userRole="ADMIN" />
        <div className="ml-64">
          <AdminDashboardContent />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "overview" | "details">("calendar");

  // 샘플 예약 데이터
  useEffect(() => {
    const sampleReservations: Reservation[] = [
      {
        id: "1",
        date: "2025-08-01",
        startTime: "09:00",
        endTime: "09:40",
        studentName: "田中太郎",
        serviceName: "대면 수업 40분",
        teacherName: "佐藤先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "교실 A",
        duration: 40,
      },
      {
        id: "2",
        date: "2025-08-01",
        startTime: "10:00",
        endTime: "11:00",
        studentName: "鈴木花子",
        serviceName: "온라인 수업 60분",
        teacherName: "田中先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "Zoom",
        duration: 60,
      },
      {
        id: "3",
        date: "2025-08-02",
        startTime: "14:00",
        endTime: "14:40",
        studentName: "山田次郎",
        serviceName: "대면 수업 40분",
        teacherName: "佐藤先生",
        status: "completed",
        isCompleted: true,
        isTagged: true,
        tagTime: "14:05",
        location: "교실 B",
        duration: 40,
      },
      {
        id: "4",
        date: "2025-08-03",
        startTime: "15:00",
        endTime: "16:00",
        studentName: "高橋美咲",
        serviceName: "온라인 수업 60분",
        teacherName: "田中先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "Zoom",
        duration: 60,
      },
      {
        id: "5",
        date: "2025-08-05",
        startTime: "11:00",
        endTime: "11:40",
        studentName: "佐々木健太",
        serviceName: "대면 수업 40분",
        teacherName: "佐藤先生",
        status: "cancelled",
        isCompleted: false,
        isTagged: false,
        location: "교실 A",
        duration: 40,
      },
      {
        id: "6",
        date: "2025-08-01",
        startTime: "08:00",
        endTime: "08:40",
        studentName: "伊藤優子",
        serviceName: "온라인 수업 40분",
        teacherName: "田中先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "Zoom",
        duration: 40,
      },
      {
        id: "7",
        date: "2025-08-01",
        startTime: "09:30",
        endTime: "10:30",
        studentName: "渡辺健一",
        serviceName: "대면 수업 60분",
        teacherName: "佐藤先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "교실 B",
        duration: 60,
      },
      {
        id: "8",
        date: "2025-08-01",
        startTime: "10:30",
        endTime: "11:10",
        studentName: "中村美咲",
        serviceName: "온라인 수업 40분",
        teacherName: "田中先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "Zoom",
        duration: 40,
      },
      {
        id: "9",
        date: "2025-08-01",
        startTime: "13:00",
        endTime: "13:40",
        studentName: "小林健太",
        serviceName: "대면 수업 40분",
        teacherName: "佐藤先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "교실 A",
        duration: 40,
      },
      {
        id: "10",
        date: "2025-08-01",
        startTime: "14:00",
        endTime: "15:00",
        studentName: "加藤美咲",
        serviceName: "온라인 수업 60분",
        teacherName: "田中先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "Zoom",
        duration: 60,
      },
      {
        id: "11",
        date: "2025-08-02",
        startTime: "09:00",
        endTime: "09:40",
        studentName: "佐藤花子",
        serviceName: "대면 수업 40분",
        teacherName: "佐藤先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "교실 B",
        duration: 40,
      },
      {
        id: "12",
        date: "2025-08-02",
        startTime: "10:00",
        endTime: "11:00",
        studentName: "田中次郎",
        serviceName: "온라인 수업 60분",
        teacherName: "田中先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "Zoom",
        duration: 60,
      },
      {
        id: "13",
        date: "2025-08-03",
        startTime: "11:00",
        endTime: "11:40",
        studentName: "山田太郎",
        serviceName: "대면 수업 40분",
        teacherName: "佐藤先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "교실 A",
        duration: 40,
      },
      {
        id: "14",
        date: "2025-08-04",
        startTime: "15:00",
        endTime: "16:00",
        studentName: "高橋美咲",
        serviceName: "온라인 수업 60분",
        teacherName: "田中先生",
        status: "confirmed",
        isCompleted: false,
        isTagged: false,
        location: "Zoom",
        duration: 60,
      },
      {
        id: "15",
        date: "2025-08-05",
        startTime: "11:00",
        endTime: "11:40",
        studentName: "佐々木健太",
        serviceName: "대면 수업 40분",
        teacherName: "佐藤先生",
        status: "cancelled",
        isCompleted: false,
        isTagged: false,
        location: "교실 A",
        duration: 40,
      },
    ];
    setReservations(sampleReservations);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // 월요일 시작
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // 일요일 끝

    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // 월요일 시작
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getReservationsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return reservations.filter(
      (reservation) => reservation.date === dateString,
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "no-show":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string, isTagged: boolean) => {
    if (isTagged) {
      return <CheckCircle className="w-3 h-3 text-green-600" />;
    }
    switch (status) {
      case "confirmed":
        return <AlertCircle className="w-3 h-3 text-blue-600" />;
      case "completed":
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-3 h-3 text-red-600" />;
      case "no-show":
        return <XCircle className="w-3 h-3 text-yellow-600" />;
      default:
        return null;
    }
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const formatDate = (date: Date) => {
    if (viewMode === "month") {
      return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
      });
    } else if (viewMode === "week") {
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}`;
    } else {
      return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return slots;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);
  const timeSlots = getTimeSlots();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
          
          {/* 탭 메뉴 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "calendar"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              예약 일정
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              개요
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "details"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              상세정보
            </button>
          </div>
        </div>

        {/* 캘린더 뷰 모드 (캘린더 탭에서만 표시) */}
        {activeTab === "calendar" && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                월별
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                주별
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "day"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                일별
              </button>
            </div>

            <div className="flex items-center space-x-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="font-medium">{formatDate(currentDate)}</span>
          </button>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 날짜 선택기 */}
      {showDatePicker && (
        <div className="absolute top-20 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10">
          <input
            type="month"
            value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-");
              setCurrentDate(new Date(parseInt(year), parseInt(month) - 1, 1));
              setShowDatePicker(false);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* 탭 콘텐츠 */}
      {activeTab === "calendar" && (
        <>
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

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {days.map((day, index) => {
              const dayReservations = getReservationsForDate(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected =
                selectedDate &&
                day.toDateString() === selectedDate.toDateString();

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[180px] p-1 bg-white cursor-pointer hover:bg-gray-50 transition-colors calendar-cell ${
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
                      .sort((a, b) => {
                        // 시작 시간으로 정렬
                        if (a.startTime !== b.startTime) {
                          return a.startTime.localeCompare(b.startTime);
                        }
                        // 시작 시간이 같으면 끝나는 시간으로 정렬
                        return a.endTime.localeCompare(b.endTime);
                      })
                      .slice(0, 6)
                      .map((reservation) => (
                        <div
                          key={reservation.id}
                          className={`p-1 rounded text-xs border w-full reservation-item ${
                            reservation.isCompleted
                              ? "bg-green-50 border-green-200"
                              : "bg-blue-50 border-blue-200"
                          }`}
                          title={`${reservation.startTime}-${reservation.endTime} ${reservation.studentName} ${reservation.serviceName} ${reservation.duration}분`}
                        >
                          <div className="text-gray-700 text-xs reservation-text">
                            <span className="font-medium text-gray-900 event-time">
                              {reservation.startTime}~{reservation.endTime}
                            </span>
                            <span className="ml-1">{reservation.studentName}</span>
                            <span className="ml-1">{reservation.serviceName.includes('대면') ? '대면' : '온라인'}</span>
                            <span className="ml-1 text-gray-500">{reservation.duration || 40}분</span>
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
        </div>
      )}

      {/* 주별 뷰 */}
      {viewMode === "week" && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-8 gap-px bg-gray-200 border-b">
            <div className="p-3 text-center text-sm font-medium text-gray-700 bg-white border-r">
              시간
            </div>
            {weekDays.map((day, dayIndex) => (
              <div
                key={day.toDateString()}
                className={`p-3 text-center text-sm font-medium text-gray-700 bg-white ${
                  dayIndex === 6 ? 'border-r-0' : 'border-r'
                }`}
              >
                <div>
                  {day.toLocaleDateString("ja-JP", { weekday: "short" })}
                </div>
                <div className="text-xs text-gray-500">{day.getDate()}</div>
              </div>
            ))}
          </div>

          {/* 시간별 그리드 */}
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot} className="bg-white">
                <div className="p-2 text-xs text-gray-500 border-r border-b">
                  {timeSlot}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayReservations = getReservationsForDate(day);
                  const timeReservations = dayReservations.filter(
                    (reservation) => reservation.startTime === timeSlot,
                  );

                  return (
                    <div
                      key={`${day.toDateString()}-${timeSlot}`}
                      className={`min-h-[60px] p-1 border-b ${
                        dayIndex === 6 ? 'border-r-0' : 'border-r'
                      }`}
                    >
                      {timeReservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          className={`p-1 rounded text-xs border w-full reservation-item ${
                            reservation.isCompleted
                              ? "bg-green-50 border-green-200"
                              : "bg-blue-50 border-blue-200"
                          }`}
                        >
                          <div className="reservation-text">
                            <span className="font-medium event-time">
                              {reservation.startTime}~{reservation.endTime}
                            </span>
                            <span className="ml-1">{reservation.studentName}</span>
                            <span className="ml-1">{reservation.serviceName.includes('대면') ? '대면' : '온라인'}</span>
                            <span className="ml-1 text-gray-500">{reservation.duration || 40}분</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 일별 뷰 */}
      {viewMode === "day" && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          {/* 날짜 헤더 */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </h3>
          </div>

          {/* 시간별 예약 목록 */}
          <div className="divide-y divide-gray-200">
            {timeSlots.map((timeSlot) => {
              const dayReservations = getReservationsForDate(currentDate);
              const timeReservations = dayReservations.filter(
                (reservation) => reservation.startTime === timeSlot,
              );

              return (
                <div key={timeSlot} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {timeSlot}
                    </h4>
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {timeReservations.length > 0 ? (
                    <div className="space-y-2">
                      {timeReservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="reservation-text">
                              <span className="font-medium event-time">
                                {reservation.startTime}~{reservation.endTime}
                              </span>
                              <span className="ml-2">{reservation.studentName}</span>
                              <span className="ml-2">{reservation.serviceName.includes('대면') ? '대면' : '온라인'}</span>
                              <span className="ml-2 text-gray-500">{reservation.duration || 40}분</span>
                              <span
                                className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}
                              >
                                {reservation.status === "confirmed" && "확정"}
                                {reservation.status === "completed" && "완료"}
                                {reservation.status === "cancelled" && "취소"}
                                {reservation.status === "no-show" && "미도착"}
                              </span>
                            </div>
                            {reservation.tagTime && (
                              <div className="text-sm text-green-600 mt-1">
                                출석 태깅: {reservation.tagTime}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {reservation.isCompleted ? (
                              <>
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      해당 시간에 예약이 없습니다.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 선택된 날짜의 상세 정보 (월별 뷰에서만 표시) */}
      {selectedDate && viewMode === "month" && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            {selectedDate.toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            예약 목록
          </h3>

          <div className="space-y-3">
            {getReservationsForDate(selectedDate).map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="reservation-text">
                    <span className="font-medium event-time">
                      {reservation.startTime}~{reservation.endTime}
                    </span>
                    <span className="ml-2">{reservation.studentName}</span>
                    <span className="ml-2">{reservation.serviceName.includes('대면') ? '대면' : '온라인'}</span>
                    <span className="ml-2 text-gray-500">{reservation.duration || 40}분</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}
                    >
                      {reservation.status === "confirmed" && "확정"}
                      {reservation.status === "completed" && "완료"}
                      {reservation.status === "cancelled" && "취소"}
                      {reservation.status === "no-show" && "미도착"}
                    </span>
                  </div>
                  {reservation.tagTime && (
                    <div className="text-sm text-green-600 mt-1">
                      출석 태깅: {reservation.tagTime}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {reservation.isCompleted ? (
                    <>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {getReservationsForDate(selectedDate).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                해당 날짜에 예약이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {/* 개요 탭 */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 예약</h3>
              <div className="text-3xl font-bold text-blue-600">12</div>
              <p className="text-gray-600">확정된 예약</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">이번 주 수업</h3>
              <div className="text-3xl font-bold text-green-600">45</div>
              <p className="text-gray-600">완료된 수업</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">총 수익</h3>
              <div className="text-3xl font-bold text-purple-600">₩2,450,000</div>
              <p className="text-gray-600">이번 달</p>
            </div>
          </div>
        </div>
      )}

      {/* 상세정보 탭 */}
      {activeTab === "details" && (
        <div className="space-y-6">
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
                <h4 className="font-medium text-gray-700 mb-2">마지막 백업</h4>
                <span className="text-gray-600">2025-08-05 14:30</span>
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
