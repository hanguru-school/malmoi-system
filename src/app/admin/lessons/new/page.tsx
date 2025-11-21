"use client";

import { useState } from "react";

export default function NewLessonPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">수업 추가</h1>
          <p className="text-lg text-gray-600 mt-2">
            새로운 수업을 추가합니다.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600">수업 추가 페이지입니다.</p>
        </div>
      </div>
    </div>
  );
}

