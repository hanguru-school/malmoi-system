"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  Languages,
  Users,
  GraduationCap,
  Building,
  User,
  Shield,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// 다국어 텍스트 정의
const translations = {
  ja: {
    title: "韓国語教室MalMoi",
    subtitle: "スマートな韓国語学習を始めましょう",
    description: "教室でレッスンを受ける生徒のためのデジタルプラットフォーム",
    emailLabel: "メールアドレス",
    emailPlaceholder: "your.email@example.com",
    passwordLabel: "パスワード",
    passwordPlaceholder: "パスワードを入力してください",
    loginButton: "ログイン",
    registerButton: "新規登録",
    forgotPassword: "パスワードを忘れた方",
    orText: "または",
    loginWith: "でログイン",
    noAccount: "アカウントをお持ちでない方",
    haveAccount: "すでにアカウントをお持ちの方",
    studentLogin: "生徒ログイン",
    parentLogin: "保護者ログイン",
    employeeLogin: "職員ログイン",
    teacherLogin: "先生ログイン",
    adminLogin: "管理者ログイン",
    loginAs: "としてログイン",
    features: {
      title: "生徒のための特別な機能",
      reservation: "簡単なレッスン予約",
      materials: "レッスン資料管理",
      progress: "学習進捗追跡",
      communication: "先生とのコミュニケーション",
    },
    stats: {
      students: "活発な生徒",
      classes: "完了したレッスン",
      satisfaction: "平均満足度",
    },
  },
  ko: {
    title: "한국어교실MalMoi",
    subtitle: "스마트한 한국어 학습을 시작하세요",
    description: "교실에서 수업을 듣는 학생들을 위한 디지털 플랫폼",
    emailLabel: "이메일 주소",
    emailPlaceholder: "your.email@example.com",
    passwordLabel: "비밀번호",
    passwordPlaceholder: "비밀번호를 입력하세요",
    loginButton: "로그인",
    registerButton: "회원가입",
    forgotPassword: "비밀번호를 잊으셨나요",
    orText: "또는",
    loginWith: "로 로그인",
    noAccount: "계정이 없으신가요",
    haveAccount: "이미 계정이 있으신가요",
    studentLogin: "학생 로그인",
    parentLogin: "학부모 로그인",
    employeeLogin: "직원 로그인",
    teacherLogin: "선생님 로그인",
    adminLogin: "관리자 로그인",
    loginAs: "로 로그인",
    features: {
      title: "학생들을 위한 특별한 기능",
      reservation: "간편한 수업 예약",
      materials: "수업 자료 관리",
      progress: "학습 진도 추적",
      communication: "선생님과 소통",
    },
    stats: {
      students: "활발한 학생들",
      classes: "완료된 수업",
      satisfaction: "평균 만족도",
    },
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const t = translations[language];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "로그인에 실패했습니다.");
        return;
      }

      // 로그인 성공 시 해당 대시보드로 리다이렉트
      if (data.dashboardPath) {
        router.push(data.dashboardPath);
      } else {
        router.push("/student");
      }
    } catch (error) {
      setError("로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/auth/register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {t.subtitle}
          </h2>
          <p className="text-gray-600">{t.description}</p>

          {/* Language Toggle */}
          <div className="mt-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 mx-auto"
            >
              <Languages className="w-4 h-4" />
              {language === "ja" ? "한국어" : "日本語"}
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.emailPlaceholder}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.passwordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.passwordPlaceholder}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    {t.loginButton}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t.orText}</span>
              </div>
            </div>
          </div>

          {/* Register Button */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">{t.noAccount}</p>
            <button
              onClick={handleRegister}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <UserPlus className="w-4 h-4" />
              {t.registerButton}
            </button>
          </div>
        </div>

        {/* Quick Login Options */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            {language === "ja" ? "クイックログイン" : "빠른 로그인"}
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                setEmail("student@example.com");
                setPassword("password123");
              }}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{t.studentLogin}</span>
            </button>

            <button
              onClick={() => {
                setEmail("parent@example.com");
                setPassword("password123");
              }}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <User className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">{t.parentLogin}</span>
            </button>

            <button
              onClick={() => {
                setEmail("employee@example.com");
                setPassword("password123");
              }}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">{t.employeeLogin}</span>
            </button>

            <button
              onClick={() => {
                setEmail("teacher@example.com");
                setPassword("password123");
              }}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <GraduationCap className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium">{t.teacherLogin}</span>
            </button>

            <button
              onClick={() => {
                setEmail("admin@example.com");
                setPassword("password123");
              }}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium">{t.adminLogin}</span>
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            {t.features.title}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600">{t.features.reservation}</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <GraduationCap className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-gray-600">{t.features.materials}</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600">{t.features.progress}</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Mail className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-xs text-gray-600">
                {t.features.communication}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600">500+</div>
            <div className="text-xs text-gray-600">{t.stats.students}</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-green-600">1,200+</div>
            <div className="text-xs text-gray-600">{t.stats.classes}</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-purple-600">4.9</div>
            <div className="text-xs text-gray-600">{t.stats.satisfaction}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
