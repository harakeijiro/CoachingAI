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
    messages.filter((m: any) => m.role === "user").pop()?.content || "";

  try {
    // 環境変数からモデル名を取得（デフォルトはgemini-2.5-flash）
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Google Generative AI REST APIを直接呼び出し
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
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
                  text: `あなたは親切で優しい犬のAIアシスタントです。日本語で自然な会話をしてください。時々「ワンワン！」と言って犬らしさを出してください。\n\nユーザー: ${lastUserMessage}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "申し訳ありません。応答を生成できませんでした。";

    // ストリーミング形式で返す
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // 文字を一つずつストリーミング
        for (let i = 0; i < aiResponse.length; i++) {
          const char = aiResponse[i];
          const data = `0:"${char}"\n`;
          controller.enqueue(encoder.encode(data));
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
        controller.close();
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
