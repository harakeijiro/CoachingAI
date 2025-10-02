"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Model as Dog } from "@/components/chat/Dog";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 音声入力関連
  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);

  // 音声合成（TTS）関連
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportsTTS, setSupportsTTS] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[] | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  // 音声キュー（複数文の順次再生用）
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingQueueRef = useRef(false);

  // キャラクターは音声を出している時だけ口を動かす
  const isTalking = isSpeaking;

  // Web Speech API 初期化
  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;

    if (SR) {
      setSupportsSpeech(true);
      const recognition = new SR();
      recognition.lang = "ja-JP";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: any) => {
        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += transcript;
          else interim += transcript;
        }
        setInput((prev) => {
          const base = prev.replace(/（話し中….*）$/u, "");
          return finalText
            ? base + finalText
            : base + (interim ? `（話し中…${interim}）` : "");
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInput((prev) => prev.replace(/（話し中….*）$/u, ""));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  // TTS 初期化
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasTTS =
      "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setSupportsTTS(!!hasTTS);
    if (!hasTTS) return;

    const synth = window.speechSynthesis;
    const updateVoices = () => {
      const v = synth.getVoices();
      if (v && v.length) {
        voicesRef.current = v;
        // 利用可能な日本語ボイスをログ出力（初回のみ）
        const jaVoices = v.filter(
          (voice) =>
            /ja/i.test(voice.lang || "") ||
            /日本語|Japanese/i.test(voice.name || "")
        );
        if (jaVoices.length > 0) {
          console.log("📢 利用可能な日本語ボイス:");
          jaVoices.forEach((voice) => {
            console.log(`  - ${voice.name} (${voice.lang})`);
          });
        }
      }
    };
    updateVoices();
    synth.onvoiceschanged = updateVoices;

    return () => {
      try {
        synth.onvoiceschanged = null as any;
      } catch {}
      try {
        synth.cancel();
      } catch {}
    };
  }, []);

  // TTS 制御
  const cancelSpeaking = () => {
    // キューをクリア
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;

    try {
      audioEl?.pause();
    } catch {}
    try {
      // 既存の Web Speech 再生が残っていたら停止
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel?.();
      }
    } catch {}
    setIsSpeaking(false);
  };

  // 音声キューの次の項目を再生
  const playNextInQueue = async () => {
    if (isPlayingQueueRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingQueueRef.current = true;
    const text = audioQueueRef.current.shift()!;

    try {
      // Cartesia TTS API を呼び出し
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      setAudioEl(a);
      a.onplay = () => {
        setIsSpeaking(true);
      };
      a.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        isPlayingQueueRef.current = false;
        // 次の音声を再生
        playNextInQueue();
      };
      a.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        isPlayingQueueRef.current = false;
        // エラーでも次の音声を再生
        playNextInQueue();
      };
      await a.play();
    } catch (e) {
      console.error("Cartesia TTS error, fallback to Web Speech API:", e);
      // フォールバック: ブラウザの Web Speech API
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const synth = window.speechSynthesis;

          const utt = new SpeechSynthesisUtterance(text);
          utt.lang = "ja-JP";
          utt.rate = 0.95;
          utt.pitch = 0.85;
          utt.volume = 1.0;

          const vs = voicesRef.current;
          if (vs && vs.length) {
            const preferMale = [
              "Otoya",
              "Hattori",
              "Google 日本語",
              "Microsoft Ichiro",
              "Kenji",
            ];
            const jaVoices = vs.filter(
              (v) =>
                /ja/i.test(v.lang || "") ||
                /日本語|Japanese/i.test(v.name || "")
            );
            jaVoices.sort((a, b) => {
              const ai = preferMale.findIndex((p) =>
                (a.name || "").includes(p)
              );
              const bi = preferMale.findIndex((p) =>
                (b.name || "").includes(p)
              );
              return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            });
            if (jaVoices[0]) {
              utt.voice = jaVoices[0];
            }
          }

          utt.onstart = () => setIsSpeaking(true);
          utt.onend = () => {
            setIsSpeaking(false);
            isPlayingQueueRef.current = false;
            playNextInQueue();
          };
          utt.onerror = () => {
            setIsSpeaking(false);
            isPlayingQueueRef.current = false;
            playNextInQueue();
          };
          utteranceRef.current = utt;
          synth.speak(utt);
          return;
        }
      } catch {}
      setIsSpeaking(false);
      isPlayingQueueRef.current = false;
      playNextInQueue();
    }
  };

  const speak = (text: string) => {
    if (!text) return;
    // キューに追加して再生開始
    audioQueueRef.current.push(text);
    playNextInQueue();
  };

  // 録音制御
  const startRecording = () => {
    if (!recognitionRef.current) return;
    cancelSpeaking(); // 録音前にTTS停止
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch {}
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
  };

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };

  // メッセージ送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 録音中なら送信前に停止
    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
    }

    // 読み上げ中なら停止
    cancelSpeaking();

    // 暫定表示を削除
    const finalInput = input.replace(/（話し中….*）$/u, "");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: finalInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`API Error (${response.status}):`, errText);
        throw new Error(
          `Failed to fetch (${response.status}): ${errText || "no body"}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader");

      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      // 表示はしないが、会話コンテキストとして保持
      setMessages((prev) => [...prev, assistantMessage]);

      // バッファリング用の変数とタイマー
      let updateScheduled = false;
      const scheduleUpdate = () => {
        if (!updateScheduled) {
          updateScheduled = true;
          requestAnimationFrame(() => {
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { ...assistantMessage };
              return newMessages;
            });
            updateScheduled = false;
          });
        }
      };

      // TTS先行開始用の変数
      let lastSpokenIndex = 0; // 最後に読み上げた位置
      const sentenceEndPattern = /[。！？\n]/; // 文末判定パターン

      const checkAndSpeak = () => {
        if (!supportsTTS) return;

        const content = assistantMessage.content;
        // 最後に読み上げた位置以降で文末を探す
        for (let i = lastSpokenIndex; i < content.length; i++) {
          if (sentenceEndPattern.test(content[i])) {
            // 文末が見つかった場合、その部分までを読み上げ
            const textToSpeak = content.slice(lastSpokenIndex, i + 1).trim();
            if (textToSpeak) {
              speak(textToSpeak);
              lastSpokenIndex = i + 1;
            }
            break; // 1文ずつ処理
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const jsonStr = line.substring(2);
              const data = JSON.parse(jsonStr);
              if (data && typeof data === "string") {
                assistantMessage.content += data;
                // 即時更新ではなく、次のフレームでまとめて更新
                scheduleUpdate();
                // 文末が来たら即座にTTS開始
                checkAndSpeak();
              }
            } catch (e) {
              // JSON parse error, skip
            }
          }
        }
      }

      // ストリーミング完了後に最終更新を確実に反映
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { ...assistantMessage };
        return newMessages;
      });

      // 残りのテキストがあれば最後に読み上げ
      if (supportsTTS && lastSpokenIndex < assistantMessage.content.length) {
        const remainingText = assistantMessage.content
          .slice(lastSpokenIndex)
          .trim();
        if (remainingText) {
          speak(remainingText);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "エラーが発生しました。もう一度お試しください。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 3Dキャラクター表示エリア（メイン） */}
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 0, 3.5], fov: 40 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />

          <Suspense fallback={null}>
            <Dog position={[0, -1.7, 0]} scale={0.7} isTalking={isTalking} />
            <Environment preset="sunset" />
          </Suspense>
        </Canvas>
      </div>

      {/* メッセージ入力欄（小さく、中央寄せ） */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
        <form
          onSubmit={handleSubmit}
          className="max-w-md mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            disabled={isLoading}
          />
          {supportsSpeech && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isLoading}
              className={`px-3 py-2 rounded-lg transition-colors font-medium text-sm ${
                isRecording
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isRecording ? "🔴 停止" : "🎤 話す"}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {isLoading ? "応答中..." : "送信"}
          </button>
        </form>
      </div>
    </div>
  );
}
