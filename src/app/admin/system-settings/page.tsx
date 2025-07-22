'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  Bell, 
  Zap,
  Save,
  Download,
  Upload,
  Users,
  Database,
  Shield,
  Activity
} from 'lucide-react';

interface SystemSettings {
  deviceOptimization: {
    mobile: {
      uiScale: number;
      showAdvancedFeatures: boolean;
      priorityFeatures: string[];
    };
    tablet: {
      uiScale: number;
      showAdvancedFeatures: boolean;
      priorityFeatures: string[];
    };
    desktop: {
      uiScale: number;
      showAdvancedFeatures: boolean;
      priorityFeatures: string[];
    };
  };
  language: {
    defaultLanguage: 'ja' | 'ko';
    autoDetect: boolean;
    availableLanguages: string[];
  };
  timezone: {
    defaultTimezone: string;
    autoSync: boolean;
    dateFormat: string;
    timeFormat: string;
  };
  notifications: {
    students: {
      lessonReminder: boolean;
      noReservationAlert: boolean;
      reviewRequest: boolean;
      homeworkReminder: boolean;
    };
    teachers: {
      workReminder: boolean;
      scheduleSummary: boolean;
      attendanceAlert: boolean;
    };
    admins: {
      systemAlerts: boolean;
      performanceReports: boolean;
      backupNotifications: boolean;
    };
  };
  performance: {
    enableCaching: boolean;
    cacheExpiration: number;
    imageCompression: boolean;
    audioCompression: boolean;
    lazyLoading: boolean;
  };
  analytics: {
    enableTracking: boolean;
    trackUserBehavior: boolean;
    generateReports: boolean;
    dataRetention: number;
  };
}

