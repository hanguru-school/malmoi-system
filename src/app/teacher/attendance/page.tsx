'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  MapPin,
  Wifi,
  User,
  Home
} from 'lucide-react';
import Link from 'next/link';

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'leave_early';
  location: 'office' | 'remote' | 'classroom';
  notes?: string;
}

export default function TeacherAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          date: '2024-01-15',
          checkInTime: '08:30',
          checkOutTime: '17:30',
          status: 'present',
          location: 'office',
          notes: '정상 출근'
        },
        {
          id: '2',
          date: '2024-01-14',
          checkInTime: '08:45',
          checkOutTime: '17:15',
          status: 'present',
          location: 'office'
        },
        {
          id: '3',
          date: '2024-01-13',
          checkInTime: '09:15',
          checkOutTime: '17:30',
          status: 'late',
          location: 'office',
          notes: '교통 지연'
        },
        {
          id: '4',
          date: '2024-01-12',
          checkInTime: '08:30',
          checkOutTime: '16:00',
          status: 'leave_early',
          location: 'office',
          notes: '개인 사정'
        }
      ];

      setAttendanceRecords(mockRecords);
      
      // 오늘 출근 기록 확인
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = mockRecords.find(record => record.date === today);
      setTodayRecord(todayRecord || null);
      setIsCheckedIn(!!todayRecord);
      
      setLoading(false);
    }, 1000);

    // 현재 시간 업데이트
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      checkInTime: new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      status: 'present',
      location: 'office'
    };

    setTodayRecord(newRecord);
    setIsCheckedIn(true);
    setAttendanceRecords(prev => [newRecord, ...prev]);
  };

  const handleCheckOut = () => {
    if (todayRecord) {
      const updatedRecord = {
        ...todayRecord,
        checkOutTime: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      };

      setTodayRecord(updatedRecord);
      setAttendanceRecords(prev => 
        prev.map(record => 
          record.id === todayRecord.id ? updatedRecord : record
        )
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'leave_early':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return '정상';
      case 'absent':
        return '결근';
      case 'late':
        return '지각';
      case 'leave_early':
        return '조퇴';
      default:
        return '알 수 없음';
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'office':
        return <MapPin className="w-4 h-4" />;
      case 'remote':
        return <Wifi className="w-4 h-4" />;
      case 'classroom':
        return <User className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getLocationText = (location: string) => {
    switch (location) {
      case 'office':
        return '사무실';
      case 'remote':
        return '원격';
      case 'classroom':
        return '교실';
      default:
        return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              출근 관리
            </h1>
            <p className="text-lg text-gray-600">
              출근 기록 및 근무 시간 관리
            </p>
          </div>
          <Link
            href="/teacher/home"
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            선생님 홈
          </Link>
        </div>

        {/* 현재 시간 및 출근 상태 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-900 mb-4">
              {currentTime.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}
            </div>
            <div className="text-xl text-gray-600 mb-6">
              {currentTime.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </div>

            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
              >
                <CheckCircle className="w-6 h-6" />
                출근하기
              </button>
            ) : (
              <div className="space-y-4">
                <div className="text-lg text-green-600 font-semibold">
                  출근 완료: {todayRecord?.checkInTime}
                </div>
                {!todayRecord?.checkOutTime && (
                  <button
                    onClick={handleCheckOut}
                    className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg font-semibold"
                  >
                    <XCircle className="w-6 h-6" />
                    퇴근하기
                  </button>
                )}
                {todayRecord?.checkOutTime && (
                  <div className="text-lg text-red-600 font-semibold">
                    퇴근 완료: {todayRecord.checkOutTime}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 이번 주 출근 현황 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">이번 주 출근 현황</h2>
          
          <div className="grid grid-cols-7 gap-4">
            {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => {
              const dayRecords = attendanceRecords.filter(record => {
                const recordDate = new Date(record.date);
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                return recordDate >= weekStart && recordDate <= weekEnd && 
                       recordDate.getDay() === (index + 1) % 7;
              });

              const record = dayRecords[0];
              
              return (
                <div key={day} className="text-center">
                  <div className="text-sm font-medium text-gray-600 mb-2">{day}</div>
                  <div className={`p-3 rounded-lg ${
                    record 
                      ? record.status === 'present' 
                        ? 'bg-green-100 text-green-800' 
                        : record.status === 'late'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {record ? (
                      <div>
                        <div className="text-xs">{record.checkInTime}</div>
                        <div className="text-xs">{getStatusText(record.status)}</div>
                      </div>
                    ) : (
                      <div className="text-xs">-</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 출근 기록 목록 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">출근 기록</h2>
          
          <div className="space-y-4">
            {attendanceRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(record.date).getDate()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(record.date).toLocaleDateString('ko-KR', { month: 'short' })}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500">
                        {getLocationIcon(record.location)}
                        <span className="text-sm">{getLocationText(record.location)}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      출근: {record.checkInTime}
                      {record.checkOutTime && ` | 퇴근: ${record.checkOutTime}`}
                    </div>
                    {record.notes && (
                      <div className="text-xs text-gray-500 mt-1">{record.notes}</div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {record.checkInTime && record.checkOutTime && (
                      <span>근무시간 계산</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 