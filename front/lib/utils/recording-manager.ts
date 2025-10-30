/**
 * 録音管理ユーティリティ
 * MediaRecorderとaudioChunksの管理を行う
 */

import { MIN_AUDIO_SIZE } from "@/lib/utils/audio-constants";

/**
 * 録音データの処理コールバック
 */
export interface RecordingCallbacks {
  /** 録音停止時に呼ばれる（audioBlobを受け取る） */
  onRecordingComplete: (audioBlob: Blob) => void;
  /** エラー発生時に呼ばれる */
  onError?: (error: Error) => void;
}

/**
 * 録音管理の戻り値
 */
export interface RecordingManager {
  /** 録音を開始する */
  start: () => void;
  /** 録音を停止する */
  stop: () => void;
  /** 録音をキャンセルする */
  cancel: () => void;
  /** 現在録音中かどうか */
  isRecording: () => boolean;
  /** MediaRecorderインスタンス（外部からの操作が必要な場合） */
  mediaRecorder: MediaRecorder;
}

/**
 * 録音管理を作成
 * @param processedStream 処理済みのMediaStream（音声処理パイプラインを経たストリーム）
 * @param callbacks コールバック関数群
 * @returns 録音管理インスタンス
 */
export function createRecordingManager(
  processedStream: MediaStream,
  callbacks: RecordingCallbacks
): RecordingManager {
  const audioChunks: Blob[] = [];
  let mediaRecorder: MediaRecorder | null = null;
  let isRecordingFlag = false;
  let shouldSkipSend = false;

  const start = () => {
    if (isRecordingFlag) {
      return;
    }

    try {
      // MediaRecorderの設定
      mediaRecorder = new MediaRecorder(processedStream, {
        mimeType: "audio/webm",
      });

      // 録音データをクリア
      audioChunks.length = 0;
      shouldSkipSend = false;

      // 録音データを取得
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      // 録音停止時にコールバックを呼ぶ
      mediaRecorder.onstop = async () => {
        isRecordingFlag = false;

        // キャンセル扱いの場合は送信しない
        if (shouldSkipSend) {
          shouldSkipSend = false;
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        // 録音データのサイズを確認（空の録音を防ぐ）
        if (audioBlob.size < MIN_AUDIO_SIZE) {
          callbacks.onError?.(
            new Error(`Audio too short: ${audioBlob.size} bytes`)
          );
          return;
        }

        // コールバックを呼ぶ
        callbacks.onRecordingComplete(audioBlob);
      };

      // 録音開始
      mediaRecorder.start();
      isRecordingFlag = true;
    } catch (error) {
      callbacks.onError?.(
        error instanceof Error
          ? error
          : new Error(`Recording start failed: ${error}`)
      );
    }
  };

  const stop = () => {
    if (!isRecordingFlag || !mediaRecorder) {
      return;
    }

    try {
      mediaRecorder.stop();
    } catch (error) {
      callbacks.onError?.(
        error instanceof Error
          ? error
          : new Error(`Recording stop failed: ${error}`)
      );
    }
  };

  const cancel = () => {
    if (!isRecordingFlag || !mediaRecorder) {
      return;
    }

    // キャンセルフラグを立てる
    shouldSkipSend = true;

    try {
      mediaRecorder.stop();
    } catch (error) {
      // キャンセル時のエラーは無視
    }
  };

  const isRecording = () => isRecordingFlag;

  // MediaRecorderへのアクセスを提供（外部から操作が必要な場合）
  const getMediaRecorder = (): MediaRecorder => {
    if (!mediaRecorder) {
      throw new Error("MediaRecorder not initialized");
    }
    return mediaRecorder;
  };

  return {
    start,
    stop,
    cancel,
    isRecording,
    get mediaRecorder() {
      return getMediaRecorder();
    },
  };
}

