"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("AuthGuard: Starting auth check");
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
              debug: false
            },
            global: {
              headers: {
                'X-Client-Info': 'supabase-js-web'
              }
            }
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log("AuthGuard: Auth check result:", { 
          user: user?.id, 
          email: user?.email,
          email_confirmed_at: user?.email_confirmed_at,
          error: error?.message 
        });
        
        if (error || !user) {
          console.log("AuthGuard: Not authenticated, redirecting to /");
          router.push("/");
          return;
        }
        
        // メール確認が完了しているかチェック（一時的に無効化）
        // if (!user.email_confirmed_at) {
        //   console.log("AuthGuard: Email not confirmed, redirecting to /");
        //   router.push("/?message=メール確認が完了していません");
        //   return;
        // }
        
        console.log("AuthGuard: Authentication successful");
        setIsAuthenticated(true);
      } catch (error) {
        console.error("AuthGuard: Auth check error:", error);
        router.push("/");
      }
    };
    
    checkAuth();
  }, [router]);

  // 認証チェック中はローディング表示
  if (isAuthenticated === null) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            認証中...
          </h1>
        </div>
      </div>
    );
  }

  // 認証されていない場合は何も表示しない（リダイレクト中）
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
