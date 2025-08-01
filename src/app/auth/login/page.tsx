'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock, Building, GraduationCap, Users, UserCheck } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
  accountType: 'master' | 'admin' | 'teacher' | 'staff' | 'student';
}

interface UserData {
  email: string;
  accountType: string;
  name: string;
  role: string;
  permissions?: string[];
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    accountType: 'master'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 역할별 대시보드 경로 매핑
  const getDashboardPath = (accountType: string): string => {
    switch (accountType) {
      case 'master':
      case 'admin':
        return '/admin';
      case 'teacher':
        return '/teacher';
      case 'staff':
        return '/staff';
      case 'student':
        return '/student';
      default:
        return '/employee';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 샘플 로그인 검증 - 역할별 계정 정보
      const validCredentials = {
        master: [
          { email: 'master@hanguru.com', password: 'master123', name: '마스터 관리자' }
        ],
        admin: [
          { email: 'admin@hanguru.com', password: 'admin123', name: '시스템 관리자' }
        ],
        teacher: [
          { email: 'teacher@hanguru.com', password: 'teacher123', name: '田中先生' },
          { email: 'yamada@hanguru.com', password: 'yamada123', name: '山田先生' }
        ],
        staff: [
          { email: 'staff@hanguru.com', password: 'staff123', name: '사무직원' },
          { email: 'tanaka@hanguru.com', password: 'tanaka123', name: '田中さん' }
        ],
        student: [
          { email: 'student@hanguru.com', password: 'student123', name: '학생' }
        ]
      };

      const isValid = validCredentials[formData.accountType]?.some(
        cred => cred.email === formData.email && cred.password === formData.password
      );

      if (isValid) {
        const userInfo = validCredentials[formData.accountType]?.find(
          cred => cred.email === formData.email && cred.password === formData.password
        );

        // 로그인 성공 - 세션 저장
        const userData: UserData = {
          email: formData.email,
          accountType: formData.accountType,
          name: userInfo?.name || '사용자',
          role: formData.accountType,
          permissions: getPermissionsByRole(formData.accountType)
        };

        console.log('Login successful, user data:', userData);

        localStorage.setItem('user-session', JSON.stringify(userData));
        document.cookie = `user-session=${JSON.stringify(userData)}; path=/; max-age=86400`;

        // 역할에 따른 적절한 대시보드로 리다이렉트
        const dashboardPath = getDashboardPath(formData.accountType);
        console.log('Redirecting to dashboard:', dashboardPath);
        router.push(dashboardPath);
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 역할별 권한 설정
  const getPermissionsByRole = (role: string): string[] => {
    switch (role) {
      case 'master':
        return ['*']; // 모든 권한
      case 'admin':
        return ['system_management', 'user_management', 'analytics_access', 'device_management'];
      case 'teacher':
        return ['schedule_management', 'lesson_notes_management', 'curriculum_management', 'student_management'];
      case 'staff':
        return ['work_log_management', 'report_access', 'reservation_management'];
      case 'student':
        return ['reservation_management', 'notes_access', 'homework_management', 'profile_management'];
      default:
        return [];
    }
  };

  const accountTypeOptions = [
    {
      value: 'master',
      label: '마스터',
      description: '시스템 전체 관리',
      icon: Building,
      color: 'text-red-600'
    },
    {
      value: 'admin',
      label: '관리자',
      description: '시스템 관리 및 운영',
      icon: Building,
      color: 'text-blue-600'
    },
    {
      value: 'teacher',
      label: '선생님',
      description: '수업 및 커리큘럼 관리',
      icon: GraduationCap,
      color: 'text-green-600'
    },
    {
      value: 'staff',
      label: '사무직원',
      description: '업무 및 예약 관리',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      value: 'student',
      label: '학생',
      description: '수업 예약 및 학습',
      icon: UserCheck,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">한구루 스쿨</h1>
          <p className="mt-2 text-sm text-gray-600">
            역할별 포털에 로그인하세요
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 계정 타입 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계정 타입
              </label>
              <div className="grid grid-cols-1 gap-3">
                {accountTypeOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <label
                      key={option.value}
                      className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-gray-400"
                    >
                      <input
                        type="radio"
                        name="accountType"
                        value={option.value}
                        checked={formData.accountType === option.value}
                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <div className="flex items-center">
                              <IconComponent className={`w-5 h-5 ${option.color} mr-2`} />
                              <span className="font-medium text-gray-900">{option.label}</span>
                            </div>
                            <div className="text-gray-500">{option.description}</div>
                          </div>
                        </div>
                        {formData.accountType === option.value && (
                          <div className={`shrink-0 ${option.color}`}>
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일 주소
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="이메일을 입력하세요"
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* 로그인 버튼 */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    로그인 중...
                  </div>
                ) : (
                  '로그인'
                )}
              </button>
            </div>
          </form>

          {/* 샘플 계정 정보 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">샘플 계정</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 space-y-2">
              <p><strong>마스터:</strong> master@hanguru.com / master123</p>
              <p><strong>관리자:</strong> admin@hanguru.com / admin123</p>
              <p><strong>선생님:</strong> teacher@hanguru.com / teacher123</p>
              <p><strong>사무직원:</strong> staff@hanguru.com / staff123</p>
              <p><strong>학생:</strong> student@hanguru.com / student123</p>
            </div>
            
            {/* 세션 초기화 버튼 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('user-session');
                  document.cookie = 'user-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                  window.location.reload();
                }}
                className="w-full px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                세션 초기화 (디버깅용)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 