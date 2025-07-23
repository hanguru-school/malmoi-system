'use client';

import { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { StudentIdentifierData } from '@/types/student';
import { validateQRCodeData } from '@/utils/identifierUtils';

interface QRCodeScannerProps {
  onScan: (data: StudentIdentifierData) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export default function QRCodeScanner({ onScan, onError, onClose }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<StudentIdentifierData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isScanning) {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('카메라에 접근할 수 없습니다.');
      console.error('Camera access error:', err);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleScan = (qrData: string) => {
    const result = validateQRCodeData(qrData);
    
    if (result.isValid && result.data) {
      setScanResult(result.data);
      setError(null);
      onScan(result.data);
    } else {
      setError(result.error || '유효하지 않은 QR코드입니다.');
      onError(result.error || '유효하지 않은 QR코드입니다.');
    }
  };

  const handleManualInput = () => {
    const input = prompt('QR코드 데이터를 입력하세요:');
    if (input) {
      handleScan(input);
    }
  };

  const handleRetry = () => {
    setScanResult(null);
    setError(null);
    setIsScanning(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">QR코드 스캔</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!scanResult && !error && (
          <div className="text-center mb-4">
            <div className="relative inline-block">
              <video
                ref={videoRef}
                className="w-full max-w-sm h-64 bg-gray-100 rounded-lg"
                playsInline
              />
              <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              QR코드를 프레임 안에 맞춰주세요
            </p>
          </div>
        )}

        {scanResult && (
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              스캔 성공!
            </h4>
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm">
                <div className="font-medium text-gray-900">{scanResult.studentName}</div>
                <div className="text-gray-600">{scanResult.studentEmail}</div>
                <div className="text-gray-600">{scanResult.department}</div>
                <div className="text-gray-600">현재 레벨: {scanResult.currentLevel}</div>
                <div className="text-gray-600">포인트: {scanResult.points}P</div>
                <div className="text-gray-600">완료 수업: {scanResult.completedClasses}회</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              스캔 실패
            </h4>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2 justify-center">
          {!scanResult && !error && (
            <>
              <button
                onClick={() => setIsScanning(!isScanning)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                {isScanning ? '스캔 중지' : '스캔 시작'}
              </button>
              <button
                onClick={handleManualInput}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                수동 입력
              </button>
            </>
          )}
          
          {error && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
} 