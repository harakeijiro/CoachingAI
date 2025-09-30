"use client";

import { useState, FormEvent } from "react";
import { signUp } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    // クライアント側のバリデーション
    if (!email || !password || !passwordConfirm) {
      setError("すべての項目を入力してください");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上である必要があります");
      setIsLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setError("パスワードが一致しません");
      setIsLoading(false);
      return;
    }

    try {
      // メールアドレスから名前を自動生成（@より前の部分）
      const name = email.split("@")[0];

      const result = await signUp({
        email,
        password,
        name,
      });

      if (result.success) {
        setMessage(result.message);
        // 成功後、対話画面へリダイレクト
        setTimeout(() => {
          router.push("/chat");
        }, 2000);
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            disabled={isLoading}
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            パスワード
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
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            6文字以上で入力してください
          </p>
        </div>

        <div>
          <label
            htmlFor="passwordConfirm"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            パスワード（確認）
          </label>
          <input
            id="passwordConfirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            disabled={isLoading}
            placeholder="パスワードを再入力"
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
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "登録中..." : "新規登録"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          すでにアカウントをお持ちですか？{" "}
          <a
            href="/signin"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline"
          >
            ログイン
          </a>
        </p>
      </div>
    </div>
  );
}
