"use client";

import { useRef, useState, useEffect } from "react";

interface UseTTSProps {
  onTtsStart?: () => void;
  onTtsEnd?: () => void;
  stopRecognition?: () => void;
  startVolumeMonitoring?: () => void;
  stopVolumeMonitoring?: () => void;
  restartRecognition?: (delay: number, context: string) => void;
}

export const useTTS = ({
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

  // isSpeakingRefをsetIsSpeakingと同期
  const isSpeakingRef = useRef(false);
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

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

  // TTS 制御
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
          stopRecognition?.();
        } catch {}
        startVolumeMonitoring?.();
        onTtsStart?.();
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
              stopRecognition?.();
            } catch {}
            startVolumeMonitoring?.();
            onTtsStart?.();
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
    stopVolumeMonitoring?.();
    restartRecognition?.(300, "after TTS ended");
    onTtsEnd?.();
  };

  return {
    isSpeaking,
    supportsTTS,
    speak,
    cancelSpeaking,
    isSpeakingRef,
  };
};
