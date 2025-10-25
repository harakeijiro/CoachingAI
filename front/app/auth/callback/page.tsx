"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  console.log("AuthCallback: Component mounted");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("AuthCallback: Starting authentication callback process");
        console.log("AuthCallback: Current URL:", window.location.href);
        console.log("AuthCallback: URL search params:", window.location.search);
        
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
              debug: true // デバッグを有効化
            },
            global: {
              headers: {
                'X-Client-Info': 'supabase-js-web'
              }
            }
          }
        );

        // URLから認証コードを取得
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        console.log("AuthCallback: URL parameters:", { code: code ? "PRESENT" : "NOT PRESENT", error });

        if (error) {
          console.error("AuthCallback: Error parameter found:", error);
          setErrorMessage("認証エラーが発生しました。もう一度登録してください。");
          return;
        }

        if (!code) {
          console.error("AuthCallback: No code parameter found");
          setErrorMessage("認証コードが見つかりません。もう一度登録してください。");
          return;
        }

        console.log("AuthCallback: Processing authentication code");

        // PKCEエラーを完全に無視して、認証成功時のみテーマ画面にリダイレクト
        try {
          console.log("AuthCallback: Starting authentication process");
          
          // まず現在のセッションを確認
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          console.log("AuthCallback: Initial session check:", {
            hasSession: !!sessionData.session,
            userId: sessionData.session?.user?.id,
            error: sessionError?.message
          });
          
          if (sessionData.session && sessionData.session.user) {
            console.log("AuthCallback: Session found, validating session");
            
            // セッションの有効性を確認
            if (!sessionData.session.access_token || !sessionData.session.refresh_token) {
              console.error("AuthCallback: Invalid initial session tokens");
              setErrorMessage("認証セッションが無効です。もう一度登録してください。");
              return;
            }
            
            // セッションの有効期限を確認
            const now = Math.floor(Date.now() / 1000);
            if (sessionData.session.expires_at && sessionData.session.expires_at < now) {
              console.error("AuthCallback: Initial session expired");
              setErrorMessage("認証セッションが期限切れです。もう一度登録してください。");
              return;
            }
            
            console.log("AuthCallback: Session validated, redirecting to /decision");
            setTimeout(() => {
              window.location.replace("/decision");
            }, 1000);
            return;
          }

          // セッションがない場合は、認証コードを処理
          console.log("AuthCallback: No session found, processing auth code");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          console.log("AuthCallback: Code exchange result:", {
            hasUser: !!data.user,
            hasSession: !!data.session,
            error: error?.message
          });

          if (error) {
            console.error("Auth callback: Code exchange error:", error);
            
            // 期限切れや無効なコードのエラーをチェック
            if (error.message.includes("expired") || 
                error.message.includes("invalid") ||
                error.message.includes("code verifier") || 
                error.message.includes("PKCE") || 
                error.message.includes("invalid request") ||
                error.message.includes("code challenge") ||
                error.message.includes("bad_code_verifier") ||
                error.message.includes("Cannot read properties of null") ||
                error.message.includes("reading")) {
              
              // 期限切れや無効なコードの場合はエラーメッセージを表示
              if (error.message.includes("expired") || error.message.includes("invalid")) {
                setErrorMessage("リンクが切れています。もう一度登録してください。");
                return;
              }
              
              // PKCEエラーの場合は、ユーザーが実際に登録されているかチェック
              // 少し待ってからセッションを再確認
              console.log("Auth callback: PKCE error detected, retrying session check");
              await new Promise(resolve => setTimeout(resolve, 2000));
              const { data: retrySessionData } = await supabase.auth.getSession();
              
              console.log("Auth callback: Retry session check:", {
                hasSession: !!retrySessionData.session,
                userId: retrySessionData.session?.user?.id
              });
              
              if (retrySessionData.session && retrySessionData.session.user) {
                console.log("Auth callback: Session found on retry, validating session");
                
                // セッションの有効性を確認
                if (!retrySessionData.session.access_token || !retrySessionData.session.refresh_token) {
                  console.error("Auth callback: Invalid retry session tokens");
                  setErrorMessage("認証セッションが無効です。もう一度登録してください。");
                  return;
                }
                
                // セッションの有効期限を確認
                const now = Math.floor(Date.now() / 1000);
                if (retrySessionData.session.expires_at && retrySessionData.session.expires_at < now) {
                  console.error("Auth callback: Retry session expired");
                  setErrorMessage("認証セッションが期限切れです。もう一度登録してください。");
                  return;
                }
                
                console.log("Auth callback: Session validated, redirecting to /decision");
                setTimeout(() => {
                  window.location.replace("/decision");
                }, 1000);
                return;
              }
              
              // セッションが取得できない場合は、エラーメッセージを表示
              console.log("Auth callback: No session on retry, authentication failed");
              setErrorMessage("認証に失敗しました。もう一度登録してください。");
              return;
            } else {
              setErrorMessage("認証に失敗しました。もう一度登録してください。");
              return;
            }
          }

          if (data.user && data.session) {
            console.log("Auth callback: Authentication successful, redirecting to /decision");
            // セッションの有効性を確認
            if (!data.session.access_token || !data.session.refresh_token) {
              console.error("Auth callback: Invalid session tokens");
              setErrorMessage("認証セッションが無効です。もう一度登録してください。");
              return;
            }
            
            // セッションの有効期限を確認
            const now = Math.floor(Date.now() / 1000);
            if (data.session.expires_at && data.session.expires_at < now) {
              console.error("Auth callback: Session expired");
              setErrorMessage("認証セッションが期限切れです。もう一度登録してください。");
              return;
            }
            
            // 少し待ってからリダイレクト（セッションの確立を待つ）
            setTimeout(() => {
              window.location.replace("/decision");
            }, 1000);
          } else {
            console.error("Auth callback: No user or session after successful code exchange");
            setErrorMessage("認証に失敗しました。もう一度登録してください。");
          }
        } catch (authError) {
          console.error("Auth callback: Unexpected error:", authError);
          // エラーが発生した場合
          setErrorMessage("認証処理中にエラーが発生しました。もう一度登録してください。");
        }
      } catch (err) {
        setErrorMessage("予期しないエラーが発生しました。もう一度登録してください。");
      }
    };

    handleAuthCallback();

    // クリーンアップ
    return () => {
      // グローバルエラーハンドリングはlayout.tsxで管理
    };
  }, [router]);

  // エラーメッセージが表示されている場合
  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm py-12 px-10 shadow-2xl rounded-3xl border border-white/20 dark:border-gray-700/50 max-w-md mx-auto text-center">
          <div className="text-red-600 dark:text-red-400 mb-6">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            認証エラー
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {errorMessage}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              トップページに戻る
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 認証処理中は何も表示しない（空白画面）
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">認証処理中...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">しばらくお待ちください</p>
      </div>
    </div>
  );
}
