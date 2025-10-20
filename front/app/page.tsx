"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* ヘッダー - ナビゲーション */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            CoachingAI
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/auth/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              新規登録
            </Link>
          </div>
        </nav>
      </header>

      {/* セクション1: ヒーロー */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              あなたの成長を
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                AIがサポート
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
              CoachingAIは、あなた専用のAIコーチ。
              <br />
              音声対話で自然にコミュニケーションし、目標達成までサポートします。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-200 shadow-2xl hover:shadow-indigo-500/50 hover:scale-105"
              >
                無料で始める
              </Link>
              <Link
                href="#features"
                className="bg-white hover:bg-gray-50 text-indigo-600 font-bold py-4 px-10 rounded-full text-lg border-2 border-indigo-600 transition-all duration-200 hover:scale-105"
              >
                詳しく見る
              </Link>
            </div>
          </div>
          
          {/* デモ画像エリア */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center">
                <div className="text-6xl">🤖💬</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* セクション2: 特徴 */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              3つの特徴
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              CoachingAIがあなたの成長をサポートする理由
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🤖</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                パーソナライズされたコーチング
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                あなたの目標や状況に合わせて、最適なアドバイスを提供。AIが学習し、より効果的なサポートを実現します。
              </p>
            </div>
            
            <div className="group p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">💬</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                自然な音声対話
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                テキストだけでなく、音声での対話も可能。まるで人と話しているような自然なコミュニケーションを体験できます。
              </p>
            </div>
            
            <div className="group p-8 bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">📈</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                継続的な成長サポート
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                日々の進捗を記録し、長期的な目標達成をサポート。あなたの成長を可視化し、モチベーションを維持します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* セクション3: 使い方 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              簡単3ステップ
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              今すぐ始められます
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                アカウント作成
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                メールアドレスとパスワードで簡単に登録できます
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                目標を設定
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                あなたの目標をAIに伝えて、コーチングを開始
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-pink-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                対話を始める
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                音声またはテキストで、AIコーチと対話を開始
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* セクション4: CTA（Call to Action） */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            今すぐ始めませんか？
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            無料でアカウントを作成して、あなた専用のAIコーチと対話を始めましょう
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white hover:bg-gray-100 text-indigo-600 font-bold py-4 px-12 rounded-full text-lg transition-all duration-200 shadow-2xl hover:scale-105"
          >
            無料で始める →
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">CoachingAI</h3>
              <p className="text-sm">
                あなたの成長をサポートするAIコーチングプラットフォーム
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">プロダクト</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">特徴</Link></li>
                <li><Link href="/chat" className="hover:text-white transition-colors">チャット</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">アカウント</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">新規登録</Link></li>
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">ログイン</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">サポート</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">ヘルプ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">お問い合わせ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 CoachingAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
