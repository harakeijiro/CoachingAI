-- source_summary_idカラムを追加
-- session_summariesテーブルが存在しないため、外部キー制約なしで追加
-- 将来的にsession_summariesテーブルが作成されたら、外部キー制約を追加する

ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS source_summary_id UUID;

-- 注意: 将来的にsession_summariesテーブルが作成されたら、
-- 以下のように外部キー制約を追加する:
-- ALTER TABLE public.memories
--   ADD CONSTRAINT memories_source_summary_id_fkey
--   FOREIGN KEY (source_summary_id)
--   REFERENCES public.session_summaries(summary_id)
--   ON DELETE SET NULL;

