"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* ヘッダー - ナビゲーション */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <nav className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0 h-16 flex items-center justify-between">
          <div className="flex items-center gap-0 -ml-6">
            <Image
              src="/icon-logo.png"
              alt="CoachingAI Icon"
              width={50}
              height={50}
              className="h-10 w-10"
            />
            <Image
              src="/logo.png"
              alt="CoachingAI"
              width={600}
              height={180}
              className="h-32 w-auto"
            />
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
      <section className="pt-32 pb-32 px-4 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="pt-48"></div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                話すことで、心が動く。
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
              CoachingAIは、あなた専用のAIコーチ。
              <br />
              心・恋愛・キャリア、すべての対話を支える存在です。
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
            <div className="pb-40"></div>
          </div>
          
          {/* デモ画像エリア */}
          <div className="mt-32 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center">
                <div className="text-6xl">🤖💬</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* セクション2: ミニ解説セクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            AIと話す。それだけで、少し前に進める。
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            CoachingAIは、あなた専用のAIコーチ。心・恋愛・キャリア、すべての対話を支える存在です。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                パーソナライズされたコーチング
              </h3>
            </div>
            <div className="p-6">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                自然な会話体験
              </h3>
            </div>
            <div className="p-6">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                継続的なサポート
              </h3>
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

      {/* セクション4: 最終CTAセクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            話すことで、心が整う。
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            1分で始められる、AIとのパーソナルコーチング。
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white hover:bg-gray-100 text-indigo-600 font-bold py-4 px-12 rounded-full text-lg transition-all duration-200 shadow-2xl hover:scale-105"
          >
            AIと話してみる（無料）
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-white font-bold text-xl mb-4">CoachingAI</h3>
          <p className="text-sm mb-6">
            言葉にすることで、前に進める。
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">利用規約</a>
            <a href="#" className="hover:text-white transition-colors">プライバシー</a>
            <a href="#" className="hover:text-white transition-colors">ヘルプ</a>
            <Link href="/auth/signin" className="hover:text-white transition-colors">ログイン</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">登録</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
