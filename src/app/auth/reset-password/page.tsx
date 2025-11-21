"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    message: string;
    color: string;
  }>({ score: 0, message: "", color: "" });

  // 비밀번호 강도 체크
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ score: 0, message: "", color: "" });
      return;
    }

    let score = 0;
    let message = "";
    let color = "";

    // 길이 체크
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;

    // 숫자 포함
    if (/\d/.test(newPassword)) score += 1;

    // 대문자 포함
    if (/[A-Z]/.test(newPassword)) score += 1;

    // 소문자 포함
    if (/[a-z]/.test(newPassword)) score += 1;

    // 특수문자 포함
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) score += 1;

    if (score <= 2) {
      message = "약함";
      color = "text-red-600";
    } else if (score <= 4) {
      message = "보통";
      color = "text-yellow-600";
    } else {
      message = "강함";
      color = "text-green-600";
    }

    setPasswordStrength({ score, message, color });
  }, [newPassword]);

  const validatePassword = () => {
    if (!newPassword) {
      setError("새 비밀번호를 입력해주세요.");
      return false;
    }

    if (newPassword.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }

    if (passwordStrength.score < 3) {
      setError("더 강한 비밀번호를 사용해주세요. (숫자, 대소문자, 특수문자 포함)");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "비밀번호 재설정에 실패했습니다.");
        return;
      }

      const data = await response.json();

      if (data.success) {
        // 비밀번호 재설정 성공 → 개인정보 수정 페이지로 이동
        alert("비밀번호가 성공적으로 변경되었습니다.\n\n개인정보를 추가로 입력해주세요.");
        
        // 역할에 따라 다른 프로필 페이지로 이동
        const role = data.role || "STUDENT";
        let profileUrl = "/student/profile";
        
        switch (role) {
          case "STUDENT":
            profileUrl = "/student/profile";
            break;
          case "TEACHER":
            profileUrl = "/teacher/profile";
            break;
          case "EMPLOYEE":
          case "STAFF":
            profileUrl = "/employee/profile";
            break;
          default:
            profileUrl = "/student/profile";
        }
        
        router.push(profileUrl);
      }
    } catch (error) {
      console.error("비밀번호 재설정 오류:", error);
      setError("서버 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            비밀번호 재설정
          </h2>
          <p className="text-gray-600">
            첫 로그인입니다. 새로운 비밀번호를 설정해주세요.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 새 비밀번호 */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                새 비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="최소 8자 이상"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* 비밀번호 강도 표시 */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">비밀번호 강도:</span>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.message}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score <= 2
                          ? "bg-red-500"
                          : passwordStrength.score <= 4
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 비밀번호 조건 안내 */}
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-500 flex items-center">
                  <CheckCircle
                    className={`h-3 w-3 mr-1 ${
                      newPassword.length >= 8 ? "text-green-500" : "text-gray-300"
                    }`}
                  />
                  최소 8자 이상
                </p>
                <p className="text-xs text-gray-500 flex items-center">
                  <CheckCircle
                    className={`h-3 w-3 mr-1 ${
                      /\d/.test(newPassword) ? "text-green-500" : "text-gray-300"
                    }`}
                  />
                  숫자 포함
                </p>
                <p className="text-xs text-gray-500 flex items-center">
                  <CheckCircle
                    className={`h-3 w-3 mr-1 ${
                      /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)
                        ? "text-green-500"
                        : "text-gray-300"
                    }`}
                  />
                  대소문자 포함
                </p>
                <p className="text-xs text-gray-500 flex items-center">
                  <CheckCircle
                    className={`h-3 w-3 mr-1 ${
                      /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                        ? "text-green-500"
                        : "text-gray-300"
                    }`}
                  />
                  특수문자 포함
                </p>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호 확인
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호를 다시 입력하세요"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* 비밀번호 일치 여부 */}
              {confirmPassword && (
                <p
                  className={`mt-2 text-xs flex items-center ${
                    newPassword === confirmPassword
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      비밀번호가 일치합니다
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      비밀번호가 일치하지 않습니다
                    </>
                  )}
                </p>
              )}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </p>
              </div>
            )}

            {/* 제출 버튼 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <span>비밀번호 변경</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>안내:</strong> 비밀번호 변경 후 개인정보를 추가로 입력해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}




