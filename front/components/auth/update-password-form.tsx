"use client";

import { useState, FormEvent } from "react";
import { updatePassword } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    // クライアント側のバリデーション
    if (!password) {
      setError("新しいパスワードを入力してください");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上である必要があります");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      setIsLoading(false);
      return;
    }

    try {
      const result = await updatePassword({ password });

      if (result.success) {
        setMessage(result.message);
        // フォームをクリア
        setPassword("");
        setConfirmPassword("");
        // 3秒後にログイン画面にリダイレクト
        setTimeout(() => {
          router.push("/signin");
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("予期しないエラーが発生しました");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          新しいパスワードを設定
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          新しいパスワードを入力してください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            新しいパスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            disabled={isLoading}
            placeholder="6文字以上"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            パスワード（確認）
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            disabled={isLoading}
            placeholder="もう一度入力してください"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {message && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-600 dark:text-green-400">
              {message}
            </p>
            <p className="text-xs text-green-500 dark:text-green-500 mt-1">
              まもなくログイン画面にリダイレクトします...
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "更新中..." : "パスワードを更新"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/signin"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline"
        >
          ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}
