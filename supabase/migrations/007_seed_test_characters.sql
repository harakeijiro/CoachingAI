-- ============================================
-- CoachingAI テスト用キャラクターデータ
-- 各テーマ用のサンプルキャラクターを作成
-- ============================================

-- テスト用ユーザーID（実際のユーザーIDに置き換える必要があります）
-- このスクリプトは開発環境でのテスト用です

-- メンタル・自己理解テーマのキャラクター
INSERT INTO public.characters (
  character_id,
  user_id,
  character_name,
  personality_type,
  theme,
  thumbnail_url,
  popularity,
  model_path,
  display_size,
  volume,
  response_speed,
  created_at,
  updated_at
) VALUES 
-- 注意: user_id は実際の認証されたユーザーのIDに置き換える必要があります
-- 以下の例では '00000000-0000-0000-0000-000000000000' をプレースホルダーとして使用
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- 実際のユーザーIDに置き換え
  '心のサポーター あい',
  'mental',
  'mental',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  100,
  '/models/ai_mental.glb',
  100,
  50,
  50,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- 実際のユーザーIDに置き換え
  '癒しのコーチ ゆう',
  'mental',
  'mental',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  90,
  '/models/ai_mental2.glb',
  100,
  50,
  50,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- 実際のユーザーIDに置き換え
  '自己理解のガイド みく',
  'mental',
  'mental',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  80,
  '/models/ai_mental3.glb',
  100,
  50,
  50,
  NOW(),
  NOW()
),

-- 恋愛・人間関係テーマのキャラクター
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- 実際のユーザーIDに置き換え
  '恋愛アドバイザー れん',
  'love',
  'love',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  95,
  '/models/ai_love.glb',
  100,
  50,
  50,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- 実際のユーザーIDに置き換え
  '人間関係の専門家 なな',
  'love',
  'love',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  85,
  '/models/ai_love2.glb',
  100,
  50,
  50,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- 実際のユーザーIDに置き換え
  'コミュニケーションコーチ こう',
  'love',
  'love',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
  75,
  '/models/ai_love3.glb',
  100,
  50,
  50,
  NOW(),
  NOW()
),

-- キャリア・目標達成テーマのキャラクター
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- 実際のユーザーIDに置き換え
  'キャリアコンサルタント けい',
  'career',
  'career',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  100,
  '/models/ai_career.glb',
  100,
  50,
  50,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- 実際のユーザーIDに置き換え
  '目標達成のメンター めい',
  'career',
  'career',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  90,
  '/models/ai_career2.glb',
  100,
  50,
  50,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- 実際のユーザーIDに置き換え
  'ビジネスコーチ びじ',
  'career',
  'career',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  80,
  '/models/ai_career3.glb',
  100,
  50,
  50,
  NOW(),
  NOW()
);

-- 注意事項:
-- 1. 実際の運用では、'00000000-0000-0000-0000-000000000000' を実際のユーザーIDに置き換えてください
-- 2. thumbnail_url の画像URLは実際にアクセス可能なものに変更してください
-- 3. model_path は実際の3Dモデルファイルのパスに変更してください
-- 4. このスクリプトは開発・テスト環境での使用を想定しています
