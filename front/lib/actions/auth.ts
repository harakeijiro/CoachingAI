"use server";

import { createServerClient } from "@/lib/supabase/server";
import {
  SignUpData,
  SignInData,
  PasswordResetData,
  AuthResponse,
} from "@/lib/types/auth";
import { revalidatePath } from "next/cache";
import {
  translateAuthError,
  translateDatabaseError,
} from "@/lib/utils/error-messages";

/**
 * 新規ユーザー登録
 * Server Action として実装し、環境変数を保護
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    const supabase = await createServerClient();

    // Supabase Auth でユーザー登録
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      console.error("Auth error:", authError);
      const errorMessage = translateAuthError(authError.message);
      return {
        success: false,
        message: errorMessage,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        message: "ユーザーの作成に失敗しました",
        error: "User data is null",
      };
    }

    // users テーブルにプロファイル情報を保存
    const { error: profileError } = await supabase.from("users").insert({
      user_id: authData.user.id,
      name: data.name,
      birthdate: data.birthdate || null,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      const errorMessage = translateDatabaseError(profileError);
      // プロファイル作成に失敗した場合でも、認証自体は成功しているため
      // ユーザーには成功として返す（後でプロファイルは更新可能）
      return {
        success: true,
        message: `登録が完了しました。${errorMessage}（プロファイル情報は後で更新できます）`,
      };
    }

    // パスを再検証してキャッシュをクリア
    revalidatePath("/");

    return {
      success: true,
      message: "登録が完了しました。メールを確認してください。",
    };
  } catch (error) {
    console.error("Unexpected error during sign up:", error);
    const errorMessage =
      error instanceof Error
        ? translateAuthError(error.message)
        : "予期しないエラーが発生しました";
    return {
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * ユーザーログイン
 * Server Action として実装し、環境変数を保護
 */
export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    const supabase = await createServerClient();

    // Supabase Auth でログイン
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      console.error("Auth error:", authError);
      const errorMessage = translateAuthError(authError.message);
      return {
        success: false,
        message: errorMessage,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        message: "ログインに失敗しました",
        error: "User data is null",
      };
    }

    // パスを再検証してキャッシュをクリア
    revalidatePath("/");

    return {
      success: true,
      message: "ログインに成功しました",
    };
  } catch (error) {
    console.error("Unexpected error during sign in:", error);
    const errorMessage =
      error instanceof Error
        ? translateAuthError(error.message)
        : "予期しないエラーが発生しました";
    return {
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * パスワードリセットメール送信
 * Server Action として実装し、環境変数を保護
 */
export async function resetPassword(
  data: PasswordResetData
): Promise<AuthResponse> {
  try {
    const supabase = await createServerClient();

    // Supabase Auth でパスワードリセットメールを送信
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/reset-password/confirm`,
    });

    if (error) {
      console.error("Password reset error:", error);
      const errorMessage = translateAuthError(error.message);
      return {
        success: false,
        message: errorMessage,
        error: error.message,
      };
    }

    return {
      success: true,
      message:
        "パスワードリセット用のメールを送信しました。メールボックスを確認してください。",
    };
  } catch (error) {
    console.error("Unexpected error during password reset:", error);
    const errorMessage =
      error instanceof Error
        ? translateAuthError(error.message)
        : "予期しないエラーが発生しました";
    return {
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
