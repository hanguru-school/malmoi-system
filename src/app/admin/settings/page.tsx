'use client';

import { useState, useEffect } from 'react';
import { User, Shield, Key, Eye, EyeOff, Plus, Edit, Trash2, Check, X } from 'lucide-react';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'master' | 'admin';
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLogin: string;
  createdAt: string;
}

interface MasterInfo {
  name: string;
  email: string;
  phone: string;
  twoFactorEnabled: boolean;
}

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [masterInfo, setMasterInfo] = useState<MasterInfo>({
    name: '마스터 관리자',
    email: 'master@hanguru.com',
    phone: '010-1234-5678',
    twoFactorEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [isEditMasterModalOpen, setIsEditMasterModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 샘플 데이터
  useEffect(() => {
    setTimeout(() => {
      const sampleAdmins: Admin[] = [
        {
          id: '1',
          name: '마스터 관리자',
          email: 'master@hanguru.com',
          role: 'master',
          isActive: true,
          twoFactorEnabled: true,
          lastLogin: '2024-01-15 14:30',
          createdAt: '2024-01-01'
        },
        {
          id: '2',
          name: '김선생님',
          email: 'kim@hanguru.com',
          role: 'admin',
          isActive: true,
          twoFactorEnabled: false,
          lastLogin: '2024-01-14 16:20',
          createdAt: '2024-01-05'
        },
        {
          id: '3',
          name: '이선생님',
          email: 'lee@hanguru.com',
          role: 'admin',
          isActive: true,
          twoFactorEnabled: true,
          lastLogin: '2024-01-13 09:15',
          createdAt: '2024-01-10'
        },
        {
          id: '4',
          name: '박선생님',
          email: 'park@hanguru.com',
          role: 'admin',
          isActive: false,
          twoFactorEnabled: false,
          lastLogin: '2024-01-10 11:45',
          createdAt: '2024-01-12'
        }
      ];
      setAdmins(sampleAdmins);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEditMasterInfo = (data: MasterInfo) => {
    setMasterInfo(data);
    setIsEditMasterModalOpen(false);
  };

  const handleAddAdmin = (adminData: Omit<Admin, 'id' | 'lastLogin' | 'createdAt'>) => {
    const newAdmin: Admin = {
      id: Date.now().toString(),
      ...adminData,
      lastLogin: '-',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAdmins(prev => [...prev, newAdmin]);
    setIsAddAdminModalOpen(false);
  };

  const handleToggleAdminStatus = (id: string) => {
    setAdmins(prev =>
      prev.map(admin =>
        admin.id === id
          ? { ...admin, isActive: !admin.isActive }
          : admin
      )
    );
  };

  const handleDeleteAdmin = (id: string) => {
    if (confirm('정말로 이 관리자를 삭제하시겠습니까?')) {
      setAdmins(prev => prev.filter(admin => admin.id !== id));
    }
  };

  const handleToggleTwoFactor = (id: string) => {
    setAdmins(prev =>
      prev.map(admin =>
        admin.id === id
          ? { ...admin, twoFactorEnabled: !admin.twoFactorEnabled }
          : admin
      )
    );
  };

  const handleTwoFactorVerification = () => {
    // 2단계 인증 코드 검증 로직
    if (twoFactorCode === '123456') {
      setIsTwoFactorModalOpen(false);
      setTwoFactorCode('');
      alert('2단계 인증이 완료되었습니다.');
    } else {
      alert('잘못된 인증 코드입니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 설정</h1>
        <p className="text-gray-600">마스터 계정 정보 및 관리자 권한을 관리합니다.</p>
      </div>

      {/* 마스터 계정 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            마스터 계정 정보
          </h2>
          <button
            onClick={() => setIsEditMasterModalOpen(true)}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            정보 수정
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <p className="text-gray-900">{masterInfo.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <p className="text-gray-900">{masterInfo.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <p className="text-gray-900">{masterInfo.phone}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">2단계 인증</label>
            <div className="flex items-center">
              <span
                className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                  masterInfo.twoFactorEnabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {masterInfo.twoFactorEnabled ? '활성화' : '비활성화'}
              </span>
              <button
                onClick={() => setIsTwoFactorModalOpen(true)}
                className="ml-2 text-sm text-blue-600 hover:text-blue-800"
              >
                {masterInfo.twoFactorEnabled ? '설정 변경' : '활성화'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 관리자 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            관리자 목록
          </h2>
          <button
            onClick={() => setIsAddAdminModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            관리자 추가
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  2단계 인증
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최근 로그인
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        admin.role === 'master'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {admin.role === 'master' ? '마스터' : '관리자'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        admin.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {admin.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.twoFactorEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {admin.twoFactorEnabled ? '활성화' : '비활성화'}
                      </span>
                      {admin.role !== 'master' && (
                        <button
                          onClick={() => handleToggleTwoFactor(admin.id)}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          {admin.twoFactorEnabled ? '해제' : '활성화'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {admin.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {admin.role !== 'master' && (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleAdminStatus(admin.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            admin.isActive
                              ? 'text-orange-600 hover:text-orange-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {admin.isActive ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 마스터 정보 수정 모달 */}
      {isEditMasterModalOpen && (
        <EditMasterModal
          masterInfo={masterInfo}
          onSave={handleEditMasterInfo}
          onClose={() => setIsEditMasterModalOpen(false)}
        />
      )}

      {/* 관리자 추가 모달 */}
      {isAddAdminModalOpen && (
        <AddAdminModal
          onSave={handleAddAdmin}
          onClose={() => setIsAddAdminModalOpen(false)}
        />
      )}

      {/* 2단계 인증 모달 */}
      {isTwoFactorModalOpen && (
        <TwoFactorModal
          onVerify={handleTwoFactorVerification}
          onClose={() => {
            setIsTwoFactorModalOpen(false);
            setTwoFactorCode('');
          }}
          code={twoFactorCode}
          onCodeChange={setTwoFactorCode}
        />
      )}
    </div>
  );
}

// 마스터 정보 수정 모달
interface EditMasterModalProps {
  masterInfo: MasterInfo;
  onSave: (data: MasterInfo) => void;
  onClose: () => void;
}

function EditMasterModal({ masterInfo, onSave, onClose }: EditMasterModalProps) {
  const [formData, setFormData] = useState(masterInfo);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">마스터 정보 수정</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 비밀번호 *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="현재 비밀번호를 입력하세요"
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFactor"
              checked={formData.twoFactorEnabled}
              onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="twoFactor" className="ml-2 block text-sm text-gray-900">
              2단계 인증 활성화
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              수정
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 관리자 추가 모달
interface AddAdminModalProps {
  onSave: (data: Omit<Admin, 'id' | 'lastLogin' | 'createdAt'>) => void;
  onClose: () => void;
}

function AddAdminModal({ onSave, onClose }: AddAdminModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'admin' as 'master' | 'admin',
    isActive: true,
    twoFactorEnabled: false
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">관리자 추가</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              역할
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'master' | 'admin' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="admin">관리자</option>
              <option value="master">마스터</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="비밀번호를 입력하세요"
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              활성 상태
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFactor"
              checked={formData.twoFactorEnabled}
              onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="twoFactor" className="ml-2 block text-sm text-gray-900">
              2단계 인증 활성화
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2단계 인증 모달
interface TwoFactorModalProps {
  onVerify: () => void;
  onClose: () => void;
  code: string;
  onCodeChange: (code: string) => void;
}

function TwoFactorModal({ onVerify, onClose, code, onCodeChange }: TwoFactorModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">2단계 인증</h2>
        
        <div className="space-y-4">
          <div className="text-center">
            <Key className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              인증 앱에서 생성된 6자리 코드를 입력하세요.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              인증 코드
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
              placeholder="000000"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onVerify}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 