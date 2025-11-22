"use client";

import { useState } from "react";

export default function StudentLevelsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">학생 레벨 정보</h1>
          <p className="text-lg text-gray-600 mt-2">
            학생의 현재 수준, 코스, 평가 등 수업 진행에 필요한 정보들을 열람 수정 가능한 페이지입니다.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600">학생 레벨 정보 관리 페이지입니다.</p>
        </div>
      </div>
    </div>
  );
}

