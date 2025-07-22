'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { isFirebaseConfigValid } from '@/lib/firebase';
import { Globe } from 'lucide-react';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<'password' | 'card'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  
  // 언어 설정 (학생 메인 페이지와 동일한 형식)
  const [currentLanguage, setCurrentLanguage] = useState<'ko' | 'ja'>('ko');

  // 카드 인증 관련 상태
  const [cardAuthAttempted, setCardAuthAttempted] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const { signIn, signInWithLine, user, getDefaultPageByRole, loading: authLoading } = useAuth();
  const router = useRouter();

  // 언어 전환 함수 (학생 메인 페이지와 동일한 형식)
  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'ko' ? 'ja' : 'ko');
  };

  // 다국어 텍스트 (학생 메인 페이지와 동일한 형식)
  const texts = {
    ko: {
      title: '로그인',
      subtitle: '계정에 로그인하세요',
      emailPassword: '이메일/비밀번호',
      cardAuthentication: '카드 인증',
      email: '이메일',
      emailPlaceholder: '이메일을 입력하세요',
      password: '비밀번호',
      passwordPlaceholder: '비밀번호를 입력하세요',
      login: '로그인',
      loginInProgress: '로그인 중...',
      or: '또는',
      loginWithLine: 'LINE으로 로그인',
      noAccount: '계정이 없으신가요?',
      signUp: '가입하기',
      testAccounts: '테스트 계정',
      studentAccount: '학생 계정',
      teacherAccount: '선생님 계정',
      adminAccount: '관리자 계정',
      staffAccount: '직원 계정',
      copySuccess: '복사되었습니다',
      copyEmail: '이메일 복사',
      copyPassword: '비밀번호 복사',
      loginFailed: '이메일 또는 비밀번호가 일치하지 않습니다',
      lineLoginFailed: 'LINE 로그인에 실패했습니다',
      cardAuthTitle: '카드 인증',
      cardAuthSubtitle: '카드를 태그해주세요',
      cardAuthRetry: '다시 시도',
      cardAuthCountdown: '초 후 다시 시도',
      authenticate: '인증하기',
      authenticating: '인증 중...',
      authenticationFailed: '인증에 실패했습니다'
    },
    ja: {
      title: 'ログイン',
      subtitle: 'アカウントにログインしてください',
      emailPassword: 'メール/パスワード',
      cardAuthentication: 'カード認証',
      email: 'メールアドレス',
      emailPlaceholder: 'メールアドレスを入力してください',
      password: 'パスワード',
      passwordPlaceholder: 'パスワードを入力してください',
      login: 'ログイン',
      loginInProgress: 'ログイン中...',
      or: 'または',
      loginWithLine: 'LINEでログイン',
      noAccount: 'アカウントをお持ちでない方は',
      signUp: '新規登録',
      testAccounts: 'テストアカウント',
      studentAccount: '学生アカウント',
      teacherAccount: '教師アカウント',
      adminAccount: '管理者アカウント',
      staffAccount: 'スタッフアカウント',
      copySuccess: 'コピーされました',
      copyEmail: 'メールアドレスをコピー',
      copyPassword: 'パスワードをコピー',
      loginFailed: 'メールアドレスまたはパスワードが一致しません',
      lineLoginFailed: 'LINEログインに失敗しました',
      cardAuthTitle: 'カード認証',
      cardAuthSubtitle: 'カードをタグしてください',
      cardAuthRetry: '再試行',
      cardAuthCountdown: '秒後に再試行',
      authenticate: '認証する',
      authenticating: '認証中...',
      authenticationFailed: '認証に失敗しました'
    }
  };

  const t = texts[currentLanguage];

  // 로그인 성공 후 권한별 페이지 리다이렉션
  useEffect(() => {
    console.log('useEffect 실행 - user:', user, 'loading:', loading, 'authLoading:', authLoading);
    if (user && !loading && !authLoading) {
      console.log('사용자 로그인됨:', user.role, user.name);
      const defaultPage = getDefaultPageByRole(user.role);
      console.log('리다이렉션할 페이지:', defaultPage);
      
      // 약간의 지연을 두고 리다이렉션
      setTimeout(() => {
        console.log('리다이렉션 실행:', defaultPage);
        router.push(defaultPage);
      }, 100);
    }
  }, [user, loading, authLoading, router, getDefaultPageByRole]);

  // 이메일/비밀번호 로그인
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('로그인 시도:', email);
      await signIn(email, password);
      console.log('로그인 성공, 사용자 상태 대기 중...');
      // useEffect에서 사용자 상태 변경을 감지하여 리다이렉션 처리
    } catch (error: any) {
      console.error('로그인 실패:', error);
      setError(error.message || t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  // LINE 로그인
  const handleLineLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithLine();
      // useEffect에서 사용자 상태 변경을 감지하여 리다이렉션 처리
    } catch (error: any) {
      setError(error.message || t.lineLoginFailed);
    } finally {
      setLoading(false);
    }
  };

  // 카드 인증 시뮬레이션
  const handleCardAuth = () => {
    setCardAuthAttempted(true);
    setIsCountingDown(true);
    setCountdown(15);
  };

  // 카운트다운 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCountingDown && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsCountingDown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isCountingDown, countdown]);

  // 클립보드 복사 함수
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(t.copySuccess);
      setTimeout(() => setCopyMessage(''), 3000); // 3초 후 메시지 삭제
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      alert(currentLanguage === 'ko' ? '클립보드 복사에 실패했습니다.' : 'クリップボードのコピーに失敗しました。');
    }
  };

  // 다시시도 버튼
  const handleRetry = () => {
    setCardAuthAttempted(true);
    setIsCountingDown(true);
    setCountdown(15);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      {/* 토스트 메시지 */}
      {copyMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-in-out">
          {copyMessage}
        </div>
      )}
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                {t.title}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {t.subtitle}
              </p>
            </div>
            
            {/* 언어 전환 버튼 */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={currentLanguage === 'ko' ? '日本語に切り替え' : '한국어로 전환'}
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium">
                {currentLanguage === 'ko' ? '🇯🇵' : '🇰🇷'}
              </span>
            </button>
          </div>
          
          {/* 개발 모드 표시 */}
          {!isFirebaseConfigValid() && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm text-yellow-800 font-medium">
                  {currentLanguage === 'ko' ? '개발 모드 (Firebase 미연결)' : '開発モード (Firebase未接続)'}
                </span>
              </div>
              <p className="text-xs text-yellow-600 mt-1 text-center">
                {currentLanguage === 'ko' 
                  ? '테스트 계정으로 로그인 가능: admin@hanguru.school / password123' 
                  : 'テストアカウントでログイン可能: admin@hanguru.school / password123'
                }
              </p>
            </div>
          )}
        </div>

        {/* 로그인 방법 선택 */}
        <div className="flex rounded-lg shadow-sm">
          <button
            type="button"
            onClick={() => setLoginMethod('password')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg border ${
              loginMethod === 'password'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t.emailPassword}
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('card')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg border-t border-r border-b ${
              loginMethod === 'card'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t.cardAuthentication}
          </button>
        </div>

        {/* 이메일/비밀번호 로그인 */}
        {loginMethod === 'password' && (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t.email}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={t.emailPlaceholder}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t.password}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={t.passwordPlaceholder}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.loginInProgress : t.login}
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t.or}</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleLineLogin}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm bg-green-500 text-sm font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                {t.loginWithLine}
              </button>
            </div>

            {/* 가입하기 링크 */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                {t.noAccount}{' '}
                <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                  {t.signUp}
                </Link>
              </p>
            </div>

            {/* 테스트 계정 정보 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">{t.testAccounts}</h3>
              <div className="text-xs text-blue-700 space-y-2">
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{t.adminAccount}:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard('admin@hanguru.school', '관리자 이메일')}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                    >
                      admin@hanguru.school
                    </button>
                    <button
                      onClick={() => copyToClipboard('admin123!', '관리자 비밀번호')}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                    >
                      admin123!
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{t.teacherAccount}:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard('teacher@hanguru.school', '강사 이메일')}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                    >
                      teacher@hanguru.school
                    </button>
                    <button
                      onClick={() => copyToClipboard('teacher456!', '강사 비밀번호')}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                    >
                      teacher456!
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{t.studentAccount}:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard('student@hanguru.school', '학생 이메일')}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                    >
                      student@hanguru.school
                    </button>
                    <button
                      onClick={() => copyToClipboard('student789!', '학생 비밀번호')}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                    >
                      student789!
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{t.staffAccount}:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard('staff@hanguru.school', '직원 이메일')}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                    >
                      staff@hanguru.school
                    </button>
                    <button
                      onClick={() => copyToClipboard('staff012!', '직원 비밀번호')}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                    >
                      staff012!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* 카드 인증 */}
        {loginMethod === 'card' && (
          <div className="mt-8 space-y-6">
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <div className="text-center">
                {!cardAuthAttempted ? (
                  <div>
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t.cardAuthTitle}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {t.cardAuthSubtitle}
                    </p>
                    <button
                      onClick={handleCardAuth}
                      className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {t.authenticate}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t.authenticating}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {isCountingDown ? `${countdown}${t.cardAuthCountdown}` : t.authenticationFailed}
                    </p>
                    {!isCountingDown && (
                      <button
                        onClick={handleRetry}
                        className="w-full py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {t.cardAuthRetry}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 