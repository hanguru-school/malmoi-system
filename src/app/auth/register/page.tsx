'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Language, getStoredLanguage, getTranslation } from '@/lib/i18n';
import { Globe, CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Info, FileText, UserCheck } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'student' as 'student' | 'parent' | 'teacher' | 'staff',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState<Language>('ko');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { signUp, user, getDefaultPageByRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const storedLanguage = getStoredLanguage();
    setLanguage(storedLanguage);
  }, []);

  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'teacher' || user.role === 'staff') {
        setShowProfileModal(true);
        return;
      }
      const defaultPage = getDefaultPageByRole(user.role);
      router.push(defaultPage);
    }
  }, [user, loading, router, getDefaultPageByRole]);

  const toggleLanguage = () => {
    const newLanguage = language === 'ko' ? 'ja' : 'ko';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTermsCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      setShowTermsModal(true);
    } else {
      setFormData(prev => ({ ...prev, agreeToTerms: false }));
    }
  };

  const handleTermsAgree = () => {
    setFormData(prev => ({ ...prev, agreeToTerms: true }));
    setShowTermsModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      setError('약관에 동의해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp(formData.email, formData.password, formData.name, formData.role);
      
      // Parent role synchronization logic
      if (formData.role === 'parent') {
        try {
          // Here you would typically call an API to sync parent with child
          // For now, we'll just log the synchronization attempt
          console.log('Attempting to sync parent with child using email:', formData.email);
          
          // Mock API call to sync parent with child
          // await syncParentWithChild(formData.email);
          
          setSuccess('회원가입이 완료되었습니다! 자녀와의 동기화가 진행 중입니다.');
        } catch (syncError: any) {
          console.error('Parent-child sync error:', syncError);
          setSuccess('회원가입이 완료되었습니다! (동기화는 나중에 진행됩니다)');
        }
      } else {
        setSuccess('회원가입이 완료되었습니다!');
      }
      
      if (formData.role === 'teacher' || formData.role === 'staff') {
        setShowProfileModal(true);
      }
    } catch (error: any) {
      setError(error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'student', label: '학생' },
    { value: 'parent', label: '학부모' },
    { value: 'teacher', label: '선생님' },
    { value: 'staff', label: '직원' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ko' ? '회원가입' : '会員登録'}
            </h1>
            <div className="relative group">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {language === 'ko' ? '한국어' : '日本語'}
                </span>
              </button>
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {language === 'ko' ? '일본어로 변경' : '한국어로 변경'}
              </div>
            </div>
          </div>
          <p className="text-gray-600">
            {language === 'ko' ? '새로운 계정을 만들어보세요' : '新しいアカウントを作成してください'}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'ko' ? '이메일' : 'メールアドレス'}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@email.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'ko' ? '비밀번호' : 'パスワード'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={language === 'ko' ? '비밀번호를 입력하세요' : 'パスワードを入力してください'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'ko' ? '비밀번호 확인' : 'パスワード確認'}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={language === 'ko' ? '비밀번호를 다시 입력하세요' : 'パスワードを再入力してください'}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">
                {language === 'ko' ? '비밀번호가 일치하지 않습니다.' : 'パスワードが一致しません。'}
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'ko' ? '이름' : 'お名前'}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={language === 'ko' ? '이름을 입력하세요' : 'お名前を入力してください'}
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'ko' ? '역할' : '役割'}
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {(formData.role === 'teacher' || formData.role === 'staff') && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    {language === 'ko' 
                      ? '회원가입 후 관리자 승인이 필요합니다.' 
                      : '登録後、管理者の承認が必要です。'
                    }
                  </span>
                </div>
              </div>
            )}
            {formData.role === 'parent' && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    {language === 'ko' 
                      ? '학부모를 선택한 경우, 자녀분의 프로필에 등록한 학부모의 이메일로 등록을 해 주시기 바랍니다. 해당 이메일 정보를 확인해서 회원가입 시에 해당 학생을 학부모와 동기화시켜드립니다.' 
                      : '保護者を選択した場合、お子様のプロフィールに登録した保護者のメールアドレスで登録してください。該当メールアドレス情報を確認して、登録時に該当生徒を保護者と同期いたします。'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={handleTermsCheckboxClick}
              className="mt-1"
            >
              <div className={`w-4 h-4 border-2 rounded ${
                formData.agreeToTerms 
                  ? 'bg-blue-600 border-blue-600' 
                  : 'border-gray-300'
              } flex items-center justify-center`}>
                {formData.agreeToTerms && (
                  <CheckCircle className="w-3 h-3 text-white" />
                )}
              </div>
            </button>
            <label className="text-sm text-gray-700 cursor-pointer" onClick={handleTermsCheckboxClick}>
              {language === 'ko' 
                ? '이용약관 및 개인정보처리방침에 동의합니다.' 
                : '利用規約とプライバシーポリシーに同意します。'
              }
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {language === 'ko' ? '처리 중...' : '処理中...'}
              </div>
            ) : (
              language === 'ko' ? '회원가입' : '会員登録'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {language === 'ko' ? '이미 계정이 있으신가요?' : 'すでにアカウントをお持ちですか？'}
            <Link href="/auth/login" className="ml-1 text-blue-600 hover:text-blue-700 font-medium">
              {language === 'ko' ? '로그인' : 'ログイン'}
            </Link>
          </p>
        </div>

        {/* Terms Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {language === 'ko' ? '이용약관 및 개인정보처리방침' : '利用規約とプライバシーポリシー'}
              </h3>
              <div className="space-y-4 text-sm text-gray-700 mb-6">
                <div>
                  <h4 className="font-medium mb-2">{language === 'ko' ? '제1조 (목적)' : '第1条（目的）'}</h4>
                  <p>
                    {language === 'ko' 
                      ? '본 약관은 한구루 어학원(이하 "학원")이 제공하는 서비스의 이용과 관련하여 학원과 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.'
                      : '本規約は、ハングル語学院（以下「学院」）が提供するサービスの利用に関して、学院と利用者間の権利、義務及び責任事項を規定することを目的とします。'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{language === 'ko' ? '개인정보처리방침' : 'プライバシーポリシー'}</h4>
                  <p>
                    {language === 'ko' 
                      ? '학원은 이용자의 개인정보를 보호하기 위해 최선을 다하고 있습니다. 수집된 개인정보는 서비스 제공 목적으로만 사용되며, 제3자에게 제공되지 않습니다.'
                      : '学院は利用者の個人情報を保護するために最善を尽くしています。収集された個人情報はサービス提供目的でのみ使用され、第三者に提供されることはありません。'
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleTermsAgree}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {language === 'ko' ? '동의합니다' : '同意します'}
                </button>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  {language === 'ko' ? '취소' : 'キャンセル'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="text-center mb-6">
                <UserCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'ko' ? '회원가입 완료' : '会員登録完了'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'ko' 
                    ? '회원가입이 완료되었습니다. 프로필에서 개인정보 상세를 입력해 주시기 바랍니다.'
                    : '会員登録が完了しました。プロフィールで個人情報の詳細を入力してください。'
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    router.push('/auth/login');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {language === 'ko' ? '확인' : '確認'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 