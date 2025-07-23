'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('테스트 페이지가 정상적으로 로드되었습니다!');
  const [browserAPIs, setBrowserAPIs] = useState({
    webSerial: false,
    usbHid: false,
    webNfc: false,
    usb: false
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setBrowserAPIs({
      webSerial: 'serial' in navigator,
      usbHid: 'hid' in navigator,
      webNfc: 'NDEFReader' in window,
      usb: 'usb' in navigator
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            RC-S380 테스트 페이지
          </h1>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{message}</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">브라우저 API 지원 확인</h2>
              <div className="space-y-2">
                <p className="text-blue-800">
                  Web Serial API: {isClient ? (browserAPIs.webSerial ? '✅ 지원됨' : '❌ 지원 안됨') : '로딩 중...'}
                </p>
                <p className="text-blue-800">
                  USB HID API: {isClient ? (browserAPIs.usbHid ? '✅ 지원됨' : '❌ 지원 안됨') : '로딩 중...'}
                </p>
                <p className="text-blue-800">
                  Web NFC API: {isClient ? (browserAPIs.webNfc ? '✅ 지원됨' : '❌ 지원 안됨') : '로딩 중...'}
                </p>
                <p className="text-blue-800">
                  USB API: {isClient ? (browserAPIs.usb ? '✅ 지원됨' : '❌ 지원 안됨') : '로딩 중...'}
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">다음 단계</h2>
              <p className="text-yellow-800">
                이 페이지가 정상적으로 로드되면, 브라우저에서 다음 URL로 접속하여 RC-S380 테스트를 진행하세요:
              </p>
              <code className="block mt-2 p-2 bg-yellow-100 rounded text-yellow-900">
                http://localhost:3000/rc-s380-test
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 