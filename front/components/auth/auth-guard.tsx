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
        console.log("AuthGuard: Environment variables:", {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET",
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET"
        });
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              // Supabase認証設定
              detectSessionInUrl: true,
              persistSession: true,
              autoRefreshToken: true,
              flowType: 'pkce',
              debug: true // デバッグを有効化
            },
            global: {
              headers: {
                'X-Client-Info': 'supabase-js-web'
              }
            }
          }
        );
        
        // セッションを確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log("AuthGuard: Session check result:", { 
          session: session?.user?.id, 
          email: session?.user?.email,
          email_confirmed_at: session?.user?.email_confirmed_at,
          error: sessionError?.message,
          hasSession: !!session,
          hasUser: !!session?.user,
          hasAccessToken: !!session?.access_token,
          hasRefreshToken: !!session?.refresh_token,
          expiresAt: session?.expires_at
        });
        
        if (sessionError) {
          console.error("AuthGuard: Session error:", sessionError);
          router.push("/");
          return;
        }
        
        if (!session || !session.user) {
          console.log("AuthGuard: No session found, redirecting to /");
          router.push("/");
          return;
        }

        // セッションの有効性を確認
        if (!session.access_token || !session.refresh_token) {
          console.log("AuthGuard: Invalid session tokens, redirecting to /");
          router.push("/");
          return;
        }

        // セッションの有効期限を確認
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          console.log("AuthGuard: Session expired, redirecting to /");
          router.push("/");
          return;
        }
        
        console.log("AuthGuard: Authentication successful, setting isAuthenticated to true");
        setIsAuthenticated(true);
      } catch (error) {
        console.error("AuthGuard: Auth check error:", error);
        router.push("/");
      }
    };
    
    checkAuth();
  }, [router]);

  console.log("AuthGuard: Render state:", { isAuthenticated });

  // 認証チェック中は何も表示しない（空白画面）
  if (isAuthenticated === null) {
    console.log("AuthGuard: Still checking authentication, showing nothing");
    return null;
  }

  // 認証されていない場合は何も表示しない（リダイレクト中）
  if (!isAuthenticated) {
    console.log("AuthGuard: Not authenticated, showing nothing (redirecting)");
    return null;
  }

  console.log("AuthGuard: Authenticated, rendering children");
  return <>{children}</>;
}
