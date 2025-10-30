"use client";

/**
 * Whisper版チャット入力UI
 * 録音ボタンで音声入力を制御
 * 
 * Step 8で実装予定
 */

interface WhisperChatInputProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  userText?: string;
}

export const WhisperChatInput = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  userText,
}: WhisperChatInputProps) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
      {/* ユーザー発話テキスト表示 */}
      {userText && (
        <div className="absolute bottom-20 left-0 right-0 px-3">
          <div className="mx-auto max-w-lg">
            <div className="px-4 py-2">
              <div className="text-gray-900 dark:text-white break-words text-center font-bold" style={{
                textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.6), -0.5px -0.5px 1px rgba(255,255,255,0.6)'
              }}>
                {userText}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 録音ボタン */}
      <div className="mx-auto max-w-xs flex items-center justify-center">
        <button
          onMouseDown={onStartRecording}
          onMouseUp={onStopRecording}
          onTouchStart={(e) => {
            e.preventDefault();
            onStartRecording();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onStopRecording();
          }}
          className={`w-16 h-16 rounded-full backdrop-blur-md transition-all duration-200 flex items-center justify-center shadow-xl border ${
            isRecording 
              ? 'bg-red-500/80 text-white animate-pulse border-red-300' 
              : 'bg-white/20 dark:bg-gray-800/20 text-gray-900 dark:text-white hover:bg-white/30 dark:hover:bg-gray-800/30 border-gray-300/30 dark:border-gray-600/30'
          }`}
          title={isRecording ? "話し終わったら離してください" : "押して話してください"}
        >
          <svg 
            className="w-8 h-8" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

