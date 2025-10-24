/**
 * マイク許可処理の共通ユーティリティ
 * キャラクター選択時とチャット時のマイク許可要求を統一化
 */

export interface MicrophonePermissionResult {
  success: boolean;
  error?: string;
  stream?: MediaStream;
}

export interface MicrophonePermissionOptions {
  /** 許可確認のみでストリームを停止するか */
  stopAfterPermission?: boolean;
  /** エラーメッセージのカスタマイズ */
  errorMessage?: string;
}

/**
 * マイクの許可を要求する
 * @param options オプション設定
 * @returns 許可結果
 */
export async function requestMicrophonePermission(
  options: MicrophonePermissionOptions = {}
): Promise<MicrophonePermissionResult> {
  const {
    stopAfterPermission = true,
    errorMessage = "現在マイクの許可の実装中です\nマイクの許可を有効にする方法をご覧ください"
  } = options;

  try {
    // マイクの許可を要求
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // 許可確認のみの場合はストリームを停止
    if (stopAfterPermission) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    console.log("マイクの許可が得られました");
    
    return {
      success: true,
      stream: stopAfterPermission ? undefined : stream
    };
    
  } catch (error) {
    console.error("マイクの許可が拒否されました:", error);
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * マイク許可の状態をチェックする
 * @returns マイクが利用可能かどうか
 */
export function checkMicrophoneAvailability(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * マイク許可エラーの種類を判定する
 * @param error エラーオブジェクト
 * @returns エラーの種類
 */
export function getMicrophoneErrorType(error: Error | DOMException): string {
  if (error.name === 'NotAllowedError') {
    return 'permission_denied';
  } else if (error.name === 'NotFoundError') {
    return 'no_microphone';
  } else if (error.name === 'NotSupportedError') {
    return 'not_supported';
  } else {
    return 'unknown';
  }
}

/**
 * エラータイプに応じた適切なメッセージを取得
 * @param errorType エラータイプ
 * @returns エラーメッセージ
 */
export function getMicrophoneErrorMessage(errorType: string): string {
  switch (errorType) {
    case 'permission_denied':
      return '現在マイクの許可の実装中です\nマイクの許可を有効にする方法をご覧ください';
    case 'no_microphone':
      return 'マイクが見つかりません。マイクが接続されているか確認してください。';
    case 'not_supported':
      return 'お使いのブラウザではマイク機能がサポートされていません。';
    default:
      return '現在マイクの許可の実装中です\nマイクの許可を有効にする方法をご覧ください';
  }
}
