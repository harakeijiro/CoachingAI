"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface EmailAuthFormProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function EmailAuthForm({
  onSuccess,
  onError,
}: EmailAuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      onError?.("メールアドレスを入力してください");
      return;
    }
    // メールアドレス形式の簡単なバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      onError?.("正しいメールアドレスを入力してください");
      return;
    }
    setShowPasswordFields(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      onError?.("パスワードを入力してください");
      return;
    }
    if (password !== confirmPassword) {
      onError?.("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      onError?.("パスワードは6文字以上で入力してください");
      return;
    }

    setIsLoading(true);
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            // Supabase認証設定
            detectSessionInUrl: true,
            persistSession: true,
            autoRefreshToken: true,
            flowType: 'pkce', // implicitからpkceに変更してpopup.jsエラーを解決
            debug: false
          },
          global: {
            headers: {
              'X-Client-Info': 'supabase-js-web'
            }
          }
        }
      );

      // まず既存ユーザーかどうかを確認
      const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (existingUser && !checkError) {
        // 既存ユーザーの場合：メッセージを表示せずに直接テーマ選択画面に遷移
        console.log("Existing user login successful, redirecting to decision page");
        window.location.href = "/decision";
        return;
      }

      // 既存ユーザーでない場合、新規登録を試行
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "http://localhost:3000/auth/callback",
        },
      });

      console.log("SignUp result:", { error, email });
      console.log("SignUp redirect URL:", "http://localhost:3000/auth/callback");
      console.log("SignUp environment:", {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });
      console.log("SignUp options:", {
        emailRedirectTo: "http://localhost:3000/auth/callback"
      });

      if (error) {
        console.error("SignUp error:", error);
        onError?.(error.message);
      } else {
        console.log("SignUp success, email sent to:", email);
        onSuccess?.("確認メールを送信しました。メール内の\nリンクをクリックしてください。");
        // フォームをリセット
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setShowPasswordFields(false);
      }
    } catch (error) {
      console.error("SignUp error:", error);
      onError?.("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      {/* 区切り線と「または」 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            または
          </span>
        </div>
      </div>

      {/* メールアドレス入力フォーム */}
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレスを入力"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={showPasswordFields}
          />
        </div>

        {!showPasswordFields && (
          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            続行
          </button>
        )}
      </form>

      {/* パスワード入力フォーム */}
      {showPasswordFields && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              パスワード（確認）
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder=""
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "登録中..." : "登録"}
          </button>
        </form>
      )}
    </div>
  );
}
