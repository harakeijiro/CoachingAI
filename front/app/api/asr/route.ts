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
import type { Memory } from "@/lib/types/memory";

// セッション管理（メモリ内）
const sessions = new Map<string, Array<{ role: string; content: string }>>();

// メモリ抽出の閾値（3メッセージごと）
// より頻繁にメモリを抽出して、重要な情報（名前、年齢など）をすぐに保存する
const MEMORY_EXTRACTION_THRESHOLD = 3;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const sessionId = formData.get("sessionId") as string;
    const webSpeechText = formData.get("webSpeechText") as string | null;
    // メモリをFormDataから取得（ステップ4: JSON文字列として受け取る）
    const memoriesJson = formData.get("memories") as string | null;
    let memories: Memory[] = [];
    if (memoriesJson) {
      try {
        memories = JSON.parse(memoriesJson) as Memory[];
      } catch (error) {
        console.error("ASR API - Failed to parse memories:", error);
        // パースエラー時は空配列のまま続行
      }
    }

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
    // 2) verbose_json形式で詳細情報を取得（信頼性指標をチェックするため）
    whisperFormData.append("response_format", "verbose_json");
    // 3) Web Speech APIの結果をinitial_promptとして使用（精度向上のため）
    // 条件を緩和：2文字以上200文字未満（日本語は短い単語でも意味を持つため）
    // 注意: promptパラメータは空文字列ではなく、有効な値がある場合のみ追加する
    if (webSpeechText && webSpeechText.trim() && webSpeechText !== "…") {
      const webSpeechTrimmed = webSpeechText.trim();
      // 2文字以上200文字未満で使用（以前は5文字以上100文字未満だったが、緩和して精度向上）
      if (webSpeechTrimmed.length >= 2 && webSpeechTrimmed.length < 200) {
        whisperFormData.append("prompt", webSpeechTrimmed);
        console.log("Step 4: Using Web Speech result as initial_prompt:", webSpeechTrimmed);
      } else {
        console.log("Step 4: Web Speech result too short/long, skipping prompt:", webSpeechTrimmed.length);
        // promptパラメータを追加しない（空文字列は送信しない）
      }
    }
    // webSpeechTextが無い場合もpromptパラメータを追加しない

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
      console.error("Whisper API request details:", {
        audioSize: audioFile.size,
        audioType: audioFile.type,
        hasPrompt: whisperFormData.has("prompt"),
      });
      return Response.json({ 
        error: `Whisper API error: ${response.status}`,
        details: errorText 
      }, { status: response.status });
    }

    const whisperData = await response.json();
    let userText = whisperData.text || "";

    console.log("Step 4: Transcription result:", userText);

    // Web Speech APIとWhisper APIの結果を比較（Whisperのハルシネーション検出）
    // Web Speech APIの結果が存在し、かつWhisper APIの結果と大きく異なる場合は、Web Speech APIを優先
    if (webSpeechText && webSpeechText.trim() && webSpeechText !== "…") {
      const webSpeechTrimmed = webSpeechText.trim();
      
      // 文字列類似度を計算（簡易版：共通文字の割合）
      const calculateSimpleSimilarity = (str1: string, str2: string): number => {
        const s1 = str1.trim();
        const s2 = str2.trim();
        if (s1 === s2) return 1.0;
        if (s1.length === 0 || s2.length === 0) return 0.0;
        
        // 短い文字列が長い文字列に含まれているかチェック
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        if (longer.includes(shorter)) {
          return shorter.length / longer.length;
        }
        
        // 共通文字数をカウント
        const commonChars = Array.from(shorter).filter(char => longer.includes(char)).length;
        return commonChars / Math.max(s1.length, s2.length);
      };
      
      const similarity = calculateSimpleSimilarity(webSpeechTrimmed, userText);
      
      // 類似度が0.3未満の場合、Web Speech APIの結果を優先（Whisperが誤認識している可能性が高い）
      if (similarity < 0.3 && webSpeechTrimmed.length >= 3) {
        console.log("Step 4: Whisper hallucination detected, using Web Speech result instead.");
        console.log(`Step 4: Similarity: ${similarity.toFixed(2)}`);
        console.log(`Step 4: Web Speech: "${webSpeechTrimmed}"`);
        console.log(`Step 4: Whisper: "${userText}"`);
        userText = webSpeechTrimmed;
      }
    }

    // 2) 無音ハルシネーションの棄却（短すぎる文字列や空白のみを棄却）
    if (!userText || userText.trim().length < 2) {
      console.log("Step 4: Transcription too short or empty, rejecting");
      return Response.json({ 
        userText: "", 
        replyText: "",
        drop: true,
        unclear: true
      }, { status: 200 });
    }

    // 3) 信頼性チェック（verbose_json形式の場合、segmentsやno_speech_probが取得できる）
    const segments = whisperData.segments || [];
    let isUnclear = false;
    
    // Web Speech APIの結果をチェック（Web Speech APIが何も認識していない場合、誤認識の可能性が高い）
    const webSpeechRecognized = webSpeechText && webSpeechText.trim() && webSpeechText !== "…" && webSpeechText.trim().length >= 2;
    
    // segmentsがある場合、各セグメントのno_speech_probを確認
    if (segments.length > 0) {
      // 各セグメントのno_speech_probの平均を計算
      const avgNoSpeechProb = segments.reduce((sum: number, seg: any) => {
        return sum + (seg.no_speech_prob || 0.5);
      }, 0) / segments.length;
      
      // Web Speechが空の場合、no_speech_probの閾値を下げる（ハルシネーション検出を強化）
      // Web Speechが認識している場合は0.8、認識していない場合は0.5
      const noSpeechThreshold = webSpeechRecognized ? 0.8 : 0.5;
      
      // 信頼性チェックの条件：
      // 1. no_speech_probが閾値以上の場合（Web Speechが空の場合は0.5、そうでない場合は0.8）
      // 2. 文字列が非常に短い（3文字未満）場合
      // 3. Web Speech APIが認識しておらず、かつWhisper APIの結果が短い（5文字未満）場合
      isUnclear = avgNoSpeechProb >= noSpeechThreshold 
        || userText.trim().length < 3 
        || (!webSpeechRecognized && userText.trim().length < 5);
    } else {
      // segmentsがない場合、Web Speechが空の場合は不明瞭として扱う
      // segmentsがない = 詳細情報がない = 信頼性が低い
      isUnclear = userText.trim().length < 3 || !webSpeechRecognized;
    }

    // ====== Step 4: LLM連携 ======
    console.log("Step 4: Calling LLM...");

    // セッション履歴を管理
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }
    const history = sessions.get(sessionId)!;

    // ユーザー発話を履歴に追加（unclearの場合は追加しない）
    if (!isUnclear) {
      history.push({ role: "user", content: userText });
    }

    // Gemini APIでLLM返答を生成
    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!geminiApiKey) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
      return Response.json({ error: "GOOGLE_GENERATIVE_AI_API_KEY not configured" }, { status: 500 });
    }

    // キャラクター設定取得（ステップ4: メモリ取得処理を削除）
    const characterConfig = getSelectedCharacterConfig();

    // メモリをFormDataから取得したものを使用（ステップ4: DBクエリを削除）
    let memoryContext = "";
    try {
      if (memories && Array.isArray(memories) && memories.length > 0) {
        const memoryTexts = memories.map(
          (m: Memory) => `- ${m.topic}: ${m.content}`
        );

        if (memoryTexts.length > 0) {
          memoryContext = memoryTexts.join("\n");
        }
      }
    } catch (error) {
      console.error("ASR API - Error processing memories:", error);
    }

    // unclearの場合と通常の場合でプロンプトを分岐
    let promptForModel: string;
    
    if (isUnclear) {
      // 聞こえなかった場合のプロンプト
      const recentHistory = history.slice(-5); // 直近5件のみ使用
      const contextMessages = recentHistory.map((h) => `${h.role === "user" ? "ユーザー" : characterConfig.name}: ${h.content}`).join("\n");

      promptForModel = `
あなたの名前は「${characterConfig.name}」です。

${characterConfig.personaCore}

最近の会話：
${contextMessages ? contextMessages : "まだ会話が始まったばかりです。"}

状況: ユーザーの発話が聞き取れませんでした。音声が不明瞭だったり、ノイズしか入っていなかった可能性があります。

指示: 優しく「聞こえませんでした。もう一度お願いします。」または「すみません、もう一度話してもらえますか？」など、ユーザーに再度発話を促すメッセージを簡潔に（1文以内で）返してください。
`;
    } else {
      // 通常の会話のプロンプト
      const isAskingAboutMemory = (userText.includes("覚え") || 
                                   userText.includes("何") ||
                                   userText.includes("知って") ||
                                   userText.includes("記憶") ||
                                   userText.includes("名前") ||
                                   userText.includes("年齢") ||
                                   userText.includes("目標")) &&
                                   memoryContext;

      // キャラクター人格プロンプトを組み立て
      const recentHistory = history.slice(-5); // 直近5件のみ使用
      const contextMessages = recentHistory.map((h) => `${h.role === "user" ? "ユーザー" : characterConfig.name}: ${h.content}`).join("\n");

      const memorySection = memoryContext 
        ? `\n\n【あなたがユーザーについて覚えていること】\n${memoryContext}\n`
        : "";

      const answerInstruction = isAskingAboutMemory
        ? `\n\n【最重要】ユーザーから覚えている情報について質問されています。上記の【あなたがユーザーについて覚えていること】を確認し、質問された情報があれば必ずその情報を答えてください。質問された情報がない場合のみ「聞かせてくれると嬉しい」などと言っても構いませんが、まずは覚えている情報を確認してください。`
        : memoryContext
        ? `\n\n【重要】上記の覚えている情報について質問された場合は、必ず覚えている情報を基に答えてください。会話の中で適切な場面があれば、覚えている情報を自然に使ってください。`
        : "";

      promptForModel = `
あなたの名前は「${characterConfig.name}」です。
${memorySection}${answerInstruction}

${characterConfig.personaCore}

過去の会話：
${contextMessages}

ユーザー: ${userText}

指示: ${isAskingAboutMemory ? "ユーザーが覚えている情報について質問しているので、上記の【あなたがユーザーについて覚えていること】を確認して、質問された情報を必ず答えてください。" : ""}上記を踏まえ、返答は簡潔に、1文以内で答えてください。${memoryContext ? "覚えている情報がある場合は、それを活用して会話してください。" : ""}
`;
    }

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
    // 一定のメッセージ数（3メッセージ）ごとにメモリを抽出
    // より頻繁にメモリを抽出して、重要な情報（名前、年齢など）をすぐに保存する
    const userMessageCount = history.filter((h) => h.role === "user").length;
    let memoryMayBeUpdated = false;
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
      memoryMayBeUpdated = true;
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
          userText: isUnclear ? "" : userText,
          replyText,
          audioData: "", // TTS生成失敗
          unclear: isUnclear,
          memoryMayBeUpdated, // メモリが更新された可能性があるフラグ
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
          userText: isUnclear ? "" : userText,
          replyText,
          audioData: "", // TTS生成失敗
          unclear: isUnclear,
          memoryMayBeUpdated, // メモリが更新された可能性があるフラグ
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
        userText: isUnclear ? "" : userText,
        replyText,
        audioData: base64Audio,
        unclear: isUnclear,
        memoryMayBeUpdated, // メモリが更新された可能性があるフラグ
      });

    } catch (error) {
      console.error("Step 5: TTS generation error:", error);
      return Response.json({ 
        userText: isUnclear ? "" : userText,
        replyText,
        audioData: "", // TTS生成失敗
        unclear: isUnclear,
        memoryMayBeUpdated, // メモリが更新された可能性があるフラグ
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

    // シンプルな形式でメモリを表示
    const memoryTexts = extractedMemories.map(
      (m) => `- ${m.topic}: ${m.content}`
    );
    console.log(`Step 4.5: Extracted ${extractedMemories.length} memories:\n${memoryTexts.join("\n")}`);

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
    
    // 保存結果をシンプルに表示
    if (saveResult.success && saveResult.data && Array.isArray(saveResult.data) && saveResult.data.length > 0) {
      const savedMemoryTexts = saveResult.data.map(
        (m: Memory) => `- ${m.topic}: ${m.content}`
      );
      console.log(`Step 4.5: Memories saved (${saveResult.data.length}件):\n${savedMemoryTexts.join("\n")}`);
    } else {
      console.log(`Step 4.5: ${saveResult.message || "Memories saved"}`);
    }
  } catch (error) {
    // エラーはログに記録するのみ（メインの応答には影響しない）
    console.error("Step 4.5: Memory extraction error:", error);
  }
}

