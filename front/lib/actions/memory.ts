"use server";

import { createServerClient } from "@/lib/supabase/server";
import {
  Memory,
  MemoryResponse,
  CreateMemoryRequest,
  ExtractedMemory,
} from "@/lib/types/memory";
import { deduplicateMemories } from "@/lib/utils/memory-deduplication";

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
    const highConfidenceMemories = extractedMemories.filter(
      (m) => m.confidence >= MIN_CONFIDENCE
    );

    if (highConfidenceMemories.length === 0) {
      return {
        success: true,
        message: "保存するメモリがありません（信頼度が低いため）",
        data: [],
      };
    }

    // 既存メモリを取得して重複チェック
    // 注意: getMemories()はLIMIT 20で制限されているため、
    // 重複チェック用にはLIMITなしで全メモリを取得する必要がある
    // 重複チェック用に全メモリを取得（LIMITなし、必要なカラムのみ）
    const { data: allExistingMemories, error: fetchError } = await supabase
      .from("memories")
      .select("memory_id, topic, content, confidence")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const existingMemories = (allExistingMemories || []) as Memory[];

    if (fetchError) {
      console.error("Error fetching existing memories for deduplication:", fetchError);
      // エラーが発生しても続行（既存メモリがないものとして扱う）
    }

    // 重複・類似メモリを統合（既存メモリとの比較 + 新メモリ同士の統合）
    const deduplicationResult = deduplicateMemories(
      highConfidenceMemories,
      existingMemories
    );

    // 更新対象の既存メモリを論理削除
    if (deduplicationResult.memoriesToUpdate.length > 0) {
      const memoryIdsToDelete = deduplicationResult.memoriesToUpdate.map(
        (m) => m.memory_id
      );
      
      const { error: deleteError } = await supabase
        .from("memories")
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .in("memory_id", memoryIdsToDelete);

      if (deleteError) {
        console.error("Error deleting existing memories:", deleteError);
        // エラーが発生しても続行（新しいメモリは作成する）
      }
    }

    if (deduplicationResult.memories.length === 0) {
      return {
        success: true,
        message: "保存するメモリがありません（既存メモリと重複しているため）",
        data: [],
      };
    }

    const validMemories = deduplicationResult.memories;

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

    const updateCount = deduplicationResult.memoriesToUpdate.length;
    const createCount = memories.length;
    
    return {
      success: true,
      message: updateCount > 0 
        ? `${createCount}件のメモリを作成し、${updateCount}件のメモリを更新しました`
        : `${createCount}件のメモリを作成しました`,
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
    // 重複チェックのためにconfidenceも必要
    // 1-1: 必要なカラムのみ取得（topic, content, created_at, confidence）
    // 1-2: フィルタリング後にLIMITを適用してDB側で20件に制限
    let query = supabase
      .from("memories")
      .select("memory_id, topic, content, created_at, confidence")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (memoryType) {
      query = query.eq("memory_type", memoryType);
    }

    if (characterId) {
      query = query.eq("character_id", characterId);
    }

    // LIMITはフィルタリングの後に適用（DB側で20件に制限）
    query = query.limit(20);

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

