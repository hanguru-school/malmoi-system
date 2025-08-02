"use client";

import { useState, useEffect } from "react";
import {
  Search,
  User,
  Calendar,
  CreditCard,
  MessageSquare,
  Star,
  Settings,
  Plus,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  uid: string;
  totalPurchasedTime: number;
  totalUsedTime: number;
  remainingTime: number;
}

interface Reservation {
  id: string;
  bookingCode: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: "in-person" | "online";
  studentName: string;
  studentId: string;
  teacherName: string;
  courseName: string;
  status:
    | "scheduled"
    | "completed"
    | "pre-cancelled"
    | "day-before-cancelled"
    | "same-day-cancelled";
  completionStatus: "not-started" | "in-progress" | "completed";
  memo?: string;
  location?: string;
}

interface Memo {
  id: string;
  createdAt: string;
  authorName: string;
  authorId: string;
  content: string;
  type: "class" | "consultation" | "accounting" | "general";
  permission: "admin-only" | "teacher-public";
  studentName?: string;
  studentId?: string;
  relatedReservationId?: string;
}

interface SentMessage {
  id: string;
  sendTime: string;
  recipientName: string;
  recipientUid: string;
  channel: "email" | "line" | "push";
  messageType:
    | "booking_confirmation"
    | "cancellation"
    | "reminder"
    | "review_request"
    | "completion"
    | "other";
  content: string;
  status: "sent" | "delivered" | "failed" | "pending";
}

interface Review {
  id: string;
  authorName: string;
  authorUid: string;
  classDate: string;
  courseName: string;
  teacherName: string;
  reviewDate: string;
  rating: number;
  content: string;
  replyStatus: "no_reply" | "replied";
  adminReply?: string;
  replyDate?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type:
    | "booking_confirmation"
    | "cancellation"
    | "reminder"
    | "review_request"
    | "completion"
    | "low_balance"
    | "other";
  title: string;
  body: string;
  isActive: boolean;
  channels: ("email" | "line" | "push")[];
}

