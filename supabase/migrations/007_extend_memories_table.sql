-- memoriesテーブルの拡張
-- DB設計書に合わせて user_id, memory_type, confidence, source_summary_id, expires_at を追加
-- personal_info（身の回りの情報）もmemory_typeに追加

-- 既存のmemoriesテーブルに新しいカラムを追加
-- 注意: profilesテーブルは未実装のため、auth.usersを参照するか、
-- 将来的にprofilesテーブルが作成されたらその時点で変更する
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS memory_type TEXT,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC,
  -- session_summariesテーブルが存在しない場合は後で追加
  -- ADD COLUMN IF NOT EXISTS source_summary_id UUID REFERENCES public.session_summaries(summary_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- character_idをNOT NULLからNULL可能に変更（user_idで直接参照できるようにするため）
ALTER TABLE public.memories
  ALTER COLUMN character_id DROP NOT NULL;

-- memory_typeに制約を追加（personal_infoを追加）
ALTER TABLE public.memories
  DROP CONSTRAINT IF EXISTS memories_memory_type_check;

ALTER TABLE public.memories
  ADD CONSTRAINT memories_memory_type_check 
  CHECK (memory_type IN ('goal', 'behavior_pattern', 'affect_trend', 'advice_history', 'personal_info'));

-- memory_typeが既存データの場合、NOT NULLに設定
-- 新規データは必ずmemory_typeが必要
UPDATE public.memories 
SET memory_type = 'advice_history' 
WHERE memory_type IS NULL;

ALTER TABLE public.memories
  ALTER COLUMN memory_type SET NOT NULL;

-- user_idを既存データに設定（character_idから取得）
UPDATE public.memories m
SET user_id = c.user_id
FROM public.characters c
WHERE m.character_id = c.character_id
AND m.user_id IS NULL;

-- user_idがNULLの場合は、character_idから取得できない場合があるため注意
-- 既存データでuser_idがNULLの場合は、character_idがNULLの場合のみ許可
-- 新規データはuser_idまたはcharacter_idのいずれかが必要

-- RLSポリシーの更新（user_idベースにも対応）
DROP POLICY IF EXISTS "Users can view memories of their own characters" ON public.memories;
DROP POLICY IF EXISTS "Users can create memories for their own characters" ON public.memories;
DROP POLICY IF EXISTS "Users can update memories of their own characters" ON public.memories;
DROP POLICY IF EXISTS "Users can delete memories of their own characters" ON public.memories;

-- user_idベースのポリシーを追加
CREATE POLICY "Users can view their own memories"
  ON public.memories
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = memories.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own memories"
  ON public.memories
  FOR INSERT
  WITH CHECK (
    (user_id = auth.uid() AND user_id IS NOT NULL) OR
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = memories.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own memories"
  ON public.memories
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = memories.character_id
      AND characters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    (user_id = auth.uid() AND user_id IS NOT NULL) OR
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = memories.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own memories"
  ON public.memories
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = memories.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_memory_type ON public.memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_memories_expires_at ON public.memories(expires_at);
CREATE INDEX IF NOT EXISTS idx_memories_user_type ON public.memories(user_id, memory_type);

-- updated_at トリガー関数が存在しない場合は作成
-- 注意: 001_create_users_table.sqlで既に作成されている場合はスキップされる
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

