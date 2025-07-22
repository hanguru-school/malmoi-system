'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  User, 
  BookOpen, 
  FileText, 
  BookMarked, 
  Mic, 
  PenTool, 
  ClipboardCheck, 
  MessageCircle, 
  CreditCard, 
  FolderOpen,
  Menu,
  X,
  Home,
  LogOut
} from 'lucide-react';

const navigation = [
  { name: '홈', href: '/student/home', icon: Home },
  { name: '예약', href: '/student/reservations', icon: Calendar },
  { name: '마이페이지', href: '/student/profile', icon: User },
  { name: '레슨노트', href: '/student/notes', icon: BookOpen },
  { name: '숙제', href: '/student/homework', icon: FileText, comingSoon: true },
  { name: '단어복습', href: '/student/vocabulary', icon: BookMarked, comingSoon: true },
  { name: '듣기/녹음', href: '/student/listening', icon: Mic, comingSoon: true },
  { name: '작문테스트', href: '/student/writing', icon: PenTool, comingSoon: true },
  { name: '시험준비', href: '/student/exam-prep', icon: ClipboardCheck, comingSoon: true },
  { name: 'LINE 연동', href: '/student/line-settings', icon: MessageCircle, comingSoon: true },
  { name: 'UID 등록', href: '/student/uid-registration', icon: CreditCard, comingSoon: true },
  { name: '추가자료', href: '/student/materials', icon: FolderOpen, comingSoon: true },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 사이드바 오버레이 */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 사이드바 */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">학생 포털</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <div key={item.name} className="relative">
                    <Link
                      href={item.comingSoon ? '#' : item.href}
                      onClick={(e) => {
                        if (item.comingSoon) {
                          e.preventDefault();
                          return;
                        }
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                          : item.comingSoon
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                    {item.comingSoon && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        준비중
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* 로그아웃 버튼 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <LogOut className="w-5 h-5 mr-3" />
              로그아웃
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="lg:pl-64">
          {/* 상단 헤더 */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <div className="text-sm text-gray-500">안녕하세요,</div>
                  <div className="text-lg font-semibold text-gray-900">김학생님</div>
                </div>
                
                {/* 알림 아이콘 */}
                <div className="relative">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <div className="w-5 h-5 relative">
                      <MessageCircle className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        3
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* 페이지 콘텐츠 */}
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    );
} 