/**
 * マイクの許可を要求する (ユーザーのクリックイベント内で呼ぶこと)
 */

export interface MicrophonePermissionResult {
  success: boolean;
  stream?: MediaStream;
  error?: string;
}

/**
 * Permissions APIを使用してマイクの権限状態を確認する（マイクを起動しない）
 * @returns 権限状態 "granted" | "denied" | "prompt"
 */
export async function checkMicrophonePermissionState(): Promise<"granted" | "denied" | "prompt"> {
  try {
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return status.state as "granted" | "denied" | "prompt";
  } catch {
    // SafariなどPermissions APIがない場合は "prompt" 扱い
    console.log("Permissions API not supported, defaulting to prompt");
    return "prompt";
  }
}

export async function requestMicrophonePermission(): Promise<MicrophonePermissionResult> {
  try {
    // セキュリティ条件チェック
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const isSecure = window.location.protocol === "https:";

    if (!isSecure && !isLocalhost) {
      return {
        success: false,
        error: "マイクは https または localhost でのみ使用できます。",
      };
    }

    // ブラウザが対応してるか確認
    if (!navigator.mediaDevices?.getUserMedia) {
      return {
        success: false,
        error: "このブラウザはマイク取得に対応していません。",
      };
    }

    // ★ここが超重要：
    // getUserMedia() が呼ばれた瞬間にブラウザがネイティブの「マイクを許可しますか？」ダイアログを出す
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // 許可に成功
    return {
      success: true,
      stream,
    };
  } catch (err) {
    console.error("[Mic Permission] NotAllowed or other error:", err);

    let message = "マイクの許可がブロックされました。ブラウザの設定で許可してください。";

    if (err instanceof DOMException) {
      if (err.name === "NotAllowedError") {
        message =
          "マイクの使用が拒否されました。\nブラウザ右上のマイク/カメラアイコン、またはサイト設定から許可してください。";
      } else if (err.name === "NotFoundError") {
        message = "マイクが見つかりません。接続されているか確認してください。";
      } else if (err.name === "NotReadableError") {
        message =
          "他のアプリでマイクが使用中です。ほかの会議アプリ等を閉じてから再試行してください。";
      }
    }

    return {
      success: false,
      error: message,
    };
  }
}