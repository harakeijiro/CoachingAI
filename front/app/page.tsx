"use client";

/**
 * ホームページ（ランディングページ）
 * アプリの紹介と認証モーダルを表示
 */
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/ui/logo";
import AuthModal from "@/components/auth/AuthModal";
import { useState, useEffect } from "react";

export default function Home() {
  // Hydration状態を管理
  const [isHydrated, setIsHydrated] = useState(false);
  
  // アニメーション状態管理
  const [displayedText, setDisplayedText] = useState("");
  const [showSubText, setShowSubText] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  
  // 認証モーダル状態管理
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const mainText = "話すことで心が揺れる";
  
  // 認証モーダルのハンドラー
  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  // Hydration完了を検知とタイピングアニメーション開始
  useEffect(() => {
    setIsHydrated(true);
    
    // タイピングアニメーション
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < mainText.length) {
        setDisplayedText(mainText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        // タイピング完了後にサブテキストを表示
        setTimeout(() => {
          setShowSubText(true);
        }, 500);
      }
    }, 120); // 120ms間隔で1文字ずつ表示

    // ボタンの表示
    const timer2 = setTimeout(() => {
      setShowButtons(true);
    }, mainText.length * 120 + 1500); // タイピング完了 + 1.5秒後

    return () => {
      clearInterval(typingInterval);
      clearTimeout(timer2);
    };
  }, [mainText]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900">
      {/* ヘッダー - ナビゲーション */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md" style={{ marginTop: '20px' }}>
        <nav className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0 h-16 flex items-center justify-between header-nav">
          <div className="flex items-center gap-0 -ml-6 header-logo">
            <Image
              src="/icon-logo.png"
              alt="CoachingAI Icon"
              width={50}
              height={50}
              className="h-10 w-10"
            />
            <Logo size="lg" className="ml-2" />
          </div>
          <div className="flex items-center gap-4 header-buttons">
            <button
              onClick={handleAuthClick}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
            >
              ログイン
            </button>
            <button
              onClick={handleAuthClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              無料で始める
            </button>
          </div>
        </nav>
      </header>

      {/* セクション1: ヒーロー */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ paddingTop: '80px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* メインテキスト - タイピングアニメーション */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight min-h-[4rem] flex justify-center items-center">
              {isHydrated && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  <span className="block md:inline">
                    <span className="md:hidden">
                      話すことで心が<br />揺れる
                    </span>
                    <span className="hidden md:inline">
                      {displayedText}
                    </span>
                  </span>
                </span>
              )}
            </h1>
            {/* サブテキスト - フェードイン + スライドアップ */}
            <div className={`transition-all duration-1000 ease-out ${
              showSubText 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                CoachingAIは、あなた専用のAIコーチ
                <br />
                <span className="font-bold text-xl">心  恋愛  仕事</span>  すべての対話を支える存在です
              </p>
            </div>
            {/* ボタン - フェードイン + スケール */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-700 ease-out ${
              showButtons 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-4 scale-95'
            }`}>
              <button
                onClick={handleAuthClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-200 shadow-2xl hover:shadow-indigo-500/50 hover:scale-105"
              >
                無料で始める
              </button>
              <Link
                href="/features"
                className="bg-white hover:bg-gray-50 text-indigo-600 font-bold py-3 px-8 rounded-full text-lg border-2 border-indigo-600 transition-all duration-200 hover:scale-105"
              >
                詳しく見る
              </Link>
            </div>
          </div>
        </div>
      </section>

     
      {/* 認証モーダル */}
      <AuthModal show={showAuthModal} onClose={closeAuthModal} />

      {/* フッター */}
      <footer className="fixed bottom-0 left-0 right-0 py-6 px-4 sm:px-6 lg:px-8 text-gray-700 dark:text-gray-300 backdrop-blur-md">
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
