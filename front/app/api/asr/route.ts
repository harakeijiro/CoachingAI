import { MIN_AUDIO_SIZE } from "@/lib/utils/audio-constants";

export const runtime = "edge";

/**
 * 音声認識・会話統合APIエンドポイント
 * - Whisper APIで音声を文字起こし
 * - Gemini LLMでキャラクター返答を生成
 * - Cartesia TTSで音声合成
 * - セッション履歴を管理して文脈を保持
 * - 重要情報の自動抽出と保存（5メッセージごと）
 */

import { getSelectedCharacterConfig } from "@/lib/characters/registry";
import { extractMemoriesFromConversation } from "@/lib/utils/memory-extraction";
import type { ConversationMessage } from "@/lib/utils/memory-extraction";

// セッション管理（メモリ内）
const sessions = new Map<string, Array<{ role: string; content: string }>>();

// メモリ抽出の閾値（5メッセージごと）
const MEMORY_EXTRACTION_THRESHOLD = 5;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const sessionId = formData.get("sessionId") as string;
    const webSpeechText = formData.get("webSpeechText") as string | null;

    if (!audioFile) {
      return Response.json({ error: "No audio file" }, { status: 400 });
    }

    console.log("Step 4: Whisper API called, audio size:", audioFile.size, "bytes");

    // 0) 音声長チェック（0.5s未満は破棄）
    // webmファイルの場合、おおよそのサイズから推測
    // 48kHz, 16bit, モノラル = 約12KB/秒、ステレオ = 約24KB/秒
    // 安全のため、最小10KB（約0.5秒相当）以下は棄却
    if (audioFile.size < MIN_AUDIO_SIZE) {
      console.log("Step 4: Audio too short, rejecting. Size:", audioFile.size);
      return Response.json({ 
        userText: "", 
        replyText: "",
        drop: true 
      }, { status: 200 });
    }

    // ====== Step 2: Whisper APIで文字起こし ======
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured");
      return Response.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    // Whisper APIに送信
    const whisperFormData = new FormData();
    whisperFormData.append("file", audioFile);
    whisperFormData.append("model", "whisper-1");
    whisperFormData.append("language", "ja");
    // 1) Whisper設定（温度を0に設定して最も確定的な出力を得る）
    whisperFormData.append("temperature", "0");
    // 2) Web Speech APIの結果をinitial_promptとして使用（精度向上のため）
    if (webSpeechText && webSpeechText.trim() && webSpeechText !== "…") {
      whisperFormData.append("prompt", webSpeechText.trim());
      console.log("Step 4: Using Web Speech result as initial_prompt:", webSpeechText.trim());
    } else {
      whisperFormData.append("prompt", "");
    }

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Whisper API error:", response.status, errorText);
      return Response.json({ 
        error: `Whisper API error: ${response.status}` 
      }, { status: response.status });
    }

    const whisperData = await response.json();
    const userText = whisperData.text || "";

    console.log("Step 4: Transcription result:", userText);

    // 2) 無音ハルシネーションの棄却（短すぎる文字列や空白のみを棄却）
    // OpenAI Whisper APIにはno_speech_probが直接返されないため、
    // 代替として短すぎる文字列を棄却
    if (!userText || userText.trim().length < 2) {
      console.log("Step 4: Transcription too short or empty, rejecting");
      return Response.json({ 
        userText: "", 
        replyText: "",
        drop: true 
      }, { status: 200 });
    }

    // ====== Step 4: LLM連携 ======
    console.log("Step 4: Calling LLM...");

    // セッション履歴を管理
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }
    const history = sessions.get(sessionId)!;

    // ユーザー発話を履歴に追加
    history.push({ role: "user", content: userText });

    // Gemini APIでLLM返答を生成
    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!geminiApiKey) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
      return Response.json({ error: "GOOGLE_GENERATIVE_AI_API_KEY not configured" }, { status: 500 });
    }

    // キャラクター設定を取得（選択中のキャラクター）
    const characterConfig = getSelectedCharacterConfig();

    // キャラクター人格プロンプトを組み立て
    const recentHistory = history.slice(-5); // 直近5件のみ使用
    const contextMessages = recentHistory.map((h) => `${h.role === "user" ? "ユーザー" : characterConfig.name}: ${h.content}`).join("\n");

    const promptForModel = `
あなたの名前は「${characterConfig.name}」です。
${characterConfig.personaCore}

過去の会話：
${contextMessages}

ユーザー: ${userText}

指示: 上記を踏まえ、返答は簡潔に、1文以内で答えてください。
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptForModel }] }],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      return Response.json({ 
        error: `Gemini API error: ${geminiResponse.status}` 
      }, { status: geminiResponse.status });
    }

    const geminiData = await geminiResponse.json();
    const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("Step 4: LLM reply:", replyText);

    // 返答を履歴に追加
    history.push({ role: "assistant", content: replyText });

    // ====== Step 4.5: 重要情報の自動抽出 ======
    // 一定のメッセージ数（5メッセージ）ごとにメモリを抽出
    const userMessageCount = history.filter((h) => h.role === "user").length;
    if (userMessageCount > 0 && userMessageCount % MEMORY_EXTRACTION_THRESHOLD === 0) {
      // characterIdを取得（formDataから取得するか、デフォルト値を使用）
      // 注意: getSelectedCharacterId()は"mental-dog"のような文字列IDを返すが、
      // データベースのcharacter_idはUUID型なので、NULLを設定する
      // 将来的に実際のUUIDを取得するか、マッピングする必要がある
      // 現時点ではuser_idでユーザーに紐付けられているため、character_idはNULLでも問題ない
      const characterId = formData.get("characterId") as string | null;
      
      // UUID形式でない場合はNULLにする（文字列IDはUUIDとして保存できないため）
      const validCharacterId = characterId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(characterId)
        ? characterId
        : null;
      
      // 非同期で実行（エラーが発生してもメインの応答には影響しない）
      // 認証Cookieを転送するため、元のリクエストを渡す
      extractAndSaveMemories(history, sessionId, validCharacterId, req).catch((error) => {
        console.error("Memory extraction error (non-blocking):", error);
      });
    }

    // ====== Step 5: TTS音声生成 ======
    console.log("Step 5: Generating TTS...");
    
    const cartesiaApiKey = process.env.CARTESIA_API_KEY;
    const version = process.env.CARTESIA_VERSION || "2025-04-16";
    
    if (!cartesiaApiKey) {
      console.error("CARTESIA_API_KEY not configured");
      return Response.json({ 
        userText,
        replyText,
        audioData: "", // TTS生成失敗
      });
    }

    try {
      // Cartesia TTS APIで音声生成
      const ttsBody = {
        transcript: replyText,
        model_id: "sonic-2",
        voice: { mode: "id", id: "0cd0cde2-3b93-42b5-bcb9-f214a591aa29" },
        output_format: {
          container: "wav",
          encoding: "pcm_s16le",
          sample_rate: 44100,
        },
      };

      const ttsResponse = await fetch("https://api.cartesia.ai/tts/bytes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cartesiaApiKey}`,
          "Content-Type": "application/json",
          "Cartesia-Version": version,
        },
        body: JSON.stringify(ttsBody),
      });

      if (!ttsResponse.ok) {
        console.error("TTS API error:", ttsResponse.status);
        return Response.json({ 
          userText,
          replyText,
          audioData: "", // TTS生成失敗
        });
      }

      // 音声バイナリを取得してbase64エンコード
      const audioBytes = await ttsResponse.arrayBuffer();
      
      // Edge RuntimeではBufferが使えないため、Uint8Arrayからbase64に変換
      const uint8Array = new Uint8Array(audioBytes);
      
      // 大きなファイルでも安全に変換するため、チャンクに分けて処理
      let binaryString = '';
      const chunkSize = 8192; // 8KBずつ処理
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64Audio = btoa(binaryString);

      console.log("Step 5: TTS generated, size:", audioBytes.byteLength, "bytes");

      return Response.json({ 
        userText,
        replyText,
        audioData: base64Audio,
      });

    } catch (error) {
      console.error("Step 5: TTS generation error:", error);
      return Response.json({ 
        userText,
        replyText,
        audioData: "", // TTS生成失敗
      });
    }

  } catch (error) {
    console.error("ASR API error:", error);
    return Response.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * 会話履歴から重要情報を抽出して保存
 * 非同期で実行され、エラーが発生してもメインの応答には影響しない
 */
async function extractAndSaveMemories(
  history: Array<{ role: string; content: string }>,
  sessionId: string,
  characterId: string | null,
  originalReq: Request
): Promise<void> {
  try {
    console.log("Step 4.5: Starting memory extraction...");

    // 会話履歴をConversationMessage[]に変換
    const conversationHistory: ConversationMessage[] = history.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    }));

    // 会話から重要情報を抽出
    const extractedMemories = await extractMemoriesFromConversation(conversationHistory);
    
    if (extractedMemories.length === 0) {
      console.log("Step 4.5: No memories extracted");
      return;
    }

    console.log(`Step 4.5: Extracted ${extractedMemories.length} memories:`, extractedMemories);

    // メモリを保存（Server Actionを呼び出すため、内部APIエンドポイントを使用）
    // Edge Runtimeから直接Server Actionを呼び出せないため、内部APIエンドポイントを作成
    // 注意: Edge Runtimeでは環境変数が異なる可能性があるため、フルURLを使用
    // VERCEL_URLがある場合は使用、なければNEXT_PUBLIC_APP_URL、それもなければlocalhost
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
        characterId: characterId || null,
        sessionId,
      }),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error("Step 4.5: Failed to save memories:", errorText);
      return;
    }

    const saveResult = await saveResponse.json();
    console.log("Step 4.5: Memories saved:", saveResult);
  } catch (error) {
    // エラーはログに記録するのみ（メインの応答には影響しない）
    console.error("Step 4.5: Memory extraction error:", error);
  }
}

