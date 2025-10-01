-- characters テーブルの作成
-- AIコンパニオンのキャラクター情報を格納

CREATE TABLE IF NOT EXISTS public.characters (
  character_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  character_name VARCHAR(255) NOT NULL,
  personality_type VARCHAR(50) NOT NULL,
  model_path VARCHAR(255) NOT NULL,
  display_size INT NOT NULL DEFAULT 100,
  volume INT NOT NULL DEFAULT 50,
  response_speed INT NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のキャラクターのみ参照可能
CREATE POLICY "Users can view their own characters"
  ON public.characters
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のキャラクターのみ作成可能
CREATE POLICY "Users can create their own characters"
  ON public.characters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のキャラクターのみ更新可能
CREATE POLICY "Users can update their own characters"
  ON public.characters
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のキャラクターのみ削除可能
CREATE POLICY "Users can delete their own characters"
  ON public.characters
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 自動更新のトリガー
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_character_id ON public.characters(character_id);
