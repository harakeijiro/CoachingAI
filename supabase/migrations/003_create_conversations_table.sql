-- conversations テーブルの作成
-- ユーザーとキャラクター間の対話ログを格納

CREATE TABLE IF NOT EXISTS public.conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(character_id) ON DELETE CASCADE,
  user_input TEXT NOT NULL,
  character_response TEXT NOT NULL,
  user_emotion VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のキャラクターの会話ログのみ参照可能
CREATE POLICY "Users can view conversations of their own characters"
  ON public.conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = conversations.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ユーザーは自分のキャラクターの会話ログのみ作成可能
CREATE POLICY "Users can create conversations for their own characters"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = conversations.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ユーザーは自分のキャラクターの会話ログのみ更新可能
CREATE POLICY "Users can update conversations of their own characters"
  ON public.conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = conversations.character_id
      AND characters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = conversations.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ユーザーは自分のキャラクターの会話ログのみ削除可能
CREATE POLICY "Users can delete conversations of their own characters"
  ON public.conversations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = conversations.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_conversations_character_id ON public.conversations(character_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON public.conversations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_character_timestamp ON public.conversations(character_id, timestamp DESC);
