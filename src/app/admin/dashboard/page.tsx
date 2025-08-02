"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  const rolePages = [
    {
      title: "학생 대시보드",
      description: "학생 페이지로 이동하여 학생 기능을 확인합니다",
      path: "/student/dashboard",
      color: "bg-blue-500 hover:bg-blue-600",
      icon: "👨‍🎓",
    },
    {
      title: "선생님 대시보드",
      description: "선생님 페이지로 이동하여 선생님 기능을 확인합니다",
      path: "/teacher/dashboard",
      color: "bg-green-500 hover:bg-green-600",
      icon: "👨‍🏫",
    },
    {
      title: "직원 대시보드",
      description: "직원 페이지로 이동하여 직원 기능을 확인합니다",
      path: "/staff/home",
      color: "bg-purple-500 hover:bg-purple-600",
      icon: "👨‍💼",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            관리자 대시보드
          </h1>
          <p className="text-gray-600">
            시스템 전체를 관리하고 각 역할별 페이지에 접근할 수 있습니다.
          </p>
        </div>

        {/* 역할별 페이지 접근 섹션 */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            역할별 페이지 접근
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolePages.map((page, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{page.icon}</span>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {page.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">{page.description}</p>
                <button
                  onClick={() => router.push(page.path)}
                  className={`w-full ${page.color} text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200`}
                >
                  페이지로 이동
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 관리 기능 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 학생 관리 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              학생 관리
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/students")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                학생 목록
              </button>
              <button
                onClick={() => router.push("/admin/student-management")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                학생 관리
              </button>
            </div>
          </div>

          {/* 선생님 관리 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              선생님 관리
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/teachers")}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                선생님 목록
              </button>
              <button
                onClick={() => router.push("/admin/teacher-management")}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                선생님 관리
              </button>
            </div>
          </div>

          {/* 시스템 관리 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              시스템 관리
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/settings")}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                시스템 설정
              </button>
              <button
                onClick={() => router.push("/admin/analytics")}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                분석 대시보드
              </button>
            </div>
          </div>

          {/* 예약 관리 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              예약 관리
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/reservations")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                예약 목록
              </button>
              <button
                onClick={() => router.push("/admin/calendar")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                캘린더 보기
              </button>
            </div>
          </div>

          {/* 커리큘럼 관리 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              커리큘럼 관리
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/courses")}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                과정 관리
              </button>
              <button
                onClick={() => router.push("/admin/curriculum")}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                커리큘럼 관리
              </button>
            </div>
          </div>

          {/* 결제 관리 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              결제 관리
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/payments")}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                결제 내역
              </button>
              <button
                onClick={() => router.push("/admin/sales")}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                매출 관리
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
