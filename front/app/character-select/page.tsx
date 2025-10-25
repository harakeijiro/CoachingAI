"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import { requestMicrophonePermission, checkMicrophonePermissionState } from "@/lib/utils/microphone-permission";

export default function CharacterSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme") || "mental";

  // UI状態
  const [showMicModal, setShowMicModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // キャラが選ばれたら権限状態をチェックして適切な処理を行う
  const handleCharacterSelect = async (charName: string) => {
    // 現在の権限だけ見る（マイクを実際に起動しない）
    let micState: "granted" | "denied" | "prompt" = "prompt";

    try {
      micState = await checkMicrophonePermissionState();
    } catch {
      // SafariなどPermissions APIがない場合は "prompt" 扱いで落とす
      micState = "prompt";
    }

    if (micState === "granted") {
      // すでに許可済み → モーダル出さないで即遷移
      localStorage.setItem(
        "coaching_ai_selected_character_id",
        generateCharacterId(theme, charName)
      );
      localStorage.setItem("coaching_ai_default_theme", theme);
      router.push("/chat");
      return;
    }

    if (micState === "prompt") {
      // まだ聞いてない人 → そのタップの中で直接getUserMedia()を呼ぶ
      try {
        // ★ここでブラウザの許可ダイアログが即出る
        const result = await requestMicrophonePermission();
        
        if (result.success && result.stream) {
          // 許可成功したらそのまま遷移
          localStorage.setItem(
            "coaching_ai_selected_character_id",
            generateCharacterId(theme, charName)
          );
          localStorage.setItem("coaching_ai_default_theme", theme);
          router.push("/chat");
          return;
        } else {
          // 許可失敗した場合
          setSelectedCharacter(charName);
          setShowMicModal(true);
          setMicError(result.error || "マイクの許可が必要です");
          return;
        }
      } catch (err: unknown) {
        console.error("マイク許可リクエスト失敗:", err);
        // エラーが発生した場合はモーダルを表示
        setSelectedCharacter(charName);
        setShowMicModal(true);
        setMicError("マイクの許可が必要です");
        return;
      }
    }

    if (micState === "denied") {
      // 完全拒否されてる人 → キャラクター情報を保存してチャット画面に遷移
      localStorage.setItem(
        "coaching_ai_selected_character_id",
        generateCharacterId(theme, charName)
      );
      localStorage.setItem("coaching_ai_default_theme", theme);
      
      // 注意メッセージを表示してから遷移
      alert(
        "マイクがブラウザ側でブロックされています。\n" +
          "テキストでの会話は可能ですが、音声機能は使用できません。\n" +
          "音声機能を使用したい場合は、アドレスバーから「マイクを許可」に変更して、ページを更新してください。"
      );
      
      router.push("/chat");
      return;
    }
  };

  // 実際にマイク許可を取りに行く（←このクリックでブラウザに許可ポップアップが出る）
  const handleAllowMicClick = async () => {
    setIsRequestingMic(true);
    setMicError(null);

    const result = await requestMicrophonePermission();

    setIsRequestingMic(false);

    if (result.success && result.stream) {
      // 好きな形で保存する：
      // 1. ローカルストレージにキャラ情報
      localStorage.setItem(
        "coaching_ai_selected_character_id",
        generateCharacterId(theme, selectedCharacter)
      );
      localStorage.setItem("coaching_ai_default_theme", theme);

      // 2. マイクのstreamをグローバルに保持したいならZustand/Contextに入れる想定
      //    ここでは説明だけ。実装例は後述します。
      // micStore.setState({ stream: result.stream });

      // モーダル閉じる & /chat へ移動
      setShowMicModal(false);
      router.push("/chat");

      return;
    }

    // 失敗した場合
    if (!result.success && result.error) {
      setMicError(result.error);
    }
  };

  // マイクなしで続ける
  const handleContinueWithoutMic = () => {
    localStorage.setItem(
      "coaching_ai_selected_character_id",
      generateCharacterId(theme, selectedCharacter)
    );
    localStorage.setItem("coaching_ai_default_theme", theme);

    setShowMicModal(false);
    router.push("/chat");
  };

  const generateCharacterId = (theme: string, charName: string) => {
    // ここはあなたのロジックをそのままシンプル化
    if (theme === "mental" && charName === "coach-1") return "dog-character";
    if (theme === "love" && charName === "coach-1") return "cat-character";
    if (theme === "career" && charName === "coach-1") return "owl-character";
    return `dummy-${charName}`;
  };

  return (
    <AuthGuard>
      <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 animate-[fadeInUp_2s_ease-out_forwards] drop-shadow-lg">
              {theme === "mental" ? "あなたのパートナーを選びましょう" :
               theme === "love" ? "一緒に歩むパートナーを選びましょう" :
               theme === "career" ? "一緒に目標へ進む相棒を見つけましょう" :
               "あなたのAIコーチを選びましょう"}
            </h1>
          </div>

          {/* キャラ一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <button
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
              </button>
            ))}
          </div>

          {/* テーマ表示とテーマ変更ボタン */}
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
              <div className="text-5xl mb-3">🎤</div>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                マイクの許可をお願いします
              </h2>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed whitespace-pre-line">
                会話でやりとりするにはマイクの使用許可が必要です。
                {"\n"}
                「マイクを許可する」を押すと、ブラウザが許可ダイアログを表示します。
              </p>

              {micError && (
                <div className="text-left text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4 whitespace-pre-line">
                  {micError}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAllowMicClick}
                  disabled={isRequestingMic}
                  className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isRequestingMic ? "許可を確認中..." : "マイクを許可する"}
                </button>

                <button
                  onClick={handleContinueWithoutMic}
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                >
                  マイクなしで続ける
                </button>

                <button
                  onClick={() => setShowMicModal(false)}
                  className="w-full text-gray-500 dark:text-gray-400 text-xs underline"
                >
                  戻る
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}