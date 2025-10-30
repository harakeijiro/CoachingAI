"use client";

/**
 * セッション管理ユーティリティ
 * Whisper導入用のセッションID管理
 */

export const getOrCreateSessionId = (): string => {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem("whisper_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem("whisper_session_id", sessionId);
  }
  return sessionId;
};

export const clearSessionId = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("whisper_session_id");
};

