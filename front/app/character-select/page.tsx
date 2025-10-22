"use client";

import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth/auth-guard";

export default function CharacterSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme");

  const handleCharacterSelect = (characterName: string) => {
    // キャラクターIDを生成
    let characterId = `dummy-${characterName}`;
    
    // テーマとキャラクター名に応じて特別なキャラクターIDを設定
    if (theme === "mental" && characterName === "coach-1") {
      characterId = "dog-character";
    } else if (theme === "love" && characterName === "coach-1") {
      characterId = "cat-character"; // 例：恋愛テーマの1番目は猫
    } else if (theme === "career" && characterName === "coach-1") {
      characterId = "owl-character"; // 例：キャリアテーマの1番目はフクロウ
    }
    
    // ローカルストレージに保存
    localStorage.setItem("coaching_ai_selected_character_id", characterId);
    localStorage.setItem("coaching_ai_default_theme", theme || "mental");
    
    // チャットページに遷移
    router.push("/chat");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <div className="container mx-auto px-4 pt-32 pb-8">
           {/* ヘッダー */}
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center space-x-4">
               <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                 {theme === "mental" ? "あなたを導くパートナーを選びましょう" :
                  theme === "love" ? "一緒に歩むパートナーを選びましょう" :
                  theme === "career" ? "一緒に目標へ進む相棒を見つけましょう" :
                  "あなたのAIコーチを選びましょう"}
               </h1>
             </div>
             
             <div className="flex items-center space-x-2 pt-4">
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

        </div>
      </div>
    </AuthGuard>
  );
}