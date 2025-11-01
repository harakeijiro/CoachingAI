-- deleted_atカラムが存在しない場合に追加
-- 007_extend_memories_table.sqlで追加されなかった場合の補完用

ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

