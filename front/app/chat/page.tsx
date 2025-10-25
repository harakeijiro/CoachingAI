"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Dog } from "@/components/characters/mental/dog";
import AuthGuard from "@/components/auth/auth-guard";
import { requestMicrophonePermission, checkMicrophonePermissionState } from "@/lib/utils/microphone-permission";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// Web Speech API の型定義
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ====== フォーム自動送信用 追加 ======
  const formRef = useRef<HTMLFormElement | null>(null);
  const isComposingRef = useRef(false); // 日本語IME変換中ガード
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_DEBOUNCE_MS = 400; // ← デバウンス
  const MIN_AUTO_CHARS = 4; // ← 最小文字数

  // チャット欄の拡張状態
  const [isExpanded, setIsExpanded] = useState(false);

  // マイク状態監視用
  const [showMicPopup, setShowMicPopup] = useState(false);
  const [micPopupShown, setMicPopupShown] = useState(false); // 一度表示されたかどうかのフラグ

  // 音声入力関連
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const volumeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const volumeThreshold = 0.01;

  const startVolumeMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        console.error("AudioContext is not supported");
        return;
      }
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;

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
      // マイクの許可が拒否された場合の処理
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        console.log("マイクの許可が拒否されました。音量監視を停止します。");
        return;
      }
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
        ((window as typeof window & { SpeechRecognition?: ISpeechRecognitionConstructor; webkitSpeechRecognition?: ISpeechRecognitionConstructor }).SpeechRecognition ||
          (window as typeof window & { SpeechRecognition?: ISpeechRecognitionConstructor; webkitSpeechRecognition?: ISpeechRecognitionConstructor }).webkitSpeechRecognition)) ||
      null;

    if (SR) {
      setSupportsSpeech(true);
      const recognition = new SR();
      recognition.lang = "ja-JP";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
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

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
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
      const timeoutId = silenceTimeoutRef.current;
      if (timeoutId) clearTimeout(timeoutId);
      stopVolumeMonitoring();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ユーザーインタラクション検知用
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // ユーザーインタラクション検知
  useEffect(() => {
    const handleUserInteraction = async () => {
      setHasUserInteracted(true);
      
      // マイクの許可を事前に要求
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("マイクの許可が事前に得られました");
      } catch (e) {
        console.log("マイクの許可が事前に拒否されました:", e);
        // エラーは無視して続行（後で再試行する）
      }
      
      // 一度検知したらイベントリスナーを削除
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };

    // ページロード時の自動挨拶機能
    const autoGreeting = async () => {
      // 少し遅延を入れてページの読み込み完了を待つ
      setTimeout(async () => {
        try {
          // マイクの許可状態をチェック
          const micState = await checkMicrophonePermissionState();
          
          if (micState === "granted") {
            // 既に許可済みの場合は自動的にインタラクションを検知
            console.log("マイクが既に許可済みです。自動的に音声認識を開始します。");
            setHasUserInteracted(true);
            
            // 自動挨拶を無効化 - メッセージもTTSも実行しない
            // const greetingMessage: Message = {
            //   id: Date.now().toString(),
            //   role: "assistant",
            //   content: "こんにちは！話しかけてみてください。何でもお聞かせください。",
            // };
            // setMessages([greetingMessage]);
            
            // TTSで挨拶を読み上げない
            // if (supportsTTS) {
            //   setTimeout(() => {
            //     speak(greetingMessage.content);
            //   }, 1000);
            // }
          } else {
            // 許可されていない場合は通常のイベントリスナーを設定
            document.addEventListener("click", handleUserInteraction);
            document.addEventListener("keydown", handleUserInteraction);
            document.addEventListener("touchstart", handleUserInteraction);
            
            // 自動挨拶を無効化 - メッセージを表示しない
            // const greetingMessage: Message = {
            //   id: Date.now().toString(),
            //   role: "assistant",
            //   content: "こんにちは！画面をクリックしてから話しかけてみてください。",
            // };
            // setMessages([greetingMessage]);
          }
        } catch (error) {
          console.log("マイク状態チェックエラー:", error);
          // エラーの場合は通常のイベントリスナーを設定
          document.addEventListener("click", handleUserInteraction);
          document.addEventListener("keydown", handleUserInteraction);
          document.addEventListener("touchstart", handleUserInteraction);
          
          // 自動挨拶を無効化 - エラー時もメッセージを表示しない
          // const greetingMessage: Message = {
          //   id: Date.now().toString(),
          //   role: "assistant",
          //   content: "こんにちは！画面をクリックしてから話しかけてみてください。",
          // };
          // setMessages([greetingMessage]);
        }
      }, 0); // 即座に自動チェック
    };

    // 自動挨拶を開始
    autoGreeting();

    // マイク状態を定期的にチェック
    const checkMicPermission = async () => {
      try {
        const state = await checkMicrophonePermissionState();
        
        // マイクが拒否されている場合で、まだポップアップを表示していない場合のみ表示
        if (state === "denied" && !micPopupShown) {
          setShowMicPopup(true);
          setMicPopupShown(true); // 一度表示したことを記録
        }
      } catch (error) {
        console.error("マイク状態チェックエラー:", error);
      }
    };

    // 初回チェック
    checkMicPermission();
    
    // 定期的にチェック（30秒間隔）
    const micCheckInterval = setInterval(checkMicPermission, 30000);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      clearInterval(micCheckInterval);
    };
  }, [supportsTTS]);

  // マイク許可ポップアップの処理
  const handleMicPermissionRequest = async () => {
    try {
      const result = await requestMicrophonePermission();
      
      if (result.success && result.stream) {
        setShowMicPopup(false);
        // 音声認識を開始
        recognitionRef.current?.start();
        setIsRecording(true);
        console.log("マイク許可が得られました。音声認識を開始します。");
      } else {
        alert(result.error || "マイクの許可が必要です");
      }
    } catch (error) {
      console.error("マイク許可リクエスト失敗:", error);
      alert("マイクの許可が必要です");
    }
  };

  const handleCloseMicPopup = () => {
    setShowMicPopup(false);
    setMicPopupShown(true); // 閉じた時も表示済みとして記録
  };

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
        // 新しいシンプルなマイク許可処理を使用
        const result = await requestMicrophonePermission();

        if (result.success && result.stream) {
          // 音声認識を開始
          recognitionRef.current?.start();
          setIsRecording(true);
          console.log("音声認識を開始しました");
          
          // 自動挨拶を無効化 - 音声認識開始時の挨拶送信を停止
          // if (messages.length === 0) {
          //   setTimeout(() => {
          //     const greetingMessage = "こんにちは！話しかけてみてください。";
          //     handleAutoSubmit(greetingMessage);
          //   }, 2000); // 2秒後に挨拶
          // }
        } else {
          // エラーメッセージを表示
          alert(result.error || "マイクの許可が必要です");
          setHasUserInteracted(false); // 再インタラクションを促す
        }
      };

      // 既にマイク許可が取得済みの場合は即座に開始、そうでなければ少し待機
      const delay = hasUserInteracted ? 100 : 500;
      setTimeout(startRecognition, delay);
    }
  }, [supportsSpeech, isContinuousListening, hasUserInteracted, messages.length]);

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
        synth.onvoiceschanged = null;
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

      const assistantMessage: Message = {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const assistantMessage: Message = {
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
    <div className="w-full h-screen flex flex-col">
      {/* 3Dキャラクター表示エリア（メイン） */}
      <div className="h-screen relative">
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
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
          <div className={`mx-auto relative transition-all duration-300 ${isExpanded ? 'max-w-lg' : 'max-w-40'}`}>
            <form
              ref={formRef} // ← ★ 追加：自動submit用
              onSubmit={handleSubmit}
              className="relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => {
                  handleInputFocus();
                  setIsExpanded(true);
                }}
                onBlur={() => {
                  handleInputBlur();
                  if (!input.trim()) {
                    setIsExpanded(false);
                  }
                }}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                }} // ← ★ IME開始
                onCompositionEnd={(e) => {
                  isComposingRef.current = false;
                  setInput(e.currentTarget.value);
                }} // ← ★ IME確定
                placeholder={
                  isExpanded
                    ? ""
                    : isContinuousListening
                    ? "話しかけてみて"
                    : "メッセージを入力..."
                }
                className={`w-full px-4 py-3 border border-gray-300/30 dark:border-gray-600/30 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/20 dark:bg-gray-800/20 backdrop-blur-md text-gray-900 dark:text-white text-sm transition-all duration-300 ${isExpanded ? 'pr-12 text-left' : 'text-center'}`}
                disabled={isLoading}
              />
              {isExpanded && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/20 dark:bg-gray-800/20 backdrop-blur-md text-gray-900 dark:text-white rounded-full hover:bg-white/30 dark:hover:bg-gray-800/30 disabled:bg-gray-400/80 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center"
                >
                  {isLoading ? "応答中..." : "↑"}
                </button>
              )}
            </form>
            {!isExpanded && (
              <button
                type="submit"
                disabled={isLoading}
                onClick={handleSubmit}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white text-black rounded-full hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center opacity-0 pointer-events-none"
              >
                {isLoading ? "応答中..." : "↑"}
              </button>
            )}
          </div>

        {hasUserInteracted && !isContinuousListening && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
            🎤 音声認識を開始中...
          </div>
        )}
      </div>

      {/* マイク許可ポップアップ */}
      {showMicPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="text-5xl mb-3">🎤</div>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              マイクをオンにしてください
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              音声で会話するにはマイクの使用許可が必要です。
              <br />
              「マイクを許可する」を押すと、ブラウザが許可ダイアログを表示します。
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleMicPermissionRequest}
                className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700"
              >
                マイクを許可する
              </button>

              <button
                onClick={handleCloseMicPopup}
                className="w-full text-gray-500 dark:text-gray-400 text-xs underline"
              >
                後で設定する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPageWithAuth() {
  return (
    <AuthGuard>
      <ChatPage />
    </AuthGuard>
  );
}
