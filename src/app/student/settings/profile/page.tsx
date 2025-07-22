'use client';

import { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Camera, 
  ArrowLeft,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Building,
  MapPinIcon
} from 'lucide-react';
import Link from 'next/link';

interface ProfileData {
  // 기본 정보
  name: {
    kanji: string;
    yomigana: string;
    korean: string;
  };
  email: string;
  phone: string;
  emergencyPhone: string;
  birthDate: string;
  isMinor: boolean;
  
  // 주소 정보
  address: {
    postalCode: string;
    prefecture: string;
    city: string;
    street: string;
    building: string;
    country: string;
  };
  
  // 부모님 정보 (미성년자인 경우)
  parentInfo?: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  
  avatar?: string;
}

export default function StudentProfileSettingsPage() {
  const [profile, setProfile] = useState<ProfileData>({
    name: {
      kanji: '田中太郎',
      yomigana: 'たなかたろう',
      korean: '김학생'
    },
    email: 'student@example.com',
    phone: '090-1234-5678',
    emergencyPhone: '080-9876-5432',
    birthDate: '2008-03-15',
    isMinor: true,
    address: {
      postalCode: '100-0001',
      prefecture: '東京都',
      city: '千代田区',
      street: '千代田1-1-1',
      building: '○○マンション101号室',
      country: 'JP'
    },
    parentInfo: {
      name: '田中花子',
      relationship: '母',
      phone: '090-1111-2222',
      email: 'parent@example.com'
    },
    avatar: '/avatars/student.jpg'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // 비밀번호 변경 관련
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNameChange = (type: keyof ProfileData['name'], value: string) => {
    setProfile(prev => ({
      ...prev,
      name: {
        ...prev.name,
        [type]: value
      }
    }));
  };

  const handleAddressChange = (field: keyof ProfileData['address'], value: string) => {
    setProfile(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleParentInfoChange = (field: keyof NonNullable<ProfileData['parentInfo']>, value: string) => {
    setProfile(prev => ({
      ...prev,
      parentInfo: prev.parentInfo ? {
        ...prev.parentInfo,
        [field]: value
      } : {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      }
    }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({
          ...prev,
          avatar: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // 실제 API 호출로 대체
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    // 원래 데이터로 복원
    setProfile({
      name: {
        kanji: '田中太郎',
        yomigana: 'たなかたろう',
        korean: '김학생'
      },
      email: 'student@example.com',
      phone: '090-1234-5678',
      emergencyPhone: '080-9876-5432',
      birthDate: '2008-03-15',
      isMinor: true,
      address: {
        postalCode: '100-0001',
        prefecture: '東京都',
        city: '千代田区',
        street: '千代田1-1-1',
        building: '○○マンション101号室',
        country: 'JP'
      },
      parentInfo: {
        name: '田中花子',
        relationship: '母',
        phone: '090-1111-2222',
        email: 'parent@example.com'
      },
      avatar: '/avatars/student.jpg'
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      setPasswordError('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setPasswordError('');
    setSaving(true);
    // 실제 API 호출로 대체
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    
    // 폼 초기화
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    setTimeout(() => setSaved(false), 3000);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const isMinor = new Date().getFullYear() - new Date(profile.birthDate).getFullYear() < 20;

  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">개인정보</h1>
            <p className="text-gray-600">개인정보를 수정하고 관리하세요</p>
          </div>
          <Link
            href="/student/profile"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>돌아가기</span>
          </Link>
        </div>

        <div className="space-y-6">
          {/* 프로필 사진 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">프로필 사진</h2>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="프로필 사진" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">프로필 사진</h3>
                <p className="text-sm text-gray-600">
                  {isEditing 
                    ? '사진을 클릭하여 변경할 수 있습니다' 
                    : '편집 모드에서 사진을 변경할 수 있습니다'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  편집
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? '저장 중...' : '저장'}</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {/* 이름 정보 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">이름</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      한자 이름
                    </label>
                    <input
                      type="text"
                      value={profile.name.kanji}
                      onChange={(e) => handleNameChange('kanji', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="田中太郎"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      요미가나
                    </label>
                    <input
                      type="text"
                      value={profile.name.yomigana}
                      onChange={(e) => handleNameChange('yomigana', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="たなかたろう"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      한글 이름
                    </label>
                    <input
                      type="text"
                      value={profile.name.korean}
                      onChange={(e) => handleNameChange('korean', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="김학생"
                    />
                  </div>
                </div>
              </div>

              {/* 연락처 정보 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">연락처</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="090-1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      비상연락처
                    </label>
                    <input
                      type="tel"
                      value={profile.emergencyPhone}
                      onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="080-9876-5432"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      생년월일
                    </label>
                    <input
                      type="date"
                      value={profile.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
                {isMinor && (
                  <div className="mt-2 flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">미성년자입니다. 부모님 정보를 입력해주세요.</span>
                  </div>
                )}
              </div>

              {/* 부모님 정보 (미성년자인 경우) */}
              {isMinor && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">부모님 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        부모님 이름
                      </label>
                      <input
                        type="text"
                        value={profile.parentInfo?.name || ''}
                        onChange={(e) => handleParentInfoChange('name', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="田中花子"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        관계
                      </label>
                      <select
                        value={profile.parentInfo?.relationship || ''}
                        onChange={(e) => handleParentInfoChange('relationship', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="父">父</option>
                        <option value="母">母</option>
                        <option value="祖父">祖父</option>
                        <option value="祖母">祖母</option>
                        <option value="保護者">保護者</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        부모님 전화번호
                      </label>
                      <input
                        type="tel"
                        value={profile.parentInfo?.phone || ''}
                        onChange={(e) => handleParentInfoChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="090-1111-2222"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        부모님 이메일
                      </label>
                      <input
                        type="email"
                        value={profile.parentInfo?.email || ''}
                        onChange={(e) => handleParentInfoChange('email', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="parent@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 주소 정보 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">주소</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      우편번호
                    </label>
                    <input
                      type="text"
                      value={profile.address.postalCode}
                      onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="100-0001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      도도부현
                    </label>
                    <select
                      value={profile.address.prefecture}
                      onChange={(e) => handleAddressChange('prefecture', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      {prefectures.map(prefecture => (
                        <option key={prefecture} value={prefecture}>{prefecture}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시구정촌
                    </label>
                    <input
                      type="text"
                      value={profile.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="千代田区"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      번지
                    </label>
                    <input
                      type="text"
                      value={profile.address.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="千代田1-1-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      건물명・호수
                    </label>
                    <input
                      type="text"
                      value={profile.address.building}
                      onChange={(e) => handleAddressChange('building', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="○○マンション101号室"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">비밀번호 변경</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="새 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">비밀번호는 8자 이상이어야 합니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="text-red-600 text-sm">{passwordError}</div>
              )}

              <button
                onClick={handlePasswordChange}
                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                비밀번호 변경
              </button>
            </div>
          </div>

          {/* 저장 완료 메시지 */}
          {saved && (
            <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>개인정보가 성공적으로 저장되었습니다</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 