'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Star, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Award,
  Users,
  MessageSquare,
  Play,
  Target,
  Heart,
  ArrowRight,
  Globe,
  GraduationCap,
  Trophy,
  Zap,
  Shield,
  Download,
  Laptop
} from 'lucide-react';

import { useDevice } from '@/hooks/useDevice';

export default function Home() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ja');
  const { deviceType, isMobile, isTablet, isDesktop, screenWidth, userAgent } = useDevice();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // PWA 설치 가능 여부 확인 및 beforeinstallprompt 이벤트 처리
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('beforeinstallprompt 이벤트 감지됨!');
      // 기본 설치 프롬프트 방지
      e.preventDefault();
      // 설치 프롬프트 저장
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('설치 프롬프트가 저장되었습니다:', e);
    };

    const handleAppInstalled = () => {
      console.log('PWA가 성공적으로 설치되었습니다!');
      setDeferredPrompt(null);
      setIsInstallable(false);
      // 설치 완료 메시지
              alert(language === 'ja' ? 'MalMoiがホーム画面に正常にインストールされました！' : 'MalMoiがホーム画面に正常にインストールされました！');
    };

    // 이미 설치 가능한 상태인지 확인
    const checkInstallability = async () => {
      try {
        // Service Worker 등록 확인
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            console.log('Service Worker 등록됨:', registration);
            setIsInstallable(true);
          }
        }

        // PWA 설치 조건 확인
        if ('getInstalledRelatedApps' in navigator) {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          console.log('설치된 관련 앱:', relatedApps);
        }

        // 브라우저 지원 확인
        const userAgent = navigator.userAgent;
        const isChrome = /Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent);
        const isEdge = /Edge|Edg/.test(userAgent);
        const isFirefox = /Firefox/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        
        if (isChrome || isEdge || isFirefox) {
          console.log('PWA 설치가 지원되는 브라우저입니다.');
          setIsInstallable(true);
        }
      } catch (error) {
        console.error('설치 가능 여부 확인 중 오류:', error);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // 초기 설치 가능 여부 확인
    checkInstallability();

    // 컴포넌트 언마운트 시 정리
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [language]);

  const handleAddToHomeScreen = async () => {
    try {
      console.log('PWA 설치 시도 중...');
      console.log('deferredPrompt 상태:', deferredPrompt);
      console.log('isInstallable 상태:', isInstallable);

      // 이미 설치된 경우 확인
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) {
        alert(language === 'ja' ? 'MalMoiは既にホーム画面にインストールされています。' : 'MalMoiは既にホーム画面にインストールされています。');
        return;
      }

      // 저장된 설치 프롬프트가 있는 경우 - 자동 설치 시도
      if (deferredPrompt) {
        console.log('저장된 설치 프롬프트로 자동 설치 시도...');
        
        try {
          // 설치 프롬프트 표시
          const result = await deferredPrompt.prompt();
          console.log('설치 프롬프트 결과:', result);
          
          // 사용자 선택 대기
          const { outcome } = await deferredPrompt.userChoice;
          console.log('사용자 선택 결과:', outcome);
          
          if (outcome === 'accepted') {
            console.log('PWA 설치가 승인되었습니다.');
            // 설치 완료 후 안내
            setTimeout(() => {
              alert(language === 'ja' 
                ? 'MalMoi가 성공적으로 설치되었습니다! 홈 화면에서 앱을 찾을 수 있습니다.' 
                : 'MalMoi가 성공적으로 설치되었습니다! 홈 화면에서 앱을 찾을 수 있습니다.');
            }, 1000);
          } else {
            console.log('PWA 설치가 거부되었습니다.');
            alert(language === 'ja' ? 'インストールがキャンセルされました。後でもう一度お試しください。' : 'インストールがキャンセルされました。後でもう一度お試しください。');
          }
          
          // 프롬프트 초기화
          setDeferredPrompt(null);
          setIsInstallable(false);
          return;
        } catch (promptError) {
          console.error('설치 프롬프트 실행 중 오류:', promptError);
        }
      }

      // 설치 프롬프트가 없는 경우 - 브라우저별 자동 설치 시도
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isChrome = /Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isEdge = /Edge|Edg/.test(userAgent);
      const isFirefox = /Firefox/.test(userAgent);
      const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
      
      console.log('브라우저 정보:', {
        isIOS, isAndroid, isChrome, isSafari, isEdge, isFirefox, isMobile
      });

      // Chrome/Edge에서 자동 설치 시도
      if ((isChrome || isEdge) && !isMobile) {
        console.log('Chrome/Edge 데스크톱에서 자동 설치 시도...');
        try {
          // Chrome/Edge의 자동 설치 API 시도
          if ('getInstalledRelatedApps' in navigator) {
            const relatedApps = await (navigator as any).getInstalledRelatedApps();
            console.log('설치된 관련 앱:', relatedApps);
          }
          
          // PWA 설치 API 직접 호출 시도
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              console.log('Service Worker 등록됨:', registration);
              // 설치 프롬프트가 나올 때까지 대기
                      alert(language === 'ja' 
          ? 'インストールプロンプトがまもなく表示されます。「インストール」をクリックしてください。'
          : 'インストールプロンプトがまもなく表示されます。「インストール」をクリックしてください。');
              return;
            }
          }
        } catch (error) {
          console.error('Chrome/Edge 자동 설치 시도 중 오류:', error);
        }
      }

      // Firefox에서 자동 설치 시도
      if (isFirefox && !isMobile) {
        console.log('Firefox 데스크톱에서 자동 설치 시도...');
        try {
          // Firefox의 PWA 설치 API 시도
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              console.log('Firefox Service Worker 등록됨:', registration);
                      alert(language === 'ja' 
          ? 'Firefoxでインストールプロンプトがまもなく表示されます。'
          : 'Firefoxでインストールプロンプトがまもなく表示されます。');
              return;
            }
          }
        } catch (error) {
          console.error('Firefox 자동 설치 시도 중 오류:', error);
        }
      }

      // 모바일에서 자동 설치 시도
      if (isMobile) {
        console.log('모바일에서 자동 설치 시도...');
        
        // Android Chrome에서 자동 설치
        if (isAndroid && isChrome) {
          try {
            // Android Chrome의 자동 설치 API 시도
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.getRegistration();
              if (registration) {
                console.log('Android Chrome Service Worker 등록됨:', registration);
                
                // Android Chrome에서 설치 프롬프트 강제 트리거 시도
                try {
                  // PWA 설치 조건을 만족시키기 위한 추가 시도
                  if ('getInstalledRelatedApps' in navigator) {
                    await (navigator as any).getInstalledRelatedApps();
                  }
                  
                  // 설치 프롬프트가 나타날 때까지 잠시 대기
                          alert(language === 'ja' 
          ? 'Android Chromeでインストールプロンプトがまもなく表示されます。「インストール」をクリックしてください。'
          : 'Android Chromeでインストールプロンプトがまもなく表示されます。「インストール」をクリックしてください。');
                  return;
                } catch (error) {
                  console.error('Android Chrome 자동 설치 시도 중 오류:', error);
                }
              }
            }
          } catch (error) {
            console.error('Android Chrome 자동 설치 시도 중 오류:', error);
          }
        }

        // iOS Chrome에서 자동 설치 시도 (iOS는 제한적)
        if (isIOS && isChrome) {
          try {
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.getRegistration();
              if (registration) {
                console.log('iOS Chrome Service Worker 등록됨:', registration);
                        alert(language === 'ja' 
          ? 'iOS Chromeでインストールプロンプトがまもなく表示されます。'
          : 'iOS Chromeでインストールプロンプトがまもなく表示されます。');
                return;
              }
            }
          } catch (error) {
            console.error('iOS Chrome 자동 설치 시도 중 오류:', error);
          }
        }

        // iOS Safari에서 수동 안내 (iOS는 자동 설치 불가)
        if (isIOS && isSafari) {
          alert(language === 'ja' 
            ? 'Safari에서 공유 버튼(📤)을 누르고 "홈 화면에 추가"를 선택해주세요.' 
            : 'Safari에서 공유 버튼(📤)을 누르고 "홈 화면에 추가"를 선택해주세요.');
          return;
        }

        // 기타 모바일 브라우저에서 자동 설치 시도
        try {
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              console.log('모바일 Service Worker 등록됨:', registration);
                      alert(language === 'ja' 
          ? 'モバイルブラウザでインストールプロンプトがまもなく表示されます。'
          : 'モバイルブラウザでインストールプロンプトがまもなく表示されます。');
              return;
            }
          }
        } catch (error) {
          console.error('모바일 자동 설치 시도 중 오류:', error);
        }
      }

      // 모든 자동 설치 시도가 실패한 경우 - 브라우저별 안내
      console.log('자동 설치 실패, 브라우저별 안내 제공...');
      
      if (isChrome || isEdge) {
        alert(language === 'ja' 
          ? 'Chrome/Edge에서 주소창 옆의 "설치" 버튼을 클릭하거나, 메뉴에서 "앱 설치"를 선택해주세요.' 
          : 'Chrome/Edge에서 주소창 옆의 "설치" 버튼을 클릭하거나, 메뉴에서 "앱 설치"를 선택해주세요.');
      } else if (isFirefox) {
        alert(language === 'ja' 
          ? 'Firefox에서 주소창 옆의 "설치" 버튼을 클릭하거나, 메뉴에서 "앱 설치"를 선택해주세요.' 
          : 'Firefox에서 주소창 옆의 "설치" 버튼을 클릭하거나, 메뉴에서 "앱 설치"를 선택해주세요.');
      } else if (isSafari) {
        alert(language === 'ja' 
          ? 'Safari에서 공유 버튼(📤)을 누르고 "홈 화면에 추가"를 선택해주세요.' 
          : 'Safari에서 공유 버튼(📤)을 누르고 "홈 화면에 추가"를 선택해주세요.');
      } else {
        alert(language === 'ja' 
          ? '현재 브라우저에서 PWA 설치를 지원하지 않습니다. Chrome, Edge, Firefox, Safari를 사용해주세요.' 
          : '현재 브라우저에서 PWA 설치를 지원하지 않습니다. Chrome, Edge, Firefox, Safari를 사용해주세요.');
      }
        
    } catch (error) {
      console.error('PWA 설치 중 오류:', error);
              alert(language === 'ja' ? 'インストール中にエラーが発生しました。もう一度お試しください。' : 'インストール中にエラーが発生しました。もう一度お試しください。');
    }
  };

  // 모바일 감사 메시지 클릭 핸들러
  const handleMobileThankYouClick = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    if (isMobile) {
      // 모바일 - 설치 방법 안내
      if (isIOS && isSafari) {
        alert(language === 'ja' 
          ? 'Safariで共有ボタン(📤)を押して「ホーム画面に追加」を選択してください。' 
          : 'Safari에서 공유 버튼(📤)을 누르고 "홈 화면에 추가"를 선택해주세요.');
      } else if (isAndroid && isChrome) {
        alert(language === 'ja' 
          ? 'Chromeメニュー(⋮)から「ホーム画面に追加」を選択してください。' 
          : 'Chrome 메뉴(⋮)에서 "홈 화면에 추가"를 선택해주세요.');
      } else if (isIOS && isChrome) {
        alert(language === 'ja' 
          ? 'Chromeメニュー(⋮)から「ホーム画面に追加」を選択してください。' 
          : 'Chrome 메뉴(⋮)에서 "홈 화면에 추가"를 선택해주세요.');
      } else {
        alert(language === 'ja' 
          ? 'ブラウザメニューから「ホーム画面に追加」または「アプリをインストール」を選択してください。' 
          : '브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해주세요.');
      }
    } else {
      // 데스크톱 - 네이티브 앱 설치
      handleAddToHomeScreen();
    }
  };

  const translations = {
    ja: {
      title: '韓国語教室 MalMoi',
      heroTitle: 'MalMoiで',
      heroHighlight: '韓国語学習',
      heroSubtitle: 'を始めましょう',
      heroDescription: 'MalMoiなら、あなたの韓国語学習が劇的に変わります。体系的なカリキュラムと専門講師の指導で、確実に上達を実感できる学習体験を提供します。',
      startButton: '시작하기',
      whyChooseTitle: 'MalMoiが選ばれる理由',
      whyChooseSubtitle: 'あなたの韓国語学習を変える特別な体験',
      features: [
        {
          icon: BookOpen,
          title: '体系的なカリキュラム',
          description: '初級から上級まで、段階的に実力を向上させることができる体系的なカリキュラムを提供します。',
          bgColor: 'bg-blue-100',
          color: 'text-blue-600',
        },
        {
          icon: Users,
          title: '専門講師陣',
          description: '経験豊富な専門講師が生徒一人一人に合わせた細やかな指導を提供します。',
          bgColor: 'bg-green-100',
          color: 'text-green-600',
        },
        {
          icon: Laptop,
          title: 'いつでもどこでも学習',
          description: 'オンラインで提供される授業は時間と場所の制約なく自由に学習できます。',
          bgColor: 'bg-purple-100',
          color: 'text-purple-600',
        },
        {
          icon: MessageSquare,
          title: '実践会話練習',
          description: '実際の会話に役立つ表現を学び、ネイティブのように自然な韓国語を話すことができます。',
          bgColor: 'bg-yellow-100',
          color: 'text-yellow-600',
        },
        {
          icon: Award,
          title: '学習成果の可視化',
          description: '定期的な評価とフィードバックを通じて学習進捗状況を明確に確認できます。',
          bgColor: 'bg-red-100',
          color: 'text-red-600',
        },
        {
          icon: Shield,
          title: '安全な学習環境',
          description: '生徒の皆さんが安心して学習に集中できる安全で快適な環境を提供します。',
          bgColor: 'bg-indigo-100',
          color: 'text-indigo-600',
        },
      ],
      learningProcessTitle: 'MalMoiの学習過程',
      learningProcessSubtitle: '効果的な韓国語学習のための段階的アプローチ',
      levels: [
        {
          title: '基礎固め',
          description: 'ハングルから基本的な文法まで、韓国語のしっかりとした基盤を作ります。',
        },
        {
          title: '応用力強化',
          description: '様々な表現と語彙を習得し、より複雑な文章を理解し作成します。',
        },
        {
          title: '実践会話',
          description: 'ネイティブとの会話を通じて流暢なコミュニケーション能力を養います。',
        },
        {
          title: '文化理解',
          description: '韓国の文化と習慣を学び、言語だけでなく背景知識も深めます。',
        },
      ],
      ctaTitle: '今すぐ始めてみましょう！',
      ctaDescription: '韓国語学習の新しい体験をMalMoiと一緒に始めましょう。専門の先生方と一緒に楽しく韓国語を学びましょう。',
      ctaButton: '시작하기',
      footerDescription: '体系的で楽しい韓国語学習のための最高の選択',
      login: '로그인',
      register: '회원가입',
      addToHomeScreen: '화면에 추가',
      addToHomeScreenTooltip: '화면에 추가',
      additionalBenefitsTitle: 'さらに多くのメリット',
      specialBenefitsTitle: '特別な特典',
      convenientFeaturesTitle: '便利な機能',
      freeMaterials: '無料の学習資料',
      support24h: '24時間サポート',
      progressManagement: '進度管理システム',
      mobileApp: 'モバイルアプリ',
      autoReservation: '自動予約システム',
      benefits: [
        '体系的な韓国語学習カリキュラム',
        '専門講師陣のカスタマイズ指導',
        '柔軟なオンライン授業',
        '実践会話練習',
        '学習進捗の可視化',
        '安全な学習環境',
      ]
    },
    ko: {
      title: '한국어 교실 MalMoi',
      heroTitle: 'MalMoi로',
      heroHighlight: '한국어 학습',
      heroSubtitle: '을 시작하세요',
      heroDescription: 'MalMoi라면 여러분의 한국어 학습이 극적으로 바뀝니다. 체계적인 커리큘럼과 전문 강사의 지도로 확실한 실력 향상을 체감할 수 있는 학습 경험을 제공합니다.',
      startButton: '시작하기',
      whyChooseTitle: 'MalMoi가 선택받는 이유',
      whyChooseSubtitle: '여러분의 한국어 학습을 바꾸는 특별한 경험',
      features: [
        {
          icon: BookOpen,
          title: '체계적인 커리큘럼',
          description: '초급부터 고급까지, 단계별로 실력을 향상시킬 수 있는 체계적인 커리큘럼을 제공합니다.',
          bgColor: 'bg-blue-100',
          color: 'text-blue-600',
        },
        {
          icon: Users,
          title: '전문 강사진',
          description: '경험 많은 전문 강사들이 학생 개개인에 맞춘 세심한 지도를 제공합니다.',
          bgColor: 'bg-green-100',
          color: 'text-green-600',
        },
        {
          icon: Laptop,
          title: '언제 어디서나 학습',
          description: '온라인으로 제공되는 수업은 시간과 장소의 제약 없이 자유롭게 학습할 수 있습니다.',
          bgColor: 'bg-purple-100',
          color: 'text-purple-600',
        },
        {
          icon: MessageSquare,
          title: '실전 회화 연습',
          description: '실제 대화에 유용한 표현들을 배우고, 원어민처럼 자연스러운 한국어를 구사할 수 있습니다.',
          bgColor: 'bg-yellow-100',
          color: 'text-yellow-600',
        },
        {
          icon: Award,
          title: '학습 성과 시각화',
          description: '정기적인 평가와 피드백을 통해 학습 진행 상황을 명확하게 확인할 수 있습니다.',
          bgColor: 'bg-red-100',
          color: 'text-red-600',
        },
        {
          icon: Shield,
          title: '안전한 학습 환경',
          description: '학생 여러분이 안심하고 학습에 집중할 수 있는 안전하고 쾌적한 환경을 제공합니다.',
          bgColor: 'bg-indigo-100',
          color: 'text-indigo-600',
        },
      ],
      learningProcessTitle: 'MalMoi의 학습 과정',
      learningProcessSubtitle: '효과적인 한국어 학습을 위한 단계별 접근 방식',
      levels: [
        {
          title: '기초 다지기',
          description: '한글부터 기본적인 문법까지, 한국어의 탄탄한 기반을 마련합니다.',
        },
        {
          title: '응용력 강화',
          description: '다양한 표현과 어휘를 익히고, 더 복잡한 문장을 이해하고 작성합니다.',
        },
        {
          title: '실전 회화',
          description: '원어민과의 대화를 통해 유창한 의사소통 능력을 기릅니다.',
        },
        {
          title: '문화 이해',
          description: '한국의 문화와 관습을 배우며, 언어뿐만 아니라 배경 지식도 심화합니다.',
        },
      ],
      ctaTitle: '지금 바로 시작해보세요!',
      ctaDescription: '한국어 학습의 새로운 경험을 MalMoi와 함께 시작하세요. 전문 선생님들과 함께 재미있게 한국어를 배워보세요.',
      ctaButton: '시작하기',
      footerDescription: '체계적이고 재미있는 한국어 학습을 위한 최고의 선택',
      login: '로그인',
      register: '회원가입',
      addToHomeScreen: '화면에 추가',
      addToHomeScreenTooltip: '화면에 추가',
      additionalBenefitsTitle: '더 많은 메리트',
      specialBenefitsTitle: '특별한 혜택',
      convenientFeaturesTitle: '편리한 기능',
      freeMaterials: '무료 학습 자료',
      support24h: '24시간 지원',
      progressManagement: '진도 관리 시스템',
      mobileApp: '모바일 앱',
      autoReservation: '자동 예약 시스템',
      benefits: [
        '체계적인 한국어 학습 커리큘럼',
        '전문 강사진의 맞춤형 지도',
        '유연한 온라인 수업',
        '실전 회화 연습',
        '학습 진도 시각화',
        '안전한 학습 환경',
      ]
    }
  };

  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(language === 'ja' ? 'ko' : 'ja');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-white to-gray-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                  {t.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* PWA 설치 버튼 - 모든 디바이스에서 표시 */}
              <div className="relative group">
                <button
                  onClick={handleAddToHomeScreen}
                  className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  title={t.addToHomeScreenTooltip}
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                {/* 툴팁 */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                  {t.addToHomeScreenTooltip}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
              <div className="relative group">
                <button
                  onClick={toggleLanguage}
                  className="p-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow-md hover:shadow-lg"
                  title={language === 'ja' ? '한국어로 변경' : '日本語に変更'}
                >
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
                {/* 툴팁 */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                  {language === 'ja' ? '한국어로 변경' : '日本語に変更'}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
              <nav className="hidden md:flex space-x-8">
                <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {t.login}
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main>
        {/* 디바이스 정보 표시 (개발용) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs z-50">
            <div>디바이스: {deviceType}</div>
            <div>모바일: {isMobile ? '예' : '아니오'}</div>
            <div>태블릿: {isTablet ? '예' : '아니오'}</div>
            <div>데스크톱: {isDesktop ? '예' : '아니오'}</div>
            <div>화면 너비: {screenWidth}px</div>
            <div className="max-w-xs truncate">UA: {userAgent.substring(0, 50)}...</div>
          </div>
        )}

        {/* 히어로 섹션 */}
        <section className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              <span className="block sm:inline">{t.heroTitle}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block sm:inline"> {t.heroHighlight}</span>
              <span className="block sm:inline">{t.heroSubtitle}</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4 leading-relaxed">
              {t.heroDescription}
            </p>
            {/* 디바이스별 감사 메시지 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6 mx-4 cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-all duration-300" onClick={handleMobileThankYouClick}>
              <p className="text-blue-800 text-sm leading-relaxed">
                {isMobile 
                  ? (language === 'ja' 
                      ? '📱 モバイルでアクセスしていただき、ありがとうございます！ホーム画面にアプリをインストールすると、より便利にご利用いただけます。'
                      : '📱 모바일로 접속해 주셔서 감사합니다! 홈 화면에 앱을 설치하시면 더 편리하게 이용하실 수 있습니다.')
                  : (language === 'ja'
                      ? '💻 デスクトップでアクセスしていただき、ありがとうございます！ネイティブアプリとしてインストールすると、より便利にご利用いただけます。'
                      : '💻 데스크톱으로 접속해 주셔서 감사합니다! 네이티브 앱으로 설치하시면 더 편리하게 이용하실 수 있습니다.')
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t.startButton}
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* MalMoiで学ぶメリット 섹션 */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 px-4">
                {t.whyChooseTitle}
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-4 leading-relaxed">
                {t.whyChooseSubtitle}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
              {t.features.map((feature, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:scale-105">
                  <div className={`p-3 rounded-lg ${feature.bgColor} w-fit mb-4`}>
                    <feature.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 leading-tight">{feature.title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* 학습 과정 섹션 통합 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 sm:p-12 text-white shadow-2xl">
              <div className="text-center mb-8 sm:mb-12">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">
                  {t.learningProcessTitle}
                </h3>
                <p className="text-blue-100 text-lg leading-relaxed max-w-3xl mx-auto">
                  {t.learningProcessSubtitle}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {t.levels.map((level, index) => (
                  <div key={index} className="text-center bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 ${index === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-500' : index === 1 ? 'bg-gradient-to-br from-green-400 to-green-500' : index === 2 ? 'bg-gradient-to-br from-purple-400 to-purple-500' : 'bg-gradient-to-br from-red-400 to-red-500'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      {index === 0 ? <Target className="w-8 h-8 sm:w-10 sm:h-10 text-white" /> :
                       index === 1 ? <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" /> :
                       index === 2 ? <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-white" /> :
                       <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
                    </div>
                    <h4 className="text-lg sm:text-xl font-semibold mb-3 leading-tight">{level.title}</h4>
                    <p className="text-blue-100 text-sm sm:text-base leading-relaxed">{level.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 추가 메리트 섹션 */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-white to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 px-4">
                {t.additionalBenefitsTitle}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 sm:p-8 text-white shadow-xl">
                <div className="flex items-center mb-6">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 mr-3" />
                  <h3 className="text-lg sm:text-xl font-semibold">
                    {t.specialBenefitsTitle}
                  </h3>
                </div>
                <ul className="space-y-3 text-blue-100">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base leading-relaxed">{t.freeMaterials}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base leading-relaxed">{t.support24h}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base leading-relaxed">{t.progressManagement}</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-lg p-6 sm:p-8 text-white shadow-xl">
                <div className="flex items-center mb-6">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 mr-3" />
                  <h3 className="text-lg sm:text-xl font-semibold">
                    {t.convenientFeaturesTitle}
                  </h3>
                </div>
                <ul className="space-y-3 text-green-100">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base leading-relaxed">{t.mobileApp}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base leading-relaxed">{t.autoReservation}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-blue-600 to-purple-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 px-4">
              {t.ctaTitle}
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 leading-relaxed">
              {t.ctaDescription}
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t.ctaButton}
              <Heart className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">{t.title}</h3>
            <p className="text-gray-400 mb-4 text-sm sm:text-base leading-relaxed">
              {t.footerDescription}
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm sm:text-base transition-colors">
                {t.login}
              </Link>
              <Link href="/auth/register" className="text-gray-400 hover:text-white text-sm sm:text-base transition-colors">
                {t.register}
              </Link>
            </div>
          </div>
        </div>
      </footer>
      
      {/* PWA 설치 안내 */}
    </div>
  );
}
