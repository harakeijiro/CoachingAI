"use client";

/**
 * OAuth認証コールバック処理ページ
 * 外部プロバイダー（Google/Microsoft）から戻ってきた認証コードを処理し、
 * セッション検証後に既存ユーザー判定画面へリダイレクト
 */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isValidOrgUser, logUserInfo, validateSession } from "@/lib/utils/user-validation";

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
        
        const supabase = createClient();

        // URLから認証コードを取得
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");
        
        // 全てのURLパラメータをログ
        console.log("AuthCallback: All URL search params:", Object.fromEntries(urlParams));

        console.log("AuthCallback: Starting authentication process");
        
        // まず現在のセッションを確認
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        console.log("AuthCallback: Initial session check:", {
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id,
          error: sessionError?.message
        });
        
        // セッションがあればそのまま処理を進める
        if (sessionData.session && sessionData.session.user) {
          console.log("AuthCallback: Session found, validating session");
          
          logUserInfo(sessionData.session.user, "AuthCallback");
          
          const validationResult = validateSession(sessionData.session);
          if (!validationResult.isValid) {
            console.error("AuthCallback: Session validation failed:", validationResult.reason);
            setErrorMessage(`認証に失敗しました: ${validationResult.reason}`);
            return;
          }
          
          const userValidationResult = isValidOrgUser(sessionData.session.user);
          if (!userValidationResult.isValid) {
            console.error("AuthCallback: User validation failed:", userValidationResult.reason);
            setErrorMessage(`アクセス権がありません: ${userValidationResult.reason}`);
            return;
          }
          
          console.log("AuthCallback: Session and user validated successfully, redirecting to /decision");
          setTimeout(() => {
            window.location.replace("/decision");
          }, 1000);
          return;
        }

        // セッションがない場合は、codeがあるかチェック
        if (error && error !== "access_denied") {
          console.error("AuthCallback: Error parameter found:", error);
          setErrorMessage("認証エラーが発生しました。もう一度登録してください。");
          return;
        }

        if (error && error === "access_denied") {
          console.error("AuthCallback: Access denied");
          setErrorMessage("アクセスが拒否されました。もう一度登録してください。");
          return;
        }

        // codeがない場合：エラー表示
        if (!code) {
          console.error("AuthCallback: No code parameter and no session");
          setErrorMessage("認証コードが見つかりません。もう一度登録してください。");
          return;
        }
        
        // OAuthフローでexchangeCodeForSession
        console.log("AuthCallback: OAuth flow detected, calling exchangeCodeForSession");
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error("AuthCallback: exchangeCodeForSession failed:", exchangeError);
          
          if (exchangeError.message.includes("expired") || exchangeError.message.includes("invalid")) {
            setErrorMessage("認証リンクの有効期限が切れている可能性があります。もう一度ログインしてください。");
          } else {
            // PKCEエラーの可能性：セッションを再確認
            console.log("AuthCallback: PKCE error, retrying session check");
            await new Promise(resolve => setTimeout(resolve, 2000));
            const { data: retrySession } = await supabase.auth.getSession();
            
            if (retrySession.session && retrySession.session.user) {
              console.log("AuthCallback: Session found after PKCE error");
              const validationResult = validateSession(retrySession.session);
              if (!validationResult.isValid) {
                console.error("AuthCallback: Session validation failed:", validationResult.reason);
                setErrorMessage(`認証に失敗しました: ${validationResult.reason}`);
                return;
              }
              
              const userValidationResult = isValidOrgUser(retrySession.session.user);
              if (!userValidationResult.isValid) {
                console.error("AuthCallback: User validation failed:", userValidationResult.reason);
                setErrorMessage(`アクセス権がありません: ${userValidationResult.reason}`);
                return;
              }
              
              console.log("AuthCallback: Session validated, redirecting to /decision");
              setTimeout(() => {
                window.location.replace("/decision");
              }, 1000);
              return;
            }
          }
          
          setErrorMessage("認証に失敗しました。もう一度登録してください。");
          return;
        }
        
        if (exchangeData.session && exchangeData.session.user) {
          console.log("AuthCallback: OAuth session established via exchangeCodeForSession", {
            userId: exchangeData.session.user.id
          });
          
          logUserInfo(exchangeData.session.user, "AuthCallback");
          
          const validationResult = validateSession(exchangeData.session);
          if (!validationResult.isValid) {
            console.error("AuthCallback: Session validation failed:", validationResult.reason);
            setErrorMessage(`認証に失敗しました: ${validationResult.reason}`);
            return;
          }
          
          const userValidationResult = isValidOrgUser(exchangeData.session.user);
          if (!userValidationResult.isValid) {
            console.error("AuthCallback: User validation failed:", userValidationResult.reason);
            setErrorMessage(`アクセス権がありません: ${userValidationResult.reason}`);
            return;
          }
          
          console.log("AuthCallback: Session and user validated successfully, redirecting to /decision");
          setTimeout(() => {
            window.location.replace("/decision");
          }, 1000);
          return;
        }
        
        console.error("AuthCallback: No session or user after exchangeCodeForSession");
        setErrorMessage("認証に失敗しました。もう一度登録してください。");
      } catch {
        setErrorMessage("予期しないエラーが発生しました。もう一度登録してください。");
      }
    };

    handleAuthCallback();

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

