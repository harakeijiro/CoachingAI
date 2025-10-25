"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log("🔍 DebugAuth: Starting debug check");

        // セッション情報を取得
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        // ユーザー情報を取得
        const { data: userData, error: userError } = await supabase.auth.getUser();

        // URL情報
        const urlParams = new URLSearchParams(window.location.search);
        
        const info = {
          timestamp: new Date().toISOString(),
          url: {
            href: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
          },
          urlParams: {
            code: urlParams.get("code"),
            error: urlParams.get("error"),
            message: urlParams.get("message"),
          },
          session: {
            exists: !!sessionData.session,
            user_id: sessionData.session?.user?.id,
            email: sessionData.session?.user?.email,
            email_confirmed_at: sessionData.session?.user?.email_confirmed_at,
            created_at: sessionData.session?.user?.created_at,
            error: sessionError?.message,
          },
          user: {
            exists: !!userData.user,
            user_id: userData.user?.id,
            email: userData.user?.email,
            email_confirmed_at: userData.user?.email_confirmed_at,
            created_at: userData.user?.created_at,
            error: userError?.message,
          },
          environment: {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          }
        };

        console.log("🔍 DebugAuth: Debug info", info);
        setDebugInfo(info);
        setIsLoading(false);
      } catch (error) {
        console.error("🔍 DebugAuth: Error", error);
        setDebugInfo({ error: error.message });
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          認証デバッグ情報
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
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
