"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function TestAuthPage() {
  const [status, setStatus] = useState("テスト中...");
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log("🔍 TestAuth: Component mounted");
    
    const testAuth = async () => {
      try {
        console.log("🔍 TestAuth: Starting test");
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log("🔍 TestAuth: Supabase client created");

        // URL情報を取得
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        console.log("🔍 TestAuth: URL params", { 
          code: !!code, 
          error,
          fullUrl: window.location.href 
        });

        // セッション情報を取得
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        // ユーザー情報を取得
        const { data: userData, error: userError } = await supabase.auth.getUser();

        const info = {
          timestamp: new Date().toISOString(),
          url: {
            href: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
          },
          urlParams: {
            code: code,
            error: error,
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

        console.log("🔍 TestAuth: Debug info", info);
        setDebugInfo(info);
        setStatus("テスト完了");
      } catch (error) {
        console.error("🔍 TestAuth: Error", error);
        setDebugInfo({ error: error.message });
        setStatus("テストエラー");
      }
    };

    testAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          認証テストページ
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
            onClick={() => window.location.href = "/theme"}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            テーマページに移動
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
