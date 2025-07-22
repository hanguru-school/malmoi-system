'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Play, 
  Download, 
  ArrowLeft,
  Globe,
  Star,
  BookOpen,
  Mic,
  Printer,
  Repeat,
  Pause,
  Volume2,
  MessageSquare,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

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
  teacherEvaluation?: {
    score: number;
    comment: string;
    isCompleted: boolean;
  };
  studentEvaluation?: {
    overallScore: number;
    questionnaireScore: number;
    feedbackScore: number;
    feedback: string;
    hideFromTeacher: boolean;
    questionnaireAnswers: {
      q1: number;
      q2: number;
      q3: number;
      q4: number;
      q5: number;
      q6: number;
      q7: number;
      q8: number;
      q9: number;
      q10: number;
    };
    isCompleted: boolean;
    teacherReply?: {
      comment: string;
      date: string;
      isReplied: boolean;
    };
  };
}

export default function StudentNotesPage() {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'recent' | 'favorite'>('all');
  const [selectedNote, setSelectedNote] = useState<LessonNote | null>(null);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(-1); // 현재 선택된 노트의 인덱스
  
  // 언어 설정
  const [currentLanguage, setCurrentLanguage] = useState<'ko' | 'ja'>('ko');

  // 음성 재생 관련 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [fontSize, setFontSize] = useState(12); // 글자 크기 상태 추가
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // 평가 관련 상태
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState({
    questionnaireScore: 5,
    feedbackScore: 5,
    feedback: '',
    hideFromTeacher: false, // 선생님에게 숨기기 체크박스
    questionnaireAnswers: {
      q1: 5, q2: 5, q3: 5, q4: 5, q5: 5,
      q6: 5, q7: 5, q8: 5, q9: 5, q10: 5
    }
  });

  // 모달 타입 상태 추가
  const [modalType, setModalType] = useState<'teacher' | 'student'>('student');

  // 이전 노트 확인하기
  const handlePreviousNote = () => {
    if (currentNoteIndex > 0) {
      const newIndex = currentNoteIndex - 1;
      setCurrentNoteIndex(newIndex);
      setSelectedNote(notes[newIndex]);
      // 음성 재생 상태 초기화
      setIsPlaying(false);
      setCurrentSentenceIndex(0);
      setAudioProgress(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  // 다음 노트 확인하기
  const handleNextNote = () => {
    if (currentNoteIndex < notes.length - 1) {
      const newIndex = currentNoteIndex + 1;
      setCurrentNoteIndex(newIndex);
      setSelectedNote(notes[newIndex]);
      // 음성 재생 상태 초기화
      setIsPlaying(false);
      setCurrentSentenceIndex(0);
      setAudioProgress(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  // 언어 전환 함수
  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'ko' ? 'ja' : 'ko');
  };

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '레슨 노트',
      search: '노트 검색...',
      all: '전체',
      recent: '최근',
      favorite: '즐겨찾기',
      noNotes: '레슨 노트가 없습니다',
      teacher: '선생님',
      duration: '소요시간',
      content: '수업 내용',
      vocabulary: '새로운 어휘',
      grammar: '학습한 문법',
      homework: '숙제',
      attachments: '첨부파일',
      audio: '음성 파일',
      files: '파일',
      back: '돌아가기',
      play: '재생',
      pause: '일시정지',
      download: '다운로드',
      print: '프린트',
      viewNote: '노트 보기',
      teacherEvaluation: '선생님 평가',
      studentEvaluation: '수업 평가',
      evaluateLesson: '수업 평가하기',
      overallScore: '종합 점수',
      questionnaireScore: '앙케이트 점수',
      feedbackScore: '감상 점수',
      feedback: '감상 및 의견',
      submitEvaluation: '평가 제출',
      loop: '무한 반복',
      repeat: '반복',
      noEvaluation: '아직 평가가 완료되지 않았습니다',
      evaluationCompleted: '평가가 완료되었습니다',
      uploadToGoogle: '구글맵에 업로드',
      publicConsent: '인터넷 상에 공개하는 것에 동의합니다',
      consentText: '평가 점수가 85점 이상일 경우 교실 홈페이지와 구글맵에 업로드할 수 있습니다. 업로드 시 해당 평가가 인터넷 상에 공개됩니다.',
      questionnaireTitle: '수업 평가 앙케이트',
      questionnaireQuestions: {
        q1: '수업 내용이 이해하기 쉬웠나요?',
        q2: '선생님의 설명이 명확했나요?',
        q3: '수업 속도가 적절했나요?',
        q4: '학습 자료가 유용했나요?',
        q5: '수업 분위기가 좋았나요?',
        q6: '질문에 대한 답변이 만족스러웠나요?',
        q7: '수업 시간이 적절했나요?',
        q8: '개별 피드백이 도움이 되었나요?',
        q9: '다음 수업에 대한 기대가 생겼나요?',
        q10: '전반적으로 만족스러운 수업이었나요?'
      },
      hideFromTeacher: '선생님에게 평가 내용 숨기기',
      hideFromTeacherDesc: '체크하면 해당 평가가 선생님에게는 "미입력"으로 표시됩니다.',
      teacherReply: '선생님 답장',
      teacherReplyDate: '답장 날짜',
      noTeacherReply: '아직 답장이 없습니다.',
      fontSize: '글자 크기',
      increaseFont: '글자 크게',
      decreaseFont: '글자 작게',
      notificationTitle: '수업 평가 답장',
      notificationMessage: '선생님이 수업 평가에 답장을 남겼습니다.'
    },
    ja: {
      title: 'レッスンノート',
      search: 'ノートを検索...',
      all: 'すべて',
      recent: '最近',
      favorite: 'お気に入り',
      noNotes: 'レッスンノートがありません',
      teacher: '先生',
      duration: '所要時間',
      content: '授業内容',
      vocabulary: '新しい語彙',
      grammar: '学習した文法',
      homework: '宿題',
      attachments: '添付ファイル',
      audio: '音声ファイル',
      files: 'ファイル',
      back: '戻る',
      play: '再生',
      pause: '一時停止',
      download: 'ダウンロード',
      print: '印刷',
      viewNote: 'ノートを見る',
      teacherEvaluation: '先生の評価',
      studentEvaluation: '授業評価',
      evaluateLesson: '授業を評価する',
      overallScore: '総合点',
      questionnaireScore: 'アンケート点',
      feedbackScore: '感想点',
      feedback: '感想・意見',
      submitEvaluation: '評価を提出',
      loop: '無限ループ',
      repeat: 'リピート',
      noEvaluation: 'まだ評価が完了していません',
      evaluationCompleted: '評価が完了しました',
      uploadToGoogle: 'Googleマップにアップロード',
      publicConsent: 'インターネット上での公開に同意します',
      consentText: '評価点が85点以上の場合、教室のホームページとGoogleマップにアップロードできます。アップロード時、該当評価がインターネット上に公開されます。',
      questionnaireTitle: '授業評価アンケート',
      questionnaireQuestions: {
        q1: '授業内容は理解しやすかったですか？',
        q2: '先生の説明は明確でしたか？',
        q3: '授業の進度は適切でしたか？',
        q4: '学習資料は役立ちましたか？',
        q5: '授業の雰囲気は良かったですか？',
        q6: '質問への回答は満足できましたか？',
        q7: '授業時間は適切でしたか？',
        q8: '個別フィードバックは役立ちましたか？',
        q9: '次の授業への期待が生まれましたか？',
        q10: '全体的に満足できる授業でしたか？'
      },
      hideFromTeacher: '先生に評価内容を隠す',
      hideFromTeacherDesc: 'チェックすると、該当評価が先生には「未入力」と表示されます。',
      teacherReply: '先生の返信',
      teacherReplyDate: '返信日',
      noTeacherReply: 'まだ返信がありません。',
      fontSize: '文字サイズ',
      increaseFont: '文字を大きく',
      decreaseFont: '文字を小さく',
      notificationTitle: '授業評価返信',
      notificationMessage: '先生が授業評価に返信を残しました。'
    }
  };

  const t = texts[currentLanguage];

  useEffect(() => {
    // 실제 API 호출로 대체
    setTimeout(() => {
      const mockNotes: LessonNote[] = [
        {
          id: '1',
          title: '영어 회화 - 일상 대화',
          date: '2024-01-15',
          teacher: '김선생님',
          duration: '60분',
          content: '일상적인 상황에서의 영어 대화 연습을 진행했습니다. 주로 음식점에서의 주문, 길 찾기, 취미에 대한 대화를 연습했습니다.',
          vocabulary: ['appetizer', 'main course', 'dessert', 'delicious', 'recommend'],
          grammar: ['Would you like to...', 'I would prefer...', 'Could you tell me...'],
          homework: ['다음 수업까지 새로운 어휘 10개 암기', '일상 대화 연습 30분'],
          attachments: {
            audio: '/audio/lesson1.mp3',
            files: ['/files/lesson1_vocabulary.pdf', '/files/lesson1_grammar.pdf']
          },
          score: 85,
          isFavorite: true,
          teacherEvaluation: {
            score: 90,
            comment: '영어 회화 실력이 크게 향상되었습니다. 대화 흐름도 자연스러워졌습니다.',
            isCompleted: true
          },
          studentEvaluation: {
            overallScore: 88,
            questionnaireScore: 92,
            feedbackScore: 85,
            feedback: '영어 회화 연습이 매우 유익했습니다. 다음에도 더 열심히 해야겠습니다.',
            hideFromTeacher: false,
            questionnaireAnswers: {
              q1: 5, q2: 5, q3: 4, q4: 5, q5: 5, q6: 4, q7: 5, q8: 4, q9: 5, q10: 5
            },
            isCompleted: true,
            teacherReply: {
              comment: '열심히 참여해주셔서 감사합니다. 다음 수업에서도 좋은 모습 기대하겠습니다!',
              date: '2024-01-16',
              isReplied: true
            }
          }
        },
        {
          id: '2',
          title: '문법 - 현재완료 시제',
          date: '2024-01-12',
          teacher: '이선생님',
          duration: '45분',
          content: '현재완료 시제의 기본 개념과 사용법을 학습했습니다. 경험, 완료, 계속의 의미를 구분하여 연습했습니다.',
          vocabulary: ['experience', 'already', 'yet', 'never', 'since'],
          grammar: ['have/has + past participle', 'for + period of time', 'since + point of time'],
          homework: ['문법 문제 20개 풀기', '현재완료 시제로 문장 10개 만들기'],
          attachments: {
            files: ['/files/lesson2_grammar.pdf']
          },
          score: 92,
          teacherEvaluation: {
            score: 95,
            comment: '문법 이해도가 매우 높아졌습니다. 문장 구조도 자유롭게 활용할 수 있습니다.',
            isCompleted: true
          },
          studentEvaluation: {
            overallScore: 90,
            questionnaireScore: 93,
            feedbackScore: 88,
            feedback: '문법 학습이 매우 유익했습니다. 다음 수업에서도 더 열심히 해야겠습니다.',
            hideFromTeacher: false,
            questionnaireAnswers: {
              q1: 5, q2: 5, q3: 5, q4: 5, q5: 4, q6: 5, q7: 5, q8: 5, q9: 5, q10: 5
            },
            isCompleted: true
          }
        },
        {
          id: '3',
          title: '리스닝 - 뉴스 청취',
          date: '2024-01-10',
          teacher: '박선생님',
          duration: '90분',
          content: 'CNN 뉴스를 활용한 리스닝 연습을 진행했습니다. 경제 뉴스를 중심으로 핵심 내용 파악과 세부 정보 듣기를 연습했습니다.',
          vocabulary: ['economy', 'market', 'investment', 'growth', 'decline'],
          grammar: ['passive voice', 'complex sentences'],
          homework: ['뉴스 청취 15분 매일', '핵심 단어 정리'],
          attachments: {
            audio: '/audio/lesson3.mp3',
            files: ['/files/lesson3_transcript.pdf']
          },
          score: 78,
          teacherEvaluation: {
            score: 80,
            comment: '리스닝 실력이 크게 향상되었습니다. 핵심 내용 파악 및 세부 정보 듣기가 자연스러워졌습니다.',
            isCompleted: true
          },
          studentEvaluation: {
            overallScore: 75,
            questionnaireScore: 78,
            feedbackScore: 72,
            feedback: '리스닝 연습이 매우 유익했습니다. 다음 수업에서도 더 열심히 해야겠습니다.',
            hideFromTeacher: false,
            questionnaireAnswers: {
              q1: 4, q2: 4, q3: 3, q4: 4, q5: 4, q6: 3, q7: 4, q8: 3, q9: 4, q10: 4
            },
            isCompleted: true
          }
        }
      ];

      setNotes(mockNotes);
      setLoading(false);
    }, 1000);
  }, []);

  // 필터링 및 검색
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'recent') return matchesSearch && new Date(note.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (filter === 'favorite') return matchesSearch && note.isFavorite;
    return matchesSearch;
  });

  const handleNoteClick = (note: LessonNote) => {
    setSelectedNote(note);
    setCurrentNoteIndex(notes.findIndex(n => n.id === note.id));
  };

  const handleBackToList = () => {
    setSelectedNote(null);
    setCurrentNoteIndex(-1);
  };

  // 음성 재생 관련 함수들
  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
      
      // 현재 재생 시간에 따라 문장 인덱스 업데이트
      const sentences = selectedNote?.content.split('.') || [];
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      const sentenceIndex = Math.floor((currentTime / duration) * sentences.length);
      setCurrentSentenceIndex(sentenceIndex);
      
      // 해당 문장으로 스크롤
      if (contentRef.current) {
        const sentenceElements = contentRef.current.querySelectorAll('p');
        if (sentenceElements[sentenceIndex]) {
          sentenceElements[sentenceIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentSentenceIndex(0);
    setAudioProgress(0);
  };

  const handleSentenceClick = (index: number) => {
    if (audioRef.current && selectedNote) {
      const sentences = selectedNote.content.split('.');
      const duration = audioRef.current.duration;
      const timePerSentence = duration / sentences.length;
      audioRef.current.currentTime = index * timePerSentence;
      setCurrentSentenceIndex(index);
    }
  };

  // 평가 제출 함수
  const handleSubmitEvaluation = () => {
    // 앙케이트 점수 계산 (10개 질문의 평균)
    const questionnaireAnswers = Object.values(evaluationForm.questionnaireAnswers);
    const questionnaireScore = Math.round(questionnaireAnswers.reduce((sum, score) => sum + score, 0) / questionnaireAnswers.length);
    
    // 종합 점수 계산 (앙케이트 점수 + 감상 점수) / 2
    const overallScore = Math.round((questionnaireScore + evaluationForm.feedbackScore) / 2);
    
    // 실제로는 API 호출로 평가를 저장하고 선생님에게 알림
    console.log('평가 제출:', {
      ...evaluationForm,
      questionnaireScore,
      overallScore
    });
    
    // 선생님에게 알림 전송 (실제로는 API 호출)
    if (!evaluationForm.hideFromTeacher) {
      console.log('선생님에게 평가 알림 전송');
      // 여기에 실제 알림 API 호출 코드가 들어갑니다
    }
    
    setShowEvaluationModal(false);
    alert('평가가 제출되었습니다.');
  };

  // 프린트 함수
  const handlePrint = () => {
    // 프린트용 컨텐츠 생성
    const printWindow = window.open('', '_blank');
    if (printWindow && selectedNote) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${selectedNote.title} - 레슨 노트</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .vocabulary { display: flex; flex-wrap: wrap; gap: 10px; }
            .vocabulary span { background: #e3f2fd; padding: 5px 10px; border-radius: 15px; font-size: 14px; }
            .grammar { background: #f5f5f5; padding: 10px; border-radius: 5px; }
            .homework { background: #fff3e0; padding: 15px; border-radius: 5px; }
            .score { font-weight: bold; color: #4caf50; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${selectedNote.title}</h1>
            <p>레슨 노트</p>
          </div>
          
          <div class="info">
            <div>
              <strong>선생님:</strong> ${selectedNote.teacher}<br>
              <strong>날짜:</strong> ${new Date(selectedNote.date).toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : 'ja-JP')}<br>
              <strong>수업 시간:</strong> ${selectedNote.duration}
            </div>
            <div class="score">
              ${selectedNote.score ? `점수: ${selectedNote.score}점` : ''}
            </div>
          </div>
          
          <div class="section">
            <h3>수업 내용</h3>
            <p>${selectedNote.content}</p>
          </div>
          
          <div class="section">
            <h3>새로운 어휘</h3>
            <div class="vocabulary">
              ${selectedNote.vocabulary.map(word => `<span>${word}</span>`).join('')}
            </div>
          </div>
          
          <div class="section">
            <h3>학습한 문법</h3>
            ${selectedNote.grammar.map(grammar => `<div class="grammar">${grammar}</div>`).join('')}
          </div>
          
          <div class="section">
            <h3>숙제</h3>
            <div class="homework">${selectedNote.homework.join(', ')}</div>
          </div>
          
          ${selectedNote.teacherEvaluation?.isCompleted ? `
          <div class="section">
            <h3>선생님 평가</h3>
            <p><strong>점수:</strong> ${selectedNote.teacherEvaluation.score}점</p>
            <p><strong>코멘트:</strong> ${selectedNote.teacherEvaluation.comment}</p>
          </div>
          ` : ''}
          
          ${selectedNote.studentEvaluation?.isCompleted ? `
          <div class="section">
            <h3>학생 평가</h3>
            <p><strong>종합 점수:</strong> ${selectedNote.studentEvaluation.overallScore}점</p>
            <p><strong>앙케이트 점수:</strong> ${selectedNote.studentEvaluation.questionnaireScore}점</p>
            <p><strong>감상 점수:</strong> ${selectedNote.studentEvaluation.feedbackScore}점</p>
            <p><strong>감상:</strong> ${selectedNote.studentEvaluation.feedback}</p>
          </div>
          ` : ''}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">레슨 노트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (selectedNote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.back}</span>
              </button>
              
              {/* 이전/다음 노트 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousNote}
                  disabled={currentNoteIndex <= 0}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    currentNoteIndex <= 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">이전</span>
                </button>
                
                <span className="text-sm text-gray-600 px-2">
                  {currentNoteIndex + 1} / {notes.length}
                </span>
                
                <button
                  onClick={handleNextNote}
                  disabled={currentNoteIndex >= notes.length - 1}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    currentNoteIndex >= notes.length - 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <span className="text-sm">다음</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 언어 전환 버튼 */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title={currentLanguage === 'ko' ? '日本語に切り替え' : '한국어로 전환'}
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {currentLanguage === 'ko' ? '🇯🇵' : '🇰🇷'}
                </span>
              </button>
            </div>
          </div>

          {/* 노트 제목 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{selectedNote.title}</h1>
            <p className="text-gray-600">{selectedNote.duration}</p>
          </div>

          {/* 노트 내용 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{selectedNote.teacher}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedNote.date).toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : 'ja-JP')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedNote.duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedNote.score && (
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{selectedNote.score}점</span>
                  </div>
                )}
                {selectedNote.teacherEvaluation?.isCompleted && (
                  <button
                    onClick={() => setShowEvaluationModal(true)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    title={t.teacherEvaluation}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">{t.teacherEvaluation}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 음성 파일 (숨겨진) */}
            {selectedNote.attachments.audio && (
              <audio
                ref={audioRef}
                src={selectedNote.attachments.audio}
                onTimeUpdate={handleAudioTimeUpdate}
                onEnded={handleAudioEnded}
                className="hidden"
              />
            )}

            <div className="prose max-w-none">
              {/* 수업 내용 섹션 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{t.content}</h3>
                  <div className="flex items-center gap-2">
                    {/* 글자 크기 조정 */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                        title={t.decreaseFont}
                      >
                        A-
                      </button>
                      <span className="text-xs text-gray-500 min-w-[2rem] text-center">{fontSize}pt</span>
                      <button
                        onClick={() => setFontSize(prev => Math.min(20, prev + 1))}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                        title={t.increaseFont}
                      >
                        A+
                      </button>
                    </div>
                    
                    {selectedNote.attachments.audio && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handlePlayAudio}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{isPlaying ? t.pause : t.play}</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.loop = !isLooping;
                              setIsLooping(!isLooping);
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors text-sm ${
                            isLooping 
                              ? 'bg-purple-600 text-white hover:bg-purple-700' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <Repeat className="w-3 h-3" />
                          <span>{isLooping ? t.loop : t.repeat}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 수업 내용 스크롤 영역 */}
                <div 
                  ref={contentRef} 
                  className="border border-gray-200 rounded-lg p-4 overflow-y-auto bg-gray-50"
                  style={{ 
                    maxHeight: '12rem', // 12포인트 글자 10줄이 보이는 높이
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.5'
                  }}
                >
                  {selectedNote.content.split('.').map((sentence, index) => (
                    <p 
                      key={index} 
                      className={`mb-2 last:mb-0 cursor-pointer transition-colors ${
                        currentSentenceIndex === index 
                          ? 'bg-blue-100 text-blue-900 font-medium' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleSentenceClick(index)}
                    >
                      {sentence.trim()}
                    </p>
                  ))}
                </div>
                
                {/* 음성 진행률 표시 */}
                {selectedNote.attachments.audio && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 새로운 어휘와 학습한 문법 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t.vocabulary}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.vocabulary.map((word, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t.grammar}</h4>
                  <div className="space-y-1">
                    {selectedNote.grammar.map((grammar, index) => (
                      <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {grammar}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 숙제 */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">{t.homework}</h4>
                <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg">{selectedNote.homework.join(', ')}</p>
              </div>

              {/* 평가 및 액션 버튼 */}
              <div className="pt-6 border-t border-gray-200">
                {/* 첫 번째 행: 평가 버튼들 */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* 선생님 평가 버튼 */}
                  {selectedNote.teacherEvaluation?.isCompleted && (
                    <button
                      onClick={() => {
                        setModalType('teacher');
                        setShowEvaluationModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Star className="w-4 h-4" />
                      <span>선생님 평가 보기</span>
                    </button>
                  )}
                  
                  {/* 내 수업 평가 버튼 */}
                  {selectedNote.teacherEvaluation?.isCompleted && (
                    <button
                      onClick={() => {
                        setModalType('student');
                        setShowEvaluationModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>
                        {selectedNote.studentEvaluation?.isCompleted ? '내 수업 평가' : '수업 평가하기'}
                      </span>
                    </button>
                  )}
                  
                  {/* 평가 수정하기 버튼 (85점 미만일 때만) */}
                  {selectedNote.studentEvaluation?.isCompleted && selectedNote.studentEvaluation.overallScore < 85 && (
                    <button
                      onClick={() => {
                        setModalType('student');
                        setShowEvaluationModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>평가 수정하기</span>
                    </button>
                  )}
                </div>

                {/* 두 번째 행: 액션 버튼들 */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* 구글맵 업로드 버튼 */}
                  {selectedNote.studentEvaluation?.isCompleted && selectedNote.studentEvaluation.overallScore >= 85 && (
                    <button
                      onClick={() => {
                        const consent = confirm(t.consentText + '\n\n' + t.publicConsent);
                        if (consent) {
                          alert('구글맵에 업로드되었습니다.');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>구글맵 업로드</span>
                    </button>
                  )}
                  
                  {/* 프린트 버튼 */}
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>프린트</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 평가 모달 */}
          {showEvaluationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {modalType === 'teacher' 
                      ? '선생님 평가'
                      : selectedNote.studentEvaluation?.isCompleted 
                        ? (selectedNote.studentEvaluation.overallScore >= 85 ? '내 수업 평가' : '평가 수정하기')
                        : '수업 평가하기'
                    }
                  </h2>
                  <button 
                    onClick={() => setShowEvaluationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* 선생님 평가 모달 */}
                {modalType === 'teacher' && selectedNote.teacherEvaluation?.isCompleted && (
                  <div className="space-y-6">
                    <div className="p-6 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="w-6 h-6 text-yellow-500 fill-current" />
                        <h3 className="text-xl font-semibold text-blue-900">선생님 평가</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-blue-900">{selectedNote.teacherEvaluation.score}점</span>
                          <span className="text-blue-700">/ 100점</span>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">평가 코멘트</h4>
                          <p className="text-blue-800 leading-relaxed">{selectedNote.teacherEvaluation.comment}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 학생 평가 모달 */}
                {modalType === 'student' && (
                  <>
                    {/* 선생님 평가 표시 (학생 평가 모달에서도 상단에 표시) */}
                    {selectedNote.teacherEvaluation?.isCompleted && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">선생님 평가</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          <span className="text-lg font-bold text-blue-900">{selectedNote.teacherEvaluation.score}점</span>
                        </div>
                        <p className="text-blue-800">{selectedNote.teacherEvaluation.comment}</p>
                      </div>
                    )}

                    {/* 학생 평가 폼 또는 완료된 평가 표시 */}
                    {selectedNote.studentEvaluation?.isCompleted ? (
                      <div className="space-y-6">
                        {/* 85점 이상일 때 수정 불가능 안내 */}
                        {selectedNote.studentEvaluation.overallScore >= 85 && (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                              <h3 className="font-semibold text-yellow-800">평가 수정 불가</h3>
                            </div>
                            <p className="text-yellow-700 text-sm">
                              평가 점수가 85점 이상이므로 인터넷 상에 공개될 수 있습니다. 
                              이로 인해 평가 내용을 수정할 수 없습니다.
                            </p>
                          </div>
                        )}

                        {/* 완료된 평가 요약 */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{selectedNote.studentEvaluation.overallScore}</div>
                            <div className="text-sm text-gray-600">{t.overallScore}</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{selectedNote.studentEvaluation.questionnaireScore}</div>
                            <div className="text-sm text-gray-600">{t.questionnaireScore}</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{selectedNote.studentEvaluation.feedbackScore}</div>
                            <div className="text-sm text-gray-600">{t.feedbackScore}</div>
                          </div>
                        </div>

                        {/* 앙케이트 상세 결과 */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">{t.questionnaireTitle}</h3>
                          <div className="space-y-3">
                            {Object.entries(selectedNote.studentEvaluation.questionnaireAnswers).map(([key, score]) => (
                              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700">
                                  {t.questionnaireQuestions[key as keyof typeof t.questionnaireQuestions]}
                                </span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`w-4 h-4 ${star <= score ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                  <span className="ml-2 text-sm font-medium text-gray-900">{score}점</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 감상 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.feedback}</label>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedNote.studentEvaluation.feedback}</p>
                        </div>

                        {/* 선생님 답장 */}
                        {selectedNote.studentEvaluation.teacherReply?.isReplied && (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h3 className="font-semibold text-green-900 mb-2">{t.teacherReply}</h3>
                            <p className="text-green-800 mb-2">{selectedNote.studentEvaluation.teacherReply.comment}</p>
                            <div className="text-sm text-green-600">
                              {t.teacherReplyDate}: {new Date(selectedNote.studentEvaluation.teacherReply.date).toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : 'ja-JP')}
                            </div>
                          </div>
                        )}

                        <div className="text-center text-green-600 font-medium">
                          ✓ {t.evaluationCompleted}
                        </div>
                        
                        {/* 85점 미만일 때 평가 수정하기 버튼 */}
                        {selectedNote.studentEvaluation && selectedNote.studentEvaluation.overallScore < 85 && (
                          <div className="text-center mt-4">
                            <button
                              onClick={() => {
                                if (!selectedNote.studentEvaluation) return;
                                
                                // 평가 폼을 현재 평가 데이터로 초기화
                                setEvaluationForm({
                                  questionnaireScore: selectedNote.studentEvaluation.questionnaireScore,
                                  feedbackScore: selectedNote.studentEvaluation.feedbackScore,
                                  feedback: selectedNote.studentEvaluation.feedback,
                                  hideFromTeacher: selectedNote.studentEvaluation.hideFromTeacher,
                                  questionnaireAnswers: { ...selectedNote.studentEvaluation.questionnaireAnswers }
                                });
                                // 평가 완료 상태를 false로 변경하여 수정 모드로 전환
                                const updatedNote: LessonNote = {
                                  ...selectedNote,
                                  studentEvaluation: {
                                    ...selectedNote.studentEvaluation,
                                    isCompleted: false
                                  }
                                };
                                setSelectedNote(updatedNote);
                                // 노트 목록도 업데이트
                                setNotes(prevNotes => 
                                  prevNotes.map(note => 
                                    note.id === selectedNote.id ? updatedNote : note
                                  )
                                );
                              }}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              평가 수정하기
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* 앙케이트 질문들 */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4">{t.questionnaireTitle}</h3>
                          <div className="space-y-4">
                            {Object.entries(t.questionnaireQuestions).map(([key, question]) => (
                              <div key={key} className="p-4 border border-gray-200 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">{question}</label>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setEvaluationForm(prev => ({
                                        ...prev,
                                        questionnaireAnswers: {
                                          ...prev.questionnaireAnswers,
                                          [key]: star
                                        }
                                      }))}
                                      className={`text-2xl ${star <= evaluationForm.questionnaireAnswers[key as keyof typeof evaluationForm.questionnaireAnswers] ? 'text-yellow-500' : 'text-gray-300'}`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">
                                    {evaluationForm.questionnaireAnswers[key as keyof typeof evaluationForm.questionnaireAnswers]}점
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 감상 입력 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.feedback}</label>
                          <textarea
                            value={evaluationForm.feedback}
                            onChange={(e) => setEvaluationForm(prev => ({ ...prev, feedback: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                            placeholder="수업에 대한 감상과 의견을 자유롭게 작성해주세요..."
                          />
                        </div>

                        {/* 감상 별점 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.feedbackScore}</label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setEvaluationForm(prev => ({ ...prev, feedbackScore: star }))}
                                className={`text-2xl ${star <= evaluationForm.feedbackScore ? 'text-yellow-500' : 'text-gray-300'}`}
                              >
                                ★
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">{evaluationForm.feedbackScore}점</span>
                          </div>
                        </div>

                        {/* 선생님에게 숨기기 옵션 */}
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="hideFromTeacher"
                              checked={evaluationForm.hideFromTeacher}
                              onChange={(e) => setEvaluationForm(prev => ({ ...prev, hideFromTeacher: e.target.checked }))}
                              className="mt-1"
                            />
                            <div>
                              <label htmlFor="hideFromTeacher" className="block text-sm font-medium text-gray-700">
                                {t.hideFromTeacher}
                              </label>
                              <p className="text-sm text-gray-600 mt-1">{t.hideFromTeacherDesc}</p>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          {t.consentText}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                      <button 
                        onClick={() => setShowEvaluationModal(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        {t.back}
                      </button>
                      {!selectedNote.studentEvaluation?.isCompleted && (
                        <button 
                          onClick={handleSubmitEvaluation}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {t.submitEvaluation}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 프린트 스타일 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-600">수업 내용과 학습 기록을 확인하세요</p>
          </div>
          <div className="flex items-center gap-4">
            {/* 언어 전환 버튼 */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={currentLanguage === 'ko' ? '日本語に切り替え' : '한국어로 전환'}
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium">
                {currentLanguage === 'ko' ? '🇯🇵' : '🇰🇷'}
              </span>
            </button>
            
            <Link
              href="/student/home"
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.back}</span>
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
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'recent' | 'favorite')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t.all}</option>
              <option value="recent">{t.recent}</option>
              <option value="favorite">{t.favorite}</option>
            </select>
          </div>
        </div>

        {/* 노트 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note, index) => (
            <div
              key={note.id}
              onClick={() => handleNoteClick(note)}
              className={`bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow ${
                selectedNote?.id === note.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{note.title}</h3>
                </div>
                {note.score && (
                  <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <Star className="w-4 h-4 fill-current" />
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
    </div>
  );
} 