"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LinkTestPage() {
  const [status, setStatus] = useState("リンクテスト中...");
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log("🔍 LinkTest: Component mounted");
    
    const testLink = async () => {
      try {
        setStatus("リンク処理をテスト中...");
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log("🔍 LinkTest: Starting link test");

        // URL情報を取得
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");
        const type = urlParams.get("type");

        console.log("🔍 LinkTest: URL params", { 
          code: !!code, 
          error,
          type,
          fullUrl: window.location.href 
        });

        if (error) {
          setStatus(`エラーが検出されました: ${error}`);
          setDebugInfo({
            error: error,
            url: window.location.href,
            timestamp: new Date().toISOString()
          });
          return;
        }

        if (!code) {
          setStatus("認証コードが見つかりません");
          setDebugInfo({
            message: "No code parameter found",
            url: window.location.href,
            timestamp: new Date().toISOString()
          });
          return;
        }

        setStatus("認証コードを処理中...");

        // 認証コードを処理
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        console.log("🔍 LinkTest: Exchange result", { 
          hasData: !!data, 
          hasUser: !!data?.user, 
          hasSession: !!data?.session,
          error: exchangeError?.message 
        });

        if (exchangeError) {
          setStatus(`認証コード処理エラー: ${exchangeError.message}`);
          setDebugInfo({
            exchangeError: exchangeError.message,
            code: code,
            url: window.location.href,
            timestamp: new Date().toISOString()
          });
          return;
        }

        if (data.user && data.session) {
          setStatus("認証成功！");
          setDebugInfo({
            success: true,
            user: {
              id: data.user.id,
              email: data.user.email,
              email_confirmed_at: data.user.email_confirmed_at,
            },
            session: {
              access_token: !!data.session.access_token,
              refresh_token: !!data.session.refresh_token,
            },
            timestamp: new Date().toISOString()
          });
        } else {
          setStatus("認証データが不完全です");
          setDebugInfo({
            message: "Incomplete auth data",
            data: data,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("🔍 LinkTest: Error", err);
        setStatus(`予期しないエラー: ${err.message}`);
        setDebugInfo({
          error: err.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    testLink();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          リンクテストページ
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
