export const runtime = "edge";

type GeminiModel = {
  name: string;
  displayName: string;
  supportedGenerationMethods?: string[];
};

type GeminiModelsResponse = {
  models?: GeminiModel[];
};

export async function GET() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key)
    return Response.json({ ok: false, error: "NO_API_KEY" }, { status: 500 });

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${key}`
  );

  if (!r.ok) {
    const errorText = await r.text();
    return new Response(errorText, {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = (await r.json()) as GeminiModelsResponse;

  // generateContentメソッドをサポートしているモデルのみをフィルタリング
  const compatibleModels = data.models?.filter((model) =>
    model.supportedGenerationMethods?.includes("generateContent")
  );

  return Response.json(
    {
      total: data.models?.length || 0,
      compatible: compatibleModels?.length || 0,
      models:
        compatibleModels?.map((m) => ({
          name: m.name,
          displayName: m.displayName,
          supportedMethods: m.supportedGenerationMethods,
        })) || [],
    },
    { status: 200 }
  );
}
