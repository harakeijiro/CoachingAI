"use server";

import { createServerClient } from "@/lib/supabase/server";
import {
  SignInData,
  PasswordResetData,
  UpdatePasswordData,
  AuthResponse,
} from "@/lib/types/auth";
import { revalidatePath } from "next/cache";
import {
  translateAuthError,
} from "@/lib/utils/error-messages";

// メールサインアップは廃止しました

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

/**
 * パスワード更新
 * Server Action として実装し、環境変数を保護
 * パスワードリセットメールのリンクから遷移した際に使用
 */
export async function updatePassword(
  data: UpdatePasswordData
): Promise<AuthResponse> {
  try {
    const supabase = await createServerClient();

    // 現在のセッションを確認
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User authentication error:", userError);
      return {
        success: false,
        message:
          "認証に失敗しました。もう一度パスワードリセットメールを送信してください。",
        error: userError?.message || "User not authenticated",
      };
    }

    // パスワードの長さをチェック
    if (data.password.length < 6) {
      return {
        success: false,
        message: "パスワードは6文字以上である必要があります",
        error: "Password too short",
      };
    }

    // Supabase Auth でパスワードを更新
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      const errorMessage = translateAuthError(updateError.message);
      return {
        success: false,
        message: errorMessage,
        error: updateError.message,
      };
    }

    // パスを再検証してキャッシュをクリア
    revalidatePath("/");

    return {
      success: true,
      message: "パスワードが正常に更新されました",
    };
  } catch (error) {
    console.error("Unexpected error during password update:", error);
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
