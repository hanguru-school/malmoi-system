import Link from 'next/link';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Star, 
  TrendingUp, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Users,
      title: '学生管理',
      description: '学生の登録、情報管理、進捗追跡を簡単に行えます。',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: GraduationCap,
      title: '教師管理',
      description: '教師のスケジュール、給与、評価を一元管理できます。',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: BookOpen,
      title: '授業管理',
      description: '授業の予約、進行、記録を効率的に管理できます。',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: Calendar,
      title: 'スケジュール管理',
      description: '学生と教師のスケジュールを自動調整します。',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      icon: Star,
      title: '評価システム',
      description: '学生の学習成果と教師の評価を追跡します。',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      icon: TrendingUp,
      title: '分析レポート',
      description: '詳細な分析とレポートで教育の質を向上させます。',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const stats = [
    { label: '登録学生', value: '1,247', icon: Users },
    { label: '在籍教師', value: '89', icon: GraduationCap },
    { label: '月間授業', value: '2,156', icon: BookOpen },
    { label: '満足度', value: '98%', icon: Star }
  ];

  const benefits = [
    'リアルタイムでの学生進捗追跡',
    '自動化されたスケジュール管理',
    '包括的な教師評価システム',
    '詳細な分析とレポート機能',
    '安全で信頼性の高いデータ管理',
    '使いやすい直感的なインターフェース'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">한글루</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/admin/home" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                管理者
              </Link>
              <Link href="/teacher/home" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                教師
              </Link>
              <Link href="/student/home" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                学生
              </Link>
              <Link href="/parent/home" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                保護者
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>
        {/* ヒーローセクション */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              教育管理の
              <span className="text-blue-600">未来</span>
              を創造する
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              学生、教師、保護者を繋ぐ包括的な教育管理システム。
              学習の効率化と教育の質向上を実現します。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin/home"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                管理者としてログイン
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/teacher/home"
                className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                教師としてログイン
              </Link>
            </div>
          </div>
        </section>

        {/* 統計セクション */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 機能セクション */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                包括的な教育管理機能
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                学生の学習から教師の管理まで、教育機関に必要なすべての機能を提供します。
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className={`p-3 rounded-lg ${feature.bgColor} w-fit mb-4`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 利点セクション */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  なぜ한글루を選ぶのか
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link
                    href="/admin/home"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    今すぐ始める
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 text-white">
                  <div className="flex items-center mb-6">
                    <Shield className="w-8 h-8 mr-3" />
                    <h3 className="text-xl font-semibold">セキュリティ保証</h3>
                  </div>
                  <p className="text-blue-100 mb-6">
                    最高レベルのセキュリティで学生と教師のデータを保護します。
                  </p>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    <span className="text-sm">24時間監視</span>
                  </div>
                </div>
                
                <div className="absolute -top-4 -right-4 bg-yellow-500 rounded-lg p-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              教育の未来を今すぐ体験
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              学生、教師、保護者全員が使いやすい統合教育管理システムで、
              学習効果を最大化しましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin/home"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors"
              >
                無料で始める
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/teacher/home"
                className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-700 transition-colors"
              >
                デモを見る
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">한글루</h3>
              <p className="text-gray-400">
                教育管理の未来を創造する包括的なプラットフォーム
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">製品</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/admin/home" className="hover:text-white">管理者ポータル</Link></li>
                <li><Link href="/teacher/home" className="hover:text-white">教師ポータル</Link></li>
                <li><Link href="/student/home" className="hover:text-white">学生ポータル</Link></li>
                <li><Link href="/parent/home" className="hover:text-white">保護者ポータル</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">サポート</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">ヘルプセンター</a></li>
                <li><a href="#" className="hover:text-white">お問い合わせ</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">会社</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">会社概要</a></li>
                <li><a href="#" className="hover:text-white">プライバシーポリシー</a></li>
                <li><a href="#" className="hover:text-white">利用規約</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 한글루. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
