'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, User, Calendar, Clock, Mic, FileText } from 'lucide-react';

interface LessonNote {
  id: string;
  title: string;
  date: string;
  teacher: string;
  duration: string;
  content: string;
  vocabulary: string[];
  grammar: string[];
  homework: string[];
  attachments: {
    audio?: string;
    files?: string[];
  };
  score?: number;
  isFavorite?: boolean;
}

export default function StudentNotesPage() {
  const [selectedNote, setSelectedNote] = useState<LessonNote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'recent' | 'favorite'>('all');

  // Mock data
  const notes: LessonNote[] = [
    {
      id: '1',
      title: '기초 영어 회화 - 자기소개',
      date: '2024-01-15',
      teacher: '김선생님',
      duration: '60분',
      content: '오늘은 자기소개에 대해 배웠습니다. 이름, 나이, 직업, 취미 등을 영어로 표현하는 방법을 연습했습니다.',
      vocabulary: ['introduce', 'name', 'age', 'job', 'hobby'],
      grammar: ['My name is...', 'I am... years old', 'I work as...', 'I like...'],
      homework: ['자기소개 문장 5개 작성', '새로운 단어 10개 암기'],
      attachments: {
        audio: '/audio/lesson1.mp3'
      },
      score: 85
    }
  ];

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'recent' && new Date(note.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                         (filter === 'favorite' && note.isFavorite);
    return matchesSearch && matchesFilter;
  });

  const handleNoteClick = (note: LessonNote) => {
    setSelectedNote(note);
  };

  const handleBackToList = () => {
    setSelectedNote(null);
  };

  if (selectedNote) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>목록으로 돌아가기</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedNote.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{selectedNote.teacher}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedNote.date).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedNote.duration}</span>
                </div>
              </div>
            </div>
            {selectedNote.score && (
              <div className="flex items-center gap-1 text-green-600 text-lg font-bold">
                <span>{selectedNote.score}점</span>
              </div>
            )}
          </div>

          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">수업 내용</h3>
            <p className="text-gray-700 leading-relaxed mb-6">{selectedNote.content}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">새로운 단어</h4>
                <ul className="space-y-1">
                  {selectedNote.vocabulary.map((word, index) => (
                    <li key={index} className="text-sm text-gray-600">• {word}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">문법 포인트</h4>
                <ul className="space-y-1">
                  {selectedNote.grammar.map((grammar, index) => (
                    <li key={index} className="text-sm text-gray-600">• {grammar}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">숙제</h4>
                <ul className="space-y-1">
                  {selectedNote.homework.map((task, index) => (
                    <li key={index} className="text-sm text-gray-600">• {task}</li>
                  ))}
                </ul>
              </div>
            </div>

            {selectedNote.attachments.audio && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">수업 녹음</span>
                </div>
                <audio controls className="w-full">
                  <source src={selectedNote.attachments.audio} type="audio/mpeg" />
                  브라우저가 오디오를 지원하지 않습니다.
                </audio>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">레슨 노트</h1>
          <p className="text-gray-600 mt-2">수업 내용과 학습 자료를 확인하세요</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="노트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'recent' | 'favorite')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체</option>
            <option value="recent">최근</option>
            <option value="favorite">즐겨찾기</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => handleNoteClick(note)}
            className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{note.title}</h3>
              </div>
              {note.score && (
                <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <span>{note.score}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{note.teacher}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(note.date).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{note.duration}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{note.content}</p>

            <div className="flex items-center gap-2">
              {note.attachments.audio && (
                <div className="flex items-center gap-1 text-blue-600 text-sm">
                  <Mic className="w-4 h-4" />
                  <span>음성</span>
                </div>
              )}
              {note.attachments.files && note.attachments.files.length > 0 && (
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <FileText className="w-4 h-4" />
                  <span>파일</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">레슨 노트가 없습니다</h3>
          <p className="text-gray-600">아직 작성된 레슨 노트가 없습니다.</p>
        </div>
      )}
    </div>
  );
} 