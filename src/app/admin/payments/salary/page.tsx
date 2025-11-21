"use client";

import { useState } from "react";

export default function SalaryPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">선생님 및 직원 급여</h1>
          <p className="text-lg text-gray-600 mt-2">
            선생님과 직원의 급여를 관리합니다.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600">급여 관리 페이지입니다.</p>
        </div>
      </div>
    </div>
  );
}

