'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('ko');
  const router = useRouter();
  const { login, user } = useAuth();

  // 사용자 역할에 따른 리디렉션 경로 결정
  const getRedirectPath = (userRole: string) => {
    switch (userRole.toLowerCase()) {
      case 'student':
        return '/student/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'staff':
        return '/staff/home';
      default:
        return '/student/dashboard'; // 기본값
    }
  };

  // 로그인 성공 후 역할에 따른 리디렉션
  useEffect(() => {
    if (user) {
      const redirectPath = getRedirectPath(user.role);
      console.log('로그인 성공 - 사용자 역할:', user.role, '리디렉션 경로:', redirectPath);
      router.push(redirectPath);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('로그인 시도:', { email, password });
      
      // useAuth 훅의 login 함수 사용
      await login(email, password);
      
      setMessage('로그인에 성공했습니다.');
      setError('');
      
      // useAuth의 login 함수가 성공하면 user 상태가 업데이트되고
      // useEffect에서 자동으로 적절한 대시보드로 리디렉션됩니다.
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setError(error.message || '로그인 중 오류가 발생했습니다.');
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === 'ko' ? 'ja' : 'ko');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center mb-8">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {currentLanguage === 'ko' ? '로그인' : 'ログイン'}
          </h2>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          {currentLanguage === 'ko' 
            ? 'MalMoi 한국어 교실에 오신 것을 환영합니다' 
            : 'MalMoi韓国語教室へようこそ'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl sm:px-8 relative">
          <button
            onClick={toggleLanguage}
            className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full shadow-sm hover:shadow-md transition-shadow"
          >
            <Globe className="w-5 h-5 text-gray-600" />
          </button>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {currentLanguage === 'ko' ? '이메일' : 'メールアドレス'}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black font-light"
                  placeholder={currentLanguage === 'ko' ? 'example@email.com' : 'example@email.com'}
                  style={{ 
                    color: '#000000', 
                    WebkitTextFillColor: '#000000',
                    caretColor: '#000000',
                    fontWeight: '300',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {currentLanguage === 'ko' ? '비밀번호' : 'パスワード'}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black font-light"
                  placeholder={currentLanguage === 'ko' ? '비밀번호를 입력하세요' : 'パスワードを入力してください'}
                  style={{ 
                    color: '#000000', 
                    WebkitTextFillColor: '#000000',
                    caretColor: '#000000',
                    fontWeight: '300',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  currentLanguage === 'ko' ? '로그인' : 'ログイン'
                )}
              </button>
            </div>

            <div>
              <button
                type="button"
                className="w-full flex justify-center py-2 px-4 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {currentLanguage === 'ko' ? 'LINE으로 로그인' : 'LINEでログイン'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {currentLanguage === 'ko' ? '또는' : 'または'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link
                href="/auth/register"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                {currentLanguage === 'ko' ? '계정이 없으신가요? 회원가입' : 'アカウントをお持ちでない方はこちら'}
              </Link>
              <Link
                href="/auth/line-register"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                {currentLanguage === 'ko' ? 'LINE으로 회원가입하기' : 'LINEで新規登録'}
              </Link>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 