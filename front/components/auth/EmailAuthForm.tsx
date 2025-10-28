"use client";

/**
 * メール認証フォームコンポーネント
 * メールアドレスとパスワードを使った登録・ログイン機能を提供
 */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AUTH_CONFIG } from "@/lib/utils/auth-config";

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
      const supabase = createClient();

      // まず既存ユーザーかどうかを確認
      const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (existingUser && !checkError) {
        // 既存ユーザーの場合：メッセージを表示せずに直接判定画面に遷移
        console.log("Existing user login successful, redirecting to decision page");
        window.location.href = "/decision";
        return;
      }

      // 既存ユーザーでない場合、新規登録を試行
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: AUTH_CONFIG.callbackUrlEmail,
        },
      });

      console.log("SignUp result:", { data: signUpData, error, email });
      console.log("SignUp redirect URL:", AUTH_CONFIG.callbackUrlEmail);
      console.log("SignUp environment:", {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });
      console.log("SignUp options:", {
        emailRedirectTo: AUTH_CONFIG.callbackUrlEmail
      });

      if (error) {
        console.error("SignUp error:", error);
        
        // 既存メールアドレスの場合
        if (error.message.includes('already registered') || 
            error.message.includes('User already registered')) {
          onError?.("このメールアドレスは既に登録されています。パスワードでログインするか、Google/Microsoftでログインしてください。");
        } else {
          onError?.(error.message);
        }
      } else if (signUpData?.user) {
        // ユーザーが存在する場合
        const identities = signUpData.user.identities || [];
        
        // identitiesが空 = 既存ユーザー（OAuth登録済み）の可能性
        if (identities.length === 0) {
          console.log("Existing OAuth user detected (empty identities)");
          onError?.("このメールアドレスは既にGoogle/Microsoftで登録されています。同じ方法でログインしてください。");
          return;
        }
        
        // 新規登録成功時のみメッセージ表示
        console.log("SignUp success, email sent to:", email);
        onSuccess?.("確認メールを送信しました");
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
    <div className="space-y-4 max-w-64 mx-auto">
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
