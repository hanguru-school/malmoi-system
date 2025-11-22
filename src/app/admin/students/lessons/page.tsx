"use client";

import { useState } from "react";

export default function StudentLessonsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">학생 수업 정보</h1>
          <p className="text-lg text-gray-600 mt-2">
            전 수업 이력등을 상세히 열람하고 수정 추가가 가능한 페이지입니다.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600">학생 수업 정보 관리 페이지입니다.</p>
        </div>
      </div>
    </div>
  );
}

