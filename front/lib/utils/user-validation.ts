/**
 * ユーザー認証の詳細検証ユーティリティ
 * Supabaseのsession.userオブジェクトを検証する
 */

export interface UserValidationResult {
  isValid: boolean;
  reason?: string;
}

interface SupabaseUser {
  id?: string;
  email?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  app_metadata?: {
    provider?: string;
  };
  user_metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

/**
 * 有効な組織ユーザーかどうかを検証
 * @param user Supabaseのsession.userオブジェクト
 * @returns 検証結果
 */
export function isValidOrgUser(user: SupabaseUser | null): UserValidationResult {
  // 1. ユーザーオブジェクトが存在するか
  if (!user) {
    return {
      isValid: false,
      reason: "ユーザー情報が存在しません"
    };
  }

  // 2. メールアドレスがあるか
  if (!user.email) {
    return {
      isValid: false,
      reason: "メールアドレスが設定されていません"
    };
  }

  // 3. メールが確認済みか（Supabaseでは confirmed_at や last_sign_in_at が入る場合もある）
  // email_confirmed_at, confirmed_at, last_sign_in_at のいずれかがあれば確認済みとする
  if (!user.email_confirmed_at && !user.confirmed_at && !user.last_sign_in_at) {
    return {
      isValid: false,
      reason: "メールアドレスが確認されていません"
    };
  }

  // 4. Microsoftログイン限定の場合のプロバイダー確認
  // Supabaseは user.app_metadata.provider で "azure" / "azuread" / "azure_ad" みたいな値を返す
  const provider = user.app_metadata?.provider;
  if (provider && !isValidProvider(provider)) {
    return {
      isValid: false,
      reason: `サポートされていない認証プロバイダーです: ${provider}`
    };
  }

  // 5. ユーザーIDが存在するか
  if (!user.id) {
    return {
      isValid: false,
      reason: "ユーザーIDが存在しません"
    };
  }

  // 6. 必要に応じて会社ドメイン制限
  // if (!user.email.endsWith("@yourcompany.com")) {
  //   return {
  //     isValid: false,
  //     reason: "許可されていないドメインです"
  //   };
  // }

  return {
    isValid: true
  };
}

/**
 * 有効な認証プロバイダーかどうかを確認
 * @param provider プロバイダー名
 * @returns 有効かどうか
 */
function isValidProvider(provider: string): boolean {
  const validProviders = [
    "azure",      // Microsoft Azure AD
    "azuread",    // Microsoft Azure AD (別名)
    "azure_ad",   // Microsoft Azure AD (別名)
    "google",     // Google
    "microsoft",  // Microsoft (将来の拡張用)
    "email"       // メール認証
  ];
  
  return validProviders.includes(provider.toLowerCase());
}

/**
 * ユーザー情報の詳細ログ出力
 * @param user Supabaseのsession.userオブジェクト
 * @param context ログのコンテキスト
 */
export function logUserInfo(user: SupabaseUser | null, context: string): void {
  console.log(`${context}: User validation info:`, {
    id: user?.id,
    email: user?.email,
    email_confirmed_at: user?.email_confirmed_at,
    provider: user?.app_metadata?.provider,
    user_metadata: user?.user_metadata,
    app_metadata: user?.app_metadata,
    created_at: user?.created_at,
    updated_at: user?.updated_at
  });
}

interface SupabaseSession {
  user?: SupabaseUser;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

/**
 * セッションの有効性を検証
 * @param session Supabaseのsessionオブジェクト
 * @returns 検証結果
 */
export function validateSession(session: SupabaseSession | null): UserValidationResult {
  if (!session) {
    return {
      isValid: false,
      reason: "セッションが存在しません"
    };
  }

  if (!session.user) {
    return {
      isValid: false,
      reason: "セッションにユーザー情報が含まれていません"
    };
  }

  if (!session.access_token) {
    return {
      isValid: false,
      reason: "アクセストークンが無効です"
    };
  }  

  // セッションの有効期限を確認
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at < now) {
    return {
      isValid: false,
      reason: "セッションが期限切れです"
    };
  }

  // ユーザー情報の検証
  return isValidOrgUser(session.user);
}
