'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Play, 
  GraduationCap,
  Clock,
  MapPin,
  MessageSquare,
  Award,
  Target,
  Heart,
  Zap,
  Globe,
  Smartphone,
  Video,
  FileText,
  Headphones,
  Mic,
  Camera,
  Languages
} from 'lucide-react';

// 다국어 텍스트 정의
const translations = {
  ja: {
    siteName: "韓国語教室MalMoi",
    startButton: "始める",
    heroTitle: "韓国語レッスンをより",
    heroTitleHighlight: "スマートに",
    heroSubtitle: "教室でレッスンを受ける生徒のためのデジタル学習プラットフォーム",
    heroDescription: "予約から復習まで、すべてを一箇所で管理しましょう",
    stats: {
      students: "活発な生徒",
      classes: "完了したレッスン",
      satisfaction: "平均満足度",
      attendance: "レッスン出席率"
    },
    features: {
      title: "生徒のための特別な機能",
      subtitle: "教室レッスンをより効果的にするデジタルツール",
      reservation: {
        title: "簡単なレッスン予約",
        description: "希望の時間に希望の先生とレッスンを予約しましょう。リアルタイムで利用可能な時間を確認できます。",
        feature: "リアルタイム予約可能"
      },
      materials: {
        title: "レッスン資料管理",
        description: "レッスン資料をいつでも確認してダウンロードできます。復習に必要なすべての資料が準備されています。",
        feature: "24時間アクセス可能"
      },
      online: {
        title: "オンラインレッスン",
        description: "家でも教室でもレッスンを受けることができます。Zoomリンクでいつでもアクセスしてください。",
        feature: "Zoom連携"
      },
      progress: {
        title: "学習進捗追跡",
        description: "自分の学習進捗を一目で確認できます。どの部分をもっと勉強すべきか教えてくれます。",
        feature: "個人別カスタム分析"
      },
      communication: {
        title: "先生とのコミュニケーション",
        description: "レッスン後に疑問点をいつでも聞いてください。先生が親切に回答してくれます。",
        feature: "リアルタイムメッセージ"
      },
      review: {
        title: "レッスンレビュー",
        description: "レッスン後の感想を共有し、フィードバックを受け取りましょう。より良いレッスンのための貴重な意見です。",
        feature: "相互フィードバック"
      }
    },
    howItWorks: {
      title: "このように使用してください",
      subtitle: "簡単な3ステップで始めるスマートな韓国語学習",
      step1: {
        title: "会員登録",
        description: "簡単な情報入力で会員登録を完了してください。先生がお勧めするアカウントで今すぐ始められます。"
      },
      step2: {
        title: "レッスン予約",
        description: "希望の時間と先生を選択してレッスンを予約してください。教室レッスンとオンラインレッスンの両方が可能です。"
      },
      step3: {
        title: "学習開始",
        description: "レッスン資料を事前に確認し、レッスン後には復習資料で学習効果を高めましょう。"
      }
    },
    testimonials: {
      title: "生徒の生々しいレビュー",
      subtitle: "実際に使用している生徒の正直な話",
      student1: {
        name: "金民洙 (初級)",
        review: "レッスン予約が本当に簡単になりました！先生がお勧めする資料で事前に勉強してレッスンに参加すると理解度が格段に良くなりました。"
      },
      student2: {
        name: "李智恩 (中級)",
        review: "オンラインレッスンも教室レッスンと同じくらい良いです！家で快適にレッスンを受けることができ、レッスン資料もいつでも確認できます。"
      },
      student3: {
        name: "朴賢宇 (上級)",
        review: "学習進捗追跡機能が本当に役立ちます。どの部分が不足しているか一目で分かるので復習計画を立てやすくなりました。"
      }
    },
    finalCTA: {
      title: "今すぐ始めてよりスマートな韓国語学習を体験してください",
      subtitle: "教室レッスンをより効果的にするデジタルプラットフォーム",
      button: "無料で始める"
    },
    footer: {
      description: "教室でレッスンを受ける生徒のためのスマートな韓国語学習プラットフォーム",
      learningTools: "学習ツール",
      communication: "コミュニケーション",
      support: "サポート",
      copyright: "© 2024 韓国語教室MalMoi. 全著作権所有。"
    }
  },
  ko: {
    siteName: "한국어교실MalMoi",
    startButton: "시작하기",
    heroTitle: "한국어 수업을 더",
    heroTitleHighlight: "스마트하게",
    heroSubtitle: "교실에서 수업을 듣는 학생들을 위한 디지털 학습 플랫폼",
    heroDescription: "예약부터 복습까지, 모든 것을 한 곳에서 관리하세요",
    stats: {
      students: "활발한 학생들",
      classes: "완료된 수업",
      satisfaction: "평균 만족도",
      attendance: "수업 출석률"
    },
    features: {
      title: "학생들을 위한 특별한 기능",
      subtitle: "교실 수업을 더욱 효과적으로 만들어주는 디지털 도구들",
      reservation: {
        title: "간편한 수업 예약",
        description: "원하는 시간에 원하는 선생님과 수업을 예약하세요. 실시간으로 가능한 시간을 확인할 수 있습니다.",
        feature: "실시간 예약 가능"
      },
      materials: {
        title: "수업 자료 관리",
        description: "수업 자료를 언제든지 확인하고 다운로드할 수 있습니다. 복습에 필요한 모든 자료가 준비되어 있어요.",
        feature: "24시간 접근 가능"
      },
      online: {
        title: "온라인 수업",
        description: "집에서도 교실에서도 수업을 들을 수 있습니다. Zoom 링크로 언제든지 접속하세요.",
        feature: "Zoom 연동"
      },
      progress: {
        title: "학습 진도 추적",
        description: "나의 학습 진도를 한눈에 확인할 수 있습니다. 어느 부분을 더 공부해야 할지 알려드려요.",
        feature: "개인별 맞춤 분석"
      },
      communication: {
        title: "선생님과 소통",
        description: "수업 후 궁금한 점을 언제든지 물어보세요. 선생님이 친절하게 답변해드립니다.",
        feature: "실시간 메시지"
      },
      review: {
        title: "수업 리뷰",
        description: "수업 후 느낀 점을 공유하고 피드백을 받아보세요. 더 좋은 수업을 위한 소중한 의견입니다.",
        feature: "상호 피드백"
      }
    },
    howItWorks: {
      title: "이렇게 사용하세요",
      subtitle: "간단한 3단계로 시작하는 스마트한 한국어 학습",
      step1: {
        title: "회원가입",
        description: "간단한 정보 입력으로 회원가입을 완료하세요. 선생님이 추천해주신 계정으로 바로 시작할 수 있습니다."
      },
      step2: {
        title: "수업 예약",
        description: "원하는 시간과 선생님을 선택해서 수업을 예약하세요. 교실 수업과 온라인 수업 모두 가능합니다."
      },
      step3: {
        title: "학습 시작",
        description: "수업 자료를 미리 확인하고, 수업 후에는 복습 자료로 학습 효과를 높이세요."
      }
    },
    testimonials: {
      title: "학생들의 생생한 후기",
      subtitle: "실제 사용하고 있는 학생들의 솔직한 이야기",
      student1: {
        name: "김민수 (초급)",
        review: "수업 예약이 정말 쉬워졌어요! 선생님이 추천해주신 자료로 미리 공부하고 수업에 참여하니까 이해도가 훨씬 좋아졌습니다."
      },
      student2: {
        name: "이지은 (중급)",
        review: "온라인 수업도 교실 수업만큼 좋아요! 집에서 편하게 수업을 들을 수 있고, 수업 자료도 언제든지 확인할 수 있어요."
      },
      student3: {
        name: "박현우 (고급)",
        review: "학습 진도 추적 기능이 정말 유용해요. 어느 부분이 부족한지 한눈에 알 수 있어서 복습 계획을 세우기 쉬워졌습니다."
      }
    },
    finalCTA: {
      title: "지금 시작해서 더 스마트한 한국어 학습을 경험하세요",
      subtitle: "교실 수업을 더욱 효과적으로 만들어주는 디지털 플랫폼",
      button: "무료로 시작하기"
    },
    footer: {
      description: "교실에서 수업을 듣는 학생들을 위한 스마트한 한국어 학습 플랫폼",
      learningTools: "학습 도구",
      communication: "소통",
      support: "지원",
      copyright: "© 2024 한국어교실MalMoi. 모든 권리 보유."
    }
  }
};

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'ja' | 'ko'>('ja');
  
  const t = translations[language];

  const handleStart = () => {
    setIsLoading(true);
    router.push('/auth/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ja' ? 'ko' : 'ja');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t.siteName}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
              >
                <Languages className="w-4 h-4" />
                {language === 'ja' ? '한국어' : '日本語'}
              </button>
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    {t.startButton}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t.heroTitle}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {t.heroTitleHighlight}</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t.heroSubtitle}
            <br />
            {t.heroDescription}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">500+</div>
            <div className="text-sm text-gray-600">{t.stats.students}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Calendar className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">1,200+</div>
            <div className="text-sm text-gray-600">{t.stats.classes}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">4.9</div>
            <div className="text-sm text-gray-600">{t.stats.satisfaction}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">98%</div>
            <div className="text-sm text-gray-600">{t.stats.attendance}</div>
          </div>
        </div>

        {/* Main CTA */}
        <div className="mb-16">
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <Play className="w-6 h-6" />
                {language === 'ja' ? '今すぐ始める' : '지금 시작하기'}
              </>
            )}
          </button>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {t.features.title}
            </h3>
            <p className="text-lg text-gray-600">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 수업 예약 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.features.reservation.title}</h4>
              <p className="text-gray-600 mb-4">
                {t.features.reservation.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <CheckCircle className="w-4 h-4" />
                <span>{t.features.reservation.feature}</span>
              </div>
            </div>

            {/* 수업 자료 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.features.materials.title}</h4>
              <p className="text-gray-600 mb-4">
                {t.features.materials.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{t.features.materials.feature}</span>
              </div>
            </div>

            {/* 온라인 수업 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.features.online.title}</h4>
              <p className="text-gray-600 mb-4">
                {t.features.online.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <CheckCircle className="w-4 h-4" />
                <span>{t.features.online.feature}</span>
              </div>
            </div>

            {/* 학습 진도 */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.features.progress.title}</h4>
              <p className="text-gray-600 mb-4">
                {t.features.progress.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <CheckCircle className="w-4 h-4" />
                <span>{t.features.progress.feature}</span>
              </div>
            </div>

            {/* 선생님과 소통 */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.features.communication.title}</h4>
              <p className="text-gray-600 mb-4">
                {t.features.communication.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <CheckCircle className="w-4 h-4" />
                <span>{t.features.communication.feature}</span>
              </div>
            </div>

            {/* 수업 리뷰 */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.features.review.title}</h4>
              <p className="text-gray-600 mb-4">
                {t.features.review.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-indigo-600">
                <CheckCircle className="w-4 h-4" />
                <span>{t.features.review.feature}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {t.howItWorks.title}
            </h3>
            <p className="text-lg text-gray-600">
              {t.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.howItWorks.step1.title}</h4>
              <p className="text-gray-600">
                {t.howItWorks.step1.description}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.howItWorks.step2.title}</h4>
              <p className="text-gray-600">
                {t.howItWorks.step2.description}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t.howItWorks.step3.title}</h4>
              <p className="text-gray-600">
                {t.howItWorks.step3.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Student Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {t.testimonials.title}
            </h3>
            <p className="text-lg text-gray-600">
              {t.testimonials.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">金</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t.testimonials.student1.name}</div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "{t.testimonials.student1.review}"
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">李</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t.testimonials.student2.name}</div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "{t.testimonials.student2.review}"
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">朴</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t.testimonials.student3.name}</div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "{t.testimonials.student3.review}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold mb-4">
            {t.finalCTA.title}
          </h3>
          <p className="text-xl mb-8 opacity-90">
            {t.finalCTA.subtitle}
          </p>
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : (
              <>
                <Play className="w-6 h-6" />
                {t.finalCTA.button}
              </>
            )}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xl font-bold">{t.siteName}</h4>
              </div>
              <p className="text-gray-400">
                {t.footer.description}
              </p>
            </div>

            <div>
              <h5 className="font-semibold mb-4">{t.footer.learningTools}</h5>
              <ul className="space-y-2 text-gray-400">
                <li>{language === 'ja' ? 'レッスン予約' : '수업 예약'}</li>
                <li>{language === 'ja' ? '学習資料' : '학습 자료'}</li>
                <li>{language === 'ja' ? '進捗追跡' : '진도 추적'}</li>
                <li>{language === 'ja' ? 'オンラインレッスン' : '온라인 수업'}</li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">{t.footer.communication}</h5>
              <ul className="space-y-2 text-gray-400">
                <li>{language === 'ja' ? '先生とのメッセージ' : '선생님과 메시지'}</li>
                <li>{language === 'ja' ? 'レッスンレビュー' : '수업 리뷰'}</li>
                <li>{language === 'ja' ? '学習フィードバック' : '학습 피드백'}</li>
                <li>{language === 'ja' ? '質問と回答' : '질문과 답변'}</li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">{t.footer.support}</h5>
              <ul className="space-y-2 text-gray-400">
                <li>{language === 'ja' ? '使用ガイド' : '사용 가이드'}</li>
                <li>{language === 'ja' ? 'よくある質問' : '자주 묻는 질문'}</li>
                <li>{language === 'ja' ? 'カスタマーサポート' : '고객 지원'}</li>
                <li>{language === 'ja' ? 'お問い合わせ' : '문의하기'}</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>{t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
