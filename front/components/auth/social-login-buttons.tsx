"use client";

/**
 * ソーシャルログインボタンコンポーネント
 * Google・MicrosoftのOAuth認証ボタンを提供
 */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AUTH_CONFIG } from "@/lib/utils/auth-config";

interface SocialLoginButtonsProps {
  onGoogleSuccess?: (message: string) => void;
  onMicrosoftSuccess?: (message: string) => void;
  onGoogleError?: (message: string) => void;
  onMicrosoftError?: (message: string) => void;
}

export default function SocialLoginButtons({
  onGoogleSuccess,
  onMicrosoftSuccess,
  onGoogleError,
  onMicrosoftError,
}: SocialLoginButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSocialLogin = async (providerLabel: string) => {
    setIsLoading(providerLabel);
    try {
      const supabase = createClient();

      if (providerLabel === "Google") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: AUTH_CONFIG.providers.google.redirectTo,
            scopes: AUTH_CONFIG.providers.google.scopes,
          },
        });

        if (error) {
          onGoogleError?.("Googleでのログインに失敗しました");
          setIsLoading(null);
        } else {
          onGoogleSuccess?.("Googleログインを開始します...");
        }
        // 成功時はリダイレクトされるため、以降の処理は不要
        return;
      }

      // Microsoft認証の修正
      if (providerLabel === "Microsoft") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "azure",
          options: {
            redirectTo: AUTH_CONFIG.providers.microsoft.redirectTo,
            scopes: AUTH_CONFIG.providers.microsoft.scopes,
          },
        });

        if (error) {
          onMicrosoftError?.("Microsoftでのログインに失敗しました");
          setIsLoading(null);
        } else {
          onMicrosoftSuccess?.("Microsoftログインを開始します...");
        }
        // 成功時はリダイレクトされるため、以降の処理は不要
        return;
      }

      // 他プロバイダは未実装
      onGoogleError?.("未対応のプロバイダです");
      onMicrosoftError?.("未対応のプロバイダです");
    } catch {
      // エラーが発生した場合、利用可能なエラーハンドラーを呼び出す
      if (onGoogleError || onMicrosoftError) {
        const message = "ソーシャルログインの開始に失敗しました";
        onGoogleError?.(message);
        onMicrosoftError?.(message);
      }
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-3 max-w-64 mx-auto mb-6">
      {/* Google */}
      <button
        type="button"
        onClick={() => handleSocialLogin("Google")}
        disabled={isLoading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isLoading === "Google" ? "接続中..." : "Googleで続ける"}
        </span>
      </button>

      {/* Microsoft */}
      <button
        type="button"
        onClick={() => handleSocialLogin("Microsoft")}
        disabled={isLoading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 23 23">
          <path fill="#f35325" d="M0 0h11v11H0z" />
          <path fill="#81bc06" d="M12 0h11v11H12z" />
          <path fill="#05a6f0" d="M0 12h11v11H0z" />
          <path fill="#ffba08" d="M12 12h11v11H12z" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isLoading === "Microsoft" ? "接続中..." : "Microsoftで続ける"}
        </span>
      </button>

    </div>
  );
}

