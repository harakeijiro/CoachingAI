/**
 * チャット機能カスタムフック
 * - メッセージ送信・受信管理
 * - Gemini APIとのストリーミング通信
 * - センテンス単位での自動TTS再生
 * - 音声認識とTTSの制御
 */
"use client";

import { useState } from "react";
import type { Memory } from "@/lib/types/memory";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface UseChatProps {
  stopRecognition: () => void;
  cancelSpeaking: () => void;
  speak: (text: string) => void;
  supportsTTS: boolean;
  restartRecognition: (delay: number, context: string) => void;
  memories?: Memory[]; // セッション開始時に取得したメモリ（ステップ3: 追加）
}

export const useChat = ({
  stopRecognition,
  cancelSpeaking,
  speak,
  supportsTTS,
  restartRecognition,
  memories = [], // デフォルトは空配列（ステップ3: 追加）
}: UseChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string, isAutoSubmit: boolean = false) => {
    if (!text.trim() || isLoading) return;

    // 音声認識を停止
    stopRecognition();
    cancelSpeaking();

    // 入力テキストの前処理
    const finalText = isAutoSubmit ? text : text.replace(/（話し中….*）$/u, "");
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: finalText,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          memories: memories, // メモリをリクエストに含める（ステップ3: 追加）
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`API Error (${response.status}):`, errText);
        throw new Error(
          `Failed to fetch (${response.status}): ${errText || "no body"}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      let updateScheduled = false;
      const scheduleUpdate = () => {
        if (!updateScheduled) {
          updateScheduled = true;
          requestAnimationFrame(() => {
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { ...assistantMessage };
              return newMessages;
            });
            updateScheduled = false;
          });
        }
      };

      let lastSpokenIndex = 0;
      const sentenceEndPattern = /[。！？\n]/;
      const checkAndSpeak = () => {
        if (!supportsTTS) return;
        const content = assistantMessage.content;
        for (let i = lastSpokenIndex; i < content.length; i++) {
          if (sentenceEndPattern.test(content[i])) {
            const textToSpeak = content.slice(lastSpokenIndex, i + 1).trim();
            if (textToSpeak) {
              speak(textToSpeak);
              lastSpokenIndex = i + 1;
            }
            break;
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const jsonStr = line.substring(2);
              const data = JSON.parse(jsonStr);
              if (data && typeof data === "string") {
                assistantMessage.content += data;
                scheduleUpdate();
                checkAndSpeak();
              }
            } catch {}
          }
        }
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { ...assistantMessage };
        return newMessages;
      });
      
      if (supportsTTS && lastSpokenIndex < assistantMessage.content.length) {
        const remainingText = assistantMessage.content
          .slice(lastSpokenIndex)
          .trim();
        if (remainingText) speak(remainingText);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "エラーが発生しました。もう一度お試しください。",
        },
      ]);
    } finally {
      setIsLoading(false);
      restartRecognition(1000, "after response");
    }
  };

  const handleAutoSubmit = async (text: string) => {
    await sendMessage(text, true);
  };

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    handleAutoSubmit,
  };
};
