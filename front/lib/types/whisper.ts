/**
 * Whisper音声認識関連の型定義
 * useWhisper フックで使用される型を定義
 */

/**
 * useWhisper フックのプロパティ
 */
export interface UseWhisperProps {
  /** 音声認識結果を受け取るコールバック (messageId, text) */
  onResult: (messageId: string, text: string) => void;
  /** エラー発生時に呼ばれるコールバック */
  onError: (error: string) => void;
  /** TTS終了後に呼ばれるコールバック（オプション） */
  onTtsEnd?: () => void;
  /** マイクが有効かどうかをチェックする関数（オプション） */
  isVoiceEnabled?: () => boolean;
  /** セッション開始時に取得したメモリ（オプション） */
  memories?: Array<{
    memory_id: string;
    topic: string;
    content: string;
    [key: string]: any;
  }>;
  /** メモリが更新された可能性がある場合のコールバック（オプション） */
  onMemoryUpdated?: () => void;
}

/**
 * useWhisper フックの戻り値
 */
export interface UseWhisperReturn {
  /** 現在録音中かどうか */
  isRecording: boolean;
  /** キャラクターが話しているかどうか */
  isSpeaking: boolean;
  /** 録音を開始する関数 */
  startRecording: (forceStart?: boolean) => Promise<void>;
  /** 録音を停止する関数 */
  stopRecording: () => void;
  /** 録音をキャンセルする関数 */
  cancelRecording: () => void;
  /** セッションID */
  sessionId: string;
  /** ユーザーが入力したテキスト（オプション） */
  userText?: string;
  /** キャラクターの返答テキスト（オプション） */
  replyText?: string;
}

