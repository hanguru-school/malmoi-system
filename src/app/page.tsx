import Link from 'next/link';
import { 
  Settings, 
  Home, 
  Users, 
  Tag, 
  GraduationCap, 
  MessageSquare,
  Star
} from 'lucide-react';

export default function HomePage() {
  const cards = [
    {
      id: 'admin-dashboard',
      title: '관리자 대시보드',
      description: '시스템 전반을 관리하고 요약 정보를 확인',
      buttonText: '대시보드 열기',
      href: '/admin/home',
      icon: Settings,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'tagging-system',
      title: '태깅 시스템',
      description: 'NFC/FeliCa 태그를 통한 출석 및 방문 기록 관리',
      buttonText: '태깅 페이지 열기',
      href: '/tagging/home',
      icon: Tag,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'student-portal',
      title: '학생 포털',
      description: '예약·노트·숙제·학습 이력 페이지로 이동',
      buttonText: '학생 포털 열기',
      href: '/student/home',
      icon: GraduationCap,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'teacher-portal',
      title: '선생님 포털',
      description: '강사 일정·메모·급여 확인 페이지로 이동',
      buttonText: '선생님 포털 열기',
      href: '/teacher/home',
      icon: Users,
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      iconColor: 'text-pink-600',
      buttonColor: 'bg-pink-600 hover:bg-pink-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            한국어 교실 MalMoi 시스템
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            효율적인 한국어 교육 관리 시스템
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className={`${card.bgColor} ${card.borderColor} border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
              >
                <div className="text-center">
                  {/* 아이콘 */}
                  <div className={`${card.iconColor} mb-4`}>
                    <IconComponent className="w-16 h-16 mx-auto" />
                  </div>
                  
                  {/* 타이틀 */}
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {card.title}
                  </h2>
                  
                  {/* 설명 */}
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {card.description}
                  </p>
                  
                  {/* 액션 버튼 */}
                  <Link
                    href={card.href}
                    className={`${card.buttonColor} text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2 shadow-md hover:shadow-lg`}
                    aria-label={`${card.title} 페이지로 이동`}
                  >
                    {card.buttonText}
                    <Home className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* 추가 관리 섹션 */}
        <div className="mt-16 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors shadow-lg">
            <MessageSquare className="w-5 h-5" />
            <Link
              href="/community"
              className="text-white hover:text-gray-100"
              aria-label="커뮤니티 페이지로 이동"
            >
              커뮤니티
            </Link>
          </div>
          
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors shadow-lg">
            <Star className="w-5 h-5" />
            <Link
              href="/review-system"
              className="text-white hover:text-gray-100"
              aria-label="리뷰 시스템 페이지로 이동"
            >
              리뷰 시스템
            </Link>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 한국어 교실 MalMoi. 모든 권리 보유</p>
          <p className="mt-2">
            접근성 및 키보드 네비게이션을 지원합니다
          </p>
        </div>
      </div>
    </div>
  );
}
