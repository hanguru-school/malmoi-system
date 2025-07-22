'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Star, 
  Volume2, 
  Bookmark,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';
import Link from 'next/link';

interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learnedDate: string;
  reviewCount: number;
  lastReviewed?: string;
  isBookmarked: boolean;
  isMastered: boolean;
  audioUrl?: string;
}

export default function StudentVocabularyPage() {
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [studyMode, setStudyMode] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      setVocabulary([
        {
          id: '1',
          word: '자기소개',
          meaning: '자신을 다른 사람에게 소개하는 것',
          pronunciation: '자기소개',
          example: '안녕하세요, 자기소개를 하겠습니다.',
          category: '일상생활',
          difficulty: 'beginner',
          learnedDate: '2024-01-15',
          reviewCount: 3,
          lastReviewed: '2024-01-17',
          isBookmarked: true,
          isMastered: true,
          audioUrl: '/audio/자기소개.mp3'
        },
        {
          id: '2',
          word: '취미',
          meaning: '일상생활에서 즐기는 활동',
          pronunciation: '취미',
          example: '제 취미는 독서입니다.',
          category: '일상생활',
          difficulty: 'beginner',
          learnedDate: '2024-01-15',
          reviewCount: 2,
          lastReviewed: '2024-01-16',
          isBookmarked: false,
          isMastered: true,
          audioUrl: '/audio/취미.mp3'
        },
        {
          id: '3',
          word: '회의',
          meaning: '여러 사람이 모여서 의견을 나누는 것',
          pronunciation: '회의',
          example: '오늘 오후에 회의가 있습니다.',
          category: '비즈니스',
          difficulty: 'intermediate',
          learnedDate: '2024-01-12',
          reviewCount: 1,
          lastReviewed: '2024-01-14',
          isBookmarked: true,
          isMastered: false,
          audioUrl: '/audio/회의.mp3'
        },
        {
          id: '4',
          word: '프레젠테이션',
          meaning: '발표나 설명을 위한 자료',
          pronunciation: '프레젠테이션',
          example: '내일 프레젠테이션을 준비해야 합니다.',
          category: '비즈니스',
          difficulty: 'intermediate',
          learnedDate: '2024-01-12',
          reviewCount: 0,
          isBookmarked: false,
          isMastered: false,
          audioUrl: '/audio/프레젠테이션.mp3'
        },
        {
          id: '5',
          word: '협력',
          meaning: '함께 일을 하는 것',
          pronunciation: '협력',
          example: '팀원들과 협력해서 프로젝트를 완성했습니다.',
          category: '비즈니스',
          difficulty: 'intermediate',
          learnedDate: '2024-01-10',
          reviewCount: 2,
          lastReviewed: '2024-01-13',
          isBookmarked: false,
          isMastered: true,
          audioUrl: '/audio/협력.mp3'
        },
        {
          id: '6',
          word: '완료',
          meaning: '일이나 작업이 끝나는 것',
          pronunciation: '완료',
          example: '작업이 완료되었습니다.',
          category: '일반',
          difficulty: 'beginner',
          learnedDate: '2024-01-10',
          reviewCount: 4,
          lastReviewed: '2024-01-15',
          isBookmarked: true,
          isMastered: true,
          audioUrl: '/audio/완료.mp3'
        },
        {
          id: '7',
          word: '발음',
          meaning: '소리를 내는 방법',
          pronunciation: '발음',
          example: '한국어 발음을 연습하고 있습니다.',
          category: '학습',
          difficulty: 'beginner',
          learnedDate: '2024-01-08',
          reviewCount: 5,
          lastReviewed: '2024-01-16',
          isBookmarked: true,
          isMastered: true,
          audioUrl: '/audio/발음.mp3'
        },
        {
          id: '8',
          word: '문법',
          meaning: '언어의 규칙',
          pronunciation: '문법',
          example: '한국어 문법을 공부하고 있습니다.',
          category: '학습',
          difficulty: 'intermediate',
          learnedDate: '2024-01-08',
          reviewCount: 3,
          lastReviewed: '2024-01-14',
          isBookmarked: false,
          isMastered: false,
          audioUrl: '/audio/문법.mp3'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredVocabulary = vocabulary.filter(vocab => {
    const matchesSearch = vocab.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vocab.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vocab.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || vocab.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || vocab.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = ['all', ...Array.from(new Set(vocabulary.map(v => v.category)))];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '초급';
      case 'intermediate': return '중급';
      case 'advanced': return '고급';
      default: return difficulty;
    }
  };

  const handleBookmarkToggle = (id: string) => {
    setVocabulary(prev => prev.map(v => 
      v.id === id ? { ...v, isBookmarked: !v.isBookmarked } : v
    ));
  };

  const handleMasterToggle = (id: string) => {
    setVocabulary(prev => prev.map(v => 
      v.id === id ? { ...v, isMastered: !v.isMastered } : v
    ));
  };

  const startStudyMode = () => {
    if (filteredVocabulary.length > 0) {
      setStudyMode(true);
      setCurrentWordIndex(0);
      setShowAnswer(false);
    }
  };

  const exitStudyMode = () => {
    setStudyMode(false);
    setShowAnswer(false);
  };

  const nextWord = () => {
    if (currentWordIndex < filteredVocabulary.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setShowAnswer(false);
    } else {
      exitStudyMode();
    }
  };

  const previousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
      setShowAnswer(false);
    }
  };

  const playAudio = () => {
    setIsPlaying(true);
    // 실제 오디오 재생 로직
    setTimeout(() => setIsPlaying(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">어휘를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (studyMode && filteredVocabulary.length > 0) {
    const currentWord = filteredVocabulary[currentWordIndex];
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={exitStudyMode}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>학습 모드 종료</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">어휘 학습</h1>
              <p className="text-gray-600">{currentWordIndex + 1} / {filteredVocabulary.length}</p>
            </div>
            <div className="w-32"></div>
          </div>

          {/* 학습 카드 */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{currentWord.word}</h2>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={playAudio}
                  className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5 text-blue-600" /> : <Volume2 className="w-5 h-5 text-blue-600" />}
                </button>
                <span className="text-gray-600">{currentWord.pronunciation}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentWord.difficulty)}`}>
                  {getDifficultyText(currentWord.difficulty)}
                </span>
              </div>
            </div>

            {!showAnswer ? (
              <div className="text-center">
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  답 보기
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">의미</h3>
                  <p className="text-gray-700">{currentWord.meaning}</p>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">예문</h3>
                  <p className="text-gray-700 italic">"{currentWord.example}"</p>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => handleMasterToggle(currentWord.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentWord.isMastered 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {currentWord.isMastered ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{currentWord.isMastered ? '마스터됨' : '마스터 안됨'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 네비게이션 */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={previousWord}
                disabled={currentWordIndex === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <button
                onClick={nextWord}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentWordIndex === filteredVocabulary.length - 1 ? '완료' : '다음'}
              </button>
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
            <h1 className="text-2xl font-bold text-gray-900">어휘</h1>
            <p className="text-gray-600">학습한 어휘를 관리하고 복습하세요</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={startStudyMode}
              disabled={filteredVocabulary.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpen className="w-4 h-4" />
              <span>학습 모드</span>
            </button>
            <Link
              href="/student/home"
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>돌아가기</span>
            </Link>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="어휘 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '전체 카테고리' : category}
                </option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'all' ? '전체 난이도' : getDifficultyText(difficulty)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-900">{vocabulary.length}</div>
            <div className="text-sm text-gray-600">총 어휘</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">
              {vocabulary.filter(v => v.isMastered).length}
            </div>
            <div className="text-sm text-gray-600">마스터</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {vocabulary.filter(v => v.isBookmarked).length}
            </div>
            <div className="text-sm text-gray-600">북마크</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(vocabulary.reduce((sum, v) => sum + v.reviewCount, 0) / vocabulary.length * 10) / 10}
            </div>
            <div className="text-sm text-gray-600">평균 복습</div>
          </div>
        </div>

        {/* 어휘 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVocabulary.map((vocab) => (
            <div key={vocab.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{vocab.word}</h3>
                  <p className="text-sm text-gray-600">{vocab.pronunciation}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBookmarkToggle(vocab.id)}
                    className={`p-1 rounded ${vocab.isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                  >
                    <Bookmark className={`w-4 h-4 ${vocab.isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(vocab.difficulty)}`}>
                    {getDifficultyText(vocab.difficulty)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{vocab.meaning}</p>
              <p className="text-xs text-gray-500 italic mb-4">"{vocab.example}"</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{vocab.category}</span>
                <div className="flex items-center gap-2">
                  {vocab.isMastered && <CheckCircle className="w-3 h-3 text-green-500" />}
                  <span>복습 {vocab.reviewCount}회</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVocabulary.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">어휘가 없습니다</h3>
            <p className="text-gray-600">검색 조건에 맞는 어휘가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 