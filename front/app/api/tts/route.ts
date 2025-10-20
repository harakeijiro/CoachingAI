export const runtime = "edge";

type TtsRequest = {
  text: string;
  voiceId?: string;
  modelId?: string;
  sampleRate?: number;
};

export async function POST(req: Request) {
  let payload: TtsRequest | null = null;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "INVALID_JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "NO_CARTESIA_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const text = (payload?.text || "").toString().trim();
  if (!text) {
    return new Response(JSON.stringify({ error: "TEXT_REQUIRED" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const modelId = payload?.modelId || "sonic-2";
  const sampleRate = payload?.sampleRate || 44100;
  const version = process.env.CARTESIA_VERSION || "2025-04-16";
  // デフォルトボイスIDを設定（ユーザー指定のモデル）
  const voiceId = payload?.voiceId || "0cd0cde2-3b93-42b5-bcb9-f214a591aa29";

  const body = {
    transcript: text,
    model_id: modelId,
    voice: { mode: "id", id: voiceId },
    output_format: {
      container: "wav",
      encoding: "pcm_s16le",
      sample_rate: sampleRate,
    },
  };

  const r = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Cartesia-Version": version,
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    return new Response(
      errText || JSON.stringify({ error: "CARTESIA_TTS_FAILED" }),
      {
        status: r.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // バイナリをそのままストリーミングで返す
  return new Response(r.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "no-store",
    },
  });
}
