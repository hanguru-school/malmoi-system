'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock,
  User,
  FileText,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface LessonNote {
  id: string;
  title: string;
  content: string;
  date: string;
  teacherName: string;
  duration: number;
  status: 'completed' | 'scheduled' | 'cancelled';
}

export default function StudentLessonNotesPage() {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCompletedClasses, setHasCompletedClasses] = useState(false);

  useEffect(() => {
    const fetchLessonNotes = async () => {
      try {
        setLoading(true);
        
        // 실제 API 호출로 대체
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 새로 가입한 학생은 아직 수업을 하지 않았으므로 빈 배열
        const mockNotes: LessonNote[] = [];
        
        setNotes(mockNotes);
        setHasCompletedClasses(mockNotes.length > 0);
      } catch (error) {
        console.error('레슨 노트 로드 오류:', error);
        setNotes([]);
        setHasCompletedClasses(false);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonNotes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasCompletedClasses) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">레슨 노트</h1>
            <p className="text-lg text-gray-600">
              수업 내용과 학습 노트를 확인하세요
            </p>
          </div>

          {/* 빈 상태 */}
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              아직 수업을 하지 않았습니다
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              첫 번째 수업을 완료하면 여기에 레슨 노트가 표시됩니다. 
              수업 내용과 학습 포인트를 다시 확인할 수 있어요.
            </p>
            
            <div className="space-y-4">
              <Link
                href="/student/reservations/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                첫 수업 예약하기
              </Link>
              
              <div className="text-sm text-gray-500">
                또는 <Link href="/student/reservations" className="text-blue-600 hover:underline">예약 관리</Link>에서 
                기존 예약을 확인하세요
              </div>
            </div>
          </div>

          {/* 레슨 노트 기능 설명 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">수업 내용</h3>
              <p className="text-gray-600 text-sm">
                선생님이 작성한 수업 내용과 학습 포인트를 확인할 수 있습니다.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">개인 피드백</h3>
              <p className="text-gray-600 text-sm">
                선생님이 개인적으로 작성한 피드백과 개선점을 확인하세요.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">학습 기록</h3>
              <p className="text-gray-600 text-sm">
                언제든지 과거 수업 내용을 다시 확인하여 복습할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">레슨 노트</h1>
          <p className="text-lg text-gray-600">
            수업 내용과 학습 노트를 확인하세요
          </p>
        </div>

        {/* 레슨 노트 목록 */}
        <div className="space-y-6">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{note.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {note.teacherName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(note.date).toLocaleDateString('ko-KR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {note.duration}분
                    </span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  note.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : note.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {note.status === 'completed' ? '완료' : 
                   note.status === 'scheduled' ? '예정' : '취소'}
                </div>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{note.content}</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href={`/student/lesson-notes/${note.id}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  자세히 보기
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 