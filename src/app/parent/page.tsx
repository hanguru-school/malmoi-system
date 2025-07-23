'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  BookOpen, 
  Users, 
  FileText, 
  Bell, 
  Settings,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Star,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  LogOut
} from 'lucide-react';

interface Child {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  status: 'active' | 'inactive';
}

interface Reservation {
  id: string;
  childName: string;
  courseName: string;
  date: string;
  time: string;
  duration: string;
  teacher: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  location: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  level: string;
  duration: string;
  price: number;
  teacher: string;
  schedule: string;
  enrolled: boolean;
}

const ParentPage = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data
  useEffect(() => {
    const mockChildren: Child[] = [
      {
        id: '1',
        name: '김민수',
        grade: '초등 3학년',
        avatar: '/avatars/child1.jpg',
        status: 'active'
      },
      {
        id: '2',
        name: '김민지',
        grade: '초등 1학년',
        avatar: '/avatars/child2.jpg',
        status: 'active'
      }
    ];

    const mockReservations: Reservation[] = [
      {
        id: '1',
        childName: '김민수',
        courseName: '수학 기초 과정',
        date: '2024-01-20',
        time: '14:00',
        duration: '60분',
        teacher: '김선생님',
        status: 'confirmed',
        location: '교실A'
      },
      {
        id: '2',
        childName: '김민지',
        courseName: '국어 기초 과정',
        date: '2024-01-22',
        time: '15:30',
        duration: '45分',
        teacher: '鈴木先生',
        status: 'pending',
        location: '教室B'
      },
      {
        id: '3',
        childName: '田中 太郎',
        courseName: '英語基礎コース',
        date: '2024-01-25',
        time: '16:00',
        duration: '60分',
        teacher: '高橋先生',
        status: 'confirmed',
        location: '教室C'
      }
    ];

    const mockCourses: Course[] = [
      {
        id: '1',
        name: '算数基礎コース',
        description: '小学校低学年向けの算数基礎を学ぶコースです',
        level: '初級',
        duration: '60分',
        price: 8000,
        teacher: '佐藤先生',
        schedule: '月・水・金 14:00-15:00',
        enrolled: true
      },
      {
        id: '2',
        name: '国語基礎コース',
        description: '読解力と作文力を向上させるコースです',
        level: '初級',
        duration: '45分',
        price: 6000,
        teacher: '鈴木先生',
        schedule: '火・木 15:30-16:15',
        enrolled: true
      },
      {
        id: '3',
        name: '英語基礎コース',
        description: '英語の基礎を楽しく学ぶコースです',
        level: '初級',
        duration: '60分',
        price: 10000,
        teacher: '高橋先生',
        schedule: '土 16:00-17:00',
        enrolled: true
      },
      {
        id: '4',
        name: '理科実験コース',
        description: '実験を通じて理科の楽しさを学ぶコースです',
        level: '中級',
        duration: '90分',
        price: 12000,
        teacher: '田中先生',
        schedule: '日 10:00-11:30',
        enrolled: false
      }
    ];

    setChildren(mockChildren);
    setReservations(mockReservations);
    setCourses(mockCourses);
    if (mockChildren.length > 0) {
      setSelectedChild(mockChildren[0].id);
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('parentToken');
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '確認済み';
      case 'pending':
        return '保留中';
      case 'cancelled':
        return 'キャンセル';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* 子供選択 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">お子様選択</h2>
        <div className="flex gap-4">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                selectedChild === child.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{child.name}</p>
                <p className="text-sm text-gray-600">{child.grade}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 予約状況 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">今週の予約</h2>
          <Link href="/parent/reservations" className="text-blue-600 hover:text-blue-800 text-sm">
            すべて見る
          </Link>
        </div>
        <div className="space-y-3">
          {reservations.slice(0, 3).map((reservation) => (
            <div key={reservation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{reservation.courseName}</p>
                  <p className="text-sm text-gray-600">
                    {reservation.date} {reservation.time} - {reservation.duration}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reservation.status)}`}>
                  {getStatusText(reservation.status)}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* コース状況 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">登録コース</h2>
          <Link href="/parent/courses" className="text-blue-600 hover:text-blue-800 text-sm">
            すべて見る
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.filter(course => course.enrolled).slice(0, 4).map((course) => (
            <div key={course.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{course.name}</h3>
                <span className="text-sm text-gray-500">{course.level}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{course.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{course.teacher}</span>
                <span className="font-medium text-gray-900">{formatCurrency(course.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReservations = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">予約管理</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            新しい予約
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">お子様</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">コース</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">先生</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">場所</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reservation.childName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reservation.courseName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.date} {reservation.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reservation.teacher}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reservation.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-2">編集</button>
                    <button className="text-red-600 hover:text-red-900">キャンセル</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">コース一覧</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="コースを検索..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>すべてのレベル</option>
              <option>初級</option>
              <option>中級</option>
              <option>上級</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {course.level}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  {course.teacher}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {course.schedule}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">{formatCurrency(course.price)}</span>
                <button
                  className={`px-4 py-2 rounded-lg font-medium ${
                    course.enrolled
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={course.enrolled}
                >
                  {course.enrolled ? '登録済み' : '登録する'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">문의 및 연락처 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">연락처</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>전화번호:</strong> 02-1234-5678
              </p>
              <p className="text-sm text-gray-600">
                <strong>이메일:</strong> info@edubook.com
              </p>
              <p className="text-sm text-gray-600">
                <strong>주소:</strong> 서울시 강남구 테헤란로 123
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-3">운영시간</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>평일:</strong> 9:00 - 18:00
              </p>
              <p className="text-sm text-gray-600">
                <strong>토요일:</strong> 9:00 - 17:00
              </p>
              <p className="text-sm text-gray-600">
                <strong>일요일・공휴일:</strong> 휴무
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">문의 양식</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="문의 제목을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메시지</label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="문의 내용을 입력하세요"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            보내기
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">학부모 포털</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {[
                { id: 'dashboard', name: '대시보드', icon: Calendar },
                { id: 'reservations', name: '예약 관리', icon: BookOpen },
                { id: 'courses', name: '과정 목록', icon: Users },
                { id: 'contact', name: '문의 및 연락처', icon: FileText }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'reservations' && renderReservations()}
          {activeTab === 'courses' && renderCourses()}
          {activeTab === 'contact' && renderContact()}
        </main>
      </div>
    </div>
  );
};

export default ParentPage; 