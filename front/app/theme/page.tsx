"use client";

import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth/auth-guard";

export default function ThemePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSettings = searchParams.get("from") === "settings";

  const handleThemeSelect = (theme: string) => {
    const url = `/character-select?theme=${theme}${fromSettings ? "&from=settings" : ""}`;
    router.push(url);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-32">
          {/* ヘッダー */}
          <div className="text-center mb-8 mt-24">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              テーマを選んでください
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              今のあなたに一番近い話題から始めましょう
            </p>
          </div>

          {/* テーマカード */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* メンタル・自己理解 */}
            <div
              className="group cursor-pointer"
              onClick={() => handleThemeSelect("mental")}
              role="button"
              tabIndex={0}
              aria-label="メンタル・自己理解を選ぶ"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleThemeSelect("mental");
                }
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900 dark:to-emerald-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌱</div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      メンタル
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      自己理解
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    心の健康や自己理解について話し合いましょう
                  </p>
                </div>
              </div>
            </div>

            {/* 恋愛・人間関係 */}
            <div
              className="group cursor-pointer"
              onClick={() => handleThemeSelect("love")}
              role="button"
              tabIndex={0}
              aria-label="恋愛・人間関係を選ぶ"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleThemeSelect("love");
                }
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-pink-100 to-rose-200 dark:from-pink-900 dark:to-rose-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💌</div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      恋愛
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      人間関係
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    恋愛や人間関係の悩みを一緒に考えましょう
                  </p>
                </div>
              </div>
            </div>

            {/* キャリア・目標達成 */}
            <div
              className="group cursor-pointer"
              onClick={() => handleThemeSelect("career")}
              role="button"
              tabIndex={0}
              aria-label="キャリア・目標達成を選ぶ"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleThemeSelect("career");
                }
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💼</div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      キャリア
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      目標達成
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    キャリアや目標達成について相談しましょう
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
