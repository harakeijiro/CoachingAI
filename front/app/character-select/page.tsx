"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import { requestMicrophonePermission, getMicrophoneErrorType, getMicrophoneErrorMessage } from "@/lib/utils/microphone-permission";

export default function CharacterSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme");
  
  // マイク許可モーダルの状態管理
  const [showMicModal, setShowMicModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const handleCharacterSelect = async (characterName: string) => {
    // 選択されたキャラクターを保存
    setSelectedCharacter(characterName);
    
    // マイク許可モーダルを表示
    setShowMicModal(true);
  };

  const handleMicPermissionRequest = async () => {
    setIsRequestingMic(true);
    setMicError(null);

    // 共通のマイク許可処理を使用
    const result = await requestMicrophonePermission({
      stopAfterPermission: true,
      errorMessage: "マイクの許可が必要です。"
    });

    if (result.success) {
      // キャラクターIDを生成（汎用化）
      const characterId = generateCharacterId(theme, selectedCharacter);
      
      // ローカルストレージに保存
      localStorage.setItem("coaching_ai_selected_character_id", characterId);
      localStorage.setItem("coaching_ai_default_theme", theme || "mental");
      
      // モーダルを閉じてチャット画面に遷移
      setShowMicModal(false);
      router.push("/chat");
    } else {
      // エラーの種類に応じたメッセージを設定
      const errorType = getMicrophoneErrorType(new Error(result.error));
      const errorMessage = getMicrophoneErrorMessage(errorType);
      setMicError(errorMessage);
    }

    setIsRequestingMic(false);
  };

  // キャラクターID生成の汎用化
  const generateCharacterId = (theme: string | null, characterName: string): string => {
    // テーマとキャラクター名に基づいてIDを生成
    const themeCharacterMap: Record<string, Record<string, string>> = {
      mental: {
        "coach-1": "dog-character",
        "coach-2": "mental-cat-character", // 将来の拡張
        "coach-3": "mental-owl-character"  // 将来の拡張
      },
      love: {
        "coach-1": "cat-character",
        "coach-2": "love-mike-character",  // 将来の拡張
        "coach-3": "love-dog-character"    // 将来の拡張
      },
      career: {
        "coach-1": "owl-character",
        "coach-2": "career-kent-character", // 将来の拡張
        "coach-3": "career-human-character"  // 将来の拡張
      }
    };

    return themeCharacterMap[theme || "mental"]?.[characterName] || `dummy-${characterName}`;
  };

  const handleMicPermissionDenied = () => {
    // モーダルを閉じる（キャラクター選択画面に戻る）
    setShowMicModal(false);
    setMicError(null);
  };

  const handleContinueWithoutMic = () => {
    // キャラクターIDを生成
    let characterId = `dummy-${selectedCharacter}`;
    
    if (theme === "mental" && selectedCharacter === "coach-1") {
      characterId = "dog-character";
    } else if (theme === "love" && selectedCharacter === "coach-1") {
      characterId = "cat-character";
    } else if (theme === "career" && selectedCharacter === "coach-1") {
      characterId = "owl-character";
    }
    
    // ローカルストレージに保存
    localStorage.setItem("coaching_ai_selected_character_id", characterId);
    localStorage.setItem("coaching_ai_default_theme", theme || "mental");
    
    // モーダルを閉じてチャット画面に遷移
    setShowMicModal(false);
    router.push("/chat");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900">
        <div className="container mx-auto px-4 pt-48 pb-8">
           {/* ヘッダー - タイトルのみ中央揃え */}
           <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 animate-[fadeInUp_2s_ease-out_forwards] drop-shadow-lg">
               {theme === "mental" ? "あなたのパートナーを選びましょう" :
                theme === "love" ? "一緒に歩むパートナーを選びましょう" :
                theme === "career" ? "一緒に目標へ進む相棒を見つけましょう" :
                "あなたのAIコーチを選びましょう"}
             </h1>
           </div>

          {/* キャラクター選択 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200"
                onClick={() => handleCharacterSelect(`coach-${i}`)}
              >
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {theme === "mental" && i === 1 ? "🐕" : 
                       theme === "love" && i === 1 ? "🐱" : 
                       theme === "career" && i === 1 ? "🦉" : "🤖"}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {theme === "mental" ? "メンタル" : 
                       theme === "love" ? "恋愛" : 
                       theme === "career" ? "キャリア" : "AI"}コーチ {i}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {theme === "mental" && i === 1 ? "ワンちゃんコーチ" :
                     theme === "love" && i === 1 ? "ニャンちゃんコーチ" :
                     theme === "career" && i === 1 ? "フクロウコーチ" :
                     theme === "mental" ? "メンタル" : 
                     theme === "love" ? "恋愛" : 
                     theme === "career" ? "キャリア" : "AI"}コーチ {i}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {theme === "mental" && i === 1 ? "癒しのAIコーチ" :
                     theme === "love" && i === 1 ? "恋愛のAIコーチ" :
                     theme === "career" && i === 1 ? "賢者のAIコーチ" :
                     "AIコーチ"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* テーマ表示とテーマ変更ボタン - カードの下に配置 */}
          <div className="flex items-center justify-end space-x-2">
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-medium">
              {theme === "mental" ? "メンタル・自己理解" : 
               theme === "love" ? "恋愛・人間関係" : 
               theme === "career" ? "キャリア・目標達成" : "テーマ"}
            </span>
            <button
              onClick={() => router.push("/theme")}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 text-sm font-medium"
            >
              テーマを変更
            </button>
          </div>

        </div>
        
        {/* マイク許可モーダル */}
        {showMicModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                {/* マイクアイコン */}
                <div className="text-6xl mb-4">🎤</div>
                
                {/* タイトル */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  マイクの許可が必要です
                </h2>
                
                
                {/* HTTPS警告 */}
                {window.location.protocol !== 'https:' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                      <div className="text-yellow-500 mr-2">⚠️</div>
                      <div>
                        <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium mb-1">
                          HTTPS接続が必要です
                        </p>
                        <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                          マイクの使用にはHTTPS接続が必要です。現在はHTTP接続のため、マイクが使用できません。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* トラブルシューティングガイド */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <div className="flex items-start">
                    <div className="text-blue-500 mr-2">💡</div>
                    <div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-2">
                        マイクの許可を有効にする方法
                      </p>
                      <div className="text-blue-600 dark:text-blue-400 text-xs space-y-1">
                        <p><strong>Chrome:</strong> アドレスバー左の🔒 → サイトの設定 → マイクを許可</p>
                        <p><strong>Safari:</strong> Safari → 環境設定 → ウェブサイト → マイクを許可</p>
                        <p><strong>Firefox:</strong> アドレスバー左の🔒 → 権限 → マイクを許可</p>
                        <p><strong>システム:</strong> macOS/Windowsのプライバシー設定でマイクを許可</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* エラーメッセージ */}
                {micError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <div className="text-red-500 mr-2">⚠️</div>
                      <div>
                        <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">
                          現在マイクの許可の実装中です
                        </p>
                        <p className="text-red-600 dark:text-red-400 text-sm">
                          マイクの許可を有効にする方法をご覧ください
                        </p>
                        <div className="mt-3">
                          <button
                            onClick={handleMicPermissionRequest}
                            disabled={isRequestingMic}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
                          >
                            {isRequestingMic ? "確認中..." : "再試行"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ボタン */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleMicPermissionRequest}
                      disabled={isRequestingMic}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      {isRequestingMic ? "許可を確認中..." : "マイクを許可する"}
                    </button>
                    
                    <button
                      onClick={handleMicPermissionDenied}
                      disabled={isRequestingMic}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                  
                  {/* 代替手段 */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <button
                      onClick={handleContinueWithoutMic}
                      disabled={isRequestingMic}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      テキストのみで続行する
                    </button>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}