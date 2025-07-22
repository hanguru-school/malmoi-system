'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  Calendar, 
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

interface LessonNote {
  id: string;
  title: string;
  content: string;
  date: string;
  teacherName: string;
  audioFiles: AudioFile[];
  createdAt: string;
}

interface AudioFile {
  id: string;
  url: string;
  title: string;
  duration: number;
  position: number;
}

export default function StudentLessonNotesPage() {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<LessonNote | null>(null);
  const [currentAudio, setCurrentAudio] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  // 기기 타입 감지
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // 더미 데이터 로드
  useEffect(() => {
    const mockNotes: LessonNote[] = [
      {
        id: '1',
        title: '기본 인사말과 자기소개',
        content: '안녕하세요, 만나서 반갑습니다. 저는 [이름]입니다. 한국어를 배우고 있어요. 오늘은 기본적인 인사말과 자기소개를 연습했습니다.',
        date: '2024-01-15',
        teacherName: '김선생님',
        audioFiles: [
          {
            id: 'audio1',
            url: '/audio/lesson1-intro.mp3',
            title: '인사말 연습',
            duration: 120,
            position: 1
          },
          {
            id: 'audio2',
            url: '/audio/lesson1-selfintro.mp3',
            title: '자기소개 연습',
            duration: 180,
            position: 2
          }
        ],
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        title: '숫자와 시간 표현',
        content: '1부터 10까지의 숫자와 시간 표현을 배웠습니다. 몇 시입니까? 지금 3시입니다. 내일 9시에 만나요.',
        date: '2024-01-14',
        teacherName: '이선생님',
        audioFiles: [
          {
            id: 'audio3',
            url: '/audio/lesson2-numbers.mp3',
            title: '숫자 발음 연습',
            duration: 90,
            position: 1
          }
        ],
        createdAt: '2024-01-14T14:30:00Z'
      }
    ];

    setNotes(mockNotes);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayAudio = (audio: AudioFile) => {
    setCurrentAudio(audio);
    setIsPlaying(true);
    setShowAudioPlayer(true);
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    // 실제 오디오 플레이어 속도 변경 로직
  };

  const renderMobileLayout = () => (
    <div className="space-y-4">
      {/* 간단한 리스트 */}
      {notes.map((note) => (
        <div key={note.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{note.title}</h3>
            <span className="text-sm text-gray-500">{note.date}</span>
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{note.content}</p>
          
          {/* 음성 파일 목록 */}
          {note.audioFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">음성 파일</h4>
              {note.audioFiles.map((audio) => (
                <div key={audio.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlayAudio(audio)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <span className="text-sm">{audio.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDuration(audio.duration)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderTabletLayout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 노트 목록 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">레슨 노트</h2>
        {notes.map((note) => (
          <div 
            key={note.id} 
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-colors ${
              selectedNote?.id === note.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedNote(note)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{note.title}</h3>
              <span className="text-sm text-gray-500">{note.date}</span>
            </div>
            <p className="text-gray-600 text-sm mb-2">{note.teacherName}</p>
            <p className="text-gray-600 text-sm line-clamp-2">{note.content}</p>
            {note.audioFiles.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-blue-600 text-sm">
                <Volume2 className="w-4 h-4" />
                <span>{note.audioFiles.length}개 음성파일</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 선택된 노트 상세 + 음성 플레이어 */}
      {selectedNote && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedNote.title}</h3>
          <div className="text-sm text-gray-600 mb-4">
            <p className="mb-2">{selectedNote.content}</p>
            <div className="flex items-center gap-4 text-gray-500">
              <span>{selectedNote.teacherName}</span>
              <span>{selectedNote.date}</span>
            </div>
          </div>

          {/* 음성 플레이어 */}
          {selectedNote.audioFiles.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">음성 파일</h4>
              {selectedNote.audioFiles.map((audio) => (
                <div key={audio.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">{audio.title}</h5>
                    <span className="text-sm text-gray-500">{formatDuration(audio.duration)}</span>
                  </div>
                  
                  {/* 플레이어 컨트롤 */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handlePlayAudio(audio)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4" />
                      재생
                    </button>
                    
                    {/* 재생 속도 조절 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">속도:</span>
                      <select
                        value={playbackSpeed}
                        onChange={(e) => handlePlaybackSpeedChange(Number(e.target.value))}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="grid grid-cols-3 gap-6">
      {/* 노트 목록 */}
      <div className="col-span-1 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">레슨 노트 목록</h2>
        <div className="space-y-3">
          {notes.map((note) => (
            <div 
              key={note.id} 
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedNote?.id === note.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedNote(note)}
            >
              <h3 className="font-medium text-gray-900 mb-1">{note.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{note.teacherName}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{note.date}</span>
                {note.audioFiles.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    {note.audioFiles.length}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 노트 상세 내용 */}
      <div className="col-span-1 bg-white rounded-lg shadow p-6">
        {selectedNote ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedNote.title}</h2>
            <div className="text-sm text-gray-600 mb-4">
              <p className="mb-4 leading-relaxed">{selectedNote.content}</p>
              <div className="flex items-center gap-4 text-gray-500 border-t pt-4">
                <span>선생님: {selectedNote.teacherName}</span>
                <span>날짜: {selectedNote.date}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            노트를 선택해주세요
          </div>
        )}
      </div>

      {/* 음성 플레이어 */}
      <div className="col-span-1 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">음성 플레이어</h2>
        {selectedNote && selectedNote.audioFiles.length > 0 ? (
          <div className="space-y-4">
            {selectedNote.audioFiles.map((audio) => (
              <div key={audio.id} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">{audio.title}</h3>
                
                {/* 플레이어 컨트롤 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handlePlayAudio(audio)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4" />
                      재생
                    </button>
                    <span className="text-sm text-gray-500">{formatDuration(audio.duration)}</span>
                  </div>
                  
                  {/* 재생 속도 조절 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">재생 속도:</span>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => handlePlaybackSpeedChange(Number(e.target.value))}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1x</option>
                    </select>
                  </div>
                  
                  {/* 다운로드 버튼 */}
                  <button className="flex items-center gap-2 px-3 py-2 text-gray-600 border rounded hover:bg-gray-50">
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            음성 파일이 없습니다
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">레슨 노트</h1>
            <p className="text-gray-600">수업 내용과 음성 파일을 복습하세요</p>
          </div>
          
          {/* 기기 타입 표시 */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {deviceType === 'mobile' && <Smartphone className="w-4 h-4" />}
            {deviceType === 'tablet' && <Tablet className="w-4 h-4" />}
            {deviceType === 'desktop' && <Monitor className="w-4 h-4" />}
            <span className="capitalize">{deviceType} 모드</span>
          </div>
        </div>

        {/* 기기별 레이아웃 렌더링 */}
        {deviceType === 'mobile' && renderMobileLayout()}
        {deviceType === 'tablet' && renderTabletLayout()}
        {deviceType === 'desktop' && renderDesktopLayout()}

        {/* 전체 화면 음성 플레이어 (모바일용) */}
        {showAudioPlayer && currentAudio && deviceType === 'mobile' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 bg-blue-600 text-white rounded-full"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div>
                  <p className="font-medium text-sm">{currentAudio.title}</p>
                  <p className="text-xs text-gray-500">{formatDuration(currentAudio.duration)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAudioPlayer(false)}
                className="text-gray-500"
              >
                                 <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 