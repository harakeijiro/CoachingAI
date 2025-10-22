"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function DatabaseTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const results: string[] = [];
      
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 1. 認証状態の確認
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        results.push(`認証状態: ${user ? `ログイン済み (${user.id})` : '未ログイン'}`);
        if (authError) {
          results.push(`認証エラー: ${authError.message}`);
        }

        // 2. users テーブルの構造確認
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", user.id)
            .single();
          
          if (profileError) {
            results.push(`プロファイル取得エラー: ${profileError.message}`);
            results.push(`エラーコード: ${profileError.code}`);
            results.push(`エラー詳細: ${JSON.stringify(profileError)}`);
          } else {
            results.push(`プロファイル取得成功: ${JSON.stringify(profile)}`);
          }
        }

        // 3. characters テーブルの確認
        if (user) {
          const { data: characters, error: charactersError } = await supabase
            .from("characters")
            .select("*")
            .eq("user_id", user.id)
            .limit(5);
          
          if (charactersError) {
            results.push(`キャラクター取得エラー: ${charactersError.message}`);
          } else {
            results.push(`キャラクター数: ${characters?.length || 0}`);
            if (characters && characters.length > 0) {
              results.push(`最初のキャラクター: ${JSON.stringify(characters[0])}`);
            }
          }
        }

        // 4. テーブル一覧の確認
        const { data: tables, error: tablesError } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public");
        
        if (tablesError) {
          results.push(`テーブル一覧取得エラー: ${tablesError.message}`);
        } else {
          results.push(`利用可能なテーブル: ${tables?.map(t => t.table_name).join(", ")}`);
        }

      } catch (error) {
        results.push(`予期しないエラー: ${error}`);
      }

      setTestResults(results);
      setIsLoading(false);
    };

    runTests();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">データベーステスト実行中...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">データベース接続テスト結果</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <pre className="whitespace-pre-wrap text-sm">
            {testResults.join("\n")}
          </pre>
        </div>
        <div className="mt-4">
          <a 
            href="/decision" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            /decision ページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
