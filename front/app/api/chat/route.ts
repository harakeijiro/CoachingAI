/**
 * チャットAPIエンドポイント
 * - ユーザーメッセージをGemini LLMに送信
 * - キャラクター人格プロンプトと組み合わせて応答生成
 * - ストリーミング形式でレスポンスを返却
 * - ユーザーのメモリ（名前など）を取得してプロンプトに含める
 */
// front/app/api/chat/route.ts

import { getSelectedCharacterConfig } from "@/lib/characters/registry";
import { extractMemoriesFromConversation } from "@/lib/utils/memory-extraction";
import type { ConversationMessage } from "@/lib/utils/memory-extraction";
import type { Memory } from "@/lib/types/memory";

type Message = {
  role: string;
  content: string;
};

export async function POST(req: Request) {
  const { messages, memories = [] } = await req.json(); // ステップ4: メモリをリクエストから取得

  // 環境変数チェック
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // モデルの指定（なければデフォルト）
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // キャラクター設定取得（ステップ4: メモリ取得処理を削除）
  const characterConfig = getSelectedCharacterConfig();

  // メモリをリクエストから取得（ステップ4: DBクエリを削除）
  let memoryContext = "";
  try {
    // フロントエンドから受け取ったメモリを使用
    if (memories && Array.isArray(memories) && memories.length > 0) {
      // メモリをテキストに変換
      const memoryTexts = memories.map(
        (m: Memory) => `- ${m.topic}: ${m.content}`
      );

      if (memoryTexts.length > 0) {
        // メモリ情報をテキスト形式で保存（タイトルはプロンプト生成時に追加）
        memoryContext = memoryTexts.join("\n");
      }
    }
  } catch (error) {
    // メモリ処理エラーは無視して続行（エラーのみログ記録）
    console.error("Error processing memories:", error);
  }

  // ユーザーの直近メッセージ
  const lastUserMessage =
    (messages as Message[]).filter((m) => m.role === "user").pop()?.content || "";

  // ユーザーが情報について質問しているかチェック（名前、年齢、目標など）
  const isAskingAboutMemory = (lastUserMessage.includes("覚え") || 
                               lastUserMessage.includes("何") ||
                               lastUserMessage.includes("知って") ||
                               lastUserMessage.includes("記憶") ||
                               lastUserMessage.includes("名前") ||
                               lastUserMessage.includes("年齢") ||
                               lastUserMessage.includes("目標")) &&
                               memoryContext;

  // ここでキャラクター人格プロンプトを組み立てる
  // メモリ情報はプロンプトの最初の方に配置して、LLMが確実に見るようにする
  // 質問への回答指示を明確にして、人格設定の指示より優先させる
  // プロンプト最適化: メモリセクションを300文字に制限して処理速度を向上
  const memorySection = memoryContext 
    ? `\n\n【記憶】${memoryContext.slice(0, 300)}\n`
    : "";

  // 質問への回答を最優先にする指示（簡潔版）
  const answerInstruction = isAskingAboutMemory
    ? `\n\n【最重要】上記の【記憶】を確認して回答してください。`
    : memoryContext
    ? `\n\n【重要】記憶を活用してください。`
    : "";

  const promptForModel = `
あなたの名前は「${characterConfig.name}」です。
${memorySection}${answerInstruction}

${characterConfig.personaCore}

ユーザー: ${lastUserMessage}

指示: ${isAskingAboutMemory ? "上記の【記憶】を確認して回答してください。" : ""}返答は1文以内で簡潔に答えてください。${memoryContext ? "記憶を活用してください。" : ""}
`;

  try {
    // Gemini Streaming APIを呼ぶ
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptForModel,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 100, // 1文以内を保証（短めに制限）
            topK: 40,
            topP: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    // ストリーム → クライアントへ中継（1文字ずつ吐く部分はあなたの元コードを踏襲）
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const jsonStr = line.slice(6); // "data: " を外す
                  const data = JSON.parse(jsonStr);
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                  if (text) {
                    for (const char of text) {
                      const payload = `0:"${char}"\n`;
                      controller.enqueue(encoder.encode(payload));
                    }
                  }
                } catch {
                  // 部分的なチャンクなどJSONにできない行は無視
                }
              }
            }
          }

          controller.close();
          
          // ====== 会話後にメモリを抽出・保存 ======
          // ストリーム終了後、非同期でメモリ抽出を実行（エラーが発生しても影響しない）
          extractAndSaveMemoriesFromChat(messages, req).catch((error) => {
            console.error("Memory extraction error (non-blocking):", error);
          });
        } catch (error) {
          console.error("Stream reading error:", error);
          controller.error(error);
        }
      },
    });

    // ストリームレスポンスとして返す
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * チャット会話履歴から重要情報を抽出して保存
 * 非同期で実行され、エラーが発生してもメインの応答には影響しない
 */
async function extractAndSaveMemoriesFromChat(
  messages: Message[],
  originalReq: Request
): Promise<void> {
  try {
    // メッセージ数が少ない場合はスキップ（最低2メッセージ以上 - 1往復分）
    if (messages.length < 2) {
      return;
    }

    // 一定のメッセージ数（3メッセージ）ごとにメモリを抽出
    // より頻繁にメモリを抽出して、重要な情報（名前、年齢など）をすぐに保存する
    const userMessageCount = messages.filter((m) => m.role === "user").length;
    const MEMORY_EXTRACTION_THRESHOLD = 3;
    
    if (userMessageCount === 0 || userMessageCount % MEMORY_EXTRACTION_THRESHOLD !== 0) {
      return;
    }

    // 会話履歴をConversationMessage[]に変換
    const conversationHistory: ConversationMessage[] = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // 会話から重要情報を抽出
    const extractedMemories = await extractMemoriesFromConversation(conversationHistory);
    
    if (extractedMemories.length === 0) {
      return;
    }

    // メモリを保存（内部APIエンドポイントを使用）
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // 元のリクエストからCookieを取得して転送（認証情報を渡すため）
    const cookies = originalReq.headers.get("cookie") || "";
    
    const saveResponse = await fetch(`${baseUrl}/api/memory/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookies, // 認証Cookieを転送
      },
      body: JSON.stringify({
        memories: extractedMemories,
        characterId: null, // characterIdは後で追加可能
        sessionId: "chat-session", // セッションID
      }),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error("Chat API - Failed to save memories:", errorText);
      return;
    }

    const saveResult = await saveResponse.json();
  } catch (error) {
    // エラーはログに記録するのみ（メインの応答には影響しない）
    console.error("Chat API - Memory extraction error:", error);
  }
}
