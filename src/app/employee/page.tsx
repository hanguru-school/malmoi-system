'use client';

import { useState, useEffect } from 'react';
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
  Eye,
  Video,
  MapPin
} from 'lucide-react';

interface Lesson {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  studentName: string;
  serviceName: string;
  lessonType: 'face-to-face' | 'online';
  isTagged: boolean;
  tagTime?: string;
  zoomLink?: string;
  memo?: string;
}

export default function EmployeeSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 샘플 수업 데이터
  useEffect(() => {
    const sampleLessons: Lesson[] = [
      {
        id: '1',
        date: '2025-01-15',
        startTime: '09:00',
        endTime: '09:40',
        studentName: '田中太郎',
        serviceName: '대면 수업 40분',
        lessonType: 'face-to-face',
        isTagged: true,
        tagTime: '09:05',
        memo: '발음 교정에 집중'
      },
      {
        id: '2',
        date: '2025-01-15',
        startTime: '10:00',
        endTime: '11:00',
        studentName: '鈴木花子',
        serviceName: '온라인 수업 60분',
        lessonType: 'online',
        isTagged: false,
        zoomLink: 'https://zoom.us/j/123456789'
      },
      {
        id: '3',
        date: '2025-01-16',
        startTime: '14:00',
        endTime: '14:40',
        studentName: '山田次郎',
        serviceName: '대면 수업 40분',
        lessonType: 'face-to-face',
        isTagged: true,
        tagTime: '14:02'
      }
    ];
    setLessons(sampleLessons);
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

  const getLessonsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return lessons.filter(lesson => lesson.date === dateStr);
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + 1);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const handlePreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
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
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getLessonTypeIcon = (type: string) => {
    return type === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />;
  };

  const getTaggingStatus = (isTagged: boolean) => {
    return isTagged ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <AlertCircle className="w-4 h-4 text-yellow-600" />
    );
  };

  const renderDayView = () => {
    const dayLessons = getLessonsForDate(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
        
        <div className="space-y-3">
          {dayLessons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              이 날의 수업이 없습니다.
            </div>
          ) : (
            dayLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">
                      {lesson.startTime} - {lesson.endTime}
                    </span>
                    {getLessonTypeIcon(lesson.lessonType)}
                    <span className="text-sm text-gray-500">
                      {lesson.lessonType === 'online' ? '온라인' : '대면'}
                    </span>
                  </div>
                  {getTaggingStatus(lesson.isTagged)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{lesson.studentName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{lesson.serviceName}</span>
                  </div>
                  {lesson.zoomLink && (
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4 text-blue-500" />
                      <a 
                        href={lesson.zoomLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Zoom 링크
                      </a>
                    </div>
                  )}
                  {lesson.tagTime && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>출석 태깅: {lesson.tagTime}</span>
                    </div>
                  )}
                  {lesson.memo && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                      <span className="font-medium">메모:</span> {lesson.memo}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => {
            const dayLessons = getLessonsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[200px] p-2 border border-gray-200 ${
                  isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                }`}
              >
                <div className="text-sm font-medium mb-2">
                  {day.toLocaleDateString('ja-JP', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                
                <div className="space-y-1">
                  {dayLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`p-2 rounded text-xs ${
                        lesson.isTagged 
                          ? 'bg-green-100 border border-green-200' 
                          : 'bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <div className="font-medium">
                        {lesson.startTime}-{lesson.endTime}
                      </div>
                      <div className="text-gray-700 truncate">
                        {lesson.studentName}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        {getLessonTypeIcon(lesson.lessonType)}
                        {getTaggingStatus(lesson.isTagged)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    
    return (
      <div className="bg-white rounded-lg shadow">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
          {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-white">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day, index) => {
            const dayLessons = getLessonsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`min-h-[120px] p-2 bg-white cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonth ? 'text-gray-400' : ''
                } ${isToday ? 'bg-blue-50 border-2 border-blue-300' : ''} ${
                  isSelected ? 'bg-blue-100 border-2 border-blue-500' : ''
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`p-1 rounded text-xs ${
                        lesson.isTagged 
                          ? 'bg-green-100 border border-green-200' 
                          : 'bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {lesson.startTime}-{lesson.endTime}
                        </span>
                        {getTaggingStatus(lesson.isTagged)}
                      </div>
                      <div className="text-gray-700">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{lesson.studentName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getLessonTypeIcon(lesson.lessonType)}
                          <span className="text-xs">
                            {lesson.lessonType === 'online' ? '온라인' : '대면'}
                          </span>
                        </div>
                      </div>
                      {lesson.tagTime && (
                        <div className="text-xs text-green-600 mt-1">
                          태깅: {lesson.tagTime}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">내 수업 일정</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'day' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              일별
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              주별
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              월별
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handlePreviousPeriod}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="font-medium">{formatDate(currentDate)}</span>
          </button>

          <button
            onClick={handleNextPeriod}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 날짜 선택기 */}
      {showDatePicker && (
        <div className="absolute top-20 right-4 bg-white border border-gray-300 rounded-md shadow-lg p-4 z-10">
          <input
            type="date"
            value={currentDate.toISOString().split('T')[0]}
            onChange={(e) => {
              setCurrentDate(new Date(e.target.value));
              setShowDatePicker(false);
            }}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      )}

      {/* 캘린더 뷰 */}
      <div className="bg-white rounded-lg shadow p-6">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </div>

      {/* 선택된 날짜의 상세 정보 */}
      {selectedDate && viewMode === 'month' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate.toLocaleDateString('ja-JP', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} 수업 목록
          </h3>
          
          <div className="space-y-3">
            {getLessonsForDate(selectedDate).map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        {lesson.startTime} - {lesson.endTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{lesson.studentName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span>{lesson.serviceName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getLessonTypeIcon(lesson.lessonType)}
                      <span className="text-sm text-gray-500">
                        {lesson.lessonType === 'online' ? '온라인' : '대면'}
                      </span>
                    </div>
                  </div>
                  {lesson.tagTime && (
                    <div className="text-sm text-green-600 mt-1">
                      출석 태깅: {lesson.tagTime}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-md">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {getLessonsForDate(selectedDate).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                해당 날짜에 수업이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 