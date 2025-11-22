"use client";

import { useState } from "react";

export default function StudentPaymentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">학생 결제 정보</h1>
          <p className="text-lg text-gray-600 mt-2">
            학생의 결제 이력 확인, 추가 및 수정을 할 수 있는 페이지입니다.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600">학생 결제 정보 관리 페이지입니다.</p>
        </div>
      </div>
    </div>
  );
}

