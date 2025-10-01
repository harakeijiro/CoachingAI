"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Model as Dog } from "@/components/Dog";

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
    if (typeof window === "undefined") return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
    setIsSpeaking(false);
  };

  const speak = (text: string) => {
    if (!supportsTTS || !text) return;
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    try {
      synth.cancel();
    } catch {}

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ja-JP";

    const vs = voicesRef.current;
    if (vs && vs.length) {
      // 男性の日本語ボイスを優先順位で選択
      const preferMale = [
        "Otoya", // macOS 男性
        "Hattori", // macOS 男性
        "Google 日本語", // Chrome
        "Microsoft Ichiro", // Windows 男性
        "Kenji", // その他
      ];

      const jaVoices = vs.filter(
        (v) => /ja/i.test(v.lang || "") || /日本語|Japanese/i.test(v.name || "")
      );

      // 男性ボイスの優先度でソート
      jaVoices.sort((a, b) => {
        const ai = preferMale.findIndex((p) => (a.name || "").includes(p));
        const bi = preferMale.findIndex((p) => (b.name || "").includes(p));
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });

      if (jaVoices[0]) {
        utt.voice = jaVoices[0];
        console.log(
          `🎤 選択されたボイス: ${jaVoices[0].name} (${jaVoices[0].lang})`
        );
      }
    }

    // 男性らしい低めの声にする
    utt.rate = 0.95;
    utt.pitch = 0.85; // 低めに設定
    utt.volume = 1.0;

    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utt;
    synth.speak(utt);
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
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
            } catch (e) {
              // JSON parse error, skip
            }
          }
        }
      }

      // ストリーミング完了後に読み上げ
      if (supportsTTS && assistantMessage.content) {
        speak(assistantMessage.content);
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
