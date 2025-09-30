-- memories テーブルの作成
-- キャラクターがユーザーに関する重要な情報を記憶

CREATE TABLE IF NOT EXISTS public.memories (
  memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(character_id) ON DELETE CASCADE,
  topic VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のキャラクターの記憶のみ参照可能
CREATE POLICY "Users can view memories of their own characters"
  ON public.memories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = memories.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ユーザーは自分のキャラクターの記憶のみ作成可能
CREATE POLICY "Users can create memories for their own characters"
  ON public.memories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = memories.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ユーザーは自分のキャラクターの記憶のみ更新可能
CREATE POLICY "Users can update memories of their own characters"
  ON public.memories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = memories.character_id
      AND characters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = memories.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ユーザーは自分のキャラクターの記憶のみ削除可能
CREATE POLICY "Users can delete memories of their own characters"
  ON public.memories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.character_id = memories.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- updated_at 自動更新のトリガー
CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_memories_character_id ON public.memories(character_id);
CREATE INDEX IF NOT EXISTS idx_memories_topic ON public.memories(topic);
CREATE INDEX IF NOT EXISTS idx_memories_character_topic ON public.memories(character_id, topic);
