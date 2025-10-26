"use client";

import { useRef, useState, useEffect } from "react";

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

interface UseSpeechRecognitionProps {
  isVoiceEnabled: boolean;
  isContinuousListening: boolean;
  isManualInput: boolean;
  onResult: (interim: string, finalText: string) => void;
  onError: (error: string) => void;
}

export const useSpeechRecognition = ({
  isVoiceEnabled,
  isContinuousListening,
  isManualInput,
  onResult,
  onError,
}: UseSpeechRecognitionProps) => {
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  
  // 最新の値を参照するためのref
  const isVoiceEnabledRef = useRef(isVoiceEnabled);
  const isContinuousListeningRef = useRef(isContinuousListening);
  const isManualInputRef = useRef(isManualInput);
  
  // refを更新
  useEffect(() => {
    isVoiceEnabledRef.current = isVoiceEnabled;
  }, [isVoiceEnabled]);
  
  useEffect(() => {
    isContinuousListeningRef.current = isContinuousListening;
  }, [isContinuousListening]);
  
  useEffect(() => {
    isManualInputRef.current = isManualInput;
  }, [isManualInput]);

  // 音声認識の再開処理
  const restartRecognition = (delay: number = 1000, context: string = "") => {
    if (!isContinuousListeningRef.current || isManualInputRef.current || !isVoiceEnabledRef.current) return;
    
    setTimeout(() => {
      try {
        if (recognitionRef.current && isRecording) {
          console.log(`Recognition already started, skipping restart${context ? ` (${context})` : ""}`);
          return;
        }
        recognitionRef.current?.start();
        setIsRecording(true);
        console.log(`Recognition restarted${context ? ` (${context})` : ""}`);
      } catch (e) {
        console.log(`Recognition restart failed${context ? ` (${context})` : ""}:`, e);
      }
    }, delay);
  };

  // Web Speech API 初期化（一度だけ実行）
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
        // isVoiceEnabled が false の場合は結果を無視
        if (!isVoiceEnabledRef.current) {
          console.log("音声認識結果を無視（isVoiceEnabled: false）");
          return;
        }

        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += transcript;
          else interim += transcript;
          console.log("ああ")
        }

        console.log("音声認識結果:", {
          interim,
          finalText,
          isContinuousListening: isContinuousListeningRef.current,
          isManualInput: isManualInputRef.current,
          isVoiceEnabled: isVoiceEnabledRef.current,
        });

        onResult(interim, finalText);
      };

      recognition.onend = () => {
        setIsRecording(false);
        // isVoiceEnabled が true の場合のみ再開
        if (isVoiceEnabledRef.current) {
          restartRecognition(100, "onend");
        } else {
          console.log("音声認識停止（isVoiceEnabled: false）");
        }
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        console.log("Recognition error:", event.error);
        setIsRecording(false);
        onError(event.error);
        // isVoiceEnabled が true の場合のみ再開
        if (isVoiceEnabledRef.current) {
          restartRecognition(1000, "onerror");
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []); // 依存配列を空にして一度だけ実行

  // isVoiceEnabled が false になった時に音声認識を停止
  useEffect(() => {
    if (!isVoiceEnabled && recognitionRef.current) {
      console.log("isVoiceEnabled が false になったため音声認識を停止");
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (e) {
        console.log("音声認識停止に失敗:", e);
      }
    }
  }, [isVoiceEnabled]);

  const startRecognition = () => {
    try {
      if (recognitionRef.current && isRecording) {
        console.log("Recognition already started, skipping");
        return;
      }
      recognitionRef.current?.start();
      setIsRecording(true);
      console.log("Recognition started successfully");
    } catch (e) {
      console.log("Recognition start failed:", e);
    }
  };

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } catch (e) {
      console.log("Recognition stop failed:", e);
    }
  };

  return {
    supportsSpeech,
    isRecording,
    startRecognition,
    stopRecognition,
    restartRecognition,
  };
};
