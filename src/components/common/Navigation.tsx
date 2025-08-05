"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  LogOut,
  User,
  Settings,
  Bell,
  Home,
  Calendar,
  BookOpen,
  Shield,
  GraduationCap,
  Building,
  CreditCard,
  MessageSquare,
  Star,
  BarChart3,
  Tag,
  Users,
  FileText,
  X,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

interface NavigationProps {
  userRole?: string;
}

export default function Navigation({ userRole }: NavigationProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMemoSubmenu, setShowMemoSubmenu] = useState(false);
  const [showMessageSubmenu, setShowMessageSubmenu] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const getRoleName = () => {
    switch (userRole || user?.role) {
      case "ADMIN":
      case "MASTER":
        return "관리자";
      case "TEACHER":
        return "선생님";
      case "STAFF":
        return "사무직원";
      case "EMPLOYEE":
        return "직원";
      case "STUDENT":
        return "학생";
      default:
        return "사용자";
    }
  };

  const menuItems = [
    {
      name: "대시보드",
      icon: <Home className="w-5 h-5" />,
      path: "/admin",
    },
    {
      name: "예약 상세정보",
      icon: <Calendar className="w-5 h-5" />,
      path: "/admin/reservations",
    },
    {
      name: "결제 정보",
      icon: <CreditCard className="w-5 h-5" />,
      path: "/admin/payments",
    },
    {
      name: "고객 관리",
      icon: <Users className="w-5 h-5" />,
      path: "/admin/customers",
    },
    {
      name: "선생님 관리",
      icon: <GraduationCap className="w-5 h-5" />,
      path: "/admin/teachers",
    },
    {
      name: "메모 관리",
      icon: <FileText className="w-5 h-5" />,
      hasSubmenu: true,
      submenu: [
        {
          name: "메모 유형 관리",
          path: "/admin/memo-types",
        },
      ],
    },
    {
      name: "송신 메시지",
      icon: <MessageSquare className="w-5 h-5" />,
      hasSubmenu: true,
      submenu: [
        {
          name: "푸시 알림 관리",
          path: "/admin/push-notifications",
        },
      ],
    },
    {
      name: "리뷰 관리",
      icon: <Star className="w-5 h-5" />,
      path: "/admin/reviews",
    },
    {
      name: "통계",
      icon: <BarChart3 className="w-5 h-5" />,
      path: "/admin/statistics",
    },
    {
      name: "관리자 관리",
      icon: <Shield className="w-5 h-5" />,
      path: "/admin/settings",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <div className="w-64 bg-gray-800 text-white">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">관리자 포털</h1>
            <button className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className="mt-4">
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.hasSubmenu ? (
                <div>
                  <button
                    onClick={() => {
                      if (item.name === "메모 관리") {
                        setShowMemoSubmenu(!showMemoSubmenu);
                        setShowMessageSubmenu(false);
                      } else if (item.name === "송신 메시지") {
                        setShowMessageSubmenu(!showMessageSubmenu);
                        setShowMemoSubmenu(false);
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                                         <ChevronDown className={`w-4 h-4 transition-transform ${
                       ((item.name === "메모 관리" && showMemoSubmenu) ||
                       (item.name === "송신 메시지" && showMessageSubmenu))
                         ? "rotate-180"
                         : ""
                     }`} />
                  </button>
                  
                  {/* 서브메뉴 */}
                  {(item.name === "메모 관리" && showMemoSubmenu) ||
                   (item.name === "송신 메시지" && showMessageSubmenu) ? (
                    <div className="bg-gray-700">
                      {item.submenu?.map((subItem, subIndex) => (
                        <button
                          key={subIndex}
                          onClick={() => router.push(subItem.path)}
                          className="w-full flex items-center px-8 py-2 text-left text-gray-400 hover:bg-gray-600 hover:text-white transition-colors text-sm"
                        >
                          {subItem.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  onClick={() => router.push(item.path)}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* 로그아웃 */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 헤더 */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex justify-between items-center px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">대시보드</h2>
            
            <div className="flex items-center space-x-4">
              {/* 알림 */}
              <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  2
                </span>
              </button>

              {/* 사용자 프로필 */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || "사용자"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-6">
          {/* 여기에 페이지 콘텐츠가 들어갑니다 */}
        </main>
      </div>
    </div>
  );
}
