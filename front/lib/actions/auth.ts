"use server";

import { createServerClient } from "@/lib/supabase/server";
import { AuthResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";
import {
  translateAuthError,
} from "@/lib/utils/error-messages";

// ソーシャル認証のみの実装
// メール認証とパスワードリセット機能は廃止しました

/**
 * 認証状態の確認
 * Server Action として実装し、環境変数を保護
 */
export async function checkAuth(): Promise<AuthResponse> {
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
        message: "認証に失敗しました",
        error: userError?.message || "User not authenticated",
      };
    }

    // メール確認が完了しているかチェック（ソーシャル認証では通常不要）
    if (!user.email_confirmed_at) {
      return {
        success: false,
        message: "メール確認が完了していません",
        error: "Email not confirmed",
      };
    }

    return {
      success: true,
      message: "認証が確認されました",
    };
  } catch (error) {
    console.error("Unexpected error during auth check:", error);
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