'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  LogOut,
  Home,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import Link from 'next/link';

interface TaggingUser {
  id: string;
  cardId: string;
  uid: string;
  name: string;
  role: 'student' | 'teacher' | 'staff' | 'admin';
  department: string;
  lastTaggingTime?: Date;
  isCurrentlyIn: boolean;
}

interface TaggingLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'check_in' | 'check_out';
  timestamp: Date;
  deviceId: string;
  location: string;
}

export default function TaggingPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanInput, setScanInput] = useState('');
  const [recentTaggings, setRecentTaggings] = useState<TaggingLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTaggingResult, setLastTaggingResult] = useState<{
    success: boolean;
    message: string;
    user?: TaggingUser;
  } | null>(null);

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 온라인 상태 체크
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    checkOnlineStatus();

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  // 최근 태깅 로그 로드
  useEffect(() => {
    loadRecentTaggings();
  }, []);

  const loadRecentTaggings = async () => {
    try {
      const response = await fetch('/api/tagging');
      const result = await response.json();

      if (result.success) {
        const logs = result.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        setRecentTaggings(logs);
      }
    } catch (error) {
      console.error('태깅 로그 로드 오류:', error);
      // 오류 시 기본 데이터 사용
      const mockTaggings: TaggingLog[] = [
        {
          id: '1',
          userId: 'student-001',
          userName: '김학생',
          userRole: '학생',
          action: 'check_in',
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
          deviceId: 'DEVICE-001',
          location: 'A동 101호'
        },
        {
          id: '2',
          userId: 'teacher-001',
          userName: '박교수',
          userRole: '강사',
          action: 'check_in',
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15분 전
          deviceId: 'DEVICE-001',
          location: 'A동 101호'
        },
        {
          id: '3',
          userId: 'student-002',
          userName: '이학생',
          userRole: '학생',
          action: 'check_out',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30분 전
          deviceId: 'DEVICE-001',
          location: 'A동 101호'
        }
      ];
      setRecentTaggings(mockTaggings);
    }
  };

  // 태깅 처리
  const processTagging = async (cardId: string) => {
    setIsProcessing(true);
    setLastTaggingResult(null);

    try {
      // API 호출
      const response = await fetch('/api/tagging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          deviceId: 'DEVICE-001',
          location: 'A동 101호',
          action: 'check_in' // 기본값은 출근, 실제로는 사용자 상태에 따라 결정
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 태깅 로그 추가
        const newTagging: TaggingLog = {
          id: result.taggingLog.id,
          userId: result.taggingLog.userId,
          userName: result.taggingLog.userName,
          userRole: result.taggingLog.userRole,
          action: result.taggingLog.action,
          timestamp: new Date(result.taggingLog.timestamp),
          deviceId: result.taggingLog.deviceId,
          location: result.taggingLog.location
        };

        setRecentTaggings(prev => [newTagging, ...prev.slice(0, 9)]); // 최근 10개만 유지

        setLastTaggingResult({
          success: true,
          message: result.message,
          user: result.user
        });

        // 입력 필드 초기화
        setScanInput('');
      } else {
        setLastTaggingResult({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('태깅 API 호출 오류:', error);
      setLastTaggingResult({
        success: false,
        message: '태깅 처리 중 오류가 발생했습니다.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 스캔 입력 처리
  const handleScanInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setScanInput(value);

    // 엔터키나 특정 길이에 도달하면 태깅 처리
    if (value.length >= 8) {
      processTagging(value);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      processTagging(scanInput.trim());
    }
  };

  const getActionIcon = (action: string) => {
    return action === 'check_in' ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getActionText = (action: string) => {
    return action === 'check_in' ? '출근' : '퇴근';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case '학생': return 'bg-blue-100 text-blue-800';
      case '강사': return 'bg-green-100 text-green-800';
      case '직원': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">출근 태깅 시스템</h1>
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? '온라인' : '오프라인'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">현재 시간</div>
                <div className="text-lg font-mono font-semibold text-gray-900">
                  {currentTime.toLocaleTimeString('ko-KR')}
                </div>
              </div>
              <Link
                href="/"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>홈으로</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 태깅 섹션 */}
          <div className="space-y-6">
            {/* 카드 스캔 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">카드 태깅</h2>
                <p className="text-gray-600">IC 카드나 바코드를 스캔하세요</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="scanInput" className="block text-sm font-medium text-gray-700 mb-2">
                    카드 ID 입력
                  </label>
                  <input
                    id="scanInput"
                    type="text"
                    value={scanInput}
                    onChange={handleScanInput}
                    onKeyPress={handleKeyPress}
                    placeholder="카드를 스캔하거나 ID를 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                    disabled={isProcessing}
                    autoFocus
                  />
                </div>

                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">처리 중...</p>
                  </div>
                )}

                {lastTaggingResult && (
                  <div className={`p-4 rounded-lg border ${
                    lastTaggingResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {lastTaggingResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`font-medium ${
                        lastTaggingResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {lastTaggingResult.message}
                      </span>
                    </div>
                    {lastTaggingResult.user && (
                      <div className="mt-2 text-sm text-gray-600">
                        <div>이름: {lastTaggingResult.user.name}</div>
                        <div>역할: {lastTaggingResult.user.role === 'student' ? '학생' : lastTaggingResult.user.role === 'teacher' ? '강사' : '직원'}</div>
                        <div>부서: {lastTaggingResult.user.department}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 테스트 카드 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">테스트 카드</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'CARD-001', name: '김학생 (학생)', role: 'student' },
                  { id: 'CARD-002', name: '박교수 (강사)', role: 'teacher' },
                  { id: 'CARD-003', name: '이직원 (직원)', role: 'staff' }
                ].map((card) => (
                  <button
                    key={card.id}
                    onClick={() => processTagging(card.id)}
                    disabled={isProcessing}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{card.name}</div>
                        <div className="text-sm text-gray-500">{card.id}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      card.role === 'student' ? 'bg-blue-100 text-blue-800' :
                      card.role === 'teacher' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {card.role === 'student' ? '학생' : card.role === 'teacher' ? '강사' : '직원'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 최근 태깅 로그 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">최근 태깅 로그</h2>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-3">
              {recentTaggings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>아직 태깅 기록이 없습니다.</p>
                </div>
              ) : (
                recentTaggings.map((tagging) => (
                  <div key={tagging.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    {getActionIcon(tagging.action)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{tagging.userName}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(tagging.userRole)}`}>
                          {tagging.userRole}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          tagging.action === 'check_in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {getActionText(tagging.action)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {tagging.timestamp.toLocaleTimeString('ko-KR')} • {tagging.location}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 