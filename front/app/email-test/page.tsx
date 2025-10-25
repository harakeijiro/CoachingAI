"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function EmailTestPage() {
  const [status, setStatus] = useState("メール認証テスト中...");
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log("🔍 EmailTest: Component mounted");
    
    const testEmailAuth = async () => {
      try {
        setStatus("メール認証をテスト中...");
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log("🔍 EmailTest: Supabase client created");

        // テスト用のメールアドレスとパスワード
        const testEmail = "test@example.com";
        const testPassword = "testpassword123";

        console.log("🔍 EmailTest: Starting signup test");

        const { data, error } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            emailRedirectTo: "http://localhost:3000/auth/callback",
          },
        });

        console.log("🔍 EmailTest: Signup result", { data, error });
        console.log("🔍 EmailTest: Redirect URL set to:", "http://localhost:3000/auth/callback");

        const info = {
          timestamp: new Date().toISOString(),
          signup: {
            success: !error,
            error: error?.message,
            user_id: data?.user?.id,
            email: data?.user?.email,
            email_confirmed_at: data?.user?.email_confirmed_at,
          },
          redirectUrl: "http://localhost:3000/auth/callback",
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
        console.error("🔍 EmailTest: Error", err);
        setStatus(`予期しないエラー: ${err.message}`);
        setDebugInfo({ error: err.message });
      }
    };

    testEmailAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          メール認証テストページ
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ステータス: {status}
          </h2>
        </div>
        
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
            onClick={() => window.location.href = "/auth/callback"}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            認証コールバックページに移動
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
