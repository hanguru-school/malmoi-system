"use client";

import React, { Suspense } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

function AuthSuccessContent() {
  const { useRouter, useSearchParams } = require("next/navigation");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [countdown, setCountdown] = React.useState(3);
  const [userEmail, setUserEmail] = React.useState<string>("");

  React.useEffect(() => {
    const user = searchParams.get("user");
    if (user) {
      setUserEmail(user);
    }

    // 3초 후 자동 리다이렉트
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            로그인 성공!
          </h1>
          <p className="text-gray-600">
            {userEmail && `환영합니다, ${userEmail}님!`}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{countdown}초 후 메인 페이지로 이동합니다...</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            지금 이동하기
          </button>

          <button
            onClick={() => router.push("/student/dashboard")}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            대시보드로 이동
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          <p>자동으로 리다이렉트되지 않으면 위 버튼을 클릭해주세요.</p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">로딩 중...</h1>
        </div>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthSuccessContent />
    </Suspense>
  );
}
