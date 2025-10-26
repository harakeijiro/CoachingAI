"use client";

import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { Dog } from "@/components/characters/mental/dog";
import AuthGuard from "@/components/auth/auth-guard";
import { requestMicrophonePermission, checkMicrophonePermissionState } from "@/lib/utils/microphone-permission";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import { useTTS } from "@/lib/hooks/useTTS";
import { useChat, type Message } from "@/lib/hooks/useChat";
import { ChatInput } from "@/components/chat/ChatInput";
import { MicrophonePermissionPopup } from "@/components/chat/MicrophonePermissionPopup";



function ChatPage() {
  const router = useRouter();

  // 1. stateやref類
  const [input, setInput] = useState("");
  const [voiceInput, setVoiceInput] = useState(""); // 音声認識専用の状態
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const isManualInputRef = useRef<boolean>(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechBufferRef = useRef<string>("");

  // ★追加: 音声認識コールバックを後で差し込むためのref
  const onResultRef = useRef<(interim: string, finalText: string) => void>(() => {});

  // ====== フォーム自動送信用 追加 ======
  const formRef = useRef<HTMLFormElement | null>(null);
  const isComposingRef = useRef(false); // 日本語IME変換中ガード
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_DEBOUNCE_MS = 400; // ← デバウンス
  const MIN_AUTO_CHARS = 4; // ← 最小文字数

  // マイク状態監視用
  const [showMicPopup, setShowMicPopup] = useState(false);
  const [micPopupShown, setMicPopupShown] = useState(false); // 一度表示されたかどうかのフラグ

  // 追加：発話テキストの整形・重複ガード・（音声経路でも利用）
  const normalize = (t: string) => t.replace(/\s+/g, " ").trim();
  const lastSentRef = useRef<string>("");
  const shouldSend = useCallback((t: string) => {
    const text = normalize(t);
    if (text.length < 5) return false; // ノイズ防止
    if (text === lastSentRef.current) return false; // 同一抑制
    lastSentRef.current = text;
    return true;
  }, []);

  // ====== 共通関数 ======
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
                startRecognition();
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

  // 2. useSpeechRecognition をここで呼ぶ（ref経由で後から差し替え）
  const {
    supportsSpeech,
    isRecording,
    startRecognition,
    stopRecognition,
    restartRecognition,
  } = useSpeechRecognition({
    isVoiceEnabled,
    isContinuousListening,
    isManualInput: isManualInputRef.current,
    onResult: (interim, finalText) => {
      // ← ここが超ポイント
      onResultRef.current(interim, finalText);
    },
    onError: (error) => {
      console.log("[useSpeechRecognition onError]", error);
    },
  });

  // 3. その後に useTTS / useChat を呼ぶ。今度はダミーを渡さず、本物を渡す
  const {
    isSpeaking,
    supportsTTS,
    speak,
    cancelSpeaking,
    isSpeakingRef,
  } = useTTS({
    onTtsStart: () => {},
    onTtsEnd: () => {},
    stopRecognition,       // ← もうダミーじゃない
    startVolumeMonitoring,
    stopVolumeMonitoring,
    restartRecognition,    // ← もうダミーじゃない
  });

  // 3Dの口パク
  const isTalking = isSpeaking;

  const {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    handleAutoSubmit,
  } = useChat({
    stopRecognition,       // ← 本物
    cancelSpeaking,
    speak,
    supportsTTS,
    restartRecognition,    // ← 本物
  });

  // 4. handleSpeechResult を定義して、最後に onResultRef.current に差し込む
  const SILENCE_DELAY_MS = 2000;

  const handleSpeechResult = useCallback(
    (interim: string, finalText: string) => {
      console.log("[handleSpeechResult] 呼び出し", { interim, finalText });

      if (isManualInputRef.current) return;

      // 音声認識結果を専用の状態（voiceInput）に設定
      setVoiceInput(prev => {
        const base = prev.replace(/（話し中….*）$/u, "");
        return finalText ? finalText : base;
      });

      // バッファ更新（final > interim）
      const latestText = (finalText || interim || "").trim();
      if (latestText) {
        speechBufferRef.current = latestText;
      }

      // サイレンスタイマーを張り直し
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      silenceTimeoutRef.current = setTimeout(() => {
        const textToSend = (speechBufferRef.current || "").trim();

        console.log("[silence timeout] チェック", {
          textToSend,
          isContinuousListening,
        });

        if (textToSend && isContinuousListening) {
          console.log("[silence timeout] sendMessage 実行:", textToSend);

          sendMessage(textToSend, true); // ← ← ← ここでAPIに投げる
          setVoiceInput(""); // 音声認識結果をクリア
          speechBufferRef.current = "";
        } else {
          console.log("[silence timeout] 送信スキップ");
        }
      }, SILENCE_DELAY_MS);
    },
    [isContinuousListening, sendMessage]
  );

  // ★このuseEffectで、最新のhandleSpeechResultをonResultRefに反映する
  useEffect(() => {
    onResultRef.current = handleSpeechResult;
  }, [handleSpeechResult]);

  // クリーンアップ処理
  useEffect(() => {
    return () => {
      const timeoutId = silenceTimeoutRef.current;
      if (timeoutId) clearTimeout(timeoutId);
      stopVolumeMonitoring();
    };
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
        startRecognition();
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
      !isContinuousListening &&
      hasUserInteracted
    ) {
      console.log("[ChatPage] 条件クリア: continuous listening を有効化します");
      setIsContinuousListening(true);

      // マイクの許可を求めてから音声認識を開始
      const startRecognitionWithPermission = async () => {
        console.log("[ChatPage] startRecognitionWithPermission 実行開始");
        // 新しいシンプルなマイク許可処理を使用
        const result = await requestMicrophonePermission();

        if (result.success && result.stream) {
          // 音声認識を開始
          startRecognition();
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
      setTimeout(startRecognitionWithPermission, delay);
    } else {
      console.log("[ChatPage] continuous listening 未開始", {
        supportsSpeech,
        isContinuousListening,
        hasUserInteracted,
      });
    }
  }, [supportsSpeech, isContinuousListening, hasUserInteracted, messages.length]);

  // ====== 手動入力時の制御（既存＋IMEフラグ） ======
  const handleInputFocus = () => {
    isManualInputRef.current = true;
    stopRecognition();
  };
  const handleInputBlur = () => {
    isManualInputRef.current = false;
    if (!input.trim() && isContinuousListening) {
      restartRecognition(500, "after manual input");
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
    await sendMessage(input, false);
    setInput("");
  };

  // キャラクター選択画面に戻る関数
  const handleBackToCharacterSelect = () => {
    // 現在のテーマを取得（localStorageから）
    const theme = localStorage.getItem("coaching_ai_default_theme") || "mental";
    router.push(`/character-select?theme=${theme}`);
  };

  // マイクボタンのクリック処理（音声認識の有効/無効切り替え）
  const handleMicButtonClick = () => {
    console.log("[DEBUG] handleMicButtonClick called", {
      isVoiceEnabled,
      isContinuousListening,
      supportsSpeech
    });
    
    if (isVoiceEnabled) {
      // 音声認識を無効にする
      stopRecognition();
      setIsVoiceEnabled(false);
      console.log("音声認識を無効にしました");
    } else {
      // 音声認識を有効にする
      if (isContinuousListening) {
        startRecognition();
        setIsVoiceEnabled(true);
        console.log("音声認識を有効にしました");
      } else {
        console.log("continuous listening が無効のため、音声認識を有効にできません");
      }
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 戻るボタン */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={handleBackToCharacterSelect}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md text-gray-900 dark:text-white rounded-full p-3 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-200 shadow-lg"
          title="キャラクター選択に戻る"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
        </button>
      </div>

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

      {/* マイクボタン（チャット欄の少し右） */}
      <ChatInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        isVoiceEnabled={isVoiceEnabled}
        isContinuousListening={isContinuousListening}
        supportsSpeech={supportsSpeech}
        onSubmit={handleSubmit}
        onInputFocus={handleInputFocus}
        onInputBlur={handleInputBlur}
        onMicButtonClick={handleMicButtonClick}
        voiceInput={voiceInput}
        setVoiceInput={setVoiceInput}
      />

      {/* マイク許可ポップアップ */}
      <MicrophonePermissionPopup
        showMicPopup={showMicPopup}
        onMicPermissionRequest={handleMicPermissionRequest}
        onCloseMicPopup={handleCloseMicPopup}
      />
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
