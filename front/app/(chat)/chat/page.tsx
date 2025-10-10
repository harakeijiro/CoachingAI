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

  // ====== フォーム自動送信用 追加 ======
  const formRef = useRef<HTMLFormElement | null>(null);
  const isComposingRef = useRef(false); // 日本語IME変換中ガード
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_DEBOUNCE_MS = 400; // ← デバウンス
  const MIN_AUTO_CHARS = 4; // ← 最小文字数

  // 音声入力関連
  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const isManualInputRef = useRef<boolean>(false);

  // 追加：発話テキストの整形・重複ガード・（音声経路でも利用）
  const normalize = (t: string) => t.replace(/\s+/g, " ").trim();
  const lastSentRef = useRef<string>("");
  const isSpeakingRef = useRef(false); // setIsSpeakingに同期
  const shouldSend = (t: string) => {
    const text = normalize(t);
    if (text.length < 5) return false; // ノイズ防止
    if (text === lastSentRef.current) return false; // 同一抑制
    lastSentRef.current = text;
    return true;
  };

  // ====== 音量監視（割り込み用：あなたの既存ロジック） ======
  const [isMonitoringVolume, setIsMonitoringVolume] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const volumeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const volumeThreshold = 0.01;

  const startVolumeMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;

      setIsMonitoringVolume(true);

      volumeCheckIntervalRef.current = setInterval(() => {
        if (isSpeaking && analyser) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++)
            sum += dataArray[i] * dataArray[i];
          const rms = Math.sqrt(sum / dataArray.length) / 255;

          if (rms > volumeThreshold) {
            console.log("ユーザーが話し始めました、TTSをキャンセル:", rms);
            cancelSpeaking();
            if (isContinuousListening && !isManualInputRef.current) {
              setTimeout(() => {
                try {
                  recognitionRef.current?.start();
                  setIsRecording(true);
                } catch (e) {
                  console.log(
                    "Recognition restart after interruption failed:",
                    e
                  );
                }
              }, 100);
            }
          }
        }
      }, 50);
    } catch (error) {
      console.error("Volume monitoring failed:", error);
    }
  };

  const stopVolumeMonitoring = () => {
    if (volumeCheckIntervalRef.current) {
      clearInterval(volumeCheckIntervalRef.current);
      volumeCheckIntervalRef.current = null;
    }
    try {
      microphoneRef.current?.disconnect();
    } catch {}
    try {
      audioContextRef.current?.close();
    } catch {}
    setIsMonitoringVolume(false);
  };

  // 音声合成（TTS）関連
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportsTTS, setSupportsTTS] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[] | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  // 音声キュー
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingQueueRef = useRef(false);

  // 3Dの口パク
  const isTalking = isSpeaking;

  // isSpeakingRefをsetIsSpeakingと同期
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // ====== Web Speech API 初期化（あなたの既存） ======
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

        console.log("音声認識結果:", {
          interim,
          finalText,
          isContinuousListening,
          isManualInput: isManualInputRef.current,
        });

        if (!isManualInputRef.current) {
          setInput((prev) => {
            const base = prev.replace(/（話し中….*）$/u, "");
            return finalText
              ? base + finalText
              : base + (interim ? `（話し中…${interim}）` : "");
          });

          // finalは音声経路の即送信（既存方針）
          if (finalText && isContinuousListening) {
            const cleanText = finalText.trim();
            console.log(
              "finalText検出:",
              cleanText,
              "shouldSend結果:",
              shouldSend(cleanText)
            );
            if (cleanText && shouldSend(cleanText)) {
              setInput("");
              setTimeout(() => {
                handleAutoSubmit(cleanText);
              }, 0);
            }
          }
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInput((prev) => prev.replace(/（話し中….*）$/u, ""));
        if (isContinuousListening && !isManualInputRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              setIsRecording(true);
            } catch (e) {
              console.log("Recognition restart failed:", e);
            }
          }, 100);
        }
      };

      recognition.onerror = (event: any) => {
        console.log("Recognition error:", event.error);
        setIsRecording(false);

        // NotAllowedErrorの場合はユーザーに再試行を促す
        if (event.error === "not-allowed") {
          console.log("マイクの許可が必要です");
          setHasUserInteracted(false); // 再インタラクションを促す
          return;
        }

        if (
          isContinuousListening &&
          !isManualInputRef.current &&
          event.error !== "not-allowed"
        ) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              setIsRecording(true);
            } catch (e) {
              console.log("Recognition restart after error failed:", e);
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      stopVolumeMonitoring();
    };
  }, []);

  // ユーザーインタラクション検知用
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // ユーザーインタラクション検知
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      // 一度検知したらイベントリスナーを削除
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  // 常時リッスン開始（ユーザーインタラクション後）
  useEffect(() => {
    if (
      supportsSpeech &&
      recognitionRef.current &&
      !isContinuousListening &&
      hasUserInteracted
    ) {
      setIsContinuousListening(true);

      // マイクの許可を求めてから音声認識を開始
      const startRecognition = async () => {
        try {
          // マイクの許可を求める
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log("マイクの許可が得られました");

          // 音声認識を開始
          recognitionRef.current?.start();
          setIsRecording(true);
          console.log("音声認識を開始しました");
        } catch (e) {
          console.log("マイクの許可が拒否されました:", e);
          setHasUserInteracted(false); // 再インタラクションを促す
        }
      };

      setTimeout(startRecognition, 500);
    }
  }, [supportsSpeech, isContinuousListening, hasUserInteracted]);

  // ====== TTS 初期化（あなたの既存） ======
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
        const jaVoices = v.filter(
          (voice) =>
            /ja/i.test(voice.lang || "") ||
            /日本語|Japanese/i.test(voice.name || "")
        );
        if (jaVoices.length > 0) {
          console.log("📢 利用可能な日本語ボイス:");
          jaVoices.forEach((voice) =>
            console.log(`  - ${voice.name} (${voice.lang})`)
          );
        }
      }
    };
    updateVoices();
    synth.onvoiceschanged = updateVoices;

    return () => {
      try {
        (synth as any).onvoiceschanged = null;
      } catch {}
      try {
        synth.cancel();
      } catch {}
    };
  }, []);

  // ====== TTS 制御（あなたの既存＋フック） ======
  const cancelSpeaking = () => {
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    try {
      audioEl?.pause();
    } catch {}
    try {
      window?.speechSynthesis?.cancel?.();
    } catch {}
    setIsSpeaking(false);
  };

  const playNextInQueue = async () => {
    if (isPlayingQueueRef.current || audioQueueRef.current.length === 0) return;
    isPlayingQueueRef.current = true;
    const text = audioQueueRef.current.shift()!;

    try {
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
        isSpeakingRef.current = true;
        try {
          recognitionRef.current?.stop();
        } catch {}
        setIsRecording(false);
        startVolumeMonitoring();
      };
      a.onended = () => {
        URL.revokeObjectURL(url);
        isPlayingQueueRef.current = false;
        onTtsEnded();
        playNextInQueue();
      };
      a.onerror = () => {
        URL.revokeObjectURL(url);
        isPlayingQueueRef.current = false;
        onTtsEnded();
        playNextInQueue();
      };
      await a.play();
    } catch (e) {
      console.error("Cartesia TTS error, fallback to Web Speech API:", e);
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
            if (jaVoices[0]) utt.voice = jaVoices[0];
          }
          utt.onstart = () => {
            setIsSpeaking(true);
            isSpeakingRef.current = true;
            try {
              recognitionRef.current?.stop();
            } catch {}
            setIsRecording(false);
            startVolumeMonitoring();
          };
          utt.onend = () => {
            isPlayingQueueRef.current = false;
            onTtsEnded();
            playNextInQueue();
          };
          utt.onerror = () => {
            isPlayingQueueRef.current = false;
            onTtsEnded();
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
    audioQueueRef.current.push(text);
    playNextInQueue();
  };

  const onTtsEnded = () => {
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    stopVolumeMonitoring();
    if (isContinuousListening && !isManualInputRef.current) {
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
          setIsRecording(true);
        } catch {}
      }, 300);
    }
  };

  // ====== 自動送信処理（既存） ======
  const handleAutoSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsRecording(false);
    cancelSpeaking();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
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
      setMessages((prev) => [...prev, assistantMessage]);

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

      let lastSpokenIndex = 0;
      const sentenceEndPattern = /[。！？\n]/;
      const checkAndSpeak = () => {
        if (!supportsTTS) return;
        const content = assistantMessage.content;
        for (let i = lastSpokenIndex; i < content.length; i++) {
          if (sentenceEndPattern.test(content[i])) {
            const textToSpeak = content.slice(lastSpokenIndex, i + 1).trim();
            if (textToSpeak) {
              speak(textToSpeak);
              lastSpokenIndex = i + 1;
            }
            break;
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
                scheduleUpdate();
                checkAndSpeak();
              }
            } catch {}
          }
        }
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { ...assistantMessage };
        return newMessages;
      });
      if (supportsTTS && lastSpokenIndex < assistantMessage.content.length) {
        const remainingText = assistantMessage.content
          .slice(lastSpokenIndex)
          .trim();
        if (remainingText) speak(remainingText);
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
      if (isContinuousListening && !isManualInputRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            setIsRecording(true);
          } catch (e) {
            console.log("Recognition restart after response failed:", e);
          }
        }, 1000);
      }
    }
  };

  // ====== 手動入力時の制御（既存＋IMEフラグ） ======
  const handleInputFocus = () => {
    isManualInputRef.current = true;
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsRecording(false);
  };
  const handleInputBlur = () => {
    isManualInputRef.current = false;
    if (!input.trim() && isContinuousListening) {
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
          setIsRecording(true);
        } catch (e) {
          console.log("Recognition restart after manual input failed:", e);
        }
      }, 500);
    }
  };

  // ====== ★ここが「文字が入ったら自動で送信ボタンを押す」実装 ======
  useEffect(() => {
    // 入力更新のたびにデバウンス
    if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);

    // 空なら何もしない
    if (!input) return;

    autoSubmitTimerRef.current = setTimeout(() => {
      // ガード条件：送信してよい状態か
      if (isLoading) return; // 送信中は不可
      if (isComposingRef.current) return; // 日本語変換中は不可
      if (/（話し中….*）$/u.test(input)) return; // 暫定表示は不可
      const clean = normalize(input);
      if (clean.length < MIN_AUTO_CHARS) return; // 短すぎる
      if (!shouldSend(clean)) return; // 直前と同一など

      // 実際に「送信ボタンを押す」のと同じ動作
      formRef.current?.requestSubmit();
    }, AUTO_DEBOUNCE_MS);

    return () => {
      if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
    };
  }, [input, isLoading]);

  // ====== メッセージ送信（手動ボタン/自動requestSubmit 共通） ======
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
    }
    cancelSpeaking();

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
      setMessages((prev) => [...prev, assistantMessage]);

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

      let lastSpokenIndex = 0;
      const sentenceEndPattern = /[。！？\n]/;
      const checkAndSpeak = () => {
        if (!supportsTTS) return;
        const content = assistantMessage.content;
        for (let i = lastSpokenIndex; i < content.length; i++) {
          if (sentenceEndPattern.test(content[i])) {
            const textToSpeak = content.slice(lastSpokenIndex, i + 1).trim();
            if (textToSpeak) {
              speak(textToSpeak);
              lastSpokenIndex = i + 1;
            }
            break;
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
                scheduleUpdate();
                checkAndSpeak();
              }
            } catch {}
          }
        }
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { ...assistantMessage };
        return newMessages;
      });
      if (supportsTTS && lastSpokenIndex < assistantMessage.content.length) {
        const remainingText = assistantMessage.content
          .slice(lastSpokenIndex)
          .trim();
        if (remainingText) speak(remainingText);
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
          ref={formRef} // ← ★ 追加：自動submit用
          onSubmit={handleSubmit}
          className="max-w-md mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }} // ← ★ IME開始
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              setInput(e.currentTarget.value);
            }} // ← ★ IME確定
            placeholder={
              isContinuousListening
                ? "話しかけるか、ここに文字を入力..."
                : "メッセージを入力..."
            }
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            disabled={isLoading}
          />
          {/* 手動入力時のみ送信ボタンを表示（自動送信でも視覚的フィードバック用に残す） */}
          {input.trim() && (
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {isLoading ? "応答中..." : "送信"}
            </button>
          )}
        </form>

        {/* 音声認識状態の表示 */}
        {!hasUserInteracted && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            👆 ページをクリックして音声認識を開始してください
          </div>
        )}
        {hasUserInteracted && !isContinuousListening && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            🎤 音声認識を開始中...
          </div>
        )}
        {isContinuousListening && !isManualInputRef.current && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            🎤 音声を聞いています... 話しかけてください
          </div>
        )}
      </div>
    </div>
  );
}
