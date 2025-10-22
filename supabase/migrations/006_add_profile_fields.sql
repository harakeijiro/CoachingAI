-- ============================================
-- CoachingAI データベースマイグレーション
-- users テーブルに selected_character_id と default_theme フィールドを追加
-- ============================================

-- users テーブルに新しいフィールドを追加
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS selected_character_id UUID REFERENCES public.characters(character_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS default_theme TEXT CHECK (default_theme IN ('mental', 'love', 'career'));

-- characters テーブルに theme フィールドを追加（既存の personality_type を拡張）
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS theme TEXT CHECK (theme IN ('mental', 'love', 'career')),
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS popularity INTEGER DEFAULT 0;

-- 既存の personality_type を theme にマッピング（既存データの移行）
UPDATE public.characters 
SET theme = CASE 
  WHEN personality_type = 'mental' THEN 'mental'
  WHEN personality_type = 'love' THEN 'love' 
  WHEN personality_type = 'career' THEN 'career'
  ELSE 'mental' -- デフォルト値
END
WHERE theme IS NULL;

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_users_selected_character ON public.users(selected_character_id);
CREATE INDEX IF NOT EXISTS idx_users_default_theme ON public.users(default_theme);
CREATE INDEX IF NOT EXISTS idx_characters_theme ON public.characters(theme);
CREATE INDEX IF NOT EXISTS idx_characters_popularity ON public.characters(popularity DESC);

-- RLS ポリシーの更新（新しいフィールドも含める）
-- users テーブルのポリシーは既存のものを使用（user_id ベース）

-- characters テーブルのポリシーも既存のものを使用（user_id ベース）

-- コメントの追加
COMMENT ON COLUMN public.users.selected_character_id IS 'ユーザーが選択したキャラクターのID（nullの場合は初回ユーザー）';
COMMENT ON COLUMN public.users.default_theme IS 'ユーザーのデフォルトテーマ（mental, love, career）';
COMMENT ON COLUMN public.characters.theme IS 'キャラクターのテーマ分類（mental, love, career）';
COMMENT ON COLUMN public.characters.thumbnail_url IS 'キャラクターのサムネイル画像URL';
COMMENT ON COLUMN public.characters.popularity IS 'キャラクターの人気度（並び順に使用）';
