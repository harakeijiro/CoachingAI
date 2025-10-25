"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function EmailDebugPage() {
  const [status, setStatus] = useState("メール認証デバッグ中...");
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testEmail, setTestEmail] = useState("");
  const [testPassword, setTestPassword] = useState("");

  const testSignUp = async () => {
    try {
      setStatus("メール認証をテスト中...");
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      console.log("🔍 EmailDebug: Starting signup test");

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: "http://localhost:3000/link-test",
        },
      });

      console.log("🔍 EmailDebug: Signup result", { data, error });

      const info = {
        timestamp: new Date().toISOString(),
        signup: {
          success: !error,
          error: error?.message,
          user_id: data?.user?.id,
          email: data?.user?.email,
          email_confirmed_at: data?.user?.email_confirmed_at,
        },
        redirectUrl: "http://localhost:3000/link-test",
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
      };

      setDebugInfo(info);
      
      if (error) {
        setStatus(`エラー: ${error.message}`);
      } else {
        setStatus("メール送信成功！確認メールをチェックしてください");
      }
    } catch (err) {
      console.error("🔍 EmailDebug: Error", err);
      setStatus(`予期しないエラー: ${err.message}`);
    }
  };

  const checkCurrentAuth = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      const urlParams = new URLSearchParams(window.location.search);
      
      const info = {
        timestamp: new Date().toISOString(),
        url: {
          href: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
        },
        urlParams: {
          code: urlParams.get("code"),
          error: urlParams.get("error"),
        },
        session: {
          exists: !!sessionData.session,
          user_id: sessionData.session?.user?.id,
          email: sessionData.session?.user?.email,
          email_confirmed_at: sessionData.session?.user?.email_confirmed_at,
          error: sessionError?.message,
        },
        user: {
          exists: !!userData.user,
          user_id: userData.user?.id,
          email: userData.user?.email,
          email_confirmed_at: userData.user?.email_confirmed_at,
          error: userError?.message,
        },
      };

      setDebugInfo(info);
      setStatus("認証状態確認完了");
    } catch (err) {
      console.error("🔍 EmailDebug: Auth check error", err);
      setStatus(`認証チェックエラー: ${err.message}`);
    }
  };

  useEffect(() => {
    checkCurrentAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          メール認証デバッグページ
        </h1>
        
        {/* メール認証テスト */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            メール認証テスト
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                テスト用メールアドレス
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                テスト用パスワード
              </label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="6文字以上"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={testSignUp}
              disabled={!testEmail || !testPassword}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              メール認証をテスト
            </button>
          </div>
        </div>

        {/* ステータス */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ステータス: {status}
          </h2>
        </div>
        
        {/* デバッグ情報 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            デバッグ情報
          </h2>
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={checkCurrentAuth}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            認証状態を再確認
          </button>
          
          <button
            onClick={() => window.location.href = "/"}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-4"
          >
            トップページに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
