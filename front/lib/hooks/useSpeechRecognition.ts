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

  // 音声認識の再開処理
  const restartRecognition = (delay: number = 1000, context: string = "") => {
    if (!isContinuousListening || isManualInput || !isVoiceEnabled) return;
    
    setTimeout(() => {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
        console.log(`Recognition restarted${context ? ` (${context})` : ""}`);
      } catch (e) {
        console.log(`Recognition restart failed${context ? ` (${context})` : ""}:`, e);
      }
    }, delay);
  };

  // Web Speech API 初期化
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
          isManualInput,
        });

        onResult(interim, finalText);
      };

      recognition.onend = () => {
        setIsRecording(false);
        restartRecognition(100, "onend");
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        console.log("Recognition error:", event.error);
        setIsRecording(false);
        onError(event.error);
        restartRecognition(1000, "onerror");
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, [isContinuousListening, isManualInput, isVoiceEnabled, onResult, onError]);

  const startRecognition = () => {
    try {
      recognitionRef.current?.start();
      setIsRecording(true);
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
