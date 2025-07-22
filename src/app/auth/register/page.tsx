'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Language, getStoredLanguage, getTranslation } from '@/lib/i18n';
import LanguageSelector from '@/components/LanguageSelector';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'student' as 'student' | 'teacher' | 'staff',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState<Language>('ko');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  
  // LINE 회원가입 모달 상태
  const [showLineModal, setShowLineModal] = useState(false);
  const [lineUserInfo, setLineUserInfo] = useState({
    name: '',
    role: 'student' as 'student' | 'teacher' | 'staff'
  });

  const { signUp, signInWithLine, signIn, user, getDefaultPageByRole } = useAuth();
  const router = useRouter();

  // 언어 초기화 및 약관 동의 상태 확인
  useEffect(() => {
    const storedLanguage = getStoredLanguage();
    setLanguage(storedLanguage);
    
    // 약관 동의 상태 확인
    const termsAgreed = localStorage.getItem('termsAgreed');
    if (termsAgreed === 'true') {
      setFormData(prev => ({ ...prev, agreeToTerms: true }));
      // 약관 동의 상태 초기화 (한 번만 사용)
      localStorage.removeItem('termsAgreed');
    }
  }, []);

  // 회원가입 성공 후 권한별 페이지 리다이렉션
  useEffect(() => {
    if (user && !loading) {
      const defaultPage = getDefaultPageByRole(user.role);
      router.push(defaultPage);
    }
  }, [user, loading, router, getDefaultPageByRole]);

  const t = getTranslation(language);

  // 비밀번호 강도 계산
  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 6) return 'weak';
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
  };

  // 이메일 유효성 검사
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 이메일 중복 확인 (디바운스 적용)
  const checkEmailAvailability = useCallback(
    async (email: string) => {
      if (!email || !isValidEmail(email)) {
        setEmailAvailable(null);
        return;
      }

      setEmailChecking(true);
      try {
        // 실제로는 Firebase에서 이메일 중복 확인을 해야 하지만,
        // 여기서는 간단한 시뮬레이션을 사용합니다
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 테스트용 이메일들은 이미 사용 중으로 처리
        const existingEmails = [
          'admin@hanguru.school',
          'teacher@hanguru.school', 
          'student@hanguru.school',
          'staff@hanguru.school'
        ];
        
        setEmailAvailable(!existingEmails.includes(email));
      } catch (error) {
        setEmailAvailable(null);
      } finally {
        setEmailChecking(false);
      }
    },
    []
  );

  // 이메일 중복 확인 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      checkEmailAvailability(formData.email);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, checkEmailAvailability]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 비밀번호 강도 업데이트
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // 에러 메시지 초기화
    if (error) {
      setError('');
    }
  };

  const handleLineUserInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLineUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // 유효성 검사
    if (!formData.name.trim()) {
      setError(t.nameRequired);
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError(t.emailRequired);
      setLoading(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError(t.emailInvalid);
      setLoading(false);
      return;
    }

    if (emailAvailable === false) {
      setError(t.emailAlreadyExists);
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError(t.passwordRequired);
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError(t.passwordRequirementsText);
      setLoading(false);
      return;
    }

    if (!formData.confirmPassword) {
      setError(t.confirmPasswordRequired);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t.passwordMismatch);
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError(t.termsRequired);
      setLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password, formData.name, formData.role);
      setSuccess(t.registrationSuccess);
      
      // 성공 후 자동으로 로그인
      setTimeout(async () => {
        try {
          await signIn(formData.email, formData.password);
          router.push('/master');
        } catch (loginError) {
          // 자동 로그인 실패 시 로그인 페이지로 이동
          router.push('/auth/login');
        }
      }, 2000);
    } catch (error: any) {
      setError(error.message || t.registrationFailed);
    } finally {
      setLoading(false);
    }
  };

  // LINE 회원가입
  const handleLineSignUp = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithLine();
      // LINE 로그인 성공 후 모달 표시
      setShowLineModal(true);
    } catch (error: any) {
      setError(error.message || t.lineLoginFailed);
    } finally {
      setLoading(false);
    }
  };

  // LINE 사용자 정보 완료
  const handleLineUserInfoComplete = async () => {
    if (!lineUserInfo.name.trim()) {
      setError(t.enterName);
      return;
    }

    try {
      // 여기서 사용자 정보를 업데이트하는 로직을 추가할 수 있습니다
      // 현재는 바로 마스터 페이지로 이동
      setSuccess(t.registrationSuccess);
      setTimeout(() => {
        router.push('/master');
      }, 2000);
    } catch (error: any) {
      setError(t.userInfoSaveFailed);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'weak': return t.passwordWeak;
      case 'medium': return t.passwordMedium;
      case 'strong': return t.passwordStrong;
      default: return '';
    }
  };

  const getEmailStatusIcon = () => {
    if (emailChecking) {
      return (
        <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    
    if (emailAvailable === true) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    
    if (emailAvailable === false) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t.register}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t.subtitle}
          </p>
          
          {/* 언어 선택기 */}
          <div className="mt-4 flex justify-center">
            <LanguageSelector onLanguageChange={setLanguage} />
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div className="space-y-4">
            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t.name} *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.namePlaceholder}
              />
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t.email} *
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="example@hanguru.school"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {getEmailStatusIcon()}
                </div>
              </div>
              {emailAvailable === false && (
                <p className="mt-1 text-sm text-red-600">{t.emailAlreadyExists}</p>
              )}
              {emailAvailable === true && (
                <p className="mt-1 text-sm text-green-600">사용 가능한 이메일입니다</p>
              )}
            </div>

            {/* 역할 */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                {t.role} *
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="student">{t.student}</option>
                <option value="teacher">{t.teacher}</option>
                <option value="staff">{t.staff}</option>
              </select>
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t.password} *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.passwordMinLength}
              />
              
              {/* 비밀번호 강도 표시 */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ 
                          width: passwordStrength === 'weak' ? '33%' : 
                                 passwordStrength === 'medium' ? '66%' : '100%' 
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{getPasswordStrengthText()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t.passwordRequirementsText}</p>
                </div>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t.confirmPassword} *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.confirmPasswordPlaceholder}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{t.passwordMismatch}</p>
              )}
            </div>

            {/* 약관 동의 */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="text-gray-700">
                  {t.agreeToTerms}{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    {t.termsAndConditions}
                  </Link>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || emailChecking || emailAvailable === false}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.signUpInProgress}
                </div>
              ) : (
                t.signUp
              )}
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">{t.or}</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleLineSignUp}
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm bg-green-500 text-sm font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              {t.registerWithLine}
            </button>
          </div>

          {/* 로그인 링크 */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t.hasAccount}{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                {t.goToLogin}
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* LINE 사용자 정보 입력 모달 */}
      {showLineModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t.additionalInfo}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="lineName" className="block text-sm font-medium text-gray-700 text-left">
                    {t.name} *
                  </label>
                  <input
                    id="lineName"
                    name="name"
                    type="text"
                    required
                    value={lineUserInfo.name}
                    onChange={handleLineUserInfoChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t.namePlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="lineRole" className="block text-sm font-medium text-gray-700 text-left">
                    {t.role} *
                  </label>
                  <select
                    id="lineRole"
                    name="role"
                    required
                    value={lineUserInfo.role}
                    onChange={handleLineUserInfoChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="student">{t.student}</option>
                    <option value="teacher">{t.teacher}</option>
                    <option value="staff">{t.staff}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowLineModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleLineUserInfoComplete}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t.complete}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 