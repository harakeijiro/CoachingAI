/**
 * 認証関連の設定を一元管理
 */

const getAppUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const AUTH_CONFIG = {
  // 認証成功後のリダイレクト先
  callbackUrl: `${getAppUrl()}/auth/callback/social`,
  callbackUrlEmail: `${getAppUrl()}/auth/callback/email`,
  decisionUrl: `${getAppUrl()}/decision`,
  
  // プロバイダー別の設定
  providers: {
    google: {
      redirectTo: `${getAppUrl()}/auth/callback/social`,
      scopes: "openid email profile"
    },
    microsoft: {
      redirectTo: `${getAppUrl()}/auth/callback/social`,
      scopes: "openid email profile"
    }
  }
};

