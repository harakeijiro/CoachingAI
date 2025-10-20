type Message = {
  role: string;
  content: string;
};

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 環境変数からAPIキーを取得
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 最後のユーザーメッセージを取得
  const lastUserMessage =
    (messages as Message[]).filter((m) => m.role === "user").pop()?.content || "";

  try {
    // 環境変数からモデル名を取得（デフォルトはgemini-2.5-flash）
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Gemini Streaming APIを呼び出し（streamGenerateContent）
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
                  text: `あなたは「みずき」です。端的な返信にしてください。

ユーザー: ${lastUserMessage}`,
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

    // Geminiからのストリーミングレスポンスをクライアントへ即座に中継
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

            // SSE形式のレスポンスをパース
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const jsonStr = line.slice(6); // "data: " を除去
                  const data = JSON.parse(jsonStr);
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                  if (text) {
                    // 受信したテキストを1文字ずつクライアントへ送信
                    for (const char of text) {
                      const payload = `0:"${char}"\n`;
                      controller.enqueue(encoder.encode(payload));
                    }
                  }
                } catch {
                  // JSONパースエラーは無視（不完全なチャンクの可能性）
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
