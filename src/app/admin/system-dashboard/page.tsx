"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Database,
  Shield,
  Server,
  Settings,
  Activity,
} from "lucide-react";

interface SystemStatus {
  timestamp: string;
  environment: string;
  environment_variables: {
    status: string;
    total_variables: number;
    missing_variables: number;
    invalid_variables: number;
    warnings: number;
  };
  system_info: {
    node_version: string;
    platform: string;
    architecture: string;
    memory_usage: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
      external: string;
    };
    uptime: string;
    cpu_usage: any;
  };
  application: {
    status: string;
    version: string;
    build_time: string;
    deployment_environment: string;
  };
  services: {
    database: {
      status: string;
      connection_string: string;
    };
    cognito: {
      status: string;
      region: string;
      user_pool_id: string;
    };
    s3: {
      status: string;
      bucket: string;
    };
  };
  security: {
    jwt_secret: string;
    session_secret: string;
    csrf_secret: string;
    cors_origin: string;
  };
  overall_status: string;
  recommendations: string[];
}

interface EnvironmentStatus {
  timestamp: string;
  environment: string;
  validation: {
    isValid: boolean;
    missingVars: string[];
    invalidVars: string[];
    warnings: string[];
  };
  config: {
    database: Record<string, string>;
    aws: Record<string, string>;
    cognito_server: Record<string, string>;
    cognito_client: Record<string, string>;
    authentication: Record<string, string>;
    security: Record<string, string>;
    environment: Record<string, string>;
  };
  summary: {
    totalVars: number;
    missingVars: number;
    invalidVars: number;
    warnings: number;
    status: string;
  };
  system_info: {
    node_version: string;
    platform: string;
    memory_usage: any;
    uptime: number;
  };
}

export default function SystemDashboardPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [envStatus, setEnvStatus] = useState<EnvironmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const [systemRes, envRes] = await Promise.all([
        fetch("/api/system/status"),
        fetch("/api/system/env-status"),
      ]);

      if (systemRes.ok && envRes.ok) {
        const systemData = await systemRes.json();
        const envData = await envRes.json();

        setSystemStatus(systemData);
        setEnvStatus(envData);
        setLastRefresh(new Date());
      } else {
        throw new Error("Failed to fetch system status");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "configured":
      case "running":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "unhealthy":
      case "misconfigured":
      case "missing":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "unknown":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "configured":
      case "running":
        return "text-green-600 bg-green-50 border-green-200";
      case "unhealthy":
      case "misconfigured":
      case "missing":
        return "text-red-600 bg-red-50 border-red-200";
      case "unknown":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">
              시스템 상태를 확인하는 중...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <XCircle className="w-6 h-6 text-red-500 mr-2" />
              <h2 className="text-lg font-semibold text-red-800">오류 발생</h2>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={fetchSystemStatus}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                시스템 대시보드
              </h1>
              <p className="text-gray-600 mt-2">
                전체 시스템 상태를 모니터링하고 관리합니다
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                마지막 업데이트: {lastRefresh.toLocaleTimeString()}
              </div>
              <button
                onClick={fetchSystemStatus}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 전체 상태 카드 */}
        {systemStatus && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div
              className={`p-6 rounded-lg border ${getStatusColor(systemStatus.overall_status)}`}
            >
              <div className="flex items-center">
                {getStatusIcon(systemStatus.overall_status)}
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">전체 상태</h3>
                  <p className="text-sm capitalize">
                    {systemStatus.overall_status}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Database className="w-5 h-5 text-blue-500" />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">환경 변수</h3>
                  <p className="text-sm">
                    {systemStatus.environment_variables.missing_variables}개
                    누락
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Server className="w-5 h-5 text-green-500" />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">서비스</h3>
                  <p className="text-sm">
                    {
                      Object.values(systemStatus.services).filter(
                        (s) => s.status === "configured",
                      ).length
                    }
                    /3 활성
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-purple-500" />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">보안</h3>
                  <p className="text-sm">
                    {
                      Object.values(systemStatus.security).filter(
                        (s) => s === "configured",
                      ).length
                    }
                    /4 설정됨
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 상세 정보 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 시스템 정보 */}
          {systemStatus && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                시스템 정보
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Node.js 버전</span>
                  <span className="font-mono">
                    {systemStatus.system_info.node_version}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">플랫폼</span>
                  <span className="font-mono">
                    {systemStatus.system_info.platform}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">아키텍처</span>
                  <span className="font-mono">
                    {systemStatus.system_info.architecture}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">가동 시간</span>
                  <span className="font-mono">
                    {systemStatus.system_info.uptime}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">메모리 사용량</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>RSS: {systemStatus.system_info.memory_usage.rss}</div>
                    <div>
                      Heap Total:{" "}
                      {systemStatus.system_info.memory_usage.heapTotal}
                    </div>
                    <div>
                      Heap Used:{" "}
                      {systemStatus.system_info.memory_usage.heapUsed}
                    </div>
                    <div>
                      External: {systemStatus.system_info.memory_usage.external}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 서비스 상태 */}
          {systemStatus && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Server className="w-5 h-5 mr-2" />
                서비스 상태
              </h2>
              <div className="space-y-4">
                {Object.entries(systemStatus.services).map(
                  ([service, status]) => (
                    <div
                      key={service}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        {getStatusIcon(status.status)}
                        <div className="ml-3">
                          <h4 className="font-semibold capitalize">
                            {service}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {service === "database" &&
                              "connection_string" in status &&
                              status.connection_string}
                            {service === "cognito" &&
                              "region" in status &&
                              `${status.region} / ${status.user_pool_id}`}
                            {service === "s3" &&
                              "bucket" in status &&
                              status.bucket}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}
                      >
                        {status.status}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* 환경 변수 상세 */}
          {envStatus && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                환경 변수 상세
              </h2>
              <div className="space-y-4">
                {Object.entries(envStatus.config).map(([group, vars]) => (
                  <div key={group} className="border-b pb-3 last:border-b-0">
                    <h4 className="font-semibold capitalize mb-2">
                      {group.replace("_", " ")}
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(vars).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 font-mono">{key}</span>
                          <span className="font-mono text-gray-800">
                            {value || "undefined"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 권장사항 */}
          {systemStatus && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                권장사항
              </h2>
              <div className="space-y-2">
                {systemStatus.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-start p-3 bg-blue-50 rounded-lg"
                  >
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-blue-800">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
