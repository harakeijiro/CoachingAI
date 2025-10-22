"use server";

import { createServerClient } from "@/lib/supabase/server";
import { 
  Profile, 
  Character, 
  ProfileResponse, 
  CharacterResponse, 
  UpdateProfileRequest,
  Theme 
} from "@/lib/types/profile";
import { revalidatePath } from "next/cache";

/**
 * プロファイル情報の取得
 * 認証されたユーザーのプロファイル情報を取得
 */
export async function getProfile(): Promise<ProfileResponse> {
  try {
    console.log("getProfile: Starting profile fetch");
    const supabase = await createServerClient();

    // 現在のセッションを確認
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("getProfile: Auth check result:", { user: user?.id, error: userError });

    if (userError || !user) {
      console.error("getProfile: Authentication failed:", userError);
      return {
        success: false,
        message: "認証に失敗しました",
        error: userError?.message || "User not authenticated",
      };
    }

    // プロファイル情報を取得（既存のフィールドのみ）
    console.log("getProfile: Fetching profile for user:", user.id);
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("user_id, name, birthdate, created_at, updated_at")
      .eq("user_id", user.id)
      .single();

    console.log("getProfile: Profile query result:", { profile, error: profileError });

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      
      // プロファイルが存在しない場合は新規作成
      if (profileError.code === "PGRST116") {
        console.log("Creating new profile for user:", user.id);
        const { data: newProfile, error: createError } = await supabase
          .from("users")
          .insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "ユーザー",
          })
          .select("user_id, name, birthdate, created_at, updated_at")
          .single();

        if (createError) {
          console.error("Profile creation error:", createError);
          return {
            success: false,
            message: "プロファイルの作成に失敗しました",
            error: createError.message,
          };
        }

        // 既存の構造に合わせてデフォルト値を設定
        const profileWithDefaults = {
          ...newProfile,
          selected_character_id: null,
          default_theme: null,
        };

        return {
          success: true,
          message: "プロファイルを作成しました",
          data: profileWithDefaults,
        };
      }

      // その他のエラー
      return {
        success: false,
        message: "プロファイルの取得に失敗しました",
        error: profileError.message,
      };
    }

    // 既存の構造に合わせてデフォルト値を設定
    const profileWithDefaults = {
      ...profile,
      selected_character_id: null,
      default_theme: null,
    };

    return {
      success: true,
      message: "プロファイルを取得しました",
      data: profileWithDefaults,
    };
  } catch (error) {
    console.error("Unexpected error during profile fetch:", error);
    return {
      success: false,
      message: "予期しないエラーが発生しました",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * プロファイル情報の更新
 * 認証されたユーザーのプロファイル情報を更新
 */
export async function updateProfile(
  updates: UpdateProfileRequest
): Promise<ProfileResponse> {
  try {
    const supabase = await createServerClient();

    // 現在のセッションを確認
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "認証に失敗しました",
        error: userError?.message || "User not authenticated",
      };
    }

    // 既存のフィールドのみを更新対象とする
    const allowedUpdates: any = {};
    if (updates.display_name) {
      allowedUpdates.name = updates.display_name;
    }
    // selected_character_id と default_theme は現在のデータベース構造では保存できないため、
    // 一時的にローカルストレージまたは別の方法で管理する必要があります
    
    // プロファイル情報を更新（既存のフィールドのみ）
    const { data: updatedProfile, error: updateError } = await supabase
      .from("users")
      .update(allowedUpdates)
      .eq("user_id", user.id)
      .select("user_id, name, birthdate, created_at, updated_at")
      .single();

    if (updateError) {
      return {
        success: false,
        message: "プロファイルの更新に失敗しました",
        error: updateError.message,
      };
    }

    // 既存の構造に合わせてデフォルト値を設定
    const profileWithDefaults = {
      ...updatedProfile,
      selected_character_id: updates.selected_character_id || null,
      default_theme: updates.default_theme || null,
    };

    // キャッシュを無効化
    revalidatePath("/theme");
    revalidatePath("/character-select");
    revalidatePath("/chat");

    return {
      success: true,
      message: "プロファイルを更新しました",
      data: profileWithDefaults,
    };
  } catch (error) {
    console.error("Unexpected error during profile update:", error);
    return {
      success: false,
      message: "予期しないエラーが発生しました",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * テーマ別キャラクターの取得
 * 指定されたテーマに最適なキャラクター一覧を取得
 */
export async function getCharactersByTheme(theme: Theme): Promise<CharacterResponse> {
  try {
    const supabase = await createServerClient();

    // 現在のセッションを確認
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "認証に失敗しました",
        error: userError?.message || "User not authenticated",
      };
    }

    // テーマ別キャラクターを取得（既存のフィールドのみ）
    const { data: characters, error: charactersError } = await supabase
      .from("characters")
      .select("character_id, character_name as name, personality_type, model_path")
      .eq("user_id", user.id)
      .eq("personality_type", theme)
      .order("created_at", { ascending: false })
      .limit(6);

    if (charactersError) {
      return {
        success: false,
        message: "キャラクターの取得に失敗しました",
        error: charactersError.message,
      };
    }

    // 型を合わせるためにデータを変換（既存のフィールドを使用）
    const formattedCharacters: Character[] = characters.map(char => ({
      character_id: char.character_id,
      user_id: user.id,
      name: char.name,
      thumbnail_url: char.model_path, // model_path を thumbnail_url として使用
      theme: theme,
      personality_type: char.personality_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    return {
      success: true,
      message: "キャラクターを取得しました",
      data: formattedCharacters,
    };
  } catch (error) {
    console.error("Unexpected error during characters fetch:", error);
    return {
      success: false,
      message: "予期しないエラーが発生しました",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
