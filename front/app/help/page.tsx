"use client";

import Link from "next/link";
import { useState } from "react";

export default function HelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "アカウント登録ができません",
      answer: "メールアドレスを確認し、スパムフォルダもご確認ください。\nそれでも解決しない場合は、お問い合わせからご連絡ください。"
    },
    {
      question: "無料プランと有料プランの違いは？",
      answer: "無料プランでは1日あたりの利用回数に制限があります。\n有料プランでは制限なしで全機能をご利用いただけます。"
    },
    {
      question: "会話内容は保存されていますか？",
      answer: "会話内容はサービス品質向上のために一定期間（退会後1ヶ月まで）保存されます。\n詳細はプライバシーポリシーをご確認ください。"
    },
    {
      question: "AIの返答が正しくない場合は？",
      answer: "AIは外部APIを使用しており、完全な正確性を保証するものではありません。\n重要な判断は必ずご自身の責任で行ってください。"
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md" style={{ marginTop: '20px' }}>
        <nav className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0 h-16 flex items-center justify-between">
          <div className="flex items-center gap-0 -ml-6">
            <Link href="/" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              トップに戻る
            </Link>
          </div>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-8 shadow-lg">
            {/* ページタイトル */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">ヘルプセンター</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">「困ったときは、ここから。」</p>
            </div>

            {/* よくある質問（FAQ） */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">よくある質問</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-6 py-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">Q. {faq.question}</span>
                      <svg
                        className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                          openFAQ === index ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openFAQ === index && (
                      <div className="px-6 py-4 bg-white dark:bg-gray-800">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          A. {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* お問い合わせ案内 */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">それでも解決しない場合は</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                メール（〇〇）までご連絡ください。
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ※フォームが未実装の場合でも、「近日追加予定」表記で対応可。
              </p>
            </div>

            {/* ボタン導線 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl text-center"
              >
                トップに戻る
              </Link>
              <Link
                href="/auth"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl text-center"
              >
                CoachingAIをはじめる
              </Link>
              <a
                href="mailto:contact@coachingai.com"
                className="bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-3 px-6 rounded-full border-2 border-indigo-600 transition-all duration-200 hover:scale-105 text-center"
              >
                お問い合わせ
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
