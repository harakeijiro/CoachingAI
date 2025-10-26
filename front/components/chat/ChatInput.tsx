"use client";

import { useRef, useState } from "react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isVoiceEnabled: boolean;
  isContinuousListening: boolean;
  supportsSpeech: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  onMicButtonClick: () => void;
}

export const ChatInput = ({
  input,
  setInput,
  isLoading,
  isVoiceEnabled,
  isContinuousListening,
  supportsSpeech,
  onSubmit,
  onInputFocus,
  onInputBlur,
  onMicButtonClick,
}: ChatInputProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const isComposingRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputFocus = () => {
    onInputFocus();
    setIsExpanded(true);
  };

  const handleInputBlur = () => {
    onInputBlur();
    if (!input.trim()) {
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* メッセージ入力欄とマイクボタンのコンテナ */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
        <div className={`mx-auto relative transition-all duration-300 flex items-center justify-center gap-3 ${isExpanded ? 'max-w-lg' : 'max-w-xs'}`}>
          {/* マイクボタン（入力欄の左側） */}
          <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button
              onClick={onMicButtonClick}
              className={`w-12 h-12 rounded-full backdrop-blur-md transition-all duration-200 flex items-center justify-center shadow-xl border border-gray-300/30 dark:border-gray-600/30 ${
                isVoiceEnabled 
                  ? 'bg-white/20 dark:bg-gray-800/20 text-gray-900 dark:text-white hover:bg-white/30 dark:hover:bg-gray-800/30' 
                  : 'bg-gray-500/20 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 hover:bg-gray-500/30 dark:hover:bg-gray-500/30'
              }`}
              title={isVoiceEnabled ? "音声入力を無効にする" : "音声入力を有効にする"}
              disabled={!supportsSpeech}
            >
              <svg 
                className={`w-6 h-6 ${!isVoiceEnabled ? 'opacity-70' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                {/* マイクアイコン */}
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                {/* 音声認識が無効の時に表示する斜線 */}
                {!isVoiceEnabled && (
                  <path 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    d="M4 4l16 16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* メッセージ入力欄 */}
          <div className={`relative transition-all duration-300 ${isExpanded ? 'flex-1' : 'w-40'}`}>
            <form
              ref={formRef}
              onSubmit={onSubmit}
              className="relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                }}
                onCompositionEnd={(e) => {
                  isComposingRef.current = false;
                  setInput(e.currentTarget.value);
                }}
                placeholder={
                  isExpanded
                    ? ""
                    : isVoiceEnabled && isContinuousListening
                    ? "話しかけてみて"
                    : "メッセージを入力..."
                }
                className={`w-full px-4 py-3 border border-gray-300/30 dark:border-gray-600/30 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/20 dark:bg-gray-800/20 backdrop-blur-md text-gray-900 dark:text-white text-sm transition-all duration-300 ${isExpanded ? 'pr-12 text-left' : 'text-center'}`}
                disabled={isLoading}
              />
              {isExpanded && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/20 dark:bg-gray-800/20 backdrop-blur-md text-gray-200 dark:text-gray-300 rounded-full hover:bg-white/30 dark:hover:bg-gray-800/30 disabled:bg-gray-400/80 disabled:cursor-not-allowed transition-colors font-black text-lg flex items-center justify-center"
                  style={{ 
                    fontWeight: 1000,
                    WebkitTextStroke: '1px currentColor',
                    textShadow: '0 0 1px currentColor',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingBottom: '3px',
                    paddingLeft: '2px'
                  }}
                >
                  {isLoading ? "応答中..." : "↑"}
                </button>
              )}
            </form>
            {!isExpanded && (
              <button
                type="submit"
                disabled={isLoading}
                onClick={onSubmit}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white text-black rounded-full hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center opacity-0 pointer-events-none"
              >
                {isLoading ? "応答中..." : "↑"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
