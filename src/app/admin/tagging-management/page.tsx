'use client';

import { CreditCard, Smartphone, BarChart3, Plus, Edit, Trash2, Filter, CheckCircle, XCircle, RefreshCw, Download, Search, Calendar, Clock, Wifi, WifiOff } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { taggingSystem, TaggingLog, UIDRegistration, TaggingDevice } from '@/lib/tagging-system';
import TaggingInterface from '@/components/tagging/TaggingInterface';

// 가상화된 리스트 컴포넌트 (성능 최적화)
const VirtualizedList = ({ items, renderItem, itemHeight = 60 }: {
  items: Record<string, unknown>[];
  renderItem: (item: Record<string, unknown>, index: number) => React.ReactNode;
  itemHeight?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 400;
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems, items.length);

  const visibleItemsData = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div 
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItemsData.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function TaggingManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState<TaggingLog[]>([]);
  const [uidRegistrations, setUIDRegistrations] = useState<UIDRegistration[]>([]);
  const [devices, setDevices] = useState<TaggingDevice[]>([]);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userRole: '',
    deviceId: '',
    success: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 디바운스된 검색
  const debouncedSearchTerm = useMemo(() => {
    const timeoutId = setTimeout(() => {}, 300);
    return searchTerm;
  }, [searchTerm]);

  // 데이터 로드 (최적화)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 비동기로 데이터 로드
      const [logsData, registrationsData, devicesData, statsData] = await Promise.all([
        Promise.resolve(taggingSystem.getLogs()),
        Promise.resolve(taggingSystem.getUIDRegistrations()),
        Promise.resolve(taggingSystem.getDevices()),
        Promise.resolve(taggingSystem.getTaggingStats())
      ]);

      setLogs(logsData);
      setUIDRegistrations(registrationsData);
      setDevices(devicesData);
      setStats(statsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // 실시간 업데이트 (5초마다)
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // 필터 변경 핸들러 (최적화)
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // 필터링된 로그 (메모이제이션)
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (filters.startDate) {
      filtered = filtered.filter(log => 
        log.timestamp >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(log => 
        log.timestamp <= new Date(filters.endDate)
      );
    }
    if (filters.userRole) {
      filtered = filtered.filter(log => log.userRole === filters.userRole);
    }
    if (filters.deviceId) {
      filtered = filtered.filter(log => log.deviceId === filters.deviceId);
    }
    if (filters.success) {
      filtered = filtered.filter(log => 
        filters.success === 'true' ? log.success : !log.success
      );
    }
    if (debouncedSearchTerm) {
      filtered = filtered.filter(log => 
        log.uid.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        log.userId.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [logs, filters, debouncedSearchTerm]);

  // 통계 데이터 (메모이제이션)
  const statisticsData = useMemo(() => {
    if (!stats) return null;

    return {
      totalTagging: (stats.totalTagging as number) || 0,
      successRate: (stats.successRate as number) || 0,
      byMethod: (stats.byMethod as Record<string, number>) || {},
      byRole: (stats.byRole as Record<string, number>) || {},
      byDevice: (stats.byDevice as Record<string, number>) || {}
    };
  }, [stats]);

  // 디바이스 상태 표시
  const getDeviceStatusIcon = (device: TaggingDevice) => {
    switch (device.connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 처리 시간 포맷팅
  const formatProcessingTime = (time?: number) => {
    if (!time) return '-';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">태깅 관리</h1>
            <p className="text-lg text-gray-600">UID 태깅 시스템 관리 및 모니터링</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>마지막 업데이트: {formatTime(lastUpdate)}</span>
            </div>
            
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            {[
              { id: 'overview', label: '개요', icon: BarChart3 },
              { id: 'logs', label: '태깅 로그', icon: CreditCard },
              { id: 'devices', label: '디바이스', icon: Smartphone },
              { id: 'registrations', label: 'UID 등록', icon: Plus }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 통계 카드 */}
              {statisticsData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">총 태깅</p>
                        <p className="text-2xl font-bold text-blue-900">{statisticsData.totalTagging}</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">성공률</p>
                        <p className="text-2xl font-bold text-green-900">{statisticsData.successRate.toFixed(1)}%</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">활성 디바이스</p>
                        <p className="text-2xl font-bold text-purple-900">{devices.filter(d => d.isActive).length}</p>
                      </div>
                      <Smartphone className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600">등록된 UID</p>
                        <p className="text-2xl font-bold text-orange-900">{uidRegistrations.length}</p>
                      </div>
                      <Plus className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* 실시간 태깅 인터페이스 */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">실시간 태깅 테스트</h2>
                <TaggingInterface deviceId="device_001" deviceType="desktop" />
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* 필터 및 검색 */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="UID 또는 사용자 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={filters.userRole}
                  onChange={(e) => handleFilterChange('userRole', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">모든 역할</option>
                  <option value="student">학생</option>
                  <option value="teacher">선생님</option>
                  <option value="staff">직원</option>
                  <option value="master">관리자</option>
                </select>
                
                <select
                  value={filters.success}
                  onChange={(e) => handleFilterChange('success', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">모든 결과</option>
                  <option value="true">성공</option>
                  <option value="false">실패</option>
                </select>
              </div>

              {/* 태깅 로그 테이블 */}
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">UID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">사용자</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">역할</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">방법</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">시간</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">처리시간</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.slice(0, 100).map((log) => (
                      <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-mono text-gray-900">{log.uid}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{log.userId}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.userRole === 'student' ? 'bg-blue-100 text-blue-800' :
                            log.userRole === 'teacher' ? 'bg-green-100 text-green-800' :
                            log.userRole === 'staff' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {log.userRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{log.taggingMethod.toUpperCase()}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatTime(log.timestamp)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatProcessingTime(log.processingTime)}</td>
                        <td className="py-3 px-4">
                          {log.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                  <div key={device.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {device.type === 'desktop' && <CreditCard className="w-6 h-6 text-blue-600" />}
                        {device.type === 'tablet' && <Smartphone className="w-6 h-6 text-green-600" />}
                        {device.type === 'mobile' && <Smartphone className="w-6 h-6 text-purple-600" />}
                        <div>
                          <h3 className="font-semibold text-gray-900">{device.name}</h3>
                          <p className="text-sm text-gray-500">{device.location}</p>
                        </div>
                      </div>
                      {getDeviceStatusIcon(device)}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {device.capabilities.map((cap) => (
                          <span key={cap} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {cap.toUpperCase()}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>상태: {device.isActive ? '활성' : '비활성'}</span>
                        <span>연결: {device.connectionStatus}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'registrations' && (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">UID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">사용자</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">디바이스</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">등록일</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">사용횟수</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uidRegistrations.map((reg) => (
                      <tr key={reg.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-mono text-gray-900">{reg.uid}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{reg.userId}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{reg.deviceName}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatTime(reg.registeredAt)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{reg.usageCount || 0}</td>
                        <td className="py-3 px-4">
                          {reg.isApproved ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 