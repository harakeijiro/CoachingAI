"use client";

/**
 * 認証ガードコンポーネント
 * 認証済みユーザーのみ子コンポーネントを表示し、未認証はトップページにリダイレクト
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidOrgUser, logUserInfo, validateSession } from "@/lib/utils/user-validation";

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
        
        const supabase = createClient();
        
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

        // ユーザー情報の詳細ログ
        logUserInfo(session.user, "AuthGuard");

        // セッションとユーザーの詳細検証
        const validationResult = validateSession(session);
        if (!validationResult.isValid) {
          console.error("AuthGuard: Session validation failed:", validationResult.reason);
          router.push("/");
          return;
        }

        // ユーザーの詳細検証
        const userValidationResult = isValidOrgUser(session.user);
        if (!userValidationResult.isValid) {
          console.error("AuthGuard: User validation failed:", userValidationResult.reason);
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
