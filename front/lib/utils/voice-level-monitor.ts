/**
 * 音声レベル監視ユーティリティ
 * MediaStreamから音声レベルを監視し、静寂検知を行う
 */

import {
  VOICE_THRESHOLD,
  SILENCE_MS,
  POLL_MS,
  FFT_SIZE,
  SMOOTHING_TIME_CONSTANT,
} from "@/lib/utils/audio-constants";

/**
 * 音声レベル監視の設定
 */
export interface VoiceLevelMonitorConfig {
  /** 音声検出の閾値（デフォルト: VOICE_THRESHOLD） */
  threshold?: number;
  /** 静寂検知の連続時間（ミリ秒、デフォルト: SILENCE_MS） */
  silenceMs?: number;
  /** チェック間隔（ミリ秒、デフォルト: POLL_MS） */
  pollMs?: number;
}

/**
 * 音声レベル監視のコールバック
 */
export interface VoiceLevelMonitorCallbacks {
  /** 録音中かどうかを確認する関数 */
  isRecording: () => boolean;
  /** 静寂検知時に呼ばれる（録音停止をトリガー） */
  onSilenceDetected: () => void;
  /** エラー発生時に呼ばれる */
  onError?: (error: Error) => void;
}

/**
 * 音声レベル監視の戻り値
 */
export interface VoiceLevelMonitor {
  /** 監視を停止する関数 */
  stop: () => void;
  /** 監視中のAudioContext */
  audioContext: AudioContext;
  /** 監視中のAnalyserNode */
  analyser: AnalyserNode;
}

/**
 * 音声レベル監視を開始
 * @param stream 監視するMediaStream
 * @param callbacks コールバック関数群
 * @param config 設定（オプション）
 * @returns 音声レベル監視インスタンス
 */
export function createVoiceLevelMonitor(
  stream: MediaStream,
  callbacks: VoiceLevelMonitorCallbacks,
  config: VoiceLevelMonitorConfig = {}
): VoiceLevelMonitor {
  const {
    threshold = VOICE_THRESHOLD,
    silenceMs = SILENCE_MS,
    pollMs = POLL_MS,
  } = config;

  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(stream);

  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
  microphone.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  let hasDetectedVoice = false;
  let silenceStartTime: number | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  const checkVoiceLevel = () => {
    // 録音中でない場合は停止（ただし、stopは呼ばない - 単にreturnするだけ）
    if (!callbacks.isRecording()) {
      return;
    }

    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

    if (average < threshold) {
      // まだ一度も発話を検出してないなら"静寂カウント"しない
      if (!hasDetectedVoice) {
        timeoutId = setTimeout(checkVoiceLevel, pollMs);
        return;
      }

      // "連続静寂"の計測開始 or 継続
      const now = performance.now();
      if (silenceStartTime === null) {
        silenceStartTime = now;
      } else {
        const silentFor = now - silenceStartTime;
        if (silentFor >= silenceMs) {
          // ★ここで初めて止める（連続1秒を保証）
          callbacks.onSilenceDetected();
          cleanup();
          return;
        }
      }

      // 継続チェック
      timeoutId = setTimeout(checkVoiceLevel, pollMs);
    } else {
      // 音が戻ったら"静寂カウント"をリセット
      hasDetectedVoice = true;
      silenceStartTime = null;
      timeoutId = setTimeout(checkVoiceLevel, pollMs);
    }
  };

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    silenceStartTime = null;
    hasDetectedVoice = false;
  };

  const stop = () => {
    cleanup();
    audioContext.close().catch((error) => {
      callbacks.onError?.(new Error(`AudioContext close error: ${error}`));
    });
  };

  // 監視開始
  try {
    checkVoiceLevel();
  } catch (error) {
    callbacks.onError?.(
      error instanceof Error
        ? error
        : new Error(`音声レベル監視の開始に失敗: ${error}`)
    );
    stop();
    throw error;
  }

  return {
    stop,
    audioContext,
    analyser,
  };
}

