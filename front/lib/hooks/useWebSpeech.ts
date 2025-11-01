/**
 * Web Speech APIリアルタイム音声認識フック
 * - Whisper APIの結果を待たずに即座に仮テキストを表示
 * - 連続認識モードで自動再起動
 * - 最新の認識結果を保持・提供
 */
"use client";

import { useEffect, useRef, useCallback } from "react";

// Web Speech APIの型定義
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  state?: "idle" | "running" | "starting";
}

declare global {
  interface Window {
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

export const useWebSpeech = (isSpeaking?: () => boolean) => {
  const latestTranscriptRef = useRef<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef<boolean>(true); // 自動再起動フラグ
  const isManuallyStoppedRef = useRef<boolean>(false); // 手動停止フラグ
  const isRunningRef = useRef<boolean>(false); // 起動中フラグ（多重restart防止）
  const lastRestartTimeRef = useRef<number>(0); // 最後のrestart時刻（デバウンス用）
  const RESTART_DEBOUNCE_MS = 300; // デバウンス時間（300ms以内の連続呼び出しは無視）

  const startRecognition = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.warn("Web Speech API がこのブラウザでサポートされていません");
      return;
    }

    // 既に起動中の場合は何もしない
    if (isRunningRef.current) {
      return;
    }
    
    if (recognitionRef.current) {
      try {
        const state = recognitionRef.current.state;
        if (state === "running" || state === "starting") {
          isRunningRef.current = true;
          return;
        }
      } catch {
        // stateプロパティがない場合は無視
      }
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // キャラクターが話している間は結果を無視（誤認識を防ぐ）
      if (isSpeaking && isSpeaking()) {
        console.log("[useWebSpeech] キャラが話しているため認識結果を無視");
        return;
      }
      
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const trimmed = transcript.trim();
      if (trimmed) {
        latestTranscriptRef.current = trimmed;
        console.log("[useWebSpeech] 音声認識結果:", trimmed);
      }
    };

    recognition.onerror = (err: SpeechRecognitionErrorEvent) => {
      // 一部のエラー（例: no-speech, aborted）は正常な動作の一部として無視
      if (err.error === "no-speech" || err.error === "aborted") {
        // これらのエラーは正常な動作の一部なので無視
        return;
      }
      console.error("[useWebSpeech] 音声認識エラー:", err.error, err);
      // エラー時も自動再起動を試みる（手動停止でない場合）
      if (shouldRestartRef.current && !isManuallyStoppedRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current && !isManuallyStoppedRef.current) {
            startRecognition();
          }
        }, 100);
      }
    };

    recognition.onend = () => {
      console.log("[useWebSpeech] 音声認識が終了しました");
      recognitionRef.current = null;
      isRunningRef.current = false; // 起動中フラグをリセット
      
      // 自動再起動（手動停止でない場合のみ）
      if (shouldRestartRef.current && !isManuallyStoppedRef.current) {
        // 即座に再起動して待機時間を最小化
        setTimeout(() => {
          if (shouldRestartRef.current && !isManuallyStoppedRef.current && !recognitionRef.current) {
            startRecognition();
          }
        }, 50); // 50ms後に再起動（即座に再起動）
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      isRunningRef.current = true;
      console.log("[useWebSpeech] Web Speech API を開始しました");
    } catch (e) {
      console.error("[useWebSpeech] 開始エラー:", e);
      recognitionRef.current = null;
      // エラー時も再起動を試みる
      if (shouldRestartRef.current && !isManuallyStoppedRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current && !isManuallyStoppedRef.current) {
            startRecognition();
          }
        }, 100);
      }
    }
  }, [isSpeaking]);

  const stopRecognition = () => {
    shouldRestartRef.current = false;
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("[useWebSpeech] 停止時のエラー（無視）:", e);
      }
      recognitionRef.current = null;
    }
  };

  const restartRecognition = () => {
    // デバウンス：300ms以内の連続呼び出しは無視
    const now = Date.now();
    if (now - lastRestartTimeRef.current < RESTART_DEBOUNCE_MS) {
      return;
    }
    lastRestartTimeRef.current = now;
    
    // 既に起動中なら再起動しない
    if (isRunningRef.current) {
      return;
    }
    
    shouldRestartRef.current = true;
    isManuallyStoppedRef.current = false;
    if (!recognitionRef.current) {
      startRecognition();
    }
  };

  useEffect(() => {
    startRecognition();

    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log("[useWebSpeech] 停止時のエラー（無視）:", e);
        }
        recognitionRef.current = null;
      }
    };
  }, [startRecognition]);

  // 最新の認識結果を取得する関数も提供
  const getLatestTranscript = () => latestTranscriptRef.current;
  const clearTranscript = () => {
    latestTranscriptRef.current = "";
  };

  return {
    latestTranscriptRef,
    getLatestTranscript,
    clearTranscript,
    stopRecognition,
    restartRecognition,
  };
};
