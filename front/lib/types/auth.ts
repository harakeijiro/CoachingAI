/**
 * 認証関連の型定義
 * ソーシャル認証のみの実装
 */

export type AuthResponse = {
  success: boolean;
  message: string;
  error?: string;
};

export type User = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider: string;
};