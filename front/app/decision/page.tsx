"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/auth-guard";

// ローカルストレージのキー
const STORAGE_KEYS = {
  SELECTED_CHARACTER_ID: "coaching_ai_selected_character_id",
  DEFAULT_THEME: "coaching_ai_default_theme",
} as const;

export default function DecisionPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        console.log("Decision page: Starting user status check");
        
        // ローカルストレージからキャラクター選択を確認
        const selectedCharacterId = localStorage.getItem(STORAGE_KEYS.SELECTED_CHARACTER_ID);
        console.log("Decision page: Selected character ID from localStorage:", selectedCharacterId);
        
        // 分岐ロジック: selected_character_id の有無で判定
        if (selectedCharacterId === null) {
          console.log("Decision page: First time user, redirecting to /theme");
          // 初回ユーザー: テーマ選択へ
          router.push("/theme");
        } else {
          console.log("Decision page: Returning user, redirecting to /chat");
          // 既存ユーザー: 前回のコーチで即入室
          router.push("/chat");
        }
      } catch (err) {
        console.error("Decision page error:", err);
        setError("ユーザー情報の確認中にエラーが発生しました");
      }
    };

    checkUserStatus();
  }, [router]);


  // エラー表示（障害時の退避ボタン）
  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-6 mb-6">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                設定の確認に失敗しました
              </h2>
              <p className="text-red-700 dark:text-red-300 text-sm">
                {error}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push("/chat")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                対話へ進む
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                再試行
              </button>
              
              <button
                onClick={() => {
                  // ローカルストレージをクリア
                  localStorage.removeItem("coaching_ai_selected_character_id");
                  localStorage.removeItem("coaching_ai_default_theme");
                  // テーマ選択ページに遷移
                  router.push("/theme");
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                設定をリセット
              </button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // 通常はここに到達しない（リダイレクトされる）
  return null;
}