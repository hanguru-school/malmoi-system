'use client';

import React from 'react';
import { getUserRole, hasPermission, UserRole } from '@/lib/auth-utils';

/**
 * 권한 기반 컴포넌트 래퍼
 */
export function withPermission(
  WrappedComponent: React.ComponentType<any>,
  requiredPermission: string
) {
  return function PermissionWrapper(props: any) {
    if (!hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h2>
            <p className="text-gray-600 mb-4">
              이 페이지에 접근할 권한이 없습니다.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              이전 페이지로 돌아가기
            </button>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
}

/**
 * 역할 기반 컴포넌트 래퍼
 */
export function withRole(
  WrappedComponent: React.ComponentType<any>,
  allowedRoles: UserRole[]
) {
  return function RoleWrapper(props: any) {
    const userRole = getUserRole();
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h2>
            <p className="text-gray-600 mb-4">
              이 페이지에 접근할 권한이 없습니다.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              이전 페이지로 돌아가기
            </button>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
} 