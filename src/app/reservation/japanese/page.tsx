'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function JapaneseReservationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleNewReservation = () => {
    setIsLoading(true);
    router.push('/reservation/japanese/login?action=new');
  };

  const handleCheckReservation = () => {
    setIsLoading(true);
    router.push('/reservation/japanese/login?action=check');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 상단 배경 이미지 */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              韓国語レッスン予約
            </h1>
            <p className="text-xl md:text-2xl opacity-90">
              ここからレッスンの予約や確認ができます
            </p>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 설명 섹션 */}
        <div className="text-center mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              レッスン予約システムへようこそ
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              韓国語レッスンの予約、確認、変更、キャンセルを簡単に行えます。<br />
              オンライン・対面レッスンに対応し、お好みの時間に予約できます。
            </p>
          </div>
        </div>

        {/* 메인 버튼 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* 새 예약 시작 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                予約をはじめる
              </h3>
              <p className="text-gray-600 mb-6">
                新しいレッスンの予約を行います。<br />
                コース、日時、対面・オンラインを選択できます。
              </p>
              <button
                onClick={handleNewReservation}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>予約をはじめる</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 예약 확인 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                予約を確認する
              </h3>
              <p className="text-gray-600 mb-6">
                既存の予約を確認・変更・キャンセルします。<br />
                予約履歴も確認できます。
              </p>
              <button
                onClick={handleCheckReservation}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>予約を確認する</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 특징 설명 */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">5分単位予約</h4>
            <p className="text-sm text-gray-600">
              5分単位で細かく時間を選択できます
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="bg-orange-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">対面・オンライン</h4>
            <p className="text-sm text-gray-600">
              対面レッスンとオンラインレッスンに対応
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">自動通知</h4>
            <p className="text-sm text-gray-600">
              LINE・メールで自動通知配信
            </p>
          </div>
        </div>

        {/* 코스 정보 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            レッスンコース
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { duration: '40分', price: '¥3,000', type: '基礎コース' },
              { duration: '60分', price: '¥4,500', type: '標準コース' },
              { duration: '90分', price: '¥6,500', type: '集中コース' },
              { duration: '120分', price: '¥8,500', type: '特訓コース' },
              { duration: '180分', price: '¥12,000', type: 'マスターコース' }
            ].map((course, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-blue-600 mb-2">
                  {course.duration}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {course.type}
                </div>
                <div className="text-lg font-semibold text-gray-800">
                  {course.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 