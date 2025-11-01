/**
 * メモリ（記憶）関連の型定義
 */

export type MemoryType =
  | "goal" // 目標や意図
  | "behavior_pattern" // 行動パターン
  | "affect_trend" // 感情の傾向
  | "advice_history" // アドバイス履歴
  | "personal_info"; // 身の回りの情報（名前、年齢、家族構成など）

export type Memory = {
  memory_id: string;
  user_id: string;
  character_id: string | null;
  memory_type: MemoryType;
  topic: string; // トピック（例：「名前」「年齢」「家族構成」「転職の目標」など）
  content: string; // 内容（例：「田中太郎」「30歳」「両親と同居」など）
  confidence: number | null; // 信頼度（0.0〜1.0）
  source_summary_id: string | null; // セッション要約ID（抽出元）
  expires_at: string | null; // 有効期限
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateMemoryRequest = {
  memory_type: MemoryType;
  topic: string;
  content: string;
  character_id?: string | null;
  confidence?: number;
  source_summary_id?: string | null;
  expires_at?: string | null;
};

export type UpdateMemoryRequest = {
  topic?: string;
  content?: string;
  confidence?: number;
  expires_at?: string | null;
};

export type MemoryResponse = {
  success: boolean;
  message: string;
  data?: Memory | Memory[];
  error?: string;
};

/**
 * LLMから抽出されるメモリ情報の型
 * 会話から重要情報を抽出する際に使用
 */
export type ExtractedMemory = {
  memory_type: MemoryType;
  topic: string;
  content: string;
  confidence: number;
  reason?: string; // 抽出理由（デバッグ用）
};

