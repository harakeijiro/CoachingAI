/**
 * メモリ読み込み用のAPIエンドポイント
 * セッション開始時にクライアントから呼び出される
 */

import { getMemories } from "@/lib/actions/memory";

export async function GET() {
  try {
    // Server Actionを呼び出してメモリを取得
    const memoriesResult = await getMemories();
    
    if (memoriesResult.success && memoriesResult.data) {
      return Response.json({
        success: true,
        data: memoriesResult.data,
        message: memoriesResult.message,
      });
    }
    
    // エラー時も空配列を返す（エラーを無視して続行）
    return Response.json({
      success: true,
      data: [],
      message: "メモリが見つかりませんでした",
    });
  } catch (error) {
    console.error("Memory load API error:", error);
    // エラー時は空配列を返す（エラーを無視して続行）
    return Response.json({
      success: true,
      data: [],
      message: "メモリの取得中にエラーが発生しましたが、続行します",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
