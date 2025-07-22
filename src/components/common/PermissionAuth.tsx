'use client';

import { useState, useEffect } from 'react';
import { Shield, X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

interface AuthenticatedUser {
  cardId: string;
  uid: string;
  cardType: 'student' | 'teacher' | 'staff' | 'visitor' | 'admin' | 'super_admin';
  assignedTo?: string;
  lastTaggingTime: Date;
  permissions: string[];
}

interface PermissionAuthProps {
  requiredPermissions: string[];
  onAuthSuccess: (user: AuthenticatedUser) => void;
  onAuthFail: () => void;
  portalType: 'admin' | 'student' | 'teacher';
}

export default function PermissionAuth({ 
  requiredPermissions, 
  onAuthSuccess, 
  onAuthFail, 
  portalType 
}: PermissionAuthProps) {
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [authStatus, setAuthStatus] = useState<'waiting' | 'success' | 'failed'>('waiting');
  const [selectedTestUser, setSelectedTestUser] = useState('ABCD6Y7MZVC1');
  const [cardDetected, setCardDetected] = useState(false);
  const [autoDetectionActive, setAutoDetectionActive] = useState(true);
  const [detectionTimeout, setDetectionTimeout] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(15);

  // 테스트용 사용자 데이터
  const testUsers = [
    { uid: 'ABCD6Y7MZVC1', name: '주용진', cardType: 'super_admin' as const, assignedTo: '주용진' },
    { uid: 'EFGH8N9PQRD2', name: '김관리자', cardType: 'admin' as const, assignedTo: '김관리자' },
    { uid: 'IJKL0Q1RSTU3', name: '박직원', cardType: 'staff' as const, assignedTo: '박직원' },
    { uid: 'MNOP2S3TUVW4', name: '이선생님', cardType: 'teacher' as const, assignedTo: '이선생님' },
    { uid: 'QRST4U5VWXY5', name: '최학생', cardType: 'student' as const, assignedTo: '최학생' },
  ];

  // 권한 매핑
  const getPermissionsByCardType = (cardType: string): string[] => {
    switch (cardType) {
      case 'super_admin':
        return ['*']; // 모든 권한
      case 'admin':
        return ['admin:*', 'student:read', 'teacher:read', 'staff:read', 'system:read'];
      case 'staff':
        return ['student:read', 'teacher:read', 'system:read'];
      case 'teacher':
        return ['teacher:*', 'student:read'];
      case 'student':
        return ['student:*'];
      default:
        return [];
    }
  };

  // 권한 확인
  const checkPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
    // 최고 관리자는 모든 권한을 가짐
    if (userPermissions.includes('*')) {
      console.log('최고 관리자 권한 확인됨 - 모든 포털 접근 허용');
      return true;
    }
    
    // 일반 권한 확인
    const hasPermission = requiredPermissions.every(required => 
      userPermissions.some(permission => 
        permission === required || 
        permission.endsWith(':*') && required.startsWith(permission.replace(':*', ''))
      )
    );
    
    console.log('일반 권한 확인 결과:', hasPermission);
    return hasPermission;
  };

  // 포털별 필요한 권한
  const getRequiredPermissionsForPortal = (portalType: string): string[] => {
    switch (portalType) {
      case 'admin':
        return ['admin:*'];
      case 'student':
        return ['student:*'];
      case 'teacher':
        return ['teacher:*'];
      default:
        return [];
    }
  };

  // 자동 카드 감지 (실제 NFC 리더 시뮬레이션)
  useEffect(() => {
    if (!showAuthModal || isDetecting || authStatus === 'success' || authStatus === 'failed' || !autoDetectionActive) return;
    
    // 15초 타이머 설정
    const timeoutTimer = setTimeout(() => {
      console.log('15초 자동 감지 시간 초과');
      setAutoDetectionActive(false);
      setDetectionTimeout(true);
    }, 15000);
    
    // 카운트다운 타이머 (1초마다)
    const countdownTimer = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // 실제 NFC 리더처럼 주기적으로 카드 감지 시도
    // 시뮬레이션에서는 실제 카드 감지 이벤트가 없으므로 자동 감지 비활성화
    // 실제 환경에서는 여기서 NFC 리더 API를 호출하여 카드 감지
    // const interval = setInterval(() => {
    //   if (!isDetecting && authStatus === 'waiting' && autoDetectionActive) {
    //     // 실제 NFC 리더에서 카드 감지 이벤트가 발생했을 때만 실행
    //     // 시뮬레이션에서는 사용자가 수동으로 버튼을 클릭해야만 감지
    //   }
    // }, 1000);
    
    return () => {
      clearTimeout(timeoutTimer);
      clearInterval(countdownTimer);
    };
  }, [showAuthModal, isDetecting, authStatus, selectedTestUser, autoDetectionActive]);

  // 수동 감지 재시작
  const restartAutoDetection = () => {
    setAutoDetectionActive(true);
    setDetectionTimeout(false);
    setCountdownSeconds(15); // 카운트다운 초기화
    setAuthStatus('waiting');
    setIsDetecting(false);
    console.log('자동 감지 재시작 (15초)');
  };

  // 카드 감지 시 인증 처리
  const handleCardDetection = () => {
    setIsDetecting(true);
    setAuthStatus('waiting');

    // 실제 카드 감지 후 처리 시간 시뮬레이션
    setTimeout(() => {
      const selectedUser = testUsers.find(user => user.uid === selectedTestUser);
      if (!selectedUser) {
        setAuthStatus('failed');
        setIsDetecting(false);
        return;
      }

      const userPermissions = getPermissionsByCardType(selectedUser.cardType);
      const portalRequiredPermissions = getRequiredPermissionsForPortal(portalType);
      
      // 디버그 로그 추가
      console.log('=== 자동 카드 감지 권한 검증 ===');
      console.log('감지된 사용자:', selectedUser);
      console.log('사용자 권한:', userPermissions);
      console.log('포털 필요 권한:', portalRequiredPermissions);
      console.log('포털 타입:', portalType);
      
      // 최고 관리자는 모든 포털에 접근 가능
      let hasPermission = false;
      if (selectedUser.cardType === 'super_admin') {
        hasPermission = true;
        console.log('최고 관리자 - 모든 포털 접근 허용');
      } else {
        hasPermission = checkPermission(userPermissions, portalRequiredPermissions);
      }
      console.log('최종 권한 확인 결과:', hasPermission);

      if (hasPermission) {
        const authenticatedUser: AuthenticatedUser = {
          cardId: `card_${selectedUser.uid}`,
          uid: selectedUser.uid,
          cardType: selectedUser.cardType,
          assignedTo: selectedUser.assignedTo,
          lastTaggingTime: new Date(),
          permissions: userPermissions
        };

        setAuthStatus('success');
        setTimeout(() => {
          onAuthSuccess(authenticatedUser);
        }, 1000);
      } else {
        setAuthStatus('failed');
      }
      setIsDetecting(false);
    }, 1500); // 1.5초 후 인증 완료
  };

  // 수동 태깅 버튼 클릭 시 카드 감지 시뮬레이션
  const handleManualTagging = () => {
    setIsDetecting(true);
    setAuthStatus('waiting');

    // 수동 태깅 시뮬레이션 (2초 후 선택된 사용자로 인증)
    setTimeout(() => {
      const selectedUser = testUsers.find(user => user.uid === selectedTestUser);
      if (!selectedUser) {
        setAuthStatus('failed');
        setIsDetecting(false);
        return;
      }

      const userPermissions = getPermissionsByCardType(selectedUser.cardType);
      const portalRequiredPermissions = getRequiredPermissionsForPortal(portalType);
      
      // 디버그 로그 추가
      console.log('=== 권한 검증 디버그 ===');
      console.log('선택된 사용자:', selectedUser);
      console.log('사용자 권한:', userPermissions);
      console.log('포털 필요 권한:', portalRequiredPermissions);
      console.log('포털 타입:', portalType);
      
      // 최고 관리자는 모든 포털에 접근 가능
      let hasPermission = false;
      if (selectedUser.cardType === 'super_admin') {
        hasPermission = true;
        console.log('최고 관리자 - 모든 포털 접근 허용');
      } else {
        hasPermission = checkPermission(userPermissions, portalRequiredPermissions);
      }
      console.log('최종 권한 확인 결과:', hasPermission);

      if (hasPermission) {
        const authenticatedUser: AuthenticatedUser = {
          cardId: `card_${selectedUser.uid}`,
          uid: selectedUser.uid,
          cardType: selectedUser.cardType,
          assignedTo: selectedUser.assignedTo,
          lastTaggingTime: new Date(),
          permissions: userPermissions
        };

        setAuthStatus('success');
        setTimeout(() => {
          onAuthSuccess(authenticatedUser);
        }, 1000);
      } else {
        setAuthStatus('failed');
      }
      setIsDetecting(false);
    }, 2000);
  };

  // 취소
  const handleCancel = () => {
    setShowAuthModal(false);
    onAuthFail();
  };

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">포털 접근 권한 인증</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {portalType === 'admin' && '관리자 대시보드'}
              {portalType === 'student' && '학생 포털'}
              {portalType === 'teacher' && '선생님 포털'}
            </h3>
            <p className="text-gray-600 mb-4">
              접근하려면 카드 인증이 필요합니다.
            </p>
            
            {/* 테스트용 사용자 선택 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                테스트용 사용자 선택
              </label>
              <select
                value={selectedTestUser}
                onChange={(e) => setSelectedTestUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {testUsers.map(user => (
                  <option key={user.uid} value={user.uid}>
                    {user.name} ({user.cardType === 'super_admin' ? '최고 관리자' : user.cardType})
                  </option>
                ))}
              </select>
            </div>

            {/* 인증 상태 표시 */}
            {authStatus === 'waiting' && !detectionTimeout && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-900">
                    {isDetecting ? '카드 감지 중...' : '카드 감지 대기 중...'}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mb-3">
                  카드 감지를 위해 아래 버튼을 클릭하세요
                  {countdownSeconds > 0 && (
                    <span className="block mt-1 text-blue-600 font-medium">
                      남은 시간: {countdownSeconds}초
                    </span>
                  )}
                </p>
                
                {/* 카드 리더 시뮬레이션 */}
                <div className="bg-white border-2 border-dashed border-blue-300 rounded-lg p-4 text-center">
                  <div className="w-12 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                  <p className="text-xs text-gray-600 mb-2">카드 리더</p>
                  <button
                    onClick={handleManualTagging}
                    disabled={isDetecting}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDetecting ? '카드 감지 중...' : '카드 감지하기'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    버튼을 클릭하여 카드 인증을 진행하세요
                  </p>
                </div>
              </div>
            )}

            {/* 30초 타임아웃 상태 */}
            {detectionTimeout && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">자동 감지 종료</span>
                </div>
                <p className="text-xs text-yellow-700 mb-3">
                  15초가 지나도 카드 감지가 안 되면 자동감지가 종료됩니다. 아래의 다시시도 버튼을 누르세요.
                </p>
                
                {/* 카드 리더 시뮬레이션 */}
                <div className="bg-white border-2 border-dashed border-yellow-300 rounded-lg p-4 text-center">
                  <div className="w-12 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                  <p className="text-xs text-gray-600 mb-2">카드 리더</p>
                  <button
                    onClick={restartAutoDetection}
                    className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                  >
                    다시시도
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    버튼을 누르면 다시 15초간 자동 감지합니다
                  </p>
                </div>
              </div>
            )}

            {authStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">인증 성공!</span>
                </div>
                <p className="text-xs text-green-700">
                  포털로 이동 중...
                </p>
              </div>
            )}

            {authStatus === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">권한 없음</span>
                </div>
                <p className="text-xs text-red-700 mb-3">
                  선택한 사용자는 이 포털에 접근할 권한이 없습니다.
                </p>
                <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-100 rounded">
                  <p>현재 선택: {testUsers.find(u => u.uid === selectedTestUser)?.name} ({testUsers.find(u => u.uid === selectedTestUser)?.cardType === 'super_admin' ? '최고 관리자' : testUsers.find(u => u.uid === selectedTestUser)?.cardType})</p>
                  <p>필요 권한: {portalType === 'admin' ? '관리자' : portalType === 'student' ? '학생' : '강사'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-red-600 mb-2">다른 사용자를 선택하거나</p>
                  <button
                    onClick={() => {
                      setAuthStatus('waiting');
                      setIsDetecting(false);
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCancel}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 