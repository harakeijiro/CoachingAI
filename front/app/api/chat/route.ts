// テスト用のダミー実装（OpenAI APIキー不要）
export async function POST(req: Request) {
  const { messages } = await req.json();

  // 最後のユーザーメッセージを取得
  const lastMessage = messages[messages.length - 1]?.content || "";

  // ダミーの応答メッセージ
  const responses = [
    "こんにちは！私はテストモードで動作している犬のAIアシスタントです。ワンワン！🐕",
    "とても良い質問ですね！OpenAI APIキーを設定すると、もっと賢い返答ができるようになりますよ。",
    "お話しできて嬉しいです！今はダミーモードなので、決まった返答しかできませんが、いつでもお手伝いしますよ！",
    "なるほど、そうなんですね。本物のAI機能を使うには、.env.localファイルにOPENAI_API_KEYを設定してください。",
    "ワンワン！今日も良い天気ですね。テストモードでも楽しくお話しできますよ！",
  ];

  // ランダムに応答を選択（またはメッセージの長さに基づいて選択）
  const response = responses[messages.length % responses.length];

  // ストリーミング形式で返す
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 文字を一つずつストリーミング
      for (let i = 0; i < response.length; i++) {
        const char = response[i];
        // Vercel AI SDKのデータストリーム形式に合わせる
        const data = `0:"${char}"\n`;
        controller.enqueue(encoder.encode(data));
        // 少し遅延を入れて、タイピング効果を演出
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
}
