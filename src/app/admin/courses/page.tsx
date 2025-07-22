'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen, 
  DollarSign, 
  Clock, 
  Users,
  Award,
  AlertCircle,
  CheckCircle,
  Loader2,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  level: string;
  category: string;
  maxStudents: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  totalEnrollments: number;
  averageRating: number;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockCourses: Course[] = [
        {
          id: '1',
          name: '한국어 회화 기초',
          description: '일상 대화와 실용적인 한국어 표현 학습',
          duration: 60,
          price: 30000,
          level: '초급',
          category: '회화',
          maxStudents: 8,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          totalEnrollments: 45,
          averageRating: 4.8
        },
        {
          id: '2',
          name: '한국어 문법 중급',
          description: '체계적인 한국어 문법 학습',
          duration: 60,
          price: 35000,
          level: '중급',
          category: '문법',
          maxStudents: 6,
          status: 'active',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-14T00:00:00Z',
          totalEnrollments: 32,
          averageRating: 4.7
        },
        {
          id: '3',
          name: '한국어 작문 고급',
          description: '한국어 작문 능력 향상',
          duration: 90,
          price: 45000,
          level: '고급',
          category: '작문',
          maxStudents: 4,
          status: 'active',
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-13T00:00:00Z',
          totalEnrollments: 18,
          averageRating: 4.9
        },
        {
          id: '4',
          name: '한국어 리스닝 기초',
          description: '한국어 듣기 능력 향상',
          duration: 45,
          price: 25000,
          level: '초급',
          category: '리스닝',
          maxStudents: 10,
          status: 'inactive',
          createdAt: '2024-01-04T00:00:00Z',
          updatedAt: '2024-01-12T00:00:00Z',
          totalEnrollments: 28,
          averageRating: 4.6
        },
        {
          id: '5',
          name: 'TOPIK 시험 준비',
          description: 'TOPIK 시험 대비 종합 학습',
          duration: 120,
          price: 60000,
          level: '중급~고급',
          category: '시험준비',
          maxStudents: 6,
          status: 'active',
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-11T00:00:00Z',
          totalEnrollments: 22,
          averageRating: 4.8
        },
        {
          id: '6',
          name: '한국어 발음 교정',
          description: '정확한 한국어 발음 교정',
          duration: 45,
          price: 25000,
          level: '초급~중급',
          category: '발음',
          maxStudents: 8,
          status: 'active',
          createdAt: '2024-01-06T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z',
          totalEnrollments: 35,
          averageRating: 4.5
        }
      ];

      setCourses(mockCourses);
      setLoading(false);
    } catch (error) {
      console.error('코스 로드 실패:', error);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;

    try {
      setDeleting(true);
      
      // 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('코스 삭제:', courseToDelete.id);
      
      // 성공 시 목록에서 제거
      setCourses(courses.filter(course => course.id !== courseToDelete.id));
      setShowDeleteModal(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error('코스 삭제 실패:', error);
    } finally {
      setDeleting(false);
    }
  };

  // 필터링 및 검색
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case '초급':
        return 'bg-blue-100 text-blue-800';
      case '중급':
        return 'bg-yellow-100 text-yellow-800';
      case '고급':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800'
    ];
    const index = category.length % colors.length;
    return colors[index];
  };

  const categories = Array.from(new Set(courses.map(course => course.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">코스 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">코스 관리</h1>
            <p className="text-lg text-gray-600">
              수업 코스를 관리하고 설정하세요
            </p>
          </div>
          <Link
            href="/admin/courses/new"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            새 코스 추가
          </Link>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색 */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="코스명, 설명, 카테고리로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 상태 필터 */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>

            {/* 카테고리 필터 */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 카테고리</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 코스 목록 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">코스가 없습니다</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? '검색 조건에 맞는 코스가 없습니다.' 
                  : '아직 등록된 코스가 없습니다.'}
              </p>
              <Link
                href="/admin/courses/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                첫 코스 추가하기
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      코스 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카테고리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가격/시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      통계
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <BookOpen className="w-8 h-8 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{course.name}</div>
                            <div className="text-sm text-gray-500 mt-1">{course.description}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                                {course.level}
                              </span>
                              <span className="text-xs text-gray-500">
                                최대 {course.maxStudents}명
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(course.category)}`}>
                          {course.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            {course.price.toLocaleString()}원
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            {course.duration}분
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-purple-600" />
                            {course.totalEnrollments}명
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Award className="w-4 h-4 text-yellow-600" />
                            {course.averageRating.toFixed(1)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                          {course.status === 'active' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              활성
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              비활성
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setCourseToDelete(course);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            상세보기
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 통계 요약 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">총 코스</div>
                <div className="text-2xl font-bold text-gray-900">{courses.length}개</div>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">활성 코스</div>
                <div className="text-2xl font-bold text-gray-900">
                  {courses.filter(c => c.status === 'active').length}개
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">총 수강생</div>
                <div className="text-2xl font-bold text-gray-900">
                  {courses.reduce((sum, course) => sum + course.totalEnrollments, 0)}명
                </div>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">평균 평점</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(courses.reduce((sum, course) => sum + course.averageRating, 0) / courses.length).toFixed(1)}
                </div>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* 삭제 확인 모달 */}
        {showDeleteModal && courseToDelete && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">코스 삭제</h3>
              <p className="text-gray-600 mb-6">
                <strong>{courseToDelete.name}</strong> 코스를 삭제하시겠습니까? 
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCourseToDelete(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 