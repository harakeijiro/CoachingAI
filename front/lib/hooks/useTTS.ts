/**
 * 音声合成（TTS）カスタムフック
 * - Cartesia TTS APIによる高品質音声生成
 * - Web Speech APIへのフォールバック
 * - 音声キュー管理による連続再生
 * - 音声再生中の状態管理と音声認識制御
 */
"use client";

import { useRef, useState, useEffect } from "react";

interface UseTTSProps {
  isSpeakingRef?: React.MutableRefObject<boolean>; // 外部から渡されるref（共有用）
  onTtsStart?: () => void;
  onTtsEnd?: () => void;
  stopRecognition?: () => void;
  startVolumeMonitoring?: () => void;
  stopVolumeMonitoring?: () => void;
  restartRecognition?: (delay: number, context: string) => void;
}

export const useTTS = ({
  isSpeakingRef: externalIsSpeakingRef,
  onTtsStart,
  onTtsEnd,
  stopRecognition,
  startVolumeMonitoring,
  stopVolumeMonitoring,
  restartRecognition,
}: UseTTSProps = {}) => {
  // TTS関連の状態
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportsTTS, setSupportsTTS] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[] | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  // 音声キュー
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingQueueRef = useRef(false);

  // isSpeakingRefをsetIsSpeakingと同期（外部のrefがある場合はそれを使う）
  const internalIsSpeakingRef = useRef(false);
  const isSpeakingRef = externalIsSpeakingRef || internalIsSpeakingRef;
  
  useEffect(() => {
    if (!externalIsSpeakingRef) {
      isSpeakingRef.current = isSpeaking;
    }
  }, [isSpeaking, externalIsSpeakingRef, isSpeakingRef]);

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

  // TTS 制御 - 開始処理（isSpeakingRefを即座に更新）
  const beginSpeaking = () => {
    console.log("[useTTS] beginSpeaking: 音声再生開始");
    setIsSpeaking(true);
    isSpeakingRef.current = true;  // ← 即座に更新
    
    // 音声認識を確実に停止
    if (stopRecognition) {
      try {
        stopRecognition();
        console.log("[useTTS] 音声認識停止完了");
      } catch (error) {
        console.error("[useTTS] stopRecognition error:", error);
      }
    }
    
    startVolumeMonitoring?.();
    onTtsStart?.();
  };

  // TTS 制御 - 終了処理（isSpeakingRefを即座に更新）
  const endSpeaking = () => {
    console.log("[useTTS] endSpeaking: 音声再生完了");
    setIsSpeaking(false);
    isSpeakingRef.current = false;  // ← 即座に更新
    stopVolumeMonitoring?.();
    
    // 音声認識を再開
    if (restartRecognition) {
      try {
        restartRecognition(500, "after TTS ended");
        console.log("[useTTS] 音声認識再開スケジュール完了");
      } catch (error) {
        console.error("[useTTS] restartRecognition error:", error);
      }
    }
    
    onTtsEnd?.();
  };

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
    isSpeakingRef.current = false;  // ← 即座に更新
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
        beginSpeaking();
      };
      a.onended = () => {
        URL.revokeObjectURL(url);
        isPlayingQueueRef.current = false;
        endSpeaking();
        playNextInQueue();
      };
      a.onerror = () => {
        URL.revokeObjectURL(url);
        isPlayingQueueRef.current = false;
        endSpeaking();
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
            beginSpeaking();
          };
          utt.onend = () => {
            isPlayingQueueRef.current = false;
            endSpeaking();
            playNextInQueue();
          };
          utt.onerror = () => {
            isPlayingQueueRef.current = false;
            endSpeaking();
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

  return {
    isSpeaking,
    supportsTTS,
    speak,
    cancelSpeaking,
    isSpeakingRef,
  };
};
