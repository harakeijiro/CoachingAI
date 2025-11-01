/**
 * メモリ保存用の内部APIエンドポイント
 * Edge RuntimeからServer Actionsを呼び出すためのエンドポイント
 */

import { createMemories } from "@/lib/actions/memory";
import { ExtractedMemory } from "@/lib/types/memory";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    // Cookieを読み取る（認証情報を取得するため）
    const cookieStore = await cookies();
    
    // デバッグ: Cookieを確認
    const cookieNames = cookieStore.getAll().map(c => c.name);
    console.log("Memory save API - Available cookies:", cookieNames);
    
    const body = await req.json();
    const { memories, characterId, sessionId } = body;

    if (!memories || !Array.isArray(memories)) {
      return Response.json(
        { success: false, message: "Invalid request: memories array is required" },
        { status: 400 }
      );
    }

    // ExtractedMemory[]を検証
    const extractedMemories: ExtractedMemory[] = memories.filter((m: any) => {
      return (
        m.memory_type &&
        m.topic &&
        m.content &&
        typeof m.confidence === "number"
      );
    });

    if (extractedMemories.length === 0) {
      return Response.json({
        success: false,
        message: "No valid memories to save",
      });
    }

    // Server Actionを呼び出してメモリを保存
    const result = await createMemories(
      extractedMemories,
      characterId || null,
      null // sourceSummaryId（将来的に追加）
    );

    if (!result.success) {
      console.error("Memory creation failed:", result.error);
      return Response.json(
        {
          success: false,
          message: result.message || "Failed to save memories",
          error: result.error,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Memory save API error:", error);
    return Response.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

