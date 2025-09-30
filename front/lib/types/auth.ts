/**
 * 認証関連の型定義
 */

export type SignUpData = {
  email: string;
  password: string;
  name: string;
  birthdate?: string;
};

export type SignInData = {
  email: string;
  password: string;
};

export type PasswordResetData = {
  email: string;
};

export type UpdatePasswordData = {
  password: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  error?: string;
};
