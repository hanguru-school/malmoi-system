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
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('ko');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('로그인 시도:', { email, password });
      
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('응답 상태:', response.status);
      const data = await response.json();
      console.log('응답 데이터:', data);

      if (response.ok && data.success) {
        console.log('로그인 성공, 사용자 역할:', data.user.role);
        
        // 로그인 성공 시 역할에 맞는 페이지로 리다이렉트
        const userRole = data.user.role;
        
        switch (userRole) {
          case 'STUDENT':
            console.log('학생 페이지로 리다이렉트');
            window.location.href = '/student/home';
            break;
          case 'PARENT':
            console.log('학부모 페이지로 리다이렉트');
            window.location.href = '/parent/home';
            break;
          case 'TEACHER':
            console.log('선생님 페이지로 리다이렉트');
            window.location.href = '/teacher/home';
            break;
          case 'STAFF':
            console.log('직원 페이지로 리다이렉트');
            window.location.href = '/staff/home';
            break;
          case 'ADMIN':
            console.log('관리자 페이지로 리다이렉트');
            window.location.href = '/admin/home';
            break;
          default:
            console.log('기본 페이지로 리다이렉트');
            window.location.href = '/student/home'; // 기본값
        }
      } else {
        console.log('로그인 실패:', data.message);
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setError(error.message || '로그인 중 오류가 발생했습니다.');
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
        <div className="flex justify-center items-center mb-8 relative">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {currentLanguage === 'ko' ? '로그인' : 'ログイン'}
          </h2>
          <button
            onClick={toggleLanguage}
            className="absolute right-0 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <Globe className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          {currentLanguage === 'ko' 
            ? 'MalMoi 한국어 교실에 오신 것을 환영합니다' 
            : 'MalMoi韓国語教室へようこそ'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10">
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

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <button
              onClick={() => router.push('/auth/register')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              회원가입
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">다른 로그인 방법:</p>
          <button
            onClick={() => router.push('/auth/cognito-login')}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            AWS Cognito로 로그인
          </button>
        </div>
      </div>
    </div>
  );
} 