'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Users, 
  Bell, 
  Shield, 
  Database,
  Globe,
  Mail,
  CreditCard,
  FileText,
  Palette,
  Monitor,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  description: string;
  type: 'toggle' | 'input' | 'select' | 'textarea';
  value: any;
  options?: string[];
  required?: boolean;
}

const SystemSettingsPage = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([
    // General Settings
    {
      id: 'site_name',
      category: 'general',
      name: '사이트 이름',
      description: '교육 플랫폼의 이름을 설정합니다',
      type: 'input',
      value: '에듀북',
      required: true
    },
    {
      id: 'site_description',
      category: 'general',
      name: '사이트 설명',
      description: '사이트에 대한 간단한 설명을 입력합니다',
      type: 'textarea',
      value: '최고의 교육 서비스를 제공하는 플랫폼입니다'
    },
    {
      id: 'timezone',
      category: 'general',
      name: '시간대',
      description: '시스템 시간대를 설정합니다',
      type: 'select',
      value: 'Asia/Seoul',
      options: ['Asia/Seoul', 'UTC', 'America/New_York', 'Europe/London']
    },
    {
      id: 'language',
      category: 'general',
      name: '기본 언어',
      description: '시스템의 기본 언어를 설정합니다',
      type: 'select',
      value: 'ko',
      options: ['ko', 'en', 'ja', 'zh']
    },

    // User Management
    {
      id: 'user_registration',
      category: 'users',
      name: '사용자 등록',
      description: '새로운 사용자 등록을 허용합니다',
      type: 'toggle',
      value: true
    },
    {
      id: 'email_verification',
      category: 'users',
      name: '이메일 인증',
      description: '사용자 등록 시 이메일 인증을 요구합니다',
      type: 'toggle',
      value: true
    },
    {
      id: 'max_students_per_class',
      category: 'users',
      name: '클래스당 최대 학생 수',
      description: '한 클래스에 등록할 수 있는 최대 학생 수를 설정합니다',
      type: 'input',
      value: 20
    },

    // Notifications
    {
      id: 'email_notifications',
      category: 'notifications',
      name: '이메일 알림',
      description: '시스템 이메일 알림을 활성화합니다',
      type: 'toggle',
      value: true
    },
    {
      id: 'sms_notifications',
      category: 'notifications',
      name: 'SMS 알림',
      description: 'SMS 알림을 활성화합니다',
      type: 'toggle',
      value: false
    },
    {
      id: 'notification_schedule',
      category: 'notifications',
      name: '알림 시간',
      description: '알림을 보낼 수 있는 시간대를 설정합니다',
      type: 'select',
      value: '9-18',
      options: ['9-18', '8-20', '24시간', '사용자 설정']
    },

    // Security
    {
      id: 'password_min_length',
      category: 'security',
      name: '최소 비밀번호 길이',
      description: '사용자 비밀번호의 최소 길이를 설정합니다',
      type: 'input',
      value: 8
    },
    {
      id: 'session_timeout',
      category: 'security',
      name: '세션 타임아웃',
      description: '사용자 세션의 자동 종료 시간을 설정합니다 (분)',
      type: 'input',
      value: 30
    },
    {
      id: 'two_factor_auth',
      category: 'security',
      name: '2단계 인증',
      description: '관리자 계정에 2단계 인증을 요구합니다',
      type: 'toggle',
      value: true
    },

    // Payment
    {
      id: 'currency',
      category: 'payment',
      name: '기본 통화',
      description: '시스템에서 사용할 기본 통화를 설정합니다',
      type: 'select',
      value: 'KRW',
      options: ['KRW', 'USD', 'EUR', 'JPY']
    },
    {
      id: 'tax_rate',
      category: 'payment',
      name: '세율',
      description: '기본 세율을 설정합니다 (%)',
      type: 'input',
      value: 10
    },
    {
      id: 'auto_invoice',
      category: 'payment',
      name: '자동 인보이스',
      description: '결제 완료 시 자동으로 인보이스를 생성합니다',
      type: 'toggle',
      value: true
    },

    // Appearance
    {
      id: 'theme',
      category: 'appearance',
      name: '테마',
      description: '시스템의 기본 테마를 설정합니다',
      type: 'select',
      value: 'light',
      options: ['light', 'dark', 'auto']
    },
    {
      id: 'logo_url',
      category: 'appearance',
      name: '로고 URL',
      description: '사이트 로고의 URL을 설정합니다',
      type: 'input',
      value: '/logo.png'
    },
    {
      id: 'favicon_url',
      category: 'appearance',
      name: '파비콘 URL',
      description: '사이트 파비콘의 URL을 설정합니다',
      type: 'input',
      value: '/favicon.ico'
    }
  ]);

  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const categories = [
    { id: 'general', name: '일반', icon: Settings },
    { id: 'users', name: '사용자 관리', icon: Users },
    { id: 'notifications', name: '알림', icon: Bell },
    { id: 'security', name: '보안', icon: Shield },
    { id: 'payment', name: '결제', icon: CreditCard },
    { id: 'appearance', name: '외관', icon: Palette }
  ];

  const handleSettingChange = (id: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, value } : setting
    ));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Here you would typically save to backend
    setHasChanges(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    // Reset to default values
    setSettings(prev => prev.map(setting => ({
      ...setting,
      value: setting.type === 'toggle' ? false : 
             setting.type === 'input' ? 0 : 
             setting.type === 'select' ? setting.options?.[0] || '' : ''
    })));
    setHasChanges(true);
  };

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={setting.value}
              onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        );
      
      case 'input':
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={setting.required}
          />
        );
      
      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {setting.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
      
      default:
        return null;
    }
  };

  const filteredSettings = settings.filter(setting => setting.category === activeTab);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
          <p className="text-gray-600">시스템 전반의 설정을 관리하세요</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              초기화
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            저장
          </button>
        </div>
      </div>

      {/* Success Message */}
      {showSaveSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">설정이 성공적으로 저장되었습니다.</span>
          <button
            onClick={() => setShowSaveSuccess(false)}
            className="ml-auto"
          >
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === category.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="p-6">
          <div className="space-y-6">
            {filteredSettings.map((setting) => (
              <div key={setting.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900">{setting.name}</h3>
                    {setting.required && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
                <div className="ml-4">
                  {renderSettingInput(setting)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">데이터베이스</p>
              <p className="text-sm text-gray-600">PostgreSQL 14.5</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Monitor className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">서버</p>
              <p className="text-sm text-gray-600">Ubuntu 20.04 LTS</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Globe className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">도메인</p>
              <p className="text-sm text-gray-600">edubook.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage; 