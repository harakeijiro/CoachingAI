"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/ui/logo";
import { useState, useEffect } from "react";

export default function Features() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const themes = [
    {
      id: "mental",
      title: "心・メンタル",
      subtitle: "自分自身と向き合う",
      description: "感情の整理、ストレス解消、自己理解を深めるためのAIコーチング。あなたの心の声に寄り添い、内面の成長をサポートします。",
      features: [
        "感情の整理とストレス解消",
        "自己理解と自己受容の促進",
        "メンタルヘルスの維持・改善",
        "ポジティブ思考の習慣化"
      ],
      color: "from-blue-500 to-indigo-600",
      bgColor: "from-blue-50 to-indigo-50",
      icon: null
    },
    {
      id: "love",
      title: "恋愛・人間関係",
      subtitle: "つながりを深める",
      description: "恋愛の悩み、人間関係の改善、コミュニケーションスキルの向上をサポート。より良い関係性を築くためのアドバイスを提供します。",
      features: [
        "恋愛の悩み相談とアドバイス",
        "人間関係の改善方法",
        "コミュニケーションスキル向上",
        "パートナーシップの構築"
      ],
      color: "from-pink-500 to-rose-600",
      bgColor: "from-pink-50 to-rose-50",
      icon: null
    },
    {
      id: "career",
      title: "キャリア・仕事",
      subtitle: "目標を達成する",
      description: "キャリアアップ、目標設定、スキル向上、仕事の悩み解決をサポート。あなたの職業人生をより充実したものにするためのコーチングを提供します。",
      features: [
        "キャリアプランの策定と実行",
        "目標設定と達成支援",
        "スキルアップの計画立案",
        "仕事の悩みとストレス解消"
      ],
      color: "from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50",
      icon: null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900">
      {/* ヘッダー - ナビゲーション */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md" style={{ marginTop: '20px' }}>
        <nav className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0 h-16 flex items-center justify-between header-nav">
          <Link href="/" className="flex items-center gap-0 -ml-6 header-logo">
            <Image
              src="/icon-logo.png"
              alt="CoachingAI Icon"
              width={50}
              height={50}
              className="h-10 w-10"
            />
            <Logo size="lg" className="ml-2" />
          </Link>
          <div className="flex items-center gap-4 header-buttons">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
            >
              ホーム
            </Link>
            <Link
              href="/character-select"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              無料で始める
            </Link>
          </div>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="pt-24 pb-16">
        {/* ヒーローセクション */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                CoachingAIの機能
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              あなた専用のAIコーチが、<span className="font-bold text-xl">心・恋愛・仕事</span>のすべての領域で
              <br />
              パーソナライズされたサポートを提供します
            </p>
          </div>
        </section>

        {/* テーマセクション */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {themes.map((theme, index) => (
              <div
                key={theme.id}
                className={`rounded-3xl p-8 md:p-12 bg-gradient-to-br ${theme.bgColor} dark:from-gray-800 dark:to-gray-700 shadow-2xl border border-white/20 dark:border-gray-600/20`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* 左側: コンテンツ */}
                  <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="mb-6">
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {theme.title}
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                        {theme.subtitle}
                      </p>
                    </div>
                    
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                      {theme.description}
                    </p>

                    <div className="space-y-4">
                      {theme.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center gap-3"
                        >
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${theme.color}`}></div>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <Link
                        href="/character-select"
                        className={`inline-flex items-center gap-2 bg-gradient-to-r ${theme.color} text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105`}
                      >
                        このテーマで始める
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* 右側: プレースホルダー画像 */}
                  <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className={`aspect-square rounded-2xl bg-gradient-to-br ${theme.color} flex items-center justify-center shadow-2xl`}>
                      <div className="text-center text-white">
                        <p className="text-xl font-semibold">AIコーチ</p>
                        <p className="text-lg opacity-90">{theme.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTAセクション */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20 dark:border-gray-700/50">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              今すぐ始めませんか？
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              あなたに最適なAIコーチを選択して、パーソナライズされたコーチング体験を始めましょう
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/character-select"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-200 shadow-2xl hover:shadow-indigo-500/50 hover:scale-105"
              >
                無料で始める
              </Link>
              <Link
                href="/"
                className="bg-white hover:bg-gray-50 text-indigo-600 font-bold py-3 px-8 rounded-full text-lg border-2 border-indigo-600 transition-all duration-200 hover:scale-105"
              >
                ホームに戻る
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 text-gray-700 dark:text-gray-300 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center space-x-6 text-sm">
            <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">利用規約</Link>
            <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">プライバシー</Link>
            <Link href="/help" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">ヘルプ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
