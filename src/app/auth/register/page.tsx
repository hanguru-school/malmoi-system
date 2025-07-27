'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Translations {
  title: string;
  subtitle: string;
  nameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  roleLabel: string;
  registerButton: string;
  loginLink: string;
  backToMain: string;
  successMessage: string;
  errorMessage: string;
  loadingMessage: string;
  studentRole: string;
  teacherRole: string;
  staffRole: string;
  passwordMismatch: string;
  passwordTooShort: string;
  invalidEmail: string;
}

export default function RegisterPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'ko' | 'ja'>('ko');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'STAFF'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // 번역 텍스트
  const translations: Record<'ko' | 'ja', Translations> = {
    ko: {
      title: '회원가입',
      subtitle: 'MalMoi 한국어 교실에 가입하세요',
      nameLabel: '이름',
      emailLabel: '이메일',
      passwordLabel: '비밀번호',
      confirmPasswordLabel: '비밀번호 확인',
      roleLabel: '역할',
      registerButton: '회원가입',
      loginLink: '이미 계정이 있으신가요? 로그인',
      backToMain: '메인 페이지로 돌아가기',
      successMessage: '회원가입이 완료되었습니다!',
      errorMessage: '회원가입에 실패했습니다.',
      loadingMessage: '회원가입 중...',
      studentRole: '학생',
      teacherRole: '선생님',
      staffRole: '직원',
      passwordMismatch: '비밀번호가 일치하지 않습니다.',
      passwordTooShort: '비밀번호는 최소 6자 이상이어야 합니다.',
      invalidEmail: '올바른 이메일 형식이 아닙니다.'
    },
    ja: {
      title: '新規登録',
      subtitle: 'MalMoi韓国語教室に登録してください',
      nameLabel: 'お名前',
      emailLabel: 'メールアドレス',
      passwordLabel: 'パスワード',
      confirmPasswordLabel: 'パスワード確認',
      roleLabel: '役割',
      registerButton: '登録',
      loginLink: 'すでにアカウントをお持ちの方はこちら',
      backToMain: 'メインページに戻る',
      successMessage: '登録が完了しました！',
      errorMessage: '登録に失敗しました。',
      loadingMessage: '登録中...',
      studentRole: '学生',
      teacherRole: '先生',
      staffRole: 'スタッフ',
      passwordMismatch: 'パスワードが一致しません。',
      passwordTooShort: 'パスワードは6文字以上である必要があります。',
      invalidEmail: '正しいメールアドレスの形式ではありません。'
    }
  };

  const t = translations[currentLanguage];

  // 언어 전환 함수
  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === 'ko' ? 'ja' : 'ko');
  };

  // 입력 검증
  const validateForm = () => {
    if (password !== confirmPassword) {
      setErrorMessage(t.passwordMismatch);
      return false;
    }

    if (password.length < 6) {
      setErrorMessage(t.passwordTooShort);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage(t.invalidEmail);
      return false;
    }

    return true;
  };

  // 회원가입 처리
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(t.successMessage);
        setTimeout(() => {
          router.push('/auth/login?success=register&message=' + encodeURIComponent('회원가입이 완료되었습니다. 로그인해주세요.'));
        }, 2000);
      } else {
        setErrorMessage(data.error || t.errorMessage);
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setErrorMessage(t.errorMessage);
    } finally {
      setLoading(false);
    }
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

        {/* 회원가입 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t.nameLabel}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={currentLanguage === 'ko' ? '홍길동' : '田中太郎'}
              />
            </div>

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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={currentLanguage === 'ko' ? '최소 6자 이상' : '6文字以上'}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t.confirmPasswordLabel}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={currentLanguage === 'ko' ? '비밀번호 재입력' : 'パスワード再入力'}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                {t.roleLabel}
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'STUDENT' | 'TEACHER' | 'STAFF')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="STUDENT">{t.studentRole}</option>
                <option value="TEACHER">{t.teacherRole}</option>
                <option value="STAFF">{t.staffRole}</option>
              </select>
            </div>
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t.registerButton
            )}
          </button>

          {/* 로그인 링크 */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                {t.loginLink}
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