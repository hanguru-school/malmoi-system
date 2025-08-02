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
} from "lucide-react";
import { useState } from "react";

interface NavigationProps {
  userRole?: string;
}

export default function Navigation({ userRole }: NavigationProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const getDashboardIcon = () => {
    switch (userRole || user?.role) {
      case "ADMIN":
      case "MASTER":
        return <Shield className="w-5 h-5" />;
      case "TEACHER":
        return <GraduationCap className="w-5 h-5" />;
      case "STAFF":
      case "EMPLOYEE":
        return <Building className="w-5 h-5" />;
      case "STUDENT":
        return <BookOpen className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  const getDashboardPath = () => {
    switch (userRole || user?.role) {
      case "ADMIN":
      case "MASTER":
        return "/admin";
      case "TEACHER":
        return "/teacher";
      case "STAFF":
        return "/staff";
      case "EMPLOYEE":
        return "/employee";
      case "STUDENT":
        return "/student";
      default:
        return "/";
    }
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

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 및 홈 링크 */}
          <div className="flex items-center">
            <button
              onClick={() => router.push(getDashboardPath())}
              className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 transition-colors"
            >
              {getDashboardIcon()}
              <span className="font-semibold text-lg">MalMoi</span>
            </button>
          </div>

          {/* 중앙 네비게이션 */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => router.push(getDashboardPath())}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>홈</span>
            </button>

            <button
              onClick={() => router.push(`${getDashboardPath()}/schedule`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>일정</span>
            </button>

            <button
              onClick={() => router.push(`${getDashboardPath()}/profile`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>프로필</span>
            </button>
          </div>

          {/* 우측 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {/* 알림 */}
            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            {/* 사용자 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user?.name || "사용자"}
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{user?.name || "사용자"}</div>
                    <div className="text-gray-500">{getRoleName()}</div>
                  </div>

                  <button
                    onClick={() => {
                      router.push(`${getDashboardPath()}/profile`);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>프로필</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push(`${getDashboardPath()}/settings`);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>설정</span>
                  </button>

                  <div className="border-t">
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <button
            onClick={() => router.push(getDashboardPath())}
            className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
          >
            홈
          </button>
          <button
            onClick={() => router.push(`${getDashboardPath()}/schedule`)}
            className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
          >
            일정
          </button>
          <button
            onClick={() => router.push(`${getDashboardPath()}/profile`)}
            className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
          >
            프로필
          </button>
        </div>
      </div>
    </nav>
  );
}
