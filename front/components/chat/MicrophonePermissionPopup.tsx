"use client";

interface MicrophonePermissionPopupProps {
  showMicPopup: boolean;
  onMicPermissionRequest: () => void;
  onCloseMicPopup: () => void;
}

export const MicrophonePermissionPopup = ({
  showMicPopup,
  onMicPermissionRequest,
  onCloseMicPopup,
}: MicrophonePermissionPopupProps) => {
  if (!showMicPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
        <div className="text-5xl mb-3">🎤</div>

        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          マイクをオンにしてください
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          音声で会話するにはマイクの使用許可が必要です。
          <br />
          「マイクを許可する」を押すと、ブラウザが許可ダイアログを表示します。
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onMicPermissionRequest}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700"
          >
            マイクを許可する
          </button>

          <button
            onClick={onCloseMicPopup}
            className="w-full text-gray-500 dark:text-gray-400 text-xs underline"
          >
            後で設定する
          </button>
        </div>
      </div>
    </div>
  );
};
