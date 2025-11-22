"use client";

import { useState } from "react";

export default function BookkeepingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">부기 정산</h1>
          <p className="text-lg text-gray-600 mt-2">
            회계사와 같이 정산이 가능하도록 각종 지출입을 관리하는 페이지입니다.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600">부기 정산 관리 페이지입니다.</p>
        </div>
      </div>
    </div>
  );
}

