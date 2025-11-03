/**
 * 音声認識・録音関連の定数
 * useWhisper.ts と API route で共通使用される定数を定義
 */

// ==========================================
// 音声レベル監視関連
// ==========================================

/** 音声検出の閾値（音量レベル 0-255） */
export const VOICE_THRESHOLD = 40;

/** 静寂検知の連続時間（ミリ秒） */
export const SILENCE_MS = 1500; // 1.5秒

/** 音声レベルチェック間隔（ミリ秒） */
export const POLL_MS = 60;

// ==========================================
// 録音・ファイルサイズ関連
// ==========================================

/** 最小録音ファイルサイズ（バイト）- 約0.5秒相当 */
export const MIN_AUDIO_SIZE = 10000;

/** 最大録音時間（ミリ秒）- 誤操作防止 */
export const MAX_RECORDING_TIME = 30000; // 30秒

/** 録音後のクールダウン時間（ミリ秒） */
export const RECORD_COOLDOWN = 4000; // 4秒

// ==========================================
// タイミング・遅延関連整个
// ==========================================

/** Web Speech API再起動の遅延時間（ミリ秒） */
export const WEB_SPEECH_RESTART_DELAY = 200;

/** TTS終了後の録音再開遅延（ミリ秒）- キャラ音声の回り込みを防ぐため少し長めに */
export const TTS_END_DELAY = 300;

/** エラー時の再試行遅延（ミリ秒）- 503エラー用 */
export const ERROR_RETRY_DELAY = 2000;

/** エラー時の再試行遅延（ミリ秒）- 通常 */
export const ERROR_NORMAL_DELAY = 100;

// ==========================================
// AudioContext設定関連
// ==========================================

/** FFT（高速フーリエ変換）サイズ */
export const FFT_SIZE = 256;

/** 平滑化時定数（0.0-1.0） */
export const SMOOTHING_TIME_CONSTANT = 0.25;

// ==========================================
// 音声処理パイプライン設定
// ==========================================

/** DynamicsCompressor: 閾値（dB） */
export const COMPRESSOR_THRESHOLD = -24;

/** DynamicsCompressor: ニー（dB） */
export const COMPRESSOR_KNEE = 30;

/** DynamicsCompressor: レシオ */
export const COMPRESSOR_RATIO = 4;

/** DynamicsCompressor: アタック時間（秒） */
export const COMPRESSOR_ATTACK = 0.003;

/** DynamicsCompressor: リリース時間（秒） */
export const COMPRESSOR_RELEASE = 0.25;

/** GainNode: ゲイン倍率（+7.5dB ≒ 2.4倍） */
export const GAIN_MULTIPLIER = 2.4;

