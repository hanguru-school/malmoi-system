'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('ko');
  const router = useRouter();

  // 강제로 입력란 스타일 적용 및 키보드 언어 관리
  useEffect(() => {
    let previousLang = '';
    let isPasswordFocused = false;

    const forceInputStyles = () => {
      const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
      inputs.forEach((input: any) => {
        input.style.color = '#000000';
        input.style.webkitTextFillColor = '#000000';
        input.style.caretColor = '#000000';
        input.style.fontWeight = 'bold';
      });
    };

    // 초기 적용
    forceInputStyles();

    // 주기적으로 적용 (모바일 브라우저 대응)
    const interval = setInterval(forceInputStyles, 1000);

    // 포커스 이벤트 리스너
    const handleFocus = (e: any) => {
      e.target.style.color = '#000000';
      e.target.style.webkitTextFillColor = '#000000';
      e.target.style.caretColor = '#000000';
      e.target.style.fontWeight = 'bold';

      // 비밀번호 입력란에 포커스될 때 현재 언어 저장
      if (e.target.type === 'password') {
        isPasswordFocused = true;
        // 현재 언어 감지 (navigator.language 또는 document.documentElement.lang)
        previousLang = navigator.language || document.documentElement.lang || 'ko';
        console.log('비밀번호 입력 시작, 현재 언어:', previousLang);
      }
    };

    const handleInput = (e: any) => {
      e.target.style.color = '#000000';
      e.target.style.webkitTextFillColor = '#000000';
      e.target.style.caretColor = '#000000';
      e.target.style.fontWeight = 'bold';
    };

    const handleBlur = (e: any) => {
      e.target.style.color = '#000000';
      e.target.style.webkitTextFillColor = '#000000';
      e.target.style.caretColor = '#000000';
      e.target.style.fontWeight = 'bold';

      // 비밀번호 입력란에서 벗어날 때 언어 복원
      if (e.target.type === 'password' && isPasswordFocused) {
        isPasswordFocused = false;
        console.log('비밀번호 입력 완료, 언어 복원:', previousLang);
        
        // 언어 복원을 위한 지연 처리
        setTimeout(() => {
          try {
            // HTML lang 속성 복원
            if (previousLang) {
              document.documentElement.lang = previousLang;
            }
            
            // 추가적인 언어 복원 방법들
            if (typeof window !== 'undefined' && window.navigator) {
              // 브라우저 언어 설정 복원 시도
              const event = new Event('languagechange');
              window.dispatchEvent(event);
            }
          } catch (error) {
            console.log('언어 복원 중 오류:', error);
          }
        }, 100);
      }
    };

    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    inputs.forEach((input) => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('input', handleInput);
      input.addEventListener('blur', handleBlur);
    });

    return () => {
      clearInterval(interval);
      inputs.forEach((input) => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('input', handleInput);
        input.removeEventListener('blur', handleBlur);
      });
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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
      } else {
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError('로그인 중 오류가 발생했습니다.');
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 flex-1 text-center">
            {currentLanguage === 'ko' ? '로그인' : 'ログイン'}
          </h2>
          <button
            onClick={toggleLanguage}
            className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black font-bold"
                  placeholder={currentLanguage === 'ko' ? 'example@email.com' : 'example@email.com'}
                  style={{ 
                    color: '#000000', 
                    WebkitTextFillColor: '#000000',
                    caretColor: '#000000',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                  onFocus={(e) => {
                    e.target.style.color = '#000000';
                    e.target.style.webkitTextFillColor = '#000000';
                    e.target.style.caretColor = '#000000';
                    e.target.style.fontWeight = 'bold';
                  }}
                  onBlur={(e) => {
                    e.target.style.color = '#000000';
                    e.target.style.webkitTextFillColor = '#000000';
                    e.target.style.caretColor = '#000000';
                    e.target.style.fontWeight = 'bold';
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.style.color = '#000000';
                    target.style.webkitTextFillColor = '#000000';
                    target.style.caretColor = '#000000';
                    target.style.fontWeight = 'bold';
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black font-bold"
                  placeholder={currentLanguage === 'ko' ? '비밀번호를 입력하세요' : 'パスワードを入力してください'}
                  style={{ 
                    color: '#000000', 
                    WebkitTextFillColor: '#000000',
                    caretColor: '#000000',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                  onFocus={(e) => {
                    e.target.style.color = '#000000';
                    e.target.style.webkitTextFillColor = '#000000';
                    e.target.style.caretColor = '#000000';
                    e.target.style.fontWeight = 'bold';
                  }}
                  onBlur={(e) => {
                    e.target.style.color = '#000000';
                    e.target.style.webkitTextFillColor = '#000000';
                    e.target.style.caretColor = '#000000';
                    e.target.style.fontWeight = 'bold';
                    
                    // 비밀번호 입력란에서 벗어날 때 키보드 언어 복원
                    setTimeout(() => {
                      try {
                        // HTML lang 속성을 한국어로 강제 설정
                        document.documentElement.lang = 'ko';
                        document.documentElement.setAttribute('lang', 'ko');
                        
                        // 메타 태그 언어 설정
                        const metaLang = document.querySelector('meta[name="language"]');
                        if (metaLang) {
                          metaLang.setAttribute('content', 'ko');
                        }
                        
                        // 언어 변경 이벤트 발생
                        window.dispatchEvent(new Event('languagechange'));
                        
                        console.log('키보드 언어 복원 완료');
                      } catch (error) {
                        console.log('키보드 언어 복원 오류:', error);
                      }
                    }, 200);
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.style.color = '#000000';
                    target.style.webkitTextFillColor = '#000000';
                    target.style.caretColor = '#000000';
                    target.style.fontWeight = 'bold';
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
                {isLoading 
                  ? (currentLanguage === 'ko' ? '로그인 중...' : 'ログイン中...')
                  : (currentLanguage === 'ko' ? '로그인' : 'ログイン')
                }
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
          <Link
            href="/"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {currentLanguage === 'ko' ? '메인 페이지로 돌아가기' : 'メインページに戻る'}
          </Link>
        </div>
      </div>
    </div>
  );
} 