export default function AdminSystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'device' | 'language' | 'timezone' | 'notifications' | 'performance' | 'analytics'>('device');

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      const mockSettings: SystemSettings = {
        deviceOptimization: {
          mobile: {
            uiScale: 1.0,
            showAdvancedFeatures: false,
            priorityFeatures: ['예약', '노트', '숙제', '리뷰']
          },
          tablet: {
            uiScale: 1.2,
            showAdvancedFeatures: true,
            priorityFeatures: ['수업 진행', '커리큘럼', '학생 관리', '통계']
          },
          desktop: {
            uiScale: 1.0,
            showAdvancedFeatures: true,
            priorityFeatures: ['관리 기능', '통계', '설정', '백업']
          }
        },
        language: {
          defaultLanguage: 'ja',
          autoDetect: true,
          availableLanguages: ['ja', 'ko', 'en']
        },
        timezone: {
          defaultTimezone: 'Asia/Tokyo',
          autoSync: true,
          dateFormat: 'YYYY-MM-DD',
          timeFormat: 'HH:mm'
        },
        notifications: {
          students: {
            lessonReminder: true,
            noReservationAlert: true,
            reviewRequest: true,
            homeworkReminder: true
          },
          teachers: {
            workReminder: true,
            scheduleSummary: true,
            attendanceAlert: true
          },
          admins: {
            systemAlerts: true,
            performanceReports: true,
            backupNotifications: true
          }
        },
        performance: {
          enableCaching: true,
          cacheExpiration: 3600,
          imageCompression: true,
          audioCompression: true,
          lazyLoading: true
        },
        analytics: {
          enableTracking: true,
          trackUserBehavior: true,
          generateReports: true,
          dataRetention: 365
        }
      };

      setSettings(mockSettings);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // 실제 API 호출로 대체
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSaving(false);
    alert('설정이 저장되었습니다.');
  };

  const handleExport = () => {
    if (!settings) return;
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'system-settings.json';
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        alert('설정이 가져와졌습니다.');
      } catch (error) {
        alert('설정 파일을 읽을 수 없습니다.');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">시스템 설정</h1>
        <p className="text-lg text-gray-600">
          시스템 환경을 최적화하고 사용자 경험을 향상시키세요
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? '저장 중...' : '설정 저장'}
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          설정 내보내기
        </button>
        <label className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
          <Upload className="w-4 h-4" />
          설정 가져오기
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-lg mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('device')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'device'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Monitor className="w-4 h-4 inline mr-2" />
              기기 최적화
            </button>
            <button
              onClick={() => setActiveTab('language')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'language'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              언어 설정
            </button>
            <button
              onClick={() => setActiveTab('timezone')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'timezone'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              시간대 설정
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              알림 설정
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              성능 최적화
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              분석 설정
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'device' && (
            <div className="space-y-8">
              <h3 className="text-lg font-semibold text-gray-900">기기별 최적화 설정</h3>
              
              {/* 모바일 설정 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                  <h4 className="text-lg font-medium text-gray-900">모바일 (핸드폰)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UI 크기 조정
                    </label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.4"
                      step="0.1"
                      value={settings.deviceOptimization.mobile.uiScale}
                      onChange={(e) => setSettings({
                        ...settings,
                        deviceOptimization: {
                          ...settings.deviceOptimization,
                          mobile: {
                            ...settings.deviceOptimization.mobile,
                            uiScale: parseFloat(e.target.value)
                          }
                        }
                      })}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      현재: {settings.deviceOptimization.mobile.uiScale}x
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.deviceOptimization.mobile.showAdvancedFeatures}
                        onChange={(e) => setSettings({
                          ...settings,
                          deviceOptimization: {
                            ...settings.deviceOptimization,
                            mobile: {
                              ...settings.deviceOptimization.mobile,
                              showAdvancedFeatures: e.target.checked
                            }
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        고급 기능 표시
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 태블릿 설정 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Tablet className="w-6 h-6 text-green-600" />
                  <h4 className="text-lg font-medium text-gray-900">태블릿</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UI 크기 조정
                    </label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.4"
                      step="0.1"
                      value={settings.deviceOptimization.tablet.uiScale}
                      onChange={(e) => setSettings({
                        ...settings,
                        deviceOptimization: {
                          ...settings.deviceOptimization,
                          tablet: {
                            ...settings.deviceOptimization.tablet,
                            uiScale: parseFloat(e.target.value)
                          }
                        }
                      })}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      현재: {settings.deviceOptimization.tablet.uiScale}x
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.deviceOptimization.tablet.showAdvancedFeatures}
                        onChange={(e) => setSettings({
                          ...settings,
                          deviceOptimization: {
                            ...settings.deviceOptimization,
                            tablet: {
                              ...settings.deviceOptimization.tablet,
                              showAdvancedFeatures: e.target.checked
                            }
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        고급 기능 표시
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 데스크톱 설정 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Monitor className="w-6 h-6 text-purple-600" />
                  <h4 className="text-lg font-medium text-gray-900">데스크톱 (PC)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UI 크기 조정
                    </label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.4"
                      step="0.1"
                      value={settings.deviceOptimization.desktop.uiScale}
                      onChange={(e) => setSettings({
                        ...settings,
                        deviceOptimization: {
                          ...settings.deviceOptimization,
                          desktop: {
                            ...settings.deviceOptimization.desktop,
                            uiScale: parseFloat(e.target.value)
                          }
                        }
                      })}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      현재: {settings.deviceOptimization.desktop.uiScale}x
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.deviceOptimization.desktop.showAdvancedFeatures}
                        onChange={(e) => setSettings({
                          ...settings,
                          deviceOptimization: {
                            ...settings.deviceOptimization,
                            desktop: {
                              ...settings.deviceOptimization.desktop,
                              showAdvancedFeatures: e.target.checked
                            }
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        고급 기능 표시
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">언어 설정</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 언어
                  </label>
                  <select
                    value={settings.language.defaultLanguage}
                    onChange={(e) => setSettings({
                      ...settings,
                      language: {
                        ...settings.language,
                        defaultLanguage: e.target.value as 'ja' | 'ko'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.language.autoDetect}
                      onChange={(e) => setSettings({
                        ...settings,
                        language: {
                          ...settings.language,
                          autoDetect: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      브라우저 언어 자동 감지
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timezone' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">시간대 설정</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 시간대
                  </label>
                  <select
                    value={settings.timezone.defaultTimezone}
                    onChange={(e) => setSettings({
                      ...settings,
                      timezone: {
                        ...settings.timezone,
                        defaultTimezone: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.timezone.autoSync}
                      onChange={(e) => setSettings({
                        ...settings,
                        timezone: {
                          ...settings.timezone,
                          autoSync: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      시간대 자동 동기화
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">알림 설정</h3>
              
              {/* 학생 알림 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">학생 알림</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.students.lessonReminder}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          students: {
                            ...settings.notifications.students,
                            lessonReminder: e.target.checked
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">수업 리마인드</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.students.noReservationAlert}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          students: {
                            ...settings.notifications.students,
                            noReservationAlert: e.target.checked
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">미예약 알림</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.students.reviewRequest}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          students: {
                            ...settings.notifications.students,
                            reviewRequest: e.target.checked
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">리뷰 요청</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.students.homeworkReminder}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          students: {
                            ...settings.notifications.students,
                            homeworkReminder: e.target.checked
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">숙제 리마인드</span>
                  </label>
                </div>
              </div>

              {/* 선생님 알림 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">선생님 알림</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.teachers.workReminder}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          teachers: {
                            ...settings.notifications.teachers,
                            workReminder: e.target.checked
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">출근 리마인드</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.teachers.scheduleSummary}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          teachers: {
                            ...settings.notifications.teachers,
                            scheduleSummary: e.target.checked
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">일정 요약</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.teachers.attendanceAlert}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          teachers: {
                            ...settings.notifications.teachers,
                            attendanceAlert: e.target.checked
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">출석 알림</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">성능 최적화</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.performance.enableCaching}
                      onChange={(e) => setSettings({
                        ...settings,
                        performance: {
                          ...settings.performance,
                          enableCaching: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">캐싱 활성화</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    캐시 만료 시간 (초)
                  </label>
                  <input
                    type="number"
                    value={settings.performance.cacheExpiration}
                    onChange={(e) => setSettings({
                      ...settings,
                      performance: {
                        ...settings.performance,
                        cacheExpiration: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.performance.imageCompression}
                      onChange={(e) => setSettings({
                        ...settings,
                        performance: {
                          ...settings.performance,
                          imageCompression: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">이미지 압축</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.performance.audioCompression}
                      onChange={(e) => setSettings({
                        ...settings,
                        performance: {
                          ...settings.performance,
                          audioCompression: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">오디오 압축</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.performance.lazyLoading}
                      onChange={(e) => setSettings({
                        ...settings,
                        performance: {
                          ...settings.performance,
                          lazyLoading: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">지연 로딩</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">분석 설정</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.analytics.enableTracking}
                      onChange={(e) => setSettings({
                        ...settings,
                        analytics: {
                          ...settings.analytics,
                          enableTracking: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">사용자 행동 추적</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.analytics.trackUserBehavior}
                      onChange={(e) => setSettings({
                        ...settings,
                        analytics: {
                          ...settings.analytics,
                          trackUserBehavior: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">사용자 행동 분석</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.analytics.generateReports}
                      onChange={(e) => setSettings({
                        ...settings,
                        analytics: {
                          ...settings.analytics,
                          generateReports: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">자동 리포트 생성</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    데이터 보관 기간 (일)
                  </label>
                  <input
                    type="number"
                    value={settings.analytics.dataRetention}
                    onChange={(e) => setSettings({
                      ...settings,
                      analytics: {
                        ...settings.analytics,
                        dataRetention: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 