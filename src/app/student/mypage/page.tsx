'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Star, 
  Edit, 
  Save, 
  History,
  Home,
  Phone,
  Mail,
  MapPin,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  level: number;
  points: number;
  joinDate: string;
  lastModified?: string;
  modificationHistory: ModificationHistory[];
}

interface ModificationHistory {
  date: string;
  field: string;
  oldValue: string;
  newValue: string;
}

interface ReservationHistory {
  id: string;
  serviceName: string;
  teacherName: string;
  date: string;
  status: string;
}

export default function StudentMyPage() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [reservationHistory, setReservationHistory] = useState<ReservationHistory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // 편집용 임시 데이터
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // 학생 정보 조회
  const fetchStudentInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/profile');
      const data = await response.json();
      
      if (data.success) {
        setStudentInfo(data.student);
        setEditData({
          name: data.student.name,
          email: data.student.email,
          phone: data.student.phone,
          address: data.student.address
        });
      }
    } catch (error) {
      console.error('학생 정보 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 예약 이력 조회
  const fetchReservationHistory = async () => {
    try {
      const response = await fetch('/api/student/reservations/history');
      const data = await response.json();
      
      if (data.success) {
        setReservationHistory(data.reservations);
      }
    } catch (error) {
      console.error('예약 이력 조회 실패:', error);
    }
  };

  // 정보 수정
  const updateProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('정보가 성공적으로 수정되었습니다');
        setIsEditing(false);
        fetchStudentInfo();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || '정보 수정 실패');
      }
    } catch (error) {
      setMessage('정보 수정 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  // 편집 모드 토글
  const toggleEdit = () => {
    if (isEditing) {
      // 편집 취소 시 원래 데이터로 복원
      if (studentInfo) {
        setEditData({
          name: studentInfo.name,
          email: studentInfo.email,
          phone: studentInfo.phone,
          address: studentInfo.address
        });
      }
    }
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    fetchStudentInfo();
    fetchReservationHistory();
  }, []);

  if (loading && !studentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              마이페이지
            </h1>
            <p className="text-lg text-gray-600">
              내 정보 관리 및 이력 확인
            </p>
          </div>
          <Link
            href="/student/home"
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            학생 홈
          </Link>
        </div>

        {/* 메시지 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('성공') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 개인 정보 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                개인 정보
              </h2>
              <button
                onClick={toggleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    저장
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    수정
                  </>
                )}
              </button>
            </div>

            {studentInfo && (
              <div className="space-y-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-500" />
                      <span>{studentInfo.name}</span>
                    </div>
                  )}
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <span>{studentInfo.email}</span>
                    </div>
                  )}
                </div>

                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <span>{studentInfo.phone}</span>
                    </div>
                  )}
                </div>

                {/* 주소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editData.address}
                      onChange={(e) => setEditData({...editData, address: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-start gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                      <span>{studentInfo.address}</span>
                    </div>
                  )}
                </div>

                {/* 레벨 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현재 레벨
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                    {Array.from({ length: studentInfo.level }, (_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                    <span className="ml-2">레벨 {studentInfo.level}</span>
                  </div>
                </div>

                {/* 포인트 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    보유 포인트
                  </label>
                  <div className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <span className="text-2xl font-bold text-orange-600">{studentInfo.points.toLocaleString()}</span>
                    <span className="text-orange-600 ml-2">포인트</span>
                  </div>
                </div>

                {/* 가입일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가입일
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    {new Date(studentInfo.joinDate).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                {/* 최종 수정일 */}
                {studentInfo.lastModified && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최종 수정일
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      {new Date(studentInfo.lastModified).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                )}

                {/* 저장 버튼 */}
                {isEditing && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={updateProfile}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? '저장 중...' : '정보 저장'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 예약 이력 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              예약 이력
            </h2>

            {reservationHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>예약 이력이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservationHistory.map((reservation) => (
                  <div key={reservation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{reservation.serviceName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        reservation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {reservation.status === 'completed' ? '완료' :
                         reservation.status === 'cancelled' ? '취소' : '확정'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>선생님: {reservation.teacherName}</div>
                      <div>날짜: {new Date(reservation.date).toLocaleDateString('ko-KR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/student/reservations"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            예약하기
          </Link>
          <Link
            href="/student/notes"
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            노트 보기
          </Link>
          <Link
            href="/student/homework"
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            숙제 하기
          </Link>
        </div>
      </div>
    </div>
  );
} 