"use client";

/**
 * 認証モーダルコンポーネント
 * メール・Google・Microsoftの認証UIを統合表示し、各認証方式の成功・エラーメッセージを管理
 */
import { useState, useEffect } from "react";
import Logo from "@/components/ui/logo";
import SocialLoginButtons from "@/components/auth/social-login-buttons";
import EmailAuthForm from "@/components/auth/EmailAuthForm";

interface AuthModalProps {
  show: boolean;
  onClose: () => void;
}

export default function AuthModal({ show, onClose }: AuthModalProps) {
  // メール認証用のメッセージ
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string>("");
  const [emailErrorMessage, setEmailErrorMessage] = useState<string>("");
  
  // Google用のメッセージ
  const [googleSuccessMessage, setGoogleSuccessMessage] = useState<string>("");
  const [googleErrorMessage, setGoogleErrorMessage] = useState<string>("");
  
  // Microsoft用のメッセージ
  const [microsoftSuccessMessage, setMicrosoftSuccessMessage] = useState<string>("");
  const [microsoftErrorMessage, setMicrosoftErrorMessage] = useState<string>("");

  // モーダルを閉じる時にメッセージをクリア
  const handleClose = () => {
    setEmailSuccessMessage("");
    setEmailErrorMessage("");
    setGoogleSuccessMessage("");
    setGoogleErrorMessage("");
    setMicrosoftSuccessMessage("");
    setMicrosoftErrorMessage("");
    onClose();
  };

  // メール認証用のハンドラー
  const handleEmailAuthSuccess = (message: string) => {
    setEmailSuccessMessage(message);
    setEmailErrorMessage("");
  };

  const handleEmailAuthError = (message: string) => {
    setEmailErrorMessage(message);
    setEmailSuccessMessage("");
  };

  // Google用のハンドラー
  const handleGoogleSuccess = (message: string) => {
    setGoogleSuccessMessage(message);
    setGoogleErrorMessage("");
    setMicrosoftSuccessMessage("");
    setMicrosoftErrorMessage("");
  };

  const handleGoogleError = (message: string) => {
    setGoogleErrorMessage(message);
    setGoogleSuccessMessage("");
  };

  // Microsoft用のハンドラー
  const handleMicrosoftSuccess = (message: string) => {
    setMicrosoftSuccessMessage(message);
    setMicrosoftErrorMessage("");
    setGoogleSuccessMessage("");
    setGoogleErrorMessage("");
  };

  const handleMicrosoftError = (message: string) => {
    setMicrosoftErrorMessage(message);
    setMicrosoftSuccessMessage("");
  };

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // モーダル表示時はスクロールを無効化
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景のぼかし効果 */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={handleClose}
      />
      
      {/* 認証カード */}
      <div className="relative z-10 animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm py-10 px-8 shadow-2xl rounded-3xl border border-white/20 dark:border-gray-700/50 max-w-sm mx-auto">
          {/* 閉じるボタン */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* ロゴ・タイトル */}
          <div className="text-center mb-8 mt-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
              ようこそ
              <Logo size="lg" />
            </h1>
          </div>

          {/* メッセージ表示 */}
          
          {/* Googleメッセージ */}
          {googleSuccessMessage && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg max-w-64 mx-auto">
              <p className="text-sm text-green-600 dark:text-green-400 whitespace-pre-line">
                {googleSuccessMessage}
              </p>
            </div>
          )}

          {googleErrorMessage && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-64 mx-auto">
              <p className="text-sm text-red-600 dark:text-red-400">
                {googleErrorMessage}
              </p>
            </div>
          )}

          {/* Microsoftメッセージ */}
          {microsoftSuccessMessage && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg max-w-64 mx-auto">
              <p className="text-sm text-green-600 dark:text-green-400 whitespace-pre-line">
                {microsoftSuccessMessage}
              </p>
            </div>
          )}

          {microsoftErrorMessage && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-64 mx-auto">
              <p className="text-sm text-red-600 dark:text-red-400">
                {microsoftErrorMessage}
              </p>
            </div>
          )}

          {/* ソーシャルログインボタン */}
          <SocialLoginButtons 
            onGoogleSuccess={handleGoogleSuccess} 
            onGoogleError={handleGoogleError}
            onMicrosoftSuccess={handleMicrosoftSuccess} 
            onMicrosoftError={handleMicrosoftError}
          />
          
          {/* メール認証用メッセージ */}
          {emailSuccessMessage && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg max-w-64 mx-auto">
              <p className="text-sm text-green-600 dark:text-green-400 whitespace-pre-line">
                {emailSuccessMessage}
              </p>
            </div>
          )}

          {emailErrorMessage && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {emailErrorMessage}
              </p>
            </div>
          )}
          
          {/* メール認証フォーム */}
          <EmailAuthForm onSuccess={handleEmailAuthSuccess} onError={handleEmailAuthError} />
        </div>
      </div>
    </div>
  );
}

