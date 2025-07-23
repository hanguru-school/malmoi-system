'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { StudentIdentifierData } from '@/types/student';
import { generateQRCodeData } from '@/utils/identifierUtils';
import { Download, Copy, RefreshCw } from 'lucide-react';

interface StudentQRCodeProps {
  studentData: StudentIdentifierData;
  size?: number;
  showActions?: boolean;
  className?: string;
}

export default function StudentQRCode({ 
  studentData, 
  size = 200, 
  showActions = true,
  className = ''
}: StudentQRCodeProps) {
  const [qrData, setQrData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (studentData) {
      const data = generateQRCodeData(studentData);
      setQrData(data);
    }
  }, [studentData]);

  const handleDownload = () => {
    if (!qrData) return;
    
    const canvas = document.createElement('canvas');
    const svg = document.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = `student-qr-${studentData.studentId}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleCopyData = async () => {
    if (!qrData) return;
    
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy QR data:', error);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      const data = generateQRCodeData(studentData);
      setQrData(data);
      setIsLoading(false);
    }, 500);
  };

  if (!studentData || !qrData) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width: size, height: size }}>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* QR코드 표시 */}
      <div className="relative bg-white p-4 rounded-lg shadow-lg">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}
        <QRCode
          value={qrData}
          size={size - 32} // 패딩 고려
          level="M" // 오류 수정 레벨 (L, M, Q, H)
          fgColor="#000000"
          bgColor="#FFFFFF"
          includeMargin={true}
        />
      </div>

      {/* 학생 정보 표시 */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600 mb-1">학생 고유번호</div>
        <div className="font-mono text-lg font-bold text-gray-900">
          {studentData.identifierCode}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {studentData.studentName} • {studentData.department}
        </div>
      </div>

      {/* 액션 버튼들 */}
      {showActions && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            title="QR코드 다운로드"
          >
            <Download className="w-4 h-4" />
            다운로드
          </button>
          
          <button
            onClick={handleCopyData}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              copied 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title="QR 데이터 복사"
          >
            <Copy className="w-4 h-4" />
            {copied ? '복사됨' : '데이터 복사'}
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
            title="QR코드 새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      )}

      {/* QR코드 정보 */}
      <div className="mt-4 text-xs text-gray-500 text-center max-w-xs">
        <p>이 QR코드를 스캔하면 학생 정보와 포인트 결제 내역을 확인할 수 있습니다.</p>
        <p className="mt-1">생성일: {new Date(studentData.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
} 