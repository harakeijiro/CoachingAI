"use client";

import { useState } from "react";
import Link from "next/link";
import SocialLoginButtons from "@/components/auth/social-login-buttons";

export default function SignUpPage() {
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage("");
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              CoachingAI
            </h1>
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            アカウント作成
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            無料で始めて、あなた専用のAIコーチと対話しましょう
          </p>
        </div>

        {/* メッセージ表示 */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              {successMessage}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          </div>
        )}

        {/* メインコンテンツ（ソーシャルログインのみ） */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
          <SocialLoginButtons onSuccess={handleSuccess} onError={handleError} />
        </div>

        {/* ログインリンク */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            すでにアカウントをお持ちですか？{" "}
            <Link
              href="/auth/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
