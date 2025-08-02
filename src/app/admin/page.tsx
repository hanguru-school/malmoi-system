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
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MASTER"]}>
      <div className="min-h-screen bg-gray-50">
        <Navigation userRole="ADMIN" />
        <AdminDashboardContent />
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
          <h1 className="text-2xl font-bold text-gray-900">예약 일정 관리</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("month")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              월별
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              주별
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "day"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              일별
            </button>
          </div>
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
                  className={`min-h-[120px] p-2 bg-white cursor-pointer hover:bg-gray-50 transition-colors ${
                    !isCurrentMonth ? "text-gray-400" : ""
                  } ${isToday ? "bg-blue-50 border-2 border-blue-300" : ""} ${
                    isSelected ? "bg-blue-100 border-2 border-blue-500" : ""
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {day.getDate()}
                  </div>

                  <div className="space-y-1">
                    {dayReservations.slice(0, 2).map((reservation) => (
                      <div
                        key={reservation.id}
                        className={`p-1 rounded-lg text-xs border ${
                          reservation.isCompleted
                            ? "bg-green-50 border-green-200"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {reservation.startTime}-{reservation.endTime}
                          </span>
                          {getStatusIcon(
                            reservation.status,
                            reservation.isTagged,
                          )}
                        </div>
                        <div className="text-gray-700">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{reservation.studentName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{reservation.serviceName}</span>
                          </div>
                        </div>
                        {reservation.tagTime && (
                          <div className="text-xs text-green-600 mt-1">
                            태깅: {reservation.tagTime}
                          </div>
                        )}
                      </div>
                    ))}
                    {dayReservations.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayReservations.length - 2} more
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
            <div className="p-3 text-center text-sm font-medium text-gray-700 bg-white">
              시간
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toDateString()}
                className="p-3 text-center text-sm font-medium text-gray-700 bg-white"
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
                {weekDays.map((day) => {
                  const dayReservations = getReservationsForDate(day);
                  const timeReservations = dayReservations.filter(
                    (reservation) => reservation.startTime === timeSlot,
                  );

                  return (
                    <div
                      key={`${day.toDateString()}-${timeSlot}`}
                      className="min-h-[60px] p-1 border-r border-b"
                    >
                      {timeReservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          className={`p-1 rounded text-xs border ${
                            reservation.isCompleted
                              ? "bg-green-50 border-green-200"
                              : "bg-blue-50 border-blue-200"
                          }`}
                        >
                          <div className="font-medium">
                            {reservation.studentName}
                          </div>
                          <div className="text-gray-600">
                            {reservation.serviceName}
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-2 h-2" />
                            <span className="text-xs">
                              {reservation.location}
                            </span>
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
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">
                                  {reservation.startTime} -{" "}
                                  {reservation.endTime}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span>{reservation.studentName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                                <span>{reservation.serviceName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span>{reservation.location}</span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}
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
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        {reservation.startTime} - {reservation.endTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{reservation.studentName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span>{reservation.serviceName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{reservation.location}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}
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
    </div>
  );
}
