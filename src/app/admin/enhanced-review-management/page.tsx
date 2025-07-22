'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Search, Filter, Send, Download, Eye, Reply, Flag, Calendar, User, ThumbsUp } from 'lucide-react';

interface Review {
  id: string;
  studentName: string;
  teacherName: string;
  classDate: string;
  courseName: string;
  rating: number;
  content: string;
  reviewDate: string;
  hasResponse: boolean;
  response?: {
    responderName: string;
    responseDate: string;
    content: string;
    isPublic: boolean;
  };
  isLinkedToGoogle: boolean;
  isReported: boolean;
  reportReason?: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  googleLinkedRate: number;
  monthlyTrend: { month: string; reviews: number; averageRating: number }[];
  ratingDistribution: { rating: number; count: number }[];
  teacherStats: { name: string; reviews: number; averageRating: number }[];
}

export default function EnhancedReviewManagementPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unresponded' | 'responded' | 'reported'>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [isPublicResponse, setIsPublicResponse] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data initialization
  useEffect(() => {
    const initializeData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockReviews: Review[] = [
        {
          id: '1',
          studentName: '김학생',
          teacherName: '이선생님',
          classDate: '2024-01-15',
          courseName: '중급 문법',
          rating: 5,
          content: '문법 설명이 매우 명확했습니다. 실습도 충분히 할 수 있어서 좋았습니다. 다음 수업도 기대됩니다!',
          reviewDate: '2024-01-15 16:30',
          hasResponse: false,
          isLinkedToGoogle: true,
          isReported: false
        },
        {
          id: '2',
          studentName: '박학생',
          teacherName: '김선생님',
          classDate: '2024-01-14',
          courseName: '회화 연습',
          rating: 4,
          content: '회화 연습이 재미있었고, 선생님이 친절하게 가르쳐주셨습니다. 조금 더 실습 시간이 있었으면 좋겠어요.',
          reviewDate: '2024-01-14 18:20',
          hasResponse: true,
          response: {
            responderName: '김선생님',
            responseDate: '2024-01-15 09:15',
            content: '감사합니다! 다음 수업에서는 더 많은 실습 시간을 준비하겠습니다. 열심히 공부해주셔서 고맙습니다.',
            isPublic: true
          },
          isLinkedToGoogle: true,
          isReported: false
        },
        {
          id: '3',
          studentName: '최학생',
          teacherName: '박선생님',
          classDate: '2024-01-13',
          courseName: '단어 학습',
          rating: 3,
          content: '수업은 괜찮았지만, 조금 빠르게 진행되어서 따라가기 어려웠습니다.',
          reviewDate: '2024-01-13 20:45',
          hasResponse: false,
          isLinkedToGoogle: false,
          isReported: false
        },
        {
          id: '4',
          studentName: '정학생',
          teacherName: '이선생님',
          classDate: '2024-01-12',
          courseName: '고급 문법',
          rating: 5,
          content: '정말 훌륭한 수업이었습니다! 선생님의 설명이 너무 명확해서 이해하기 쉬웠어요.',
          reviewDate: '2024-01-12 17:10',
          hasResponse: false,
          isLinkedToGoogle: true,
          isReported: false
        },
        {
          id: '5',
          studentName: '한학생',
          teacherName: '김선생님',
          classDate: '2024-01-11',
          courseName: '초급 회화',
          rating: 2,
          content: '수업이 너무 어려웠고, 선생님이 제 질문에 제대로 답변하지 않으셨습니다.',
          reviewDate: '2024-01-11 19:30',
          hasResponse: false,
          isLinkedToGoogle: false,
          isReported: true,
          reportReason: '부적절한 내용'
        }
      ];

      const mockStats: ReviewStats = {
        totalReviews: 156,
        averageRating: 4.3,
        responseRate: 68.5,
        googleLinkedRate: 75.2,
        monthlyTrend: [
          { month: '10월', reviews: 25, averageRating: 4.2 },
          { month: '11월', reviews: 32, averageRating: 4.4 },
          { month: '12월', reviews: 28, averageRating: 4.1 },
          { month: '1월', reviews: 35, averageRating: 4.3 }
        ],
        ratingDistribution: [
          { rating: 5, count: 67 },
          { rating: 4, count: 52 },
          { rating: 3, count: 23 },
          { rating: 2, count: 10 },
          { rating: 1, count: 4 }
        ],
        teacherStats: [
          { name: '김선생님', reviews: 45, averageRating: 4.5 },
          { name: '이선생님', reviews: 38, averageRating: 4.3 },
          { name: '박선생님', reviews: 32, averageRating: 4.1 },
          { name: '최선생님', reviews: 41, averageRating: 4.4 }
        ]
      };

      setReviews(mockReviews);
      setFilteredReviews(mockReviews);
      setStats(mockStats);
      setIsLoading(false);
    };

    initializeData();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = reviews;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(review => 
        review.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by teacher
    if (filterTeacher) {
      filtered = filtered.filter(review => review.teacherName === filterTeacher);
    }

    // Filter by rating
    if (filterRating) {
      filtered = filtered.filter(review => review.rating === parseInt(filterRating));
    }

    // Filter by status
    if (filterStatus === 'unresponded') {
      filtered = filtered.filter(review => !review.hasResponse);
    } else if (filterStatus === 'responded') {
      filtered = filtered.filter(review => review.hasResponse);
    } else if (filterStatus === 'reported') {
      filtered = filtered.filter(review => review.isReported);
    }

    setFilteredReviews(filtered);
  }, [reviews, searchTerm, filterTeacher, filterRating, filterStatus]);

  const handleResponse = (review: Review) => {
    setSelectedReview(review);
    setResponseContent('');
    setIsPublicResponse(true);
    setShowResponseModal(true);
  };

  const submitResponse = () => {
    if (!selectedReview || !responseContent.trim()) return;

    const updatedReviews = reviews.map(review => 
      review.id === selectedReview.id 
        ? {
            ...review,
            hasResponse: true,
            response: {
              responderName: '관리자',
              responseDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
              content: responseContent,
              isPublic: isPublicResponse
            }
          }
        : review
    );

    setReviews(updatedReviews);
    setShowResponseModal(false);
    setSelectedReview(null);
    setResponseContent('');
  };

  const toggleGoogleLink = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, isLinkedToGoogle: !review.isLinkedToGoogle }
        : review
    ));
  };

  const exportReviews = () => {
    // Mock export functionality
    console.log('Exporting reviews...');
    alert('리뷰 데이터가 엑셀 파일로 다운로드되었습니다.');
  };

  const getTeachers = () => {
    return Array.from(new Set(reviews.map(review => review.teacherName)));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">리뷰 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">향상된 리뷰 관리</h1>
          <p className="text-gray-600">학생 리뷰를 관리하고 응답하며 Google 리뷰와 연동할 수 있습니다.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 리뷰</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 평점</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Reply className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">응답률</p>
                <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ThumbsUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Google 연동</p>
                <p className="text-2xl font-bold text-gray-900">{stats.googleLinkedRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="리뷰 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">전체 선생님</option>
                  {getTeachers().map(teacher => (
                    <option key={teacher} value={teacher}>{teacher}</option>
                  ))}
                </select>
                
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">전체 평점</option>
                  <option value="5">5점</option>
                  <option value="4">4점</option>
                  <option value="3">3점</option>
                  <option value="2">2점</option>
                  <option value="1">1점</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'unresponded' | 'responded' | 'reported')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="unresponded">미응답</option>
                  <option value="responded">응답됨</option>
                  <option value="reported">신고됨</option>
                </select>
              </div>
              
              <button
                onClick={exportReviews}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                엑셀 다운로드
              </button>
            </div>
          </div>

          {/* Review List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학생/선생님
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수업 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평점
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    리뷰 내용
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{review.studentName}</div>
                        <div className="text-sm text-gray-500">{review.teacherName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{review.courseName}</div>
                        <div className="text-sm text-gray-500">{review.classDate}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-900">{review.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {review.content}
                      </div>
                      <div className="text-sm text-gray-500">{review.reviewDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {review.hasResponse && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            응답됨
                          </span>
                        )}
                        {review.isLinkedToGoogle && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Google 연동
                          </span>
                        )}
                        {review.isReported && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            신고됨
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResponse(review)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {review.hasResponse ? '수정' : '응답'}
                        </button>
                        <button
                          onClick={() => toggleGoogleLink(review.id)}
                          className={`${review.isLinkedToGoogle ? 'text-green-600' : 'text-gray-600'} hover:text-green-900`}
                        >
                          {review.isLinkedToGoogle ? '연동해제' : 'Google연동'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teacher Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">선생님별 리뷰 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.teacherStats.map((teacher, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{teacher.name}</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">리뷰 수: {teacher.reviews}개</p>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{teacher.averageRating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">리뷰 응답</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  응답 내용
                </label>
                <textarea
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="응답 내용을 입력하세요..."
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublicResponse}
                    onChange={(e) => setIsPublicResponse(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">공개 응답 (Google 리뷰에 표시)</span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  취소
                </button>
                <button
                  onClick={submitResponse}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  응답 등록
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 