export default function IntegratedAdminPage() {
  const [activeTab, setActiveTab] = useState("reservations");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 데이터 상태
  const [students, setStudents] = useState<Student[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedStudent || selectedReservation) {
      fetchRelatedData();
    }
  }, [selectedStudent, selectedReservation]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 실제 API 호출로 대체
      const mockStudents: Student[] = [
        {
          id: "1",
          name: "김학생",
          email: "kim@example.com",
          uid: "ST001",
          totalPurchasedTime: 1200,
          totalUsedTime: 800,
          remainingTime: 400,
        },
        {
          id: "2",
          name: "박학생",
          email: "park@example.com",
          uid: "ST002",
          totalPurchasedTime: 1800,
          totalUsedTime: 1200,
          remainingTime: 600,
        },
      ];

      const mockReservations: Reservation[] = [
        {
          id: "1",
          bookingCode: "BK001",
          bookingDate: "2024-01-15",
          startTime: "14:00",
          endTime: "15:00",
          duration: 60,
          type: "online",
          studentName: "김학생",
          studentId: "1",
          teacherName: "이선생님",
          courseName: "초급 한국어",
          status: "completed",
          completionStatus: "completed",
        },
        {
          id: "2",
          bookingCode: "BK002",
          bookingDate: "2024-01-16",
          startTime: "16:00",
          endTime: "17:00",
          duration: 60,
          type: "in-person",
          studentName: "박학생",
          studentId: "2",
          teacherName: "김선생님",
          courseName: "중급 한국어",
          status: "scheduled",
          completionStatus: "not-started",
        },
      ];

      setStudents(mockStudents);
      setReservations(mockReservations);
    } catch (error) {
      console.error("초기 데이터 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const studentId = selectedStudent?.id || selectedReservation?.studentId;
      if (!studentId) return;

      // 실제 API 호출로 대체
      const mockMemos: Memo[] = [
        {
          id: "1",
          createdAt: "2024-01-15T10:30:00",
          authorName: "이선생님",
          authorId: "T001",
          content:
            "수업 중 학생이 문법에 어려움을 보임. 다음 수업에서 더 자세히 설명 필요.",
          type: "class",
          permission: "teacher-public",
          studentName:
            selectedStudent?.name || selectedReservation?.studentName,
          studentId: studentId,
          relatedReservationId: selectedReservation?.id,
        },
      ];

      const mockMessages: SentMessage[] = [
        {
          id: "1",
          sendTime: "2024-01-15T10:00:00",
          recipientName:
            selectedStudent?.name || selectedReservation?.studentName || "",
          recipientUid: selectedStudent?.uid || "",
          channel: "email",
          messageType: "booking_confirmation",
          content: "예약이 확정되었습니다.",
          status: "delivered",
        },
      ];

      const mockReviews: Review[] = [
        {
          id: "1",
          authorName:
            selectedStudent?.name || selectedReservation?.studentName || "",
          authorUid: selectedStudent?.uid || "",
          classDate: "2024-01-15",
          courseName: selectedReservation?.courseName || "",
          teacherName: selectedReservation?.teacherName || "",
          reviewDate: "2024-01-16",
          rating: 5,
          content: "매우 만족스러운 수업이었습니다.",
          replyStatus: "no_reply",
        },
      ];

      const mockTemplates: NotificationTemplate[] = [
        {
          id: "1",
          name: "예약 확정 알림",
          type: "booking_confirmation",
          title: "예약이 확정되었습니다",
          body: "{名前}님, {予約日時} {コース名} 수업 예약이 확정되었습니다.",
          isActive: true,
          channels: ["email", "line"],
        },
      ];

      setMemos(mockMemos);
      setMessages(mockMessages);
      setReviews(mockReviews);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error("관련 데이터 로딩 실패:", error);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSelectedReservation(null);
  };

  const handleReservationSelect = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setSelectedStudent(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
      case "pre-cancelled":
      case "day-before-cancelled":
      case "same-day-cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "완료";
      case "scheduled":
        return "예약됨";
      case "pre-cancelled":
        return "사전취소";
      case "day-before-cancelled":
        return "전일취소";
      case "same-day-cancelled":
        return "당일취소";
      default:
        return "알 수 없음";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR");
  };

  const formatTime = (minutes: number) => {
    return `${minutes}분`;
  };

  const tabs = [
    { id: "reservations", name: "예약 세부 내용", icon: Calendar },
    { id: "payments", name: "고객 결제 정보", icon: CreditCard },
    { id: "memos", name: "메모 및 세무 내용", icon: MessageSquare },
    { id: "messages", name: "송신 메시지 관리", icon: MessageSquare },
    { id: "reviews", name: "리뷰 관리", icon: Star },
    { id: "notifications", name: "푸시 알림 설정", icon: Settings },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">통합 관리자 페이지</h1>
        <p className="text-gray-600">
          학생 및 예약 관련 모든 정보를 통합 관리합니다.
        </p>
      </div>

      {/* 선택 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 학생 선택 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">학생 선택</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="학생명, 이메일, UID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {students
              .filter(
                (student) =>
                  student.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  student.email
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  student.uid.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    selectedStudent?.id === student.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-600">
                        {student.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        UID: {student.uid}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatTime(student.remainingTime)} 남음
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* 예약 선택 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">예약 선택</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {reservations.map((reservation) => (
              <button
                key={reservation.id}
                onClick={() => handleReservationSelect(reservation)}
                className={`w-full p-3 text-left rounded-lg border transition-colors ${
                  selectedReservation?.id === reservation.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{reservation.studentName}</div>
                    <div className="text-sm text-gray-600">
                      {reservation.bookingDate} {reservation.startTime}-
                      {reservation.endTime}
                    </div>
                    <div className="text-xs text-gray-500">
                      {reservation.courseName} • {reservation.teacherName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}
                    >
                      {getStatusText(reservation.status)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {reservation.bookingCode}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 선택된 항목 정보 */}
      {(selectedStudent || selectedReservation) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">선택된 항목 정보</h3>
          {selectedStudent && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  학생 정보
                </div>
                <div className="text-lg font-semibold">
                  {selectedStudent.name}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedStudent.email}
                </div>
                <div className="text-xs text-gray-500">
                  UID: {selectedStudent.uid}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  구매 시간
                </div>
                <div className="text-lg font-semibold">
                  {formatTime(selectedStudent.totalPurchasedTime)}
                </div>
                <div className="text-sm text-gray-600">총 구매</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  남은 시간
                </div>
                <div className="text-lg font-semibold text-blue-600">
                  {formatTime(selectedStudent.remainingTime)}
                </div>
                <div className="text-sm text-gray-600">사용 가능</div>
              </div>
            </div>
          )}
          {selectedReservation && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  예약 정보
                </div>
                <div className="text-lg font-semibold">
                  {selectedReservation.studentName}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedReservation.bookingCode}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedReservation.courseName}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  수업 일정
                </div>
                <div className="text-lg font-semibold">
                  {selectedReservation.bookingDate}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedReservation.startTime}-{selectedReservation.endTime}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedReservation.teacherName}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">상태</div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReservation.status)}`}
                >
                  {getStatusText(selectedReservation.status)}
                </span>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedReservation.type}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="p-6">
          {!selectedStudent && !selectedReservation ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                학생 또는 예약을 선택하세요
              </h3>
              <p className="text-gray-600">
                위에서 학생이나 예약을 선택하면 관련 정보를 확인할 수 있습니다.
              </p>
            </div>
          ) : (
            <div>
              {/* 예약 세부 내용 탭 */}
              {activeTab === "reservations" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">예약 세부 내용</h3>
                  <div className="space-y-4">
                    {reservations
                      .filter((r) =>
                        selectedStudent
                          ? r.studentId === selectedStudent.id
                          : r.id === selectedReservation?.id,
                      )
                      .map((reservation) => (
                        <div
                          key={reservation.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">
                              {reservation.bookingCode}
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}
                            >
                              {getStatusText(reservation.status)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">학생:</span>{" "}
                              {reservation.studentName}
                            </div>
                            <div>
                              <span className="text-gray-600">선생님:</span>{" "}
                              {reservation.teacherName}
                            </div>
                            <div>
                              <span className="text-gray-600">코스:</span>{" "}
                              {reservation.courseName}
                            </div>
                            <div>
                              <span className="text-gray-600">시간:</span>{" "}
                              {reservation.startTime}-{reservation.endTime}
                            </div>
                            <div>
                              <span className="text-gray-600">유형:</span>{" "}
                              {reservation.type}
                            </div>
                            <div>
                              <span className="text-gray-600">완료:</span>{" "}
                              {reservation.completionStatus}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 고객 결제 정보 탭 */}
              {activeTab === "payments" && selectedStudent && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">고객 결제 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">총 구매 시간</div>
                      <div className="text-2xl font-bold">
                        {formatTime(selectedStudent.totalPurchasedTime)}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">사용한 시간</div>
                      <div className="text-2xl font-bold">
                        {formatTime(selectedStudent.totalUsedTime)}
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">남은 시간</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatTime(selectedStudent.remainingTime)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      <span>시간 구매</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 메모 및 세무 내용 탭 */}
              {activeTab === "memos" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    메모 및 세무 내용
                  </h3>
                  <div className="space-y-4">
                    {memos.map((memo) => (
                      <div key={memo.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{memo.authorName}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(memo.createdAt)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {memo.type}
                        </div>
                        <div className="text-gray-900">{memo.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 송신 메시지 관리 탭 */}
              {activeTab === "messages" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    송신 메시지 관리
                  </h3>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {message.recipientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(message.sendTime)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {message.channel} • {message.messageType}
                        </div>
                        <div className="text-gray-900">{message.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 리뷰 관리 탭 */}
              {activeTab === "reviews" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">리뷰 관리</h3>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{review.authorName}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(review.reviewDate)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {review.courseName} • {review.teacherName} • ⭐{" "}
                          {review.rating}/5
                        </div>
                        <div className="text-gray-900">{review.content}</div>
                        {review.replyStatus === "replied" &&
                          review.adminReply && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <div className="text-sm font-medium text-blue-800">
                                관리자 답변:
                              </div>
                              <div className="text-sm text-blue-700">
                                {review.adminReply}
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 푸시 알림 설정 탭 */}
              {activeTab === "notifications" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">푸시 알림 설정</h3>
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{template.name}</div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              template.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {template.isActive ? "활성" : "비활성"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {template.type}
                        </div>
                        <div className="text-gray-900">{template.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {template.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
