"use client";

import { useEffect, useState } from "react";

export default function CallbackTestPage() {
  const [status, setStatus] = useState("認証コールバックページテスト中...");
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log("🔍 CallbackTest: Component mounted");
    
    const testCallback = () => {
      try {
        setStatus("認証コールバックページをテスト中...");
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");
        
        const info = {
          timestamp: new Date().toISOString(),
          url: {
            href: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
          },
          params: {
            code: code,
            error: error,
            allParams: Object.fromEntries(urlParams.entries()),
          },
          environment: {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          }
        };

        console.log("🔍 CallbackTest: Debug info", info);
        setDebugInfo(info);
        
        if (code) {
          setStatus("認証コードが見つかりました！");
        } else if (error) {
          setStatus(`エラーが検出されました: ${error}`);
        } else {
          setStatus("認証コードが見つかりません");
        }
      } catch (err) {
        console.error("🔍 CallbackTest: Error", err);
        setStatus(`予期しないエラー: ${err.message}`);
        setDebugInfo({ error: err.message });
      }
    };

    testCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          認証コールバックページテスト
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
            onClick={() => window.location.href = "/email-test"}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            メール認証テストページに移動
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
