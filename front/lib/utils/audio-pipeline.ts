/**
 * 音声処理パイプラインユーティリティ
 * MediaStreamに音声処理（DynamicsCompressor + GainNode）を適用
 */

import {
  COMPRESSOR_THRESHOLD,
  COMPRESSOR_KNEE,
  COMPRESSOR_RATIO,
  COMPRESSOR_ATTACK,
  COMPRESSOR_RELEASE,
  GAIN_MULTIPLIER,
} from "@/lib/utils/audio-constants";

/**
 * 音声処理パイプラインの設定
 */
export interface AudioPipelineConfig {
  /** DynamicsCompressor: 閾値（dB） */
  compressorThreshold?: number;
  /** DynamicsCompressor: ニー（dB） */
  compressorKnee?: number;
  /** DynamicsCompressor: レシオ */
  compressorRatio?: number;
  /** DynamicsCompressor: アタック時間（秒） */
  compressorAttack?: number;
  /** DynamicsCompressor: リリース時間（秒） */
  compressorRelease?: number;
  /** GainNode: ゲイン倍率 */
  gainMultiplier?: number;
}

/**
 * 音声処理パイプラインの戻り値
 */
export interface AudioPipeline {
  /** 加工後のMediaStream */
  processedStream: MediaStream;
  /** 元のMediaStream（物理停止用） */
  rawStream: MediaStream;
  /** AudioContext（クリーンアップ用） */
  audioContext: AudioContext;
}

/**
 * 音声処理パイプラインを作成
 * DynamicsCompressor + GainNode で小声を拾い、ピークを潰す
 * 
 * @param rawStream 元のMediaStream
 * @param config 設定（オプション）
 * @returns 音声処理パイプライン
 */
export function createAudioProcessingPipeline(
  rawStream: MediaStream,
  config: AudioPipelineConfig = {}
): AudioPipeline {
  const {
    compressorThreshold = COMPRESSOR_THRESHOLD,
    compressorKnee = COMPRESSOR_KNEE,
    compressorRatio = COMPRESSOR_RATIO,
    compressorAttack = COMPRESSOR_ATTACK,
    compressorRelease = COMPRESSOR_RELEASE,
    gainMultiplier = GAIN_MULTIPLIER,
  } = config;

  // AudioContextを作成
  const audioCtx = new AudioContext();
  const src = audioCtx.createMediaStreamSource(rawStream);

  // DynamicsCompressor: 小声を拾い、ピークは潰す
  const comp = audioCtx.createDynamicsCompressor();
  comp.threshold.setValueAtTime(compressorThreshold, audioCtx.currentTime);
  comp.knee.setValueAtTime(compressorKnee, audioCtx.currentTime);
  comp.ratio.setValueAtTime(compressorRatio, audioCtx.currentTime);
  comp.attack.setValueAtTime(compressorAttack, audioCtx.currentTime);
  comp.release.setValueAtTime(compressorRelease, audioCtx.currentTime);

  // GainNode: ゲインをブースト
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(gainMultiplier, audioCtx.currentTime);

  // 出力先を作成
  const dest = audioCtx.createMediaStreamDestination();

  // パイプラインを接続
  src.connect(comp);
  comp.connect(gain);
  gain.connect(dest);

  return {
    processedStream: dest.stream,
    rawStream,
    audioContext: audioCtx,
  };
}

