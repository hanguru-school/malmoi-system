'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Upload, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Download,
  Edit,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacher: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'completed' | 'overdue';
  type: 'writing' | 'reading' | 'listening' | 'speaking' | 'grammar';
  attachments?: string[];
  submittedFiles?: string[];
  submittedAt?: string;
  score?: number;
  feedback?: string;
  priority: 'low' | 'medium' | 'high';
}

export default function StudentHomeworkPage() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      setHomework([
        {
          id: '1',
          title: '자기소개 문장 작성',
          description: '자기소개에 사용할 수 있는 문장 5개를 작성해주세요. 취미, 가족, 직업, 꿈 등 다양한 주제로 작성하세요.',
          subject: '한국어 회화',
          teacher: '김선생님',
          assignedDate: '2024-01-15',
          dueDate: '2024-01-18',
          status: 'submitted',
          type: 'writing',
          attachments: ['self-introduction-template.pdf'],
          submittedFiles: ['my-self-introduction.docx'],
          submittedAt: '2024-01-17',
          score: 85,
          feedback: '잘 작성되었습니다. 더 자연스러운 표현을 위해 다양한 문법을 활용해보세요.',
          priority: 'medium'
        },
        {
          id: '2',
          title: '비즈니스 이메일 작성',
          description: '회사에서 사용할 수 있는 비즈니스 이메일을 작성해주세요. 고객에게 제품 소개를 하는 내용으로 작성하세요.',
          subject: '한국어 회화',
          teacher: '이선생님',
          assignedDate: '2024-01-14',
          dueDate: '2024-01-20',
          status: 'pending',
          type: 'writing',
          attachments: ['business-email-examples.pdf'],
          priority: 'high'
        },
        {
          id: '3',
          title: '문법 문제 풀이',
          description: '현재완료 시제와 과거완료 시제 관련 문제 10개를 풀어주세요.',
          subject: '한국어 문법',
          teacher: '박선생님',
          assignedDate: '2024-01-12',
          dueDate: '2024-01-16',
          status: 'completed',
          type: 'grammar',
          attachments: ['grammar-exercises.pdf'],
          submittedFiles: ['grammar-answers.pdf'],
          submittedAt: '2024-01-15',
          score: 92,
          feedback: '완벽합니다! 모든 문제를 정확히 풀었습니다.',
          priority: 'medium'
        },
        {
          id: '4',
          title: '발음 연습 녹음',
          description: '한국어 자음 ㅅ, ㅈ, ㅊ 발음을 연습하고 음성 파일로 녹음해서 제출해주세요.',
          subject: '한국어 발음',
          teacher: '최선생님',
          assignedDate: '2024-01-10',
          dueDate: '2024-01-13',
          status: 'overdue',
          type: 'speaking',
          attachments: ['pronunciation-guide.pdf'],
          priority: 'low'
        },
        {
          id: '5',
          title: '뉴스 기사 읽기',
          description: '제공된 뉴스 기사를 읽고 주요 내용을 요약해서 제출해주세요.',
          subject: '한국어 읽기',
          teacher: '정선생님',
          assignedDate: '2024-01-16',
          dueDate: '2024-01-22',
          status: 'pending',
          type: 'reading',
          attachments: ['news-article.pdf'],
          priority: 'medium'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredHomework = homework.filter(hw => {
    const matchesSearch = hw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hw.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hw.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'pending') return matchesSearch && hw.status === 'pending';
    if (selectedFilter === 'submitted') return matchesSearch && hw.status === 'submitted';
    if (selectedFilter === 'completed') return matchesSearch && hw.status === 'completed';
    if (selectedFilter === 'overdue') return matchesSearch && hw.status === 'overdue';
    if (selectedFilter === 'high-priority') return matchesSearch && hw.priority === 'high';
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'writing': return <FileText className="w-4 h-4" />;
      case 'reading': return <BookOpen className="w-4 h-4" />;
      case 'listening': return <Clock className="w-4 h-4" />;
      case 'speaking': return <User className="w-4 h-4" />;
      case 'grammar': return <Edit className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleHomeworkClick = (hw: Homework) => {
    setSelectedHomework(hw);
  };

  const handleBackToList = () => {
    setSelectedHomework(null);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">숙제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (selectedHomework) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBackToList}
              className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedHomework.title}</h1>
              <p className="text-gray-600">{selectedHomework.subject}</p>
            </div>
          </div>

          {/* 숙제 상세 내용 */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{selectedHomework.teacher}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>제출일: {new Date(selectedHomework.assignedDate).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>마감일: {new Date(selectedHomework.dueDate).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedHomework.priority)}`}>
                  {selectedHomework.priority === 'high' ? '높음' : selectedHomework.priority === 'medium' ? '보통' : '낮음'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedHomework.status)}`}>
                  {selectedHomework.status === 'pending' ? '대기중' : 
                   selectedHomework.status === 'submitted' ? '제출됨' : 
                   selectedHomework.status === 'completed' ? '완료' : '기한초과'}
                </span>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">숙제 내용</h3>
              <p className="text-gray-700 mb-6">{selectedHomework.description}</p>

              {/* 첨부 파일 */}
              {selectedHomework.attachments && selectedHomework.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">첨부 파일</h4>
                  <div className="space-y-2">
                    {selectedHomework.attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{file}</span>
                        <button className="ml-auto p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 제출된 파일 */}
              {selectedHomework.submittedFiles && selectedHomework.submittedFiles.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">제출된 파일</h4>
                  <div className="space-y-2">
                    {selectedHomework.submittedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">{file}</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {selectedHomework.submittedAt && new Date(selectedHomework.submittedAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 점수 및 피드백 */}
              {selectedHomework.score && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">평가 결과</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-blue-600">{selectedHomework.score}점</span>
                    </div>
                    {selectedHomework.feedback && (
                      <p className="text-gray-700">{selectedHomework.feedback}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 제출 버튼 */}
              {selectedHomework.status === 'pending' && (
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>숙제 제출</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>첨부파일 다운로드</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">숙제</h1>
            <p className="text-gray-600">숙제 목록과 제출 현황을 확인하세요</p>
          </div>
          <Link
            href="/student/home"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>돌아가기</span>
          </Link>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="숙제 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="pending">대기중</option>
              <option value="submitted">제출됨</option>
              <option value="completed">완료</option>
              <option value="overdue">기한초과</option>
              <option value="high-priority">높은 우선순위</option>
            </select>
          </div>
        </div>

        {/* 숙제 목록 */}
        <div className="space-y-4">
          {filteredHomework.map((hw) => (
            <div
              key={hw.id}
              onClick={() => handleHomeworkClick(hw)}
              className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getTypeIcon(hw.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{hw.title}</h3>
                    <p className="text-sm text-gray-600">{hw.subject} • {hw.teacher}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(hw.priority)}`}>
                    {hw.priority === 'high' ? '높음' : hw.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hw.status)}`}>
                    {hw.status === 'pending' ? '대기중' : 
                     hw.status === 'submitted' ? '제출됨' : 
                     hw.status === 'completed' ? '완료' : '기한초과'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{hw.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>제출일: {new Date(hw.assignedDate).toLocaleDateString('ko-KR')}</span>
                  <span>마감일: {new Date(hw.dueDate).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hw.score && (
                    <span className="text-green-600 font-medium">{hw.score}점</span>
                  )}
                  {isOverdue(hw.dueDate) && hw.status === 'pending' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredHomework.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">숙제가 없습니다</h3>
            <p className="text-gray-600">현재 할당된 숙제가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 