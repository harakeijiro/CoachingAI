/**
 * チャットAPIエンドポイント
 * - ユーザーメッセージをGemini LLMに送信
 * - キャラクター人格プロンプトと組み合わせて応答生成
 * - ストリーミング形式でレスポンスを返却
 */
// front/app/api/chat/route.ts

import { getSelectedCharacterConfig } from "@/lib/characters/registry";

type Message = {
  role: string;
  content: string;
};

export async function POST(req: Request) {
  const { messages } = await req.json();

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

  // キャラクター設定を取得（選択中のキャラクター）
  const characterConfig = getSelectedCharacterConfig();

  // ユーザーの直近メッセージ
  const lastUserMessage =
    (messages as Message[]).filter((m) => m.role === "user").pop()?.content || "";

  // ここでキャラクター人格プロンプトを組み立てる
  // この塊が「毎ターンLLMに渡す内容」になる
  const promptForModel = `
  あなたの名前は「${characterConfig.name}」です。
  ${characterConfig.personaCore}
  
  ユーザー: ${lastUserMessage}
  
  指示: 上記を踏まえ、返答は簡潔に、2文以内で答えてください。

${characterConfig.personaCore}

ユーザー: ${lastUserMessage}
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
