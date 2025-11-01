/**
 * キャラクターとの会話メインページ
 * - Whisper音声認識によるリアルタイム対話
 * - 3Dキャラクター表示と口パクアニメーション
 * - テキスト入力と音声入力の両対応
 * - TTSによる音声応答
 */
"use client";

import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { Dog } from "@/components/characters/mental/dog";
import AuthGuard from "@/components/auth/auth-guard";
import { requestMicrophonePermission, checkMicrophonePermissionState } from "@/lib/utils/microphone-permission";
import { useWhisper } from "@/lib/hooks/useWhisper";
import { useTTS } from "@/lib/hooks/useTTS";
import { useChat, type Message } from "@/lib/hooks/useChat";
import { ChatInput } from "@/components/chat/ChatInput";
import { MicrophonePermissionPopup } from "@/components/chat/MicrophonePermissionPopup";



// STEP2-1: メッセージ型の定義（pending プロパティ付き）
type VoiceMessage = {
  id: string;
  role: "user";
  text: string;
  pending: boolean;
};

function ChatPage() {
  const router = useRouter();

  // 1. stateやref類
  const [input, setInput] = useState("");
  const [voiceInput, setVoiceInput] = useState(""); // 音声認識専用の状態
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true); // デフォルトはON（自動録音開始）
  const isVoiceEnabledRef = useRef(isVoiceEnabled); // refでも管理（useWhisperに渡すため）
  const [isContinuousListening, setIsContinuousListening] = useState(false); // 手動録音モード
  
  // isVoiceEnabledが変更されたらrefも更新
  useEffect(() => {
    isVoiceEnabledRef.current = isVoiceEnabled;
  }, [isVoiceEnabled]);
  
  // STEP2-2: voiceMessages state を追加
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  
  const isManualInputRef = useRef<boolean>(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechBufferRef = useRef<string>("");
  const lastSentVoiceTextRef = useRef<string>(""); // 最後に送信した音声認識テキスト

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

  // 2. isSpeakingRefを外部で作成（これが唯一の真実）
  const isSpeakingRef = useRef<boolean>(false);
  
  // STEP2-3: onResult 関数の実装
  // 重複呼び出しを防ぐためのref（messageId単位で管理）
  const processingMessageIdsRef = useRef<Set<string>>(new Set());
  
  // ユーザー発話メッセージの自動削除用タイマー（messageId単位で管理）
  const messageClearTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const handleWhisperResult = useCallback((messageId: string, text: string) => {
    // 空文字の場合はメッセージを削除
    if (text === "") {
      // 既存のタイマーがあればクリア
      const existingTimer = messageClearTimersRef.current.get(messageId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        messageClearTimersRef.current.delete(messageId);
      }
      
      setVoiceMessages((prev) => {
        return prev.filter((msg) => msg.id !== messageId);
      });
      processingMessageIdsRef.current.delete(messageId);
      return;
    }
    
    // 仮テキスト（"…"）の重複呼び出しを防ぐ（refで即座にチェック）
    const isPendingText = text === "…";
    if (isPendingText && processingMessageIdsRef.current.has(messageId)) {
      return;
    }
    
    // 既存のタイマーがあればクリア（setStateの前に実行）
    const existingTimer = messageClearTimersRef.current.get(messageId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      messageClearTimersRef.current.delete(messageId);
    }
    
    setVoiceMessages((prev) => {
      // 1. その id のメッセージがまだなければ、新規 push { id: messageId, role:"user", text, pending:true }
      const existingIndex = prev.findIndex((msg) => msg.id === messageId);
      
      if (existingIndex === -1) {
        // 新規作成（仮メッセージ "…" の場合）
        // 仮メッセージの場合は処理中フラグを立てる（setStateの前で実行）
        if (isPendingText) {
          processingMessageIdsRef.current.add(messageId);
        }
        
        const newMessage = {
          id: messageId,
          role: "user" as const,
          text: text,
          pending: isPendingText,
        };
        return [...prev, newMessage];
      } else {
        // 2. その id のメッセージがすでにあれば、その要素の text を text で上書きし、pending: false に更新
        const newMessages = [...prev];
        
        // 実テキストが来たら処理中フラグを解除（setStateの前で実行）
        if (!isPendingText) {
          processingMessageIdsRef.current.delete(messageId);
        }
        
        newMessages[existingIndex] = {
          ...newMessages[existingIndex],
          text: text,
          pending: isPendingText,
        };
        return newMessages;
      }
    });
    
    // setStateの後にタイマーを設定（コールバック外で実行）
    // 仮テキストまたは実テキストの場合、2秒後に削除するタイマーを設定
    const timer = setTimeout(() => {
      setVoiceMessages((prev) => {
        return prev.filter((msg) => msg.id !== messageId);
      });
      messageClearTimersRef.current.delete(messageId);
      processingMessageIdsRef.current.delete(messageId);
    }, 2000); // 2秒後
    
    messageClearTimersRef.current.set(messageId, timer);
  }, []);
  
  // 3. useWhisper をここで呼ぶ（新しい形式）
  const {
    isRecording,
    isSpeaking,
    startRecording,
    stopRecording,
    cancelRecording,
    sessionId,
  } = useWhisper({
    onResult: (messageId, text) => {
      // 新しい形式で onResult を呼ぶ
      handleWhisperResult(messageId, text);
    },
    onError: (error) => {
      console.error("[useWhisper onError]", error);
      // エラーメッセージをユーザーに表示
      // 503エラーの場合はユーザーフレンドリーなメッセージが既に設定されている
      alert(error);
    },
    onTtsEnd: async () => {
      // TTS終了後は自動録音を開始しない
      // ユーザーが明示的に話しかけるまで待つ
    },
    isVoiceEnabled: () => isVoiceEnabledRef.current, // マイクのオン/オフ状態を渡す
  });

  // Whisperベースなので、restartRecognition、startRecognitionは不要（ダミーを提供）
  const supportsSpeech = true; // Whisperは常に利用可能
  const stopRecognition = stopRecording; // stopRecordingをstopRecognitionとして使用
  const startRecognition = startRecording; // startRecordingをstartRecognitionとして使用
  const restartRecognition = (delay?: number, context?: string) => {
    // Whisper mode: 自動再開は不要（ユーザーが手動で録音を開始）
  };

  // 4. useTTS を呼ぶ（isSpeakingRefを渡す）
  const {
    isSpeaking: ttsIsSpeaking,
    supportsTTS,
    speak,
    cancelSpeaking,
  } = useTTS({
    isSpeakingRef, // 同じrefを渡す
    onTtsStart: () => {
      // TTS開始 → 音声認識停止（beginSpeaking内で処理）
    },
    onTtsEnd: () => {
      // TTS終了 → 音声認識再開（endSpeaking内で処理）
    },
    stopRecognition,
    startVolumeMonitoring,
    stopVolumeMonitoring,
    restartRecognition,
  });

  // 3Dの口パク（WhisperのisSpeakingを使用）
  const isTalking = ttsIsSpeaking || isSpeaking;

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

  // 注: 古い handleSpeechResult と onResultRef は削除しました
  // 新しい実装では useWhisper の onResult が直接 handleWhisperResult を呼びます
  // voiceMessages state を UI で表示してください


  // クリーンアップ処理
  useEffect(() => {
    return () => {
      // silenceTimeoutのクリーンアップ
      const silenceTimeout = silenceTimeoutRef.current;
      if (silenceTimeout) clearTimeout(silenceTimeout);
      
      stopVolumeMonitoring();
      
      // ユーザー発話メッセージのタイマーもクリーンアップ（最新の状態を取得）
      // eslint-disable-next-line react-hooks/exhaustive-deps
      messageClearTimersRef.current.forEach((timer) => {
        clearTimeout(timer);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      messageClearTimersRef.current.clear();
    };
  }, []);

  // ユーザーインタラクション検知用
  const [hasUserInteracted, setHasUserInteracted] = useState(true); // 最初からインタラクション済みとして扱う

  // マイクを自動開始
  useEffect(() => {
    const autoStartMic = async () => {
      try {
        const result = await requestMicrophonePermission();
        if (result.success && result.stream) {
          await startRecording();
        }
      } catch (error) {
        console.error("[自動マイク開始] エラー:", error);
      }
    };

    const timer = setTimeout(() => {
      autoStartMic();
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回レンダリング時のみ実行

  // ユーザーインタラクション検知
  useEffect(() => {
    const handleUserInteraction = async () => {
      setHasUserInteracted(true);
      
      // マイクの許可を事前に要求
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
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
        startRecognition();
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
      const startRecognitionWithPermission = async () => {
        const result = await requestMicrophonePermission();

        if (result.success && result.stream) {
          startRecognition();
        } else {
          alert(result.error || "マイクの許可が必要です");
          setHasUserInteracted(false);
        }
      };

      const delay = hasUserInteracted ? 100 : 500;
      setTimeout(startRecognitionWithPermission, delay);
    }
  }, [supportsSpeech, isContinuousListening, hasUserInteracted, messages.length]);

  // ====== 手動入力時の制御（既存＋IMEフラグ） ======
  const handleInputFocus = () => {
    isManualInputRef.current = true;
    stopRecognition();
  };
  const handleInputBlur = () => {
    // 少し遅延を入れてから手動入力フラグをリセット
    setTimeout(() => {
      isManualInputRef.current = false;
      if (isContinuousListening && isVoiceEnabled) {
        restartRecognition(500, "after manual input blur");
      }
    }, 100);
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
    
    // テキスト送信後に音声認識を再開
    setTimeout(() => {
      isManualInputRef.current = false;
      if (isContinuousListening && isVoiceEnabled) {
        restartRecognition(500, "after text submit");
      }
    }, 200);
  };

  // キャラクター選択画面に戻る関数
  const handleBackToCharacterSelect = () => {
    // 現在のテーマを取得（localStorageから）
    const theme = localStorage.getItem("coaching_ai_default_theme") || "mental";
    router.push(`/character-select?theme=${theme}`);
  };

  // マイクボタンのクリック処理（音声認識の有効/無効切り替え）
    const handleMicButtonClick = async () => {
    
    if (isVoiceEnabled) {
      // 🔴 現在ON → OFFにする（録音停止→送信）
      stopRecording(); // 録音停止→Whisper送信
      setIsVoiceEnabled(false);
    } else {
      // 🟢 現在OFF → ONにする（録音開始）
      // 1. マイク許可チェック/確保
      const result = await requestMicrophonePermission();
      if (!result.success || !result.stream) {
        alert(result.error || "マイクの許可が必要です");
        return;
      }

      // 2. 録音開始をトライ（awaitして完了を待つ）
      try {
        await startRecording();
        setIsVoiceEnabled(true);
      } catch (error) {
        console.error("録音開始に失敗:", error);
        alert("録音の開始に失敗しました");
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

      {/* ユーザーの発話ログ（自分側吹き出し）- Canvasの外側に配置 */}
      <div className="fixed bottom-16 right-0 left-0 max-h-[40vh] overflow-y-auto px-4 flex flex-col items-center gap-2 pointer-events-none z-50">
        {voiceMessages.map((msg) => (
          <div
            key={msg.id}
            className={`w-full flex items-center justify-center text-base text-white transition-all duration-300 ${
              msg.pending
                ? "opacity-90"
                : "opacity-100"
            }`}
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              minHeight: '40px',
            }}
          >
            <span className="font-medium">{msg.text}</span>
          </div>
        ))}
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
