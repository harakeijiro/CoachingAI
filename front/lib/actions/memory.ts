"use server";

import { createServerClient } from "@/lib/supabase/server";
import {
  Memory,
  MemoryResponse,
  CreateMemoryRequest,
  ExtractedMemory,
} from "@/lib/types/memory";

/**
 * メモリを作成
 */
export async function createMemory(
  request: CreateMemoryRequest
): Promise<MemoryResponse> {
  try {
    const supabase = await createServerClient();

    // 認証チェック
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

    // メモリを作成
    const { data: memory, error: insertError } = await supabase
      .from("memories")
      .insert({
        user_id: user.id,
        character_id: request.character_id || null,
        memory_type: request.memory_type,
        topic: request.topic,
        content: request.content,
        confidence: request.confidence || null,
        source_summary_id: request.source_summary_id || null,
        expires_at: request.expires_at || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Memory creation error:", insertError);
      return {
        success: false,
        message: "メモリの作成に失敗しました",
        error: insertError.message,
      };
    }

    return {
      success: true,
      message: "メモリを作成しました",
      data: memory as Memory,
    };
  } catch (error) {
    console.error("Unexpected error in createMemory:", error);
    return {
      success: false,
      message: "予期しないエラーが発生しました",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 複数のメモリを一括作成
 * LLMから抽出されたメモリ情報を一括保存する際に使用
 */
export async function createMemories(
  extractedMemories: ExtractedMemory[],
  characterId?: string | null,
  sourceSummaryId?: string | null
): Promise<MemoryResponse> {
  try {
    const supabase = await createServerClient();

    // 認証チェック
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // デバッグ: 認証状態を確認
    console.log("createMemories - Auth check:", {
      hasUser: !!user,
      userId: user?.id,
      userError: userError?.message,
    });

    if (userError || !user) {
      console.error("Memory creation auth error:", userError);
      return {
        success: false,
        message: "認証に失敗しました",
        error: userError?.message || "User not authenticated",
      };
    }

    // 信頼度が一定以上のメモリのみを保存（デフォルト0.7以上）
    const MIN_CONFIDENCE = 0.7;
    const validMemories = extractedMemories.filter(
      (m) => m.confidence >= MIN_CONFIDENCE
    );

    if (validMemories.length === 0) {
      return {
        success: true,
        message: "保存するメモリがありません（信頼度が低いため）",
        data: [],
      };
    }

    // デバッグ: 保存するメモリのuser_idを確認
    console.log("createMemories - Saving memories for user_id:", user.id);
    console.log("createMemories - Number of memories:", validMemories.length);

    // メモリを一括作成
    const memoriesToInsert = validMemories.map((m) => ({
      user_id: user.id,
      character_id: characterId || null,
      memory_type: m.memory_type,
      topic: m.topic,
      content: m.content,
      confidence: m.confidence,
      source_summary_id: sourceSummaryId || null,
      expires_at: null, // 将来的にuser_settingsから取得
    }));

    const { data: memories, error: insertError } = await supabase
      .from("memories")
      .insert(memoriesToInsert)
      .select();

    if (insertError) {
      console.error("Memories creation error:", insertError);
      return {
        success: false,
        message: "メモリの作成に失敗しました",
        error: insertError.message,
      };
    }

    return {
      success: true,
      message: `${memories.length}件のメモリを作成しました`,
      data: memories as Memory[],
    };
  } catch (error) {
    console.error("Unexpected error in createMemories:", error);
    return {
      success: false,
      message: "予期しないエラーが発生しました",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * ユーザーのメモリを取得
 */
export async function getMemories(
  memoryType?: string,
  characterId?: string | null
): Promise<MemoryResponse> {
  try {
    const supabase = await createServerClient();

    // 認証チェック
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

    // メモリを取得
    let query = supabase
      .from("memories")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (memoryType) {
      query = query.eq("memory_type", memoryType);
    }

    if (characterId) {
      query = query.eq("character_id", characterId);
    }

    const { data: memories, error: selectError } = await query;

    if (selectError) {
      console.error("Memory fetch error:", selectError);
      return {
        success: false,
        message: "メモリの取得に失敗しました",
        error: selectError.message,
      };
    }

    return {
      success: true,
      message: "メモリを取得しました",
      data: (memories || []) as Memory[],
    };
  } catch (error) {
    console.error("Unexpected error in getMemories:", error);
    return {
      success: false,
      message: "予期しないエラーが発生しました",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

