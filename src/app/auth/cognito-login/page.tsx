'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createOAuthUrl } from '@/lib/cognito-provider';

function CognitoLoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'oauth_error':
        return 'OAuth 인증 중 오류가 발생했습니다.';
      case 'no_code':
        return '인증 코드를 받지 못했습니다.';
      case 'session_error':
        return '세션을 가져오는 중 오류가 발생했습니다.';
      case 'invalid_session':
        return '세션이 유효하지 않습니다.';
      case 'no_user':
        return '사용자 정보를 찾을 수 없습니다.';
      case 'token_error':
        return '토큰 교환 중 오류가 발생했습니다.';
      case 'callback_error':
        return '콜백 처리 중 오류가 발생했습니다.';
      case 'processing':
        return '처리 중입니다. 잠시만 기다려주세요.';
      default:
        return '알 수 없는 오류가 발생했습니다.';
    }
  };

  // URL 파라미터에서 오류 메시지 확인
  const errorParam = searchParams.get('error');
  
  if (errorParam) {
    setError(getErrorMessage(errorParam));
  }

  const handleCognitoLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 새로운 createOAuthUrl 함수 사용
      const redirectUri = process.env.NEXT_PUBLIC_COGNITO_CALLBACK_URL || 'https://app.hanguru.school/api/auth/callback/cognito';
      const cognitoUrl = createOAuthUrl(redirectUri, 'malmoi-system-state');

      console.log('Cognito OAuth URL:', cognitoUrl);

      // Cognito 로그인 페이지로 리다이렉트
      window.location.href = cognitoUrl;

    } catch (error: any) {
      console.error('Cognito 로그인 오류:', error);
      setError(error.message || 'Cognito 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatabaseLogin = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AWS Cognito 또는 데이터베이스 로그인을 선택하세요
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleCognitoLogin}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
              ) : (
                'AWS Cognito로 로그인'
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">또는</span>
              </div>
            </div>

            <button
              onClick={handleDatabaseLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              데이터베이스 로그인
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p><strong>참고:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Cognito User Pool: malmoi-system-pool</li>
            <li>Cognito User Pool ID: ap-northeast-1_5R7g8tN40</li>
            <li>Cognito App Client: malmoi-system</li>
            <li>Cognito Client ID: 4bdn0n9r92huqpcs21e0th1nve</li>
            <li>Region: ap-northeast-1 (Tokyo)</li>
            <li>OAuth Callback URL: https://app.hanguru.school/api/auth/callback/cognito</li>
            <li>OAuth Scopes: email openid phone</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CognitoLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <CognitoLoginContent />
    </Suspense>
  );
} 