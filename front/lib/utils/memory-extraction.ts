/**
 * 会話から重要情報を抽出するユーティリティ
 * LLMを使用して会話履歴から重要なメモリ情報を抽出
 */

import { ExtractedMemory, MemoryType } from "@/lib/types/memory";

/**
 * LLMプロンプト用の会話履歴の型
 */
export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * 会話履歴から重要情報を抽出するためのプロンプトを生成
 */
export function generateMemoryExtractionPrompt(
  conversationHistory: ConversationMessage[]
): string {
  const conversationText = conversationHistory
    .map((msg) => `${msg.role === "user" ? "ユーザー" : "アシスタント"}: ${msg.content}`)
    .join("\n");

  return `以下の会話履歴から、ユーザーに関する重要な情報を抽出してください。

【会話履歴】
${conversationText}

【抽出すべき情報の種類】
以下の5種類の情報を抽出してください：

1. **personal_info（身の回りの情報）**
   - 名前、年齢、生年月日、出身地、住所など
   - 家族構成（配偶者、子供、両親など）
   - 職業、職場、学校など
   - 趣味、好きなもの、嫌いなものなど
   - 健康状態、病気、薬など

2. **goal（目標や意図）**
   - 具体的な目標（例：「来月までに転職したい」「体重を5kg減らしたい」）
   - 将来の計画や夢
   - 意図や動機

3. **behavior_pattern（行動パターン）**
   - 繰り返し現れる行動傾向（例：「ストレスで夜更かししがち」「休日は家にこもりがち」）
   - 習慣や癖
   - 意思決定のパターン

4. **affect_trend（感情の傾向）**
   - 感情のパターンや変化（例：「最近不安になりやすい」「ストレスでイライラすることが多い」）
   - 気分の傾向
   - ストレス要因

5. **advice_history（アドバイス履歴）**
   - ユーザーが受け取った有用なアドバイスや提案
   - 実践すべきことや注意点

【抽出基準】
- 信頼度（confidence）を0.0〜1.0で評価してください
- 信頼度0.7以上の情報のみを抽出してください
- 曖昧な情報は抽出しないでください
- 重複する情報は統合してください

【出力形式】
JSON形式で出力してください。各メモリは以下の形式で記述してください：

\`\`\`json
{
  "memories": [
    {
      "memory_type": "personal_info",
      "topic": "名前",
      "content": "田中太郎",
      "confidence": 0.95,
      "reason": "ユーザーが直接自分の名前を明かした"
    },
    {
      "memory_type": "goal",
      "topic": "転職の目標",
      "content": "来月までにWebエンジニアとして転職したい",
      "confidence": 0.85,
      "reason": "具体的な目標と期限が明確に語られている"
    }
  ]
}
\`\`\`

【注意事項】
- 情報が明示的に語られていない場合は抽出しないでください
- 推測や憶測は避けてください
- 情報が曖昧な場合は信頼度を低く設定してください
- 既に抽出済みの情報と同じ内容は追加しないでください

会話履歴を分析して、重要情報を抽出してください。`;
}

/**
 * LLMからのレスポンス（JSON文字列）をパースしてExtractedMemory[]に変換
 * 不完全なJSONでも可能な限りパースを試みる
 */
export function parseExtractedMemories(
  llmResponse: string
): ExtractedMemory[] {
  try {
    let jsonText = llmResponse.trim();
    
    // Markdownコードブロックを検出して削除
    // パターン1: ```json\n{...}\n``` の形式（改行を含む）
    const jsonBlockMatch = jsonText.match(/```json\s*\n?([\s\S]*?)\n?```/i);
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1].trim();
    } else {
      // パターン2: ```\n{...}\n``` の形式（json指定なし）
      const codeBlockMatch = jsonText.match(/```\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      } else {
        // パターン3: コードブロックがない場合、直接JSONオブジェクトを探す
        const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonText = jsonObjectMatch[0];
        }
      }
    }
    
    // 最終的にトリム
    jsonText = jsonText.trim();
    
    // JSONが不完全な場合を考慮して、可能な限りパースを試みる
    // まず、完全なJSONパースを試みる
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.memories && Array.isArray(parsed.memories)) {
        return extractValidMemories(parsed.memories);
      }
    } catch (parseError) {
      // JSONパースに失敗した場合、不完全なJSONから個別のメモリオブジェクトを抽出
      console.warn("JSON parse failed, attempting partial extraction:", parseError);
      
      // memories配列内の各オブジェクトを個別に抽出
      const memoryObjects: any[] = [];
      
      // { "memory_type": ... } のパターンを探す
      const memoryPattern = /\{\s*"memory_type"\s*:\s*"([^"]+)"\s*,\s*"topic"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([^"]+)"\s*,\s*"confidence"\s*:\s*([\d.]+)/g;
      
      let match;
      while ((match = memoryPattern.exec(jsonText)) !== null) {
        try {
          // 各メモリオブジェクトを個別に抽出（不完全でも可能な限り）
          const memoryStart = match.index;
          // 次の}までを探す（不完全な場合もある）
          let memoryEnd = jsonText.indexOf('}', memoryStart);
          if (memoryEnd === -1) {
            // }が見つからない場合、最後まで
            memoryEnd = jsonText.length;
          }
          
          const memoryText = jsonText.substring(memoryStart, memoryEnd + 1);
          // 不完全なJSONでも可能な限りパース
          const memoryObj = {
            memory_type: match[1],
            topic: match[2],
            content: match[3],
            confidence: parseFloat(match[4]),
          };
          
          memoryObjects.push(memoryObj);
        } catch (e) {
          // 個別のメモリのパースに失敗しても続行
          console.warn("Failed to parse individual memory:", e);
        }
      }
      
      if (memoryObjects.length > 0) {
        return extractValidMemories(memoryObjects);
      }
    }
    
    return [];
  } catch (error) {
    console.error("Failed to parse extracted memories:", error);
    console.error("LLM response:", llmResponse);
    return [];
  }
}

/**
 * 抽出されたメモリオブジェクトから有効なメモリのみをフィルタリング
 */
function extractValidMemories(memories: any[]): ExtractedMemory[] {
  return memories
    .filter((m: any) => {
      // 必須フィールドのチェック
      return (
        m.memory_type &&
        m.topic &&
        m.content &&
        typeof m.confidence === "number" &&
        m.confidence >= 0 &&
        m.confidence <= 1
      );
    })
    .map((m: any) => ({
      memory_type: m.memory_type as MemoryType,
      topic: m.topic,
      content: m.content,
      confidence: m.confidence,
      reason: m.reason,
    }));
}

/**
 * Gemini APIを使用して会話から重要情報を抽出
 */
export async function extractMemoriesFromConversation(
  conversationHistory: ConversationMessage[]
): Promise<ExtractedMemory[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
  const prompt = generateMemoryExtractionPrompt(conversationHistory);

  try {
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
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3, // 低めの温度で確定的な出力
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096, // JSON出力を確実にするため増加
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      console.warn("No text in Gemini response");
      return [];
    }

    return parseExtractedMemories(text);
  } catch (error) {
    console.error("Error extracting memories:", error);
    throw error;
  }
}

