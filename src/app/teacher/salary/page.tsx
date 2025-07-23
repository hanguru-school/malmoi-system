'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock,
  Download,
  Eye,
  Home,
  CreditCard,
  Banknote,
  Receipt,
  X,
  FileText,
  Users,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

interface SalaryData {
  currentMonth: {
    baseSalary: number;
    overtimePay: number;
    bonus: number;
    deductions: number;
    netSalary: number;
    workingHours: {
      lectureHours: number;
      otherHours: number;
      totalHours: number;
    };
    overtimeHours: number;
  };
  monthlyHistory: {
    month: string;
    netSalary: number;
    workingHours: number;
    status: 'paid' | 'pending' | 'processing';
  }[];
  paymentHistory: {
    id: string;
    date: string;
    amount: number;
    method: 'bank_transfer' | 'direct_deposit';
    status: 'completed' | 'pending' | 'failed';
    description: string;
  }[];
}

export default function TeacherSalaryPage() {
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2024-01');
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      const mockData: SalaryData = {
        currentMonth: {
          baseSalary: 3000000,
          overtimePay: 450000,
          bonus: 200000,
          deductions: 150000,
          netSalary: 3500000,
          workingHours: {
            lectureHours: 120,
            otherHours: 40,
            totalHours: 160
          },
          overtimeHours: 20
        },
        monthlyHistory: [
          { month: '2024-01', netSalary: 3500000, workingHours: 160, status: 'paid' },
          { month: '2023-12', netSalary: 3200000, workingHours: 155, status: 'paid' },
          { month: '2023-11', netSalary: 3300000, workingHours: 158, status: 'paid' },
          { month: '2023-10', netSalary: 3100000, workingHours: 152, status: 'paid' },
          { month: '2023-09', netSalary: 3250000, workingHours: 156, status: 'paid' },
          { month: '2023-08', netSalary: 3150000, workingHours: 154, status: 'paid' }
        ],
        paymentHistory: [
          {
            id: '1',
            date: '2024-01-15',
            amount: 3500000,
            method: 'bank_transfer',
            status: 'completed',
            description: '2024년 1월 급여'
          },
          {
            id: '2',
            date: '2023-12-15',
            amount: 3200000,
            method: 'bank_transfer',
            status: 'completed',
            description: '2023년 12월 급여'
          },
          {
            id: '3',
            date: '2023-11-15',
            amount: 3300000,
            method: 'bank_transfer',
            status: 'completed',
            description: '2023년 11월 급여'
          }
        ]
      };

      setSalaryData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return '완료';
      case 'pending':
        return '대기';
      case 'processing':
        return '처리중';
      case 'failed':
        return '실패';
      default:
        return '알 수 없음';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="w-4 h-4" />;
      case 'direct_deposit':
        return <Banknote className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return '계좌이체';
      case 'direct_deposit':
        return '직접입금';
      default:
        return '기타';
    }
  };

  const handleDownloadPayslip = () => {
    // 실제 다운로드 로직
    alert('급여 명세서가 다운로드되었습니다.');
    setShowPayslipModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!salaryData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">급여 정보를 찾을 수 없습니다</h2>
          <p className="text-gray-600">급여 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">급여 확인</h1>
          <p className="text-gray-600">월별 급여 정보를 확인하세요</p>
        </div>
        <Link
          href="/teacher/home"
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <Home className="w-4 h-4" />
          홈으로
        </Link>
      </div>

      {/* 근무시간 정보 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">근무시간</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/teacher/salary/lecture-hours"
            className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">강의 시간</p>
                <p className="text-2xl font-bold text-blue-600">{salaryData.currentMonth.workingHours.lectureHours}시간</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </Link>
          
          <Link
            href="/teacher/salary/other-hours"
            className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">그 외 근무시간</p>
                <p className="text-2xl font-bold text-green-600">{salaryData.currentMonth.workingHours.otherHours}시간</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </Link>
          
          <Link
            href="/teacher/salary/total-hours"
            className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 근무시간</p>
                <p className="text-2xl font-bold text-purple-600">{salaryData.currentMonth.workingHours.totalHours}시간</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </Link>
        </div>
      </div>

      {/* 이번 달 급여 정보 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">이번 달 급여</h2>
          <button
            onClick={() => setShowPayslipModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText className="w-4 h-4" />
            급여 명세서
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">기본급</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(salaryData.currentMonth.baseSalary)}원</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">초과근무수당</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(salaryData.currentMonth.overtimePay)}원</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">상여금</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(salaryData.currentMonth.bonus)}원</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">공제액</p>
            <p className="text-xl font-bold text-red-600">-{formatCurrency(salaryData.currentMonth.deductions)}원</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
          <p className="text-sm opacity-90">실수령액</p>
          <p className="text-3xl font-bold">{formatCurrency(salaryData.currentMonth.netSalary)}원</p>
        </div>
      </div>

      {/* 급여 상세 내역 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">급여 상세 내역</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">기본급</p>
              <p className="text-sm text-gray-600">월 기본 급여</p>
            </div>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(salaryData.currentMonth.baseSalary)}원</p>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-blue-900">초과근무수당</p>
              <p className="text-sm text-blue-600">{salaryData.currentMonth.overtimeHours}시간 초과근무</p>
            </div>
            <p className="text-lg font-semibold text-blue-900">{formatCurrency(salaryData.currentMonth.overtimePay)}원</p>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium text-green-900">상여금</p>
              <p className="text-sm text-green-600">성과 보너스</p>
            </div>
            <p className="text-lg font-semibold text-green-900">{formatCurrency(salaryData.currentMonth.bonus)}원</p>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">공제액</p>
              <p className="text-sm text-red-600">세금 및 보험료</p>
            </div>
            <p className="text-lg font-semibold text-red-900">-{formatCurrency(salaryData.currentMonth.deductions)}원</p>
          </div>
        </div>
      </div>

      {/* 월별 급여 내역 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">월별 급여 내역</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">월</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">급여</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">근무시간</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salaryData.monthlyHistory.map((item) => (
                <tr key={item.month} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.month}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.netSalary)}원
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.workingHours}시간
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 지급 내역 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">지급 내역</h2>
        <div className="space-y-4">
          {salaryData.paymentHistory.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                {getPaymentMethodIcon(payment.method)}
                <div>
                  <p className="font-medium text-gray-900">{payment.description}</p>
                  <p className="text-sm text-gray-600">{payment.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}원</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                  {getStatusText(payment.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 급여 명세서 모달 */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">급여 명세서</h2>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* 명세서 내용 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">2024년 1월 급여 명세서</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">지급 내역</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>기본급</span>
                        <span>{formatCurrency(salaryData.currentMonth.baseSalary)}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>초과근무수당</span>
                        <span>{formatCurrency(salaryData.currentMonth.overtimePay)}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>상여금</span>
                        <span>{formatCurrency(salaryData.currentMonth.bonus)}원</span>
                      </div>
                      <div className="border-t pt-2 font-semibold">
                        <div className="flex justify-between">
                          <span>지급 총액</span>
                          <span>{formatCurrency(salaryData.currentMonth.baseSalary + salaryData.currentMonth.overtimePay + salaryData.currentMonth.bonus)}원</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">공제 내역</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>소득세</span>
                        <span>-{formatCurrency(salaryData.currentMonth.deductions * 0.7)}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>국민연금</span>
                        <span>-{formatCurrency(salaryData.currentMonth.deductions * 0.2)}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>건강보험</span>
                        <span>-{formatCurrency(salaryData.currentMonth.deductions * 0.1)}원</span>
                      </div>
                      <div className="border-t pt-2 font-semibold">
                        <div className="flex justify-between">
                          <span>공제 총액</span>
                          <span>-{formatCurrency(salaryData.currentMonth.deductions)}원</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">실수령액</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(salaryData.currentMonth.netSalary)}원</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  닫기
                </button>
                <button
                  onClick={handleDownloadPayslip}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  다운로드
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 