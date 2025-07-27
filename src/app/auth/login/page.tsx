'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Translations {
  title: string;
  subtitle: string;
  emailLabel: string;
  passwordLabel: string;
  loginButton: string;
  registerLink: string;
  backToMain: string;
  successMessage: string;
  errorMessage: string;
  loadingMessage: string;
  lineLoginButton: string;
  lineRegisterLink: string;
}

export default function LoginPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'ko' | 'ja'>('ko');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // 번역 텍스트
  const translations: Record<'ko' | 'ja', Translations> = {
    ko: {
      title: '로그인',
      subtitle: 'MalMoi 한국어 교실에 오신 것을 환영합니다',
      emailLabel: '이메일',
      passwordLabel: '비밀번호',
      loginButton: '로그인',
      registerLink: '계정이 없으신가요? 회원가입',
      backToMain: '메인 페이지로 돌아가기',
      successMessage: '로그인에 성공했습니다!',
      errorMessage: '로그인에 실패했습니다.',
      loadingMessage: '로그인 중...',
      lineLoginButton: 'LINE으로 로그인',
      lineRegisterLink: 'LINE으로 회원가입하기'
    },
    ja: {
      title: 'ログイン',
      subtitle: 'MalMoi韓国語教室へようこそ',
      emailLabel: 'メールアドレス',
      passwordLabel: 'パスワード',
      loginButton: 'ログイン',
      registerLink: 'アカウントをお持ちでない方はこちら',
      backToMain: 'メインページに戻る',
      successMessage: 'ログインに成功しました！',
      errorMessage: 'ログインに失敗しました。',
      loadingMessage: 'ログイン中...',
      lineLoginButton: 'LINEでログイン',
      lineRegisterLink: 'LINEで新規登録'
    }
  };

  const t = translations[currentLanguage];

  // 언어 전환 함수
  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === 'ko' ? 'ja' : 'ko');
  };

  // URL 파라미터에서 메시지 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const message = urlParams.get('message');
    const error = urlParams.get('error');

    if (success && message) {
      setSuccessMessage(decodeURIComponent(message));
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (error && message) {
      setErrorMessage(decodeURIComponent(message));
      setTimeout(() => setErrorMessage(''), 5000);
    }
  }, []);

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(t.successMessage);
        setTimeout(() => {
          // 역할에 따라 리다이렉션
          if (data.user.role === 'ADMIN' || data.user.role === 'MASTER') {
            router.push('/admin');
          } else if (data.user.role === 'TEACHER') {
            router.push('/teacher');
          } else if (data.user.role === 'STAFF') {
            router.push('/staff');
          } else {
            router.push('/student');
          }
        }, 1000);
      } else {
        setErrorMessage(data.error || t.errorMessage);
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setErrorMessage(t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // LINE 로그인 처리
  const handleLineLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      setErrorMessage('LINE 로그인 설정이 완료되지 않았습니다.');
      return;
    }

    const state = `login_${Date.now()}`;
    const scope = 'profile openid';
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;

    window.location.href = lineAuthUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* 언어 전환 버튼 */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
        aria-label="언어 전환"
      >
        <Globe className="w-5 h-5 text-gray-600" />
      </button>

      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t.subtitle}
          </p>
        </div>

        {/* 로그인 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t.emailLabel}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder={currentLanguage === 'ko' ? 'example@email.com' : 'example@email.com'}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t.passwordLabel}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder={currentLanguage === 'ko' ? '비밀번호를 입력하세요' : 'パスワードを入力してください'}
              />
            </div>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t.loginButton
            )}
          </button>

          {/* LINE 로그인 버튼 */}
          <button
            type="button"
            onClick={handleLineLogin}
            className="group relative w-full flex justify-center py-2 px-4 border border-green-500 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {t.lineLoginButton}
          </button>

          {/* 회원가입 링크 */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                {t.registerLink}
              </Link>
            </p>
            
            {/* LINE 회원가입 링크 */}
            <p className="text-sm text-gray-500 mt-2">
              <Link href="/auth/line-register" className="font-medium text-green-600 hover:text-green-500">
                {t.lineRegisterLink}
              </Link>
            </p>
          </div>
        </form>

        {/* 메시지 표시 */}
        {successMessage && (
          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{errorMessage}</span>
          </div>
        )}

        {/* 메인 페이지로 돌아가기 */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t.backToMain}
          </Link>
        </div>
      </div>
    </div>
  );
} 