'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, ArrowLeft, CheckCircle, XCircle, Loader2, Languages } from 'lucide-react';
import TermsModal from '@/components/common/TermsModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface Translations {
  title: string;
  subtitle: string;
  kanjiNameLabel: string;
  yomiganaLabel: string;
  koreanNameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  roleLabel: string;
  studentEmailLabel: string;
  registerButton: string;
  loginLink: string;
  backToMain: string;
  successMessage: string;
  errorMessage: string;
  loadingMessage: string;
  studentRole: string;
  parentRole: string;
  teacherRole: string;
  staffRole: string;
  adminRole: string;
  passwordMismatch: string;
  passwordTooShort: string;
  invalidEmail: string;
  invalidPhone: string;
  termsRequired: string;
  kanjiRequired: string;
  yomiganaRequired: string;
  emailRequired: string;
  phoneRequired: string;
  roleRequired: string;
  studentEmailRequired: string;
  studentNotFound: string;
  termsAgreement: string;
  viewTerms: string;
}

export default function RegisterPage() {
  const { language, toggleLanguage } = useLanguage();
  const [kanjiName, setKanjiName] = useState('');
  const [yomigana, setYomigana] = useState('');
  const [koreanName, setKoreanName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'ADMIN'>('STUDENT');
  const [studentEmail, setStudentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // 번역 텍스트
  const translations: Record<'ko' | 'ja', Translations> = {
    ko: {
      title: '회원가입',
      subtitle: 'MalMoi 한국어 교실에 가입하세요',
      kanjiNameLabel: '한자 이름',
      yomiganaLabel: '요미가나',
      koreanNameLabel: '한글 이름 (선택)',
      emailLabel: '이메일',
      phoneLabel: '연락처',
      passwordLabel: '비밀번호',
      confirmPasswordLabel: '비밀번호 확인',
      roleLabel: '역할',
      studentEmailLabel: '학생 이메일',
      registerButton: '회원가입',
      loginLink: '이미 계정이 있으신가요? 로그인',
      backToMain: '메인 페이지로 돌아가기',
      successMessage: '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.',
      errorMessage: '회원가입에 실패했습니다.',
      loadingMessage: '회원가입 중...',
      studentRole: '학생',
      parentRole: '학부모',
      teacherRole: '선생님',
      staffRole: '직원',
      adminRole: '관리자',
      passwordMismatch: '비밀번호가 일치하지 않습니다.',
      passwordTooShort: '비밀번호는 최소 6자 이상이어야 합니다.',
      invalidEmail: '올바른 이메일 형식이 아닙니다.',
      invalidPhone: '올바른 연락처 형식이 아닙니다.',
      termsRequired: '약관에 동의해야 합니다.',
      kanjiRequired: '한자 이름을 입력해주세요.',
      yomiganaRequired: '요미가나를 입력해주세요.',
      emailRequired: '이메일을 입력해주세요.',
      phoneRequired: '연락처를 입력해주세요.',
      roleRequired: '역할을 선택해주세요.',
      studentEmailRequired: '학생 이메일을 입력해주세요.',
      studentNotFound: '해당 이메일의 학생을 찾을 수 없습니다.',
      termsAgreement: '회원 약관에 동의합니다',
      viewTerms: '약관 보기'
    },
    ja: {
      title: '新規登録',
      subtitle: 'MalMoi韓国語教室に登録してください',
      kanjiNameLabel: '漢字氏名',
      yomiganaLabel: 'よみがな',
      koreanNameLabel: '韓国語氏名（選択）',
      emailLabel: 'メールアドレス',
      phoneLabel: '連絡先',
      passwordLabel: 'パスワード',
      confirmPasswordLabel: 'パスワード確認',
      roleLabel: '役割',
      studentEmailLabel: '学生メールアドレス',
      registerButton: '登録',
      loginLink: 'すでにアカウントをお持ちの方はこちら',
      backToMain: 'メインページに戻る',
      successMessage: '登録が完了しました！ログインページに移動します。',
      errorMessage: '登録に失敗しました。',
      loadingMessage: '登録中...',
      studentRole: '学生',
      parentRole: '保護者',
      teacherRole: '先生',
      staffRole: 'スタッフ',
      adminRole: '管理者',
      passwordMismatch: 'パスワードが一致しません。',
      passwordTooShort: 'パスワードは6文字以上である必要があります。',
      invalidEmail: '正しいメールアドレスの形式ではありません。',
      invalidPhone: '正しい連絡先の形式ではありません。',
      termsRequired: '利用規約に同意する必要があります。',
      kanjiRequired: '漢字氏名を入力してください。',
      yomiganaRequired: 'よみがなを入力してください。',
      emailRequired: 'メールアドレスを入力してください。',
      phoneRequired: '連絡先を入力してください。',
      roleRequired: '役割を選択してください。',
      studentEmailRequired: '学生メールアドレスを入力してください。',
      studentNotFound: '該当メールアドレスの学生が見つかりません。',
      termsAgreement: '利用規約に同意します',
      viewTerms: '規約を見る'
    }
  };

  const t = translations[language];

  // 필드 에러 초기화
  const clearFieldErrors = () => {
    setFieldErrors({});
  };

  // 입력 검증
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // 한자 이름 검증
    if (!kanjiName.trim()) {
      errors.kanjiName = t.kanjiRequired;
    }

    // 요미가나 검증
    if (!yomigana.trim()) {
      errors.yomigana = t.yomiganaRequired;
    }

    // 이메일 검증
    if (!email.trim()) {
      errors.email = t.emailRequired;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = t.invalidEmail;
      }
    }

    // 연락처 검증
    if (!phone.trim()) {
      errors.phone = t.phoneRequired;
    } else {
      const phoneRegex = /^[0-9-+\s()]+$/;
      if (!phoneRegex.test(phone) || phone.length < 10) {
        errors.phone = t.invalidPhone;
      }
    }

    // 비밀번호 검증
    if (password.length < 6) {
      errors.password = t.passwordTooShort;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = t.passwordMismatch;
    }

    // 역할별 추가 검증
    if (role === 'PARENT') {
      if (!studentEmail.trim()) {
        errors.studentEmail = t.studentEmailRequired;
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(studentEmail)) {
          errors.studentEmail = t.invalidEmail;
        }
      }
    }

    // 약관 동의 검증
    if (!hasAgreedToTerms) {
      errors.terms = t.termsRequired;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 약관 동의 처리
  const handleTermsAgreement = () => {
    setHasAgreedToTerms(true);
    setShowTermsModal(false);
  };

  // 회원가입 처리
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    clearFieldErrors();

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
        body: JSON.stringify({ 
          kanjiName, 
          yomigana, 
          koreanName, 
          email, 
          phone, 
          password, 
          role,
          studentEmail: role === 'PARENT' ? studentEmail : undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(t.successMessage);
        // 자동 로그인이 되었으므로 역할에 따라 대시보드로 이동
        setTimeout(() => {
          router.push('/auth/login');
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
      {/* 언어 변경 버튼 */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-lg"
      >
        <Languages className="w-4 h-4" />
        {language === 'ja' ? '한국어' : '日本語'}
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
            {/* 한자 이름 */}
            <div>
              <label htmlFor="kanjiName" className="block text-sm font-medium text-gray-700">
                {t.kanjiNameLabel} *
              </label>
              <input
                id="kanjiName"
                name="kanjiName"
                type="text"
                required
                value={kanjiName}
                onChange={(e) => setKanjiName(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.kanjiName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={language === 'ko' ? '田中太郎' : '田中太郎'}
              />
              {fieldErrors.kanjiName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.kanjiName}</p>
              )}
            </div>

            {/* 요미가나 */}
            <div>
              <label htmlFor="yomigana" className="block text-sm font-medium text-gray-700">
                {t.yomiganaLabel} *
              </label>
              <input
                id="yomigana"
                name="yomigana"
                type="text"
                required
                value={yomigana}
                onChange={(e) => setYomigana(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.yomigana ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={language === 'ko' ? 'たなかたろう' : 'たなかたろう'}
              />
              {fieldErrors.yomigana && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.yomigana}</p>
              )}
            </div>

            {/* 한글 이름 */}
            <div>
              <label htmlFor="koreanName" className="block text-sm font-medium text-gray-700">
                {t.koreanNameLabel}
              </label>
              <input
                id="koreanName"
                name="koreanName"
                type="text"
                value={koreanName}
                onChange={(e) => setKoreanName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={language === 'ko' ? '홍길동' : '홍길동'}
              />
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t.emailLabel} *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={language === 'ko' ? 'example@email.com' : 'example@email.com'}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* 연락처 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {t.phoneLabel} *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={language === 'ko' ? '010-1234-5678' : '090-1234-5678'}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
              )}
            </div>

            {/* 비밀번호 */}
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
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={language === 'ko' ? '최소 6자 이상' : '6文字以上'}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* 비밀번호 확인 */}
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
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={language === 'ko' ? '비밀번호 재입력' : 'パスワード再入力'}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* 역할 선택 */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                {t.roleLabel} *
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'ADMIN')}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.role ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="STUDENT">{t.studentRole}</option>
                <option value="PARENT">{t.parentRole}</option>
                <option value="TEACHER">{t.teacherRole}</option>
                <option value="STAFF">{t.staffRole}</option>
                <option value="ADMIN">{t.adminRole}</option>
              </select>
              {fieldErrors.role && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
              )}
            </div>

            {/* 학부모인 경우 학생 이메일 입력 */}
            {role === 'PARENT' && (
              <div>
                <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700">
                  {t.studentEmailLabel} *
                </label>
                <input
                  id="studentEmail"
                  name="studentEmail"
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.studentEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={language === 'ko' ? '학생의 이메일 주소' : '学生のメールアドレス'}
                />
                {fieldErrors.studentEmail && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.studentEmail}</p>
                )}
              </div>
            )}

            {/* 약관 동의 */}
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms-agreement"
                  checked={hasAgreedToTerms}
                  onChange={(e) => {
                    if (e.target.checked && !hasAgreedToTerms) {
                      // 처음 체크할 때만 약관 모달 열기
                      setShowTermsModal(true);
                    }
                    setHasAgreedToTerms(e.target.checked);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms-agreement" className="ml-2 text-sm text-gray-700">
                  {t.termsAgreement}
                </label>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="ml-2 text-sm text-blue-600 hover:text-blue-500 underline"
                >
                  {t.viewTerms}
                </button>
              </div>
              {fieldErrors.terms && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.terms}</p>
              )}
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

      {/* 약관 모달 */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAgree={handleTermsAgreement}
        role={role}
        language={language}
      />
    </div>
  );
} 